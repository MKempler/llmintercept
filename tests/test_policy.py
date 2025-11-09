"""Test suite for policy engine."""
import pytest
from policy import PolicyEngine, PolicyRule, Action
from detection import Violation, ViolationType


def test_policy_engine_block():
    """Test policy engine blocking."""
    engine = PolicyEngine()
    
    violations = [
        Violation(
            type=ViolationType.SECRET,
            severity="high",
            message="Secret detected",
            matched_text="AKIAIOSFODNN7EXAMPLE"
        )
    ]
    
    result = engine.evaluate(violations)
    assert result["blocked"] is True
    assert result["action"] == Action.BLOCK


def test_policy_engine_allow():
    """Test policy engine allowing clean requests."""
    engine = PolicyEngine()
    
    violations = []
    result = engine.evaluate(violations)
    assert result["blocked"] is False
    assert result["action"] == Action.ALLOW


def test_policy_rules():
    """Test policy rule management."""
    engine = PolicyEngine()
    
    rules = engine.get_rules()
    assert len(rules) > 0
    
    # Add custom rule
    new_rule = PolicyRule(
        id="custom_rule",
        name="Custom Rule",
        violation_types=[ViolationType.SECRET],
        action=Action.WARN
    )
    engine.add_rule(new_rule)
    
    rules = engine.get_rules()
    assert any(r.id == "custom_rule" for r in rules)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

