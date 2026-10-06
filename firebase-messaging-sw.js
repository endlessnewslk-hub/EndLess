// 🔥 Firebase Cloud Messaging Service Worker
// Receives push notifications even when admin app is CLOSED!
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA",
    authDomain: "endless-news.firebaseapp.com",
    projectId: "endless-news",
    storageBucket: "endless-news.firebasestorage.app",
    messagingSenderId: "363216005373",
    appId: "1:363216005373:web:143fb950fb04dfc1cb7694"
});

const messaging = firebase.messaging();

// Background message handler (app closed/minimized)
messaging.onBackgroundMessage(function(payload) {
    console.log('[SW] Background message:', payload);
    const data = payload.data || {};
    const notif = payload.notification || {};

    const title = notif.title || data.title || '🔔 EndLess News';
    const body = notif.body || data.body || 'New activity!';
    const articleId = data.articleId || '';
    const type = data.type || 'like';

    const icons = { like: '👍', share: '🔗', view: '👁️', news: '📰' };
    const icon = icons[type] || '🔔';

    const options = {
        body: icon + ' ' + body,
        icon: '/logo-og.png',
        badge: '/logo-og.png',
        tag: 'endless-' + type + '-' + articleId, // group same type+article
        renotify: true,
        data: { articleId: articleId, url: '/?article=' + articleId },
        vibrate: [200, 100, 200],
        requireInteraction: false
    };

    return self.registration.showNotification(title, options);
});

// Notification click → open article
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const url = event.notification.data && event.notification.data.url 
        ? event.notification.data.url 
        : '/news88-adm.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Already open? Focus it
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.includes('endlessnews.lk') && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Not open? Open new
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Install/activate
self.addEventListener('install', function(e) {
    console.log('[SW] FCM SW installed');
    self.skipWaiting();
});
self.addEventListener('activate', function(e) {
    console.log('[SW] FCM SW activated');
    e.waitUntil(clients.claim());
});