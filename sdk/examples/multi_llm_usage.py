"""Example usage of AI Prompt Firewall with multiple LLM providers."""

# OpenAI Example
from aifirewall import OpenAI

openai_client = OpenAI(
    api_key="your-openai-key",
    firewall_url="http://localhost:8000"
)

response = openai_client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
print("OpenAI:", response.choices[0].message.content)


# Anthropic (Claude) Example
from aifirewall import Anthropic

anthropic_client = Anthropic(
    api_key="your-anthropic-key",
    firewall_url="http://localhost:8000"
)

response = anthropic_client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=100,
    messages=[{"role": "user", "content": "Hello!"}]
)
print("Claude:", response["content"][0]["text"])


# Google (Gemini) Example
from aifirewall import Google

google_client = Google(
    api_key="your-google-key",
    firewall_url="http://localhost:8000"
)

response = google_client.models.generate_content(
    model="gemini-pro",
    contents=[{"parts": [{"text": "Hello!"}]}]
)
print("Gemini:", response["candidates"][0]["content"]["parts"][0]["text"])

