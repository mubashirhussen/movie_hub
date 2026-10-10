import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Film, Trash2 } from 'lucide-react';
import authService from '../../services/authService';
import MovieCard from '../../components/MovieCard';
import Loading from '../../components/loading';
import ErrorMessage from '../../components/errorMessage';
import '../popular/index.css';

const HistoryPage = () => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.getHistory();
      setHistoryList(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch watch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRemoveItem = async (movieId) => {
    try {
      await authService.removeFromHistory(movieId);
      setHistoryList((prev) => prev.filter((h) => h.movieId !== movieId));
    } catch {
      // ignore
    }
  };

  return (
    <div className="cineverse-browse-page container">
      <div className="browse-header-banner animate-fade-in">
        <div className="browse-icon-badge calendar">
          <HistoryIcon size={24} />
        </div>
        <div>
          <h1 className="browse-main-title">Watch History ({historyList.length})</h1>
          <p className="browse-subtitle">
            Recently discovered and streamed titles across your account
          </p>
        </div>
      </div>

      {error ? (
        <ErrorMessage message={error} onRetry={fetchHistory} />
      ) : loading ? (
        <Loading message="Loading your watch history..." />
      ) : historyList.length === 0 ? (
        <div className="grid-empty-state animate-fade-in">
          <Film size={48} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
          <p className="empty-message-text">No viewing history recorded yet.</p>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1.25rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <span>Start Exploring Cinema</span>
          </Link>
        </div>
      ) : (
        <div className="cineverse-movie-grid">
          {historyList.map((item) => (
            <div key={item._id || item.movieId} style={{ position: 'relative' }}>
              <MovieCard
                movie={{
                  id: item.movieId,
                  title: item.movieTitle,
                  poster_path: item.posterPath,
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveItem(item.movieId)}
                title="Remove from history"
                aria-label="Remove from history"
                style={{
                  position: 'absolute',
                  top: '0.65rem',
                  right: '0.65rem',
                  zIndex: 5,
                  background: 'rgba(239, 68, 68, 0.85)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
