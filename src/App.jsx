import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/protectedRoute';

import Home from './pages/home';
import Popular from './pages/popular';
import TopRated from './pages/topRated';
import Upcoming from './pages/upcoming';
import SearchPage from './pages/search';
import MovieDetails from './pages/movieDetails';
import CategoryPage from './pages/category';
import Watchlist from './pages/watchlist';
import Favorites from './pages/favorites';
import HistoryPage from './pages/history';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import ProfilePage from './pages/profile';
import NotFound from './pages/notFound';

function App() {
  return (
    <div className="cineverse-app-wrapper">
      <Navbar />
      <main className="cineverse-main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/popular" element={<Popular />} />
          <Route path="/top-rated" element={<TopRated />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/category/:industry" element={<CategoryPage />} />
          <Route path="/industry/:industry" element={<CategoryPage />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <footer className="cineverse-global-footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <span className="footer-brand">Cine<span className="logo-highlight">Verse</span></span>
            <p className="footer-copyright">
              © {new Date().getFullYear()} CineVerse Platform. Powered by TMDB API.
            </p>
          </div>
          <div className="footer-right">
            <span className="footer-notice">
              Full-Stack Movie Discovery & Streaming Information Architecture
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
