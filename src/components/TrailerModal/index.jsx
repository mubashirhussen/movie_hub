import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Film, AlertCircle } from 'lucide-react';
import './index.css';

const TrailerModal = ({ isOpen, onClose, videoKey, title = 'Movie Trailer' }) => {
  const closeBtnRef = React.useRef(null);
  const isValidKey = Boolean(
    videoKey &&
    typeof videoKey === 'string' &&
    /^[a-zA-Z0-9_-]{6,20}$/.test(videoKey.trim())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalNode = (
    <div className="cineverse-trailer-backdrop" onClick={onClose}>
      <div
        className="trailer-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="trailer-modal-header">
          <div className="modal-title-wrap">
            <Film size={18} className="modal-film-icon" />
            <span className="modal-title-text">{title} - Official Trailer</span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close trailer modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Player Embed */}
        <div className="trailer-iframe-wrapper">
          {isValidKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoKey.trim()}?autoplay=0&rel=0&modestbranding=1`}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="trailer-iframe"
            />
          ) : (
            <div className="trailer-unavailable-box">
              <AlertCircle size={36} color="#f87171" />
              <p>Trailer unavailable for this title.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalNode, document.body);
};

export default TrailerModal;
