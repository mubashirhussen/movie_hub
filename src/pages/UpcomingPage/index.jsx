import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { getUpcomingMovies } from '../../services/api';
import MovieList from '../../components/MovieList';
import Pagination from '../../components/Pagination';
import '../HomePage/index.css';

const UpcomingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page')) || 1;

  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentPage(pageParam);
  }, [pageParam]);

  useEffect(() => {
    let isMounted = true;

    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUpcomingMovies(currentPage);
        if (isMounted) {
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 1);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch upcoming movies. Please try again.');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMovies();
    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage.toString() });
  };

  return (
    <div className="home-page-container">
      <main className="container page-main-content">
        <div className="section-header-bar">
          <div className="section-title-wrap">
            <div className="section-icon-badge calendar">
              <Calendar size={22} />
            </div>
            <div>
              <h1 className="section-main-heading">Upcoming Movies</h1>
              <p className="section-sub-heading">Exciting new blockbusters arriving soon to theatres & streaming</p>
            </div>
          </div>
          <span className="page-indicator-pill">Page {currentPage} of {totalPages}</span>
        </div>

        {error && (
          <div className="error-alert-box animate-fade-in">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button className="btn-secondary btn-retry" onClick={() => handlePageChange(currentPage)}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        <MovieList movies={movies} loading={loading} />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  );
};

export default UpcomingPage;
