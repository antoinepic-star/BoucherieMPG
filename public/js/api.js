const TOKEN_KEY = 'mpg_admin_token';

function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAdminToken();
    if (!token) {
      window.location.href = '/admin/login.html';
      throw new Error('Non authentifié');
    }
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401 && auth) {
    clearAdminToken();
    window.location.href = '/admin/login.html';
    throw new Error('Session expirée');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || `Erreur ${res.status}`);
  return data;
}

const api = {
  get: (path) => apiFetch(path),
  adminLogin: (password) => apiFetch('/api/admin/login', { method: 'POST', body: { password } }),
  adminGet: (path) => apiFetch(path, { auth: true }),
  adminPost: (path, body) => apiFetch(path, { method: 'POST', body, auth: true }),
  adminPut: (path, body) => apiFetch(path, { method: 'PUT', body, auth: true }),
  adminDelete: (path) => apiFetch(path, { method: 'DELETE', auth: true }),
};
