"""PII detection using Presidio with regex fallbacks."""
import re
from typing import List, Dict, Any
try:
    from presidio_analyzer import AnalyzerEngine
    from presidio_analyzer.nlp_engine import NlpEngineProvider
    PRESIDIO_AVAILABLE = True
except ImportError:
    PRESIDIO_AVAILABLE = False


class PIIDetector:
    """Detects personally identifiable information (PII)."""
    
    def __init__(self):
        # Initialize Presidio analyzer if available
        self.analyzer = None
        if PRESIDIO_AVAILABLE:
            try:
                self.analyzer = AnalyzerEngine()
            except Exception:
                # Fallback if spaCy model not loaded
                try:
                    provider = NlpEngineProvider(conf_file=None)
                    nlp_engine = provider.create_engine()
                    self.analyzer = AnalyzerEngine(nlp_engine=nlp_engine)
                except Exception:
                    self.analyzer = None
        
        # Regex patterns as fallback for common PII
        self.regex_patterns = [
            {
                "type": "ssn",
                "pattern": r'\b\d{3}-?\d{2}-?\d{4}\b',
                "name": "SSN"
            },
            {
                "type": "email",
                "pattern": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                "name": "Email Address"
            },
            {
                "type": "phone",
                "pattern": r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b',
                "name": "Phone Number"
            }
        ]
    
    def detect(self, text: str) -> List[Dict[str, Any]]:
        """Detect PII in text."""
        # Lazy initialize analyzer on first use
        if not self._analyzer_initialized:
            self._init_analyzer()
        """
        Detect PII in text.
        
        Args:
            text: Text to scan
        
        Returns:
            List of detected PII entities
        """
        findings = []
        
        # Use Presidio if available
        if self.analyzer:
            try:
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
                
                results = self.analyzer.analyze(
                    text=text,
                    entities=entities,
                    language="en"
                )
                
                for result in results:
                    findings.append({
                        "type": result.entity_type.lower(),
                        "text": text[result.start:result.end],
                        "start": result.start,
                        "end": result.end,
                        "score": result.score
                    })
            except Exception:
                pass  # Fall back to regex
        
        # Use regex patterns as fallback or supplement
        detected_texts = set()  # Track what we've already found
        
        # Add Presidio findings to set
        for finding in findings:
            detected_texts.add(finding["text"].lower())
        
        for pattern_def in self.regex_patterns:
            matches = re.finditer(pattern_def["pattern"], text, re.IGNORECASE)
            for match in matches:
                matched_text = match.group(0)
                # Only add if not already detected by Presidio
                if matched_text.lower() not in detected_texts:
                    findings.append({
                        "type": pattern_def["type"],
                        "text": matched_text,
                        "start": match.start(),
                        "end": match.end(),
                        "score": 0.9  # High confidence for regex matches
                    })
                    detected_texts.add(matched_text.lower())
        
        return findings

