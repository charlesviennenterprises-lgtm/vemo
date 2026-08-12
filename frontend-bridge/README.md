# VEMO Frontend Bridge

This folder is the portable connection layer between the customer-facing MyVemo frontend and the VEMO backend.

## Product rule

VEMO remains free. Do not add billing, subscriptions, credits, checkout, payment providers, premium generation gates, or paid usage tiers.

## Frontend environment

For local development:

```env
VITE_VEMO_API_URL=http://localhost:3001
```

For production:

```env
VITE_VEMO_API_URL=https://api.myvemo.online
```

If the frontend proxies `/api` and `/health` to VEMO on the same domain, the variable can be omitted and the bridge will use relative URLs.

## Use in the MyVemo frontend

Copy or import `vemo-api.ts`, then use one VEMO client across Create, Library, Discover, Playlists, Profiles, and the Player.

### Create a song

```ts
const job = await vemoApi.generation.create({
  customMode: true,
  title,
  lyrics,
  style,
  instrumental,
}, token);

const finished = await waitForVemoGeneration(job.jobId, token, (job) => {
  setProgress(job.progress || 0);
  setStage(job.stage || job.status);
});
```

### Load a user's library

```ts
const { songs } = await vemoApi.songs.mine(token);
```

### Load Discover

```ts
const { songs } = await vemoApi.songs.public(30, 0);
```

### Load featured music

```ts
const { songs } = await vemoApi.songs.featured();
```

## Screen-to-API map

| MyVemo screen | VEMO backend |
| --- | --- |
| Create | `POST /api/generate` + generation status |
| Library | `GET /api/songs` |
| Discover | `GET /api/songs/public` |
| Featured | `GET /api/songs/public/featured` |
| Song page / Player | `GET /api/songs/:id` |
| Likes | `POST /api/songs/:id/like` |
| Playlists | `/api/playlists` |
| Profiles | `/api/users/:username` |
| Login/session | `/api/auth/*` |

## Deployment boundary

The browser calls only VEMO. VEMO calls ACE-Step privately. Never place `ACESTEP_API_URL` in frontend code and never expose the ACE-Step service directly to the public internet.
