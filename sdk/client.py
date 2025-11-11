"""Python SDK for AI Prompt Firewall - Client implementations."""
import os
from typing import Optional, Dict, Any, List
from openai import OpenAI as OpenAIClient
from openai.types.chat import ChatCompletion
import httpx


class OpenAI:
    """
    Drop-in replacement for OpenAI client that routes through AI Prompt Firewall.
    
    Usage:
        from aifirewall import OpenAI
        
        client = OpenAI(
            api_key="your-openai-key",
            firewall_url="http://localhost:8000"
        )
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello!"}]
        )
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        firewall_url: Optional[str] = None,
        base_url: Optional[str] = None,
        **kwargs
    ):
        """
        Initialize firewall-protected OpenAI client.
        
        Args:
            api_key: OpenAI API key
            firewall_url: URL of the firewall gateway (defaults to env var or localhost)
            base_url: Override base URL (uses firewall_url if provided)
            **kwargs: Additional arguments passed to OpenAI client
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key required")
        
        # Use firewall URL as base URL
        self.firewall_url = firewall_url or os.getenv("FIREWALL_URL", "http://localhost:8000")
        base_url = base_url or f"{self.firewall_url}/v1"
        
        # Initialize OpenAI client with firewall as base URL
        self.client = OpenAIClient(
            api_key=self.api_key,
            base_url=base_url,
            **kwargs
        )
        
        # Expose chat completions for easy access
        self.chat = self.client.chat
    
    def __getattr__(self, name):
        """Delegate attribute access to underlying OpenAI client."""
        return getattr(self.client, name)


class Anthropic:
    """
    Drop-in replacement for Anthropic client that routes through AI Prompt Firewall.
    
    Usage:
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
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        firewall_url: Optional[str] = None,
        **kwargs
    ):
        """
        Initialize firewall-protected Anthropic client.
        
        Args:
            api_key: Anthropic API key
            firewall_url: URL of the firewall gateway (defaults to env var or localhost)
            **kwargs: Additional arguments (unused, for compatibility)
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key required")
        
        self.firewall_url = firewall_url or os.getenv("FIREWALL_URL", "http://localhost:8000")
        self._client = httpx.AsyncClient() if kwargs.get("async_client") else httpx.Client()
        self._is_async = kwargs.get("async_client", False)
    
    class Messages:
        """Messages API wrapper."""
        def __init__(self, parent: "Anthropic"):
            self.parent = parent
        
        def create(
            self,
            model: str,
            messages: List[Dict[str, Any]],
            max_tokens: int,
            temperature: Optional[float] = None,
            stream: Optional[bool] = False,
            **kwargs
        ):
            """Create a message through the firewall."""
            url = f"{self.parent.firewall_url}/v1/anthropic/messages"
            headers = {
                "x-api-key": self.parent.api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens
            }
            
            if temperature is not None:
                payload["temperature"] = temperature
            if stream:
                payload["stream"] = True
            
            response = self.parent._client.post(url, headers=headers, json=payload, timeout=60.0)
            response.raise_for_status()
            return response.json()
    
    @property
    def messages(self) -> Messages:
        """Access messages API."""
        return self.Messages(self)
    
    def __getattr__(self, name):
        """Delegate attribute access."""
        if name == "messages":
            return self.messages
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")


class Google:
    """
    Drop-in replacement for Google Gemini client that routes through AI Prompt Firewall.
    
    Usage:
        from aifirewall import Google
        
        client = Google(
            api_key="your-google-key",
            firewall_url="http://localhost:8000"
        )
        
        response = client.models.generate_content(
            model="gemini-pro",
            contents=[{"parts": [{"text": "Hello!"}]}]
        )
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        firewall_url: Optional[str] = None,
        **kwargs
    ):
        """
        Initialize firewall-protected Google client.
        
        Args:
            api_key: Google API key
            firewall_url: URL of the firewall gateway (defaults to env var or localhost)
            **kwargs: Additional arguments (unused, for compatibility)
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key required")
        
        self.firewall_url = firewall_url or os.getenv("FIREWALL_URL", "http://localhost:8000")
        self._client = httpx.AsyncClient() if kwargs.get("async_client") else httpx.Client()
        self._is_async = kwargs.get("async_client", False)
    
    class Models:
        """Models API wrapper."""
        def __init__(self, parent: "Google"):
            self.parent = parent
        
        def generate_content(
            self,
            model: str,
            contents: List[Dict[str, Any]],
            generation_config: Optional[Dict[str, Any]] = None,
            safety_settings: Optional[List[Dict[str, Any]]] = None,
            **kwargs
        ):
            """Generate content through the firewall."""
            url = f"{self.parent.firewall_url}/v1/google/models/{model}:generateContent"
            headers = {
                "Authorization": f"Bearer {self.parent.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "contents": contents
            }
            
            if generation_config:
                payload["generationConfig"] = generation_config
            if safety_settings:
                payload["safetySettings"] = safety_settings
            
            response = self.parent._client.post(url, headers=headers, json=payload, timeout=60.0)
            response.raise_for_status()
            return response.json()
    
    @property
    def models(self) -> Models:
        """Access models API."""
        return self.Models(self)
    
    def __getattr__(self, name):
        """Delegate attribute access."""
        if name == "models":
            return self.models
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")


# For backward compatibility
Client = OpenAI

# Export all classes
__all__ = ["OpenAI", "Anthropic", "Google", "Client"]
