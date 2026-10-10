export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
export const TMDB_PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

export const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
export const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&auto=format&fit=crop&q=80';
export const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

export const getImageUrl = (path, fallback = FALLBACK_POSTER) => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE_URL}${path}`;
};

export const getBackdropUrl = (path, fallback = FALLBACK_BACKDROP) => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${TMDB_BACKDROP_BASE_URL}${path}`;
};

export const getProfileUrl = (path, fallback = FALLBACK_AVATAR) => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${TMDB_PROFILE_BASE_URL}${path}`;
};

export const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

export const formatRating = (rating) => {
  if (rating === undefined || rating === null) return 'N/A';
  return Number(rating).toFixed(1);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'TBA';
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  } catch {
    return dateStr;
  }
};

export const formatYear = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.split('-')[0] || '';
};

export const formatRuntime = (minutes) => {
  if (!minutes) return 'N/A';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  return `${mins}m`;
};
