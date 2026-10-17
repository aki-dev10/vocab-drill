// オフライン対応: アプリ本体は通信できるときは最新版を取得して保存、できないときは保存版を使う
// 音声は大きいので、一度取得したら端末の保存版を使う
const CACHE = 'vocab-drill-v1';
const AUDIO = 'vocab-drill-audio-v2'; // 音声を作り直したら番号を上げる（古い音声を捨てる）
const FILES = ['./', './index.html', './icon.png', './manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== AUDIO).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/audio/')) {
    e.respondWith(caches.open(AUDIO).then(c => c.match(e.request).then(hit => hit || fetch(e.request.url, { cache: 'reload' }).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
