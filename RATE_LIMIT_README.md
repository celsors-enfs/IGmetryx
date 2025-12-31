# Rate Limiting - Free In-Memory Implementation

## Overview

This implementation provides **in-memory rate limiting** for AI-powered routes without requiring Redis, Upstash, or any paid services.

## Protected Routes

- **Caption & Hashtag Generator**: `POST /api/ig/generate`
- **Feed Analyzer**: `POST /api/feed-analyzer/start`

## Default Limits

- **Captions**: 10 requests per 24 hours
- **Feed Analyzer**: 5 requests per 24 hours

## Configuration

### Environment Variables

You can override default limits via environment variables:

```bash
# Caption & Hashtag Generator
RATE_LIMIT_IG_GENERATE_PER_DAY=10

# Feed Analyzer
RATE_LIMIT_FEED_ANALYZER_PER_DAY=5

# Dry-run mode (logs headers but doesn't block)
RATE_LIMIT_DRY_RUN=true
```

### Adjusting Limits

1. **Via `.env.local`** (recommended for local development):
   ```bash
   RATE_LIMIT_IG_GENERATE_PER_DAY=20
   RATE_LIMIT_FEED_ANALYZER_PER_DAY=10
   ```

2. **Via environment variables** (production):
   Set the same variables in your hosting platform.

3. **In code** (not recommended):
   Edit `server/api/lib/rateLimit.ts` → `getDefaultLimit()` function.

## How It Works

- **Fixed Window**: 24-hour windows (resets at midnight UTC)
- **Client Identification**: Uses IP address (with `x-forwarded-for` support) or user-agent hash
- **Fail-Open**: If limiter fails, requests are allowed (prevents breaking production)
- **In-Memory**: Data stored in Node.js Map (cleaned up automatically)

## Testing

### Dry-Run Mode

Test without blocking requests:

```bash
RATE_LIMIT_DRY_RUN=true npm run dev:api
```

Check server logs for rate limit headers.

### Test Script

```bash
# Test captions endpoint (make 12 requests)
node scripts/test-rate-limit.mjs captions 12

# Test feed analyzer endpoint
node scripts/test-rate-limit.mjs feed-analyzer 6
```

## Response Headers

All responses include rate limit headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until retry (only when blocked)

## Error Response (429)

When limit is exceeded:

```json
{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "You've used today's free limit for this tool. Try again in 3h 12m.",
    "retryAfterSec": 11520,
    "resetAt": "2025-01-02T00:00:00.000Z"
  }
}
```

Messages are automatically localized (EN/ES/PT-BR/FR) based on request language.

## Frontend Handling

The frontend automatically:
- Detects 429 responses
- Shows localized error messages
- Displays retry time in human-readable format

## Limitations

- **In-Memory Only**: Limits reset on server restart
- **Single Server**: Doesn't work across multiple server instances
- **No Persistence**: Data lost on restart (by design for free tier)

For production with multiple servers, consider upgrading to Redis/Upstash.

## Troubleshooting

### Limits not working?

1. Check `RATE_LIMIT_DRY_RUN` is not set to `true`
2. Verify headers in response: `X-RateLimit-*`
3. Check server logs for rate limit messages

### Too restrictive?

Increase limits via environment variables (see Configuration section).

### Need to reset limits?

Restart the server (in-memory data is cleared).

