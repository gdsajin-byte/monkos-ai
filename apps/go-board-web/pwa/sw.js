// MONK 바둑 PWA 서비스 워커 — 설치 조건 충족용. 판·엔진은 실시간이라 캐시하지 않는다(네트워크 그대로).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
