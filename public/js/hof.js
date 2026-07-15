// Textes fixes du Hall of Fame — brouillon à ajuster par l'admin (ton "entre potes").
const HOF_CONTENT = {
  sniper: {
    description:
      "Un vrai serial buteur.\n\nLe meilleur total de points jamais enregistré sur une seule ligue.\n\nAlerte à la triche ? Non, juste du talent (ou un mercato de dingue).",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} avec un total record de ${value} points ! #sniper`,
  },
  naufrage: {
    description:
      "Le mec était absent.\nOn aurait dit Bardella à l'Europe.\n\nBref il a marqué l'Histoire de la boucherie MPG par le plus faible total de points sur une ligue.",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} avec un tout petit total de ${value} points ! #jaitoutdonné`,
  },
  fossoyeur: {
    description:
      "Personne dans son rétro.\n\nLe mec a gagné la ligue avec le plus gros écart avec le deuxième.\n\nLa chatte à Dédé ?\nSûrement un peu ;)",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} avec un écart de ${value} points avec le second ! #oùestlaconcurrence?`,
  },
  photoFinish: {
    description:
      "Ça s'est joué à un cheveu.\n\nLe plus petit écart jamais vu entre le 1er et le 2e d'une ligue.\n\nUn suspense à faire pâlir un final de Ligue des Champions.",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} avec seulement ${value} points d'écart avec le second ! #çasestjouéàrien`,
  },
  ko: {
    description:
      "Le coup de grâce.\n\nLe plus gros écart jamais enregistré entre l'avant-dernier et le dernier d'une ligue.\n\nUne humiliation qui restera dans les annales.",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} avec un écart de ${value} points avec l'avant-dernier ! #KO`,
  },
};

function formatValue(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function multilineHtml(text) {
  return text
    .split('\n\n')
    .map((p) => `<p style="margin:0;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function avatarHtml(url, size) {
  if (url) return `<img src="${url}" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" />`;
  return `<div class="avatar-fallback" style="width:${size}px;height:${size}px;">⚽</div>`;
}

function namesLine(holders) {
  if (holders.length <= 3) {
    const names = holders.map((h) => h.name);
    return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
  }
  const extra = holders.length - 1;
  return `${holders[0].name} et ${extra} autres`;
}

function avatarsStackHtml(holders) {
  const shown = holders.slice(0, 3).reverse();
  return `<div class="hof-avatar-stack">${shown.map((h) => `<div class="hof-avatar-layer">${avatarHtml(h.avatarUrl, 120)}</div>`).join('')}</div>`;
}

function formatLeaguesPhrase(names) {
  const unique = [...new Set(names)].filter(Boolean);
  const quoted = unique.map((n) => `"${n}"`);
  if (quoted.length <= 1) return `de la ligue ${quoted[0] || ''}`;
  if (quoted.length === 2) return `des ligues ${quoted[0]} et ${quoted[1]}`;
  return `des ligues ${quoted.slice(0, -1).join(', ')} et ${quoted[quoted.length - 1]}`;
}

(async function () {
  const list = document.getElementById('hof-list');
  try {
    const records = await api.get('/api/hall-of-fame');
    list.innerHTML = records.map((r) => hofCardHtml(r)).join('');
  } catch (err) {
    list.innerHTML = `<p class="error-msg" style="padding:0 16px;">${err.message}</p>`;
  }
})();

function hofCardHtml(r) {
  const content = HOF_CONTENT[r.key];
  const subtitleBlock = `
    <h3 class="hof-card-subtitle">C'est quoi ce titre ?</h3>
    <div class="hof-card-description">${multilineHtml(content.description)}</div>`;

  if (!r.holders || r.holders.length === 0) {
    return `
      <div class="hof-card">
        <h2 class="hof-card-title">${r.label}</h2>
        ${subtitleBlock}
        <p class="hof-card-detail">Pas encore de détenteur.</p>
      </div>`;
  }

  const leaguesPhrase = formatLeaguesPhrase(r.holders.map((h) => h.leagueName));
  return `
    <div class="hof-card">
      <h2 class="hof-card-title">${r.label}</h2>
      ${avatarsStackHtml(r.holders)}
      <p class="hof-holder-names">${namesLine(r.holders)}</p>
      ${subtitleBlock}
      <div class="hof-card-separator"></div>
      <p class="hof-card-detail">${content.template(leaguesPhrase, formatValue(r.value))}</p>
    </div>`;
}
