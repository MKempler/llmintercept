"""FastAPI proxy gateway server."""
import os
import sys
import time
import uuid
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from detection import DetectionEngine, ViolationType
from policy import PolicyEngine, Action, PolicyRule
from policy.actions import execute_action
from audit_logging import AuditLogger
from gateway.converters import (
    extract_prompt_text_anthropic,
    extract_prompt_text_google,
    convert_anthropic_to_openai_format,
    convert_google_to_openai_format,
    redact_anthropic_messages,
    redact_google_contents
)
from gateway.rate_limit import RateLimitMiddleware, create_rate_limiter
from gateway.auth import AuthMiddleware, create_auth
from gateway.redaction import RedactionEngine, create_redaction_engine
from gateway.tenancy import TenantContext, create_tenant_context
from gateway.webhooks import WebhookManager, create_webhook_manager
from gateway.policy_audit import PolicyAuditTrail, create_audit_trail
from gateway.metrics import MetricsCollector, create_metrics_collector
from gateway.alerts import AlertManager, create_alert_manager
from detection.custom_patterns import CustomPatternManager, create_pattern_manager


app = FastAPI(title="AI Prompt Firewall", version="0.1.0")

# Demo data cache (for stable dashboard display)
_cached_demo_logs = None
_cached_demo_violations = None
_last_demo_data_generation_time = 0
DEMO_DATA_CACHE_DURATION_SECONDS = 3600  # Cache for 1 hour

# CORS configuration - restrict to specific origins in production
# Allow all origins in demo/dev mode, restrict in production
cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_origins_env:
    # Parse comma-separated list of allowed origins
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    # Default: allow all (for demo/dev mode)
    # Set CORS_ALLOWED_ORIGINS in production to restrict
    allowed_origins = ["*"]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose headers for extension access
)

# Database configuration - support PostgreSQL in production
database_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./firewall.db")

# Initialize security components
rate_limiter = create_rate_limiter()
auth_handler = create_auth()
redaction_engine = create_redaction_engine()
tenant_context = create_tenant_context()
webhook_manager = create_webhook_manager()
policy_audit_trail = create_audit_trail(database_url=database_url)
metrics_collector = create_metrics_collector()
alert_manager = create_alert_manager()
custom_pattern_manager = create_pattern_manager()

# Add rate limiting middleware (before auth)
app.add_middleware(RateLimitMiddleware, rate_limiter=rate_limiter)

# Add authentication middleware (after rate limiting)
app.add_middleware(AuthMiddleware, auth=auth_handler)

# Helper function to add CORS headers to responses
def add_cors_headers(response):
    """Add CORS headers to response."""
    # Use first allowed origin or * if all allowed
    origin = allowed_origins[0] if allowed_origins and allowed_origins[0] != "*" else "*"
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Initialize components
detection_engine = DetectionEngine(custom_pattern_manager=custom_pattern_manager)
policy_engine = PolicyEngine()
audit_logger = AuditLogger(database_url=database_url)

# LLM API base URLs
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_BASE = os.getenv("ANTHROPIC_API_BASE", "https://api.anthropic.com/v1")
GOOGLE_API_BASE = os.getenv("GOOGLE_API_BASE", "https://generativelanguage.googleapis.com/v1beta")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False
    
    class Config:
        # Validate on assignment
        validate_assignment = True
    
    def __init__(self, **data):
        super().__init__(**data)
        # Comprehensive input validation
        # Max content length (configurable, default 100KB)
        max_content_length = int(os.getenv("MAX_CONTENT_LENGTH", "100000"))
        total_chars = sum(len(msg.content) for msg in self.messages)
        if total_chars > max_content_length:
            raise ValueError(f"Request too large. Maximum {max_content_length} characters total content.")
        
        # Max message count
        max_messages = int(os.getenv("MAX_MESSAGES", "100"))
        if len(self.messages) > max_messages:
            raise ValueError(f"Too many messages. Maximum {max_messages} messages per request.")
        
        # Max tokens validation
        max_tokens_limit = int(os.getenv("MAX_TOKENS_LIMIT", "100000"))
        if self.max_tokens and self.max_tokens > max_tokens_limit:
            raise ValueError(f"max_tokens exceeds limit. Maximum {max_tokens_limit} tokens.")
        
        # Validate model name format (basic check)
        if not self.model or len(self.model) > 100:
            raise ValueError("Invalid model name.")
        
        # Validate message content
        for msg in self.messages:
            if not msg.content or len(msg.content) == 0:
                raise ValueError("Messages cannot be empty.")
            if len(msg.content) > max_content_length:
                raise ValueError(f"Individual message exceeds maximum length of {max_content_length} characters.")


class AnthropicMessage(BaseModel):
    role: str
    content: Any  # Can be string or list of content blocks


class AnthropicRequest(BaseModel):
    model: str
    messages: list[AnthropicMessage]
    max_tokens: int
    temperature: Optional[float] = None
    stream: Optional[bool] = False


class GooglePart(BaseModel):
    text: str


class GoogleContent(BaseModel):
    parts: list[GooglePart]
    role: Optional[str] = None


class GoogleRequest(BaseModel):
    contents: list[GoogleContent]
    generationConfig: Optional[Dict[str, Any]] = None
    safetySettings: Optional[list[Dict[str, Any]]] = None


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle OPTIONS preflight requests."""
    response = JSONResponse(content={})
    return add_cors_headers(response)


@app.get("/api/demo-mode")
async def get_demo_mode():
    """Check if demo mode is active."""
    # Default to True for MVP (no customers yet)
    # Set DEMO_MODE=false to disable when you have real customers
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    response = JSONResponse(content={"demo_mode": demo_mode})
    return add_cors_headers(response)


@app.get("/api/violations")
async def get_violations():
    """Get recent violations."""
    global _cached_demo_violations, _last_demo_data_generation_time
    
    # Default to True for MVP (no customers yet)
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    real_violations = audit_logger.get_violations(limit=100)
    
    if demo_mode or len(real_violations) == 0:
        current_time = time.time()
        # Check if cache is valid (exists and not expired)
        if (_cached_demo_violations is None or 
            (current_time - _last_demo_data_generation_time) > DEMO_DATA_CACHE_DURATION_SECONDS):
            from gateway.demo_data import generate_demo_violations
            _cached_demo_violations = generate_demo_violations()
            _last_demo_data_generation_time = current_time
        response = JSONResponse(content={"violations": _cached_demo_violations})
        return add_cors_headers(response)
    
    response = JSONResponse(content={"violations": real_violations})
    return add_cors_headers(response)


@app.get("/api/logs")
async def get_logs():
    """Get recent audit logs."""
    global _cached_demo_logs, _last_demo_data_generation_time
    
    # Default to True for MVP (no customers yet)
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    real_logs = audit_logger.get_recent_logs(limit=100)
    
    if demo_mode or len(real_logs) == 0:
        current_time = time.time()
        # Check if cache is valid (exists and not expired)
        if (_cached_demo_logs is None or 
            (current_time - _last_demo_data_generation_time) > DEMO_DATA_CACHE_DURATION_SECONDS):
            from gateway.demo_data import generate_demo_logs
            _cached_demo_logs = generate_demo_logs()
            _last_demo_data_generation_time = current_time
        response = JSONResponse(content={"logs": _cached_demo_logs})
        return add_cors_headers(response)
    
    response = JSONResponse(content={"logs": real_logs})
    return add_cors_headers(response)


@app.get("/api/policies")
async def get_policies():
    """Get current policies with statistics."""
    rules = policy_engine.get_rules()
    
    # Get all logs for statistics calculation
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    if demo_mode:
        from gateway.demo_data import generate_demo_logs
        all_logs = generate_demo_logs(80)
    else:
        all_logs = audit_logger.get_recent_logs(limit=1000)
    
    # Calculate statistics for each policy
    policies_with_stats = []
    for rule in rules:
        # Count violations caught by this policy
        violations_caught = 0
        last_triggered = None
        requests_affected = 0
        
        for log in all_logs:
            log_violations = log.get("violations", [])
            if not log_violations:
                continue
            
            # Check if any violation matches this policy's violation types
            policy_applied = False
            for violation in log_violations:
                violation_type_str = violation.get("type", "").lower()
                violation_type_enum = None
                
                # Map string to ViolationType enum
                if violation_type_str == "secret":
                    violation_type_enum = ViolationType.SECRET
                elif violation_type_str == "pii":
                    violation_type_enum = ViolationType.PII
                elif violation_type_str in ["prompt_injection", "injection"]:
                    violation_type_enum = ViolationType.PROMPT_INJECTION
                
                if violation_type_enum and violation_type_enum in rule.violation_types:
                    policy_applied = True
                    violations_caught += 1
                    break
            
            if policy_applied:
                requests_affected += 1
                log_timestamp = log.get("timestamp")
                if log_timestamp:
                    if last_triggered is None or log_timestamp > last_triggered:
                        last_triggered = log_timestamp
        
        policies_with_stats.append({
            "id": rule.id,
            "name": rule.name,
            "description": rule.description,
            "violation_types": [vt.value for vt in rule.violation_types],
            "action": rule.action.value,
            "enabled": rule.enabled,
            "priority": rule.priority,
            "created_at": rule.created_at,
            "updated_at": rule.updated_at,
            "statistics": {
                "violations_caught": violations_caught,
                "requests_affected": requests_affected,
                "last_triggered": last_triggered
            }
        })
    
    response = JSONResponse(content={"policies": policies_with_stats})
    return add_cors_headers(response)


class PolicyCreateRequest(BaseModel):
    """Request model for creating a policy."""
    name: str
    description: Optional[str] = None
    violation_types: List[str]
    action: str
    enabled: bool = True
    priority: int = 0


class PolicyUpdateRequest(BaseModel):
    """Request model for updating a policy."""
    name: Optional[str] = None
    description: Optional[str] = None
    violation_types: Optional[List[str]] = None
    action: Optional[str] = None
    enabled: Optional[bool] = None
    priority: Optional[int] = None


@app.post("/api/policies")
async def create_policy(request: PolicyCreateRequest, req: Request):
    """Create a new policy."""
    from datetime import datetime
    
    # Extract context for audit trail
    context = tenant_context.extract_context(req)
    tenant_id = context.get("tenant_id")
    changed_by = context.get("user_id") or req.headers.get("X-API-Key", "unknown")[:8]
    
    # Convert violation type strings to enums
    violation_type_enums = []
    for vt_str in request.violation_types:
        if vt_str.lower() == "secret":
            violation_type_enums.append(ViolationType.SECRET)
        elif vt_str.lower() == "pii":
            violation_type_enums.append(ViolationType.PII)
        elif vt_str.lower() in ["prompt_injection", "injection"]:
            violation_type_enums.append(ViolationType.PROMPT_INJECTION)
    
    if not violation_type_enums:
        raise HTTPException(status_code=400, detail="At least one violation type is required")
    
    # Convert action string to enum
    action_enum = Action[request.action.upper()] if hasattr(Action, request.action.upper()) else Action.BLOCK
    
    # Generate ID
    policy_id = f"policy_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    
    # Create policy rule
    new_rule = PolicyRule(
        id=policy_id,
        name=request.name,
        description=request.description,
        violation_types=violation_type_enums,
        action=action_enum,
        enabled=request.enabled,
        priority=request.priority,
        created_at=now,
        updated_at=now
    )
    
    policy_engine.add_rule(new_rule)
    
    # Log policy creation in audit trail
    policy_audit_trail.log_change(
        policy_id=policy_id,
        change_type="created",
        new_value={
            "id": new_rule.id,
            "name": new_rule.name,
            "description": new_rule.description,
            "violation_types": [vt.value for vt in new_rule.violation_types],
            "action": new_rule.action.value,
            "enabled": new_rule.enabled,
            "priority": new_rule.priority
        },
        changed_by=changed_by,
        tenant_id=tenant_id
    )
    
    # Send webhook
    await webhook_manager.send_webhook("policy_change", {
        "policy_id": policy_id,
        "change_type": "created",
        "tenant_id": tenant_id,
        "changed_by": changed_by
    })
    
    response = JSONResponse(content={
        "id": policy_id,
        "name": new_rule.name,
        "description": new_rule.description,
        "violation_types": [vt.value for vt in new_rule.violation_types],
        "action": new_rule.action.value,
        "enabled": new_rule.enabled,
        "priority": new_rule.priority,
        "created_at": new_rule.created_at,
        "updated_at": new_rule.updated_at
    }, status_code=201)
    return add_cors_headers(response)


@app.put("/api/policies/{policy_id}")
async def update_policy(policy_id: str, request: PolicyUpdateRequest, req: Request):
    """Update an existing policy."""
    from datetime import datetime
    
    # Extract context for audit trail
    context = tenant_context.extract_context(req)
    tenant_id = context.get("tenant_id")
    changed_by = context.get("user_id") or req.headers.get("X-API-Key", "unknown")[:8]
    
    rule = policy_engine.get_rule(policy_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Store old value for audit trail
    old_value = {
        "id": rule.id,
        "name": rule.name,
        "description": rule.description,
        "violation_types": [vt.value for vt in rule.violation_types],
        "action": rule.action.value,
        "enabled": rule.enabled,
        "priority": rule.priority
    }
    
    # Build update dict
    update_dict = {}
    if request.name is not None:
        update_dict["name"] = request.name
    if request.description is not None:
        update_dict["description"] = request.description
    if request.violation_types is not None:
        violation_type_enums = []
        for vt_str in request.violation_types:
            if vt_str.lower() == "secret":
                violation_type_enums.append(ViolationType.SECRET)
            elif vt_str.lower() == "pii":
                violation_type_enums.append(ViolationType.PII)
            elif vt_str.lower() in ["prompt_injection", "injection"]:
                violation_type_enums.append(ViolationType.PROMPT_INJECTION)
        update_dict["violation_types"] = violation_type_enums
    if request.action is not None:
        action_enum = Action[request.action.upper()] if hasattr(Action, request.action.upper()) else Action.BLOCK
        update_dict["action"] = action_enum
    if request.enabled is not None:
        update_dict["enabled"] = request.enabled
    if request.priority is not None:
        update_dict["priority"] = request.priority
    
    update_dict["updated_at"] = datetime.utcnow().isoformat()
    
    policy_engine.update_rule(policy_id, **update_dict)
    
    # Get updated rule
    updated_rule = policy_engine.get_rule(policy_id)
    
    # Log policy update in audit trail
    new_value = {
        "id": updated_rule.id,
        "name": updated_rule.name,
        "description": updated_rule.description,
        "violation_types": [vt.value for vt in updated_rule.violation_types],
        "action": updated_rule.action.value,
        "enabled": updated_rule.enabled,
        "priority": updated_rule.priority
    }
    
    policy_audit_trail.log_change(
        policy_id=policy_id,
        change_type="updated",
        old_value=old_value,
        new_value=new_value,
        changed_by=changed_by,
        tenant_id=tenant_id
    )
    
    # Send webhook
    await webhook_manager.send_webhook("policy_change", {
        "policy_id": policy_id,
        "change_type": "updated",
        "tenant_id": tenant_id,
        "changed_by": changed_by
    })
    
    response = JSONResponse(content={
        "id": updated_rule.id,
        "name": updated_rule.name,
        "description": updated_rule.description,
        "violation_types": [vt.value for vt in updated_rule.violation_types],
        "action": updated_rule.action.value,
        "enabled": updated_rule.enabled,
        "priority": updated_rule.priority,
        "created_at": updated_rule.created_at,
        "updated_at": updated_rule.updated_at
    })
    return add_cors_headers(response)


@app.delete("/api/policies/{policy_id}")
async def delete_policy(policy_id: str, req: Request):
    """Delete a policy."""
    # Extract context for audit trail
    context = tenant_context.extract_context(req)
    tenant_id = context.get("tenant_id")
    changed_by = context.get("user_id") or req.headers.get("X-API-Key", "unknown")[:8]
    
    # Don't allow deleting default policies
    default_policy_ids = ["block_secrets", "redact_pii", "block_injection"]
    if policy_id in default_policy_ids:
        raise HTTPException(status_code=400, detail="Cannot delete default policies")
    
    rule = policy_engine.get_rule(policy_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Store old value for audit trail
    old_value = {
        "id": rule.id,
        "name": rule.name,
        "description": rule.description,
        "violation_types": [vt.value for vt in rule.violation_types],
        "action": rule.action.value,
        "enabled": rule.enabled,
        "priority": rule.priority
    }
    
    success = policy_engine.delete_rule(policy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Log policy deletion in audit trail
    policy_audit_trail.log_change(
        policy_id=policy_id,
        change_type="deleted",
        old_value=old_value,
        changed_by=changed_by,
        tenant_id=tenant_id
    )
    
    # Send webhook
    await webhook_manager.send_webhook("policy_change", {
        "policy_id": policy_id,
        "change_type": "deleted",
        "tenant_id": tenant_id,
        "changed_by": changed_by
    })
    
    response = JSONResponse(content={"message": "Policy deleted successfully"})
    return add_cors_headers(response)


# Policy History Endpoints
@app.get("/api/policies/{policy_id}/history")
async def get_policy_history(policy_id: str, limit: int = 50):
    """Get change history for a policy."""
    history = policy_audit_trail.get_policy_history(policy_id, limit=limit)
    response = JSONResponse(content={"history": history})
    return add_cors_headers(response)


@app.get("/api/policies/history")
async def get_recent_policy_changes(limit: int = 100, tenant_id: Optional[str] = None):
    """Get recent policy changes."""
    changes = policy_audit_trail.get_recent_changes(tenant_id=tenant_id, limit=limit)
    response = JSONResponse(content={"changes": changes})
    return add_cors_headers(response)


# Custom Detection Patterns Endpoints
class PatternCreateRequest(BaseModel):
    name: str
    pattern: str
    violation_type: str
    description: Optional[str] = None
    enabled: bool = True


@app.get("/api/patterns")
async def get_patterns(
    violation_type: Optional[str] = None,
    enabled_only: bool = False,
    req: Request = None
):
    """Get custom detection patterns."""
    context = tenant_context.extract_context(req) if req else {}
    tenant_id = context.get("tenant_id")
    
    patterns = custom_pattern_manager.get_patterns(
        tenant_id=tenant_id,
        violation_type=violation_type,
        enabled_only=enabled_only
    )
    
    response = JSONResponse(content={
        "patterns": [
            {
                "id": p.id,
                "name": p.name,
                "pattern": p.pattern,
                "violation_type": p.violation_type,
                "description": p.description,
                "enabled": p.enabled,
                "tenant_id": p.tenant_id,
                "created_at": p.created_at,
                "updated_at": p.updated_at
            }
            for p in patterns
        ]
    })
    return add_cors_headers(response)


@app.post("/api/patterns")
async def create_pattern(request: PatternCreateRequest, req: Request):
    """Create a custom detection pattern."""
    context = tenant_context.extract_context(req)
    tenant_id = context.get("tenant_id")
    
    try:
        pattern = custom_pattern_manager.add_pattern(
            name=request.name,
            pattern=request.pattern,
            violation_type=request.violation_type,
            description=request.description,
            tenant_id=tenant_id,
            enabled=request.enabled
        )
        
        response = JSONResponse(content={
            "id": pattern.id,
            "name": pattern.name,
            "pattern": pattern.pattern,
            "violation_type": pattern.violation_type,
            "description": pattern.description,
            "enabled": pattern.enabled,
            "tenant_id": pattern.tenant_id,
            "created_at": pattern.created_at,
            "updated_at": pattern.updated_at
        }, status_code=201)
        return add_cors_headers(response)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/patterns/{pattern_id}")
async def update_pattern(pattern_id: str, request: Dict[str, Any]):
    """Update a custom detection pattern."""
    try:
        success = custom_pattern_manager.update_pattern(pattern_id, **request)
        if not success:
            raise HTTPException(status_code=404, detail="Pattern not found")
        
        pattern = custom_pattern_manager.get_pattern(pattern_id)
        response = JSONResponse(content={
            "id": pattern.id,
            "name": pattern.name,
            "pattern": pattern.pattern,
            "violation_type": pattern.violation_type,
            "description": pattern.description,
            "enabled": pattern.enabled,
            "tenant_id": pattern.tenant_id,
            "created_at": pattern.created_at,
            "updated_at": pattern.updated_at
        })
        return add_cors_headers(response)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/patterns/{pattern_id}")
async def delete_pattern(pattern_id: str):
    """Delete a custom detection pattern."""
    success = custom_pattern_manager.delete_pattern(pattern_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pattern not found")
    
    response = JSONResponse(content={"message": "Pattern deleted successfully"})
    return add_cors_headers(response)


# Metrics Endpoint
@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint."""
    try:
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
        if metrics_collector.enabled:
            from fastapi.responses import Response
            return Response(
                content=generate_latest(),
                media_type=CONTENT_TYPE_LATEST
            )
        else:
            return JSONResponse(content={"error": "Prometheus metrics not available"})
    except ImportError:
        return JSONResponse(content={"error": "Prometheus client not installed"})


# Webhook Management Endpoints
@app.get("/api/webhooks")
async def get_webhooks():
    """Get webhook configurations."""
    webhooks = webhook_manager.get_webhooks()
    response = JSONResponse(content={"webhooks": webhooks})
    return add_cors_headers(response)


@app.post("/v1/chat/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    req: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Proxy endpoint for OpenAI chat completions with security scanning.
    """
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Extract tenant/user context
    context = tenant_context.extract_context(req, authorization)
    tenant_id = context.get("tenant_id")
    user_id = context.get("user_id")
    app_id = context.get("app_id")
    
    # Record active request
    metrics_collector.increment_active_requests(tenant_id)
    
    try:
        # Check for demo mode (no API key required)
        demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
        
        # Extract user's OpenAI API key from Authorization header
        user_api_key = None
        if authorization:
            user_api_key = authorization.replace("Bearer ", "")
        
        # Use user's API key or fallback to environment variable
        api_key = user_api_key or OPENAI_API_KEY
        
        # Demo mode: return mock responses without calling OpenAI
        if demo_mode and not api_key:
            prompt_text = "\n".join([msg.content for msg in request.messages])
            violations = detection_engine.scan(prompt_text, context=context)
            policy_result = policy_engine.evaluate(violations)
            
            if policy_result["blocked"]:
                # Record metrics
                metrics_collector.record_block(
                    violation_type=violations[0].type.value if violations else "unknown",
                    tenant_id=tenant_id
                )
                alert_manager.record_event("block", tenant_id)
                
                # Send webhook
                await webhook_manager.send_webhook("blocked", {
                    "request_id": request_id,
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "violations": [
                        {
                            "type": v.type.value,
                            "severity": v.severity,
                            "message": v.message,
                            "confidence": v.confidence
                        }
                        for v in violations
                    ]
                })
                
                response = JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "message": "Request blocked due to security violations",
                            "type": "security_violation",
                            "violations": [
                                {
                                    "type": v.type.value,
                                    "severity": v.severity,
                                    "message": v.message,
                                    "matched_text": v.matched_text[:100] if v.matched_text else None
                                }
                                for v in violations
                            ]
                        }
                    }
                )
                return add_cors_headers(response)
            else:
                # Prepare violation data for response
                violation_data = [
                    {
                        "type": v.type.value,
                        "severity": v.severity,
                        "message": v.message,
                        "matched_text": v.matched_text[:100] if v.matched_text else None
                    }
                    for v in violations
                ]
                
                # Mock successful response
                response_data = {
                    "id": f"demo-{request_id}",
                    "object": "chat.completion",
                    "created": int(time.time()),
                    "model": request.model,
                    "choices": [{
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": "This is a demo response. In production, this would be the actual LLM response."
                        },
                        "finish_reason": "stop"
                    }],
                    "usage": {
                        "prompt_tokens": len(prompt_text.split()),
                        "completion_tokens": 10,
                        "total_tokens": len(prompt_text.split()) + 10
                    }
                }
                
                # Add firewall metadata if violations were detected and redacted
                if violations and policy_result["action"] == Action.REDACT:
                    response_data["firewall_metadata"] = {
                        "redacted": True,
                        "violations": violation_data,
                        "action": "redact"
                    }
                
                # Wrap in JSONResponse to ensure CORS headers are added
                response = JSONResponse(content=response_data)
                return add_cors_headers(response)
        
        # Non-demo mode: check for API key
        if not api_key:
            raise HTTPException(
                status_code=401, 
                detail={
                    "error": {
                        "message": "OpenAI API key required. Provide it in the Authorization header or set OPENAI_API_KEY environment variable. For demo mode, set DEMO_MODE=true.",
                        "type": "authentication_error",
                        "code": "missing_api_key"
                    }
                }
            )
        
        # Extract prompt text from messages
        prompt_text = "\n".join([msg.content for msg in request.messages])
        
        # Scan for violations with context
        violations = detection_engine.scan(prompt_text, context=context)
        
        # Record violation metrics
        for violation in violations:
            metrics_collector.record_violation(
                violation_type=violation.type.value,
                severity=violation.severity,
                tenant_id=tenant_id
            )
            alert_manager.record_event("violation", tenant_id)
        
        # Evaluate policies
        policy_result = policy_engine.evaluate(violations)
        
        # Record policy evaluation metrics
        for rule_id in policy_result.get("rules_applied", []):
            metrics_collector.record_policy_evaluation(
                policy_id=rule_id,
                action=policy_result["action"].value,
                tenant_id=tenant_id
            )
        
        # Prepare violation data for logging
        violation_data = [
            {
                "type": v.type.value,
                "severity": v.severity,
                "message": v.message,
                "matched_text": v.matched_text[:100] if v.matched_text else None,
                "confidence": v.confidence
            }
            for v in violations
        ]
        
        # If blocked, return error immediately
        if policy_result["blocked"]:
            # Record metrics
            metrics_collector.record_block(
                violation_type=violations[0].type.value if violations else "unknown",
                tenant_id=tenant_id
            )
            alert_manager.record_event("block", tenant_id)
            
            # Send webhook
            await webhook_manager.send_webhook("blocked", {
                "request_id": request_id,
                "tenant_id": tenant_id,
                "user_id": user_id,
                "app_id": app_id,
                "endpoint": "/v1/chat/completions",
                "violations": violation_data
            })
            
            audit_logger.log_request(
                request_id=request_id,
                endpoint="/v1/chat/completions",
                method="POST",
                status="blocked",
                violations=violation_data,
                request_data=prompt_text[:1000],
                latency_ms=int((time.time() - start_time) * 1000),
                user_id=user_id,
                metadata={
                    "policy_action": policy_result["action"].value,
                    "tenant_id": tenant_id,
                    "app_id": app_id
                }
            )
            
            response = JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "message": "Request blocked due to security violations",
                        "type": "security_violation",
                        "violations": violation_data
                    }
                }
            )
            return add_cors_headers(response)
        
        # Apply redaction if needed using improved redaction engine
        modified_request = request
        if policy_result["action"] == Action.REDACT:
            # Use improved redaction engine
            redacted_messages = []
            for msg in request.messages:
                redacted_content = redaction_engine.redact_text(
                    msg.content,
                    violations,
                    preserve_context=True
                )
                redacted_messages.append(ChatMessage(role=msg.role, content=redacted_content))
            modified_request.messages = redacted_messages
        
        # Forward request to OpenAI
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": modified_request.model,
                    "messages": [{"role": msg.role, "content": msg.content} for msg in modified_request.messages]
                }
                
                if modified_request.temperature is not None:
                    payload["temperature"] = modified_request.temperature
                if modified_request.max_tokens is not None:
                    payload["max_tokens"] = modified_request.max_tokens
                if modified_request.stream:
                    payload["stream"] = True
                
                response = await client.post(
                    f"{OPENAI_API_BASE}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
                
                latency_ms = int((time.time() - start_time) * 1000)
                
                # Scan response BEFORE sending to user (if not streaming)
                response_violations = []
                response_data = None
                response_json = None
                
                if not modified_request.stream:
                    response_json = response.json()
                    response_data = response.text[:1000]
                    
                    # Check response content for secrets/PII BEFORE sending
                    if response_json.get("choices") and len(response_json["choices"]) > 0:
                        response_text = response_json["choices"][0].get("message", {}).get("content", "")
                        if response_text:
                            response_violations = detection_engine.scan(response_text)
                            
                            # If response contains violations, evaluate policies
                            if response_violations:
                                response_policy_result = policy_engine.evaluate(response_violations)
                                
                                # If response should be blocked, return error instead
                                if response_policy_result["blocked"]:
                                    audit_logger.log_request(
                                        request_id=request_id,
                                        endpoint="/v1/chat/completions",
                                        method="POST",
                                        status="blocked",
                                        violations=[
                                            {
                                                "type": f"response_{v.type.value}",
                                                "severity": v.severity,
                                                "message": f"Response contains: {v.message}",
                                                "matched_text": v.matched_text[:100] if v.matched_text else None
                                            }
                                            for v in response_violations
                                        ],
                                        request_data=prompt_text[:1000],
                                        latency_ms=latency_ms,
                                        metadata={"policy_action": response_policy_result["action"].value, "blocked_in_response": True}
                                    )
                                    
                                    raise HTTPException(
                                        status_code=403,
                                        detail={
                                            "error": {
                                                "message": "Response blocked due to security violations detected in LLM output",
                                                "type": "security_violation",
                                                "violations": [
                                                    {
                                                        "type": f"response_{v.type.value}",
                                                        "severity": v.severity,
                                                        "message": f"Response contains: {v.message}",
                                                        "matched_text": v.matched_text[:100] if v.matched_text else None
                                                    }
                                                    for v in response_violations
                                                ]
                                            }
                                        }
                                    )
                                
                                # Log response violations (but allow if not blocked)
                                violation_data.extend([
                                    {
                                        "type": f"response_{v.type.value}",
                                        "severity": v.severity,
                                        "message": f"Response contains: {v.message}",
                                        "matched_text": v.matched_text[:100] if v.matched_text else None
                                    }
                                    for v in response_violations
                                ])
                
                # Log successful request
                audit_logger.log_request(
                    request_id=request_id,
                    endpoint="/v1/chat/completions",
                    method="POST",
                    status="allowed",
                    violations=violation_data if violations or response_violations else [],
                    request_data=prompt_text[:1000],
                    response_data=response_data,
                    latency_ms=latency_ms,
                    user_id=user_id,
                    metadata={
                        "policy_action": policy_result["action"].value,
                        "redacted": policy_result["action"] == Action.REDACT,
                        "response_violations": len(response_violations) if response_violations else 0,
                        "tenant_id": tenant_id,
                        "app_id": app_id
                    }
                )
                
                # Record metrics
                metrics_collector.record_request(
                    endpoint="/v1/chat/completions",
                    status="allowed",
                    duration=(time.time() - start_time),
                    tenant_id=tenant_id
                )
                
                # Send webhook for violations (if any)
                if violations:
                    await webhook_manager.send_webhook("violation", {
                        "request_id": request_id,
                        "tenant_id": tenant_id,
                        "user_id": user_id,
                        "app_id": app_id,
                        "endpoint": "/v1/chat/completions",
                        "violations": violation_data,
                        "action": policy_result["action"].value
                    })
                
                if modified_request.stream:
                    # For streaming, we can't scan before sending, but we log it
                    # TODO: Implement streaming response scanning with buffering
                    return StreamingResponse(
                        response.iter_bytes(),
                        media_type="text/event-stream"
                    )
                else:
                    # response_json already parsed above if not streaming
                    if response_json is None:
                        response_json = response.json()
                    
                    # Add firewall metadata to response
                    if violations and policy_result["action"] == Action.REDACT:
                        # Include redaction info in response
                        response_json["firewall_metadata"] = {
                            "redacted": True,
                            "violations": violation_data,
                            "action": "redact"
                        }
                    elif violations:
                        # Include violation info even if blocked (shouldn't reach here, but just in case)
                        response_json["firewall_metadata"] = {
                            "redacted": False,
                            "violations": violation_data,
                            "action": policy_result["action"].value
                        }
                    elif response_violations:
                        # Include response violation info
                        response_json["firewall_metadata"] = {
                            "redacted": False,
                            "violations": violation_data,
                            "action": "allowed",
                            "response_violations_detected": True
                        }
                    return response_json
        
        except ValueError as e:
            # Input validation errors
            metrics_collector.record_error("validation_error", "/v1/chat/completions", tenant_id)
            alert_manager.record_event("error", tenant_id)
            
            audit_logger.log_request(
                request_id=request_id,
                endpoint="/v1/chat/completions",
                method="POST",
                status="error",
                violations=[],
                latency_ms=int((time.time() - start_time) * 1000),
                user_id=user_id,
                metadata={"error": str(e), "error_type": "validation_error", "tenant_id": tenant_id}
            )
            raise HTTPException(
                status_code=400,
                detail={
                    "error": {
                        "message": str(e),
                        "type": "validation_error",
                        "code": "invalid_request"
                    }
                }
            )
        except httpx.HTTPError as e:
            metrics_collector.record_error("http_error", "/v1/chat/completions", tenant_id)
            alert_manager.record_event("error", tenant_id)
            
            error_detail = "Unable to connect to OpenAI API. Please check your API key and network connection."
            error_code = "upstream_error"
            
            if hasattr(e, 'response') and e.response:
                try:
                    error_data = e.response.json()
                    openai_error = error_data.get('error', {})
                    error_detail = openai_error.get('message', error_detail)
                    error_code = openai_error.get('code', error_code)
                    
                    # Handle common OpenAI errors
                    if 'quota' in error_detail.lower() or 'billing' in error_detail.lower():
                        error_detail = "OpenAI API quota exceeded. Please check your billing settings."
                    elif 'invalid' in error_detail.lower() and 'key' in error_detail.lower():
                        error_detail = "Invalid OpenAI API key. Please check your credentials."
                except:
                    pass
            
            audit_logger.log_request(
                request_id=request_id,
                endpoint="/v1/chat/completions",
                method="POST",
                status="error",
                violations=violation_data,
                latency_ms=int((time.time() - start_time) * 1000),
                user_id=user_id,
                metadata={"error": str(e), "error_type": type(e).__name__, "tenant_id": tenant_id}
            )
            raise HTTPException(
                status_code=502,
                detail={
                    "error": {
                        "message": error_detail,
                        "type": "gateway_error",
                        "code": "upstream_error"
                    }
                }
            )
        except Exception as e:
            metrics_collector.record_error("internal_error", "/v1/chat/completions", tenant_id)
            alert_manager.record_event("error", tenant_id)
            
            audit_logger.log_request(
                request_id=request_id,
                endpoint="/v1/chat/completions",
                method="POST",
                status="error",
                violations=violation_data,
                latency_ms=int((time.time() - start_time) * 1000),
                user_id=user_id,
                metadata={"error": str(e), "error_type": type(e).__name__, "tenant_id": tenant_id}
            )
            raise HTTPException(
                status_code=500,
                detail={
                    "error": {
                        "message": f"Internal server error: {str(e)}",
                        "type": "internal_error",
                        "code": "unexpected_error"
                    }
                }
            )
    except Exception as e:
        # Outer try block exception handler for any unexpected errors
        metrics_collector.record_error("unexpected_error", "/v1/chat/completions", tenant_id)
        alert_manager.record_event("error", tenant_id)
        
        audit_logger.log_request(
            request_id=request_id,
            endpoint="/v1/chat/completions",
            method="POST",
            status="error",
            violations=[],
            latency_ms=int((time.time() - start_time) * 1000),
            user_id=user_id,
            metadata={"error": str(e), "error_type": type(e).__name__, "tenant_id": tenant_id}
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "message": f"Internal server error: {str(e)}",
                    "type": "internal_error",
                    "code": "unexpected_error"
                }
            }
        )
    finally:
        # Decrement active request counter
        metrics_collector.decrement_active_requests(tenant_id)


def _scan_and_evaluate(prompt_text: str, request_id: str, start_time: float, endpoint: str):
    """Common function to scan prompt and evaluate policies."""
    violations = detection_engine.scan(prompt_text)
    policy_result = policy_engine.evaluate(violations)
    
    violation_data = [
        {
            "type": v.type.value,
            "severity": v.severity,
            "message": v.message,
            "matched_text": v.matched_text[:100] if v.matched_text else None
        }
        for v in violations
    ]
    
    return violations, policy_result, violation_data


@app.post("/v1/anthropic/messages")
async def anthropic_messages(
    request: AnthropicRequest,
    req: Request,
    x_api_key: Optional[str] = Header(None, alias="x-api-key"),
    authorization: Optional[str] = Header(None)
):
    """
    Proxy endpoint for Anthropic Claude API with security scanning.
    """
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Check for demo mode
    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
    
    # Extract API key (Anthropic uses x-api-key header)
    api_key = x_api_key
    if not api_key and authorization:
        # Fallback to Authorization header if x-api-key not provided
        api_key = authorization.replace("Bearer ", "").replace("x-api-key ", "")
    
    # Demo mode handling
    if demo_mode and not api_key:
        prompt_text = extract_prompt_text_anthropic([msg.dict() for msg in request.messages])
        violations, policy_result, violation_data = _scan_and_evaluate(prompt_text, request_id, start_time, "/v1/anthropic/messages")
        
        if policy_result["blocked"]:
            response = JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "message": "Request blocked due to security violations",
                        "type": "security_violation",
                        "violations": violation_data
                    }
                }
            )
            return add_cors_headers(response)
        
        # Mock response
        response_data = {
            "id": f"demo-{request_id}",
            "type": "message",
            "role": "assistant",
            "content": [{"type": "text", "text": "This is a demo response. In production, this would be the actual Claude response."}],
            "model": request.model,
            "stop_reason": "end_turn",
            "stop_sequence": None
        }
        response = JSONResponse(content=response_data)
        return add_cors_headers(response)
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail={
                "error": {
                    "message": "Anthropic API key required. Provide it in the x-api-key header.",
                    "type": "authentication_error",
                    "code": "missing_api_key"
                }
            }
        )
    
    # Extract prompt text
    prompt_text = extract_prompt_text_anthropic([msg.dict() for msg in request.messages])
    
    # Scan and evaluate
    violations, policy_result, violation_data = _scan_and_evaluate(prompt_text, request_id, start_time, "/v1/anthropic/messages")
    
    # If blocked, return error
    if policy_result["blocked"]:
        audit_logger.log_request(
            request_id=request_id,
            endpoint="/v1/anthropic/messages",
            method="POST",
            status="blocked",
            violations=violation_data,
            request_data=prompt_text[:1000],
            latency_ms=int((time.time() - start_time) * 1000),
            metadata={"policy_action": policy_result["action"].value, "provider": "anthropic"}
        )
        
        response = JSONResponse(
            status_code=403,
            content={
                "error": {
                    "message": "Request blocked due to security violations",
                    "type": "security_violation",
                    "violations": violation_data
                }
            }
        )
        return add_cors_headers(response)
    
    # Apply redaction if needed
    modified_request = request
    if policy_result["action"] == Action.REDACT:
        redacted_messages = redact_anthropic_messages([msg.dict() for msg in request.messages], violations)
        modified_request.messages = [AnthropicMessage(**msg) for msg in redacted_messages]
    
    # Forward to Anthropic API
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": modified_request.model,
                "messages": [{"role": msg.role, "content": msg.content} for msg in modified_request.messages],
                "max_tokens": modified_request.max_tokens
            }
            
            if modified_request.temperature is not None:
                payload["temperature"] = modified_request.temperature
            if modified_request.stream:
                payload["stream"] = True
            
            response = await client.post(
                f"{ANTHROPIC_API_BASE}/messages",
                headers=headers,
                json=payload,
                timeout=60.0
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Scan response for data leakage
            response_violations = []
            response_data = None
            if not modified_request.stream:
                response_json = response.json()
                response_data = response.text[:1000]
                
                # Extract response text from Anthropic format
                content = response_json.get("content", [])
                response_text = ""
                for block in content:
                    if block.get("type") == "text":
                        response_text += block.get("text", "")
                
                if response_text:
                    response_violations = detection_engine.scan(response_text)
                    if response_violations:
                        violation_data.extend([
                            {
                                "type": f"response_{v.type.value}",
                                "severity": v.severity,
                                "message": f"Response contains: {v.message}",
                                "matched_text": v.matched_text[:100] if v.matched_text else None
                            }
                            for v in response_violations
                        ])
            
            # Log request
            audit_logger.log_request(
                request_id=request_id,
                endpoint="/v1/anthropic/messages",
                method="POST",
                status="allowed",
                violations=violation_data if violations or response_violations else [],
                request_data=prompt_text[:1000],
                response_data=response_data,
                latency_ms=latency_ms,
                metadata={
                    "policy_action": policy_result["action"].value,
                    "redacted": policy_result["action"] == Action.REDACT,
                    "response_violations": len(response_violations) if response_violations else 0,
                    "provider": "anthropic"
                }
            )
            
            if modified_request.stream:
                return StreamingResponse(
                    response.iter_bytes(),
                    media_type="text/event-stream"
                )
            else:
                response_json = response.json()
                # Add firewall metadata if redacted
                if violations and policy_result["action"] == Action.REDACT:
                    response_json["firewall_metadata"] = {
                        "redacted": True,
                        "violations": violation_data,
                        "action": "redact"
                    }
                return response_json
    
    except httpx.HTTPError as e:
        error_detail = "Unable to connect to Anthropic API. Please check your API key and network connection."
        if hasattr(e, 'response') and e.response:
            try:
                error_data = e.response.json()
                error_detail = error_data.get('error', {}).get('message', error_detail)
            except:
                pass
        
        audit_logger.log_request(
            request_id=request_id,
            endpoint="/v1/anthropic/messages",
            method="POST",
            status="error",
            violations=violation_data,
            latency_ms=int((time.time() - start_time) * 1000),
            metadata={"error": str(e), "error_type": type(e).__name__, "provider": "anthropic"}
        )
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "message": error_detail,
                    "type": "gateway_error",
                    "code": "upstream_error"
                }
            }
        )
    except Exception as e:
        audit_logger.log_request(
            request_id=request_id,
            endpoint="/v1/anthropic/messages",
            method="POST",
            status="error",
            violations=violation_data,
            latency_ms=int((time.time() - start_time) * 1000),
            metadata={"error": str(e), "error_type": type(e).__name__, "provider": "anthropic"}
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "message": f"Internal server error: {str(e)}",
                    "type": "internal_error",
                    "code": "unexpected_error"
                }
            }
        )


@app.post("/v1/google/models/{model}:generateContent")
async def google_generate_content(
    model: str,
    request: GoogleRequest,
    req: Request,
    authorization: Optional[str] = Header(None),
    key: Optional[str] = None  # Google API key can be in query param
):
    """
    Proxy endpoint for Google Gemini API with security scanning.
    """
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Check for demo mode
    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
    
    # Extract API key (Google uses Authorization Bearer or key query param)
    api_key = None
    if authorization:
        api_key = authorization.replace("Bearer ", "")
    elif key:
        api_key = key
    
    # Demo mode handling
    if demo_mode and not api_key:
        prompt_text = extract_prompt_text_google([content.dict() for content in request.contents])
        violations, policy_result, violation_data = _scan_and_evaluate(prompt_text, request_id, start_time, f"/v1/google/models/{model}:generateContent")
        
        if policy_result["blocked"]:
            response = JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "message": "Request blocked due to security violations",
                        "type": "security_violation",
                        "violations": violation_data
                    }
                }
            )
            return add_cors_headers(response)
        
        # Mock response
        response_data = {
            "candidates": [{
                "content": {
                    "parts": [{"text": "This is a demo response. In production, this would be the actual Gemini response."}],
                    "role": "model"
                },
                "finishReason": "STOP"
            }]
        }
        response = JSONResponse(content=response_data)
        return add_cors_headers(response)
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail={
                "error": {
                    "message": "Google API key required. Provide it in the Authorization header or key query parameter.",
                    "type": "authentication_error",
                    "code": "missing_api_key"
                }
            }
        )
    
    # Extract prompt text
    prompt_text = extract_prompt_text_google([content.dict() for content in request.contents])
    
    # Scan and evaluate
    violations, policy_result, violation_data = _scan_and_evaluate(prompt_text, request_id, start_time, f"/v1/google/models/{model}:generateContent")
    
    # If blocked, return error
    if policy_result["blocked"]:
        audit_logger.log_request(
            request_id=request_id,
            endpoint=f"/v1/google/models/{model}:generateContent",
            method="POST",
            status="blocked",
            violations=violation_data,
            request_data=prompt_text[:1000],
            latency_ms=int((time.time() - start_time) * 1000),
            metadata={"policy_action": policy_result["action"].value, "provider": "google"}
        )
        
        response = JSONResponse(
            status_code=403,
            content={
                "error": {
                    "message": "Request blocked due to security violations",
                    "type": "security_violation",
                    "violations": violation_data
                }
            }
        )
        return add_cors_headers(response)
    
    # Apply redaction if needed
    modified_request = request
    if policy_result["action"] == Action.REDACT:
        redacted_contents = redact_google_contents([content.dict() for content in request.contents], violations)
        modified_request.contents = [GoogleContent(**content) for content in redacted_contents]
    
    # Forward to Google API
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Content-Type": "application/json"
            }
            
            if authorization:
                headers["Authorization"] = f"Bearer {api_key}"
            
            payload = {
                "contents": [{"parts": [{"text": part.text} for part in content.parts]} for content in modified_request.contents]
            }
            
            if modified_request.generationConfig:
                payload["generationConfig"] = modified_request.generationConfig
            if modified_request.safetySettings:
                payload["safetySettings"] = modified_request.safetySettings
            
            # Google API URL
            url = f"{GOOGLE_API_BASE}/models/{model}:generateContent"
            if not authorization and api_key:
                url += f"?key={api_key}"
            
            response = await client.post(
                url,
                headers=headers,
                json=payload,
                timeout=60.0
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Scan response for data leakage
            response_violations = []
            response_data = None
            if response.status_code == 200:
                response_json = response.json()
                response_data = response.text[:1000]
                
                # Extract response text from Google format
                candidates = response_json.get("candidates", [])
                response_text = ""
                for candidate in candidates:
                    content = candidate.get("content", {})
                    parts = content.get("parts", [])
                    for part in parts:
                        response_text += part.get("text", "")
                
                if response_text:
                    response_violations = detection_engine.scan(response_text)
                    if response_violations:
                        violation_data.extend([
                            {
                                "type": f"response_{v.type.value}",
                                "severity": v.severity,
                                "message": f"Response contains: {v.message}",
                                "matched_text": v.matched_text[:100] if v.matched_text else None
                            }
                            for v in response_violations
                        ])
            
            # Log request
            audit_logger.log_request(
                request_id=request_id,
                endpoint=f"/v1/google/models/{model}:generateContent",
                method="POST",
                status="allowed" if response.status_code == 200 else "error",
                violations=violation_data if violations or response_violations else [],
                request_data=prompt_text[:1000],
                response_data=response_data,
                latency_ms=latency_ms,
                metadata={
                    "policy_action": policy_result["action"].value,
                    "redacted": policy_result["action"] == Action.REDACT,
                    "response_violations": len(response_violations) if response_violations else 0,
                    "provider": "google"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json() if response.headers.get("content-type", "").startswith("application/json") else {"error": {"message": "Google API error"}}
                )
            
            response_json = response.json()
            # Add firewall metadata if redacted
            if violations and policy_result["action"] == Action.REDACT:
                response_json["firewall_metadata"] = {
                    "redacted": True,
                    "violations": violation_data,
                    "action": "redact"
                }
            return response_json
    
    except httpx.HTTPError as e:
        error_detail = "Unable to connect to Google API. Please check your API key and network connection."
        if hasattr(e, 'response') and e.response:
            try:
                error_data = e.response.json()
                error_detail = error_data.get('error', {}).get('message', error_detail)
            except:
                pass
        
        audit_logger.log_request(
            request_id=request_id,
            endpoint=f"/v1/google/models/{model}:generateContent",
            method="POST",
            status="error",
            violations=violation_data,
            latency_ms=int((time.time() - start_time) * 1000),
            metadata={"error": str(e), "error_type": type(e).__name__, "provider": "google"}
        )
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "message": error_detail,
                    "type": "gateway_error",
                    "code": "upstream_error"
                }
            }
        )
    except Exception as e:
        audit_logger.log_request(
            request_id=request_id,
            endpoint=f"/v1/google/models/{model}:generateContent",
            method="POST",
            status="error",
            violations=violation_data,
            latency_ms=int((time.time() - start_time) * 1000),
            metadata={"error": str(e), "error_type": type(e).__name__, "provider": "google"}
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "message": f"Internal server error: {str(e)}",
                    "type": "internal_error",
                    "code": "unexpected_error"
                }
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

