import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { getSimilarMovies } from '../../services/api';
import MovieCard from '../MovieCard';
import './index.css';

const SimilarMovies = ({ movieId, industry = 'Cinema' }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSimilar = async () => {
      if (!movieId) return;
      setLoading(true);
      try {
        const data = await getSimilarMovies(movieId);
        if (isMounted && data.results) {
          setMovies(data.results.filter((m) => Number(m.id) !== Number(movieId)).slice(0, 4));
        }
      } catch (err) {
        console.warn('Error fetching similar movies:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSimilar();
    return () => {
      isMounted = false;
    };
  }, [movieId]);

  if (loading || !movies || movies.length === 0) return null;

  return (
    <section className="similar-movies-section animate-fade-in">
      <div className="similar-header">
        <div className="similar-title-wrap">
          <Sparkles size={20} className="similar-icon" />
          <h2>More Like This from {industry}</h2>
        </div>
      </div>

      <div className="similar-grid">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </section>
  );
};

export default SimilarMovies;
