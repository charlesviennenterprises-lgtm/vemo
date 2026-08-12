# Phase 4 — Production Deployment

## Target architecture

```text
https://myvemo.online
        |
        v
VEMO static frontend (myvemo-site/)
        |
        v
https://api.myvemo.online
        |
        v
VEMO Express API (server/)
        |
        v
Private ACE-Step 1.5 GPU worker
```

## Free-product rule

Do not add billing, subscriptions, credits, checkout, payment providers, paid generation tiers, paid radio rotation, affiliate commissions, or other payment gates.

## Frontend

Deploy `myvemo-site/` as a static site. The browser API client automatically uses `https://api.myvemo.online` outside localhost.

A `vercel.json` is included in `myvemo-site/` for a static deployment.

## VEMO API

The API is container-ready using `server/Dockerfile`.

Required production environment variables:

```env
PORT=3001
NODE_ENV=production
SERVICE_NAME=VEMO API
DATABASE_PATH=/app/data/vemo.db
AUDIO_DIR=/app/public/audio
FRONTEND_URL=https://myvemo.online
FRONTEND_URLS=https://myvemo.online
ACESTEP_API_URL=http://ace-step-worker:8001
JWT_SECRET=<long-random-secret>
PEXELS_API_KEY=
```

Persist these paths if local storage is used:

- `/app/data`
- `/app/public/audio`

## ACE-Step worker

ACE-Step remains private. Do not expose its Gradio/API port directly to the public internet. Only the VEMO API should call it through `ACESTEP_API_URL`.

## Launch test

1. Open `https://myvemo.online/create.html`.
2. Submit a short generation.
3. Confirm `POST /api/generate` returns a job ID.
4. Confirm job status progresses through queued/running/succeeded.
5. Confirm generated audio is playable.
6. Confirm the new song appears in Library.
7. Confirm a public song appears in Discover and VEMO Radio.

## Current hosting dependency

The connected Vercel workspace currently has no project configured. A hosting project and DNS binding must exist before `myvemo.online` can be published from this repository. The API also requires a reachable ACE-Step GPU worker before end-to-end generation can succeed.
