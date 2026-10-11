# 📋 CineVerse — Project Handover & Maintenance Guide

This operations guide is prepared for engineering leads, DevOps teams, and developers taking over maintenance, operation, and scaling of **CineVerse / Movie Hub**.

---

## 1. Hosting Architecture
- **Unified Mode (Recommended for Render / Railway / Fly.io)**:
  - Single Node.js 20+ service runs Express.
  - Express serves the compiled Vite frontend from `dist/` and intercepts `/api/*` for REST endpoints.
  - One domain, zero CORS configuration needed, lowest operational overhead.
- **Decoupled Mode (High-traffic / Vercel + Render)**:
  - Frontend: React SPA hosted on Vercel Edge Network with `vercel.json` rewrites.
  - Backend: Express API running on Render with `CLIENT_URL` pointing to the Vercel domain.

---

## 2. Required Environment Variables Reference

| Variable | Scope | Sample / Recommended Setting |
| :--- | :--- | :--- |
| `NODE_ENV` | Backend | `production` (enables security headers & hides stack traces) |
| `PORT` | Backend | Dynamic (platform assigned) or `5000` |
| `MONGODB_URI` | Backend | `mongodb+srv://<user>:<pwd>@cluster0.mongodb.net/cineverse_prod?retryWrites=true&w=majority` |
| `JWT_SECRET` | Backend | High-entropy string: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN`| Backend | `30d` |
| `TMDB_API_KEY` | Backend | TMDB API v3 32-character key |
| `CLIENT_URL` | Backend | Allowed CORS origins: `https://cineverse.app,https://cineverse.vercel.app` |
| `VITE_API_BASE_URL`| Frontend | `/api` (unified) or `https://api.cineverse.app/api` (decoupled) |

---

## 3. CI/CD Workflows & GitHub Actions
- **Continuous Integration (`.github/workflows/ci.yml`)**:
  - Triggers on: Pull Requests and pushes to `main`.
  - Actions: Node 20 setup, `npm ci`, `npm audit --audit-level=high`, spins up MongoDB 7.0 container, runs all 11 test suites (`npm test`), compiles Vite bundle (`npm run build`), verifies `dist/index.html`.
- **Staging Deployment (`.github/workflows/deploy-staging.yml`)**:
  - Triggers on: Push to `main`.
  - Actions: Triggers Render staging webhook (`${{ secrets.RENDER_STAGING_DEPLOY_HOOK }}`) and probes `/api/health`.
- **Production Release (`.github/workflows/deploy-production.yml`)**:
  - Triggers on: Semantic tags (`v*.*.*`) or published GitHub releases.
  - Protections: Requires GitHub Environment reviewer approval.
  - Actions: Triggers Render production webhook (`${{ secrets.RENDER_PROD_DEPLOY_HOOK }}`) and probes `/api/health`.

---

## 4. Observability & Log Locations
- **Application Liveness**: `GET https://<domain>/api/health` (returns uptime and healthy status).
- **Database Readiness**: `GET https://<domain>/api/ready` (returns `database: "connected"`).
- **Log Locations**:
  - **Local Development**: Standard console output (`npm run server` / `npm run dev`).
  - **Render Logs**: Render Dashboard -> Service -> **Logs** tab (real-time streaming).
  - **Docker Logs**: `docker logs -f cineverse-web`.

---

## 5. Incident Response & Troubleshooting Playbook

### Scenario A: External TMDB API Is Down or Rate-Limited
- **Behavior**: Outgoing requests to TMDB return HTTP 429 or timeout.
- **Engine Response**: CineVerse's `tmdbService.js` automatically catches upstream failures and returns the cached catalog and curated `seedMovies.js` dataset.
- **Action**: Check TMDB API status page. Verify `TMDB_API_KEY` quota in developer settings. Users experience zero crashes.

### Scenario B: MongoDB Is Disconnected or Unreachable
- **Behavior**: `/api/ready` returns HTTP 503 `{ database: "disconnected" }`. User login and watchlist requests fail.
- **Diagnosis**: Check Atlas IP whitelist (ensure `0.0.0.0/0` or static NAT IP is enabled) and connection string credentials.
- **Recovery**: Re-enable IP access list in Atlas Network Access or restart MongoDB service.

### Scenario C: Deployment Regression (Instant Rollback)
1. **Render**: Open **Deploys** tab -> Select previous green commit -> Click **Rollback to this deploy**.
2. **Vercel**: Open **Deployments** -> Locate previous release -> Click **Promote to Production**.
3. **Git**:
   ```bash
   git revert HEAD
   git push origin main
   ```
4. **Data Safety**: Do **NOT** run destructive database rollbacks. Mongoose models are strictly additive and backward-compatible.

---

## 6. Dependency Maintenance Schedule
- **Automated**: Dependabot (`.github/dependabot.yml`) scans `npm` packages and `github-actions` workflows every Monday at 04:00 UTC.
- **Manual Audit**: Run `npm run audit` locally before major release tags.
- **Updates**: Run `npm update` and execute `npm test` across all 11 suites to verify zero regressions.
