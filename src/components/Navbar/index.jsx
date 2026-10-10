import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Flame,
  Star,
  Calendar,
  Bookmark,
  Heart,
  History,
  User,
  LogOut,
  Menu,
  X,
  Compass,
  Home,
  Play,
  SlidersHorizontal,
  LayoutDashboard
} from 'lucide-react';
import Logo from '../logo';
import SearchBar from '../searchBar';
import { useAuth } from '../../hooks/useAuth';
import { useMovies } from '../../hooks/useMovies';
import './index.css';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { currentUser, isAuthenticated, logout } = useAuth();
  const { watchlist, favorites } = useMovies();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Handle header background blur on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`global-navbar-header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="navbar-inner-wrap container">
        {/* Left: Brand Logo */}
        <div className="navbar-brand-section">
          <Logo />
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="navbar-desktop-nav" aria-label="Main Navigation">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link-item ${isActive && location.pathname === '/' ? 'active' : ''}`}
            end
          >
            <Home size={15} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/discover"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            <SlidersHorizontal size={15} />
            <span>Discover</span>
          </NavLink>

          <NavLink
            to="/now-playing"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            <Play size={15} fill="currentColor" />
            <span>Now Playing</span>
          </NavLink>

          <NavLink
            to="/popular"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            <Flame size={15} />
            <span>Popular</span>
          </NavLink>

          <NavLink
            to="/top-rated"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            <Star size={15} />
            <span>Top Rated</span>
          </NavLink>

          <NavLink
            to="/upcoming"
            className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
          >
            <Calendar size={15} />
            <span>Upcoming</span>
          </NavLink>

          {/* Categories Dropdown */}
          <div className="nav-dropdown-wrapper">
            <button
              type="button"
              className={`nav-link-item nav-dropdown-btn ${location.pathname.startsWith('/category') ? 'active' : ''}`}
            >
              <Compass size={15} />
              <span>Industries</span>
            </button>

            <div className="nav-dropdown-menu">
              <Link to="/category/tollywood" className="dropdown-category-item">
                <span className="cat-icon">🔥</span>
                <div className="cat-text">
                  <span className="cat-name">Tollywood</span>
                  <span className="cat-lang">Telugu Cinema</span>
                </div>
              </Link>
              <Link to="/category/bollywood" className="dropdown-category-item">
                <span className="cat-icon">🌟</span>
                <div className="cat-text">
                  <span className="cat-name">Bollywood</span>
                  <span className="cat-lang">Hindi Cinema</span>
                </div>
              </Link>
              <Link to="/category/hollywood" className="dropdown-category-item">
                <span className="cat-icon">🎬</span>
                <div className="cat-text">
                  <span className="cat-name">Hollywood</span>
                  <span className="cat-lang">Global Cinema</span>
                </div>
              </Link>
              <Link to="/category/kollywood" className="dropdown-category-item">
                <span className="cat-icon">⚡</span>
                <div className="cat-text">
                  <span className="cat-name">Kollywood</span>
                  <span className="cat-lang">Tamil Cinema</span>
                </div>
              </Link>
              <Link to="/category/sandalwood" className="dropdown-category-item">
                <span className="cat-icon">🏔️</span>
                <div className="cat-text">
                  <span className="cat-name">Sandalwood</span>
                  <span className="cat-lang">Kannada Cinema</span>
                </div>
              </Link>
              <Link to="/category/mollywood" className="dropdown-category-item">
                <span className="cat-icon">🌿</span>
                <div className="cat-text">
                  <span className="cat-name">Mollywood</span>
                  <span className="cat-lang">Malayalam Cinema</span>
                </div>
              </Link>
            </div>
          </div>
        </nav>

        {/* Search Bar */}
        <div className="navbar-search-section">
          <SearchBar onSearchComplete={() => setMobileMenuOpen(false)} />
        </div>

        {/* Right: Actions & Auth */}
        <div className="navbar-actions-section">
          {isAuthenticated() ? (
            <>
              {/* Watchlist Quick Link */}
              <Link to="/watchlist" className="nav-icon-btn" title="My Watchlist" aria-label={`My Watchlist (${watchlist.length} saved)`}>
                <Bookmark size={19} />
                {watchlist.length > 0 && (
                  <span className="nav-badge-count">{watchlist.length}</span>
                )}
              </Link>

              {/* Favorites Quick Link */}
              <Link to="/favorites" className="nav-icon-btn" title="My Favorites" aria-label={`My Favorites (${favorites.length} saved)`}>
                <Heart size={19} />
                {favorites.length > 0 && (
                  <span className="nav-badge-count pink">{favorites.length}</span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="user-profile-menu-wrap">
                <button
                  className="user-avatar-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="User profile menu"
                  aria-haspopup="true"
                  aria-expanded={userDropdownOpen}
                >
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={currentUser?.name || 'User'}
                    className="avatar-img"
                  />
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-card">
                    <div className="user-dropdown-info">
                      <p className="dropdown-user-name">{currentUser?.name}</p>
                      <p className="dropdown-user-email">{currentUser?.email}</p>
                    </div>

                    <div className="dropdown-divider" />

                    <Link to="/dashboard" className="dropdown-menu-item">
                      <LayoutDashboard size={15} />
                      <span>Dashboard</span>
                    </Link>

                    <Link to="/profile" className="dropdown-menu-item">
                      <User size={15} />
                      <span>My Profile</span>
                    </Link>

                    <Link to="/watchlist" className="dropdown-menu-item">
                      <Bookmark size={15} />
                      <span>Watchlist ({watchlist.length})</span>
                    </Link>

                    <Link to="/favorites" className="dropdown-menu-item">
                      <Heart size={15} />
                      <span>Favorites ({favorites.length})</span>
                    </Link>

                    <Link to="/history" className="dropdown-menu-item">
                      <History size={15} />
                      <span>Watch History</span>
                    </Link>

                    <div className="dropdown-divider" />

                    <button className="dropdown-menu-item logout" onClick={handleLogout}>
                      <LogOut size={15} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-nav-buttons">
              <Link to="/login" className="btn-nav-login">
                Login
              </Link>
              <Link to="/register" className="btn-nav-register">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="mobile-drawer-overlay">
          <div className="mobile-drawer-content">
            <div className="mobile-search-wrapper">
              <SearchBar onSearchComplete={() => setMobileMenuOpen(false)} />
            </div>

            <nav className="mobile-nav-links">
              <NavLink to="/" className="mobile-nav-item">
                <Home size={18} />
                <span>Home</span>
              </NavLink>
              <NavLink to="/discover" className="mobile-nav-item">
                <SlidersHorizontal size={18} />
                <span>Discover &amp; Filters</span>
              </NavLink>
              <NavLink to="/now-playing" className="mobile-nav-item">
                <Play size={18} fill="currentColor" />
                <span>Now Playing</span>
              </NavLink>
              <NavLink to="/popular" className="mobile-nav-item">
                <Flame size={18} />
                <span>Popular Movies</span>
              </NavLink>
              <NavLink to="/top-rated" className="mobile-nav-item">
                <Star size={18} />
                <span>Top Rated</span>
              </NavLink>
              <NavLink to="/upcoming" className="mobile-nav-item">
                <Calendar size={18} />
                <span>Upcoming</span>
              </NavLink>

              {/* Mobile Industries Grid */}
              <div className="mobile-categories-section">
                <span className="mobile-cat-header">CINEMA INDUSTRIES</span>
                <div className="mobile-cat-grid">
                  <Link to="/category/tollywood" className="mobile-cat-pill">
                    <span>🔥 Tollywood</span>
                  </Link>
                  <Link to="/category/bollywood" className="mobile-cat-pill">
                    <span>🌟 Bollywood</span>
                  </Link>
                  <Link to="/category/hollywood" className="mobile-cat-pill">
                    <span>🎬 Hollywood</span>
                  </Link>
                  <Link to="/category/kollywood" className="mobile-cat-pill">
                    <span>⚡ Kollywood</span>
                  </Link>
                  <Link to="/category/sandalwood" className="mobile-cat-pill">
                    <span>🏔️ Sandalwood</span>
                  </Link>
                  <Link to="/category/mollywood" className="mobile-cat-pill">
                    <span>🌿 Mollywood</span>
                  </Link>
                </div>
              </div>

              <NavLink to="/watchlist" className="mobile-nav-item">
                <Bookmark size={18} />
                <span>Watchlist ({watchlist.length})</span>
              </NavLink>
              <NavLink to="/favorites" className="mobile-nav-item">
                <Heart size={18} />
                <span>Favorites ({favorites.length})</span>
              </NavLink>
              <NavLink to="/history" className="mobile-nav-item">
                <History size={18} />
                <span>Watch History</span>
              </NavLink>

              {isAuthenticated() ? (
                <>
                  <NavLink to="/dashboard" className="mobile-nav-item">
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink to="/profile" className="mobile-nav-item">
                    <User size={18} />
                    <span>My Profile</span>
                  </NavLink>
                  <button className="mobile-nav-item logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout ({currentUser?.name})</span>
                  </button>
                </>
              ) : (
                <div className="mobile-auth-actions">
                  <Link to="/login" className="btn-mobile-login">
                    Login
                  </Link>
                  <Link to="/register" className="btn-mobile-register">
                    Create Free Account
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
