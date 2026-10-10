import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Send, User, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMovieReviews, addMovieReview } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './index.css';

const ReviewSection = ({ movieId, movieTitle }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(9);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const loadReviews = useCallback(async () => {
    if (!movieId) return;
    setLoading(true);
    try {
      const data = await getMovieReviews(movieId);
      if (data && data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.warn('Could not load reviews:', err.message);
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toastError('Please write your thoughts before posting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await addMovieReview(movieId, { rating, comment: comment.trim() });
      if (res.review) {
        setReviews((prev) => [res.review, ...prev]);
        setComment('');
        toastSuccess('Your review has been posted successfully! ⭐');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to post review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews-container animate-fade-in">
      <div className="reviews-header">
        <div className="reviews-title-wrap">
          <MessageSquare size={22} className="reviews-icon" />
          <h2>Audience Reviews & Community Ratings</h2>
        </div>
        <span className="reviews-count-badge">{reviews.length} Reviews</span>
      </div>

      {/* Review Submission Box */}
      <div className="review-composer-card">
        {isAuthenticated ? (
          <form className="composer-form" onSubmit={handleSubmitReview}>
            <div className="composer-user-row">
              <div className="composer-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="composer-user-meta">
                <span className="composer-user-name">{user?.name}</span>
                <span className="composer-hint">Rate & share your review for "{movieTitle}"</span>
              </div>
            </div>

            {/* Interactive 10-Star Rating Selector */}
            <div className="star-rating-selector">
              <span className="rating-label">Your Score:</span>
              <div className="stars-row">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starNum) => (
                  <button
                    key={starNum}
                    type="button"
                    className="star-btn"
                    onMouseEnter={() => setHoverRating(starNum)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(starNum)}
                    title={`Rate ${starNum}/10`}
                  >
                    <Star
                      size={20}
                      fill={(hoverRating || rating) >= starNum ? '#f59e0b' : 'none'}
                      color={(hoverRating || rating) >= starNum ? '#f59e0b' : '#64748b'}
                    />
                  </button>
                ))}
              </div>
              <span className="rating-score-display">{hoverRating || rating} / 10</span>
            </div>

            <textarea
              className="review-textarea"
              placeholder="What did you think of the direction, cinematography, performances, or storyline?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required
            />

            <div className="composer-submit-row">
              <button type="submit" className="btn-primary" disabled={submitting}>
                <Send size={16} />
                <span>{submitting ? 'Posting...' : 'Post Review'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="guest-review-prompt">
            <p>Join the discussion and rate this movie with the CineWave community.</p>
            <Link to="/login" className="btn-secondary btn-sm">
              <LogIn size={15} />
              <span>Sign in to write a review</span>
            </Link>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {loading ? (
          <div className="reviews-loading">Loading community reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews-state">
            <p>Be the first movie enthusiast to review <strong>"{movieTitle}"</strong>!</p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="review-card animate-fade-in">
              <div className="review-card-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="reviewer-name">{rev.user_name}</h4>
                    <span className="review-date">
                      {new Date(rev.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="review-rating-badge">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  <span>{rev.rating} / 10</span>
                </div>
              </div>

              <p className="review-comment-body">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default ReviewSection;
