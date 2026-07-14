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

function ordinal(n, suffixStyle) {
  if (n == null) return { main: 'X', suffix: '' };
  if (n === 1) return { main: '1', suffix: 'er' };
  return { main: String(n), suffix: suffixStyle === 'e' ? 'e' : 'ème' };
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function renderList() {
  const content = document.getElementById('page-content');
  try {
    const players = shuffle(await api.get('/api/players'));
    content.innerHTML = `
      <div class="container" style="padding-bottom:0;">
        <h1 class="page-title">Les copains</h1>
      </div>
      <div class="avatar-grid">
        ${players
          .map(
            (p) => `
          <a href="/joueurs.html?player=${p.id}">${avatarHtml(p.avatar_url)}</a>`
          )
          .join('')}
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
}

function profilPanelHtml(p) {
  const badges = p.badges || { stars: 0, spoons: 0, signature: [] };
  const score = p.score || { rank: null };
  const rankOrdinal = ordinal(score.rank, 'ème');
  return `
    <div class="profile-stats-row">
      <div class="stat-pill"><span class="stat-icon">⭐</span><span class="stat-label">${badges.stars} étoile${badges.stars > 1 ? 's' : ''}</span></div>
      <div class="stat-pill"><span class="stat-icon">🥄</span><span class="stat-label">${badges.spoons} cuillère${badges.spoons > 1 ? 's' : ''}</span></div>
      <div class="stat-pill"><span class="stat-icon" style="font-size:16px;">${rankOrdinal.main}<sup style="font-size:10px;">${rankOrdinal.suffix}</sup></span></div>
    </div>
    <h2 class="section-title" style="text-align:center;">Ses badges</h2>
    ${badges.signature
      .map(
        (b) => `
      <div class="badge-card">
        <h3 class="badge-name">${b.emoji} ${b.label}</h3>
        <p class="badge-description">${SIGNATURE_BADGE_DESCRIPTIONS[b.key] || ''}</p>
      </div>`
      )
      .join('')}
    <h2 class="section-title">C'est qui ce gars ?</h2>
    <p class="bio-text">${p.tagline || "Pas encore de bio — à ajouter en back-office."}</p>
  `;
}

function historiquePanelHtml(p) {
  const rows = (p.leagueHistory || [])
    .map((h) => {
      const o = ordinal(h.rank, 'e');
      return `
      <a href="/historique.html?league=${h.leagueId}" class="history-row">
        <span class="rank-badge-pill">${o.main}<span class="ordinal-suffix">${o.suffix}</span></span>
        <span class="history-league-name">${h.leagueName}</span>
        <span class="history-points">${h.points != null ? `${h.points} pts` : '- pts'}</span>
        <span class="chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></span>
      </a>`;
    })
    .join('');
  return `<div class="history-list">${rows || '<p class="muted">Aucune ligue enregistrée pour l\'instant.</p>'}</div>`;
}

async function renderProfile(id) {
  const content = document.getElementById('page-content');
  try {
    const p = await api.get(`/api/players/${id}`);
    window.MPG_DUEL_PRESELECT = p.id;

    content.innerHTML = `
      <div class="container">
        <div class="detail-header">
          <button type="button" class="back-arrow" id="back-btn" aria-label="Retour">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>
          </button>
          <h1 class="page-title">${p.name}</h1>
        </div>
        ${
          p.avatar_url
            ? `<img class="profile-avatar-big" src="${p.avatar_url}" alt="" />`
            : `<div class="profile-avatar-big avatar-fallback">⚽</div>`
        }
        <div class="tabs">
          <button type="button" class="tab-btn active" data-tab="profil">Profil</button>
          <button type="button" class="tab-btn" data-tab="historique">Historique</button>
        </div>
        <div data-panel="profil">${profilPanelHtml(p)}</div>
        <div data-panel="historique" style="display:none;">${historiquePanelHtml(p)}</div>
      </div>
    `;

    document.getElementById('back-btn').addEventListener('click', () => {
      window.location.href = '/joueurs.html';
    });

    content.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        content.querySelectorAll('[data-panel]').forEach((panel) => {
          panel.style.display = panel.dataset.panel === btn.dataset.tab ? '' : 'none';
        });
      });
    });
  } catch (err) {
    content.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
}

(function () {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get('player');
  if (playerId) renderProfile(playerId);
  else renderList();
})();
