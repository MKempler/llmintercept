"""Rate limiting middleware for API protection."""
from typing import Optional
from collections import defaultdict
from time import time
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import os


class RateLimiter:
    """Simple in-memory rate limiter for per-IP and per-API-key limiting."""
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        requests_per_minute_per_key: int = 300,
        requests_per_hour_per_key: int = 10000
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.requests_per_minute_per_key = requests_per_minute_per_key
        self.requests_per_hour_per_key = requests_per_hour_per_key
        
        # In-memory storage: {identifier: [(timestamp, ...)]}
        self.ip_requests: dict[str, list[float]] = defaultdict(list)
        self.api_key_requests: dict[str, list[float]] = defaultdict(list)
        
        # Cleanup old entries periodically
        self._last_cleanup = time()
        self._cleanup_interval = 300  # 5 minutes
    
    def _cleanup_old_entries(self):
        """Remove entries older than 1 hour."""
        current_time = time()
        if current_time - self._last_cleanup < self._cleanup_interval:
            return
        
        cutoff_minute = current_time - 60
        cutoff_hour = current_time - 3600
        
        # Clean IP requests
        for ip in list(self.ip_requests.keys()):
            self.ip_requests[ip] = [
                ts for ts in self.ip_requests[ip] if ts > cutoff_hour
            ]
            if not self.ip_requests[ip]:
                del self.ip_requests[ip]
        
        # Clean API key requests
        for key in list(self.api_key_requests.keys()):
            self.api_key_requests[key] = [
                ts for ts in self.api_key_requests[key] if ts > cutoff_hour
            ]
            if not self.api_key_requests[key]:
                del self.api_key_requests[key]
        
        self._last_cleanup = current_time
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded IP (from proxy/load balancer)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _extract_api_key(self, request: Request) -> Optional[str]:
        """Extract API key from request headers."""
        # Check Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header:
            # Support both "Bearer <key>" and "ApiKey <key>" formats
            parts = auth_header.split(" ", 1)
            if len(parts) == 2:
                scheme, key = parts
                if scheme.lower() in ["bearer", "apikey"]:
                    return key
        
        # Check X-API-Key header
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return api_key
        
        return None
    
    def check_rate_limit(self, request: Request) -> tuple[bool, Optional[str]]:
        """
        Check if request should be rate limited.
        
        Returns:
            (is_allowed, error_message)
        """
        self._cleanup_old_entries()
        
        current_time = time()
        client_ip = self._get_client_ip(request)
        api_key = self._extract_api_key(request)
        
        # Check IP-based rate limiting
        ip_minute_ago = current_time - 60
        ip_hour_ago = current_time - 3600
        
        ip_recent = [ts for ts in self.ip_requests[client_ip] if ts > ip_minute_ago]
        ip_hourly = [ts for ts in self.ip_requests[client_ip] if ts > ip_hour_ago]
        
        if len(ip_recent) >= self.requests_per_minute:
            return False, f"Rate limit exceeded: {self.requests_per_minute} requests per minute per IP"
        
        if len(ip_hourly) >= self.requests_per_hour:
            return False, f"Rate limit exceeded: {self.requests_per_hour} requests per hour per IP"
        
        # Check API key-based rate limiting (if API key provided)
        if api_key:
            key_minute_ago = current_time - 60
            key_hour_ago = current_time - 3600
            
            key_recent = [ts for ts in self.api_key_requests[api_key] if ts > key_minute_ago]
            key_hourly = [ts for ts in self.api_key_requests[api_key] if ts > key_hour_ago]
            
            if len(key_recent) >= self.requests_per_minute_per_key:
                return False, f"Rate limit exceeded: {self.requests_per_minute_per_key} requests per minute per API key"
            
            if len(key_hourly) >= self.requests_per_hour_per_key:
                return False, f"Rate limit exceeded: {self.requests_per_hour_per_key} requests per hour per API key"
            
            # Record API key request
            self.api_key_requests[api_key].append(current_time)
        
        # Record IP request
        self.ip_requests[client_ip].append(current_time)
        
        return True, None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting."""
    
    def __init__(self, app, rate_limiter: RateLimiter):
        super().__init__(app)
        self.rate_limiter = rate_limiter
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and OPTIONS requests
        if request.url.path in ["/health", "/api/demo-mode"] or request.method == "OPTIONS":
            return await call_next(request)
        
        # Check rate limit
        is_allowed, error_message = self.rate_limiter.check_rate_limit(request)
        
        if not is_allowed:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "message": error_message,
                        "type": "rate_limit_error",
                        "code": "rate_limit_exceeded"
                    }
                }
            )
        
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit-Minute"] = str(self.rate_limiter.requests_per_minute)
        response.headers["X-RateLimit-Limit-Hour"] = str(self.rate_limiter.requests_per_hour)
        
        return response


def create_rate_limiter() -> RateLimiter:
    """Create rate limiter with configurable limits from environment variables."""
    return RateLimiter(
        requests_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", "60")),
        requests_per_hour=int(os.getenv("RATE_LIMIT_PER_HOUR", "1000")),
        requests_per_minute_per_key=int(os.getenv("RATE_LIMIT_PER_MINUTE_PER_KEY", "300")),
        requests_per_hour_per_key=int(os.getenv("RATE_LIMIT_PER_HOUR_PER_KEY", "10000"))
    )

