# What The Customer Actually Experiences - SIMPLE VERSION

## 🎯 The Reality: It's Actually Super Simple

**What you tell customers:**

"Instead of using OpenAI directly, use our SDK. It's literally 2 lines different."

---

## 📧 What You Send Them

```
Hi John,

Great demo! Here's how to get started:

1. Install: pip install aifirewall

2. Change your code from:
   from openai import OpenAI
   client = OpenAI(api_key="your-key")

   To:
   from aifirewall import OpenAI
   client = OpenAI(
       api_key="your-key",
       firewall_url="https://your-gateway.com"
   )

3. That's it! Everything else stays the same.

Your requests are now automatically protected.

Questions? Just reply to this email.

Best,
[Your Name]
```

---

## 💻 What They Do (2 Minutes)

### Before (Their Current Code):
```python
from openai import OpenAI

client = OpenAI(api_key="sk-...")
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### After (With Your Firewall):
```python
from aifirewall import OpenAI  # ← Changed this line

client = OpenAI(
    api_key="sk-...",
    firewall_url="https://your-gateway.com"  # ← Added this line
)
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello"}]
)
```

**That's it. 2 lines changed.**

---

## ✅ What Happens

**They use it exactly like before:**
- Same code
- Same API calls
- Same responses

**But now:**
- Secrets are blocked automatically
- PII is redacted automatically
- Injection attacks are blocked automatically

**They don't need to:**
- Understand how it works
- Configure anything
- Change their workflow
- Learn new APIs

---

## 🎯 The Simple Truth

**For Customers:**
1. Install SDK: `pip install aifirewall`
2. Change import: `from aifirewall import OpenAI`
3. Add firewall URL: `firewall_url="https://your-gateway.com"`
4. Done. Everything else is the same.

**That's it. 2 minutes.**

---

## 💡 Why It's Simple

**Your SDK is a drop-in replacement:**
- Same interface as OpenAI
- Same methods
- Same responses
- Just routes through your gateway

**They don't need to:**
- Learn anything new
- Change their code structure
- Understand security
- Configure policies

**It just works.**

---

## 📋 What You Actually Need To Tell Them

**Email Template:**

```
Hi [Name],

Here's your trial access:

1. Install: pip install aifirewall

2. Use this instead of OpenAI:
   from aifirewall import OpenAI
   client = OpenAI(
       api_key="your-openai-key",
       firewall_url="https://your-gateway.com"
   )

That's it! Your code works exactly the same, but now it's protected.

Questions? Reply to this email.

Best,
[Your Name]
```

**That's the entire onboarding.**

---

## 🚀 The Reality Check

**What I Was Overcomplicating:**
- ❌ API key management
- ❌ Trial accounts
- ❌ Complex setup
- ❌ Configuration

**What Customers Actually Need:**
- ✅ Install SDK
- ✅ Change 2 lines of code
- ✅ Done

**It's that simple.**

---

## 💻 Real Example

**Their current code:**
```python
from openai import OpenAI

client = OpenAI(api_key="sk-abc123")
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.choices[0].message.content)
```

**With your firewall:**
```python
from aifirewall import OpenAI  # ← Changed

client = OpenAI(
    api_key="sk-abc123",
    firewall_url="https://your-gateway.com"  # ← Added
)
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello"}]
)
print(response.choices[0].message.content)
```

**Same code. Same result. Just protected.**

---

## 🎯 Bottom Line

**For Customers:**
- Install SDK
- Change 2 lines
- Done

**For You:**
- Give them gateway URL
- They use it
- You track usage (optional)

**It's not complicated. It's simple.**

The trial system I built is just for YOU to track who has trials. Customers don't need to know about it. They just use the SDK.

Does this make more sense?

