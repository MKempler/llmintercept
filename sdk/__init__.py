"""Python SDK for AI Prompt Firewall."""
from sdk.client import OpenAI, Anthropic, Google

# For backward compatibility
Client = OpenAI

__all__ = ["OpenAI", "Anthropic", "Google", "Client"]
__version__ = "1.0.0"
