"""PII detection using Presidio with confidence thresholds and whitelist support."""
import re
import os
from typing import List, Dict, Any, Set
try:
    from presidio_analyzer import AnalyzerEngine
    from presidio_analyzer.nlp_engine import NlpEngineProvider
    PRESIDIO_AVAILABLE = True
except ImportError:
    PRESIDIO_AVAILABLE = False
    raise ImportError(
        "Presidio is required for PII detection. Install with: pip install presidio-analyzer presidio-anonymizer spacy && python -m spacy download en_core_web_sm"
    )


class PIIDetector:
    """Detects personally identifiable information (PII) with confidence thresholds."""
    
    def __init__(self, min_confidence: float = 0.7):
        """
        Initialize PII detector.
        
        Args:
            min_confidence: Minimum confidence threshold (0.0-1.0) for PII detection
        """
        self.min_confidence = float(os.getenv("PII_MIN_CONFIDENCE", min_confidence))
        
        # Initialize Presidio analyzer - REQUIRED
        if not PRESIDIO_AVAILABLE:
            raise ImportError("Presidio is required for PII detection")
        
        try:
            self.analyzer = AnalyzerEngine()
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Presidio analyzer: {e}. Make sure spaCy model is installed: python -m spacy download en_core_web_sm")
        
        # Common false positive patterns to whitelist
        self.whitelist_patterns = self._load_whitelist_patterns()
        
        # Regex patterns as fallback/supplement
        self.regex_patterns = [
            {
                "type": "ssn",
                "pattern": r'\b\d{3}-?\d{2}-?\d{4}\b',
                "name": "SSN",
                "confidence": 0.9
            },
            {
                "type": "email",
                "pattern": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                "name": "Email Address",
                "confidence": 0.85
            },
            {
                "type": "phone",
                "pattern": r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b',
                "name": "Phone Number",
                "confidence": 0.80
            }
        ]
    
    def _load_whitelist_patterns(self) -> List[Dict[str, Any]]:
        """Load common false positive patterns to whitelist."""
        return [
            # Common example/test emails
            {
                "pattern": r'example@example\.com',
                "type": "email"
            },
            {
                "pattern": r'test@test\.com',
                "type": "email"
            },
            {
                "pattern": r'user@domain\.com',
                "type": "email"
            },
            # Common test phone numbers
            {
                "pattern": r'555-\d{4}',
                "type": "phone"
            },
            {
                "pattern": r'\(555\)\s?\d{3}-\d{4}',
                "type": "phone"
            },
            # Common test SSNs
            {
                "pattern": r'000-00-0000',
                "type": "ssn"
            },
            {
                "pattern": r'111-11-1111',
                "type": "ssn"
            }
        ]
    
    def _is_whitelisted(self, text: str, entity_type: str) -> bool:
        """Check if detected PII matches whitelist patterns."""
        for whitelist_pattern in self.whitelist_patterns:
            if whitelist_pattern["type"] == entity_type.lower():
                if re.search(whitelist_pattern["pattern"], text, re.IGNORECASE):
                    return True
        return False
    
    def detect(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect PII in text with confidence thresholds and whitelist filtering.
        
        Args:
            text: Text to scan
        
        Returns:
            List of detected PII entities with confidence scores
        """
        findings = []
        
        # Use Presidio for detection
        entities = [
            "EMAIL_ADDRESS",
            "PHONE_NUMBER",
            "CREDIT_CARD",
            "SSN",
            "US_DRIVER_LICENSE",
            "US_PASSPORT",
            "IP_ADDRESS",
            "DATE_TIME",
            "PERSON",
            "LOCATION"
        ]
        
        try:
            results = self.analyzer.analyze(
                text=text,
                entities=entities,
                language="en"
            )
            
            for result in results:
                # Filter by confidence threshold
                if result.score < self.min_confidence:
                    continue
                
                detected_text = text[result.start:result.end]
                entity_type = result.entity_type.lower()
                
                # Check whitelist
                if self._is_whitelisted(detected_text, entity_type):
                    continue
                
                findings.append({
                    "type": entity_type,
                    "text": detected_text,
                    "start": result.start,
                    "end": result.end,
                    "score": float(result.score),
                    "confidence": float(result.score)
                })
        except Exception as e:
            import logging
            logging.error(f"Presidio analysis failed: {e}")
            # Fall back to regex only
        
        # Use regex patterns as supplement (for patterns Presidio might miss)
        detected_texts = set()
        for finding in findings:
            detected_texts.add(finding["text"].lower())
        
        for pattern_def in self.regex_patterns:
            matches = re.finditer(pattern_def["pattern"], text, re.IGNORECASE)
            for match in matches:
                matched_text = match.group(0)
                
                # Skip if already detected by Presidio
                if matched_text.lower() in detected_texts:
                    continue
                
                # Check whitelist
                if self._is_whitelisted(matched_text, pattern_def["type"]):
                    continue
                
                # Only add if confidence meets threshold
                confidence = pattern_def.get("confidence", 0.9)
                if confidence >= self.min_confidence:
                    findings.append({
                        "type": pattern_def["type"],
                        "text": matched_text,
                        "start": match.start(),
                        "end": match.end(),
                        "score": confidence,
                        "confidence": confidence
                    })
                    detected_texts.add(matched_text.lower())
        
        return findings

