import express from 'express';
import mongoose from 'mongoose';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateViewingStatus,
  getWatchlistSummary,
  createCustomWatchlist,
  getCustomWatchlists,
  getCustomWatchlistById,
  updateCustomWatchlist,
  deleteCustomWatchlist,
  addMovieToCustomWatchlist,
  removeMovieFromCustomWatchlist,
} from '../controllers/watchlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All watchlist operations require authenticated user
router.use(protect);

// Root handler: smart multiplexing based on endpoint and body
router.get('/', (req, res, next) => {
  if (req.baseUrl.endsWith('/watchlists') && !req.query.status && !req.query.movieId) {
    // Stage 11 REST plural: GET /api/watchlists retrieves user's list summary/overview
    return getWatchlistSummary(req, res, next);
  }
  return getWatchlist(req, res, next);
});

router.post('/', (req, res, next) => {
  // If request contains 'name', treat as custom watchlist creation
  if (req.body && req.body.name && !req.body.movieId) {
    return createCustomWatchlist(req, res, next);
  }
  return addToWatchlist(req, res, next);
});

// Explicit summary route
router.get('/summary', getWatchlistSummary);

// Explicit custom watchlist subroutes
router.get('/custom', getCustomWatchlists);
router.post('/custom', createCustomWatchlist);
router.get('/custom/:id', getCustomWatchlistById);
router.patch('/custom/:id', updateCustomWatchlist);
router.delete('/custom/:id', deleteCustomWatchlist);
router.post('/custom/:id/movies', addMovieToCustomWatchlist);
router.post('/custom/:id/movies/:movieId', addMovieToCustomWatchlist);
router.delete('/custom/:id/movies/:movieId', removeMovieFromCustomWatchlist);

// Movie viewing status update on default watchlist
router.patch('/:movieId/status', updateViewingStatus);

// Sub-routes on list ID for movies
router.post('/:id/movies', (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    return addMovieToCustomWatchlist(req, res, next);
  }
  return next();
});

router.post('/:id/movies/:movieId', (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    return addMovieToCustomWatchlist(req, res, next);
  }
  return next();
});

router.delete('/:id/movies/:movieId', (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    return removeMovieFromCustomWatchlist(req, res, next);
  }
  return next();
});

router.patch('/:id/movies/:movieId', (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    return updateViewingStatus(req, res, next);
  }
  return next();
});

// Multiplexed parameter route by ID type (ObjectId vs Numeric MovieId)
router.get('/:id', (req, res, next) => {
  if (req.params.id === 'summary') {
    return getWatchlistSummary(req, res, next);
  }
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    return getCustomWatchlistById(req, res, next);
  }
  // If not ObjectId, fallback to not found
  return res.status(404).json({ success: false, message: 'Resource not found' });
});

router.patch('/:id', (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    return updateCustomWatchlist(req, res, next);
  }
  // Otherwise treat as numeric movieId status update
  req.params.movieId = req.params.id;
  return updateViewingStatus(req, res, next);
});

router.delete('/:id', (req, res, next) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    return deleteCustomWatchlist(req, res, next);
  }
  // Otherwise treat as numeric movieId removal from default watchlist
  req.params.movieId = req.params.id;
  return removeFromWatchlist(req, res, next);
});

router.post('/:movieId', addToWatchlist);

export default router;
