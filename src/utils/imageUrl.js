export const TMDB_IMAGE_BASE_W500 = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BASE_ORIGINAL = 'https://image.tmdb.org/t/p/original';
export const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

/**
 * Generate a clean, responsive SVG poster placeholder with the movie's title
 * Prevents broken image containers and avoids unrelated video thumbnails.
 */
export const getPlaceholderPosterSvg = (title = 'Movie') => {
  const safeTitle = String(title || 'Movie')
    .replace(/[<>&"']/g, '')
    .slice(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750" width="500" height="750">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#141724"/>
        <stop offset="50%" stop-color="#1e2238"/>
        <stop offset="100%" stop-color="#0b0d14"/>
      </linearGradient>
    </defs>
    <rect width="500" height="750" fill="url(#g)"/>
    <circle cx="250" cy="300" r="64" fill="#2d334d" opacity="0.5"/>
    <path d="M232 272 L282 300 L232 328 Z" fill="#ec4899" opacity="0.9"/>
    <text x="250" y="420" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="26" font-weight="700" fill="#f8fafc" text-anchor="middle">${safeTitle}</text>
    <text x="250" y="460" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="15" fill="#94a3b8" text-anchor="middle">Artwork Unavailable</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const FALLBACK_POSTER = getPlaceholderPosterSvg('CineVerse');
export const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920&auto=format&fit=crop&q=80';
export const FALLBACK_PROFILE = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=185&auto=format&fit=crop&q=80';

/**
 * Normalize and return a full TMDB poster URL.
 * Handles null, undefined, empty strings, and absolute HTTP URLs safely.
 */
export const getImageUrl = (path, titleOrFallback = FALLBACK_POSTER) => {
  const fallback = typeof titleOrFallback === 'string' && titleOrFallback.startsWith('data:')
    ? titleOrFallback
    : (typeof titleOrFallback === 'string' && !titleOrFallback.startsWith('http')
      ? getPlaceholderPosterSvg(titleOrFallback)
      : (titleOrFallback || FALLBACK_POSTER));

  if (!path || typeof path !== 'string') return fallback;

  const trimmed = path.trim();
  if (
    trimmed === '' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed.toLowerCase().includes('null')
  ) {
    return fallback;
  }

  // Already an absolute HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Standard TMDB image hash path
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${TMDB_IMAGE_BASE_W500}${normalizedPath}`;
};

/**
 * Normalize and return a full TMDB backdrop URL.
 */
export const getBackdropUrl = (path, fallback = FALLBACK_BACKDROP) => {
  if (!path || typeof path !== 'string') return fallback;

  const trimmed = path.trim();
  if (
    trimmed === '' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed.toLowerCase().includes('null')
  ) {
    return fallback;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${TMDB_IMAGE_BASE_ORIGINAL}${normalizedPath}`;
};

/**
 * Normalize and return a full TMDB cast/profile avatar URL.
 */
export const getProfileUrl = (path, fallback = FALLBACK_PROFILE) => {
  if (!path || typeof path !== 'string') return fallback;

  const trimmed = path.trim();
  if (
    trimmed === '' ||
    trimmed === 'null' ||
    trimmed === 'undefined' ||
    trimmed.toLowerCase().includes('null')
  ) {
    return fallback;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${TMDB_PROFILE_BASE}${normalizedPath}`;
};

export default { getImageUrl, getBackdropUrl, getProfileUrl, getPlaceholderPosterSvg };
