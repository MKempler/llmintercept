"""Webhook system for notifying external systems of violations."""
import os
import asyncio
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import hashlib


class WebhookConfig:
    """Configuration for a webhook endpoint."""
    
    def __init__(
        self,
        url: str,
        events: List[str],
        secret: Optional[str] = None,
        retry_count: int = 3,
        timeout: float = 5.0,
        enabled: bool = True
    ):
        self.url = url
        self.events = events  # ["violation", "blocked", "policy_change"]
        self.secret = secret
        self.retry_count = retry_count
        self.timeout = timeout
        self.enabled = enabled
        self.id = hashlib.sha256(url.encode()).hexdigest()[:8]


class WebhookManager:
    """Manages webhook delivery with retry logic."""
    
    def __init__(self):
        self.webhooks: List[WebhookConfig] = []
        self._load_webhooks_from_env()
    
    def _load_webhooks_from_env(self):
        """Load webhook configurations from environment variables."""
        # Format: WEBHOOK_URLS=url1,url2|WEBHOOK_EVENTS=violation,blocked|WEBHOOK_SECRET=secret
        webhook_urls = os.getenv("WEBHOOK_URLS", "").split(",")
        webhook_events = os.getenv("WEBHOOK_EVENTS", "violation,blocked").split(",")
        webhook_secret = os.getenv("WEBHOOK_SECRET")
        
        for url in webhook_urls:
            url = url.strip()
            if url:
                self.webhooks.append(WebhookConfig(
                    url=url,
                    events=[e.strip() for e in webhook_events],
                    secret=webhook_secret
                ))
    
    def add_webhook(self, config: WebhookConfig):
        """Add a webhook configuration."""
        self.webhooks.append(config)
    
    def remove_webhook(self, webhook_id: str):
        """Remove a webhook configuration."""
        self.webhooks = [w for w in self.webhooks if w.id != webhook_id]
    
    async def send_webhook(
        self,
        event: str,
        payload: Dict[str, Any],
        webhook_config: Optional[WebhookConfig] = None
    ):
        """
        Send webhook notification with retry logic.
        
        Args:
            event: Event type (violation, blocked, policy_change)
            payload: Payload to send
            webhook_config: Specific webhook config (or None for all matching)
        """
        webhooks_to_notify = [webhook_config] if webhook_config else [
            w for w in self.webhooks
            if w.enabled and event in w.events
        ]
        
        for webhook in webhooks_to_notify:
            await self._send_with_retry(webhook, event, payload)
    
    async def _send_with_retry(
        self,
        webhook: WebhookConfig,
        event: str,
        payload: Dict[str, Any]
    ):
        """Send webhook with retry logic."""
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Event": event,
            "X-Webhook-Timestamp": datetime.utcnow().isoformat()
        }
        
        # Add signature if secret provided
        if webhook.secret:
            import hmac
            signature = hmac.new(
                webhook.secret.encode(),
                json.dumps(payload, sort_keys=True).encode(),
                hashlib.sha256
            ).hexdigest()
            headers["X-Webhook-Signature"] = f"sha256={signature}"
        
        for attempt in range(webhook.retry_count):
            try:
                async with httpx.AsyncClient(timeout=webhook.timeout) as client:
                    response = await client.post(
                        webhook.url,
                        json=payload,
                        headers=headers
                    )
                    response.raise_for_status()
                    return  # Success
            except Exception as e:
                if attempt == webhook.retry_count - 1:
                    # Last attempt failed - log error
                    import logging
                    logging.error(f"Webhook delivery failed after {webhook.retry_count} attempts: {e}")
                else:
                    # Wait before retry (exponential backoff)
                    await asyncio.sleep(2 ** attempt)
    
    def get_webhooks(self) -> List[Dict[str, Any]]:
        """Get all webhook configurations."""
        return [
            {
                "id": w.id,
                "url": w.url,
                "events": w.events,
                "retry_count": w.retry_count,
                "timeout": w.timeout,
                "enabled": w.enabled
            }
            for w in self.webhooks
        ]


def create_webhook_manager() -> WebhookManager:
    """Create webhook manager instance."""
    return WebhookManager()

