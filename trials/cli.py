"""CLI tool for managing trial accounts and user creation."""
import sys
import os
import secrets
import string
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from trials import TrialManager
from users.service import UserService
from audit_logging import AuditLogger


def generate_password(length: int = 16) -> str:
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for i in range(length))


def main():
    """CLI for managing trials and users."""
    # Initialize database connection
    database_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./firewall.db")
    audit_logger = AuditLogger(database_url=database_url)
    session = audit_logger.Session()
    
    # Keep old trial manager for backward compatibility
    manager = TrialManager()
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m trials create <email> <company> [days] [password]")
        print("    - Creates user account in database")
        print("    - Password optional (auto-generated if not provided)")
        print("  python -m trials list")
        print("  python -m trials show <email>")
        print("  python -m trials convert <email>")
        return
    
    command = sys.argv[1]
    
    if command == "create":
        if len(sys.argv) < 4:
            print("Usage: python -m trials create <email> <company> [days] [password]")
            return
        
        email = sys.argv[2]
        company = sys.argv[3]
        days = int(sys.argv[4]) if len(sys.argv) > 4 else 14
        password = sys.argv[5] if len(sys.argv) > 5 else None
        
        try:
            user_service = UserService(session)
            
            # Generate password if not provided
            if not password:
                password = generate_password()
                auto_generated = True
            else:
                auto_generated = False
            
            # Create user in database
            user = user_service.create_user(
                email=email,
                password=password,
                company=company,
                generate_api_key=True
            )
            
            print(f"\n✅ User account created!")
            print(f"Email: {user.email}")
            print(f"Company: {user.company}")
            print(f"User ID: {user.id}")
            print(f"API Key: {user.api_key}")
            print(f"Password: {password} {'(auto-generated)' if auto_generated else ''}")
            print(f"\n📧 Send this to the customer:")
            print(f"---")
            print(f"Welcome to AI Prompt Firewall!")
            print(f"")
            print(f"Your login credentials:")
            print(f"Email: {user.email}")
            print(f"Password: {password}")
            print(f"")
            print(f"Your API Key: {user.api_key}")
            print(f"Gateway URL: https://your-gateway.railway.app")
            print(f"Dashboard: https://your-dashboard.vercel.app")
            print(f"")
            print(f"Quick Start:")
            print(f"1. Log in to dashboard")
            print(f"2. Use API key with SDK or gateway")
            print(f"3. Contact support if you need help")
            print(f"---")
            
            # Also create trial account for backward compatibility
            manager.create_trial(email, company, days)
            
        except ValueError as e:
            print(f"❌ Error: {e}")
            session.rollback()
        except Exception as e:
            print(f"❌ Error creating user: {e}")
            session.rollback()
        finally:
            session.close()
    
    elif command == "list":
        try:
            user_service = UserService(session)
            users = user_service.list_users(limit=1000)
            
            if not users:
                print("No users found.")
                return
            
            print(f"\n{'Email':<30} {'Company':<20} {'Status':<10} {'Created':<12} {'Last Login':<12}")
            print("-" * 100)
            for user in users:
                created_str = user.created_at.strftime('%Y-%m-%d') if user.created_at else 'N/A'
                last_login_str = user.last_login.strftime('%Y-%m-%d') if user.last_login else 'Never'
                print(f"{user.email:<30} {user.company or 'N/A':<20} {user.status:<10} {created_str:<12} {last_login_str:<12}")
        finally:
            session.close()
    
    elif command == "show":
        if len(sys.argv) < 3:
            print("Usage: python -m trials show <email>")
            return
        
        email = sys.argv[2]
        try:
            user_service = UserService(session)
            user = user_service.get_user_by_email(email)
            
            if not user:
                print(f"No user found for {email}")
                return
            
            print(f"\nUser Details:")
            print(f"Email: {user.email}")
            print(f"Company: {user.company or 'N/A'}")
            print(f"User ID: {user.id}")
            print(f"API Key: {user.api_key}")
            print(f"Status: {user.status}")
            print(f"Email Verified: {user.email_verified}")
            print(f"Created: {user.created_at.strftime('%Y-%m-%d %H:%M') if user.created_at else 'N/A'}")
            print(f"Last Login: {user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else 'Never'}")
        finally:
            session.close()
    
    elif command == "convert":
        if len(sys.argv) < 3:
            print("Usage: python -m trials convert <email>")
            return
        
        email = sys.argv[2]
        manager.convert_to_paid(email)
        print(f"✅ {email} marked as converted")
    
    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    main()

