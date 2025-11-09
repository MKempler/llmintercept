"""Simple trial account management system."""
import secrets
import string
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
import json
import os


@dataclass
class TrialAccount:
    """Represents a trial account."""
    email: str
    company: str
    api_key: str
    created_at: datetime
    expires_at: datetime
    status: str  # "active", "expired", "converted"
    usage_count: int = 0
    notes: Optional[str] = None


class TrialManager:
    """Manages trial accounts."""
    
    def __init__(self, storage_file: str = "trials.json"):
        self.storage_file = storage_file
        self.accounts: Dict[str, TrialAccount] = {}
        self._load()
    
    def _load(self):
        """Load accounts from file."""
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    for email, acc_data in data.items():
                        acc_data['created_at'] = datetime.fromisoformat(acc_data['created_at'])
                        acc_data['expires_at'] = datetime.fromisoformat(acc_data['expires_at'])
                        self.accounts[email] = TrialAccount(**acc_data)
            except Exception as e:
                print(f"Error loading trials: {e}")
                self.accounts = {}
    
    def _save(self):
        """Save accounts to file."""
        data = {}
        for email, account in self.accounts.items():
            acc_dict = asdict(account)
            acc_dict['created_at'] = account.created_at.isoformat()
            acc_dict['expires_at'] = account.expires_at.isoformat()
            data[email] = acc_dict
        
        with open(self.storage_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def generate_api_key(self) -> str:
        """Generate a unique API key for firewall access."""
        # Format: fw_live_<random>
        random_part = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
        return f"fw_live_{random_part}"
    
    def create_trial(self, email: str, company: str, days: int = 14, notes: Optional[str] = None) -> TrialAccount:
        """
        Create a new trial account.
        
        Args:
            email: User email
            company: Company name
            days: Trial duration in days
            notes: Optional notes
        
        Returns:
            TrialAccount object
        """
        api_key = self.generate_api_key()
        now = datetime.now()
        expires_at = now + timedelta(days=days)
        
        account = TrialAccount(
            email=email,
            company=company,
            api_key=api_key,
            created_at=now,
            expires_at=expires_at,
            status="active",
            notes=notes
        )
        
        self.accounts[email] = account
        self._save()
        return account
    
    def get_account(self, api_key: str) -> Optional[TrialAccount]:
        """Get account by API key."""
        for account in self.accounts.values():
            if account.api_key == api_key:
                return account
        return None
    
    def get_account_by_email(self, email: str) -> Optional[TrialAccount]:
        """Get account by email."""
        return self.accounts.get(email)
    
    def is_valid(self, api_key: str) -> bool:
        """Check if API key is valid and not expired."""
        account = self.get_account(api_key)
        if not account:
            return False
        
        if account.status != "active":
            return False
        
        if datetime.now() > account.expires_at:
            account.status = "expired"
            self._save()
            return False
        
        return True
    
    def increment_usage(self, api_key: str):
        """Increment usage count for account."""
        account = self.get_account(api_key)
        if account:
            account.usage_count += 1
            self._save()
    
    def convert_to_paid(self, email: str):
        """Mark account as converted to paid."""
        account = self.accounts.get(email)
        if account:
            account.status = "converted"
            self._save()
    
    def list_active_trials(self) -> list[TrialAccount]:
        """List all active trials."""
        return [acc for acc in self.accounts.values() if acc.status == "active"]
    
    def list_all(self) -> list[TrialAccount]:
        """List all accounts."""
        return list(self.accounts.values())

