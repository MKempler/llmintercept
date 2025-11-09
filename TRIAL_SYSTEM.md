# Trial Account System - How It Works

## ✅ What I Just Built

### 1. Trial Account Manager
- Creates trial accounts
- Generates unique API keys (`fw_live_...`)
- Tracks usage
- Manages expiration
- Stores in JSON file (simple, works for now)

### 2. CLI Tool
- Create trials: `python -m trials create email@company.com "Company Name" 14`
- List trials: `python -m trials list`
- Show account: `python -m trials show email@company.com`
- Convert to paid: `python -m trials convert email@company.com`

### 3. Email Templates
- Welcome email (with API key and instructions)
- Follow-up email
- Conversion email

### 4. Gateway Integration
- Gateway now validates firewall API keys
- Tracks usage per account
- Blocks expired trials

---

## 🚀 How To Use It

### Step 1: After Demo Call

**They say:** "Yes, I want to try it!"

**You run:**
```bash
python -m trials create john@acmecorp.com "Acme Corp" 14
```

**Output:**
```
✅ Trial account created!
Email: john@acmecorp.com
Company: Acme Corp
API Key: fw_live_abc123xyz...
Expires: 2025-11-23

Send this to the customer:
---
Your API Key: fw_live_abc123xyz...
Gateway URL: https://your-gateway.railway.app
Trial expires: 2025-11-23
---
```

### Step 2: Send Welcome Email

**You copy the API key and send:**
```
Hi John,

Great demo! I've set up your 14-day trial.

API Key: fw_live_abc123xyz...
Gateway URL: https://your-gateway.railway.app

Quick Start:
1. pip install aifirewall
2. from aifirewall import OpenAI
   client = OpenAI(
       api_key="your-openai-key",
       firewall_url="https://your-gateway.railway.app"
   )
3. Use it like normal!

Let me know if you have questions.

Best,
[Your Name]
```

### Step 3: They Use It

**They integrate:**
- Install SDK
- Use their API key (`fw_live_...`)
- Point to your gateway
- Start using it

**Gateway:**
- Validates their API key
- Tracks usage
- Blocks if expired

### Step 4: Follow Up

**After 1 week:**
```bash
python -m trials show john@acmecorp.com
```

**See:**
- Usage count
- Days remaining
- Status

**Email them:**
- "How's it going? You've used it X times..."

### Step 5: Convert to Paid

**They say:** "We love it! Want to keep using it."

**You run:**
```bash
python -m trials convert john@acmecorp.com
```

**Then:**
- Send invoice
- They pay
- Keep their API key active (or extend expiration)

---

## 📋 Complete Workflow

### After Demo Call:

1. **Create Trial:**
   ```bash
   python -m trials create email@company.com "Company" 14
   ```

2. **Copy API Key** from output

3. **Send Welcome Email** (use template)

4. **They Integrate** (using SDK)

5. **Track Usage:**
   ```bash
   python -m trials list  # See all trials
   python -m trials show email@company.com  # See specific trial
   ```

6. **Follow Up** (after 1 week)

7. **Convert to Paid** (if they want to continue)

---

## 🎯 What This Gives You

**Now You Can:**
- ✅ Create trial accounts instantly
- ✅ Generate unique API keys
- ✅ Track who's using what
- ✅ See usage stats
- ✅ Manage expiration
- ✅ Convert to paid

**For Your First 10 Customers:**
- This is perfect
- Manual but works
- Easy to use
- No complex setup needed

**Later (When You Have More Customers):**
- Build proper user dashboard
- Add self-signup
- Add Stripe billing
- Automate everything

---

## 💡 Key Points

**API Keys:**
- Format: `fw_live_abc123xyz...`
- Unique per customer
- Stored in `trials.json`
- Validated by gateway

**Usage Tracking:**
- Gateway increments usage count
- You can see who's using it
- Helps with follow-up

**Expiration:**
- Default: 14 days
- Can customize
- Gateway blocks expired keys

---

## 🚀 You're Ready!

**Now you can:**
1. Do demo calls
2. Create trial accounts
3. Send API keys
4. Track usage
5. Convert to paid

**The system is simple but works!**

Try it:
```bash
python -m trials create test@example.com "Test Company" 14
python -m trials list
```

This gives you everything you need for manual trial management!

