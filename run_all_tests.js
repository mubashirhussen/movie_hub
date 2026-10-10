import { spawnSync } from 'node:child_process';

const suites = [
  { name: 'Phase 2: Posters & Section Reliability', file: 'test_phase2_verification.js' },
  { name: 'Phase 3: Search, Genres & Industries', file: 'test_phase3_verification.js' },
  { name: 'Phase 4: Movie Details, Cast & Trailers', file: 'test_phase4_verification.js' },
  { name: 'Phase 5: Authentication & User Profiles', file: 'test_phase5_verification.js' },
  { name: 'Phase 6: Production Ops, Probes & Security', file: 'test_phase6_verification.js' },
  { name: 'Stage 2: E2E Realistic User Journeys', file: 'test_e2e_journeys.js' },
  { name: 'Stage 3: Production Security & Data Integrity', file: 'test_stage3_security.js' },
  { name: 'Stage 4: Performance, Accessibility & UX', file: 'test_stage4_performance_a11y.js' },
];

console.log('====================================================');
console.log('   CineVerse Comprehensive Master Regression Suite   ');
console.log('====================================================\n');

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

if (!allPassed) {
  console.error('One or more test suites failed.');
  process.exit(1);
} else {
  console.log(`All ${suites.length} test suites passed successfully (100% PASS rate)!`);
  process.exit(0);
}
