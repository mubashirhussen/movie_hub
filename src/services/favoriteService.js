import api from './api';

export const getFavorites = async () => {
  const response = await api.get('/favorites');
  return response.data?.data || [];
};

export const addToFavorites = async (movieId, movieTitle, posterPath) => {
  const response = await api.post(`/favorites/${movieId}`, { movieTitle, posterPath });
  return response.data;
};

export const removeFromFavorites = async (movieId) => {
  const response = await api.delete(`/favorites/${movieId}`);
  return response.data;
};

export default {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
};
