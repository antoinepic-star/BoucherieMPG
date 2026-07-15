function avatarHtml(url, fallbackEmoji) {
  if (url) return `<img src="${url}" alt="" />`;
  return `<div class="avatar-fallback">${fallbackEmoji || '⚽'}</div>`;
}

function duelResultHtml(duel) {
  const gap = duel.scoreGap != null ? duel.scoreGap.toFixed(2).replace('.', ',') : '—';
  return `
    <div class="duel-vs-row">
      <div class="duel-avatar">
        ${avatarHtml(duel.player1.avatarUrl)}
        <div class="duel-avatar-name">${duel.player1.name}</div>
      </div>
      <div class="duel-vs-label">VS</div>
      <div class="duel-avatar">
        ${avatarHtml(duel.player2.avatarUrl)}
        <div class="duel-avatar-name">${duel.player2.name}</div>
      </div>
    </div>
    <div class="profile-stats-row">
      <div class="stat-pill"><span class="stat-label">${duel.p1Wins} — ${duel.p2Wins}</span></div>
      <div class="stat-pill"><span class="stat-label">Écart : ${gap}</span></div>
    </div>
    ${
      duel.confrontations.length === 0
        ? `<p class="muted" style="text-align:center;">Ces deux joueurs n'ont jamais partagé de ligue.</p>`
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
