"""Audit logging for security events."""
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
import json
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
import aiosqlite
from aiosqlite import Connection

Base = declarative_base()


class AuditLog(Base):
    """Database model for audit logs."""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    request_id = Column(String, index=True)
    user_id = Column(String, nullable=True)
    endpoint = Column(String)
    method = Column(String)
    status = Column(String)  # "blocked", "allowed", "error"
    violations = Column(JSON)
    request_data = Column(Text, nullable=True)
    response_data = Column(Text, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    extra_metadata = Column(JSON, nullable=True)


class AuditLogger:
    """Handles audit logging for security events."""
    
    def __init__(self, database_url: str = "sqlite+aiosqlite:///./firewall.db"):
        self.database_url = database_url
        self.engine = None
        self.Session = None
        self._init_db()
    
    def _init_db(self):
        """Initialize database connection."""
        # For async SQLite
        if "sqlite" in self.database_url:
            # Use sync engine for schema creation
            sync_url = self.database_url.replace("+aiosqlite", "")
            self.engine = create_engine(sync_url)
            Base.metadata.create_all(self.engine)
            self.Session = sessionmaker(bind=self.engine)
        else:
            self.engine = create_engine(self.database_url)
            Base.metadata.create_all(self.engine)
            self.Session = sessionmaker(bind=self.engine)
    
    def log_request(
        self,
        request_id: str,
        endpoint: str,
        method: str,
        status: str,
        violations: List[Dict[str, Any]],
        request_data: Optional[str] = None,
        response_data: Optional[str] = None,
        latency_ms: Optional[int] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Log a request event.
        
        Args:
            request_id: Unique request identifier
            endpoint: API endpoint
            method: HTTP method
            status: Request status (blocked/allowed/error)
            violations: List of violations found
            request_data: Request payload (may be redacted)
            response_data: Response payload (may be redacted)
            latency_ms: Request latency in milliseconds
            user_id: User identifier
            metadata: Additional metadata
        """
        session = self.Session()
        try:
            log_entry = AuditLog(
                request_id=request_id,
                user_id=user_id,
                endpoint=endpoint,
                method=method,
                status=status,
                violations=violations,
                request_data=request_data,
                response_data=response_data,
                latency_ms=latency_ms,
                extra_metadata=metadata
            )
            session.add(log_entry)
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"Error logging audit event: {e}")
        finally:
            session.close()
    
    def get_recent_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent audit logs."""
        session = self.Session()
        try:
            logs = session.query(AuditLog).order_by(
                AuditLog.timestamp.desc()
            ).limit(limit).all()
            return [self._log_to_dict(log) for log in logs]
        finally:
            session.close()
    
    def get_violations(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get logs with violations."""
        session = self.Session()
        try:
            logs = session.query(AuditLog).filter(
                AuditLog.status == "blocked"
            ).order_by(
                AuditLog.timestamp.desc()
            ).limit(limit).all()
            return [self._log_to_dict(log) for log in logs]
        finally:
            session.close()
    
    def _log_to_dict(self, log: AuditLog) -> Dict[str, Any]:
        """Convert log entry to dictionary."""
        return {
            "id": log.id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "request_id": log.request_id,
            "user_id": log.user_id,
            "endpoint": log.endpoint,
            "method": log.method,
            "status": log.status,
            "violations": log.violations,
            "latency_ms": log.latency_ms,
            "metadata": log.extra_metadata
        }

