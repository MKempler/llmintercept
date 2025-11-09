"""Action execution for policy violations."""
from typing import Dict, Any, List
from policy import Action
from detection import Violation


def execute_action(action: Action, text: str, violations: List[Violation]) -> Dict[str, Any]:
    """
    Execute policy action on text.
    
    Args:
        action: Action to take
        text: Original text
        violations: List of violations
    
    Returns:
        Result with modified text and metadata
    """
    if action == Action.BLOCK:
        return {
            "allowed": False,
            "text": None,
            "reason": "Request blocked due to security violations"
        }
    
    elif action == Action.REDACT:
        # Redact matched text - use smart redaction for PII
        redacted_text = text
        redacted_count = 0
        
        for violation in violations:
            if violation.matched_text:
                # Use different redaction patterns based on type
                if violation.type.value == "pii":
                    # For PII, use type-specific redaction
                    if "email" in violation.message.lower():
                        redacted_text = redacted_text.replace(
                            violation.matched_text,
                            "[EMAIL_REDACTED]"
                        )
                    elif "phone" in violation.message.lower():
                        redacted_text = redacted_text.replace(
                            violation.matched_text,
                            "[PHONE_REDACTED]"
                        )
                    elif "ssn" in violation.message.lower() or "social" in violation.message.lower():
                        redacted_text = redacted_text.replace(
                            violation.matched_text,
                            "[SSN_REDACTED]"
                        )
                    else:
                        redacted_text = redacted_text.replace(
                            violation.matched_text,
                            "[PII_REDACTED]"
                        )
                else:
                    # For other types, generic redaction
                    redacted_text = redacted_text.replace(
                        violation.matched_text,
                        "[REDACTED]"
                    )
                redacted_count += 1
        
        return {
            "allowed": True,
            "text": redacted_text,
            "redacted": True,
            "redacted_count": redacted_count
        }
    
    elif action == Action.WARN:
        return {
            "allowed": True,
            "text": text,
            "warned": True,
            "violations": [v.type.value for v in violations]
        }
    
    else:  # ALLOW
        return {
            "allowed": True,
            "text": text
        }

