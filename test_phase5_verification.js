import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('  CineVerse Phase 5 Authentication & Personalization ');
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

  // Random test identifier for isolation
  const timestamp = Date.now();
  const testUserA = {
    name: 'Alice Cinephile',
    email: `alice_${timestamp}@cineversetest.io`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };
  const testUserB = {
    name: 'Bob MovieGoer',
    email: `bob_${timestamp}@cineversetest.io`,
    password: 'SecurePass456!',
    confirmPassword: 'SecurePass456!',
  };

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';

  // -------------------------------------------------------------
  // 1. REGISTRATION & INPUT VALIDATION TESTS
  // -------------------------------------------------------------
  console.log('--- 1. User Registration & Input Validation Tests ---');

  await testAsync('Registration requires full name, valid email, and password', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email', password: '123' }),
    });
    assert.strictEqual(res.status, 400, 'Should return 400 for missing name');
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await testAsync('Registration rejects password and confirmation mismatch', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mismatch User',
        email: `mismatch_${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'DifferentPassword999!',
      }),
    });
    assert.strictEqual(res.status, 400, 'Should return 400 for password mismatch');
    const data = await res.json();
    assert.ok(data.message.toLowerCase().includes('match'));
  });

  await testAsync('Registration rejects invalid email format', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });
    assert.strictEqual(res.status, 400, 'Should return 400 for invalid email');
  });

  await testAsync('Successful registration creates user and returns JWT token without exposing password hash', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserA),
    });
    assert.strictEqual(res.status, 201, 'Should return 201 Created');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.token, 'Must return JWT token');
    assert.ok(data.data.user, 'Must return user object');
    assert.strictEqual(data.data.user.email, testUserA.email.toLowerCase());
    assert.strictEqual(data.data.user.role, 'user', 'New user role must default to "user"');
    assert.strictEqual(data.data.user.password, undefined, 'Password hash must never be returned');
    assert.strictEqual(data.data.user.passwordHash, undefined, 'Password hash must never be returned');

    tokenA = data.data.token;
    userAId = data.data.user._id || data.data.user.id;
  });

  await testAsync('Duplicate registration with same email is rejected with 400 or 409', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserA),
    });
    assert.ok(
      res.status === 400 || res.status === 409,
      `Should reject duplicate email, got status ${res.status}`
    );
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.toLowerCase().includes('already exists') || data.message.toLowerCase().includes('registered'));
  });

  // -------------------------------------------------------------
  // 2. LOGIN & AUTHENTICATION TESTS
  // -------------------------------------------------------------
  console.log('\n--- 2. User Login & Token Verification Tests ---');

  await testAsync('Login with wrong password returns generic 401 message', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: 'IncorrectPassword!',
      }),
    });
    assert.strictEqual(res.status, 401, 'Should return 401 Unauthorized');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.toLowerCase().includes('invalid'));
  });

  await testAsync('Login with nonexistent email returns generic 401 message without leaking email existence', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `nonexistent_${timestamp}@cinema.org`,
        password: 'SomePassword123!',
      }),
    });
    assert.strictEqual(res.status, 401, 'Should return 401 for unknown email');
    const data = await res.json();
    assert.ok(data.message.toLowerCase().includes('invalid'));
  });

  await testAsync('Successful login returns valid JWT token and safe user payload', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: testUserA.password,
      }),
    });
    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.token, 'Must return JWT token');
    assert.strictEqual(data.data.user.email, testUserA.email.toLowerCase());
    assert.strictEqual(data.data.user.password, undefined);
  });

  await testAsync('Protected endpoint rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`);
    assert.strictEqual(res.status, 401, 'Should reject unauthenticated access');
  });

  await testAsync('Protected endpoint rejects forged / invalid JWT with 401', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.tampered.token' },
    });
    assert.strictEqual(res.status, 401, 'Should reject tampered token');
  });

  await testAsync('GET /api/auth/me returns current authenticated user session', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200, 'Should return 200 for valid token');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.email, testUserA.email.toLowerCase());
    assert.strictEqual(data.data.password, undefined);
  });

  // Register User B for multi-user isolation verification
  await testAsync('Register second independent user (User B)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserB),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    tokenB = data.data.token;
    userBId = data.data.user._id || data.data.user.id;
    assert.ok(tokenB);
  });

  // -------------------------------------------------------------
  // 3. WATCHLIST CRUD & PERSISTENCE TESTS
  // -------------------------------------------------------------
  console.log('\n--- 3. Watchlist CRUD & Multi-User Isolation Tests ---');

  const movie1 = {
    movieId: 1001,
    movieTitle: 'Inception',
    posterPath: '/inception_poster.jpg',
  };

  await testAsync('User A can add movie to personal watchlist', async () => {
    const res = await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(movie1),
    });
    assert.strictEqual(res.status, 201, 'Should return 201 on add');
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  await testAsync('Duplicate addition to watchlist is handled safely without duplicates', async () => {
    const res = await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(movie1),
    });
    // Either returns 400/409 duplicate or 200 with existing item
    const data = await res.json();
    assert.ok(res.status === 400 || res.status === 409 || res.status === 200);

    // Verify only 1 entry in User A watchlist
    const checkRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkData = await checkRes.json();
    const count = checkData.data.filter((m) => m.movieId === movie1.movieId).length;
    assert.strictEqual(count, 1, 'Watchlist must not contain duplicate movie IDs');
  });

  await testAsync('User B watchlist remains empty (cross-user data isolation)', async () => {
    const res = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.length, 0, "User B must not see User A's watchlist items");
  });

  await testAsync('User A can remove movie from personal watchlist', async () => {
    const res = await fetch(`${BASE_URL}/watchlist/${movie1.movieId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200, 'Should return 200 on delete');

    // Confirm removal
    const checkRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkData = await checkRes.json();
    assert.strictEqual(checkData.data.length, 0, 'User A watchlist should now be empty');
  });

  // -------------------------------------------------------------
  // 4. FAVORITES CRUD & PERSISTENCE TESTS
  // -------------------------------------------------------------
  console.log('\n--- 4. Favorites CRUD & Multi-User Isolation Tests ---');

  const movie2 = {
    movieId: 1002,
    movieTitle: 'Interstellar',
    posterPath: '/interstellar_poster.jpg',
  };

  await testAsync('User A can add movie to personal favorites', async () => {
    const res = await fetch(`${BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(movie2),
    });
    assert.strictEqual(res.status, 201, 'Should return 201 on favorite');
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  await testAsync('Duplicate favorite is handled safely without duplicate entries', async () => {
    const res = await fetch(`${BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(movie2),
    });
    assert.ok(res.status === 400 || res.status === 409 || res.status === 200);

    const checkRes = await fetch(`${BASE_URL}/favorites`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkData = await checkRes.json();
    const count = checkData.data.filter((m) => m.movieId === movie2.movieId).length;
    assert.strictEqual(count, 1, 'Favorites must not contain duplicate movie IDs');
  });

  await testAsync('User B favorites remains isolated from User A', async () => {
    const res = await fetch(`${BASE_URL}/favorites`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.length, 0, "User B must not see User A's favorites");
  });

  await testAsync('User A can remove movie from personal favorites', async () => {
    const res = await fetch(`${BASE_URL}/favorites/${movie2.movieId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200);

    const checkRes = await fetch(`${BASE_URL}/favorites`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkData = await checkRes.json();
    assert.strictEqual(checkData.data.length, 0, 'User A favorites should be empty');
  });

  // -------------------------------------------------------------
  // 5. VIEWING HISTORY & TIMESTAMP UPSERT TESTS
  // -------------------------------------------------------------
  console.log('\n--- 5. Viewing History & Most-Recent Upsert Tests ---');

  const historyMovie = {
    movieId: 1003,
    movieTitle: 'The Dark Knight',
    posterPath: '/dark_knight.jpg',
  };

  await testAsync('User A records movie viewing in history', async () => {
    const res = await fetch(`${BASE_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(historyMovie),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  await testAsync('Re-viewing movie updates viewedAt timestamp rather than duplicating records', async () => {
    // Record view again
    await fetch(`${BASE_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(historyMovie),
    });

    const res = await fetch(`${BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data = await res.json();
    assert.strictEqual(data.success, true);
    const matches = data.data.filter((h) => h.movieId === historyMovie.movieId);
    assert.strictEqual(matches.length, 1, 'Viewing history must be upserted without duplicates');
  });

  await testAsync('User B viewing history is strictly isolated from User A', async () => {
    const res = await fetch(`${BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const data = await res.json();
    assert.strictEqual(data.data.length, 0, "User B must not see User A's history");
  });

  await testAsync('User A can clear entire watch history', async () => {
    const res = await fetch(`${BASE_URL}/history`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200);

    const checkRes = await fetch(`${BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkData = await checkRes.json();
    assert.strictEqual(checkData.data.length, 0, 'History should now be empty');
  });

  // -------------------------------------------------------------
  // 6. PROFILE MANAGEMENT & SECURITY PRIVILEGE ESCALATION GUARDS
  // -------------------------------------------------------------
  console.log('\n--- 6. Profile Management & Security Hardening Tests ---');

  await testAsync('User A can update display name and avatar', async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Alice Cinematic VIP',
        avatar: 'https://images.unsplash.com/photo-custom?w=150',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.name, 'Alice Cinematic VIP');
    assert.strictEqual(data.data.avatar, 'https://images.unsplash.com/photo-custom?w=150');
  });

  await testAsync('Ordinary user CANNOT escalate role to admin via profile update (mass-assignment defense)', async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        role: 'admin',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.role, 'user', 'Role must remain "user", mass-assignment attempt ignored');
  });

  await testAsync('Ordinary user is rejected from admin-only endpoints with 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/users/admin/stats`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 403, 'Ordinary user should receive 403 Forbidden on admin endpoints');
  });

  await testAsync('GET /api/users/profile returns combined user info and statistics', async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.user, 'Must contain user data');
    assert.ok(data.data.stats, 'Must contain stats counts');
    assert.strictEqual(typeof data.data.stats.watchlistCount, 'number');
    assert.strictEqual(typeof data.data.stats.favoriteCount, 'number');
    assert.strictEqual(typeof data.data.stats.historyCount, 'number');
  });

  // -------------------------------------------------------------
  // 7. PASSWORD CHANGE VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 7. Password Change & Re-Authentication Tests ---');

  await testAsync('Password change requires verified current password', async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongCurrentPassword!',
        newPassword: 'BrandNewPassword123!',
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await testAsync('Password change succeeds with valid current password and updates hash', async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        currentPassword: testUserA.password,
        newPassword: 'BrandNewPassword123!',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);

    // Verify subsequent login with new password succeeds
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserA.email,
        password: 'BrandNewPassword123!',
      }),
    });
    assert.strictEqual(loginRes.status, 200, 'Must login successfully with new password');
  });

  // -------------------------------------------------------------
  // 8. FRONTEND CONTEXT & ROUTING INTEGRITY VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 8. Frontend Architecture & Routing Integrity Checks ---');

  await testAsync('Frontend AuthContext exposes full suite of session & state actions', async () => {
    const authContextPath = path.join(__dirname, 'src', 'context', 'AuthContext.jsx');
    const content = fs.readFileSync(authContextPath, 'utf8');
    assert.ok(content.includes('login'), 'Must include login action');
    assert.ok(content.includes('register'), 'Must include register action');
    assert.ok(content.includes('logout'), 'Must include logout action');
    assert.ok(content.includes('updateUserProfile'), 'Must include updateUserProfile action');
    assert.ok(content.includes('isAuthenticated'), 'Must include isAuthenticated check');
    assert.ok(content.includes('currentUser'), 'Must provide currentUser state');
  });

  await testAsync('Frontend ProtectedRoute guards authenticated routes and redirects to /login', async () => {
    const protectedRoutePath = path.join(__dirname, 'src', 'components', 'protectedRoute', 'index.jsx');
    const content = fs.readFileSync(protectedRoutePath, 'utf8');
    assert.ok(content.includes('Navigate to="/login"'), 'Must redirect unauthenticated users to /login');
    assert.ok(content.includes('state={{ from: location }}'), 'Must preserve previous location for seamless return');
  });

  await testAsync('Frontend App.jsx registers /dashboard, /profile, /watchlist, /favorites, /history', async () => {
    const appPath = path.join(__dirname, 'src', 'App.jsx');
    const content = fs.readFileSync(appPath, 'utf8');
    assert.ok(content.includes('/dashboard'), 'Must register /dashboard route');
    assert.ok(content.includes('/profile'), 'Must register /profile route');
    assert.ok(content.includes('/watchlist'), 'Must register /watchlist route');
    assert.ok(content.includes('/favorites'), 'Must register /favorites route');
    assert.ok(content.includes('/history'), 'Must register /history route');
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`  Phase 5 Results: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Fatal error during Phase 5 verification:', err);
  process.exit(1);
});
