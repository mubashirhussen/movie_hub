import axios from 'axios';
import { dbQuery, dbGet, dbRun } from '../config/db.js';
import { seedMovies } from '../data/seedMovies.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_TMDB_API_KEY = process.env.TMDB_API_KEY || 'c45a857c193f6302f2b5061c3b85e743';

const getApiKey = (req) => {
  return req.query.api_key || req.headers['x-tmdb-key'] || DEFAULT_TMDB_API_KEY;
};

// Helper to format DB movie row to JSON API standard
const formatDbMovie = (row) => {
  if (!row) return null;
  return {
    ...row,
    genres: typeof row.genres === 'string' ? JSON.parse(row.genres || '[]') : row.genres,
    stream_providers: typeof row.stream_providers === 'string' ? JSON.parse(row.stream_providers || '[]') : row.stream_providers,
    cast: typeof row.cast_json === 'string' ? JSON.parse(row.cast_json || '[]') : row.cast_json,
    genre_ids: []
  };
};

// Unified Movies Catalog with Industry, Decade, Genre, and Sorting filters
export const getMoviesCatalog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { industry, decade, genre, sortBy = 'popularity_desc', search } = req.query;

    let conditions = [];
    let params = [];

    if (industry && industry !== 'All') {
      conditions.push('industry = ?');
      params.push(industry);
    }

    if (decade && decade !== 'All') {
      conditions.push('decade = ?');
      params.push(decade);
    }

    if (genre && genre !== 'All') {
      conditions.push('genres LIKE ?');
      params.push(`%"${genre}"%`);
    }

    if (search && search.trim()) {
      conditions.push('(title LIKE ? OR overview LIKE ? OR director LIKE ? OR cast_json LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderClause = 'ORDER BY popularity DESC';
    if (sortBy === 'rating_desc') orderClause = 'ORDER BY vote_average DESC, vote_count DESC';
    if (sortBy === 'rating_asc') orderClause = 'ORDER BY vote_average ASC';
    if (sortBy === 'year_desc') orderClause = 'ORDER BY release_year DESC, release_date DESC';
    if (sortBy === 'year_asc') orderClause = 'ORDER BY release_year ASC, release_date ASC';
    if (sortBy === 'runtime_desc') orderClause = 'ORDER BY runtime DESC';

    // Count query
    const countResult = await dbGet(`SELECT COUNT(*) as total FROM movies ${whereClause}`, params);
    const totalResults = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(totalResults / limit) || 1;

    // Offset
    const offset = (page - 1) * limit;
    const querySql = `SELECT * FROM movies ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
    const rows = await dbQuery(querySql, [...params, limit, offset]);

    return res.status(200).json({
      page,
      results: rows.map(formatDbMovie),
      total_pages: totalPages,
      total_results: totalResults
    });
  } catch (error) {
    console.error('Error in getMoviesCatalog:', error);
    return res.status(500).json({ message: 'Internal server error in movie catalog.' });
  }
};

// Get Popular Movies (falls back to DB catalog)
export const getPopularMovies = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const apiKey = getApiKey(req);

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: { api_key: apiKey, language: 'en-US', page },
      timeout: 4000
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.warn('TMDB Popular API failed, serving from SQLite database:', error.message);
    const offset = (page - 1) * 12;
    const rows = await dbQuery('SELECT * FROM movies ORDER BY popularity DESC LIMIT 12 OFFSET ?', [offset]);
    const count = await dbGet('SELECT COUNT(*) as total FROM movies');
    return res.status(200).json({
      page,
      results: rows.map(formatDbMovie),
      total_pages: Math.ceil(count.total / 12) || 1,
      total_results: count.total
    });
  }
};

// Get Top Rated Movies
export const getTopRatedMovies = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const apiKey = getApiKey(req);

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/top_rated`, {
      params: { api_key: apiKey, language: 'en-US', page },
      timeout: 4000
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.warn('TMDB Top Rated API failed, serving from SQLite database:', error.message);
    const offset = (page - 1) * 12;
    const rows = await dbQuery('SELECT * FROM movies ORDER BY vote_average DESC, vote_count DESC LIMIT 12 OFFSET ?', [offset]);
    const count = await dbGet('SELECT COUNT(*) as total FROM movies');
    return res.status(200).json({
      page,
      results: rows.map(formatDbMovie),
      total_pages: Math.ceil(count.total / 12) || 1,
      total_results: count.total
    });
  }
};

// Get Upcoming Movies
export const getUpcomingMovies = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const apiKey = getApiKey(req);

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
      params: { api_key: apiKey, language: 'en-US', page },
      timeout: 4000
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.warn('TMDB Upcoming API failed, serving from SQLite database:', error.message);
    const offset = (page - 1) * 12;
    const rows = await dbQuery('SELECT * FROM movies ORDER BY release_year DESC, release_date DESC LIMIT 12 OFFSET ?', [offset]);
    const count = await dbGet('SELECT COUNT(*) as total FROM movies');
    return res.status(200).json({
      page,
      results: rows.map(formatDbMovie),
      total_pages: Math.ceil(count.total / 12) || 1,
      total_results: count.total
    });
  }
};

// Search Movies
export const searchMovies = async (req, res) => {
  const { query } = req.query;
  const page = parseInt(req.query.page) || 1;
  const apiKey = getApiKey(req);

  if (!query || query.trim() === '') {
    return res.status(400).json({ message: 'Search query is required.' });
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: { api_key: apiKey, language: 'en-US', query: query.trim(), page },
      timeout: 4000
    });
    if (response.data.results && response.data.results.length > 0) {
      return res.status(200).json(response.data);
    }
    throw new Error('Empty TMDB results, searching local DB');
  } catch (error) {
    console.warn('Searching in local SQLite database for:', query);
    const searchTerm = `%${query.trim()}%`;
    const offset = (page - 1) * 12;
    const rows = await dbQuery(
      `SELECT * FROM movies 
       WHERE title LIKE ? OR original_title LIKE ? OR overview LIKE ? OR industry LIKE ? OR director LIKE ? OR cast_json LIKE ?
       ORDER BY popularity DESC LIMIT 12 OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, offset]
    );

    const countResult = await dbGet(
      `SELECT COUNT(*) as total FROM movies 
       WHERE title LIKE ? OR original_title LIKE ? OR overview LIKE ? OR industry LIKE ? OR director LIKE ? OR cast_json LIKE ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    return res.status(200).json({
      page,
      results: rows.map(formatDbMovie),
      total_pages: Math.ceil((countResult?.total || 0) / 12) || 1,
      total_results: countResult?.total || 0
    });
  }
};

// Get Movie Details
export const getMovieDetails = async (req, res) => {
  const { id } = req.params;
  const apiKey = getApiKey(req);

  // Check local database first if integer id matches seed dataset
  try {
    const localMovie = await dbGet('SELECT * FROM movies WHERE id = ?', [id]);
    if (localMovie) {
      const formatted = formatDbMovie(localMovie);
      return res.status(200).json({
        ...formatted,
        genres: formatted.genres.map((g, idx) => ({ id: idx + 1, name: g })),
        videos: {
          results: formatted.trailer_key ? [
            { key: formatted.trailer_key, name: 'Official Trailer', site: 'YouTube', type: 'Trailer' }
          ] : []
        }
      });
    }
  } catch (err) {
    console.warn('DB lookup error:', err.message);
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: { api_key: apiKey, language: 'en-US', append_to_response: 'videos,recommendations' },
      timeout: 4000
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.warn('TMDB Movie Details API failed, fallback to first seed movie:', error.message);
    const found = seedMovies.find(m => m.id.toString() === id.toString()) || seedMovies[0];
    return res.status(200).json({
      ...found,
      genres: found.genres.map((g, idx) => ({ id: idx + 1, name: g })),
      status: 'Released',
      videos: {
        results: [{ key: found.trailer_key || 'dQw4w9WgXcQ', name: 'Official Trailer', site: 'YouTube', type: 'Trailer' }]
      }
    });
  }
};

// Get Movie Cast Details
export const getMovieCredits = async (req, res) => {
  const { id } = req.params;
  const apiKey = getApiKey(req);

  // Check local database first
  try {
    const localMovie = await dbGet('SELECT cast_json, director FROM movies WHERE id = ?', [id]);
    if (localMovie && localMovie.cast_json) {
      const cast = JSON.parse(localMovie.cast_json);
      return res.status(200).json({
        id: parseInt(id),
        cast: cast,
        crew: localMovie.director ? [{ id: 999, name: localMovie.director, job: 'Director' }] : []
      });
    }
  } catch (err) {
    console.warn('DB cast lookup error:', err.message);
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}/credits`, {
      params: { api_key: apiKey, language: 'en-US' },
      timeout: 4000
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.warn('TMDB Movie Credits API failed, fallback:', error.message);
    const found = seedMovies.find(m => m.id.toString() === id.toString()) || seedMovies[0];
    return res.status(200).json({
      id: parseInt(id),
      cast: found.cast || [],
      crew: [{ id: 999, name: found.director || 'Director', job: 'Director' }]
    });
  }
};

// Get Similar / Recommended Movies
export const getSimilarMovies = async (req, res) => {
  const { id } = req.params;

  try {
    const movie = await dbGet('SELECT * FROM movies WHERE id = ?', [id]);
    if (movie) {
      const similar = await dbQuery(
        'SELECT * FROM movies WHERE industry = ? AND id != ? ORDER BY vote_average DESC LIMIT 6',
        [movie.industry, id]
      );
      return res.status(200).json({ results: similar.map(formatDbMovie) });
    }

    const fallback = await dbQuery('SELECT * FROM movies LIMIT 6');
    return res.status(200).json({ results: fallback.map(formatDbMovie) });
  } catch (error) {
    console.error('Error fetching similar movies:', error);
    return res.status(500).json({ message: 'Error fetching recommendations.' });
  }
};

// Reviews Controller
export const getMovieReviews = async (req, res) => {
  const { id } = req.params;

  try {
    const reviews = await dbQuery(
      'SELECT * FROM reviews WHERE movie_id = ? ORDER BY created_at DESC',
      [id]
    );
    return res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ message: 'Error fetching reviews.' });
  }
};

export const addMovieReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;
  const userName = req.user.name;

  if (!rating || !comment) {
    return res.status(400).json({ message: 'Rating (1-10) and comment are required.' });
  }

  const numRating = Math.max(1, Math.min(10, parseInt(rating)));

  try {
    const result = await dbRun(
      'INSERT INTO reviews (movie_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [id, userId, userName, numRating, comment.trim()]
    );

    return res.status(201).json({
      message: 'Review posted successfully!',
      review: {
        id: result.id,
        movie_id: parseInt(id),
        user_id: userId,
        user_name: userName,
        rating: numRating,
        comment: comment.trim(),
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ message: 'Error posting review.' });
  }
};
