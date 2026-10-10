import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/protectedRoute';
import Loading from './components/loading';

// Lazy-loaded page components for optimal route-level code splitting & initial bundle reduction
const Home = lazy(() => import('./pages/home'));
const Popular = lazy(() => import('./pages/popular'));
const TopRated = lazy(() => import('./pages/topRated'));
const Upcoming = lazy(() => import('./pages/upcoming'));
const NowPlaying = lazy(() => import('./pages/nowPlaying'));
const SearchPage = lazy(() => import('./pages/search'));
const MovieDetails = lazy(() => import('./pages/movieDetails'));
const CategoryPage = lazy(() => import('./pages/category'));
const Watchlist = lazy(() => import('./pages/watchlist'));
const Favorites = lazy(() => import('./pages/favorites'));
const HistoryPage = lazy(() => import('./pages/history'));
const LoginPage = lazy(() => import('./pages/login'));
const RegisterPage = lazy(() => import('./pages/register'));
const ProfilePage = lazy(() => import('./pages/profile'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const NotFound = lazy(() => import('./pages/notFound'));

function App() {
  return (
    <div className="cineverse-app-wrapper">
      <Navbar />
      <main className="cineverse-main-content">
        <Suspense fallback={<Loading message="Loading CineVerse..." />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/popular" element={<Popular />} />
            <Route path="/top-rated" element={<TopRated />} />
            <Route path="/upcoming" element={<Upcoming />} />
            <Route path="/now-playing" element={<NowPlaying />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/discover" element={<SearchPage />} />
            <Route path="/category/:industry" element={<CategoryPage />} />
            <Route path="/industry/:industry" element={<CategoryPage />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
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
        </Suspense>
      </main>

      {/* Global Footer */}
      <footer className="cineverse-global-footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <span className="footer-brand">
              Cine<span className="logo-highlight">Verse</span>
            </span>
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
