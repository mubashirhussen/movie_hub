import express from 'express';
import {
  getHistory,
  addToHistory,
  removeFromHistory,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Protect all history routes

router.get('/', getHistory);
router.post('/', addToHistory);
router.post('/:movieId', addToHistory);
router.delete('/', removeFromHistory);
router.delete('/:movieId', removeFromHistory);

export default router;
