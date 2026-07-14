let duelPlayers = [];

function playerOptions(selectedId) {
  return duelPlayers.map((p) => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name}</option>`).join('');
}

async function loadDuelResult(id1, id2) {
  const resultEl = document.getElementById('duel-result');
  const errorEl = document.getElementById('duel-error');
  errorEl.style.display = 'none';
  if (!id1 || !id2 || id1 === id2) {
    errorEl.textContent = 'Choisis deux joueurs différents.';
    errorEl.style.display = 'block';
    resultEl.innerHTML = '';
    return;
  }
  try {
    const duel = await api.get(`/api/players/${id1}/duel/${id2}`);
    const gap = duel.scoreGap != null ? duel.scoreGap.toFixed(2) : '—';
    resultEl.innerHTML = `
      <div class="card">
        <h2 style="text-align:center;">${duel.player1.name} <span class="muted">vs</span> ${duel.player2.name}</h2>
        <p style="text-align:center;">Confrontations directes : <strong>${duel.p1Wins}</strong> — <strong>${duel.p2Wins}</strong></p>
        <p class="muted" style="text-align:center;">Écart de score all-time : ${gap}</p>
        ${
          duel.confrontations.length === 0
            ? '<p class="muted">Ces deux joueurs n\'ont jamais partagé de ligue.</p>'
            : `<table>
              <thead><tr><th>Ligue</th><th>${duel.player1.name}</th><th>${duel.player2.name}</th></tr></thead>
              <tbody>
                ${duel.confrontations
                  .map(
                    (c) => `<tr>
                  <td>${c.leagueName}</td>
                  <td>${c.p1Rank}${c.winner === duel.player1.id ? ' 🏅' : ''}</td>
                  <td>${c.p2Rank}${c.winner === duel.player2.id ? ' 🏅' : ''}</td>
                </tr>`
                  )
                  .join('')}
              </tbody>
            </table>`
        }
      </div>
    `;
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    resultEl.innerHTML = '';
  }
}

(async function init() {
  const params = new URLSearchParams(window.location.search);
  const preselect = params.get('player');
  duelPlayers = await api.get('/api/players');
  const select1 = document.getElementById('select-p1');
  const select2 = document.getElementById('select-p2');
  select1.innerHTML = playerOptions(preselect);
  select2.innerHTML = playerOptions();
  if (duelPlayers.length > 1 && select2.value === select1.value) {
    select2.selectedIndex = select2.selectedIndex === 0 ? 1 : 0;
  }
  document.getElementById('duel-submit-btn').addEventListener('click', () => {
    loadDuelResult(select1.value, select2.value);
  });
  if (preselect) loadDuelResult(select1.value, select2.value);
})();
