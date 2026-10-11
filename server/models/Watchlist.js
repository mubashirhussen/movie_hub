import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomWatchlist',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['want_to_watch', 'watching', 'watched'],
      default: 'want_to_watch',
      index: true,
    },
    movieId: {
      type: Number,
      required: true,
      index: true,
    },
    movieTitle: {
      type: String,
      required: true,
      trim: true,
    },
    posterPath: {
      type: String,
      default: '',
    },
    releaseDate: {
      type: String,
      default: '',
    },
    voteAverage: {
      type: Number,
      default: 0,
    },
    overview: {
      type: String,
      default: '',
    },
    genres: {
      type: [String],
      default: [],
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

// Prevent duplicate movie entries within the same watchlist (default or custom)
watchlistSchema.index({ userId: 1, movieId: 1, customListId: 1 }, { unique: true });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

// Safe background migration to ensure legacy index doesn't block multi-list membership
Watchlist.collection.dropIndex('userId_1_movieId_1').catch(() => {
  // Ignored if legacy index doesn't exist or already removed
});

export default Watchlist;
