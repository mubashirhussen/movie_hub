import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { getProfileUrl } from '../../utils/imageUrl';
import './index.css';

const CastCard = ({ castMember }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!castMember || !castMember.name || !castMember.name.trim()) return null;

  const profileUrl = castMember.profile_path ? getProfileUrl(castMember.profile_path) : null;
  const character = castMember.character?.trim();
  const searchUrl = `/search?actor=${castMember.id}&query=${encodeURIComponent(castMember.name)}`;

  return (
    <Link to={searchUrl} className="cineverse-cast-card-link" title={`Discover films starring ${castMember.name}`}>
      <div className="cineverse-cast-card">
        <div className="cast-photo-frame">
          {imgError || !profileUrl ? (
            <div className="cast-avatar-fallback">
              <User size={36} />
            </div>
          ) : (
            <img
              src={profileUrl}
              alt={castMember.name}
              className={`cast-photo-img ${imgLoaded ? 'loaded' : ''}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}
        </div>

        <div className="cast-info-block">
          <h4 className="cast-actor-name" title={castMember.name}>
            {castMember.name}
          </h4>
          {character && (
            <p className="cast-character-role" title={character}>
              <span className="as-label">as </span>
              {character}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CastCard;
