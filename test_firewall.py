from aifirewall import OpenAI

# Your Railway gateway URL
client = OpenAI(
    api_key="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",
    firewall_url="https://llmintercept-production.up.railway.app"
)

# Test: Try to send a secret (should be blocked)
print("Testing firewall...")
try:
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "My AWS key is AKIAIOSFODNN7EXAMPLE"}]
    )
    print("FAILED - Secret got through!")
except Exception as e:
    print("SUCCESS - Firewall blocked it!")
    print(f"Error: {e}")
