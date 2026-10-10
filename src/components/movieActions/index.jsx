import React from 'react';
import { Play, Film, Bookmark, Heart, Share2 } from 'lucide-react';
import { useMovies } from '../../hooks/useMovies';
import './index.css';

const MovieActions = ({ movie, onWatchMovie, onPreviewTrailer, onShare, onDownload }) => {
  const { isMovieInWatchlist, isMovieInFavorites, toggleWatchlist, toggleFavorite } = useMovies();

  if (!movie) return null;

  const movieId = movie.id || movie.movieId;
  const inWatchlist = isMovieInWatchlist(movieId);
  const inFavorites = isMovieInFavorites(movieId);

  return (
    <div className="cineverse-actions-toolbar">
      {/* 1. Watch Movie Primary CTA */}
      <button
        type="button"
        className="btn-action-watch-movie"
        onClick={onWatchMovie}
        id="btn-watch-movie"
      >
        <Film size={18} />
        <span>Watch Movie</span>
      </button>

      {/* 2. Preview Trailer */}
      <button
        type="button"
        className="btn-action-trailer"
        onClick={onPreviewTrailer}
        id="btn-preview-trailer"
      >
        <Play size={16} fill="currentColor" />
        <span>Watch Trailer</span>
      </button>

      {/* 3. Download Button */}
      {onDownload && (
        <button
          type="button"
          className="btn-action-download"
          onClick={onDownload}
          id="btn-download-movie"
          title="Download Movie to Device"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Download</span>
        </button>
      )}

      {/* 4. Watchlist Toggle */}
      <button
        type="button"
        className={`btn-action-glass ${inWatchlist ? 'active-watchlist' : ''}`}
        onClick={() => toggleWatchlist(movie)}
        title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        id="btn-toggle-watchlist"
      >
        <Bookmark size={17} fill={inWatchlist ? 'currentColor' : 'none'} />
        <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
      </button>

      {/* 5. Favorite Toggle */}
      <button
        type="button"
        className={`btn-action-glass ${inFavorites ? 'active-favorite' : ''}`}
        onClick={() => toggleFavorite(movie)}
        title={inFavorites ? 'Remove from Favorites' : 'Add to Favorites'}
        id="btn-toggle-favorite"
      >
        <Heart size={17} fill={inFavorites ? 'currentColor' : 'none'} />
        <span>{inFavorites ? 'Favorited' : 'Favorite'}</span>
      </button>

      {/* 6. Share */}
      <button
        type="button"
        className="btn-action-glass btn-icon-only"
        onClick={onShare}
        title="Share Movie"
        id="btn-share-movie"
        aria-label="Share this movie"
      >
        <Share2 size={17} />
      </button>
    </div>
  );
};

export default MovieActions;
