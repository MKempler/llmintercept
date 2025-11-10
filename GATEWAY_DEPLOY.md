# Deploy Gateway to Railway (5 minutes)

## Why Railway?
- **Free tier** available
- **Easiest** Python/FastAPI deployment
- **Auto-deploys** from GitHub
- **Perfect** for MVP
- **PostgreSQL** included (free tier)

## Step 1: Deploy Gateway

1. **Go to Railway**: https://railway.app
2. **Sign up** (use GitHub - easiest)
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `llmintercept` repo**
6. **Railway will auto-detect** it's a Python app

## Step 2: Add PostgreSQL Database

1. **In Railway dashboard**, click **"+ New"** button
2. **Select "Database"** → **"Add PostgreSQL"**
3. Railway creates PostgreSQL automatically
4. **Copy the `DATABASE_URL`** from PostgreSQL service → Variables tab

## Step 3: Configure Railway

**In Railway dashboard (Gateway service):**

1. **Set Root Directory**: `./` (root of repo)
2. **Set Start Command**: `uvicorn gateway.server:app --host 0.0.0.0 --port $PORT`
3. **Add Environment Variables**:
   - `DEMO_MODE=true` (so it returns demo data)
   - `PORT=$PORT` (Railway sets this automatically)
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}` ← **Add this for PostgreSQL**

**Note:** Railway may auto-inject `DATABASE_URL`. Check if it's already there!

## Step 4: Get Gateway URL

1. Railway will give you a URL like: `https://your-app.railway.app`
2. **Copy this URL** - you'll need it next

## Step 5: Update Dashboard Environment Variable

**In Vercel Dashboard:**

1. Go to your dashboard project settings
2. Go to **Environment Variables**
3. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-app.railway.app` (your Railway URL)
4. **Redeploy** the dashboard

## Step 6: Test

1. Go to `dashboard.llmintercept.com`
2. You should see demo data!
3. Check Railway logs to verify PostgreSQL connection

---

## PostgreSQL Setup (Already Done!)

✅ **PostgreSQL is automatically configured:**
- Railway creates PostgreSQL service
- `DATABASE_URL` is auto-injected
- Tables are created automatically on first request
- No additional setup needed!

**See `RAILWAY_POSTGRES_MIGRATION.md` for detailed PostgreSQL migration guide.**

---

## Alternative: Render.com

If Railway doesn't work, use Render:

1. Go to https://render.com
2. **New Web Service**
3. **Connect GitHub** → Select repo
4. **Settings**:
   - Build Command: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
   - Start Command: `uvicorn gateway.server:app --host 0.0.0.0 --port $PORT`
   - Environment: `DEMO_MODE=true`
   - Add PostgreSQL database from Render dashboard
   - Set `DATABASE_URL` environment variable
5. Deploy!

---

## Quick Fix: Use Railway

Railway is the fastest option. Follow steps above!

