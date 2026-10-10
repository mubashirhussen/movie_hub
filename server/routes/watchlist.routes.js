import express from 'express';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlistStatus
} from '../controllers/watchlist.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:movieId', removeFromWatchlist);
router.get('/status/:movieId', checkWatchlistStatus);

export default router;
