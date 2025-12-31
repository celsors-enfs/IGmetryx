# How to Run Locally - IGmetryx DeepSeek Integration

## Quick Start Checklist

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

### 4. Test the API

#### Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "deepseek": "configured",
  "model": "deepseek-chat",
  "baseUrlHost": "api.deepseek.com",
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

### 5. Open in Browser
Navigate to: **http://localhost:5173**

Go to the "Caption & Hashtag Generator" tool and test generation.

## Expected Response Format

```json
{
  "captions": {
    "short": "Short caption text...",
    "medium": "Medium caption text...",
    "long": "Long caption text..."
  },
  "hashtags": "#tag1 #tag2 #tag3 ...",
  "cache": {
    "hit": false
  }
}
```

## Troubleshooting

### "command not found" errors
- Ensure dependencies are installed: `npm install`
- Check that `tsx` and `concurrently` are in `devDependencies`

### "Failed to fetch" in browser
- Verify API server is running: check terminal output
- Test health endpoint: `curl http://localhost:3001/health`
- Check browser console for detailed error

### API returns error
- Check `.env.local` exists and has correct format
- Verify `DEEPSEEK_API_KEY` is set (if using AI)
- Check server logs for detailed error messages

### Port already in use
- Change `PORT` in `.env.local` to a different port (e.g., 3002)
- Update frontend `VITE_API_BASE_URL` if needed

## Files Changed

- `server/api/lib/deepseek.ts` (NEW) - DeepSeek API client
- `server/api/lib/prompts.ts` (NEW) - Prompt builders
- `server/api/ig/generate.ts` - Main handler with cache
- `server/lib/cache.ts` - Cache layer (6h TTL, 500 entries)
- `server/index.ts` - Health check endpoint
- `src/lib/api/captions-hashtags.ts` - Frontend API client
- `src/pages/CaptionHashtagGeneratorPage.tsx` - UI updates
- `package.json` - Added test:api script
- `scripts/test-api.js` (NEW) - API test script

## Notes

- Cache TTL: 6 hours
- Cache size: 500 entries max
- Rate limiting: Not implemented (can be added if needed)
- Always returns both captions and hashtags
- No "AI" or "offline fallback" mentions in UI
- AdSense-safe disclaimers included

