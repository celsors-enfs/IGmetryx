# Render Deployment Instructions

## API Deployment on Render

### Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (`IGmetryx`)
4. Configure the service:
   - **Name**: `igmetryx-api` (or your preferred name)
   - **Region**: `Oregon` (or closest to your users)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (root of repo)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build:server`
   - **Start Command**: `npm run start:api`
   - **Plan**: `Free`

### Step 2: Configure Environment Variables

Click on **"Environment"** tab and add:

```
NODE_ENV=production
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

**Important**: 
- Get your `DEEPSEEK_API_KEY` from [DeepSeek Console](https://platform.deepseek.com/)
- Do NOT commit `.env.local` or API keys to Git
- Render will inject `PORT` automatically (no need to set it)

### Step 3: Configure Health Check

In the service settings:
- **Health Check Path**: `/health`
- Render will check this endpoint to ensure the service is running

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for the first deployment to complete
3. Your API URL will be: `https://igmetryx-api.onrender.com` (or your service name)

### Step 5: Verify Deployment

1. Visit `https://igmetryx-api.onrender.com/health`
2. Should return: `{"ok": true, "status": "ok", "timestamp": "..."}`

---

## Frontend Configuration on Vercel

### Step 1: Add Environment Variable

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://igmetryx-api.onrender.com` (your Render API URL)
   - **Environment**: Select all (Production, Preview, Development)

### Step 2: Redeploy

1. Go to **Deployments** tab
2. Click **"⋯"** on the latest deployment
3. Click **"Redeploy"**

**Important**: After setting the env var, you MUST redeploy for it to take effect.

---

## Verification

After both deployments are complete:

1. **API Health**: Visit `https://igmetryx-api.onrender.com/health`
2. **Frontend**: Visit your Vercel URL and test:
   - Caption & Hashtag Generator
   - Feed Analyzer

Both tools should now call the Render API instead of localhost.

---

## Troubleshooting

### API not responding
- Check Render logs: Dashboard → Your Service → "Logs"
- Verify environment variables are set correctly
- Check that `/health` endpoint returns 200

### CORS errors in browser console
- Verify your Vercel domain is allowed (Render CORS allows `*.vercel.app`)
- If using a custom domain, add it to `ALLOWED_ORIGIN` env var in Render

### "API unreachable" error
- Verify `VITE_API_BASE_URL` is set in Vercel
- Verify you redeployed Vercel after adding the env var
- Check Render service is running (green status in dashboard)

---

## Local Development

For local development, the frontend will use the Vite proxy (no `VITE_API_BASE_URL` needed):

- Frontend: `npm run dev` (port 5173)
- API: `npm run dev:api` (port 3001)
- Vite proxy automatically forwards `/api/*` to `http://localhost:3001`

No changes needed for local development!


