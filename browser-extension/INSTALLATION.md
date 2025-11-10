# AI Prompt Firewall - Browser Extension Installation Guide

## Overview

The AI Prompt Firewall browser extension automatically protects your employees from leaking secrets, PII, and prompt injection attacks when using ChatGPT, Claude, Gemini, and other LLM services.

## Prerequisites

- Google Chrome browser (version 88 or later)
- Access to the AI Prompt Firewall gateway (deployed gateway URL)
- Admin access to install browser extensions (for enterprise deployment)

## Installation Steps

### Step 1: Download the Extension

1. Download the extension zip file: `aifirewall-extension-v1.0.0.zip`
2. Extract the zip file to a folder (e.g., `aifirewall-extension`)

### Step 2: Install in Chrome

**Option A: Manual Installation (Recommended for Testing)**

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the extracted extension folder (the folder containing `manifest.json`)
5. The extension should now appear in your extensions list

**Option B: Enterprise Deployment**

For enterprise deployment, use Chrome Enterprise policies to deploy the extension automatically to all users.

### Step 3: Configure Gateway URL

1. Click the AI Prompt Firewall extension icon in your Chrome toolbar
2. In the popup, enter your gateway URL (e.g., `https://your-gateway.railway.app`)
3. Click **Test** to verify the connection
4. You should see "✓ Connection successful" if configured correctly

### Step 4: Verify Installation

1. Open ChatGPT, Claude, or Gemini in a new tab
2. Try sending a message with a secret (e.g., "My AWS key is AKIAIOSFODNN7EXAMPLE")
3. The request should be blocked with a security violation message
4. Check the extension popup - you should see the "Blocked" count increase

## Configuration

### Gateway URL

The gateway URL is where the extension sends requests for scanning. This should be your deployed AI Prompt Firewall gateway.

**Examples:**
- Local development: `http://localhost:8000`
- Production: `https://your-gateway.railway.app`
- Custom domain: `https://firewall.yourcompany.com`

### Enable/Disable

You can temporarily disable the firewall by toggling the "Enable Firewall" switch in the extension popup. This is useful for troubleshooting.

### Statistics

The extension tracks:
- **Blocked**: Number of requests blocked due to security violations
- **Allowed**: Number of requests that passed security checks
- **Errors**: Number of errors encountered (e.g., gateway unavailable)

## Troubleshooting

### Extension Not Blocking Requests

1. **Check if extension is enabled**: Look for the extension icon in your toolbar. If it's grayed out, click it to enable.
2. **Verify gateway URL**: Click the extension icon and test the connection. Make sure the gateway is accessible.
3. **Check browser console**: Open Developer Tools (F12) and check for errors in the Console tab.
4. **Verify permissions**: Go to `chrome://extensions/`, find AI Prompt Firewall, and ensure all permissions are granted.

### Connection Test Fails

1. **Check gateway URL**: Make sure the URL is correct and includes `http://` or `https://`
2. **Verify gateway is running**: Open the gateway URL in your browser. You should see a health check response.
3. **Check CORS settings**: Ensure your gateway allows requests from Chrome extensions.
4. **Check firewall/network**: Make sure your network/firewall allows connections to the gateway.

### Requests Not Being Intercepted

1. **Refresh the page**: After installing the extension, refresh any open LLM tabs.
2. **Check supported sites**: The extension works with:
   - ChatGPT (chat.openai.com)
   - Claude (claude.ai)
   - Gemini/Bard (bard.google.com, gemini.google.com)
3. **Verify webRequest permissions**: Check that the extension has webRequest permissions in `chrome://extensions/`

### Extension Icon Not Showing

1. **Pin the extension**: Right-click the extension icon and select "Pin" to keep it visible
2. **Check extension is installed**: Go to `chrome://extensions/` and verify the extension is listed and enabled

## Supported LLM Services

- ✅ OpenAI ChatGPT (chat.openai.com)
- ✅ Anthropic Claude (claude.ai)
- ✅ Google Gemini/Bard (bard.google.com, gemini.google.com)

## Security Notes

- The extension intercepts requests **before** they reach the LLM API
- All requests are scanned locally by the gateway
- No data is stored in the extension itself
- The extension fails open (allows requests) if the gateway is unavailable

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the gateway logs for detailed error messages
- Contact support: [your-support-email]

## Version History

- **v1.0.0** (Current)
  - Initial release
  - Support for OpenAI, Anthropic, Google APIs
  - Gateway URL configuration
  - Statistics tracking
  - Blocking UI overlay

