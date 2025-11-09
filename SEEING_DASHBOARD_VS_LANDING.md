# What You're Seeing - Clarified

## 🎯 What You're Seeing at localhost:3000

**You're seeing:** The React Dashboard (product UI)
- This is the **product dashboard**
- Shows stats, violations, logs
- This is what customers use **after** they sign up
- Located in `dashboard/` folder

**This is NOT:** The landing page (marketing site)

---

## 📄 The Landing Page (Marketing Site)

**Location:** `index.html` in root directory

**What it is:**
- Marketing website
- Shows features, demo, contact form
- This is what customers visit **before** signing up
- This is what you want to show prospects

**To see it:**

### Option 1: Open directly
```bash
open index.html
```

### Option 2: Serve on different port
```bash
cd /Users/maxkempler/Documents/aifirewall
python3 -m http.server 3001
```
Then visit: `http://localhost:3001`

---

## 🔄 The Two Different Things

### 1. Landing Page (`index.html`)
- **Purpose:** Marketing, get customers
- **Who sees:** Prospects, visitors
- **What it does:** Shows demo, collects leads
- **Location:** Root directory

### 2. Dashboard (`dashboard/`)
- **Purpose:** Product UI, manage firewall
- **Who sees:** Customers (after signup)
- **What it does:** Shows stats, violations, logs
- **Location:** `dashboard/` folder

---

## 🚀 To See Landing Page

**Stop the dashboard server** (if running):
- Press Ctrl+C in the terminal running `npm run dev`

**Start landing page server:**
```bash
cd /Users/maxkempler/Documents/aifirewall
python3 -m http.server 3001
```

**Visit:** `http://localhost:3001`

**Or just open:**
```bash
open index.html
```

---

## 📋 Summary

**What you're seeing:** Dashboard (product UI) - for customers
**What you want:** Landing page (`index.html`) - for prospects

**To see landing page:**
- `open index.html` (simplest)
- Or serve on port 3001: `python3 -m http.server 3001`

The landing page is the marketing site with the demo you built!

