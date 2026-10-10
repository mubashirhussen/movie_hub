import User from '../models/User.js';
import Watchlist from '../models/Watchlist.js';
import Favorite from '../models/Favorite.js';
import History from '../models/History.js';
import MovieView from '../models/MovieView.js';

// 1. Get User Profile with real-time statistics
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [watchlistCount, favoriteCount, historyCount] = await Promise.all([
      Watchlist.countDocuments({ userId }),
      Favorite.countDocuments({ userId }),
      History.countDocuments({ userId }),
    ]);

    return res.status(200).json({
      success: true,
      user,
      data: {
        user,
        email: user.email,
        name: user.name,
        stats: {
          watchlistCount,
          favoriteCount,
          historyCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Update User Profile (Strictly guarded against mass assignment)
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, avatar, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Name update
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      }
      user.name = trimmedName;
    }

    // Avatar update
    if (avatar !== undefined) {
      user.avatar = avatar.trim();
    }

    // Password change (requires verified current password)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your current password to set a new password',
        });
      }

      const isCurrentMatch = await user.matchPassword(currentPassword);
      if (!isCurrentMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
      }

      user.password = newPassword;
    }

    // Prevent ordinary users from tampering with roles or email
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
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get User Viewing History (sorted by most recent)
export const getHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const history = await History.find({ userId }).sort({ viewedAt: -1 }).limit(50).lean();

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Record Viewing in History
export const addToHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const movieId = parseInt(req.params.movieId || req.body.movieId);
    const movieTitle = req.body.movieTitle || req.body.title || 'Movie';
    const posterPath = req.body.posterPath || req.body.poster_path || '';

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ success: false, message: 'Valid movie ID is required' });
    }

    const record = await History.findOneAndUpdate(
      { userId, movieId },
      { movieTitle, posterPath, viewedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Added to watch history',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Remove Single Movie from History or Clear All History
export const removeFromHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const rawMovieId = req.params?.movieId || req.body?.movieId;

    if (rawMovieId) {
      const movieId = parseInt(rawMovieId);
      await History.deleteOne({ userId, movieId });
      return res.status(200).json({
        success: true,
        message: 'Movie removed from watch history',
      });
    }

    // Clear entire viewing history for current user
    await History.deleteMany({ userId });
    return res.status(200).json({
      success: true,
      message: 'Watch history cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

// 6. Admin Statistics (Requires admin role)
export const getAdminStats = async (req, res, next) => {
  try {
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
