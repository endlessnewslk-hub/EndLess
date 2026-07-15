const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.shareArticle = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    
    const articleId = req.query.article;
    
    // No article ID = redirect to normal index
    if (!articleId) {
        return res.redirect('/index.html');
    }
    
    try {
        const doc = await admin.firestore().collection('news').doc(articleId).get();
        
        if (!doc.exists) {
            return res.redirect('/index.html');
        }
        
        const data = doc.data();
        
        // Pick title based on available language (default Tamil)
        const title = data.title || data.title_en || data.title_si || 'EndLess News';
        const excerpt = data.excerpt || data.excerpt_en || data.excerpt_si || 'Latest news article';
        const image = data.image || 'https://yourdomain.com/EndLess/logo-og.png';
        const url = `https://yourdomain.com/EndLess/?article=${articleId}`;
        
        // Send HTML with proper OG tags
        res.send(`<!DOCTYPE html>
<html lang="ta">
<head>
    <meta charset="UTF-8">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(excerpt)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:url" content="${escapeHtml(url)}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <title>${escapeHtml(title)}</title>
    <script>window.location.href = "${escapeHtml(url)}";</script>
</head>
<body>
    <p>Redirecting to article...</p>
</body>
</html>`);
        
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/index.html');
    }
});

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}