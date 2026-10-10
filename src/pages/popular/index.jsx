import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flame } from 'lucide-react';
import MovieGrid from '../../components/movieGrid';
import Pagination from '../../components/pagination';
import Loading from '../../components/loading';
import ErrorMessage from '../../components/errorMessage';
import movieService from '../../services/movieService';
import './index.css';

const Popular = () => {
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

  const fetchMovies = async (page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await movieService.getPopularMovies(page);
      setMovies(data.results || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch popular movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage.toString() });
  };

  return (
    <div className="cineverse-browse-page container">
      <div className="browse-header-banner animate-fade-in">
        <div className="browse-icon-badge flame">
          <Flame size={24} />
        </div>
        <div>
          <h1 className="browse-main-title">Popular Movies</h1>
          <p className="browse-subtitle">
            Most popular titles based on global user activity & streams
          </p>
        </div>
      </div>

      {error ? (
        <ErrorMessage message={error} onRetry={() => fetchMovies(currentPage)} />
      ) : loading ? (
        <Loading message={`Loading popular movies (Page ${currentPage})...`} />
      ) : (
        <>
          <MovieGrid movies={movies} loading={loading} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default Popular;
