const RANK_BADGE_COLORS = { 1: 'gold', 2: 'silver', 3: 'bronze' };

function avatarHtml(url, size, fallbackEmoji) {
  if (url) return `<img src="${url}" alt="" style="width:${size}px;height:${size}px;" />`;
  return `<div class="avatar-fallback" style="width:${size}px;height:${size}px;">${fallbackEmoji || '⚽'}</div>`;
}

async function renderPlayerStrip() {
  const players = await api.get('/api/players');
  const sorted = players.filter((p) => p.score).sort((a, b) => a.score.rank - b.score.rank);
  if (sorted.length === 0) return '';
  return `
    <div class="player-strip">
      ${sorted
        .map(
          (p) => `
        <a href="/joueurs.html?player=${p.id}">
          <span class="avatar-wrap">
            ${avatarHtml(p.avatar_url, 60)}
            ${
              RANK_BADGE_COLORS[p.score.rank]
                ? `<span class="rank-num-badge ${RANK_BADGE_COLORS[p.score.rank]}">${p.score.rank}</span>`
                : ''
            }
          </span>
          <div class="player-name">${p.name}</div>
        </a>`
        )
        .join('')}
    </div>`;
}

function renderLastLeagueCard(home) {
  if (!home || home.empty) {
    return `<div class="card"><p class="muted">Aucune ligue saisie pour l'instant. Direction le back-office !</p></div>`;
  }
  return `
    <div class="last-league-card">
      <div class="overline">Dernière ligue</div>
      <h2>${home.league.name}</h2>
      ${
        home.winner
          ? `<div class="winner-pill">
          ${avatarHtml(home.winner.avatar_url, 32)}
          <span>${home.winner.name}</span>
          <span>👑</span>
        </div>`
          : ''
      }
      ${
        home.highlights.length > 0
          ? `<ul class="highlight-list">${home.highlights.map((h) => `<li>${h}</li>`).join('')}</ul>`
          : ''
      }
    </div>`;
}

function ongoingLeagueCardHtml(ongoing) {
  if (!ongoing || ongoing.empty) return '';
  return `
    <div class="ongoing-league-card">
      <div class="overline">LIGUE EN COURS</div>
      <h2>${ongoing.name}</h2>
      <div class="hype-quotes">
        ${ongoing.hypeQuotes
          .map(
            (q) => `
          <div class="hype-quote">
            ${avatarHtml(q.playerAvatarUrl, 60)}
            <p><strong>${q.playerName || '?'}</strong> ${q.phrase}</p>
          </div>`
          )
          .join('')}
      </div>
      ${
        ongoing.endAt
          ? `<div class="countdown-block">
            <p class="overline">Réponse dans :</p>
            <div class="countdown-row" data-end-at="${ongoing.endAt}">
              <div class="countdown-pill"><span class="countdown-value" data-unit="days">–</span><span>jours</span></div>
              <div class="countdown-pill"><span class="countdown-value" data-unit="hours">–</span><span>heures</span></div>
              <div class="countdown-pill"><span class="countdown-value" data-unit="minutes">–</span><span>minutes</span></div>
            </div>
          </div>`
          : ''
      }
    </div>`;
}

function updateCountdowns() {
  document.querySelectorAll('.countdown-row').forEach((row) => {
    const endAt = Number(row.dataset.endAt) * 1000;
    const diff = Math.max(0, endAt - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    row.querySelector('[data-unit="days"]').textContent = days;
    row.querySelector('[data-unit="hours"]').textContent = hours;
    row.querySelector('[data-unit="minutes"]').textContent = minutes;
  });
}

(async function () {
  const content = document.getElementById('home-content');
  try {
    const [home, ongoing] = await Promise.all([api.get('/api/home'), api.get('/api/ongoing-league')]);
    const stripHtml = await renderPlayerStrip();
    content.innerHTML = `
      <h1 class="home-title">La Boucherie MPG</h1>
      ${stripHtml}
      ${ongoingLeagueCardHtml(ongoing)}
      ${renderLastLeagueCard(home)}
    `;
    updateCountdowns();
    setInterval(updateCountdowns, 60000);
  } catch (err) {
    content.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
})();
