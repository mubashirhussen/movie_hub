import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import MovieGrid from '../../components/movieGrid';
import Pagination from '../../components/Pagination';
import movieService from '../../services/movieService';
import '../popular/index.css';

const NowPlaying = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Math.max(1, parseInt(searchParams.get('page')) || 1);

  const [movies, setMovies] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const data = await movieService.getNowPlayingMovies(pageParam);
      setMovies(data.results || []);
      setTotalPages(Math.min(data.total_pages || 1, 500));
    } catch (err) {
      setError(err.message || 'Failed to fetch currently playing movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [pageParam]);

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage.toString() });
  };

  return (
    <div className="cineverse-browse-page container">
      <div className="browse-header-banner animate-fade-in">
        <div className="browse-icon-badge flame">
          <Play size={24} fill="currentColor" />
        </div>
        <div>
          <h1 className="browse-main-title">Now Playing in Theaters</h1>
          <p className="browse-subtitle">
            Current box office releases playing right now on big screens and streaming premieres
          </p>
        </div>
      </div>

      <MovieGrid
        movies={movies}
        loading={loading}
        error={error}
        onRetry={fetchMovies}
        emptyMessage="No currently playing releases found."
        skeletonCount={10}
      />

      {!loading && !error && movies.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={pageParam}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default NowPlaying;
