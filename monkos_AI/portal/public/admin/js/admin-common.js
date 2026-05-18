/* admin-common.js — MONKOS Admin 공통 유틸 (ESM, v2.0) */

export function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = isError ? 'var(--danger)' : 'var(--success)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

export async function authFetch(url, options = {}) {
  const r = await fetch(url, { credentials: 'include', ...options });
  if (r.status === 401) { location.href = '/admin/'; return null; }
  return r;
}
