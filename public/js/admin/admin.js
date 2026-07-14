let cachedPlayers = [];

function playerOptionsHtml(selectedId) {
  return cachedPlayers
    .map((p) => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name}</option>`)
    .join('');
}

function addLeagueRow(prefill) {
  const rows = document.getElementById('league-rows');
  const row = document.createElement('div');
  row.className = 'league-result-row';
  row.innerHTML = `
    <select class="row-player">${playerOptionsHtml(prefill && prefill.player_id)}</select>
    <input type="number" class="row-rank" min="1" value="${prefill && prefill.rank != null ? prefill.rank : ''}" required />
    <input type="number" step="0.01" class="row-points" value="${prefill && prefill.points != null ? prefill.points : ''}" required />
    <button type="button" class="btn btn-secondary remove-row-btn">✕</button>
  `;
  row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
  rows.appendChild(row);
}

function fillRowsWithAllPlayers() {
  document.getElementById('league-rows').innerHTML = '';
  cachedPlayers.forEach((p) => addLeagueRow({ player_id: p.id }));
}

function readLeagueRows() {
  return [...document.querySelectorAll('#league-rows .league-result-row')].map((row) => ({
    player_id: row.querySelector('.row-player').value,
    rank: Number(row.querySelector('.row-rank').value),
    points: Number(row.querySelector('.row-points').value),
  }));
}

function addHighlightRow(text) {
  const rows = document.getElementById('highlight-rows');
  const row = document.createElement('div');
  row.className = 'league-result-row';
  row.style.gridTemplateColumns = '1fr auto';
  row.innerHTML = `
    <input type="text" class="row-highlight" value="${text ? String(text).replace(/"/g, '&quot;') : ''}" placeholder="ex : Gros score pour Greg, 2e meilleur total de l'Histoire !" />
    <button type="button" class="btn btn-secondary remove-row-btn">✕</button>
  `;
  row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
  rows.appendChild(row);
}

function readHighlightRows() {
  return [...document.querySelectorAll('#highlight-rows .row-highlight')].map((input) => input.value).filter((v) => v.trim());
}

function refreshRowPlayerOptions() {
  document.querySelectorAll('#league-rows .row-player').forEach((select) => {
    const current = select.value;
    select.innerHTML = playerOptionsHtml(current);
  });
}

async function loadPlayers() {
  cachedPlayers = await api.adminGet('/api/admin/players');
  refreshRowPlayerOptions();
  const list = document.getElementById('players-list');
  if (cachedPlayers.length === 0) {
    list.innerHTML = '<p>Aucun joueur pour l\'instant.</p>';
    return;
  }
  list.innerHTML = cachedPlayers
    .map(
      (p) => `
    <div class="card" style="margin-bottom:8px;padding:12px;">
      <strong>${p.name}</strong>
      <div class="muted">${p.tagline || ''}</div>
      <button type="button" class="btn btn-secondary edit-player-btn" data-id="${p.id}" style="margin-top:8px;">Modifier</button>
    </div>`
    )
    .join('');
  list.querySelectorAll('.edit-player-btn').forEach((btn) =>
    btn.addEventListener('click', () => startEditPlayer(btn.dataset.id))
  );
}

function startEditPlayer(id) {
  const player = cachedPlayers.find((p) => p.id === id);
  if (!player) return;
  document.getElementById('player-id').value = player.id;
  document.getElementById('player-name').value = player.name;
  document.getElementById('player-avatar').value = player.avatar_url || '';
  document.getElementById('player-tagline').value = player.tagline || '';
  document.getElementById('player-submit-btn').textContent = 'Enregistrer les modifications';
  document.getElementById('player-cancel-btn').style.display = 'inline-block';
}

function resetPlayerForm() {
  document.getElementById('player-form').reset();
  document.getElementById('player-id').value = '';
  document.getElementById('player-submit-btn').textContent = 'Ajouter le joueur';
  document.getElementById('player-cancel-btn').style.display = 'none';
}

async function loadLeagues() {
  const leagues = await api.adminGet('/api/admin/leagues');
  const list = document.getElementById('leagues-list');
  if (leagues.length === 0) {
    list.innerHTML = '<p>Aucune ligue saisie pour l\'instant.</p>';
    return;
  }
  list.innerHTML = leagues
    .map(
      (l) => `
    <div class="card" style="margin-bottom:8px;padding:12px;">
      <strong>${l.name}</strong> <span class="muted">(${l.period_label || 'période non précisée'}, taille ${l.size}, ordre ${l.order_index})</span>
      <div>
        <button type="button" class="btn btn-secondary edit-league-btn" data-id="${l.id}" style="margin-top:8px;">Modifier</button>
      </div>
    </div>`
    )
    .join('');
  list.querySelectorAll('.edit-league-btn').forEach((btn) =>
    btn.addEventListener('click', () => startEditLeague(btn.dataset.id))
  );
}

async function startEditLeague(id) {
  const league = await api.adminGet(`/api/admin/leagues/${id}`);
  document.getElementById('league-id').value = league.id;
  document.getElementById('league-name').value = league.name;
  document.getElementById('league-period').value = league.period_label || '';
  document.getElementById('league-size').value = String(league.size);
  document.getElementById('league-order').value = league.order_index;
  document.getElementById('league-photo').value = league.photo_url || '';
  document.getElementById('league-story-title').value = league.story_title || '';
  document.getElementById('league-story-text').value = league.story_text || '';
  document.getElementById('league-rows').innerHTML = '';
  league.results.forEach((r) => addLeagueRow(r));
  document.getElementById('highlight-rows').innerHTML = '';
  (league.highlights || []).forEach((h) => addHighlightRow(h));
  document.getElementById('league-submit-btn').textContent = 'Enregistrer les modifications';
  document.getElementById('league-cancel-btn').style.display = 'inline-block';
}

function resetLeagueForm() {
  document.getElementById('league-form').reset();
  document.getElementById('league-id').value = '';
  document.getElementById('highlight-rows').innerHTML = '';
  document.getElementById('league-submit-btn').textContent = 'Ajouter la ligue';
  document.getElementById('league-cancel-btn').style.display = 'none';
  fillRowsWithAllPlayers();
}

document.getElementById('logout-btn').addEventListener('click', () => {
  clearAdminToken();
  window.location.href = '/admin/login.html';
});

document.getElementById('player-cancel-btn').addEventListener('click', resetPlayerForm);
document.getElementById('league-cancel-btn').addEventListener('click', resetLeagueForm);
document.getElementById('add-row-btn').addEventListener('click', () => addLeagueRow());
document.getElementById('add-highlight-btn').addEventListener('click', () => addHighlightRow());

document.getElementById('player-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('player-error');
  errorEl.style.display = 'none';
  const id = document.getElementById('player-id').value;
  const payload = {
    name: document.getElementById('player-name').value,
    avatar_url: document.getElementById('player-avatar').value,
    tagline: document.getElementById('player-tagline').value,
  };
  try {
    if (id) await api.adminPut(`/api/admin/players/${id}`, payload);
    else await api.adminPost('/api/admin/players', payload);
    resetPlayerForm();
    await loadPlayers();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
});

document.getElementById('league-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('league-error');
  errorEl.style.display = 'none';
  const id = document.getElementById('league-id').value;
  const orderValue = document.getElementById('league-order').value;
  const payload = {
    name: document.getElementById('league-name').value,
    period_label: document.getElementById('league-period').value,
    size: Number(document.getElementById('league-size').value),
    order_index: orderValue ? Number(orderValue) : undefined,
    photo_url: document.getElementById('league-photo').value,
    story_title: document.getElementById('league-story-title').value,
    story_text: document.getElementById('league-story-text').value,
    highlights: readHighlightRows(),
    results: readLeagueRows(),
  };
  try {
    if (id) await api.adminPut(`/api/admin/leagues/${id}`, payload);
    else await api.adminPost('/api/admin/leagues', payload);
    resetLeagueForm();
    await loadLeagues();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
});

(async function init() {
  await loadPlayers();
  await loadLeagues();
  fillRowsWithAllPlayers();
})();
