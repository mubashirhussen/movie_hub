import React, { useState } from 'react';
import { Play, Film, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import './index.css';

const YouTubeMediaHub = ({
  movie,
  trailerVideos = null,
  activePlayerKey = null,
  onSelectVideo,
}) => {
  const [activeTab, setActiveTab] = useState('all');

  if (!movie) return null;

  const title = movie.title || movie.name || 'Title';

  // Build the list of videos: prefer structured trailerVideos from TMDB, then movie fallback
  const rawGrouped = trailerVideos?.grouped || {};
  const trailers = Array.isArray(rawGrouped.trailers) ? rawGrouped.trailers : [];
  const teasers = Array.isArray(rawGrouped.teasers) ? rawGrouped.teasers : [];
  const clips = Array.isArray(rawGrouped.clips) ? rawGrouped.clips : [];
  const featurettes = Array.isArray(rawGrouped.featurettes) ? rawGrouped.featurettes : [];
  const behindTheScenes = Array.isArray(rawGrouped.behindTheScenes) ? rawGrouped.behindTheScenes : [];

  let allVideos = Array.isArray(trailerVideos?.allVideos) && trailerVideos.allVideos.length > 0
    ? trailerVideos.allVideos
    : [];

  // If no structured allVideos, check if movie has a verified trailer_key
  if (allVideos.length === 0 && movie.trailer_key) {
    allVideos = [
      {
        id: `primary-${movie.id}`,
        key: movie.trailer_key,
        name: `${title} - Official Trailer`,
        type: 'Trailer',
        official: true,
        site: 'YouTube',
      },
    ];
  }

  // If still completely empty: render clean fallback
  if (allVideos.length === 0) {
    return (
      <section className="youtube-media-hub-section animate-fade-in" id="trailers-teasers-section">
        <div className="hub-section-header">
          <div className="hub-header-left">
            <div className="youtube-badge-icon">
              <Film size={20} />
            </div>
            <div>
              <h2 className="hub-main-title">Official Trailers & Teasers</h2>
              <p className="hub-subtitle">Official studio trailers, teasers, and promotional videos</p>
            </div>
          </div>
        </div>
        <div
          className="player-offline-box"
          id="trailers-empty-state"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Film size={36} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }} className="no-trailer-msg">
            Trailer unavailable for this title.
          </p>
        </div>
      </section>
    );
  }

  // Filter videos based on active tab
  const getFilteredVideos = () => {
    switch (activeTab) {
      case 'trailers':
        return trailers.length > 0 ? trailers : allVideos.filter((v) => v.type === 'Trailer');
      case 'teasers':
        return teasers.length > 0 ? teasers : allVideos.filter((v) => v.type === 'Teaser');
      case 'clips':
        return clips.length > 0 ? clips : allVideos.filter((v) => v.type === 'Clip');
      case 'behindTheScenes':
        return behindTheScenes.length > 0 ? behindTheScenes : allVideos.filter((v) => v.type === 'Behind the Scenes');
      case 'featurettes':
        return featurettes.length > 0 ? featurettes : allVideos.filter((v) => v.type === 'Featurette');
      case 'all':
      default:
        return allVideos;
    }
  };

  const displayedVideos = getFilteredVideos();

  // Normalize badge css class name
  const getBadgeClass = (type) => {
    switch (type) {
      case 'Trailer':
        return 'badge-trailer';
      case 'Teaser':
        return 'badge-teaser';
      case 'Clip':
        return 'badge-clip';
      case 'Behind the Scenes':
        return 'badge-behind-the-scenes';
      case 'Featurette':
        return 'badge-featurette';
      default:
        return 'badge-trailer';
    }
  };

  return (
    <section className="youtube-media-hub-section animate-fade-in" id="trailers-teasers-section">
      <div className="hub-section-header">
        <div className="hub-header-left">
          <div className="youtube-badge-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
              <polygon points="10 15 15 12 10 9" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <h2 className="hub-main-title">Official Trailers, Teasers & Media</h2>
            <p className="hub-subtitle">
              Verified original trailers, studio teasers, behind-the-scenes clips, and featurettes
            </p>
          </div>
        </div>

        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-hub-all-yt"
          id="btn-youtube-search-external"
        >
          <span>More on YouTube</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Tabs by video category */}
      <div className="hub-category-tabs" role="tablist">
        <button
          type="button"
          className={`btn-hub-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          role="tab"
          aria-selected={activeTab === 'all'}
        >
          All ({allVideos.length})
        </button>
        {trailers.length > 0 && (
          <button
            type="button"
            className={`btn-hub-tab ${activeTab === 'trailers' ? 'active' : ''}`}
            onClick={() => setActiveTab('trailers')}
            role="tab"
            aria-selected={activeTab === 'trailers'}
          >
            Trailers ({trailers.length})
          </button>
        )}
        {teasers.length > 0 && (
          <button
            type="button"
            className={`btn-hub-tab ${activeTab === 'teasers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teasers')}
            role="tab"
            aria-selected={activeTab === 'teasers'}
          >
            Teasers ({teasers.length})
          </button>
        )}
        {clips.length > 0 && (
          <button
            type="button"
            className={`btn-hub-tab ${activeTab === 'clips' ? 'active' : ''}`}
            onClick={() => setActiveTab('clips')}
            role="tab"
            aria-selected={activeTab === 'clips'}
          >
            Clips ({clips.length})
          </button>
        )}
        {behindTheScenes.length > 0 && (
          <button
            type="button"
            className={`btn-hub-tab ${activeTab === 'behindTheScenes' ? 'active' : ''}`}
            onClick={() => setActiveTab('behindTheScenes')}
            role="tab"
            aria-selected={activeTab === 'behindTheScenes'}
          >
            Behind the Scenes ({behindTheScenes.length})
          </button>
        )}
        {featurettes.length > 0 && (
          <button
            type="button"
            className={`btn-hub-tab ${activeTab === 'featurettes' ? 'active' : ''}`}
            onClick={() => setActiveTab('featurettes')}
            role="tab"
            aria-selected={activeTab === 'featurettes'}
          >
            Featurettes ({featurettes.length})
          </button>
        )}
      </div>

      {/* Video Cards Grid */}
      <div className="hub-media-grid" id="trailers-grid">
        {displayedVideos.map((item, index) => {
          const isCurrentlyPlaying = activePlayerKey && activePlayerKey === item.key;
          const thumbnail = `https://img.youtube.com/vi/${item.key}/hqdefault.jpg`;
          const fallbackThumb = `https://img.youtube.com/vi/${item.key}/mqdefault.jpg`;

          return (
            <div
              key={`media-${item.key}-${item.type || 'video'}-${index}`}
              className={`hub-media-card ${isCurrentlyPlaying ? 'playing-card' : ''}`}
            >
              <div
                className="hub-thumbnail-wrap"
                onClick={() => onSelectVideo && onSelectVideo(item.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectVideo && onSelectVideo(item.key);
                  }
                }}
              >
                <img
                  src={thumbnail}
                  alt={item.name || `${title} video`}
                  className="hub-thumb-img"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackThumb;
                  }}
                />
                <div className="thumb-gradient-overlay" />

                <div className="hub-play-button-overlay">
                  <Play size={20} fill="#ffffff" color="#ffffff" />
                </div>

                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
                  <span className={`hub-category-badge ${getBadgeClass(item.type)}`}>
                    {item.type || 'Video'}
                  </span>
                  {item.official && (
                    <span className="hub-category-badge badge-official">
                      Official
                    </span>
                  )}
                </div>
              </div>

              <div className="hub-card-body">
                <h3 className="hub-card-title" title={item.name}>
                  {item.name || `${title} Video`}
                </h3>

                <div className="hub-card-actions">
                  <button
                    type="button"
                    className={`btn-hub-play-now ${isCurrentlyPlaying ? 'active' : ''}`}
                    onClick={() => onSelectVideo && onSelectVideo(item.key)}
                  >
                    {isCurrentlyPlaying ? (
                      <>
                        <CheckCircle2 size={13} color="#22c55e" />
                        <span>Now Playing</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} fill="currentColor" />
                        <span>Play In Player</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://www.youtube.com/watch?v=${item.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-hub-external-yt"
                    title="Open on YouTube"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default YouTubeMediaHub;
