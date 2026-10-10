import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import './index.css';

const ErrorMessage = ({
  message = 'Something went wrong while loading movies.',
  onRetry,
  showHomeBtn = true,
}) => {
  return (
    <div className="cineverse-error-box animate-fade-in">
      <div className="error-icon-circle">
        <AlertCircle size={32} />
      </div>

      <div className="error-text-content">
        <h3 className="error-heading">Oops! Something went wrong</h3>
        <p className="error-desc">{message}</p>
      </div>

      <div className="error-actions-group">
        {onRetry && (
          <button type="button" className="btn-error-retry" onClick={onRetry}>
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>
        )}

        {showHomeBtn && (
          <Link to="/" className="btn-error-home">
            <Home size={15} />
            <span>Go to Home</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
