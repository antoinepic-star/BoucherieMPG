// Génère le texte des faits marquants de l'accueil — seul endroit qui formule ces phrases.

const HOF_META = {
  sniper: { emoji: '🧲', label: 'Le Sniper' },
  naufrage: { emoji: '🪦', label: 'Le Naufrage' },
  fossoyeur: { emoji: '💥', label: 'Le Fossoyeur' },
  photoFinish: { emoji: '🤏', label: 'Le Photo-Finish' },
  ko: { emoji: '🩸', label: 'Le K.O.' },
};

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
    if (record && record.sinceLeagueId === lastLeague.id) {
      const holder = playerById.get(record.holderId);
      const meta = HOF_META[key];
      if (record.previousHolderId) {
        const prev = playerById.get(record.previousHolderId);
        highlights.push(`${meta.emoji} Nouveau détenteur du badge ${meta.label} : ${holder.name} (piqué à ${prev.name}) !`);
      } else {
        highlights.push(`${meta.emoji} ${holder.name} inaugure le badge ${meta.label} !`);
      }
    }
  }

  if (leagueStat && leagueStat.gapFirstSecond != null) {
    highlights.push(`📏 Écart de ${leagueStat.gapFirstSecond.toFixed(1)} points entre le 1er et le 2e.`);
  }
  if (leagueStat && leagueStat.gapSecondLastLast != null) {
    highlights.push(`🥄 Écart de ${leagueStat.gapSecondLastLast.toFixed(1)} points entre l'avant-dernier et le dernier.`);
  }

  return {
    league: { id: lastLeague.id, name: lastLeague.name, periodLabel: lastLeague.period_label, size: lastLeague.size },
    winner: winner ? { id: winner.id, name: winner.name, avatar_url: winner.avatar_url } : null,
    highlights,
  };
}

module.exports = { buildHomeHighlights, HOF_META };
