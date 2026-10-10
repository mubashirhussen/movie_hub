import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, Heart, Film, ArrowRight } from 'lucide-react';
import { useMovies } from '../../context/MovieContext';
import { useAuth } from '../../context/AuthContext';
import MovieList from '../../components/MovieList';
import './index.css';

const WatchlistPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'favorites' ? 'favorites' : 'watchlist';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { watchlist, favorites, loading } = useMovies();
  const { isAuthenticated, user } = useAuth();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'favorites' ? { tab: 'favorites' } : {});
  };

  if (!isAuthenticated) {
    return (
      <div className="container watchlist-guest-state animate-fade-in">
        <div className="guest-icon-box">
          <Bookmark size={40} />
        </div>
        <h2>Sign in to track your favorite movies</h2>
        <p>Create your custom watchlist and keep track of films you want to watch or love.</p>
        <div className="guest-actions">
          <Link to="/login" className="btn-primary">
            <span>Sign In</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/register" className="btn-secondary">
            <span>Create Free Account</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'watchlist' ? watchlist : favorites;

  // Format movies to match MovieCard shape
  const formattedMovies = currentList.map((item) => ({
    id: item.movie_id,
    title: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    release_date: item.release_date,
    overview: item.overview,
  }));

  return (
    <div className="watchlist-page-container">
      <main className="container page-main-content">
        <div className="watchlist-header-block">
          <div>
            <h1 className="section-main-heading">
              {user?.name ? `${user.name}'s Collection` : 'My Movie Collection'}
            </h1>
            <p className="section-sub-heading">Your personal hub for saved movies and favorites</p>
          </div>

          {/* Tab Switcher */}
          <div className="watchlist-tabs-switch">
            <button
              className={`tab-switch-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => handleTabChange('watchlist')}
            >
              <Bookmark size={16} />
              <span>Watchlist</span>
              <span className="tab-pill-count">{watchlist.length}</span>
            </button>

            <button
              className={`tab-switch-btn ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => handleTabChange('favorites')}
            >
              <Heart size={16} />
              <span>Favorites</span>
              <span className="tab-pill-count">{favorites.length}</span>
            </button>
          </div>
        </div>

        {formattedMovies.length === 0 ? (
          <div className="empty-collection-box animate-fade-in">
            <div className="empty-collection-icon">
              {activeTab === 'watchlist' ? <Bookmark size={44} /> : <Heart size={44} />}
            </div>
            <h3>Your {activeTab === 'watchlist' ? 'Watchlist' : 'Favorites'} is empty</h3>
            <p>
              Browse popular, top-rated, and upcoming movies and click the bookmark or heart icon to save them here!
            </p>
            <Link to="/" className="btn-primary" style={{ marginTop: '1.25rem' }}>
              <Film size={18} />
              <span>Discover Movies</span>
            </Link>
          </div>
        ) : (
          <MovieList movies={formattedMovies} loading={loading} />
        )}
      </main>
    </div>
  );
};

export default WatchlistPage;
