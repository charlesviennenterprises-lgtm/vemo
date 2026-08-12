# VEMO Creator Frontend

This package is the customer-facing frontend for VEMO.

## Core pages
- `index.html` — VEMO home
- `create.html` — free AI music creation
- `music.html` — Discover public VEMO songs
- `radio.html` — free auto-advancing community radio
- `library.html` — signed-in creator song library
- `tv.html` — VEMO TV creator/video station

Legacy media pages remain available as community/brand pages, but no billing or checkout logic is included.

## Backend connection
The frontend talks only to the VEMO API. ACE-Step stays private behind the VEMO backend.

Default API base:
- Local: `http://localhost:3001`
- Production: `https://api.myvemo.online`

Override it in the browser with:

```js
localStorage.setItem('vemo_api_base', 'https://your-api.example.com')
```

## Free product rule
Do not add subscriptions, paid tiers, credits, checkout, payment providers, or paid generation gates.
