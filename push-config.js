// 📱 PUSH NOTIFICATIONS — Firebase Cloud Messaging (FCM)
// Admin app install pannirukka devices-ku live notifications!
// Like, share, breaking news — real-time alerts!

let _messaging = null;
let _fcmToken = null;

// 1. Initialize FCM (call on admin panel load)
function initPushNotifications() {
    // Check browser support
    if (!('Notification' in window)) {
        console.log('❌ Browser notifications not supported');
        return;
    }

    // Check service worker support
    if (!('serviceWorker' in navigator)) {
        console.log('❌ Service Worker not supported');
        return;
    }

    // Register FCM service worker
    navigator.serviceWorker.register('firebase-messaging-sw.js')
        .then(function(registration) {
            console.log('✅ FCM SW registered:', registration.scope);

            // Initialize Firebase Messaging
            if (typeof firebase !== 'undefined' && firebase.messaging) {
                _messaging = firebase.messaging();

                // Request permission + get token
                requestPushPermission();
            }
        })
        .catch(function(err) {
            console.error('❌ FCM SW registration failed:', err);
        });
}

// 2. Request permission + get FCM token
async function requestPushPermission() {
    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('✅ Notification permission granted');

            // Get FCM token
            const token = await _messaging.getToken({
                vapidKey: 'BJQXH5SasiDwoBcByVa_Z6qKQsPTEsotl3KMx1hAD6YR2CAc998bN1H1Pjpf1AxV1EF3PDeXmrlTrvIud34DkRI' 
            });

            if (token) {
                _fcmToken = token;
                console.log('✅ FCM Token:', token);

                // Save token to Firestore (admin devices only!)
                await saveFCMToken(token);

                // Show success toast
                showToast('🔔 Notifications enabled!', 'success');
            }
        } else {
            console.log('❌ Notification permission denied');
            showToast('⚠️ Enable notifications in browser settings', 'error');
        }
    } catch (err) {
        console.error('❌ FCM token error:', err);
    }
}

// 3. Save token to Firestore (admin_panel collection)
async function saveFCMToken(token) {
    if (!db) return;

    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        await db.collection('admin_panel').doc(user.uid).set({
            fcmToken: token,
            device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
            enabledAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        }, { merge: true });

        console.log('✅ FCM token saved to Firestore');
    } catch (err) {
        console.error('❌ Token save failed:', err);
    }
}

// 4. Listen for foreground messages (app open-a irundha)
function listenForegroundMessages() {
    if (!_messaging) return;

    _messaging.onMessage(function(payload) {
        console.log('📨 Foreground message:', payload);

        const data = payload.data || {};
        const notif = payload.notification || {};

        // Show in-app toast (foreground-la SW trigger aaga)
        showToast(
            (notif.title || '🔔 Notification') + ': ' + (notif.body || ''),
            'success'
        );

        // Optional: play sound
        // playNotificationSound();
    });
}

// 5. Subscribe/Unsubscribe toggle (admin panel button)
async function togglePushNotifications() {
    if (!_fcmToken) {
        // First time — request permission
        await requestPushPermission();
    } else {
        // Already subscribed — confirm unsubscribe
        if (confirm('Disable push notifications?')) {
            await unsubscribePush();
        }
    }
}

async function unsubscribePush() {
    if (!_messaging || !_fcmToken) return;

    try {
        await _messaging.deleteToken(_fcmToken);
        _fcmToken = null;

        // Remove from Firestore
        const user = firebase.auth().currentUser;
        if (user && db) {
            await db.collection('admin_panel').doc(user.uid).update({
                fcmToken: firebase.firestore.FieldValue.delete()
            });
        }

        showToast('🔕 Notifications disabled', 'success');
    } catch (err) {
        console.error('❌ Unsubscribe failed:', err);
    }
}

// 6. Token refresh handler (FCM auto-refresh)
function handleTokenRefresh() {
    if (!_messaging) return;

    _messaging.onTokenRefresh(async function() {
        try {
            const newToken = await _messaging.getToken({
                vapidKey: 'BJQXH5SasiDwoBcByVa_Z6qKQsPTEsotl3KMx1hAD6YR2CAc998bN1H1Pjpf1AxV1EF3PDeXmrlTrvIud34DkRI'
            });
            _fcmToken = newToken;
            await saveFCMToken(newToken);
            console.log('🔄 FCM token refreshed');
        } catch (err) {
            console.error('❌ Token refresh failed:', err);
        }
    });
}

// 7. INIT — call this on admin panel load
document.addEventListener('DOMContentLoaded', function() {
    // Small delay — let auth settle first
    setTimeout(function() {
        initPushNotifications();
        listenForegroundMessages();
        handleTokenRefresh();
    }, 2000);
});