// MONK 바둑 PWA 서비스 워커(10-23) — 판·돌 이미지·소리·아이콘은 폰에 보관(캐시 우선), 판 상태·엔진·페이지는 늘 네트워크.
// 그래서 앱을 열 때 판이 흰색으로 보였다 채색되는 지연이 사라진다. 디자인 팩을 바꾸면 VERSION을 올린다.
const VERSION = 'monk-go-static-v1';
const STATIC = /^\/(skin|pack|pwa|sounds)\//;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !STATIC.test(u.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(e.request);
    if (hit) return hit;
    const r = await fetch(e.request);
    if (r.ok) c.put(e.request, r.clone());
    return r;
  })());
});
