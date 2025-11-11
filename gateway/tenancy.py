"""Multi-tenancy and user context management."""
import os
from typing import Optional, Dict, Any
from fastapi import Request, Header
import jwt
import hashlib


class TenantContext:
    """Manages tenant isolation and user context."""
    
    def __init__(self):
        # Tenant ID extraction methods
        self.tenant_header = os.getenv("TENANT_ID_HEADER", "X-Tenant-ID")
        self.user_header = os.getenv("USER_ID_HEADER", "X-User-ID")
        self.app_header = os.getenv("APP_ID_HEADER", "X-App-ID")
        
        # JWT support (optional)
        self.jwt_secret = os.getenv("JWT_SECRET")
        self.jwt_tenant_claim = os.getenv("JWT_TENANT_CLAIM", "tenant_id")
        self.jwt_user_claim = os.getenv("JWT_USER_CLAIM", "user_id")
        self.jwt_app_claim = os.getenv("JWT_APP_CLAIM", "app_id")
    
    def extract_context(self, request: Request, authorization: Optional[str] = None) -> Dict[str, Optional[str]]:
        """
        Extract tenant, user, and app context from request.
        
        Args:
            request: FastAPI request object
            authorization: Authorization header value
        
        Returns:
            Dictionary with tenant_id, user_id, app_id
        """
        context = {
            "tenant_id": None,
            "user_id": None,
            "app_id": None
        }
        
        # Method 1: Extract from headers
        context["tenant_id"] = request.headers.get(self.tenant_header)
        context["user_id"] = request.headers.get(self.user_header)
        context["app_id"] = request.headers.get(self.app_header)
        
        # Method 2: Extract from JWT token (if available)
        if authorization and self.jwt_secret:
            try:
                token = authorization.replace("Bearer ", "").replace("ApiKey ", "")
                decoded = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
                
                if not context["tenant_id"]:
                    context["tenant_id"] = decoded.get(self.jwt_tenant_claim)
                if not context["user_id"]:
                    context["user_id"] = decoded.get(self.jwt_user_claim)
                if not context["app_id"]:
                    context["app_id"] = decoded.get(self.jwt_app_claim)
            except (jwt.DecodeError, jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                # JWT invalid or expired - continue with header-based extraction
                pass
        
        # Method 3: Extract from API key hash (fallback)
        if not context["tenant_id"] and authorization:
            # Use API key hash as tenant identifier (for simple setups)
            api_key = authorization.replace("Bearer ", "").replace("ApiKey ", "")
            if api_key and len(api_key) > 10:  # Only if looks like API key
                # Hash API key to create tenant ID
                context["tenant_id"] = f"tenant_{hashlib.sha256(api_key.encode()).hexdigest()[:16]}"
        
        # Method 4: Look up user_id from firewall API key (NEW)
        if not context["user_id"]:
            api_key = request.headers.get("X-API-Key")
            if api_key:
                context["user_id"] = self.get_user_id_from_api_key(api_key)
        
        # Default tenant for demo mode
        if not context["tenant_id"]:
            demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
            if demo_mode:
                context["tenant_id"] = "demo_tenant"
        
        return context
    
    def get_user_id_from_api_key(self, api_key: Optional[str]) -> Optional[str]:
        """
        Look up user_id from firewall API key.
        
        Args:
            api_key: Firewall API key (from X-API-Key header)
            
        Returns:
            user_id if found, None otherwise
        """
        if not api_key:
            return None
        
        # Import here to avoid circular imports
        from users.service import UserService
        from audit_logging import AuditLogger
        
        database_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./firewall.db")
        audit_logger = AuditLogger(database_url=database_url)
        session = audit_logger.Session()
        
        try:
            user_service = UserService(session)
            user = user_service.get_user_by_api_key(api_key)
            return user.id if user else None
        except Exception:
            return None
        finally:
            session.close()
    
    def get_tenant_namespace(self, tenant_id: Optional[str]) -> str:
        """
        Get database namespace/prefix for tenant.
        
        Args:
            tenant_id: Tenant identifier
        
        Returns:
            Namespace string for tenant isolation
        """
        if not tenant_id:
            return "default"
        
        # Sanitize tenant_id for use in database
        sanitized = "".join(c if c.isalnum() or c in "_-" else "_" for c in tenant_id)
        return f"tenant_{sanitized}"


class RBAC:
    """Role-Based Access Control for multi-tenant system."""
    
    def __init__(self):
        # Simple role definitions (can be extended)
        self.roles = {
            "admin": ["read", "write", "delete", "manage_policies", "view_logs"],
            "security_team": ["read", "write", "view_logs", "manage_policies"],
            "developer": ["read", "view_logs"],
            "viewer": ["read"]
        }
    
    def check_permission(self, user_role: Optional[str], permission: str) -> bool:
        """
        Check if user role has permission.
        
        Args:
            user_role: User's role
            permission: Permission to check
        
        Returns:
            True if user has permission
        """
        if not user_role:
            return False
        
        role_permissions = self.roles.get(user_role.lower(), [])
        return permission in role_permissions
    
    def get_user_role(self, request: Request, context: Dict[str, Optional[str]]) -> Optional[str]:
        """
        Extract user role from request.
        
        Args:
            request: FastAPI request
            context: Tenant context
        
        Returns:
            User role or None
        """
        # Check header
        role = request.headers.get("X-User-Role")
        if role:
            return role
        
        # Check JWT (if implemented)
        # Could extract from JWT token
        
        # Default role
        return "developer"


def create_tenant_context() -> TenantContext:
    """Create tenant context manager."""
    return TenantContext()

