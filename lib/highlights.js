// Génère le texte des faits marquants de l'accueil — seul endroit qui formule ces phrases.

const HOF_META = {
  sniper: { emoji: '🧲', label: 'Le Sniper' },
  naufrage: { emoji: '🪦', label: 'Le Naufrage' },
  fossoyeur: { emoji: '💥', label: 'Le Fossoyeur' },
  photoFinish: { emoji: '🤏', label: 'Le Photo-Finish' },
  ko: { emoji: '🩸', label: 'Le K.O.' },
  dimanche: { emoji: '😅', label: 'Le Vainqueur du Dimanche' },
  boulet: { emoji: '⛓️', label: 'Le Boulet Doré' },
  phenix: { emoji: '🔥', label: 'Le Phénix' },
  icare: { emoji: '☄️', label: "La Chute d'Icare" },
  grandEcart: { emoji: '🦵', label: 'Le Grand Écart' },
  peloton: { emoji: '🚴', label: 'Le Peloton' },
};

function formatPoints(v) {
  const rounded = Math.round(v * 10) / 10;
  return (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)).replace('.', ',');
}

function buildHomeHighlights({ leagues, results, computed, players }) {
  if (leagues.length === 0) return null;
  const lastLeague = [...leagues].sort((a, b) => b.order_index - a.order_index)[0];
  const playerById = new Map(players.map((p) => [p.id, p]));
  const leagueResults = results.filter((r) => r.league_id === lastLeague.id).sort((a, b) => a.rank - b.rank);
  const winnerResult = leagueResults.find((r) => r.rank === 1);
  const winner = winnerResult ? playerById.get(winnerResult.player_id) : null;

  const highlights = [];
  const leagueStat = computed.perLeagueStats.find((s) => s.leagueId === lastLeague.id);

  for (const [key, record] of Object.entries(computed.hallOfFame)) {
    if (!record) continue;
    const newHere = record.holders.filter((h) => h.leagueId === lastLeague.id);
    if (newHere.length === 0) continue;
    const meta = HOF_META[key];
    const names = newHere.map((h) => playerById.get(h.holderId)?.name).filter(Boolean).join(' et ');
    const isOutrightNew = record.previousHolders !== null && record.holders.length === newHere.length;
    if (isOutrightNew && record.previousHolders.length > 0) {
      const prevNames = record.previousHolders.map((h) => playerById.get(h.holderId)?.name).filter(Boolean).join(' et ');
      highlights.push(`${meta.emoji} Nouveau détenteur du badge ${meta.label} : ${names} (piqué à ${prevNames}) !`);
    } else if (record.holders.length > newHere.length) {
      highlights.push(`${meta.emoji} ${names} égalise le record du badge ${meta.label} !`);
    } else {
      highlights.push(`${meta.emoji} ${names} inaugure le badge ${meta.label} !`);
    }
  }

  const first = leagueResults[0];
  const second = leagueResults[1];
  const secondLast = leagueResults[leagueResults.length - 2];
  const last = leagueResults[leagueResults.length - 1];

  if (leagueStat && leagueStat.gapFirstSecond != null && first && second) {
    const firstName = playerById.get(first.player_id)?.name;
    const secondName = playerById.get(second.player_id)?.name;
    const gap = Math.abs(leagueStat.gapFirstSecond);
    const flavor = gap <= 2 ? ' — jouée à un cheveu' : gap >= 8 ? ' — la loi du plus fort' : '';
    highlights.push(`📏 ${firstName} devance ${secondName} de ${formatPoints(gap)} points${flavor}.`);
  }
  if (leagueStat && leagueStat.gapSecondLastLast != null && secondLast && last) {
    const secondLastName = playerById.get(secondLast.player_id)?.name;
    const lastName = playerById.get(last.player_id)?.name;
    const gap = Math.abs(leagueStat.gapSecondLastLast);
    const flavor = gap <= 2 ? ' — ça s\'est joué à rien' : gap >= 8 ? ', la sanction est sévère' : '';
    highlights.push(`🥄 ${lastName} termine dernier, ${formatPoints(gap)} points derrière ${secondLastName}${flavor}.`);
  }

  return {
    league: { id: lastLeague.id, name: lastLeague.name, periodLabel: lastLeague.period_label, size: lastLeague.size },
    winner: winner ? { id: winner.id, name: winner.name, avatar_url: winner.avatar_url } : null,
    highlights,
  };
}

module.exports = { buildHomeHighlights, HOF_META, formatPoints };
