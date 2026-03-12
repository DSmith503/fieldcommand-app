const BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function api(path, opts = {}) {
  const token = localStorage.getItem('fc_token');
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { ...opts, headers: { ...headers, ...opts.headers } });
  if (res.status === 401 && !path.includes('/auth/login')) { clearAuth(); window.location.href = '/login'; throw new ApiError('Session expired', 401); }
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new ApiError(b.error || 'HTTP ' + res.status, res.status); }
  return res.json();
}

export const getUser = () => { try { return JSON.parse(localStorage.getItem('fc_user')); } catch { return null; } };
export const isAdmin = () => getUser()?.role === 'admin';
export const setAuth = (token, user) => { localStorage.setItem('fc_token', token); localStorage.setItem('fc_user', JSON.stringify(user)); };
export const clearAuth = () => { localStorage.removeItem('fc_token'); localStorage.removeItem('fc_user'); };
export const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
export const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
export const fmtMoney = n => n != null ? '$' + Number(n).toLocaleString() : '';
export const initials = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase() : '?';
export const cn = (...c) => c.filter(Boolean).join(' ');
