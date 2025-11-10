"""Detection engine for secrets, PII, and prompt injection with confidence scoring."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

from detection.secrets import SecretsDetector
from detection.injection import InjectionDetector

# Try to import enhanced ML-based injection detector
try:
    from detection.injection_ml import EnhancedInjectionDetector
    ML_INJECTION_AVAILABLE = True
except ImportError:
    ML_INJECTION_AVAILABLE = False
    EnhancedInjectionDetector = None

# Try to import custom patterns
try:
    from detection.custom_patterns import CustomPatternManager
    CUSTOM_PATTERNS_AVAILABLE = True
except ImportError:
    CUSTOM_PATTERNS_AVAILABLE = False
    CustomPatternManager = None

# PII detector is REQUIRED (uses presidio/spacy)
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
    confidence: float = 0.8  # Confidence score (0.0-1.0)
    
    def __post_init__(self):
        """Set severity based on confidence if not explicitly set."""
        if self.severity == "high" and self.confidence < 0.7:
            # Auto-adjust severity based on confidence
            if self.confidence >= 0.8:
                self.severity = "high"
            elif self.confidence >= 0.6:
                self.severity = "medium"
            else:
                self.severity = "low"


class DetectionEngine:
    """Main detection engine that coordinates all detectors."""
    
    def __init__(self, custom_pattern_manager: Optional[Any] = None):
        self.secrets_detector = SecretsDetector()
        
        # Use enhanced ML-based injection detector if available
        if ML_INJECTION_AVAILABLE and EnhancedInjectionDetector:
            self.injection_detector = EnhancedInjectionDetector()
        else:
            self.injection_detector = InjectionDetector()
        
        # Custom pattern manager (optional)
        self.custom_pattern_manager = custom_pattern_manager
        
        # PII detector is required
        if not PII_AVAILABLE:
            import warnings
            warnings.warn(
                "PII detection is not available. Install Presidio: "
                "pip install presidio-analyzer presidio-anonymizer spacy && "
                "python -m spacy download en_core_web_sm"
            )
            self.pii_detector = None
        else:
            try:
                self.pii_detector = PIIDetector()
            except Exception as e:
                import warnings
                warnings.warn(f"Failed to initialize PII detector: {e}")
                self.pii_detector = None
    
    def scan(self, text: str, context: Optional[Dict[str, Any]] = None) -> List[Violation]:
        """
        Scan text for security violations with confidence scoring.
        
        Args:
            text: The text to scan
            context: Optional context (e.g., user ID, app name, tenant_id)
        
        Returns:
            List of violations found with confidence scores
        """
        violations = []
        tenant_id = context.get("tenant_id") if context else None
        
        # Check for secrets
        secrets = self.secrets_detector.detect(text)
        violations.extend([
            Violation(
                type=ViolationType.SECRET,
                severity="high",
                message=f"Potential secret detected: {s['type']}",
                matched_text=s['text'],
                position=(s.get('start'), s.get('end')),
                metadata=s,
                confidence=s.get('confidence', 0.8)
            )
            for s in secrets
        ])
        
        # Check for PII (required)
        if self.pii_detector:
            try:
                pii_entities = self.pii_detector.detect(text)
                violations.extend([
                    Violation(
                        type=ViolationType.PII,
                        severity="high",
                        message=f"PII detected: {entity['type']}",
                        matched_text=entity['text'],
                        position=(entity.get('start'), entity.get('end')),
                        metadata=entity,
                        confidence=entity.get('confidence', entity.get('score', 0.8))
                    )
                    for entity in pii_entities
                ])
            except Exception as e:
                import logging
                logging.error(f"PII detection failed: {e}")
                # Don't skip - PII detection is critical
        
        # Check for prompt injection
        injection_attempts = self.injection_detector.detect(text)
        violations.extend([
            Violation(
                type=ViolationType.PROMPT_INJECTION,
                severity="high",
                message=f"Prompt injection detected: {attempt['pattern']}",
                matched_text=attempt['text'],
                position=(attempt.get('start'), attempt.get('end')),
                metadata=attempt,
                confidence=attempt.get('confidence', 0.8)
            )
            for attempt in injection_attempts
        ])
        
        # Check custom patterns (if available)
        if self.custom_pattern_manager:
            try:
                custom_findings = self.custom_pattern_manager.detect(text, tenant_id=tenant_id)
                violations.extend([
                    Violation(
                        type=ViolationType.CUSTOM_PATTERN,
                        severity="high",
                        message=f"Custom pattern matched: {finding['pattern_name']}",
                        matched_text=finding['matched_text'],
                        position=(finding.get('start'), finding.get('end')),
                        metadata=finding,
                        confidence=finding.get('confidence', 0.85)
                    )
                    for finding in custom_findings
                ])
            except Exception as e:
                import logging
                logging.error(f"Custom pattern detection failed: {e}")
        
        return violations

