"""Policy engine for enforcing security rules."""
from typing import List, Dict, Any, Optional
from enum import Enum
from dataclasses import dataclass
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
    metadata: Optional[Dict[str, Any]] = None


class PolicyEngine:
    """Engine for evaluating policies against violations."""
    
    def __init__(self):
        self.rules: List[PolicyRule] = self._load_default_rules()
    
    def _load_default_rules(self) -> List[PolicyRule]:
        """Load default policy rules."""
        return [
            PolicyRule(
                id="block_secrets",
                name="Block Secrets",
                violation_types=[ViolationType.SECRET],
                action=Action.BLOCK,
                enabled=True
            ),
            PolicyRule(
                id="redact_pii",
                name="Redact PII",
                violation_types=[ViolationType.PII],
                action=Action.REDACT,
                enabled=True
            ),
            PolicyRule(
                id="block_injection",
                name="Block Prompt Injection",
                violation_types=[ViolationType.PROMPT_INJECTION],
                action=Action.BLOCK,
                enabled=True
            )
        ]
    
    def evaluate(self, violations: List[Violation]) -> Dict[str, Any]:
        """
        Evaluate violations against policies.
        
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
        
        # Find applicable rules
        applicable_rules = []
        for violation in violations:
            for rule in self.rules:
                if rule.enabled and violation.type in rule.violation_types:
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

