import assert from 'node:assert';
import jwt from 'jsonwebtoken';

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'cineverse_super_secret_jwt_key_2026_production_grade';

async function runStage3SecurityTests() {
  console.log('================================================================');
  console.log('  CineVerse Stage 3: Production Security & Data Integrity Tests  ');
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

  const timestamp = Date.now();
  const userAData = {
    name: 'Security User A',
    email: `sec_user_a_${timestamp}@cineverse-sec.io`,
    password: 'SecurePasswordA123!',
    confirmPassword: 'SecurePasswordA123!',
  };

  const userBData = {
    name: 'Security User B',
    email: `sec_user_b_${timestamp}@cineverse-sec.io`,
    password: 'SecurePasswordB456!',
    confirmPassword: 'SecurePasswordB456!',
  };

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';

  // =========================================================================
  // 1. AUTHENTICATION & CREDENTIAL SECURITY
  // =========================================================================
  console.log('--- 1. Authentication & Credential Security ---');

  await test('Registration sanitizes and never returns password hash', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userAData),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const user = resBody.data?.user || resBody.user;
    const token = resBody.data?.token || resBody.token;

    assert.ok(user, 'Expected user object in response');
    assert.strictEqual(user.password, undefined, 'Password must not be returned');
    assert.strictEqual(user.passwordHash, undefined, 'Password hash must not be returned');
    assert.ok(token, 'Expected JWT token in registration response');

    tokenA = token;
    userAId = user.id || user._id;
  });

  await test('Registering second independent account User B', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userBData),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    const user = resBody.data?.user || resBody.user;
    const token = resBody.data?.token || resBody.token;

    assert.ok(token, 'Expected JWT token for User B');
    tokenB = token;
    userBId = user.id || user._id;
    assert.notStrictEqual(userAId, userBId, 'User A and User B must have distinct IDs');
  });

  await test('Duplicate email registration rejected safely with 409', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userAData,
        email: userAData.email.toUpperCase(), // Test case insensitivity
      }),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 409, `Expected 409 conflict, got ${res.status}`);
    assert.ok(resBody.message.toLowerCase().includes('already exists'), 'Expected clear conflict message');
  });

  await test('Login with incorrect password returns generic error (anti-enumeration)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userAData.email,
        password: 'CompletelyWrongPassword!',
      }),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    assert.strictEqual(resBody.message, 'Invalid email or password');
  });

  await test('Login with non-existent email returns identical generic error', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `non_existent_${timestamp}@cineverse-sec.io`,
        password: 'AnyPassword123!',
      }),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    assert.strictEqual(resBody.message, 'Invalid email or password');
  });

  await test('Login response omits password and password hash', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userAData.email,
        password: userAData.password,
      }),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const user = resBody.data?.user || resBody.user;
    assert.ok(user, 'User object must be returned on login');
    assert.strictEqual(user.password, undefined);
    assert.strictEqual(user.passwordHash, undefined);
  });

  // =========================================================================
  // 2. JWT TOKEN VALIDATION & BOUNDARY TESTS
  // =========================================================================
  console.log('\n--- 2. JWT Token Validation & Boundary Tests ---');

  await test('Missing Authorization token is rejected with 401', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`);
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  await test('Malformed Authorization header is rejected with 401', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'NotABearerToken' },
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  await test('Tampered token signature is rejected with 401', async () => {
    const fakeToken = jwt.sign({ id: userAId, email: userAData.email }, 'wrong_secret_signature');
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  await test('Expired token is rejected with 401', async () => {
    const expiredToken = jwt.sign(
      { id: userAId, email: userAData.email },
      JWT_SECRET,
      { expiresIn: '-10s' }
    );
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
  });

  // =========================================================================
  // 3. AUTHORIZATION & STRICT USER ISOLATION (USER A vs USER B)
  // =========================================================================
  console.log('\n--- 3. Authorization & Strict User Isolation ---');

  // Seed User A's data
  await test('Seed User A with Watchlist, Favorite, and History entries', async () => {
    // Add to Watchlist
    const wlRes = await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        movieId: 550,
        title: 'Fight Club',
        posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      }),
    });
    assert.strictEqual(wlRes.status, 201);

    // Add to Favorite
    const favRes = await fetch(`${BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        movieId: 680,
        title: 'Pulp Fiction',
        posterPath: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
      }),
    });
    assert.strictEqual(favRes.status, 201);

    // Add to History
    const histRes = await fetch(`${BASE_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        movieId: 27205,
        title: 'Inception',
        posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
      }),
    });
    assert.strictEqual(histRes.status, 200);
  });

  await test('User B cannot see User A watchlist (Watchlist Isolation)', async () => {
    const res = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(resBody.count, 0, 'User B watchlist must be empty');
    assert.deepStrictEqual(resBody.data, [], 'User B watchlist data must not contain User A movies');
  });

  await test('User B cannot mutate or delete User A watchlist entry', async () => {
    // Attempt deletion using User B's token on movie 550 (which only User A has)
    const res = await fetch(`${BASE_URL}/watchlist/550`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(res.status, 200);

    // Verify User A's watchlist item remains completely intact
    const checkRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkBody = await checkRes.json();
    assert.strictEqual(checkBody.count, 1, "User A watchlist item must remain intact");
    assert.strictEqual(checkBody.data[0].movieId, 550);
  });

  await test('User B cannot see User A favorites (Favorite Isolation)', async () => {
    const res = await fetch(`${BASE_URL}/favorites`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(resBody.count, 0, 'User B favorites must be empty');
    assert.deepStrictEqual(resBody.data, []);
  });

  await test('User B cannot delete User A favorite entry', async () => {
    const res = await fetch(`${BASE_URL}/favorites/680`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(res.status, 200);

    // Verify User A's favorite item is intact
    const checkRes = await fetch(`${BASE_URL}/favorites`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkBody = await checkRes.json();
    assert.strictEqual(checkBody.count, 1, "User A favorite item must remain intact");
    assert.strictEqual(checkBody.data[0].movieId, 680);
  });

  await test('User B cannot see User A viewing history (History Isolation)', async () => {
    const res = await fetch(`${BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(resBody.count, 0, 'User B history must be empty');
    assert.deepStrictEqual(resBody.data, []);
  });

  await test('User B cannot clear User A viewing history', async () => {
    const res = await fetch(`${BASE_URL}/history`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(res.status, 200);

    // Verify User A still has their history intact
    const checkRes = await fetch(`${BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkBody = await checkRes.json();
    assert.strictEqual(checkBody.count, 1, "User A viewing history must remain completely untouched");
    assert.strictEqual(checkBody.data[0].movieId, 27205);
  });

  // =========================================================================
  // 4. PRIVILEGE ESCALATION & MASS-ASSIGNMENT DEFENSES
  // =========================================================================
  console.log('\n--- 4. Privilege Escalation & Mass-Assignment Defenses ---');

  await test('User cannot elevate their role to admin via profile update', async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Alice Trying Privilege Escalation',
        role: 'admin',
        isAdmin: true,
      }),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 200);
    const user = resBody.data || resBody.user;
    assert.strictEqual(user.role, 'user', 'Role must remain user');

    // Double check via GET /api/auth/me
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meBody = await meRes.json();
    const meUser = meBody.data || meBody.user;
    assert.strictEqual(meUser.role, 'user', 'Persistent role must remain user');
  });

  await test('Non-admin user cannot access admin-only statistics endpoint (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/users/admin/stats`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await test('Password change rejects mismatched currentPassword', async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongCurrentPassword!',
        newPassword: 'BrandNewSecurePassword999!',
      }),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 400, `Expected 400 for incorrect current password, got ${res.status}`);
    assert.ok(resBody.message.toLowerCase().includes('current password'), 'Expected current password mismatch error');
  });

  await test('Password change fails if currentPassword is omitted', async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        newPassword: 'BrandNewSecurePassword999!',
      }),
    });
    assert.strictEqual(res.status, 400, `Expected 400 when current password is omitted, got ${res.status}`);
  });

  // =========================================================================
  // 5. MONGODB DATA INTEGRITY & NOSQL INJECTION PREVENTIONS
  // =========================================================================
  console.log('\n--- 5. MongoDB Data Integrity & Injection Defenses ---');

  await test('Watchlist duplicate addition returns safe idempotent response without duplicating row', async () => {
    const res = await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        movieId: 550,
        title: 'Fight Club Duplicate Attempt',
      }),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(resBody.action, 'exists');

    // Confirm that only one copy exists in the database
    const checkRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkBody = await checkRes.json();
    assert.strictEqual(checkBody.count, 1, 'Only 1 record must exist in Watchlist');
  });

  await test('Favorites duplicate addition returns safe idempotent response without duplicating row', async () => {
    const res = await fetch(`${BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        movieId: 680,
        title: 'Pulp Fiction Duplicate Attempt',
      }),
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(resBody.action, 'exists');

    // Confirm that only one copy exists in the database
    const checkRes = await fetch(`${BASE_URL}/favorites`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkBody = await checkRes.json();
    assert.strictEqual(checkBody.count, 1, 'Only 1 record must exist in Favorites');
  });

  await test('NoSQL injection payload in movieId is safely neutralized or rejected', async () => {
    // Attempt passing an object operator e.g. {"$gt": 0} as movieId
    const res = await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        movieId: { $gt: 0 },
        title: 'Injection Movie',
      }),
    });
    // Controller coerces movieId via parseInt(movieId) -> NaN -> responds 400
    assert.strictEqual(res.status, 400, `Expected 400 for non-numeric/object movieId, got ${res.status}`);
  });

  await test('Viewing history maintains chronological sorting (most recent first)', async () => {
    // Add a second movie to history
    await fetch(`${BASE_URL}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        movieId: 157336,
        title: 'Interstellar',
      }),
    });

    const res = await fetch(`${BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const resBody = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(resBody.count, 2);
    // The most recently added movie (Interstellar) should be first
    assert.strictEqual(resBody.data[0].movieId, 157336, 'Most recent movie must appear first');
    assert.strictEqual(resBody.data[1].movieId, 27205, 'Older movie must appear second');
  });

  // =========================================================================
  // 6. HTTP SECURITY HEADERS & INFORMATION DISCLOSURE
  // =========================================================================
  console.log('\n--- 6. Security Headers & Information Disclosure ---');

  await test('Server injects essential security headers and strips X-Powered-By', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200);

    const xContentType = res.headers.get('x-content-type-options');
    assert.strictEqual(xContentType, 'nosniff', 'Missing X-Content-Type-Options: nosniff');

    const xFrameOptions = res.headers.get('x-frame-options');
    assert.strictEqual(xFrameOptions, 'SAMEORIGIN', 'Missing X-Frame-Options: SAMEORIGIN');

    const referrerPolicy = res.headers.get('referrer-policy');
    assert.strictEqual(referrerPolicy, 'strict-origin-when-cross-origin', 'Missing Referrer-Policy');

    const coop = res.headers.get('cross-origin-opener-policy');
    assert.strictEqual(coop, 'same-origin', 'Missing Cross-Origin-Opener-Policy');

    const xPoweredBy = res.headers.get('x-powered-by');
    assert.strictEqual(xPoweredBy, null, 'X-Powered-By header must be removed');
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`Stage 3 Security & Data Integrity Results: ${passed}/${total} passed`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runStage3SecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
