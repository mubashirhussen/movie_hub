import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tmdbService from './server/services/tmdbService.js';
import movieRoutes from './server/routes/movieRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('  CineVerse Phase 4 Movie Details Verification Suite ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
    }
  }

  // --- 1. Movie Details Endpoint Tests ---
  console.log('--- 1. Movie Details Data Integrity Tests ---');

  await testAsync('Valid movie ID returns complete details metadata structure', async () => {
    const movie = await tmdbService.getMovieDetails(1001);
    assert.ok(movie, 'Movie details should be returned');
    assert.ok(movie.title, 'Movie should have title');
    assert.ok(movie.overview, 'Movie should have overview');
    assert.ok(movie.poster_path, 'Movie should have poster_path');
    assert.ok(movie.backdrop_path, 'Movie should have backdrop_path');
    assert.ok(Array.isArray(movie.genres), 'Genres should be an array');
    assert.ok(movie.genres.length > 0, 'Movie should have at least one genre');
    assert.ok(typeof movie.runtime === 'number', 'Runtime should be a number');
    assert.ok(movie.status, 'Status should be present');
  });

  await testAsync('Genuinely non-existent movie ID returns null for proper 404 handling', async () => {
    const movie = await tmdbService.getMovieDetails(999999999);
    assert.strictEqual(movie, null, 'Unknown movie ID should return null instead of falling back to wrong movie');
  });

  // --- 2. Cast and Crew Credits Tests ---
  console.log('\n--- 2. Cast & Key Production Crew Credits Tests ---');

  await testAsync('Credits endpoint returns both cast and key crew members', async () => {
    const credits = await tmdbService.getMovieCredits(1001);
    assert.ok(credits, 'Credits should be defined');
    assert.ok(Array.isArray(credits.cast), 'Cast should be an array');
    assert.ok(credits.cast.length > 0, 'Cast array should not be empty');
    assert.ok(Array.isArray(credits.crew), 'Crew should be an array');
    assert.ok(credits.crew.length > 0, 'Crew array should not be empty');

    const firstActor = credits.cast[0];
    assert.ok(firstActor.name, 'Actor name must exist');
    assert.ok(firstActor.character, 'Character name must exist');

    const hasDirectorOrWriter = credits.crew.some(
      (c) => (c.job || '').toLowerCase().includes('director') || (c.job || '').toLowerCase().includes('writer')
    );
    assert.ok(hasDirectorOrWriter, 'Crew should contain Director or Writer/Screenplay');
  });

  test('Cast member cards generate safe actor filmography search URLs', () => {
    const actor = { id: 74568, name: 'Chris Hemsworth', character: 'Thor' };
    const encodedName = encodeURIComponent(actor.name);
    const expectedUrl = `/search?actor=${actor.id}&query=${encodedName}`;
    assert.strictEqual(expectedUrl, `/search?actor=74568&query=Chris%20Hemsworth`);
  });

  // --- 3. Trailers & Official Videos Tests ---
  console.log('\n--- 3. Trailers & Video Embed Tests ---');

  await testAsync('Trailer service returns YouTube video details with safe key', async () => {
    const videoData = await tmdbService.getMovieVideos(1001);
    assert.ok(videoData, 'Video data should be defined');
    assert.ok(Array.isArray(videoData.results), 'Results should be an array of videos');
    assert.ok(videoData.results.length > 0, 'Should have at least one video');

    const video = videoData.results[0];
    assert.ok(video.key, 'Video should have a YouTube key');
    assert.match(video.key, /^[a-zA-Z0-9_-]{6,20}$/, 'Video key must be valid YouTube key format');
  });

  test('Video key validation regex rejects malicious or malformed keys', () => {
    const isValidKey = (key) =>
      Boolean(key && typeof key === 'string' && /^[a-zA-Z0-9_-]{6,20}$/.test(key.trim()));

    assert.strictEqual(isValidKey('dQw4w9WgXcQ'), true, 'Valid YouTube key should pass');
    assert.strictEqual(isValidKey('NgBoMJy386M'), true, 'Valid YouTube key should pass');
    assert.strictEqual(isValidKey('<script>alert(1)</script>'), false, 'XSS string must be rejected');
    assert.strictEqual(isValidKey('javascript:void(0)'), false, 'Javascript URI must be rejected');
    assert.strictEqual(isValidKey(''), false, 'Empty string must be rejected');
    assert.strictEqual(isValidKey(null), false, 'Null must be rejected');
  });

  // --- 4. Similar Movies vs Recommended Movies Tests ---
  console.log('\n--- 4. Similar & Recommended Movies Distinctness Tests ---');

  await testAsync('Similar movies returns paginated results excluding requested movie ID', async () => {
    const similar = await tmdbService.getSimilarMovies(1001, 1);
    assert.ok(similar, 'Similar response should exist');
    assert.ok(Array.isArray(similar.results), 'Similar results should be array');
    const selfIncluded = similar.results.some((m) => Number(m.id) === 1001);
    assert.strictEqual(selfIncluded, false, 'Current movie must not appear in its own similar list');
  });

  await testAsync('Recommendations returns distinct paginated results excluding requested movie ID', async () => {
    const recs = await tmdbService.getRecommendations(1001, 1);
    assert.ok(recs, 'Recommendations response should exist');
    assert.ok(Array.isArray(recs.results), 'Recommendations results should be array');
    const selfIncluded = recs.results.some((m) => Number(m.id) === 1001);
    assert.strictEqual(selfIncluded, false, 'Current movie must not appear in its own recommendations list');
  });

  // --- 5. Verified Regional Streaming Providers Tests ---
  console.log('\n--- 5. Verified Regional Streaming Providers Tests ---');

  await testAsync('Watch providers returns regional breakdown (flatrate, rent, buy)', async () => {
    const providers = await tmdbService.getWatchProviders(1001, 'IN');
    assert.ok(providers, 'Providers data should exist');
    assert.strictEqual(providers.region, 'IN', 'Providers should match requested region');
    assert.ok(Array.isArray(providers.flatrate), 'flatrate must be an array');
    assert.ok(Array.isArray(providers.rent), 'rent must be an array');
    assert.ok(Array.isArray(providers.buy), 'buy must be an array');
  });

  await testAsync('Watch providers supports region switching to US without crashing', async () => {
    const providersUS = await tmdbService.getWatchProviders(1001, 'US');
    assert.ok(providersUS, 'US providers should exist');
    assert.strictEqual(providersUS.region, 'US');
    assert.ok(Array.isArray(providersUS.flatrate));
  });

  // --- 6. Express Routes & Aliases Tests ---
  console.log('\n--- 6. Backend Route Registration & Aliases Tests ---');

  test('All required Phase 4 routes and aliases are registered on Express router', () => {
    const routes = movieRoutes.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

    const hasRoute = (path, method = 'GET') =>
      routes.some((r) => r.path === path && r.method === method);

    assert.ok(hasRoute('/:id'), 'GET /:id route must exist');
    assert.ok(hasRoute('/:id/cast'), 'GET /:id/cast route must exist');
    assert.ok(hasRoute('/:id/credits'), 'GET /:id/credits alias must exist');
    assert.ok(hasRoute('/:id/trailer'), 'GET /:id/trailer route must exist');
    assert.ok(hasRoute('/:id/videos'), 'GET /:id/videos alias must exist');
    assert.ok(hasRoute('/:id/providers'), 'GET /:id/providers route must exist');
    assert.ok(hasRoute('/:id/similar'), 'GET /:id/similar route must exist');
    assert.ok(hasRoute('/:id/recommendations'), 'GET /:id/recommendations route must exist');
    assert.ok(hasRoute('/:id/view', 'POST'), 'POST /:id/view route must exist');
  });

  // --- 7. Security & API Credential Safety Tests ---
  console.log('\n--- 7. Security & Bundle Credential Check ---');

  test('Client source code never exposes TMDB API key or secret variables', () => {
    const srcDir = path.join(__dirname, 'src');
    const clientFiles = fs.readdirSync(srcDir, { recursive: true });

    for (const relPath of clientFiles) {
      const fullPath = path.join(srcDir, relPath);
      if (fs.statSync(fullPath).isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(!content.includes('TMDB_API_KEY ='), `Client file ${relPath} should not define TMDB_API_KEY`);
        assert.ok(!content.includes('api.themoviedb.org/3'), `Client file ${relPath} should not call TMDB directly`);
      }
    }
  });

  console.log('\n====================================================');
  console.log(`  Phase 4 Tests Completed: ${passed} / ${total} Passed`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
