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
  dimanche: {
    description:
      "Une victoire, mais pas franchement un exploit.\n\nLe plus faible total de points qui ait quand même suffi à remporter une ligue.\n\nUn dimanche sans concurrence, en somme.",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} en gagnant avec seulement ${value} points ! #vainqueurdudimanche`,
  },
  boulet: {
    description:
      "Un bon score, complètement gâché.\n\nLe plus haut total de points jamais enregistré... pour une dernière place.\n\nMauvaise ligue, mauvais soir, ou juste une génération trop forte autour de lui.",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} en terminant dernier malgré ${value} points ! #bouletdoré`,
  },
  phenix: {
    description:
      "Il était au fond du trou, et puis plus rien ne l'a arrêté.\n\nLa plus grosse remontée au classement d'une ligue à la suivante, toutes ligues confondues.\n\nUne renaissance version boucherie.",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} avec une remontée de ${value} places au classement ! #phénix`,
  },
  icare: {
    description:
      "Le vol plané version classement.\n\nLa plus grosse chute au classement d'une ligue à la suivante, toutes ligues confondues.\n\nOn était en haut, on a fini en bas. Aïe.",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} avec une chute de ${value} places au classement ! #chutedicare`,
  },
  grandEcart: {
    description:
      "La domination totale, du premier au dernier.\n\nLe plus gros écart de points jamais enregistré entre le 1er et le dernier d'une même ligue.\n\nUne ligue à deux vitesses — et clairement pas dans le bon sens pour tout le monde.",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} avec un écart record de ${value} points entre le 1er et le dernier ! #grandécart`,
  },
  peloton: {
    description:
      "Tout le monde dans un mouchoir de poche.\n\nLe plus petit écart de points jamais enregistré entre le 1er et le dernier d'une même ligue.\n\nUne ligue tellement serrée qu'on aurait pu tirer les résultats au sort.",
    template: (leaguesPhrase, value) => `Obtenu lors ${leaguesPhrase} avec seulement ${value} points d'écart entre le 1er et le dernier ! #peloton`,
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
  if (url)
    return `<img src="${url}" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" onerror="this.outerHTML='<div class=&quot;avatar-fallback&quot; style=&quot;width:${size}px;height:${size}px;&quot;>⚽</div>'" />`;
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
  const bottomBlock = `
    <div class="hof-card-bottom">
      <div class="hof-card-separator"></div>
      <h3 class="hof-card-subtitle">C'est quoi ce titre ?</h3>
      <div class="hof-card-description">${multilineHtml(content.description)}</div>
    </div>`;

  if (!r.holders || r.holders.length === 0) {
    return `
      <div class="hof-card">
        <div class="hof-card-top">
          <h2 class="hof-card-title">${r.label}</h2>
          <p class="hof-card-detail">Pas encore de détenteur.</p>
        </div>
        ${bottomBlock}
      </div>`;
  }

  const leaguesPhrase = formatLeaguesPhrase(r.holders.map((h) => h.leagueName));
  return `
    <div class="hof-card">
      <div class="hof-card-top">
        <h2 class="hof-card-title">${r.label}</h2>
        ${avatarsStackHtml(r.holders)}
        <p class="hof-holder-names">${namesLine(r.holders)}</p>
        <p class="hof-card-detail">${content.template(leaguesPhrase, formatValue(r.value))}</p>
      </div>
      ${bottomBlock}
    </div>`;
}
