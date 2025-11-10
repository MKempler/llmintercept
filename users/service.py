"""User management service."""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from users import User, PasswordResetToken
import secrets


class UserService:
    """Service for user management operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create_user(
        self,
        email: str,
        password: str,
        company: Optional[str] = None,
        generate_api_key: bool = True
    ) -> User:
        """
        Create a new user account.
        
        Args:
            email: User email address
            password: Plain text password (will be hashed)
            company: Company name (optional)
            generate_api_key: Whether to generate API key automatically
        
        Returns:
            Created User object
        
        Raises:
            ValueError: If email already exists
        """
        # Check if user already exists
        existing = self.session.query(User).filter(User.email == email).first()
        if existing:
            raise ValueError(f"User with email {email} already exists")
        
        # Create user
        user = User(
            email=email,
            company=company,
            status="active",
            email_verified=False  # Manual accounts don't need email verification
        )
        
        # Set password
        user.set_password(password)
        
        # Generate API key
        if generate_api_key:
            user.generate_api_key()
        
        # Save to database
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        
        return user
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.session.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return self.session.query(User).filter(User.id == user_id).first()
    
    def get_user_by_api_key(self, api_key: str) -> Optional[User]:
        """Get user by API key."""
        return self.session.query(User).filter(User.api_key == api_key).first()
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate user with email and password.
        
        Args:
            email: User email
            password: Plain text password
        
        Returns:
            User object if authenticated, None otherwise
        """
        user = self.get_user_by_email(email)
        if not user:
            return None
        
        if user.status != "active":
            return None
        
        if not user.check_password(password):
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        self.session.commit()
        
        return user
    
    def reset_password(self, user_id: str, new_password: str):
        """Reset user password."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        user.set_password(new_password)
        self.session.commit()
    
    def regenerate_api_key(self, user_id: str) -> str:
        """Regenerate API key for user."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        new_key = user.generate_api_key()
        self.session.commit()
        return new_key
    
    def create_password_reset_token(self, email: str) -> Optional[str]:
        """
        Create password reset token for user.
        
        Args:
            email: User email
        
        Returns:
            Reset token if user exists, None otherwise
        """
        user = self.get_user_by_email(email)
        if not user:
            # Don't reveal if user exists (security best practice)
            return None
        
        # Invalidate existing tokens
        self.session.query(PasswordResetToken).filter(
            and_(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used == False
            )
        ).update({"used": True})
        
        # Create new token
        token = PasswordResetToken.generate_token()
        expires_at = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
        
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        
        self.session.add(reset_token)
        self.session.commit()
        
        return token
    
    def verify_reset_token(self, token: str) -> Optional[User]:
        """
        Verify password reset token and return user.
        
        Args:
            token: Reset token
        
        Returns:
            User if token is valid, None otherwise
        """
        reset_token = self.session.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).first()
        
        if not reset_token:
            return None
        
        if not reset_token.is_valid():
            return None
        
        user = self.get_user_by_id(reset_token.user_id)
        return user
    
    def use_reset_token(self, token: str, new_password: str) -> bool:
        """
        Use reset token to change password.
        
        Args:
            token: Reset token
            new_password: New password
        
        Returns:
            True if successful, False otherwise
        """
        reset_token = self.session.query(PasswordResetToken).filter(
            PasswordResetToken.token == token
        ).first()
        
        if not reset_token or not reset_token.is_valid():
            return False
        
        user = self.get_user_by_id(reset_token.user_id)
        if not user:
            return False
        
        # Reset password
        user.set_password(new_password)
        
        # Mark token as used
        reset_token.used = True
        
        self.session.commit()
        return True
    
    def list_users(self, limit: int = 100, offset: int = 0) -> list[User]:
        """List all users."""
        return self.session.query(User).order_by(
            User.created_at.desc()
        ).limit(limit).offset(offset).all()
    
    def update_user_status(self, user_id: str, status: str):
        """Update user status."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        user.status = status
        self.session.commit()

