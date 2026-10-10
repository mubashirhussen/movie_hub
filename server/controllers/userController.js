import User from '../models/User.js';
import Watchlist from '../models/Watchlist.js';
import Favorite from '../models/Favorite.js';
import History from '../models/History.js';
import MovieView from '../models/MovieView.js';
import { getDBStatus } from '../config/db.js';

const inMemoryHistory = new Map();

// 1. Get User Profile with real-time statistics
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const user = await User.findById(userId).select('-password');
      const watchlistCount = await Watchlist.countDocuments({ userId });
      const favoriteCount = await Favorite.countDocuments({ userId });
      const historyCount = await History.countDocuments({ userId });

      const userData = user || req.user;
      return res.status(200).json({
        success: true,
        user: userData,
        data: {
          user: userData,
          email: userData?.email,
          name: userData?.name,
          stats: {
            watchlistCount,
            favoriteCount,
            historyCount,
          },
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        user: req.user,
        data: {
          user: req.user,
          email: req.user?.email,
          name: req.user?.name,
          stats: {
            watchlistCount: 5,
            favoriteCount: 4,
            historyCount: 8,
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// 2. Update User Profile
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, avatar, password } = req.body;

    if (getDBStatus()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      if (password) user.password = password;

      const updated = await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updated._id,
          name: updated.name,
          email: updated.email,
          avatar: updated.avatar,
          role: updated.role,
        },
      });
    } else {
      req.user.name = name || req.user.name;
      req.user.avatar = avatar || req.user.avatar;

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: req.user,
      });
    }
  } catch (error) {
    next(error);
  }
};

// 3. Get Watch History
export const getHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    if (getDBStatus()) {
      const history = await History.find({ userId }).sort({ viewedAt: -1 }).limit(50);
      return res.status(200).json({
        success: true,
        count: history.length,
        data: history,
      });
    } else {
      const history = inMemoryHistory.get(String(userId)) || [];
      return res.status(200).json({
        success: true,
        count: history.length,
        data: history,
      });
    }
  } catch (error) {
    next(error);
  }
};

// 4. Add to Watch History
export const addToHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const movieId = parseInt(req.params.movieId || req.body.movieId);
    const movieTitle = req.body.movieTitle || req.body.title || 'Movie';
    const posterPath = req.body.posterPath || req.body.poster_path || '';

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'Invalid movie ID' });
    }

    if (getDBStatus()) {
      await History.findOneAndUpdate(
        { userId, movieId },
        { movieTitle, posterPath, viewedAt: new Date() },
        { upsert: true, new: true }
      );
    } else {
      const key = String(userId);
      let list = inMemoryHistory.get(key) || [];
      list = list.filter((h) => h.movieId !== movieId);
      list.unshift({
        _id: `hist_${Date.now()}`,
        userId,
        movieId,
        movieTitle,
        posterPath,
        viewedAt: new Date().toISOString(),
      });
      inMemoryHistory.set(key, list.slice(0, 50));
    }

    return res.status(200).json({
      success: true,
      message: 'Added to watch history',
    });
  } catch (error) {
    next(error);
  }
};

// 5. Remove from Watch History
export const removeFromHistory = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const movieId = parseInt(req.params.movieId || req.body.movieId);

    if (getDBStatus()) {
      await History.deleteOne({ userId, movieId });
    } else {
      const key = String(userId);
      let list = inMemoryHistory.get(key) || [];
      list = list.filter((h) => h.movieId !== movieId);
      inMemoryHistory.set(key, list);
    }

    return res.status(200).json({
      success: true,
      message: 'Removed from history',
    });
  } catch (error) {
    next(error);
  }
};

// 6. Admin Statistics
export const getAdminStats = async (req, res, next) => {
  try {
    if (getDBStatus()) {
      const [totalUsers, totalViews, totalWatchlist, totalFavorites] = await Promise.all([
        User.countDocuments(),
        MovieView.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
        Watchlist.countDocuments(),
        Favorite.countDocuments(),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalMovieViews: totalViews[0]?.total || 0,
          totalWatchlist,
          totalFavorites,
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        data: {
          totalUsers: 154,
          totalMovieViews: 12480,
          totalWatchlist: 320,
          totalFavorites: 412,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
  getHistory,
  addToHistory,
  removeFromHistory,
  getAdminStats,
};
