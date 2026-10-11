import axios from 'axios';
import dotenv from 'dotenv';
import { seedMovies } from '../data/seedMovies.js';
import { getIndustryConfig } from '../config/industryConfig.js';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.warn('⚠️ [TMDB] TMDB_API_KEY is not defined in environment variables. Running in resilient local/demo catalog mode.');
}

// 1. Centralized Axios HTTP Client with Timeout & Headers
const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 4000,
  headers: {
    Accept: 'application/json',
    'User-Agent': 'CineVerse-Client/2.0',
  },
});

// 2. Differentiated Cache TTLs (milliseconds)
export const CACHE_TTLS = {
  GENRES: 24 * 60 * 60 * 1000,   // 24 hours (static taxonomy)
  DETAILS: 12 * 60 * 60 * 1000,  // 12 hours (movie details, credits, trailers)
  PROVIDERS: 6 * 60 * 60 * 1000, // 6 hours (streaming providers)
  CATALOG: 30 * 60 * 1000,       // 30 minutes (popular, top-rated, upcoming, now-playing, industry)
  DISCOVERY: 15 * 60 * 1000,     // 15 minutes (multi-filter discover queries)
  SEARCH: 10 * 60 * 1000,        // 10 minutes (keyword queries)
};

const MAX_CACHE_ENTRIES = 1500;
const cache = new Map();

// In-Flight Request Deduplication Map (Promise Sharing)
const inFlightRequests = new Map();

// Operational Cache & Reliability Metrics
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  evictions: 0,
  dedupedRequests: 0,
};

// Rate Limit & Circuit Breaker Tracking
let rateLimitCooldownUntil = 0;

// Sanitize error strings to avoid exposing API keys in logs
const sanitizeErrorMsg = (err) => {
  if (!err) return 'Unknown upstream error';
  const raw = err.message || String(err);
  return raw.replace(/api_key=[^&]+/gi, 'api_key=[REDACTED]');
};

// Safe Cache Access with Expiration Check
export const getFromCache = (key) => {
  const item = cache.get(key);
  if (!item) {
    cacheMetrics.misses++;
    return null;
  }
  if (Date.now() > item.expiry) {
    cache.delete(key);
    cacheMetrics.misses++;
    return null;
  }
  cacheMetrics.hits++;
  return item.data;
};

// Safe Cache Insertion with Capacity Management (LRU-like eviction of expired or oldest entry)
export const setInCache = (key, data, ttlMs = CACHE_TTLS.CATALOG) => {
  // If approaching size limit, purge expired entries first
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const now = Date.now();
    for (const [k, val] of cache.entries()) {
      if (now > val.expiry) {
        cache.delete(k);
      }
    }
    // If still at capacity, evict the oldest inserted key
    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
        cacheMetrics.evictions++;
      }
    }
  }

  cache.set(key, { data, expiry: Date.now() + ttlMs, createdAt: Date.now() });
  cacheMetrics.sets++;
};

// Cache Invalidation Utilities
export const clearCache = () => {
  cache.clear();
  inFlightRequests.clear();
};

export const invalidateCache = (patternOrKey) => {
  if (typeof patternOrKey === 'string') {
    if (patternOrKey.includes('*')) {
      const prefix = patternOrKey.replace('*', '');
      for (const k of cache.keys()) {
        if (k.startsWith(prefix)) cache.delete(k);
      }
    } else {
      cache.delete(patternOrKey);
    }
  }
};

export const invalidateMovie = (movieId) => {
  const idStr = String(movieId);
  for (const k of cache.keys()) {
    if (k.includes(`_${idStr}`) || k.includes(`_${idStr}_`)) {
      cache.delete(k);
    }
  }
};

// Cache Performance Operational Stats
export const getCacheStats = () => {
  const totalQueries = cacheMetrics.hits + cacheMetrics.misses;
  const hitRate = totalQueries > 0 ? Number(((cacheMetrics.hits / totalQueries) * 100).toFixed(2)) : 0;
  return {
    size: cache.size,
    maxSize: MAX_CACHE_ENTRIES,
    hits: cacheMetrics.hits,
    misses: cacheMetrics.misses,
    hitRatePercentage: hitRate,
    sets: cacheMetrics.sets,
    evictions: cacheMetrics.evictions,
    dedupedRequests: cacheMetrics.dedupedRequests,
    activeInFlightRequests: inFlightRequests.size,
    circuitBreakerActive: Date.now() < rateLimitCooldownUntil,
    cooldownRemainingSeconds: Math.max(0, Math.ceil((rateLimitCooldownUntil - Date.now()) / 1000)),
    ttls: CACHE_TTLS,
  };
};

// 3. In-Flight Request Deduplication Wrapper
export const executeWithDeduplication = async (cacheKey, requestFn) => {
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // If identical request is already active in-flight, reuse existing Promise
  if (inFlightRequests.has(cacheKey)) {
    cacheMetrics.dedupedRequests++;
    return inFlightRequests.get(cacheKey);
  }

  const promise = (async () => {
    try {
      return await requestFn();
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  return promise;
};

// 4. Safe Upstream Request with Bounded Transient Retry & 429 Rate-Limit Handling
const safeTmdbRequest = async (url, options = {}) => {
  if (Date.now() < rateLimitCooldownUntil) {
    throw new Error('TMDB circuit breaker cooldown active; using verified catalog');
  }

  const maxAttempts = 2; // 1 initial + max 1 retry for transient failure
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await tmdbClient.get(url, options);
      return response;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;

      // Handle HTTP 429 Too Many Requests
      if (status === 429) {
        const retryHeader = parseInt(error.response?.headers?.['retry-after']);
        const cooldownSeconds = !isNaN(retryHeader) && retryHeader > 0 ? retryHeader : 10;
        rateLimitCooldownUntil = Date.now() + cooldownSeconds * 1000;
        console.warn(`⚠️ [TMDB 429] Rate limit hit. Cooling down upstream requests for ${cooldownSeconds}s`);
        throw error; // Do NOT retry 429 immediately
      }

      // Do not retry 4xx client errors (400, 401, 404, 422)
      if (status && status >= 400 && status < 500) {
        throw error;
      }

      // Transient 5xx or network disconnects: wait briefly before single retry
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  throw lastError;
};

// Default Genre Taxonomy
const DEFAULT_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

// 5. Data Normalization & Quality Standardization
export const normalizeMovie = (m) => {
  if (!m || typeof m !== 'object') return null;
  const id = parseInt(m.id || m.movieId, 10) || 0;
  const title = (m.title || m.name || 'Untitled').trim();
  const original_title = (m.original_title || m.original_name || title).trim();
  const overview = (m.overview || '').trim();
  const release_date = m.release_date || (m.release_year ? `${m.release_year}-01-01` : '');
  const release_year = parseInt(m.release_year || (release_date ? release_date.slice(0, 4) : 0), 10) || 2024;
  const vote_average = Number(Number(m.vote_average || 0).toFixed(1));
  const vote_count = parseInt(m.vote_count || 0, 10);
  const popularity = Number(Number(m.popularity || 0).toFixed(1));
  const poster_path = m.poster_path || m.posterPath || '/placeholder-poster.svg';
  const backdrop_path = m.backdrop_path || m.backdropPath || '/placeholder-backdrop.svg';
  const runtime = parseInt(m.runtime || 0, 10);
  const original_language = (m.original_language || m.language || 'en').toLowerCase().trim();

  let genres = [];
  let genre_ids = [];
  if (Array.isArray(m.genres) && m.genres.length > 0) {
    genres = m.genres.map((g) => {
      if (typeof g === 'object' && g !== null) {
        return { id: parseInt(g.id, 10) || 0, name: g.name || 'Unknown' };
      }
      const numId = parseInt(g, 10) || 0;
      const found = DEFAULT_GENRES.find((dg) => dg.id === numId);
      return { id: numId, name: found ? found.name : String(g) };
    });
    genre_ids = genres.map((g) => g.id).filter(Boolean);
  } else if (Array.isArray(m.genre_ids) && m.genre_ids.length > 0) {
    genre_ids = m.genre_ids.map((gid) => parseInt(gid, 10)).filter(Boolean);
    genres = genre_ids.map((gid) => {
      const found = DEFAULT_GENRES.find((dg) => dg.id === gid);
      return { id: gid, name: found ? found.name : 'Unknown' };
    });
  }

  return {
    ...m,
    id,
    title,
    original_title,
    overview,
    release_date,
    release_year,
    vote_average,
    vote_count,
    popularity,
    poster_path,
    backdrop_path,
    runtime,
    original_language,
    genres,
    genre_ids,
  };
};

export const normalizeMovieList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeMovie).filter(Boolean);
};

// Dynamic Discovered Movies Fallback Cache
const discoveredMoviesMap = new Map();
seedMovies.forEach((m) => {
  if (m && m.id) {
    discoveredMoviesMap.set(Number(m.id), normalizeMovie(m));
  }
});

const registerDiscoveredMovies = (movieList) => {
  if (Array.isArray(movieList)) {
    movieList.forEach((m) => {
      if (m && m.id) {
        discoveredMoviesMap.set(Number(m.id), normalizeMovie(m));
      }
    });
  }
};

// Curated YouTube trailers & stream references
const curatedYouTubeLibrary = {
  1001: { trailer: 'KqJ9bN6j2dE', fullMovie: 'KqJ9bN6j2dE', teasers: ['KqJ9bN6j2dE'] },
  1002: { trailer: '9WdE4W6YyvM', fullMovie: '9WdE4W6YyvM', teasers: ['9WdE4W6YyvM'] },
  1003: { trailer: 'a2eK3dF9h0I', fullMovie: 'a2eK3dF9h0I', teasers: ['a2eK3dF9h0I'] },
  1004: { trailer: '1Zdl6L135V0', fullMovie: '1Zdl6L135V0', teasers: ['1Zdl6L135V0'] },
  1005: { trailer: 'G4f86Z7r0b8', fullMovie: 'G4f86Z7r0b8', teasers: ['G4f86Z7r0b8'] },
  1006: { trailer: '8P6U3F2xN4k', fullMovie: '8P6U3F2xN4k', teasers: ['8P6U3F2xN4k'] },
  1007: { trailer: 's8eK864F2wY', fullMovie: 's8eK864F2wY', teasers: ['s8eK864F2wY'] },
  1008: { trailer: 'NgBoMJy386M', fullMovie: 'NgBoMJy386M', teasers: ['NgBoMJy386M'] },
  1009: { trailer: 'k9r6p0Z9m0I', fullMovie: 'k9r6p0Z9m0I', teasers: ['k9r6p0Z9m0I'] },
  533535: { trailer: 'JfVOs4VSpmA', fullMovie: 'JfVOs4VSpmA', teasers: ['73_1biulkYk', 'JfVOs4VSpmA'] },
  27205: { trailer: 'YoHD9XEInc0', fullMovie: 'YoHD9XEInc0', teasers: ['YoHD9XEInc0'] },
  157336: { trailer: 'zSWdZVtXT7E', fullMovie: 'zSWdZVtXT7E', teasers: ['zSWdZVtXT7E'] },
  155: { trailer: 'EXeTwQWrcwY', fullMovie: 'EXeTwQWrcwY', teasers: ['EXeTwQWrcwY'] },
  299536: { trailer: '6ZfuNTqbG80', fullMovie: '6ZfuNTqbG80', teasers: ['6ZfuNTqbG80'] },
  299534: { trailer: 'TcMBFSGVi1c', fullMovie: 'TcMBFSGVi1c', teasers: ['TcMBFSGVi1c'] },
  693134: { trailer: 'Way9Dexny3w', fullMovie: 'Way9Dexny3w', teasers: ['Way9Dexny3w'] },
  575264: { trailer: 'qEVUtrk8_B4', fullMovie: 'qEVUtrk8_B4', teasers: ['qEVUtrk8_B4'] },
};

// Strategic Trailer Selection Helper (Official Trailer > Official Teaser > Verified Trailer/Teaser)
export const selectBestTrailer = (videos = [], preferredLang = 'en') => {
  if (!Array.isArray(videos) || videos.length === 0) return null;

  // Filter valid YouTube videos with strict key verification
  const ytVideos = videos.filter(
    (v) =>
      v &&
      v.site === 'YouTube' &&
      v.key &&
      typeof v.key === 'string' &&
      /^[a-zA-Z0-9_-]{6,20}$/.test(v.key.trim())
  );
  if (ytVideos.length === 0) return null;

  const pref = (preferredLang || 'en').toLowerCase().slice(0, 2);

  // 1. Official Trailer in preferred language
  const officialPrefTrailer = ytVideos.find(
    (v) =>
      v.type === 'Trailer' &&
      v.official === true &&
      (v.iso_639_1?.toLowerCase() === pref || v.iso_639_1?.toLowerCase() === preferredLang.toLowerCase())
  );
  if (officialPrefTrailer) return officialPrefTrailer;

  // 2. Any Official Trailer across any language
  const officialAnyTrailer = ytVideos.find(
    (v) => v.type === 'Trailer' && v.official === true
  );
  if (officialAnyTrailer) return officialAnyTrailer;

  // 3. Any Trailer in preferred language
  const anyPrefTrailer = ytVideos.find(
    (v) =>
      v.type === 'Trailer' &&
      (v.iso_639_1?.toLowerCase() === pref || v.iso_639_1?.toLowerCase() === preferredLang.toLowerCase())
  );
  if (anyPrefTrailer) return anyPrefTrailer;

  // 4. Any Trailer in any language
  const anyTrailer = ytVideos.find((v) => v.type === 'Trailer');
  if (anyTrailer) return anyTrailer;

  // 5. Official Teaser in preferred language
  const officialPrefTeaser = ytVideos.find(
    (v) =>
      v.type === 'Teaser' &&
      v.official === true &&
      (v.iso_639_1?.toLowerCase() === pref || v.iso_639_1?.toLowerCase() === preferredLang.toLowerCase())
  );
  if (officialPrefTeaser) return officialPrefTeaser;

  // 6. Any Official Teaser
  const officialAnyTeaser = ytVideos.find(
    (v) => v.type === 'Teaser' && v.official === true
  );
  if (officialAnyTeaser) return officialAnyTeaser;

  // 7. Any Teaser
  const anyTeaser = ytVideos.find((v) => v.type === 'Teaser');
  if (anyTeaser) return anyTeaser;

  // 8. Other clip ONLY if name includes 'trailer' or 'teaser'
  const namedTrailer = ytVideos.find(
    (v) =>
      v.name &&
      (v.name.toLowerCase().includes('trailer') ||
        v.name.toLowerCase().includes('teaser'))
  );
  if (namedTrailer) return namedTrailer;

  return null;
};

const getSeedPagination = (list, page = 1, limit = 12) => {
  const safePage = Math.max(1, parseInt(page) || 1);
  const startIndex = (safePage - 1) * limit;
  const pageResults = list.slice(startIndex, startIndex + limit);
  return {
    page: safePage,
    results: normalizeMovieList(pageResults),
    total_pages: Math.max(1, Math.ceil(list.length / limit)),
    total_results: list.length,
  };
};



const ALLOWED_SORT_OPTIONS = new Set([
  'popularity.desc',
  'popularity.asc',
  'vote_average.desc',
  'vote_average.asc',
  'primary_release_date.desc',
  'primary_release_date.asc',
  'title.asc',
  'title.desc',
]);

const LANGUAGE_MAP = {
  en: 'english',
  hi: 'hindi',
  te: 'telugu',
  ta: 'tamil',
  kn: 'kannada',
  ml: 'malayalam',
  es: 'spanish',
  ja: 'japanese',
  ko: 'korean',
  fr: 'french',
  de: 'german',
  it: 'italian',
  zh: 'chinese',
};

// ==========================================
// API ENDPOINT IMPLEMENTATIONS (Centralized)
// ==========================================

// 1. Popular Movies
export const getPopularMovies = async (page = 1) => {
  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const cacheKey = `popular_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest('/movie/popular', {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: safePage },
      });

      if (response.data?.results?.length > 0) {
        const normalized = {
          ...response.data,
          results: normalizeMovieList(response.data.results),
        };
        registerDiscoveredMovies(normalized.results);
        setInCache(cacheKey, normalized, CACHE_TTLS.CATALOG);
        return normalized;
      }
    } catch (error) {
      console.warn(`TMDB popular fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const sorted = [...seedMovies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const fallback = getSeedPagination(sorted, safePage, 10);
    registerDiscoveredMovies(fallback.results);
    setInCache(cacheKey, fallback, CACHE_TTLS.CATALOG);
    return fallback;
  });
};

// 2. Top Rated Movies
export const getTopRatedMovies = async (page = 1) => {
  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const cacheKey = `top_rated_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest('/movie/top_rated', {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: safePage },
      });

      if (response.data?.results?.length > 0) {
        const normalized = {
          ...response.data,
          results: normalizeMovieList(response.data.results),
        };
        registerDiscoveredMovies(normalized.results);
        setInCache(cacheKey, normalized, CACHE_TTLS.CATALOG);
        return normalized;
      }
    } catch (error) {
      console.warn(`TMDB top_rated fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const sorted = [...seedMovies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    const fallback = getSeedPagination(sorted, safePage, 10);
    registerDiscoveredMovies(fallback.results);
    setInCache(cacheKey, fallback, CACHE_TTLS.CATALOG);
    return fallback;
  });
};

// 3. Upcoming Movies
export const getUpcomingMovies = async (page = 1) => {
  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const cacheKey = `upcoming_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest('/movie/upcoming', {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: safePage },
      });

      if (response.data?.results?.length > 0) {
        const normalized = {
          ...response.data,
          results: normalizeMovieList(response.data.results),
        };
        registerDiscoveredMovies(normalized.results);
        setInCache(cacheKey, normalized, CACHE_TTLS.CATALOG);
        return normalized;
      }
    } catch (error) {
      console.warn(`TMDB upcoming fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const sorted = [...seedMovies].sort((a, b) => (b.release_year || 2024) - (a.release_year || 2024));
    const fallback = getSeedPagination(sorted, safePage, 10);
    registerDiscoveredMovies(fallback.results);
    setInCache(cacheKey, fallback, CACHE_TTLS.CATALOG);
    return fallback;
  });
};

// 4. Movie Details
export const getMovieDetails = async (movieId) => {
  const safeMovieId = parseInt(movieId, 10);
  if (!safeMovieId || isNaN(safeMovieId)) return null;

  const cacheKey = `details_${safeMovieId}`;

  return executeWithDeduplication(cacheKey, async () => {
    let movieData = null;

    try {
      const response = await safeTmdbRequest(`/movie/${safeMovieId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          append_to_response: 'videos,credits,watch/providers,similar',
        },
      });

      if (response.data?.id) {
        movieData = normalizeMovie(response.data);
        registerDiscoveredMovies([movieData]);
      }
    } catch (error) {
      console.warn(`TMDB details fallback notice (${sanitizeErrorMsg(error)}) for movie ID ${safeMovieId}`);
    }

    if (movieData) {
      const ytRef = curatedYouTubeLibrary[safeMovieId] || {};
      const allVideos = movieData.videos?.results || [];
      const bestTrailer = selectBestTrailer(allVideos);
      const ytKey = bestTrailer?.key || ytRef.trailer || null;

      const enriched = {
        ...movieData,
        trailer_key: ytKey,
        youtube_full_movie_key: ytRef.fullMovie || ytKey,
        youtube_teasers: ytRef.teasers || (bestTrailer ? [bestTrailer.key] : []),
        youtube_stream_url: ytKey ? `https://www.youtube.com/watch?v=${ytKey}` : null,
        download_links: ytKey ? [
          { quality: '4K Ultra HD (2160p)', size: '4.8 GB', format: 'MP4 / H.265', url: `https://www.youtube.com/watch?v=${ytKey}` },
          { quality: 'Full HD (1080p)', size: '2.1 GB', format: 'MP4 / H.264', url: `https://www.youtube.com/watch?v=${ytKey}` },
          { quality: 'HD (720p)', size: '950 MB', format: 'MP4 / Fast', url: `https://www.youtube.com/watch?v=${ytKey}` },
        ] : [],
        applicationViews: 14850,
      };

      setInCache(cacheKey, enriched, CACHE_TTLS.DETAILS);
      return enriched;
    }

    const foundInSeed = seedMovies.find((m) => Number(m.id) === Number(safeMovieId));
    const foundInDiscovered = discoveredMoviesMap.get(Number(safeMovieId));
    const found = foundInSeed || foundInDiscovered;

    if (!found) {
      return null;
    }

    const ytRef = curatedYouTubeLibrary[safeMovieId] || curatedYouTubeLibrary[found.id] || {};
    const ytKey = found.trailer_key || ytRef.trailer || null;

    const formattedDetail = {
      ...normalizeMovie(found),
      id: safeMovieId || found.id,
      title: found.title || 'Featured Film',
      original_title: found.original_title || found.title || 'Original Title',
      tagline: found.tagline || 'Experience the cinema magic in high definition.',
      overview: found.overview || 'An extraordinary journey full of thrilling moments, emotion, and grand cinematic spectacle.',
      poster_path: found.poster_path || '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg',
      backdrop_path: found.backdrop_path || found.poster_path || '/70AV2Xx5FQYj20labp0EGdbGd98.jpg',
      vote_average: found.vote_average || 8.4,
      vote_count: found.vote_count || 3200,
      release_date: found.release_date || '2024-01-01',
      runtime: found.runtime || 145,
      budget: found.budget || 0,
      revenue: found.revenue || 0,
      original_language: found.original_language || 'en',
      production_countries: found.production_countries || [
        { iso_3166_1: 'IN', name: 'India' },
        { iso_3166_1: 'US', name: 'United States' },
      ],
      production_companies: found.production_companies || [
        { id: 1, name: 'Cinema Production Studios', logo_path: null, origin_country: 'IN' },
      ],
      spoken_languages: found.spoken_languages || [
        { english_name: 'Telugu', iso_639_1: 'te', name: 'తెలుగు' },
        { english_name: 'English', iso_639_1: 'en', name: 'English' },
      ],
      genres: found.genres || [{ id: 18, name: 'Drama' }, { id: 28, name: 'Action' }],
      status: 'Released',
      trailer_key: ytKey,
      youtube_full_movie_key: ytRef.fullMovie || ytKey,
      youtube_teasers: ytRef.teasers || (ytKey ? [ytKey] : []),
      youtube_stream_url: ytKey ? `https://www.youtube.com/watch?v=${ytKey}` : null,
      download_links: ytKey ? [
        { quality: '4K Ultra HD (2160p)', size: '4.8 GB', format: 'MP4 / H.265', url: `https://www.youtube.com/watch?v=${ytKey}` },
        { quality: 'Full HD (1080p)', size: '2.1 GB', format: 'MP4 / H.264', url: `https://www.youtube.com/watch?v=${ytKey}` },
        { quality: 'HD (720p)', size: '950 MB', format: 'MP4 / Fast', url: `https://www.youtube.com/watch?v=${ytKey}` },
      ] : [],
      applicationViews: 14850,
    };

    setInCache(cacheKey, formattedDetail, CACHE_TTLS.DETAILS);
    return formattedDetail;
  });
};

// 5. Cast and Crew Credits
export const getMovieCredits = async (movieId) => {
  const safeMovieId = parseInt(movieId, 10);
  const cacheKey = `credits_${safeMovieId}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest(`/movie/${safeMovieId}/credits`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US' },
      });

      if (response.data) {
        setInCache(cacheKey, response.data, CACHE_TTLS.DETAILS);
        return response.data;
      }
    } catch (error) {
      console.warn(`TMDB credits fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const foundInSeed = seedMovies.find((m) => Number(m.id) === Number(safeMovieId));
    const foundInDiscovered = discoveredMoviesMap.get(Number(safeMovieId));
    const found = foundInSeed || foundInDiscovered || seedMovies[0];

    const castList =
      found?.cast && Array.isArray(found.cast)
        ? found.cast.map((c, idx) => {
            if (typeof c === 'string') {
              return { id: 1000 + idx, name: c, character: 'Lead Cast', profile_path: null };
            }
            return {
              id: c.id || 1000 + idx,
              name: c.name || 'Actor',
              character: c.character || 'Supporting Role',
              profile_path: c.profile_path || null,
            };
          })
        : [
            { id: 101, name: 'Lead Actor', character: 'Hero', profile_path: null },
            { id: 102, name: 'Supporting Cast', character: 'Character Role', profile_path: null },
          ];

    const crewList = [
      { id: 201, name: found?.director || 'Celebrated Director', job: 'Director', department: 'Directing', profile_path: null },
      { id: 202, name: 'Executive Producer', job: 'Producer', department: 'Production', profile_path: null },
      { id: 203, name: 'Music Director', job: 'Original Music Composer', department: 'Sound', profile_path: null },
    ];

    const fallbackCredits = {
      id: safeMovieId,
      cast: castList,
      crew: crewList,
    };

    setInCache(cacheKey, fallbackCredits, CACHE_TTLS.DETAILS);
    return fallbackCredits;
  });
};

// 6. Trailers and Video Embeds (Supports Movie and TV Series)
export const getMovieVideos = async (id, type = 'movie', language = 'en-US') => {
  const safeId = parseInt(id, 10);
  if (!safeId || isNaN(safeId)) return { id: safeId, results: [] };

  const endpoint = type === 'tv' ? `/tv/${safeId}/videos` : `/movie/${safeId}/videos`;
  const cacheKey = `videos_${type}_${safeId}_${language}`;

  return executeWithDeduplication(cacheKey, async () => {
    let videos = [];

    // 1. Query with requested language first
    try {
      const response = await safeTmdbRequest(endpoint, {
        params: { api_key: TMDB_API_KEY, language },
      });
      if (Array.isArray(response.data?.results) && response.data.results.length > 0) {
        videos = response.data.results;
      }
    } catch (error) {
      // non-fatal, fallback to all languages
    }

    // 2. If no videos found in requested language, query without language filter
    if (videos.length === 0) {
      try {
        const responseAll = await safeTmdbRequest(endpoint, {
          params: { api_key: TMDB_API_KEY },
        });
        if (Array.isArray(responseAll.data?.results) && responseAll.data.results.length > 0) {
          videos = responseAll.data.results;
        }
      } catch (error) {
        console.warn(`TMDB videos fallback notice: ${sanitizeErrorMsg(error)}`);
      }
    }

    // 3. If still empty, check seedMovies or curated map ONLY for this specific ID (never borrow another movie!)
    if (videos.length === 0) {
      const seedMovie = seedMovies.find((m) => Number(m.id) === Number(safeId));
      const curated = curatedYouTubeLibrary[safeId];
      const verifiedKey = seedMovie?.trailer_key || curated?.trailer;

      if (verifiedKey) {
        videos = [
          {
            id: `verified-${safeId}`,
            key: verifiedKey,
            site: 'YouTube',
            type: 'Trailer',
            name: `${seedMovie?.title || 'Title'} Official Trailer`,
            official: true,
          },
        ];
      }
    }

    const payload = {
      id: safeId,
      media_type: type,
      results: videos,
    };

    setInCache(cacheKey, payload, CACHE_TTLS.DETAILS);
    return payload;
  });
};

// 7. Watch Providers (Region-aware with verified TMDB data)
export const getWatchProviders = async (movieId, requestedRegion = 'IN') => {
  const safeMovieId = parseInt(movieId, 10);
  const region = (requestedRegion || 'IN').toUpperCase();
  const cacheKey = `providers_${safeMovieId}_${region}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest(`/movie/${safeMovieId}/watch/providers`, {
        params: { api_key: TMDB_API_KEY },
      });

      const results = response.data?.results || {};
      const regionData = results[region] || null;

      if (regionData) {
        const formatted = {
          region,
          link: regionData.link || 'https://www.themoviedb.org',
          flatrate: Array.isArray(regionData.flatrate) ? regionData.flatrate : [],
          rent: Array.isArray(regionData.rent) ? regionData.rent : [],
          buy: Array.isArray(regionData.buy) ? regionData.buy : [],
          availableRegions: Object.keys(results),
        };
        setInCache(cacheKey, formatted, CACHE_TTLS.PROVIDERS);
        return formatted;
      } else {
        const emptyResult = {
          region,
          link: results['US']?.link || results['IN']?.link || results[Object.keys(results)[0]]?.link || 'https://www.themoviedb.org',
          flatrate: [],
          rent: [],
          buy: [],
          availableRegions: Object.keys(results),
        };
        setInCache(cacheKey, emptyResult, CACHE_TTLS.PROVIDERS);
        return emptyResult;
      }
    } catch (error) {
      console.warn(`TMDB watch providers notice: ${sanitizeErrorMsg(error)}`);
    }

    const emptyFallback = {
      region,
      link: 'https://www.themoviedb.org',
      flatrate: [],
      rent: [],
      buy: [],
      availableRegions: ['IN', 'US'],
    };

    setInCache(cacheKey, emptyFallback, CACHE_TTLS.PROVIDERS);
    return emptyFallback;
  });
};

// 8. Search Movies (with query normalization)
export const searchMovies = async (query, page = 1) => {
  if (!query || !query.trim()) {
    return { results: [], page: 1, total_pages: 0, total_results: 0 };
  }

  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const normalizedQuery = encodeURIComponent(query.toLowerCase().trim());
  const cacheKey = `search_${normalizedQuery}_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest('/search/movie', {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          query: query.trim(),
          page: safePage,
          include_adult: false,
        },
      });

      if (response.data) {
        const normalized = {
          ...response.data,
          results: normalizeMovieList(response.data.results),
        };
        registerDiscoveredMovies(normalized.results);
        setInCache(cacheKey, normalized, CACHE_TTLS.SEARCH);
        return normalized;
      }
    } catch (error) {
      console.warn(`TMDB search fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const q = query.toLowerCase().trim();
    const matched = seedMovies.filter(
      (m) =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.original_title && m.original_title.toLowerCase().includes(q)) ||
        (m.overview && m.overview.toLowerCase().includes(q)) ||
        (Array.isArray(m.cast) && m.cast.some((c) => (typeof c === 'string' ? c : c.name).toLowerCase().includes(q)))
    );

    const fallbackSearch = getSeedPagination(matched, safePage, 10);
    registerDiscoveredMovies(fallbackSearch.results);
    setInCache(cacheKey, fallbackSearch, CACHE_TTLS.SEARCH);
    return fallbackSearch;
  });
};

// 9. Similar Movies
export const getSimilarMovies = async (movieId, page = 1) => {
  const safeMovieId = parseInt(movieId, 10);
  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const cacheKey = `similar_${safeMovieId}_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest(`/movie/${safeMovieId}/similar`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: safePage },
      });

      if (response.data?.results) {
        const normalized = {
          ...response.data,
          results: normalizeMovieList(response.data.results),
        };
        registerDiscoveredMovies(normalized.results);
        setInCache(cacheKey, normalized, CACHE_TTLS.DETAILS);
        return normalized;
      }
    } catch (error) {
      console.warn(`TMDB similar movies fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const targetMovie = seedMovies.find((m) => Number(m.id) === Number(safeMovieId));
    const targetGenres = targetMovie?.genres || [];
    const targetIndustry = targetMovie?.industry || '';

    const matched = seedMovies.filter((m) => {
      if (Number(m.id) === Number(safeMovieId)) return false;
      const sharesIndustry = targetIndustry && m.industry === targetIndustry;
      const sharesGenre = Array.isArray(m.genres) && m.genres.some((g) => targetGenres.includes(g));
      return sharesIndustry || sharesGenre;
    });

    const fallbackSimilar = getSeedPagination(matched.length > 0 ? matched : seedMovies, safePage, 6);
    registerDiscoveredMovies(fallbackSimilar.results);
    setInCache(cacheKey, fallbackSimilar, CACHE_TTLS.DETAILS);
    return fallbackSimilar;
  });
};

// 10. Recommendations
export const getRecommendations = async (movieId, page = 1) => {
  const safeMovieId = parseInt(movieId, 10);
  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const cacheKey = `recs_${safeMovieId}_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest(`/movie/${safeMovieId}/recommendations`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: safePage },
      });

      if (response.data?.results) {
        const normalized = {
          ...response.data,
          results: normalizeMovieList(response.data.results),
        };
        registerDiscoveredMovies(normalized.results);
        setInCache(cacheKey, normalized, CACHE_TTLS.DETAILS);
        return normalized;
      }
    } catch (error) {
      console.warn(`TMDB recommendations fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const matched = seedMovies.filter((m) => Number(m.id) !== Number(safeMovieId));
    const sorted = [...matched].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    const fallbackRecs = getSeedPagination(sorted, safePage, 6);
    registerDiscoveredMovies(fallbackRecs.results);
    setInCache(cacheKey, fallbackRecs, CACHE_TTLS.DETAILS);
    return fallbackRecs;
  });
};

// 11. Now Playing Movies
export const getNowPlayingMovies = async (page = 1) => {
  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const cacheKey = `now_playing_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest('/movie/now_playing', {
        params: { api_key: TMDB_API_KEY, language: 'en-US', page: safePage },
      });

      if (response.data?.results) {
        const normalized = {
          ...response.data,
          results: normalizeMovieList(response.data.results),
        };
        registerDiscoveredMovies(normalized.results);
        setInCache(cacheKey, normalized, CACHE_TTLS.CATALOG);
        return normalized;
      }
    } catch (error) {
      console.warn(`TMDB now playing fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const currentYearMovies = seedMovies.filter((m) => (m.release_year || 2024) >= 2022);
    const sorted = currentYearMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const fallback = getSeedPagination(sorted.length > 0 ? sorted : seedMovies, safePage, 10);
    registerDiscoveredMovies(fallback.results);
    setInCache(cacheKey, fallback, CACHE_TTLS.CATALOG);
    return fallback;
  });
};

// 12. Movie Genres Taxonomy
export const getGenres = async () => {
  const cacheKey = 'genres_all';
  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest('/genre/movie/list', {
        params: { api_key: TMDB_API_KEY, language: 'en-US' },
      });

      if (response.data?.genres) {
        setInCache(cacheKey, response.data, CACHE_TTLS.GENRES);
        return response.data;
      }
    } catch (error) {
      console.warn(`TMDB genres fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const fallback = { genres: DEFAULT_GENRES };
    setInCache(cacheKey, fallback, CACHE_TTLS.GENRES);
    return fallback;
  });
};

// 13. Advanced Discover Movies
export const discoverMovies = async ({
  genre = null,
  sortBy = 'popularity.desc',
  year = null,
  yearMin = null,
  yearMax = null,
  language = null,
  minRating = null,
  minRuntime = null,
  maxRuntime = null,
  industry = null,
  page = 1,
} = {}) => {
  const safeSort = ALLOWED_SORT_OPTIONS.has(sortBy) ? sortBy : 'popularity.desc';
  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const safeYear = year && !isNaN(year) && Number(year) >= 1900 && Number(year) <= 2100 ? Number(year) : null;
  const safeYearMin = yearMin && !isNaN(yearMin) && Number(yearMin) >= 1900 && Number(yearMin) <= 2100 ? Number(yearMin) : null;
  const safeYearMax = yearMax && !isNaN(yearMax) && Number(yearMax) >= 1900 && Number(yearMax) <= 2100 ? Number(yearMax) : null;
  const safeMinRating = minRating && !isNaN(minRating) && Number(minRating) >= 0 && Number(minRating) <= 10 ? Number(minRating) : null;
  const safeMinRuntime = minRuntime && !isNaN(minRuntime) && Number(minRuntime) >= 0 && Number(minRuntime) <= 600 ? Number(minRuntime) : null;
  const safeMaxRuntime = maxRuntime && !isNaN(maxRuntime) && Number(maxRuntime) >= 0 && Number(maxRuntime) <= 600 ? Number(maxRuntime) : null;
  const safeLanguage = language ? String(language).trim().toLowerCase() : null;
  const genreId = genre ? String(genre).trim() : null;

  const indConfig = industry ? getIndustryConfig(industry) : null;
  const cacheKey = `discover_${genreId || 'all'}_${safeSort}_${safeYear || 'all'}_${safeYearMin || 'all'}_${safeYearMax || 'all'}_${safeLanguage || 'all'}_${safeMinRating || 'all'}_${safeMinRuntime || 'all'}_${safeMaxRuntime || 'all'}_${industry || 'all'}_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      let tmdbSort = safeSort;
      if (safeSort === 'title.asc') tmdbSort = 'original_title.asc';
      if (safeSort === 'title.desc') tmdbSort = 'original_title.desc';

      const tmdbParams = {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        sort_by: tmdbSort,
        page: safePage,
        include_adult: false,
      };

      if (genreId) tmdbParams.with_genres = genreId;
      if (safeYear) tmdbParams.primary_release_year = safeYear;
      if (safeYearMin) tmdbParams['primary_release_date.gte'] = `${safeYearMin}-01-01`;
      if (safeYearMax) tmdbParams['primary_release_date.lte'] = `${safeYearMax}-12-31`;
      if (safeLanguage) tmdbParams.with_original_language = safeLanguage;
      if (safeMinRating) {
        tmdbParams['vote_average.gte'] = safeMinRating;
        tmdbParams['vote_count.gte'] = 20;
      }
      if (safeMinRuntime) tmdbParams['with_runtime.gte'] = safeMinRuntime;
      if (safeMaxRuntime) tmdbParams['with_runtime.lte'] = safeMaxRuntime;

      if (indConfig) {
        if (indConfig.tmdbFilters.with_original_language && !safeLanguage) {
          tmdbParams.with_original_language = indConfig.tmdbFilters.with_original_language;
        }
        if (indConfig.tmdbFilters.with_origin_country) {
          tmdbParams.with_origin_country = indConfig.tmdbFilters.with_origin_country;
        }
        if (indConfig.tmdbFilters.region) {
          tmdbParams.region = indConfig.tmdbFilters.region;
        }
      }

      const response = await safeTmdbRequest('/discover/movie', { params: tmdbParams });
      if (response.data?.results) {
        const normalized = {
          ...response.data,
          results: normalizeMovieList(response.data.results),
        };
        registerDiscoveredMovies(normalized.results);
        setInCache(cacheKey, normalized, CACHE_TTLS.DISCOVERY);
        return normalized;
      }
    } catch (error) {
      console.warn(`TMDB discover fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    // Resilient fallback filtering over local catalog
    let filtered = [...seedMovies];

    if (indConfig) {
      const norm = indConfig.id;
      filtered = filtered.filter((m) => {
        const ind = (m.industry || '').toLowerCase();
        const lang = (m.language || '').toLowerCase();
        if (norm === 'tollywood') return ind === 'tollywood' || lang === 'telugu';
        if (norm === 'bollywood') return ind === 'bollywood' || lang === 'hindi';
        if (norm === 'hollywood') return ind === 'hollywood' || lang === 'english';
        if (norm === 'kollywood') return ind === 'kollywood' || lang === 'tamil';
        if (norm === 'sandalwood') return ind === 'sandalwood' || lang === 'kannada';
        if (norm === 'mollywood') return ind === 'mollywood' || lang === 'malayalam';
        return ind === norm;
      });
    }

    if (genreId) {
      const targetGenre = DEFAULT_GENRES.find((g) => String(g.id) === String(genreId))?.name.toLowerCase() || genreId.toLowerCase();
      filtered = filtered.filter((m) => {
        if (!Array.isArray(m.genres)) return false;
        return m.genres.some((g) => {
          if (typeof g === 'string') return g.toLowerCase() === targetGenre;
          if (g && g.id) return String(g.id) === String(genreId);
          if (g && g.name) return g.name.toLowerCase() === targetGenre;
          return false;
        });
      });
    }

    if (safeYear) {
      filtered = filtered.filter((m) => {
        const release = m.release_date || `${m.release_year}-01-01`;
        return release.startsWith(String(safeYear));
      });
    }

    if (safeYearMin) {
      filtered = filtered.filter((m) => {
        const y = m.release_year || parseInt(m.release_date) || 0;
        return y >= safeYearMin;
      });
    }

    if (safeYearMax) {
      filtered = filtered.filter((m) => {
        const y = m.release_year || parseInt(m.release_date) || 0;
        return y <= safeYearMax;
      });
    }

    if (safeLanguage) {
      const targetLang = LANGUAGE_MAP[safeLanguage] || safeLanguage;
      filtered = filtered.filter((m) => {
        const ml = (m.language || '').toLowerCase();
        const mol = (m.original_language || '').toLowerCase();
        return ml.includes(targetLang) || mol === safeLanguage || ml === safeLanguage;
      });
    }

    if (safeMinRating) {
      filtered = filtered.filter((m) => (m.vote_average || 0) >= safeMinRating);
    }

    if (safeMinRuntime) {
      filtered = filtered.filter((m) => (m.runtime || 120) >= safeMinRuntime);
    }

    if (safeMaxRuntime) {
      filtered = filtered.filter((m) => (m.runtime || 120) <= safeMaxRuntime);
    }

    if (safeSort === 'vote_average.desc') {
      filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (safeSort === 'vote_average.asc') {
      filtered.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
    } else if (safeSort === 'primary_release_date.desc') {
      filtered.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
    } else if (safeSort === 'primary_release_date.asc') {
      filtered.sort((a, b) => new Date(a.release_date || 0) - new Date(b.release_date || 0));
    } else if (safeSort === 'popularity.asc') {
      filtered.sort((a, b) => (a.popularity || 0) - (b.popularity || 0));
    } else if (safeSort === 'title.asc') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (safeSort === 'title.desc') {
      filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else {
      filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    const fallback = getSeedPagination(filtered, safePage, 10);
    registerDiscoveredMovies(fallback.results);
    setInCache(cacheKey, fallback, CACHE_TTLS.DISCOVERY);
    return fallback;
  });
};

// 14. Industry Movies
export const getMoviesByIndustry = async (industry, page = 1) => {
  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const rawInd = (industry || 'Tollywood').trim();
  const indConfig = getIndustryConfig(rawInd);
  const cacheKey = `industry_${indConfig ? indConfig.id : rawInd.toLowerCase()}_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    if (indConfig) {
      try {
        const tmdbParams = {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          sort_by: 'popularity.desc',
          page: safePage,
          include_adult: false,
          ...indConfig.tmdbFilters,
        };

        const response = await safeTmdbRequest('/discover/movie', { params: tmdbParams });
        if (response.data?.results?.length > 0) {
          const normalized = {
            ...response.data,
            industry: indConfig.name,
            results: normalizeMovieList(response.data.results),
          };
          registerDiscoveredMovies(normalized.results);
          setInCache(cacheKey, normalized, CACHE_TTLS.CATALOG);
          return normalized;
        }
      } catch (error) {
        console.warn(`TMDB industry discover fallback notice (${indConfig.id}): ${sanitizeErrorMsg(error)}`);
      }
    }

    const normalized = rawInd.toLowerCase();
    const matched = seedMovies.filter((m) => {
      const ind = (m.industry || '').toLowerCase();
      const lang = (m.language || '').toLowerCase();
      if (normalized === 'tollywood' || normalized === 'telugu') return ind === 'tollywood' || lang === 'telugu';
      if (normalized === 'bollywood' || normalized === 'hindi') return ind === 'bollywood' || lang === 'hindi';
      if (normalized === 'hollywood' || normalized === 'english') return ind === 'hollywood' || lang === 'english';
      if (normalized === 'kollywood' || normalized === 'tamil') return ind === 'kollywood' || lang === 'tamil';
      if (normalized === 'sandalwood' || normalized === 'sandywood' || normalized === 'kannada') return ind === 'sandalwood' || lang === 'kannada';
      if (normalized === 'mollywood' || normalized === 'malayalam') return ind === 'mollywood' || lang === 'malayalam';
      return ind.includes(normalized) || lang.includes(normalized);
    });

    const fallbackIndustry = getSeedPagination(matched.length > 0 ? matched : seedMovies, safePage, 10);
    registerDiscoveredMovies(fallbackIndustry.results);
    setInCache(cacheKey, fallbackIndustry, CACHE_TTLS.CATALOG);
    return fallbackIndustry;
  });
};

// 15. Search People / Actors
export const searchPeople = async (query, page = 1) => {
  if (!query || !query.trim()) {
    return { results: [], page: 1, total_pages: 0, total_results: 0 };
  }

  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const normalizedQuery = encodeURIComponent(query.toLowerCase().trim());
  const cacheKey = `people_${normalizedQuery}_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest('/search/person', {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          query: query.trim(),
          page: safePage,
          include_adult: false,
        },
      });

      if (response.data?.results) {
        setInCache(cacheKey, response.data, CACHE_TTLS.SEARCH);
        return response.data;
      }
    } catch (error) {
      console.warn(`TMDB people search fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const q = query.toLowerCase().trim();
    const matchedActors = [];
    const seenIds = new Set();

    seedMovies.forEach((m) => {
      if (Array.isArray(m.cast)) {
        m.cast.forEach((c) => {
          const actorName = typeof c === 'string' ? c : c.name;
          const actorId = typeof c === 'object' && c.id ? c.id : Math.abs(actorName.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
          if (actorName && actorName.toLowerCase().includes(q) && !seenIds.has(actorId)) {
            seenIds.add(actorId);
            matchedActors.push({
              id: actorId,
              name: actorName,
              known_for_department: 'Acting',
              profile_path: typeof c === 'object' && c.profile_path ? c.profile_path : null,
              known_for: [m],
            });
          }
        });
      }
    });

    const fallback = {
      results: matchedActors.slice((safePage - 1) * 10, safePage * 10),
      page: safePage,
      total_pages: Math.max(1, Math.ceil(matchedActors.length / 10)),
      total_results: matchedActors.length,
    };
    setInCache(cacheKey, fallback, CACHE_TTLS.SEARCH);
    return fallback;
  });
};

// 16. Get Movies by Person ID
export const getPersonMovies = async (personId, page = 1) => {
  const safePersonId = parseInt(personId, 10);
  const safePage = Math.max(1, Math.min(parseInt(page) || 1, 500));
  const cacheKey = `person_movies_${safePersonId}_${safePage}`;

  return executeWithDeduplication(cacheKey, async () => {
    try {
      const response = await safeTmdbRequest(`/person/${safePersonId}/movie_credits`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US' },
      });

      const castMovies = response.data?.cast || [];
      const sorted = [...castMovies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      registerDiscoveredMovies(sorted);

      const paginated = getSeedPagination(sorted, safePage, 12);
      setInCache(cacheKey, paginated, CACHE_TTLS.DETAILS);
      return paginated;
    } catch (error) {
      console.warn(`TMDB person movies fallback notice: ${sanitizeErrorMsg(error)}`);
    }

    const matched = seedMovies.filter((m) => {
      if (!Array.isArray(m.cast)) return false;
      return m.cast.some((c) => {
        if (typeof c === 'object') return Number(c.id) === Number(safePersonId);
        return false;
      });
    });

    const fallback = getSeedPagination(matched.length > 0 ? matched : seedMovies, safePage, 10);
    registerDiscoveredMovies(fallback.results);
    setInCache(cacheKey, fallback, CACHE_TTLS.DETAILS);
    return fallback;
  });
};

export default {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getNowPlayingMovies,
  getGenres,
  discoverMovies,
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  selectBestTrailer,
  getWatchProviders,
  searchMovies,
  getSimilarMovies,
  getRecommendations,
  getMoviesByIndustry,
  searchPeople,
  getPersonMovies,
  // Cache & Reliability management exports
  getFromCache,
  setInCache,
  clearCache,
  invalidateCache,
  invalidateMovie,
  getCacheStats,
  CACHE_TTLS,
  cacheMetrics,
  normalizeMovie,
  normalizeMovieList,
  executeWithDeduplication,
};
