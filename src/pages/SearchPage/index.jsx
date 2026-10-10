import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, AlertCircle, RefreshCw } from 'lucide-react';
import { searchMovies } from '../../services/api';
import MovieList from '../../components/MovieList';
import Pagination from '../../components/Pagination';
import '../HomePage/index.css';

const SearchPage = () => {
  const { query: routeQuery } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const query = routeQuery || searchParams.get('q') || '';
  const pageParam = parseInt(searchParams.get('page')) || 1;

  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentPage(pageParam);
  }, [pageParam]);

  useEffect(() => {
    let isMounted = true;

    const performSearch = async () => {
      if (!query.trim()) {
        setMovies([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await searchMovies(query, currentPage);
        if (isMounted) {
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 1);
          setTotalResults(data.total_results || (data.results ? data.results.length : 0));
        }
      } catch (err) {
        if (isMounted) {
          setError(`Failed to search movies for "${query}". Please try again.`);
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    performSearch();
    return () => {
      isMounted = false;
    };
  }, [query, currentPage]);

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage.toString() });
  };

  return (
    <div className="home-page-container">
      <main className="container page-main-content">
        <div className="section-header-bar">
          <div className="section-title-wrap">
            <div className="section-icon-badge search">
              <Search size={22} />
            </div>
            <div>
              <h1 className="section-main-heading">Search Results</h1>
              <p className="section-sub-heading">
                Showing results for <span className="gradient-text font-bold">"{query}"</span>
                {!loading && totalResults > 0 && ` (${totalResults.toLocaleString()} titles found)`}
              </p>
            </div>
          </div>
          {totalPages > 1 && (
            <span className="page-indicator-pill">Page {currentPage} of {totalPages}</span>
          )}
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

        <MovieList
          movies={movies}
          loading={loading}
          emptyMessage={`No movies found matching "${query}".`}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  );
};

export default SearchPage;
