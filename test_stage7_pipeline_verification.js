import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- CineVerse Stage 7: CI/CD & Automated Release Pipeline Verification ---');

let passedTests = 0;
let totalTests = 0;

function assert(description, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } else {
    console.error(`  [FAIL] ${description} ${details ? `(${details})` : ''}`);
  }
}

// 1. CI Workflow Verification (.github/workflows/ci.yml)
console.log('\n[1/7] Auditing GitHub Actions CI Pipeline Configuration (.github/workflows/ci.yml)...');
const ciPath = path.join(__dirname, '.github', 'workflows', 'ci.yml');
assert('ci.yml exists', fs.existsSync(ciPath));

if (fs.existsSync(ciPath)) {
  const ciContent = fs.readFileSync(ciPath, 'utf8');
  assert('CI triggers on pull_request to main', ciContent.includes('pull_request:') && ciContent.includes('branches: [ main ]'));
  assert('CI triggers on push to main', ciContent.includes('push:') && ciContent.includes('branches: [ main ]'));
  assert('CI defines concurrency control with cancel-in-progress', ciContent.includes('concurrency:') && ciContent.includes('cancel-in-progress: true'));
  assert('CI restricts workflow permissions to read', ciContent.includes('permissions:') && ciContent.includes('contents: read'));
  assert('CI configures isolated MongoDB service container', ciContent.includes('image: mongo:7.0') && ciContent.includes('27017:27017'));
  assert('CI pins checkout and node setup to v4', ciContent.includes('actions/checkout@v4') && ciContent.includes('actions/setup-node@v4'));
  assert('CI enforces deterministic dependency installation (npm ci)', ciContent.includes('run: npm ci'));
  assert('CI executes dependency vulnerability scan (npm audit)', ciContent.includes('run: npm audit --audit-level=high'));
  assert('CI passes test database connection parameters without leaking secrets', ciContent.includes('MONGODB_URI: mongodb://127.0.0.1:27017/cineverse_ci_test'));
  assert('CI executes full test suite (npm test)', ciContent.includes('run: npm test'));
  assert('CI builds frontend production bundle', ciContent.includes('run: npm run build'));
  assert('CI verifies production artifact existence (dist/index.html)', ciContent.includes('test -f dist/index.html'));
}

// 2. Staging Deployment Workflow Verification (.github/workflows/deploy-staging.yml)
console.log('\n[2/7] Auditing Staging Deployment Pipeline (.github/workflows/deploy-staging.yml)...');
const deployStagingPath = path.join(__dirname, '.github', 'workflows', 'deploy-staging.yml');
assert('deploy-staging.yml exists', fs.existsSync(deployStagingPath));

if (fs.existsSync(deployStagingPath)) {
  const stagingContent = fs.readFileSync(deployStagingPath, 'utf8');
  assert('Staging deployment uses staging environment', stagingContent.includes('environment:') && stagingContent.includes('name: staging'));
  assert('Staging deployment prevents race conditions (cancel-in-progress: false)', stagingContent.includes('group: deploy-staging') && stagingContent.includes('cancel-in-progress: false'));
  assert('Staging deployment uses RENDER_STAGING_DEPLOY_HOOK secret reference', stagingContent.includes('${{ secrets.RENDER_STAGING_DEPLOY_HOOK }}'));
  assert('Staging deployment incorporates post-deployment health check probe', stagingContent.includes('/api/health'));
}

// 3. Production Deployment Workflow Verification (.github/workflows/deploy-production.yml)
console.log('\n[3/7] Auditing Production Release Pipeline (.github/workflows/deploy-production.yml)...');
const deployProdPath = path.join(__dirname, '.github', 'workflows', 'deploy-production.yml');
assert('deploy-production.yml exists', fs.existsSync(deployProdPath));

if (fs.existsSync(deployProdPath)) {
  const prodContent = fs.readFileSync(deployProdPath, 'utf8');
  assert('Production release triggers on version tags (v*.*.*)', prodContent.includes('tags:') && prodContent.includes("'v*.*.*'"));
  assert('Production release targets protected production environment', prodContent.includes('name: production'));
  assert('Production concurrency guarantees ordered execution', prodContent.includes('group: deploy-production') && prodContent.includes('cancel-in-progress: false'));
  assert('Production deploy references PROD_DEPLOY_HOOK secret by name only', prodContent.includes('${{ secrets.RENDER_PROD_DEPLOY_HOOK }}'));
  assert('Production post-deployment verification validates liveness probe', prodContent.includes('/api/health'));
}

// 4. Dependabot Automated Dependency Security (.github/dependabot.yml)
console.log('\n[4/7] Auditing Dependabot Vulnerability Scanning Configuration...');
const dependabotPath = path.join(__dirname, '.github', 'dependabot.yml');
assert('dependabot.yml exists', fs.existsSync(dependabotPath));

if (fs.existsSync(dependabotPath)) {
  const depContent = fs.readFileSync(dependabotPath, 'utf8');
  assert('Dependabot configured for npm package ecosystem', depContent.includes('package-ecosystem: "npm"'));
  assert('Dependabot configured for github-actions ecosystem', depContent.includes('package-ecosystem: "github-actions"'));
  assert('Dependabot runs on weekly schedule', depContent.includes('interval: "weekly"'));
}

// 5. Secrets Hygiene & Git Safety
console.log('\n[5/7] Verifying Secrets Hygiene & Sensitive Data Protection...');
const workflowsDir = path.join(__dirname, '.github', 'workflows');
const workflowFiles = fs.readdirSync(workflowsDir);
let foundLeakedSecret = false;

for (const file of workflowFiles) {
  const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
  // Check for raw un-templated tokens or live keys
  if (content.match(/(sk_live|mongodb\+srv:\/\/[^$]+:[^$]+@|ghp_[a-zA-Z0-9]{30,})/)) {
    foundLeakedSecret = true;
  }
}
assert('Zero hardcoded credentials or API keys in workflows', !foundLeakedSecret);

const gitignorePath = path.join(__dirname, '.gitignore');
assert('.gitignore exists', fs.existsSync(gitignorePath));
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  assert('.gitignore excludes .env files', gitignoreContent.includes('.env'));
  assert('.gitignore excludes node_modules', gitignoreContent.includes('node_modules'));
  assert('.gitignore excludes dist build artifacts', gitignoreContent.includes('dist'));
}

const envExamplePath = path.join(__dirname, '.env.example');
assert('.env.example exists and documents configuration without live values', fs.existsSync(envExamplePath));
if (fs.existsSync(envExamplePath)) {
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  assert('.env.example documents MONGODB_URI and JWT_SECRET', envExample.includes('MONGODB_URI') && envExample.includes('JWT_SECRET'));
  assert('.env.example uses placeholders rather than real secret tokens', !envExample.includes('mongodb+srv://admin:secret123'));
}

// 6. Package.json CI/CD Scripts Audit
console.log('\n[6/7] Auditing package.json Build & Test Script Compatibility...');
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

assert('package.json defines "build" script', typeof pkg.scripts.build === 'string');
assert('package.json defines "start" script', typeof pkg.scripts.start === 'string');
assert('package.json defines "test" script', typeof pkg.scripts.test === 'string');
assert('package.json defines "audit" script', typeof pkg.scripts.audit === 'string');
assert('package.json defines "test:ci" script', typeof pkg.scripts['test:ci'] === 'string');
assert('package.json defines "test:stage7" script', typeof pkg.scripts['test:stage7'] === 'string');

// 7. Rollback & Release Runbook Documentation
console.log('\n[7/7] Auditing Deployment Runbook & Rollback Procedures...');
const runbookPath = path.join(__dirname, 'DEPLOYMENT_RUNBOOK.md');
assert('DEPLOYMENT_RUNBOOK.md exists', fs.existsSync(runbookPath));

if (fs.existsSync(runbookPath)) {
  const runbookContent = fs.readFileSync(runbookPath, 'utf8');
  assert('Runbook documents incident response and instant rollback procedures', runbookContent.includes('Instant Rollback') || runbookContent.includes('Rollback'));
  assert('Runbook documents database backup strategy (mongodump/Atlas snapshots)', runbookContent.includes('mongodump') || runbookContent.includes('backup'));
  assert('Runbook documents health check probes (/api/health & /api/ready)', runbookContent.includes('/api/health') && runbookContent.includes('/api/ready'));
}

console.log(`\n====================================================`);
console.log(`Stage 7 CI/CD Verification Result: ${passedTests}/${totalTests} Passed`);
console.log(`====================================================\n`);

if (passedTests < totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
