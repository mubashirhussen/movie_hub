import express from 'express';
import {
  getProfile,
  updateProfile,
  getHistory,
  addToHistory,
  removeFromHistory,
  getAdminStats,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

router.get('/history', protect, getHistory);
router.post('/history', protect, addToHistory);
router.post('/history/:movieId', protect, addToHistory);
router.delete('/history', protect, removeFromHistory);
router.delete('/history/:movieId', protect, removeFromHistory);

router.get('/admin/stats', protect, adminOnly, getAdminStats);

export default router;
