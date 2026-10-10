import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Film } from 'lucide-react';
import MovieGrid from '../../components/movieGrid';
import Pagination from '../../components/pagination';
import Loading from '../../components/loading';
import ErrorMessage from '../../components/errorMessage';
import movieService from '../../services/movieService';
import '../popular/index.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('query') || '';
  const pageParam = parseInt(searchParams.get('page')) || 1;

  const [movies, setMovies] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSearchResults = async (query, page) => {
    if (!query.trim()) {
      setMovies([]);
      setTotalResults(0);
      setTotalPages(1);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await movieService.searchMovies(query, page);
      setMovies(data.results || []);
      setTotalResults(data.total_results || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message || 'Error searching for movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults(queryParam, pageParam);
  }, [queryParam, pageParam]);

  const handlePageChange = (newPage) => {
    setSearchParams({ query: queryParam, page: newPage.toString() });
  };

  return (
    <div className="cineverse-browse-page container">
      <div className="browse-header-banner animate-fade-in">
        <div className="browse-icon-badge search">
          <Search size={24} />
        </div>
        <div>
          <h1 className="browse-main-title">
            {queryParam ? `Search Results for "${queryParam}"` : 'Search CineVerse Catalog'}
          </h1>
          <p className="browse-subtitle">
            {queryParam
              ? `Found ${totalResults.toLocaleString()} matching titles`
              : 'Type a title or actor name in the search bar above'}
          </p>
        </div>
      </div>

      {error ? (
        <ErrorMessage
          message={error}
          onRetry={() => fetchSearchResults(queryParam, pageParam)}
        />
      ) : loading ? (
        <Loading message={`Searching movies for "${queryParam}"...`} />
      ) : !queryParam ? (
        <div className="grid-empty-state animate-fade-in">
          <Film size={48} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
          <p className="empty-message-text">Search for any movie, character, or director to explore streams & details.</p>
        </div>
      ) : (
        <>
          <MovieGrid
            movies={movies}
            loading={loading}
            emptyMessage={`No movies found matching "${queryParam}". Try searching for another title!`}
          />
          <Pagination
            currentPage={pageParam}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default SearchPage;
