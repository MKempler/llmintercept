# AI Prompt Firewall - Browser Extension

Browser extension that automatically protects employees from leaking secrets, PII, and prompt injection attacks when using ChatGPT, Claude, Gemini, and other LLM services.

## Features

- 🛡️ **Automatic Protection** - Intercepts requests before they reach LLM APIs
- 🔒 **Blocks Secrets** - Prevents API keys, passwords, tokens from being sent
- 👤 **PII Protection** - Detects and blocks SSN, emails, credit cards, phone numbers
- 🚫 **Prompt Injection Defense** - Catches jailbreak attempts and injection attacks
- 📊 **Statistics Tracking** - Tracks blocked/allowed requests
- ⚙️ **Easy Configuration** - Simple gateway URL setup with connection testing

## Supported Services

- ✅ OpenAI ChatGPT (chat.openai.com)
- ✅ Anthropic Claude (claude.ai)
- ✅ Google Gemini/Bard (bard.google.com, gemini.google.com)

## Installation

See [INSTALLATION.md](./INSTALLATION.md) for detailed installation instructions.

**Quick Install:**
1. Download `aifirewall-extension-v1.0.0.zip`
2. Extract the zip file
3. Open Chrome → `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the extracted folder

## Configuration

1. Click the extension icon in Chrome toolbar
2. Enter your gateway URL (e.g., `https://your-gateway.railway.app`)
3. Click "Test" to verify connection
4. Toggle "Enable Firewall" to activate

## How It Works

1. Extension intercepts LLM API requests from your browser
2. Sends requests to your AI Prompt Firewall gateway
3. Gateway scans for security violations
4. If violations found, request is blocked and user sees blocking message
5. If safe, request proceeds normally

## Requirements

- Google Chrome (version 88+)
- AI Prompt Firewall gateway deployed and accessible
- Gateway URL configured in extension

## Documentation

- [Installation Guide](./INSTALLATION.md) - Step-by-step installation
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Changelog](./CHANGELOG.md) - Version history

## Support

For issues or questions:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review gateway logs
- Contact support: [your-support-email]

## Version

Current version: **1.0.0**

See [CHANGELOG.md](./CHANGELOG.md) for version history.
