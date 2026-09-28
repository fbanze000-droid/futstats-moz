const sqlite = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'futstats.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    league TEXT,
    country TEXT,
    match_key TEXT,
    match_date TEXT,
    kickoff_time TEXT,
    home_team TEXT,
    away_team TEXT,
    home_emoji TEXT,
    away_emoji TEXT,
    home_form TEXT,
    away_form TEXT,
    xg_home REAL,
    xg_away REAL,
    home_win INTEGER,
    draw INTEGER,
    away_win INTEGER,
    over25 INTEGER,
    btts INTEGER,
    market TEXT,
    recommendation TEXT,
    confidence INTEGER,
    created_at TEXT,
    updated_at TEXT,
    source TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT,
    finished_at TEXT,
    status TEXT,
    message TEXT,
    source TEXT
  );
`);

function initDatabase() {
  return db;
}

function getDatabaseStats() {
  const count = db.prepare('SELECT COUNT(*) as total FROM matches').get();
  const latest = db.prepare('SELECT MAX(updated_at) as updated_at FROM matches').get();

  return {
    totalMatches: count.total,
    lastUpdated: latest.updated_at,
  };
}

function getMatchesForToday() {
  const today = new Date().toISOString().slice(0, 10);

  const rows = db.prepare(`
    SELECT * FROM matches
    WHERE match_date = ?
    ORDER BY kickoff_time ASC
  `).all(today);

  return rows.map((row) => ({
    id: row.id,
    league: row.league,
    country: row.country,
    key: row.match_key,
    date: row.match_date,
    time: row.kickoff_time,
    home: row.home_team,
    away: row.away_team,
    homeEmoji: row.home_emoji,
    awayEmoji: row.away_emoji,
    homeForm: row.home_form,
    awayForm: row.away_form,
    xgHome: Number(row.xg_home || 0),
    xgAway: Number(row.xg_away || 0),
    homeWin: Number(row.home_win || 0),
    draw: Number(row.draw || 0),
    awayWin: Number(row.away_win || 0),
    over25: Number(row.over25 || 0),
    btts: Number(row.btts || 0),
    market: row.market,
    recommendation: row.recommendation,
    confidence: Number(row.confidence || 0),
    updatedAt: row.updated_at,
    source: row.source,
    status: row.status,
  }));
}

function getLatestUpdatedAt() {
  const row = db.prepare('SELECT MAX(updated_at) AS updated_at FROM matches').get();
  return row?.updated_at || null;
}

function upsertMatches(matches) {
  const insert = db.prepare(`
    INSERT INTO matches (
      id, league, country, match_key, match_date, kickoff_time, home_team, away_team,
      home_emoji, away_emoji, home_form, away_form, xg_home, xg_away, home_win, draw,
      away_win, over25, btts, market, recommendation, confidence, created_at, updated_at,
      source, status
    ) VALUES (
      @id, @league, @country, @match_key, @match_date, @kickoff_time, @home_team, @away_team,
      @home_emoji, @away_emoji, @home_form, @away_form, @xg_home, @xg_away, @home_win, @draw,
      @away_win, @over25, @btts, @market, @recommendation, @confidence, @created_at, @updated_at,
      @source, @status
    )
    ON CONFLICT(id) DO UPDATE SET
      league = excluded.league,
      country = excluded.country,
      match_key = excluded.match_key,
      match_date = excluded.match_date,
      kickoff_time = excluded.kickoff_time,
      home_team = excluded.home_team,
      away_team = excluded.away_team,
      home_emoji = excluded.home_emoji,
      away_emoji = excluded.away_emoji,
      home_form = excluded.home_form,
      away_form = excluded.away_form,
      xg_home = excluded.xg_home,
      xg_away = excluded.xg_away,
      home_win = excluded.home_win,
      draw = excluded.draw,
      away_win = excluded.away_win,
      over25 = excluded.over25,
      btts = excluded.btts,
      market = excluded.market,
      recommendation = excluded.recommendation,
      confidence = excluded.confidence,
      updated_at = excluded.updated_at,
      source = excluded.source,
      status = excluded.status
  `);

  const tx = db.transaction((rows) => {
    for (const match of rows) {
      insert.run(match);
    }
  });

  tx(matches);
}

function logSync(startedAt, finishedAt, status, message, source) {
  db.prepare(`
    INSERT INTO sync_log (started_at, finished_at, status, message, source)
    VALUES (?, ?, ?, ?, ?)
  `).run(startedAt, finishedAt, status, message, source);
}

module.exports = {
  initDatabase,
  getDatabaseStats,
  getMatchesForToday,
  getLatestUpdatedAt,
  upsertMatches,
  logSync,
  db,
};
