# SDK Integration Guide

## Overview

The AI Prompt Firewall SDK provides drop-in replacements for OpenAI, Anthropic, and Google LLM clients. Simply replace your existing client with the firewall-protected version.

## Installation

### Option 1: Install from PyPI (Recommended)

```bash
pip install aifirewall
```

### Option 2: Manual Installation

1. Download the SDK package
2. Extract to your project
3. Install dependencies:
   ```bash
   pip install openai httpx
   ```

4. Add to your Python path or install locally:
   ```bash
   cd sdk
   pip install -e .
   ```

## Quick Start

### OpenAI

**Before:**
```python
from openai import OpenAI

client = OpenAI(api_key="sk-...")
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**After:**
```python
from aifirewall import OpenAI

client = OpenAI(
    api_key="sk-...",
    firewall_url="https://your-gateway.railway.app"
)
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### Anthropic

```python
from aifirewall import Anthropic

client = Anthropic(
    api_key="sk-ant-...",
    firewall_url="https://your-gateway.railway.app"
)
response = client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=100,
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### Google

```python
from aifirewall import Google

client = Google(
    api_key="your-google-key",
    firewall_url="https://your-gateway.railway.app"
)
response = client.models.generate_content(
    model="gemini-pro",
    contents=[{"parts": [{"text": "Hello!"}]}]
)
```

## Configuration

### Environment Variables

Set firewall URL via environment variable:

```bash
export FIREWALL_URL=https://your-gateway.railway.app
```

Then use without specifying `firewall_url`:

```python
from aifirewall import OpenAI

client = OpenAI(api_key="sk-...")  # Uses FIREWALL_URL from env
```

### API Keys

**Option 1: Pass in constructor (Recommended)**
```python
client = OpenAI(api_key="sk-...")
```

**Option 2: Environment variable**
```bash
export OPENAI_API_KEY=sk-...
```
```python
client = OpenAI()  # Uses OPENAI_API_KEY from env
```

## Error Handling

### Blocked Requests

If a request is blocked, the SDK raises an exception:

```python
from aifirewall import OpenAI
from openai import APIError

client = OpenAI(
    api_key="sk-...",
    firewall_url="https://your-gateway.railway.app"
)

try:
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "My AWS key is AKIAIOSFODNN7EXAMPLE"}]
    )
except APIError as e:
    if e.status_code == 403:
        print("Request blocked:", e.response.json())
    else:
        print("Other error:", e)
```

### Gateway Errors

Handle gateway connectivity issues:

```python
import httpx
from aifirewall import OpenAI

try:
    client = OpenAI(
        api_key="sk-...",
        firewall_url="https://your-gateway.railway.app"
    )
    response = client.chat.completions.create(...)
except httpx.ConnectError:
    print("Cannot connect to gateway. Check gateway URL.")
except httpx.TimeoutException:
    print("Gateway timeout. Gateway may be slow or unavailable.")
```

## Advanced Usage

### Custom Timeout

```python
from aifirewall import OpenAI

client = OpenAI(
    api_key="sk-...",
    firewall_url="https://your-gateway.railway.app",
    timeout=30.0  # 30 second timeout
)
```

### Streaming Responses

```python
from aifirewall import OpenAI

client = OpenAI(
    api_key="sk-...",
    firewall_url="https://your-gateway.railway.app"
)

stream = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

**Note:** Streaming responses are not scanned by the firewall (security limitation).

### Async Usage

```python
import asyncio
from aifirewall import OpenAI

async def main():
    client = OpenAI(
        api_key="sk-...",
        firewall_url="https://your-gateway.railway.app"
    )
    
    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Hello!"}]
    )
    print(response.choices[0].message.content)

asyncio.run(main())
```

## API Reference

### OpenAI Client

```python
from aifirewall import OpenAI

client = OpenAI(
    api_key: str = None,  # OpenAI API key
    firewall_url: str = None,  # Gateway URL
    base_url: str = None,  # Override base URL
    timeout: float = 60.0,  # Request timeout
    **kwargs  # Additional OpenAI client arguments
)
```

**Methods:** Same as OpenAI Python SDK (fully compatible)

### Anthropic Client

```python
from aifirewall import Anthropic

client = Anthropic(
    api_key: str = None,  # Anthropic API key
    firewall_url: str = None,  # Gateway URL
    **kwargs
)

# Usage
response = client.messages.create(
    model: str,
    messages: List[Dict],
    max_tokens: int,
    temperature: float = None,
    stream: bool = False
)
```

### Google Client

```python
from aifirewall import Google

client = Google(
    api_key: str = None,  # Google API key
    firewall_url: str = None,  # Gateway URL
    **kwargs
)

# Usage
response = client.models.generate_content(
    model: str,
    contents: List[Dict],
    generation_config: Dict = None,
    safety_settings: List[Dict] = None
)
```

## Examples

See `sdk/examples/` directory for more examples:

- `basic_usage.py`: Basic usage examples
- `multi_llm_usage.py`: Using multiple LLM providers

## Testing

### Test Installation

```python
from aifirewall import OpenAI

# Should import without errors
print("SDK installed successfully")
```

### Test Connection

```python
from aifirewall import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    firewall_url="https://your-gateway.railway.app"
)

# Test health endpoint
import httpx
response = httpx.get("https://your-gateway.railway.app/health")
print(response.json())  # Should print {"status": "healthy"}
```

### Test Blocking

```python
from aifirewall import OpenAI
from openai import APIError

client = OpenAI(
    api_key="sk-test",
    firewall_url="https://your-gateway.railway.app"
)

try:
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "My secret is AKIAIOSFODNN7EXAMPLE"}]
    )
except APIError as e:
    if e.status_code == 403:
        print("✅ Blocking works! Request was blocked.")
    else:
        print(f"❌ Unexpected error: {e}")
```

## Troubleshooting

### Import Error

**Error:** `ModuleNotFoundError: No module named 'aifirewall'`

**Solution:**
```bash
pip install aifirewall
# Or if using manual installation:
pip install -e /path/to/sdk
```

### Connection Error

**Error:** `Cannot connect to gateway`

**Solutions:**
1. Check gateway URL is correct
2. Verify gateway is running: `curl https://your-gateway.railway.app/health`
3. Check network/firewall allows connections
4. Verify CORS settings if using browser

### Authentication Error

**Error:** `401 Unauthorized` or `403 Forbidden`

**Solutions:**
1. Check API key is correct
2. Verify gateway doesn't require `FIREWALL_API_KEY` (if it does, that's for admin endpoints, not LLM endpoints)
3. Check LLM provider API key is valid

## Best Practices

1. **Use Environment Variables:** Store `FIREWALL_URL` and API keys in environment variables
2. **Handle Errors:** Always handle `APIError` exceptions
3. **Set Timeouts:** Configure appropriate timeouts for your use case
4. **Monitor Logs:** Check gateway logs for violations and errors
5. **Test Blocking:** Verify blocking works with test secrets/PII

## Migration Guide

### Migrating from OpenAI SDK

1. Replace import:
   ```python
   # Before
   from openai import OpenAI
   
   # After
   from aifirewall import OpenAI
   ```

2. Add firewall_url:
   ```python
   # Before
   client = OpenAI(api_key="sk-...")
   
   # After
   client = OpenAI(
       api_key="sk-...",
       firewall_url="https://your-gateway.railway.app"
   )
   ```

3. No other changes needed! SDK is fully compatible.

### Migrating from Anthropic SDK

Similar process - replace import and add `firewall_url` parameter.

## Next Steps

- See [GATEWAY_INTEGRATION.md](./GATEWAY_INTEGRATION.md) for gateway setup
- See [GATEWAY_DEPLOYMENT.md](./GATEWAY_DEPLOYMENT.md) for deployment
- Check `sdk/examples/` for more examples

