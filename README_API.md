# IGmetryx API - Quick Start

## Setup (3 Commands)

```bash
# 1. Install dependencies
npm install

# 2. Start both frontend and backend
npm run dev:all

# 3. Test DeepSeek integration
npm run test:deepseek
```

## URLs

- **Frontend**: http://localhost:5173
- **Health Check**: http://localhost:3001/health

## Environment Variables

Create `.env.local` in the project root:

```env
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
PORT=3001
ALLOWED_ORIGIN=http://localhost:5173
```

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### DeepSeek Proof Test
```bash
npm run test:deepseek
```

This test verifies:
- ✅ DeepSeek is being used (not fallback templates)
- ✅ Cache is working (first call = miss, second call = hit)
- ✅ Captions are contextualized (not template patterns)

## Success Indicators

When everything is working:
- Health check shows `"deepseek": "configured"`
- `npm run test:deepseek` shows all tests passing
- Generated captions are unique and contextualized
- Frontend displays captions and hashtags correctly

## Troubleshooting

- **"command not found"**: Run `npm install` first
- **"DeepSeek not configured"**: Check `.env.local` has `DEEPSEEK_API_KEY`
- **"Network error"**: Ensure API server is running (`npm run dev:api`)
- **Rate limited**: Wait 10 minutes or restart server
