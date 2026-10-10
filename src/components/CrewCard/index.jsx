import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Award } from 'lucide-react';
import { getProfileUrl } from '../../utils/imageUrl';
import './index.css';

const CrewCard = ({ crewMember }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!crewMember || !crewMember.name || !crewMember.name.trim()) return null;

  const profileUrl = crewMember.profile_path ? getProfileUrl(crewMember.profile_path) : null;
  const job = crewMember.job || crewMember.department || 'Crew';
  const searchUrl = `/search?query=${encodeURIComponent(crewMember.name)}`;

  return (
    <Link
      to={searchUrl}
      className="cineverse-crew-card-link"
      title={`Discover works by ${crewMember.name} (${job})`}
    >
      <div className="cineverse-crew-card">
        <div className="crew-photo-frame">
          {imgError || !profileUrl ? (
            <div className="crew-avatar-fallback">
              <User size={34} />
            </div>
          ) : (
            <img
              src={profileUrl}
              alt={crewMember.name}
              className={`crew-photo-img ${imgLoaded ? 'loaded' : ''}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}
          <span className="crew-job-pill">{job}</span>
        </div>

        <div className="crew-info-block">
          <h4 className="crew-name" title={crewMember.name}>
            {crewMember.name}
          </h4>
          <span className="crew-department-label">
            {crewMember.department || 'Production'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CrewCard;
