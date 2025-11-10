# How to Set DATABASE_URL in Railway - Step by Step

## What You're Doing

You're telling your Gateway service to use the PostgreSQL database you just created.

## Step-by-Step Instructions

### Step 1: Open Your Gateway Service

1. Go to https://railway.app
2. Click on your **project** (the one with your gateway)
3. You'll see **two services**:
   - One is your **Gateway** (FastAPI app) - click this one
   - One is **PostgreSQL** (the database) - don't click this one yet

### Step 2: Open Variables Tab

1. In your **Gateway service**, look at the top tabs
2. Click on **"Variables"** tab
3. You'll see a list of environment variables like:
   - `DEMO_MODE=true`
   - `PORT=$PORT`
   - etc.

### Step 3: Check if DATABASE_URL Already Exists

**Look through the list** - do you see `DATABASE_URL`?

- ✅ **If YES:** Railway already set it! You're done! Skip to Step 5.
- ❌ **If NO:** Continue to Step 4.

### Step 4: Add DATABASE_URL (If It Doesn't Exist)

1. Click the **"+ New Variable"** button (usually top right)
2. A form will appear with two fields:
   - **Name:** Type `DATABASE_URL`
   - **Value:** Type `${{Postgres.DATABASE_URL}}`
3. Click **"Add"** or **"Save"**

**Important:** The value `${{Postgres.DATABASE_URL}}` is Railway's special syntax that automatically references your PostgreSQL service's connection URL.

### Step 5: Verify It's Set

After adding, you should see:
```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
```
in your variables list.

### Step 6: Railway Will Auto-Redeploy

Railway automatically redeploys when you add variables. You'll see a new deployment start.

---

## Visual Guide

```
Railway Dashboard
│
├── Your Project Name
│   │
│   ├── Gateway Service ← CLICK THIS
│   │   ├── Deployments tab
│   │   ├── Variables tab ← CLICK THIS
│   │   │   ├── DEMO_MODE = true
│   │   │   ├── PORT = $PORT
│   │   │   └── DATABASE_URL = ${{Postgres.DATABASE_URL}} ← ADD THIS
│   │   └── Logs tab
│   │
│   └── PostgreSQL Service
│       └── Variables tab (has DATABASE_URL, but don't copy from here)
```

---

## What Does `${{Postgres.DATABASE_URL}}` Mean?

This is Railway's **variable reference syntax**:
- `${{...}}` = "Use the value from another service"
- `Postgres` = The name of your PostgreSQL service
- `.DATABASE_URL` = The DATABASE_URL variable from that service

So `${{Postgres.DATABASE_URL}}` means: "Use the DATABASE_URL from my PostgreSQL service"

**You don't need to copy the actual URL** - Railway does this automatically!

---

## Alternative: If Railway Doesn't Auto-Reference

If `${{Postgres.DATABASE_URL}}` doesn't work, you can manually copy the URL:

1. Click on your **PostgreSQL service**
2. Go to **"Variables"** tab
3. Find `DATABASE_URL` - it looks like:
   ```
   postgresql://postgres:password@hostname.railway.app:5432/railway
   ```
4. **Copy this entire URL**
5. Go back to **Gateway service** → **Variables**
6. Add `DATABASE_URL` with the **copied URL** as the value

---

## Troubleshooting

### "I don't see a Variables tab"
- Make sure you clicked on the **Gateway service**, not the PostgreSQL service
- The Variables tab should be visible at the top

### "I don't see + New Variable button"
- Look for "Add Variable" or "New" button
- It might be in the top right corner or at the bottom of the variables list

### "Railway says the variable is invalid"
- Make sure you typed exactly: `${{Postgres.DATABASE_URL}}`
- The service name might be different - check what your PostgreSQL service is actually called
- If it's called something else (like "Postgres Database"), use: `${{Postgres Database.DATABASE_URL}}`

### "How do I know what my PostgreSQL service is called?"
- Look at the list of services in your Railway project
- The PostgreSQL service will have a database icon or say "PostgreSQL"
- Use that exact name in the reference

---

## Quick Checklist

- [ ] Opened Gateway service (not PostgreSQL)
- [ ] Clicked "Variables" tab
- [ ] Checked if DATABASE_URL already exists
- [ ] If not, clicked "+ New Variable"
- [ ] Added Name: `DATABASE_URL`
- [ ] Added Value: `${{Postgres.DATABASE_URL}}`
- [ ] Saved/Added the variable
- [ ] Railway started redeploying

---

## Still Confused?

**Simplest approach:**
1. Railway often **auto-injects** DATABASE_URL when you add PostgreSQL
2. **Check first** - it might already be there!
3. If it's there, you're done ✅
4. If not, add it using the steps above

The code is already ready - you just need Railway to know where the database is!

