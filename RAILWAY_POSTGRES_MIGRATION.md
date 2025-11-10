# Railway PostgreSQL Migration Guide

## Quick Answer: What You Need to Do

**The code is already done!** ✅ You just need to:
1. Add PostgreSQL service on Railway
2. Set the `DATABASE_URL` environment variable
3. Redeploy

That's it! The code will automatically use PostgreSQL instead of SQLite.

---

## Step-by-Step: Railway PostgreSQL Setup

### Step 1: Add PostgreSQL Service to Your Railway Project

1. **Go to Railway Dashboard**: https://railway.app
2. **Open your gateway project** (the one running `gateway.server`)
3. **Click "+ New"** button (top right)
4. **Select "Database"** → **"Add PostgreSQL"**
5. Railway will create a PostgreSQL database for you

### Step 2: Get the DATABASE_URL

1. **Click on the PostgreSQL service** you just created
2. **Go to "Variables" tab**
3. **Copy the `DATABASE_URL`** value (it looks like: `postgresql://postgres:password@hostname:5432/railway`)

**OR** Railway automatically creates a reference variable:
- Variable name: `${{Postgres.DATABASE_URL}}`
- This is the magic reference that Railway uses

### Step 3: Set DATABASE_URL for Your Gateway Service

1. **Click on your Gateway service** (the one running `gateway.server`)
2. **Go to "Variables" tab**
3. **Click "+ New Variable"**
4. **Add:**
   - **Name**: `DATABASE_URL`
   - **Value**: `${{Postgres.DATABASE_URL}}` ← This references the PostgreSQL service
5. **Click "Add"**

**Alternative:** Railway might auto-inject this. Check if `DATABASE_URL` already exists.

### Step 4: Redeploy Your Gateway

Railway will automatically redeploy when you add environment variables, but you can also:

1. **Go to your Gateway service**
2. **Click "Deployments" tab**
3. **Click "Redeploy"** (or push a commit to trigger auto-deploy)

### Step 5: Verify It's Working

1. **Check Railway logs:**
   - Go to Gateway service → "Deployments" → Click latest deployment → "View Logs"
   - Look for: "Connected to PostgreSQL" or database connection messages
   - **No errors** = Success! ✅

2. **Test the API:**
   ```bash
   curl https://your-gateway.railway.app/health
   ```

3. **Check if logs are being written:**
   - Make a test request to your gateway
   - Go to PostgreSQL service → "Data" tab → Query:
     ```sql
     SELECT COUNT(*) FROM audit_logs;
     ```
   - Should show records being created

---

## Visual Guide: Railway Dashboard

```
Railway Project: "aifirewall"
├── Gateway Service (your FastAPI app)
│   └── Variables:
│       ├── DEMO_MODE=true
│       └── DATABASE_URL=${{Postgres.DATABASE_URL}} ← ADD THIS
│
└── PostgreSQL Service (new!)
    └── Variables:
        └── DATABASE_URL=postgresql://... ← Auto-generated
```

---

## Migrating Existing Data (If You Have SQLite Data)

If you have existing audit logs in SQLite that you want to keep:

### Option A: Use Railway's PostgreSQL Data Tab

1. **Export from SQLite locally:**
   ```bash
   # On your local machine
   sqlite3 firewall.db ".dump" > backup.sql
   ```

2. **Import to Railway PostgreSQL:**
   - Go to PostgreSQL service → "Data" tab
   - Click "Query" tab
   - Paste and run SQL commands (adjust for PostgreSQL syntax)

### Option B: Use Migration Script (Recommended)

1. **Run migration script locally** pointing to Railway PostgreSQL:
   ```bash
   # Get DATABASE_URL from Railway PostgreSQL service
   export DATABASE_URL="postgresql://postgres:password@hostname:5432/railway"
   
   # Run migration
   python migrate_to_postgres.py
   ```

2. **Or use Railway CLI:**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Link to your project
   railway link
   
   # Run migration script (it will use Railway's DATABASE_URL)
   railway run python migrate_to_postgres.py
   ```

---

## Troubleshooting

### "Connection refused" or "Database doesn't exist"

**Check:**
1. PostgreSQL service is running (green status in Railway)
2. `DATABASE_URL` is set correctly in Gateway service
3. Gateway service is redeployed after adding `DATABASE_URL`

**Fix:**
- Make sure `DATABASE_URL` uses the reference: `${{Postgres.DATABASE_URL}}`
- Or copy the full URL from PostgreSQL service → Variables tab

### "Table doesn't exist"

**This is normal!** The tables will be created automatically on first run.

**Fix:**
- Just make a request to your gateway
- It will create the tables automatically
- Check PostgreSQL → Data tab to verify

### "Too many connections"

**Fix:**
- Add connection pool settings to Gateway service variables:
  ```
  DB_POOL_SIZE=10
  DB_MAX_OVERFLOW=20
  ```

### Gateway still using SQLite

**Check:**
1. `DATABASE_URL` is set in Gateway service variables
2. Gateway was redeployed after adding variable
3. Check logs for database connection messages

**Fix:**
- Remove any old SQLite database files from your repo
- Force redeploy: Gateway service → Settings → "Redeploy"

---

## Environment Variables Summary

### Required:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Optional (for better performance):
```
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
```

### Your existing variables (keep these):
```
DEMO_MODE=true
PORT=$PORT
# ... other variables
```

---

## What Happens After Migration

✅ **Automatic:**
- Tables are created automatically on first request
- Connection pooling is configured
- All audit logs go to PostgreSQL
- SQLite is no longer used

✅ **Benefits:**
- Better performance (connection pooling)
- Production-ready database
- Can scale horizontally
- Automatic backups (Railway Pro plan)

---

## Quick Checklist

- [ ] Add PostgreSQL service to Railway project
- [ ] Set `DATABASE_URL=${{Postgres.DATABASE_URL}}` in Gateway service
- [ ] Redeploy Gateway service
- [ ] Verify logs show PostgreSQL connection
- [ ] Test API endpoint
- [ ] Check PostgreSQL Data tab for new records
- [ ] (Optional) Migrate existing SQLite data

---

## That's It!

Once you add the PostgreSQL service and set `DATABASE_URL`, Railway will:
1. Automatically redeploy your gateway
2. Connect to PostgreSQL
3. Create tables on first request
4. Start logging to PostgreSQL

**No code changes needed - it's all done!** 🎉

