import React from 'react';
import { Users } from 'lucide-react';
import CastCard from '../castCard';
import './index.css';

const CastSection = ({ cast = [], loading = false }) => {
  if (loading) {
    return (
      <div className="cineverse-cast-section">
        <div className="section-title-wrap">
          <Users size={20} className="title-icon" />
          <h2 className="section-title-text">Cast & Characters</h2>
        </div>
        <div className="cast-cards-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cast-skeleton-card">
              <div className="cast-skeleton-avatar" />
              <div className="cast-skeleton-line name" />
              <div className="cast-skeleton-line role" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const validCast = Array.isArray(cast)
    ? cast.filter(
        (c) =>
          c &&
          typeof c.name === 'string' &&
          c.name.trim() !== '' &&
          !c.name.includes('Actor') &&
          !c.name.includes('Character')
      )
    : [];

  if (validCast.length === 0) return null;

  return (
    <div className="cineverse-cast-section animate-fade-in">
      <div className="section-title-wrap">
        <Users size={20} className="title-icon" />
        <h2 className="section-title-text">Cast & Characters ({validCast.length})</h2>
      </div>

      <div className="cast-cards-grid">
        {validCast.slice(0, 18).map((member) => (
          <CastCard key={member.id || member.cast_id || member.name} castMember={member} />
        ))}
      </div>
    </div>
  );
};

export default CastSection;
