import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, ExternalLink } from 'lucide-react';
import './index.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="container footer-content">
        <div className="footer-brand-section">
          <div className="footer-logo">
            <div className="logo-icon-box">
              <Film size={20} />
            </div>
            <span>Movie<span className="logo-highlight">Db</span></span>
          </div>
          <p className="footer-tagline">
            Your destination for discovering top-rated cinematic masterpieces, upcoming releases, and popular blockbusters.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-links-column">
            <h4>Explore</h4>
            <Link to="/">Popular Movies</Link>
            <Link to="/top-rated">Top Rated</Link>
            <Link to="/upcoming">Upcoming</Link>
          </div>

          <div className="footer-links-column">
            <h4>Account</h4>
            <Link to="/watchlist">My Watchlist</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
          </div>

          <div className="footer-links-column">
            <h4>Powered By</h4>
            <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="external-link">
              <span>TMDB API</span>
              <ExternalLink size={13} />
            </a>
            <span className="api-note">This product uses TMDB API but is not endorsed or certified by TMDB.</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="container bottom-bar-content">
          <p>© {new Date().getFullYear()} CineWave MovieDb. Built with React & Node.js.</p>
          <div className="made-with-badge">
            <span>Crafted with</span>
            <Heart size={14} fill="#ef4444" color="#ef4444" />
            <span>for movie lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
