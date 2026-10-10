import React from 'react';
import MovieCard from '../MovieCard';
import { Film } from 'lucide-react';
import './index.css';

const MovieList = ({ movies = [], loading = false, emptyMessage = 'No movies found.' }) => {
  if (loading) {
    return (
      <div className="movie-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="movie-card-skeleton">
            <div className="skeleton-poster" />
            <div className="skeleton-info">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-sub" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="empty-movies-state animate-fade-in">
        <div className="empty-icon-wrapper">
          <Film size={44} />
        </div>
        <h3>{emptyMessage}</h3>
        <p>Try searching for a different title or explore other categories.</p>
      </div>
    );
  }

  return (
    <div className="movie-grid animate-fade-in">
      {movies.map((movie) => (
        <MovieCard key={movie.id || movie.movie_id} movie={movie} />
      ))}
    </div>
  );
};

export default MovieList;
