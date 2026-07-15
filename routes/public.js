const express = require('express');
const { tursoGet } = require('../lib/db');
const { recomputeAll, loadEverything } = require('../lib/recompute');
const { buildHomeHighlights, HOF_META } = require('../lib/highlights');
const { computeRankHistory } = require('../lib/engine');

const router = express.Router();

function playerMap(players) {
  return new Map(players.map((p) => [p.id, p]));
}

function leagueMap(leagues) {
  return new Map(leagues.map((l) => [l.id, l]));
}

router.get('/home', async (req, res) => {
  const { players, leagues, results, computed } = await recomputeAll();
  if (leagues.length === 0) return res.json({ empty: true });
  res.json(buildHomeHighlights({ leagues, results, computed, players }));
});

router.get('/ongoing-league', async (req, res) => {
  const row = await tursoGet("SELECT * FROM ongoing_league WHERE id = 'current'");
  if (!row || !row.name) return res.json({ empty: true });
  const { players } = await recomputeAll();
  const pById = playerMap(players);
  const hypeQuotes = JSON.parse(row.hype_quotes_json || '[]').map((q) => ({
    playerId: q.player_id,
    playerName: pById.get(q.player_id)?.name || null,
    playerAvatarUrl: pById.get(q.player_id)?.avatar_url || null,
    phrase: q.phrase,
  }));
  res.json({ name: row.name, endAt: row.end_at, photoUrl: row.photo_url, hypeQuotes });
});

router.get('/hall-of-fame', async (req, res) => {
  const { players, leagues, computed } = await recomputeAll();
  const pById = playerMap(players);
  const lById = leagueMap(leagues);
  const out = Object.entries(computed.hallOfFame).map(([key, record]) => ({
    key,
    ...HOF_META[key],
    holder: record ? pById.get(record.holderId)?.name || null : null,
    holderId: record ? record.holderId : null,
    holderAvatarUrl: record ? pById.get(record.holderId)?.avatar_url || null : null,
    value: record ? record.value : null,
    sinceLeagueName: record ? lById.get(record.sinceLeagueId)?.name || null : null,
    previousHolder: record && record.previousHolderId ? pById.get(record.previousHolderId)?.name || null : null,
  }));
  res.json(out);
});

router.get('/rankings', async (req, res) => {
  const { players, computed } = await recomputeAll();
  const pById = playerMap(players);
  res.json(
    computed.scores.map((s) => ({
      ...s,
      name: pById.get(s.playerId)?.name || null,
      avatarUrl: pById.get(s.playerId)?.avatar_url || null,
    }))
  );
});

router.get('/rankings-history', async (req, res) => {
  const { players, leagues, results } = await loadEverything();
  const pById = playerMap(players);
  const history = computeRankHistory({ players, leagues, results });
  res.json({
    leagues: history.leagues,
    maxRank: history.maxRank,
    series: history.series
      .map((s) => ({
        playerId: s.playerId,
        name: pById.get(s.playerId)?.name || null,
        avatarUrl: pById.get(s.playerId)?.avatar_url || null,
        data: s.data,
      }))
      .filter((s) => s.data.some((d) => d !== null)),
  });
});

router.get('/players', async (req, res) => {
  const { players, computed } = await recomputeAll();
  const scoreById = new Map(computed.scores.map((s) => [s.playerId, s]));
  res.json(
    players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,
      tagline: p.tagline,
      score: scoreById.get(p.id) || null,
      badges: computed.badges.get(p.id) || null,
    }))
  );
});

router.get('/players/:id', async (req, res) => {
  const { players, leagues, results, computed } = await recomputeAll();
  const player = players.find((p) => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Joueur introuvable' });
  const resultByLeagueId = new Map(
    results.filter((r) => r.player_id === player.id).map((r) => [r.league_id, r])
  );
  const leagueHistory = [...leagues]
    .sort((a, b) => b.order_index - a.order_index)
    .map((l) => {
      const r = resultByLeagueId.get(l.id);
      return {
        leagueId: l.id,
        leagueName: l.name,
        rank: r ? r.rank : null,
        points: r ? r.points : null,
      };
    });
  res.json({
    ...player,
    score: computed.scores.find((s) => s.playerId === player.id) || null,
    badges: computed.badges.get(player.id) || null,
    leagueHistory,
  });
});

router.get('/players/:id1/duel/:id2', async (req, res) => {
  const { players, leagues, results, computed } = await recomputeAll();
  const p1 = players.find((p) => p.id === req.params.id1);
  const p2 = players.find((p) => p.id === req.params.id2);
  if (!p1 || !p2) return res.status(404).json({ error: 'Joueur introuvable' });
  const lById = leagueMap(leagues);
  const r1ByLeague = new Map(results.filter((r) => r.player_id === p1.id).map((r) => [r.league_id, r]));
  const r2ByLeague = new Map(results.filter((r) => r.player_id === p2.id).map((r) => [r.league_id, r]));
  const sharedLeagueIds = [...r1ByLeague.keys()].filter((id) => r2ByLeague.has(id));

  let p1Wins = 0;
  let p2Wins = 0;
  const confrontations = sharedLeagueIds
    .map((leagueId) => {
      const r1 = r1ByLeague.get(leagueId);
      const r2 = r2ByLeague.get(leagueId);
      let winner = null;
      if (r1.rank < r2.rank) {
        winner = p1.id;
        p1Wins += 1;
      } else if (r2.rank < r1.rank) {
        winner = p2.id;
        p2Wins += 1;
      }
      const league = lById.get(leagueId);
      return { leagueId, leagueName: league?.name, orderIndex: league?.order_index, p1Rank: r1.rank, p2Rank: r2.rank, winner };
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const s1 = computed.scores.find((s) => s.playerId === p1.id);
  const s2 = computed.scores.find((s) => s.playerId === p2.id);

  res.json({
    player1: { id: p1.id, name: p1.name, avatarUrl: p1.avatar_url, score: s1 || null },
    player2: { id: p2.id, name: p2.name, avatarUrl: p2.avatar_url, score: s2 || null },
    scoreGap: s1 && s2 ? Math.abs(s1.scoreGlobal - s2.scoreGlobal) : null,
    p1Wins,
    p2Wins,
    confrontations,
  });
});

router.get('/leagues', async (req, res) => {
  const { players, leagues, results } = await recomputeAll();
  const pById = playerMap(players);
  const out = [...leagues]
    .sort((a, b) => b.order_index - a.order_index)
    .map((l) => {
      const leagueResults = results
        .filter((r) => r.league_id === l.id)
        .sort((a, b) => a.rank - b.rank)
        .map((r) => ({
          ...r,
          playerName: pById.get(r.player_id)?.name || null,
          playerAvatarUrl: pById.get(r.player_id)?.avatar_url || null,
        }));
      const winnerResult = leagueResults.find((r) => r.rank === 1) || null;
      return {
        ...l,
        highlights: JSON.parse(l.highlights_json || '[]'),
        winner: winnerResult ? { id: winnerResult.player_id, name: winnerResult.playerName, avatarUrl: winnerResult.playerAvatarUrl } : null,
        results: leagueResults,
      };
    });
  res.json(out);
});

module.exports = router;
