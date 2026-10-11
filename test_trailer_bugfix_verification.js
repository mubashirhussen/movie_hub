import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tmdbService, { selectBestTrailer } from './server/services/tmdbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';

console.log('================================================================');
console.log('   CineVerse Bug Fix Verification: Correct Movie Trailers       ');
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

async function runTrailerVerificationTests() {
  // 1. Trailer Selection Hierarchy Unit Tests
  console.log('--- 1. Trailer Selection Hierarchy & Sanitization ---');
  try {
    const sampleVideos = [
      { id: '1', site: 'Vimeo', key: '12345678', type: 'Trailer', official: true },
      { id: '2', site: 'YouTube', key: 'clip_invalid', type: 'Clip', official: true, name: 'Song Clip' },
      { id: '3', site: 'YouTube', key: 'bts_key123', type: 'Behind the Scenes', official: true, name: 'Making' },
      { id: '4', site: 'YouTube', key: 'official_trailer_key', type: 'Trailer', official: true, iso_639_1: 'en', name: 'Official Trailer' },
      { id: '5', site: 'YouTube', key: 'teaser_key123', type: 'Teaser', official: true, iso_639_1: 'en', name: 'Teaser' },
    ];

    const best = selectBestTrailer(sampleVideos, 'en');
    report('1.1 Prefers official YouTube trailer over clips, BTS, and non-YouTube', best?.key === 'official_trailer_key');

    // Test with only teaser available
    const teaserOnly = [
      { id: '1', site: 'YouTube', key: 'song_clip', type: 'Clip', official: false },
      { id: '2', site: 'YouTube', key: 'teaser_video_key', type: 'Teaser', official: true },
    ];
    const bestTeaser = selectBestTrailer(teaserOnly);
    report('1.2 Falls back to official teaser when no trailer exists', bestTeaser?.key === 'teaser_video_key');

    // Test with zero trailers/teasers available (only song/clip)
    const clipOnly = [
      { id: '1', site: 'YouTube', key: 'song_dance', type: 'Clip', official: false, name: 'Song Promo' },
      { id: '2', site: 'YouTube', key: 'bloopers', type: 'Bloopers', official: false, name: 'Fun Moments' },
    ];
    const bestClipOnly = selectBestTrailer(clipOnly);
    report('1.3 Returns null when only unrelated clips/bloopers exist (never forces unrelated video)', bestClipOnly === null);

    // Test rejecting invalid/malformed YouTube keys
    const maliciousVideos = [
      { id: '1', site: 'YouTube', key: '<script>alert(1)</script>', type: 'Trailer', official: true },
      { id: '2', site: 'YouTube', key: 'short', type: 'Trailer', official: true },
    ];
    const bestMalicious = selectBestTrailer(maliciousVideos);
    report('1.4 Rejects invalid or dangerous YouTube key strings', bestMalicious === null);
  } catch (err) {
    report('1.0 Selection suite', false, err.message);
  }

  // 2. Specific Title Tests: Baahubali, Billa, RRR, and Fight Club
  console.log('\n--- 2. End-to-End API Verification for Specific Titles ---');
  try {
    // 2.1 Baahubali (TMDB ID 256040)
    const baahuRes = await fetch(`${BASE_URL}/movies/256040/trailer`);
    const baahuData = await baahuRes.json();
    const baahuKey = baahuData.data?.trailer?.key;

    report('2.1 Baahubali request succeeds with 200 OK', baahuRes.ok && baahuData.success === true);
    report('2.2 Baahubali does NOT display RRR trailer (NgBoMJy386M)', baahuKey !== 'NgBoMJy386M');
    report('2.3 Baahubali displays its authentic trailer (3NQRhE772b0)', baahuKey === '3NQRhE772b0');

    // 2.2 Billa (TMDB ID 23767) - Title with no trailers on TMDB
    const billaRes = await fetch(`${BASE_URL}/movies/23767/trailer`);
    const billaData = await billaRes.json();
    const billaTrailer = billaData.data?.trailer;
    const billaHasTrailer = billaData.data?.hasTrailer;

    report('2.4 Billa request succeeds with 200 OK', billaRes.ok && billaData.success === true);
    report('2.5 Billa does NOT display RRR trailer (NgBoMJy386M)', billaTrailer?.key !== 'NgBoMJy386M');
    report('2.6 Billa does NOT display Sagara Sangamam trailer (KqJ9bN6j2dE)', billaTrailer?.key !== 'KqJ9bN6j2dE');
    report('2.7 Billa correctly reports trailer as null and hasTrailer as false', billaTrailer === null && billaHasTrailer === false);

    // 2.3 RRR (Seed ID 1008)
    const rrrRes = await fetch(`${BASE_URL}/movies/1008/trailer`);
    const rrrData = await rrrRes.json();
    const rrrKey = rrrData.data?.trailer?.key;

    report('2.8 RRR displays its own authentic trailer (NgBoMJy386M)', rrrKey === 'NgBoMJy386M' && rrrData.data?.hasTrailer === true);

    // 2.4 Fight Club (TMDB ID 550)
    const fcRes = await fetch(`${BASE_URL}/movies/550/trailer`);
    const fcData = await fcRes.json();
    const fcKey = fcData.data?.trailer?.key;

    report('2.9 Fight Club displays its own authentic trailer (dfeUzm6KF4g)', fcKey === 'dfeUzm6KF4g');
    report('2.10 Fight Club does NOT display RRR trailer', fcKey !== 'NgBoMJy386M');

    // 2.5 TV Series: Breaking Bad (TMDB ID 1396)
    const tvRes = await fetch(`${BASE_URL}/movies/1396/trailer?type=tv`);
    const tvData = await tvRes.json();
    const tvKey = tvData.data?.trailer?.key;

    report('2.11 TV series endpoint routes to /tv/{id}/videos and returns TV trailer', tvRes.ok && typeof tvKey === 'string' && tvKey.length > 5);
    report('2.12 TV series does NOT display RRR trailer', tvKey !== 'NgBoMJy386M');
  } catch (err) {
    report('2.0 Endpoint suite', false, err.message);
  }

  // 3. Frontend Component & State Isolation Verification
  console.log('\n--- 3. Frontend Components & State Cleansing ---');
  try {
    const detailsFile = path.join(__dirname, 'src', 'pages', 'movieDetails', 'index.jsx');
    const detailsContent = fs.readFileSync(detailsFile, 'utf8');

    report('3.1 movieDetails clears trailer state immediately when movieId changes', detailsContent.includes('setTrailerKey(null)') && detailsContent.includes('setActivePlayerKey(null)'));
    report('3.2 movieDetails does NOT contain hardcoded RRR fallback (NgBoMJy386M)', !detailsContent.includes('NgBoMJy386M'));
    report('3.3 movieDetails displays "Trailer unavailable for this title." on missing trailer', detailsContent.includes('Trailer unavailable for this title.'));

    const modalFile = path.join(__dirname, 'src', 'components', 'TrailerModal', 'index.jsx');
    const modalContent = fs.readFileSync(modalFile, 'utf8');

    report('3.4 TrailerModal displays "Trailer unavailable for this title." when videoKey is invalid/null', modalContent.includes('Trailer unavailable for this title.'));

    const hubFile = path.join(__dirname, 'src', 'components', 'youtubeMediaHub', 'index.jsx');
    const hubContent = fs.readFileSync(hubFile, 'utf8');

    report('3.5 YouTubeMediaHub does NOT fallback to NgBoMJy386M', !hubContent.includes('NgBoMJy386M'));
    report('3.6 YouTubeMediaHub renders unavailable notice when no trailer exists', hubContent.includes('Trailer unavailable for this title.'));

    const heroFile = path.join(__dirname, 'src', 'components', 'heroSection', 'index.jsx');
    const heroContent = fs.readFileSync(heroFile, 'utf8');

    report('3.7 HeroSection does NOT fallback to NgBoMJy386M', !heroContent.includes('NgBoMJy386M'));

    const downloadFile = path.join(__dirname, 'src', 'components', 'downloadModal', 'index.jsx');
    const downloadContent = fs.readFileSync(downloadFile, 'utf8');

    report('3.8 DownloadModal does NOT fallback to NgBoMJy386M', !downloadContent.includes('NgBoMJy386M'));
  } catch (err) {
    report('3.0 Frontend checks', false, err.message);
  }

  // Summary
  console.log('\n================================================================');
  console.log(`   Trailer Verification Results: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTrailerVerificationTests().catch((err) => {
  console.error('[FATAL] Test Runner Error:', err);
  process.exit(1);
});
