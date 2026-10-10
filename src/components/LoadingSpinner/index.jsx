import React from 'react';
import { Film } from 'lucide-react';
import './index.css';

const LoadingSpinner = ({ message = 'Loading amazing movies...' }) => {
  return (
    <div className="spinner-wrapper animate-fade-in">
      <div className="spinner-pulse-ring">
        <div className="spinner-core">
          <Film className="spinner-film-icon" size={28} />
        </div>
      </div>
      <p className="spinner-label">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
