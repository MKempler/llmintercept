"""Authentication middleware for API endpoints."""
from typing import Optional
from fastapi import Request, HTTPException, Header, status
from starlette.middleware.base import BaseHTTPMiddleware
import os
import hashlib
import hmac


class APIKeyAuth:
    """API key authentication handler."""
    
    def __init__(self):
        # Load valid API keys from environment
        # Format: FIREWALL_API_KEYS=key1,key2,key3 or single FIREWALL_API_KEY
        self.valid_keys = set()
        
        # Single API key
        single_key = os.getenv("FIREWALL_API_KEY")
        if single_key:
            self.valid_keys.add(single_key)
        
        # Multiple API keys (comma-separated)
        keys_env = os.getenv("FIREWALL_API_KEYS")
        if keys_env:
            for key in keys_env.split(","):
                key = key.strip()
                if key:
                    self.valid_keys.add(key)
        
        # If no keys configured, allow all (for demo/dev mode)
        self.require_auth = os.getenv("REQUIRE_API_AUTH", "false").lower() == "true"
    
    def verify_api_key(self, api_key: Optional[str]) -> bool:
        """
        Verify API key is valid.
        
        Args:
            api_key: API key to verify
        
        Returns:
            True if valid, False otherwise
        """
        if not self.require_auth:
            return True  # Auth disabled
        
        if not api_key:
            return False
        
        # Constant-time comparison to prevent timing attacks
        if not self.valid_keys:
            return False  # Auth required but no keys configured
        
        # Use constant-time comparison
        for valid_key in self.valid_keys:
            if hmac.compare_digest(api_key, valid_key):
                return True
        
        return False
    
    def extract_api_key(self, request: Request) -> Optional[str]:
        """Extract API key from request headers."""
        # Check Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header:
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


class AuthMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for API key authentication."""
    
    def __init__(self, app, auth: APIKeyAuth, public_paths: Optional[list[str]] = None):
        super().__init__(app)
        self.auth = auth
        self.public_paths = public_paths or [
            "/health",
            "/api/demo-mode",
            "/docs",
            "/openapi.json",
            "/redoc"
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for public paths and OPTIONS requests
        if request.url.path in self.public_paths or request.method == "OPTIONS":
            return await call_next(request)
        
        # Skip auth for LLM proxy endpoints (they use their own API keys)
        # Only protect admin endpoints
        if request.url.path.startswith("/v1/"):
            return await call_next(request)
        
        # Require authentication for admin endpoints
        api_key = self.auth.extract_api_key(request)
        
        if not self.auth.verify_api_key(api_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "message": "Invalid or missing API key. Provide it in Authorization header (Bearer <key>) or X-API-Key header.",
                        "type": "authentication_error",
                        "code": "invalid_api_key"
                    }
                },
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return await call_next(request)


def create_auth() -> APIKeyAuth:
    """Create authentication handler."""
    return APIKeyAuth()

