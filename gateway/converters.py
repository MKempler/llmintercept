"""LLM format converters for multi-provider support."""
from typing import List, Dict, Any, Optional


def extract_prompt_text_openai(messages: List[Dict[str, str]]) -> str:
    """Extract prompt text from OpenAI format."""
    return "\n".join([msg.get("content", "") for msg in messages])


def extract_prompt_text_anthropic(messages: List[Dict[str, Any]]) -> str:
    """Extract prompt text from Anthropic format."""
    prompt_parts = []
    for msg in messages:
        content = msg.get("content", "")
        if isinstance(content, list):
            # Anthropic can have content as list of content blocks
            text_parts = [block.get("text", "") for block in content if block.get("type") == "text"]
            prompt_parts.append("".join(text_parts))
        elif isinstance(content, str):
            prompt_parts.append(content)
    return "\n".join(prompt_parts)


def extract_prompt_text_google(contents: List[Dict[str, Any]]) -> str:
    """Extract prompt text from Google format."""
    prompt_parts = []
    for content in contents:
        parts = content.get("parts", [])
        for part in parts:
            text = part.get("text", "")
            if text:
                prompt_parts.append(text)
    return "\n".join(prompt_parts)


def convert_anthropic_to_openai_format(anthropic_request: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Anthropic request format to OpenAI-like format for detection."""
    messages = anthropic_request.get("messages", [])
    converted_messages = []
    
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        # Handle Anthropic's content format (can be string or list)
        if isinstance(content, list):
            text_content = ""
            for block in content:
                if block.get("type") == "text":
                    text_content += block.get("text", "")
            content = text_content
        elif not isinstance(content, str):
            content = str(content)
        
        converted_messages.append({
            "role": role,
            "content": content
        })
    
    return {
        "model": anthropic_request.get("model", "claude-3-opus-20240229"),
        "messages": converted_messages
    }


def convert_google_to_openai_format(google_request: Dict[str, Any], model: str) -> Dict[str, Any]:
    """Convert Google request format to OpenAI-like format for detection."""
    contents = google_request.get("contents", [])
    converted_messages = []
    
    for content in contents:
        parts = content.get("parts", [])
        for part in parts:
            text = part.get("text", "")
            if text:
                # Google doesn't have explicit roles in contents, assume user
                converted_messages.append({
                    "role": "user",
                    "content": text
                })
    
    return {
        "model": model,
        "messages": converted_messages
    }


def redact_anthropic_messages(messages: List[Dict[str, Any]], violations: List[Any]) -> List[Dict[str, Any]]:
    """Redact violations from Anthropic format messages."""
    redacted_messages = []
    
    for msg in messages:
        content = msg.get("content", "")
        redacted_content = content
        
        # Handle both string and list content formats
        if isinstance(content, str):
            for violation in violations:
                if violation.matched_text:
                    redacted_content = redacted_content.replace(
                        violation.matched_text,
                        "[REDACTED]"
                    )
        elif isinstance(content, list):
            # Redact from each text block
            redacted_blocks = []
            for block in content:
                if block.get("type") == "text":
                    text = block.get("text", "")
                    for violation in violations:
                        if violation.matched_text:
                            text = text.replace(violation.matched_text, "[REDACTED]")
                    redacted_blocks.append({**block, "text": text})
                else:
                    redacted_blocks.append(block)
            redacted_content = redacted_blocks
        
        redacted_messages.append({
            **msg,
            "content": redacted_content
        })
    
    return redacted_messages


def redact_google_contents(contents: List[Dict[str, Any]], violations: List[Any]) -> List[Dict[str, Any]]:
    """Redact violations from Google format contents."""
    redacted_contents = []
    
    for content in contents:
        parts = content.get("parts", [])
        redacted_parts = []
        
        for part in parts:
            text = part.get("text", "")
            redacted_text = text
            
            for violation in violations:
                if violation.matched_text:
                    redacted_text = redacted_text.replace(
                        violation.matched_text,
                        "[REDACTED]"
                    )
            
            redacted_parts.append({
                **part,
                "text": redacted_text
            })
        
        redacted_contents.append({
            **content,
            "parts": redacted_parts
        })
    
    return redacted_contents

