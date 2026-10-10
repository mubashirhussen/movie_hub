import { dbQuery, dbRun, dbGet } from '../config/db.js';

// Get all watchlist or favorite items for the authenticated user
export const getWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query; // 'watchlist' or 'favorite' or all

    let sql = 'SELECT * FROM watchlist WHERE user_id = ? ORDER BY created_at DESC';
    const params = [userId];

    if (type) {
      sql = 'SELECT * FROM watchlist WHERE user_id = ? AND type = ? ORDER BY created_at DESC';
      params.push(type);
    }

    const items = await dbQuery(sql, params);
    return res.status(200).json({ items });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return res.status(500).json({ message: 'Internal server error fetching watchlist.' });
  }
};

// Add movie to watchlist or favorites
export const addToWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { movieId, title, posterPath, backdropPath, voteAverage, releaseDate, overview, type = 'watchlist' } = req.body;

    if (!movieId || !title) {
      return res.status(400).json({ message: 'Movie ID and title are required.' });
    }

    // Check if already in watchlist
    const existing = await dbGet(
      'SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ? AND type = ?',
      [userId, movieId, type]
    );

    if (existing) {
      return res.status(200).json({ message: `Movie is already in your ${type}.`, id: existing.id });
    }

    const result = await dbRun(
      `INSERT INTO watchlist (user_id, movie_id, title, poster_path, backdrop_path, vote_average, release_date, overview, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, movieId, title, posterPath || null, backdropPath || null, voteAverage || 0, releaseDate || '', overview || '', type]
    );

    return res.status(201).json({
      message: `Movie successfully added to ${type}!`,
      item: {
        id: result.id,
        user_id: userId,
        movie_id: movieId,
        title,
        poster_path: posterPath,
        backdrop_path: backdropPath,
        vote_average: voteAverage,
        release_date: releaseDate,
        overview,
        type
      }
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return res.status(500).json({ message: 'Internal server error adding to watchlist.' });
  }
};

// Remove movie from watchlist or favorites
export const removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { movieId } = req.params;
    const { type = 'watchlist' } = req.query;

    await dbRun(
      'DELETE FROM watchlist WHERE user_id = ? AND movie_id = ? AND type = ?',
      [userId, movieId, type]
    );

    return res.status(200).json({ message: `Movie removed from ${type}.` });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return res.status(500).json({ message: 'Internal server error removing from watchlist.' });
  }
};

// Check if a movie is saved by the current user
export const checkWatchlistStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { movieId } = req.params;

    const items = await dbQuery(
      'SELECT type FROM watchlist WHERE user_id = ? AND movie_id = ?',
      [userId, movieId]
    );

    const isWatchlist = items.some(i => i.type === 'watchlist');
    const isFavorite = items.some(i => i.type === 'favorite');

    return res.status(200).json({
      isWatchlist,
      isFavorite
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
