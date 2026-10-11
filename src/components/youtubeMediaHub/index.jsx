import React from 'react';
import { Play, Film, ExternalLink, Image as ImageIcon, Sparkles, Video } from 'lucide-react';
import './index.css';

const YouTubeMediaHub = ({ movie, onSelectVideo }) => {
  if (!movie) return null;

  const ytKey = movie.trailer_key || movie.youtube_full_movie_key || null;
  const title = movie.title || 'Movie';

  if (!ytKey) {
    return (
      <section className="youtube-media-hub-section animate-fade-in">
        <div className="hub-section-header">
          <div className="hub-header-left">
            <div className="youtube-badge-icon">
              <Film size={20} />
            </div>
            <div>
              <h3 className="hub-heading">Official Videos & Media Hub</h3>
              <p className="hub-subheading">High-definition trailers, official teasers and promo clips</p>
            </div>
          </div>
        </div>
        <div className="player-offline-box" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Film size={36} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>Trailer unavailable for this title.</p>
        </div>
      </section>
    );
  }

  // Build list of verified YouTube media items for this title
  const mediaList = [
    {
      id: 'main-trailer',
      type: 'Official Trailer',
      title: `${title} - Official Main Trailer`,
      key: ytKey,
      thumbnail: `https://img.youtube.com/vi/${ytKey}/hqdefault.jpg`,
      fallbackThumb: `https://img.youtube.com/vi/${ytKey}/mqdefault.jpg`,
      duration: '2:45',
      badge: 'TRAILER',
    },
    ...(Array.isArray(movie.youtube_teasers) && movie.youtube_teasers[0] && movie.youtube_teasers[0] !== ytKey
      ? [
          {
            id: 'teaser-1',
            type: 'Official Teaser',
            title: `${title} - First Look & Title Teaser`,
            key: movie.youtube_teasers[0],
            thumbnail: `https://img.youtube.com/vi/${movie.youtube_teasers[0]}/hqdefault.jpg`,
            fallbackThumb: `https://img.youtube.com/vi/${movie.youtube_teasers[0]}/mqdefault.jpg`,
            duration: '1:30',
            badge: 'TEASER',
          },
        ]
      : []),
  ];

  return (
    <section className="youtube-media-hub-section animate-fade-in">
      <div className="hub-section-header">
        <div className="hub-header-left">
          <div className="youtube-badge-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
              <polygon points="10 15 15 12 10 9" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <h2 className="hub-main-title">YouTube Trailers, Teasers & Media Hub</h2>
            <p className="hub-subtitle">
              Verified original trailers, official teasers, studio posts & full movie YouTube streaming links
            </p>
          </div>
        </div>

        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-hub-all-yt"
        >
          <span>More on YouTube</span>
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="hub-media-grid">
        {mediaList.map((item) => (
          <div key={item.id} className="hub-media-card">
            <div
              className="hub-thumbnail-wrap"
              onClick={() => onSelectVideo(item.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectVideo(item.key);
                }
              }}
            >
              <img
                src={item.thumbnail}
                alt={item.title}
                className="hub-thumb-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = item.fallbackThumb;
                }}
              />
              <div className="thumb-gradient-overlay" />
              
              <div className="hub-play-button-overlay">
                <Play size={20} fill="#ffffff" color="#ffffff" />
              </div>

              <span className="hub-duration-tag">{item.duration}</span>
              <span className={`hub-category-badge badge-${item.badge.toLowerCase().replace(' ', '-')}`}>
                {item.badge}
              </span>
            </div>

            <div className="hub-card-body">
              <h3 className="hub-card-title" title={item.title}>{item.title}</h3>
              <div className="hub-card-actions">
                <button
                  type="button"
                  className="btn-hub-play-now"
                  onClick={() => onSelectVideo(item.key)}
                >
                  <Play size={13} fill="currentColor" />
                  <span>Play In Player</span>
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
        ))}
      </div>
    </section>
  );
};

export default YouTubeMediaHub;
