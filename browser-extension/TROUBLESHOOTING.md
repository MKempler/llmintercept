# Troubleshooting Guide - AI Prompt Firewall Browser Extension

## Common Issues and Solutions

### Issue: Extension Not Blocking Requests

**Symptoms:**
- Requests to ChatGPT/Claude/Gemini go through without blocking
- No security violation messages appear

**Solutions:**

1. **Verify Extension is Enabled**
   - Click the extension icon in Chrome toolbar
   - Ensure "Enable Firewall" toggle is ON (green)
   - If disabled, toggle it on

2. **Check Gateway Connection**
   - Open extension popup
   - Verify gateway URL is correct
   - Click "Test" button
   - If test fails, check gateway URL and network connectivity

3. **Refresh LLM Pages**
   - Close and reopen ChatGPT/Claude/Gemini tabs
   - Extension needs to inject into pages after installation

4. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for errors related to the extension
   - Common errors:
     - `Failed to fetch` → Gateway URL incorrect or gateway down
     - `CORS error` → Gateway CORS settings need updating
     - `Permission denied` → Extension permissions not granted

---

### Issue: Connection Test Fails

**Symptoms:**
- "Test" button shows error
- Error message: "Connection failed"

**Solutions:**

1. **Verify Gateway URL Format**
   - Must include `http://` or `https://`
   - No trailing slash (or consistent trailing slash)
   - Example: `https://your-gateway.railway.app`

2. **Check Gateway is Running**
   - Open gateway URL in browser
   - Should see: `{"status": "healthy"}`
   - If not, gateway is down or URL is wrong

3. **Check Network/Firewall**
   - Gateway might be blocked by corporate firewall
   - Try accessing gateway URL directly in browser
   - Check if VPN is interfering

4. **Verify CORS Settings**
   - Gateway must allow Chrome extension origins
   - Check gateway CORS configuration
   - Should allow: `chrome-extension://*`

---

### Issue: Extension Icon Not Showing

**Symptoms:**
- Can't find extension icon in Chrome toolbar
- Extension installed but not visible

**Solutions:**

1. **Pin the Extension**
   - Click puzzle piece icon (extensions menu)
   - Find "AI Prompt Firewall"
   - Click pin icon to keep it visible

2. **Check Extension is Enabled**
   - Go to `chrome://extensions/`
   - Find "AI Prompt Firewall"
   - Ensure toggle is ON

3. **Reinstall Extension**
   - Remove extension from `chrome://extensions/`
   - Reload unpacked extension
   - Icon should reappear

---

### Issue: Statistics Not Updating

**Symptoms:**
- Blocked/Allowed counts stay at 0
- Stats don't increment after requests

**Solutions:**

1. **Verify Requests Are Being Intercepted**
   - Check browser console for extension messages
   - Look for "BLOCKED" or "ALLOWED" messages
   - If no messages, extension might not be intercepting

2. **Check Storage Permissions**
   - Go to `chrome://extensions/`
   - Find AI Prompt Firewall
   - Ensure "storage" permission is granted

3. **Reset Statistics**
   - Open extension popup
   - Click "Reset Stats" button
   - Make a test request
   - Stats should update

---

### Issue: Blocking UI Not Showing

**Symptoms:**
- Request is blocked (see in console)
- But no blocking overlay appears on page

**Solutions:**

1. **Check Content Script Injection**
   - Open Developer Tools (F12)
   - Go to Sources tab
   - Look for `content.js` in page scripts
   - If missing, content script didn't inject

2. **Verify Page is Supported**
   - Extension only works on:
     - chat.openai.com
     - claude.ai
     - bard.google.com
     - gemini.google.com
   - Other sites won't show blocking UI

3. **Check for JavaScript Errors**
   - Open Console tab
   - Look for errors from content script
   - Fix any JavaScript errors

---

### Issue: Gateway Returns 403 But Request Still Goes Through

**Symptoms:**
- Gateway blocks request (403 response)
- But LLM request completes anyway

**Solutions:**

1. **Check webRequest API**
   - Extension uses Chrome webRequest API
   - Verify extension has "webRequest" permission
   - Check manifest.json includes permission

2. **Verify Request Cancellation**
   - Extension should cancel original request when blocked
   - Check background.js for `cancel: true` return
   - If not canceling, check webRequest listener

3. **Check for Race Conditions**
   - Multiple interceptors might conflict
   - Disable other extensions temporarily
   - Test with only AI Prompt Firewall enabled

---

### Issue: Extension Slows Down Browser

**Symptoms:**
- Browser feels slower after installing extension
- Pages load slower

**Solutions:**

1. **Check Gateway Response Time**
   - Gateway might be slow
   - Test gateway health endpoint response time
   - Optimize gateway if needed

2. **Verify Extension Performance**
   - Open Chrome Task Manager (Shift+Esc)
   - Check extension CPU/memory usage
   - Should be minimal

3. **Disable for Non-LLM Sites**
   - Extension only activates on LLM sites
   - Shouldn't affect other sites
   - If it does, check content script matches

---

## Getting More Help

### Debug Mode

Enable debug logging:
1. Open extension popup
2. Open Developer Tools (right-click popup → Inspect)
3. Check Console for detailed logs

### Check Extension Logs

1. Go to `chrome://extensions/`
2. Find AI Prompt Firewall
3. Click "service worker" link (for background.js)
4. Check Console for errors

### Gateway Logs

Check gateway logs for:
- Request/response details
- Violation detection
- Error messages

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to fetch` | Gateway unreachable | Check gateway URL, network |
| `CORS error` | CORS not configured | Update gateway CORS settings |
| `Invalid URL` | Bad gateway URL format | Fix URL format |
| `Permission denied` | Missing permissions | Grant extension permissions |
| `Timeout` | Gateway too slow | Check gateway performance |

## Still Having Issues?

1. **Collect Information:**
   - Browser version
   - Extension version
   - Gateway URL
   - Error messages from console
   - Steps to reproduce

2. **Contact Support:**
   - Email: [your-support-email]
   - Include all collected information
   - Screenshots if helpful

