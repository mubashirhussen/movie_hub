import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, RotateCcw, Calendar, TrendingUp, Compass, Tag } from 'lucide-react';
import movieService from '../../services/movieService';
import './index.css';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'popularity.asc', label: 'Least Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'vote_average.asc', label: 'Lowest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest Release' },
  { value: 'primary_release_date.asc', label: 'Oldest Release' },
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

const YEAR_OPTIONS = [
  { value: '', label: 'All Years' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
  { value: '2020', label: '2020' },
  { value: '2019', label: '2019' },
  { value: '2018', label: '2018' },
  { value: '2015', label: '2015' },
  { value: '2010', label: '2010' },
  { value: '2000', label: '2000' },
];

const DiscoveryFilters = ({
  selectedGenre = '',
  selectedSort = 'popularity.desc',
  selectedYear = '',
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

  const handleYearChange = (e) => {
    onFilterChange({ year: e.target.value });
  };

  const handleIndustryChange = (e) => {
    onFilterChange({ industry: e.target.value === 'all' ? '' : e.target.value });
  };

  const activeGenreObj = genres.find((g) => String(g.id) === String(selectedGenre));
  const activeIndustryObj = INDUSTRIES.find((i) => i.id === selectedIndustry);

  const hasActiveFilters = Boolean(
    selectedGenre ||
    (selectedSort && selectedSort !== 'popularity.desc') ||
    selectedYear ||
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
            <span>Genre &amp; Discovery Filters</span>
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

          {/* Release Year Dropdown */}
          <div className="filter-select-group">
            <Calendar size={15} className="select-lead-icon" />
            <select
              className="filter-select"
              value={selectedYear}
              onChange={handleYearChange}
              aria-label="Filter by Release Year"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
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
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Genre Chips Section */}
      {expanded && (
        <div className="genre-chips-container animate-fade-in">
          <div className="genre-chips-header">
            <span className="genre-chips-label">
              <Tag size={13} />
              <span>Browse by Genre</span>
            </span>
            {selectedGenre && (
              <button
                type="button"
                className="clear-genre-btn"
                onClick={() => onFilterChange({ genre: '' })}
              >
                Clear Genre
              </button>
            )}
          </div>

          <div className="genre-chips-grid">
            {genres.map((g) => {
              const isSelected = String(selectedGenre) === String(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`genre-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => handleGenreClick(g.id)}
                  aria-pressed={isSelected}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filter Chips Row */}
      {hasActiveFilters && (
        <div className="active-filter-chips-row animate-fade-in">
          <span className="active-chips-label">Active Filters:</span>

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
