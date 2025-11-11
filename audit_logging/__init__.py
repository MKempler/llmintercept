"""Audit logging for security events."""
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
import json
import os
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, JSON, and_, or_
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
            self.engine = create_engine(sync_url, pool_pre_ping=True)
            Base.metadata.create_all(self.engine)
            self.Session = sessionmaker(bind=self.engine)
        else:
            # PostgreSQL or other databases - use connection pooling
            # Parse PostgreSQL URL and add connection pool settings
            pool_size = int(os.getenv("DB_POOL_SIZE", "10"))
            max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "20"))
            
            self.engine = create_engine(
                self.database_url,
                pool_size=pool_size,
                max_overflow=max_overflow,
                pool_pre_ping=True,  # Verify connections before using
                pool_recycle=3600,  # Recycle connections after 1 hour
            )
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
    
    def get_recent_logs(
        self, 
        limit: int = 100,
        offset: int = 0,
        status: Optional[str] = None,
        endpoint: Optional[str] = None,
        violation_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get audit logs with filtering support.
        
        Args:
            limit: Maximum number of logs to return
            offset: Number of logs to skip (for pagination)
            status: Filter by status (blocked/allowed/error)
            endpoint: Filter by endpoint
            violation_type: Filter by violation type (pii/secret/prompt_injection)
            start_date: Filter logs after this date
            end_date: Filter logs before this date
            search: Search in request_id, endpoint, user_id
            user_id: Filter by user_id (NEW)
        """
        session = self.Session()
        try:
            query = session.query(AuditLog)
            
            # Apply filters
            if status:
                query = query.filter(AuditLog.status == status)
            
            if endpoint:
                query = query.filter(AuditLog.endpoint == endpoint)
            
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            
            if start_date:
                query = query.filter(AuditLog.timestamp >= start_date)
            
            if end_date:
                query = query.filter(AuditLog.timestamp <= end_date)
            
            if search:
                search_filter = or_(
                    AuditLog.request_id.ilike(f'%{search}%'),
                    AuditLog.endpoint.ilike(f'%{search}%'),
                    AuditLog.user_id.ilike(f'%{search}%')
                )
                query = query.filter(search_filter)
            
            # Filter by violation type (if specified)
            if violation_type:
                # Need to filter logs that have violations of this type
                # Since violations is JSON, we'll filter in Python after fetching
                # For now, fetch all matching logs and filter in Python
                logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit * 2).all()
                filtered_logs = []
                for log in logs:
                    violations = log.violations or []
                    for violation in violations:
                        if isinstance(violation, dict) and violation.get('type') == violation_type:
                            filtered_logs.append(log)
                            break
                    if len(filtered_logs) >= limit:
                        break
                return [self._log_to_dict(log) for log in filtered_logs[:limit]]
            
            # Apply ordering, pagination, and execute
            logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
            return [self._log_to_dict(log) for log in logs]
        finally:
            session.close()
    
    def get_logs_count(
        self,
        status: Optional[str] = None,
        endpoint: Optional[str] = None,
        violation_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> int:
        """
        Get total count of logs matching filters (for pagination).
        
        Args:
            status: Filter by status
            endpoint: Filter by endpoint
            violation_type: Filter by violation type
            start_date: Filter logs after this date
            end_date: Filter logs before this date
            search: Search in request_id, endpoint, user_id
            user_id: Filter by user_id (NEW)
        """
        session = self.Session()
        try:
            query = session.query(func.count(AuditLog.id))
            
            # Apply same filters as get_recent_logs
            if status:
                query = query.filter(AuditLog.status == status)
            
            if endpoint:
                query = query.filter(AuditLog.endpoint == endpoint)
            
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            
            if start_date:
                query = query.filter(AuditLog.timestamp >= start_date)
            
            if end_date:
                query = query.filter(AuditLog.timestamp <= end_date)
            
            if search:
                search_filter = or_(
                    AuditLog.request_id.ilike(f'%{search}%'),
                    AuditLog.endpoint.ilike(f'%{search}%'),
                    AuditLog.user_id.ilike(f'%{search}%')
                )
                query = query.filter(search_filter)
            
            # For violation_type, we need to count logs that have violations of this type
            # This is less efficient but necessary for JSON filtering
            if violation_type:
                # Fetch all matching logs and count in Python
                logs_query = session.query(AuditLog)
                if status:
                    logs_query = logs_query.filter(AuditLog.status == status)
                if endpoint:
                    logs_query = logs_query.filter(AuditLog.endpoint == endpoint)
                if user_id:
                    logs_query = logs_query.filter(AuditLog.user_id == user_id)
                if start_date:
                    logs_query = logs_query.filter(AuditLog.timestamp >= start_date)
                if end_date:
                    logs_query = logs_query.filter(AuditLog.timestamp <= end_date)
                if search:
                    search_filter = or_(
                        AuditLog.request_id.ilike(f'%{search}%'),
                        AuditLog.endpoint.ilike(f'%{search}%'),
                        AuditLog.user_id.ilike(f'%{search}%')
                    )
                    logs_query = logs_query.filter(search_filter)
                
                all_logs = logs_query.all()
                count = 0
                for log in all_logs:
                    violations = log.violations or []
                    for violation in violations:
                        if isinstance(violation, dict) and violation.get('type') == violation_type:
                            count += 1
                            break
                return count
            
            return query.scalar() or 0
        finally:
            session.close()
    
    def get_violations(self, limit: int = 100, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get logs with violations."""
        session = self.Session()
        try:
            query = session.query(AuditLog).filter(
                AuditLog.status == "blocked"
            )
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            logs = query.order_by(
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
            "metadata": log.extra_metadata,
            "request_data": log.request_data,
            "response_data": log.response_data
        }

