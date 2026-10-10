import React, { useState } from 'react';
import { Play, Maximize, Film, Volume2, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import './index.css';

const MovieVideoPlayer = ({ title, videoKey, backdropUrl, movie }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeServer, setActiveServer] = useState('Server 1 (4K Ultra HD)');
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  const defaultKey = videoKey || 'NgBoMJy386M';

  const servers = [
    { id: 'server1', name: 'Server 1 (4K Ultra HD)', desc: 'Fastest Multi-Audio Stream' },
    { id: 'server2', name: 'Server 2 (1080p FHD)', desc: 'Official Cinema Player' },
    { id: 'server3', name: 'Server 3 (Original Cut)', desc: 'Director Edition Stream' }
  ];

  return (
    <section className={`movie-video-player-section animate-fade-in ${isCinemaMode ? 'cinema-mode-active' : ''}`}>
      <div className="player-header-bar">
        <div className="player-title-box">
          <Film size={22} className="player-icon-gradient" />
          <div>
            <h2 className="player-main-title">Watch Full Movie / Stream Video: {title}</h2>
            <p className="player-sub-title">Watch in Ultra HD 4K • Official High Bitrate Stream • Multi-Language Audio</p>
          </div>
        </div>

        <div className="player-badge-group">
          <span className="badge-4k">4K ULTRA HD</span>
          <span className="badge-audio">Dolby Atmos 5.1</span>
          <button
            className={`btn-cinema-mode ${isCinemaMode ? 'active' : ''}`}
            onClick={() => setIsCinemaMode(!isCinemaMode)}
          >
            <Maximize size={15} />
            <span>{isCinemaMode ? 'Exit Theater Mode' : 'Theater Mode'}</span>
          </button>
        </div>
      </div>

      {/* Video Frame Display */}
      <div className="player-frame-wrapper">
        {!isPlaying ? (
          <div
            className="player-cover-banner"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="player-cover-overlay" />
            <div className="player-play-trigger-box animate-fade-in">
              <button
                className="big-play-btn"
                onClick={() => setIsPlaying(true)}
                aria-label={`Play ${title}`}
              >
                <Play size={36} fill="#ffffff" color="#ffffff" className="play-triangle-icon" />
              </button>
              <div className="trigger-text-meta">
                <h3>Click to Start Full Video Stream</h3>
                <p>Streaming source: {activeServer}</p>
              </div>
            </div>

            <div className="stream-security-banner">
              <ShieldCheck size={16} />
              <span>Verified High Speed HD Stream • No Buffering</span>
            </div>
          </div>
        ) : (
          <div className="active-video-iframe-container">
            <iframe
              src={`https://www.youtube.com/embed/${defaultKey}?autoplay=1&rel=0&modestbranding=1`}
              title={`Watch ${title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* Server & Streaming Quality Switcher */}
      <div className="player-servers-control-bar">
        <div className="servers-label">
          <Layers size={16} />
          <span>Switch Streaming Server:</span>
        </div>
        <div className="server-buttons-list">
          {servers.map((srv) => (
            <button
              key={srv.id}
              className={`server-toggle-btn ${activeServer === srv.name ? 'active' : ''}`}
              onClick={() => {
                setActiveServer(srv.name);
                setIsPlaying(true);
              }}
            >
              <span className="server-dot" />
              <span className="server-name">{srv.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MovieVideoPlayer;
