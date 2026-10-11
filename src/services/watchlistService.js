import api from './api';

// 1. Get user default watchlist (optionally filtered by status and sorted)
export const getWatchlist = async (options = {}) => {
  const params = new URLSearchParams();
  if (options.status) params.append('status', options.status);
  if (options.sortBy) params.append('sortBy', options.sortBy);

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/watchlist${query}`);
  return response.data?.data || [];
};

// 2. Add or toggle movie in default watchlist
export const addToWatchlist = async (movieId, movieTitle, posterPath, options = {}) => {
  const payload = {
    movieId,
    movieTitle,
    posterPath,
    status: options.status || 'want_to_watch',
    releaseDate: options.releaseDate || options.release_date || '',
    voteAverage: options.voteAverage || options.vote_average || 0,
    overview: options.overview || '',
    genres: options.genres || [],
    ...options,
  };
  const response = await api.post(`/watchlist/${movieId}`, payload);
  return response.data;
};

// 3. Remove movie from default watchlist
export const removeFromWatchlist = async (movieId) => {
  const response = await api.delete(`/watchlist/${movieId}`);
  return response.data;
};

// 4. Update movie viewing status (Want to Watch, Watching, Watched)
export const updateViewingStatus = async (movieId, status) => {
  const response = await api.patch(`/watchlist/${movieId}/status`, { status });
  return response.data;
};

// 5. Get overall watchlist summary (counts by viewing status & custom lists)
export const getWatchlistSummary = async () => {
  const response = await api.get('/watchlist/summary');
  return response.data?.data || { defaultLists: [], customLists: [], totalDefaultCount: 0 };
};

// 6. Custom Watchlists Operations
export const getCustomWatchlists = async () => {
  const response = await api.get('/watchlist/custom');
  return response.data?.data || [];
};

export const createCustomWatchlist = async (name, description = '') => {
  const response = await api.post('/watchlist/custom', { name, description });
  return response.data;
};

export const getCustomWatchlist = async (id, sortBy = 'date_added') => {
  const response = await api.get(`/watchlist/custom/${id}?sortBy=${sortBy}`);
  return response.data?.data || null;
};

export const updateCustomWatchlist = async (id, data) => {
  const response = await api.patch(`/watchlist/custom/${id}`, data);
  return response.data;
};

export const deleteCustomWatchlist = async (id) => {
  const response = await api.delete(`/watchlist/custom/${id}`);
  return response.data;
};

export const addMovieToCustomWatchlist = async (id, movieData) => {
  const response = await api.post(`/watchlist/custom/${id}/movies`, movieData);
  return response.data;
};

export const removeMovieFromCustomWatchlist = async (id, movieId) => {
  const response = await api.delete(`/watchlist/custom/${id}/movies/${movieId}`);
  return response.data;
};

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateViewingStatus,
  getWatchlistSummary,
  getCustomWatchlists,
  createCustomWatchlist,
  getCustomWatchlist,
  updateCustomWatchlist,
  deleteCustomWatchlist,
  addMovieToCustomWatchlist,
  removeMovieFromCustomWatchlist,
};
