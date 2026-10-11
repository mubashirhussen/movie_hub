import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Download, CheckCircle2, ShieldCheck, Film, HardDrive, Sparkles, X, ExternalLink, Play, AlertCircle, Smartphone } from 'lucide-react';
import './index.css';

const DownloadModal = ({ isOpen, onClose, movie }) => {
  const [downloadingQuality, setDownloadingQuality] = useState(null);
  const [progress, setProgress] = useState(0);
  const [downloadedList, setDownloadedList] = useState([]);

  if (!isOpen || !movie) return null;

  const title = movie.title || movie.name || 'Movie';
  const ytKey = movie.trailer_key || movie.youtube_full_movie_key || null;

  const officialAppOptions = [
    {
      id: 'netflix',
      name: 'Netflix App Offline Downloads',
      description: 'Download in official Netflix Android/iOS/Windows app for offline viewing',
      quality: 'Up to 4K UHD (Plan-dependent)',
      url: 'https://help.netflix.com/en/node/54816',
      badge: 'OFFICIAL APP',
      badgeColor: 'badge-emerald',
    },
    {
      id: 'prime',
      name: 'Prime Video Mobile Downloads',
      description: 'Save titles offline inside Prime Video app on phone or tablet',
      quality: 'HD / 1080p / 4K UHD',
      url: 'https://www.amazon.com/gp/video/splash/download',
      badge: 'OFFICIAL APP',
      badgeColor: 'badge-blue',
    },
    {
      id: 'hotstar',
      name: 'Disney+ Hotstar Downloads',
      description: 'Official in-app download feature for subscriber offline playback',
      quality: 'HD / 4K Dolby Vision',
      url: 'https://www.hotstar.com',
      badge: 'OFFICIAL APP',
      badgeColor: 'badge-gold',
    },
  ];

  const companionPackages = [
    {
      id: 'meta_package',
      label: 'Complete Movie Companion & Metadata Kit',
      resolution: 'Official Posters, Synopsis & Verified Links',
      format: 'TXT / JSON (Official Streaming & Metadata Guide)',
      size: '12 KB',
      badge: 'COMPANION KIT',
      badgeColor: 'badge-purple',
      speed: 'Instant Download',
    },
  ];

  const handleStartDownload = (option) => {
    if (downloadingQuality) return;
    setDownloadingQuality(option.id);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingQuality(null);
          setDownloadedList((prevList) => [...prevList, option.id]);
          triggerActualFileDownload(option);
          return 100;
        }
        const increment = Math.floor(Math.random() * 25) + 20;
        return Math.min(100, prev + increment);
      });
    }, 250);
  };

  const triggerActualFileDownload = (option) => {
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Companion_Package.txt`;
    const content = `🎬 CineVerse Verified Movie Guide & Companion Kit
==================================================
Title: ${title}
Release Date: ${movie.release_date || movie.first_air_date || 'N/A'}
Original Language: ${movie.original_language || 'en'}
TMDB ID: ${movie.id}

Official Trailer Key: ${ytKey || 'N/A'}
Direct YouTube Trailer: ${ytKey ? `https://www.youtube.com/watch?v=${ytKey}` : 'N/A'}

LEGAL OFFLINE PLAYBACK NOTICE:
--------------------------------------------------
To respect creator copyrights and distribution licenses, full movies
cannot be extracted or exported as MP4 files through CineVerse.

To watch ${title} offline legally:
1. Open your licensed OTT platform (Netflix, Amazon Prime Video, Disney+ Hotstar, etc.)
2. Search for "${title}" in the platform's official mobile or tablet app
3. Tap the "Download" icon next to the title for authorized offline viewing.

Quality Note: Quality varies by subscription plan; check the platform.
Attribution: Streaming data powered by JustWatch via TMDB.
==================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return ReactDOM.createPortal(
    <div className="download-modal-backdrop" onClick={onClose}>
      <div
        className="download-modal-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="download-modal-header">
          <div className="modal-title-wrap">
            <div className="download-icon-circle">
              <Download size={22} color="#e50914" />
            </div>
            <div>
              <h2 className="download-modal-heading">Download Movie to Device</h2>
              <p className="download-modal-sub">
                Official streaming availability and legal offline viewing options for <strong>{title}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close download modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="download-modal-body">
          {/* Legal Compliance Banner */}
          <div className="download-security-banner" style={{ background: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.25)' }}>
            <AlertCircle size={18} style={{ color: '#eab308', flexShrink: 0 }} />
            <span style={{ color: '#fef08a', fontSize: '0.8rem', lineHeight: '1.4' }}>
              <strong>Notice:</strong> To protect digital copyright, full movies cannot be exported as MP4 files through CineVerse. Please use the official apps of licensed platforms below for authorized offline downloads.
            </span>
          </div>

          {/* Official App Offline Download Options */}
          <div className="official-apps-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Official OTT In-App Offline Downloads
            </h4>

            {officialAppOptions.map((app) => (
              <div
                key={app.id}
                className="download-option-card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem' }}
              >
                <div className="opt-left">
                  <div className="opt-header-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Smartphone size={16} color="#38bdf8" />
                    <h4 className="opt-title" style={{ margin: 0, fontSize: '0.9rem', color: '#f8fafc' }}>{app.name}</h4>
                    <span className={`opt-badge ${app.badgeColor}`}>{app.badge}</span>
                  </div>
                  <div className="opt-details-row" style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    <span>{app.description}</span>
                  </div>
                  <div className="opt-meta-row" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    <span>{app.quality}</span>
                  </div>
                </div>

                <div className="opt-right">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-opt-download"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>Open App</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* CineVerse Metadata Companion Kit */}
          <div className="companion-package-section" style={{ marginTop: '0.75rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CineVerse Metadata & Media Kit
            </h4>
            {companionPackages.map((opt) => {
              const isDownloaded = downloadedList.includes(opt.id);
              const isCurrent = downloadingQuality === opt.id;

              return (
                <div key={opt.id} className={`download-option-card ${isCurrent ? 'active-downloading' : ''}`}>
                  <div className="opt-left">
                    <div className="opt-header-row">
                      <h4 className="opt-title">{opt.label}</h4>
                      <span className={`opt-badge ${opt.badgeColor}`}>{opt.badge}</span>
                    </div>
                    <div className="opt-details-row">
                      <span>{opt.resolution}</span>
                      <span className="dot-sep">•</span>
                      <span>{opt.format}</span>
                    </div>
                    <div className="opt-meta-row">
                      <span className="opt-size">{opt.size}</span>
                      <span className="opt-speed">{opt.speed}</span>
                    </div>
                  </div>

                  <div className="opt-right">
                    {isCurrent ? (
                      <div className="download-progress-wrap">
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="progress-text">{progress}%</span>
                      </div>
                    ) : isDownloaded ? (
                      <button type="button" className="btn-opt-downloaded" disabled>
                        <CheckCircle2 size={16} />
                        <span>Ready</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-opt-download"
                        onClick={() => handleStartDownload(opt)}
                      >
                        <Download size={16} />
                        <span>Download Kit</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Direct YouTube Media Reference Links */}
          {ytKey && (
            <div className="download-youtube-stream-box" style={{ marginTop: '0.85rem' }}>
              <div className="yt-stream-info">
                <Film size={18} color="#e50914" />
                <div>
                  <strong>Official YouTube Promotional Stream</strong>
                  <p>Open original verified trailer stream in a new tab</p>
                </div>
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${ytKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-open-yt-stream"
              >
                <Play size={14} fill="currentColor" />
                <span>Watch on YouTube</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="download-modal-footer">
          <span className="footer-note">Quality varies by plan; check the platform. Powered by JustWatch via TMDB.</span>
          <button type="button" className="btn-modal-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DownloadModal;
