# KCCORP VIRAL ENGINE v0.2 — TheWorldIsCrazzy

Private editorial control-plane MVP. No real video generation, OAuth connection or publishing is implemented. Designed to run as an isolated Railway service alongside (not inside) the existing AD ENGINE.

## Run
Node.js 22+, no dependencies. `ADMIN_TOKEN=$(openssl rand -hex 32) npm start` (save the generated secret first). Open http://localhost:3000. For tests: `npm test`.

## Pilot policy
- Channel: TheWorldIsCrazzy / @exclusiveclips28
- Two story concepts per day, each bilingual (English and Spanish): up to four localized deliverables.
- TikTok, Facebook, YouTube: disconnected; publishing disabled by design.
- Manual editorial review before any generation or upload.
- Label realistic synthetic scenes as fictional AI-generated simulations. Do not represent fictional catastrophes as real news.
- Do not claim account connection or post automatically without OAuth approval and explicit user consent.

## Deployment plan
1. Put this directory in its own private GitHub repository; connect to a **new** Railway service in project `KCCORP AI AD ENGINE`. Do not overwrite existing `ai-ad-engine` service.
2. Set `ADMIN_TOKEN` as a high-entropy secret in Railway variables and `DATA_DIR=/appdata/viral` with persistent volume attached at `/appdata`. Do not paste secrets into chat, Git, or frontend files.
3. Set healthcheck `/api/health`, start command `npm start`, and deploy. Verify `SUCCESS` and health response.
4. Add OAuth flows per provider with server-side state, PKCE where required, encrypted refresh tokens, expiration and scope management. Publishing API remains blocked until each provider is connected and allowed.
5. Implement rendering worker (Grok Imagine + licensed audio + captions), object storage, budgets, generation job retries, content quality review, language QA and human approval before uploads.
6. Add provider-specific upload workflows, compliance/disclosure flags, idempotency, rate limits and webhooks; start with private/draft uploads where supported.

## Safety gates
`/api/publish` always returns 403; `/api/generate` always returns 403. Future production versions must preserve manual approval, explicit per-channel authorization and audited publishing controls. Current `/api/plan` creates drafts only and does not run on a timer.

## Endpoints
- `GET /api/health` public
- `GET /api/state`, `GET /api/connections` authenticated
- `POST /api/plan` `{count:2}` drafts only
- `POST /api/ideas` `{topic:"..."}`
- `POST /api/ideas/:id/approve|reject` manual review of text drafts
- `POST /api/generate|publish` intentionally disabled
