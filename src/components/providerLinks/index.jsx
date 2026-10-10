import React from 'react';
import { Tv, ExternalLink, Play } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import './index.css';

const fallbackProviderUrls = {
  'Amazon Prime Video': 'https://www.primevideo.com/region/eu/storefront',
  'Prime Video': 'https://www.primevideo.com/region/eu/storefront',
  'JioHotstar': 'https://www.hotstar.com/in/home',
  'Disney+ Hotstar': 'https://www.hotstar.com/in/home',
  'Disney Plus': 'https://www.hotstar.com/in/home',
  'Netflix': 'https://www.netflix.com',
  'Zee5': 'https://www.zee5.com',
  'SonyLIV': 'https://www.sonyliv.com',
  'Apple TV': 'https://tv.apple.com',
  'YouTube': 'https://www.youtube.com',
  'JioCinema': 'https://www.jiocinema.com',
};

const ProviderLinks = ({ providersData, movieTitle = 'Movie' }) => {
  // Extract flatrate / buy / rent options from TMDB watch/providers
  const flatrate = providersData?.flatrate || [];
  const rent = providersData?.rent || [];
  const buy = providersData?.buy || [];
  const tmdbLink = providersData?.link;

  const combinedProviders = [...flatrate, ...rent, ...buy];
  const uniqueProviders = Array.from(
    new Map(combinedProviders.map((item) => [item.provider_name, item])).values()
  );

  if (uniqueProviders.length === 0) {
    return (
      <div className="cineverse-providers-section">
        <div className="providers-title-row">
          <Tv size={15} className="tv-icon" />
          <span className="providers-heading">WHERE TO WATCH:</span>
        </div>
        <p className="providers-unavailable-text">
          Streaming availability unavailable for this region.
        </p>
      </div>
    );
  }

  return (
    <div className="cineverse-providers-section animate-fade-in">
      <div className="providers-title-row">
        <Tv size={15} className="tv-icon" />
        <span className="providers-heading">WHERE TO WATCH:</span>
      </div>

      <div className="providers-badges-list">
        {uniqueProviders.map((provider) => {
          const directUrl =
            fallbackProviderUrls[provider.provider_name] ||
            tmdbLink ||
            `https://www.google.com/search?q=${encodeURIComponent(movieTitle + ' watch online ' + provider.provider_name)}`;

          const logoUrl = getImageUrl(provider.logo_path);

          return (
            <a
              key={provider.provider_id || provider.provider_name}
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="provider-card-pill"
              title={`Watch ${movieTitle} on ${provider.provider_name}`}
            >
              {provider.logo_path ? (
                <img
                  src={logoUrl}
                  alt={provider.provider_name}
                  className="provider-logo-img"
                  loading="lazy"
                />
              ) : (
                <Play size={10} fill="currentColor" />
              )}
              <span className="provider-name">{provider.provider_name}</span>
              <ExternalLink size={11} className="ext-icon" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default ProviderLinks;
