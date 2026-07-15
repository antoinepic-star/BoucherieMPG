const SIGNATURE_BADGE_DESCRIPTIONS = {
  metronome: 'Cumul de podiums impressionnant — la régularité incarnée.',
  abonne: 'Abonné aux cuillères en bois.',
  yoyo: "Classement en dents de scie — imprévisible d'une ligue à l'autre.",
  remontada: "La plus grosse remontée au classement d'une ligue à la suivante.",
  crash: "La plus grosse chute au classement d'une ligue à la suivante.",
  regne: 'La plus longue série consécutive dans le top 3.',
  chomage: 'La plus longue série consécutive dans les deux dernières places.',
  participation: "Pire score moyen all-time — mais il est là, et c'est ce qui compte.",
  portesRelegation: 'Deux dernières places, deux saisons de suite.',
  iceberg: 'Le même rang trois saisons de suite, imperturbable.',
  poulidor: "Deuxième avec un score qui aurait gagné ailleurs — la poisse incarnée.",
  loyal: "Badge par défaut : solide, mais pas (encore) atypique.",
};

function avatarHtml(url, fallbackEmoji) {
  if (url) return `<img src="${url}" alt="" />`;
  return `<div class="avatar-fallback">${fallbackEmoji || '⚽'}</div>`;
}

function formatPoints(v) {
  const rounded = Math.round(v * 10) / 10;
  return (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)).replace('.', ',');
}

function headlineHtml(duel) {
  if (duel.confrontations.length === 0) {
    return `${duel.player1.name} et ${duel.player2.name} ne se sont jamais affrontés`;
  }
  if (duel.p1Wins === duel.p2Wins) {
    return `Égalité parfaite : ${duel.p1Wins} — ${duel.p2Wins}`;
  }
  const leader = duel.p1Wins > duel.p2Wins ? duel.player1 : duel.player2;
  const leaderWins = Math.max(duel.p1Wins, duel.p2Wins);
  const loserWins = Math.min(duel.p1Wins, duel.p2Wins);
  return `${leader.name} mène ${leaderWins} — ${loserWins}`;
}

function badgesColumnHtml(player) {
  const signature = (player.badges && player.badges.signature) || [];
  return `
    <div class="duel-badges-col">
      <p class="duel-badges-name">${player.name}</p>
      ${signature
        .map(
          (b) => `
        <div class="badge-card">
          <h3 class="badge-name">${b.emoji} ${b.label}</h3>
          <p class="badge-description">${SIGNATURE_BADGE_DESCRIPTIONS[b.key] || ''}</p>
        </div>`
        )
        .join('')}
    </div>`;
}

function statsRowHtml(label, v1, v2) {
  const winner1 = v1 != null && (v2 == null || v1 > v2);
  const winner2 = v2 != null && (v1 == null || v2 > v1);
  return `
    <div class="duel-stats-row">
      <span class="duel-stats-label">${label}</span>
      <span class="duel-stats-value ${winner1 ? 'winner' : ''}">${v1 != null ? `${formatPoints(v1)} pts` : '—'}</span>
      <span class="duel-stats-value ${winner2 ? 'winner' : ''}">${v2 != null ? `${formatPoints(v2)} pts` : '—'}</span>
    </div>`;
}

function duelResultHtml(duel) {
  const s1 = duel.stats.player1;
  const s2 = duel.stats.player2;
  return `
    <div class="duel-vs-row">
      <div class="duel-avatar">
        ${avatarHtml(duel.player1.avatarUrl)}
        <div class="duel-avatar-name">${duel.player1.name}</div>
        <div class="duel-tags">
          <span class="duel-tag">⭐ ${(duel.player1.badges && duel.player1.badges.stars) || 0}</span>
          <span class="duel-tag">🥄 ${(duel.player1.badges && duel.player1.badges.spoons) || 0}</span>
        </div>
      </div>
      <div class="duel-vs-label">VS</div>
      <div class="duel-avatar">
        ${avatarHtml(duel.player2.avatarUrl)}
        <div class="duel-avatar-name">${duel.player2.name}</div>
        <div class="duel-tags">
          <span class="duel-tag">⭐ ${(duel.player2.badges && duel.player2.badges.stars) || 0}</span>
          <span class="duel-tag">🥄 ${(duel.player2.badges && duel.player2.badges.spoons) || 0}</span>
        </div>
      </div>
    </div>
    <h2 class="duel-headline">${headlineHtml(duel)}</h2>
    <p class="story-text">${duel.story}</p>

    <h2 class="section-title">Le duel des badges</h2>
    <div class="duel-badges-columns">
      ${badgesColumnHtml(duel.player1)}
      ${badgesColumnHtml(duel.player2)}
    </div>

    ${
      s1 || s2
        ? `<h2 class="section-title">Leurs records perso</h2>
    <div class="duel-stats-compare">
      <div class="duel-stats-header"><span></span><span>${duel.player1.name}</span><span>${duel.player2.name}</span></div>
      ${statsRowHtml('Meilleur score', s1 && s1.best, s2 && s2.best)}
      ${statsRowHtml('Pire score', s1 && s1.worst, s2 && s2.worst)}
      ${statsRowHtml('Moyenne', s1 && s1.avg, s2 && s2.avg)}
    </div>`
        : ''
    }

    <h2 class="section-title">Confrontations ligue par ligue</h2>
    ${
      duel.confrontations.length === 0
        ? `<p class="muted">Ces deux joueurs n'ont jamais partagé de ligue.</p>`
        : `<div class="duel-confrontations">
            ${duel.confrontations
              .map(
                (c) => `
              <div class="duel-confrontation-row">
                <span class="duel-confrontation-league">${c.leagueName}</span>
                <span class="duel-confrontation-score">${c.p1Rank}${c.winner === duel.player1.id ? ' 🏅' : ''}</span>
                <span class="duel-confrontation-score">${c.p2Rank}${c.winner === duel.player2.id ? ' 🏅' : ''}</span>
              </div>`
              )
              .join('')}
          </div>`
    }
  `;
}

async function renderDuel(id1, id2) {
  const content = document.getElementById('page-content');
  const headerHtml = `
    <div class="detail-header">
      <button type="button" class="back-arrow" id="back-btn" aria-label="Retour">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>
      </button>
      <h1 class="page-title">Le duel</h1>
    </div>`;

  if (!id1 || !id2 || id1 === id2) {
    content.innerHTML = `${headerHtml}<p class="error-msg">Choisis deux joueurs différents depuis la page Les copains.</p>`;
  } else {
    try {
      const duel = await api.get(`/api/players/${id1}/duel/${id2}`);
      content.innerHTML = `${headerHtml}${duelResultHtml(duel)}`;
    } catch (err) {
      content.innerHTML = `${headerHtml}<p class="error-msg">${err.message}</p>`;
    }
  }

  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = '/joueurs.html';
  });
}

(function init() {
  const params = new URLSearchParams(window.location.search);
  renderDuel(params.get('p1'), params.get('p2'));
})();
