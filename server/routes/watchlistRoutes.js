import express from 'express';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../controllers/watchlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Protect all watchlist routes

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.post('/:movieId', addToWatchlist);
router.delete('/', removeFromWatchlist);
router.delete('/:movieId', removeFromWatchlist);

export default router;
