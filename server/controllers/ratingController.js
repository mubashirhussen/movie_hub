import mongoose from 'mongoose';
import Rating from '../models/Rating.js';
import Review from '../models/Review.js';

// In-memory fallback stores for testing & resilience
const inMemoryRatings = new Map(); // key: `${userId}_${movieId}`, value: { rating, updatedAt }

const isDBReady = () => mongoose.connection.readyState === 1;

/**
 * 1. Submit or Update Movie Rating (1-5 Stars)
 * POST /api/movies/:movieId/ratings
 */
export const submitRating = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId || req.params.id);
    const { rating } = req.body;
    const userId = req.user._id;

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    const numRating = Number(rating);
    if (!numRating || !Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    if (isDBReady()) {
      // Upsert rating in MongoDB
      const ratingDoc = await Rating.findOneAndUpdate(
        { userId, movieId },
        { rating: numRating },
        { new: true, upsert: true, runValidators: true }
      );

      // If user has an existing review, keep rating in sync
      await Review.findOneAndUpdate(
        { userId, movieId },
        { rating: numRating }
      );

      // Calculate aggregate stats
      const stats = await getCommunityStatsFromDB(movieId);

      return res.status(200).json({
        success: true,
        message: 'Rating submitted successfully',
        data: {
          userRating: ratingDoc.rating,
          ...stats,
        },
      });
    } else {
      // In-Memory Fallback
      const key = `${userId}_${movieId}`;
      inMemoryRatings.set(key, { userId, movieId, rating: numRating, updatedAt: new Date() });
      const stats = getCommunityStatsFromMemory(movieId);

      return res.status(200).json({
        success: true,
        message: 'Rating submitted successfully (in-memory mode)',
        data: {
          userRating: numRating,
          ...stats,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get Community Rating Statistics & Current User Rating
 * GET /api/movies/:movieId/ratings
 */
export const getMovieRatings = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId || req.params.id);
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    const currentUserId = req.user ? req.user._id : null;
    let userRating = null;

    if (isDBReady()) {
      if (currentUserId) {
        const userDoc = await Rating.findOne({ userId: currentUserId, movieId });
        if (userDoc) userRating = userDoc.rating;
      }
      const stats = await getCommunityStatsFromDB(movieId);

      return res.status(200).json({
        success: true,
        data: {
          userRating,
          ...stats,
        },
      });
    } else {
      if (currentUserId) {
        const item = inMemoryRatings.get(`${currentUserId}_${movieId}`);
        if (item) userRating = item.rating;
      }
      const stats = getCommunityStatsFromMemory(movieId);

      return res.status(200).json({
        success: true,
        data: {
          userRating,
          ...stats,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Delete Current User Rating
 * DELETE /api/movies/:movieId/ratings
 */
export const deleteRating = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId || req.params.id);
    const userId = req.user._id;

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    if (isDBReady()) {
      const deleted = await Rating.findOneAndDelete({ userId, movieId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Rating not found' });
      }

      // Clear rating from user review if present
      await Review.findOneAndUpdate({ userId, movieId }, { rating: null });

      const stats = await getCommunityStatsFromDB(movieId);
      return res.status(200).json({
        success: true,
        message: 'Rating removed successfully',
        data: {
          userRating: null,
          ...stats,
        },
      });
    } else {
      const key = `${userId}_${movieId}`;
      if (!inMemoryRatings.has(key)) {
        return res.status(404).json({ success: false, message: 'Rating not found' });
      }
      inMemoryRatings.delete(key);
      const stats = getCommunityStatsFromMemory(movieId);

      return res.status(200).json({
        success: true,
        message: 'Rating removed successfully',
        data: {
          userRating: null,
          ...stats,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper: Calculate community stats from MongoDB
async function getCommunityStatsFromDB(movieId) {
  const ratings = await Rating.find({ movieId });
  const totalRatings = ratings.length;

  if (totalRatings === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  ratings.forEach((r) => {
    sum += r.rating;
    if (distribution[r.rating] !== undefined) {
      distribution[r.rating]++;
    }
  });

  const averageRating = Number((sum / totalRatings).toFixed(1));

  return {
    averageRating,
    totalRatings,
    distribution,
  };
}

// Helper: Calculate community stats from memory
function getCommunityStatsFromMemory(movieId) {
  const ratings = [];
  for (const record of inMemoryRatings.values()) {
    if (record.movieId === movieId) {
      ratings.push(record.rating);
    }
  }

  const totalRatings = ratings.length;
  if (totalRatings === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  ratings.forEach((val) => {
    sum += val;
    if (distribution[val] !== undefined) distribution[val]++;
  });

  const averageRating = Number((sum / totalRatings).toFixed(1));
  return {
    averageRating,
    totalRatings,
    distribution,
  };
}
