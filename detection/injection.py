"""Prompt injection and jailbreak detection with confidence scoring."""
import re
from typing import List, Dict, Any


class InjectionDetector:
    """Detects prompt injection and jailbreak attempts."""
    
    def __init__(self):
        self.patterns = self._load_patterns()
    
    def _load_patterns(self) -> List[Dict[str, Any]]:
        """Load prompt injection detection patterns with confidence scores."""
        return [
            {
                "name": "Ignore Previous Instructions",
                "pattern": r'(?i)(ignore|forget|disregard).*?(previous|prior|earlier|above).*?(instruction|prompt|directive|command)',
                "type": "instruction_override",
                "confidence": 0.85
            },
            {
                "name": "System Prompt Override",
                "pattern": r'(?i)(you are|act as|pretend|roleplay).*?(now|from now|starting)',
                "type": "role_override",
                "confidence": 0.75
            },
            {
                "name": "Prompt Leakage",
                "pattern": r'(?i)(show|reveal|display|print|output).*?(system|initial|original|full).*?(prompt|instruction|message)',
                "type": "prompt_leakage",
                "confidence": 0.90
            },
            {
                "name": "Jailbreak Pattern",
                "pattern": r'(?i)(jailbreak|bypass|override|hack|exploit)',
                "type": "jailbreak",
                "confidence": 0.95
            },
            {
                "name": "Developer Mode",
                "pattern": r'(?i)(developer|debug|admin).*?mode',
                "type": "developer_mode",
                "confidence": 0.70
            },
            {
                "name": "Data Exfiltration",
                "pattern": r'(?i)(extract|export|download|save|send|email).*?(all|entire|complete|full).*?(data|information|content|text)',
                "type": "data_exfiltration",
                "confidence": 0.80
            },
            {
                "name": "Base64 Encoded Injection",
                "pattern": r'(?i)(decode|decrypt|execute|run).*?([A-Za-z0-9+/]{50,}={0,2})',
                "type": "encoded_injection",
                "confidence": 0.85
            },
            {
                "name": "XML/HTML Injection",
                "pattern": r'<[^>]+>.*?(system|execute|eval|script)',
                "type": "markup_injection",
                "confidence": 0.75
            },
            {
                "name": "Unicode Bypass",
                "pattern": r'[\u200B-\u200D\uFEFF]',  # Zero-width characters
                "type": "unicode_bypass",
                "confidence": 0.90
            },
            {
                "name": "Repetition Attack",
                "pattern": r'(.{10,})\1{5,}',  # Repeated patterns
                "type": "repetition_attack",
                "confidence": 0.80
            }
        ]
    
    def detect(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect prompt injection attempts in text.
        
        Args:
            text: Text to scan
        
        Returns:
            List of detected injection attempts with confidence scores
        """
        findings = []
        
        for pattern_def in self.patterns:
            matches = re.finditer(pattern_def["pattern"], text, re.IGNORECASE | re.MULTILINE | re.DOTALL)
            for match in matches:
                findings.append({
                    "type": pattern_def["type"],
                    "pattern": pattern_def["name"],
                    "text": match.group(0),
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": pattern_def.get("confidence", 0.80)
                })
        
        return findings

