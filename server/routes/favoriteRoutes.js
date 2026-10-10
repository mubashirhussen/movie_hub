import express from 'express';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} from '../controllers/favoriteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getFavorites);
router.post('/', addToFavorites);
router.post('/:movieId', addToFavorites);
router.delete('/', removeFromFavorites);
router.delete('/:movieId', removeFromFavorites);

export default router;
