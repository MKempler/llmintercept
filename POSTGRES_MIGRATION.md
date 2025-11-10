# PostgreSQL Migration Guide

## Overview
This guide walks you through migrating from SQLite to PostgreSQL for the AI Firewall audit logging system.

## Prerequisites

1. **PostgreSQL installed** (version 12+ recommended)
   - Local: Install PostgreSQL on your machine
   - Cloud: Use managed services like:
     - Railway PostgreSQL
     - AWS RDS
     - Google Cloud SQL
     - Heroku Postgres
     - Supabase
     - Neon

2. **Python dependencies** (already in requirements.txt)
   - `psycopg2-binary>=2.9.9` ✅ Already added

## Step-by-Step Migration

### Step 1: Install PostgreSQL (if not already installed)

#### macOS:
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows:
Download from: https://www.postgresql.org/download/windows/

#### Or use Docker:
```bash
docker run --name firewall-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=firewall_db \
  -p 5432:5432 \
  -d postgres:14
```

### Step 2: Create PostgreSQL Database

Connect to PostgreSQL:
```bash
psql -U postgres
```

Create database and user:
```sql
-- Create database
CREATE DATABASE firewall_db;

-- Create user (optional, for better security)
CREATE USER firewall_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE firewall_db TO firewall_user;

-- Connect to the new database
\c firewall_db

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO firewall_user;

-- Exit
\q
```

### Step 3: Set Environment Variable

#### For Local Development:

**Option A: Export in terminal**
```bash
export DATABASE_URL="postgresql://firewall_user:your_secure_password@localhost:5432/firewall_db"
```

**Option B: Create `.env` file** (recommended)
```bash
# Create .env file in project root
cat > .env << EOF
DATABASE_URL=postgresql://firewall_user:your_secure_password@localhost:5432/firewall_db
EOF
```

Then load it before running:
```bash
export $(cat .env | xargs)
python -m gateway.server
```

**Option C: Use python-dotenv** (if you add it)
```python
# In gateway/server.py, add at top:
from dotenv import load_dotenv
load_dotenv()
```

#### For Production Deployment:

**Railway:**
```bash
railway variables set DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

**Heroku:**
```bash
heroku config:set DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

**Docker:**
```yaml
# docker-compose.yml
services:
  gateway:
    environment:
      - DATABASE_URL=postgresql://firewall_user:password@postgres:5432/firewall_db
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: firewall_user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: firewall_db
```

### Step 4: Migrate Existing Data (if you have SQLite data)

If you have existing audit logs in SQLite that you want to migrate:

#### Option A: Using Python Script (Recommended)

Create `migrate_to_postgres.py`:

```python
"""Migrate SQLite data to PostgreSQL."""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from audit_logging import AuditLog, Base

# SQLite source
sqlite_url = "sqlite:///./firewall.db"
sqlite_engine = create_engine(sqlite_url)
sqlite_session = sessionmaker(bind=sqlite_engine)()

# PostgreSQL destination
postgres_url = os.getenv("DATABASE_URL", "postgresql://firewall_user:password@localhost:5432/firewall_db")
postgres_engine = create_engine(postgres_url)
Base.metadata.create_all(postgres_engine)
postgres_session = sessionmaker(bind=postgres_engine)()

try:
    # Read all records from SQLite
    sqlite_logs = sqlite_session.query(AuditLog).all()
    print(f"Found {len(sqlite_logs)} records in SQLite")
    
    # Write to PostgreSQL
    migrated = 0
    for log in sqlite_logs:
        # Check if already exists (by request_id)
        existing = postgres_session.query(AuditLog).filter_by(request_id=log.request_id).first()
        if not existing:
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
    
    postgres_session.commit()
    print(f"Successfully migrated {migrated} records to PostgreSQL")
    
except Exception as e:
    postgres_session.rollback()
    print(f"Error during migration: {e}")
    sys.exit(1)
finally:
    sqlite_session.close()
    postgres_session.close()
```

Run migration:
```bash
export DATABASE_URL="postgresql://firewall_user:password@localhost:5432/firewall_db"
python migrate_to_postgres.py
```

#### Option B: Using pgloader (Advanced)

```bash
# Install pgloader
brew install pgloader  # macOS
# or
sudo apt install pgloader  # Ubuntu

# Migrate
pgloader sqlite://./firewall.db postgresql://firewall_user:password@localhost:5432/firewall_db
```

### Step 5: Test the Migration

1. **Start the gateway with PostgreSQL:**
```bash
export DATABASE_URL="postgresql://firewall_user:password@localhost:5432/firewall_db"
python -m gateway.server
```

2. **Make a test request:**
```bash
curl http://localhost:8000/health
```

3. **Check logs are being written:**
```bash
# Connect to PostgreSQL
psql -U firewall_user -d firewall_db

# Check recent logs
SELECT id, timestamp, endpoint, status FROM audit_logs ORDER BY timestamp DESC LIMIT 10;

# Exit
\q
```

### Step 6: Update Production Configuration

#### Railway:
1. Add PostgreSQL service in Railway dashboard
2. Copy the DATABASE_URL from PostgreSQL service
3. Set as environment variable for gateway service:
```bash
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### Heroku:
```bash
# Add Heroku Postgres addon
heroku addons:create heroku-postgresql:mini

# DATABASE_URL is automatically set
# Verify:
heroku config:get DATABASE_URL
```

#### Docker Compose:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: firewall_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: firewall_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  gateway:
    build: .
    environment:
      - DATABASE_URL=postgresql://firewall_user:${POSTGRES_PASSWORD}@postgres:5432/firewall_db
    depends_on:
      - postgres
    ports:
      - "8000:8000"

volumes:
  postgres_data:
```

### Step 7: Optional - Database Pooling Configuration

For high-traffic deployments, tune connection pooling:

```bash
# In your environment
export DB_POOL_SIZE=20          # Default: 10
export DB_MAX_OVERFLOW=40       # Default: 20
```

### Step 8: Backup Strategy

Set up regular backups:

#### Using pg_dump:
```bash
# Manual backup
pg_dump -U firewall_user firewall_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U firewall_user firewall_db < backup_20240101.sql
```

#### Automated backups (cron):
```bash
# Add to crontab
0 2 * * * pg_dump -U firewall_user firewall_db > /backups/firewall_$(date +\%Y\%m\%d).sql
```

#### Cloud providers:
- Railway: Automatic backups (Pro plan)
- Heroku: Automatic daily backups
- AWS RDS: Automated backups enabled by default

## Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database and user created
- [ ] `DATABASE_URL` environment variable set
- [ ] Gateway starts without errors
- [ ] Test request creates audit log entry
- [ ] Can query logs from PostgreSQL
- [ ] Existing data migrated (if applicable)
- [ ] Production deployment updated

## Troubleshooting

### Connection refused:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Check PostgreSQL is listening
netstat -an | grep 5432
```

### Authentication failed:
- Verify username/password in DATABASE_URL
- Check `pg_hba.conf` allows connections
- Ensure user has proper permissions

### Database doesn't exist:
```sql
-- List databases
\l

-- Create if missing
CREATE DATABASE firewall_db;
```

### Connection pool exhausted:
- Increase `DB_POOL_SIZE` and `DB_MAX_OVERFLOW`
- Check for connection leaks in code
- Monitor active connections: `SELECT count(*) FROM pg_stat_activity;`

## Rollback Plan

If you need to rollback to SQLite:

1. **Stop the gateway**
2. **Set DATABASE_URL back to SQLite:**
```bash
export DATABASE_URL="sqlite+aiosqlite:///./firewall.db"
```
3. **Restart gateway**

Note: PostgreSQL data remains intact, you can migrate back later.

## Next Steps

After successful migration:

1. ✅ Monitor database performance
2. ✅ Set up automated backups
3. ✅ Configure connection pooling for your traffic
4. ✅ Consider read replicas for high availability
5. ✅ Set up database monitoring/alerting

## Support

If you encounter issues:
1. Check PostgreSQL logs: `/var/log/postgresql/` (Linux) or `brew services info postgresql` (macOS)
2. Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
3. Test connection manually: `psql $DATABASE_URL`

