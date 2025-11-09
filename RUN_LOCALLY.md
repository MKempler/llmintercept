# How to Run Locally

## Quick Start (2 Steps)

### Step 1: Start the Gateway

**Terminal 1:**
```bash
cd /Users/maxkempler/Documents/aifirewall
source venv/bin/activate
export DEMO_MODE=true
python -m gateway.server
```

**You should see:**
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal running!**

### Step 2: Open Landing Page

**Option A: Open directly in browser**
```bash
open index.html
```

**Option B: Use Python's simple server (better for CORS)**
```bash
# Terminal 2 (new terminal)
cd /Users/maxkempler/Documents/aifirewall
python3 -m http.server 3000
```

Then open: `http://localhost:3000`

---

## Complete Setup

### 1. Make sure you're in the right directory:
```bash
cd /Users/maxkempler/Documents/aifirewall
```

### 2. Activate virtual environment:
```bash
source venv/bin/activate
```

### 3. Start gateway (Terminal 1):
```bash
export DEMO_MODE=true
python -m gateway.server
```

### 4. Open landing page:

**Simple way:**
```bash
open index.html
```

**Or use local server (recommended):**
```bash
# Terminal 2
python3 -m http.server 3000
# Then visit: http://localhost:3000
```

---

## Troubleshooting

### "Gateway not running"
- Make sure Terminal 1 is running `python -m gateway.server`
- Check it says "Uvicorn running on http://0.0.0.0:8000"

### "Demo not working"
- Make sure `DEMO_MODE=true` is set
- Check browser console for errors (F12)
- Make sure gateway is on port 8000

### "CORS errors"
- Use Python's http.server instead of opening file directly
- Or update `FIREWALL_URL` in `index.html` if gateway is on different port

---

## Quick Test

**After starting both:**

1. Gateway running → `http://localhost:8000/health` should return `{"status":"healthy"}`
2. Landing page open → Click "Step 1: Secrets" → Click "Test This Scenario" → Should block!

---

## What You'll See

**Terminal 1 (Gateway):**
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Browser:**
- Landing page loads
- Demo works
- Can test all 4 steps
- Stats update in real-time

---

## Pro Tip

**For best experience:**
- Use Python's http.server (avoids CORS issues)
- Keep gateway running in separate terminal
- Use `DEMO_MODE=true` (no API key needed)

**Ready to go!**

