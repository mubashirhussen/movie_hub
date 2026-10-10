import React from 'react';
import { Tv, Play, ExternalLink } from 'lucide-react';
import './index.css';

const providerConfigs = {
  'Netflix': {
    bg: '#e50914',
    text: '#ffffff',
    getUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`
  },
  'Amazon Prime Video': {
    bg: '#00a8e1',
    text: '#ffffff',
    getUrl: (title) => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(title)}`
  },
  'Disney+ Hotstar': {
    bg: '#113b86',
    text: '#ffffff',
    getUrl: (title) => `https://www.hotstar.com/in/explore?search_query=${encodeURIComponent(title)}`
  },
  'JioHotstar': {
    bg: '#0a3a82',
    text: '#ffffff',
    getUrl: (title) => `https://www.hotstar.com/in/home`
  },
  'JioCinema': {
    bg: '#9c27b0',
    text: '#ffffff',
    getUrl: (title) => `https://www.jiocinema.com/search/${encodeURIComponent(title)}`
  },
  'Aha': {
    bg: '#ff5000',
    text: '#ffffff',
    getUrl: (title) => `https://www.aha.video/search?q=${encodeURIComponent(title)}`
  },
  'Zee5': {
    bg: '#8230c6',
    text: '#ffffff',
    getUrl: (title) => `https://www.zee5.com/search?q=${encodeURIComponent(title)}`
  },
  'Apple TV': {
    bg: '#2d3748',
    text: '#ffffff',
    getUrl: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`
  },
  'YouTube': {
    bg: '#ff0000',
    text: '#ffffff',
    getUrl: (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' full movie')}`
  },
  'SonyLIV': {
    bg: '#0052cc',
    text: '#ffffff',
    getUrl: (title) => `https://www.sonyliv.com/search?query=${encodeURIComponent(title)}`
  }
};

const StreamProviders = ({ providers = [], movieTitle = '' }) => {
  let displayProviders = Array.isArray(providers) && providers.length > 0
    ? providers
    : ['Netflix', 'Amazon Prime Video', 'Disney+ Hotstar'];

  return (
    <div className="stream-providers-wrapper">
      <div className="stream-label">
        <Tv size={15} />
        <span>WHERE TO STREAM:</span>
      </div>
      <div className="providers-pills-list">
        {displayProviders.map((provider) => {
          const config = providerConfigs[provider] || {
            bg: '#252d4a',
            text: '#ffffff',
            getUrl: (title) => `https://www.google.com/search?q=${encodeURIComponent(title + ' watch online ' + provider)}`
          };

          const streamUrl = config.getUrl(movieTitle || 'Movie');

          return (
            <a
              key={provider}
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="provider-badge-pill"
              style={{ backgroundColor: config.bg, color: config.text }}
              title={`Watch ${movieTitle} on ${provider} (Opens in new tab)`}
            >
              <Play size={10} fill="currentColor" />
              <span>{provider}</span>
              <ExternalLink size={10} className="provider-ext-icon" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default StreamProviders;
