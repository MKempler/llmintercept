"""Detection engine for secrets, PII, and prompt injection."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

from detection.secrets import SecretsDetector
from detection.injection import InjectionDetector

# PII detector is optional (requires presidio/spacy)
try:
    from detection.pii import PIIDetector
    PII_AVAILABLE = True
except ImportError:
    PII_AVAILABLE = False
    PIIDetector = None


class ViolationType(str, Enum):
    """Types of security violations."""
    SECRET = "secret"
    PII = "pii"
    PROMPT_INJECTION = "prompt_injection"
    CUSTOM_PATTERN = "custom_pattern"


@dataclass
class Violation:
    """Represents a security violation found in a prompt."""
    type: ViolationType
    severity: str  # "high", "medium", "low"
    message: str
    matched_text: str
    position: Optional[tuple[int, int]] = None
    metadata: Optional[Dict[str, Any]] = None


class DetectionEngine:
    """Main detection engine that coordinates all detectors."""
    
    def __init__(self):
        self.secrets_detector = SecretsDetector()
        self.injection_detector = InjectionDetector()
        if PII_AVAILABLE:
            self.pii_detector = PIIDetector()
        else:
            self.pii_detector = None
    
    def scan(self, text: str, context: Optional[Dict[str, Any]] = None) -> List[Violation]:
        """
        Scan text for security violations.
        
        Args:
            text: The text to scan
            context: Optional context (e.g., user ID, app name)
        
        Returns:
            List of violations found
        """
        violations = []
        
        # Check for secrets
        secrets = self.secrets_detector.detect(text)
        violations.extend([
            Violation(
                type=ViolationType.SECRET,
                severity="high",
                message=f"Potential secret detected: {s['type']}",
                matched_text=s['text'],
                metadata=s
            )
            for s in secrets
        ])
        
        # Check for PII (if available)
        if self.pii_detector:
            try:
                pii_entities = self.pii_detector.detect(text)
                violations.extend([
                    Violation(
                        type=ViolationType.PII,
                        severity="high",
                        message=f"PII detected: {entity['type']}",
                        matched_text=entity['text'],
                        metadata=entity
                    )
                    for entity in pii_entities
                ])
            except Exception:
                # PII detection failed, skip it
                pass
        
        # Check for prompt injection
        injection_attempts = self.injection_detector.detect(text)
        violations.extend([
            Violation(
                type=ViolationType.PROMPT_INJECTION,
                severity="high",
                message=f"Prompt injection detected: {attempt['pattern']}",
                matched_text=attempt['text'],
                metadata=attempt
            )
            for attempt in injection_attempts
        ])
        
        return violations

