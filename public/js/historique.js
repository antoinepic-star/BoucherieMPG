const TROPHY_ICON =
  '<svg viewBox="0 0 24 24" fill="white"><path d="M6 3h12v2a6 6 0 0 1-6 6 6 6 0 0 1-6-6V3z"/><path d="M6 4H3a3 3 0 0 0 3 5"/><path d="M18 4h3a3 3 0 0 1-3 5"/><rect x="10" y="11" width="4" height="4"/><rect x="7" y="18" width="10" height="2" rx="1"/></svg>';

const MEDAL_ICON =
  '<svg viewBox="0 0 24 24" fill="white"><path d="M8 2h8l-2.5 8h-3z"/><circle cx="12" cy="15" r="6.5"/></svg>';

function avatarHtml(url, fallbackEmoji) {
  if (url) return `<img src="${url}" alt="" />`;
  return `<div class="avatar-fallback">${fallbackEmoji || '⚽'}</div>`;
}

function leagueCardHtml(league) {
  const photo = league.photo_url ? `<img class="league-card-photo" src="${league.photo_url}" alt="" />` : '';
  return `
    <a href="/historique.html?league=${league.id}" class="league-card">
      ${photo}
      <div class="league-card-scrim"></div>
      ${
        league.winner
          ? `<div class="winner-chip">${avatarHtml(league.winner.avatarUrl)}<span>L'étoile pour ${league.winner.name}</span></div>`
          : ''
      }
      <div class="league-card-body">
        <p class="overline">${league.period_label || ''}</p>
        <h2 class="league-card-title">${league.name}</h2>
        ${
          league.highlights.length > 0
            ? `<ul class="league-highlights">${league.highlights.map((h) => `<li>${h}</li>`).join('')}</ul>`
            : ''
        }
      </div>
    </a>`;
}

async function renderList() {
  const content = document.getElementById('page-content');
  const leagues = await api.get('/api/leagues');
  if (leagues.length === 0) {
    content.innerHTML = `<h1 class="page-title">Revivre nos ligues</h1><p class="muted">Aucune ligue saisie pour l'instant.</p>`;
    return;
  }
  content.innerHTML = `<h1 class="page-title">Revivre nos ligues</h1>${leagues.map(leagueCardHtml).join('')}`;
}

function podiumBlockHtml(result, place) {
  if (!result) return '';
  const icon = place === 'first' ? TROPHY_ICON : MEDAL_ICON;
  const rankNumber = place === 'first' ? '' : `<span class="medal-number">${result.rank}</span>`;
  return `
    <div class="podium-block ${place}">
      <div class="podium-icon" style="position:relative;">${icon}${rankNumber}</div>
      <p class="podium-points">${result.points}</p>
      <p class="podium-points-label">points</p>
    </div>`;
}

function classementPanelHtml(league) {
  const sorted = [...league.results].sort((a, b) => a.rank - b.rank);
  const [first, second, third, ...rest] = sorted;
  return `
    <div class="podium-avatars">
      ${
        second
          ? `<div class="podium-avatar">${avatarHtml(second.playerAvatarUrl)}<div class="name">${second.playerName}</div></div>`
          : ''
      }
      ${
        first
          ? `<div class="podium-avatar first">${avatarHtml(first.playerAvatarUrl)}<div class="name">${first.playerName}</div></div>`
          : ''
      }
      ${
        third
          ? `<div class="podium-avatar">${avatarHtml(third.playerAvatarUrl)}<div class="name">${third.playerName}</div></div>`
          : ''
      }
    </div>
    <div class="podium-blocks">
      ${podiumBlockHtml(second, 'second')}
      ${podiumBlockHtml(first, 'first')}
      ${podiumBlockHtml(third, 'third')}
    </div>
    <div class="rank-list">
      ${rest
        .map(
          (r) => `
        <div class="rank-row">
          <span class="rank-name">${r.rank}. ${r.playerName}</span>
          <span>${r.points} points</span>
        </div>`
        )
        .join('')}
    </div>`;
}

function storyPanelHtml(league) {
  if (!league.story_title && !league.story_text) {
    return `<p class="muted">Pas encore de story pour cette ligue.</p>`;
  }
  return `
    ${league.story_title ? `<h2 class="story-title">${league.story_title}</h2>` : ''}
    ${league.story_text ? `<p class="story-text">${league.story_text}</p>` : ''}`;
}

async function renderDetail(leagueId) {
  const content = document.getElementById('page-content');
  const leagues = await api.get('/api/leagues');
  const league = leagues.find((l) => l.id === leagueId);
  if (!league) {
    content.innerHTML = `<p class="error-msg">Ligue introuvable.</p>`;
    return;
  }

  content.innerHTML = `
    <div class="detail-header">
      <button type="button" class="back-arrow" id="back-btn" aria-label="Retour">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>
      </button>
      <h1 class="page-title">${league.name}</h1>
    </div>
    <div class="tabs">
      <button type="button" class="tab-btn active" data-tab="story">Story</button>
      <button type="button" class="tab-btn" data-tab="classement">Classement</button>
    </div>
    <div class="story-panel" data-panel="story">${storyPanelHtml(league)}</div>
    <div data-panel="classement" style="display:none;">${classementPanelHtml(league)}</div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = '/historique.html';
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
}

(function init() {
  const params = new URLSearchParams(window.location.search);
  const leagueId = params.get('league');
  if (leagueId) renderDetail(leagueId);
  else renderList();
})();
