import Favorite from '../models/Favorite.js';

// 1. Get User's Favorites (MongoDB persisted, sorted by newest)
export const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const list = await Favorite.find({ userId }).sort({ addedAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Add or Toggle Movie in Favorites
export const addToFavorites = async (req, res, next) => {
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

    const existing = await Favorite.findOne({ userId, movieId });

    if (existing) {
      if (req.body?.action === 'toggle' || req.query?.action === 'toggle') {
        await Favorite.deleteOne({ _id: existing._id });
        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'Removed from favorites',
        });
      }

      return res.status(200).json({
        success: true,
        action: 'exists',
        message: 'Movie already exists in your favorites',
        data: existing,
      });
    }

    const item = await Favorite.create({
      userId,
      movieId,
      movieTitle,
      posterPath,
      addedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      action: 'added',
      message: 'Added to favorites',
      data: item,
    });
  } catch (error) {
    // Handle concurrent duplicate key race condition safely
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        action: 'exists',
        message: 'Movie is already in your favorites',
      });
    }
    next(error);
  }
};

// 3. Explicit Remove from Favorites
export const removeFromFavorites = async (req, res, next) => {
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

    await Favorite.deleteOne({ userId, movieId });

    return res.status(200).json({
      success: true,
      message: 'Movie removed from favorites',
    });
  } catch (error) {
    next(error);
  }
};

export default { getFavorites, addToFavorites, removeFromFavorites };
