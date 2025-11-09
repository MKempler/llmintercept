# AI Prompt Firewall

A security layer that sits between your applications and AI models, automatically scanning prompts and responses to block secrets, PII, prompt injection attacks, and other security risks.

## Features

- 🔒 **Secrets Detection** - Blocks API keys, passwords, tokens before they reach LLMs
- 🛡️ **PII Protection** - Detects and blocks SSN, emails, credit cards, phone numbers
- 🚫 **Prompt Injection Defense** - Catches jailbreak attempts and prompt injection attacks
- 📊 **Real-time Dashboard** - Monitor violations, manage policies, view audit logs
- 🔌 **Easy Integration** - Drop-in SDK replacement for OpenAI, Anthropic, and Google clients
- 🌐 **Multi-LLM Support** - Works with ChatGPT, Claude, Gemini, and more

## Quick Start

### Installation

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### Run the Gateway

**Production Mode (requires OpenAI API key):**
```bash
export OPENAI_API_KEY="your-openai-key"
python -m gateway.server
```

**Demo Mode (no API key needed - for public demos):**
```bash
export DEMO_MODE=true
python -m gateway.server
```

### Run the Dashboard

```bash
cd dashboard
npm install
npm start
```

### Use the SDK

**OpenAI (ChatGPT):**
```python
from aifirewall import OpenAI

client = OpenAI(
    api_key="your-openai-key",
    firewall_url="http://localhost:8000"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**Anthropic (Claude):**
```python
from aifirewall import Anthropic

client = Anthropic(
    api_key="your-anthropic-key",
    firewall_url="http://localhost:8000"
)

response = client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=100,
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**Google (Gemini):**
```python
from aifirewall import Google

client = Google(
    api_key="your-google-key",
    firewall_url="http://localhost:8000"
)

response = client.models.generate_content(
    model="gemini-pro",
    contents=[{"parts": [{"text": "Hello!"}]}]
)
```

## Architecture

- **Gateway** - FastAPI proxy server that intercepts LLM API calls (OpenAI, Anthropic, Google)
- **Detection Engine** - Scans for secrets, PII, and prompt injection patterns (LLM-agnostic)
- **Policy Engine** - Enforces block/redact/allow rules (works for all LLMs)
- **Dashboard** - Web UI for monitoring and management
- **SDK** - Python clients for OpenAI, Anthropic, and Google

## Development

See [MVP_PLAN.md](./MVP_PLAN.md) for detailed architecture and implementation plan.

