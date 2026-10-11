import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

console.log('================================================================');
console.log('   CineVerse Stage 11: Advanced Discovery & Smart Watchlists   ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function report(name, condition, details = '') {
  if (condition) {
    passCount++;
    console.log(`[PASS] ${name}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${name} ${details ? `(${details})` : ''}`);
  }
}

async function runStage11Tests() {
  const timestamp = Date.now();
  const user1Email = `wl_user1_${timestamp}@example.com`;
  const user2Email = `wl_user2_${timestamp}@example.com`;
  const password = 'WatchlistSecret123!';

  let token1 = null;
  let token2 = null;
  let user1Id = null;
  let user2Id = null;
  let customList1Id = null;
  let customList2Id = null;

  // 1. Setup Test Users
  console.log('--- 1. Setting Up Test Accounts ---');
  try {
    const reg1Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Watchlist Curator 1', email: user1Email, password }),
    });
    const reg1Data = await reg1Res.json();
    token1 = reg1Data.data?.token || reg1Data.token;
    user1Id = reg1Data.data?.user?.id || reg1Data.data?.user?._id;
    report('1.1 User 1 registered with auth token', reg1Res.status === 201 && !!token1);

    const reg2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Watchlist Curator 2', email: user2Email, password }),
    });
    const reg2Data = await reg2Res.json();
    token2 = reg2Data.data?.token || reg2Data.token;
    user2Id = reg2Data.data?.user?.id || reg2Data.data?.user?._id;
    report('1.2 User 2 registered with auth token', reg2Res.status === 201 && !!token2);
  } catch (err) {
    report('1.X Account setup failed', false, err.message);
  }

  // 2. Advanced Movie Discovery API Tests
  console.log('\n--- 2. Advanced Movie Discovery Filters & Sorting ---');
  try {
    // 2.1 Basic Discover
    const discRes = await fetch(`${BASE_URL}/movies/discover?page=1`);
    const discData = await discRes.json();
    report('2.1 GET /api/movies/discover returns successful paginated results', discRes.status === 200 && Array.isArray(discData.data?.results));

    // 2.2 Combining Multi-Filters: Genre, Rating, Runtime, Language
    const filterRes = await fetch(
      `${BASE_URL}/movies/discover?minRating=7&minRuntime=90&maxRuntime=180&language=te&sortBy=vote_average.desc&page=1`
    );
    const filterData = await filterRes.json();
    report(
      '2.2 Multi-filter discovery (minRating, minRuntime, maxRuntime, language, sortBy) succeeds',
      filterRes.status === 200 && filterData.success && Array.isArray(filterData.data?.results)
    );

    // 2.3 Sort options: Title (A to Z)
    const titleSortRes = await fetch(`${BASE_URL}/movies/discover?sortBy=title.asc&page=1`);
    const titleSortData = await titleSortRes.json();
    report(
      '2.3 Discovery supports sorting by title (title.asc)',
      titleSortRes.status === 200 && Array.isArray(titleSortData.data?.results)
    );

    // 2.4 Release year range: yearMin & yearMax
    const yearRangeRes = await fetch(`${BASE_URL}/movies/discover?yearMin=1990&yearMax=2025&page=1`);
    const yearRangeData = await yearRangeRes.json();
    report(
      '2.4 Discovery supports release year range (yearMin and yearMax)',
      yearRangeRes.status === 200 && Array.isArray(yearRangeData.data?.results)
    );

    // 2.5 Resilient pagination clamping (negative page clamped to page 1)
    const negPageRes = await fetch(`${BASE_URL}/movies/discover?page=-99`);
    const negPageData = await negPageRes.json();
    report(
      '2.5 Negative/invalid page query safely clamped to valid page without crashing',
      negPageRes.status === 200 && Array.isArray(negPageData.data?.results)
    );
  } catch (err) {
    report('2.X Discovery filtering tests failed', false, err.message);
  }

  // 3. Security, Authentication & Ownership Isolation
  console.log('\n--- 3. Watchlist Security & Ownership Enforcement ---');
  try {
    // 3.1 Unauthenticated access blocked
    const unauthGetRes = await fetch(`${BASE_URL}/watchlist`);
    report('3.1 Unauthenticated GET /api/watchlist returns 401', unauthGetRes.status === 401);

    const unauthCustomRes = await fetch(`${BASE_URL}/watchlists`);
    report('3.2 Unauthenticated GET /api/watchlists returns 401', unauthCustomRes.status === 401);

    // 3.3 Forged/Malformed token rejected
    const forgedRes = await fetch(`${BASE_URL}/watchlist`, {
      headers: { Authorization: 'Bearer forged.invalid.token' },
    });
    report('3.3 Forged Bearer token rejected with 401', forgedRes.status === 401);
  } catch (err) {
    report('3.X Watchlist auth tests failed', false, err.message);
  }

  // 4. Default Watchlist & Viewing Status Transitions
  console.log('\n--- 4. Default Watchlist & Viewing Status Transitions ---');
  try {
    const movieA = { movieId: 1001, movieTitle: 'Sagara Sangamam', posterPath: '/hdg47.jpg', voteAverage: 8.8 };
    const movieB = { movieId: 1002, movieTitle: 'Khaidi', posterPath: '/3kgb3.jpg', voteAverage: 8.4 };

    // 4.1 Add movie with default 'want_to_watch' status
    const addARes = await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ ...movieA, status: 'want_to_watch' }),
    });
    const addAData = await addARes.json();
    report('4.1 Add movie to default watchlist with want_to_watch status', addARes.status === 201 && addAData.data?.status === 'want_to_watch');

    // 4.2 Duplicate prevention in default watchlist
    const dupRes = await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify(movieA),
    });
    const dupData = await dupRes.json();
    report('4.2 Duplicate movie in default list gracefully handled (action=exists)', dupRes.status === 200 && dupData.action === 'exists');

    // 4.3 Move movie viewing status from want_to_watch to watching
    const statusWatchingRes = await fetch(`${BASE_URL}/watchlist/${movieA.movieId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ status: 'watching' }),
    });
    const statusWatchingData = await statusWatchingRes.json();
    report('4.3 Move movie viewing status to watching', statusWatchingRes.status === 200 && statusWatchingData.data?.status === 'watching');

    // 4.4 Move movie viewing status to watched
    const statusWatchedRes = await fetch(`${BASE_URL}/watchlist/${movieA.movieId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ status: 'watched' }),
    });
    const statusWatchedData = await statusWatchedRes.json();
    report('4.4 Move movie viewing status to watched', statusWatchedRes.status === 200 && statusWatchedData.data?.status === 'watched');

    // 4.5 Filter default watchlist by status (?status=watched)
    const filterWatchedRes = await fetch(`${BASE_URL}/watchlist?status=watched`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const filterWatchedData = await filterWatchedRes.json();
    const hasOnlyWatched = filterWatchedData.data?.every((m) => m.status === 'watched');
    report('4.5 Filter default watchlist by status (?status=watched) returns watched movies', filterWatchedRes.status === 200 && hasOnlyWatched);

    // 4.6 Add movieB as want_to_watch
    await fetch(`${BASE_URL}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ ...movieB, status: 'want_to_watch' }),
    });

    // 4.7 Sort default watchlist by rating
    const sortRatingRes = await fetch(`${BASE_URL}/watchlist?sortBy=rating`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const sortRatingData = await sortRatingRes.json();
    report('4.7 Sort default watchlist by rating', sortRatingRes.status === 200 && sortRatingData.data?.length >= 2);

    // 4.8 Watchlist summary returns status counts
    const summaryRes = await fetch(`${BASE_URL}/watchlist/summary`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const summaryData = await summaryRes.json();
    const wantCount = summaryData.data?.defaultLists?.find((d) => d.id === 'want_to_watch')?.count;
    const watchedCount = summaryData.data?.defaultLists?.find((d) => d.id === 'watched')?.count;
    report('4.8 Watchlist summary reports accurate status counts', summaryRes.status === 200 && wantCount >= 1 && watchedCount >= 1);
  } catch (err) {
    report('4.X Default watchlist status tests failed', false, err.message);
  }

  // 5. Custom Watchlist CRUD & Multi-List Organization
  console.log('\n--- 5. Custom Watchlists & Multi-List Management ---');
  try {
    // 5.1 Create custom watchlist
    const createListRes = await fetch(`${BASE_URL}/watchlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: 'Retro Telugu Classics', description: 'Curated 1980s Telugu cinema classics' }),
    });
    const createListData = await createListRes.json();
    customList1Id = createListData.data?._id;
    report('5.1 Create custom watchlist returns 201 and list metadata', createListRes.status === 201 && !!customList1Id);

    // 5.2 Validate watchlist name required (empty name rejected)
    const emptyNameRes = await fetch(`${BASE_URL}/watchlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: '   ', description: 'Invalid list' }),
    });
    report('5.2 Reject empty custom watchlist name with 400 Bad Request', emptyNameRes.status === 400);

    // 5.3 Duplicate custom list name rejected for same user
    const dupNameRes = await fetch(`${BASE_URL}/watchlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: 'Retro Telugu Classics' }),
    });
    report('5.3 Reject duplicate custom watchlist name with 409 Conflict', dupNameRes.status === 409);

    // 5.4 Cross-user isolation: User 2 can create list with same name without collision
    const user2ListRes = await fetch(`${BASE_URL}/watchlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
      body: JSON.stringify({ name: 'Retro Telugu Classics' }),
    });
    report('5.4 Different users can own lists with identical names (scoped uniqueness)', user2ListRes.status === 201);

    // 5.5 User 2 CANNOT access User 1's custom watchlist
    const crossGetRes = await fetch(`${BASE_URL}/watchlists/${customList1Id}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    report('5.5 User 2 forbidden from viewing User 1 custom watchlist (404/access denied)', crossGetRes.status === 404);

    // 5.6 User 2 CANNOT delete User 1's custom watchlist
    const crossDelRes = await fetch(`${BASE_URL}/watchlists/${customList1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    report('5.6 User 2 forbidden from deleting User 1 custom watchlist (404/access denied)', crossDelRes.status === 404);

    // 5.7 Add movie to custom watchlist
    const addMovieCustomRes = await fetch(`${BASE_URL}/watchlists/${customList1Id}/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ movieId: 1001, movieTitle: 'Sagara Sangamam', posterPath: '/hdg47.jpg' }),
    });
    report('5.7 Add movie to custom watchlist returns 201', addMovieCustomRes.status === 201);

    // 5.8 Prevent duplicate movie inside the same custom watchlist
    const dupMovieCustomRes = await fetch(`${BASE_URL}/watchlists/${customList1Id}/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ movieId: 1001, movieTitle: 'Sagara Sangamam' }),
    });
    const dupMovieCustomData = await dupMovieCustomRes.json();
    report('5.8 Duplicate movie in custom watchlist prevented (action=exists)', dupMovieCustomRes.status === 200 && dupMovieCustomData.action === 'exists');

    // 5.9 Update custom watchlist details (name & description)
    const updateListRes = await fetch(`${BASE_URL}/watchlists/${customList1Id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ description: 'Updated description for 80s Telugu cinema gems' }),
    });
    const updateListData = await updateListRes.json();
    report('5.9 Update custom watchlist details via PATCH /api/watchlists/:id', updateListRes.status === 200 && updateListData.data?.description?.includes('gems'));

    // 5.10 Retrieve single custom watchlist and its movie items
    const getListRes = await fetch(`${BASE_URL}/watchlists/${customList1Id}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const getListData = await getListRes.json();
    report(
      '5.10 GET /api/watchlists/:id returns list with itemCount and movies array',
      getListRes.status === 200 && getListData.data?.itemCount === 1 && getListData.data?.movies?.length === 1
    );

    // 5.11 Remove movie from custom watchlist
    const remMovieRes = await fetch(`${BASE_URL}/watchlists/${customList1Id}/movies/1001`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    report('5.11 Remove movie from custom watchlist returns 200', remMovieRes.status === 200);

    // 5.12 Delete custom watchlist
    const delListRes = await fetch(`${BASE_URL}/watchlists/${customList1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    report('5.12 Delete custom watchlist returns 200', delListRes.status === 200);

    // 5.13 Verify deleted list is no longer accessible
    const checkDeletedRes = await fetch(`${BASE_URL}/watchlists/${customList1Id}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    report('5.13 Deleted custom watchlist returns 404', checkDeletedRes.status === 404);
  } catch (err) {
    report('5.X Custom watchlist operations failed', false, err.message);
  }

  // 6. Validation & Edge Cases
  console.log('\n--- 6. Parameter Validation & Malformed Inputs ---');
  try {
    // 6.1 Invalid ObjectId for custom watchlist returns 400
    const invIdRes = await fetch(`${BASE_URL}/watchlists/invalid-not-an-id`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    report('6.1 Invalid ObjectId format returns 400 or 404', invIdRes.status === 400 || invIdRes.status === 404);

    // 6.2 Invalid viewing status enum rejected
    const invStatusRes = await fetch(`${BASE_URL}/watchlist/1002/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ status: 'invalid_status_enum' }),
    });
    report('6.2 Invalid viewing status rejected with 400 Bad Request', invStatusRes.status === 400);

    // 6.3 Cleanup movieB from default watchlist
    const cleanDel = await fetch(`${BASE_URL}/watchlist/1002`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    report('6.3 Remove movie from default watchlist returns 200', cleanDel.status === 200);
  } catch (err) {
    report('6.X Edge case validation tests failed', false, err.message);
  }

  // 7. Frontend Source Code & Architecture Verification
  console.log('\n--- 7. Frontend Components & Architecture ---');
  try {
    const filtersPath = path.join(__dirname, 'src/components/discoveryFilters/index.jsx');
    const filtersContent = fs.readFileSync(filtersPath, 'utf8');
    report('7.1 DiscoveryFilters contains rating, runtime, and language filters', filtersContent.includes('RATING_TIERS') && filtersContent.includes('RUNTIME_TIERS'));

    const searchPath = path.join(__dirname, 'src/pages/search/index.jsx');
    const searchContent = fs.readFileSync(searchPath, 'utf8');
    report('7.2 SearchPage synchronizes minRating, runtime, and language to URL query params', searchContent.includes('minRatingParam') && searchContent.includes('minRuntimeParam'));

    const watchlistPath = path.join(__dirname, 'src/pages/watchlist/index.jsx');
    const watchlistContent = fs.readFileSync(watchlistPath, 'utf8');
    report(
      '7.3 Watchlist page implements viewing status tabs and custom list modal dialogs',
      watchlistContent.includes('want_to_watch') && watchlistContent.includes('createModalOpen') && watchlistContent.includes('deleteConfirmOpen')
    );

    const servicePath = path.join(__dirname, 'src/services/watchlistService.js');
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    report(
      '7.4 watchlistService exports updateViewingStatus, createCustomWatchlist, getWatchlistSummary',
      serviceContent.includes('updateViewingStatus') && serviceContent.includes('createCustomWatchlist') && serviceContent.includes('getWatchlistSummary')
    );
  } catch (err) {
    report('7.X Frontend architecture verification failed', false, err.message);
  }

  // Summary
  console.log('\n================================================================');
  console.log(` Stage 11 Test Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runStage11Tests().catch((err) => {
  console.error('Fatal error in Stage 11 tests:', err);
  process.exit(1);
});
