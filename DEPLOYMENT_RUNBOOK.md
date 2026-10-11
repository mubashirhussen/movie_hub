# CineVerse Production Deployment & Operational Runbook

This document defines the operational procedures, deployment processes, incident response protocols, and maintenance schedules for **CineVerse / Movie Hub**.

---

## 1. System Architecture & Topology

- **Frontend**: React 19 + Vite SPA, hosted as static assets via Express in unified mode or on Vercel/Netlify in decoupled mode.
- **Backend API**: Node.js 20+ and Express.js REST API, running with security headers, in-memory catalog caching, rate limiting, and centralized error handling.
- **Database**: MongoDB 7.0+ (MongoDB Atlas M0/M10+ or dedicated instance).
- **External Providers**: TMDB API v3 (movies, search, credits, streaming providers) with in-memory TTL caching and offline fallback catalog.
- **Static Video Streaming**: Sandboxed YouTube trailer and movie previews.

---

## 2. Production Environment Variables Reference

| Variable | Required In | Description / Sample Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Backend | `production` |
| `PORT` | Backend | Assigned dynamically by hosting platform (default `5000`) |
| `MONGODB_URI` | Backend | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/cineverse_prod?retryWrites=true&w=majority` |
| `JWT_SECRET` | Backend | Minimum 32-character random string (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Backend | `30d` |
| `TMDB_API_KEY` | Backend | TMDB API v3 32-character alphanumeric key |
| `CLIENT_URL` | Backend | Comma-separated allowed frontend domains (e.g. `https://cineverse.app,https://cineverse.vercel.app`) |
| `VITE_API_BASE_URL` | Frontend | `/api` (unified host) or `https://api.cineverse.app/api` (decoupled host) |

---

## 3. Database Protection, Backup & Recovery

### Backup Strategy
- **Automated Cloud Backups**: In MongoDB Atlas, enable Continuous Cloud Backups (or daily snapshot schedule).
- **Manual Command-line Backup**:
  ```bash
  mongodump --uri="<MONGODB_URI>" --gzip --out="./backups/cineverse-$(date +%Y%m%d_%H%M%S)"
  ```
- **Backup Retention**: Daily snapshots kept for 7 days; weekly snapshots kept for 30 days.
- **Recovery Point Objective (RPO)**: <= 1 hour (Atlas Continuous Backup) or <= 24 hours (daily snapshot).
- **Recovery Time Objective (RTO)**: <= 15 minutes to complete restore and verify connectivity.

### Database Restoration Procedure
1. Create a safe temporary target namespace to verify integrity before replacing live collections:
   ```bash
   mongorestore --uri="<MONGODB_URI>" --nsInclude="cineverse_prod.*" --gzip ./backups/cineverse-<timestamp>
   ```
2. Verify document counts on `users`, `watchlists`, `favorites`, and `histories`.
3. Switch connection string or collection alias.

---

## 4. Incident Response Runbook

### Incident 1: Frontend Is Unavailable
- **Symptoms**: Browser reports 502/503 Bad Gateway, DNS resolution failure, or blank page.
- **Diagnostics**:
  1. Inspect CDN / hosting provider status (Vercel / Render status page).
  2. Test health probe: `curl -I https://<domain>/api/health`.
  3. Verify browser console for module loading or syntax errors.
- **Resolution**:
  - If unified deployment: Restart Node service via dashboard.
  - If decoupled deployment: Verify `dist/index.html` exists and `vercel.json` rewrite rule is intact.

### Incident 2: Backend Is Unavailable
- **Symptoms**: Client displays *"CineVerse backend is currently unreachable"*. Health check fails.
- **Diagnostics**:
  1. Inspect hosting logs (Render logs / `docker logs <container>`).
  2. Verify if memory limits were exceeded (OOM killed).
  3. Check process uptime: `curl -s https://<domain>/api/health`.
- **Resolution**:
  - Restart web service via hosting dashboard.
  - Check missing environment variables (`JWT_SECRET` or `MONGODB_URI`).

### Incident 3: MongoDB Is Unreachable
- **Symptoms**: `/api/ready` returns HTTP 503 `{ database: 'disconnected' }`. Login/watchlist actions fail.
- **Diagnostics**:
  1. Check MongoDB Atlas cluster status and network access list (IP whitelist `0.0.0.0/0` or static NAT IP).
  2. Verify database user authentication credentials.
- **Resolution**:
  - Re-add hosting platform IP to Atlas Network Access if IP changed.
  - Ensure connection pool has not been exhausted.

### Incident 4: External Movie API (TMDB) Requests Fail
- **Symptoms**: Upstream TMDB rate-limiting (HTTP 429) or upstream outage.
- **Diagnostics**:
  1. Inspect backend logs for `[TMDB]` fallback warnings.
  2. Verify TMDB API key validity.
- **Resolution**:
  - CineVerse automatically activates built-in curated catalog and cached metadata.
  - If key expired or quota exceeded, update `TMDB_API_KEY` in environment variables.

### Incident 5: Authentication Stops Working
- **Symptoms**: Users receive persistent 401 Unauthorized across all protected requests.
- **Diagnostics**:
  1. Inspect `server/server.js` startup logs for `JWT_SECRET` mismatches.
  2. Check token expiration in client `localStorage` (`cineverse_token`).
- **Resolution**:
  - If `JWT_SECRET` was rotated while users had active sessions, users must log in again.
  - Check system clock synchronization (NTP) on host container.

### Incident 6: Secret Exposure (Credentials Leaked)
- **Symptoms**: Unintended git commit or log statement contains `JWT_SECRET`, `MONGODB_URI`, or `TMDB_API_KEY`.
- **Immediate Containment**:
  1. Immediately rotate the compromised secret in MongoDB Atlas / TMDB developer console.
  2. Update the environment variable in the hosting dashboard.
  3. Generate a new `JWT_SECRET` (`openssl rand -hex 32`) to invalidate all old active tokens.
  4. Force restart the application service.

### Incident 7: Unexpected Data Issue or Corrupted Records
- **Symptoms**: Duplicate entries or schema validation rejections.
- **Diagnostics**:
  1. Run diagnostic queries in MongoDB Compass or mongosh:
     ```javascript
     db.watchlists.aggregate([{ $group: { _id: { userId: "$userId", movieId: "$movieId" }, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]);
     ```
- **Resolution**:
  - Verify compound unique indexes exist: `db.watchlists.getIndexes()`.
  - Re-apply compound indexes if dropped: `db.watchlists.createIndex({ userId: 1, movieId: 1 }, { unique: true })`.

### Incident 8: Deployment Introduces a Regression
- **Symptoms**: Production errors spike immediately following a new release.
- **Resolution**:
  - Execute **Instant Rollback**:
    - In Render: **Deploys** -> Select previous working deploy -> **Rollback**.
    - In Vercel: **Deployments** -> Select previous deploy -> **Promote to Production**.
    - In Git: `git revert HEAD && git push origin main`.

---

## 5. Observability, Health Checks & Alert Thresholds

### Health Check Probes
- **Liveness Probe**: `GET /api/health`
  - Returns `200 OK`, `status: "healthy"`, process uptime.
  - Used by Render, Docker `HEALTHCHECK`, and external uptime pingers.
- **Readiness Probe**: `GET /api/ready`
  - Returns `200 OK`, `status: "ready"`, `database: "connected"`.
  - Confirms MongoDB connection is active before routing live traffic.

### Actionable Alert Thresholds
- **5xx Server Error Rate**: Trigger alert if 5xx errors exceed 2% of total traffic over a 5-minute window.
- **High Latency**: Trigger alert if p95 response time exceeds 800ms over 10 consecutive minutes.
- **Database Down**: Trigger high-priority alert immediately if `/api/ready` fails 2 consecutive checks.
- **Memory Utilization**: Warning at 80% container memory; critical alert at 90%.

---

## 6. Regular Maintenance Schedule

| Cadence | Operational Task | Verification Method |
| :--- | :--- | :--- |
| **Weekly** | Review error logs & 4xx/5xx trends | Inspect host runtime logs |
| **Bi-weekly** | Audit dependency vulnerabilities | Run `npm audit` |
| **Monthly** | Database backup & restore drill | Restore snapshot to isolated staging namespace |
| **Quarterly** | Rotate TMDB and JWT keys (if required) | Update environment variables and verify seamless auth |
| **Continuous** | CI/CD automated test verification | Run all 9 regression suites on each commit |
