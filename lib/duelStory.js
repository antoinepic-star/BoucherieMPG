// Génère le texte narratif du duel — seul endroit qui formule ces phrases.

const { HOF_META, formatPoints } = require('./highlights');

const HOF_VALUE_PHRASE = {
  sniper: (v) => `${formatPoints(v)} points sur une ligue`,
  naufrage: (v) => `seulement ${formatPoints(v)} points sur une ligue`,
  fossoyeur: (v) => `${formatPoints(v)} points d'écart avec le 2e`,
  photoFinish: (v) => `${formatPoints(v)} point${v === 1 ? '' : 's'} d'écart avec le 2e`,
  ko: (v) => `${formatPoints(v)} points d'écart avec l'avant-dernier`,
};

function buildDuelStory({ p1, p2, confrontations, hofNotes }) {
  const beats = [];

  // Expérience / bouteille
  const n1 = p1.score ? p1.score.nbLeagues : 0;
  const n2 = p2.score ? p2.score.nbLeagues : 0;
  if (Math.abs(n1 - n2) >= 8) {
    const vet = n1 > n2 ? p1 : p2;
    const rookie = n1 > n2 ? p2 : p1;
    const vetN = Math.max(n1, n2);
    const rookieN = Math.min(n1, n2);
    beats.push(
      `${vet.name} traîne ses crampons depuis ${vetN} ligues, quand ${rookie.name} découvre encore les lieux avec seulement ${rookieN} au compteur.`
    );
  } else {
    beats.push(`${p1.name} et ${p2.name} ont à peu près la même bouteille (${n1} contre ${n2} ligues) — aucune excuse pour perdre.`);
  }

  // Ambiance des confrontations directes (sans redire le score, déjà affiché plus haut)
  if (confrontations.length === 0) {
    beats.push(`Seul souci : ces deux-là ne se sont jamais retrouvés dans la même ligue — un classique qui n'a jamais eu lieu.`);
  } else {
    const p1Wins = confrontations.filter((c) => c.winner === p1.id).length;
    const p2Wins = confrontations.filter((c) => c.winner === p2.id).length;
    const total = confrontations.length;
    const maxWins = Math.max(p1Wins, p2Wins);
    const minWins = Math.min(p1Wins, p2Wins);
    if (total >= 2 && maxWins >= 2 * Math.max(minWins, 1) && maxWins > minWins) {
      beats.push(`Et quand ils se croisent, c'est souvent à sens unique.`);
    } else if (total >= 2 && Math.abs(p1Wins - p2Wins) <= 1) {
      beats.push(`Et à chaque confrontation directe, c'est un vrai coup de poker.`);
    }
  }

  // Statut provisoire
  const provisionalNames = [p1, p2].filter((p) => p.score && p.score.provisional).map((p) => p.name);
  if (provisionalNames.length > 0) {
    beats.push(
      `(Petite précision : le classement de ${provisionalNames.join(' et ')} est encore provisoire — moins de 5 ligues au compteur, on validera tout ça dans quelques mois.)`
    );
  }

  // Extrêmes des confrontations partagées
  if (confrontations.length >= 1) {
    const nameOf = (id) => (id === p1.id ? p1.name : p2.name);
    const withGap = confrontations.map((c) => ({ ...c, gap: Math.abs(c.p1Rank - c.p2Rank) }));
    const sorted = [...withGap].sort((a, b) => b.gap - a.gap);
    const biggest = sorted[0];
    const closest = sorted[sorted.length - 1];

    if (confrontations.length === 1) {
      if (biggest.gap === 0) {
        beats.push(`Sur le terrain, leur unique face-à-face (à "${biggest.leagueName}") s'est joué à égalité parfaite au classement.`);
      } else {
        beats.push(
          `Sur le terrain, leur unique face-à-face remonte à "${biggest.leagueName}", où ${nameOf(biggest.winner)} a fini ${biggest.gap} place${
            biggest.gap > 1 ? 's' : ''
          } devant ${nameOf(biggest.winner === p1.id ? p2.id : p1.id)}.`
        );
      }
    } else if (biggest.gap === closest.gap) {
      beats.push(`Sur le terrain, l'écart entre eux est resté d'une régularité troublante : toujours ${biggest.gap} place${biggest.gap > 1 ? 's' : ''} d'écart.`);
    } else {
      beats.push(
        `Sur le terrain, leur duel le plus fou reste "${biggest.leagueName}", où ${nameOf(biggest.winner)} a filé ${biggest.gap} places devant ${nameOf(
          biggest.winner === p1.id ? p2.id : p1.id
        )}. À l'inverse, à "${closest.leagueName}", ${
          closest.gap === 0 ? 'ils ont fini à égalité' : `seulement ${closest.gap} place${closest.gap > 1 ? 's' : ''} les séparait`
        } — un vrai mouchoir de poche.`
      );
    }
  }

  // Hall of Fame
  if (hofNotes.length > 0) {
    const byHolder = new Map();
    hofNotes.forEach((n) => {
      if (!byHolder.has(n.holderName)) byHolder.set(n.holderName, []);
      byHolder.get(n.holderName).push(n);
    });
    const notesText = [...byHolder.entries()]
      .map(([holderName, notes]) => {
        const badgesText = notes
          .map((n) => {
            const meta = HOF_META[n.key];
            const phrase = HOF_VALUE_PHRASE[n.key] ? HOF_VALUE_PHRASE[n.key](n.value) : formatPoints(n.value);
            return `${meta.label} (${phrase}, depuis "${n.leagueName}")`;
          })
          .join(' et ');
        return notes.length > 1
          ? `${holderName} trône au Hall of Fame avec pas moins de ${notes.length} badges : ${badgesText}`
          : `${holderName} trône au Hall of Fame avec le badge ${badgesText}`;
      })
      .join(' ; ');
    beats.push(`Et n'oublions pas : ${notesText}.`);
  } else {
    beats.push(`Aucun des deux ne squatte encore le Hall of Fame — de la marge pour rentrer dans l'Histoire.`);
  }

  return beats.join(' ');
}

module.exports = { buildDuelStory };
