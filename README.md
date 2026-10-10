# 🎬 CineVerse - Full-Stack Movie Discovery & Streaming Information Platform

A production-grade, full-stack web application for discovering movies, exploring cast & crew, watching trailers, checking verified streaming platforms (Netflix, Amazon Prime Video, JioHotstar, etc.), and managing personal watchlists, favorites, and watch history.

Built using **React (Vite)**, **Node.js / Express.js**, **MongoDB / Mongoose**, and **The Movie Database (TMDB) API**.

---

## 🏛️ Architecture

```
                    ┌────────────────────────┐
                    │     React (Vite)       │
                    │       Frontend         │
                    └───────────┬────────────┘
                                │
                          Axios / REST (JWT)
                                │
                                ▼
                    ┌────────────────────────┐
                    │      Express.js        │
                    │       Backend          │
                    └───────┬────────┬───────┘
                            │        │
                 ┌──────────┘        └──────────┐
                 ▼                              ▼
        ┌──────────────────┐          ┌───────────────────┐
        │     MongoDB      │          │     TMDB API      │
        │                  │          │                   │
        │  • Users         │          │  • Popular        │
        │  • Watchlists    │          │  • Top Rated      │
        │  • Favorites     │          │  • Upcoming       │
        │  • History       │          │  • Search         │
        │  • Movie Views   │          │  • Movie Details  │
        └──────────────────┘          │  • Cast & Credits │
                                      │  • Video Trailers │
                                      │  • Watch Providers│
                                      └───────────────────┘
```

---

## ✨ Features

- 🌟 **Dynamic Cinematic Home Spotlight**: Live hero spotlight showcasing trending releases with quick trailer launch.
- 🔍 **Global Navbar Search**: Debounced quick-search dropdown (400ms) with full search results page (`/search?query=...`).
- 🎬 **Deep Movie Details (Matching Reference UI)**:
  - High-definition official studio poster with integrated red **Watch Trailer** action.
  - Title, tagline, rating badge (`⭐ 8.3/10`), runtime (`2h 25m`), release date (`Jul 29, 2026`), and genres.
  - **Where to Watch**: Direct streaming links to Amazon Prime Video, JioHotstar, Netflix, Zee5, Apple TV, etc.
  - **Budget & Box Office**: Financial metrics in Millions and Indian Crores.
  - **Application View Counter**: Real-time view increments per unique title (`12.4K views`).
  - **Verified Cast & Characters**: Filtered authentic cast members with character roles.
  - **More Like This**: Intelligent recommendations matching genres and themes.
- 🍿 **In-Page Full HD Streaming Player**: Multi-server stream engine and centered YouTube trailer modal.
- 🔐 **JWT Authentication & Authorization**:
  - Secure bcrypt password hashing.
  - Persistent login across refreshes using `localStorage` and `AuthContext`.
  - Protected routes (`/profile`, `/watchlist`, `/favorites`, `/history`).
- 📱 **Fully Responsive Layout**:
  - Desktop: 5 cards per row
  - Laptop: 4 cards per row
  - Tablet: 3 cards per row
  - Mobile: 2 cards per row + mobile sliding navigation drawer.
- ⚡ **Resilient Offline & CodeSandbox Support**: Gracefully handles network fallbacks so the app never crashes if TMDB or MongoDB is temporarily unavailable.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM v7
- **Styling**: Vanilla CSS (Custom Design System, Glassmorphism, Dark Cinematic Theme)
- **Icons**: Lucide React
- **Animations**: CSS Transitions & Keyframe Shimmer Animations
- **HTTP Client**: Axios with JWT Request/Response Interceptors

### Backend
- **Runtime**: Node.js
- **Server Framework**: Express.js 5
- **Database**: MongoDB & Mongoose ORM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Security & Middleware**: CORS, Dotenv, JWT Auth Middleware, Admin Middleware, Centralized Error Handling
- **API Service**: Axios instance with short TTL in-memory caching

---

## 📂 Project Folder Structure

```
├── client (src)/
│   ├── components/
│   │   ├── navbar/            # Global navigation with search and profile dropdown
│   │   ├── logo/              # CineVerse branding
│   │   ├── searchBar/         # Debounced global search
│   │   ├── movieCard/         # Cinematic movie card with hover overlay
│   │   ├── movieGrid/         # 5/4/3/2 column responsive grid
│   │   ├── pagination/        # Page navigation with ellipsis
│   │   ├── loading/           # Film reel pulse animation
│   │   ├── errorMessage/      # Error UI with retry action
│   │   ├── heroSection/       # Dynamic home hero banner
│   │   ├── castCard/          # Actor photo and character name
│   │   ├── castSection/       # Cast list with mobile horizontal scroll
│   │   ├── trailerModal/      # Centered YouTube trailer portal
│   │   ├── providerLinks/     # Dynamic streaming provider buttons
│   │   ├── movieActions/      # Watch, trailer, watchlist, favorite, share
│   │   ├── login/             # Glassmorphic login card
│   │   ├── register/          # Glassmorphic registration card
│   │   ├── profile/           # User statistics & profile editor
│   │   └── protectedRoute/    # Route protection wrapper
│   │
│   ├── pages/
│   │   ├── home/              # Home / Popular Spotlight
│   │   ├── popular/           # Popular Movies
│   │   ├── topRated/          # Top Rated Masterpieces
│   │   ├── upcoming/          # Upcoming Releases
│   │   ├── search/            # Search Results
│   │   ├── movieDetails/      # Movie Details, Streams, Cast, Player
│   │   ├── watchlist/         # User Watchlist
│   │   ├── favorites/         # User Favorites
│   │   ├── history/           # User Watch History
│   │   ├── login/             # Login Page
│   │   ├── register/          # Register Page
│   │   └── notFound/          # 404 Scene Not Found Page
│   │
│   ├── context/
│   │   ├── AuthContext.jsx    # User authentication provider
│   │   └── MovieContext.jsx   # Watchlist & favorites state
│   │
│   ├── services/
│   │   ├── api.js             # Base Axios instance with JWT interceptor
│   │   ├── authService.js     # Auth & profile API calls
│   │   ├── movieService.js    # TMDB movie catalog API calls
│   │   ├── watchlistService.js# Watchlist API calls
│   │   └── favoriteService.js # Favorites API calls
│   │
│   ├── hooks/
│   │   ├── useAuth.js         # Auth hook
│   │   ├── useMovies.js       # Watchlist/Favorites hook
│   │   └── useDebounce.js     # Keystroke debounce hook
│   │
│   ├── utils/
│   │   ├── imageUrl.js        # TMDB CDN image helpers
│   │   ├── formatDate.js      # Date formatter
│   │   ├── formatRuntime.js   # Runtime (e.g., 2h 25m) formatter
│   │   └── formatCurrency.js  # Currency & view count formatters
│   │
│   ├── App.jsx                # Router configuration & Layout
│   ├── main.jsx               # React DOM root
│   └── index.css              # Global tokens & CSS reset
│
├── server/
│   ├── config/
│   │   └── db.js              # MongoDB Mongoose connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── movieController.js
│   │   ├── watchlistController.js
│   │   ├── favoriteController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Watchlist.js
│   │   ├── Favorite.js
│   │   ├── History.js
│   │   └── MovieView.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── movieRoutes.js
│   │   ├── watchlistRoutes.js
│   │   ├── favoriteRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   └── errorMiddleware.js
│   ├── services/
│   │   └── tmdbService.js     # TMDB Axios client & caching
│   ├── utils/
│   │   └── generateToken.js   # JWT token generator
│   ├── app.js                 # Express application setup
│   └── server.js              # Server entry point
│
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB (optional for local/Atlas, resilient in-memory mode active by default)

### 2. Installation
```bash
# Clone or navigate to the repository
cd Movie_app

# Install all dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=cineverse_super_secret_jwt_key_2026
MONGODB_URI=mongodb://127.0.0.1:27017/cineverse
TMDB_API_KEY=c45a857c193f6302f2b5061c3b85e743
```

### 4. Running Locally
```bash
npm run dev
```
- **Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🌐 CodeSandbox Deployment Instructions

1. Upload or import this project repository into [CodeSandbox.io](https://codesandbox.io/).
2. Under **Server Control / Environment Variables**, add your `TMDB_API_KEY` and `JWT_SECRET`.
3. Start the project using `npm run dev`.
4. Copy the public CodeSandbox preview URL and submit your link!

---

## 📡 Backend API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/movies/popular?page=1` | Popular movies list | No |
| `GET` | `/api/movies/top-rated?page=1` | Top-rated movies list | No |
| `GET` | `/api/movies/upcoming?page=1` | Upcoming releases | No |
| `GET` | `/api/movies/search?query=batman&page=1` | Search movies | No |
| `GET` | `/api/movies/:id` | Detailed movie info + view count | No |
| `GET` | `/api/movies/:id/cast` | Cast and crew credits | No |
| `GET` | `/api/movies/:id/trailer` | Official YouTube trailer key | No |
| `GET` | `/api/movies/:id/providers` | Watch providers (region=IN) | No |
| `POST` | `/api/movies/:id/view` | Increments movie view count | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login user & return JWT token | No |
| `GET` | `/api/auth/me` | Fetch active user session | **Yes (JWT)** |
| `GET` | `/api/watchlist` | Get user's saved watchlist | **Yes (JWT)** |
| `POST` | `/api/watchlist/:movieId` | Toggle movie in watchlist | **Yes (JWT)** |
| `DELETE` | `/api/watchlist/:movieId` | Remove from watchlist | **Yes (JWT)** |
| `GET` | `/api/favorites` | Get user's favorites | **Yes (JWT)** |
| `POST` | `/api/favorites/:movieId` | Toggle movie in favorites | **Yes (JWT)** |
| `DELETE` | `/api/favorites/:movieId` | Remove from favorites | **Yes (JWT)** |
| `GET` | `/api/users/profile` | Get profile & real-time stats | **Yes (JWT)** |
| `PUT` | `/api/users/profile` | Update profile info | **Yes (JWT)** |
| `GET` | `/api/users/history` | Get recently viewed movies | **Yes (JWT)** |
| `POST` | `/api/users/history/:movieId`| Add to watch history | **Yes (JWT)** |
| `DELETE` | `/api/users/history/:movieId`| Remove from watch history | **Yes (JWT)** |

---

## 📜 License
ISC © Mubashir
