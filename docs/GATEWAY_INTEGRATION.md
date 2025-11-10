# Gateway Proxy Integration Guide

## Overview

The AI Prompt Firewall Gateway Proxy sits between your applications and LLM APIs (OpenAI, Anthropic, Google), automatically scanning all requests and responses for security violations.

## Quick Start

### Step 1: Deploy the Gateway

Deploy the gateway to Railway, Render, Fly.io, or your preferred hosting platform. See [GATEWAY_DEPLOYMENT.md](./GATEWAY_DEPLOYMENT.md) for detailed deployment instructions.

**Quick Railway Deployment:**
1. Connect your GitHub repository to Railway
2. Select the gateway service
3. Set environment variables (see Configuration section)
4. Deploy

### Step 2: Get Your Gateway URL

After deployment, you'll receive a gateway URL like:
- `https://your-gateway.railway.app`
- `https://firewall.yourcompany.com`

### Step 3: Update Your Code

Replace your LLM API endpoint with the gateway URL. See examples below for each provider.

## Integration Examples

### OpenAI (ChatGPT)

**Before:**
```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-...",
    base_url="https://api.openai.com/v1"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**After:**
```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-...",
    base_url="https://your-gateway.railway.app/v1"  # Gateway URL
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**Using cURL:**
```bash
curl https://your-gateway.railway.app/v1/chat/completions \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Anthropic (Claude)

**Before:**
```python
import httpx

response = httpx.post(
    "https://api.anthropic.com/v1/messages",
    headers={
        "x-api-key": "sk-ant-...",
        "anthropic-version": "2023-06-01"
    },
    json={
        "model": "claude-3-opus-20240229",
        "max_tokens": 100,
        "messages": [{"role": "user", "content": "Hello!"}]
    }
)
```

**After:**
```python
import httpx

response = httpx.post(
    "https://your-gateway.railway.app/v1/anthropic/messages",  # Gateway URL
    headers={
        "x-api-key": "sk-ant-...",
        "anthropic-version": "2023-06-01"
    },
    json={
        "model": "claude-3-opus-20240229",
        "max_tokens": 100,
        "messages": [{"role": "user", "content": "Hello!"}]
    }
)
```

**Using cURL:**
```bash
curl https://your-gateway.railway.app/v1/anthropic/messages \
  -H "x-api-key: sk-ant-..." \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-opus-20240229",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Google (Gemini)

**Before:**
```python
import httpx

response = httpx.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=...",
    headers={"Content-Type": "application/json"},
    json={
        "contents": [{"parts": [{"text": "Hello!"}]}]
    }
)
```

**After:**
```python
import httpx

response = httpx.post(
    "https://your-gateway.railway.app/v1/google/models/gemini-pro:generateContent",  # Gateway URL
    headers={
        "Authorization": "Bearer YOUR_GOOGLE_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "contents": [{"parts": [{"text": "Hello!"}]}]
    }
)
```

**Using cURL:**
```bash
curl https://your-gateway.railway.app/v1/google/models/gemini-pro:generateContent \
  -H "Authorization: Bearer YOUR_GOOGLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "Hello!"}]}]
  }'
```

## API Endpoints

The gateway provides the following endpoints:

### OpenAI
- **Endpoint:** `POST /v1/chat/completions`
- **Compatible with:** OpenAI Python SDK, OpenAI Node.js SDK, direct API calls

### Anthropic
- **Endpoint:** `POST /v1/anthropic/messages`
- **Compatible with:** Anthropic Python SDK, Anthropic Node.js SDK, direct API calls

### Google
- **Endpoint:** `POST /v1/google/models/{model}:generateContent`
- **Compatible with:** Google Generative AI SDK, direct API calls

## Authentication

### Option 1: Pass API Key in Request (Recommended)

Include your LLM provider API key in the request headers:

- **OpenAI:** `Authorization: Bearer sk-...`
- **Anthropic:** `x-api-key: sk-ant-...`
- **Google:** `Authorization: Bearer YOUR_GOOGLE_API_KEY`

The gateway will forward your API key to the LLM provider.

### Option 2: Gateway API Key (Optional)

For additional security, you can require a gateway API key:

1. Set `FIREWALL_API_KEY` environment variable on gateway
2. Include in requests: `X-API-Key: your-firewall-api-key`

This adds an extra layer of authentication to your gateway.

## Response Format

The gateway returns responses in the same format as the original LLM provider, with optional firewall metadata:

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "choices": [...],
  "usage": {...},
  "firewall_metadata": {
    "redacted": true,
    "violations": [...],
    "action": "redact"
  }
}
```

## Error Handling

### Blocked Request (403)

If a request is blocked due to security violations:

```json
{
  "error": {
    "message": "Request blocked due to security violations",
    "type": "security_violation",
    "violations": [
      {
        "type": "secret",
        "severity": "high",
        "message": "Potential secret detected: AWS Access Key",
        "matched_text": "AKIAIOSFODNN7EXAMPLE"
      }
    ]
  }
}
```

### Gateway Error (502)

If the gateway cannot reach the LLM provider:

```json
{
  "error": {
    "message": "Unable to connect to OpenAI API",
    "type": "gateway_error",
    "code": "upstream_error"
  }
}
```

## Testing

### Test Health Endpoint

```bash
curl https://your-gateway.railway.app/health
```

Should return:
```json
{"status": "healthy"}
```

### Test Blocking

Try sending a request with a secret:

```bash
curl https://your-gateway.railway.app/v1/chat/completions \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "My AWS key is AKIAIOSFODNN7EXAMPLE"}]
  }'
```

Should return 403 with violation details.

## Dashboard Access

Access the dashboard to view violations, manage policies, and monitor activity:

- **URL:** `https://your-gateway.railway.app` (dashboard deployed separately)
- **Authentication:** Set `FIREWALL_API_KEY` and use `Authorization: Bearer` header

## Best Practices

1. **Use HTTPS:** Always use HTTPS for production gateways
2. **Environment Variables:** Store gateway URL in environment variables
3. **Error Handling:** Handle 403 (blocked) and 502 (gateway error) responses
4. **Monitoring:** Check dashboard regularly for violations
5. **Rate Limiting:** Gateway includes rate limiting - configure as needed

## Troubleshooting

### Requests Not Being Blocked

1. Check gateway is running: `curl https://your-gateway.railway.app/health`
2. Verify endpoint URL is correct
3. Check gateway logs for errors

### CORS Errors

If using browser-based requests, ensure gateway CORS settings allow your origin:
- Set `CORS_ALLOWED_ORIGINS` environment variable
- Or allow all origins for development (not recommended for production)

### Slow Responses

1. Check gateway response time: `time curl https://your-gateway.railway.app/health`
2. Verify LLM provider API is responding
3. Check gateway logs for bottlenecks

## Next Steps

- See [GATEWAY_DEPLOYMENT.md](./GATEWAY_DEPLOYMENT.md) for deployment instructions
- See [GATEWAY_CONFIGURATION.md](./GATEWAY_CONFIGURATION.md) for environment variables
- See [SDK_INTEGRATION_GUIDE.md](./SDK_INTEGRATION_GUIDE.md) for SDK usage

