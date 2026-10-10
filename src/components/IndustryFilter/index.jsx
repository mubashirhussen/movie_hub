import React from 'react';
import { Film, Calendar, SlidersHorizontal, Layers, Sparkles } from 'lucide-react';
import './index.css';

const industries = [
  { id: 'All', label: 'All Cinema', icon: '🌍' },
  { id: 'Tollywood', label: 'Tollywood (Telugu)', icon: '🎬' },
  { id: 'Bollywood', label: 'Bollywood (Hindi)', icon: '🇮🇳' },
  { id: 'Hollywood', label: 'Hollywood (Global)', icon: '🇺🇸' }
];

const decades = [
  { id: 'All', label: 'All Eras' },
  { id: '2020s', label: '2020s - 2026' },
  { id: '2010s', label: '2010s' },
  { id: '2000s', label: '2000s' },
  { id: '1990s', label: '1990s' },
  { id: '1980s', label: '1980s Classics' }
];

const genres = [
  'All',
  'Action',
  'Drama',
  'Sci-Fi',
  'Comedy',
  'Thriller',
  'Romance',
  'Crime',
  'Horror',
  'Fantasy',
  'Biography'
];

const sortOptions = [
  { id: 'popularity_desc', label: '🔥 Most Popular' },
  { id: 'rating_desc', label: '⭐ Highest Rated' },
  { id: 'year_desc', label: '📅 Newest First' },
  { id: 'year_asc', label: '🕰️ Oldest Classics' },
  { id: 'runtime_desc', label: '⏳ Longest Runtime' }
];

const IndustryFilter = ({
  selectedIndustry = 'All',
  onSelectIndustry,
  selectedDecade = 'All',
  onSelectDecade,
  selectedGenre = 'All',
  onSelectGenre,
  selectedSort = 'popularity_desc',
  onSelectSort,
  totalResults = 0
}) => {
  return (
    <div className="filter-panel-card animate-fade-in">
      {/* Industry Tabs */}
      <div className="industry-tabs-row">
        <div className="filter-label-group">
          <Film size={18} className="filter-group-icon" />
          <span>Select Cinema Industry:</span>
        </div>
        <div className="industry-pills-list">
          {industries.map((ind) => (
            <button
              key={ind.id}
              className={`industry-pill-btn ${selectedIndustry === ind.id ? 'active' : ''}`}
              onClick={() => onSelectIndustry(ind.id)}
            >
              <span className="pill-emoji">{ind.icon}</span>
              <span>{ind.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub Filters Row: Decade, Genre, Sort */}
      <div className="filter-controls-row">
        {/* Decade Selector */}
        <div className="filter-control-box">
          <div className="control-label">
            <Calendar size={15} />
            <span>Era / Decade:</span>
          </div>
          <div className="decade-pills">
            {decades.map((dec) => (
              <button
                key={dec.id}
                className={`sub-pill-btn ${selectedDecade === dec.id ? 'active' : ''}`}
                onClick={() => onSelectDecade(dec.id)}
              >
                {dec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Genre & Sorting controls */}
        <div className="filter-dropdowns-group">
          <div className="dropdown-control">
            <label htmlFor="genre-select">
              <Layers size={15} />
              <span>Genre:</span>
            </label>
            <select
              id="genre-select"
              value={selectedGenre}
              onChange={(e) => onSelectGenre(e.target.value)}
              className="styled-select"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g === 'All' ? 'All Genres' : g}
                </option>
              ))}
            </select>
          </div>

          <div className="dropdown-control">
            <label htmlFor="sort-select">
              <SlidersHorizontal size={15} />
              <span>Sort By:</span>
            </label>
            <select
              id="sort-select"
              value={selectedSort}
              onChange={(e) => onSelectSort(e.target.value)}
              className="styled-select"
            >
              {sortOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Summary Bar */}
      <div className="filter-summary-bar">
        <div className="summary-left">
          <span className="results-count-badge">
            <Sparkles size={14} />
            <strong>{totalResults}</strong> Movies Found
          </span>
          {(selectedIndustry !== 'All' || selectedDecade !== 'All' || selectedGenre !== 'All') && (
            <span className="active-filter-tags">
              {selectedIndustry !== 'All' && <span className="filter-tag">{selectedIndustry}</span>}
              {selectedDecade !== 'All' && <span className="filter-tag">{selectedDecade}</span>}
              {selectedGenre !== 'All' && <span className="filter-tag">{selectedGenre}</span>}
            </span>
          )}
        </div>
        {(selectedIndustry !== 'All' || selectedDecade !== 'All' || selectedGenre !== 'All') && (
          <button
            className="btn-reset-filters"
            onClick={() => {
              onSelectIndustry('All');
              onSelectDecade('All');
              onSelectGenre('All');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default IndustryFilter;
