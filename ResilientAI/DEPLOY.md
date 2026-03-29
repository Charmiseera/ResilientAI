# ResilientAI Deployment Guide

## Frontend → Vercel
- **Root directory:** `ResilientAI/frontend/`
- **Framework:** Next.js (auto-detected)
- **Config:** `frontend/vercel.json`
- **Env vars:** Add everything from `frontend/.env.vercel` into Vercel Dashboard → Settings → Environment Variables

## Backend → Railway (free)
- **Root directory:** `ResilientAI/` (repo root)
- **Runtime:** Python 3.11 / FastAPI / Uvicorn
- **Config:** `railway.json` + `Procfile`
- **Env vars:** Add everything from `.env.railway` into Railway Dashboard → Variables

## Deploy Order
1. Deploy **backend on Railway** first → get the public URL (e.g. `https://xxx.railway.app`)
2. Set `NEXT_PUBLIC_API_URL=https://xxx.railway.app/api/v1` in Vercel env vars
3. Deploy **frontend on Vercel** (point to `frontend/` subfolder)
4. Set `ALLOWED_ORIGINS=https://your-app.vercel.app` in Railway env vars
