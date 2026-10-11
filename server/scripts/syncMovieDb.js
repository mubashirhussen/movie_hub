import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mainDbPath = path.resolve(__dirname, '../data/movies.db');
const movieDbJsonPaths = [
  path.resolve(__dirname, '../../movie-db/movies.json'),
  path.resolve(__dirname, '../../movies.json')
];
const movieDbSqlitePaths = [
  path.resolve(__dirname, '../../movie-db/movies.db'),
  path.resolve(__dirname, '../../movies.db')
];

// Determine cinema industry based on language, title or directors
function detectIndustry(movie) {
  const text = `${movie.title || ''} ${movie.original_title || ''} ${movie.director || ''} ${movie.genres || ''}`.toLowerCase();
  
  if (text.includes('telugu') || text.includes('rajamouli') || text.includes('sukumar') || text.includes('ram charan') || text.includes('ntr') || text.includes('prabhas') || text.includes('allu arjun') || text.includes('mahesh babu') || text.includes('chiranjeevi') || text.includes('nagarjuna')) {
    return 'Tollywood';
  }
  if (text.includes('hindi') || text.includes('shah rukh khan') || text.includes('aamir khan') || text.includes('salman khan') || text.includes('bollywood') || text.includes('hirani') || text.includes('amitabh') || text.includes('deepika') || text.includes('kapoor')) {
    return 'Bollywood';
  }
  return 'Hollywood';
}

function detectDecade(year) {
  const y = parseInt(year);
  if (!y) return '2020s';
  if (y >= 2020) return '2020s';
  if (y >= 2010) return '2010s';
  if (y >= 2000) return '2000s';
  if (y >= 1990) return '1990s';
  if (y >= 1980) return '1980s';
  return '1980s';
}

export async function syncFromMovieDb() {
  console.log('🔄 Checking for movie-db data files to import...');

  let importedCount = 0;
  const db = new sqlite3.Database(mainDbPath);

  // 1. Check for movies.json in movie-db/
  for (const jsonPath of movieDbJsonPaths) {
    if (fs.existsSync(jsonPath)) {
      try {
        console.log(`📂 Found movies JSON file at: ${jsonPath}`);
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const movies = JSON.parse(raw);

        if (Array.isArray(movies) && movies.length > 0) {
          console.log(`📥 Importing ${movies.length} movies from JSON into CineWave database...`);

          const stmt = db.prepare(`
            INSERT OR REPLACE INTO movies (
              id, title, original_title, industry, decade, release_year, release_date,
              poster_path, backdrop_path, vote_average, vote_count, popularity, runtime,
              genres, language, director, tagline, overview, budget, revenue,
              trailer_key, stream_providers, cast_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            movies.forEach((m) => {
              const year = m.year || (m.release_date ? m.release_date.slice(0, 4) : '2024');
              const decade = detectDecade(year);
              const industry = m.industry || detectIndustry(m);
              const genresList = typeof m.genres === 'string' 
                ? m.genres.split(',').map(g => g.trim()).filter(Boolean)
                : (Array.isArray(m.genres) ? m.genres : []);

              const formattedCast = (m.cast || []).map((c, idx) => ({
                id: idx + 1,
                name: c.actor || c.name || '',
                character: c.character || '',
                profile_path: c.profile_path || null
              })).filter(c => c.name && c.name.trim() !== '');

              stmt.run(
                m.id,
                m.title,
                m.original_title || m.title,
                industry,
                decade,
                parseInt(year) || 2024,
                m.release_date || '',
                m.poster_url || m.poster_path || '',
                m.backdrop_path || m.poster_url || '',
                m.vote_average || 7.5,
                m.vote_count || 100,
                m.popularity || (m.vote_average ? m.vote_average * 150 : 500),
                m.runtime_minutes || m.runtime || 120,
                JSON.stringify(genresList),
                m.language || (industry === 'Tollywood' ? 'Telugu' : industry === 'Bollywood' ? 'Hindi' : 'English'),
                m.director || '',
                m.tagline || '',
                m.overview || '',
                m.budget || 0,
                m.revenue || 0,
                m.trailer_key || null,
                JSON.stringify(m.stream_providers || ['Netflix', 'Amazon Prime Video']),
                JSON.stringify(formattedCast)
              );
              importedCount++;
            });
            db.run('COMMIT');
          });

          stmt.finalize();
          console.log(`✅ Successfully imported/synced ${importedCount} movies from movie-db into SQLite!`);
          if (process.argv[1] === fileURLToPath(import.meta.url)) {
            db.close();
          }
          return;
        }
      } catch (err) {
        console.error('Error importing from movies.json:', err.message);
      }
    }
  }

  // 2. Check for movies.db in movie-db/
  for (const sqlitePath of movieDbSqlitePaths) {
    if (fs.existsSync(sqlitePath) && sqlitePath !== mainDbPath) {
      console.log(`📂 Found external SQLite file at: ${sqlitePath}`);
      try {
        const sourceDb = new sqlite3.Database(sqlitePath);
        sourceDb.all('SELECT * FROM movies', [], (err, rows) => {
          if (err || !rows) {
            sourceDb.close();
            return;
          }

          console.log(`📥 Syncing ${rows.length} records from external movies.db...`);
          const stmt = db.prepare(`
            INSERT OR REPLACE INTO movies (
              id, title, original_title, industry, decade, release_year, release_date,
              poster_path, backdrop_path, vote_average, vote_count, popularity, runtime,
              genres, language, director, tagline, overview, budget, revenue,
              trailer_key, stream_providers, cast_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            rows.forEach((m) => {
              const year = m.year || (m.release_date ? m.release_date.slice(0, 4) : '2024');
              const decade = detectDecade(year);
              const industry = detectIndustry(m);
              const genresList = typeof m.genres === 'string' ? m.genres.split(',').map(g => g.trim()) : [];

              stmt.run(
                m.id,
                m.title,
                m.original_title || m.title,
                industry,
                decade,
                parseInt(year) || 2024,
                m.release_date || '',
                m.poster_url || m.poster_file || '',
                m.poster_url || '',
                m.vote_average || 7.5,
                m.vote_count || 100,
                500,
                m.runtime_minutes || 120,
                JSON.stringify(genresList),
                industry === 'Tollywood' ? 'Telugu' : industry === 'Bollywood' ? 'Hindi' : 'English',
                m.director || '',
                '',
                m.overview || '',
                0,
                0,
                m.trailer_key || null,
                JSON.stringify(['Netflix', 'Amazon Prime Video']),
                JSON.stringify([])
              );
            });
            db.run('COMMIT');
          });

          stmt.finalize();
          console.log(`✅ Synced ${rows.length} movies from movie-db/movies.db`);
          sourceDb.close();
          if (process.argv[1] === fileURLToPath(import.meta.url)) {
            db.close();
          }
        });
        return;
      } catch (err) {
        console.error('Error syncing from external SQLite DB:', err.message);
      }
    }
  }

  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    db.close();
  }
  console.log('ℹ️ movie-db folder is ready. If you run "python movie-db/fetch_movies.py", it will auto-sync on server start!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncFromMovieDb();
}
