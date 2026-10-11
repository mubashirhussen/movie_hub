import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
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
      required: [true, 'Rating must be between 1 and 5'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate ratings for the same user and movie
ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });
ratingSchema.index({ movieId: 1 });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
