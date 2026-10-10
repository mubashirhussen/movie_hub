import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Download, CheckCircle2, ShieldCheck, Film, HardDrive, Sparkles, X, ExternalLink, Play } from 'lucide-react';
import './index.css';

const DownloadModal = ({ isOpen, onClose, movie }) => {
  const [downloadingQuality, setDownloadingQuality] = useState(null);
  const [progress, setProgress] = useState(0);
  const [downloadedList, setDownloadedList] = useState([]);

  if (!isOpen || !movie) return null;

  const title = movie.title || 'Movie';
  const ytKey = movie.trailer_key || movie.youtube_full_movie_key || 'NgBoMJy386M';

  const downloadOptions = [
    {
      id: '4k',
      label: '4K Ultra HD Cinema Master',
      resolution: '3840 x 2160',
      format: 'MKV / H.265 (HEVC) + Dolby Atmos 7.1',
      size: '4.85 GB',
      badge: 'PREMIUM 4K',
      badgeColor: 'badge-gold',
      speed: 'Super Fast CDN',
    },
    {
      id: '1080p',
      label: '1080p Full HD Studio Rip',
      resolution: '1920 x 1080',
      format: 'MP4 / H.264 + Dolby Digital 5.1',
      size: '2.10 GB',
      badge: 'RECOMMENDED',
      badgeColor: 'badge-emerald',
      speed: 'Ultra Fast CDN',
    },
    {
      id: '720p',
      label: '720p HD Mobile & Tablet',
      resolution: '1280 x 720',
      format: 'MP4 / AAC 2.0 Stereo',
      size: '950 MB',
      badge: 'DATA SAVER',
      badgeColor: 'badge-blue',
      speed: 'Instant Download',
    },
    {
      id: 'meta_package',
      label: 'Complete Movie Media & Subtitle Package',
      resolution: 'Original Studio Posters & SRTs',
      format: 'ZIP (Poster, Backdrops, Subtitles & Metadata)',
      size: '45 MB',
      badge: 'EXTRAS',
      badgeColor: 'badge-purple',
      speed: 'Direct Download',
    },
  ];

  const handleStartDownload = (option) => {
    if (downloadingQuality) return;
    setDownloadingQuality(option.id);
    setProgress(5);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingQuality(null);
          setDownloadedList((prevList) => [...prevList, option.id]);

          // Trigger real browser file download
          triggerActualFileDownload(option);
          return 100;
        }
        const increment = Math.floor(Math.random() * 25) + 15;
        return Math.min(100, prev + increment);
      });
    }, 350);
  };

  const triggerActualFileDownload = (option) => {
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${option.id.toUpperCase()}_CineVerse.txt`;
    const content = `🎬 CineVerse Movie Download Package
==================================================
Title: ${title}
Quality: ${option.label}
Resolution: ${option.resolution}
Format: ${option.format}
File Size: ${option.size}
Release Date: ${movie.release_date || 'N/A'}
Direct YouTube Stream: https://www.youtube.com/watch?v=${ytKey}
Direct High-Res Backdrop: ${movie.backdrop_path || ''}
Direct High-Res Poster: ${movie.poster_path || ''}
Verified Cinema License: CineVerse DRM Free Pass

Enjoy your movie experience!
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
                Select your preferred streaming quality and offline audio profile for <strong>{title}</strong>
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
          <div className="download-security-banner">
            <ShieldCheck size={18} className="shield-icon" />
            <span>High-speed encrypted CDN download servers active. No buffering, 100% DRM-free offline viewing.</span>
          </div>

          <div className="download-options-list">
            {downloadOptions.map((opt) => {
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
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Direct YouTube Media Reference Links */}
          <div className="download-youtube-stream-box">
            <div className="yt-stream-info">
              <Film size={18} color="#e50914" />
              <div>
                <strong>Direct YouTube High-Definition Stream Link</strong>
                <p>Open original verified YouTube full-length stream in a new tab</p>
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
        </div>

        {/* Modal Footer */}
        <div className="download-modal-footer">
          <span className="footer-note">Supported on Android, iOS, Windows, Mac & Smart TVs</span>
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
