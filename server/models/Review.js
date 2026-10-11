import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    reviewText: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      minlength: [5, 'Review must be at least 5 characters'],
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    isSpoiler: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    helpfulCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['approved', 'flagged', 'hidden'],
      default: 'approved',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes supporting efficient retrieval, sorting, and user uniqueness
reviewSchema.index({ movieId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ movieId: 1, helpfulCount: -1 });
reviewSchema.index({ movieId: 1, rating: -1 });
reviewSchema.index({ userId: 1, movieId: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
