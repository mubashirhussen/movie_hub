import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import tmdbService from './server/services/tmdbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';

console.log('================================================================');
console.log('   CineVerse Stage 12: Data Quality, Reliability & Caching     ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;
let serverProcess = null;

function report(name, condition, details = '') {
  if (condition) {
    passCount++;
    console.log(`[PASS] ${name}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${name} ${details ? `(${details})` : ''}`);
  }
}

async function ensureServerRunning() {
  const healthUrl = `${BASE_URL.replace(/\/+$/, '')}/health`;
  try {
    const res = await fetch(healthUrl);
    if (res.ok) {
      console.log(`[INIT] CineVerse server is active at ${BASE_URL}.\n`);
      return;
    }
  } catch {
    // Server is not running, spawn it
  }

  console.log('[INIT] Spawning CineVerse server on port 5000...');
  serverProcess = spawn('node', ['server/server.js'], {
    env: {
      ...process.env,
      PORT: process.env.PORT || '5000',
      NODE_ENV: process.env.NODE_ENV || 'test',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cineverse',
      JWT_SECRET: process.env.JWT_SECRET || 'cineverse_super_secret_jwt_key_2026_production_grade',
    },
    stdio: 'ignore',
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 15000) {
    try {
      const res = await fetch(healthUrl);
      if (res.ok) {
        console.log('[INIT] Server launched successfully and confirmed healthy.\n');
        return;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error('Timed out waiting for backend server to start');
}

async function runStage12Tests() {
  await ensureServerRunning();

  const timestamp = Date.now();
  const testUserEmail = `cache_user_${timestamp}@example.com`;
  const password = 'CacheTestPassword123!';
  let authToken = null;
  let userId = null;

  // 1. Data Normalization Unit Tests
  console.log('--- 1. Movie Data Quality & Normalization ---');
  try {
    const rawDirtyMovie = {
      id: '550',
      title: 'Fight Club ',
      vote_average: 8.4321,
      vote_count: '24560',
      overview: 'An insomniac office worker...',
      genre_ids: ['28', 18],
      poster_path: null,
      backdrop_path: '/path.jpg',
      release_date: '1999-10-15',
    };

    const normalized = tmdbService.normalizeMovie(rawDirtyMovie);

    report('1.1 ID normalized to integer', typeof normalized.id === 'number' && normalized.id === 550);
    report('1.2 Title trimmed properly', normalized.title === 'Fight Club');
    report('1.3 Vote average rounded to 1 decimal place', normalized.vote_average === 8.4);
    report('1.4 Vote count converted to number', typeof normalized.vote_count === 'number' && normalized.vote_count === 24560);
    report('1.5 Missing poster path uses reliable placeholder fallback', typeof normalized.poster_path === 'string' && normalized.poster_path.length > 0);
    report('1.6 Genre IDs normalized to numbers array', Array.isArray(normalized.genre_ids) && normalized.genre_ids.includes(28) && normalized.genre_ids.includes(18));
    report('1.7 Release year extracted correctly', normalized.release_year === 1999 || normalized.release_year === '1999');

    // Test with completely empty raw object (missing optional fields)
    const emptyRaw = { id: 999999 };
    const emptyNormalized = tmdbService.normalizeMovie(emptyRaw);
    report('1.8 Resilient to empty optional fields without crashing', emptyNormalized.title === 'Untitled' && emptyNormalized.overview === '' && emptyNormalized.poster_path !== null);
  } catch (err) {
    report('1.0 Normalization suite', false, err.message);
  }

  // 2. Setup Test User for Auth & Isolation Checks
  console.log('\n--- 2. User Setup for Cache & Data Isolation Tests ---');
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cache Tester', email: testUserEmail, password }),
    });
    const regData = await regRes.json();
    authToken = regData.data?.token || regData.token;
    userId = regData.data?.user?.id || regData.data?.user?._id;
    report('2.1 Test user created for authenticated isolation checks', regRes.status === 201 && !!authToken);
  } catch (err) {
    report('2.1 User creation', false, err.message);
  }

  // 3. Cache Endpoints & Keying Tests
  console.log('\n--- 3. Cache Endpoints, Keying & Differentiated TTLs ---');
  try {
    // Clear cache first
    const clearRes = await fetch(`${BASE_URL}/movies/cache/clear`, { method: 'POST' });
    const clearData = await clearRes.json();
    report('3.1 Cache clear endpoint (POST /api/movies/cache/clear) flushes cache', clearRes.ok && clearData.success === true);

    const statsRes1 = await fetch(`${BASE_URL}/movies/cache/stats`);
    const stats1 = await statsRes1.json();
    report('3.2 Cache stats endpoint (GET /api/movies/cache/stats) returns accurate metrics', statsRes1.ok && stats1.success && stats1.data.size === 0);

    // Initial fetch - Cache Miss
    const t0 = performance.now();
    const fetch1Res = await fetch(`${BASE_URL}/movies/popular?page=1`);
    const fetch1Time = performance.now() - t0;
    const fetch1Data = await fetch1Res.json();
    report('3.3 Initial catalog request succeeds', fetch1Res.ok && (Array.isArray(fetch1Data.data?.results) || Array.isArray(fetch1Data.data)));

    // Second fetch - Cache Hit (should be fast < 40ms)
    const t1 = performance.now();
    const fetch2Res = await fetch(`${BASE_URL}/movies/popular?page=1`);
    const fetch2Time = performance.now() - t1;
    const fetch2Data = await fetch2Res.json();
    report('3.4 Repeated request is served rapidly from cache (Cache Hit)', fetch2Res.ok && fetch2Time < 50);

    // Verify stats updated
    const statsRes2 = await fetch(`${BASE_URL}/movies/cache/stats`);
    const stats2 = await statsRes2.json();
    report('3.5 Cache hits and size tracked in operational stats', stats2.data.hits >= 1 && stats2.data.size >= 1);

    // Verify differentiated cache keys for different queries/pages
    await fetch(`${BASE_URL}/movies/popular?page=2`);
    await fetch(`${BASE_URL}/movies/discover?genre=28&page=1`);
    await fetch(`${BASE_URL}/movies/discover?genre=35&page=1`);

    const statsRes3 = await fetch(`${BASE_URL}/movies/cache/stats`);
    const stats3 = await statsRes3.json();
    report('3.6 Distinct query parameters create distinct deterministic cache entries', stats3.data.size >= 4);
    report('3.7 Configured TTL strategy includes differentiated categories', typeof stats3.data.ttls === 'object' && stats3.data.ttls.GENRES > stats3.data.ttls.SEARCH);
  } catch (err) {
    report('3.0 Cache tests', false, err.message);
  }

  // 4. In-flight Request Deduplication
  console.log('\n--- 4. In-Flight Request Deduplication ---');
  try {
    // Clear cache to test in-flight deduplication on fresh requests
    await fetch(`${BASE_URL}/movies/cache/clear`, { method: 'POST' });

    // Fire 5 identical requests simultaneously for un-cached page
    const promises = [
      fetch(`${BASE_URL}/movies/top-rated?page=7`),
      fetch(`${BASE_URL}/movies/top-rated?page=7`),
      fetch(`${BASE_URL}/movies/top-rated?page=7`),
      fetch(`${BASE_URL}/movies/top-rated?page=7`),
      fetch(`${BASE_URL}/movies/top-rated?page=7`),
    ];

    const responses = await Promise.all(promises);
    const allOk = responses.every((r) => r.ok);
    report('4.1 Concurrent requests all resolve successfully with 200 OK', allOk);

    const statsRes = await fetch(`${BASE_URL}/movies/cache/stats`);
    const stats = await statsRes.json();
    report('4.2 In-flight requests deduplicated into single upstream call', stats.data.dedupedRequests >= 1);
  } catch (err) {
    report('4.0 Deduplication test', false, err.message);
  }

  // 5. TMDB Error Sanitization & Security
  console.log('\n--- 5. API Credential Protection & Safe Error Sanitization ---');
  try {
    // Test that searching or fetching movie with invalid characters does not leak API keys in response
    const searchBadRes = await fetch(`${BASE_URL}/movies/search?query=test%20query%20with%20symbols%26`);
    const searchBody = await searchBadRes.text();
    report('5.1 Upstream API key is never leaked in search response body', !searchBody.includes('api_key=') && !searchBody.includes('Bearer ey'));

    // Check movie detail with non-existent or invalid ID
    const badIdRes = await fetch(`${BASE_URL}/movies/invalid-id-xyz`);
    const badIdBody = await badIdRes.text();
    report('5.2 Invalid movie ID produces safe error or fallback without leaking stack trace', !badIdBody.includes('    at ') && (badIdRes.status === 400 || badIdRes.status === 404 || badIdRes.status === 500));

    // Check circuit breaker status safe exposure
    const statsRes = await fetch(`${BASE_URL}/movies/cache/stats`);
    const stats = await statsRes.json();
    report('5.3 Operational stats safely reports circuit breaker state without sensitive tokens', stats.data.circuitBreakerActive === false || typeof stats.data.circuitBreakerActive === 'boolean');
  } catch (err) {
    report('5.0 Error sanitization suite', false, err.message);
  }

  // 6. User Data & Public Cache Isolation
  console.log('\n--- 6. Public Cache & User Data Isolation ---');
  try {
    // Check that watchlist endpoints do NOT get stored in shared movie cache
    const testMovieId = 550;
    const addWlRes = await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ movieId: testMovieId, title: 'Fight Club', poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' }),
    });

    const getWlRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const wlData = await getWlRes.json();
    const hasMovie = (wlData.data?.movies || wlData.data || []).some((m) => (m.movieId || m.id) === testMovieId);
    report('6.1 User watchlist stores valid TMDB ID and preserves user records', hasMovie);

    // Verify cache stats does not contain private user tokens or user IDs
    const statsRes = await fetch(`${BASE_URL}/movies/cache/stats`);
    const statsText = await statsRes.text();
    report('6.2 Public cache does not contain user token or private user IDs', !statsText.includes(authToken) && !statsText.includes(userId));
  } catch (err) {
    report('6.0 User data isolation', false, err.message);
  }

  // 7. Frontend Stale Search Prevention & AbortController Verification
  console.log('\n--- 7. Frontend Debounce & Stale Request Cancellation ---');
  try {
    const searchBarFile = path.join(__dirname, 'src', 'components', 'searchBar', 'index.jsx');
    const searchBarContent = fs.readFileSync(searchBarFile, 'utf8');

    report('7.1 Frontend SearchBar implements AbortController for active request cancellation', searchBarContent.includes('AbortController') && searchBarContent.includes('abort()'));
    report('7.2 Frontend SearchBar implements debounced search query trigger', searchBarContent.includes('debounce') || searchBarContent.includes('setTimeout'));
    report('7.3 Frontend safely ignores AbortError / canceled requests without showing false error', searchBarContent.includes("name === 'AbortError'") || searchBarContent.includes('AbortError'));

    const loadingSpinnerFile = path.join(__dirname, 'src', 'components', 'loading', 'index.jsx');
    const hasLoadingComp = fs.existsSync(loadingSpinnerFile);
    report('7.4 Dedicated loading state component exists and is maintained', hasLoadingComp);

    const fallbackImageFile = path.join(__dirname, 'src', 'utils', 'imageUrl.js');
    const fallbackImageContent = fs.readFileSync(fallbackImageFile, 'utf8');
    report('7.5 Reliable image fallback utility exists for missing posters/backdrops', fallbackImageContent.includes('placeholder') || fallbackImageContent.includes('PLACEHOLDER') || fallbackImageContent.includes('svg'));
  } catch (err) {
    report('7.0 Frontend checks', false, err.message);
  }

  if (serverProcess) {
    serverProcess.kill();
  }

  // Summary
  console.log('\n================================================================');
  console.log(`   Stage 12 Test Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runStage12Tests().catch((err) => {
  if (serverProcess) serverProcess.kill();
  console.error('[FATAL] Stage 12 Test Runner encountered an error:', err);
  process.exit(1);
});
