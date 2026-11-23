// Service worker that shows family alerts (trip started, late, arrived).
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  var level = d.level || 0;
  e.waitUntil(self.registration.showNotification(d.title || 'أمان عائلتي', {
    body: d.body || '',
    icon: 'icons/Icon-192.png',
    badge: 'icons/Icon-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    requireInteraction: level >= 2,
    vibrate: level >= 3 ? [400, 150, 400, 150, 800] : level >= 1 ? [250, 120, 250] : [150],
    dir: 'rtl',
    lang: 'ar'
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var appUrl = new URL('./', self.location).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ws) {
    for (var i = 0; i < ws.length; i++) {
      if (ws[i].url.indexOf(appUrl) === 0 && 'focus' in ws[i]) return ws[i].focus();
    }
    return self.clients.openWindow(appUrl);
  }));
});
