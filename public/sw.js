/*
 * Mentoriva servis çalışanı. Bilerek çok küçük: yalnızca bağlantı yokken sayfa
 * açılırsa çevrimdışı ekranı gösterir. API, oturum ve kişisel içerik önbelleğe
 * ALINMAZ; sayfalar her zaman ağdan gelir. Yeni bir önbellek eklemeden önce
 * gizlilik metnini düşün.
 */

const CACHE = 'mentoriva-offline-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
