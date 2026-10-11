import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Calendar,
  TrendingUp,
  Compass,
  Tag,
  Star,
  Clock,
  Globe2,
} from 'lucide-react';
import movieService from '../../services/movieService';
import './index.css';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'popularity.asc', label: 'Least Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'vote_average.asc', label: 'Lowest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest Release' },
  { value: 'primary_release_date.asc', label: 'Oldest Release' },
  { value: 'title.asc', label: 'Title (A to Z)' },
  { value: 'title.desc', label: 'Title (Z to A)' },
];

const INDUSTRIES = [
  { id: 'all', label: 'All Industries' },
  { id: 'tollywood', label: 'Tollywood (Telugu)', icon: '🔥' },
  { id: 'bollywood', label: 'Bollywood (Hindi)', icon: '🌟' },
  { id: 'hollywood', label: 'Hollywood (English)', icon: '🎬' },
  { id: 'kollywood', label: 'Kollywood (Tamil)', icon: '⚡' },
  { id: 'sandalwood', label: 'Sandalwood (Kannada)', icon: '🏔️' },
  { id: 'mollywood', label: 'Mollywood (Malayalam)', icon: '🌿' },
];

const LANGUAGES = [
  { code: '', label: 'All Languages' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'ko', label: 'Korean (한국어)' },
  { code: 'fr', label: 'French (Français)' },
];

const RATING_TIERS = [
  { value: '', label: 'Any Rating' },
  { value: '8.0', label: '8.0+ Exceptional', min: 8.0 },
  { value: '7.0', label: '7.0+ High Quality', min: 7.0 },
  { value: '6.0', label: '6.0+ Good', min: 6.0 },
  { value: '5.0', label: '5.0+ Average', min: 5.0 },
];

const RUNTIME_TIERS = [
  { label: 'Any Duration', min: '', max: '' },
  { label: 'Under 90 min', min: '', max: '90' },
  { label: '90 - 120 min', min: '90', max: '120' },
  { label: '120 - 150 min', min: '120', max: '150' },
  { label: '150+ min (Epic)', min: '150', max: '' },
];

const DECADE_RANGES = [
  { label: 'All Decades', yMin: '', yMax: '' },
  { label: '2020s (Current Era)', yMin: '2020', yMax: '2029' },
  { label: '2010s', yMin: '2010', yMax: '2019' },
  { label: '2000s', yMin: '2000', yMax: '2009' },
  { label: '1990s Golden Era', yMin: '1990', yMax: '1999' },
  { label: '1980s Retro Classics', yMin: '1980', yMax: '1989' },
];

const DiscoveryFilters = ({
  selectedGenre = '',
  selectedSort = 'popularity.desc',
  selectedYear = '',
  selectedYearMin = '',
  selectedYearMax = '',
  selectedLanguage = '',
  selectedMinRating = '',
  selectedMinRuntime = '',
  selectedMaxRuntime = '',
  selectedIndustry = '',
  onFilterChange,
  onResetFilters,
}) => {
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchGenresList = async () => {
      setLoadingGenres(true);
      try {
        const data = await movieService.getGenres();
        if (isMounted && data.genres) {
          setGenres(data.genres);
        }
      } catch (err) {
        console.warn('Failed to fetch genres list:', err.message);
      } finally {
        if (isMounted) setLoadingGenres(false);
      }
    };

    fetchGenresList();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenreClick = (genreId) => {
    const newGenre = String(selectedGenre) === String(genreId) ? '' : String(genreId);
    onFilterChange({ genre: newGenre });
  };

  const handleSortChange = (e) => {
    onFilterChange({ sortBy: e.target.value });
  };

  const handleIndustryChange = (e) => {
    onFilterChange({ industry: e.target.value === 'all' ? '' : e.target.value });
  };

  const handleLanguageChange = (e) => {
    onFilterChange({ language: e.target.value });
  };

  const handleRatingClick = (val) => {
    onFilterChange({ minRating: String(selectedMinRating) === String(val) ? '' : val });
  };

  const handleRuntimeClick = (min, max) => {
    const isCurrent = String(selectedMinRuntime) === String(min) && String(selectedMaxRuntime) === String(max);
    if (isCurrent) {
      onFilterChange({ minRuntime: '', maxRuntime: '' });
    } else {
      onFilterChange({ minRuntime: min, maxRuntime: max });
    }
  };

  const handleDecadeClick = (yMin, yMax) => {
    const isCurrent = String(selectedYearMin) === String(yMin) && String(selectedYearMax) === String(yMax);
    if (isCurrent) {
      onFilterChange({ yearMin: '', yearMax: '', year: '' });
    } else {
      onFilterChange({ yearMin: yMin, yearMax: yMax, year: '' });
    }
  };

  const activeGenreObj = genres.find((g) => String(g.id) === String(selectedGenre));
  const activeIndustryObj = INDUSTRIES.find((i) => i.id === selectedIndustry);
  const activeLanguageObj = LANGUAGES.find((l) => l.code === selectedLanguage);

  const hasActiveFilters = Boolean(
    selectedGenre ||
    (selectedSort && selectedSort !== 'popularity.desc') ||
    selectedYear ||
    selectedYearMin ||
    selectedYearMax ||
    selectedLanguage ||
    selectedMinRating ||
    selectedMinRuntime ||
    selectedMaxRuntime ||
    (selectedIndustry && selectedIndustry !== 'all')
  );

  return (
    <div className="discovery-filters-wrapper">
      {/* Top Filter Bar Controls */}
      <div className="filters-control-bar">
        <div className="filters-left-group">
          <button
            type="button"
            className={`filter-toggle-btn ${expanded ? 'active' : ''}`}
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <SlidersHorizontal size={16} />
            <span>Filters &amp; Discovery Drawer</span>
            {hasActiveFilters && <span className="active-filter-indicator" />}
          </button>

          {/* Industry Dropdown */}
          <div className="filter-select-group">
            <Compass size={15} className="select-lead-icon" />
            <select
              className="filter-select"
              value={selectedIndustry || 'all'}
              onChange={handleIndustryChange}
              aria-label="Filter by Cinema Industry"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.icon ? `${ind.icon} ` : ''}{ind.label}
                </option>
              ))}
            </select>
          </div>

          {/* Language Dropdown */}
          <div className="filter-select-group">
            <Globe2 size={15} className="select-lead-icon" />
            <select
              className="filter-select"
              value={selectedLanguage || ''}
              onChange={handleLanguageChange}
              aria-label="Filter by Language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Sort Order Selector */}
        <div className="filters-right-group">
          <div className="filter-select-group sort-group">
            <TrendingUp size={15} className="select-lead-icon" />
            <select
              className="filter-select"
              value={selectedSort}
              onChange={handleSortChange}
              aria-label="Sort Movies By"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="filter-reset-btn"
              onClick={onResetFilters}
              title="Reset all filters to defaults"
            >
              <RotateCcw size={14} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Multi-Filter Drawer Section */}
      {expanded && (
        <div className="discovery-drawer-panel animate-fade-in">
          {/* 1. Genre Chips */}
          <div className="drawer-filter-section">
            <div className="drawer-section-header">
              <span className="drawer-section-label">
                <Tag size={13} />
                <span>Genres</span>
              </span>
              {selectedGenre && (
                <button
                  type="button"
                  className="clear-section-btn"
                  onClick={() => onFilterChange({ genre: '' })}
                >
                  Clear Genre
                </button>
              )}
            </div>
            <div className="chips-grid">
              {genres.map((g) => {
                const isSelected = String(selectedGenre) === String(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleGenreClick(g.id)}
                    aria-pressed={isSelected}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Minimum Rating Filter (TMDB Verified Source) */}
          <div className="drawer-filter-section">
            <div className="drawer-section-header">
              <span className="drawer-section-label">
                <Star size={13} />
                <span>Minimum Rating (TMDB Sourced)</span>
              </span>
              <span className="drawer-section-sub">Verified audience score</span>
            </div>
            <div className="chips-grid">
              {RATING_TIERS.map((tier) => {
                const isSelected =
                  (tier.value === '' && !selectedMinRating) ||
                  String(selectedMinRating) === String(tier.value);
                return (
                  <button
                    key={tier.label}
                    type="button"
                    className={`filter-chip rating-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleRatingClick(tier.value)}
                    aria-pressed={isSelected}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Runtime Duration Filter */}
          <div className="drawer-filter-section">
            <div className="drawer-section-header">
              <span className="drawer-section-label">
                <Clock size={13} />
                <span>Runtime Range</span>
              </span>
            </div>
            <div className="chips-grid">
              {RUNTIME_TIERS.map((rt) => {
                const isSelected =
                  (!rt.min && !rt.max && !selectedMinRuntime && !selectedMaxRuntime) ||
                  (String(selectedMinRuntime) === String(rt.min) &&
                    String(selectedMaxRuntime) === String(rt.max));
                return (
                  <button
                    key={rt.label}
                    type="button"
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleRuntimeClick(rt.min, rt.max)}
                    aria-pressed={isSelected}
                  >
                    {rt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Release Era / Decade Range */}
          <div className="drawer-filter-section">
            <div className="drawer-section-header">
              <span className="drawer-section-label">
                <Calendar size={13} />
                <span>Release Era / Decades</span>
              </span>
            </div>
            <div className="chips-grid">
              {DECADE_RANGES.map((dec) => {
                const isSelected =
                  (!dec.yMin && !dec.yMax && !selectedYearMin && !selectedYearMax) ||
                  (String(selectedYearMin) === String(dec.yMin) &&
                    String(selectedYearMax) === String(dec.yMax));
                return (
                  <button
                    key={dec.label}
                    type="button"
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleDecadeClick(dec.yMin, dec.yMax)}
                    aria-pressed={isSelected}
                  >
                    {dec.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips Row */}
      {hasActiveFilters && (
        <div className="active-filter-chips-row animate-fade-in">
          <span className="active-chips-label">Active:</span>

          {activeGenreObj && (
            <span className="active-tag-badge">
              Genre: {activeGenreObj.name}
              <button
                type="button"
                onClick={() => onFilterChange({ genre: '' })}
                aria-label="Remove genre filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {activeIndustryObj && activeIndustryObj.id !== 'all' && (
            <span className="active-tag-badge">
              Industry: {activeIndustryObj.label}
              <button
                type="button"
                onClick={() => onFilterChange({ industry: '' })}
                aria-label="Remove industry filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {activeLanguageObj && activeLanguageObj.code && (
            <span className="active-tag-badge">
              Lang: {activeLanguageObj.label}
              <button
                type="button"
                onClick={() => onFilterChange({ language: '' })}
                aria-label="Remove language filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {selectedMinRating && (
            <span className="active-tag-badge">
              Rating: {selectedMinRating}+ ⭐ (TMDB)
              <button
                type="button"
                onClick={() => onFilterChange({ minRating: '' })}
                aria-label="Remove rating filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {(selectedMinRuntime || selectedMaxRuntime) && (
            <span className="active-tag-badge">
              Runtime: {selectedMinRuntime ? `${selectedMinRuntime}m` : '0m'} - {selectedMaxRuntime ? `${selectedMaxRuntime}m` : 'Max'}
              <button
                type="button"
                onClick={() => onFilterChange({ minRuntime: '', maxRuntime: '' })}
                aria-label="Remove runtime filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {(selectedYearMin || selectedYearMax) && (
            <span className="active-tag-badge">
              Era: {selectedYearMin || 'Earliest'} - {selectedYearMax || 'Latest'}
              <button
                type="button"
                onClick={() => onFilterChange({ yearMin: '', yearMax: '', year: '' })}
                aria-label="Remove era filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {selectedYear && (
            <span className="active-tag-badge">
              Year: {selectedYear}
              <button
                type="button"
                onClick={() => onFilterChange({ year: '' })}
                aria-label="Remove year filter"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {selectedSort && selectedSort !== 'popularity.desc' && (
            <span className="active-tag-badge">
              {SORT_OPTIONS.find((s) => s.value === selectedSort)?.label || selectedSort}
              <button
                type="button"
                onClick={() => onFilterChange({ sortBy: 'popularity.desc' })}
                aria-label="Reset sort order"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscoveryFilters;
