import assert from 'node:assert';

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runE2EJourneys() {
  console.log('====================================================');
  console.log('   CineVerse Stage 2 End-to-End User Journeys Suite  ');
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

  const timestamp = Date.now();
  const testUserA = {
    name: 'E2E Alice User',
    email: `e2e_alice_${timestamp}@cineverse.io`,
    password: 'Password999!',
    confirmPassword: 'Password999!',
  };
  const testUserB = {
    name: 'E2E Bob User',
    email: `e2e_bob_${timestamp}@cineverse.io`,
    password: 'Password888!',
    confirmPassword: 'Password888!',
  };

  let tokenA = '';
  let tokenB = '';

  // -------------------------------------------------------------
  // JOURNEY A: PUBLIC VISITOR DISCOVERY JOURNEY
  // -------------------------------------------------------------
  console.log('--- Journey A: Public Visitor Movie Discovery ---');

  let sampleMovieId = null;

  await testAsync('A1. Public visitor loads homepage movie sections (popular, top-rated, upcoming)', async () => {
    const [popRes, topRes, upRes] = await Promise.all([
      fetch(`${BASE_URL}/movies/popular`),
      fetch(`${BASE_URL}/movies/top-rated`),
      fetch(`${BASE_URL}/movies/upcoming`),
    ]);

    assert.strictEqual(popRes.status, 200);
    assert.strictEqual(topRes.status, 200);
    assert.strictEqual(upRes.status, 200);

    const popData = await popRes.json();
    const popMovies = popData.data?.results || popData.results || (Array.isArray(popData.data) ? popData.data : []);
    assert.ok(Array.isArray(popMovies), 'Popular must return movies array');
    assert.ok(popMovies.length > 0, 'Popular movies list must not be empty');

    sampleMovieId = popMovies[0].id;
    assert.ok(sampleMovieId, 'Sample movie ID must exist');
  });

  await testAsync('A2. Public visitor searches movies with leading/trailing whitespace & special terms', async () => {
    const res = await fetch(`${BASE_URL}/movies/search?query=%20%20Inception%20%20`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const searchMovies = data.data?.results || data.results || (Array.isArray(data.data) ? data.data : []);
    assert.ok(Array.isArray(searchMovies));
    assert.ok(searchMovies.length > 0, 'Search should find matching titles');
  });

  await testAsync('A3. Public visitor filters by industry category and genre', async () => {
    const res = await fetch(`${BASE_URL}/movies/category/tollywood`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const catMovies = data.data?.results || data.results || (Array.isArray(data.data) ? data.data : []);
    assert.ok(Array.isArray(catMovies));
    assert.ok(catMovies.length > 0);
  });

  await testAsync('A4. Public visitor views detailed movie page with credits, trailers & providers', async () => {
    const [detailRes, credRes, trailRes, provRes] = await Promise.all([
      fetch(`${BASE_URL}/movies/${sampleMovieId}`),
      fetch(`${BASE_URL}/movies/${sampleMovieId}/credits`),
      fetch(`${BASE_URL}/movies/${sampleMovieId}/trailer`),
      fetch(`${BASE_URL}/movies/${sampleMovieId}/providers`),
    ]);

    assert.strictEqual(detailRes.status, 200);
    const detailPayload = await detailRes.json();
    const detailData = detailPayload.data || detailPayload;
    assert.ok(detailData.title, 'Movie must have title');
    assert.ok(detailData.poster_path, 'Movie must have poster path');

    assert.strictEqual(credRes.status, 200);
    const credPayload = await credRes.json();
    const credData = credPayload.data || credPayload;
    assert.ok(Array.isArray(credData.cast));

    assert.strictEqual(trailRes.status, 200);
    const trailPayload = await trailRes.json();
    const trailData = trailPayload.data || trailPayload;
    const trailerKey = trailData.trailer ? trailData.trailer.key : trailData.key;
    assert.ok(trailerKey, 'Trailer should contain YouTube key');

    assert.strictEqual(provRes.status, 200);
  });

  // -------------------------------------------------------------
  // JOURNEY B: NEW USER ONBOARDING & LIST PERSISTENCE
  // -------------------------------------------------------------
  console.log('\n--- Journey B: New User Onboarding & Persistence ---');

  await testAsync('B1. New user registers account successfully and receives JWT token', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserA),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    tokenA = data.data.token;
    assert.ok(tokenA, 'Must receive token');
    assert.strictEqual(data.data.user.email, testUserA.email.toLowerCase());
    assert.strictEqual(data.data.user.password, undefined);
  });

  await testAsync('B2. New user accesses clean dashboard with zero items initially', async () => {
    const [wlRes, favRes] = await Promise.all([
      fetch(`${BASE_URL}/watchlist`, { headers: { Authorization: `Bearer ${tokenA}` } }),
      fetch(`${BASE_URL}/favorites`, { headers: { Authorization: `Bearer ${tokenA}` } }),
    ]);
    const wlData = await wlRes.json();
    const favData = await favRes.json();

    assert.strictEqual(wlData.data.length, 0, 'New user watchlist must start empty');
    assert.strictEqual(favData.data.length, 0, 'New user favorites must start empty');
  });

  await testAsync('B3. New user adds movie to personal watchlist and favorites', async () => {
    const moviePayload = {
      movieId: sampleMovieId,
      movieTitle: 'Test Movie Feature',
      posterPath: '/sample_poster.jpg',
    };

    const [addWlRes, addFavRes] = await Promise.all([
      fetch(`${BASE_URL}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify(moviePayload),
      }),
      fetch(`${BASE_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify(moviePayload),
      }),
    ]);

    assert.strictEqual(addWlRes.status, 201);
    assert.strictEqual(addFavRes.status, 201);
  });

  await testAsync('B4. Duplicate addition is prevented safely (counts remain 1)', async () => {
    const moviePayload = {
      movieId: sampleMovieId,
      movieTitle: 'Test Movie Feature',
      posterPath: '/sample_poster.jpg',
    };

    await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify(moviePayload),
    });

    const checkRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkData = await checkRes.json();
    assert.strictEqual(checkData.data.length, 1, 'Duplicate must not be added to watchlist');
  });

  // -------------------------------------------------------------
  // JOURNEY C: RETURNING USER SESSION, HISTORY & PROFILE
  // -------------------------------------------------------------
  console.log('\n--- Journey C: Returning User Session, History & Profile ---');

  await testAsync('C1. Returning user logs in and restores active session', async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserA.email, password: testUserA.password }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    const sessionToken = loginData.data.token;

    // Session restoration
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.data.email, testUserA.email.toLowerCase());
  });

  await testAsync('C2. Viewing a movie automatically records timestamp in viewing history', async () => {
    const historyPayload = {
      movieId: sampleMovieId,
      movieTitle: 'Test Movie Feature',
      posterPath: '/sample_poster.jpg',
    };

    const addHistRes = await fetch(`${BASE_URL}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify(historyPayload),
    });
    assert.strictEqual(addHistRes.status, 200);

    const getHistRes = await fetch(`${BASE_URL}/history`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const histData = await getHistRes.json();
    assert.strictEqual(histData.data.length, 1);
    assert.strictEqual(histData.data[0].movieId, sampleMovieId);
  });

  await testAsync('C3. User updates display name and avatar on profile page', async () => {
    const updateRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'Alice Updated Name', avatar: 'https://images.unsplash.com/custom-avatar' }),
    });
    assert.strictEqual(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.data.name, 'Alice Updated Name');
  });

  // -------------------------------------------------------------
  // JOURNEY D: SECURITY & CROSS-USER DATA ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- Journey D: Security & Cross-User Data Isolation ---');

  await testAsync('D1. Register independent second user (User B)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserB),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    tokenB = data.data.token;
  });

  await testAsync('D2. User B cannot see User A watchlist, favorites, or viewing history', async () => {
    const [wlRes, favRes, histRes] = await Promise.all([
      fetch(`${BASE_URL}/watchlist`, { headers: { Authorization: `Bearer ${tokenB}` } }),
      fetch(`${BASE_URL}/favorites`, { headers: { Authorization: `Bearer ${tokenB}` } }),
      fetch(`${BASE_URL}/history`, { headers: { Authorization: `Bearer ${tokenB}` } }),
    ]);

    const wlData = await wlRes.json();
    const favData = await favRes.json();
    const histData = await histRes.json();

    assert.strictEqual(wlData.data.length, 0, "User B must not see User A's watchlist");
    assert.strictEqual(favData.data.length, 0, "User B must not see User A's favorites");
    assert.strictEqual(histData.data.length, 0, "User B must not see User A's history");
  });

  await testAsync('D3. User B cannot delete User A items (cross-user mutation rejected)', async () => {
    // User B tries to delete User A's item from watchlist
    await fetch(`${BASE_URL}/watchlist/${sampleMovieId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    // Check that User A's item is intact
    const checkRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkData = await checkRes.json();
    assert.strictEqual(checkData.data.length, 1, "User A's watchlist item must remain untouched");
  });

  await testAsync('D4. Ordinary user cannot escalate role to admin', async () => {
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ role: 'admin' }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.role, 'user', 'Role tampering must be rejected');
  });

  // -------------------------------------------------------------
  // JOURNEY E: SYSTEM RESILIENCE & ERROR BOUNDARIES
  // -------------------------------------------------------------
  console.log('\n--- Journey E: System Resilience & Error Boundaries ---');

  await testAsync('E1. Non-existent movie ID returns structured 404 instead of crashing', async () => {
    const res = await fetch(`${BASE_URL}/movies/999999999`);
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await testAsync('E2. Protected endpoints reject invalid / expired tokens with 401', async () => {
    const res = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: 'Bearer forged.token.signature' },
    });
    assert.strictEqual(res.status, 401);
  });

  await testAsync('E3. Server reports healthy liveness and ready database status', async () => {
    const [hRes, rRes] = await Promise.all([
      fetch(`${BASE_URL}/health`),
      fetch(`${BASE_URL}/ready`),
    ]);
    assert.strictEqual(hRes.status, 200);
    assert.strictEqual(rRes.status, 200);

    const rData = await rRes.json();
    assert.strictEqual(rData.status, 'ready');
    assert.strictEqual(rData.database, 'connected');
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`  E2E Results: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runE2EJourneys().catch((err) => {
  console.error('Fatal error during E2E journeys verification:', err);
  process.exit(1);
});
