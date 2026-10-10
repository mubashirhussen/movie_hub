import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { getMovieDetails, getMovieCredits } from '../../services/api';
import SingleMovieDetail from '../../components/SingleMovieDetail';
import './index.css';

const MovieDetailPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const fetchMovieData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [movieData, creditsData] = await Promise.all([
          getMovieDetails(id),
          getMovieCredits(id)
        ]);

        if (isMounted) {
          setMovie(movieData);
          setCredits(creditsData);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch movie details. Please try again later.');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchMovieData();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="movie-detail-page-wrapper animate-fade-in">
      {/* Top back navigation bar */}
      <div className="detail-top-nav-bar">
        <div className="container">
          <Link to="/" className="btn-back-link">
            <ArrowLeft size={16} />
            <span>Back to Movies</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="container" style={{ marginTop: '2rem' }}>
          <div className="error-alert-box animate-fade-in">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button className="btn-secondary btn-retry" onClick={() => window.location.reload()}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      <SingleMovieDetail
        movie={movie}
        credits={credits}
        loading={loading}
      />
    </div>
  );
};

export default MovieDetailPage;
