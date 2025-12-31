# Local Development Setup - IGmetryx

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create `.env.local` File

Create a `.env.local` file in the project root with the following variables:

```env
# DeepSeek API Configuration (optional - fallback works without it)
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_CHAT_PATH=/v1/chat/completions

# Server Configuration
PORT=3001
ALLOWED_ORIGIN=http://localhost:5173

# Frontend API URL (optional, defaults to http://localhost:3001)
VITE_API_BASE_URL=http://localhost:3001

# Node Environment (optional)
NODE_ENV=development
```

**Important:** 
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Replace `your_api_key_here` with your actual DeepSeek API key
- If `DEEPSEEK_API_KEY` is not set, the system will use an offline fallback generator

### 3. Start Development Servers

**Option A: Run both frontend and API together (recommended):**

```bash
npm run dev:all
```

**Option B: Run them separately (in separate terminals):**

Terminal 1 - API Server:
```bash
npm run dev:api
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### 4. Verify Setup

#### Test Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "deepseek": "configured" | "not_configured",
  "model": "deepseek-chat",
  "baseUrl": "api.deepseek.com",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Test Caption Generation (English)

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

Expected response structure:
```json
{
  "ok": true,
  "result": {
    "captions": {
      "short": "...",
      "medium": "...",
      "long": "..."
    },
    "hashtags": {
      "all": ["#tag1", "#tag2", ...],
      "groups": {
        "niche": ["#..."],
        "mid": ["#..."],
        "broad": ["#..."]
      }
    }
  },
  "meta": {
    "source": "deepseek" | "cache" | "fallback",
    "cacheHit": true | false,
    "language": "en",
    "model": "deepseek-chat",
    "requestId": "abc123..."
  }
}
```

#### Test Caption Generation (Portuguese)

```bash
curl -X POST http://localhost:3001/api/ig/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "both",
    "language": "pt-BR",
    "tone": "friendly",
    "length": "medium",
    "hashtagCount": 15,
    "topic": "café da manhã"
  }'
```

### 5. Verify Cache Works

1. Make the same request twice with identical parameters
2. First request: `meta.source` should be `"deepseek"` and `meta.cacheHit` should be `false`
3. Second request: `meta.source` should be `"cache"` and `meta.cacheHit` should be `true`

## URLs

- **Frontend:** http://localhost:5173 (or port shown in Vite output)
- **API Server:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **API Endpoint:** http://localhost:3001/api/ig/generate

## Features

- ✅ **Unified endpoint:** `/api/ig/generate` handles captions, hashtags, or both
- ✅ **Caching:** 24-hour TTL cache with file persistence (saved to `.cache/igmetryx-cache.json`)
- ✅ **Rate limiting:** 30 requests per 10 minutes per IP
- ✅ **DeepSeek integration:** Uses DeepSeek API when configured, with retries and timeouts
- ✅ **Fallback mode:** Uses template generator if DeepSeek API key not configured
- ✅ **Security:** API key never exposed to client (server-side only)
- ✅ **Multi-language:** Supports PT-BR, EN, ES, FR
- ✅ **AdSense-safe:** No scraping, no auto-fetching, clear disclaimers

## Troubleshooting

### API server not starting

- Check if port 3001 is already in use
- Verify `.env.local` exists and is in the project root
- Check terminal output for error messages
- Ensure `tsx` is installed: `npm install -D tsx`

### Frontend can't connect to API

- Ensure API server is running on port 3001
- Check `ALLOWED_ORIGIN` in `.env.local` matches your frontend URL (default: http://localhost:5173)
- Check browser console for CORS errors
- Verify `VITE_API_BASE_URL` is set correctly (or defaults to http://localhost:3001)

### "DeepSeek API: NOT CONFIGURED"

- This is normal if `DEEPSEEK_API_KEY` is not set
- The system will use an offline fallback generator
- To use DeepSeek AI, add your API key to `.env.local`
- Verify the key is correct and has no extra spaces

### Dependencies not found

- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Verify `tsx` and `concurrently` are in `devDependencies`

### "Failed to fetch" error in browser

- Check if API server is running: `curl http://localhost:3001/health`
- Verify CORS is configured correctly
- Check browser console for detailed error messages
- Ensure frontend is using the correct API base URL

### Cache not working

- Cache files are stored in `.cache/igmetryx-cache.json`
- Cache has a 24-hour TTL
- Server restarts will load cache from disk
- Check server logs for "CACHE HIT ✅" or "CACHE MISS ⏳" messages

## API Response Format

### Success Response

```json
{
  "ok": true,
  "result": {
    "captions": {
      "short": "Short caption text...",
      "medium": "Medium caption text...",
      "long": "Long caption text..."
    },
    "hashtags": {
      "all": ["#tag1", "#tag2", ...],
      "groups": {
        "niche": ["#niche1", ...],
        "mid": ["#mid1", ...],
        "broad": ["#broad1", ...]
      }
    }
  },
  "meta": {
    "source": "deepseek" | "cache" | "fallback",
    "cacheHit": true | false,
    "language": "en" | "pt-BR" | "es" | "fr",
    "model": "deepseek-chat",
    "requestId": "abc123..."
  }
}
```

### Error Response

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  },
  "meta": {
    "source": "fallback",
    "cacheHit": false,
    "language": "en",
    "requestId": "abc123..."
  }
}
```

## Rate Limiting

- **Limit:** 30 requests per 10 minutes per IP address
- **Response:** 429 status code with friendly error message
- **Recovery:** Wait for the rate limit window to reset (shown in `retryAfter` field)

## Security Notes

- API keys are NEVER exposed to the browser
- All DeepSeek API calls happen server-side only
- Cache does not store sensitive data (only topic text)
- Rate limiting prevents abuse
- CORS is configured to only allow requests from the configured origin
