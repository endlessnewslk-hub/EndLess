// 📱 PUSH NOTIFICATIONS — merged v2 + robustness fixes
console.log('[PUSH] ✅ push-config.js LOADED!');

// 📱 PUSH NOTIFICATIONS v2 — Fixed version with MANUAL enable button
// Header profile button pakkathla "🔔" button varum — click pannalana "Allow" popup!
// Console-la ellaa status-um kaatum (F12 paarunga)

const PUSH_VAPID_KEY = 'BJQXH5SasiDwoBcByVa_Z6qKQsPTEsotl3KMx1hAD6YR2CAc998bN1H1Pjpf1AxV1EF3PDeXmrlTrvIud34DkRI';
let _messaging = null;
let _fcmToken = null;

function pushDebug(msg) {
    console.log('[PUSH] ' + msg);
}

// 1. INIT — admin panel load aana odane messaging setup
function initPushNotifications() {
    pushDebug('init started');

    if (typeof firebase === 'undefined') {
        pushDebug('❌ firebase SDK illa!');
        return;
    }
    if (!firebase.messaging) {
        pushDebug('❌ firebase-messaging-compat.js LOAD AAGALA! news88-adm.html-la add pannunga:');
        pushDebug('<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"></script>');
        return;
    }

    // Check VAPID key
    if (PUSH_VAPID_KEY === 'BJQXH5SasiDwoBcByVa_Z6qKQsPTEsotl3KMx1hAD6YR2CAc998bN1H1Pjpf1AxV1EF3PDeXmrlTrvIud34DkRI') {
        pushDebug('❌ VAPID KEY PASTE PANNALA! push-config.js-la YOUR_VAPID_KEY_HERE-a maathunga');
    }

    if (!('serviceWorker' in navigator)) {
        pushDebug('❌ Service Worker support illa');
        return;
    }

    // Register FCM service worker
    navigator.serviceWorker.register('firebase-messaging-sw.js')
        .then(function(registration) {
            pushDebug('✅ Service Worker registered');
            _messaging = firebase.messaging();
            _messaging.useServiceWorker(registration);
            addEnableNotifButton();
        })
        .catch(function(err) {
            pushDebug('❌ SW registration failed: ' + err.message);
        });
}

// 2. MANUAL BUTTON — profile button pakkathla "🔔 Enable" inject
function addEnableNotifButton() {
    if (document.getElementById('push-enable-btn')) return;
    // Profile button-yoda parent-la add pannu
    var host = document.getElementById('profile-btn');
    if (!host) { setTimeout(addEnableNotifButton, 2000); return; }

    var b = document.createElement('button');
    b.id = 'push-enable-btn';
    b.title = 'Enable notifications';
    b.style.cssText = 'width:38px;height:38px;border-radius:50%;border:1.5px solid #e5e7eb;background:#fff;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;margin-right:8px;transition:all .2s;';
    b.textContent = '🔔';
    b.addEventListener('click', function() { requestPushPermission(); });
    host.parentNode.insertBefore(b, host);

    // Already enabled na icon maathu
    if (Notification.permission === 'granted') {
        b.textContent = '🔕';
        b.title = 'Notifications enabled (click to test)';
        b.style.background = '#dcfce7';
        b.style.borderColor = '#22c55e';
    }
    pushDebug('✅ Enable button added near profile');
}

// 3. REQUEST PERMISSION — ithu dhaan "Allow" popup ah trigger pannum!
async function requestPushPermission() {
    pushDebug('Permission request...');

    if (PUSH_VAPID_KEY === 'BJQXH5SasiDwoBcByVa_Z6qKQsPTEsotl3KMx1hAD6YR2CAc998bN1H1Pjpf1AxV1EF3PDeXmrlTrvIud34DkRI') {
        alert('⚠️ VAPID KEY illama!\n\n1. Firebase Console → Project Settings → Cloud Messaging\n2. Web Push certificates → Generate key pair\n3. push-config.js-la paste pannunga');
        return;
    }

    try {
        var permission = await Notification.requestPermission();
        pushDebug('Permission: ' + permission);

        if (permission !== 'granted') {
            alert('⚠️ Notifications blocked!\nBrowser settings → Site settings → endlessnews.lk → Notifications → Allow');
            return;
        }

        var token = await _messaging.getToken({ vapidKey: PUSH_VAPID_KEY });
        pushDebug('Token: ' + (token ? token.substring(0, 30) + '...' : 'NULL'));

        if (!token) {
            alert('⚠️ Token generate aagala — Service Worker check pannunga');
            return;
        }

        _fcmToken = token;
        await saveFCMToken(token);

        var b = document.getElementById('push-enable-btn');
        if (b) { b.textContent = '🔕'; b.style.background = '#dcfce7'; b.style.borderColor = '#22c55e'; }

        alert('✅ Notifications ENABLED!\nIppo vera device-la like pannunga — notification varum! 🎉');
    } catch (err) {
        pushDebug('❌ ERROR: ' + err.message);
        alert('❌ Error: ' + err.message + '\n\nF12 → Console-la [PUSH] messages paarunga');
    }
}

// 4. Save token to Firestore
async function saveFCMToken(token) {
    if (!db || typeof firebase === 'undefined' || !firebase.auth) return;
    try {
        var user = firebase.auth().currentUser;
        if (!user) { pushDebug('❌ User not logged in'); return; }

        await db.collection('admin_panel').doc(user.uid).set({
            fcmToken: token,
            device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            enabledAt: new Date().toISOString()
        }, { merge: true });
        pushDebug('✅ Token Firestore-la saved');
    } catch (err) {
        pushDebug('❌ Save failed: ' + err.message);
    }
}

// 5. Foreground messages (app open-a irukkum bodhu)
function listenForegroundMessages() {
    if (!_messaging) return;
    _messaging.onMessage(function(payload) {
        var n = payload.notification || {};
        if (typeof showToast === 'function') {
            showToast('🔔 ' + (n.title || 'Notification') + ': ' + (n.body || ''), 'success');
        }
    });
    pushDebug('✅ Foreground listener ready');
}

// 6. AUTO-START — admin panel load aana odane
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initPushNotifications, 3000); // guard.js profile create aaga wait
        setTimeout(listenForegroundMessages, 3500);
    });
} else {
    setTimeout(initPushNotifications, 3000);
    setTimeout(listenForegroundMessages, 3500);
}