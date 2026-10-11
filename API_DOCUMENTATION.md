# 📖 CineVerse — REST API Specification & Endpoint Documentation

The CineVerse backend exposes a RESTful JSON API organized around resource controllers.

**Base URL**: `http://localhost:5000/api` (Local) or `https://<deployed-host>/api` (Production)  
**Standard Response Envelope**:
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 1. System Health & Observability

### `GET /api/health`
- **Purpose**: Liveness probe returning process health and uptime.
- **Auth**: None
- **Response (200 OK)**:
```json
{
  "success": true,
  "status": "healthy",
  "message": "🎬 CineVerse Backend API is healthy and running",
  "timestamp": "2026-10-11T09:30:00.000Z",
  "uptimeSeconds": 3600
}
```

### `GET /api/ready`
- **Purpose**: Readiness probe confirming database connectivity before routing live traffic.
- **Auth**: None
- **Response (200 OK)**:
```json
{
  "success": true,
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-10-11T09:30:00.000Z"
}
```
- **Error Response (503 Service Unavailable)**:
```json
{
  "success": false,
  "status": "unready",
  "database": "disconnected",
  "message": "MongoDB is connecting or unavailable"
}
```

---

## 2. Authentication & User Profile (`/api/auth`)

### `POST /api/auth/register`
- **Purpose**: Register a new user account and receive an authentication JWT.
- **Auth**: None (Protected by `authLimiter`)
- **Request Body**:
```json
{
  "name": "Alex Mercer",
  "email": "alex.mercer@example.com",
  "password": "StrongPassword123!"
}
```
- **Validation**:
  - `name`: Required String.
  - `email`: Required, valid email format, unique.
  - `password`: Required, minimum 6 characters.
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6708b292e81fc69c73b06381",
      "name": "Alex Mercer",
      "email": "alex.mercer@example.com",
      "role": "user",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    }
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: `{ "success": false, "message": "Please provide all required fields" }`
  - `409 Conflict`: `{ "success": false, "message": "An account with this email already exists" }`

### `POST /api/auth/login`
- **Purpose**: Authenticate user credentials and issue an authentication JWT.
- **Auth**: None (Protected by `authLimiter`)
- **Request Body**:
```json
{
  "email": "alex.mercer@example.com",
  "password": "StrongPassword123!"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6708b292e81fc69c73b06381",
      "name": "Alex Mercer",
      "email": "alex.mercer@example.com",
      "role": "user"
    }
  }
}
```
- **Error Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### `GET /api/auth/me`
- **Purpose**: Fetch the currently authenticated user's profile using the session token.
- **Auth**: **Required** (`Authorization: Bearer <token>`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "6708b292e81fc69c73b06381",
    "name": "Alex Mercer",
    "email": "alex.mercer@example.com",
    "role": "user",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  }
}
```

---

## 3. Movie Catalog & Discovery (`/api/movies`)

### `GET /api/movies/popular`
- **Purpose**: Retrieve currently trending and popular movies.
- **Auth**: None
- **Query Params**: `page` (optional integer, default `1`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "page": 1,
    "results": [
      {
        "id": 550,
        "title": "Fight Club",
        "overview": "A ticking-time-bomb insomniac...",
        "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        "release_date": "1999-10-15",
        "vote_average": 8.4,
        "vote_count": 28400
      }
    ],
    "total_pages": 500,
    "total_results": 10000
  }
}
```

### `GET /api/movies/search`
- **Purpose**: Search catalog by keyword with whitespace trimming.
- **Auth**: None
- **Query Params**: `query` (required string), `page` (optional)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "page": 1,
    "results": [ ... ],
    "total_results": 42
  }
}
```

### `GET /api/movies/industry/:industry`
- **Purpose**: Retrieve curated catalog by film industry (`hollywood`, `bollywood`, `anime`, `korean`, `tollywood`, `kollywood`).
- **Auth**: None
- **Response (200 OK)**: Returns industry-tailored movie list.

### `GET /api/movies/:id`
- **Purpose**: Retrieve comprehensive movie metadata, financial data, and application view counter.
- **Auth**: None
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 550,
    "title": "Fight Club",
    "overview": "...",
    "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "backdrop_path": "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
    "budget": 63000000,
    "revenue": 100853753,
    "runtime": 139,
    "release_date": "1999-10-15",
    "vote_average": 8.4,
    "genres": [{ "id": 18, "name": "Drama" }],
    "applicationViews": 14852,
    "viewCount": 14852
  }
}
```

### `GET /api/movies/:id/cast`
- **Purpose**: Retrieve cast members, character roles, director, and key crew.
- **Auth**: None
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "cast": [
      {
        "id": 287,
        "name": "Brad Pitt",
        "character": "Tyler Durden",
        "profile_path": "/cckcYc2v0yh1tc9QjRelptsqqo.jpg"
      }
    ],
    "crew": [ ... ]
  }
}
```

### `GET /api/movies/:id/trailer`
- **Purpose**: Retrieve official YouTube trailer embed keys and video items.
- **Auth**: None
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "key": "c2hL2J63y4c",
    "name": "Official Theatrical Trailer",
    "site": "YouTube",
    "type": "Trailer"
  }
}
```

### `GET /api/movies/:id/providers`
- **Purpose**: Retrieve verified streaming availability links (flatrate, rent, buy) by region.
- **Auth**: None
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "IN": {
      "flatrate": [
        { "provider_id": 8, "provider_name": "Netflix", "logo_path": "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" }
      ]
    }
  }
}
```

### `POST /api/movies/:id/view`
- **Purpose**: Atomically increment the application-level view counter for a movie.
- **Auth**: None
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "movieId": 550,
    "views": 14853
  }
}
```

---

## 4. Watchlist & Favorites (`/api/watchlist` & `/api/favorites`)

### `GET /api/watchlist`
- **Purpose**: Fetch all movies stored in the authenticated user's watchlist.
- **Auth**: **Required** (`Bearer <token>`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "6708b3e5e81fc69c73b06385",
      "userId": "6708b292e81fc69c73b06381",
      "movieId": 550,
      "movieTitle": "Fight Club",
      "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      "addedAt": "2026-10-11T09:35:00.000Z"
    }
  ]
}
```

### `POST /api/watchlist`
- **Purpose**: Add a movie to the user's watchlist.
- **Auth**: **Required**
- **Request Body**:
```json
{
  "movieId": 550,
  "movieTitle": "Fight Club",
  "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
}
```
- **Response (201 Created)**: Returns created watchlist document.
- **Error (409 Conflict)**: Returned if movie is already in user watchlist.

### `DELETE /api/watchlist/:movieId`
- **Purpose**: Remove a movie from the user's watchlist.
- **Auth**: **Required**
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Movie removed from watchlist"
}
```

*(Identical API pattern applies to `/api/favorites` and `/api/history`)*

---

## 5. Community Ratings & Reviews (`/api/movies/:id/ratings`, `/api/reviews`)

### `GET /api/movies/:movieId/ratings`
- **Purpose**: Retrieve community rating stats (average, total count, 1-5 star distribution) and the active user's rating.
- **Auth**: Optional (Attaches `userRating` if JWT provided).
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "userRating": 5,
    "averageRating": 4.5,
    "totalRatings": 42,
    "distribution": { "1": 1, "2": 2, "3": 5, "4": 14, "5": 20 }
  }
}
```

### `POST /api/movies/:movieId/ratings`
- **Purpose**: Submit or update a 1–5 star rating for a movie (idempotent upsert).
- **Auth**: **Required** (`Bearer <token>`)
- **Request Body**: `{ "rating": 5 }` (Integer between 1 and 5)
- **Response (200 OK)**: Returns updated user rating and refreshed community stats.

### `DELETE /api/movies/:movieId/ratings`
- **Purpose**: Delete authenticated user's rating for a movie.
- **Auth**: **Required**
- **Response (200 OK)**: `{ "success": true, "message": "Rating removed successfully" }`

### `GET /api/movies/:movieId/reviews`
- **Purpose**: Retrieve paginated reviews with sorting.
- **Auth**: Optional (Attaches `isAuthor` and `hasVotedHelpful`).
- **Query Params**: `page` (default 1), `limit` (default 10), `sort` (`newest`, `highest`, `helpful`).
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "6708b7e2e81fc69c73b06399",
        "movieId": 550,
        "rating": 5,
        "reviewText": "An absolute masterpiece of modern psychological cinema.",
        "isSpoiler": false,
        "helpfulCount": 12,
        "hasVotedHelpful": false,
        "isAuthor": false,
        "author": {
          "id": "6708b292e81fc69c73b06381",
          "name": "Alex Mercer",
          "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        },
        "createdAt": "2026-10-11T09:45:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "totalReviews": 1, "totalPages": 1 }
  }
}
```

### `POST /api/movies/:movieId/reviews`
- **Purpose**: Submit a new movie review (max 1 review per user per movie).
- **Auth**: **Required**
- **Request Body**:
```json
{
  "reviewText": "Stunning direction and brilliant soundtrack.",
  "rating": 5,
  "isSpoiler": false
}
```
- **Response (201 Created)**: Returns created review object.
- **Error (409 Conflict)**: Returned if user has already reviewed this movie.

### `PUT /api/reviews/:reviewId`
- **Purpose**: Edit review content, rating, or spoiler tag.
- **Auth**: **Required** (Enforces author ownership; returns 403 Forbidden for non-authors).

### `DELETE /api/reviews/:reviewId`
- **Purpose**: Delete review.
- **Auth**: **Required** (Enforces author ownership or admin role).

### `POST /api/reviews/:reviewId/helpful`
- **Purpose**: Toggle helpful vote on a review.
- **Auth**: **Required** (Prevents self-voting on own reviews).
- **Response (200 OK)**: Returns updated `helpfulCount` and `hasVotedHelpful` boolean.

### `POST /api/reviews/:reviewId/report`
- **Purpose**: Report review for moderation.
- **Auth**: **Required**
- **Request Body**:
```json
{
  "reason": "unmarked_spoiler",
  "details": "Major ending plot twist not marked with spoiler tag."
}
```
- **Validation**: `reason` must be one of: `harassment`, `spam`, `hate_speech`, `unmarked_spoiler`, `other`.
- **Response (201 Created)**: Report recorded; duplicate reports from the same user rejected with 409 Conflict.

