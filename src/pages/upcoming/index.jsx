import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import MovieGrid from '../../components/movieGrid';
import Pagination from '../../components/Pagination';
import movieService from '../../services/movieService';
import '../popular/index.css';

const Upcoming = () => {
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
      const data = await movieService.getUpcomingMovies(page);
      setMovies(data.results || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch upcoming movies');
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
        <div className="browse-icon-badge calendar">
          <Calendar size={24} />
        </div>
        <div>
          <h1 className="browse-main-title">Upcoming Movies</h1>
          <p className="browse-subtitle">
            Anticipated upcoming releases coming to theaters and streaming platforms
          </p>
        </div>
      </div>

      <MovieGrid
        movies={movies}
        loading={loading}
        error={error}
        onRetry={() => fetchMovies(currentPage)}
        emptyMessage="No upcoming releases found."
        skeletonCount={10}
      />

      {!loading && !error && movies.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default Upcoming;
