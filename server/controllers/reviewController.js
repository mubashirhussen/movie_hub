import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Rating from '../models/Rating.js';
import ReviewReport from '../models/ReviewReport.js';

// In-Memory store fallback
const inMemoryReviews = new Map(); // key: reviewId, value: review
const inMemoryReports = new Map(); // key: `${reviewId}_${userId}`, value: report

const isDBReady = () => mongoose.connection.readyState === 1;

// Basic XSS sanitizer to strip potentially dangerous tags
const sanitizeText = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
};

/**
 * 1. Get Reviews for a Movie with Pagination & Sorting
 * GET /api/movies/:movieId/reviews
 */
export const getMovieReviews = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId || req.params.id);
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const sort = req.query.sort || 'newest';
    const currentUserId = req.user ? req.user._id?.toString() : null;

    if (isDBReady()) {
      let sortCriteria = { createdAt: -1 };
      if (sort === 'highest') {
        sortCriteria = { rating: -1, createdAt: -1 };
      } else if (sort === 'helpful') {
        sortCriteria = { helpfulCount: -1, createdAt: -1 };
      }

      const query = { movieId, status: { $ne: 'hidden' } };

      const totalReviews = await Review.countDocuments(query);
      const totalPages = Math.ceil(totalReviews / limit) || 1;

      const rawReviews = await Review.find(query)
        .populate('userId', 'name avatar')
        .sort(sortCriteria)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const reviews = rawReviews.map((r) => {
        const authorId = r.userId?._id?.toString();
        const hasVotedHelpful = currentUserId && Array.isArray(r.helpfulVotes)
          ? r.helpfulVotes.some((id) => id.toString() === currentUserId)
          : false;

        return {
          id: r._id,
          movieId: r.movieId,
          rating: r.rating,
          reviewText: r.reviewText,
          isSpoiler: r.isSpoiler,
          helpfulCount: r.helpfulCount || 0,
          hasVotedHelpful,
          isAuthor: currentUserId && authorId === currentUserId,
          author: {
            id: authorId,
            name: r.userId?.name || 'CineVerse Member',
            avatar: r.userId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          },
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          reviews,
          pagination: {
            page,
            limit,
            totalReviews,
            totalPages,
          },
        },
      });
    } else {
      // In-Memory Fallback
      let list = Array.from(inMemoryReviews.values()).filter(
        (r) => r.movieId === movieId && r.status !== 'hidden'
      );

      if (sort === 'highest') {
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sort === 'helpful') {
        list.sort((a, b) => b.helpfulCount - a.helpfulCount || new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      const totalReviews = list.length;
      const totalPages = Math.ceil(totalReviews / limit) || 1;
      const paged = list.slice((page - 1) * limit, page * limit);

      const reviews = paged.map((r) => ({
        ...r,
        isAuthor: currentUserId && r.userId?.toString() === currentUserId,
        hasVotedHelpful: currentUserId && r.helpfulVotes ? r.helpfulVotes.includes(currentUserId) : false,
      }));

      return res.status(200).json({
        success: true,
        data: {
          reviews,
          pagination: { page, limit, totalReviews, totalPages },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Submit a Movie Review
 * POST /api/movies/:movieId/reviews
 */
export const createReview = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.movieId || req.params.id);
    const { reviewText, rating, isSpoiler } = req.body;
    const userId = req.user._id;

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    const sanitized = sanitizeText(reviewText);
    if (!sanitized || sanitized.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Review text must be at least 5 characters long',
      });
    }

    if (sanitized.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot exceed 1000 characters',
      });
    }

    let parsedRating = null;
    if (rating !== undefined && rating !== null) {
      parsedRating = Number(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5',
        });
      }
    }

    if (isDBReady()) {
      // Check if user already reviewed this movie
      const existing = await Review.findOne({ userId, movieId });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'You have already submitted a review for this movie. You can edit your existing review.',
        });
      }

      const review = await Review.create({
        userId,
        movieId,
        rating: parsedRating,
        reviewText: sanitized,
        isSpoiler: Boolean(isSpoiler),
        helpfulCount: 0,
        helpfulVotes: [],
        status: 'approved',
      });

      // If rating was included, ensure Rating collection stays in sync
      if (parsedRating) {
        await Rating.findOneAndUpdate(
          { userId, movieId },
          { rating: parsedRating },
          { upsert: true, new: true }
        );
      }

      const populated = await Review.findById(review._id).populate('userId', 'name avatar').lean();

      return res.status(201).json({
        success: true,
        message: 'Review published successfully',
        data: {
          id: populated._id,
          movieId: populated.movieId,
          rating: populated.rating,
          reviewText: populated.reviewText,
          isSpoiler: populated.isSpoiler,
          helpfulCount: 0,
          hasVotedHelpful: false,
          isAuthor: true,
          author: {
            id: userId.toString(),
            name: populated.userId?.name || req.user.name,
            avatar: populated.userId?.avatar || req.user.avatar,
          },
          createdAt: populated.createdAt,
          updatedAt: populated.updatedAt,
        },
      });
    } else {
      // In-Memory Fallback
      const key = `${userId}_${movieId}`;
      for (const r of inMemoryReviews.values()) {
        if (r.userId?.toString() === userId.toString() && r.movieId === movieId) {
          return res.status(409).json({
            success: false,
            message: 'You have already submitted a review for this movie.',
          });
        }
      }

      const id = new mongoose.Types.ObjectId().toString();
      const newReview = {
        id,
        _id: id,
        userId: userId.toString(),
        movieId,
        rating: parsedRating,
        reviewText: sanitized,
        isSpoiler: Boolean(isSpoiler),
        helpfulCount: 0,
        helpfulVotes: [],
        status: 'approved',
        isAuthor: true,
        hasVotedHelpful: false,
        author: {
          id: userId.toString(),
          name: req.user.name || 'CineVerse Member',
          avatar: req.user.avatar,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryReviews.set(id, newReview);

      return res.status(201).json({
        success: true,
        message: 'Review published successfully',
        data: newReview,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Update Existing Review (Ownership Protected)
 * PUT /api/reviews/:reviewId
 */
export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { reviewText, rating, isSpoiler } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    const sanitized = sanitizeText(reviewText);
    if (!sanitized || sanitized.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Review text must be at least 5 characters long',
      });
    }

    if (sanitized.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot exceed 1000 characters',
      });
    }

    let parsedRating = null;
    if (rating !== undefined && rating !== null) {
      parsedRating = Number(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5',
        });
      }
    }

    if (isDBReady()) {
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      // Enforce author ownership
      if (!review.userId.equals(userId) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only edit your own reviews',
        });
      }

      review.reviewText = sanitized;
      if (parsedRating !== null) {
        review.rating = parsedRating;
        // Keep Rating collection in sync
        await Rating.findOneAndUpdate(
          { userId: review.userId, movieId: review.movieId },
          { rating: parsedRating },
          { upsert: true, new: true }
        );
      }
      if (isSpoiler !== undefined) {
        review.isSpoiler = Boolean(isSpoiler);
      }

      await review.save();
      const populated = await Review.findById(review._id).populate('userId', 'name avatar').lean();

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: {
          id: populated._id,
          movieId: populated.movieId,
          rating: populated.rating,
          reviewText: populated.reviewText,
          isSpoiler: populated.isSpoiler,
          helpfulCount: populated.helpfulCount,
          isAuthor: true,
          author: {
            id: userId.toString(),
            name: populated.userId?.name,
            avatar: populated.userId?.avatar,
          },
          updatedAt: populated.updatedAt,
        },
      });
    } else {
      const item = inMemoryReviews.get(reviewId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }
      if (item.userId !== userId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only edit your own reviews',
        });
      }
      item.reviewText = sanitized;
      if (parsedRating !== null) item.rating = parsedRating;
      if (isSpoiler !== undefined) item.isSpoiler = Boolean(isSpoiler);
      item.updatedAt = new Date();

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: item,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Delete Review (Ownership or Admin Protected)
 * DELETE /api/reviews/:reviewId
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    if (isDBReady()) {
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      // Check ownership
      if (!review.userId.equals(userId) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only delete your own reviews',
        });
      }

      await Review.findByIdAndDelete(reviewId);
      await ReviewReport.deleteMany({ reviewId });

      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    } else {
      const item = inMemoryReviews.get(reviewId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }
      if (item.userId !== userId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only delete your own reviews',
        });
      }
      inMemoryReviews.delete(reviewId);
      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Toggle Helpful Vote on a Review
 * POST /api/reviews/:reviewId/helpful
 */
export const toggleHelpfulVote = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    if (isDBReady()) {
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      // Prevent user from voting helpful on their own review
      if (review.userId.equals(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You cannot mark your own review as helpful',
        });
      }

      const hasVoted = review.helpfulVotes.some((id) => id.equals(userId));

      if (hasVoted) {
        // Remove vote
        review.helpfulVotes = review.helpfulVotes.filter((id) => !id.equals(userId));
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      } else {
        // Add vote
        review.helpfulVotes.push(userId);
        review.helpfulCount += 1;
      }

      await review.save();

      return res.status(200).json({
        success: true,
        message: hasVoted ? 'Helpful vote removed' : 'Helpful vote registered',
        data: {
          helpfulCount: review.helpfulCount,
          hasVotedHelpful: !hasVoted,
        },
      });
    } else {
      const item = inMemoryReviews.get(reviewId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }
      if (item.userId === userId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot mark your own review as helpful',
        });
      }

      if (!item.helpfulVotes) item.helpfulVotes = [];
      const hasVoted = item.helpfulVotes.includes(userId.toString());

      if (hasVoted) {
        item.helpfulVotes = item.helpfulVotes.filter((id) => id !== userId.toString());
        item.helpfulCount = Math.max(0, item.helpfulCount - 1);
      } else {
        item.helpfulVotes.push(userId.toString());
        item.helpfulCount = (item.helpfulCount || 0) + 1;
      }

      return res.status(200).json({
        success: true,
        message: hasVoted ? 'Helpful vote removed' : 'Helpful vote registered',
        data: {
          helpfulCount: item.helpfulCount,
          hasVotedHelpful: !hasVoted,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Report Review for Inappropriate Content
 * POST /api/reviews/:reviewId/report
 */
export const reportReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { reason, details } = req.body;
    const reportedBy = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    const validReasons = ['harassment', 'spam', 'hate_speech', 'unmarked_spoiler', 'other'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Reason must be one of: ${validReasons.join(', ')}`,
      });
    }

    if (isDBReady()) {
      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      // Check if user already reported this review
      const existingReport = await ReviewReport.findOne({ reviewId, reportedBy });
      if (existingReport) {
        return res.status(409).json({
          success: false,
          message: 'You have already reported this review.',
        });
      }

      await ReviewReport.create({
        reviewId,
        reportedBy,
        reason,
        details: sanitizeText(details || ''),
      });

      // Increment report count on review
      review.reportCount += 1;
      // Auto-flag if reports exceed threshold (5)
      if (review.reportCount >= 5 && review.status === 'approved') {
        review.status = 'flagged';
      }
      await review.save();

      return res.status(201).json({
        success: true,
        message: 'Review report submitted for moderator review. Thank you for keeping CineVerse safe.',
      });
    } else {
      const key = `${reviewId}_${reportedBy}`;
      if (inMemoryReports.has(key)) {
        return res.status(409).json({
          success: false,
          message: 'You have already reported this review.',
        });
      }
      inMemoryReports.set(key, { reviewId, reportedBy, reason, details });
      return res.status(201).json({
        success: true,
        message: 'Review report submitted for moderator review.',
      });
    }
  } catch (error) {
    next(error);
  }
};
