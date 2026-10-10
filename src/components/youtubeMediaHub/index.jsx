import React from 'react';
import { Play, Film, ExternalLink, Image as ImageIcon, Sparkles, Video } from 'lucide-react';
import './index.css';

const YouTubeMediaHub = ({ movie, onSelectVideo }) => {
  if (!movie) return null;

  const ytKey = movie.trailer_key || movie.youtube_full_movie_key || 'NgBoMJy386M';
  const title = movie.title || 'Movie';

  // Build list of YouTube media items
  const mediaList = [
    {
      id: 'main-trailer',
      type: 'Official Trailer',
      title: `${title} - Official Main Trailer`,
      key: ytKey,
      thumbnail: `https://img.youtube.com/vi/${ytKey}/maxresdefault.jpg`,
      fallbackThumb: `https://img.youtube.com/vi/${ytKey}/hqdefault.jpg`,
      duration: '2:45',
      badge: 'TRAILER',
    },
    {
      id: 'teaser-1',
      type: 'Official Teaser',
      title: `${title} - First Look & Title Teaser`,
      key: (movie.youtube_teasers && movie.youtube_teasers[0]) || ytKey,
      thumbnail: `https://img.youtube.com/vi/${(movie.youtube_teasers && movie.youtube_teasers[0]) || ytKey}/maxresdefault.jpg`,
      fallbackThumb: `https://img.youtube.com/vi/${(movie.youtube_teasers && movie.youtube_teasers[0]) || ytKey}/hqdefault.jpg`,
      duration: '1:30',
      badge: 'TEASER',
    },
    {
      id: 'full-stream',
      type: 'Full Movie Stream Link',
      title: `${title} - Full Movie HD Stream Reference`,
      key: movie.youtube_full_movie_key || ytKey,
      thumbnail: `https://img.youtube.com/vi/${movie.youtube_full_movie_key || ytKey}/maxresdefault.jpg`,
      fallbackThumb: `https://img.youtube.com/vi/${movie.youtube_full_movie_key || ytKey}/hqdefault.jpg`,
      duration: `${movie.runtime || 150}m`,
      badge: 'FULL MOVIE',
    },
    {
      id: 'promo-clip',
      type: 'Sneak Peek Promo',
      title: `${title} - High Octane Action Scene & Making`,
      key: ytKey,
      thumbnail: `https://img.youtube.com/vi/${ytKey}/hqdefault.jpg`,
      fallbackThumb: `https://img.youtube.com/vi/${ytKey}/mqdefault.jpg`,
      duration: '3:15',
      badge: 'PROMO',
    }
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
