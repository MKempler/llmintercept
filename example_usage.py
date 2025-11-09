from aifirewall import OpenAI

client = OpenAI(
    api_key="your-openai-key",
    firewall_url="http://localhost:8000"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)

