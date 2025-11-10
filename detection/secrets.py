"""Secrets detection using pattern matching with validation."""
import re
from typing import List, Dict, Any


class SecretsDetector:
    """Detects secrets, API keys, passwords, and tokens."""
    
    def __init__(self):
        self.patterns = self._load_patterns()
    
    def _validate_aws_access_key(self, key: str) -> bool:
        """
        Validate AWS access key format.
        AWS access keys are exactly 20 characters after 'AKIA'.
        """
        if not key.startswith('AKIA'):
            return False
        
        # Extract the part after AKIA
        suffix = key[4:]
        
        # Must be exactly 16 characters (total 20 with AKIA prefix)
        if len(suffix) != 16:
            return False
        
        # Must be uppercase alphanumeric
        if not re.match(r'^[0-9A-Z]{16}$', suffix):
            return False
        
        return True
    
    def _load_patterns(self) -> List[Dict[str, Any]]:
        """Load secret detection patterns."""
        return [
            {
                "name": "AWS Access Key",
                "pattern": r'AKIA[0-9A-Z]{16}',  # Exactly 16 chars after AKIA (total 20)
                "type": "aws_access_key",
                "validator": self._validate_aws_access_key
            },
            {
                "name": "AWS Secret Key",
                "pattern": r'aws_secret_access_key\s*=\s*["\']?([A-Za-z0-9/+=]{40})["\']?',
                "type": "aws_secret_key"
            },
            {
                "name": "GitHub Token",
                "pattern": r'ghp_[0-9A-Za-z]{36}',
                "type": "github_token"
            },
            {
                "name": "Generic API Key",
                "pattern": r'(?i)(api[_-]?key|apikey)\s*[:=]\s*["\']?([A-Za-z0-9\-_]{20,})["\']?',
                "type": "api_key"
            },
            {
                "name": "Password",
                "pattern": r'(?i)(password|passwd|pwd)\s*[:=]\s*["\']?([^\s"\']{8,})["\']?',
                "type": "password"
            },
            {
                "name": "Bearer Token",
                "pattern": r'Bearer\s+([A-Za-z0-9\-._~+/]{20,}=*)',  # Minimum 20 chars
                "type": "bearer_token"
            },
            {
                "name": "Private Key",
                "pattern": r'-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----',
                "type": "private_key"
            },
            {
                "name": "JWT Token",
                "pattern": r'eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+',
                "type": "jwt_token"
            },
            {
                "name": "Stripe Key",
                "pattern": r'sk_live_[0-9a-zA-Z]{24,}',
                "type": "stripe_key"
            },
            {
                "name": "Slack Token",
                "pattern": r'xox[baprs]-[0-9a-zA-Z\-]{10,}',
                "type": "slack_token"
            }
        ]
    
    def detect(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect secrets in text with validation.
        
        Args:
            text: Text to scan
        
        Returns:
            List of detected secrets with metadata and confidence scores
        """
        findings = []
        
        for pattern_def in self.patterns:
            matches = re.finditer(pattern_def["pattern"], text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                matched_text = match.group(0)
                
                # Apply validator if available
                validator = pattern_def.get("validator")
                if validator and not validator(matched_text):
                    continue  # Skip invalid matches
                
                # Calculate confidence based on pattern type
                confidence = self._calculate_confidence(pattern_def["type"], matched_text)
                
                findings.append({
                    "type": pattern_def["type"],
                    "name": pattern_def["name"],
                    "text": matched_text,
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": confidence
                })
        
        return findings
    
    def _calculate_confidence(self, secret_type: str, matched_text: str) -> float:
        """
        Calculate confidence score for detected secret.
        
        Returns:
            Confidence score between 0.0 and 1.0
        """
        # Base confidence by type
        base_confidence = {
            "aws_access_key": 0.95,  # High confidence after validation
            "aws_secret_key": 0.90,
            "github_token": 0.95,
            "private_key": 0.98,  # Very high confidence
            "jwt_token": 0.85,
            "stripe_key": 0.90,
            "slack_token": 0.85,
            "bearer_token": 0.70,  # Lower - could be legitimate
            "api_key": 0.75,  # Lower - many false positives
            "password": 0.65  # Lowest - many false positives
        }
        
        confidence = base_confidence.get(secret_type, 0.80)
        
        # Adjust based on length (longer = more confident)
        if len(matched_text) > 40:
            confidence = min(confidence + 0.05, 1.0)
        elif len(matched_text) < 15:
            confidence = max(confidence - 0.1, 0.5)
        
        return confidence

