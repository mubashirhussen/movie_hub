import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, Heart, Play, Eye, Film } from 'lucide-react';
import { getImageUrl, getPlaceholderPosterSvg } from '../../utils/imageUrl';
import { formatRating, formatYear } from '../../utils/formatCurrency';
import { useMovies } from '../../hooks/useMovies';
import './index.css';

const MovieCard = ({ movie }) => {
  const { isMovieInWatchlist, isMovieInFavorites, toggleWatchlist, toggleFavorite } = useMovies();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!movie) return null;

  const movieId = movie.id || movie.movieId;
  const inWatchlist = isMovieInWatchlist(movieId);
  const inFavorites = isMovieInFavorites(movieId);

  const initialPoster = getImageUrl(movie.poster_path || movie.posterPath, movie.title);
  const rating = formatRating(movie.vote_average);
  const releaseYear = formatYear(movie.release_date || movie.release_year);

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    setHasError(true);
    e.currentTarget.src = getPlaceholderPosterSvg(movie.title || 'Movie');
  };

  const handleWatchlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(movie);
  };

  return (
    <div className="cineverse-movie-card">
      <Link to={`/movie/${movieId}`} className="card-media-wrapper">
        {/* Shimmer Placeholder while image is loading */}
        {!imageLoaded && !hasError && (
          <div className="card-poster-shimmer">
            <Film size={28} className="shimmer-film-icon" />
          </div>
        )}

        <img
          src={initialPoster}
          alt={movie.title || 'Movie Poster'}
          className={`card-poster-img ${imageLoaded || hasError ? 'loaded' : 'loading'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />

        {/* Rating Badge */}
        {rating && rating !== 'NR' && (
          <div className="card-rating-badge">
            <Star size={11} fill="#fbbf24" color="#fbbf24" />
            <span>{rating}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="card-hover-overlay">
          <div className="hover-play-icon">
            <Play size={22} fill="currentColor" />
          </div>

          <div className="hover-actions-row">
            <button
              type="button"
              className={`hover-action-btn ${inWatchlist ? 'active-wl' : ''}`}
              onClick={handleWatchlistClick}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              aria-label="Toggle Watchlist"
            >
              <Bookmark size={15} fill={inWatchlist ? 'currentColor' : 'none'} />
            </button>

            <button
              type="button"
              className={`hover-action-btn ${inFavorites ? 'active-fav' : ''}`}
              onClick={handleFavoriteClick}
              title={inFavorites ? 'Remove from Favorites' : 'Add to Favorites'}
              aria-label="Toggle Favorite"
            >
              <Heart size={15} fill={inFavorites ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="hover-view-details">
            <Eye size={13} />
            <span>View Details</span>
          </div>
        </div>
      </Link>

      {/* Card Info Below Poster */}
      <div className="card-info-block">
        <Link to={`/movie/${movieId}`} className="card-title" title={movie.title}>
          {movie.title}
        </Link>
        <div className="card-meta-row">
          <span className="card-release-year">{releaseYear || 'TBD'}</span>
          {movie.original_language && (
            <span className="card-lang-tag">{movie.original_language.toUpperCase()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
