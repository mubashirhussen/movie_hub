import React from 'react';
import { Film, AlertCircle, RefreshCw, Compass } from 'lucide-react';
import MovieCard from '../MovieCard';
import './index.css';

const MovieGrid = ({
  movies = [],
  loading = false,
  error = null,
  onRetry = null,
  emptyMessage = 'No movies available in this category yet.',
  skeletonCount = 10,
}) => {
  // 1. Loading State with animated skeletons
  if (loading) {
    return (
      <div className="cineverse-movie-grid" aria-busy="true" aria-label="Loading movies">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <div key={`skeleton-${idx}`} className="movie-card-skeleton">
            <div className="skeleton-poster" />
            <div className="skeleton-body">
              <div className="skeleton-title-line" />
              <div className="skeleton-meta-line" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Error State with retry action
  if (error) {
    return (
      <div className="grid-error-state animate-fade-in" role="alert">
        <div className="grid-error-icon-box">
          <AlertCircle size={32} />
        </div>
        <h3 className="grid-error-heading">Unable to Load Movies</h3>
        <p className="grid-error-text">{typeof error === 'string' ? error : error?.message || 'A network error occurred.'}</p>
        {onRetry && (
          <button
            type="button"
            className="grid-retry-btn"
            onClick={onRetry}
          >
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  // 3. Genuine Empty State
  if (!movies || movies.length === 0) {
    return (
      <div className="grid-empty-state animate-fade-in">
        <div className="grid-empty-icon-box">
          <Compass size={36} />
        </div>
        <h3 className="grid-empty-heading">No Movies Found</h3>
        <p className="empty-message-text">{emptyMessage}</p>
        {onRetry && (
          <button
            type="button"
            className="grid-empty-refresh-btn"
            onClick={onRetry}
          >
            <RefreshCw size={14} />
            <span>Refresh Feed</span>
          </button>
        )}
      </div>
    );
  }

  // 4. Data State
  return (
    <div className="cineverse-movie-grid animate-fade-in">
      {movies.map((movie) => (
        <MovieCard key={movie.id || movie.movieId} movie={movie} />
      ))}
    </div>
  );
};

export default MovieGrid;
