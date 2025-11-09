# Landing Page vs Gateway - Simple Explanation

## 🎯 The Simple Answer

**Landing Page:**
- Marketing website
- Shows what your product does
- Has interactive demo
- People visit it to learn about you

**Gateway:**
- The actual product
- Scans requests in real-time
- Blocks threats
- Customers use it in their code

---

## 📄 Landing Page (Marketing Site)

**What it is:**
- Your website (like aifirewall.com)
- Shows features, benefits, pricing
- Has interactive demo
- Where people learn about you

**What it does:**
- Marketing
- Demo (shows how it works)
- Contact form (collects leads)
- Doesn't actually protect anything

**Where it lives:**
- Vercel, Netlify, GitHub Pages
- Just HTML/CSS/JavaScript
- Static files

**Who uses it:**
- Potential customers
- People researching your product
- Anyone who visits your site

**Example:**
```
User visits: aifirewall.com
→ Sees landing page
→ Tries demo
→ Fills contact form
→ You get their email
```

---

## 🔒 Gateway (The Actual Product)

**What it is:**
- The firewall itself
- API server that scans requests
- Runs 24/7
- The thing customers actually use

**What it does:**
- Receives requests from customer code
- Scans for secrets, PII, injection
- Blocks or redacts threats
- Forwards safe requests to OpenAI
- Logs everything

**Where it lives:**
- Railway, Render, Fly.io, AWS
- Python FastAPI server
- Needs to run continuously

**Who uses it:**
- Your customers (via their code)
- Their applications
- Not end users directly

**Example:**
```
Customer's code:
  from aifirewall import OpenAI
  client = OpenAI(firewall_url="https://gateway.railway.app")
  client.chat.completions.create(...)
  
→ Request goes to YOUR gateway
→ Gateway scans it
→ Blocks if dangerous
→ Forwards to OpenAI if safe
→ Returns response to customer
```

---

## 🔄 How They Work Together

### Flow 1: Marketing (Landing Page)
```
1. Person visits landing page
2. Sees what you do
3. Tries demo (demo mode)
4. Fills contact form
5. You get their email
6. You reach out
```

### Flow 2: Product (Gateway)
```
1. Customer installs SDK
2. Their code calls YOUR gateway
3. Gateway scans request
4. Blocks threats or forwards to OpenAI
5. Returns response
6. Customer's app works (but protected)
```

---

## 💻 Technical Difference

### Landing Page:
```html
<!-- Just HTML/CSS/JavaScript -->
<html>
  <body>
    <h1>AI Prompt Firewall</h1>
    <button onclick="testDemo()">Try Demo</button>
  </body>
</html>
```

**Files:**
- `index.html` (the landing page)
- Static files
- No server needed (just hosting)

### Gateway:
```python
# Python FastAPI server
from fastapi import FastAPI

app = FastAPI()

@app.post("/v1/chat/completions")
async def scan_request(request):
    # Scan for threats
    violations = detect_secrets(request)
    if violations:
        return {"error": "Blocked"}
    # Forward to OpenAI
    return forward_to_openai(request)
```

**Files:**
- `gateway/server.py` (the gateway)
- Needs Python server running
- Needs to be always online

---

## 🎯 Real-World Analogy

**Landing Page = Storefront**
- Where people see your product
- Try it out (demo)
- Learn about it
- Contact you

**Gateway = The Actual Product**
- The thing that does the work
- Runs in the background
- Processes requests
- Protects customers

**Like:**
- Landing page = Apple Store (where you see iPhone)
- Gateway = iPhone itself (the actual product)

---

## 📋 What You Need To Deploy

### Landing Page:
**Where:** Vercel, Netlify (free)
**What:** Just upload `index.html`
**Why:** So people can visit your site
**Cost:** Free

### Gateway:
**Where:** Railway, Render, Fly.io (~$5-20/month)
**What:** Deploy Python server
**Why:** So customers can actually use your product
**Cost:** ~$5-20/month

---

## 🔄 How They Connect

**They DON'T directly connect.**

**Landing Page:**
- Has demo that calls gateway (for demo purposes)
- But landing page is separate
- Just marketing

**Gateway:**
- Customers use it via SDK
- Not connected to landing page
- The actual product

**The Flow:**
```
1. Landing page → Gets leads
2. You demo → Show gateway working
3. Customer signs up → Gets gateway URL
4. Customer uses gateway → Via SDK
5. Gateway protects them → 24/7
```

---

## 💡 Key Insight

**Landing Page:**
- Marketing tool
- Shows what you do
- Collects leads
- Demo shows how it works

**Gateway:**
- The actual product
- Does the work
- Protects customers
- What they pay for

**You need BOTH:**
- Landing page → Get customers
- Gateway → Serve customers

---

## 🚀 What To Deploy First

**Priority 1: Landing Page**
- Quick (5 min)
- Free
- Gets you leads
- Can demo without gateway (demo mode)

**Priority 2: Gateway**
- Takes 10 min
- Costs ~$5-20/month
- Needed for real customers
- Can wait until you have leads

---

## 📊 Summary

| | Landing Page | Gateway |
|---|---|---|
| **What** | Marketing website | The product |
| **Purpose** | Get leads | Protect customers |
| **Who uses** | Visitors | Customer code |
| **Where** | Vercel/Netlify | Railway/Render |
| **Cost** | Free | ~$5-20/month |
| **Needs** | HTML file | Python server |
| **When** | Deploy first | Deploy when needed |

---

## 🎯 Bottom Line

**Landing Page:**
- Your marketing site
- Shows what you do
- Has demo
- Gets leads

**Gateway:**
- The actual firewall
- Scans requests
- Blocks threats
- What customers use

**You need both, but:**
- Landing page first (get leads)
- Gateway second (serve customers)

Does this make sense?

