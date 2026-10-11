import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Flag,
  Edit2,
  Trash2,
  AlertTriangle,
  Send,
  X,
  CheckCircle,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import communityService from '../../services/communityService';
import './index.css';

const CommunityReviews = ({ movieId, movieTitle }) => {
  const { isAuthenticated, user } = useAuth();

  // Ratings State
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  // Review Form State
  const [showForm, setShowForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Spoilers reveal tracking: Set of review IDs revealed by user
  const [revealedSpoilers, setRevealedSpoilers] = useState(new Set());

  // Report Modal State
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('unmarked_spoiler');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState(null);

  // Load Rating Stats & User Rating
  const loadRatings = useCallback(async () => {
    try {
      const data = await communityService.getMovieRatings(movieId);
      if (data) {
        setStats({
          averageRating: data.averageRating || 0,
          totalRatings: data.totalRatings || 0,
          distribution: data.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
        if (data.userRating) {
          setUserRating(data.userRating);
        }
      }
    } catch {
      // Gracefully ignore ratings fetch error
    }
  }, [movieId]);

  // Load Reviews
  const loadReviews = useCallback(
    async (targetPage = 1, append = false) => {
      setLoadingReviews(true);
      try {
        const data = await communityService.getMovieReviews(movieId, {
          page: targetPage,
          limit: 6,
          sort,
        });
        if (data) {
          const list = data.reviews || [];
          if (append) {
            setReviews((prev) => [...prev, ...list]);
          } else {
            setReviews(list);
          }
          if (data.pagination) {
            setPage(data.pagination.page);
            setTotalPages(data.pagination.totalPages);
            setTotalReviews(data.pagination.totalReviews);
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoadingReviews(false);
      }
    },
    [movieId, sort]
  );

  useEffect(() => {
    loadRatings();
    loadReviews(1, false);
  }, [loadRatings, loadReviews]);

  // Handle User Star Rating Click
  const handleRatingSubmit = async (stars) => {
    if (!isAuthenticated()) {
      alert('Please log in to submit your rating.');
      return;
    }

    setRatingSubmitting(true);
    try {
      const data = await communityService.submitRating(movieId, stars);
      setUserRating(stars);
      if (data) {
        setStats({
          averageRating: data.averageRating || 0,
          totalRatings: data.totalRatings || 0,
          distribution: data.distribution || stats.distribution,
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Handle Delete Rating
  const handleDeleteRating = async () => {
    if (!userRating) return;
    setRatingSubmitting(true);
    try {
      const data = await communityService.deleteRating(movieId);
      setUserRating(0);
      if (data) {
        setStats({
          averageRating: data.averageRating || 0,
          totalRatings: data.totalRatings || 0,
          distribution: data.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      }
    } catch {
      // Ignore
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Handle Review Submission (Create or Edit)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (reviewText.trim().length < 5) {
      setFormError('Review must be at least 5 characters long.');
      return;
    }

    if (reviewText.trim().length > 1000) {
      setFormError('Review cannot exceed 1000 characters.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingReviewId) {
        // Edit existing review
        await communityService.updateReview(editingReviewId, {
          reviewText,
          rating: formRating,
          isSpoiler,
        });
        setFormSuccess('Review updated successfully!');
      } else {
        // Create new review
        await communityService.createReview(movieId, {
          reviewText,
          rating: formRating,
          isSpoiler,
        });
        setFormSuccess('Review published successfully!');
      }

      // Reset form and reload
      setTimeout(() => {
        setShowForm(false);
        setEditingReviewId(null);
        setReviewText('');
        setFormSuccess('');
        loadRatings();
        loadReviews(1, false);
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save review.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Form
  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.id);
    setReviewText(rev.reviewText);
    setFormRating(rev.rating || 5);
    setIsSpoiler(Boolean(rev.isSpoiler));
    setFormError('');
    setShowForm(true);
  };

  // Delete Review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await communityService.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setTotalReviews((prev) => Math.max(0, prev - 1));
      loadRatings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  // Toggle Helpful Vote
  const handleHelpfulClick = async (reviewId) => {
    if (!isAuthenticated()) {
      alert('Please log in to vote on reviews.');
      return;
    }

    try {
      const data = await communityService.toggleHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            return {
              ...r,
              helpfulCount: data.helpfulCount,
              hasVotedHelpful: data.hasVotedHelpful,
            };
          }
          return r;
        })
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register helpful vote.');
    }
  };

  // Toggle Spoiler Visibility
  const toggleSpoiler = (reviewId) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  // Submit Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportingReviewId) return;

    setReportSubmitting(true);
    setReportFeedback(null);
    try {
      await communityService.reportReview(reportingReviewId, {
        reason: reportReason,
        details: reportDetails,
      });
      setReportFeedback({ success: true, message: 'Report submitted. Thank you for your feedback!' });
      setTimeout(() => {
        setReportingReviewId(null);
        setReportFeedback(null);
        setReportDetails('');
      }, 1500);
    } catch (err) {
      setReportFeedback({
        success: false,
        message: err.response?.data?.message || 'Failed to submit report.',
      });
    } finally {
      setReportSubmitting(false);
    }
  };

  // Calculate percentages for rating breakdown
  const getRatingPercent = (star) => {
    if (!stats.totalRatings) return 0;
    const count = stats.distribution?.[star] || 0;
    return Math.round((count / stats.totalRatings) * 100);
  };

  return (
    <section className="community-reviews-section animate-fade-in" id="community-reviews">
      <div className="community-header">
        <div className="community-title-wrap">
          <MessageSquare className="community-icon" size={24} />
          <div>
            <h2 className="community-title">Ratings & Community Reviews</h2>
            <p className="community-subtitle">
              Authentic audience ratings and discussions for {movieTitle}
            </p>
          </div>
        </div>

        {isAuthenticated() && !showForm && (
          <button
            className="btn-write-review"
            onClick={() => {
              setEditingReviewId(null);
              setReviewText('');
              setFormRating(userRating || 5);
              setIsSpoiler(false);
              setFormError('');
              setShowForm(true);
            }}
          >
            <Edit2 size={16} /> Write a Review
          </button>
        )}
      </div>

      {/* Community Scoreboard & User Rating Widget */}
      <div className="community-scoreboard-card">
        <div className="scoreboard-left">
          <div className="score-badge">
            <span className="score-number">
              {stats.totalRatings > 0 ? stats.averageRating.toFixed(1) : '—'}
            </span>
            <div className="score-stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={
                    s <= Math.round(stats.averageRating)
                      ? 'star-filled'
                      : 'star-empty'
                  }
                />
              ))}
            </div>
            <span className="score-count">
              {stats.totalRatings} CineVerse {stats.totalRatings === 1 ? 'Rating' : 'Ratings'}
            </span>
            <span className="score-disclaimer">Audience verified community score</span>
          </div>

          {/* Rating Distribution Breakdown Bars */}
          <div className="rating-distribution-wrap">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="distribution-row">
                <span className="dist-star-label">{star} ★</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{ width: `${getRatingPercent(star)}%` }}
                  />
                </div>
                <span className="dist-percent">{getRatingPercent(star)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Interactive Rating Panel */}
        <div className="scoreboard-right">
          <div className="user-rating-box">
            <h4 className="user-rating-heading">
              {userRating > 0 ? 'Your Rating' : 'Rate This Movie'}
            </h4>
            <div
              className="interactive-star-row"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-label={`Rate ${s} out of 5 stars`}
                  className={`star-btn ${
                    s <= (hoverRating || userRating) ? 'active' : ''
                  }`}
                  onMouseEnter={() => setHoverRating(s)}
                  onClick={() => handleRatingSubmit(s)}
                  disabled={ratingSubmitting}
                >
                  <Star size={26} />
                </button>
              ))}
            </div>

            {userRating > 0 ? (
              <div className="user-rated-feedback">
                <span className="rated-text">
                  You rated this <strong>{userRating} / 5 stars</strong>
                </span>
                <button
                  type="button"
                  className="btn-remove-rating"
                  onClick={handleDeleteRating}
                  disabled={ratingSubmitting}
                >
                  Remove rating
                </button>
              </div>
            ) : (
              <p className="user-rating-prompt">
                {isAuthenticated()
                  ? 'Click a star to submit your rating'
                  : 'Log in to rate and review this title'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Review Editor Form (Expandable) */}
      {showForm && (
        <form className="review-editor-card animate-fade-in" onSubmit={handleReviewSubmit}>
          <div className="editor-header">
            <h3>{editingReviewId ? 'Edit Your Review' : 'Write a Review'}</h3>
            <button
              type="button"
              className="btn-close-form"
              onClick={() => setShowForm(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Star Selector */}
          <div className="editor-rating-row">
            <span className="editor-label">Your Rating:</span>
            <div className="editor-stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`editor-star-btn ${s <= formRating ? 'active' : ''}`}
                  onClick={() => setFormRating(s)}
                >
                  <Star size={20} />
                </button>
              ))}
              <span className="editor-rating-display">{formRating} / 5 Stars</span>
            </div>
          </div>

          {/* Review Textarea */}
          <div className="editor-input-group">
            <label htmlFor="review-text-input" className="editor-label">
              Review Content
            </label>
            <textarea
              id="review-text-input"
              className="review-textarea"
              placeholder="What did you think of the directing, acting, plot, and soundtrack? (Minimum 5 characters)"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
              required
            />
            <div className="textarea-footer">
              <span className={`char-counter ${reviewText.length > 900 ? 'warn' : ''}`}>
                {reviewText.length} / 1000 characters
              </span>
              <label className="spoiler-toggle-label">
                <input
                  type="checkbox"
                  checked={isSpoiler}
                  onChange={(e) => setIsSpoiler(e.target.checked)}
                />
                <AlertTriangle size={15} className="spoiler-icon" /> Contains Spoilers
              </label>
            </div>
          </div>

          {formError && <div className="form-alert error">{formError}</div>}
          {formSuccess && (
            <div className="form-alert success">
              <CheckCircle size={16} /> {formSuccess}
            </div>
          )}

          <div className="editor-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={formSubmitting}
            >
              <Send size={15} /> {editingReviewId ? 'Update Review' : 'Publish Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews Controls Row: Sort & Counter */}
      <div className="reviews-controls-bar">
        <div className="reviews-count-badge">
          <span>{totalReviews} User Reviews</span>
        </div>

        <div className="reviews-sort-wrap">
          <label htmlFor="review-sort-select">Sort by:</label>
          <select
            id="review-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="review-sort-dropdown"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-feed">
        {reviews.length === 0 && !loadingReviews ? (
          <div className="empty-reviews-card">
            <MessageSquare size={40} className="empty-icon" />
            <h4 className="empty-title">No Reviews Yet</h4>
            <p className="empty-desc">
              Be the first CineVerse member to review {movieTitle}!
            </p>
          </div>
        ) : (
          reviews.map((rev) => {
            const isRevealed = revealedSpoilers.has(rev.id);
            const dateStr = rev.createdAt
              ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '';

            return (
              <article key={rev.id} className="review-card animate-fade-in">
                <div className="review-card-header">
                  <div className="author-info">
                    <img
                      src={rev.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={rev.author?.name || 'Reviewer'}
                      className="author-avatar"
                      loading="lazy"
                    />
                    <div>
                      <div className="author-name-row">
                        <span className="author-name">{rev.author?.name}</span>
                        {rev.isAuthor && <span className="author-badge">You</span>}
                      </div>
                      <span className="review-date">{dateStr}</span>
                    </div>
                  </div>

                  <div className="review-header-meta">
                    {rev.rating && (
                      <div className="review-star-badge">
                        <Star size={14} className="star-filled" />
                        <span>{rev.rating} / 5</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spoiler Handling */}
                {rev.isSpoiler && !isRevealed ? (
                  <div className="spoiler-warning-curtain">
                    <AlertTriangle size={18} className="curtain-icon" />
                    <span>This review contains plot spoilers.</span>
                    <button
                      type="button"
                      className="btn-reveal-spoiler"
                      onClick={() => toggleSpoiler(rev.id)}
                    >
                      Show Review
                    </button>
                  </div>
                ) : (
                  <div className="review-body">
                    {rev.isSpoiler && (
                      <div className="spoiler-revealed-bar">
                        <span className="spoiler-tag">Spoiler Unlocked</span>
                        <button
                          type="button"
                          className="btn-hide-spoiler"
                          onClick={() => toggleSpoiler(rev.id)}
                        >
                          Hide again
                        </button>
                      </div>
                    )}
                    <p className="review-text-content">{rev.reviewText}</p>
                  </div>
                )}

                {/* Review Card Footer: Helpful, Report, and Edit/Delete */}
                <div className="review-card-footer">
                  <div className="footer-actions-left">
                    <button
                      type="button"
                      className={`btn-helpful ${rev.hasVotedHelpful ? 'voted' : ''}`}
                      onClick={() => handleHelpfulClick(rev.id)}
                      disabled={rev.isAuthor}
                      title={rev.isAuthor ? 'You cannot vote on your own review' : 'Mark as helpful'}
                    >
                      <ThumbsUp size={14} />
                      <span>Helpful ({rev.helpfulCount})</span>
                    </button>

                    <button
                      type="button"
                      className="btn-report"
                      onClick={() => setReportingReviewId(rev.id)}
                      title="Report inappropriate content"
                    >
                      <Flag size={14} /> Report
                    </button>
                  </div>

                  {rev.isAuthor && (
                    <div className="footer-actions-right">
                      <button
                        type="button"
                        className="btn-card-edit"
                        onClick={() => handleStartEdit(rev)}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn-card-delete"
                        onClick={() => handleDeleteReview(rev.id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Pagination: Load More Button */}
      {page < totalPages && (
        <div className="load-more-wrap">
          <button
            type="button"
            className="btn-load-more"
            onClick={() => loadReviews(page + 1, true)}
            disabled={loadingReviews}
          >
            {loadingReviews ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}

      {/* Report Modal Dialog */}
      {reportingReviewId && (
        <div className="report-modal-backdrop" onClick={() => setReportingReviewId(null)}>
          <div className="report-modal-dialog animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Inappropriate Review</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setReportingReviewId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="report-form">
              <label htmlFor="report-reason-select" className="report-label">
                Why are you reporting this review?
              </label>
              <select
                id="report-reason-select"
                className="report-select"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="unmarked_spoiler">Unmarked Spoilers</option>
                <option value="harassment">Harassment or Abuse</option>
                <option value="spam">Spam or Advertising</option>
                <option value="hate_speech">Hate Speech or Inappropriate Content</option>
                <option value="other">Other Violation</option>
              </select>

              <label htmlFor="report-details-input" className="report-label">
                Additional Context (Optional)
              </label>
              <textarea
                id="report-details-input"
                className="report-textarea"
                placeholder="Provide details for our moderation team..."
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                maxLength={500}
              />

              {reportFeedback && (
                <div className={`report-alert ${reportFeedback.success ? 'success' : 'error'}`}>
                  {reportFeedback.message}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setReportingReviewId(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default CommunityReviews;
