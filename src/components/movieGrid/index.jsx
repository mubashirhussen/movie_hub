import React from 'react';
import MovieCard from '../movieCard';
import Loading from '../loading';
import './index.css';

const MovieGrid = ({ movies = [], loading = false, emptyMessage = 'No movies found.' }) => {
  if (loading) {
    return (
      <div className="cineverse-movie-grid">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div key={idx} className="movie-card-skeleton">
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

  if (!movies || movies.length === 0) {
    return (
      <div className="grid-empty-state">
        <p className="empty-message-text">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="cineverse-movie-grid">
      {movies.map((movie) => (
        <MovieCard key={movie.id || movie.movieId} movie={movie} />
      ))}
    </div>
  );
};

export default MovieGrid;
