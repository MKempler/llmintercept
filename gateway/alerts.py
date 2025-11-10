"""Alerting system for violations and errors."""
import os
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio


class AlertRule:
    """Configuration for an alert rule."""
    
    def __init__(
        self,
        id: str,
        name: str,
        condition: str,  # "violation_count", "error_rate", "block_rate"
        threshold: float,
        window_seconds: int = 300,  # 5 minutes
        enabled: bool = True
    ):
        self.id = id
        self.name = name
        self.condition = condition
        self.threshold = threshold
        self.window_seconds = window_seconds
        self.enabled = enabled
        self.last_triggered: Optional[datetime] = None
        self.cooldown_seconds = 3600  # Don't alert more than once per hour


class AlertChannel:
    """Alert delivery channel."""
    
    def __init__(self, channel_type: str, config: Dict[str, Any]):
        self.channel_type = channel_type  # "email", "webhook", "slack", "pagerduty"
        self.config = config
    
    async def send(self, alert: Dict[str, Any]):
        """Send alert through this channel."""
        if self.channel_type == "webhook":
            await self._send_webhook(alert)
        elif self.channel_type == "email":
            await self._send_email(alert)
        # Add more channel types as needed
    
    async def _send_webhook(self, alert: Dict[str, Any]):
        """Send alert via webhook."""
        import httpx
        webhook_url = self.config.get("url")
        if webhook_url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(webhook_url, json=alert, timeout=5.0)
            except Exception as e:
                import logging
                logging.error(f"Failed to send webhook alert: {e}")
    
    async def _send_email(self, alert: Dict[str, Any]):
        """Send alert via email (placeholder - implement with SMTP)."""
        # TODO: Implement email sending
        pass


class AlertManager:
    """Manages alerting rules and delivery."""
    
    def __init__(self):
        self.rules: List[AlertRule] = []
        self.channels: List[AlertChannel] = []
        
        # Event counters for alerting
        self.event_counts: Dict[str, List[datetime]] = defaultdict(list)
        
        # Load from environment
        self._load_from_env()
    
    def _load_from_env(self):
        """Load alert configuration from environment variables."""
        # Example: ALERT_WEBHOOK_URL=https://hooks.slack.com/...
        webhook_url = os.getenv("ALERT_WEBHOOK_URL")
        if webhook_url:
            self.channels.append(AlertChannel("webhook", {"url": webhook_url}))
        
        # Default alert rules
        self.rules.append(AlertRule(
            id="high_violation_rate",
            name="High Violation Rate",
            condition="violation_count",
            threshold=10.0,  # 10 violations per 5 minutes
            window_seconds=300
        ))
        
        self.rules.append(AlertRule(
            id="high_error_rate",
            name="High Error Rate",
            condition="error_rate",
            threshold=5.0,  # 5 errors per 5 minutes
            window_seconds=300
        ))
    
    def add_rule(self, rule: AlertRule):
        """Add an alert rule."""
        self.rules.append(rule)
    
    def add_channel(self, channel: AlertChannel):
        """Add an alert channel."""
        self.channels.append(channel)
    
    def record_event(self, event_type: str, tenant_id: Optional[str] = None):
        """
        Record an event for alerting.
        
        Args:
            event_type: Type of event (violation, error, block)
            tenant_id: Tenant identifier
        """
        key = f"{event_type}:{tenant_id or 'default'}"
        self.event_counts[key].append(datetime.utcnow())
        
        # Clean old events (older than 1 hour)
        cutoff = datetime.utcnow() - timedelta(hours=1)
        self.event_counts[key] = [
            ts for ts in self.event_counts[key] if ts > cutoff
        ]
        
        # Check alert rules
        asyncio.create_task(self._check_alerts(event_type, tenant_id))
    
    async def _check_alerts(self, event_type: str, tenant_id: Optional[str] = None):
        """Check if any alert rules should trigger."""
        for rule in self.rules:
            if not rule.enabled:
                continue
            
            # Check cooldown
            if rule.last_triggered:
                if (datetime.utcnow() - rule.last_triggered).total_seconds() < rule.cooldown_seconds:
                    continue
            
            # Count events in window
            window_start = datetime.utcnow() - timedelta(seconds=rule.window_seconds)
            key = f"{event_type}:{tenant_id or 'default'}"
            recent_events = [
                ts for ts in self.event_counts[key]
                if ts > window_start
            ]
            count = len(recent_events)
            
            # Check threshold
            if count >= rule.threshold:
                await self._trigger_alert(rule, event_type, count, tenant_id)
                rule.last_triggered = datetime.utcnow()
    
    async def _trigger_alert(
        self,
        rule: AlertRule,
        event_type: str,
        count: int,
        tenant_id: Optional[str]
    ):
        """Trigger an alert."""
        alert = {
            "alert_id": rule.id,
            "alert_name": rule.name,
            "event_type": event_type,
            "count": count,
            "threshold": rule.threshold,
            "window_seconds": rule.window_seconds,
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all channels
        for channel in self.channels:
            try:
                await channel.send(alert)
            except Exception as e:
                import logging
                logging.error(f"Failed to send alert via {channel.channel_type}: {e}")


def create_alert_manager() -> AlertManager:
    """Create alert manager instance."""
    return AlertManager()

