const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

if (!process.env.TURSO_DATABASE_URL) {
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
}

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/mpg.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function tursoAll(sql, args = []) {
  const res = await turso.execute({ sql, args });
  return res.rows;
}

async function tursoGet(sql, args = []) {
  const rows = await tursoAll(sql, args);
  return rows[0] || null;
}

async function tursoRun(sql, args = []) {
  return turso.execute({ sql, args });
}

async function initDb() {
  await turso.batch([
    `CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_url TEXT,
      tagline TEXT,
      favorite_team TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS leagues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      period_label TEXT,
      size INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS league_results (
      id TEXT PRIMARY KEY,
      league_id TEXT NOT NULL REFERENCES leagues(id),
      player_id TEXT NOT NULL REFERENCES players(id),
      points REAL NOT NULL,
      rank INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_results_league ON league_results(league_id)`,
    `CREATE INDEX IF NOT EXISTS idx_results_player ON league_results(player_id)`,
    `CREATE TABLE IF NOT EXISTS ongoing_league (
      id TEXT PRIMARY KEY DEFAULT 'current',
      name TEXT,
      end_at INTEGER,
      hype_quotes_json TEXT DEFAULT '[]'
    )`,
  ], 'write');

  const leagueColumns = await tursoAll('PRAGMA table_info(leagues)');
  const columnNames = leagueColumns.map((c) => c.name);
  if (!columnNames.includes('photo_url')) {
    await tursoRun('ALTER TABLE leagues ADD COLUMN photo_url TEXT');
  }
  if (!columnNames.includes('highlights_json')) {
    await tursoRun("ALTER TABLE leagues ADD COLUMN highlights_json TEXT DEFAULT '[]'");
  }
  if (!columnNames.includes('story_title')) {
    await tursoRun('ALTER TABLE leagues ADD COLUMN story_title TEXT');
  }
  if (!columnNames.includes('story_text')) {
    await tursoRun('ALTER TABLE leagues ADD COLUMN story_text TEXT');
  }

  const playerColumns = await tursoAll('PRAGMA table_info(players)');
  const playerColumnNames = playerColumns.map((c) => c.name);
  if (!playerColumnNames.includes('order_index')) {
    await tursoRun('ALTER TABLE players ADD COLUMN order_index INTEGER');
    const playersWithoutOrder = await tursoAll(
      'SELECT id FROM players WHERE order_index IS NULL ORDER BY name'
    );
    for (let i = 0; i < playersWithoutOrder.length; i++) {
      await tursoRun('UPDATE players SET order_index = ? WHERE id = ?', [i + 1, playersWithoutOrder[i].id]);
    }
  }
}

module.exports = { turso, tursoAll, tursoGet, tursoRun, initDb };
