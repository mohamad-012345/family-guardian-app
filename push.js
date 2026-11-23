// Web Push helpers used by the Flutter app (see lib/cloud/push/push_web.dart).
(function () {
  window.fgPushSupported = function () {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  };
  window.fgPushPermission = function () {
    return ('Notification' in window) ? Notification.permission : 'unsupported';
  };
  window.fgIsStandalone = function () {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  };
  window.fgIsIos = function () {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };
  function keyBytes(b64) {
    var pad = '='.repeat((4 - (b64.length % 4)) % 4);
    var raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  window.fgPushSubscribe = function (vapidKey) {
    // requestPermission first: iOS only allows it directly after a tap.
    return Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') throw new Error('permission ' + perm);
      // Own scope, so it never clashes with Flutter's service worker.
      return navigator.serviceWorker.register('push-sw.js', { scope: 'push/' });
    }).then(function (reg) {
      var sw = reg.installing || reg.waiting || reg.active;
      if (!sw || sw.state === 'activated') return reg;
      return new Promise(function (resolve) {
        sw.addEventListener('statechange', function () {
          if (sw.state === 'activated') resolve(reg);
        });
      });
    }).then(function (reg) {
      return reg.pushManager.getSubscription().then(function (sub) {
        return sub || reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(vapidKey)
        });
      });
    }).then(function (sub) {
      return JSON.stringify(sub.toJSON());
    });
  };
})();
