import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  PlayCircle,
  CheckCircle2,
  FolderPlus,
  Trash2,
  Edit2,
  Film,
  Compass,
  ArrowUpDown,
  Plus,
  X,
  AlertTriangle,
} from 'lucide-react';
import watchlistService from '../../services/watchlistService';
import MovieCard from '../../components/movieCard';
import Loading from '../../components/loading';
import './index.css';
import '../popular/index.css';

const DEFAULT_TABS = [
  { id: 'want_to_watch', label: 'Want to Watch', icon: Bookmark },
  { id: 'watching', label: 'Watching', icon: PlayCircle },
  { id: 'watched', label: 'Watched', icon: CheckCircle2 },
  { id: 'custom', label: 'Custom Lists', icon: FolderPlus },
];

const SORT_OPTIONS = [
  { value: 'date_added', label: 'Recently Added' },
  { value: 'title', label: 'Title (A to Z)' },
  { value: 'release_date', label: 'Release Date' },
  { value: 'rating', label: 'TMDB Rating' },
];

const Watchlist = () => {
  const [activeTab, setActiveTab] = useState('want_to_watch');
  const [sortBy, setSortBy] = useState('date_added');

  // Summary counts across all default lists and custom lists
  const [summary, setSummary] = useState({
    defaultLists: [
      { id: 'want_to_watch', count: 0 },
      { id: 'watching', count: 0 },
      { id: 'watched', count: 0 },
    ],
    customLists: [],
    totalDefaultCount: 0,
  });

  // Current list items
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized formatted movies for grid rendering performance
  const formattedMovies = useMemo(
    () =>
      movies.map((item) => ({
        id: item.movieId,
        movieId: item.movieId,
        title: item.movieTitle,
        movieTitle: item.movieTitle,
        poster_path: item.posterPath,
        posterPath: item.posterPath,
        release_date: item.releaseDate,
        releaseDate: item.releaseDate,
        vote_average: item.voteAverage,
        voteAverage: item.voteAverage,
        status: item.status,
        _id: item._id,
      })),
    [movies]
  );

  // Custom list selection
  const [selectedCustomListId, setSelectedCustomListId] = useState(null);
  const [currentCustomList, setCurrentCustomList] = useState(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch summary counts
  const loadSummary = useCallback(async () => {
    try {
      const data = await watchlistService.getWatchlistSummary();
      setSummary(data);

      // If on custom tab and no list selected, pick the first one
      if (data.customLists && data.customLists.length > 0 && !selectedCustomListId) {
        setSelectedCustomListId(data.customLists[0]._id);
      }
    } catch (err) {
      console.warn('Failed to fetch watchlist summary:', err.message);
    }
  }, [selectedCustomListId]);

  // Load movies for active tab / custom list
  const loadMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'custom') {
        if (!selectedCustomListId) {
          setMovies([]);
          setCurrentCustomList(null);
          setLoading(false);
          return;
        }
        const data = await watchlistService.getCustomWatchlist(selectedCustomListId, sortBy);
        if (data) {
          setCurrentCustomList(data);
          setMovies(data.movies || []);
        } else {
          setMovies([]);
        }
      } else {
        const data = await watchlistService.getWatchlist({
          status: activeTab,
          sortBy,
        });
        setMovies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load watchlist items.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCustomListId, sortBy]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  // Handle viewing status change from item card
  const handleStatusChange = async (movieId, newStatus) => {
    try {
      await watchlistService.updateViewingStatus(movieId, newStatus);
      await loadSummary();
      await loadMovies();
    } catch (err) {
      alert(err.message || 'Failed to update viewing status');
    }
  };

  // Handle removing movie from list
  const handleRemoveMovie = async (movieId) => {
    try {
      if (activeTab === 'custom' && selectedCustomListId) {
        await watchlistService.removeMovieFromCustomWatchlist(selectedCustomListId, movieId);
      } else {
        await watchlistService.removeFromWatchlist(movieId);
      }
      await loadSummary();
      await loadMovies();
    } catch (err) {
      alert(err.message || 'Failed to remove movie');
    }
  };

  // Create custom list
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Watchlist name is required');
      return;
    }
    setActionLoading(true);
    setFormError('');
    try {
      const res = await watchlistService.createCustomWatchlist(formName.trim(), formDescription.trim());
      setCreateModalOpen(false);
      setFormName('');
      setFormDescription('');
      await loadSummary();
      if (res?.data?._id) {
        setSelectedCustomListId(res.data._id);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create watchlist');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit custom list
  const handleEditList = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Watchlist name is required');
      return;
    }
    setActionLoading(true);
    setFormError('');
    try {
      await watchlistService.updateCustomWatchlist(selectedCustomListId, {
        name: formName.trim(),
        description: formDescription.trim(),
      });
      setEditModalOpen(false);
      await loadSummary();
      await loadMovies();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update watchlist');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete custom list
  const handleDeleteList = async () => {
    if (!selectedCustomListId) return;
    setActionLoading(true);
    try {
      await watchlistService.deleteCustomWatchlist(selectedCustomListId);
      setDeleteConfirmOpen(false);
      setSelectedCustomListId(null);
      await loadSummary();
      await loadMovies();
    } catch (err) {
      alert(err.message || 'Failed to delete custom watchlist');
    } finally {
      setActionLoading(false);
    }
  };

  // Open edit modal with prefilled values
  const openEditModal = () => {
    if (currentCustomList) {
      setFormName(currentCustomList.name || '');
      setFormDescription(currentCustomList.description || '');
      setFormError('');
      setEditModalOpen(true);
    }
  };

  // Calculate count for a tab
  const getTabCount = (tabId) => {
    if (tabId === 'custom') {
      return summary.customLists ? summary.customLists.length : 0;
    }
    const found = summary.defaultLists?.find((d) => d.id === tabId);
    return found ? found.count : 0;
  };

  return (
    <div className="cineverse-browse-page container watchlist-page-container">
      {/* Header Banner */}
      <div className="browse-header-banner animate-fade-in">
        <div className="browse-icon-badge flame">
          <Bookmark size={24} />
        </div>
        <div>
          <h1 className="browse-main-title">
            Smart Watchlists &amp; Viewing Organization
          </h1>
          <p className="browse-subtitle">
            Organize movies by viewing status or create curated custom collections
          </p>
        </div>
      </div>

      {/* Viewing Status Navigation Tabs */}
      <div className="watchlist-nav-tabs" role="tablist">
        {DEFAULT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              className={`watchlist-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span className="tab-badge">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Lists Selector & Creation Bar (When Custom Tab is Active) */}
      {activeTab === 'custom' && (
        <div className="animate-fade-in">
          <div className="watchlist-controls-bar">
            <div className="watchlist-controls-left">
              <button
                type="button"
                className="btn-create-list"
                onClick={() => {
                  setFormName('');
                  setFormDescription('');
                  setFormError('');
                  setCreateModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Create New List</span>
              </button>
            </div>

            <div className="watchlist-controls-right">
              <div className="filter-select-group">
                <ArrowUpDown size={14} className="select-lead-icon" />
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort movies in list"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Sort: {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Custom List Pills */}
          {summary.customLists && summary.customLists.length > 0 && (
            <div className="custom-lists-pill-row">
              {summary.customLists.map((cl) => {
                const isSelected = selectedCustomListId === cl._id;
                return (
                  <button
                    key={cl._id}
                    type="button"
                    className={`custom-list-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedCustomListId(cl._id)}
                  >
                    <span>{cl.name}</span>
                    <span className="tab-badge">{cl.itemCount || 0}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Custom List Header */}
          {currentCustomList && (
            <div className="active-list-header">
              <div className="active-list-info">
                <h2>{currentCustomList.name}</h2>
                {currentCustomList.description ? (
                  <p>{currentCustomList.description}</p>
                ) : (
                  <p className="no-desc">No description provided</p>
                )}
              </div>
              <div className="active-list-actions">
                <button
                  type="button"
                  className="btn-action-outline"
                  onClick={openEditModal}
                  title="Rename or edit description"
                >
                  <Edit2 size={13} />
                  <span>Edit List</span>
                </button>
                <button
                  type="button"
                  className="btn-action-outline danger"
                  onClick={() => setDeleteConfirmOpen(true)}
                  title="Delete this watchlist and its contents"
                >
                  <Trash2 size={13} />
                  <span>Delete List</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Default Lists Sorting Bar (When on Want to Watch / Watching / Watched) */}
      {activeTab !== 'custom' && (
        <div className="watchlist-controls-bar">
          <div className="watchlist-controls-left">
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              Showing {movies.length} {movies.length === 1 ? 'title' : 'titles'} in{' '}
              {DEFAULT_TABS.find((t) => t.id === activeTab)?.label}
            </span>
          </div>

          <div className="watchlist-controls-right">
            <div className="filter-select-group">
              <ArrowUpDown size={14} className="select-lead-icon" />
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort movies in list"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <Loading message="Syncing movies in your watchlist..." />
      ) : error ? (
        <div className="grid-empty-state">
          <p className="empty-message-text">{error}</p>
          <button type="button" className="btn-create-list" onClick={loadMovies}>
            Retry
          </button>
        </div>
      ) : movies.length === 0 ? (
        <div className="grid-empty-state animate-fade-in">
          <Film size={48} color="#64748b" style={{ margin: '0 auto 1rem auto' }} />
          <p className="empty-message-text">
            {activeTab === 'want_to_watch' && 'Your Want to Watch list is currently empty.'}
            {activeTab === 'watching' && 'No movies currently marked as Watching.'}
            {activeTab === 'watched' && 'No completed movies in your Watched list yet.'}
            {activeTab === 'custom' &&
              (summary.customLists.length === 0
                ? 'You have not created any custom watchlists yet.'
                : 'This custom watchlist has no movies yet.')}
          </p>
          {activeTab === 'custom' && summary.customLists.length === 0 ? (
            <button
              type="button"
              className="btn-create-list"
              onClick={() => {
                setFormName('');
                setFormDescription('');
                setFormError('');
                setCreateModalOpen(true);
              }}
              style={{ marginTop: '1rem' }}
            >
              <Plus size={16} />
              <span>Create Your First Watchlist</span>
            </button>
          ) : (
            <Link
              to="/search"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.25rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: '#ffffff',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Compass size={17} />
              <span>Discover Movies to Add</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="smart-watchlist-grid animate-fade-in">
          {formattedMovies.map((item) => {
            const moviePayload = {
              id: item.movieId,
              title: item.movieTitle,
              poster_path: item.posterPath,
              release_date: item.releaseDate,
              vote_average: item.voteAverage,
            };

            return (
              <div key={item._id || item.movieId} className="watchlist-movie-card-wrapper">
                <MovieCard movie={moviePayload} />
                <div className="watchlist-card-actions">
                  {/* Status Switcher (for default list) */}
                  {activeTab !== 'custom' && (
                    <div className="status-select-wrap">
                      <select
                        className="status-dropdown"
                        value={item.status || 'want_to_watch'}
                        onChange={(e) => handleStatusChange(item.movieId, e.target.value)}
                        aria-label={`Change status for ${item.movieTitle}`}
                      >
                        <option value="want_to_watch">Want to Watch</option>
                        <option value="watching">Currently Watching</option>
                        <option value="watched">Mark as Watched</option>
                      </select>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => handleRemoveMovie(item.movieId)}
                    title="Remove from this list"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Custom Watchlist */}
      {createModalOpen && (
        <div className="watchlist-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="watchlist-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Create Custom Watchlist</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setCreateModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateList}>
              <div className="form-group">
                <label htmlFor="create-list-name">Watchlist Name *</label>
                <input
                  id="create-list-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Weekend Marathons, Sci-Fi Classics"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginTop: '0.85rem' }}>
                <label htmlFor="create-list-desc">Description (Optional)</label>
                <textarea
                  id="create-list-desc"
                  className="form-textarea"
                  placeholder="What is this collection about?"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  maxLength={500}
                />
              </div>

              {formError && (
                <p style={{ color: '#f87171', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>
                  {formError}
                </p>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating...' : 'Create Watchlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Custom Watchlist */}
      {editModalOpen && (
        <div className="watchlist-modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="watchlist-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Edit Watchlist</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditList}>
              <div className="form-group">
                <label htmlFor="edit-list-name">Watchlist Name *</label>
                <input
                  id="edit-list-name"
                  type="text"
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginTop: '0.85rem' }}>
                <label htmlFor="edit-list-desc">Description</label>
                <textarea
                  id="edit-list-desc"
                  className="form-textarea"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  maxLength={500}
                />
              </div>

              {formError && (
                <p style={{ color: '#f87171', fontSize: '0.8rem', margin: '0.5rem 0 0 0' }}>
                  {formError}
                </p>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Deletion */}
      {deleteConfirmOpen && (
        <div className="watchlist-modal-backdrop" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="watchlist-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                <AlertTriangle size={20} />
                <h3 style={{ color: '#f87171' }}>Delete Watchlist</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteConfirmOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0 }}>
              Are you sure you want to permanently delete{' '}
              <strong>"{currentCustomList?.name}"</strong>? This will remove all{' '}
              {movies.length} movies saved inside it. This action cannot be undone.
            </p>
            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                style={{ background: '#ef4444' }}
                onClick={handleDeleteList}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
