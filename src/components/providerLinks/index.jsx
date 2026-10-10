import React, { useState } from 'react';
import { Tv, ExternalLink, Globe, AlertCircle, ShoppingCart, Film } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import './index.css';

const SUPPORTED_REGIONS = [
  { code: 'IN', label: 'India (IN)' },
  { code: 'US', label: 'United States (US)' },
  { code: 'GB', label: 'United Kingdom (GB)' },
  { code: 'CA', label: 'Canada (CA)' },
  { code: 'AU', label: 'Australia (AU)' },
];

const ProviderLinks = ({
  providersData,
  movieTitle = 'Movie',
  currentRegion = 'IN',
  onRegionChange,
}) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const region = providersData?.region || currentRegion || 'IN';
  const flatrate = Array.isArray(providersData?.flatrate) ? providersData.flatrate : [];
  const rent = Array.isArray(providersData?.rent) ? providersData.rent : [];
  const buy = Array.isArray(providersData?.buy) ? providersData.buy : [];
  const tmdbLink = providersData?.link || null;

  const totalProviders = flatrate.length + rent.length + buy.length;

  const handleRegionSelect = (e) => {
    if (onRegionChange) {
      onRegionChange(e.target.value);
    }
  };

  return (
    <div className="cineverse-providers-section animate-fade-in">
      {/* Top Header with Region Selector */}
      <div className="providers-header-bar">
        <div className="providers-title-row">
          <Tv size={16} className="tv-icon" />
          <span className="providers-heading">WHERE TO WATCH:</span>
        </div>

        {/* Region Switcher */}
        <div className="providers-region-selector-wrap">
          <Globe size={13} className="globe-icon" />
          <select
            className="providers-region-select"
            value={region}
            onChange={handleRegionSelect}
            aria-label="Select streaming region"
          >
            {SUPPORTED_REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {totalProviders === 0 ? (
        <div className="providers-unavailable-box">
          <AlertCircle size={15} className="alert-icon" />
          <p className="providers-unavailable-text">
            Availability information is not available for this region ({region}).
          </p>
          {tmdbLink && (
            <a
              href={tmdbLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-check-tmdb-link"
            >
              <span>Check JustWatch / TMDB</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      ) : (
        <div className="providers-content-container">
          {/* Category Tabs: All / Stream / Rent / Buy */}
          <div className="providers-category-tabs">
            <button
              type="button"
              className={`btn-provider-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All ({totalProviders})
            </button>
            {flatrate.length > 0 && (
              <button
                type="button"
                className={`btn-provider-tab ${activeCategory === 'flatrate' ? 'active' : ''}`}
                onClick={() => setActiveCategory('flatrate')}
              >
                Stream / Sub ({flatrate.length})
              </button>
            )}
            {rent.length > 0 && (
              <button
                type="button"
                className={`btn-provider-tab ${activeCategory === 'rent' ? 'active' : ''}`}
                onClick={() => setActiveCategory('rent')}
              >
                Rent ({rent.length})
              </button>
            )}
            {buy.length > 0 && (
              <button
                type="button"
                className={`btn-provider-tab ${activeCategory === 'buy' ? 'active' : ''}`}
                onClick={() => setActiveCategory('buy')}
              >
                Buy ({buy.length})
              </button>
            )}
          </div>

          {/* Provider List based on filter */}
          <div className="providers-badges-list">
            {(activeCategory === 'all' || activeCategory === 'flatrate') &&
              flatrate.map((p) => (
                <ProviderPill
                  key={`sub-${p.provider_id || p.provider_name}`}
                  provider={p}
                  typeBadge="Sub"
                  tmdbLink={tmdbLink}
                  movieTitle={movieTitle}
                />
              ))}

            {(activeCategory === 'all' || activeCategory === 'rent') &&
              rent.map((p) => (
                <ProviderPill
                  key={`rent-${p.provider_id || p.provider_name}`}
                  provider={p}
                  typeBadge="Rent"
                  tmdbLink={tmdbLink}
                  movieTitle={movieTitle}
                />
              ))}

            {(activeCategory === 'all' || activeCategory === 'buy') &&
              buy.map((p) => (
                <ProviderPill
                  key={`buy-${p.provider_id || p.provider_name}`}
                  provider={p}
                  typeBadge="Buy"
                  tmdbLink={tmdbLink}
                  movieTitle={movieTitle}
                />
              ))}
          </div>

          {/* JustWatch disclaimer & regional note */}
          <div className="providers-disclaimer-note">
            <p>
              Verified streaming data provided by JustWatch via TMDB. Availability varies by region and can change over time.
            </p>
            {tmdbLink && (
              <a
                href={tmdbLink}
                target="_blank"
                rel="noopener noreferrer"
                className="justwatch-ext-link"
              >
                <span>View Full Details on JustWatch</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProviderPill = ({ provider, typeBadge, tmdbLink, movieTitle }) => {
  const logoUrl = provider.logo_path ? getImageUrl(provider.logo_path) : null;
  const linkHref = tmdbLink || 'https://www.themoviedb.org';

  return (
    <a
      href={linkHref}
      target="_blank"
      rel="noopener noreferrer"
      className="provider-card-pill"
      title={`Watch ${movieTitle} on ${provider.provider_name} (${typeBadge})`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={provider.provider_name}
          className="provider-logo-img"
          loading="lazy"
        />
      ) : (
        <Film size={14} className="provider-icon-fallback" />
      )}
      <span className="provider-name">{provider.provider_name}</span>
      <span className={`provider-type-tag ${typeBadge.toLowerCase()}`}>{typeBadge}</span>
      <ExternalLink size={11} className="ext-icon" />
    </a>
  );
};

export default ProviderLinks;
