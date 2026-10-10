import React from 'react';
import { Film } from 'lucide-react';
import './index.css';

const Loading = ({ message = 'Loading amazing movies...' }) => {
  return (
    <div className="cineverse-loader-wrapper animate-fade-in">
      <div className="loader-pulse-ring">
        <div className="loader-core">
          <Film className="loader-film-icon" size={28} />
        </div>
      </div>
      <p className="loader-message-text">{message}</p>
    </div>
  );
};

export default Loading;
