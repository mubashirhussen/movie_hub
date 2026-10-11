import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Star, Calendar, Bookmark, Heart, Sparkles } from 'lucide-react';
import { getBackdropUrl } from '../../utils/imageUrl';
import { formatRating, formatYear } from '../../utils/formatCurrency';
import { useMovies } from '../../hooks/useMovies';
import TrailerModal from '../TrailerModal';
import movieService from '../../services/movieService';
import './index.css';

const HeroSection = ({ movie }) => {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  const { isMovieInWatchlist, isMovieInFavorites, toggleWatchlist, toggleFavorite } = useMovies();

  if (!movie) return null;

  const movieId = movie.id;
  const inWatchlist = isMovieInWatchlist(movieId);
  const inFavorites = isMovieInFavorites(movieId);

  const backdropUrl = getBackdropUrl(movie.backdrop_path || movie.poster_path);
  const rating = formatRating(movie.vote_average);
  const year = formatYear(movie.release_date);

  React.useEffect(() => {
    setTrailerKey(movie.trailer_key || null);
  }, [movieId]);

  const handleOpenTrailer = async () => {
    if (!movieId) return;

    if (trailerKey) {
      setTrailerOpen(true);
      return;
    }

    setLoadingTrailer(true);
    try {
      const data = await movieService.getMovieTrailer(movieId);
      if (data?.trailer?.key) {
        setTrailerKey(data.trailer.key);
      } else if (movie.trailer_key) {
        setTrailerKey(movie.trailer_key);
      } else {
        setTrailerKey(null);
      }
      setTrailerOpen(true);
    } catch {
      setTrailerKey(movie.trailer_key || null);
      setTrailerOpen(true);
    } finally {
      setLoadingTrailer(false);
    }
  };

  return (
    <div
      className="cineverse-hero-section"
      style={{ backgroundImage: `url(${backdropUrl})` }}
    >
      <div className="hero-vignette-overlay" />

      <div className="hero-content-container container">
        <div className="hero-spotlight-badge animate-fade-in">
          <Sparkles size={14} />
          <span>Trending Spotlight</span>
        </div>

        <h1 className="hero-movie-title animate-fade-in">{movie.title}</h1>

        <div className="hero-meta-strip animate-fade-in">
          {rating && rating !== 'NR' && (
            <div className="hero-rating-pill">
              <Star size={14} fill="#fbbf24" color="#fbbf24" />
              <span>{rating} / 10</span>
            </div>
          )}

          {year && (
            <div className="hero-meta-item">
              <Calendar size={14} />
              <span>{year}</span>
            </div>
          )}

          {movie.vote_count > 0 && (
            <span className="hero-votes-count">
              ({movie.vote_count.toLocaleString()} votes)
            </span>
          )}
        </div>

        <p className="hero-overview-paragraph animate-fade-in">
          {movie.overview || 'Experience the cinematic spectacle on CineVerse.'}
        </p>

        {/* Hero Actions */}
        <div className="hero-actions-row animate-fade-in">
          <Link to={`/movie/${movieId}`} className="btn-hero-details">
            <Info size={17} />
            <span>View Details</span>
          </Link>

          <button
            type="button"
            className="btn-hero-trailer"
            onClick={handleOpenTrailer}
            disabled={loadingTrailer}
          >
            <Play size={16} fill="currentColor" />
            <span>{loadingTrailer ? 'Loading Trailer...' : 'Watch Trailer'}</span>
          </button>

          <button
            type="button"
            className={`btn-hero-icon ${inWatchlist ? 'active-wl' : ''}`}
            onClick={() => toggleWatchlist(movie)}
            title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            aria-label="Toggle Watchlist"
          >
            <Bookmark size={18} fill={inWatchlist ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            className={`btn-hero-icon ${inFavorites ? 'active-fav' : ''}`}
            onClick={() => toggleFavorite(movie)}
            title={inFavorites ? 'In Favorites' : 'Add to Favorites'}
            aria-label="Toggle Favorite"
          >
            <Heart size={18} fill={inFavorites ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Trailer Modal */}
      {trailerOpen && (
        <TrailerModal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          videoKey={trailerKey}
          title={movie.title}
        />
      )}
    </div>
  );
};

export default HeroSection;
