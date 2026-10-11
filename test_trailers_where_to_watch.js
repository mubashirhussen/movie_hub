import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000/api';
const YOUTUBE_KEY_REGEX = /^[a-zA-Z0-9_-]{6,20}$/;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('--- TEST SUITE: OFFICIAL TRAILERS, TEASERS & WHERE TO WATCH ---');
  console.log('======================================================\n');

  // TEST 1: Baahubali (Movie ID 256040) Trailers & Videos
  try {
    console.log('[TEST 1] Baahubali (256040) Official Trailers & Teasers');
    const res = await axios.get(`${BASE_URL}/movies/256040/trailer`);
    assert(res.status === 200, 'Endpoint returned status 200');
    assert(res.data.success === true, 'Response marked success');

    const data = res.data.data;
    assert(data.movieId === 256040, 'Returned matching movie ID 256040');
    assert(data.type === 'movie', 'Content type is movie');
    assert(Boolean(data.trailer?.key), 'Trailer object returned with YouTube key');
    assert(YOUTUBE_KEY_REGEX.test(data.trailer.key), `Trailer key ${data.trailer.key} is valid YouTube format`);
    assert(data.trailer.key !== 'F_sR_JzW0qQ' || data.movieId === 579974, 'Trailer key is NOT RRR fallback');
    assert(data.trailer.embedUrl.includes('https://www.youtube-nocookie.com/embed/'), 'Embed URL is privacy-friendly youtube-nocookie');
    assert(data.grouped && Array.isArray(data.grouped.trailers), 'Grouped trailers array returned');
    assert(Array.isArray(data.allVideos) && data.allVideos.length > 0, `Returned ${data.allVideos.length} YouTube videos for Baahubali`);
    console.log(`       Best Trailer: "${data.trailer.name}" (Key: ${data.trailer.key}, Official: ${data.trailer.official})`);
  } catch (err) {
    assert(false, `Baahubali trailer test failed: ${err.message}`);
  }

  // TEST 2: Breaking Bad (TV Series ID 1396) Official Videos from /tv/{id}/videos
  try {
    console.log('\n[TEST 2] Breaking Bad (1396, TV) Official Trailers & Teasers');
    const res = await axios.get(`${BASE_URL}/movies/1396/trailer?type=tv`);
    assert(res.status === 200, 'TV videos endpoint returned status 200');
    assert(res.data.success === true, 'Response marked success');

    const data = res.data.data;
    assert(data.movieId === 1396, 'Returned TV series ID 1396');
    assert(data.type === 'tv', 'Identified content type as tv');
    assert(Boolean(data.trailer?.key), 'Returned valid trailer for Breaking Bad');
    assert(YOUTUBE_KEY_REGEX.test(data.trailer.key), `TV Trailer key ${data.trailer.key} matches YouTube regex`);
    assert(data.trailer.key !== 'F_sR_JzW0qQ', 'TV Trailer key is NOT RRR fallback');
    assert(data.grouped && (data.grouped.trailers || data.grouped.teasers), 'Grouped categories exist');
    console.log(`       Breaking Bad Video: "${data.trailer.name}" (Key: ${data.trailer.key})`);
  } catch (err) {
    assert(false, `Breaking Bad trailer test failed: ${err.message}`);
  }

  // TEST 3: Interstellar (Movie ID 157336)
  try {
    console.log('\n[TEST 3] Interstellar (157336) Official Trailers & Teasers');
    const res = await axios.get(`${BASE_URL}/movies/157336/trailer`);
    assert(res.status === 200, 'Interstellar trailer endpoint returned status 200');
    const data = res.data.data;
    assert(Boolean(data.trailer?.key), 'Interstellar returned trailer key');
    assert(data.trailer.key !== 'F_sR_JzW0qQ', 'Interstellar is NOT RRR fallback');
    assert(data.grouped.trailers.length > 0 || data.grouped.teasers.length > 0, 'Has categorized trailers/teasers');
    console.log(`       Interstellar Trailer: "${data.trailer.name}" (Key: ${data.trailer.key})`);
  } catch (err) {
    assert(false, `Interstellar trailer test failed: ${err.message}`);
  }

  // TEST 4: Fallback behavior on title with no videos (or invalid ID) - NEVER borrow another movie!
  try {
    console.log('\n[TEST 4] Title with 0 videos (ID 999999999) - Never borrow other titles');
    const res = await axios.get(`${BASE_URL}/movies/999999999/trailer`);
    assert(res.status === 200, 'Returned 200');
    const data = res.data.data;
    assert(data.hasTrailer === false, 'hasTrailer is false when no video exists');
    assert(data.trailer === null, 'trailer is null - NOT fabricated or borrowed');
    assert(Array.isArray(data.allVideos) && data.allVideos.length === 0, 'allVideos is empty');
  } catch (err) {
    assert(false, `Zero-video fallback test failed: ${err.message}`);
  }

  // TEST 5: Legal Streaming Availability (Baahubali 256040, Region IN)
  try {
    console.log('\n[TEST 5] Baahubali (256040) Legal Where to Watch (Region IN)');
    const res = await axios.get(`${BASE_URL}/movies/256040/providers?region=IN`);
    assert(res.status === 200, 'Where to Watch endpoint returned 200');
    const data = res.data.data;
    assert(data.id === 256040, 'Matching ID 256040');
    assert(data.region === 'IN', 'Selected region is IN');
    assert(typeof data.link === 'string' && data.link.includes('themoviedb.org'), 'Includes official TMDB/JustWatch link');
    assert(data.attribution === 'Streaming data powered by JustWatch via TMDB.', 'Includes exact required attribution');
    assert(data.qualityNote === 'Quality varies by plan; check the platform.', 'Includes exact quality disclaimer');
    assert(Array.isArray(data.flatrate), 'flatrate array exists');
    assert(Array.isArray(data.rent), 'rent array exists');
    assert(Array.isArray(data.buy), 'buy array exists');
    assert(data.totalOptions > 0, `Found ${data.totalOptions} legal streaming options in IN`);

    const streamNames = data.flatrate.map((p) => p.provider_name).join(', ');
    console.log(`       Stream (flatrate): ${streamNames || 'None'}`);
    console.log(`       Official Link: ${data.link}`);
  } catch (err) {
    assert(false, `Baahubali watch providers test failed: ${err.message}`);
  }

  // TEST 6: Legal Streaming Availability for TV Series (Breaking Bad 1396, Region IN)
  try {
    console.log('\n[TEST 6] Breaking Bad (1396, TV) Legal Where to Watch (Region IN)');
    const res = await axios.get(`${BASE_URL}/movies/1396/providers?region=IN&type=tv`);
    assert(res.status === 200, 'TV watch providers endpoint returned 200');
    const data = res.data.data;
    assert(data.id === 1396, 'Matching TV series ID 1396');
    assert(data.type === 'tv', 'Identified as TV series');
    assert(data.region === 'IN', 'Region is IN');
    assert(Array.isArray(data.flatrate), 'flatrate array returned for TV');
    assert(data.totalOptions > 0, `Found ${data.totalOptions} legal options for Breaking Bad in IN`);

    const netflixIn = data.flatrate.find((p) => p.provider_name.toLowerCase().includes('netflix'));
    assert(Boolean(netflixIn), 'Found Netflix as legal streaming provider for Breaking Bad in India');
    console.log(`       Breaking Bad in IN on: ${data.flatrate.map((p) => p.provider_name).join(', ')}`);
  } catch (err) {
    assert(false, `Breaking Bad TV providers test failed: ${err.message}`);
  }

  // TEST 7: Legal Streaming Availability (Interstellar 157336, Region US)
  try {
    console.log('\n[TEST 7] Interstellar (157336) Legal Where to Watch (Region US)');
    const res = await axios.get(`${BASE_URL}/movies/157336/providers?region=US`);
    assert(res.status === 200, 'US watch providers endpoint returned 200');
    const data = res.data.data;
    assert(data.region === 'US', 'Region is US');
    assert(data.totalOptions > 0, `Found ${data.totalOptions} legal options in US`);
    assert(data.rent.length > 0 || data.buy.length > 0 || data.flatrate.length > 0, 'Found rent/buy/stream options in US');
    console.log(`       Interstellar in US: Rent (${data.rent.length}), Buy (${data.buy.length}), Stream (${data.flatrate.length})`);
  } catch (err) {
    assert(false, `Interstellar US providers test failed: ${err.message}`);
  }

  // TEST 8: Region with 0 providers returns graceful fallback structure
  try {
    console.log('\n[TEST 8] Provider query for unknown region / 0 providers');
    const res = await axios.get(`${BASE_URL}/movies/256040/providers?region=AQ`); // Antarctica
    assert(res.status === 200, 'Returned 200');
    const data = res.data.data;
    assert(data.region === 'AQ', 'Region is AQ');
    assert(data.totalOptions === 0, 'totalOptions is 0 for region without providers');
    assert(data.attribution === 'Streaming data powered by JustWatch via TMDB.', 'Retains attribution');
    assert(typeof data.link === 'string', 'Official fallback link provided');
  } catch (err) {
    assert(false, `Zero-providers test failed: ${err.message}`);
  }

  // TEST 9: Dedicated TV route /api/tv/:id/videos
  try {
    console.log('\n[TEST 9] Dedicated TV endpoint: /api/tv/1396/videos');
    const res = await axios.get(`${BASE_URL}/tv/1396/videos`);
    assert(res.status === 200, 'Direct TV route returned 200');
    assert(res.data.success === true, 'Direct TV route marked success');
    const data = res.data.data;
    assert(data.type === 'tv', 'Identified type as tv automatically from route');
    assert(data.allVideos.length > 0, 'Returned videos for Breaking Bad');
    assert(
      ['verified', 'associated'].includes(data.allVideos[0].verificationStatus),
      'Video classified with valid verificationStatus (verified or associated)'
    );
  } catch (err) {
    assert(false, `Dedicated TV route test failed: ${err.message}`);
  }

  // TEST 10: Watch options alias: /api/movies/:id/watch-options
  try {
    console.log('\n[TEST 10] Watch options alias: /api/movies/256040/watch-options');
    const res = await axios.get(`${BASE_URL}/movies/256040/watch-options?region=IN`);
    assert(res.status === 200, 'Watch-options alias returned 200');
    const data = res.data.data;
    assert(data.totalOptions > 0, 'Found providers via watch-options alias');
    assert(Boolean(data.qualityInfo), 'Returns qualityInfo metadata');
    assert(Boolean(data.offlineGuidance), 'Returns offlineGuidance metadata');
  } catch (err) {
    assert(false, `Watch options alias test failed: ${err.message}`);
  }

  // TEST 11: TV Watch options alias: /api/tv/:id/watch-options
  try {
    console.log('\n[TEST 11] TV Watch options alias: /api/tv/1396/watch-options');
    const res = await axios.get(`${BASE_URL}/tv/1396/watch-options?region=IN`);
    assert(res.status === 200, 'TV Watch-options alias returned 200');
    const data = res.data.data;
    assert(data.type === 'tv', 'Identified as TV type via /api/tv prefix');
    assert(data.totalOptions > 0, 'Found providers for TV series');
  } catch (err) {
    assert(false, `TV Watch options alias test failed: ${err.message}`);
  }

  console.log('\n======================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
