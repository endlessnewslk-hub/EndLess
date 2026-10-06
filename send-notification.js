// 📤 PUSH TRIGGER LOGIC — Add to dashboard.js (like/share handlers)
// When new like/share happens → send FCM to admin devices!

async function sendPushNotification(type, articleTitle, articleId) {
    if (!db) return;

    try {
        // 1. Get all admin FCM tokens
        const adminsSnap = await db.collection('admin_panel').get();
        const tokens = [];

        adminsSnap.docs.forEach(function(doc) {
            const data = doc.data();
            if (data.fcmToken) tokens.push(data.fcmToken);
        });

        if (!tokens.length) {
            console.log('⚠️ No admin devices subscribed');
            return;
        }

        // 2. Build message
        const messages = {
            like: {
                title: '👍 New Like!',
                body: '"' + (articleTitle || 'Article') + '" got a like'
            },
            share: {
                title: '🔗 New Share!',
                body: '"' + (articleTitle || 'Article') + '" was shared'
            },
            breaking: {
                title: '📰 Breaking News!',
                body: articleTitle || 'New article published'
            }
        };

        const msg = messages[type] || messages.like;

        // 3. Send via FCM HTTP API (v1)
        // NOTE: This needs Server Key from Firebase Console (steps below!)
        const fcmServerKey = 'YOUR_SERVER_KEY_HERE'; // ← Get from Firebase Console!

        const payload = {
            registration_ids: tokens, // Multiple devices (phone + laptop!)
            notification: {
                title: msg.title,
                body: msg.body,
                icon: '/logo-og.png',
                click_action: 'https://endlessnews.lk/?article=' + articleId
            },
            data: {
                articleId: String(articleId),
                type: type,
                url: '/?article=' + articleId
            }
        };

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'key=' + fcmServerKey
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('✅ Push sent to', tokens.length, 'devices');
        } else {
            console.error('❌ Push failed:', await response.text());
        }

    } catch (err) {
        console.error('❌ sendPushNotification error:', err);
    }
}

// 🔗 INTEGRATION: Add these calls to existing handlers in dashboard.js:
// 
// 1. In like handler (scripts.js pickReaction):
//    After submitReaction() → 
//    sendPushNotification('like', article.title, article.id);
//
// 2. In share handler (performShare):
//    After analyticsTrack('share') →
//    sendPushNotification('share', article.title, article.id);
//
// 3. In saveNewsItem (new article published):
//    After save success →
//    sendPushNotification('breaking', newsItem.title_en || newsItem.title, newsItem.id);