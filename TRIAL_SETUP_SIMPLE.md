# Simple Trial Setup - How It Actually Works

## ✅ What You Have Now

**Trial Account System:**
- Creates accounts
- Generates API keys
- Tracks usage
- Manages expiration

**But Here's The Reality:**

For your first customers, you don't need complex API key validation. Here's the simpler approach:

---

## 🎯 The Simple Approach (For First 10 Customers)

### After Demo Call:

**They say:** "Yes, I want to try it!"

**You do:**

1. **Create Trial Account** (for tracking):
   ```bash
   python trials/cli.py create john@acmecorp.com "Acme Corp" 14
   ```
   
   This gives you:
   - Their email
   - Company name
   - API key (for tracking): `fw_live_abc123...`
   - Expiration date

2. **Send Them Instructions:**
   ```
   Hi John,
   
   Great demo! Here's how to get started:
   
   1. Install SDK:
      pip install aifirewall
   
   2. Use it:
      from aifirewall import OpenAI
      
      client = OpenAI(
          api_key="your-openai-key",  # THEIR OpenAI key
          firewall_url="https://your-gateway.railway.app"
      )
   
   3. That's it! Your requests are now protected.
   
   I'll check in next week to see how it's going.
   
   Best,
   [Your Name]
   ```

3. **They Use It:**
   - They use their own OpenAI API key
   - They point to your gateway URL
   - Your gateway scans their requests
   - Works immediately!

4. **You Track Usage:**
   - Check audit logs in dashboard
   - See who's using it
   - Follow up after 1 week

5. **Convert to Paid:**
   - They love it → They pay
   - You keep gateway running
   - They keep using it

---

## 💡 Key Insight

**They Don't Need a Firewall API Key (For Now)**

- They use their own OpenAI API key ✅
- They point to your gateway URL ✅
- Your gateway scans everything ✅
- You track by email/IP ✅

**The firewall API key system is for later when you want:**
- Rate limiting per customer
- Usage-based billing
- Multi-tenant isolation

**For first 10 customers:**
- Simple approach works
- They use their OpenAI key
- You track manually
- Convert to paid

---

## 📋 Complete Workflow

### Step 1: Demo Call
- Show product
- They're interested

### Step 2: Create Trial (For Tracking)
```bash
python trials/cli.py create email@company.com "Company" 14
```

### Step 3: Send Instructions
- Email with gateway URL
- Quick start guide
- Their OpenAI key (they provide)

### Step 4: They Integrate
- Install SDK
- Point to your gateway
- Start using

### Step 5: Track Usage
```bash
python trials/cli.py list  # See all trials
# Check dashboard for actual usage
```

### Step 6: Follow Up
- After 1 week
- "How's it going?"
- Collect feedback

### Step 7: Convert
- They love it → Pay
- Convert trial: `python trials/cli.py convert email@company.com`

---

## 🚀 You're Ready!

**What You Have:**
- ✅ Trial account system (for tracking)
- ✅ Email templates
- ✅ CLI tool
- ✅ Gateway that works

**What You Do:**
1. Demo call
2. Create trial account
3. Send gateway URL + instructions
4. They use their OpenAI key
5. Track usage
6. Convert to paid

**It's That Simple!**

The trial system helps you track who has trials, but they don't need a firewall API key - they just use your gateway URL with their own OpenAI key.

Try it:
```bash
python trials/cli.py create test@example.com "Test" 14
python trials/cli.py list
```

You're ready to start giving trials!

