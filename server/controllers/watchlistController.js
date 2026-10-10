import Watchlist from '../models/Watchlist.js';

// 1. Get User's Watchlist (MongoDB persisted, sorted by newest)
export const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const list = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Add or Toggle Movie in Watchlist
export const addToWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const rawMovieId = req.params.movieId || req.body.movieId;
    const movieId = parseInt(rawMovieId);
    const movieTitle = req.body.movieTitle || req.body.title || 'Movie';
    const posterPath = req.body.posterPath || req.body.poster_path || '';

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID is required',
      });
    }

    const existing = await Watchlist.findOne({ userId, movieId });

    if (existing) {
      if (req.body?.action === 'toggle' || req.query?.action === 'toggle') {
        await Watchlist.deleteOne({ _id: existing._id });
        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'Removed from watchlist',
        });
      }

      return res.status(200).json({
        success: true,
        action: 'exists',
        message: 'Movie already exists in your watchlist',
        data: existing,
      });
    }

    const item = await Watchlist.create({
      userId,
      movieId,
      movieTitle,
      posterPath,
      addedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      action: 'added',
      message: 'Added to watchlist',
      data: item,
    });
  } catch (error) {
    // Handle concurrent duplicate key race condition safely
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        action: 'exists',
        message: 'Movie is already in your watchlist',
      });
    }
    next(error);
  }
};

// 3. Explicit Remove from Watchlist
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const rawMovieId = req.params.movieId || req.body.movieId;
    const movieId = parseInt(rawMovieId);

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID is required',
      });
    }

    await Watchlist.deleteOne({ userId, movieId });

    return res.status(200).json({
      success: true,
      message: 'Movie removed from watchlist',
    });
  } catch (error) {
    next(error);
  }
};

export default { getWatchlist, addToWatchlist, removeFromWatchlist };
