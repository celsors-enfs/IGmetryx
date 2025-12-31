# Setup and Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env.local` File
Create a file named `.env.local` in the project root:

```env
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
PORT=3001
ALLOWED_ORIGIN=http://localhost:5173
```

**Note:** If `DEEPSEEK_API_KEY` is not set, the system will use a graceful fallback generator.

### 3. Start Development Servers
```bash
npm run dev:all
```

This starts both:
- Frontend (Vite) at http://localhost:5173
- Backend API at http://localhost:3001

### 4. Test the Application

#### Open in Browser
Navigate to: **http://localhost:5173**

Go to: **http://localhost:5173/instagram/caption-hashtag-generator**

#### Test Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "deepseek": "configured",
  "model": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Test Generation Endpoint
```bash
curl -X POST http://localhost:3001/api/ig/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "both",
    "language": "en",
    "tone": "friendly",
    "length": "medium",
    "hashtagCount": 15,
    "topic": "coffee morning"
  }'
```

Or use the test script:
```bash
npm run test:api
```

## Expected API Response Format

```json
{
  "ok": true,
  "result": {
    "captions": {
      "short": "Short caption text...",
      "medium": "Medium caption text...",
      "long": "Long caption text..."
    },
    "hashtags": ["#tag1", "#tag2", "#tag3", ...],
    "language": "en",
    "tone": "friendly",
    "length": "medium",
    "hashtagCount": 15,
    "topic": "coffee morning"
  },
  "meta": {
    "cache_hit": false,
    "provider": "deepseek",
    "request_id": "abc123"
  }
}
```

## Troubleshooting

### "command not found" errors
- Ensure dependencies are installed: `npm install`
- Check that `tsx` and `concurrently` are in `devDependencies` (they should be)

### "Failed to fetch" in browser
- Verify API server is running: check terminal output
- Test health endpoint: `curl http://localhost:3001/health`
- Check browser console for detailed error
- Ensure Vite proxy is configured (check `vite.config.ts`)

### API returns error
- Check `.env.local` exists and has correct format
- Verify `DEEPSEEK_API_KEY` is set (if using AI)
- Check server logs for detailed error messages
- Test with `npm run test:api`

### Port already in use
- Change `PORT` in `.env.local` to a different port (e.g., 3002)
- Update `vite.config.ts` proxy target if needed

### Module not found errors
- Ensure `server/api/lib/deepseek.ts` and `server/api/lib/prompts.ts` exist
- Check import paths in `server/api/ig/generate.ts` (should be `./lib/deepseek.js`)

## Files Changed

### Backend
- `server/api/ig/generate.ts` - Standardized response format, fixed imports
- `server/api/lib/deepseek.ts` - DeepSeek API client
- `server/api/lib/prompts.ts` - Updated to return hashtags as array
- `server/index.ts` - Health check endpoint
- `server/lib/cache.ts` - Cache configuration (6h TTL, 500 entries)

### Frontend
- `src/lib/api/captions-hashtags.ts` - Updated to use relative paths and handle standardized response
- `src/pages/CaptionHashtagGeneratorPage.tsx` - Complete UI with error handling
- `vite.config.ts` - Added proxy configuration

### Configuration
- `package.json` - Scripts already configured correctly
- `.env.example` - Template for environment variables
- `scripts/test-api.js` - API test script

## Verification Checklist

- [ ] `npm install` completes without errors
- [ ] `npm run dev:all` starts both servers
- [ ] Health check returns `deepseek: "configured"` when API key is set
- [ ] Frontend loads at http://localhost:5173
- [ ] Caption generator page loads without errors
- [ ] Form submission generates captions and hashtags
- [ ] Results display correctly (3 captions + hashtags)
- [ ] Copy buttons work
- [ ] Error messages display gracefully
- [ ] No console errors about "meta" or "undefined"

## Notes

- Cache TTL: 6 hours
- Cache size: 500 entries max
- Rate limiting: 30 requests per 10 minutes per IP
- Always returns both captions and hashtags
- No "AI" mentions in UI (AdSense-safe)
- Disclaimer included at bottom of results

