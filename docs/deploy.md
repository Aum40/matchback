# Deploying MATCHBACK (Railway + Vercel)

The live demo runs on **Railway** (PostgreSQL + API) and **Vercel** (web):
[matchback-web-taupe.vercel.app](https://matchback-web-taupe.vercel.app).

Whoever deploys uses **their own** Railway and Vercel accounts. Secrets live only in those dashboards. **Never commit them or paste them in group chat** — this repo is public.

```
Browser ─▶ Vercel (web/)  ──API_URL──▶  Railway API (api/)  ──DATABASE_URL──▶  Railway PostgreSQL
```

Order: **1 Railway database → 2 Railway API → 3 Vercel → 4 connect the URLs → 5 seed → 6 check**. Always deploy from `main`.

## 0. GitHub access (collaborators)

The repo belongs to `Aum40` (transferred from `wipabhorn-s`; old links redirect). Railway and Vercel deploy automatically on every merge to `main` through their **GitHub App**. A collaborator can't install an app on someone else's personal repo, so when Railway or Vercel asks for access, **request** the install for `matchback`. The repo owner gets a GitHub notification and approves it, choosing **Only select repositories → matchback**.

## 1. Railway (database)

1. **New Project → Add PostgreSQL.**
2. The API service below references this database, so there is nothing to copy yet.

## 2. Railway (API)

1. In the same project, **Add service → GitHub repo → `matchback`**, branch `main`.
2. Settings:

| Setting | Value |
|---|---|
| Root Directory | `api` |
| Build Command | `pnpm install --frozen-lockfile && pnpm build` |
| Start Command | `pnpm prisma migrate deploy && pnpm start:prod` |

   The API needs Node 24 (`engines` requires 24.15 or later). If the build picks another version, add the variable `RAILPACK_NODE_VERSION=24`.

3. Variables (the full list and what each one means are in [`api/.env.example`](../api/.env.example) and `api/src/config/env.validation.ts`):

| Key | Value |
|---|---|
| `DATABASE_URL` | a reference to the PostgreSQL service's `DATABASE_URL` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://example.com` for now (fixed in step 4) |
| `ACCESS_TOKEN_SECRET` | a long random string |
| `INTERNAL_API_SECRET` | a random string of at least 32 characters, the same value as on Vercel |
| `TRUST_PROXY` | `1` (Railway puts one proxy in front of the API) |
| `BREVO_API_KEY`, `MAIL_FROM` | **required**: production refuses to boot without them. Get a free key at brevo.com → SMTP & API → API Keys. `MAIL_FROM` must be a sender you verified in Brevo. |
| `GEMINI_API_KEY` | optional server-side key (without it or when Gemini fails, the AI buttons use deterministic fallback) |

   Random values: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

4. **Settings → Networking → Generate Domain** gives the API URL, e.g. `https://matchback-api-production.up.railway.app`.
5. Open `<API URL>/health` and you should get `{"status":"ok"}`.

## 3. Vercel (web)

1. **Add New → Project**, import `matchback`, and set **Root Directory = `web`** (framework is detected as Next.js).
2. **Settings → Node.js Version: 24.x.**
3. Environment Variables (Production):

| Key | Value |
|---|---|
| `API_URL` | the Railway API URL from step 2 (no trailing `/`) |
| `AUTH_SECRET` | random, same command as above |
| `AUTH_URL` | your Vercel URL, e.g. `https://matchback.vercel.app`. **Required**: without it login silently bounces back to `/login`. |
| `INTERNAL_API_SECRET` | the same value as on the Railway API |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1`, so Vercel uses pnpm 11.8.0 from `packageManager`. Older pnpm fails our `engines` check. |

4. Deploy. If it fails at install with an engine error, check the Node version (24.x) and the corepack variable.

## 4. Connect the URLs

On the Railway API, set `FRONTEND_URL` = your Vercel URL (no trailing `/`). Railway redeploys.

## 5. Seed the demo data (once, and again whenever you want to reset the demo)

Run the seed from a laptop against the Railway database. Use the PostgreSQL service's **public** connection URL (`DATABASE_PUBLIC_URL` in its Variables); the internal one only works inside Railway. Use **separate demo passwords** for production, not the ones in your local `.env`.

PowerShell, inside `matchback/api` (needs Node 24.15+ and `pnpm install` done):

```powershell
$env:DATABASE_URL = "<public Railway PostgreSQL URL>"
$env:SEED_DEMO_PASSWORD = "<demo candidate password>"
$env:SEED_RECRUITER_PASSWORD = "<demo recruiter password>"
$env:SEED_ADMIN_PASSWORD = "<admin password>"
pnpm prisma migrate deploy
pnpm db:seed
```

Then close that terminal so the URL and passwords don't stay in your session. Passwords must have 8+ characters with upper, lower, a number and a symbol. Share them with the team privately, not in the repo.

## 6. Check like a judge would

In a **private/incognito window**:
- [ ] `<API URL>/health` returns `{"status":"ok"}`
- [ ] The Vercel home page shows sample jobs (proves web → API → DB)
- [ ] Log in as `demo@matchback.dev`; Discover shows cards; a swipe works; a job detail page loads
- [ ] Log in as `recruiter@matchback.dev`; the job's candidate deck loads
- [ ] No errors in the Railway deploy logs / Vercel function logs

## Updating

Merge to `main` → Railway and Vercel redeploy automatically. Migrations apply when the API starts. New demo data needs step 5 again.

## Render (not used)

[`render.yaml`](../render.yaml) is a Render Blueprint written before the team chose Railway. The live demo does not use it; it is kept for anyone who wants to deploy the API to Render instead.
