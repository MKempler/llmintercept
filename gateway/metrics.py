"""Prometheus metrics for performance monitoring."""
from typing import Dict, Any, Optional
from time import time
from prometheus_client import Counter, Histogram, Gauge
import os

# Check if prometheus_client is available
try:
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False


class MetricsCollector:
    """Collects Prometheus metrics for monitoring."""
    
    def __init__(self):
        if not PROMETHEUS_AVAILABLE:
            import warnings
            warnings.warn("prometheus_client not installed. Install with: pip install prometheus-client")
            self.enabled = False
            return
        
        self.enabled = True
        
        # Request metrics
        self.requests_total = Counter(
            'firewall_requests_total',
            'Total number of requests',
            ['endpoint', 'status', 'tenant_id']
        )
        
        self.request_duration = Histogram(
            'firewall_request_duration_seconds',
            'Request duration in seconds',
            ['endpoint', 'tenant_id'],
            buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]
        )
        
        # Violation metrics
        self.violations_total = Counter(
            'firewall_violations_total',
            'Total number of violations detected',
            ['violation_type', 'severity', 'tenant_id']
        )
        
        self.blocks_total = Counter(
            'firewall_blocks_total',
            'Total number of blocked requests',
            ['violation_type', 'tenant_id']
        )
        
        # Policy metrics
        self.policy_evaluations = Counter(
            'firewall_policy_evaluations_total',
            'Total number of policy evaluations',
            ['policy_id', 'action', 'tenant_id']
        )
        
        # System metrics
        self.active_requests = Gauge(
            'firewall_active_requests',
            'Number of active requests',
            ['tenant_id']
        )
        
        self.error_rate = Counter(
            'firewall_errors_total',
            'Total number of errors',
            ['error_type', 'endpoint', 'tenant_id']
        )
    
    def record_request(
        self,
        endpoint: str,
        status: str,
        duration: float,
        tenant_id: Optional[str] = None
    ):
        """Record request metrics."""
        if not self.enabled:
            return
        
        tenant_label = tenant_id or "unknown"
        self.requests_total.labels(
            endpoint=endpoint,
            status=status,
            tenant_id=tenant_label
        ).inc()
        
        self.request_duration.labels(
            endpoint=endpoint,
            tenant_id=tenant_label
        ).observe(duration)
    
    def record_violation(
        self,
        violation_type: str,
        severity: str,
        tenant_id: Optional[str] = None
    ):
        """Record violation metrics."""
        if not self.enabled:
            return
        
        tenant_label = tenant_id or "unknown"
        self.violations_total.labels(
            violation_type=violation_type,
            severity=severity,
            tenant_id=tenant_label
        ).inc()
    
    def record_block(
        self,
        violation_type: str,
        tenant_id: Optional[str] = None
    ):
        """Record block metrics."""
        if not self.enabled:
            return
        
        tenant_label = tenant_id or "unknown"
        self.blocks_total.labels(
            violation_type=violation_type,
            tenant_id=tenant_label
        ).inc()
    
    def record_policy_evaluation(
        self,
        policy_id: str,
        action: str,
        tenant_id: Optional[str] = None
    ):
        """Record policy evaluation metrics."""
        if not self.enabled:
            return
        
        tenant_label = tenant_id or "unknown"
        self.policy_evaluations.labels(
            policy_id=policy_id,
            action=action,
            tenant_id=tenant_label
        ).inc()
    
    def record_error(
        self,
        error_type: str,
        endpoint: str,
        tenant_id: Optional[str] = None
    ):
        """Record error metrics."""
        if not self.enabled:
            return
        
        tenant_label = tenant_id or "unknown"
        self.error_rate.labels(
            error_type=error_type,
            endpoint=endpoint,
            tenant_id=tenant_label
        ).inc()
    
    def increment_active_requests(self, tenant_id: Optional[str] = None):
        """Increment active request counter."""
        if not self.enabled:
            return
        
        tenant_label = tenant_id or "unknown"
        self.active_requests.labels(tenant_id=tenant_label).inc()
    
    def decrement_active_requests(self, tenant_id: Optional[str] = None):
        """Decrement active request counter."""
        if not self.enabled:
            return
        
        tenant_label = tenant_id or "unknown"
        self.active_requests.labels(tenant_id=tenant_label).dec()


def create_metrics_collector() -> MetricsCollector:
    """Create metrics collector instance."""
    return MetricsCollector()

