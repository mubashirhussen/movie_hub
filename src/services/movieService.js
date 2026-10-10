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

export const getNowPlayingMovies = async (page = 1, options = {}) => {
  const response = await api.get('/movies/now-playing', { params: { page }, ...options });
  return unwrapMovieResponse(response, '/movies/now-playing');
};

export const getGenres = async (options = {}) => {
  const response = await api.get('/movies/genres', options);
  const payload = response.data?.data ?? response.data;
  return payload?.genres ? payload : { genres: Array.isArray(payload) ? payload : [] };
};

export const discoverMovies = async (
  { genre = null, sortBy = 'popularity.desc', year = null, industry = null, page = 1 } = {},
  options = {}
) => {
  const params = { page, sortBy };
  if (genre) params.genre = genre;
  if (year) params.year = year;
  if (industry) params.industry = industry;

  const response = await api.get('/movies/discover', { params, ...options });
  return unwrapMovieResponse(response, '/movies/discover');
};

export const searchPeople = async (query, page = 1, options = {}) => {
  const response = await api.get('/people/search', { params: { query, page }, ...options });
  const payload = response.data?.data ?? response.data;
  return payload;
};

export const getPersonMovies = async (personId, page = 1, options = {}) => {
  const response = await api.get(`/people/${personId}/movies`, { params: { page }, ...options });
  return unwrapMovieResponse(response, `/people/${personId}/movies`);
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
  getNowPlayingMovies,
  getGenres,
  discoverMovies,
  searchMovies,
  searchPeople,
  getPersonMovies,
  getMovieDetails,
  getMovieCast,
  getMovieTrailer,
  getMovieProviders,
  getSimilarMovies,
  getMoviesByIndustry,
  trackMovieView,
};
