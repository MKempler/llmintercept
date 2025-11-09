# Deploy Gateway to Railway (5 minutes)

## Why Railway?
- **Free tier** available
- **Easiest** Python/FastAPI deployment
- **Auto-deploys** from GitHub
- **Perfect** for MVP

## Step 1: Deploy Gateway

1. **Go to Railway**: https://railway.app
2. **Sign up** (use GitHub - easiest)
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `llmintercept` repo**
6. **Railway will auto-detect** it's a Python app

## Step 2: Configure Railway

**In Railway dashboard:**

1. **Set Root Directory**: `./` (root of repo)
2. **Set Start Command**: `uvicorn gateway.server:app --host 0.0.0.0 --port $PORT`
3. **Add Environment Variables**:
   - `DEMO_MODE=true` (so it returns demo data)
   - `PORT=$PORT` (Railway sets this automatically)

## Step 3: Get Gateway URL

1. Railway will give you a URL like: `https://your-app.railway.app`
2. **Copy this URL** - you'll need it next

## Step 4: Update Dashboard Environment Variable

**In Vercel Dashboard:**

1. Go to your dashboard project settings
2. Go to **Environment Variables**
3. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-app.railway.app` (your Railway URL)
4. **Redeploy** the dashboard

## Step 5: Test

1. Go to `dashboard.llmintercept.com`
2. You should see demo data!

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
5. Deploy!

---

## Quick Fix: Use Railway

Railway is the fastest option. Follow steps above!

