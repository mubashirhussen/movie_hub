import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getImageUrl,
  getBackdropUrl,
  getPlaceholderPosterSvg,
} from './src/utils/imageUrl.js';
import { seedMovies } from './server/data/seedMovies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTestSuite() {
  console.log('====================================================');
  console.log('  CineVerse Phase 2 Verification & Regression Suite ');
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

  // --- 1. Movie Poster Tests ---
  console.log('--- 1. Movie Poster Reliability Tests ---');

  test('Valid TMDB poster path generates proper w500 URL', () => {
    const url = getImageUrl('/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'The Dark Knight');
    assert.strictEqual(url, 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg');
  });

  test('Existing full TMDB URL prevents double base URL prepend', () => {
    const raw = 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg';
    const url = getImageUrl(raw, 'The Dark Knight');
    assert.strictEqual(url, raw);
    assert.strictEqual(url.includes('image.tmdb.org/t/p/w500/https:'), false);
  });

  test('Missing/null poster path returns dynamic SVG fallback with title', () => {
    const urlNull = getImageUrl(null, 'Inception');
    const urlEmpty = getImageUrl('', 'Interstellar');
    const urlWhitespace = getImageUrl('   ', 'Avatar');

    assert.ok(urlNull.startsWith('data:image/svg+xml'));
    assert.ok(decodeURIComponent(urlNull).includes('Inception'));
    assert.ok(decodeURIComponent(urlEmpty).includes('Interstellar'));
    assert.ok(decodeURIComponent(urlWhitespace).includes('Avatar'));
  });

  test('Malformed or invalid schema URLs fall back to SVG safely', () => {
    const url = getImageUrl('invalid://random-bad-path', 'RRR');
    assert.ok(url.startsWith('data:image/svg+xml'));
    assert.ok(decodeURIComponent(url).includes('RRR'));
  });

  test('Valid TMDB backdrop path generates proper w1280 URL', () => {
    const url = getBackdropUrl('/70AV2Xx5FQYj20labp0EGdbGd98.jpg', 'Salaar');
    assert.strictEqual(url, 'https://image.tmdb.org/t/p/w1280/70AV2Xx5FQYj20labp0EGdbGd98.jpg');
  });

  test('Seed movies contain zero YouTube thumbnail URLs as posters or backdrops', () => {
    for (const movie of seedMovies) {
      assert.strictEqual(
        (movie.poster_path || '').includes('img.youtube.com'),
        false,
        `Movie ${movie.title} poster contains YouTube thumbnail!`
      );
      assert.strictEqual(
        (movie.backdrop_path || '').includes('img.youtube.com'),
        false,
        `Movie ${movie.title} backdrop contains YouTube thumbnail!`
      );
    }
  });

  // --- 2. Error Handling & Retry Tests ---
  console.log('\n--- 2. Error Handling & API Security Tests ---');

  test('Placeholder SVG escapes XML characters safely', () => {
    const svgUrl = getPlaceholderPosterSvg('Fast & Furious <Tokyo> "Drift"');
    const decoded = decodeURIComponent(svgUrl);
    assert.ok(decoded.includes('Fast &amp; Furious &lt;Tokyo&gt; &quot;Drift&quot;'));
  });

  test('Dist bundle does not leak TMDB API credentials or secrets', () => {
    const distPath = path.join(__dirname, 'dist', 'assets');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath).filter((f) => f.endsWith('.js'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(distPath, file), 'utf8');
        // TMDB production key should not be present
        assert.strictEqual(
          content.includes('9f854bcf7f1e78ef'),
          false,
          `File ${file} leaks TMDB credentials!`
        );
      }
    }
  });

  // --- 3. Live Backend Endpoints & Section Independence Tests ---
  console.log('\n--- 3. Backend Endpoints & Homepage Section Independence ---');

  const backendHost = 'http://127.0.0.1:5000';

  await testAsync('Backend /api/movies/popular returns status 200 with movie list', async () => {
    const res = await fetch(`${backendHost}/api/movies/popular`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.success, 'Expected success: true');
    assert.ok(Array.isArray(data.data.results), 'Expected results array');
    assert.ok(data.data.results.length > 0, 'Expected at least 1 movie');
  });

  await testAsync('Backend /api/movies/top-rated returns status 200 with movie list', async () => {
    const res = await fetch(`${backendHost}/api/movies/top-rated`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.ok(Array.isArray(data.data.results));
  });

  await testAsync('Backend /api/movies/upcoming returns status 200 with movie list', async () => {
    const res = await fetch(`${backendHost}/api/movies/upcoming`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.ok(Array.isArray(data.data.results));
  });

  const industries = ['tollywood', 'bollywood', 'hollywood', 'kollywood', 'sandalwood', 'mollywood'];
  for (const ind of industries) {
    await testAsync(`Backend industry category '${ind}' returns valid movies`, async () => {
      const res = await fetch(`${backendHost}/api/movies/category/${ind}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.success);
      assert.ok(Array.isArray(data.data.results));
      assert.ok(data.data.results.length > 0, `Expected results for industry ${ind}`);
    });
  }

  console.log('\n====================================================');
  console.log(`  Tests Completed: ${passed} / ${total} Passed`);
  console.log('====================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
