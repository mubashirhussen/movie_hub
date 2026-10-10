import api from './api';

export const getWatchlist = async () => {
  const response = await api.get('/watchlist');
  return response.data?.data || [];
};

export const addToWatchlist = async (movieId, movieTitle, posterPath) => {
  const response = await api.post(`/watchlist/${movieId}`, { movieTitle, posterPath });
  return response.data;
};

export const removeFromWatchlist = async (movieId) => {
  const response = await api.delete(`/watchlist/${movieId}`);
  return response.data;
};

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};
