import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star, Calendar, ChevronRight, Compass, Sparkles } from 'lucide-react';
import HeroSection from '../../components/heroSection';
import MovieGrid from '../../components/movieGrid';
import Loading from '../../components/loading';
import ErrorMessage from '../../components/errorMessage';
import movieService from '../../services/movieService';
import './index.css';

const industries = [
  { id: 'tollywood', name: 'Tollywood', icon: '🔥', desc: 'Telugu Cinema', color: '#f97316' },
  { id: 'bollywood', name: 'Bollywood', icon: '🌟', desc: 'Hindi Cinema', color: '#ec4899' },
  { id: 'hollywood', name: 'Hollywood', icon: '🎬', desc: 'Global Cinema', color: '#3b82f6' },
  { id: 'kollywood', name: 'Kollywood', icon: '⚡', desc: 'Tamil Cinema', color: '#eab308' },
  { id: 'sandalwood', name: 'Sandalwood', icon: '🏔️', desc: 'Kannada Cinema', color: '#10b981' },
  { id: 'mollywood', name: 'Mollywood', icon: '🌿', desc: 'Malayalam Cinema', color: '#06b6d4' },
];

const Home = () => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState('tollywood');
  const [industryMovies, setIndustryMovies] = useState([]);
  const [industryLoading, setIndustryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHomeContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const [popData, topData, upData, indData] = await Promise.all([
        movieService.getPopularMovies(1),
        movieService.getTopRatedMovies(1),
        movieService.getUpcomingMovies(1),
        movieService.getMoviesByIndustry('tollywood', 1),
      ]);

      setPopularMovies(popData.results || []);
      setTopRatedMovies(topData.results || []);
      setUpcomingMovies(upData.results || []);
      setIndustryMovies(indData.results || []);
    } catch (err) {
      setError(err.message || 'Unable to load movie discovery streams.');
    } finally {
      setLoading(false);
    }
  };

  const handleIndustrySelect = async (industryId) => {
    if (industryId === selectedIndustry) return;
    setSelectedIndustry(industryId);
    setIndustryLoading(true);
    try {
      const data = await movieService.getMoviesByIndustry(industryId, 1);
      setIndustryMovies(data.results || []);
    } catch (err) {
      console.warn('Failed to load industry movies:', err);
    } finally {
      setIndustryLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeContent();
  }, []);

  if (loading) {
    return <Loading message="Curating CineVerse trending movies & streaming information..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchHomeContent} />;
  }

  const featuredMovie = popularMovies[0] || topRatedMovies[0];

  return (
    <div className="cineverse-home-page">
      {/* 1. Dynamic Hero Section */}
      {featuredMovie && <HeroSection movie={featuredMovie} />}

      <main className="container home-content-layout">
        {/* 2. Industry Categories Spotlight Section */}
        <section className="home-movie-section industry-spotlight-section">
          <div className="section-header-row">
            <div className="section-title-group">
              <div className="section-icon-badge compass">
                <Compass size={18} />
              </div>
              <div>
                <h2 className="section-heading">Explore by Cinema Industry</h2>
                <p className="section-subheading">
                  Tollywood, Bollywood, Hollywood, Kollywood, Sandalwood & Mollywood
                </p>
              </div>
            </div>

            <Link to={`/category/${selectedIndustry}`} className="btn-view-all-section">
              <span>View Full {industries.find(i => i.id === selectedIndustry)?.name}</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Industry Filter Pills */}
          <div className="home-industry-nav-pills">
            {industries.map((ind) => {
              const isSelected = selectedIndustry === ind.id;
              return (
                <button
                  key={ind.id}
                  type="button"
                  className={`home-industry-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleIndustrySelect(ind.id)}
                  style={{ '--active-color': ind.color }}
                >
                  <span className="pill-emoji">{ind.icon}</span>
                  <div className="pill-text-wrap">
                    <span className="pill-title">{ind.name}</span>
                    <span className="pill-desc">{ind.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {industryLoading ? (
            <div className="industry-loading-shimmer">
              <p>Loading cinema collection...</p>
            </div>
          ) : (
            <MovieGrid movies={industryMovies.slice(0, 10)} />
          )}
        </section>

        {/* 3. Popular Section */}
        <section className="home-movie-section">
          <div className="section-header-row">
            <div className="section-title-group">
              <div className="section-icon-badge flame">
                <Flame size={18} />
              </div>
              <div>
                <h2 className="section-heading">Popular Movies</h2>
                <p className="section-subheading">Trending blockbusters watched worldwide</p>
              </div>
            </div>

            <Link to="/popular" className="btn-view-all-section">
              <span>View All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <MovieGrid movies={popularMovies.slice(0, 10)} />
        </section>

        {/* 4. Top Rated Section */}
        <section className="home-movie-section">
          <div className="section-header-row">
            <div className="section-title-group">
              <div className="section-icon-badge star">
                <Star size={18} />
              </div>
              <div>
                <h2 className="section-heading">Top Rated Masterpieces</h2>
                <p className="section-subheading">Critically acclaimed cinema rated highest by fans</p>
              </div>
            </div>

            <Link to="/top-rated" className="btn-view-all-section">
              <span>View All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <MovieGrid movies={topRatedMovies.slice(0, 10)} />
        </section>

        {/* 5. Upcoming Section */}
        <section className="home-movie-section">
          <div className="section-header-row">
            <div className="section-title-group">
              <div className="section-icon-badge calendar">
                <Calendar size={18} />
              </div>
              <div>
                <h2 className="section-heading">Upcoming Releases</h2>
                <p className="section-subheading">Arriving soon in theaters and streaming platforms</p>
              </div>
            </div>

            <Link to="/upcoming" className="btn-view-all-section">
              <span>View All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <MovieGrid movies={upcomingMovies.slice(0, 10)} />
        </section>
      </main>
    </div>
  );
};

export default Home;
