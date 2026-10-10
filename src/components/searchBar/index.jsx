import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Film, Star } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import movieService from '../../services/movieService';
import { getImageUrl } from '../../utils/imageUrl';
import { formatRating, formatYear } from '../../utils/formatCurrency';
import './index.css';

const SearchBar = ({ onSearchComplete }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 400);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Fetch quick suggestions when user pauses typing
  useEffect(() => {
    let isMounted = true;

    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await movieService.searchMovies(debouncedQuery.trim(), 1);
        if (isMounted) {
          const results = data.results || [];
          setSuggestions(results.slice(0, 5));
          setIsOpen(results.length > 0);
        }
      } catch {
        if (isMounted) setSuggestions([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSuggestions();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Handle outside click to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
      if (onSearchComplete) onSearchComplete();
    }
  };

  const handleSelectMovie = (movieId) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/movie/${movieId}`);
    if (onSearchComplete) onSearchComplete();
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className="global-search-container" ref={searchRef}>
      <form className="search-input-form" onSubmit={handleSubmit}>
        <Search className="search-lead-icon" size={17} />
        <input
          type="text"
          className="search-input-field"
          placeholder="Search movies, actors, titles..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          aria-label="Search movies"
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={clearQuery}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </form>

      {/* Debounced live suggestions popup */}
      {isOpen && suggestions.length > 0 && (
        <div className="search-suggestions-dropdown">
          <div className="suggestions-header">
            <span>Quick Results</span>
            {isLoading && <span className="suggestions-loading-tag">Searching...</span>}
          </div>
          <div className="suggestions-list">
            {suggestions.map((m) => (
              <div
                key={m.id}
                className="suggestion-row-item"
                onClick={() => handleSelectMovie(m.id)}
              >
                <img
                  src={getImageUrl(m.poster_path)}
                  alt={m.title}
                  className="suggestion-thumb"
                  loading="lazy"
                />
                <div className="suggestion-info">
                  <h4 className="suggestion-title">{m.title}</h4>
                  <div className="suggestion-meta">
                    <span className="suggestion-year">
                      {m.release_date ? m.release_date.slice(0, 4) : 'TBD'}
                    </span>
                    {m.vote_average > 0 && (
                      <span className="suggestion-rating">
                        <Star size={11} fill="#fbbf24" color="#fbbf24" />
                        {Number(m.vote_average).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="view-all-results-btn"
            onClick={handleSubmit}
          >
            <Film size={14} />
            <span>View all results for "{query}"</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
