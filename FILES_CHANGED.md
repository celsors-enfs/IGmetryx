# Files Changed for DeepSeek API Integration

## Summary
Fixed local dev workflow and implemented unified DeepSeek API endpoint for caption and hashtag generation with proper caching, rate limiting, and security.

## Files Changed

### Server-Side
1. **server/api/ig/generate.ts** (NEW)
   - Unified endpoint handler for `/api/ig/generate`
   - Supports `type: 'captions' | 'hashtags' | 'both'`
   - 24h cache TTL
   - 10 requests/hour rate limiting
   - DeepSeek API integration with fallback

2. **server/index.ts** (MODIFIED)
   - Updated to use new unified endpoint
   - Added health check with DeepSeek status
   - Legacy endpoint maintained for backward compatibility
   - Startup validation for API key

### Frontend
3. **src/lib/api/captions-hashtags.ts** (MODIFIED)
   - Updated to use `/api/ig/generate` endpoint
   - Removed `VITE_` prefix (security: API key server-side only)
   - Added support for new request/response format with meta

4. **src/pages/CaptionHashtagGeneratorPage.tsx** (MODIFIED)
   - Updated to use new API endpoint format
   - Fixed tone mapping (local → API format)
   - Added proper error handling for optional fields
   - Updated hashtag generation to use API

### Configuration
5. **package.json** (MODIFIED)
   - Added `express`, `cors` to dependencies
   - Added `concurrently`, `@types/express`, `@types/cors` to devDependencies
   - Updated scripts to use `npx` for tsx and concurrently (no global install needed)

6. **.gitignore** (ALREADY CORRECT)
   - `.env.local` already ignored

### Documentation
7. **SETUP_LOCAL.md** (NEW)
   - Local development setup guide
   - Quick start instructions
   - Testing examples (curl commands)

8. **README_API.md** (EXISTING - may need update)
   - Existing API documentation

## Environment Variables Required

Create `.env.local` in project root:
```bash
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
PORT=3001
```

## Commands to Run

```bash
# Install dependencies
npm install

# Run both frontend + API
npm run dev:all

# Or separately:
npm run dev        # Frontend (port 5175)
npm run dev:api    # API (port 3001)
```

## URLs

- Frontend: http://localhost:5175
- API: http://localhost:3001
- Health: http://localhost:3001/health
- Endpoint: http://localhost:3001/api/ig/generate

## Testing

### PT-BR Example
```bash
curl -X POST http://localhost:3001/api/ig/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"both","language":"pt-BR","tone":"friendly","length":"medium","hashtagCount":15,"topic":"café da manhã"}'
```

### EN Example
```bash
curl -X POST http://localhost:3001/api/ig/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"both","language":"en","tone":"professional","length":"medium","hashtagCount":20,"topic":"coffee morning"}'
```

## Security Notes

✅ API key (`DEEPSEEK_API_KEY`) is **NEVER** exposed to client
✅ No `VITE_` prefix used (server-side only)
✅ All API calls go through server endpoint
✅ Rate limiting prevents abuse
✅ Cache reduces API calls

## Features Implemented

- ✅ Unified endpoint (`/api/ig/generate`)
- ✅ 24-hour cache with cache hit detection
- ✅ 10 requests/hour rate limiting per IP
- ✅ DeepSeek API integration
- ✅ Automatic fallback to local generator
- ✅ Multi-language support (PT-BR, EN, ES, FR)
- ✅ Proper error handling and validation
- ✅ AdSense-safe (no thin content pages)


