# 🎯 CineVerse — Technical Interview Preparation Guide

This guide provides technically precise, source-code-backed answers to anticipated interview questions about the architecture, implementation choices, and engineering trade-offs made in **CineVerse**.

---

### Q1: Why did you choose React and Express for this project?
**Answer**:
"I chose **React** on the frontend because CineVerse is an interactive media exploration platform where dynamic UI state (search debounce, active modals, instant watchlist toggles, and catalog filtering) benefits directly from declarative component lifecycles, memoized cards, and granular context state (`AuthContext`, `MovieContext`).
On the backend, **Express.js** provides a lightweight, unopinionated framework that allows fine-grained control over middleware pipelines—such as custom sliding-window rate limiters, security headers, and an in-memory caching tier—without unnecessary framework bloat."

---

### Q2: How do the frontend and backend communicate?
**Answer**:
"The client communicates with Express via standard HTTPS REST endpoints using Axios. In production, the client API base URL is resolved dynamically via `VITE_API_BASE_URL` (defaulting to `/api` for unified hosting or an external domain in decoupled hosting).
Authenticated requests attach an `Authorization: Bearer <token>` header, and all API responses follow a uniform JSON structure: `{ success: boolean, data?: any, message?: string }`."

---

### Q3: How does authentication work, and how are passwords protected?
**Answer**:
"We implement stateless JWT (JSON Web Token) authentication.
When a user registers or logs in (`/api/auth/register`, `/api/auth/login`), their password is encrypted using `bcryptjs` with a salt work factor of 10 inside Mongoose's `pre('save')` hook. In the `User` schema, we also configure a `toJSON` transform that strips the password hash from all serialized objects to eliminate accidental password leakage.
On successful authentication, the server signs a JWT containing the user ID and role with a 30-day expiration using a high-entropy secret (`JWT_SECRET`). The client persists this token in `localStorage` and restores user state on page refresh via `GET /api/auth/me`."

---

### Q4: How are protected routes enforced on both the client and the server?
**Answer**:
"Protection is enforced defensively at both architectural layers:
1. **Client-Side**: A React `<ProtectedRoute>` wrapper checks the `isAuthenticated` state in `AuthContext`. If unauthenticated or token verification is pending, it redirects the user to `/login` preserving the attempted path.
2. **Server-Side**: The `protect` middleware (`server/middleware/authMiddleware.js`) intercepts requests to `/api/watchlist`, `/api/favorites`, `/api/history`, and `/api/users/profile`. It verifies the JWT signature and expiration using `jwt.verify`, queries the database for the active user, and attaches `req.user` to the request object. Unauthenticated or forged tokens receive an immediate HTTP 401 Unauthorized."

---

### Q5: How does MongoDB store personalized data, and how do you ensure multi-tenant data isolation?
**Answer**:
"Personalized resources (`Watchlist`, `Favorite`, `History`) are stored in dedicated MongoDB collections. Each document maintains a foreign key `userId: { type: ObjectId, ref: 'User' }` alongside the movie metadata.
To guarantee data integrity and prevent duplicate entries, we apply a compound unique index on `{ userId: 1, movieId: 1 }`.
Multi-tenant isolation is enforced because every database query explicitly queries by `req.user._id`:
```javascript
const userWatchlist = await Watchlist.find({ userId: req.user._id });
```
This ensures User A can never query, inspect, or delete records belonging to User B."

---

### Q6: How is the external TMDB API integrated, and how do you handle rate limits or API downtime?
**Answer**:
"External integration is managed by `server/services/tmdbService.js` using Axios with a strict 3500ms timeout.
To respect TMDB's rate limits (40 requests per 10 seconds) and provide fast response times, we implement an in-memory cache with a 10-minute TTL. Requests for popular, top-rated, and detail endpoints first check the cache.
If TMDB returns an HTTP 429 rate limit error or the external network is unavailable, the service catches the error and transparently serves from an offline curated catalog (`server/data/seedMovies.js`). The end user experiences zero downtime and never sees an application crash."

---

### Q7: How is the application tested?
**Answer**:
"CineVerse features an automated regression suite organized into 11 test suites covering all historical phases and stages:
- Poster and section reliability.
- Search, genre, and industry filtering.
- Movie details, credits, and trailers.
- Authentication and session restoration.
- Production observability probes (`/api/health`, `/api/ready`).
- End-to-end realistic user journeys.
- Security and data integrity (SQL/NoSQL injection prevention, brute force mitigation).
- Performance, layout shift prevention, and accessibility.
- Staging deployment readiness.
- CI/CD workflow syntax and secrets hygiene.
- Final acceptance verification.
The runner `run_all_tests.js` is self-bootstrapping: it probes the health endpoint, spawns a child server process if none is running, executes all 198 assertions, and cleanly terminates."

---

### Q8: How do deployment and CI/CD work in this project?
**Answer**:
"We maintain GitHub Actions workflows in `.github/workflows/`:
1. **CI Pipeline (`ci.yml`)**: Runs on every pull request and push to `main`. It installs dependencies with `npm ci`, runs `npm audit --audit-level=high`, spins up an isolated `mongo:7.0` container, runs the master test suite (`npm test`), and compiles the Vite production bundle (`npm run build`).
2. **Staging CD (`deploy-staging.yml`)**: Triggers upon push to `main` and dispatches a deployment webhook to Render Staging followed by a health check probe.
3. **Production CD (`deploy-production.yml`)**: Strictly triggered on semantic release tags (`v*.*.*`) and requires manual GitHub Environment reviewer sign-off before deploying to Render Production."

---

### Q9: What was one real technical challenge you encountered during implementation, and how did you resolve it?
**Answer**:
"**Challenge**: Rate limiting interference during automated test execution.
When executing end-to-end user journeys and regression tests locally, hundreds of rapid requests from `127.0.0.1` exceeded the in-memory sliding-window limiter (`apiLimiter`), causing subsequent legitimate test assertions to fail with HTTP 429 Too Many Requests.
**Resolution**: Rather than removing rate limiting or leaving the API vulnerable, I introduced a `DISABLE_RATE_LIMIT` environment flag and added development loopback IP exemption logic for local developer testing. In production, full sliding-window rate limiting remains strictly enforced."

---

### Q10: What is one verified limitation in the current codebase, and what is the planned next step?
**Answer**:
"Currently, movie recommendations on the movie details page are based on matching TMDB genre IDs rather than personalized user viewing habits.
For **Stage 9 (Product Growth)**, the planned enhancement is to build a collaborative filtering recommendation engine that analyzes the user's historical Watchlist, Favorites, and viewing genres to generate customized recommendation vectors."
