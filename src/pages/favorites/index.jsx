import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Film, Sparkles } from 'lucide-react';
import { useMovies } from '../../hooks/useMovies';
import MovieGrid from '../../components/movieGrid';
import Loading from '../../components/loading';
import '../popular/index.css';

const Favorites = () => {
  const { favorites, loadingLists } = useMovies();

  const formattedMovies = favorites.map((item) => ({
    id: item.movieId,
    title: item.movieTitle,
    poster_path: item.posterPath,
  }));

  return (
    <div className="cineverse-browse-page container">
      <div className="browse-header-banner animate-fade-in">
        <div className="browse-icon-badge flame">
          <Heart size={24} />
        </div>
        <div>
          <h1 className="browse-main-title">My Favorite Movies ({favorites.length})</h1>
          <p className="browse-subtitle">
            All your favorited films in one curated personal collection
          </p>
        </div>
      </div>

      {loadingLists ? (
        <Loading message="Syncing your favorites..." />
      ) : formattedMovies.length === 0 ? (
        <div className="grid-empty-state animate-fade-in">
          <Film size={48} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
          <p className="empty-message-text">No favorite movies saved yet.</p>
          <Link
            to="/top-rated"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1.25rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Sparkles size={17} />
            <span>Discover Top Rated Movies</span>
          </Link>
        </div>
      ) : (
        <MovieGrid movies={formattedMovies} />
      )}
    </div>
  );
};

export default Favorites;
