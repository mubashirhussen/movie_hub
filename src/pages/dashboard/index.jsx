import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Heart,
  History,
  Sparkles,
  ArrowRight,
  Compass,
  Film,
  User,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMovies } from '../../hooks/useMovies';
import authService from '../../services/authService';
import watchlistService from '../../services/watchlistService';
import favoriteService from '../../services/favoriteService';
import MovieCard from '../../components/MovieCard';
import './index.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { watchlist, favorites, refreshLists } = useMovies();

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    setError(null);
    try {
      const res = await authService.getHistory();
      if (res?.data) {
        setHistory(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.warn('Failed to load history on dashboard:', err.message);
      setError('Unable to load viewing history. Please retry.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    if (refreshLists) refreshLists();
  }, []);

  const userName = currentUser?.name || 'Film Enthusiast';

  return (
    <div className="cineverse-dashboard-page container animate-fade-in">
      {/* 1. Personalized Welcome Header */}
      <section className="dashboard-welcome-banner">
        <div className="welcome-banner-glow" />
        <div className="welcome-content-layout">
          <div className="welcome-text-pane">
            <div className="welcome-badge">
              <Sparkles size={14} />
              <span>Personalized Cinema Hub</span>
            </div>
            <h1 className="welcome-title">
              Welcome back, <span className="highlight-name">{userName}</span>!
            </h1>
            <p className="welcome-subtitle">
              Your synced CineVerse dashboard. Manage your curated watchlist, favorites, and real-time viewing history.
            </p>

            <div className="welcome-stats-chips">
              <Link to="/watchlist" className="stat-chip purple">
                <Bookmark size={15} />
                <span>
                  <strong>{watchlist.length}</strong> in Watchlist
                </span>
              </Link>
              <Link to="/favorites" className="stat-chip pink">
                <Heart size={15} />
                <span>
                  <strong>{favorites.length}</strong> Favorites
                </span>
              </Link>
              <Link to="/history" className="stat-chip blue">
                <History size={15} />
                <span>
                  <strong>{history.length}</strong> Watched
                </span>
              </Link>
            </div>
          </div>

          <div className="welcome-action-buttons">
            <Link to="/discover" className="btn-dash-primary">
              <Compass size={16} />
              <span>Explore Movies</span>
            </Link>
            <Link to="/profile" className="btn-dash-secondary">
              <User size={16} />
              <span>Profile Settings</span>
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="dashboard-error-alert animate-fade-in">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={fetchHistory} className="btn-error-retry">
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Watchlist Preview Section */}
      <section className="dashboard-preview-section">
        <div className="section-header-row">
          <div className="header-title-wrap">
            <Bookmark size={20} className="sec-icon purple" />
            <div>
              <h2 className="section-heading">Your Watchlist</h2>
              <span className="section-caption">{watchlist.length} titles saved for later</span>
            </div>
          </div>
          {watchlist.length > 0 && (
            <Link to="/watchlist" className="btn-view-all-link">
              <span>View All ({watchlist.length})</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {watchlist.length === 0 ? (
          <div className="dashboard-empty-card">
            <Bookmark size={36} className="empty-icon" />
            <h3>Your watchlist is empty</h3>
            <p>Save movies you want to watch next. Browse trending releases and add them to your list.</p>
            <Link to="/popular" className="btn-empty-action">
              <Film size={15} />
              <span>Browse Popular Movies</span>
            </Link>
          </div>
        ) : (
          <div className="dashboard-movie-grid">
            {watchlist.slice(0, 5).map((movie) => (
              <MovieCard
                key={movie._id || movie.movieId || movie.id}
                movie={{
                  id: movie.movieId || movie.id,
                  title: movie.movieTitle || movie.title,
                  poster_path: movie.posterPath || movie.poster_path,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Favorites Preview Section */}
      <section className="dashboard-preview-section">
        <div className="section-header-row">
          <div className="header-title-wrap">
            <Heart size={20} className="sec-icon pink" />
            <div>
              <h2 className="section-heading">Your Favorites</h2>
              <span className="section-caption">{favorites.length} beloved cinema titles</span>
            </div>
          </div>
          {favorites.length > 0 && (
            <Link to="/favorites" className="btn-view-all-link">
              <span>View All ({favorites.length})</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="dashboard-empty-card">
            <Heart size={36} className="empty-icon" />
            <h3>No favorites saved yet</h3>
            <p>Mark your all-time favorite movies to keep them close at hand.</p>
            <Link to="/top-rated" className="btn-empty-action">
              <Film size={15} />
              <span>Discover Top Rated Movies</span>
            </Link>
          </div>
        ) : (
          <div className="dashboard-movie-grid">
            {favorites.slice(0, 5).map((movie) => (
              <MovieCard
                key={movie._id || movie.movieId || movie.id}
                movie={{
                  id: movie.movieId || movie.id,
                  title: movie.movieTitle || movie.title,
                  poster_path: movie.posterPath || movie.poster_path,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Recently Viewed Viewing History */}
      <section className="dashboard-preview-section">
        <div className="section-header-row">
          <div className="header-title-wrap">
            <History size={20} className="sec-icon blue" />
            <div>
              <h2 className="section-heading">Recently Viewed</h2>
              <span className="section-caption">{history.length} movies explored on CineVerse</span>
            </div>
          </div>
          {history.length > 0 && (
            <Link to="/history" className="btn-view-all-link">
              <span>View Full History ({history.length})</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loadingHistory ? (
          <div className="dashboard-skeletons-row">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dash-skeleton-box" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="dashboard-empty-card">
            <History size={36} className="empty-icon" />
            <h3>No viewing history recorded yet</h3>
            <p>Start opening movie detail pages to automatically track your viewing journeys.</p>
            <Link to="/" className="btn-empty-action">
              <Compass size={15} />
              <span>Explore CineVerse Home</span>
            </Link>
          </div>
        ) : (
          <div className="dashboard-movie-grid">
            {history.slice(0, 5).map((item) => (
              <MovieCard
                key={item._id || item.movieId}
                movie={{
                  id: item.movieId,
                  title: item.movieTitle,
                  poster_path: item.posterPath,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
