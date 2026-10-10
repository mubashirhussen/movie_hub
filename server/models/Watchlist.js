import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
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
    movieTitle: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
      default: '',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate entries for the same user and movie
watchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

export default Watchlist;
