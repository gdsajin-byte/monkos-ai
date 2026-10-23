// MONK 바둑 PWA 서비스 워커(10-23)
// - 판·돌 이미지·소리·아이콘: 폰에 보관(캐시 우선)
// - 페이지(/): 보관본을 바로 띄우고 뒤에서 새 판본을 받아 둔다(다음 실행에 반영) — 터널 왕복(~1초) 없이 즉시 열림
// - 판 상태·엔진(/api/*)·리뷰: 늘 네트워크
const VERSION = 'monk-go-static-v2';
const STATIC = /^\/(skin|pack|pwa|sounds)\//;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname === '/' || u.pathname === '/index.html') {
    e.respondWith((async () => {
      const c = await caches.open(VERSION);
      const net = fetch(e.request).then(r => { if (r.ok) c.put('/', r.clone()); return r; });
      const hit = await c.match('/');
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })());
    return;
  }
  if (!STATIC.test(u.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(e.request);
    if (hit) return hit;
    const r = await fetch(e.request);
    if (r.ok) c.put(e.request, r.clone());
    return r;
  })());
});
