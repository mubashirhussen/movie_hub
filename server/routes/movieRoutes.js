import express from 'express';
import {
  getPopular,
  getTopRated,
  getUpcoming,
  search,
  getMovieDetails,
  getMovieCast,
  getMovieTrailer,
  getMovieProviders,
  getSimilarMovies,
  incrementMovieView,
  getByIndustry,
} from '../controllers/movieController.js';

const router = express.Router();

router.get('/popular', getPopular);
router.get('/top-rated', getTopRated);
router.get('/upcoming', getUpcoming);
router.get('/search', search);
router.get('/category/:industry', getByIndustry);
router.get('/industry/:industry', getByIndustry);
router.get('/:id', getMovieDetails);
router.get('/:id/cast', getMovieCast);
router.get('/:id/trailer', getMovieTrailer);
router.get('/:id/providers', getMovieProviders);
router.get('/:id/similar', getSimilarMovies);
router.post('/:id/view', incrementMovieView);

export default router;
