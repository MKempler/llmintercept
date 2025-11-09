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


app = FastAPI(title="AI Prompt Firewall", version="0.1.0")

# Demo data cache (for stable dashboard display)
_cached_demo_logs = None
_cached_demo_violations = None
_last_demo_data_generation_time = 0
DEMO_DATA_CACHE_DURATION_SECONDS = 3600  # Cache for 1 hour

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production - allows extension requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose headers for extension access
)

# Helper function to add CORS headers to responses
def add_cors_headers(response):
    """Add CORS headers to response."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Initialize components
detection_engine = DetectionEngine()
policy_engine = PolicyEngine()
audit_logger = AuditLogger()

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
        # Validate request size
        total_chars = sum(len(msg.content) for msg in self.messages)
        if total_chars > 100000:  # 100KB limit
            raise ValueError("Request too large. Maximum 100KB total content.")
        if len(self.messages) > 100:
            raise ValueError("Too many messages. Maximum 100 messages per request.")


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
async def create_policy(request: PolicyCreateRequest):
    """Create a new policy."""
    from datetime import datetime
    
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
async def update_policy(policy_id: str, request: PolicyUpdateRequest):
    """Update an existing policy."""
    from datetime import datetime
    
    rule = policy_engine.get_rule(policy_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Policy not found")
    
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
async def delete_policy(policy_id: str):
    """Delete a policy."""
    # Don't allow deleting default policies
    default_policy_ids = ["block_secrets", "redact_pii", "block_injection"]
    if policy_id in default_policy_ids:
        raise HTTPException(status_code=400, detail="Cannot delete default policies")
    
    success = policy_engine.delete_rule(policy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    response = JSONResponse(content={"message": "Policy deleted successfully"})
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
        violations = detection_engine.scan(prompt_text)
        policy_result = policy_engine.evaluate(violations)
        
        if policy_result["blocked"]:
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
    
    # Scan for violations
    violations = detection_engine.scan(prompt_text)
    
    # Evaluate policies
    policy_result = policy_engine.evaluate(violations)
    
    # Prepare violation data for logging
    violation_data = [
        {
            "type": v.type.value,
            "severity": v.severity,
            "message": v.message,
            "matched_text": v.matched_text[:100] if v.matched_text else None  # Truncate for storage
        }
        for v in violations
    ]
    
    # If blocked, return error immediately
    if policy_result["blocked"]:
        audit_logger.log_request(
            request_id=request_id,
            endpoint="/v1/chat/completions",
            method="POST",
            status="blocked",
            violations=violation_data,
            request_data=prompt_text[:1000],  # Truncate for storage
            latency_ms=int((time.time() - start_time) * 1000),
            metadata={"policy_action": policy_result["action"].value}
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
        # Redact violations from messages
        redacted_messages = []
        for msg in request.messages:
            redacted_content = msg.content
            for violation in violations:
                if violation.matched_text:
                    redacted_content = redacted_content.replace(
                        violation.matched_text,
                        "[REDACTED]"
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
            
            # Scan response for data leakage (if not streaming)
            response_violations = []
            response_data = None
            if not modified_request.stream:
                response_json = response.json()
                response_data = response.text[:1000]
                
                # Check response content for secrets/PII
                if response_json.get("choices") and len(response_json["choices"]) > 0:
                    response_text = response_json["choices"][0].get("message", {}).get("content", "")
                    if response_text:
                        response_violations = detection_engine.scan(response_text)
                        # Log response violations but don't block (already sent to user)
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
                metadata={
                    "policy_action": policy_result["action"].value,
                    "redacted": policy_result["action"] == Action.REDACT,
                    "response_violations": len(response_violations) if response_violations else 0
                }
            )
            
            if modified_request.stream:
                return StreamingResponse(
                    response.iter_bytes(),
                    media_type="text/event-stream"
                )
            else:
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
                return response_json
    
    except ValueError as e:
        # Input validation errors
        audit_logger.log_request(
            request_id=request_id,
            endpoint="/v1/chat/completions",
            method="POST",
            status="error",
            violations=[],
            latency_ms=int((time.time() - start_time) * 1000),
            metadata={"error": str(e), "error_type": "validation_error"}
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
            metadata={"error": str(e), "error_type": type(e).__name__}
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
            endpoint="/v1/chat/completions",
            method="POST",
            status="error",
            violations=violation_data,
            latency_ms=int((time.time() - start_time) * 1000),
            metadata={"error": str(e), "error_type": type(e).__name__}
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

