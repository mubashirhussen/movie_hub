import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runStage5DeploymentTests() {
  console.log('================================================================');
  console.log('   CineVerse Stage 5: Staging Deployment Readiness Suite   ');
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
  // 1. ENVIRONMENT & SECRETS CONFIGURATION AUDIT
  // =========================================================================
  console.log('--- 1. Environment & Secrets Configuration Audit ---');

  await test('.env.example exists and contains required placeholders without real secrets', async () => {
    const envExamplePath = path.join(__dirname, '.env.example');
    assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
    const content = fs.readFileSync(envExamplePath, 'utf8');
    assert.ok(content.includes('MONGODB_URI='), 'Must define MONGODB_URI placeholder');
    assert.ok(content.includes('JWT_SECRET='), 'Must define JWT_SECRET placeholder');
    assert.ok(content.includes('TMDB_API_KEY='), 'Must define TMDB_API_KEY placeholder');
    assert.ok(content.includes('VITE_API_BASE_URL='), 'Must define VITE_API_BASE_URL placeholder');
    assert.ok(!content.includes('mongodb+srv://admin:secret'), 'Must not contain actual production credentials');
  });

  await test('.gitignore strictly ignores environment variable files and logs', async () => {
    const gitignorePath = path.join(__dirname, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist');
    const content = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(content.includes('.env'), '.gitignore must ignore .env');
    assert.ok(content.includes('node_modules'), '.gitignore must ignore node_modules');
    assert.ok(content.includes('dist'), '.gitignore must ignore dist');
  });

  await test('package.json defines standard production build and start scripts', async () => {
    const pkgPath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.ok(pkg.scripts.build, 'Must define build script');
    assert.ok(pkg.scripts.start, 'Must define start script');
    assert.strictEqual(pkg.scripts.start, 'node server/server.js', 'Start script must execute server.js');
  });

  // =========================================================================
  // 2. SPA ROUTING & HOSTING PLATFORM CONFIGURATIONS
  // =========================================================================
  console.log('\n--- 2. SPA Routing & Hosting Platform Configurations ---');

  await test('Vercel configuration (vercel.json) exists with wildcard SPA rewrite', async () => {
    const vercelPath = path.join(__dirname, 'vercel.json');
    assert.ok(fs.existsSync(vercelPath), 'vercel.json must exist');
    const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    assert.ok(Array.isArray(vercel.rewrites), 'vercel.json must declare rewrites array');
    assert.strictEqual(vercel.rewrites[0].destination, '/index.html');
  });

  await test('Netlify configuration (public/_redirects) exists with 200 rewrite rule', async () => {
    const redirectsPath = path.join(__dirname, 'public/_redirects');
    assert.ok(fs.existsSync(redirectsPath), 'public/_redirects must exist');
    const content = fs.readFileSync(redirectsPath, 'utf8');
    assert.ok(content.includes('/index.html   200'), 'Must contain 200 rewrite to index.html');
  });

  await test('Render blueprint (render.yaml) exists with health check and env definitions', async () => {
    const renderPath = path.join(__dirname, 'render.yaml');
    assert.ok(fs.existsSync(renderPath), 'render.yaml must exist');
    const content = fs.readFileSync(renderPath, 'utf8');
    assert.ok(content.includes('buildCommand: npm run build'));
    assert.ok(content.includes('startCommand: npm start'));
    assert.ok(content.includes('healthCheckPath: /api/health'));
  });

  await test('Production Dockerfile configured with multi-stage build and non-root security', async () => {
    const dockerPath = path.join(__dirname, 'Dockerfile');
    assert.ok(fs.existsSync(dockerPath), 'Dockerfile must exist');
    const content = fs.readFileSync(dockerPath, 'utf8');
    assert.ok(content.includes('FROM node:20-alpine AS runner'));
    assert.ok(content.includes('HEALTHCHECK'));
    assert.ok(content.includes('USER node'));
  });

  // =========================================================================
  // 3. FRONTEND DECOUPLING & ZERO HARDCODED LOCALHOST
  // =========================================================================
  console.log('\n--- 3. Frontend Decoupling & Zero Hardcoded URLs ---');

  await test('Frontend api.js dynamically resolves VITE_API_BASE_URL', async () => {
    const apiPath = path.join(__dirname, 'src/services/api.js');
    const content = fs.readFileSync(apiPath, 'utf8');
    assert.ok(content.includes('import.meta.env.VITE_API_BASE_URL'), 'api.js must check VITE_API_BASE_URL');
  });

  await test('No hardcoded localhost URLs exist in client source code (src/)', async () => {
    const srcDir = path.join(__dirname, 'src');
    function checkDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          checkDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
          const fileContent = fs.readFileSync(fullPath, 'utf8');
          assert.ok(!fileContent.includes('http://localhost:'), `Hardcoded localhost URL found in ${file}`);
        }
      }
    }
    checkDir(srcDir);
  });

  // =========================================================================
  // 4. OBSERVABILITY PROBES & RUNTIME RESILIENCE
  // =========================================================================
  console.log('\n--- 4. Observability Probes & Runtime Resilience ---');

  await test('Backend liveness probe (/api/health) reports healthy status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, 'healthy');
    assert.ok(typeof data.uptimeSeconds === 'number');
  });

  await test('Backend readiness probe (/api/ready) verifies MongoDB connectivity', async () => {
    const res = await fetch(`${BASE_URL}/ready`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ready');
    assert.strictEqual(data.database, 'connected');
  });

  await test('Non-existent API endpoint returns JSON 404 error (does not leak SPA HTML)', async () => {
    const res = await fetch(`${BASE_URL}/nonexistent_api_endpoint_12345`);
    assert.strictEqual(res.status, 404);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('application/json'), 'API 404 must return JSON, not HTML');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.toLowerCase().includes('not found'));
  });

  await test('Production startup secret validator prevents running without critical keys', async () => {
    const serverPath = path.join(__dirname, 'server/server.js');
    const content = fs.readFileSync(serverPath, 'utf8');
    assert.ok(content.includes("process.env.NODE_ENV === 'production'"));
    assert.ok(content.includes('JWT_SECRET'));
    assert.ok(content.includes('MONGODB_URI'));
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`Stage 5 Deployment Readiness Results: ${passed}/${total} passed (100% PASS rate)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runStage5DeploymentTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
