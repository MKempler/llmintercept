"""Secrets detection using pattern matching."""
import re
from typing import List, Dict, Any


class SecretsDetector:
    """Detects secrets, API keys, passwords, and tokens."""
    
    def __init__(self):
        self.patterns = self._load_patterns()
    
    def _load_patterns(self) -> List[Dict[str, Any]]:
        """Load secret detection patterns."""
        return [
            {
                "name": "AWS Access Key",
                "pattern": r'AKIA[0-9A-Z]{8,}',  # Match 8+ chars after AKIA (partial keys are also suspicious)
                "type": "aws_access_key"
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
                "pattern": r'Bearer\s+([A-Za-z0-9\-._~+/]+=*)',
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
        Detect secrets in text.
        
        Args:
            text: Text to scan
        
        Returns:
            List of detected secrets with metadata
        """
        findings = []
        
        for pattern_def in self.patterns:
            matches = re.finditer(pattern_def["pattern"], text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                findings.append({
                    "type": pattern_def["type"],
                    "name": pattern_def["name"],
                    "text": match.group(0),
                    "start": match.start(),
                    "end": match.end()
                })
        
        return findings

