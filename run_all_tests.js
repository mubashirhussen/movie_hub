import { spawn, spawnSync } from 'node:child_process';

const suites = [
  { name: 'Phase 2: Posters & Section Reliability', file: 'test_phase2_verification.js' },
  { name: 'Phase 3: Search, Genres & Industries', file: 'test_phase3_verification.js' },
  { name: 'Phase 4: Movie Details, Cast & Trailers', file: 'test_phase4_verification.js' },
  { name: 'Phase 5: Authentication & User Profiles', file: 'test_phase5_verification.js' },
  { name: 'Phase 6: Production Ops, Probes & Security', file: 'test_phase6_verification.js' },
  { name: 'Stage 2: E2E Realistic User Journeys', file: 'test_e2e_journeys.js' },
  { name: 'Stage 3: Production Security & Data Integrity', file: 'test_stage3_security.js' },
  { name: 'Stage 4: Performance, Accessibility & UX', file: 'test_stage4_performance_a11y.js' },
  { name: 'Stage 5: Staging Deployment Readiness', file: 'test_stage5_deployment_readiness.js' },
  { name: 'Stage 7: CI/CD & Automated Release Pipeline', file: 'test_stage7_pipeline_verification.js' },
];

console.log('====================================================');
console.log('   CineVerse Comprehensive Master Regression Suite   ');
console.log('====================================================\n');

let serverProcess = null;

async function ensureServerRunning() {
  const baseUrl = process.env.API_URL || 'http://localhost:5000/api';
  const healthUrl = `${baseUrl.replace(/\/+$/, '')}/health`;

  try {
    const res = await fetch(healthUrl);
    if (res.ok) {
      console.log(`[INIT] CineVerse server is already running and healthy at ${baseUrl}.\n`);
      return;
    }
  } catch {
    // Server is not running, auto-spawn for test execution
  }

  console.log('[INIT] Spawning CineVerse backend server for automated CI/regression run...');
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
  throw new Error(`Timed out waiting for backend server to respond at ${healthUrl}`);
}

async function runAll() {
  await ensureServerRunning();

  let allPassed = true;
  const summary = [];

  for (const suite of suites) {
    console.log(`\n>>> Running [${suite.name}] (${suite.file})...\n`);
    const result = spawnSync('node', [suite.file], {
      stdio: 'inherit',
    });

    if (result.status === 0) {
      summary.push({ name: suite.name, status: 'PASS' });
    } else {
      allPassed = false;
      summary.push({ name: suite.name, status: 'FAIL' });
    }
  }

  console.log('\n====================================================');
  console.log('            MASTER TEST EXECUTION SUMMARY           ');
  console.log('====================================================');
  summary.forEach((s) => {
    console.log(`[${s.status}] ${s.name}`);
  });
  console.log('====================================================\n');

  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }

  if (!allPassed) {
    console.error('One or more test suites failed.');
    process.exit(1);
  } else {
    console.log(`All ${suites.length} test suites passed successfully (100% PASS rate)!`);
    process.exit(0);
  }
}

runAll().catch((err) => {
  console.error('[FATAL] Regression runner error:', err.message);
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
  process.exit(1);
});
