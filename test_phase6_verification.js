import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import History from './server/models/History.js';
import Watchlist from './server/models/Watchlist.js';
import Favorite from './server/models/Favorite.js';
import User from './server/models/User.js';
import { MemoryRateLimiter } from './server/middleware/rateLimitMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runPhase6Tests() {
  console.log('====================================================');
  console.log('  CineVerse Phase 6 Production Readiness & Ops Suite ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

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

  // -------------------------------------------------------------
  // 1. HEALTH AND READINESS PROBE TESTS
  // -------------------------------------------------------------
  console.log('--- 1. Health & Readiness Observability Probes ---');

  await testAsync('GET /api/health confirms liveness, status healthy, and uptime', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200, 'Liveness health check must return HTTP 200');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, 'healthy');
    assert.ok(typeof data.uptimeSeconds === 'number', 'Uptime should be reported');
    assert.ok(data.timestamp, 'Timestamp should be present');
  });

  await testAsync('GET /api/ready verifies MongoDB database connection readiness', async () => {
    const res = await fetch(`${BASE_URL}/ready`);
    assert.strictEqual(res.status, 200, 'Readiness probe must return HTTP 200 when DB is connected');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, 'ready');
    assert.strictEqual(data.database, 'connected');
  });

  // -------------------------------------------------------------
  // 2. SECURITY HEADERS & CORS HARDENING TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. Security Headers & Protocol Hardening ---');

  await testAsync('API responses include essential production security headers', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const headers = res.headers;

    assert.strictEqual(headers.get('x-content-type-options'), 'nosniff', 'Missing X-Content-Type-Options: nosniff');
    assert.strictEqual(headers.get('x-frame-options'), 'SAMEORIGIN', 'Missing X-Frame-Options: SAMEORIGIN');
    assert.strictEqual(headers.get('referrer-policy'), 'strict-origin-when-cross-origin', 'Missing Referrer-Policy');
    assert.strictEqual(headers.get('cross-origin-opener-policy'), 'same-origin', 'Missing Cross-Origin-Opener-Policy');
    assert.ok(headers.get('permissions-policy'), 'Missing Permissions-Policy header');
    assert.strictEqual(headers.get('x-powered-by'), null, 'X-Powered-By header must be suppressed');
  });

  // -------------------------------------------------------------
  // 3. RATE LIMITING ENGINE TESTS
  // -------------------------------------------------------------
  console.log('\n--- 3. Rate Limiting & Abuse Prevention Tests ---');

  await testAsync('Rate limiter attaches standard RateLimit headers to responses', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.ok(res.headers.get('ratelimit-limit'), 'Must include RateLimit-Limit header');
    assert.ok(res.headers.get('ratelimit-remaining'), 'Must include RateLimit-Remaining header');
    assert.ok(res.headers.get('ratelimit-reset'), 'Must include RateLimit-Reset header');
  });

  await testAsync('MemoryRateLimiter triggers HTTP 429 and Retry-After when threshold exceeded', async () => {
    const testLimiter = new MemoryRateLimiter({
      windowMs: 5000,
      max: 3,
      message: 'Rate limit test exceeded',
    }).middleware();

    let finalStatus = 200;
    let finalBody = null;
    let retryAfter = null;

    const fakeReq = { ip: '192.168.1.100', headers: {}, socket: {} };
    const fakeRes = {
      setHeader: (k, v) => {
        if (k.toLowerCase() === 'retry-after') retryAfter = v;
      },
      status: (code) => {
        finalStatus = code;
        return {
          json: (body) => {
            finalBody = body;
          },
        };
      },
    };

    // Invoke 4 times (max is 3)
    for (let i = 0; i < 4; i++) {
      testLimiter(fakeReq, fakeRes, () => {});
    }

    assert.strictEqual(finalStatus, 429, 'Should return HTTP 429 when max limit is breached');
    assert.ok(finalBody && finalBody.error === 'RateLimitExceeded');
    assert.ok(retryAfter, 'Retry-After header must be set');
  });

  // -------------------------------------------------------------
  // 4. MONGODB INDEX & SCHEMA OPTIMIZATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 4. MongoDB Schema & Index Optimizations ---');

  await testAsync('History schema includes compound index for chronological queries', async () => {
    const indexes = History.schema.indexes();
    const hasChronologicalIndex = indexes.some(([fields]) => fields.userId === 1 && fields.viewedAt === -1);
    assert.ok(hasChronologicalIndex, 'History model must include compound index { userId: 1, viewedAt: -1 }');
  });

  await testAsync('Watchlist & Favorite schemas include compound unique indexes', async () => {
    const wlIndexes = Watchlist.schema.indexes();
    const hasWlCompound = wlIndexes.some(([fields, opts]) => fields.userId === 1 && fields.movieId === 1 && opts.unique);
    assert.ok(hasWlCompound, 'Watchlist must have unique compound index on { userId, movieId }');

    const favIndexes = Favorite.schema.indexes();
    const hasFavCompound = favIndexes.some(([fields, opts]) => fields.userId === 1 && fields.movieId === 1 && opts.unique);
    assert.ok(hasFavCompound, 'Favorite must have unique compound index on { userId, movieId }');
  });

  await testAsync('User schema enforces unique email indexing', async () => {
    const emailPath = User.schema.path('email');
    assert.strictEqual(emailPath.options.unique, true, 'User email must be unique');
  });

  // -------------------------------------------------------------
  // 5. STRUCTURED ERROR HANDLING & 404 CONTRACTS
  // -------------------------------------------------------------
  console.log('\n--- 5. Centralized Error Handling & Diagnostics ---');

  await testAsync('Non-existent API endpoint returns structured 404 JSON response', async () => {
    const res = await fetch(`${BASE_URL}/nonexistent_endpoint_check_404`);
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('Resource Not Found') || data.message.includes('not found'));
  });

  // -------------------------------------------------------------
  // 6. FRONTEND CODE SPLITTING & BUNDLE VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 6. Frontend Code Splitting & Performance Verification ---');

  await testAsync('Production build artifacts exist and contain route-level chunks', async () => {
    const distPath = path.join(__dirname, 'dist', 'assets');
    assert.ok(fs.existsSync(distPath), 'dist/assets directory must exist');

    const files = fs.readdirSync(distPath);
    const hasVendorReact = files.some((f) => f.startsWith('vendor-react-') && f.endsWith('.js'));
    const hasVendorLibs = files.some((f) => f.startsWith('vendor-libs-') && f.endsWith('.js'));
    const hasHomeChunk = files.some((f) => f.startsWith('home-') && f.endsWith('.js'));
    const hasDashboardChunk = files.some((f) => f.startsWith('dashboard-') && f.endsWith('.js'));

    assert.ok(hasVendorReact, 'Must generate vendor-react chunk');
    assert.ok(hasVendorLibs, 'Must generate vendor-libs chunk');
    assert.ok(hasHomeChunk, 'Home page must be dynamically chunked');
    assert.ok(hasDashboardChunk, 'Dashboard page must be dynamically chunked');
  });

  // -------------------------------------------------------------
  // 7. ACCESSIBILITY STYLING AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 7. Accessibility & User Preferences Audit ---');

  await testAsync('Global CSS provides :focus-visible rings and reduced-motion rules', async () => {
    const cssPath = path.join(__dirname, 'src', 'index.css');
    const content = fs.readFileSync(cssPath, 'utf8');

    assert.ok(content.includes(':focus-visible'), 'CSS must include visible focus ring styling');
    assert.ok(content.includes('prefers-reduced-motion: reduce'), 'CSS must respect reduced-motion preferences');
    assert.ok(content.includes('.sr-only'), 'CSS must provide screen-reader accessibility class');
  });

  // -------------------------------------------------------------
  // 8. CI/CD & DOCKER DEPLOYMENT ARTIFACTS
  // -------------------------------------------------------------
  console.log('\n--- 8. Operational Deployment & CI/CD Readiness ---');

  await testAsync('GitHub Actions workflow file exists and defines test and build pipeline', async () => {
    const ciPath = path.join(__dirname, '.github', 'workflows', 'ci.yml');
    assert.ok(fs.existsSync(ciPath), 'ci.yml must exist');
    const content = fs.readFileSync(ciPath, 'utf8');
    assert.ok(content.includes('npm test'), 'CI must run npm test');
    assert.ok(content.includes('npm run build'), 'CI must build production bundle');
  });

  await testAsync('Dockerfile and docker-compose.yml are configured for production', async () => {
    const dockerfilePath = path.join(__dirname, 'Dockerfile');
    const composePath = path.join(__dirname, 'docker-compose.yml');
    assert.ok(fs.existsSync(dockerfilePath), 'Dockerfile must exist');
    assert.ok(fs.existsSync(composePath), 'docker-compose.yml must exist');

    const dockerContent = fs.readFileSync(dockerfilePath, 'utf8');
    assert.ok(dockerContent.includes('HEALTHCHECK'), 'Dockerfile should include healthcheck probe');
    assert.ok(dockerContent.includes('USER node'), 'Dockerfile should run as unprivileged node user');
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`  Phase 6 Results: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase6Tests().catch((err) => {
  console.error('Fatal error during Phase 6 verification:', err);
  process.exit(1);
});
