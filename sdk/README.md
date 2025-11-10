# AI Prompt Firewall SDK

Python SDK for AI Prompt Firewall - a security layer for LLM interactions.

## Installation

```bash
pip install aifirewall
```

Or install from source:
```bash
pip install -e .
```

## Quick Start

```python
from aifirewall import OpenAI

client = OpenAI(
    api_key="your-openai-key",
    firewall_url="https://your-gateway.railway.app"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## Features

- ✅ Drop-in replacement for OpenAI, Anthropic, Google SDKs
- ✅ Automatic security scanning
- ✅ Blocks secrets, PII, and prompt injection
- ✅ Full SDK compatibility
- ✅ Easy integration (5 lines of code)

## Documentation

- [Quick Start Guide](../docs/SDK_QUICKSTART.md)
- [Integration Guide](../docs/SDK_INTEGRATION_GUIDE.md)
- [Customer Onboarding](../docs/CUSTOMER_ONBOARDING.md)

## Examples

See `examples/` directory for usage examples:
- `basic_usage.py` - Basic usage examples
- `multi_llm_usage.py` - Using multiple LLM providers

## Requirements

- Python 3.8+
- OpenAI SDK (for OpenAI client)
- httpx (for Anthropic/Google clients)

## License

MIT License

