"""CLI tool for managing trial accounts."""
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from trials import TrialManager


def main():
    """CLI for managing trials."""
    manager = TrialManager()
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m trials create <email> <company> [days]")
        print("  python -m trials list")
        print("  python -m trials show <email>")
        print("  python -m trials convert <email>")
        return
    
    command = sys.argv[1]
    
    if command == "create":
        if len(sys.argv) < 4:
            print("Usage: python -m trials create <email> <company> [days]")
            return
        
        email = sys.argv[2]
        company = sys.argv[3]
        days = int(sys.argv[4]) if len(sys.argv) > 4 else 14
        
        account = manager.create_trial(email, company, days)
        print(f"\n✅ Trial account created!")
        print(f"Email: {account.email}")
        print(f"Company: {account.company}")
        print(f"API Key: {account.api_key}")
        print(f"Expires: {account.expires_at.strftime('%Y-%m-%d')}")
        print(f"\nSend this to the customer:")
        print(f"---")
        print(f"Your API Key: {account.api_key}")
        print(f"Gateway URL: https://your-gateway.railway.app")
        print(f"Trial expires: {account.expires_at.strftime('%Y-%m-%d')}")
        print(f"---")
    
    elif command == "list":
        accounts = manager.list_all()
        if not accounts:
            print("No trial accounts found.")
            return
        
        print(f"\n{'Email':<30} {'Company':<20} {'Status':<10} {'Expires':<12} {'Usage':<8}")
        print("-" * 90)
        for acc in accounts:
            expires_str = acc.expires_at.strftime('%Y-%m-%d')
            print(f"{acc.email:<30} {acc.company:<20} {acc.status:<10} {expires_str:<12} {acc.usage_count:<8}")
    
    elif command == "show":
        if len(sys.argv) < 3:
            print("Usage: python -m trials show <email>")
            return
        
        email = sys.argv[2]
        account = manager.get_account_by_email(email)
        if not account:
            print(f"No account found for {email}")
            return
        
        print(f"\nAccount Details:")
        print(f"Email: {account.email}")
        print(f"Company: {account.company}")
        print(f"API Key: {account.api_key}")
        print(f"Status: {account.status}")
        print(f"Created: {account.created_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"Expires: {account.expires_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"Usage Count: {account.usage_count}")
        if account.notes:
            print(f"Notes: {account.notes}")
    
    elif command == "convert":
        if len(sys.argv) < 3:
            print("Usage: python -m trials convert <email>")
            return
        
        email = sys.argv[2]
        manager.convert_to_paid(email)
        print(f"✅ {email} converted to paid")
    
    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    main()

