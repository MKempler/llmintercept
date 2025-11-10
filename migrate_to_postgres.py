"""Migration script to move data from SQLite to PostgreSQL."""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from audit_logging import AuditLog, Base


def migrate_sqlite_to_postgres(sqlite_path: str = "./firewall.db", postgres_url: str = None):
    """
    Migrate audit logs from SQLite to PostgreSQL.
    
    Args:
        sqlite_path: Path to SQLite database file
        postgres_url: PostgreSQL connection URL (or from DATABASE_URL env var)
    """
    if not postgres_url:
        postgres_url = os.getenv("DATABASE_URL")
        if not postgres_url:
            print("Error: DATABASE_URL environment variable not set")
            print("Usage: export DATABASE_URL='postgresql://user:pass@host:port/db'")
            sys.exit(1)
    
    if not os.path.exists(sqlite_path):
        print(f"Warning: SQLite database not found at {sqlite_path}")
        print("Skipping migration - PostgreSQL will start fresh")
        return
    
    print(f"Migrating from SQLite ({sqlite_path}) to PostgreSQL...")
    
    # SQLite source
    sqlite_url = f"sqlite:///{sqlite_path}"
    sqlite_engine = create_engine(sqlite_url)
    sqlite_session = sessionmaker(bind=sqlite_engine)()
    
    # PostgreSQL destination
    print(f"Connecting to PostgreSQL: {postgres_url.split('@')[1] if '@' in postgres_url else 'hidden'}")
    postgres_engine = create_engine(postgres_url)
    
    # Create tables if they don't exist
    Base.metadata.create_all(postgres_engine)
    postgres_session = sessionmaker(bind=postgres_engine)()
    
    try:
        # Read all records from SQLite
        sqlite_logs = sqlite_session.query(AuditLog).order_by(AuditLog.timestamp).all()
        total_records = len(sqlite_logs)
        
        if total_records == 0:
            print("No records found in SQLite database. Nothing to migrate.")
            return
        
        print(f"Found {total_records} records in SQLite")
        
        # Write to PostgreSQL
        migrated = 0
        skipped = 0
        
        for i, log in enumerate(sqlite_logs, 1):
            # Check if already exists (by request_id and timestamp)
            existing = postgres_session.query(AuditLog).filter_by(
                request_id=log.request_id,
                timestamp=log.timestamp
            ).first()
            
            if not existing:
                try:
                    postgres_session.add(AuditLog(
                        timestamp=log.timestamp,
                        request_id=log.request_id,
                        user_id=log.user_id,
                        endpoint=log.endpoint,
                        method=log.method,
                        status=log.status,
                        violations=log.violations,
                        request_data=log.request_data,
                        response_data=log.response_data,
                        latency_ms=log.latency_ms,
                        extra_metadata=log.extra_metadata
                    ))
                    migrated += 1
                    
                    # Commit in batches of 100
                    if migrated % 100 == 0:
                        postgres_session.commit()
                        print(f"  Migrated {migrated}/{total_records} records...")
                except Exception as e:
                    print(f"  Error migrating record {log.request_id}: {e}")
                    postgres_session.rollback()
                    skipped += 1
            else:
                skipped += 1
        
        # Final commit
        postgres_session.commit()
        
        print(f"\nMigration complete!")
        print(f"  Migrated: {migrated} records")
        print(f"  Skipped (duplicates): {skipped} records")
        print(f"  Total: {total_records} records")
        
    except Exception as e:
        postgres_session.rollback()
        print(f"\nError during migration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        sqlite_session.close()
        postgres_session.close()
        print("\nDatabase connections closed.")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrate SQLite audit logs to PostgreSQL")
    parser.add_argument(
        "--sqlite",
        default="./firewall.db",
        help="Path to SQLite database file (default: ./firewall.db)"
    )
    parser.add_argument(
        "--postgres",
        help="PostgreSQL connection URL (or use DATABASE_URL env var)"
    )
    
    args = parser.parse_args()
    
    migrate_sqlite_to_postgres(
        sqlite_path=args.sqlite,
        postgres_url=args.postgres
    )

