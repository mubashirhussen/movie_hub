import express from 'express';
import {
  updateReview,
  deleteReview,
  toggleHelpfulVote,
  reportReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All review item operations require authentication

router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);
router.post('/:reviewId/helpful', toggleHelpfulVote);
router.post('/:reviewId/report', reportReview);
router.post('/:reviewId/reports', reportReview); // Alias

export default router;
