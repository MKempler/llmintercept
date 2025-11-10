"""Policy engine for enforcing security rules with allowlist support."""
from typing import List, Dict, Any, Optional, Set
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import re
from detection import Violation, ViolationType


class Action(str, Enum):
    """Actions to take when violation detected."""
    BLOCK = "block"
    REDACT = "redact"
    ALLOW = "allow"
    WARN = "warn"


@dataclass
class PolicyRule:
    """A policy rule definition."""
    id: str
    name: str
    violation_types: List[ViolationType]
    action: Action
    enabled: bool = True
    description: Optional[str] = None
    priority: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)
    allowlist: Optional[List[str]] = field(default_factory=list)  # List of regex patterns to allow
    min_confidence: Optional[float] = None  # Minimum confidence to trigger (0.0-1.0)
    
    def is_allowlisted(self, violation: Violation) -> bool:
        """
        Check if a violation matches any allowlist pattern.
        
        Args:
            violation: Violation to check
        
        Returns:
            True if violation matches allowlist pattern
        """
        if not self.allowlist:
            return False
        
        for pattern in self.allowlist:
            try:
                if re.search(pattern, violation.matched_text, re.IGNORECASE):
                    return True
            except re.error:
                # Invalid regex pattern - skip it
                continue
        
        return False


class PolicyEngine:
    """Engine for evaluating policies against violations with allowlist support."""
    
    def __init__(self):
        self.rules: List[PolicyRule] = self._load_default_rules()
    
    def _load_default_rules(self) -> List[PolicyRule]:
        """Load default policy rules."""
        now = datetime.utcnow().isoformat()
        return [
            PolicyRule(
                id="block_secrets",
                name="Block Secrets",
                violation_types=[ViolationType.SECRET],
                action=Action.BLOCK,
                enabled=True,
                description="Automatically block requests containing API keys, passwords, tokens, or other secrets before they reach the LLM.",
                priority=1,
                created_at=now,
                updated_at=now,
                min_confidence=0.7  # Only block high-confidence secret detections
            ),
            PolicyRule(
                id="redact_pii",
                name="Redact PII",
                violation_types=[ViolationType.PII],
                action=Action.REDACT,
                enabled=True,
                description="Detect and redact personally identifiable information (emails, SSNs, phone numbers) while allowing requests to proceed.",
                priority=2,
                created_at=now,
                updated_at=now,
                min_confidence=0.7  # Only redact high-confidence PII
            ),
            PolicyRule(
                id="block_injection",
                name="Block Prompt Injection",
                violation_types=[ViolationType.PROMPT_INJECTION],
                action=Action.BLOCK,
                enabled=True,
                description="Block prompt injection attacks and jailbreak attempts that try to override system instructions.",
                priority=3,
                created_at=now,
                updated_at=now,
                min_confidence=0.75  # Higher threshold for injection (fewer false positives)
            )
        ]
    
    def evaluate(self, violations: List[Violation]) -> Dict[str, Any]:
        """
        Evaluate violations against policies with allowlist and confidence filtering.
        
        Args:
            violations: List of detected violations
        
        Returns:
            Policy evaluation result with action and details
        """
        if not violations:
            return {
                "action": Action.ALLOW,
                "blocked": False,
                "violations": []
            }
        
        # Filter violations by confidence and allowlist
        filtered_violations = []
        for violation in violations:
            # Find applicable rules for this violation
            applicable_rules = [
                rule for rule in self.rules
                if rule.enabled and violation.type in rule.violation_types
            ]
            
            if not applicable_rules:
                continue
            
            # Check if violation is allowlisted in any applicable rule
            is_allowlisted = any(
                rule.is_allowlisted(violation) for rule in applicable_rules
            )
            
            if is_allowlisted:
                continue  # Skip allowlisted violations
            
            # Check confidence threshold
            for rule in applicable_rules:
                if rule.min_confidence is not None:
                    if violation.confidence < rule.min_confidence:
                        continue  # Skip low-confidence violations
            
            # Violation passed filters
            filtered_violations.append(violation)
        
        if not filtered_violations:
            return {
                "action": Action.ALLOW,
                "blocked": False,
                "violations": []
            }
        
        # Find applicable rules for filtered violations
        applicable_rules = []
        for violation in filtered_violations:
            for rule in self.rules:
                if rule.enabled and violation.type in rule.violation_types:
                    # Double-check allowlist (should already be filtered)
                    if not rule.is_allowlisted(violation):
                        # Check confidence threshold
                        if rule.min_confidence is None or violation.confidence >= rule.min_confidence:
                            applicable_rules.append((rule, violation))
        
        if not applicable_rules:
            return {
                "action": Action.ALLOW,
                "blocked": False,
                "violations": []
            }
        
        # Determine action (BLOCK takes precedence)
        actions = [rule.action for rule, _ in applicable_rules]
        if Action.BLOCK in actions:
            action = Action.BLOCK
        elif Action.REDACT in actions:
            action = Action.REDACT
        elif Action.WARN in actions:
            action = Action.WARN
        else:
            action = Action.ALLOW
        
        return {
            "action": action,
            "blocked": action == Action.BLOCK,
            "violations": [v for _, v in applicable_rules],
            "rules_applied": [r.id for r, _ in applicable_rules]
        }
    
    def add_rule(self, rule: PolicyRule):
        """Add a custom policy rule."""
        self.rules.append(rule)
    
    def update_rule(self, rule_id: str, **kwargs):
        """Update an existing rule."""
        for rule in self.rules:
            if rule.id == rule_id:
                for key, value in kwargs.items():
                    if hasattr(rule, key):
                        setattr(rule, key, value)
                break
    
    def get_rules(self) -> List[PolicyRule]:
        """Get all policy rules."""
        return self.rules
    
    def delete_rule(self, rule_id: str) -> bool:
        """Delete a policy rule."""
        initial_count = len(self.rules)
        self.rules = [r for r in self.rules if r.id != rule_id]
        return len(self.rules) < initial_count
    
    def get_rule(self, rule_id: str) -> Optional[PolicyRule]:
        """Get a specific policy rule by ID."""
        for rule in self.rules:
            if rule.id == rule_id:
                return rule
        return None
    
    def add_allowlist_pattern(self, rule_id: str, pattern: str):
        """Add an allowlist pattern to a rule."""
        rule = self.get_rule(rule_id)
        if rule:
            if rule.allowlist is None:
                rule.allowlist = []
            if pattern not in rule.allowlist:
                rule.allowlist.append(pattern)
    
    def remove_allowlist_pattern(self, rule_id: str, pattern: str):
        """Remove an allowlist pattern from a rule."""
        rule = self.get_rule(rule_id)
        if rule and rule.allowlist:
            rule.allowlist = [p for p in rule.allowlist if p != pattern]

