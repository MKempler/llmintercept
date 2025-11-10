# Gateway Configuration Reference

Complete reference for all gateway environment variables and configuration options.

## Database Configuration

### DATABASE_URL (Required)

PostgreSQL connection string. Format:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Examples:**
- Railway: Auto-set when PostgreSQL service is added
- Local: `postgresql://postgres:password@localhost:5432/firewall`
- External: `postgresql://user:pass@db.example.com:5432/firewall`

**Connection Pooling:**
- Pool size: `DB_POOL_SIZE` (default: 10)
- Max overflow: `DB_MAX_OVERFLOW` (default: 20)
- Pool recycle: 3600 seconds (1 hour)

## Authentication

### FIREWALL_API_KEY (Optional)

API key for gateway authentication. If set:
- Admin endpoints require: `Authorization: Bearer <key>` or `X-API-Key: <key>`
- LLM proxy endpoints remain public (users provide their own LLM API keys)

**Generate a secure key:**
```bash
openssl rand -hex 32
```

**Usage:**
```bash
curl -H "Authorization: Bearer your-firewall-api-key" \
  https://your-gateway.railway.app/api/policies
```

### REQUIRE_API_AUTH (Optional)

Require API key authentication for admin endpoints. Default: `false`

**Values:**
- `false`: Admin endpoints are public (not recommended for production)
- `true`: Admin endpoints require `FIREWALL_API_KEY`

## CORS Configuration

### CORS_ALLOWED_ORIGINS (Optional)

Comma-separated list of allowed origins for CORS. Default: `*` (all origins)

**Examples:**
```
CORS_ALLOWED_ORIGINS=https://dashboard.example.com,https://app.example.com
```

**For browser extension:**
```
CORS_ALLOWED_ORIGINS=chrome-extension://*
```

**For development:**
```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Security Note:** Using `*` allows any origin. Restrict in production.

## Demo Mode

### DEMO_MODE (Optional)

Enable demo mode for public demonstrations. Default: `false`

**When enabled:**
- LLM API keys not required
- Returns mock responses
- Still performs security scanning
- Useful for demos without exposing API keys

**Values:**
- `false`: Normal mode (requires LLM API keys)
- `true`: Demo mode (no API keys needed)

## LLM Provider Configuration

### OPENAI_API_KEY (Optional)

OpenAI API key used as fallback if user doesn't provide their own.

**Usage:**
- Users can provide their own key in `Authorization` header
- If not provided, gateway uses this key
- Set for demo/testing purposes

### ANTHROPIC_API_KEY (Optional)

Anthropic API key used as fallback.

### GOOGLE_API_KEY (Optional)

Google API key used as fallback.

## Request Limits

### MAX_CONTENT_LENGTH (Optional)

Maximum total content length (characters) across all messages. Default: `100000`

**Example:**
```
MAX_CONTENT_LENGTH=200000
```

### MAX_MESSAGES (Optional)

Maximum number of messages per request. Default: `100`

**Example:**
```
MAX_MESSAGES=200
```

### MAX_TOKENS_LIMIT (Optional)

Maximum tokens limit for requests. Default: `100000`

**Example:**
```
MAX_TOKENS_LIMIT=200000
```

## Rate Limiting

Rate limiting is configured per-IP and per-API-key.

**Default Limits:**
- Per IP: 100 requests/minute
- Per API key: 1000 requests/minute

**Configuration:**
Set in `gateway/rate_limit.py` (requires code changes).

## Logging

### Log Level

Set via Python logging configuration or environment:

```python
import logging
logging.basicConfig(level=logging.INFO)
```

**Levels:**
- `DEBUG`: Detailed debug information
- `INFO`: General informational messages
- `WARNING`: Warning messages
- `ERROR`: Error messages

## Monitoring

### Prometheus Metrics

Metrics endpoint: `/metrics`

**Available Metrics:**
- `firewall_requests_total`: Total requests processed
- `firewall_blocks_total`: Total requests blocked
- `firewall_violations_total`: Total violations detected
- `firewall_latency_seconds`: Request latency
- `firewall_active_requests`: Currently active requests

**Access:**
```bash
curl https://your-gateway.railway.app/metrics
```

## Webhooks

### Webhook Configuration

Configure webhooks in dashboard or via API:

```bash
curl -X POST https://your-gateway.railway.app/api/webhooks \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhook",
    "events": ["blocked", "violation"],
    "secret": "webhook-secret"
  }'
```

## Policy Configuration

### Default Policies

Three default policies are created automatically:

1. **Block Secrets** (`block_secrets`)
   - Action: BLOCK
   - Min confidence: 0.7
   - Violation types: SECRET

2. **Redact PII** (`redact_pii`)
   - Action: REDACT
   - Min confidence: 0.7
   - Violation types: PII

3. **Block Injection** (`block_injection`)
   - Action: BLOCK
   - Min confidence: 0.75
   - Violation types: PROMPT_INJECTION

**Modify via API:**
```bash
curl -X PUT https://your-gateway.railway.app/api/policies/block_secrets \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "min_confidence": 0.8,
    "enabled": true
  }'
```

## Security Settings

### Input Validation

All requests are validated for:
- Content length limits
- Message count limits
- Token limits
- Model name format

### Response Scanning

Responses are scanned before being sent to users (non-streaming only).

**Streaming:** Currently allows original request (TODO: implement buffering)

## Environment Variable Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | None | PostgreSQL connection string |
| `FIREWALL_API_KEY` | No | None | Gateway API key |
| `CORS_ALLOWED_ORIGINS` | No | `*` | Allowed CORS origins |
| `DEMO_MODE` | No | `false` | Enable demo mode |
| `REQUIRE_API_AUTH` | No | `false` | Require API auth |
| `OPENAI_API_KEY` | No | None | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | None | Anthropic API key |
| `GOOGLE_API_KEY` | No | None | Google API key |
| `DB_POOL_SIZE` | No | `10` | Database pool size |
| `DB_MAX_OVERFLOW` | No | `20` | Max database connections |
| `MAX_CONTENT_LENGTH` | No | `100000` | Max content length |
| `MAX_MESSAGES` | No | `100` | Max messages per request |
| `MAX_TOKENS_LIMIT` | No | `100000` | Max tokens limit |

## Production Recommendations

1. **Set FIREWALL_API_KEY:** Protect admin endpoints
2. **Set REQUIRE_API_AUTH=true:** Require authentication
3. **Restrict CORS:** Set specific origins, not `*`
4. **Use HTTPS:** Always use HTTPS in production
5. **Monitor Metrics:** Set up Prometheus/Grafana
6. **Set Up Alerts:** Configure webhooks for critical events
7. **Regular Backups:** Backup PostgreSQL database regularly
8. **Rate Limiting:** Configure appropriate rate limits
9. **Logging:** Set up log aggregation (e.g., Datadog, LogRocket)
10. **Health Checks:** Monitor `/health` endpoint

## Troubleshooting

### Check Configuration

```bash
# Test health
curl https://your-gateway.railway.app/health

# Check environment variables (if accessible)
# Most platforms show these in dashboard
```

### Common Issues

1. **Database Connection:** Check `DATABASE_URL` format
2. **CORS Errors:** Verify `CORS_ALLOWED_ORIGINS` includes your origin
3. **Authentication:** Ensure `FIREWALL_API_KEY` is set if using auth
4. **Rate Limiting:** Check if hitting rate limits
5. **Logs:** Check platform logs for detailed errors

## Next Steps

- See [GATEWAY_DEPLOYMENT.md](./GATEWAY_DEPLOYMENT.md) for deployment
- See [GATEWAY_INTEGRATION.md](./GATEWAY_INTEGRATION.md) for integration

