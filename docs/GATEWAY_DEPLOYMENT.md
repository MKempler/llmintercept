# Gateway Deployment Guide

## Overview

This guide walks you through deploying the AI Prompt Firewall Gateway to production. The gateway can be deployed to Railway, Render, Fly.io, AWS, or any platform that supports Python/FastAPI applications.

## Prerequisites

- GitHub repository with the gateway code
- Account on your chosen hosting platform
- PostgreSQL database (provided by hosting platform or external)
- LLM API keys (OpenAI, Anthropic, Google - as needed)

## Quick Start: Railway Deployment

Railway is the recommended platform for quick deployment.

### Step 1: Connect Repository

1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository

### Step 2: Add PostgreSQL Database

1. In Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. Note the `DATABASE_URL` connection string (auto-set as environment variable)

### Step 3: Configure Environment Variables

Go to your service → Variables tab and add:

**Required:**
```
DATABASE_URL=<auto-set by Railway PostgreSQL>
```

**Optional (but recommended):**
```
FIREWALL_API_KEY=your-secret-api-key-here
CORS_ALLOWED_ORIGINS=https://your-dashboard.com,https://your-app.com
DEMO_MODE=false
REQUIRE_API_AUTH=false
```

**LLM Provider Keys (if not using demo mode):**
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

### Step 4: Deploy

1. Railway will automatically detect Python/FastAPI
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn gateway.server:app --host 0.0.0.0 --port $PORT`
4. Click "Deploy"
5. Wait for deployment to complete (~2-3 minutes)

### Step 5: Get Your Gateway URL

1. Once deployed, Railway provides a public URL
2. Example: `https://your-gateway.railway.app`
3. Test it: `curl https://your-gateway.railway.app/health`
4. Should return: `{"status": "healthy"}`

## Alternative Platforms

### Render

1. Create new Web Service
2. Connect GitHub repository
3. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn gateway.server:app --host 0.0.0.0 --port $PORT`
4. Add PostgreSQL database
5. Set environment variables (same as Railway)
6. Deploy

### Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Create app: `fly launch`
4. Add PostgreSQL: `fly postgres create`
5. Attach database: `fly postgres attach <db-name>`
6. Set secrets: `fly secrets set FIREWALL_API_KEY=...`
7. Deploy: `fly deploy`

### AWS (Elastic Beanstalk)

1. Create Elastic Beanstalk application
2. Upload code or connect Git
3. Set platform: Python 3.11
4. Add RDS PostgreSQL database
5. Configure environment variables
6. Deploy

### Docker Deployment

1. Build image:
   ```bash
   docker build -f Dockerfile.gateway -t aifirewall-gateway .
   ```

2. Run container:
   ```bash
   docker run -d \
     -p 8000:8000 \
     -e DATABASE_URL=postgresql://... \
     -e FIREWALL_API_KEY=... \
     aifirewall-gateway
   ```

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

### Optional

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `FIREWALL_API_KEY` | API key for gateway authentication | None | `your-secret-key` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed origins | `*` | `https://app.com,https://dashboard.com` |
| `DEMO_MODE` | Enable demo mode (no API keys needed) | `false` | `true` |
| `REQUIRE_API_AUTH` | Require API key for admin endpoints | `false` | `true` |
| `OPENAI_API_KEY` | OpenAI API key (fallback) | None | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key (fallback) | None | `sk-ant-...` |
| `GOOGLE_API_KEY` | Google API key (fallback) | None | `...` |
| `DB_POOL_SIZE` | Database connection pool size | `10` | `20` |
| `DB_MAX_OVERFLOW` | Max database connections | `20` | `30` |
| `MAX_CONTENT_LENGTH` | Max request content length (chars) | `100000` | `200000` |
| `MAX_MESSAGES` | Max messages per request | `100` | `200` |
| `MAX_TOKENS_LIMIT` | Max tokens limit | `100000` | `200000` |

## Health Check

After deployment, verify the gateway is working:

```bash
curl https://your-gateway.railway.app/health
```

Expected response:
```json
{"status": "healthy"}
```

## Testing Deployment

### Test Blocking

```bash
curl -X POST https://your-gateway.railway.app/v1/chat/completions \
  -H "Authorization: Bearer sk-test" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "My AWS key is AKIAIOSFODNN7EXAMPLE"}]
  }'
```

Should return 403 with violation details.

### Test Allowed Request

```bash
curl -X POST https://your-gateway.railway.app/v1/chat/completions \
  -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

Should return normal OpenAI response.

## Custom Domain (Optional)

### Railway

1. Go to your service → Settings → Domains
2. Click "Generate Domain" or "Custom Domain"
3. Add your domain
4. Update DNS records as instructed

### Other Platforms

Follow platform-specific instructions for custom domains.

## Monitoring

### Railway

- View logs: Service → Deployments → Click deployment → Logs
- View metrics: Service → Metrics tab

### Prometheus Metrics

Access Prometheus metrics at:
```
https://your-gateway.railway.app/metrics
```

## Troubleshooting

### Deployment Fails

1. **Check build logs:** Look for Python/pip errors
2. **Verify requirements.txt:** Ensure all dependencies are listed
3. **Check Python version:** Platform should use Python 3.8+

### Gateway Not Responding

1. **Check health endpoint:** `curl https://your-gateway.railway.app/health`
2. **Check logs:** Look for startup errors
3. **Verify database connection:** Check `DATABASE_URL` is correct
4. **Check port:** Ensure platform uses `$PORT` environment variable

### Database Connection Errors

1. **Verify DATABASE_URL:** Check connection string format
2. **Check database is running:** Verify PostgreSQL is accessible
3. **Check network:** Ensure gateway can reach database
4. **Check credentials:** Verify username/password are correct

### CORS Errors

1. **Set CORS_ALLOWED_ORIGINS:** Add your frontend origins
2. **Check gateway logs:** Look for CORS-related errors
3. **Verify headers:** Check request includes proper headers

## Production Checklist

- [ ] Gateway deployed and accessible
- [ ] Health check returns `{"status": "healthy"}`
- [ ] Database connected and migrations run
- [ ] Environment variables configured
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS enabled
- [ ] Monitoring set up
- [ ] Logs accessible
- [ ] Test blocking works
- [ ] Test allowed requests work
- [ ] Dashboard can connect to gateway

## Next Steps

- See [GATEWAY_INTEGRATION.md](./GATEWAY_INTEGRATION.md) for integration instructions
- See [GATEWAY_CONFIGURATION.md](./GATEWAY_CONFIGURATION.md) for detailed configuration
- Set up dashboard deployment (separate service)

