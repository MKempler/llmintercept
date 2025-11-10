"""Improved redaction utilities using Presidio anonymizer."""
from typing import List, Dict, Any
from detection import Violation
import re

try:
    from presidio_anonymizer import AnonymizerEngine
    from presidio_anonymizer.entities import OperatorConfig
    PRESIDIO_ANONYMIZER_AVAILABLE = True
except ImportError:
    PRESIDIO_ANONYMIZER_AVAILABLE = False


class RedactionEngine:
    """Enhanced redaction engine with context-aware redaction."""
    
    def __init__(self):
        self.anonymizer = None
        if PRESIDIO_ANONYMIZER_AVAILABLE:
            try:
                self.anonymizer = AnonymizerEngine()
            except Exception:
                self.anonymizer = None
    
    def redact_text(
        self,
        text: str,
        violations: List[Violation],
        preserve_context: bool = True
    ) -> str:
        """
        Redact violations from text with improved accuracy.
        
        Args:
            text: Text to redact
            violations: List of violations to redact
            preserve_context: Whether to preserve entity type in redaction
        
        Returns:
            Redacted text
        """
        if not violations:
            return text
        
        redacted_text = text
        
        # Group violations by type for better handling
        violations_by_type: Dict[str, List[Violation]] = {}
        for violation in violations:
            violation_type = violation.type.value
            if violation_type not in violations_by_type:
                violations_by_type[violation_type] = []
            violations_by_type[violation_type].append(violation)
        
        # Use Presidio anonymizer if available
        if self.anonymizer and PRESIDIO_ANONYMIZER_AVAILABLE:
            try:
                # Build analyzer results format for Presidio
                analyzer_results = []
                for violation in violations:
                    if violation.matched_text and violation.position:
                        start, end = violation.position
                    elif violation.matched_text:
                        # Find position in text
                        start = text.find(violation.matched_text)
                        end = start + len(violation.matched_text) if start >= 0 else start
                    else:
                        continue
                    
                    if start >= 0:
                        # Map violation type to Presidio entity type
                        entity_type = self._map_violation_to_entity(violation.type.value)
                        analyzer_results.append({
                            "start": start,
                            "end": end,
                            "score": 0.9,
                            "entity_type": entity_type
                        })
                
                if analyzer_results:
                    # Use Presidio anonymizer
                    anonymized = self.anonymizer.anonymize(
                        text=text,
                        analyzer_results=analyzer_results,
                        operators={
                            "PERSON": OperatorConfig("replace", {"new_value": "[PERSON]"}),
                            "EMAIL_ADDRESS": OperatorConfig("replace", {"new_value": "[EMAIL]"}),
                            "PHONE_NUMBER": OperatorConfig("replace", {"new_value": "[PHONE]"}),
                            "CREDIT_CARD": OperatorConfig("replace", {"new_value": "[CREDIT_CARD]"}),
                            "SSN": OperatorConfig("replace", {"new_value": "[SSN]"}),
                            "DEFAULT": OperatorConfig("replace", {"new_value": "[REDACTED]"}),
                        }
                    )
                    return anonymized.text
            except Exception:
                # Fall back to regex-based redaction
                pass
        
        # Fallback: Regex-based redaction with multiple passes
        # Sort violations by position (reverse) to avoid position shifts
        sorted_violations = sorted(
            violations,
            key=lambda v: v.position[0] if v.position and v.position[0] >= 0 else len(text),
            reverse=True
        )
        
        for violation in sorted_violations:
            if not violation.matched_text:
                continue
            
            matched = violation.matched_text
            
            # Create context-aware replacement
            if preserve_context:
                replacement = self._get_contextual_replacement(violation.type.value)
            else:
                replacement = "[REDACTED]"
            
            # Multiple redaction strategies to catch variations
            # 1. Exact match
            redacted_text = redacted_text.replace(matched, replacement)
            
            # 2. Case-insensitive match
            redacted_text = re.sub(
                re.escape(matched),
                replacement,
                redacted_text,
                flags=re.IGNORECASE
            )
            
            # 3. Match with optional whitespace variations
            escaped = re.escape(matched)
            # Replace spaces with flexible whitespace pattern
            flexible_pattern = escaped.replace(r'\ ', r'\s+')
            redacted_text = re.sub(
                flexible_pattern,
                replacement,
                redacted_text,
                flags=re.IGNORECASE
            )
        
        return redacted_text
    
    def _map_violation_to_entity(self, violation_type: str) -> str:
        """Map violation type to Presidio entity type."""
        mapping = {
            "pii": "PERSON",  # Default for PII
            "secret": "DEFAULT",
            "prompt_injection": "DEFAULT"
        }
        return mapping.get(violation_type.lower(), "DEFAULT")
    
    def _get_contextual_replacement(self, violation_type: str) -> str:
        """Get context-aware replacement text."""
        replacements = {
            "secret": "[SECRET]",
            "pii": "[PII]",
            "prompt_injection": "[BLOCKED_INJECTION]",
            "email": "[EMAIL]",
            "phone": "[PHONE]",
            "ssn": "[SSN]",
            "credit_card": "[CREDIT_CARD]"
        }
        return replacements.get(violation_type.lower(), "[REDACTED]")


def create_redaction_engine() -> RedactionEngine:
    """Create redaction engine instance."""
    return RedactionEngine()

