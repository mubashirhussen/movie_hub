import React from 'react';
import CastCard from '../CastCard';
import { Users } from 'lucide-react';
import './index.css';

const CastList = ({ cast = [], loading = false }) => {
  if (loading) {
    return (
      <div className="cast-section">
        <div className="cast-header">
          <h2 className="cast-section-title">
            <Users size={22} className="section-title-icon" />
            <span>Cast & Credits</span>
          </h2>
        </div>
        <div className="cast-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="cast-card-skeleton">
              <div className="skeleton-avatar" />
              <div className="skeleton-info">
                <div className="skeleton-line skeleton-name" />
                <div className="skeleton-line skeleton-char" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const invalidNames = ['Lead Actor', 'Supporting Star', 'Famous Artist', 'Veteran Actor', 'Antagonist Actor', 'Co-Star', 'Main Character'];

  // Filter valid real cast members only
  const validCast = Array.isArray(cast)
    ? cast.filter(
        (actor) =>
          actor &&
          typeof actor.name === 'string' &&
          actor.name.trim() !== '' &&
          !invalidNames.includes(actor.name.trim())
      )
    : [];

  if (validCast.length === 0) {
    return null;
  }

  // Display top cast members
  const displayCast = validCast.slice(0, 24);

  return (
    <div className="cast-section animate-fade-in">
      <div className="cast-header">
        <h2 className="cast-section-title">
          <Users size={22} className="section-title-icon" />
          <span>Starring Cast ({validCast.length})</span>
        </h2>
        <span className="cast-count-badge">Verified Credits</span>
      </div>

      <div className="cast-grid">
        {displayCast.map((actor) => (
          <CastCard key={actor.id || actor.cast_id || actor.name} castMember={actor} />
        ))}
      </div>
    </div>
  );
};

export default CastList;
