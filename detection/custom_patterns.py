"""Custom detection patterns management."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import re
import uuid


@dataclass
class CustomPattern:
    """Custom detection pattern definition."""
    id: str
    name: str
    pattern: str  # Regex pattern
    violation_type: str  # "secret", "pii", "prompt_injection", "custom"
    description: Optional[str] = None
    enabled: bool = True
    tenant_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """
        Validate pattern regex.
        
        Returns:
            (is_valid, error_message)
        """
        try:
            re.compile(self.pattern)
            return True, None
        except re.error as e:
            return False, str(e)
    
    def match(self, text: str) -> List[Dict[str, Any]]:
        """
        Match pattern against text.
        
        Args:
            text: Text to scan
        
        Returns:
            List of matches with positions
        """
        if not self.enabled:
            return []
        
        try:
            matches = []
            for match in re.finditer(self.pattern, text, re.IGNORECASE | re.MULTILINE):
                matches.append({
                    "text": match.group(0),
                    "start": match.start(),
                    "end": match.end(),
                    "pattern_id": self.id,
                    "pattern_name": self.name
                })
            return matches
        except re.error:
            return []


class CustomPatternManager:
    """Manages custom detection patterns."""
    
    def __init__(self):
        self.patterns: List[CustomPattern] = []
        self._load_from_storage()
    
    def _load_from_storage(self):
        """Load patterns from storage (database or file)."""
        # TODO: Load from database
        # For now, patterns are in-memory
        pass
    
    def add_pattern(
        self,
        name: str,
        pattern: str,
        violation_type: str,
        description: Optional[str] = None,
        tenant_id: Optional[str] = None,
        enabled: bool = True
    ) -> CustomPattern:
        """
        Add a custom detection pattern.
        
        Args:
            name: Pattern name
            pattern: Regex pattern
            violation_type: Type of violation to detect
            description: Optional description
            tenant_id: Tenant identifier
            enabled: Whether pattern is enabled
        
        Returns:
            Created CustomPattern object
        
        Raises:
            ValueError: If pattern is invalid
        """
        custom_pattern = CustomPattern(
            id=f"pattern_{uuid.uuid4().hex[:8]}",
            name=name,
            pattern=pattern,
            violation_type=violation_type,
            description=description,
            tenant_id=tenant_id,
            enabled=enabled,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat()
        )
        
        # Validate pattern
        is_valid, error = custom_pattern.validate()
        if not is_valid:
            raise ValueError(f"Invalid regex pattern: {error}")
        
        self.patterns.append(custom_pattern)
        self._save_to_storage()
        
        return custom_pattern
    
    def get_patterns(
        self,
        tenant_id: Optional[str] = None,
        violation_type: Optional[str] = None,
        enabled_only: bool = False
    ) -> List[CustomPattern]:
        """
        Get custom patterns.
        
        Args:
            tenant_id: Filter by tenant
            violation_type: Filter by violation type
            enabled_only: Only return enabled patterns
        
        Returns:
            List of matching patterns
        """
        patterns = self.patterns
        
        if tenant_id:
            patterns = [p for p in patterns if p.tenant_id == tenant_id]
        
        if violation_type:
            patterns = [p for p in patterns if p.violation_type == violation_type]
        
        if enabled_only:
            patterns = [p for p in patterns if p.enabled]
        
        return patterns
    
    def get_pattern(self, pattern_id: str) -> Optional[CustomPattern]:
        """Get a specific pattern by ID."""
        for pattern in self.patterns:
            if pattern.id == pattern_id:
                return pattern
        return None
    
    def update_pattern(self, pattern_id: str, **kwargs) -> bool:
        """Update a pattern."""
        pattern = self.get_pattern(pattern_id)
        if not pattern:
            return False
        
        # Update fields
        for key, value in kwargs.items():
            if hasattr(pattern, key):
                setattr(pattern, key, value)
        
        # Validate if pattern changed
        if "pattern" in kwargs:
            is_valid, error = pattern.validate()
            if not is_valid:
                raise ValueError(f"Invalid regex pattern: {error}")
        
        pattern.updated_at = datetime.utcnow().isoformat()
        self._save_to_storage()
        
        return True
    
    def delete_pattern(self, pattern_id: str) -> bool:
        """Delete a pattern."""
        initial_count = len(self.patterns)
        self.patterns = [p for p in self.patterns if p.id != pattern_id]
        
        if len(self.patterns) < initial_count:
            self._save_to_storage()
            return True
        return False
    
    def detect(self, text: str, tenant_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Run custom pattern detection on text.
        
        Args:
            text: Text to scan
            tenant_id: Tenant identifier for filtering patterns
        
        Returns:
            List of detected violations
        """
        findings = []
        
        patterns = self.get_patterns(tenant_id=tenant_id, enabled_only=True)
        
        for pattern in patterns:
            matches = pattern.match(text)
            for match in matches:
                findings.append({
                    "type": pattern.violation_type,
                    "pattern_id": pattern.id,
                    "pattern_name": pattern.name,
                    "matched_text": match["text"],
                    "start": match["start"],
                    "end": match["end"],
                    "confidence": 0.85  # Custom patterns have medium-high confidence
                })
        
        return findings
    
    def _save_to_storage(self):
        """Save patterns to storage (database or file)."""
        # TODO: Save to database
        # For now, patterns are in-memory only
        pass


def create_pattern_manager() -> CustomPatternManager:
    """Create custom pattern manager instance."""
    return CustomPatternManager()

