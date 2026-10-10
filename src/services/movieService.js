import api from './api';

export const getPopularMovies = async (page = 1) => {
  const response = await api.get('/movies/popular', { params: { page } });
  return response.data?.data || response.data;
};

export const getTopRatedMovies = async (page = 1) => {
  const response = await api.get('/movies/top-rated', { params: { page } });
  return response.data?.data || response.data;
};

export const getUpcomingMovies = async (page = 1) => {
  const response = await api.get('/movies/upcoming', { params: { page } });
  return response.data?.data || response.data;
};

export const searchMovies = async (query, page = 1) => {
  const response = await api.get('/movies/search', { params: { query, page } });
  return response.data?.data || response.data;
};

export const getMovieDetails = async (movieId) => {
  const response = await api.get(`/movies/${movieId}`);
  return response.data?.data || response.data;
};

export const getMovieCast = async (movieId) => {
  const response = await api.get(`/movies/${movieId}/cast`);
  return response.data?.data || response.data;
};

export const getMovieTrailer = async (movieId) => {
  const response = await api.get(`/movies/${movieId}/trailer`);
  return response.data?.data || response.data;
};

export const getMovieProviders = async (movieId) => {
  const response = await api.get(`/movies/${movieId}/providers`);
  return response.data?.data || response.data;
};

export const getSimilarMovies = async (movieId, page = 1) => {
  const response = await api.get(`/movies/${movieId}/similar`, { params: { page } });
  return response.data?.data || response.data;
};

export const getMoviesByIndustry = async (industry, page = 1) => {
  const response = await api.get(`/movies/category/${encodeURIComponent(industry)}`, { params: { page } });
  return response.data?.data || response.data;
};

export const trackMovieView = async (movieId) => {
  try {
    const response = await api.post(`/movies/${movieId}/view`);
    return response.data;
  } catch {
    return null;
  }
};

export default {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  searchMovies,
  getMovieDetails,
  getMovieCast,
  getMovieTrailer,
  getMovieProviders,
  getSimilarMovies,
  getMoviesByIndustry,
  trackMovieView,
};
