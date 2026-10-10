export const TMDB_IMAGE_BASE_W500 = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BASE_ORIGINAL = 'https://image.tmdb.org/t/p/original';
export const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

export const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';
export const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920&auto=format&fit=crop&q=80';
export const FALLBACK_PROFILE = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=185&auto=format&fit=crop&q=80';

export const getImageUrl = (path, fallback = FALLBACK_POSTER) => {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${TMDB_IMAGE_BASE_W500}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getBackdropUrl = (path, fallback = FALLBACK_BACKDROP) => {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${TMDB_IMAGE_BASE_ORIGINAL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getProfileUrl = (path, fallback = FALLBACK_PROFILE) => {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${TMDB_PROFILE_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default { getImageUrl, getBackdropUrl, getProfileUrl };
