# AI Prompt Firewall Browser Extension

A Chrome/Firefox extension that protects employees from accidentally leaking sensitive data when using LLM web interfaces like ChatGPT, Claude, and Gemini.

## Features

- 🛡️ **Automatic Protection** - Intercepts LLM API requests before they reach providers
- 🔒 **Multi-LLM Support** - Works with ChatGPT, Claude, and Gemini
- 🚫 **Real-time Blocking** - Blocks dangerous requests with clear violation details
- 📊 **Statistics Tracking** - Tracks blocked/allowed requests
- ⚙️ **Easy Configuration** - Simple popup UI for gateway URL and settings

## Installation

### Development Installation

1. Clone this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `browser-extension` directory
6. The extension icon should appear in your toolbar

### Production Installation

1. Install from Chrome Web Store (coming soon)
2. Or download `.crx` file for enterprise distribution

## Configuration

1. Click the extension icon in your browser toolbar
2. Set your Gateway URL (default: `http://localhost:8000`)
3. Toggle "Enable Firewall" on/off
4. View statistics (blocked/allowed/errors)

## How It Works

```
Employee uses chat.openai.com
    ↓
Extension intercepts API request
    ↓
Routes through YOUR gateway
    ↓
Gateway scans for secrets/PII/injection
    ↓
If blocked: Shows error UI, cancels request
If safe: Allows request to proceed
```

## Architecture

- **background.js** - Service worker that intercepts LLM API requests using `webRequest` API
- **content.js** - Content script that injects blocking UI and provides fetch/XHR fallback
- **popup.html/js** - Extension popup UI for configuration and statistics
- **manifest.json** - Extension configuration and permissions

## Supported LLM Providers

- ✅ **OpenAI (ChatGPT)** - `api.openai.com/v1/chat/completions`
- ✅ **Anthropic (Claude)** - `api.anthropic.com/v1/messages`
- ✅ **Google (Gemini)** - `generativelanguage.googleapis.com/v1beta/models/*:generateContent`

## Gateway Integration

The extension routes requests through your AI Prompt Firewall gateway:

- **OpenAI**: `{gateway_url}/v1/chat/completions`
- **Anthropic**: `{gateway_url}/v1/anthropic/messages`
- **Google**: `{gateway_url}/v1/google/models/{model}:generateContent`

## Error Handling

- **Gateway Unavailable**: Fails open (allows requests) to prevent breaking user experience
- **Network Errors**: Logs error, allows request to proceed
- **Invalid Responses**: Fails open with error logging

## Limitations

- **Streaming Responses**: Currently allows original request for streaming (future: proper streaming proxy)
- **webRequest Limitations**: Some edge cases may fall back to content script fetch wrapping
- **CORS**: Gateway must allow extension origins (already configured)

## Development

### Testing

1. Start the gateway: `python -m gateway.server`
2. Load extension in developer mode
3. Visit `chat.openai.com` and try sending a request with a secret
4. Should see blocking UI if secret detected

### Building

No build step required - extension uses vanilla JavaScript. Just load the `browser-extension` directory.

## Privacy

- Extension only intercepts LLM API requests
- All scanning happens on YOUR gateway (not sent to third parties)
- No data stored except statistics (blocked/allowed counts)
- Gateway URL configurable (can use your own infrastructure)

## License

Same as main AI Prompt Firewall project.

