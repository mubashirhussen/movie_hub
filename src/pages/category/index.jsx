import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Film, Sparkles, Filter, ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import movieService from '../../services/movieService';
import MovieGrid from '../../components/movieGrid';
import Pagination from '../../components/pagination';
import Loading from '../../components/loading';
import ErrorMessage from '../../components/errorMessage';
import './index.css';

const industryMetadata = {
  tollywood: {
    title: 'Tollywood Cinema (Telugu)',
    tagline: 'High-octane mass action, mythological epics, and timeless musical classics',
    icon: '🔥',
    accentColor: '#f97316',
  },
  bollywood: {
    title: 'Bollywood Cinema (Hindi)',
    tagline: 'Grand romantic sagas, high-stakes thrillers, and iconic Indian blockbusters',
    icon: '🌟',
    accentColor: '#ec4899',
  },
  hollywood: {
    title: 'Hollywood Cinema (Global)',
    tagline: 'Sci-fi masterworks, cinematic universes, and academy-award winning epics',
    icon: '🎬',
    accentColor: '#3b82f6',
  },
  kollywood: {
    title: 'Kollywood Cinema (Tamil)',
    tagline: 'Gritty action dramas, visionary auteur cinema, and superstar spectacles',
    icon: '⚡',
    accentColor: '#eab308',
  },
  sandalwood: {
    title: 'Sandalwood Cinema (Kannada)',
    tagline: 'Record-shattering pan-Indian phenomena, native folklore, and intense sagas',
    icon: '🏔️',
    accentColor: '#10b981',
  },
  mollywood: {
    title: 'Mollywood Cinema (Malayalam)',
    tagline: 'Realistic storytelling, survival thrillers, and award-winning masterpieces',
    icon: '🌿',
    accentColor: '#06b6d4',
  },
};

const CategoryPage = () => {
  const { industry } = useParams();
  const currentIndustry = (industry || 'tollywood').toLowerCase();

  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const meta = industryMetadata[currentIndustry] || {
    title: `${currentIndustry.toUpperCase()} Cinema`,
    tagline: 'Explore verified original movies, cast, and trailers',
    icon: '🎬',
    accentColor: '#e50914',
  };

  const industriesList = [
    { key: 'tollywood', label: 'Tollywood', icon: '🔥', lang: 'Telugu' },
    { key: 'bollywood', label: 'Bollywood', icon: '🌟', lang: 'Hindi' },
    { key: 'hollywood', label: 'Hollywood', icon: '🎬', lang: 'English' },
    { key: 'kollywood', label: 'Kollywood', icon: '⚡', lang: 'Tamil' },
    { key: 'sandalwood', label: 'Sandalwood', icon: '🏔️', lang: 'Kannada' },
    { key: 'mollywood', label: 'Mollywood', icon: '🌿', lang: 'Malayalam' },
  ];

  const fetchMovies = async (page = 1) => {
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const data = await movieService.getMoviesByIndustry(currentIndustry, page);
      setMovies(data.results || []);
      setCurrentPage(data.page || page);
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || (data.results ? data.results.length : 0));
    } catch (err) {
      setError(err.message || `Unable to load ${meta.title} collection.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchMovies(1);
  }, [currentIndustry]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchMovies(newPage);
    }
  };

  return (
    <div className="cineverse-category-page">
      {/* Category Hero Banner */}
      <section className="category-hero-header">
        <div className="container category-hero-inner">
          <div className="category-badge-pill" style={{ borderColor: meta.accentColor }}>
            <span className="cat-icon">{meta.icon}</span>
            <span className="cat-badge-name">Cinema Industry Category</span>
          </div>

          <h1 className="category-main-heading">{meta.title}</h1>
          <p className="category-sub-heading">{meta.tagline}</p>

          {/* Industry Filter Pills */}
          <div className="industry-pills-nav">
            {industriesList.map((item) => {
              const isActive = currentIndustry === item.key;
              return (
                <Link
                  key={item.key}
                  to={`/category/${item.key}`}
                  className={`industry-pill-btn ${isActive ? 'active' : ''}`}
                >
                  <span className="pill-icon">{item.icon}</span>
                  <span className="pill-label">{item.label}</span>
                  <span className="pill-lang">({item.lang})</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container category-content-container">
        <div className="category-toolbar-row">
          <div className="results-count-badge">
            <Film size={16} />
            <span>
              Showing {movies.length} {movies.length === 1 ? 'Movie' : 'Movies'} • Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        {loading ? (
          <Loading message={`Fetching verified ${meta.title} collection...`} />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => fetchMovies(currentPage)} />
        ) : (
          <>
            <MovieGrid movies={movies} loading={false} />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;
