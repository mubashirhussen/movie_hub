import tmdbService from '../services/tmdbService.js';
import MovieView from '../models/MovieView.js';
import { getDBStatus } from '../config/db.js';

// In-memory view count fallback
const inMemoryViews = new Map();

// 1. Get Popular Movies
export const getPopular = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
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
    const page = parseInt(req.query.page) || 1;
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
    const page = parseInt(req.query.page) || 1;
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
    const page = parseInt(req.query.page) || 1;
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
    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }

    const movie = await tmdbService.getMovieDetails(movieId);

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
    const videos = await tmdbService.getMovieVideos(movieId);

    const trailer =
      videos.results?.find(
        (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      ) || videos.results?.[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        trailer,
        allVideos: videos.results || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// 8. Get Watch Providers (Region = IN with fallback)
export const getMovieProviders = async (req, res, next) => {
  try {
    const movieId = parseInt(req.params.id);
    const providers = await tmdbService.getWatchProviders(movieId);
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
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getMoviesByIndustry(industry, page);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getPopular,
  getTopRated,
  getUpcoming,
  search,
  getMovieDetails,
  getMovieCast,
  getMovieTrailer,
  getMovieProviders,
  getSimilarMovies,
  incrementMovieView,
  getByIndustry,
};
