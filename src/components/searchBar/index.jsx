import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Film, Star, User } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import movieService from '../../services/movieService';
import { getImageUrl, getProfileUrl } from '../../utils/imageUrl';
import './index.css';

const SearchBar = ({ onSearchComplete }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [actorSuggestions, setActorSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 350);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Fetch quick suggestions when user pauses typing
  useEffect(() => {
    let isMounted = true;

    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        setActorSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const [movieData, peopleData] = await Promise.allSettled([
          movieService.searchMovies(debouncedQuery.trim(), 1),
          movieService.searchPeople(debouncedQuery.trim(), 1),
        ]);

        if (isMounted) {
          const movies = movieData.status === 'fulfilled' ? movieData.value.results || [] : [];
          const people = peopleData.status === 'fulfilled' ? peopleData.value.results || [] : [];

          setSuggestions(movies.slice(0, 5));
          setActorSuggestions(people.slice(0, 3));
          setIsOpen(movies.length > 0 || people.length > 0);
          setSelectedIndex(-1);
        }
      } catch {
        if (isMounted) {
          setSuggestions([]);
          setActorSuggestions([]);
        }
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
    if (e) e.preventDefault();
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

  const handleSelectActor = (actor) => {
    setIsOpen(false);
    setQuery(actor.name);
    navigate(`/search?actor=${actor.id}&query=${encodeURIComponent(actor.name)}`);
    if (onSearchComplete) onSearchComplete();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    const totalItems = suggestions.length + actorSuggestions.length;
    if (!isOpen || totalItems === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex < suggestions.length) {
        handleSelectMovie(suggestions[selectedIndex].id);
      } else {
        const actorIdx = selectedIndex - suggestions.length;
        handleSelectActor(actorSuggestions[actorIdx]);
      }
    }
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    setActorSuggestions([]);
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
            if (suggestions.length > 0 || actorSuggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search movies and actors"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
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
      {isOpen && (suggestions.length > 0 || actorSuggestions.length > 0) && (
        <div className="search-suggestions-dropdown animate-fade-in" role="listbox">
          <div className="suggestions-header">
            <span>Quick Suggestions</span>
            {isLoading && <span className="suggestions-loading-tag">Searching...</span>}
          </div>

          <div className="suggestions-list">
            {/* 1. Matching Movies */}
            {suggestions.map((m, idx) => (
              <div
                key={`movie-${m.id}`}
                className={`suggestion-row-item ${selectedIndex === idx ? 'selected' : ''}`}
                onClick={() => handleSelectMovie(m.id)}
                role="option"
                aria-selected={selectedIndex === idx}
              >
                <img
                  src={getImageUrl(m.poster_path, m.title)}
                  alt={m.title}
                  className="suggestion-thumb"
                  loading="lazy"
                />
                <div className="suggestion-info">
                  <h4 className="suggestion-title">{m.title}</h4>
                  <div className="suggestion-meta">
                    <span className="suggestion-year">
                      {m.release_date ? m.release_date.slice(0, 4) : 'Movie'}
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

            {/* 2. Matching Actors / People */}
            {actorSuggestions.map((a, idx) => {
              const itemIdx = suggestions.length + idx;
              return (
                <div
                  key={`actor-${a.id}`}
                  className={`suggestion-row-item actor-item ${selectedIndex === itemIdx ? 'selected' : ''}`}
                  onClick={() => handleSelectActor(a)}
                  role="option"
                  aria-selected={selectedIndex === itemIdx}
                >
                  {a.profile_path ? (
                    <img
                      src={getProfileUrl(a.profile_path)}
                      alt={a.name}
                      className="suggestion-thumb suggestion-thumb-round"
                      loading="lazy"
                    />
                  ) : (
                    <div className="suggestion-thumb-avatar">
                      <User size={18} />
                    </div>
                  )}
                  <div className="suggestion-info">
                    <h4 className="suggestion-title">{a.name}</h4>
                    <div className="suggestion-meta">
                      <span className="suggestion-actor-tag">Cast / Actor</span>
                      {a.known_for?.[0]?.title && (
                        <span className="suggestion-known-for">
                          Known for: {a.known_for[0].title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="view-all-results-btn"
            onClick={handleSubmit}
          >
            <Film size={14} />
            <span>View all movie &amp; cast results for "{query}"</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
