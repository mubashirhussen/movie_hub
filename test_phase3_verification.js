import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDUSTRY_CONFIG, getIndustryConfig, getAllIndustries } from './server/config/industryConfig.js';
import tmdbService from './server/services/tmdbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('  CineVerse Phase 3 Discovery & Search Suite        ');
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

  // --- 1. Industry Configuration Tests ---
  console.log('--- 1. Six Cinema Industries Configuration Tests ---');

  test('All 6 industries are configured with correct regional language mappings', () => {
    const industries = getAllIndustries();
    assert.strictEqual(industries.length, 6, 'Expected 6 cinema industries');

    const tollywood = getIndustryConfig('tollywood');
    assert.strictEqual(tollywood.languageCode, 'te');
    assert.strictEqual(tollywood.tmdbFilters.with_original_language, 'te');

    const bollywood = getIndustryConfig('bollywood');
    assert.strictEqual(bollywood.languageCode, 'hi');
    assert.strictEqual(bollywood.tmdbFilters.with_original_language, 'hi');

    const hollywood = getIndustryConfig('hollywood');
    assert.strictEqual(hollywood.languageCode, 'en');
    assert.strictEqual(hollywood.tmdbFilters.with_origin_country, 'US');

    const kollywood = getIndustryConfig('kollywood');
    assert.strictEqual(kollywood.languageCode, 'ta');

    const sandalwood = getIndustryConfig('sandalwood');
    assert.strictEqual(sandalwood.languageCode, 'kn');

    const mollywood = getIndustryConfig('mollywood');
    assert.strictEqual(mollywood.languageCode, 'ml');
  });

  test('Handles alternate industry casing and common alias sandywood', () => {
    assert.strictEqual(getIndustryConfig('Sandywood')?.id, 'sandalwood');
    assert.strictEqual(getIndustryConfig('TOLLYWOOD')?.id, 'tollywood');
    assert.strictEqual(getIndustryConfig('unknown_industry'), null);
  });

  // --- 2. Live Backend Discovery Endpoints ---
  console.log('\n--- 2. Backend Discovery & Category Endpoints ---');
  const backendHost = 'http://127.0.0.1:5000';

  await testAsync('GET /api/movies/now-playing returns 200 and movie results', async () => {
    const res = await fetch(`${backendHost}/api/movies/now-playing`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(Array.isArray(body.data.results));
    assert.ok(body.data.results.length > 0);
  });

  await testAsync('GET /api/movies/genres returns valid genre list with IDs and names', async () => {
    const res = await fetch(`${backendHost}/api/movies/genres`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(Array.isArray(body.data.genres));
    assert.ok(body.data.genres.length >= 15);
    const actionGenre = body.data.genres.find((g) => g.id === 28 || g.name === 'Action');
    assert.ok(actionGenre, 'Action genre (ID 28) must exist in genres list');
  });

  await testAsync('GET /api/movies/discover supports genre filtering and sorting', async () => {
    const res = await fetch(`${backendHost}/api/movies/discover?genre=28&sortBy=vote_average.desc&page=1`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(Array.isArray(body.data.results));
    assert.ok(body.data.results.length > 0);
  });

  await testAsync('GET /api/movies/discover supports industry combined with year filter', async () => {
    const res = await fetch(`${backendHost}/api/movies/discover?industry=tollywood&year=2024&sortBy=popularity.desc`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(Array.isArray(body.data.results));
  });

  await testAsync('Unwhitelisted sort options fall back safely to popularity.desc', async () => {
    const res = await fetch(`${backendHost}/api/movies/discover?sortBy=malicious_sql_injection`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(Array.isArray(body.data.results));
  });

  // --- 3. People & Actor Search Endpoints ---
  console.log('\n--- 3. People & Actor Search Endpoints ---');

  await testAsync('GET /api/people/search returns matching cast members', async () => {
    const res = await fetch(`${backendHost}/api/people/search?query=Prabhas`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(Array.isArray(body.data.results));
  });

  await testAsync('GET /api/people/search with whitespace-only returns empty array without error', async () => {
    const res = await fetch(`${backendHost}/api/people/search?query=%20%20%20`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.strictEqual(body.data.results.length, 0);
    assert.strictEqual(body.data.total_results, 0);
  });

  await testAsync('GET /api/people/:id/movies returns actor filmography', async () => {
    const res = await fetch(`${backendHost}/api/people/1001/movies`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(Array.isArray(body.data.results));
  });

  // --- 4. Pagination & Query Sanitization ---
  console.log('\n--- 4. Pagination & Boundary Testing ---');

  await testAsync('Pagination page 2 returns second page metadata', async () => {
    const res = await fetch(`${backendHost}/api/movies/popular?page=2`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.strictEqual(Number(body.data.page), 2);
  });

  await testAsync('Negative page input safely defaults to page 1', async () => {
    const res = await fetch(`${backendHost}/api/movies/popular?page=-10`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.strictEqual(Number(body.data.page), 1);
  });

  // --- 5. Security & Bundling Verification ---
  console.log('\n--- 5. Security & Production Bundle Check ---');

  test('Production bundles in dist/assets never leak API keys', () => {
    const distPath = path.join(__dirname, 'dist', 'assets');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath).filter((f) => f.endsWith('.js'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(distPath, file), 'utf8');
        assert.strictEqual(
          content.includes('9f854bcf7f1e78ef'),
          false,
          `File ${file} contains raw TMDB secrets!`
        );
      }
    }
  });

  console.log('\n====================================================');
  console.log(`  Phase 3 Tests Completed: ${passed} / ${total} Passed`);
  console.log('====================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
