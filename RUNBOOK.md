# IGmetryx Runbook - DeepSeek Integration

## Quick Start (3 Commands)

```bash
# 1. Install dependencies
npm install

# 2. Start both frontend and backend
npm run dev:all

# 3. Test DeepSeek integration
npm run test:deepseek
```

## Setup Steps

### 1. Create `.env.local`

Create a file named `.env.local` in the project root with:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
PORT=3001
ALLOWED_ORIGIN=http://localhost:5173
```

**Important:** Get your API key from https://platform.deepseek.com/

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including `concurrently` and `tsx`.

### 3. Start Development Servers

```bash
npm run dev:all
```

This starts:
- Frontend (Vite) on http://localhost:5173
- Backend API on http://localhost:3001

You should see in the terminal:
```
[Server] ✅ IGmetryx API server running on port 3001
[Server] 🤖 DeepSeek: ✅ configured (model=deepseek-chat, host=api.deepseek.com)
```

## Testing

### Health Check

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "ok",
  "deepseek": "configured",
  "model": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com"
}
```

### DeepSeek Proof Test

```bash
npm run test:deepseek
```

**What it tests:**
- ✅ DeepSeek is being used (not fallback templates)
- ✅ Cache is working (first call = miss, second call = hit)
- ✅ Captions are contextualized (not template patterns)

**Expected output:**
```
🧪 DeepSeek Proof Test
============================================================

📤 Test 1: First API call (expecting cache miss)...
✅ Response received
   _provider: deepseek
   _cache: miss
✅ PASS: First call has _cache=miss
✅ PASS: _provider is "deepseek"
✅ PASS: No fallback template patterns detected
✅ PASS: Captions are contextualized

📤 Test 2: Second API call (expecting cache hit)...
✅ Response received
   _provider: deepseek
   _cache: hit
✅ PASS: Second call has _cache=hit

🎉 ALL TESTS PASSED!
```

## URLs

- **Frontend**: http://localhost:5173
- **API Health**: http://localhost:3001/health
- **API Endpoint**: http://localhost:3001/api/ig/generate

## Success Indicators

✅ **Everything is working when:**
- Health check shows `"deepseek": "configured"`
- `npm run test:deepseek` shows all tests passing
- Server logs show: `[Server] 🤖 DeepSeek: ✅ configured`
- Generated captions are unique and contextualized (not template patterns)
- Frontend displays captions and hashtags correctly

## Troubleshooting

### "command not found" errors
- **Solution**: Run `npm install` first

### "DeepSeek not configured"
- **Solution**: Check `.env.local` exists and has `DEEPSEEK_API_KEY` set
- Verify: `cat .env.local | grep DEEPSEEK_API_KEY`

### "Network error" in frontend
- **Solution**: Ensure API server is running: `npm run dev:api`
- Check: `curl http://localhost:3001/health`

### Rate limited (429 error)
- **Solution**: Wait 10 minutes or restart the server
- Rate limit: 20 requests per 10 minutes per IP

### Test fails with "Expected _provider='deepseek'"
- **Solution**: 
  1. Check `.env.local` has valid `DEEPSEEK_API_KEY`
  2. Verify health check shows `"deepseek": "configured"`
  3. Check server logs for DeepSeek API errors

### Captions look like templates
- **Solution**: 
  1. Verify DeepSeek API key is valid
  2. Check server logs for DeepSeek errors
  3. Run `npm run test:deepseek` to verify

## Internal Fields (Not Shown in UI)

The API response includes internal fields for debugging:
- `_provider`: `"deepseek"` | `"fallback"` - Which provider was used
- `_cache`: `"hit"` | `"miss"` - Cache status

These are only visible in API responses, not in the UI.

## Files Changed

- `server/api/ig/generate.ts` - Main API handler with DeepSeek integration
- `server/api/lib/deepseek.ts` - DeepSeek API client
- `server/api/lib/prompts.ts` - Prompt builders
- `server/lib/cache.ts` - Cache implementation (6h TTL, 500 entries)
- `scripts/test-deepseek.js` - Proof test script
- `src/lib/api/captions-hashtags.ts` - Frontend API client
- `src/pages/CaptionHashtagGeneratorPage.tsx` - Complete UI component
- `package.json` - Added `test:deepseek` script
- `README_API.md` - Updated documentation

## Next Steps

1. ✅ Run `npm install`
2. ✅ Create `.env.local` with your DeepSeek API key
3. ✅ Run `npm run dev:all`
4. ✅ Open http://localhost:5173
5. ✅ Test with `npm run test:deepseek`

That's it! The system is now fully configured to use DeepSeek for real caption generation.


