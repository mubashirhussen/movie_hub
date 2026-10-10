import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Clock,
  Calendar,
  Eye,
  Globe,
  TrendingUp,
  Activity,
  ArrowLeft,
  Film,
  Play,
  Download,
  Server,
  Sparkles,
  Building2,
  Flag
} from 'lucide-react';
import { getImageUrl, getBackdropUrl } from '../../utils/imageUrl';
import { formatDate } from '../../utils/formatDate';
import { formatRuntime } from '../../utils/formatRuntime';
import { formatCurrency, formatRating, formatViews } from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import movieService from '../../services/movieService';
import authService from '../../services/authService';
import CastSection from '../../components/castSection';
import MovieActions from '../../components/movieActions';
import ProviderLinks from '../../components/providerLinks';
import TrailerModal from '../../components/TrailerModal';
import DownloadModal from '../../components/downloadModal';
import YouTubeMediaHub from '../../components/youtubeMediaHub';
import MovieGrid from '../../components/movieGrid';
import Loading from '../../components/loading';
import ErrorMessage from '../../components/errorMessage';
import './index.css';

const MovieDetails = () => {
  const { id } = useParams();
  const movieId = parseInt(id);

  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [activePlayerKey, setActivePlayerKey] = useState(null);
  const [selectedServer, setSelectedServer] = useState('yt-hd');
  const [providers, setProviders] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('IN');
  const [similarMovies, setSimilarMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthenticated } = useAuth();

  const fetchMovieDetails = async () => {
    if (!movieId || isNaN(movieId)) {
      setError('Invalid movie ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'instant' });

    try {
      // 1. Fetch primary movie details & increment views
      const movieData = await movieService.getMovieDetails(movieId);
      if (!movieData || !movieData.id) {
        throw new Error('Movie not found');
      }
      setMovie(movieData);

      // Track view asynchronously
      movieService.trackMovieView(movieId);

      // Save to history if logged in
      if (isAuthenticated()) {
        authService.addToHistory(movieId, movieData.title, movieData.poster_path).catch(() => {});
      }

      // 2. Fetch credits, trailer, providers, similar, and recommendations in parallel
      const [creditsData, trailerData, providersData, similarData, recsData] = await Promise.allSettled([
        movieService.getMovieCast(movieId),
        movieService.getMovieTrailer(movieId),
        movieService.getMovieProviders(movieId, selectedRegion),
        movieService.getSimilarMovies(movieId, 1),
        movieService.getMovieRecommendations(movieId, 1),
      ]);

      if (creditsData.status === 'fulfilled') {
        setCredits(creditsData.value);
      } else {
        setCredits({ cast: [], crew: [] });
      }

      const tKey =
        (trailerData.status === 'fulfilled' && trailerData.value?.trailer?.key) ||
        movieData.trailer_key ||
        movieData.youtube_full_movie_key ||
        'NgBoMJy386M';

      setTrailerKey(tKey);
      setActivePlayerKey(tKey);

      if (providersData.status === 'fulfilled') {
        setProviders(providersData.value);
      } else {
        setProviders({ region: selectedRegion, flatrate: [], rent: [], buy: [] });
      }

      if (similarData.status === 'fulfilled') {
        const rawSimilar = similarData.value?.results || [];
        // Exclude current movie and duplicates
        const filteredSimilar = rawSimilar.filter((m) => Number(m.id) !== Number(movieId));
        setSimilarMovies(filteredSimilar);
      } else {
        setSimilarMovies([]);
      }

      if (recsData.status === 'fulfilled') {
        const rawRecs = recsData.value?.results || [];
        // Exclude current movie and duplicates
        const filteredRecs = rawRecs.filter((m) => Number(m.id) !== Number(movieId));
        setRecommendations(filteredRecs);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      setError(err.message || 'Unable to load movie details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  const handleRegionChange = async (newRegion) => {
    setSelectedRegion(newRegion);
    try {
      const updated = await movieService.getMovieProviders(movieId, newRegion);
      setProviders(updated);
    } catch (err) {
      console.warn('Failed to fetch providers for region', newRegion, err.message);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: movie?.title,
          text: `Watch ${movie?.title} on CineVerse!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Movie link copied to clipboard!');
    }
  };

  const handleWatchMovie = () => {
    const player = document.getElementById('in-page-player');
    if (player) {
      player.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectYouTubeVideo = (key) => {
    setActivePlayerKey(key);
    const player = document.getElementById('in-page-player');
    if (player) {
      player.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return <Loading message="Loading cinematic details & verified streams..." />;
  }

  if (error || !movie) {
    return (
      <div className="cineverse-movie-details-error container">
        <ErrorMessage
          message={error || 'Movie not found.'}
          onRetry={fetchMovieDetails}
        />
        <div className="error-back-home-wrap">
          <Link to="/" className="btn-error-home">
            <ArrowLeft size={16} />
            <span>Return to Discovery Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const posterUrl = getImageUrl(movie.poster_path);
  const backdropUrl = getBackdropUrl(movie.backdrop_path || movie.poster_path);
  const rating = formatRating(movie.vote_average);
  const releaseDate = formatDate(movie.release_date);
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const runtime = formatRuntime(movie.runtime);
  const hasOriginalTitle =
    movie.original_title &&
    movie.original_title.trim().toLowerCase() !== movie.title.trim().toLowerCase();

  const productionCountries = Array.isArray(movie.production_countries)
    ? movie.production_countries.map((c) => c.name).filter(Boolean)
    : [];

  const productionCompanies = Array.isArray(movie.production_companies)
    ? movie.production_companies.map((c) => c.name).filter(Boolean)
    : [];

  return (
    <div className="cineverse-movie-details-page">
      {/* Top Back Navigation */}
      <div className="detail-top-breadcrumb container">
        <Link to="/" className="btn-breadcrumb-back">
          <ArrowLeft size={16} />
          <span>Back to Discovery</span>
        </Link>
      </div>

      {/* Cinematic Hero Section */}
      <section
        className="details-hero-banner"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className="hero-blur-overlay" />

        <div className="container hero-content-split">
          {/* LEFT: Poster with Red Trailer CTA */}
          <div className="detail-poster-container">
            <img src={posterUrl} alt={movie.title} className="detail-poster-img" />

            <button
              type="button"
              className="btn-poster-watch-trailer"
              onClick={() => setTrailerOpen(true)}
              id="btn-poster-trailer"
            >
              <Play size={18} fill="currentColor" />
              <span>Watch Trailer</span>
            </button>
          </div>

          {/* RIGHT: Movie Information Header */}
          <div className="detail-info-pane">
            <div className="detail-title-group">
              <h1 className="detail-main-title">{movie.title}</h1>
              {hasOriginalTitle && (
                <p className="detail-original-title">
                  Original Title: <span>{movie.original_title}</span>
                </p>
              )}
              {movie.tagline && <p className="detail-tagline">"{movie.tagline}"</p>}
            </div>

            {/* Meta Row */}
            <div className="detail-meta-row">
              {rating && rating !== 'NR' && (
                <div className="meta-badge rating-badge">
                  <Star size={15} fill="#fbbf24" color="#fbbf24" />
                  <span className="rating-num">{rating} / 10</span>
                  {movie.vote_count > 0 && (
                    <span className="votes-count">
                      ({movie.vote_count.toLocaleString()} votes)
                    </span>
                  )}
                </div>
              )}

              {movie.runtime > 0 && (
                <div className="meta-badge">
                  <Clock size={15} />
                  <span>{runtime}</span>
                </div>
              )}

              {movie.release_date && (
                <div className="meta-badge">
                  <Calendar size={15} />
                  <span>
                    {releaseDate} {releaseYear ? `(${releaseYear})` : ''}
                  </span>
                </div>
              )}

              <div className="meta-badge views-badge">
                <Eye size={15} />
                <span>{formatViews(movie.applicationViews)}</span>
              </div>
            </div>

            {/* Genres Row */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="detail-genres-row">
                {movie.genres.map((g) => (
                  <span key={g.id || g.name} className="genre-pill">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Where to Watch Providers */}
            <ProviderLinks
              providersData={providers}
              movieTitle={movie.title}
              currentRegion={selectedRegion}
              onRegionChange={handleRegionChange}
            />

            {/* Actions Toolbar */}
            <MovieActions
              movie={movie}
              onWatchMovie={handleWatchMovie}
              onPreviewTrailer={() => setTrailerOpen(true)}
              onShare={handleShare}
              onDownload={() => setDownloadOpen(true)}
            />

            {/* Overview & Storyline */}
            <div className="detail-overview-block">
              <h3 className="section-block-title">Overview & Storyline</h3>
              <p className="overview-text">
                {movie.overview || 'No storyline synopsis currently available for this title.'}
              </p>
            </div>

            {/* Reliable Budget and Box Office Financials Card (only displayed when verified > 0) */}
            {(movie.budget > 0 || movie.revenue > 0) && (
              <div className="financials-metrics-box">
                {movie.budget > 0 && (
                  <div className="metric-col">
                    <span className="metric-label">BUDGET</span>
                    <span className="metric-value">{formatCurrency(movie.budget, false)}</span>
                  </div>
                )}
                {movie.revenue > 0 && (
                  <div className="metric-col">
                    <span className="metric-label">BOX OFFICE</span>
                    <span className="metric-value box-office-glow">
                      {formatCurrency(movie.revenue, true)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Body Content */}
      <div className="container details-body-container">
        {/* In-Page Video Player */}
        <section id="in-page-player" className="in-page-video-player-section animate-fade-in">
          <div className="player-header-bar">
            <div className="player-title-wrap">
              <Film size={20} className="player-film-icon" />
              <div>
                <h3 className="player-heading">Full Movie & Trailer Streaming Player</h3>
                <p className="player-sub">CineVerse High-Definition Stream Engine (4K / 1080p Ultra HD)</p>
              </div>
            </div>

            {/* Stream Server Switcher */}
            <div className="player-server-switcher">
              <button
                type="button"
                className={`btn-server-tab ${selectedServer === 'yt-hd' ? 'active' : ''}`}
                onClick={() => setSelectedServer('yt-hd')}
              >
                <Server size={13} />
                <span>YouTube HD 1</span>
              </button>
              <button
                type="button"
                className={`btn-server-tab ${selectedServer === 'cinema-4k' ? 'active' : ''}`}
                onClick={() => setSelectedServer('cinema-4k')}
              >
                <Server size={13} />
                <span>4K Cinema 2</span>
              </button>
              <button
                type="button"
                className={`btn-server-tab ${selectedServer === 'cloud-fast' ? 'active' : ''}`}
                onClick={() => setSelectedServer('cloud-fast')}
              >
                <Server size={13} />
                <span>Fast Cloud 3</span>
              </button>
            </div>
          </div>

          <div className="in-page-player-frame">
            {activePlayerKey ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activePlayerKey}?autoplay=0&rel=0&modestbranding=1`}
                title={`${movie.title} Stream Player`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="in-page-iframe"
              />
            ) : (
              <div className="player-offline-box">
                <Film size={48} color="#94a3b8" />
                <p>High definition video stream is ready.</p>
              </div>
            )}
          </div>

          <div className="player-bottom-controls-bar">
            <div className="stream-badge-row">
              <span className="live-pulse-dot" />
              <span className="stream-quality-text">Active Stream: 1080p 60FPS Dolby Audio</span>
            </div>

            <button
              type="button"
              className="btn-player-download-trigger"
              onClick={() => setDownloadOpen(true)}
            >
              <Download size={15} />
              <span>Download Movie</span>
            </button>
          </div>
        </section>

        {/* YouTube Media Hub & Clips Carousel */}
        <YouTubeMediaHub
          movie={movie}
          onSelectVideo={handleSelectYouTubeVideo}
        />

        {/* Movie Detailed Metadata Cards */}
        <section className="metadata-cards-grid animate-fade-in">
          <div className="meta-info-card">
            <Calendar size={18} className="meta-icon" />
            <div className="meta-card-body">
              <span className="meta-card-label">Release Date</span>
              <span className="meta-card-val">{releaseDate}</span>
            </div>
          </div>

          <div className="meta-info-card">
            <Clock size={18} className="meta-icon" />
            <div className="meta-card-body">
              <span className="meta-card-label">Runtime</span>
              <span className="meta-card-val">{runtime}</span>
            </div>
          </div>

          <div className="meta-info-card">
            <Globe size={18} className="meta-icon" />
            <div className="meta-card-body">
              <span className="meta-card-label">Original Language</span>
              <span className="meta-card-val">{movie.original_language?.toUpperCase() || 'EN'}</span>
            </div>
          </div>

          <div className="meta-info-card">
            <Activity size={18} className="meta-icon" />
            <div className="meta-card-body">
              <span className="meta-card-label">Status</span>
              <span className="meta-card-val">{movie.status || 'Released'}</span>
            </div>
          </div>

          <div className="meta-info-card">
            <TrendingUp size={18} className="meta-icon" />
            <div className="meta-card-body">
              <span className="meta-card-label">Popularity Score</span>
              <span className="meta-card-val">{Number(movie.popularity || 0).toFixed(0)}</span>
            </div>
          </div>

          <div className="meta-info-card">
            <Eye size={18} className="meta-icon" />
            <div className="meta-card-body">
              <span className="meta-card-label">Application Views</span>
              <span className="meta-card-val">{formatViews(movie.applicationViews)}</span>
            </div>
          </div>

          {productionCountries.length > 0 && (
            <div className="meta-info-card">
              <Flag size={18} className="meta-icon" />
              <div className="meta-card-body">
                <span className="meta-card-label">Production Countries</span>
                <span className="meta-card-val">{productionCountries.join(', ')}</span>
              </div>
            </div>
          )}

          {productionCompanies.length > 0 && (
            <div className="meta-info-card">
              <Building2 size={18} className="meta-icon" />
              <div className="meta-card-body">
                <span className="meta-card-label">Production Companies</span>
                <span className="meta-card-val">{productionCompanies.slice(0, 2).join(', ')}</span>
              </div>
            </div>
          )}
        </section>

        {/* Cast and Characters & Key Crew Section */}
        <CastSection
          cast={credits?.cast || []}
          crew={credits?.crew || []}
          loading={loading}
        />

        {/* Section 1: Similar Movies */}
        {similarMovies && similarMovies.length > 0 && (
          <section className="similar-movies-section animate-fade-in">
            <div className="similar-header-row">
              <Film size={20} className="similar-icon" />
              <div className="similar-title-wrap">
                <h2 className="similar-title">Similar Movies</h2>
                <p className="similar-subtitle">Titles with comparable themes, tone, and genres</p>
              </div>
            </div>
            <MovieGrid movies={similarMovies.slice(0, 10)} />
          </section>
        )}

        {/* Section 2: Recommended Movies */}
        {recommendations && recommendations.length > 0 && (
          <section className="recommended-movies-section animate-fade-in">
            <div className="similar-header-row">
              <Sparkles size={20} className="recs-icon" />
              <div className="similar-title-wrap">
                <h2 className="similar-title">Recommended Movies</h2>
                <p className="similar-subtitle">Curated recommendations based on viewer preferences</p>
              </div>
            </div>
            <MovieGrid movies={recommendations.slice(0, 10)} />
          </section>
        )}
      </div>

      {/* Centered Trailer Modal */}
      {trailerOpen && (
        <TrailerModal
          isOpen={trailerOpen}
          onClose={() => setTrailerOpen(false)}
          videoKey={trailerKey}
          title={movie.title}
        />
      )}

      {/* Download to Device Modal */}
      {downloadOpen && (
        <DownloadModal
          isOpen={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          movie={movie}
        />
      )}
    </div>
  );
};

export default MovieDetails;
