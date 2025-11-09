# Frontend Testing Guide

## 🎯 Quick Start

### Option 1: Simple HTML Test Page (Easiest)

1. **Open the test page:**
   ```bash
   open test_frontend.html
   ```
   Or navigate to: `file:///Users/maxkempler/Documents/aifirewall/test_frontend.html`

2. **Make sure the gateway is running:**
   ```bash
   source venv/bin/activate
   export OPENAI_API_KEY="your-key"
   python -m gateway.server
   ```

3. **Test the firewall:**
   - Try the "Clean Request" - should succeed
   - Try the "Secret Detection" - should be blocked
   - Try the "Prompt Injection" - should be blocked
   - Watch the statistics update in real-time

### Option 2: Full React Dashboard

1. **Start the dashboard (if not already running):**
   ```bash
   cd dashboard
   npm run dev
   ```

2. **Open in browser:**
   - Navigate to: http://localhost:3000
   - You'll see:
     - **Dashboard** - Overview with metrics and recent violations
     - **Violations** - All blocked requests
     - **Logs** - Complete audit trail
     - **Policies** - Current security policies

3. **Test from the dashboard:**
   - The dashboard automatically refreshes every 5 seconds
   - Send test requests using curl or the HTML test page
   - Watch violations appear in real-time

### Option 3: Direct API Testing

Use curl or any HTTP client:

```bash
# Test clean request
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello!"}]}'

# Test secret blocking
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"AWS key: AKIAIOSFODNN7EXAMPLE"}]}'

# View violations
curl http://localhost:8000/api/violations | python -m json.tool

# View logs
curl http://localhost:8000/api/logs | python -m json.tool
```

## 🎨 What You'll See

### HTML Test Page Features:
- ✅ **4 Test Scenarios** - Clean, Secrets, Injection, Custom
- ✅ **Real-time Statistics** - Total requests, blocked, allowed, violations
- ✅ **Visual Feedback** - Color-coded results (green=allowed, yellow=blocked, red=error)
- ✅ **Violation Details** - See exactly what was detected
- ✅ **Links** - Quick access to dashboard and API docs

### React Dashboard Features:
- 📊 **Dashboard** - Overview metrics, charts, recent violations
- 🚫 **Violations** - Detailed view of all blocked requests
- 📝 **Logs** - Complete audit trail with timestamps
- ⚙️ **Policies** - View and manage security policies

## 🔧 Troubleshooting

**Dashboard not loading?**
- Make sure gateway is running: `curl http://localhost:8000/health`
- Check dashboard is running: `curl http://localhost:3000`
- Check browser console for errors

**CORS errors?**
- Gateway has CORS enabled for all origins (configure for production)

**API not responding?**
- Check gateway logs
- Verify OPENAI_API_KEY is set
- Check firewall.db exists (created automatically)

## 📱 Testing Checklist

- [ ] Clean requests are allowed
- [ ] Secrets are blocked (AWS keys, API keys)
- [ ] Prompt injection is blocked
- [ ] Violations appear in dashboard
- [ ] Logs are being recorded
- [ ] Statistics update in real-time

