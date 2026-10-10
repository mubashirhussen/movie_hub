# Movie Database (1980–Present)

Pulls a curated set of notable movies (default: 5,000, configurable up to
10,000) from TMDb, with full cast, director, genres, rating, and the
**real official release poster** for each film (no AI-generated images).

## 1. Get a free API key
Sign up at https://www.themoviedb.org/signup, then go to
Settings → API → Request an API key (choose "Developer"). It's free and
approved instantly for personal/non-commercial use.

## 2. Install dependencies
```
pip install -r requirements.txt
```

## 3. Set your API key
```
export TMDB_API_KEY="paste_your_key_here"      # macOS/Linux
set TMDB_API_KEY=paste_your_key_here            # Windows (cmd)
```

## 4. Run the fetch
```
python fetch_movies.py --target 5000
```
- `--target 10000` for the full 10k curated set (takes longer — TMDb's
  free tier is rate-limited, so 10k titles can take a couple of hours).
- `--skip-posters` if you only want the data, not the image files
  (keeps the real poster URL in the data either way).

This creates:
- `movies.db` — SQLite database (movies + cast tables, easy to query)
- `movies.xlsx` — Excel spreadsheet, one row per movie, cast flattened
  into a readable column
- `movies.json` — used by the web app
- `posters/` — the real official poster image for every movie that has one

## 5. Browse the web app
From the project root (not inside web_app/):
```
python -m http.server 8000
```
Then open: http://localhost:8000/web_app/index.html

Search by title, actor, or director; click any poster for full details
and the complete cast list.

## Notes
- Movies are selected by vote count (how many people have rated them on
  TMDb), which surfaces widely-known titles rather than obscure
  long-tail entries. Change `SORT_BY` in `fetch_movies.py` to
  `"popularity.desc"` or `"revenue.desc"` if you'd rather sort that way.
- Per your spec: any cast entry with no actor name is dropped entirely;
  if the actor is known but the character name isn't, the actor is kept
  with a blank character field.
- All data and posters come directly from TMDb's official API — nothing
  here is AI-generated.
