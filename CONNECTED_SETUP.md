# How to Run Everything Connected Locally

## 🚀 Complete Setup (All Connected)

### Step 1: Start Gateway
**Terminal 1:**
```bash
cd /Users/maxkempler/Documents/aifirewall
source venv/bin/activate
export DEMO_MODE=true
python -m gateway.server
```
**Runs on:** `http://localhost:8000`

### Step 2: Start Dashboard
**Terminal 2:**
```bash
cd /Users/maxkempler/Documents/aifirewall/dashboard
npm run dev
```
**Runs on:** `http://localhost:3000`

### Step 3: Start Landing Page
**Terminal 3:**
```bash
cd /Users/maxkempler/Documents/aifirewall
python3 -m http.server 3001
```
**Runs on:** `http://localhost:3001`

---

## 🎯 How It Works Now

**Landing Page (`localhost:3001`):**
- Marketing site with demo
- "View Dashboard" button in nav → Opens dashboard
- "View Full Dashboard" button after demo → Opens dashboard
- All connected!

**Dashboard (`localhost:3000`):**
- Product UI
- "← Back to Demo" link in nav → Returns to landing page
- Shows stats, violations, logs

**Gateway (`localhost:8000`):**
- API that powers both
- Scans requests
- Returns results

---

## 📋 User Flow

1. **User visits landing page** (`localhost:3001`)
2. **Tries demo** → Sees how it works
3. **Clicks "View Dashboard"** → Opens dashboard (`localhost:3000`)
4. **Sees full product** → Stats, violations, logs
5. **Clicks "Back to Demo"** → Returns to landing page

**Everything is connected!**

---

## ✅ What I Added

1. **"View Dashboard" button** in landing page nav
2. **Dashboard Preview section** after demo
3. **"Back to Demo" link** in dashboard nav

**Now it's one cohesive experience!**

---

## 🎯 For Demos

**Show them:**
1. Landing page demo (how it works)
2. Click "View Dashboard" → Show full product
3. They see everything connected

**Perfect for demos!**

