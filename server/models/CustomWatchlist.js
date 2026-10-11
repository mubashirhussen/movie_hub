import mongoose from 'mongoose';

const customWatchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Watchlist name is required'],
      trim: true,
      maxlength: [100, 'Watchlist name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user cannot create two custom watchlists with the identical name
customWatchlistSchema.index({ userId: 1, name: 1 }, { unique: true });

const CustomWatchlist = mongoose.model('CustomWatchlist', customWatchlistSchema);

export default CustomWatchlist;
