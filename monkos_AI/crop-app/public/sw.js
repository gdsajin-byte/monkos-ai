const CACHE_NAME = 'monkos-crop-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/crop.js',
  '/crop.css',
  '/monkos-icon.svg',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/mediapipe/face_mesh.js',
  '/mediapipe/face_mesh.binarypb',
  '/mediapipe/face_mesh_solution_packed_assets.data',
  '/mediapipe/face_mesh_solution_packed_assets_loader.js',
  '/mediapipe/face_mesh_solution_simd_wasm_bin.data',
  '/mediapipe/face_mesh_solution_simd_wasm_bin.js',
  '/mediapipe/face_mesh_solution_simd_wasm_bin.wasm',
  '/mediapipe/face_mesh_solution_wasm_bin.js',
  '/mediapipe/face_mesh_solution_wasm_bin.wasm',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
