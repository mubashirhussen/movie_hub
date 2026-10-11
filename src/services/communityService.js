import api from './api';

const communityService = {
  // 1. Get Ratings stats & current user's rating
  getMovieRatings: async (movieId) => {
    const res = await api.get(`/movies/${movieId}/ratings`);
    return res.data?.data || res.data;
  },

  // 2. Submit or update user rating (1-5)
  submitRating: async (movieId, rating) => {
    const res = await api.post(`/movies/${movieId}/ratings`, { rating });
    return res.data?.data || res.data;
  },

  // 3. Remove user rating
  deleteRating: async (movieId) => {
    const res = await api.delete(`/movies/${movieId}/ratings`);
    return res.data?.data || res.data;
  },

  // 4. Get Reviews list with sorting & pagination
  getMovieReviews: async (movieId, { page = 1, limit = 10, sort = 'newest' } = {}) => {
    const res = await api.get(`/movies/${movieId}/reviews`, {
      params: { page, limit, sort },
    });
    return res.data?.data || res.data;
  },

  // 5. Submit new review
  createReview: async (movieId, { reviewText, rating, isSpoiler = false }) => {
    const res = await api.post(`/movies/${movieId}/reviews`, {
      reviewText,
      rating,
      isSpoiler,
    });
    return res.data?.data || res.data;
  },

  // 6. Update existing review
  updateReview: async (reviewId, { reviewText, rating, isSpoiler }) => {
    const res = await api.put(`/reviews/${reviewId}`, {
      reviewText,
      rating,
      isSpoiler,
    });
    return res.data?.data || res.data;
  },

  // 7. Delete review
  deleteReview: async (reviewId) => {
    const res = await api.delete(`/reviews/${reviewId}`);
    return res.data;
  },

  // 8. Toggle helpful vote
  toggleHelpful: async (reviewId) => {
    const res = await api.post(`/reviews/${reviewId}/helpful`);
    return res.data?.data || res.data;
  },

  // 9. Report review
  reportReview: async (reviewId, { reason, details = '' }) => {
    const res = await api.post(`/reviews/${reviewId}/report`, { reason, details });
    return res.data;
  },
};

export default communityService;
