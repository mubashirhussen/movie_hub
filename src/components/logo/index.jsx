import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Play } from 'lucide-react';
import './index.css';

const Logo = ({ size = 'normal' }) => {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Link to="/" className={`cineverse-logo ${size}`} onClick={handleClick} title="CineVerse - Home">
      <div className="logo-icon-wrap">
        <Film className="logo-film-icon" />
        <div className="logo-play-dot">
          <Play size={10} fill="#ffffff" color="#ffffff" />
        </div>
      </div>
      <div className="logo-text-block">
        <span className="logo-title">
          Cine<span className="logo-highlight">Verse</span>
        </span>
        <span className="logo-sub">STREAM & DISCOVER</span>
      </div>
    </Link>
  );
};

export default Logo;
