const NAV_LINKS = [
  { href: '/index.html', label: 'Accueil' },
  { href: '/hall-of-fame.html', label: 'Hall of Fame' },
  { href: '/classement.html', label: 'Classement all-time' },
  { href: '/joueurs.html', label: 'Les copains' },
  { href: '/historique.html', label: 'Historique' },
  { href: '/transparence.html', label: 'Page transparence' },
];

const NAV_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 5H5a2 2 0 0 0 2 4"/><path d="M16 5h3a2 2 0 0 1-2 4"/><path d="M9 16h6"/><path d="M12 12v4"/><path d="M7 20h10"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3-6 7-6s7 2.7 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.6.4 4.5 2.3 5 4.8"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6z"/></svg>',
  badge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.2 2.2 3.1-.4.7 3.1 2.8 1.5-1.2 2.9 1.2 2.9-2.8 1.5-.7 3.1-3.1-.4L12 19l-2.2-2.2-3.1.4-.7-3.1-2.8-1.5 1.2-2.9-1.2-2.9 2.8-1.5.7-3.1 3.1.4z"/><path d="M9 12l2 2 4-4"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
};

const HANDSHAKE_ICON =
  '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.75167 16.6185C9.86056 16.6185 9.97215 16.594 10.0865 16.5448C10.2008 16.4958 10.2932 16.436 10.3638 16.3654L16.8606 9.86854C17.0699 9.65924 17.2315 9.44507 17.3454 9.22604C17.4592 9.00701 17.516 8.7666 17.516 8.50479C17.516 8.23979 17.4592 7.98257 17.3454 7.73312C17.2315 7.48368 17.0699 7.25583 16.8606 7.04958L13.7356 3.92458C13.5294 3.71528 13.3176 3.56174 13.1002 3.46396C12.8827 3.36618 12.6415 3.31729 12.3767 3.31729C12.1149 3.31729 11.8718 3.36618 11.6475 3.46396C11.4231 3.56174 11.2115 3.71528 11.0129 3.92458L10.2869 4.65062L11.8285 6.19708C11.9941 6.35944 12.1175 6.54431 12.1987 6.75167C12.2799 6.95889 12.3204 7.16931 12.3204 7.38292C12.3204 7.81681 12.1786 8.17555 11.895 8.45917C11.6114 8.74278 11.2527 8.88458 10.819 8.88458C10.6052 8.88458 10.3966 8.85201 10.1931 8.78687C9.98965 8.72174 9.80667 8.60792 9.64417 8.44542L8.41833 7.22437C8.32208 7.12826 8.19917 7.08021 8.04958 7.08021C7.90014 7.08021 7.77729 7.12826 7.68104 7.22437L4.45188 10.4535C4.36757 10.538 4.30431 10.6339 4.26208 10.7412C4.21986 10.8486 4.19875 10.9567 4.19875 11.0656C4.19875 11.2623 4.26181 11.4244 4.38792 11.5521C4.51389 11.6797 4.67521 11.7435 4.87188 11.7435C4.98076 11.7435 5.09236 11.719 5.20667 11.6698C5.32097 11.6208 5.4134 11.561 5.48396 11.4904L7.83021 9.14417C7.90813 9.06625 8.00292 9.02382 8.11458 9.01687C8.22625 9.00993 8.32799 9.05236 8.41979 9.14417C8.50854 9.23292 8.55292 9.33125 8.55292 9.43917C8.55292 9.54708 8.50854 9.64535 8.41979 9.73396L6.07854 12.0802C5.9941 12.1645 5.93076 12.2603 5.88854 12.3677C5.84646 12.4751 5.82542 12.5833 5.82542 12.6923C5.82542 12.8783 5.89111 13.0369 6.0225 13.1683C6.15389 13.2997 6.3125 13.3654 6.49833 13.3654C6.60736 13.3654 6.71903 13.3408 6.83333 13.2917C6.94764 13.2425 7.04007 13.1826 7.11063 13.1121L9.64896 10.5785C9.72701 10.5005 9.82188 10.458 9.93354 10.451C10.0452 10.4441 10.1469 10.4866 10.2388 10.5785C10.3275 10.6672 10.3719 10.7654 10.3719 10.8733C10.3719 10.9812 10.3275 11.0796 10.2388 11.1683L7.70521 13.7067C7.63146 13.7772 7.57083 13.8697 7.52333 13.984C7.47569 14.0983 7.45188 14.2099 7.45188 14.319C7.45188 14.5048 7.51757 14.6634 7.64896 14.7948C7.78049 14.9263 7.93917 14.9921 8.125 14.9921C8.23403 14.9921 8.34222 14.971 8.44958 14.9287C8.55694 14.8865 8.65278 14.8232 8.73708 14.7387L11.2756 12.2052C11.3537 12.1272 11.4485 12.0847 11.56 12.0777C11.6717 12.0708 11.7735 12.1133 11.8654 12.2052C11.954 12.2938 11.9983 12.3921 11.9983 12.5C11.9983 12.6079 11.954 12.7062 11.8654 12.7948L9.32688 15.3333C9.24257 15.4178 9.17931 15.519 9.13708 15.6371C9.09486 15.7551 9.07375 15.8633 9.07375 15.9615C9.07375 16.1581 9.14292 16.3168 9.28125 16.4375C9.41958 16.5582 9.57639 16.6185 9.75167 16.6185ZM9.74688 17.4519C9.3184 17.4519 8.95167 17.2951 8.64667 16.9817C8.34167 16.6681 8.20785 16.281 8.24521 15.8204C7.77299 15.8258 7.37979 15.6849 7.06562 15.3975C6.7516 15.11 6.60257 14.7088 6.61854 14.194C6.10368 14.1992 5.69799 14.0521 5.40146 13.7525C5.10493 13.4528 4.97007 13.0577 4.99688 12.5673C4.53313 12.5727 4.14528 12.4424 3.83333 12.1762C3.52139 11.9103 3.36542 11.5401 3.36542 11.0656C3.36542 10.852 3.40681 10.6381 3.48958 10.424C3.57236 10.2097 3.69493 10.0213 3.85729 9.85896L7.1025 6.61375C7.35792 6.35847 7.67285 6.23083 8.04729 6.23083C8.42174 6.23083 8.73667 6.35847 8.99208 6.61375L10.2019 7.82375C10.2724 7.8975 10.3595 7.95812 10.4631 8.00562C10.5667 8.05312 10.6838 8.07687 10.8142 8.07687C10.9925 8.07687 11.1501 8.01465 11.2869 7.89021C11.4237 7.76576 11.4921 7.60361 11.4921 7.40375C11.4921 7.27347 11.4683 7.15653 11.4206 7.05292C11.3731 6.9493 11.3125 6.86222 11.2388 6.79167L8.37188 3.92458C8.16563 3.71528 7.95111 3.56174 7.72833 3.46396C7.50556 3.36618 7.26174 3.31729 6.99688 3.31729C6.73507 3.31729 6.49736 3.36618 6.28375 3.46396C6.07 3.56174 5.8584 3.71528 5.64896 3.92458L3.11208 6.46625C2.82153 6.75694 2.63458 7.11167 2.55125 7.53042C2.46792 7.94931 2.50583 8.34944 2.665 8.73083C2.69597 8.83875 2.68208 8.94292 2.62333 9.04333C2.56458 9.14375 2.48125 9.20785 2.37333 9.23562C2.26542 9.2634 2.15861 9.24868 2.05292 9.19146C1.94708 9.13437 1.88028 9.05187 1.8525 8.94396C1.67306 8.40549 1.63382 7.86139 1.73479 7.31167C1.83576 6.76194 2.09674 6.27667 2.51771 5.85583L5.03854 3.335C5.3291 3.0475 5.63653 2.83382 5.96083 2.69396C6.285 2.55396 6.63569 2.48396 7.01292 2.48396C7.39 2.48396 7.73799 2.55396 8.05688 2.69396C8.37576 2.83382 8.67889 3.0475 8.96625 3.335L9.69229 4.06083L10.4183 3.335C10.7089 3.0475 11.0136 2.83382 11.3325 2.69396C11.6514 2.55396 11.9994 2.48396 12.3767 2.48396C12.7538 2.48396 13.1044 2.55396 13.4288 2.69396C13.7529 2.83382 14.0588 3.0475 14.3463 3.335L17.4504 6.43917C17.7378 6.72653 17.9594 7.04917 18.1154 7.40708C18.2714 7.765 18.3494 8.1325 18.3494 8.50958C18.3494 8.88681 18.2714 9.23486 18.1154 9.55375C17.9594 9.87264 17.7378 10.1758 17.4504 10.4631L10.9535 16.9552C10.7805 17.1283 10.5922 17.2543 10.3885 17.3333C10.1851 17.4124 9.97118 17.4519 9.74688 17.4519Z" fill="white"/></svg>';

const BOTTOM_NAV_ITEMS = [
  { href: '/index.html', icon: 'home' },
  { href: '/hall-of-fame.html', icon: 'badge' },
  { href: '/classement.html', icon: 'star' },
  { href: '/joueurs.html', icon: 'people' },
  { key: 'plus', icon: 'dots' },
];

const PLUS_SHEET_LINKS = [
  { href: '/historique.html', label: 'Historique' },
  { href: '/transparence.html', label: 'Page transparence' },
];

function createDuelFab() {
  const isPurple = document.body.classList.contains('theme-purple');
  const duelFab = document.createElement('button');
  duelFab.className = isPurple ? 'duel-fab duel-fab-purple' : 'duel-fab';
  duelFab.innerHTML = isPurple ? HANDSHAKE_ICON : '⚔️ Duel';
  duelFab.addEventListener('click', () => {
    const preselect = window.MPG_DUEL_PRESELECT;
    window.location.href = preselect ? `/duel.html?player=${preselect}` : '/duel.html';
  });
  return duelFab;
}

function initTopbarNav(current) {
  const topbar = document.createElement('div');
  topbar.className = 'topbar';
  topbar.innerHTML = `
    <span class="title">⚽ Classement MPG</span>
    <button class="burger-btn" aria-label="Menu">☰</button>
  `;

  const menu = document.createElement('div');
  menu.className = 'burger-menu';
  menu.innerHTML = `
    <div class="burger-menu-panel">
      <button class="burger-close" aria-label="Fermer">✕</button>
      <nav>
        ${NAV_LINKS.map(
          (l) => `<a href="${l.href}" class="${l.href === current ? 'active' : ''}">${l.label}</a>`
        ).join('')}
      </nav>
    </div>
  `;

  document.body.prepend(menu);
  document.body.prepend(topbar);
  document.body.appendChild(createDuelFab());

  topbar.querySelector('.burger-btn').addEventListener('click', () => menu.classList.add('open'));
  menu.querySelector('.burger-close').addEventListener('click', () => menu.classList.remove('open'));
  menu.addEventListener('click', (e) => {
    if (e.target === menu) menu.classList.remove('open');
  });
}

function initBottomNav(current) {
  document.body.classList.add('nav-bottom');

  const isPlusActive = PLUS_SHEET_LINKS.some((l) => l.href === current);

  const sheet = document.createElement('div');
  sheet.className = 'bottom-nav-plus-sheet';
  sheet.innerHTML = PLUS_SHEET_LINKS.map(
    (l) => `<a href="${l.href}" class="${l.href === current ? 'active' : ''}">${l.label}</a>`
  ).join('');

  const bar = document.createElement('div');
  bar.className = 'bottom-nav';
  bar.innerHTML = BOTTOM_NAV_ITEMS.map((item) => {
    if (item.key === 'plus') {
      return `<button type="button" class="nav-item ${isPlusActive ? 'active' : ''}" data-plus-toggle aria-label="Plus">${NAV_ICONS.dots}</button>`;
    }
    const isActive = item.href === current;
    return `<a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}">${NAV_ICONS[item.icon]}</a>`;
  }).join('');

  document.body.appendChild(sheet);
  document.body.appendChild(bar);
  document.body.appendChild(createDuelFab());

  bar.querySelector('[data-plus-toggle]').addEventListener('click', () => sheet.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!sheet.contains(e.target) && !bar.contains(e.target)) sheet.classList.remove('open');
  });
}

function initNav() {
  const current = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
  if (document.body.dataset.nav === 'bottom') initBottomNav(current);
  else initTopbarNav(current);
}

document.addEventListener('DOMContentLoaded', initNav);
