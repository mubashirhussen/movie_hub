import express from 'express';
import {
  getPopular,
  getTopRated,
  getUpcoming,
  getNowPlaying,
  getGenres,
  discover,
  search,
  getMovieDetails,
  getMovieCast,
  getMovieTrailer,
  getMovieProviders,
  getSimilarMovies,
  getMovieRecommendations,
  incrementMovieView,
  getByIndustry,
  getCacheStats,
  clearCache,
} from '../controllers/movieController.js';

import {
  submitRating,
  getMovieRatings,
  deleteRating,
} from '../controllers/ratingController.js';
import {
  getMovieReviews,
  createReview,
} from '../controllers/reviewController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/popular', getPopular);
router.get('/top-rated', getTopRated);
router.get('/upcoming', getUpcoming);
router.get('/now-playing', getNowPlaying);
router.get('/genres', getGenres);
router.get('/discover', discover);
router.get('/search', search);
router.get('/category/:industry', getByIndustry);
router.get('/industry/:industry', getByIndustry);
router.get('/cache/stats', getCacheStats);
router.post('/cache/clear', clearCache);
router.get('/:id', getMovieDetails);
router.get('/:id/cast', getMovieCast);
router.get('/:id/credits', getMovieCast);
router.get('/:id/trailer', getMovieTrailer);
router.get('/:id/videos', getMovieTrailer);
router.get('/:id/providers', getMovieProviders);
router.get('/:id/watch-options', getMovieProviders);
router.get('/:id/similar', getSimilarMovies);
router.get('/:id/recommendations', getMovieRecommendations);
router.post('/:id/view', incrementMovieView);

// Community Ratings Endpoints
router.get('/:id/ratings', optionalAuth, getMovieRatings);
router.post('/:id/ratings', protect, submitRating);
router.put('/:id/ratings', protect, submitRating);
router.delete('/:id/ratings', protect, deleteRating);

// Community Reviews Endpoints
router.get('/:id/reviews', optionalAuth, getMovieReviews);
router.post('/:id/reviews', protect, createReview);

export default router;
