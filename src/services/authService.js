import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await api.put('/users/profile', userData);
  return response.data;
};

export const getHistory = async () => {
  const response = await api.get('/users/history');
  return response.data;
};

export const addToHistory = async (movieId, movieTitle, posterPath) => {
  const response = await api.post(`/users/history/${movieId}`, { movieTitle, posterPath });
  return response.data;
};

export const removeFromHistory = async (movieId) => {
  const response = await api.delete(`/users/history/${movieId}`);
  return response.data;
};

export default {
  login,
  register,
  getMe,
  getProfile,
  updateProfile,
  getHistory,
  addToHistory,
  removeFromHistory,
};
