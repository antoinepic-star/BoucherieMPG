const express = require('express');
const { v4: uuid } = require('uuid');
const { tursoAll, tursoGet, tursoRun } = require('../lib/db');
const { checkAdminPassword, signToken, requireAuth } = require('../lib/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (!checkAdminPassword(password)) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }
  res.json({ token: signToken() });
});

router.use(requireAuth);

// --- Joueurs ---

router.get('/players', async (req, res) => {
  const players = await tursoAll('SELECT * FROM players ORDER BY order_index, name');
  res.json(players);
});

async function nextPlayerOrderIndex() {
  const row = await tursoGet('SELECT MAX(order_index) as maxOrder FROM players');
  return (row && row.maxOrder !== null ? Number(row.maxOrder) : 0) + 1;
}

router.post('/players', async (req, res) => {
  const { name, avatar_url, tagline } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Le nom est obligatoire' });
  const id = uuid();
  const orderIndex = await nextPlayerOrderIndex();
  await tursoRun(
    'INSERT INTO players (id, name, avatar_url, tagline, order_index) VALUES (?, ?, ?, ?, ?)',
    [id, name.trim(), avatar_url || null, tagline || null, orderIndex]
  );
  const player = await tursoGet('SELECT * FROM players WHERE id = ?', [id]);
  res.status(201).json(player);
});

router.put('/players/reorder', async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ error: 'order doit être un tableau de noms, dans l\'ordre voulu' });
  }
  const players = await tursoAll('SELECT * FROM players');
  const byName = new Map(players.map((p) => [p.name.trim().toLowerCase(), p]));
  const notFound = [];
  for (let i = 0; i < order.length; i++) {
    const player = byName.get(String(order[i]).trim().toLowerCase());
    if (!player) {
      notFound.push(order[i]);
      continue;
    }
    await tursoRun('UPDATE players SET order_index = ? WHERE id = ?', [i + 1, player.id]);
  }
  const updated = await tursoAll('SELECT * FROM players ORDER BY order_index, name');
  res.json({ players: updated, notFound });
});

router.put('/players/:id', async (req, res) => {
  const existing = await tursoGet('SELECT * FROM players WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Joueur introuvable' });
  const { name, avatar_url, tagline } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Le nom est obligatoire' });
  await tursoRun(
    'UPDATE players SET name = ?, avatar_url = ?, tagline = ? WHERE id = ?',
    [name.trim(), avatar_url || null, tagline || null, req.params.id]
  );
  const player = await tursoGet('SELECT * FROM players WHERE id = ?', [req.params.id]);
  res.json(player);
});

// --- Ligues ---

router.get('/leagues', async (req, res) => {
  const leagues = await tursoAll('SELECT * FROM leagues ORDER BY order_index');
  res.json(leagues);
});

router.get('/leagues/:id', async (req, res) => {
  const league = await tursoGet('SELECT * FROM leagues WHERE id = ?', [req.params.id]);
  if (!league) return res.status(404).json({ error: 'Ligue introuvable' });
  const results = await tursoAll(
    'SELECT r.*, p.name as player_name FROM league_results r JOIN players p ON p.id = r.player_id WHERE r.league_id = ? ORDER BY r.rank',
    [req.params.id]
  );
  res.json({ ...league, highlights: JSON.parse(league.highlights_json || '[]'), results });
});

async function nextOrderIndex() {
  const row = await tursoGet('SELECT MAX(order_index) as maxOrder FROM leagues');
  return (row && row.maxOrder !== null ? Number(row.maxOrder) : 0) + 1;
}

function validateLeaguePayload(body) {
  const { name, size, results } = body || {};
  if (!name || !name.trim()) return 'Le nom de la ligue est obligatoire';
  if (![8, 10].includes(Number(size))) return 'La taille doit être 8 ou 10';
  if (!Array.isArray(results) || results.length === 0) return 'Il faut au moins un résultat';
  for (const r of results) {
    if (!r.player_id) return 'Chaque résultat doit avoir un joueur';
    if (typeof r.rank !== 'number' || r.rank < 1) return 'Rang invalide';
    if (typeof r.points !== 'number') return 'Points invalides';
  }
  return null;
}

function sanitizeHighlights(highlights) {
  if (!Array.isArray(highlights)) return [];
  return highlights.map((h) => String(h).trim()).filter(Boolean);
}

router.post('/leagues', async (req, res) => {
  const error = validateLeaguePayload(req.body);
  if (error) return res.status(400).json({ error });
  const { name, period_label, size, results, photo_url, story_title, story_text } = req.body;
  const highlights = sanitizeHighlights(req.body.highlights);
  const orderIndex = req.body.order_index != null ? Number(req.body.order_index) : await nextOrderIndex();
  const leagueId = uuid();

  await tursoRun(
    'INSERT INTO leagues (id, name, period_label, size, order_index, photo_url, highlights_json, story_title, story_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [leagueId, name.trim(), period_label || null, Number(size), orderIndex, photo_url || null, JSON.stringify(highlights), story_title || null, story_text || null]
  );
  for (const r of results) {
    await tursoRun(
      'INSERT INTO league_results (id, league_id, player_id, points, rank) VALUES (?, ?, ?, ?, ?)',
      [uuid(), leagueId, r.player_id, r.points, r.rank]
    );
  }
  const league = await tursoGet('SELECT * FROM leagues WHERE id = ?', [leagueId]);
  res.status(201).json(league);
});

router.put('/leagues/:id', async (req, res) => {
  const existing = await tursoGet('SELECT * FROM leagues WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Ligue introuvable' });
  const error = validateLeaguePayload(req.body);
  if (error) return res.status(400).json({ error });
  const { name, period_label, size, results, photo_url, story_title, story_text } = req.body;
  const highlights = sanitizeHighlights(req.body.highlights);
  const orderIndex = req.body.order_index != null ? Number(req.body.order_index) : existing.order_index;

  await tursoRun(
    'UPDATE leagues SET name = ?, period_label = ?, size = ?, order_index = ?, photo_url = ?, highlights_json = ?, story_title = ?, story_text = ? WHERE id = ?',
    [name.trim(), period_label || null, Number(size), orderIndex, photo_url || null, JSON.stringify(highlights), story_title || null, story_text || null, req.params.id]
  );
  await tursoRun('DELETE FROM league_results WHERE league_id = ?', [req.params.id]);
  for (const r of results) {
    await tursoRun(
      'INSERT INTO league_results (id, league_id, player_id, points, rank) VALUES (?, ?, ?, ?, ?)',
      [uuid(), req.params.id, r.player_id, r.points, r.rank]
    );
  }
  const league = await tursoGet('SELECT * FROM leagues WHERE id = ?', [req.params.id]);
  res.json(league);
});

// --- Ligue en cours ---

router.get('/ongoing-league', async (req, res) => {
  const row = await tursoGet("SELECT * FROM ongoing_league WHERE id = 'current'");
  res.json(row ? { ...row, hypeQuotes: JSON.parse(row.hype_quotes_json || '[]') } : null);
});

router.put('/ongoing-league', async (req, res) => {
  const { name, end_at, hype_quotes, photo_url } = req.body || {};
  const quotes = Array.isArray(hype_quotes)
    ? hype_quotes.filter((q) => q && q.player_id && q.phrase).map((q) => ({ player_id: q.player_id, phrase: String(q.phrase).trim() }))
    : [];
  await tursoRun(
    `INSERT INTO ongoing_league (id, name, end_at, hype_quotes_json, photo_url) VALUES ('current', ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, end_at = excluded.end_at, hype_quotes_json = excluded.hype_quotes_json, photo_url = excluded.photo_url`,
    [name || null, end_at != null ? Number(end_at) : null, JSON.stringify(quotes), photo_url || null]
  );
  const row = await tursoGet("SELECT * FROM ongoing_league WHERE id = 'current'");
  res.json({ ...row, hypeQuotes: JSON.parse(row.hype_quotes_json || '[]') });
});

module.exports = router;
