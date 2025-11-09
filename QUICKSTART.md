# Quick Start Commands

## 🚀 One Command to Start Everything

```bash
./start.sh
```

**This will:**
- Start gateway on port 8000
- Start landing page on port 3001
- Start dashboard on port 3000
- Show you all the URLs

**To stop everything:**
```bash
./stop.sh
```

---

## 📍 URLs After Starting

- **Landing Page:** http://localhost:3001
- **Dashboard:** http://localhost:3000
- **Gateway API:** http://localhost:8000

---

## 🎯 What Happens

1. Gateway starts (powers the demo)
2. Landing page starts (marketing site)
3. Dashboard starts (product UI)
4. Everything is connected!

---

## 🛑 To Stop

**Option 1:** Press Ctrl+C in the terminal running `start.sh`

**Option 2:** Run `./stop.sh`

**Option 3:** Manually:
```bash
pkill -f 'gateway.server'
pkill -f 'http.server 3001'
pkill -f 'vite'
```

---

## 💡 Pro Tip

The script runs everything in the background and shows logs.
You can check logs in:
- `gateway.log`
- `dashboard.log`
- `landing.log`

**That's it! Just run `./start.sh` and everything starts!**
