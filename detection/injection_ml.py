"""ML-based prompt injection detection using OpenAI moderation API."""
import os
from typing import List, Dict, Any, Optional
import re

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class MLInjectionDetector:
    """ML-based prompt injection detector using OpenAI moderation API."""
    
    def __init__(self):
        self.client = None
        self.enabled = False
        
        # Check if OpenAI API key is available
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_MODERATION_API_KEY")
        if OPENAI_AVAILABLE and api_key:
            try:
                self.client = OpenAI(api_key=api_key)
                self.enabled = True
            except Exception:
                self.enabled = False
    
    def detect(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect prompt injection using OpenAI moderation API.
        
        Args:
            text: Text to scan
        
        Returns:
            List of detected injection attempts with confidence scores
        """
        if not self.enabled or not self.client:
            return []
        
        try:
            # Use OpenAI moderation API
            response = self.client.moderations.create(input=text)
            
            results = []
            if response.results and len(response.results) > 0:
                result = response.results[0]
                
                # Check for prompt injection indicators
                # OpenAI moderation API flags various categories
                categories = result.categories
                category_scores = result.category_scores
                
                # Flag if any suspicious category is detected
                suspicious_categories = [
                    "harassment",
                    "harassment/threatening",
                    "self-harm",
                    "self-harm/intent",
                    "self-harm/instructions",
                    "sexual",
                    "sexual/minors",
                    "violence",
                    "violence/graphic"
                ]
                
                for category in suspicious_categories:
                    if hasattr(categories, category) and getattr(categories, category):
                        score = getattr(category_scores, category, 0.0)
                        if score > 0.5:  # Threshold for detection
                            results.append({
                                "type": "ml_detected_injection",
                                "pattern": f"OpenAI Moderation: {category}",
                                "text": text[:100],  # Truncate for metadata
                                "start": 0,
                                "end": len(text),
                                "confidence": float(score),
                                "source": "openai_moderation"
                            })
                
                # Also check if flagged overall
                if result.flagged:
                    # Calculate overall confidence
                    max_score = max([
                        getattr(category_scores, cat, 0.0)
                        for cat in dir(category_scores)
                        if not cat.startswith('_')
                    ], default=0.0)
                    
                    if max_score > 0.5:
                        results.append({
                            "type": "ml_detected_injection",
                            "pattern": "OpenAI Moderation: Flagged Content",
                            "text": text[:100],
                            "start": 0,
                            "end": len(text),
                            "confidence": float(max_score),
                            "source": "openai_moderation"
                        })
            
            return results
        
        except Exception as e:
            # Fail silently - fall back to regex detection
            import logging
            logging.debug(f"OpenAI moderation API error: {e}")
            return []


class EnhancedInjectionDetector:
    """Enhanced prompt injection detector with regex + ML ensemble."""
    
    def __init__(self):
        self.regex_patterns = self._load_patterns()
        self.ml_detector = MLInjectionDetector()
    
    def _load_patterns(self) -> List[Dict[str, Any]]:
        """Load prompt injection detection patterns."""
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
        Detect prompt injection attempts using ensemble (regex + ML).
        
        Args:
            text: Text to scan
        
        Returns:
            List of detected injection attempts with confidence scores
        """
        findings = []
        
        # Regex-based detection
        for pattern_def in self.regex_patterns:
            matches = re.finditer(pattern_def["pattern"], text, re.IGNORECASE | re.MULTILINE | re.DOTALL)
            for match in matches:
                findings.append({
                    "type": pattern_def["type"],
                    "pattern": pattern_def["name"],
                    "text": match.group(0),
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": pattern_def.get("confidence", 0.80),
                    "source": "regex"
                })
        
        # ML-based detection
        ml_findings = self.ml_detector.detect(text)
        findings.extend(ml_findings)
        
        # Deduplicate and merge findings
        return self._merge_findings(findings)
    
    def _merge_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Merge and deduplicate findings, combining confidence scores.
        
        Args:
            findings: List of findings from different sources
        
        Returns:
            Merged and deduplicated findings
        """
        if not findings:
            return []
        
        # Group by position overlap
        merged = []
        seen_positions = set()
        
        for finding in findings:
            pos_key = (finding.get("start", 0), finding.get("end", 0))
            
            # Check if this overlaps with existing findings
            overlapping = False
            for existing in merged:
                existing_start = existing.get("start", 0)
                existing_end = existing.get("end", 0)
                finding_start = finding.get("start", 0)
                finding_end = finding.get("end", 0)
                
                # Check overlap
                if not (finding_end <= existing_start or finding_start >= existing_end):
                    overlapping = True
                    # Merge confidence scores (take maximum)
                    existing["confidence"] = max(
                        existing.get("confidence", 0.0),
                        finding.get("confidence", 0.0)
                    )
                    # Combine sources
                    sources = existing.get("sources", [existing.get("source", "unknown")])
                    if finding.get("source") not in sources:
                        sources.append(finding.get("source", "unknown"))
                    existing["sources"] = sources
                    break
            
            if not overlapping:
                finding["sources"] = [finding.get("source", "unknown")]
                merged.append(finding)
        
        # Sort by confidence (highest first)
        merged.sort(key=lambda x: x.get("confidence", 0.0), reverse=True)
        
        return merged

