let cachedPlayers = [];
let cachedLeagues = [];

const CHEVRON_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
const CLOSE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>';

function escapeAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function playerOptionsHtml(selectedId) {
  return cachedPlayers
    .map((p) => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name}</option>`)
    .join('');
}

// --- Drawer & modal de confirmation ---

function openDrawer(html) {
  document.getElementById('drawer-content').innerHTML = html;
  document.getElementById('drawer-backdrop').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  const closeBtn = document.getElementById('drawer-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
}

function closeDrawer() {
  document.getElementById('drawer-backdrop').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}

document.getElementById('drawer-backdrop').addEventListener('click', closeDrawer);

function showConfirm(message, onConfirm) {
  const backdrop = document.getElementById('confirm-backdrop');
  const confirmBtn = document.getElementById('confirm-delete-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  document.getElementById('confirm-message').textContent = message;
  backdrop.classList.add('open');

  function cleanup() {
    backdrop.classList.remove('open');
    confirmBtn.removeEventListener('click', onConfirmClick);
    cancelBtn.removeEventListener('click', onCancelClick);
  }
  function onConfirmClick() {
    cleanup();
    onConfirm();
  }
  function onCancelClick() {
    cleanup();
  }
  confirmBtn.addEventListener('click', onConfirmClick);
  cancelBtn.addEventListener('click', onCancelClick);
}

// --- Drag & drop (pointer events, souris + tactile) ---

function makeSortable(listEl, onReorder) {
  let dragRow = null;

  listEl.querySelectorAll('.drag-handle').forEach((handle) => {
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragRow = handle.closest('.admin-list-row');
      dragRow.classList.add('dragging');
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  });

  function onMove(e) {
    if (!dragRow) return;
    const rows = [...listEl.querySelectorAll('.admin-list-row')];
    const dragIndex = rows.indexOf(dragRow);
    for (const row of rows) {
      if (row === dragRow) continue;
      const rect = row.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const rowIndex = rows.indexOf(row);
      if (rowIndex < dragIndex && e.clientY < midpoint) {
        listEl.insertBefore(dragRow, row);
        break;
      }
      if (rowIndex > dragIndex && e.clientY > midpoint) {
        listEl.insertBefore(dragRow, row.nextSibling);
        break;
      }
    }
  }

  function onUp() {
    if (!dragRow) return;
    dragRow.classList.remove('dragging');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    const ids = [...listEl.querySelectorAll('.admin-list-row')].map((r) => r.dataset.id);
    dragRow = null;
    onReorder(ids);
  }
}

// --- Joueurs ---

function avatarHtml(url) {
  if (url)
    return `<img class="admin-row-avatar" src="${url}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'admin-row-avatar avatar-fallback',textContent:'⚽'}))" />`;
  return `<div class="admin-row-avatar avatar-fallback">⚽</div>`;
}

function playerRowHtml(p) {
  return `
    <div class="admin-list-row" data-id="${p.id}">
      <span class="drag-handle">⠿</span>
      <a class="admin-row-clickable" data-id="${p.id}">
        ${avatarHtml(p.avatar_url)}
        <div class="admin-row-body">
          <strong>${p.name}</strong>
          ${p.tagline ? `<span>${p.tagline}</span>` : ''}
        </div>
        <span class="admin-row-chevron">${CHEVRON_ICON}</span>
      </a>
    </div>`;
}

async function loadPlayers() {
  cachedPlayers = await api.adminGet('/api/admin/players');
  refreshRowPlayerOptions();
  renderPlayersList();
}

function renderPlayersList() {
  const list = document.getElementById('players-list');
  if (cachedPlayers.length === 0) {
    list.innerHTML = '<p class="muted">Aucun joueur pour l\'instant.</p>';
    return;
  }
  list.innerHTML = cachedPlayers.map(playerRowHtml).join('');
  list.querySelectorAll('.admin-row-clickable').forEach((el) =>
    el.addEventListener('click', () => {
      const player = cachedPlayers.find((p) => p.id === el.dataset.id);
      openPlayerDrawer(player);
    })
  );
  makeSortable(list, async (ids) => {
    cachedPlayers = ids.map((id) => cachedPlayers.find((p) => p.id === id));
    try {
      await api.adminPut('/api/admin/players/reorder', { order: ids });
    } catch (err) {
      await loadPlayers();
    }
  });
}

function playerFormHtml(player) {
  const isEdit = !!player;
  return `
    <div class="admin-drawer-header">
      <h2>${isEdit ? 'Modifier le joueur' : 'Ajouter un joueur'}</h2>
      <button type="button" class="admin-drawer-close" id="drawer-close-btn" aria-label="Fermer">${CLOSE_ICON}</button>
    </div>
    <form id="player-form">
      <label for="player-name">Nom</label>
      <input type="text" id="player-name" value="${isEdit ? escapeAttr(player.name) : ''}" required />
      <label for="player-avatar">Avatar (URL)</label>
      <input type="text" id="player-avatar" value="${isEdit ? escapeAttr(player.avatar_url) : ''}" />
      <label for="player-tagline">C'est qui ce gars ?</label>
      <textarea id="player-tagline" rows="4">${isEdit ? player.tagline || '' : ''}</textarea>
      <div class="admin-drawer-actions">
        <button type="submit" class="btn-purple">${isEdit ? 'Valider' : 'Ajouter'}</button>
        ${isEdit ? `<button type="button" class="btn-danger" id="delete-player-btn">Supprimer ce joueur</button>` : ''}
      </div>
      <p class="error-msg" id="player-error" style="display:none;"></p>
    </form>`;
}

function openPlayerDrawer(player) {
  openDrawer(playerFormHtml(player));

  document.getElementById('player-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('player-error');
    errorEl.style.display = 'none';
    const payload = {
      name: document.getElementById('player-name').value,
      avatar_url: document.getElementById('player-avatar').value,
      tagline: document.getElementById('player-tagline').value,
    };
    try {
      if (player) await api.adminPut(`/api/admin/players/${player.id}`, payload);
      else await api.adminPost('/api/admin/players', payload);
      closeDrawer();
      await loadPlayers();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  });

  if (player) {
    document.getElementById('delete-player-btn').addEventListener('click', () => {
      showConfirm(`Supprimer ${player.name} ? Cette action est irréversible.`, async () => {
        try {
          await api.adminDelete(`/api/admin/players/${player.id}`);
          closeDrawer();
          await loadPlayers();
        } catch (err) {
          document.getElementById('player-error').textContent = err.message;
          document.getElementById('player-error').style.display = 'block';
        }
      });
    });
  }
}

// --- Ligues ---

function leagueAvatarHtml(url) {
  if (url)
    return `<img class="admin-row-avatar" src="${url}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'admin-row-avatar avatar-fallback',textContent:'🏆'}))" />`;
  return `<div class="admin-row-avatar avatar-fallback">🏆</div>`;
}

function leagueRowHtml(l) {
  return `
    <div class="admin-list-row" data-id="${l.id}">
      <span class="drag-handle">⠿</span>
      <a class="admin-row-clickable" data-id="${l.id}">
        ${leagueAvatarHtml(l.photo_url)}
        <div class="admin-row-body">
          <strong>${l.name}</strong>
          <span>${l.period_label || 'période non précisée'} · taille ${l.size}</span>
        </div>
        <span class="admin-row-chevron">${CHEVRON_ICON}</span>
      </a>
    </div>`;
}

async function loadLeagues() {
  const leagues = await api.adminGet('/api/admin/leagues');
  cachedLeagues = [...leagues].reverse(); // affichage du plus recent au plus ancien
  renderLeaguesList();
}

function renderLeaguesList() {
  const list = document.getElementById('leagues-list');
  if (cachedLeagues.length === 0) {
    list.innerHTML = '<p class="muted">Aucune ligue saisie pour l\'instant.</p>';
    return;
  }
  list.innerHTML = cachedLeagues.map(leagueRowHtml).join('');
  list.querySelectorAll('.admin-row-clickable').forEach((el) =>
    el.addEventListener('click', async () => {
      const league = await api.adminGet(`/api/admin/leagues/${el.dataset.id}`);
      openLeagueDrawer(league);
    })
  );
  makeSortable(list, async (ids) => {
    cachedLeagues = ids.map((id) => cachedLeagues.find((l) => l.id === id));
    try {
      // La liste affiche le plus recent en premier ; l'ordre chronologique (order_index)
      // attendu par l'API va du plus ancien au plus recent, donc on inverse avant d'envoyer.
      await api.adminPut('/api/admin/leagues/reorder', { order: [...ids].reverse() });
    } catch (err) {
      await loadLeagues();
    }
  });
}

function addLeagueRow(prefill) {
  const rows = document.getElementById('league-rows');
  const row = document.createElement('div');
  row.className = 'league-result-row';
  row.innerHTML = `
    <select class="row-player">${playerOptionsHtml(prefill && prefill.player_id)}</select>
    <input type="number" class="row-rank" min="1" value="${prefill && prefill.rank != null ? prefill.rank : ''}" required />
    <input type="number" step="0.01" class="row-points" value="${prefill && prefill.points != null ? prefill.points : ''}" required />
    <button type="button" class="btn-danger remove-row-btn">✕</button>
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
    <input type="text" class="row-highlight" value="${text ? escapeAttr(text) : ''}" placeholder="ex : Gros score pour Greg, 2e meilleur total de l'Histoire !" />
    <button type="button" class="btn-danger remove-row-btn">✕</button>
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
  document.querySelectorAll('#hype-rows .hype-player').forEach((select) => {
    const current = select.value;
    select.innerHTML = playerOptionsHtml(current);
  });
}

function leagueFormHtml(league) {
  const isEdit = !!league;
  return `
    <div class="admin-drawer-header">
      <h2>${isEdit ? 'Modifier la ligue' : 'Ajouter une ligue'}</h2>
      <button type="button" class="admin-drawer-close" id="drawer-close-btn" aria-label="Fermer">${CLOSE_ICON}</button>
    </div>
    <form id="league-form">
      <label for="league-name">Nom de la ligue</label>
      <input type="text" id="league-name" value="${isEdit ? escapeAttr(league.name) : ''}" required />
      <label for="league-period">Période</label>
      <input type="text" id="league-period" placeholder="ex : 2e semestre 2024" value="${isEdit ? escapeAttr(league.period_label) : ''}" />
      <label for="league-size">Taille</label>
      <select id="league-size">
        <option value="8" ${isEdit && Number(league.size) === 8 ? 'selected' : ''}>8</option>
        <option value="10" ${!isEdit || Number(league.size) === 10 ? 'selected' : ''}>10</option>
      </select>
      <label for="league-photo">Photo (URL, optionnel)</label>
      <input type="text" id="league-photo" placeholder="https://..." value="${isEdit ? escapeAttr(league.photo_url) : ''}" />

      <h3 style="margin-top:20px;">Story (optionnel)</h3>
      <label for="league-story-title">Titre de la story</label>
      <input type="text" id="league-story-title" value="${isEdit ? escapeAttr(league.story_title) : ''}" />
      <label for="league-story-text">Texte de la story</label>
      <textarea id="league-story-text" rows="6">${isEdit ? league.story_text || '' : ''}</textarea>

      <h3 style="margin-top:20px;">Moments forts (optionnel)</h3>
      <div id="highlight-rows"></div>
      <button type="button" class="btn-purple-outline" id="add-highlight-btn" style="margin-top:8px;">+ Ajouter un moment fort</button>

      <h3 style="margin-top:20px;">Résultats</h3>
      <div class="league-result-row league-result-row-header">
        <span>Joueur</span>
        <span>Rang</span>
        <span>Points</span>
        <span></span>
      </div>
      <div id="league-rows"></div>
      <button type="button" class="btn-purple-outline" id="add-row-btn" style="margin-top:8px;">+ Ajouter un joueur</button>

      <div class="admin-drawer-actions">
        <button type="submit" class="btn-purple">${isEdit ? 'Valider' : 'Ajouter'}</button>
        ${isEdit ? `<button type="button" class="btn-danger" id="delete-league-btn">Supprimer cette ligue</button>` : ''}
      </div>
      <p class="error-msg" id="league-error" style="display:none;"></p>
    </form>`;
}

function openLeagueDrawer(league) {
  openDrawer(leagueFormHtml(league));

  document.getElementById('add-highlight-btn').addEventListener('click', () => addHighlightRow());
  document.getElementById('add-row-btn').addEventListener('click', () => addLeagueRow());

  if (league) {
    league.results.forEach((r) => addLeagueRow(r));
    (league.highlights || []).forEach((h) => addHighlightRow(h));
  } else {
    fillRowsWithAllPlayers();
  }

  document.getElementById('league-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('league-error');
    errorEl.style.display = 'none';
    const payload = {
      name: document.getElementById('league-name').value,
      period_label: document.getElementById('league-period').value,
      size: Number(document.getElementById('league-size').value),
      photo_url: document.getElementById('league-photo').value,
      story_title: document.getElementById('league-story-title').value,
      story_text: document.getElementById('league-story-text').value,
      highlights: readHighlightRows(),
      results: readLeagueRows(),
    };
    try {
      if (league) await api.adminPut(`/api/admin/leagues/${league.id}`, payload);
      else await api.adminPost('/api/admin/leagues', payload);
      closeDrawer();
      await loadLeagues();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  });

  if (league) {
    document.getElementById('delete-league-btn').addEventListener('click', () => {
      showConfirm(`Supprimer la ligue "${league.name}" ? Cette action est irréversible.`, async () => {
        try {
          await api.adminDelete(`/api/admin/leagues/${league.id}`);
          closeDrawer();
          await loadLeagues();
        } catch (err) {
          document.getElementById('league-error').textContent = err.message;
          document.getElementById('league-error').style.display = 'block';
        }
      });
    });
  }
}

// --- Ligue en cours ---

let cachedOngoing = null;

function addHypeRow(prefill) {
  const rows = document.getElementById('hype-rows');
  const row = document.createElement('div');
  row.className = 'league-result-row';
  row.style.gridTemplateColumns = '1fr 2fr auto';
  row.innerHTML = `
    <select class="hype-player">${playerOptionsHtml(prefill && prefill.player_id)}</select>
    <input type="text" class="hype-phrase" value="${prefill && prefill.phrase ? escapeAttr(prefill.phrase) : ''}" placeholder="ex : Je sens le titre cette année..." />
    <button type="button" class="btn-danger remove-row-btn">✕</button>
  `;
  row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
  rows.appendChild(row);
}

function readHypeRows() {
  return [...document.querySelectorAll('#hype-rows .league-result-row')]
    .map((row) => ({
      player_id: row.querySelector('.hype-player').value,
      phrase: row.querySelector('.hype-phrase').value,
    }))
    .filter((q) => q.phrase.trim());
}

function formatOngoingEndAt(endAt) {
  const d = new Date(endAt * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function updateOngoingCard() {
  document.getElementById('ongoing-card-title').textContent =
    cachedOngoing && cachedOngoing.name ? cachedOngoing.name : 'Aucune ligue en cours';
  document.getElementById('ongoing-card-chevron').innerHTML = CHEVRON_ICON;
}

async function loadOngoing() {
  cachedOngoing = await api.adminGet('/api/admin/ongoing-league');
  updateOngoingCard();
}

function ongoingFormHtml(ongoing) {
  return `
    <div class="admin-drawer-header">
      <h2>Ligue en cours</h2>
      <button type="button" class="admin-drawer-close" id="drawer-close-btn" aria-label="Fermer">${CLOSE_ICON}</button>
    </div>
    <p class="muted">S'affiche sur la home en pointillés, tant qu'une ligue est en cours. Laisse le nom vide et enregistre pour faire disparaître la carte une fois la ligue terminée et ajoutée à l'historique.</p>
    <form id="ongoing-form" style="margin-top:16px;">
      <label for="ongoing-name">Nom de la ligue en cours</label>
      <input type="text" id="ongoing-name" placeholder="ex : Les Tanches" value="${ongoing && ongoing.name ? escapeAttr(ongoing.name) : ''}" />
      <label for="ongoing-end-at">Date de fin (pour le compte à rebours, optionnel)</label>
      <input type="datetime-local" id="ongoing-end-at" value="${ongoing && ongoing.end_at ? formatOngoingEndAt(ongoing.end_at) : ''}" />
      <label for="ongoing-photo">Photo (URL, optionnel)</label>
      <input type="text" id="ongoing-photo" placeholder="https://..." value="${ongoing && ongoing.photo_url ? escapeAttr(ongoing.photo_url) : ''}" />

      <h3 style="margin-top:20px;">Phrases hype (optionnel)</h3>
      <div id="hype-rows"></div>
      <button type="button" class="btn-purple-outline" id="add-hype-btn" style="margin-top:8px;">+ Ajouter une phrase</button>

      <div class="admin-drawer-actions">
        <button type="submit" class="btn-purple" id="ongoing-submit-btn">Enregistrer</button>
      </div>
      <p class="error-msg" id="ongoing-error" style="display:none;"></p>
      <p class="muted" id="ongoing-success" style="display:none;"></p>
    </form>`;
}

function openOngoingDrawer() {
  openDrawer(ongoingFormHtml(cachedOngoing));

  document.getElementById('add-hype-btn').addEventListener('click', () => addHypeRow());
  ((cachedOngoing && cachedOngoing.hypeQuotes) || []).forEach((q) => addHypeRow(q));

  document.getElementById('ongoing-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('ongoing-error');
    const successEl = document.getElementById('ongoing-success');
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    const name = document.getElementById('ongoing-name').value.trim();
    const endAtValue = document.getElementById('ongoing-end-at').value;
    const end_at = endAtValue ? Math.floor(new Date(endAtValue).getTime() / 1000) : null;
    const photo_url = document.getElementById('ongoing-photo').value.trim();
    const hype_quotes = readHypeRows();
    try {
      cachedOngoing = await api.adminPut('/api/admin/ongoing-league', { name, end_at, photo_url, hype_quotes });
      updateOngoingCard();
      successEl.textContent = 'Ligue en cours enregistrée.';
      successEl.style.display = 'block';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    }
  });
}

document.getElementById('ongoing-card').addEventListener('click', () => openOngoingDrawer());

// --- Onglets & init ---

document.getElementById('logout-btn').addEventListener('click', () => {
  clearAdminToken();
  window.location.href = '/admin/login.html';
});

document.getElementById('add-player-btn').addEventListener('click', () => openPlayerDrawer(null));
document.getElementById('add-league-btn').addEventListener('click', () => openLeagueDrawer(null));

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('[data-panel]').forEach((panel) => {
      panel.style.display = panel.dataset.panel === btn.dataset.tab ? '' : 'none';
    });
  });
});

(async function init() {
  await loadPlayers();
  await loadLeagues();
  await loadOngoing();
})();
