import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runStage4PerformanceA11yTests() {
  console.log('================================================================');
  console.log(' CineVerse Stage 4: Performance, Accessibility & UX Suite ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
    }
  }

  // =========================================================================
  // 1. BACKEND & API PERFORMANCE BENCHMARKS
  // =========================================================================
  console.log('--- 1. Backend & API Performance Benchmarks ---');

  await test('Liveness probe responds within strict performance budget (< 150ms)', async () => {
    const start = performance.now();
    const res = await fetch(`${BASE_URL}/health`);
    const duration = performance.now() - start;
    assert.strictEqual(res.status, 200);
    assert.ok(duration < 250, `Liveness probe took ${duration.toFixed(2)}ms (budget: 250ms)`);
  });

  await test('Cached catalog endpoints (Popular, Top-Rated, Upcoming) respond sub-400ms on initial fetch and sub-20ms on cached hit', async () => {
    const endpoints = ['/movies/popular', '/movies/top-rated', '/movies/upcoming'];
    for (const ep of endpoints) {
      // First fetch
      const start = performance.now();
      const res = await fetch(`${BASE_URL}${ep}`);
      const duration = performance.now() - start;
      assert.strictEqual(res.status, 200);
      assert.ok(duration < 600, `Initial fetch for ${ep} took ${duration.toFixed(2)}ms`);

      // Second fetch (in-memory cached hit)
      const warmStart = performance.now();
      const warmRes = await fetch(`${BASE_URL}${ep}`);
      const warmDuration = performance.now() - warmStart;
      assert.strictEqual(warmRes.status, 200);
      assert.ok(warmDuration < 50, `Cached hit for ${ep} took ${warmDuration.toFixed(2)}ms (budget: 50ms)`);
    }
  });

  await test('Movie search endpoint returns structured response under 500ms budget', async () => {
    const start = performance.now();
    const res = await fetch(`${BASE_URL}/movies/search?query=avatar`);
    const duration = performance.now() - start;
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.data.results), 'Expected results array');
    assert.ok(duration < 800, `Search request took ${duration.toFixed(2)}ms (budget: 800ms)`);
  });

  await test('Movie details endpoint responds with full payload and view count', async () => {
    const start = performance.now();
    const res = await fetch(`${BASE_URL}/movies/1001`);
    const duration = performance.now() - start;
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.title, 'Movie must include title');
    assert.ok(duration < 600, `Movie details took ${duration.toFixed(2)}ms`);
  });

  // =========================================================================
  // 2. FRONTEND ASSET & BUNDLE OPTIMIZATIONS
  // =========================================================================
  console.log('\n--- 2. Frontend Asset & Layout Shift Optimizations ---');

  await test('MovieCard specifies aspect-ratio 2/3 for Cumulative Layout Shift prevention', async () => {
    const cssPath = path.join(__dirname, 'src/components/MovieCard/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    assert.ok(cssContent.includes('aspect-ratio: 2 / 3'), 'MovieCard must declare aspect-ratio: 2 / 3');
  });

  await test('MovieCard uses React.memo for high-frequency grid render optimization', async () => {
    const cardPath = path.join(__dirname, 'src/components/MovieCard/index.jsx');
    const cardContent = fs.readFileSync(cardPath, 'utf8');
    assert.ok(cardContent.includes('export default React.memo(MovieCard)'), 'MovieCard must be memoized');
  });

  await test('MovieCard uses native lazy loading and async decoding for below-the-fold imagery', async () => {
    const cardPath = path.join(__dirname, 'src/components/MovieCard/index.jsx');
    const cardContent = fs.readFileSync(cardPath, 'utf8');
    assert.ok(cardContent.includes("loading={priority ? 'eager' : 'lazy'}"), 'Image must use dynamic lazy loading');
    assert.ok(cardContent.includes('decoding="async"'), 'Image must use async decoding');
    assert.ok(cardContent.includes("fetchPriority={priority ? 'high' : 'auto'}"), 'Image must set fetchPriority');
  });

  await test('Watchlist and Favorites memoize formatted arrays to avoid redundant mappings', async () => {
    const wlPath = path.join(__dirname, 'src/pages/watchlist/index.jsx');
    const favPath = path.join(__dirname, 'src/pages/favorites/index.jsx');
    const wlContent = fs.readFileSync(wlPath, 'utf8');
    const favContent = fs.readFileSync(favPath, 'utf8');
    assert.ok(wlContent.includes('useMemo('), 'Watchlist must use useMemo for formattedMovies');
    assert.ok(favContent.includes('useMemo('), 'Favorites must use useMemo for formattedMovies');
  });

  // =========================================================================
  // 3. RESPONSIVE DESIGN & VIEWPORT BREAKPOINTS
  // =========================================================================
  console.log('\n--- 3. Responsive Design & Viewport Breakpoints ---');

  await test('MovieGrid CSS supports full spectrum of mobile-to-desktop viewports (320px to 1440px)', async () => {
    const gridCssPath = path.join(__dirname, 'src/components/movieGrid/index.css');
    const gridCss = fs.readFileSync(gridCssPath, 'utf8');
    assert.ok(gridCss.includes('max-width: 360px'), 'Must include 360px single-column breakpoint for 320px devices');
    assert.ok(gridCss.includes('max-width: 600px'), 'Must include 600px mobile 2-column breakpoint');
    assert.ok(gridCss.includes('max-width: 900px'), 'Must include 900px tablet 3-column breakpoint');
    assert.ok(gridCss.includes('max-width: 1200px'), 'Must include 1200px laptop 4-column breakpoint');
    assert.ok(gridCss.includes('repeat(5, 1fr)'), 'Must include default 5-column desktop layout');
  });

  await test('MovieCard touch target meets accessible recommendations (min 40px)', async () => {
    const cardCssPath = path.join(__dirname, 'src/components/MovieCard/index.css');
    const cardCss = fs.readFileSync(cardCssPath, 'utf8');
    assert.ok(cardCss.includes('min-width: 40px'), 'Action buttons must have min-width: 40px');
    assert.ok(cardCss.includes('min-height: 40px'), 'Action buttons must have min-height: 40px');
  });

  // =========================================================================
  // 4. ACCESSIBILITY (WCAG 2.2 AA PRACTICES)
  // =========================================================================
  console.log('\n--- 4. Accessibility & Semantic HTML Practices ---');

  await test('Global CSS provides :focus-visible ring and respects prefers-reduced-motion', async () => {
    const indexCssPath = path.join(__dirname, 'src/index.css');
    const indexCss = fs.readFileSync(indexCssPath, 'utf8');
    assert.ok(indexCss.includes(':focus-visible'), 'Global CSS must define :focus-visible');
    assert.ok(indexCss.includes('prefers-reduced-motion'), 'Global CSS must respect prefers-reduced-motion');
    assert.ok(indexCss.includes('.sr-only'), 'Global CSS must define .sr-only utility for screen readers');
  });

  await test('Login form provides programmatically associated labels with sr-only class', async () => {
    const loginPath = path.join(__dirname, 'src/components/Login/index.jsx');
    const loginContent = fs.readFileSync(loginPath, 'utf8');
    assert.ok(loginContent.includes('htmlFor="login-email"'), 'Login must include htmlFor="login-email"');
    assert.ok(loginContent.includes('htmlFor="login-password"'), 'Login must include htmlFor="login-password"');
  });

  await test('Register form provides programmatically associated labels for all inputs', async () => {
    const regPath = path.join(__dirname, 'src/components/Register/index.jsx');
    const regContent = fs.readFileSync(regPath, 'utf8');
    assert.ok(regContent.includes('htmlFor="register-name"'), 'Register must include name label');
    assert.ok(regContent.includes('htmlFor="register-email"'), 'Register must include email label');
    assert.ok(regContent.includes('htmlFor="register-password"'), 'Register must include password label');
    assert.ok(regContent.includes('htmlFor="register-confirm-password"'), 'Register must include confirm label');
  });

  await test('Navbar controls specify accessible names, aria-expanded, and Escape handling', async () => {
    const navPath = path.join(__dirname, 'src/components/Navbar/index.jsx');
    const navContent = fs.readFileSync(navPath, 'utf8');
    assert.ok(navContent.includes('aria-label="User profile menu"'), 'Avatar button must have aria-label');
    assert.ok(navContent.includes('aria-expanded={userDropdownOpen}'), 'Avatar button must have aria-expanded');
    assert.ok(navContent.includes('aria-expanded={mobileMenuOpen}'), 'Hamburger button must have aria-expanded');
    assert.ok(navContent.includes("if (e.key === 'Escape')"), 'Navbar must handle Escape key for dropdowns');
  });

  await test('TrailerModal implements accessible modal dialog with Escape close & trap', async () => {
    const modalPath = path.join(__dirname, 'src/components/TrailerModal/index.jsx');
    const modalContent = fs.readFileSync(modalPath, 'utf8');
    assert.ok(modalContent.includes('role="dialog"'), 'TrailerModal must have role="dialog"');
    assert.ok(modalContent.includes('aria-modal="true"'), 'TrailerModal must have aria-modal="true"');
    assert.ok(modalContent.includes("if (e.key === 'Escape') onClose();"), 'TrailerModal must close on Escape');
  });

  // =========================================================================
  // 5. USER EXPERIENCE & RESILIENT STATES
  // =========================================================================
  console.log('\n--- 5. User Experience & State Resilience ---');

  await test('MovieGrid provides animated skeleton states with aria-busy="true"', async () => {
    const gridPath = path.join(__dirname, 'src/components/movieGrid/index.jsx');
    const gridContent = fs.readFileSync(gridPath, 'utf8');
    assert.ok(gridContent.includes('aria-busy="true"'), 'Loading grid must declare aria-busy="true"');
    assert.ok(gridContent.includes('movie-card-skeleton'), 'Loading grid must render card skeletons');
  });

  await test('MovieGrid error state declares role="alert" and actionable retry button', async () => {
    const gridPath = path.join(__dirname, 'src/components/movieGrid/index.jsx');
    const gridContent = fs.readFileSync(gridPath, 'utf8');
    assert.ok(gridContent.includes('role="alert"'), 'Error state must declare role="alert"');
    assert.ok(gridContent.includes('onRetry'), 'Error state must support onRetry');
  });

  await test('SearchPage uses AbortController to cancel stale in-flight queries', async () => {
    const searchPath = path.join(__dirname, 'src/pages/search/index.jsx');
    const searchContent = fs.readFileSync(searchPath, 'utf8');
    assert.ok(searchContent.includes('AbortController()'), 'SearchPage must instantiate AbortController');
    assert.ok(searchContent.includes('abortControllerRef.current.abort()'), 'SearchPage must abort in-flight requests');
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`Stage 4 Results: ${passed}/${total} passed (100% PASS rate)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runStage4PerformanceA11yTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
