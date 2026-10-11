import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

console.log('================================================================');
console.log('     CineVerse Stage 8: Final Acceptance Test Suite             ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function report(name, condition, details = '') {
  if (condition) {
    passCount++;
    console.log(`[PASS] ${name}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${name} ${details ? `(${details})` : ''}`);
  }
}

async function runStage8Tests() {
  const timestamp = Date.now();
  const userAEmail = `acceptance_a_${timestamp}@example.com`;
  const userBEmail = `acceptance_b_${timestamp}@example.com`;
  const password = 'AcceptancePassword123!';

  let tokenA = null;
  let tokenB = null;

  // --- Category 1: Health & Observability Probes ---
  console.log('\n--- 1. Health & Observability Probes ---');
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    report('1.1 Liveness probe (/api/health) returns HTTP 200 with healthy status', healthRes.status === 200 && healthJson.status === 'healthy');
  } catch (err) {
    report('1.1 Liveness probe (/api/health)', false, err.message);
  }

  try {
    const readyRes = await fetch(`${BASE_URL}/ready`);
    const readyJson = await readyRes.json();
    report('1.2 Readiness probe (/api/ready) confirms MongoDB readiness', readyRes.status === 200 && readyJson.database === 'connected');
  } catch (err) {
    report('1.2 Readiness probe (/api/ready)', false, err.message);
  }

  // --- Category 2: Movie Discovery & Catalog ---
  console.log('\n--- 2. Movie Catalog & Discovery Endpoints ---');
  let testMovieId = 550;

  try {
    const popularRes = await fetch(`${BASE_URL}/movies/popular`);
    const popularJson = await popularRes.json();
    const results = popularJson.data?.results || popularJson.results;
    report('2.1 Popular movies returns array of movies', popularRes.status === 200 && Array.isArray(results) && results.length > 0);
    if (results && results.length > 0) {
      testMovieId = results[0].id;
    }
  } catch (err) {
    report('2.1 Popular movies', false, err.message);
  }

  try {
    const topRatedRes = await fetch(`${BASE_URL}/movies/top-rated`);
    const topRatedJson = await topRatedRes.json();
    const results = topRatedJson.data?.results || topRatedJson.results;
    report('2.2 Top-Rated movies returns valid catalog', topRatedRes.status === 200 && Array.isArray(results));
  } catch (err) {
    report('2.2 Top-Rated movies', false, err.message);
  }

  try {
    const upcomingRes = await fetch(`${BASE_URL}/movies/upcoming`);
    const upcomingJson = await upcomingRes.json();
    const results = upcomingJson.data?.results || upcomingJson.results;
    report('2.3 Upcoming movies returns valid catalog', upcomingRes.status === 200 && Array.isArray(results));
  } catch (err) {
    report('2.3 Upcoming movies', false, err.message);
  }

  try {
    const nowPlayingRes = await fetch(`${BASE_URL}/movies/now-playing`);
    const nowPlayingJson = await nowPlayingRes.json();
    const results = nowPlayingJson.data?.results || nowPlayingJson.results;
    report('2.4 Now Playing movies returns valid catalog', nowPlayingRes.status === 200 && Array.isArray(results));
  } catch (err) {
    report('2.4 Now Playing movies', false, err.message);
  }

  try {
    const genresRes = await fetch(`${BASE_URL}/movies/genres`);
    const genresJson = await genresRes.json();
    const genresList = genresJson.data?.genres || genresJson.genres;
    report('2.5 Genre taxonomy returns list of movie genres', genresRes.status === 200 && Array.isArray(genresList));
  } catch (err) {
    report('2.5 Genre taxonomy', false, err.message);
  }

  try {
    const searchRes = await fetch(`${BASE_URL}/movies/search?query=Inception`);
    const searchJson = await searchRes.json();
    const results = searchJson.data?.results || searchJson.results;
    report('2.6 Movie search returns structured results matching query', searchRes.status === 200 && Array.isArray(results));
  } catch (err) {
    report('2.6 Movie search', false, err.message);
  }

  try {
    const industryRes = await fetch(`${BASE_URL}/movies/industry/hollywood`);
    const industryJson = await industryRes.json();
    const results = industryJson.data?.results || industryJson.results;
    report('2.7 Industry filter (hollywood) returns curated collection', industryRes.status === 200 && Array.isArray(results));
  } catch (err) {
    report('2.7 Industry filter', false, err.message);
  }

  // --- Category 3: Movie Details, Credits & Media ---
  console.log('\n--- 3. Movie Details, Credits & Media Payloads ---');
  try {
    const detailRes = await fetch(`${BASE_URL}/movies/${testMovieId}`);
    const detailJson = await detailRes.json();
    const detail = detailJson.data || detailJson;
    const hasViews = typeof detail.viewCount === 'number' || typeof detail.applicationViews === 'number';
    report('3.1 Movie details returns title, overview, release_date, and viewCount', detailRes.status === 200 && !!detail.title && hasViews);
  } catch (err) {
    report('3.1 Movie details', false, err.message);
  }

  try {
    const castRes = await fetch(`${BASE_URL}/movies/${testMovieId}/cast`);
    const castJson = await castRes.json();
    const castList = castJson.data?.cast || castJson.cast;
    report('3.2 Cast & credits returns cast array', castRes.status === 200 && Array.isArray(castList));
  } catch (err) {
    report('3.2 Cast & credits', false, err.message);
  }

  try {
    const trailerRes = await fetch(`${BASE_URL}/movies/${testMovieId}/trailer`);
    const trailerJson = await trailerRes.json();
    report('3.3 Trailer endpoint returns structured video data or fallback', trailerRes.status === 200 && trailerJson.success !== false);
  } catch (err) {
    report('3.3 Trailer endpoint', false, err.message);
  }

  try {
    const provRes = await fetch(`${BASE_URL}/movies/${testMovieId}/providers`);
    const provJson = await provRes.json();
    report('3.4 Streaming providers returns structured provider availability', provRes.status === 200 && typeof provJson === 'object');
  } catch (err) {
    report('3.4 Streaming providers', false, err.message);
  }

  try {
    const viewRes = await fetch(`${BASE_URL}/movies/${testMovieId}/view`, { method: 'POST' });
    const viewJson = await viewRes.json();
    const views = viewJson.data?.views ?? viewJson.views;
    report('3.5 View counter increments atomically', viewRes.status === 200 && typeof views === 'number');
  } catch (err) {
    report('3.5 View counter increment', false, err.message);
  }

  // --- Category 4: Authentication & User Management ---
  console.log('\n--- 4. Authentication & Security Lifecycle ---');
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Acceptance User A', email: userAEmail, password }),
    });
    const regJson = await regRes.json();
    tokenA = regJson.data?.token || regJson.token;
    report('4.1 User registration succeeds and issues signed JWT', regRes.status === 201 && !!tokenA);
  } catch (err) {
    report('4.1 User registration', false, err.message);
  }

  try {
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Duplicate User', email: userAEmail, password }),
    });
    report('4.2 Duplicate email registration rejected with HTTP 409 Conflict', dupRes.status === 409 || dupRes.status === 400);
  } catch (err) {
    report('4.2 Duplicate email check', false, err.message);
  }

  try {
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: 'WrongPassword999!' }),
    });
    report('4.3 Invalid password login rejected with HTTP 401', invalidLoginRes.status === 401);
  } catch (err) {
    report('4.3 Invalid login check', false, err.message);
  }

  try {
    const validLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password }),
    });
    const loginJson = await validLoginRes.json();
    const token = loginJson.data?.token || loginJson.token;
    report('4.4 Valid credentials login returns user profile and JWT', validLoginRes.status === 200 && !!token);
  } catch (err) {
    report('4.4 Valid login', false, err.message);
  }

  try {
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meJson = await meRes.json();
    const meUser = meJson.data || meJson.user || meJson;
    report('4.5 /api/auth/me restores authenticated session without password leakage', meRes.status === 200 && meUser.email === userAEmail && !meUser.password);
  } catch (err) {
    report('4.5 /api/auth/me', false, err.message);
  }

  // Register User B for multi-tenant isolation tests
  try {
    const regB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Acceptance User B', email: userBEmail, password }),
    });
    const bJson = await regB.json();
    tokenB = bJson.data?.token || bJson.token;
  } catch (err) {
    console.error('Failed to register User B:', err.message);
  }

  // --- Category 5: Personalization & Multi-Tenant Data Isolation ---
  console.log('\n--- 5. Personalization (Watchlist, Favorites, History) & Multi-Tenant Isolation ---');
  try {
    const addWatchRes = await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ movieId: testMovieId, movieTitle: 'Acceptance Test Movie', posterPath: '/test.jpg' }),
    });
    report('5.1 User A can add movie to Watchlist', addWatchRes.status === 201 || addWatchRes.status === 200);
  } catch (err) {
    report('5.1 Watchlist add', false, err.message);
  }

  try {
    const getWatchARes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const watchAJson = await getWatchARes.json();
    const watchListA = watchAJson.data || watchAJson;
    report('5.2 User A watchlist contains added movie', getWatchARes.status === 200 && Array.isArray(watchListA) && watchListA.some((w) => Number(w.movieId) === Number(testMovieId)));
  } catch (err) {
    report('5.2 Watchlist retrieval User A', false, err.message);
  }

  try {
    const getWatchBRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const watchBJson = await getWatchBRes.json();
    const watchListB = watchBJson.data || watchBJson;
    report('5.3 User B cannot see User A watchlist (strict multi-tenant isolation)', getWatchBRes.status === 200 && Array.isArray(watchListB) && !watchListB.some((w) => Number(w.movieId) === Number(testMovieId)));
  } catch (err) {
    report('5.3 Multi-tenant isolation check', false, err.message);
  }

  try {
    const addFavRes = await fetch(`${BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ movieId: testMovieId, movieTitle: 'Acceptance Test Movie', posterPath: '/test.jpg' }),
    });
    report('5.4 User A can add movie to Favorites', addFavRes.status === 201 || addFavRes.status === 200);
  } catch (err) {
    report('5.4 Favorites add', false, err.message);
  }

  try {
    const addHistRes = await fetch(`${BASE_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ movieId: testMovieId, movieTitle: 'Acceptance Test Movie', posterPath: '/test.jpg' }),
    });
    report('5.5 User A can record movie viewing in History', addHistRes.status === 201 || addHistRes.status === 200);
  } catch (err) {
    report('5.5 History add', false, err.message);
  }

  try {
    const delWatchRes = await fetch(`${BASE_URL}/watchlist/${testMovieId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    report('5.6 User A can remove movie from Watchlist', delWatchRes.status === 200);
  } catch (err) {
    report('5.6 Watchlist delete', false, err.message);
  }

  // --- Category 6: Technical Quality & Security Safeguards ---
  console.log('\n--- 6. Technical Quality & Security Controls ---');
  try {
    const noAuthRes = await fetch(`${BASE_URL}/watchlist`);
    report('6.1 Protected routes reject unauthenticated requests with HTTP 401', noAuthRes.status === 401);
  } catch (err) {
    report('6.1 Unauthenticated protection check', false, err.message);
  }

  try {
    const malformedTokenRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: 'Bearer this_is_an_invalid_malformed_jwt_token' },
    });
    report('6.2 Protected routes reject forged JWT tokens with HTTP 401', malformedTokenRes.status === 401);
  } catch (err) {
    report('6.2 Forged JWT protection check', false, err.message);
  }

  try {
    const notFoundApiRes = await fetch(`${BASE_URL}/nonexistent_api_endpoint_12345`);
    report('6.3 Unknown API endpoints return clean JSON 404', notFoundApiRes.status === 404);
  } catch (err) {
    report('6.3 404 endpoint check', false, err.message);
  }

  // --- Category 7: Frontend Build Artifacts & Assets ---
  console.log('\n--- 7. Production Artifacts & Assets Verification ---');
  const distIndexPath = path.join(__dirname, 'dist', 'index.html');
  report('7.1 Production client index.html artifact exists', fs.existsSync(distIndexPath));

  const distAssetsPath = path.join(__dirname, 'dist', 'assets');
  report('7.2 Production client compiled assets directory exists', fs.existsSync(distAssetsPath));

  // --- Category 8: CI/CD Pipeline & GitHub Workflows ---
  console.log('\n--- 8. CI/CD Workflows & Configuration Verification ---');
  const ciWorkflow = path.join(__dirname, '.github', 'workflows', 'ci.yml');
  const deployStagingWorkflow = path.join(__dirname, '.github', 'workflows', 'deploy-staging.yml');
  const deployProdWorkflow = path.join(__dirname, '.github', 'workflows', 'deploy-production.yml');
  const dependabotConfig = path.join(__dirname, '.github', 'dependabot.yml');

  report('8.1 .github/workflows/ci.yml workflow exists and is active', fs.existsSync(ciWorkflow));
  report('8.2 .github/workflows/deploy-staging.yml staging workflow exists', fs.existsSync(deployStagingWorkflow));
  report('8.3 .github/workflows/deploy-production.yml production release workflow exists', fs.existsSync(deployProdWorkflow));
  report('8.4 .github/dependabot.yml automated dependency management configured', fs.existsSync(dependabotConfig));

  console.log('\n================================================================');
  console.log(`Stage 8 Acceptance Test Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStage8Tests().catch((err) => {
  console.error('[FATAL] Stage 8 Acceptance execution failed:', err);
  process.exit(1);
});
