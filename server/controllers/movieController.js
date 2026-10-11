import tmdbService from '../services/tmdbService.js';
import MovieView from '../models/MovieView.js';
import { getDBStatus } from '../config/db.js';

// In-memory view count fallback
const inMemoryViews = new Map();

// Helper to sanitize page numbers safely between 1 and 500
export const parseSafePage = (raw) => Math.max(1, Math.min(parseInt(raw) || 1, 500));

// 1. Get Popular Movies
export const getPopular = async (req, res, next) => {
  try {
    const page = parseSafePage(req.query.page);
    const data = await tmdbService.getPopularMovies(page);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Top Rated Movies
export const getTopRated = async (req, res, next) => {
  try {
    const page = parseSafePage(req.query.page);
    const data = await tmdbService.getTopRatedMovies(page);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Upcoming Movies
export const getUpcoming = async (req, res, next) => {
  try {
    const page = parseSafePage(req.query.page);
    const data = await tmdbService.getUpcomingMovies(page);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Search Movies
export const search = async (req, res, next) => {
  try {
    const query = req.query.query || '';
    const page = parseSafePage(req.query.page);
    const data = await tmdbService.searchMovies(query, page);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get Movie Details (attaches app views)
export const getMovieDetails = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id);
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }

    const movie = await tmdbService.getMovieDetails(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Retrieve application views
    let appViews = 1;
    if (getDBStatus()) {
      const viewRecord = await MovieView.findOne({ movieId });
      if (viewRecord) appViews = viewRecord.views;
    } else {
      appViews = inMemoryViews.get(movieId) || 1;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...movie,
        applicationViews: appViews,
        viewCount: appViews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 6. Get Cast & Credits
export const getMovieCast = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id);
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }
    const credits = await tmdbService.getMovieCredits(movieId);
    return res.status(200).json({
      success: true,
      data: credits,
    });
  } catch (error) {
    next(error);
  }
};

// 7. Get Trailer / Videos
export const getMovieTrailer = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id);
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }

    const isTvRoute = (req.baseUrl && req.baseUrl.includes('/tv')) || req.query.type === 'tv';
    const type = isTvRoute ? 'tv' : 'movie';
    const language = req.query.language || 'en-US';
    const videos = await tmdbService.getMovieVideos(movieId, type, language);

    const trailer = videos.trailer || (tmdbService.selectBestTrailer ? tmdbService.selectBestTrailer(videos.results, language) : null);

    return res.status(200).json({
      success: true,
      data: {
        movieId,
        type,
        trailer,
        hasTrailer: Boolean(trailer?.key),
        grouped: videos.grouped || {
          trailers: [],
          teasers: [],
          finalTrailers: [],
          announcements: [],
          clips: [],
          featurettes: [],
          behindTheScenes: [],
          all: [],
        },
        allVideos: videos.allVideos || videos.results || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// 8. Get Watch Providers (Region-aware and Content-Type Aware)
export const getMovieProviders = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id);
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }
    const region = (req.query.region || 'IN').toUpperCase();
    const isTvRoute = (req.baseUrl && req.baseUrl.includes('/tv')) || req.query.type === 'tv';
    const type = isTvRoute ? 'tv' : 'movie';
    const providers = await tmdbService.getWatchProviders(movieId, region, type);
    return res.status(200).json({
      success: true,
      data: providers,
    });
  } catch (error) {
    next(error);
  }
};

// 9. Get Similar Movies
export const getSimilarMovies = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id);
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }
    const page = parseInt(req.query.page) || 1;
    const similar = await tmdbService.getSimilarMovies(movieId, page);
    return res.status(200).json({
      success: true,
      data: similar,
    });
  } catch (error) {
    next(error);
  }
};

// 9b. Get Recommendations
export const getMovieRecommendations = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id);
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }
    const page = parseInt(req.query.page) || 1;
    const recommendations = await tmdbService.getRecommendations(movieId, page);
    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
};

// 10. Increment Movie Application View Count
export const incrementMovieView = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id);
    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID',
      });
    }

    let updatedViews = 1;

    if (getDBStatus()) {
      const record = await MovieView.findOneAndUpdate(
        { movieId },
        { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } },
        { upsert: true, new: true }
      );
      updatedViews = record.views;
    } else {
      const current = inMemoryViews.get(movieId) || 0;
      updatedViews = current + 1;
      inMemoryViews.set(movieId, updatedViews);
    }

    return res.status(200).json({
      success: true,
      message: 'View tracked successfully',
      data: {
        movieId,
        views: updatedViews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 11. Get Movies by Industry Category
export const getByIndustry = async (req, res, next) => {
  try {
    const industry = req.params.industry || req.query.industry || 'Tollywood';
    const page = parseSafePage(req.query.page);
    const data = await tmdbService.getMoviesByIndustry(industry, page);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 12. Get Now Playing Movies
export const getNowPlaying = async (req, res, next) => {
  try {
    const page = parseSafePage(req.query.page);
    const data = await tmdbService.getNowPlayingMovies(page);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 13. Get Movie Genres
export const getGenres = async (req, res, next) => {
  try {
    const data = await tmdbService.getGenres();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 14. Discover Movies (Genre, Year, Year Range, Language, Rating, Runtime, Industry, Sorting, Pagination)
export const discover = async (req, res, next) => {
  try {
    const {
      genre,
      sortBy,
      sort_by,
      year,
      yearMin,
      year_min,
      yearMax,
      year_max,
      language,
      with_original_language,
      minRating,
      min_rating,
      minRuntime,
      min_runtime,
      maxRuntime,
      max_runtime,
      industry,
    } = req.query;

    const page = parseSafePage(req.query.page);

    const data = await tmdbService.discoverMovies({
      genre: genre ? String(genre).trim() : null,
      sortBy: (sortBy || sort_by) ? String(sortBy || sort_by).trim() : 'popularity.desc',
      year: year ? parseInt(year) : null,
      yearMin: (yearMin || year_min) ? parseInt(yearMin || year_min) : null,
      yearMax: (yearMax || year_max) ? parseInt(yearMax || year_max) : null,
      language: (language || with_original_language) ? String(language || with_original_language).trim() : null,
      minRating: (minRating || min_rating) ? parseFloat(minRating || min_rating) : null,
      minRuntime: (minRuntime || min_runtime) ? parseInt(minRuntime || min_runtime) : null,
      maxRuntime: (maxRuntime || max_runtime) ? parseInt(maxRuntime || max_runtime) : null,
      industry: industry ? String(industry).trim() : null,
      page,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// 15. Operational Cache Health & Statistics
export const getCacheStats = (req, res) => {
  const stats = tmdbService.getCacheStats();
  return res.status(200).json({
    success: true,
    data: stats,
  });
};

// 16. Operational Cache Invalidation
export const clearCache = (req, res) => {
  tmdbService.clearCache();
  return res.status(200).json({
    success: true,
    message: 'TMDB movie cache flushed successfully',
  });
};

export default {
  getPopular,
  getTopRated,
  getUpcoming,
  getNowPlaying,
  getGenres,
  discover,
  search,
  getMovieDetails,
  getMovieCast,
  getMovieTrailer,
  getMovieProviders,
  getSimilarMovies,
  incrementMovieView,
  getByIndustry,
  getCacheStats,
  clearCache,
};
