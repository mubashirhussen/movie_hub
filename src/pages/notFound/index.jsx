import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home, Compass } from 'lucide-react';
import './index.css';

const NotFound = () => {
  return (
    <div className="cineverse-notfound-page container">
      <div className="notfound-card animate-fade-in">
        <div className="notfound-code-badge">
          <span>404</span>
        </div>

        <div className="notfound-icon-wrap">
          <Film size={48} />
        </div>

        <h1 className="notfound-title">Scene Not Found</h1>
        <p className="notfound-desc">
          The movie or page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>

        <div className="notfound-actions">
          <Link to="/" className="btn-notfound-home">
            <Home size={16} />
            <span>Return to Home</span>
          </Link>

          <Link to="/popular" className="btn-notfound-browse">
            <Compass size={16} />
            <span>Browse Popular Movies</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
