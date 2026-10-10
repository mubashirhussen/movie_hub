"""
fetch_movies.py
----------------
Pulls a curated set of notable movies released from 1980 to present from
TMDb (The Movie Database — https://www.themoviedb.org), including full
cast credits and the ORIGINAL official release poster (no AI-generated
images — posters are the real files TMDb hosts for each title).

Output:
  - movies.db        SQLite database (movies + cast tables)
  - movies.xlsx       Excel spreadsheet (one row per movie, cast flattened)
  - movies.json       JSON file used by the local web app (web_app/index.html)
  - posters/*.jpg     Downloaded official poster images

Setup:
  1. Get a free TMDb API key: https://www.themoviedb.org/settings/api
     (Sign up -> Settings -> API -> Request an API key, "Developer" type)
  2. pip install -r requirements.txt
  3. export TMDB_API_KEY="your_key_here"       (Windows: set TMDB_API_KEY=...)
  4. python fetch_movies.py --target 5000

Notes:
  - "Notable" = sorted by vote_count (how many people have rated it) so you
    get well-known, widely-reviewed films rather than obscure long-tail titles.
    Adjust SORT_BY below if you'd rather sort by popularity or revenue.
  - Cast entries with a missing actor name are skipped entirely (not left
    blank) per your instruction. If an actor name exists but the character
    name is unknown, the character field is left blank.
  - TMDb's free API allows ~40 requests / 10 seconds; this script throttles
    automatically and will take a while for large targets (expect 1-3 hours
    for 10,000 titles, since each movie needs its own credits call).
"""

import os
import sys
import time
import json
import sqlite3
import argparse
import requests
from tqdm import tqdm

API_KEY = os.environ.get("TMDB_API_KEY", "").strip()
BASE_URL = "https://api.themoviedb.org/3"
IMG_BASE = "https://image.tmdb.org/t/p/original"
SORT_BY = "vote_count.desc"   # alternatives: "popularity.desc", "revenue.desc"
MIN_VOTE_COUNT = 50           # filters out ultra-obscure titles with 1-2 ratings
START_DATE = "1980-01-01"
REQUEST_PAUSE = 0.26          # ~ keeps us under the 40 req / 10s free-tier limit

session = requests.Session()


def api_get(path, **params):
    params["api_key"] = API_KEY
    for attempt in range(5):
        r = session.get(f"{BASE_URL}{path}", params=params, timeout=20)
        if r.status_code == 429:
            time.sleep(2 * (attempt + 1))
            continue
        r.raise_for_status()
        time.sleep(REQUEST_PAUSE)
        return r.json()
    raise RuntimeError(f"Failed after retries: {path}")


def discover_movie_ids(target):
    ids = []
    page = 1
    today = time.strftime("%Y-%m-%d")
    with tqdm(total=target, desc="Discovering titles") as bar:
        while len(ids) < target:
            data = api_get(
                "/discover/movie",
                sort_by=SORT_BY,
                **{
                    "primary_release_date.gte": START_DATE,
                    "primary_release_date.lte": today,
                    "vote_count.gte": MIN_VOTE_COUNT,
                    "include_adult": "false",
                },
                page=page,
            )
            results = data.get("results", [])
            if not results:
                break
            for m in results:
                ids.append(m["id"])
                bar.update(1)
                if len(ids) >= target:
                    break
            page += 1
            if page > data.get("total_pages", page):
                break
    return ids[:target]


def fetch_movie_detail(movie_id):
    data = api_get(f"/movie/{movie_id}", append_to_response="credits")

    cast = []
    for c in data.get("credits", {}).get("cast", [])[:25]:  # top 25 billed
        name = (c.get("name") or "").strip()
        if not name:
            continue  # unknown actor name -> omit entirely, as requested
        character = (c.get("character") or "").strip()  # blank if unknown
        cast.append({"actor": name, "character": character})

    director = ""
    for c in data.get("credits", {}).get("crew", []):
        if c.get("job") == "Director":
            director = c.get("name", "")
            break

    poster_path = data.get("poster_path")
    poster_url = f"{IMG_BASE}{poster_path}" if poster_path else ""

    return {
        "id": data["id"],
        "title": data.get("title", ""),
        "original_title": data.get("original_title", ""),
        "release_date": data.get("release_date", ""),
        "year": (data.get("release_date") or "")[:4],
        "genres": ", ".join(g["name"] for g in data.get("genres", [])),
        "runtime_minutes": data.get("runtime"),
        "overview": data.get("overview", ""),
        "director": director,
        "vote_average": data.get("vote_average"),
        "vote_count": data.get("vote_count"),
        "poster_url": poster_url,
        "poster_file": f"posters/{data['id']}.jpg" if poster_path else "",
        "cast": cast,
    }


def download_poster(movie):
    if not movie["poster_url"]:
        return
    dest = movie["poster_file"]
    if os.path.exists(dest):
        return
    try:
        r = session.get(movie["poster_url"], timeout=20)
        r.raise_for_status()
        with open(dest, "wb") as f:
            f.write(r.content)
    except Exception as e:
        print(f"  (poster download failed for {movie['title']}: {e})", file=sys.stderr)


def save_sqlite(movies, path="movies.db"):
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.executescript(
        """
        DROP TABLE IF EXISTS movies;
        DROP TABLE IF EXISTS cast_members;
        CREATE TABLE movies (
            id INTEGER PRIMARY KEY,
            title TEXT, original_title TEXT, release_date TEXT, year TEXT,
            genres TEXT, runtime_minutes INTEGER, overview TEXT,
            director TEXT, vote_average REAL, vote_count INTEGER,
            poster_url TEXT, poster_file TEXT
        );
        CREATE TABLE cast_members (
            movie_id INTEGER, actor TEXT, character TEXT,
            FOREIGN KEY(movie_id) REFERENCES movies(id)
        );
        """
    )
    for m in movies:
        cur.execute(
            """INSERT INTO movies VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (m["id"], m["title"], m["original_title"], m["release_date"], m["year"],
             m["genres"], m["runtime_minutes"], m["overview"], m["director"],
             m["vote_average"], m["vote_count"], m["poster_url"], m["poster_file"]),
        )
        for c in m["cast"]:
            cur.execute(
                "INSERT INTO cast_members VALUES (?,?,?)",
                (m["id"], c["actor"], c["character"]),
            )
    conn.commit()
    conn.close()


def save_xlsx(movies, path="movies.xlsx"):
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Movies"
    headers = ["ID", "Title", "Year", "Release Date", "Genres", "Runtime (min)",
               "Director", "Rating", "Vote Count", "Overview", "Poster URL", "Cast"]
    ws.append(headers)
    for m in movies:
        cast_str = "; ".join(
            f"{c['actor']} as {c['character']}" if c["character"] else c["actor"]
            for c in m["cast"]
        )
        ws.append([
            m["id"], m["title"], m["year"], m["release_date"], m["genres"],
            m["runtime_minutes"], m["director"], m["vote_average"], m["vote_count"],
            m["overview"], m["poster_url"], cast_str,
        ])
    wb.save(path)


def save_json(movies, path="movies.json"):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(movies, f, ensure_ascii=False, indent=1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", type=int, default=5000,
                         help="Number of movies to fetch (5000-10000 recommended)")
    parser.add_argument("--skip-posters", action="store_true",
                         help="Skip downloading poster image files (keeps only URLs)")
    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: Set the TMDB_API_KEY environment variable first.\n"
              "Get a free key at https://www.themoviedb.org/settings/api")
        sys.exit(1)

    os.makedirs("posters", exist_ok=True)

    print(f"Discovering up to {args.target} notable movies (1980-present)...")
    ids = discover_movie_ids(args.target)
    print(f"Found {len(ids)} titles. Fetching full details + cast...")

    movies = []
    for mid in tqdm(ids, desc="Fetching details"):
        try:
            m = fetch_movie_detail(mid)
        except Exception as e:
            print(f"  (skipped movie id {mid}: {e})", file=sys.stderr)
            continue
        movies.append(m)
        if not args.skip_posters:
            download_poster(m)

    print("Saving movies.db (SQLite)...")
    save_sqlite(movies)
    print("Saving movies.xlsx (Excel)...")
    save_xlsx(movies)
    print("Saving movies.json (for the web app)...")
    save_json(movies)

    print(f"\nDone. {len(movies)} movies saved.")
    print("Posters saved in ./posters/  |  Open web_app/index.html via a local server to browse.")


if __name__ == "__main__":
    main()
