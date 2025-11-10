# SDK Quick Start Guide

Get started with the AI Prompt Firewall SDK in 5 minutes.

## Installation

```bash
pip install aifirewall
```

Or install manually:
```bash
cd sdk
pip install -e .
```

## Basic Usage

### OpenAI Example

```python
from aifirewall import OpenAI

# Initialize client
client = OpenAI(
    api_key="your-openai-api-key",
    firewall_url="https://your-gateway.railway.app"
)

# Make a request (same as OpenAI SDK)
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

### Test Blocking

```python
from aifirewall import OpenAI
from openai import APIError

client = OpenAI(
    api_key="your-openai-api-key",
    firewall_url="https://your-gateway.railway.app"
)

try:
    # This will be blocked (contains AWS key)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{
            "role": "user",
            "content": "My AWS key is AKIAIOSFODNN7EXAMPLE"
        }]
    )
except APIError as e:
    if e.status_code == 403:
        print("✅ Blocked! Security violation detected.")
        print(e.response.json())
```

## Environment Variables

Set these for easier configuration:

```bash
export FIREWALL_URL=https://your-gateway.railway.app
export OPENAI_API_KEY=sk-...
```

Then use:

```python
from aifirewall import OpenAI

client = OpenAI()  # Uses env vars automatically
```

## That's It!

The SDK is a drop-in replacement - no other code changes needed.

For more details, see [SDK_INTEGRATION_GUIDE.md](./SDK_INTEGRATION_GUIDE.md).

