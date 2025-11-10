"""JWT token utilities for authentication."""
import os
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any


class JWTManager:
    """Manages JWT token generation and validation."""
    
    def __init__(self):
        # Get secret from environment or use default (change in production!)
        self.secret = os.getenv("JWT_SECRET", "change-this-secret-key-in-production")
        self.algorithm = "HS256"
        self.access_token_expiry = timedelta(hours=24)  # 24 hours
        self.refresh_token_expiry = timedelta(days=7)  # 7 days
    
    def generate_access_token(self, user_id: str, email: str) -> str:
        """
        Generate JWT access token.
        
        Args:
            user_id: User ID
            email: User email
        
        Returns:
            JWT token string
        """
        payload = {
            "user_id": user_id,
            "email": email,
            "type": "access",
            "exp": datetime.utcnow() + self.access_token_expiry,
            "iat": datetime.utcnow()
        }
        
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)
    
    def generate_refresh_token(self, user_id: str) -> str:
        """
        Generate JWT refresh token.
        
        Args:
            user_id: User ID
        
        Returns:
            JWT refresh token string
        """
        payload = {
            "user_id": user_id,
            "type": "refresh",
            "exp": datetime.utcnow() + self.refresh_token_expiry,
            "iat": datetime.utcnow()
        }
        
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode JWT token.
        
        Args:
            token: JWT token string
        
        Returns:
            Decoded payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def get_user_from_token(self, token: str) -> Optional[Dict[str, str]]:
        """
        Extract user info from token.
        
        Args:
            token: JWT token
        
        Returns:
            Dict with user_id and email, or None if invalid
        """
        payload = self.verify_token(token)
        if not payload:
            return None
        
        if payload.get("type") != "access":
            return None
        
        return {
            "user_id": payload.get("user_id"),
            "email": payload.get("email")
        }


# Global instance
jwt_manager = JWTManager()

