import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Flame, Sparkles, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { getMoviesCatalog, getPopularMovies } from '../../services/api';
import { getBackdropUrl, formatRating, formatYear } from '../../utils/constants';
import MovieList from '../../components/MovieList';
import Pagination from '../../components/Pagination';
import IndustryFilter from '../../components/IndustryFilter';
import './index.css';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page')) || 1;
  const industryParam = searchParams.get('industry') || 'All';
  const decadeParam = searchParams.get('decade') || 'All';
  const genreParam = searchParams.get('genre') || 'All';
  const sortParam = searchParams.get('sort') || 'popularity_desc';

  const [movies, setMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedIndustry, setSelectedIndustry] = useState(industryParam);
  const [selectedDecade, setSelectedDecade] = useState(decadeParam);
  const [selectedGenre, setSelectedGenre] = useState(genreParam);
  const [selectedSort, setSelectedSort] = useState(sortParam);

  // Sync state with URL params
  useEffect(() => {
    setCurrentPage(pageParam);
    setSelectedIndustry(industryParam);
    setSelectedDecade(decadeParam);
    setSelectedGenre(genreParam);
    setSelectedSort(sortParam);
  }, [pageParam, industryParam, decadeParam, genreParam, sortParam]);

  // Update URL search parameters
  const updateFilters = (newFilters) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newFilters.page !== undefined) nextParams.set('page', newFilters.page.toString());
    if (newFilters.industry !== undefined) {
      if (newFilters.industry === 'All') nextParams.delete('industry');
      else nextParams.set('industry', newFilters.industry);
      nextParams.set('page', '1');
    }
    if (newFilters.decade !== undefined) {
      if (newFilters.decade === 'All') nextParams.delete('decade');
      else nextParams.set('decade', newFilters.decade);
      nextParams.set('page', '1');
    }
    if (newFilters.genre !== undefined) {
      if (newFilters.genre === 'All') nextParams.delete('genre');
      else nextParams.set('genre', newFilters.genre);
      nextParams.set('page', '1');
    }
    if (newFilters.sort !== undefined) {
      if (newFilters.sort === 'popularity_desc') nextParams.delete('sort');
      else nextParams.set('sort', newFilters.sort);
      nextParams.set('page', '1');
    }
    setSearchParams(nextParams);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const isCustomFilter =
          selectedIndustry !== 'All' ||
          selectedDecade !== 'All' ||
          selectedGenre !== 'All' ||
          selectedSort !== 'popularity_desc';

        let data;
        if (isCustomFilter) {
          data = await getMoviesCatalog({
            page: currentPage,
            industry: selectedIndustry,
            decade: selectedDecade,
            genre: selectedGenre,
            sortBy: selectedSort
          });
        } else {
          // Default popular movies
          data = await getPopularMovies(currentPage);
        }

        if (isMounted) {
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 1);
          setTotalResults(data.total_results || (data.results ? data.results.length : 0));
          if (data.results && data.results.length > 0 && currentPage === 1 && !featuredMovie) {
            setFeaturedMovie(data.results[0]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch movies. Please check your connection.');
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
  }, [currentPage, selectedIndustry, selectedDecade, selectedGenre, selectedSort]);

  const handlePageChange = (newPage) => {
    updateFilters({ page: newPage });
  };

  return (
    <div className="home-page-container">
      {/* Featured Hero Banner on Page 1 */}
      {currentPage === 1 && featuredMovie && !loading && selectedIndustry === 'All' && (
        <section
          className="featured-hero"
          style={{
            backgroundImage: `url(${getBackdropUrl(featuredMovie.backdrop_path)})`
          }}
        >
          <div className="featured-overlay" />
          <div className="container featured-content animate-fade-in">
            <div className="featured-badge">
              <Sparkles size={14} />
              <span>Trending #1 Spotlight</span>
            </div>
            <h1 className="featured-title">{featuredMovie.title}</h1>
            <p className="featured-overview">{featuredMovie.overview}</p>

            <div className="featured-meta">
              <span className="featured-rating">⭐ {formatRating(featuredMovie.vote_average)}</span>
              <span className="featured-year">{formatYear(featuredMovie.release_date)}</span>
              {featuredMovie.industry && (
                <span className="featured-industry-pill">🎬 {featuredMovie.industry}</span>
              )}
            </div>

            <div className="featured-actions">
              <Link to={`/movie/${featuredMovie.id}`} className="btn-primary">
                <Play size={18} fill="currentColor" />
                <span>Explore Movie Details</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Main Movies Catalog Section */}
      <main className="container page-main-content">
        {/* Cinema Industry & Era Filter Bar */}
        <IndustryFilter
          selectedIndustry={selectedIndustry}
          onSelectIndustry={(ind) => updateFilters({ industry: ind })}
          selectedDecade={selectedDecade}
          onSelectDecade={(dec) => updateFilters({ decade: dec })}
          selectedGenre={selectedGenre}
          onSelectGenre={(gen) => updateFilters({ genre: gen })}
          selectedSort={selectedSort}
          onSelectSort={(srt) => updateFilters({ sort: srt })}
          totalResults={totalResults}
        />

        <div className="section-header-bar">
          <div className="section-title-wrap">
            <div className="section-icon-badge flame">
              <Flame size={22} />
            </div>
            <div>
              <h2 className="section-main-heading">
                {selectedIndustry === 'All'
                  ? 'Popular & Iconic Movies'
                  : `${selectedIndustry} Cinema (${selectedDecade === 'All' ? '1980s to Present' : selectedDecade})`}
              </h2>
              <p className="section-sub-heading">
                Discover legendary blockbusters, critically acclaimed classics, and latest releases
              </p>
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

        <MovieList
          movies={movies}
          loading={loading}
          emptyMessage="No movies found matching the selected filters. Try choosing a different industry or era!"
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

export default HomePage;
