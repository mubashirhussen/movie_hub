import api from './api';

const unwrapMovieResponse = (response, endpoint) => {
  const payload = response.data?.data ?? response.data;
  if (!payload || !Array.isArray(payload.results)) {
    console.error(`Invalid movie API response from ${endpoint}:`, response.data);
    throw new Error(
      `Invalid movie data received from ${endpoint}. Check the backend response.`
    );
  }
  return payload;
};

export const getPopularMovies = async (page = 1, options = {}) => {
  const response = await api.get('/movies/popular', { params: { page }, ...options });
  return unwrapMovieResponse(response, '/movies/popular');
};

export const getTopRatedMovies = async (page = 1, options = {}) => {
  const response = await api.get('/movies/top-rated', { params: { page }, ...options });
  return unwrapMovieResponse(response, '/movies/top-rated');
};

export const getUpcomingMovies = async (page = 1, options = {}) => {
  const response = await api.get('/movies/upcoming', { params: { page }, ...options });
  return unwrapMovieResponse(response, '/movies/upcoming');
};

export const searchMovies = async (query, page = 1, options = {}) => {
  const response = await api.get('/movies/search', { params: { query, page }, ...options });
  return unwrapMovieResponse(response, '/movies/search');
};

export const getMovieDetails = async (movieId, options = {}) => {
  const response = await api.get(`/movies/${movieId}`, options);
  const payload = response.data?.data ?? response.data;
  if (!payload || typeof payload !== 'object') {
    throw new Error(`Invalid movie details payload for movie #${movieId}`);
  }
  return payload;
};

export const getMovieCast = async (movieId, options = {}) => {
  const response = await api.get(`/movies/${movieId}/cast`, options);
  const payload = response.data?.data ?? response.data;
  return payload?.cast ? payload : { cast: Array.isArray(payload) ? payload : [] };
};

export const getMovieTrailer = async (movieId, options = {}) => {
  const response = await api.get(`/movies/${movieId}/trailer`, options);
  const payload = response.data?.data ?? response.data;
  return payload;
};

export const getMovieProviders = async (movieId, options = {}) => {
  const response = await api.get(`/movies/${movieId}/providers`, options);
  const payload = response.data?.data ?? response.data;
  return payload;
};

export const getSimilarMovies = async (movieId, page = 1, options = {}) => {
  const response = await api.get(`/movies/${movieId}/similar`, { params: { page }, ...options });
  return unwrapMovieResponse(response, `/movies/${movieId}/similar`);
};

export const getMoviesByIndustry = async (industry, page = 1, options = {}) => {
  const response = await api.get(`/movies/category/${encodeURIComponent(industry)}`, {
    params: { page },
    ...options,
  });
  return unwrapMovieResponse(response, '/movies/category');
};

export const trackMovieView = async (movieId, options = {}) => {
  try {
    const response = await api.post(`/movies/${movieId}/view`, {}, options);
    return response.data?.data ?? response.data;
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
