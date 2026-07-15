// Moteur de calcul pur : aucun accès DB ici, uniquement des transformations de données.

const Z_WEIGHT = 2; // ⚙️ poids de la marge de points dans score_ligue
const SAMPLE_MALUS_THRESHOLD = 5; // ⚙️ nb de ligues avant classement "définitif"
const SIGNATURE_Z_THRESHOLD = 0.3; // ⚙️ seuil d'atypie pour décrocher un badge signature
const SIGNATURE_MAX_BADGES = 3;
const POULIDOR_PERCENTILE = 0.75; // ⚙️ top 25% des scores de vainqueurs

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdev(values) {
  if (values.length === 0) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function scoreRang(rank, size) {
  if (size <= 1) return 0;
  const p = (size + 1 - 2 * rank) / (size - 1);
  return p >= 0 ? 10 * p ** 3 : 3 * p ** 3;
}

/** Moyenne/écart-type/z-score par ligue. z=0 si la ligue n'a aucune dispersion de points. */
function computeLeagueStats(leagues, results) {
  const byLeague = new Map();
  for (const league of leagues) {
    const leagueResults = results.filter((r) => r.league_id === league.id);
    const points = leagueResults.map((r) => r.points);
    const m = mean(points);
    const sd = stdev(points);
    const sorted = [...leagueResults].sort((a, b) => a.rank - b.rank);
    const first = sorted.find((r) => r.rank === 1);
    const second = sorted.find((r) => r.rank === 2);
    const secondToLast = sorted.find((r) => r.rank === league.size - 1);
    const last = sorted.find((r) => r.rank === league.size);
    byLeague.set(league.id, {
      league,
      mean: m,
      stdev: sd,
      results: leagueResults.map((r) => ({
        ...r,
        z: sd === 0 ? 0 : (r.points - m) / sd,
      })),
      gapFirstSecond: first && second ? first.points - second.points : null,
      gapSecondLastLast: secondToLast && last ? secondToLast.points - last.points : null,
      firstPlayerId: first ? first.player_id : null,
      lastPlayerId: last ? last.player_id : null,
      firstPlayerPoints: first ? first.points : null,
      lastPlayerPoints: last ? last.points : null,
    });
  }
  return byLeague;
}

/** score_ligue = score_rang + Z_WEIGHT * z, pour chaque résultat. */
function computeLeagueScores(leagueStatsById) {
  const scoresByResultId = new Map();
  for (const { league, results } of leagueStatsById.values()) {
    for (const r of results) {
      scoresByResultId.set(r.id, scoreRang(r.rank, league.size) + Z_WEIGHT * r.z);
    }
  }
  return scoresByResultId;
}

/** score_global = moyenne(score_ligue) + malus d'échantillon si <5 ligues jouées. */
function computeScoresPerPlayer(players, results, leagueScoresByResultId) {
  return players.map((player) => {
    const playerResults = results.filter((r) => r.player_id === player.id);
    const nbLeagues = playerResults.length;
    const leagueScores = playerResults.map((r) => leagueScoresByResultId.get(r.id));
    const rawAvg = mean(leagueScores);
    const malus = nbLeagues < SAMPLE_MALUS_THRESHOLD ? -2 * (SAMPLE_MALUS_THRESHOLD - nbLeagues) : 0;
    return {
      playerId: player.id,
      scoreGlobal: rawAvg + malus,
      nbLeagues,
      provisional: nbLeagues < SAMPLE_MALUS_THRESHOLD,
    };
  });
}

/**
 * Pour chaque joueur : ses résultats triés par ordre chronologique de ligue JOUÉE par lui
 * (pas l'ordre chronologique global — un joueur peut sauter des ligues).
 * Sert de source unique aux badges de type série/delta.
 */
function computeChronologicalOrderPerPlayer(players, leagues, results) {
  const orderById = new Map(leagues.map((l) => [l.id, l.order_index]));
  const sizeById = new Map(leagues.map((l) => [l.id, l.size]));
  const timelineByPlayer = new Map();
  for (const player of players) {
    const timeline = results
      .filter((r) => r.player_id === player.id)
      .map((r) => ({ leagueId: r.league_id, rank: r.rank, points: r.points, size: sizeById.get(r.league_id) }))
      .sort((a, b) => orderById.get(a.leagueId) - orderById.get(b.leagueId));
    timelineByPlayer.set(player.id, timeline);
  }
  return timelineByPlayer;
}

function longestStreak(items, predicate) {
  let best = 0;
  let current = 0;
  for (const item of items) {
    if (predicate(item)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function longestIdenticalRankStreak(timeline) {
  let best = 1;
  let current = 1;
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].rank === timeline[i - 1].rank) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return timeline.length === 0 ? 0 : best;
}

function consecutiveBottomTwoPairs(timeline) {
  let count = 0;
  for (let i = 1; i < timeline.length; i++) {
    const prevBottom = timeline[i - 1].rank >= timeline[i - 1].size - 1;
    const currBottom = timeline[i].rank >= timeline[i].size - 1;
    if (prevBottom && currBottom) count += 1;
  }
  return count;
}

function maxRankDelta(timeline, direction) {
  // direction = 1 pour amélioration (rang qui baisse), -1 pour chute (rang qui monte)
  let best = 0;
  for (let i = 1; i < timeline.length; i++) {
    const delta = direction * (timeline[i - 1].rank - timeline[i].rank);
    if (delta > best) best = delta;
  }
  return best;
}

/** Détenteurs des 9 records Hall of Fame, en rejouant l'historique dans l'ordre chronologique. */
function computeHallOfFame(leagues, leagueStatsById, timelineByPlayer) {
  const orderedLeagues = [...leagues].sort((a, b) => a.order_index - b.order_index);
  const records = {
    sniper: null, // plus haut total de points sur une ligue
    naufrage: null, // plus bas total de points sur une ligue
    fossoyeur: null, // plus gros écart 1er/2e
    photoFinish: null, // plus petit écart 1er/2e
    ko: null, // plus gros écart avant-dernier/dernier
    dimanche: null, // plus faible total de points d'un vainqueur
    boulet: null, // plus haut total de points d'un dernier
    phenix: null, // plus grosse remontée au classement d'une ligue à la suivante
    icare: null, // plus grosse chute au classement d'une ligue à la suivante
  };

  function maybeUpdate(key, candidateValue, holderId, leagueId, better) {
    const current = records[key];
    if (current === null || better(candidateValue, current.value)) {
      records[key] = {
        value: candidateValue,
        holders: [{ holderId, leagueId }],
        previousHolders: current ? current.holders : null,
      };
    } else if (candidateValue === current.value && !current.holders.some((h) => h.holderId === holderId)) {
      current.holders.push({ holderId, leagueId });
    }
  }

  // Index rapide : pour chaque joueur, leagueId -> position dans sa timeline perso.
  const indexByPlayer = new Map();
  for (const [playerId, timeline] of timelineByPlayer.entries()) {
    indexByPlayer.set(playerId, new Map(timeline.map((t, i) => [t.leagueId, i])));
  }

  for (const league of orderedLeagues) {
    const stats = leagueStatsById.get(league.id);
    for (const r of stats.results) {
      maybeUpdate('sniper', r.points, r.player_id, league.id, (a, b) => a > b);
      maybeUpdate('naufrage', r.points, r.player_id, league.id, (a, b) => a < b);

      const timeline = timelineByPlayer.get(r.player_id);
      const idx = indexByPlayer.get(r.player_id).get(league.id);
      if (idx > 0) {
        const prev = timeline[idx - 1];
        const delta = prev.rank - r.rank; // positif = amélioration (remontée)
        if (delta > 0) maybeUpdate('phenix', delta, r.player_id, league.id, (a, b) => a > b);
        if (delta < 0) maybeUpdate('icare', -delta, r.player_id, league.id, (a, b) => a > b);
      }
    }
    if (stats.gapFirstSecond !== null) {
      maybeUpdate('fossoyeur', stats.gapFirstSecond, stats.firstPlayerId, league.id, (a, b) => a > b);
      maybeUpdate('photoFinish', stats.gapFirstSecond, stats.firstPlayerId, league.id, (a, b) => a < b);
    }
    if (stats.gapSecondLastLast !== null) {
      maybeUpdate('ko', stats.gapSecondLastLast, stats.lastPlayerId, league.id, (a, b) => a > b);
    }
    if (stats.firstPlayerId !== null) {
      maybeUpdate('dimanche', stats.firstPlayerPoints, stats.firstPlayerId, league.id, (a, b) => a < b);
    }
    if (stats.lastPlayerId !== null) {
      maybeUpdate('boulet', stats.lastPlayerPoints, stats.lastPlayerId, league.id, (a, b) => a > b);
    }
  }

  return records;
}

/** Standardise une métrique brute (Map playerId -> valeur|null) en z-score sur les joueurs éligibles. */
function standardize(rawByPlayer) {
  const eligible = [...rawByPlayer.entries()].filter(([, v]) => v !== null);
  const values = eligible.map(([, v]) => v);
  const m = mean(values);
  const sd = stdev(values);
  const zByPlayer = new Map();
  for (const [playerId, v] of rawByPlayer.entries()) {
    zByPlayer.set(playerId, v === null || sd === 0 ? -Infinity : (v - m) / sd);
  }
  return zByPlayer;
}

function computePoulidorCounts(players, results, leagueStatsById) {
  const winnerPoints = [];
  for (const stats of leagueStatsById.values()) {
    const winner = stats.results.find((r) => r.rank === 1);
    if (winner) winnerPoints.push(winner.points);
  }
  const seuil = percentile(winnerPoints, POULIDOR_PERCENTILE);
  const counts = new Map(players.map((p) => [p.id, 0]));
  for (const r of results) {
    if (r.rank === 2 && r.points >= seuil) {
      counts.set(r.player_id, (counts.get(r.player_id) || 0) + 1);
    }
  }
  return counts;
}

/** Badges signature 2-3 par joueur, sélectionnés par z-score le plus atypique. */
function computeSignatureBadges(players, results, timelineByPlayer, scoresByPlayerId, leagueStatsById) {
  const spoonsByPlayer = new Map();
  const starsByPlayer = new Map();
  for (const player of players) {
    const timeline = timelineByPlayer.get(player.id);
    spoonsByPlayer.set(player.id, timeline.filter((t) => t.rank === t.size).length);
    starsByPlayer.set(player.id, timeline.filter((t) => t.rank === 1).length);
  }

  const rawMetrics = {
    metronome: new Map(players.map((p) => [p.id, timelineByPlayer.get(p.id).filter((t) => t.rank <= 3).length])),
    abonne: new Map(players.map((p) => [p.id, spoonsByPlayer.get(p.id)])),
    yoyo: new Map(players.map((p) => [p.id, stdev(timelineByPlayer.get(p.id).map((t) => t.rank))])),
    remontada: new Map(players.map((p) => [p.id, maxRankDelta(timelineByPlayer.get(p.id), 1)])),
    crash: new Map(players.map((p) => [p.id, maxRankDelta(timelineByPlayer.get(p.id), -1)])),
    regne: new Map(players.map((p) => [p.id, longestStreak(timelineByPlayer.get(p.id), (t) => t.rank <= 3)])),
    chomage: new Map(players.map((p) => [p.id, longestStreak(timelineByPlayer.get(p.id), (t) => t.rank >= t.size - 1)])),
    portesRelegation: new Map(players.map((p) => [p.id, consecutiveBottomTwoPairs(timelineByPlayer.get(p.id))])),
    iceberg: new Map(players.map((p) => [p.id, longestIdenticalRankStreak(timelineByPlayer.get(p.id))])),
    participation: new Map(
      players.map((p) => {
        const score = scoresByPlayerId.get(p.id);
        return [p.id, score.nbLeagues >= SAMPLE_MALUS_THRESHOLD ? -score.scoreGlobal : null];
      })
    ),
  };

  const poulidorCounts = computePoulidorCounts(players, results, leagueStatsById);

  const labels = {
    metronome: { emoji: '👑', label: 'Le Métronome' },
    abonne: { emoji: '📉', label: "L'Abonné" },
    yoyo: { emoji: '🎢', label: 'Le Yoyo' },
    remontada: { emoji: '🚀', label: 'La Remontada' },
    crash: { emoji: '💀', label: 'Le Crash' },
    regne: { emoji: '🏰', label: 'Le Règne' },
    chomage: { emoji: '🕳️', label: 'Le Chômage Technique' },
    participation: { emoji: '🎗️', label: "L'important c'est de participer" },
    portesRelegation: { emoji: '🚪', label: 'Aux Portes de la Relégation' },
    iceberg: { emoji: '🧊', label: 'Iceberg' },
    poulidor: { emoji: '🥈', label: 'Poulidor' },
  };

  const zByBadgeByPlayer = new Map();
  for (const [key, rawByPlayer] of Object.entries(rawMetrics)) {
    zByBadgeByPlayer.set(key, standardize(rawByPlayer));
  }

  const badgesByPlayer = new Map();
  for (const player of players) {
    const candidates = [];
    for (const [key, zByPlayer] of zByBadgeByPlayer.entries()) {
      const z = zByPlayer.get(player.id);
      if (z > SIGNATURE_Z_THRESHOLD) candidates.push({ key, ...labels[key], z });
    }
    if (poulidorCounts.get(player.id) > 0) {
      candidates.push({ key: 'poulidor', ...labels.poulidor, z: Infinity });
    }
    candidates.sort((a, b) => b.z - a.z);
    const selected = candidates.slice(0, SIGNATURE_MAX_BADGES);
    badgesByPlayer.set(player.id, {
      stars: starsByPlayer.get(player.id),
      spoons: spoonsByPlayer.get(player.id),
      signature: selected.length > 0 ? selected.map(({ key, emoji, label }) => ({ key, emoji, label })) : [{ key: 'loyal', emoji: '🎈', label: 'Le Loyal' }],
    });
  }
  return badgesByPlayer;
}

function computeAll({ players, leagues, results }) {
  const leagueStatsById = computeLeagueStats(leagues, results);
  const leagueScoresByResultId = computeLeagueScores(leagueStatsById);
  const scores = computeScoresPerPlayer(players, results, leagueScoresByResultId);
  const scoresByPlayerId = new Map(scores.map((s) => [s.playerId, s]));
  const timelineByPlayer = computeChronologicalOrderPerPlayer(players, leagues, results);
  const hallOfFame = computeHallOfFame(leagues, leagueStatsById, timelineByPlayer);
  const badges = computeSignatureBadges(players, results, timelineByPlayer, scoresByPlayerId, leagueStatsById);

  const rankedScores = [...scores]
    .sort((a, b) => b.scoreGlobal - a.scoreGlobal)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const perLeagueStats = [...leagueStatsById.values()].map((s) => ({
    leagueId: s.league.id,
    mean: s.mean,
    stdev: s.stdev,
    gapFirstSecond: s.gapFirstSecond,
    gapSecondLastLast: s.gapSecondLastLast,
    firstPlayerId: s.firstPlayerId,
    lastPlayerId: s.lastPlayerId,
  }));

  return { scores: rankedScores, hallOfFame, badges, perLeagueStats };
}

/**
 * Rang all-time de chaque joueur après chaque ligue (dans l'ordre chronologique),
 * pour tracer l'évolution du classement. Le pool de joueurs à chaque étape ne
 * contient que ceux ayant déjà joué au moins une ligue jusque-là (sinon leur
 * malus d'échantillon pollue le rang des joueurs réellement actifs).
 */
function computeRankHistory({ players, leagues, results }) {
  const orderedLeagues = [...leagues].sort((a, b) => a.order_index - b.order_index);
  const dataByPlayer = new Map(players.map((p) => [p.id, []]));

  for (let i = 0; i < orderedLeagues.length; i++) {
    const subsetLeagues = orderedLeagues.slice(0, i + 1);
    const subsetLeagueIds = new Set(subsetLeagues.map((l) => l.id));
    const subsetResults = results.filter((r) => subsetLeagueIds.has(r.league_id));
    const activePlayerIds = new Set(subsetResults.map((r) => r.player_id));
    const activePlayers = players.filter((p) => activePlayerIds.has(p.id));

    const leagueStatsById = computeLeagueStats(subsetLeagues, subsetResults);
    const leagueScoresByResultId = computeLeagueScores(leagueStatsById);
    const scores = computeScoresPerPlayer(activePlayers, subsetResults, leagueScoresByResultId);
    const rankByPlayer = new Map(
      [...scores].sort((a, b) => b.scoreGlobal - a.scoreGlobal).map((s, idx) => [s.playerId, idx + 1])
    );

    for (const player of players) {
      dataByPlayer.get(player.id).push(rankByPlayer.has(player.id) ? rankByPlayer.get(player.id) : null);
    }
  }

  const allRanks = [...dataByPlayer.values()].flat().filter((v) => v !== null);

  return {
    leagues: orderedLeagues.map((l) => ({ id: l.id, name: l.name })),
    maxRank: allRanks.length > 0 ? Math.max(...allRanks) : 0,
    series: [...dataByPlayer.entries()].map(([playerId, data]) => ({ playerId, data })),
  };
}

module.exports = {
  computeAll,
  computeRankHistory,
  scoreRang,
  mean,
  stdev,
  percentile,
  Z_WEIGHT,
  SAMPLE_MALUS_THRESHOLD,
  SIGNATURE_Z_THRESHOLD,
  POULIDOR_PERCENTILE,
};
