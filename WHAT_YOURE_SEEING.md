# What You're Seeing - Clarification

## 🎯 What's What

### `localhost:3000` (or `index.html`)
**This is:** The landing page (marketing website) with an interactive demo built in

**What it does:**
- Shows your marketing content
- Has the interactive demo
- Calls the gateway API to test scenarios
- This is what customers see

**This is:** The demo/marketing site ✅

---

### `localhost:8000` (Gateway)
**This is:** The actual product (the firewall API)

**What it does:**
- Scans requests for threats
- Blocks/redacts violations
- Forwards safe requests to OpenAI
- This is what customers USE in their code

**This is:** The actual product ✅

---

## 🔄 How They Work Together

**Landing Page (`index.html`):**
- Marketing website
- Has demo buttons
- When you click "Test This Scenario"
- It calls the Gateway API (`localhost:8000`)
- Shows you the results

**Gateway (`localhost:8000`):**
- The actual firewall
- Does the scanning
- Returns results
- This is what customers integrate into their code

---

## 💡 The Key Insight

**Landing Page = Demo/Marketing Site**
- What customers visit
- Shows how it works
- Has interactive demo
- Calls gateway to test

**Gateway = Actual Product**
- What customers use
- Does the real work
- Scans/blocks threats
- What they integrate

---

## 🎯 What Customers See

**When they visit your site:**
1. They see the landing page (`index.html`)
2. They try the demo (calls gateway)
3. They're convinced
4. They integrate the gateway into their code

**So:**
- Landing page = Demo site (what they see)
- Gateway = Product (what they use)

---

## 📋 Summary

**`localhost:3000` = Landing Page (Demo/Marketing Site)**
- This is what you're seeing
- This is the demo site
- This calls the gateway to test

**`localhost:8000` = Gateway (Actual Product)**
- This is the real product
- This is what customers use
- This does the scanning

**Both are needed:**
- Landing page = Gets customers
- Gateway = Serves customers

Does this clarify it?

