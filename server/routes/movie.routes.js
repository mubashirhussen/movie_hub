import express from 'express';
import {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getMoviesCatalog,
  searchMovies,
  getMovieDetails,
  getMovieCredits,
  getSimilarMovies,
  getMovieReviews,
  addMovieReview
} from '../controllers/movie.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/catalog', getMoviesCatalog);
router.get('/popular', getPopularMovies);
router.get('/top-rated', getTopRatedMovies);
router.get('/upcoming', getUpcomingMovies);
router.get('/search', searchMovies);

router.get('/:id', getMovieDetails);
router.get('/:id/credits', getMovieCredits);
router.get('/:id/similar', getSimilarMovies);

router.get('/:id/reviews', getMovieReviews);
router.post('/:id/reviews', authenticateToken, addMovieReview);

export default router;
