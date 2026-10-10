import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import watchlistService from '../services/watchlistService';
import favoriteService from '../services/favoriteService';
import { useAuthContext } from './AuthContext';

const MovieContext = createContext(null);

export const MovieProvider = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuthContext();
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const fetchUserLists = useCallback(async () => {
    if (!isAuthenticated()) {
      setWatchlist([]);
      setFavorites([]);
      return;
    }

    setLoadingLists(true);
    try {
      const [wlData, favData] = await Promise.all([
        watchlistService.getWatchlist().catch(() => []),
        favoriteService.getFavorites().catch(() => []),
      ]);
      setWatchlist(Array.isArray(wlData) ? wlData : []);
      setFavorites(Array.isArray(favData) ? favData : []);
    } catch (err) {
      console.warn('Error fetching user movie lists:', err.message);
    } finally {
      setLoadingLists(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserLists();
  }, [fetchUserLists, currentUser]);

  const isMovieInWatchlist = (movieId) => {
    return watchlist.some((item) => Number(item.movieId) === Number(movieId));
  };

  const isMovieInFavorites = (movieId) => {
    return favorites.some((item) => Number(item.movieId) === Number(movieId));
  };

  const toggleWatchlist = async (movie) => {
    if (!isAuthenticated()) {
      return { success: false, requireAuth: true, message: 'Please login to manage your watchlist' };
    }

    const movieId = movie.id || movie.movieId;
    const movieTitle = movie.title || movie.movieTitle || 'Movie';
    const posterPath = movie.poster_path || movie.posterPath || '';

    try {
      const res = await watchlistService.addToWatchlist(movieId, movieTitle, posterPath);
      await fetchUserLists();
      return { success: true, action: res.action, message: res.message };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to update watchlist' };
    }
  };

  const toggleFavorite = async (movie) => {
    if (!isAuthenticated()) {
      return { success: false, requireAuth: true, message: 'Please login to manage your favorites' };
    }

    const movieId = movie.id || movie.movieId;
    const movieTitle = movie.title || movie.movieTitle || 'Movie';
    const posterPath = movie.poster_path || movie.posterPath || '';

    try {
      const res = await favoriteService.addToFavorites(movieId, movieTitle, posterPath);
      await fetchUserLists();
      return { success: true, action: res.action, message: res.message };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to update favorites' };
    }
  };

  return (
    <MovieContext.Provider
      value={{
        watchlist,
        favorites,
        loadingLists,
        isMovieInWatchlist,
        isMovieInFavorites,
        toggleWatchlist,
        toggleFavorite,
        refreshLists: fetchUserLists,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovieContext must be used within a MovieProvider');
  }
  return context;
};

export default MovieContext;
