# Customer Onboarding Guide

Welcome to AI Prompt Firewall! This guide helps you choose the right integration method and get started quickly.

## Integration Options

AI Prompt Firewall offers three integration methods:

### Option A: Browser Extension (Recommended for Employee Protection)

**Best for:** Protecting employees using ChatGPT, Claude, Gemini web interfaces

**Pros:**
- ✅ No code changes needed
- ✅ Works immediately after installation
- ✅ Protects all employees automatically
- ✅ Easy to deploy company-wide

**Cons:**
- ❌ Only works for web interfaces (not API calls)
- ❌ Requires browser installation

**Setup Time:** 5 minutes

---

### Option B: Gateway Proxy (Recommended for API Usage)

**Best for:** Applications using LLM APIs directly

**Pros:**
- ✅ Works with any LLM provider
- ✅ No code changes (just change API endpoint)
- ✅ Centralized security
- ✅ Works for all API calls

**Cons:**
- ❌ Requires gateway deployment
- ❌ Need to update API endpoints in code

**Setup Time:** 30 minutes (deployment + integration)

---

### Option C: SDK Integration (Recommended for Developers)

**Best for:** Python applications using LLM SDKs

**Pros:**
- ✅ Drop-in replacement (5 lines of code change)
- ✅ Full SDK compatibility
- ✅ Easy to integrate
- ✅ Works with existing code

**Cons:**
- ❌ Python only (for now)
- ❌ Requires code changes

**Setup Time:** 10 minutes

---

## Which Option Should I Choose?

### Choose Browser Extension If:
- You want to protect employees using ChatGPT/Claude/Gemini websites
- You don't want to modify any code
- You need quick deployment
- You're protecting end users, not applications

### Choose Gateway Proxy If:
- You have applications making LLM API calls
- You want centralized security
- You're using multiple LLM providers
- You want to protect API usage, not just web interfaces

### Choose SDK If:
- You're building Python applications
- You want the easiest code integration
- You're already using OpenAI/Anthropic/Google SDKs
- You want drop-in replacement

### Use Multiple Options

You can use multiple options together:
- **Browser Extension** for employee web usage
- **Gateway Proxy** or **SDK** for application API calls

---

## Quick Start Guides

### Browser Extension

1. **Download:** Get the extension package
2. **Install:** Follow [INSTALLATION.md](../browser-extension/INSTALLATION.md)
3. **Configure:** Set gateway URL in extension popup
4. **Test:** Try sending a secret in ChatGPT - should be blocked

**Time:** 5 minutes

---

### Gateway Proxy

1. **Deploy:** Follow [GATEWAY_DEPLOYMENT.md](./GATEWAY_DEPLOYMENT.md)
2. **Get URL:** Note your gateway URL (e.g., `https://your-gateway.railway.app`)
3. **Update Code:** Change API endpoint to gateway URL
4. **Test:** Make a request - should go through gateway

**Time:** 30 minutes

**See:** [GATEWAY_INTEGRATION.md](./GATEWAY_INTEGRATION.md) for code examples

---

### SDK

1. **Install:** `pip install aifirewall`
2. **Replace Import:** Change `from openai import OpenAI` to `from aifirewall import OpenAI`
3. **Add Firewall URL:** Add `firewall_url` parameter
4. **Test:** Make a request - should go through firewall

**Time:** 10 minutes

**See:** [SDK_QUICKSTART.md](./SDK_QUICKSTART.md) for quick start

---

## Testing Your Integration

### Test Blocking

Try sending a request with a secret:

**Browser Extension:**
1. Open ChatGPT
2. Type: "My AWS key is AKIAIOSFODNN7EXAMPLE"
3. Should see blocking message

**Gateway/SDK:**
```python
# This should return 403
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "My AWS key is AKIAIOSFODNN7EXAMPLE"}]
)
```

### Test Allowed Request

Try sending a normal request:

```python
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
# Should return normal response
```

### Check Dashboard

1. Access dashboard: `https://your-gateway.railway.app` (or dashboard URL)
2. View violations log
3. Check statistics
4. Manage policies

---

## Common Questions

### Do I need all three options?

No! Choose the option(s) that fit your use case:
- **Employees using web interfaces?** → Browser Extension
- **Applications using APIs?** → Gateway Proxy or SDK
- **Both?** → Use multiple options

### Can I use multiple options together?

Yes! They work independently:
- Browser Extension protects web usage
- Gateway/SDK protects API usage

### What if I'm not sure which to choose?

Start with **Browser Extension** (easiest) or **SDK** (if you're a developer). You can add other options later.

### Do I need to deploy a gateway?

- **Browser Extension:** Yes, need gateway URL
- **Gateway Proxy:** Yes, need to deploy gateway
- **SDK:** Yes, need gateway URL

### How do I get a gateway?

See [GATEWAY_DEPLOYMENT.md](./GATEWAY_DEPLOYMENT.md) for deployment instructions.

---

## Next Steps

1. **Choose your integration method** (see above)
2. **Follow the quick start guide** for your chosen method
3. **Test blocking** with a test secret
4. **Check dashboard** for violations
5. **Configure policies** as needed

## Support

- **Documentation:** See docs in this directory
- **Troubleshooting:** Check method-specific troubleshooting guides
- **Support:** Contact [your-support-email]

## Resources

- [Browser Extension Installation](../browser-extension/INSTALLATION.md)
- [Gateway Deployment](./GATEWAY_DEPLOYMENT.md)
- [Gateway Integration](./GATEWAY_INTEGRATION.md)
- [SDK Quick Start](./SDK_QUICKSTART.md)
- [SDK Integration Guide](./SDK_INTEGRATION_GUIDE.md)

---

**Ready to get started?** Choose your integration method above and follow the quick start guide!

