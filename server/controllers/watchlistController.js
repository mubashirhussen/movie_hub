import Watchlist from '../models/Watchlist.js';
import { getDBStatus } from '../config/db.js';

// In-memory fallback
const inMemoryWatchlist = new Map();

// 1. Get User's Watchlist
export const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const list = await Watchlist.find({ userId }).sort({ addedAt: -1 });
      return res.status(200).json({
        success: true,
        count: list.length,
        data: list,
      });
    } else {
      const list = inMemoryWatchlist.get(String(userId)) || [];
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

// 2. Add to Watchlist (or toggle)
export const addToWatchlist = async (req, res, next) => {
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
      const existing = await Watchlist.findOne({ userId, movieId });

      if (existing) {
        // If already in watchlist, remove it (toggle behavior)
        await Watchlist.deleteOne({ _id: existing._id });
        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'Removed from watchlist',
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
    } else {
      const key = String(userId);
      let list = inMemoryWatchlist.get(key) || [];
      const index = list.findIndex((m) => m.movieId === movieId);

      if (index > -1) {
        list.splice(index, 1);
        inMemoryWatchlist.set(key, list);
        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'Removed from watchlist',
        });
      }

      const newItem = {
        _id: `wl_${Date.now()}`,
        userId,
        movieId,
        movieTitle,
        posterPath,
        addedAt: new Date().toISOString(),
      };
      list.unshift(newItem);
      inMemoryWatchlist.set(key, list);

      return res.status(201).json({
        success: true,
        action: 'added',
        message: 'Added to watchlist',
        data: newItem,
      });
    }
  } catch (error) {
    next(error);
  }
};

// 3. Remove from Watchlist
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const movieId = parseInt(req.params.movieId || req.body.movieId);

    if (getDBStatus()) {
      await Watchlist.deleteOne({ userId, movieId });
    } else {
      const key = String(userId);
      let list = inMemoryWatchlist.get(key) || [];
      list = list.filter((m) => m.movieId !== movieId);
      inMemoryWatchlist.set(key, list);
    }

    return res.status(200).json({
      success: true,
      message: 'Movie removed from watchlist',
    });
  } catch (error) {
    next(error);
  }
};

export default { getWatchlist, addToWatchlist, removeFromWatchlist };
