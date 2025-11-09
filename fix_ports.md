# Quick Fix Instructions

## The Problem
Both ports showing dashboard is usually a browser caching issue or Vite proxy interfering.

## Quick Fix

**1. Stop everything:**
```bash
./stop.sh
```

**2. Clear browser cache:**
- Chrome/Edge: Cmd+Shift+Delete → Clear cached images and files
- Or use Incognito/Private window

**3. Start fresh:**
```bash
./start.sh
```

**4. Test in incognito:**
- Open incognito window
- Visit http://localhost:3001 (should show landing page)
- Visit http://localhost:3000 (should show dashboard)

## Manual Start (If script doesn't work)

**Terminal 1 - Gateway:**
```bash
cd /Users/maxkempler/Documents/aifirewall
source venv/bin/activate
export DEMO_MODE=true
python -m gateway.server
```

**Terminal 2 - Landing Page (IMPORTANT: Must be in root directory):**
```bash
cd /Users/maxkempler/Documents/aifirewall
python3 -m http.server 3001
```

**Terminal 3 - Dashboard:**
```bash
cd /Users/maxkempler/Documents/aifirewall/dashboard
npm run dev
```

## Verify It's Working

**Test landing page:**
```bash
curl http://localhost:3001/index.html | grep -o "<title>.*</title>"
```
Should show: `<title>AI Prompt Firewall - Enterprise LLM Security</title>`

**Test dashboard:**
```bash
curl http://localhost:3000 | head -5
```
Should show Vite/React content

## If Still Not Working

The "Back to Demo" button links to `http://localhost:3001`. Make sure:
1. Landing page server is running on 3001
2. Browser isn't caching
3. Try incognito window
