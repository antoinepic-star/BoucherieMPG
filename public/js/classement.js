function avatarHtml(url, fallbackEmoji) {
  if (url) return `<img src="${url}" alt="" />`;
  return `<div class="avatar-fallback">${fallbackEmoji || '⚽'}</div>`;
}

function formatScore(v) {
  const rounded = Math.round(v * 10) / 10;
  return (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)).replace('.', ',');
}

function ordinal(n) {
  if (n === 1) return { main: '1', suffix: 'er' };
  return { main: String(n), suffix: 'e' };
}

function podiumSlotHtml(entry, place) {
  if (!entry) return '';
  return `
    <div class="podium-slot ${place}">
      <div class="podium-avatar-wrap">
        <div class="podium-avatar-ring ${place}">
          ${avatarHtml(entry.avatarUrl)}
        </div>
        <span class="podium-rank-badge ${place}">${entry.rank}</span>
      </div>
      <div class="podium-pill">
        <span>${entry.name}</span>
        <span>${formatScore(entry.scoreGlobal)}</span>
      </div>
    </div>`;
}

function classementPanelHtml(rankings) {
  const [first, second, third, ...rest] = rankings;
  return `
    <div class="podium-top">${podiumSlotHtml(first, 'first')}</div>
    <div class="podium-runners">
      ${podiumSlotHtml(second, 'second')}
      ${podiumSlotHtml(third, 'third')}
    </div>
    <div class="rank-list-full">
      ${rest
        .map((r) => {
          const o = ordinal(r.rank);
          return `
        <div class="rank-row-full">
          <span class="rank-badge-pill">${o.main}<span class="ordinal-suffix">${o.suffix}</span></span>
          <span class="rank-row-name">${r.name}${r.provisional ? `<span class="badge-provisional">⏳ ${r.nbLeagues}/5</span>` : ''}</span>
          <span class="rank-row-score">${formatScore(r.scoreGlobal)}</span>
          <span class="rank-row-avatar">${avatarHtml(r.avatarUrl)}</span>
        </div>`;
        })
        .join('')}
    </div>`;
}

// --- Onglet Étoiles ---

function etoilesRowHtml(p, rank) {
  const badges = p.badges || { stars: 0, spoons: 0 };
  const o = ordinal(rank);
  return `
    <div class="etoiles-row">
      <div class="etoiles-left">
        <span class="rank-badge-pill">${o.main}<span class="ordinal-suffix">${o.suffix}</span></span>
        <span class="etoiles-name">${p.name}</span>
      </div>
      <div class="etoiles-right">
        <span class="etoiles-stars">${badges.stars}</span>
        <span class="etoiles-spoons">${badges.spoons}</span>
        ${avatarHtml(p.avatar_url)}
      </div>
    </div>`;
}

function etoilesPanelHtml(players) {
  const sorted = [...players].sort((a, b) => {
    const byStars = (b.badges?.stars || 0) - (a.badges?.stars || 0);
    if (byStars !== 0) return byStars;
    return (a.badges?.spoons || 0) - (b.badges?.spoons || 0);
  });
  return `
    <div class="etoiles-list">${sorted.map((p, i) => etoilesRowHtml(p, i + 1)).join('')}</div>
    <p class="muted" style="margin-top:16px;">Le chiffre en gras, c'est le nombre d'étoiles. Celui en gris, le nombre de cuillères. En cas d'égalité aux étoiles, celui qui a le moins de cuillères passe devant.</p>`;
}

async function renderEtoilesPanel(container) {
  container.innerHTML = `<p class="muted">Chargement…</p>`;
  try {
    const players = await api.get('/api/players');
    container.innerHTML = players.length === 0 ? `<p class="muted">Aucun joueur pour l'instant.</p>` : etoilesPanelHtml(players);
  } catch (err) {
    container.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
}

// --- Graphique d'évolution du classement all-time ---

const CHART_ROW_HEIGHT = 28;
const CHART_COL_WIDTH = 70;
const CHART_PAD_TOP = 20;
const CHART_PAD_SIDE = 30;
const CHART_LABELS_HEIGHT = 60;
const CHART_AVATAR_R = 13;

function playerColor(index, total) {
  const hue = Math.round((360 * index) / Math.max(1, total));
  return `hsl(${hue}, 62%, 48%)`;
}

function chartX(i) {
  return CHART_PAD_SIDE + i * CHART_COL_WIDTH;
}

function chartY(rank) {
  return CHART_PAD_TOP + (rank - 1) * CHART_ROW_HEIGHT;
}

function rankAxisHtml(maxRank) {
  const rows = [];
  for (let rank = 1; rank <= maxRank; rank++) {
    const o = ordinal(rank);
    rows.push(`<div class="rank-axis-label" style="top:${chartY(rank) - 9}px;">${o.main}<span class="ordinal-suffix">${o.suffix}</span></div>`);
  }
  return rows.join('');
}

function avatarClipSvg(id, url, fallbackColor) {
  if (url) {
    return `
      <clipPath id="${id}"><circle r="${CHART_AVATAR_R}" /></clipPath>
      <image href="${url}" x="${-CHART_AVATAR_R}" y="${-CHART_AVATAR_R}" width="${CHART_AVATAR_R * 2}" height="${CHART_AVATAR_R * 2}" clip-path="url(#${id})" />`;
  }
  return `<circle r="${CHART_AVATAR_R}" fill="${fallbackColor}" /><text text-anchor="middle" dominant-baseline="central" font-size="14">⚽</text>`;
}

function rankChartSvg(history) {
  const { leagues, series, maxRank } = history;
  const width = CHART_PAD_SIDE * 2 + Math.max(0, leagues.length - 1) * CHART_COL_WIDTH;
  const height = CHART_PAD_TOP * 2 + Math.max(1, maxRank - 1) * CHART_ROW_HEIGHT;

  const lines = series
    .map((s, idx) => {
      const color = playerColor(idx, series.length);
      const firstIndex = s.data.findIndex((v) => v !== null);
      if (firstIndex === -1) return '';
      const points = s.data
        .map((rank, i) => (rank !== null ? `${chartX(i)},${chartY(rank)}` : null))
        .filter(Boolean)
        .join(' ');
      const dots = s.data
        .map((rank, i) => (rank !== null ? `<circle cx="${chartX(i)}" cy="${chartY(rank)}" r="3.5" fill="${color}" />` : ''))
        .join('');
      const lastIndex = s.data.length - 1;
      const lastRank = s.data[lastIndex];
      const clipId = `avatar-clip-${s.playerId}`;
      const avatarMarker =
        lastRank !== null
          ? `<g transform="translate(${chartX(lastIndex)},${chartY(lastRank)})">
              <circle r="${CHART_AVATAR_R + 2}" fill="#fff" stroke="${color}" stroke-width="2.5" />
              ${avatarClipSvg(clipId, s.avatarUrl, color)}
            </g>`
          : '';
      return `<g>
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
        ${dots}
        ${avatarMarker}
      </g>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${width + CHART_PAD_SIDE} ${height}" width="${width + CHART_PAD_SIDE}" height="${height}">${lines}</svg>`;
}

function chartLeagueLabelsHtml(leagues) {
  const width = CHART_PAD_SIDE * 2 + Math.max(0, leagues.length - 1) * CHART_COL_WIDTH + CHART_PAD_SIDE;
  return `
    <div style="position:relative;width:${width}px;height:${CHART_LABELS_HEIGHT}px;">
      ${leagues
        .map(
          (l, i) => `
        <div class="chart-league-label" style="left:${chartX(i)}px;">${l.name}</div>`
        )
        .join('')}
    </div>`;
}

async function renderHistoriquePanel(container) {
  container.innerHTML = `<p class="muted">Chargement…</p>`;
  try {
    const history = await api.get('/api/rankings-history');
    if (history.series.length === 0 || history.leagues.length === 0) {
      container.innerHTML = `<p class="muted">Pas encore assez de données pour tracer l'évolution du classement.</p>`;
      return;
    }
    container.innerHTML = `
      <div class="rank-chart">
        <div class="rank-chart-axis" style="height:${CHART_PAD_TOP * 2 + Math.max(1, history.maxRank - 1) * CHART_ROW_HEIGHT}px;">
          ${rankAxisHtml(history.maxRank)}
        </div>
        <div class="rank-chart-scroll">
          ${rankChartSvg(history)}
          ${chartLeagueLabelsHtml(history.leagues)}
        </div>
      </div>
    `;
    const scrollEl = container.querySelector('.rank-chart-scroll');
    scrollEl.scrollLeft = scrollEl.scrollWidth;
  } catch (err) {
    container.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
}

(async function () {
  const content = document.getElementById('page-content');
  try {
    const rankings = await api.get('/api/rankings');
    content.innerHTML = `
      <h1 class="page-title">Classement all time</h1>
      <div class="tabs">
        <button type="button" class="tab-btn active" data-tab="classement">Classement</button>
        <button type="button" class="tab-btn" data-tab="historique">Historique</button>
        <button type="button" class="tab-btn" data-tab="etoiles">Étoiles</button>
      </div>
      <div data-panel="classement">${
        rankings.length === 0
          ? `<p class="muted">Aucune ligue saisie pour l'instant.</p>`
          : `${classementPanelHtml(rankings)}<a class="algo-link-btn" href="/transparence.html">Comment marche l'algo ?</a>`
      }</div>
      <div data-panel="historique" style="display:none;"></div>
      <div data-panel="etoiles" style="display:none;"></div>
    `;

    let historiqueLoaded = false;
    let etoilesLoaded = false;
    content.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        content.querySelectorAll('[data-panel]').forEach((panel) => {
          panel.style.display = panel.dataset.panel === btn.dataset.tab ? '' : 'none';
        });
        if (btn.dataset.tab === 'historique' && !historiqueLoaded) {
          historiqueLoaded = true;
          renderHistoriquePanel(content.querySelector('[data-panel="historique"]'));
        }
        if (btn.dataset.tab === 'etoiles' && !etoilesLoaded) {
          etoilesLoaded = true;
          renderEtoilesPanel(content.querySelector('[data-panel="etoiles"]'));
        }
      });
    });
  } catch (err) {
    content.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
})();
