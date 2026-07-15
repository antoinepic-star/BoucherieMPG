const NAV_ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3-6 7-6s7 2.7 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.6.4 4.5 2.3 5 4.8"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.9615 20C10.041 20 8.35575 19.4106 6.90575 18.2318C5.45575 17.0529 4.54033 15.5423 4.1595 13.7C4.1185 13.5525 4.13325 13.4162 4.20375 13.2912C4.27425 13.1662 4.38517 13.0935 4.5365 13.073C4.67883 13.0525 4.80383 13.0833 4.9115 13.1655C5.01917 13.2475 5.0955 13.3642 5.1405 13.5155C5.502 15.1052 6.31733 16.4167 7.5865 17.45C8.85583 18.4833 10.3142 19 11.9615 19C13.9115 19 15.5657 18.3208 16.924 16.9625C18.2823 15.6042 18.9615 13.95 18.9615 12C18.9615 10.05 18.2823 8.39583 16.924 7.0375C15.5657 5.67917 13.9115 5 11.9615 5C10.9268 5 9.95442 5.21858 9.04425 5.65575C8.13392 6.09292 7.33067 6.69483 6.6345 7.4615H8.6155C8.75717 7.4615 8.87592 7.5095 8.97175 7.6055C9.06758 7.7015 9.1155 7.82042 9.1155 7.96225C9.1155 8.10408 9.06758 8.22275 8.97175 8.31825C8.87592 8.41375 8.75717 8.4615 8.6155 8.4615H5.76925C5.54042 8.4615 5.34858 8.38408 5.19375 8.22925C5.03892 8.07442 4.9615 7.88258 4.9615 7.65375V4.80775C4.9615 4.66608 5.0095 4.54733 5.1055 4.4515C5.2015 4.35567 5.32042 4.30775 5.46225 4.30775C5.60408 4.30775 5.72275 4.35567 5.81825 4.4515C5.91375 4.54733 5.9615 4.66608 5.9615 4.80775V6.69625C6.73467 5.84742 7.64075 5.18583 8.67975 4.7115C9.71892 4.23717 10.8128 4 11.9615 4C13.0715 4 14.1112 4.20867 15.0805 4.626C16.0498 5.04333 16.897 5.6145 17.622 6.3395C18.347 7.0645 18.9182 7.91158 19.3355 8.88075C19.7528 9.84975 19.9615 10.8892 19.9615 11.999C19.9615 13.1087 19.7528 14.1484 19.3355 15.1183C18.9182 16.0881 18.347 16.9355 17.622 17.6605C16.897 18.3855 16.0498 18.9567 15.0805 19.374C14.1112 19.7913 13.0715 20 11.9615 20ZM12.5192 11.7923L15.5193 14.7923C15.6128 14.8859 15.6628 15.0007 15.6693 15.1365C15.6756 15.2725 15.6256 15.3937 15.5193 15.5C15.4128 15.6063 15.2948 15.6595 15.1655 15.6595C15.036 15.6595 14.918 15.6063 14.8115 15.5L11.7615 12.45C11.6743 12.3628 11.6122 12.2714 11.575 12.1758C11.5378 12.0799 11.5192 11.9809 11.5192 11.8787V7.5C11.5192 7.35833 11.5672 7.23958 11.6632 7.14375C11.7591 7.04792 11.878 7 12.02 7C12.1618 7 12.2805 7.04792 12.376 7.14375C12.4715 7.23958 12.5192 7.35833 12.5192 7.5V11.7923Z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6z"/></svg>',
  badge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.2 2.2 3.1-.4.7 3.1 2.8 1.5-1.2 2.9 1.2 2.9-2.8 1.5-.7 3.1-3.1-.4L12 19l-2.2-2.2-3.1.4-.7-3.1-2.8-1.5 1.2-2.9-1.2-2.9 2.8-1.5.7-3.1 3.1.4z"/><path d="M9 12l2 2 4-4"/></svg>',
};

const BOTTOM_NAV_ITEMS = [
  { href: '/index.html', icon: 'home' },
  { href: '/hall-of-fame.html', icon: 'badge' },
  { href: '/classement.html', icon: 'star' },
  { href: '/historique.html', icon: 'history' },
  { href: '/joueurs.html', icon: 'people' },
];

function initBottomNav(current) {
  document.body.classList.add('nav-bottom');

  const bar = document.createElement('div');
  bar.className = 'bottom-nav';
  bar.innerHTML = BOTTOM_NAV_ITEMS.map((item) => {
    const isActive = item.href === current;
    return `<a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}">${NAV_ICONS[item.icon]}</a>`;
  }).join('');

  document.body.appendChild(bar);
}

function initNav() {
  const current = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
  initBottomNav(current);
}

document.addEventListener('DOMContentLoaded', initNav);
