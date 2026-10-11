import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Compass, User, Film, Sparkles, X } from 'lucide-react';
import MovieGrid from '../../components/movieGrid';
import Pagination from '../../components/Pagination';
import DiscoveryFilters from '../../components/discoveryFilters';
import movieService from '../../services/movieService';
import '../popular/index.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL-driven query parameters
  const queryParam = searchParams.get('query') || '';
  const actorParam = searchParams.get('actor') || '';
  const genreParam = searchParams.get('genre') || '';
  const sortByParam = searchParams.get('sortBy') || 'popularity.desc';
  const yearParam = searchParams.get('year') || '';
  const yearMinParam = searchParams.get('yearMin') || '';
  const yearMaxParam = searchParams.get('yearMax') || '';
  const languageParam = searchParams.get('language') || '';
  const minRatingParam = searchParams.get('minRating') || '';
  const minRuntimeParam = searchParams.get('minRuntime') || '';
  const maxRuntimeParam = searchParams.get('maxRuntime') || '';
  const industryParam = searchParams.get('industry') || '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page')) || 1);

  const [movies, setMovies] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const fetchMoviesData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      let data = null;

      // 1. Actor Filmography mode
      if (actorParam) {
        data = await movieService.getPersonMovies(actorParam, pageParam, {
          signal: controller.signal,
        });
      }
      // 2. Keyword Search mode
      else if (queryParam.trim()) {
        data = await movieService.searchMovies(queryParam.trim(), pageParam, {
          signal: controller.signal,
        });
      }
      // 3. Multi-Filter Discovery mode
      else {
        data = await movieService.discoverMovies(
          {
            genre: genreParam || null,
            sortBy: sortByParam,
            year: yearParam || null,
            yearMin: yearMinParam || null,
            yearMax: yearMaxParam || null,
            language: languageParam || null,
            minRating: minRatingParam || null,
            minRuntime: minRuntimeParam || null,
            maxRuntime: maxRuntimeParam || null,
            industry: industryParam || null,
            page: pageParam,
          },
          { signal: controller.signal }
        );
      }

      setMovies(data.results || []);
      setTotalResults(data.total_results || (data.results ? data.results.length : 0));
      setTotalPages(Math.min(data.total_pages || 1, 500));
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      setError(err.message || 'Unable to load movie results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoviesData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    queryParam,
    actorParam,
    genreParam,
    sortByParam,
    yearParam,
    yearMinParam,
    yearMaxParam,
    languageParam,
    minRatingParam,
    minRuntimeParam,
    maxRuntimeParam,
    industryParam,
    pageParam,
  ]);

  // Handle filter changes and sync to URL query string
  const handleFilterChange = (newFilters) => {
    const updated = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        updated.set(key, val);
      } else {
        updated.delete(key);
      }
    });

    // Reset to page 1 on filter modification
    updated.set('page', '1');
    setSearchParams(updated);
  };

  const handlePageChange = (newPage) => {
    const updated = new URLSearchParams(searchParams);
    updated.set('page', newPage.toString());
    setSearchParams(updated);
  };

  const handleResetFilters = () => {
    const updated = new URLSearchParams();
    if (queryParam) updated.set('query', queryParam);
    setSearchParams(updated);
  };

  const clearActorFilter = () => {
    const updated = new URLSearchParams(searchParams);
    updated.delete('actor');
    updated.delete('query');
    updated.set('page', '1');
    setSearchParams(updated);
  };

  // Determine Main Heading and Subheading based on active mode
  let pageTitle = 'Discover Movies';
  let pageSubtitle = 'Filter by genre, rating, runtime, era, language, and explore cinema industries';
  let badgeIcon = <Compass size={24} />;
  let badgeClass = 'compass';

  if (actorParam) {
    pageTitle = `Filmography for ${queryParam || 'Actor'}`;
    pageSubtitle = `Exploring movies and appearances starring ${queryParam || 'this cast member'}`;
    badgeIcon = <User size={24} />;
    badgeClass = 'actor';
  } else if (queryParam) {
    pageTitle = `Search Results for "${queryParam}"`;
    pageSubtitle = `Found ${totalResults.toLocaleString()} matching titles`;
    badgeIcon = <Search size={24} />;
    badgeClass = 'search';
  } else if (genreParam) {
    pageTitle = 'Genre Discovery';
    pageSubtitle = `Showing curated titles matching your selected genre filter`;
    badgeIcon = <Sparkles size={24} />;
    badgeClass = 'star';
  } else if (industryParam) {
    pageTitle = `${industryParam.toUpperCase()} Cinema Showcase`;
    pageSubtitle = `Discover trending regional films from ${industryParam}`;
    badgeIcon = <Film size={24} />;
    badgeClass = 'flame';
  }

  return (
    <div className="cineverse-browse-page container">
      {/* Header Banner */}
      <div className="browse-header-banner animate-fade-in">
        <div className={`browse-icon-badge ${badgeClass}`}>
          {badgeIcon}
        </div>
        <div>
          <h1 className="browse-main-title">{pageTitle}</h1>
          <p className="browse-subtitle">{pageSubtitle}</p>
        </div>
      </div>

      {/* Actor Clear Tag if browsing an actor */}
      {actorParam && (
        <div className="actor-filter-banner animate-fade-in">
          <span>Filtering by Cast / Actor: <strong>{queryParam || actorParam}</strong></span>
          <button type="button" onClick={clearActorFilter} className="clear-actor-btn">
            <X size={14} />
            <span>Show all catalog</span>
          </button>
        </div>
      )}

      {/* Discovery Filters Control Bar (Hidden when searching a specific actor) */}
      {!actorParam && (
        <DiscoveryFilters
          selectedGenre={genreParam}
          selectedSort={sortByParam}
          selectedYear={yearParam}
          selectedYearMin={yearMinParam}
          selectedYearMax={yearMaxParam}
          selectedLanguage={languageParam}
          selectedMinRating={minRatingParam}
          selectedMinRuntime={minRuntimeParam}
          selectedMaxRuntime={maxRuntimeParam}
          selectedIndustry={industryParam}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Results Section */}
      <MovieGrid
        movies={movies}
        loading={loading}
        error={error}
        onRetry={fetchMoviesData}
        emptyMessage={
          queryParam
            ? `No movies found matching "${queryParam}". Try searching for another title or actor!`
            : 'No movies match your current filter combination. Try adjusting or resetting your filters.'
        }
        skeletonCount={10}
      />

      {/* Pagination Controls */}
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

export default SearchPage;
