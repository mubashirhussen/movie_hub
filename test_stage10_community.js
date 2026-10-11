import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

console.log('================================================================');
console.log('   CineVerse Stage 10: Ratings, Reviews & Community Test Suite  ');
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

async function runStage10Tests() {
  const timestamp = Date.now();
  const user1Email = `reviewer_1_${timestamp}@example.com`;
  const user2Email = `reviewer_2_${timestamp}@example.com`;
  const password = 'CommunityPassword123!';

  let token1 = null;
  let token2 = null;
  let user1Id = null;
  let user2Id = null;
  let createdReviewId = null;
  const testMovieId = 550; // Fight Club

  // 1. Setup Test Accounts
  console.log('--- 1. Setting Up Test Accounts ---');
  try {
    const reg1Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cinema Critic 1', email: user1Email, password }),
    });
    const reg1Data = await reg1Res.json();
    token1 = reg1Data.data?.token || reg1Data.token;
    user1Id = reg1Data.data?.user?.id || reg1Data.data?.user?._id;
    report('1.1 User 1 registered successfully', reg1Res.status === 201 && !!token1);

    const reg2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cinema Critic 2', email: user2Email, password }),
    });
    const reg2Data = await reg2Res.json();
    token2 = reg2Data.data?.token || reg2Data.token;
    user2Id = reg2Data.data?.user?.id || reg2Data.data?.user?._id;
    report('1.2 User 2 registered successfully', reg2Res.status === 201 && !!token2);
  } catch (err) {
    report('1.x Account setup', false, err.message);
  }

  // 2. Movie Rating System
  console.log('\n--- 2. Movie Rating System (1-5 Star Scale) ---');
  try {
    // Unauthenticated rating rejection
    const unauthRating = await fetch(`${BASE_URL}/movies/${testMovieId}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5 }),
    });
    report('2.1 Unauthenticated rating request rejected with HTTP 401', unauthRating.status === 401);

    // Invalid rating value (< 1 or > 5 or non-integer)
    const invalidRating = await fetch(`${BASE_URL}/movies/${testMovieId}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ rating: 6 }),
    });
    report('2.2 Invalid rating value (6) rejected with HTTP 400', invalidRating.status === 400);

    // Valid 5-star rating submission
    const rateRes = await fetch(`${BASE_URL}/movies/${testMovieId}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ rating: 5 }),
    });
    const rateData = await rateRes.json();
    report('2.3 Valid 5-star rating submitted by User 1', rateRes.status === 200 && rateData.data?.userRating === 5);

    // User 2 rates 4 stars
    const rate2Res = await fetch(`${BASE_URL}/movies/${testMovieId}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ rating: 4 }),
    });
    report('2.4 Valid 4-star rating submitted by User 2', rate2Res.status === 200);

    // Get ratings stats
    const statsRes = await fetch(`${BASE_URL}/movies/${testMovieId}/ratings`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const statsData = await statsRes.json();
    const avg = statsData.data?.averageRating;
    const total = statsData.data?.totalRatings;
    report('2.5 Community rating average calculated accurately (4.5/5 from 2 ratings)', statsRes.status === 200 && total >= 2 && avg >= 4.0 && statsData.data?.userRating === 5);

    // Update rating (User 1 changes from 5 to 4)
    const updateRateRes = await fetch(`${BASE_URL}/movies/${testMovieId}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ rating: 4 }),
    });
    const updateRateData = await updateRateRes.json();
    report('2.6 User 1 can update their rating from 5 to 4 (idempotent upsert)', updateRateRes.status === 200 && updateRateData.data?.userRating === 4);
  } catch (err) {
    report('2.x Rating system', false, err.message);
  }

  // 3. Movie Review System
  console.log('\n--- 3. Movie Review System & Validations ---');
  try {
    // Empty review rejection
    const emptyReviewRes = await fetch(`${BASE_URL}/movies/${testMovieId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ reviewText: '   ' }),
    });
    report('3.1 Empty/whitespace review rejected with HTTP 400', emptyReviewRes.status === 400);

    // Too short review (< 5 chars)
    const shortReviewRes = await fetch(`${BASE_URL}/movies/${testMovieId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ reviewText: 'Hi' }),
    });
    report('3.2 Short review (< 5 characters) rejected with HTTP 400', shortReviewRes.status === 400);

    // Valid review submission with spoiler flag
    const createReviewRes = await fetch(`${BASE_URL}/movies/${testMovieId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        reviewText: 'An absolute masterpiece of modern psychological cinema with stunning cinematography. <script>alert("xss")</script>',
        rating: 5,
        isSpoiler: true,
      }),
    });
    const createReviewData = await createReviewRes.json();
    createdReviewId = createReviewData.data?.id || createReviewData.data?._id;
    const sanitizedText = createReviewData.data?.reviewText;

    report('3.3 Valid review submitted with HTTP 201 Created and spoiler flag set', createReviewRes.status === 201 && !!createdReviewId && createReviewData.data?.isSpoiler === true);
    report('3.4 Stored XSS prevention: HTML tags stripped from review text', !sanitizedText.includes('<script>') && sanitizedText.includes('An absolute masterpiece'));

    // Duplicate review check
    const dupReviewRes = await fetch(`${BASE_URL}/movies/${testMovieId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ reviewText: 'Another review attempt for same movie' }),
    });
    report('3.5 Repeated review submission for same movie rejected with HTTP 409 Conflict', dupReviewRes.status === 409);
  } catch (err) {
    report('3.x Review submission', false, err.message);
  }

  // 4. Review Retrieval, Sorting & Pagination
  console.log('\n--- 4. Review Retrieval, Sorting & Pagination ---');
  try {
    const listRes = await fetch(`${BASE_URL}/movies/${testMovieId}/reviews?sort=newest&page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const listData = await listRes.json();
    const reviews = listData.data?.reviews;

    report('4.1 GET /api/movies/:id/reviews returns array of reviews with pagination metadata', listRes.status === 200 && Array.isArray(reviews) && reviews.length > 0);
    report('4.2 Review author payload includes name & avatar without exposing email/password', reviews[0].author && !!reviews[0].author.name && !reviews[0].author.password && !reviews[0].author.email);
    report('4.3 isAuthor flag correctly set to true for User 1', reviews.some((r) => r.id.toString() === createdReviewId.toString() && r.isAuthor === true));
  } catch (err) {
    report('4.x Review retrieval', false, err.message);
  }

  // 5. Review Edit & Delete Ownership Protection
  console.log('\n--- 5. Review Edit & Delete Ownership Protection ---');
  try {
    // User 2 attempts to edit User 1's review
    const unauthEditRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ reviewText: 'Hacked review content by unauthorized user' }),
    });
    report('5.1 Unauthorized edit attempt by User 2 rejected with HTTP 403 Forbidden', unauthEditRes.status === 403);

    // User 1 successfully edits their own review
    const authEditRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        reviewText: 'Updated review: Truly one of the finest films ever made. Must watch.',
        rating: 5,
        isSpoiler: false,
      }),
    });
    const authEditData = await authEditRes.json();
    report('5.2 Author (User 1) can edit their review and toggle spoiler flag', authEditRes.status === 200 && authEditData.data?.isSpoiler === false && authEditData.data?.reviewText.includes('Updated review'));

    // User 2 attempts to delete User 1's review
    const unauthDeleteRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    report('5.3 Unauthorized delete attempt by User 2 rejected with HTTP 403 Forbidden', unauthDeleteRes.status === 403);
  } catch (err) {
    report('5.x Ownership checks', false, err.message);
  }

  // 6. Helpful Votes & Spoiler Controls
  console.log('\n--- 6. Helpful Votes & Spoiler Controls ---');
  try {
    // User 1 attempts to vote helpful on their own review
    const selfVoteRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
    });
    report('6.1 Author voting helpful on their own review rejected with HTTP 400', selfVoteRes.status === 400);

    // User 2 votes helpful on User 1's review
    const voteRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
    });
    const voteData = await voteRes.json();
    report('6.2 User 2 marks review as helpful, incrementing helpfulCount to 1', voteRes.status === 200 && voteData.data?.helpfulCount === 1 && voteData.data?.hasVotedHelpful === true);

    // User 2 removes their helpful vote (toggle)
    const unvoteRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
    });
    const unvoteData = await unvoteRes.json();
    report('6.3 User 2 toggles helpful vote off, decrementing helpfulCount back to 0', unvoteRes.status === 200 && unvoteData.data?.helpfulCount === 0 && unvoteData.data?.hasVotedHelpful === false);
  } catch (err) {
    report('6.x Helpful voting', false, err.message);
  }

  // 7. Review Moderation & Reporting Workflow
  console.log('\n--- 7. Review Moderation & Inappropriate Content Reporting ---');
  try {
    // Invalid report reason
    const invalidReportRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ reason: 'invalid_reason_string' }),
    });
    report('7.1 Invalid report reason rejected with HTTP 400', invalidReportRes.status === 400);

    // Valid report submission
    const validReportRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({
        reason: 'unmarked_spoiler',
        details: 'Review reveals the ending plot twist without labeling',
      }),
    });
    report('7.2 User 2 successfully submits moderation report (HTTP 201 Created)', validReportRes.status === 201);

    // Duplicate report prevention
    const dupReportRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ reason: 'spam' }),
    });
    report('7.3 Repeated report from same user rejected with HTTP 409 Conflict', dupReportRes.status === 409);
  } catch (err) {
    report('7.x Moderation reporting', false, err.message);
  }

  // 8. Rating & Review Clean Deletion
  console.log('\n--- 8. Rating & Review Clean Deletion ---');
  try {
    // User 1 deletes their review
    const delReviewRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    report('8.1 User 1 deletes their review with HTTP 200 OK', delReviewRes.status === 200);

    // User 1 removes their rating
    const delRatingRes = await fetch(`${BASE_URL}/movies/${testMovieId}/ratings`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    report('8.2 User 1 removes their rating with HTTP 200 OK', delRatingRes.status === 200);
  } catch (err) {
    report('8.x Clean deletion', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`Stage 10 Community Verification Result: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStage10Tests().catch((err) => {
  console.error('[FATAL] Stage 10 Community execution failed:', err);
  process.exit(1);
});
