"""User management models and database schema."""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
import uuid
import secrets
import hashlib
import bcrypt

# Import Base from audit_logging to use same database
from audit_logging import Base


class User(Base):
    """User account model."""
    __tablename__ = "users"
    
    # Use String for ID to work with both SQLite and PostgreSQL
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    api_key = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(String(50), default="active")  # active, inactive, suspended
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    def set_password(self, password: str):
        """Hash and set password."""
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def check_password(self, password: str) -> bool:
        """Verify password."""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def generate_api_key(self) -> str:
        """Generate a new API key."""
        # Generate secure random key
        random_part = secrets.token_urlsafe(32)
        api_key = f"fw_live_{random_part}"
        self.api_key = api_key
        return api_key
    
    def to_dict(self, include_sensitive: bool = False) -> dict:
        """Convert user to dictionary."""
        data = {
            "id": self.id,
            "email": self.email,
            "company": self.company,
            "status": self.status,
            "email_verified": self.email_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
        
        if include_sensitive:
            data["api_key"] = self.api_key
        
        return data


class PasswordResetToken(Base):
    """Password reset token model."""
    __tablename__ = "password_reset_tokens"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure reset token."""
        return secrets.token_urlsafe(32)
    
    def is_valid(self) -> bool:
        """Check if token is valid and not expired."""
        if self.used:
            return False
        if datetime.utcnow() > self.expires_at:
            return False
        return True

