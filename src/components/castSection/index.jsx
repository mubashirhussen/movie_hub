import React, { useState } from 'react';
import { Users, Clapperboard, ChevronDown, ChevronUp } from 'lucide-react';
import CastCard from '../CastCard';
import CrewCard from '../CrewCard';
import './index.css';

const CastSection = ({ cast = [], crew = [], loading = false }) => {
  const [showAllCast, setShowAllCast] = useState(false);

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
    ? cast.filter((c) => c && typeof c.name === 'string' && c.name.trim() !== '')
    : [];

  // Filter key crew roles: Director, Writer/Screenplay, Producer, Cinematographer, Composer
  const validCrew = Array.isArray(crew)
    ? crew.filter((cr) => {
        if (!cr || !cr.name || !cr.name.trim()) return false;
        const job = (cr.job || '').toLowerCase();
        return (
          job.includes('director') ||
          job.includes('screenplay') ||
          job.includes('writer') ||
          job.includes('producer') ||
          job.includes('photography') ||
          job.includes('cinematographer') ||
          job.includes('music') ||
          job.includes('composer')
        );
      })
    : [];

  // Deduplicate crew by name and job
  const uniqueCrew = Array.from(
    new Map(validCrew.map((item) => [`${item.name}-${item.job}`, item])).values()
  ).slice(0, 10);

  if (validCast.length === 0 && uniqueCrew.length === 0) return null;

  const displayedCast = showAllCast ? validCast : validCast.slice(0, 12);

  return (
    <div className="cineverse-credits-wrapper animate-fade-in">
      {/* 1. Cast Section */}
      {validCast.length > 0 && (
        <section className="cineverse-cast-section">
          <div className="section-title-row">
            <div className="section-title-wrap">
              <Users size={20} className="title-icon" />
              <h2 className="section-title-text">
                Cast & Characters <span className="count-tag">({validCast.length})</span>
              </h2>
            </div>

            {validCast.length > 12 && (
              <button
                type="button"
                className="btn-view-all-cast"
                onClick={() => setShowAllCast(!showAllCast)}
                aria-expanded={showAllCast}
              >
                <span>{showAllCast ? 'Show Less' : `View All (${validCast.length})`}</span>
                {showAllCast ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>

          <div className="cast-cards-grid">
            {displayedCast.map((member) => (
              <CastCard key={member.id || member.cast_id || member.name} castMember={member} />
            ))}
          </div>
        </section>
      )}

      {/* 2. Key Crew Section */}
      {uniqueCrew.length > 0 && (
        <section className="cineverse-crew-section">
          <div className="section-title-wrap">
            <Clapperboard size={20} className="title-icon crew-icon" />
            <h2 className="section-title-text">
              Key Production Crew <span className="count-tag">({uniqueCrew.length})</span>
            </h2>
          </div>

          <div className="crew-cards-grid">
            {uniqueCrew.map((member) => (
              <CrewCard
                key={`${member.id || member.name}-${member.job}`}
                crewMember={member}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CastSection;
