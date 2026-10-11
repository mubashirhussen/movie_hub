import mongoose from 'mongoose';
import Watchlist from '../models/Watchlist.js';
import CustomWatchlist from '../models/CustomWatchlist.js';

const VALID_STATUSES = ['want_to_watch', 'watching', 'watched'];

// Helper to sanitize sort order
const parseSort = (sortBy) => {
  switch (sortBy) {
    case 'title':
      return { movieTitle: 1 };
    case 'release_date':
      return { releaseDate: -1, addedAt: -1 };
    case 'rating':
      return { voteAverage: -1, addedAt: -1 };
    case 'date_added':
    default:
      return { addedAt: -1 };
  }
};

// 1. Get User's Default Watchlist (MongoDB persisted, sorted by newest or requested sort)
export const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, sortBy } = req.query;

    const query = { userId, customListId: null };
    if (status && VALID_STATUSES.includes(status)) {
      query.status = status;
    }

    const sort = parseSort(sortBy);
    const list = await Watchlist.find(query).sort(sort).lean();

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Add or Toggle Movie in Default Watchlist
export const addToWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const rawMovieId = req.params.movieId || req.body.movieId;
    const movieId = parseInt(rawMovieId);
    const movieTitle = req.body.movieTitle || req.body.title || 'Movie';
    const posterPath = req.body.posterPath || req.body.poster_path || '';
    const releaseDate = req.body.releaseDate || req.body.release_date || '';
    const voteAverage = Number(req.body.voteAverage || req.body.vote_average) || 0;
    const overview = req.body.overview || '';
    const genres = Array.isArray(req.body.genres)
      ? req.body.genres.map((g) => (typeof g === 'object' ? g.name : String(g)))
      : [];
    const status = VALID_STATUSES.includes(req.body.status) ? req.body.status : 'want_to_watch';

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID is required',
      });
    }

    const existing = await Watchlist.findOne({ userId, movieId, customListId: null });

    if (existing) {
      if (req.body?.action === 'toggle' || req.query?.action === 'toggle') {
        await Watchlist.deleteOne({ _id: existing._id });
        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'Removed from watchlist',
        });
      }

      // If status changed, update it
      if (req.body.status && req.body.status !== existing.status) {
        existing.status = status;
        await existing.save();
        return res.status(200).json({
          success: true,
          action: 'updated',
          message: `Moved to ${status.replace(/_/g, ' ')}`,
          data: existing,
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
      releaseDate,
      voteAverage,
      overview,
      genres,
      status,
      customListId: null,
      addedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      action: 'added',
      message: 'Added to watchlist',
      data: item,
    });
  } catch (error) {
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

// 3. Explicit Remove from Default Watchlist
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

    await Watchlist.deleteOne({ userId, movieId, customListId: null });

    return res.status(200).json({
      success: true,
      message: 'Movie removed from watchlist',
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Movie Viewing Status (Move between Want to Watch, Watching, Watched)
export const updateViewingStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const rawMovieId = req.params.movieId || req.body.movieId;
    const movieId = parseInt(rawMovieId);
    const { status } = req.body;

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID is required',
      });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid viewing status. Allowed: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const item = await Watchlist.findOneAndUpdate(
      { userId, movieId, customListId: null },
      { status },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found in your watchlist',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Viewing status updated to ${status.replace(/_/g, ' ')}`,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Watchlist Summary & Overview (Counts by Status & Custom Lists)
export const getWatchlistSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Aggregate counts for default statuses
    const statusCounts = await Watchlist.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), customListId: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const countMap = {
      want_to_watch: 0,
      watching: 0,
      watched: 0,
    };
    statusCounts.forEach((sc) => {
      if (countMap[sc._id] !== undefined) {
        countMap[sc._id] = sc.count;
      }
    });

    const totalDefaultCount = countMap.want_to_watch + countMap.watching + countMap.watched;

    // Fetch custom lists with item counts
    const customLists = await CustomWatchlist.find({ userId }).sort({ createdAt: -1 }).lean();

    const customListIds = customLists.map((l) => l._id);
    const customCounts = await Watchlist.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          customListId: { $in: customListIds },
        },
      },
      { $group: { _id: '$customListId', count: { $sum: 1 } } },
    ]);

    const customCountMap = new Map();
    customCounts.forEach((c) => {
      customCountMap.set(String(c._id), c.count);
    });

    const enrichedCustomLists = customLists.map((cl) => ({
      ...cl,
      itemCount: customCountMap.get(String(cl._id)) || 0,
    }));

    return res.status(200).json({
      success: true,
      data: {
        defaultLists: [
          { id: 'want_to_watch', name: 'Want to Watch', count: countMap.want_to_watch },
          { id: 'watching', name: 'Watching', count: countMap.watching },
          { id: 'watched', name: 'Watched', count: countMap.watched },
        ],
        totalDefaultCount,
        customLists: enrichedCustomLists,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 6. Create Custom Watchlist
export const createCustomWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Watchlist name is required',
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Watchlist name cannot exceed 100 characters',
      });
    }

    const existing = await CustomWatchlist.findOne({ userId, name: trimmedName });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have a watchlist with this name',
      });
    }

    const customList = await CustomWatchlist.create({
      userId,
      name: trimmedName,
      description: description ? String(description).trim().slice(0, 500) : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Custom watchlist created successfully',
      data: {
        ...customList.toObject(),
        itemCount: 0,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have a watchlist with this name',
      });
    }
    next(error);
  }
};

// 7. Get All Custom Watchlists
export const getCustomWatchlists = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const customLists = await CustomWatchlist.find({ userId }).sort({ createdAt: -1 }).lean();

    const customListIds = customLists.map((l) => l._id);
    const customCounts = await Watchlist.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          customListId: { $in: customListIds },
        },
      },
      { $group: { _id: '$customListId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    customCounts.forEach((c) => {
      countMap.set(String(c._id), c.count);
    });

    const enriched = customLists.map((cl) => ({
      ...cl,
      itemCount: countMap.get(String(cl._id)) || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Get Single Custom Watchlist and its Movies
export const getCustomWatchlistById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid watchlist ID format',
      });
    }

    const list = await CustomWatchlist.findOne({ _id: id, userId }).lean();
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found or access denied',
      });
    }

    const sort = parseSort(req.query.sortBy);
    const movies = await Watchlist.find({ userId, customListId: id }).sort(sort).lean();

    return res.status(200).json({
      success: true,
      data: {
        ...list,
        itemCount: movies.length,
        movies,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 9. Update Custom Watchlist Details (Name & Description)
export const updateCustomWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid watchlist ID format',
      });
    }

    const list = await CustomWatchlist.findOne({ _id: id, userId });
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found or access denied',
      });
    }

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Watchlist name cannot be empty',
        });
      }
      if (trimmedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Watchlist name cannot exceed 100 characters',
        });
      }

      // Check collision with another list
      const conflict = await CustomWatchlist.findOne({
        userId,
        name: trimmedName,
        _id: { $ne: id },
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'You already have another watchlist with this name',
        });
      }

      list.name = trimmedName;
    }

    if (description !== undefined) {
      list.description = String(description).trim().slice(0, 500);
    }

    await list.save();

    return res.status(200).json({
      success: true,
      message: 'Watchlist updated successfully',
      data: list,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have another watchlist with this name',
      });
    }
    next(error);
  }
};

// 10. Delete Custom Watchlist (and remove associated list entries)
export const deleteCustomWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid watchlist ID format',
      });
    }

    const list = await CustomWatchlist.findOne({ _id: id, userId });
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found or access denied',
      });
    }

    // Delete custom watchlist and all its movie entries atomically/sequentially
    await Watchlist.deleteMany({ userId, customListId: id });
    await CustomWatchlist.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: 'Custom watchlist and its items deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// 11. Add Movie to Custom Watchlist
export const addMovieToCustomWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid watchlist ID format',
      });
    }

    const customList = await CustomWatchlist.findOne({ _id: id, userId });
    if (!customList) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found or access denied',
      });
    }

    const rawMovieId = req.params.movieId || req.body.movieId;
    const movieId = parseInt(rawMovieId);
    const movieTitle = req.body.movieTitle || req.body.title || 'Movie';
    const posterPath = req.body.posterPath || req.body.poster_path || '';
    const releaseDate = req.body.releaseDate || req.body.release_date || '';
    const voteAverage = Number(req.body.voteAverage || req.body.vote_average) || 0;
    const overview = req.body.overview || '';
    const genres = Array.isArray(req.body.genres)
      ? req.body.genres.map((g) => (typeof g === 'object' ? g.name : String(g)))
      : [];
    const status = VALID_STATUSES.includes(req.body.status) ? req.body.status : 'want_to_watch';

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID is required',
      });
    }

    const existing = await Watchlist.findOne({ userId, movieId, customListId: id });
    if (existing) {
      return res.status(200).json({
        success: true,
        action: 'exists',
        message: 'Movie is already in this custom watchlist',
        data: existing,
      });
    }

    const item = await Watchlist.create({
      userId,
      customListId: id,
      movieId,
      movieTitle,
      posterPath,
      releaseDate,
      voteAverage,
      overview,
      genres,
      status,
      addedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      action: 'added',
      message: `Added to ${customList.name}`,
      data: item,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        action: 'exists',
        message: 'Movie is already in this custom watchlist',
      });
    }
    next(error);
  }
};

// 12. Remove Movie from Custom Watchlist
export const removeMovieFromCustomWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id, movieId: rawMovieId } = req.params;
    const movieId = parseInt(rawMovieId);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid watchlist ID format',
      });
    }

    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID is required',
      });
    }

    const customList = await CustomWatchlist.findOne({ _id: id, userId });
    if (!customList) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found or access denied',
      });
    }

    await Watchlist.deleteOne({ userId, movieId, customListId: id });

    return res.status(200).json({
      success: true,
      message: 'Movie removed from custom watchlist',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateViewingStatus,
  getWatchlistSummary,
  createCustomWatchlist,
  getCustomWatchlists,
  getCustomWatchlistById,
  updateCustomWatchlist,
  deleteCustomWatchlist,
  addMovieToCustomWatchlist,
  removeMovieFromCustomWatchlist,
};
