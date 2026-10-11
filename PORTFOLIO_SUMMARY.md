# 💼 CineVerse — Portfolio & Résumé Presentation Materials

These materials provide verified, professional descriptions of the **CineVerse** movie discovery platform tailored for software engineering résumés, portfolio websites, and professional LinkedIn posts.

---

## 1. Short Résumé Bullet Points (Concise Version)

**CineVerse — Full-Stack Movie Discovery & Personalization Platform** *(React 19, Vite, Node.js, Express, MongoDB, TMDB API, Docker, GitHub Actions)*
- Engineered a full-stack movie discovery platform featuring live movie catalogs, sandboxed YouTube trailer playback, verified streaming provider links, and personalized watchlists.
- Built a high-performance Express REST API with sliding-window in-memory rate limiting, 10-minute TTL catalog caching, and resilient offline fallback dataset mitigating upstream API outages.
- Architected multi-tenant user personalization (Watchlist, Favorites, Viewing History) backed by MongoDB and secured via JWT authentication, bcrypt password hashing, and compound unique indexing.
- Designed and maintained an automated CI/CD pipeline in GitHub Actions with dependency auditing (`npm audit`), automated MongoDB service testing across 11 regression suites (198 passing tests), and zero-downtime release workflows.

---

## 2. Detailed Portfolio Case Study (Comprehensive Version)

### Project Overview
**CineVerse** (`movie_hub`) is a modern, full-stack movie discovery web application designed to solve fragmented movie searching. Rather than navigating separate sites to read synopses, find trailers, check regional streaming availability, and manage personal bookmarks, CineVerse provides an all-in-one cinematic hub.

### Core Architecture & Tech Stack
- **Frontend**: React 19 single-page application built on Vite with route-level code splitting (`React.lazy`), custom React Contexts (`AuthContext`, `MovieContext`, `ToastContext`), and Framer Motion animations.
- **Backend API**: Node.js and Express.js REST API with comprehensive security middleware (CORS origin allowlists, CSP headers, sliding-window rate limiters) and centralized error handling.
- **Database & Data Modeling**: MongoDB with Mongoose ODM, utilizing compound unique indexing (`{ userId: 1, movieId: 1 }`) to enforce strict data integrity and multi-tenant isolation.
- **External Integration & Resilience**: Integrated The Movie Database (TMDB) API v3 with an intelligent server-side caching layer (10-minute TTL) and a bundled offline seed catalog ensuring 100% application uptime even during upstream rate limiting or API downtime.
- **Testing & DevOps**: 11 automated test suites covering unit, integration, security, and end-to-end user journeys; GitHub Actions CI/CD with ephemeral MongoDB containers and automated Dependabot security updates.

### Meaningful Engineering Highlights
1. **Multi-Tier Resilient Caching & Offline Fallback**:
   To overcome TMDB's 40 requests/10s rate limits and prevent downstream user crashes, the Express service implements in-memory caching keyed by request parameters with automatic TTL expiry. If an upstream network timeout or 429 response occurs, the controller seamlessly falls back to a curated offline catalog, maintaining a flawless user experience.
2. **Deterministic CI/CD & Self-Bootstrapping Regression Harness**:
   Developed a custom Node.js master test runner that evaluates health probes on `/api/health`, dynamically spawns background processes with isolated test configurations in headless environments, and executes 198 automated checks across 11 suites before permitting pull requests to merge into `main`.

---

## 3. Concise LinkedIn Project Post

🎬 **Excited to share CineVerse — a Full-Stack Movie Discovery & Personalization Platform!** 🍿

Finding where a movie is streaming, checking authentic trailers, and keeping a personal watchlist shouldn't require jumping between five different tabs. I built **CineVerse** to provide a fast, cinematic, all-in-one movie discovery experience.

**Key Technical Highlights**:
🔹 **Frontend**: Built with React 19 & Vite, featuring route-level code splitting, accessible modals, and instant debounced search.
🔹 **Backend**: Node.js & Express REST API with security headers, in-memory rate limiting, and an intelligent 10-minute TTL catalog cache that falls back to an offline seed dataset if upstream APIs time out.
🔹 **Database**: MongoDB & Mongoose schemas with compound unique indexing for multi-tenant Watchlists, Favorites, and chronological Viewing History.
🔹 **CI/CD & DevOps**: GitHub Actions pipeline that spins up ephemeral MongoDB 7 containers, runs 11 automated regression suites (198 passing checks), executes high-level vulnerability scans (`npm audit`), and automates releases.

Check out the code and architectural runbook on GitHub:
👉 https://github.com/mubashirhussen/movie_hub

#FullStack #ReactJS #NodeJS #ExpressJS #MongoDB #WebDevelopment #SoftwareEngineering #DevOps #CICD #JavaScript
