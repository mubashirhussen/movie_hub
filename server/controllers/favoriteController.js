import Favorite from '../models/Favorite.js';
import { getDBStatus } from '../config/db.js';

// In-memory fallback
const inMemoryFavorites = new Map();

// 1. Get Favorites
export const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const list = await Favorite.find({ userId }).sort({ addedAt: -1 });
      return res.status(200).json({
        success: true,
        count: list.length,
        data: list,
      });
    } else {
      const list = inMemoryFavorites.get(String(userId)) || [];
      return res.status(200).json({
        success: true,
        count: list.length,
        data: list,
      });
    }
  } catch (error) {
    next(error);
  }
};

// 2. Add / Toggle Favorite
export const addToFavorites = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const movieId = parseInt(req.params.movieId || req.body.movieId);
    const movieTitle = req.body.movieTitle || req.body.title || 'Movie';
    const posterPath = req.body.posterPath || req.body.poster_path || '';

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID',
      });
    }

    if (getDBStatus()) {
      const existing = await Favorite.findOne({ userId, movieId });

      if (existing) {
        await Favorite.deleteOne({ _id: existing._id });
        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'Removed from favorites',
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
    } else {
      const key = String(userId);
      let list = inMemoryFavorites.get(key) || [];
      const index = list.findIndex((m) => m.movieId === movieId);

      if (index > -1) {
        list.splice(index, 1);
        inMemoryFavorites.set(key, list);
        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'Removed from favorites',
        });
      }

      const newItem = {
        _id: `fav_${Date.now()}`,
        userId,
        movieId,
        movieTitle,
        posterPath,
        addedAt: new Date().toISOString(),
      };
      list.unshift(newItem);
      inMemoryFavorites.set(key, list);

      return res.status(201).json({
        success: true,
        action: 'added',
        message: 'Added to favorites',
        data: newItem,
      });
    }
  } catch (error) {
    next(error);
  }
};

// 3. Remove from Favorites
export const removeFromFavorites = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const movieId = parseInt(req.params.movieId || req.body.movieId);

    if (getDBStatus()) {
      await Favorite.deleteOne({ userId, movieId });
    } else {
      const key = String(userId);
      let list = inMemoryFavorites.get(key) || [];
      list = list.filter((m) => m.movieId !== movieId);
      inMemoryFavorites.set(key, list);
    }

    return res.status(200).json({
      success: true,
      message: 'Movie removed from favorites',
    });
  } catch (error) {
    next(error);
  }
};

export default { getFavorites, addToFavorites, removeFromFavorites };
