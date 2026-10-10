import React, { useState } from 'react';
import {
  Star,
  Clock,
  Calendar,
  Bookmark,
  Heart,
  Play,
  Share2,
  Tv,
  LayoutGrid,
  Clapperboard
} from 'lucide-react';
import {
  getImageUrl,
  getBackdropUrl,
  formatRating,
  formatDate,
  formatRuntime
} from '../../utils/constants';
import { useMovies } from '../../context/MovieContext';
import { useToast } from '../../context/ToastContext';
import CastList from '../CastList';
import TrailerModal from '../TrailerModal';
import MovieVideoPlayer from '../MovieVideoPlayer';
import StreamProviders from '../StreamProviders';
import ReviewSection from '../ReviewSection';
import SimilarMovies from '../SimilarMovies';
import './index.css';

const SingleMovieDetail = ({ movie, credits, loading }) => {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const { isMovieInWatchlist, isMovieInFavorites, toggleWatchlist, toggleFavorite } = useMovies();
  const { toastSuccess } = useToast();

  if (loading) {
    return (
      <div className="movie-detail-skeleton">
        <div className="skeleton-hero" />
        <div className="container skeleton-content">
          <div className="skeleton-poster-box" />
          <div className="skeleton-details-box">
            <div className="skeleton-line skeleton-detail-title" />
            <div className="skeleton-line skeleton-detail-meta" />
            <div className="skeleton-line skeleton-detail-desc" />
            <div className="skeleton-line skeleton-detail-desc" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container not-found-wrapper">
        <h2>Movie Not Found</h2>
        <p>The requested movie details could not be loaded.</p>
      </div>
    );
  }

  const movieId = movie.id;
  const inWatchlist = isMovieInWatchlist(movieId);
  const inFavorites = isMovieInFavorites(movieId);

  const posterUrl = getImageUrl(movie.poster_path);
  const backdropUrl = getBackdropUrl(movie.backdrop_path || movie.poster_path);
  const rating = formatRating(movie.vote_average);
  const releaseDate = formatDate(movie.release_date);
  const runtime = formatRuntime(movie.runtime);

  // Extract trailer video key if available
  const trailerVideo =
    movie.videos?.results?.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    ) || movie.videos?.results?.[0];

  const videoKey = movie.trailer_key || trailerVideo?.key || 'NgBoMJy386M';

  // Budget & Revenue formatting
  const formatMoney = (amount, isBoxOffice = false) => {
    if (!amount || amount <= 0) {
      return isBoxOffice ? '₹250+ Cr' : '₹50 Cr / $6M';
    }
    if (amount >= 10000000) {
      const cr = (amount / 10000000).toFixed(0);
      const usdMillions = (amount / 83000000).toFixed(0);
      return isBoxOffice ? `₹${cr} Cr` : `₹${cr} Cr / $${usdMillions}M`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: `Check out ${movie.title} on CineWave!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toastSuccess('Movie link copied to clipboard!');
    }
  };

  const scrollToPlayer = () => {
    const playerEl = document.getElementById('movie-stream-player');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Determine stream providers based on movie industry / data
  const streamList = Array.isArray(movie.stream_providers) && movie.stream_providers.length > 0
    ? movie.stream_providers
    : (movie.industry === 'Tollywood' 
        ? ['Netflix', 'Amazon Prime Video', 'Aha', 'Disney+ Hotstar']
        : movie.industry === 'Bollywood'
        ? ['Netflix', 'Amazon Prime Video', 'JioHotstar', 'Zee5']
        : ['Netflix', 'Amazon Prime Video', 'Disney+ Hotstar', 'Apple TV']);

  return (
    <div className="single-movie-detail-container">
      {/* Backdrop Hero Banner */}
      <div
        className="movie-backdrop-hero"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className="hero-gradient-overlay" />

        <div className="container hero-content-layout">
          {/* Left: Poster Box with Red Watch Trailer button underneath */}
          <div className="hero-poster-wrapper">
            <img
              src={posterUrl}
              alt={movie.title}
              className="hero-poster-img"
            />
            <button
              className="btn-trailer-under-poster"
              onClick={() => setTrailerOpen(true)}
              id="watch-trailer-btn"
            >
              <Play size={18} fill="currentColor" />
              <span>Watch Trailer</span>
            </button>
          </div>

          {/* Right: Movie Details Content */}
          <div className="hero-movie-info">
            <div className="movie-header-title-block">
              <h1 className="movie-hero-title">{movie.title}</h1>
              {movie.tagline && (
                <p className="movie-tagline">"{movie.tagline}"</p>
              )}
            </div>

            {/* Meta Tags Row: Rating with star, runtime with clock, release date with calendar */}
            <div className="movie-meta-chips">
              <div className="meta-chip chip-rating">
                <Star size={15} fill="#f59e0b" color="#f59e0b" />
                <span className="rating-bold-val">{rating} / 10</span>
                {movie.vote_count > 0 && (
                  <span className="meta-chip-sub">
                    ({movie.vote_count.toLocaleString()} votes)
                  </span>
                )}
              </div>

              {movie.runtime > 0 && (
                <div className="meta-chip">
                  <Clock size={15} />
                  <span>{runtime}</span>
                </div>
              )}

              {movie.release_date && (
                <div className="meta-chip">
                  <Calendar size={15} />
                  <span>{releaseDate}</span>
                </div>
              )}

              {movie.industry && (
                <div className="meta-chip chip-industry">
                  <Clapperboard size={14} />
                  <span>{movie.industry}</span>
                </div>
              )}
            </div>

            {/* Genres Row */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="movie-genres-row">
                {movie.genres.map((genre) => (
                  <span key={genre.id || genre.name || genre} className="genre-badge">
                    {genre.name || genre}
                  </span>
                ))}
              </div>
            )}

            {/* Where to Stream Providers */}
            <StreamProviders providers={streamList} movieTitle={movie.title} />

            {/* Action Buttons Toolbar */}
            <div className="movie-actions-toolbar">
              <button
                className="btn-watch-full-movie"
                onClick={scrollToPlayer}
                id="watch-full-movie-btn"
              >
                <LayoutGrid size={17} />
                <span>Watch Full Movie</span>
              </button>

              <button
                className="btn-preview-trailer"
                onClick={() => setTrailerOpen(true)}
                id="preview-trailer-btn"
              >
                <Play size={16} fill="currentColor" />
                <span>Preview Trailer</span>
              </button>

              <button
                className={`btn-action-glass ${inWatchlist ? 'active-action' : ''}`}
                onClick={() => toggleWatchlist(movie)}
                id="watchlist-toggle-btn"
              >
                <Bookmark size={17} fill={inWatchlist ? 'currentColor' : 'none'} />
                <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <button
                className={`btn-action-glass ${inFavorites ? 'active-fav' : ''}`}
                onClick={() => toggleFavorite(movie)}
                id="favorite-toggle-btn"
              >
                <Heart size={17} fill={inFavorites ? 'currentColor' : 'none'} />
                <span>{inFavorites ? 'Favorited' : 'Favorite'}</span>
              </button>

              <button
                className="btn-action-glass btn-share-circle"
                onClick={handleShare}
                title="Share movie"
                id="share-movie-btn"
              >
                <Share2 size={17} />
              </button>
            </div>

            {/* Overview / Storyline */}
            <div className="movie-overview-section">
              <h3 className="section-label">Overview & Storyline</h3>
              <p className="overview-text">
                {movie.overview || 'No synopsis provided for this title.'}
              </p>
            </div>

            {/* Budget and Box Office Financials Box */}
            <div className="movie-financials-card">
              <div className="financial-item">
                <span className="financial-label">BUDGET</span>
                <span className="financial-value">
                  {formatMoney(movie.budget, false)}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-label">BOX OFFICE</span>
                <span className="financial-value box-office-val">
                  {formatMoney(movie.revenue, true)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container main-detail-body">
        {/* Full Movie Video Stream Player In-Page */}
        <div id="movie-stream-player">
          <MovieVideoPlayer
            title={movie.title}
            videoKey={videoKey}
            backdropUrl={backdropUrl}
            movie={movie}
          />
        </div>

        {/* Cast & Credits Section */}
        <CastList cast={credits?.cast || movie.cast || []} loading={loading} />

        {/* Similar / Recommended Movies */}
        <SimilarMovies movieId={movie.id} industry={movie.industry || 'Cinema'} />

        {/* Audience Reviews & Rating System */}
        <ReviewSection movieId={movie.id} movieTitle={movie.title} />
      </div>

      {/* Centered Trailer Modal */}
      {videoKey && (
        <TrailerModal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          videoKey={videoKey}
          title={movie.title}
        />
      )}
    </div>
  );
};

export default SingleMovieDetail;
