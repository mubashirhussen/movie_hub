import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star, Calendar, ChevronRight, Compass, Play } from 'lucide-react';
import HeroSection from '../../components/heroSection';
import MovieGrid from '../../components/movieGrid';
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
  // Independent state per section for maximum resilience
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState(null);

  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [nowPlayingLoading, setNowPlayingLoading] = useState(true);
  const [nowPlayingError, setNowPlayingError] = useState(null);

  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [topRatedError, setTopRatedError] = useState(null);

  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState(null);

  const [selectedIndustry, setSelectedIndustry] = useState('tollywood');
  const [industryMovies, setIndustryMovies] = useState([]);
  const [industryLoading, setIndustryLoading] = useState(true);
  const [industryError, setIndustryError] = useState(null);

  // References to manage race conditions and cancel obsolete industry requests
  const industryControllerRef = useRef(null);
  const industrySeqRef = useRef(0);

  const fetchPopular = async () => {
    setPopularLoading(true);
    setPopularError(null);
    try {
      const data = await movieService.getPopularMovies(1);
      setPopularMovies(data.results || []);
    } catch (err) {
      setPopularError(err.message || 'Unable to load popular movies.');
    } finally {
      setPopularLoading(false);
    }
  };

  const fetchNowPlaying = async () => {
    setNowPlayingLoading(true);
    setNowPlayingError(null);
    try {
      const data = await movieService.getNowPlayingMovies(1);
      setNowPlayingMovies(data.results || []);
    } catch (err) {
      setNowPlayingError(err.message || 'Unable to load now playing movies.');
    } finally {
      setNowPlayingLoading(false);
    }
  };

  const fetchTopRated = async () => {
    setTopRatedLoading(true);
    setTopRatedError(null);
    try {
      const data = await movieService.getTopRatedMovies(1);
      setTopRatedMovies(data.results || []);
    } catch (err) {
      setTopRatedError(err.message || 'Unable to load top rated movies.');
    } finally {
      setTopRatedLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    setUpcomingLoading(true);
    setUpcomingError(null);
    try {
      const data = await movieService.getUpcomingMovies(1);
      setUpcomingMovies(data.results || []);
    } catch (err) {
      setUpcomingError(err.message || 'Unable to load upcoming releases.');
    } finally {
      setUpcomingLoading(false);
    }
  };

  const fetchIndustry = async (industryId) => {
    // 1. Cancel in-flight industry request if any
    if (industryControllerRef.current) {
      industryControllerRef.current.abort();
    }
    const controller = new AbortController();
    industryControllerRef.current = controller;
    const currentSeq = ++industrySeqRef.current;

    setIndustryLoading(true);
    setIndustryError(null);
    try {
      const data = await movieService.getMoviesByIndustry(industryId, 1, {
        signal: controller.signal,
      });
      // 2. Only commit state if this is the newest requested industry
      if (currentSeq === industrySeqRef.current) {
        setIndustryMovies(data.results || []);
      }
    } catch (err) {
      // Ignore deliberate abort/cancel errors
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      if (currentSeq === industrySeqRef.current) {
        setIndustryError(err.message || `Unable to load ${industryId} cinema.`);
      }
    } finally {
      if (currentSeq === industrySeqRef.current) {
        setIndustryLoading(false);
      }
    }
  };

  useEffect(() => {
    // Concurrently load all sections on mount
    fetchPopular();
    fetchNowPlaying();
    fetchTopRated();
    fetchUpcoming();
    fetchIndustry('tollywood');

    return () => {
      if (industryControllerRef.current) {
        industryControllerRef.current.abort();
      }
    };
  }, []);

  const handleIndustrySelect = (industryId) => {
    if (industryId === selectedIndustry) return;
    setSelectedIndustry(industryId);
    fetchIndustry(industryId);
  };

  const featuredMovie = popularMovies[0] || topRatedMovies[0] || upcomingMovies[0];

  return (
    <div className="cineverse-home-page">
      {/* 1. Dynamic Hero Spotlight */}
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
                  Tollywood, Bollywood, Hollywood, Kollywood, Sandalwood &amp; Mollywood
                </p>
              </div>
            </div>

            <Link to={`/category/${selectedIndustry}`} className="btn-view-all-section">
              <span>View Full {industries.find((i) => i.id === selectedIndustry)?.name}</span>
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
                  aria-pressed={isSelected}
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

          <MovieGrid
            movies={industryMovies.slice(0, 10)}
            loading={industryLoading}
            error={industryError}
            onRetry={() => fetchIndustry(selectedIndustry)}
            emptyMessage={`No movies found for ${industries.find((i) => i.id === selectedIndustry)?.name || 'this industry'}.`}
            skeletonCount={5}
          />
        </section>

        {/* 3. Popular Movies Section */}
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

          <MovieGrid
            movies={popularMovies.slice(0, 10)}
            loading={popularLoading}
            error={popularError}
            onRetry={fetchPopular}
            emptyMessage="No popular movies found right now."
            skeletonCount={5}
          />
        </section>

        {/* 4. Now Playing in Theaters Section */}
        <section className="home-movie-section">
          <div className="section-header-row">
            <div className="section-title-group">
              <div className="section-icon-badge flame">
                <Play size={18} fill="currentColor" />
              </div>
              <div>
                <h2 className="section-heading">Now Playing in Theaters</h2>
                <p className="section-subheading">Current big screen releases and streaming premieres</p>
              </div>
            </div>

            <Link to="/now-playing" className="btn-view-all-section">
              <span>View All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <MovieGrid
            movies={nowPlayingMovies.slice(0, 10)}
            loading={nowPlayingLoading}
            error={nowPlayingError}
            onRetry={fetchNowPlaying}
            emptyMessage="No currently playing releases found."
            skeletonCount={5}
          />
        </section>

        {/* 5. Top Rated Masterpieces Section */}
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

          <MovieGrid
            movies={topRatedMovies.slice(0, 10)}
            loading={topRatedLoading}
            error={topRatedError}
            onRetry={fetchTopRated}
            emptyMessage="No top-rated movies found."
            skeletonCount={5}
          />
        </section>

        {/* 5. Upcoming Releases Section */}
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

          <MovieGrid
            movies={upcomingMovies.slice(0, 10)}
            loading={upcomingLoading}
            error={upcomingError}
            onRetry={fetchUpcoming}
            emptyMessage="No upcoming releases found."
            skeletonCount={5}
          />
        </section>
      </main>
    </div>
  );
};

export default Home;
