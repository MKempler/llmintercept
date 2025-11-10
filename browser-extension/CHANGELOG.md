# Changelog - AI Prompt Firewall Browser Extension

All notable changes to the browser extension will be documented in this file.

## [1.0.0] - 2024-01-XX

### Added
- Initial release
- Support for OpenAI ChatGPT (chat.openai.com)
- Support for Anthropic Claude (claude.ai)
- Support for Google Gemini/Bard (bard.google.com, gemini.google.com)
- Gateway URL configuration in popup
- Connection test functionality
- Enable/disable toggle
- Statistics tracking (blocked, allowed, errors)
- Blocking UI overlay when requests are blocked
- Dashboard link in popup
- Manual installation support

### Features
- Automatically intercepts LLM API requests
- Scans requests for secrets, PII, and prompt injection
- Blocks requests with security violations
- Shows user-friendly blocking messages
- Tracks statistics locally
- Configurable gateway URL
- Connection testing

### Known Limitations
- Streaming responses not fully scanned (allows original request)
- Requires gateway to be accessible
- Chrome/Chromium browsers only

### Security
- Fails open if gateway unavailable (allows requests)
- No data stored except statistics
- All scanning happens on gateway server

