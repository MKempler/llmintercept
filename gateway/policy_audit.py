"""Policy change audit trail and version history."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import json
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os

Base = declarative_base()


class PolicyChangeLog(Base):
    """Database model for policy change audit log."""
    __tablename__ = "policy_change_logs"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    policy_id = Column(String, index=True)
    change_type = Column(String)  # "created", "updated", "deleted"
    changed_by = Column(String, nullable=True)  # user_id or API key identifier
    tenant_id = Column(String, nullable=True, index=True)
    old_value = Column(JSON, nullable=True)  # Previous policy state
    new_value = Column(JSON, nullable=True)  # New policy state
    change_summary = Column(Text, nullable=True)  # Human-readable summary


class PolicyAuditTrail:
    """Manages policy change audit trail."""
    
    def __init__(self, database_url: Optional[str] = None):
        if database_url is None:
            database_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./firewall.db")
        
        # Use same database as audit logger
        if "sqlite" in database_url:
            sync_url = database_url.replace("+aiosqlite", "")
            self.engine = create_engine(sync_url, pool_pre_ping=True)
        else:
            pool_size = int(os.getenv("DB_POOL_SIZE", "10"))
            max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "20"))
            self.engine = create_engine(
                database_url,
                pool_size=pool_size,
                max_overflow=max_overflow,
                pool_pre_ping=True,
                pool_recycle=3600
            )
        
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
    
    def log_change(
        self,
        policy_id: str,
        change_type: str,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        changed_by: Optional[str] = None,
        tenant_id: Optional[str] = None,
        change_summary: Optional[str] = None
    ):
        """
        Log a policy change.
        
        Args:
            policy_id: Policy identifier
            change_type: Type of change (created, updated, deleted)
            old_value: Previous policy state
            new_value: New policy state
            changed_by: User/API key that made the change
            tenant_id: Tenant identifier
            change_summary: Human-readable summary
        """
        session = self.Session()
        try:
            log_entry = PolicyChangeLog(
                timestamp=datetime.utcnow(),
                policy_id=policy_id,
                change_type=change_type,
                changed_by=changed_by,
                tenant_id=tenant_id,
                old_value=old_value,
                new_value=new_value,
                change_summary=change_summary or self._generate_summary(change_type, old_value, new_value)
            )
            session.add(log_entry)
            session.commit()
        except Exception as e:
            session.rollback()
            import logging
            logging.error(f"Error logging policy change: {e}")
        finally:
            session.close()
    
    def _generate_summary(
        self,
        change_type: str,
        old_value: Optional[Dict[str, Any]],
        new_value: Optional[Dict[str, Any]]
    ) -> str:
        """Generate human-readable change summary."""
        if change_type == "created":
            return f"Policy created: {new_value.get('name', 'Unknown') if new_value else 'Unknown'}"
        elif change_type == "deleted":
            return f"Policy deleted: {old_value.get('name', 'Unknown') if old_value else 'Unknown'}"
        elif change_type == "updated":
            changes = []
            if old_value and new_value:
                for key in ["name", "action", "enabled", "priority"]:
                    if old_value.get(key) != new_value.get(key):
                        changes.append(f"{key}: {old_value.get(key)} → {new_value.get(key)}")
            return f"Policy updated: {', '.join(changes) if changes else 'No changes'}"
        return f"Policy {change_type}"
    
    def get_policy_history(self, policy_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get change history for a policy."""
        session = self.Session()
        try:
            logs = session.query(PolicyChangeLog).filter(
                PolicyChangeLog.policy_id == policy_id
            ).order_by(
                PolicyChangeLog.timestamp.desc()
            ).limit(limit).all()
            
            return [
                {
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                    "change_type": log.change_type,
                    "changed_by": log.changed_by,
                    "tenant_id": log.tenant_id,
                    "old_value": log.old_value,
                    "new_value": log.new_value,
                    "change_summary": log.change_summary
                }
                for log in logs
            ]
        finally:
            session.close()
    
    def get_recent_changes(self, tenant_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent policy changes."""
        session = self.Session()
        try:
            query = session.query(PolicyChangeLog)
            if tenant_id:
                query = query.filter(PolicyChangeLog.tenant_id == tenant_id)
            
            logs = query.order_by(
                PolicyChangeLog.timestamp.desc()
            ).limit(limit).all()
            
            return [
                {
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                    "policy_id": log.policy_id,
                    "change_type": log.change_type,
                    "changed_by": log.changed_by,
                    "tenant_id": log.tenant_id,
                    "change_summary": log.change_summary
                }
                for log in logs
            ]
        finally:
            session.close()
    
    def rollback_policy(self, policy_id: str, change_log_id: int) -> bool:
        """
        Rollback a policy to a previous state.
        
        Args:
            policy_id: Policy identifier
            change_log_id: ID of change log entry to rollback to
        
        Returns:
            True if rollback successful
        """
        session = self.Session()
        try:
            log_entry = session.query(PolicyChangeLog).filter_by(
                id=change_log_id,
                policy_id=policy_id
            ).first()
            
            if not log_entry or not log_entry.old_value:
                return False
            
            # Log the rollback as a new change
            self.log_change(
                policy_id=policy_id,
                change_type="updated",
                old_value=log_entry.new_value,
                new_value=log_entry.old_value,
                changed_by="system",
                change_summary=f"Rollback to change #{change_log_id}"
            )
            
            return True
        finally:
            session.close()


def create_audit_trail(database_url: Optional[str] = None) -> PolicyAuditTrail:
    """Create policy audit trail instance."""
    return PolicyAuditTrail(database_url)

