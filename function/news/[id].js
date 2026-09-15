// ═══════════════════════════════════════════════════════════════
// EndLess News — Article Share Page (Pages Function)
// URL: endlessnews.lk/news/ARTICLE_ID
// Crawlers → full article page with OG tags
// Humans  → redirect to main site (?article=ID opens modal)
// ═══════════════════════════════════════════════════════════════

const FIREBASE_API_KEY = 'AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA';
const PROJECT_ID = 'endless-news';
const SITE_URL = 'https://endlessnews.lk';
const FALLBACK_IMAGE = SITE_URL + '/logo-og.png';

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function str(field) {
  return (field && field.stringValue) || '';
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function isCrawler(ua) {
  ua = (ua || '').toLowerCase();
  var bots = [
    'facebookexternalhit', 'facebot', 'twitterbot',
    'telegrambot', 'whatsapp', 'linkedinbot', 'slackbot',
    'discordbot', 'googlebot', 'bingbot', 'pinterestbot'
  ];
  return bots.some(function(b) { return ua.indexOf(b) !== -1; });
}

async function getArticle(id, lang, attempts) {
  attempts = attempts || 3;
  for (var i = 0; i < attempts; i++) {
    try {
      const url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
        '/databases/(default)/documents/news/' + encodeURIComponent(id) +
        '?key=' + FIREBASE_API_KEY;
      const res = await fetch(url, { cf: { cacheTtl: 3600 } });
      if (!res.ok) { await sleep(300 * (i + 1)); continue; }
      const doc = await res.json();
      const f = doc.fields || {};
      if (!f.title && !f.title_en) return null;

      const isEn = (lang === 'en');
      const rawTitle = isEn ? (str(f.title_en) || str(f.title)) : (str(f.title) || str(f.title_en));
      let excerpt = isEn ? (str(f.excerpt_en) || str(f.excerpt)) : (str(f.excerpt) || str(f.excerpt_en));
      excerpt = excerpt || str(f.content_en) || str(f.content) || '';
      excerpt = excerpt.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (excerpt.length > 160) excerpt = excerpt.slice(0, 157) + '...';
      if (!excerpt) excerpt = isEn ? 'Read the full article on EndLess News.' : 'முழுக் கட்டுரையையும் EndLess News-ல் படிக்கவும்.';

      const img = str(f.image);
      // Base64 images → served via our image proxy path
      const ogImage = (!img || img.indexOf('data:') === 0 || img.indexOf('blob:') === 0)
        ? SITE_URL + '/news-img/' + encodeURIComponent(id)
        : (img.indexOf('http') === 0 ? img : FALLBACK_IMAGE);

      return { title: rawTitle || 'EndLess News', excerpt: excerpt, image: ogImage };
    } catch (e) {
      if (i < attempts - 1) await sleep(300 * (i + 1));
    }
  }
  return null;
}

export async function onRequestGet(context) {
  const { params, request } = context;
  const id = decodeURIComponent(params.id || '');
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') || 'ta';
  const canonicalUrl = SITE_URL + '/news/' + encodeURIComponent(id);
  const articleUrl = SITE_URL + '/?article=' + encodeURIComponent(id);

  if (!id) return Response.redirect(SITE_URL + '/', 302);

  const article = await getArticle(id, lang);

  // Article missing → generic OG + homepage redirect
  if (!article) {
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta property="og:title" content="EndLess News - World News & Analysis">' +
      '<meta property="og:description" content="Latest world news in Tamil and English">' +
      '<meta property="og:image" content="' + FALLBACK_IMAGE + '">' +
      '<meta http-equiv="refresh" content="0;url=' + SITE_URL + '/">' +
      '</head><body></body></html>';
    return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // HUMANS → main website (article modal auto-opens)
  if (!isCrawler(request.headers.get('User-Agent'))) {
    return Response.redirect(articleUrl, 302);
  }

  // CRAWLERS → OG article page
  const title = escapeHtml(article.title);
  const excerpt = escapeHtml(article.excerpt);
  const image = escapeHtml(article.image);
  const safeUrl = escapeHtml(canonicalUrl);

  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="EndLess News">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${excerpt}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${excerpt}">
  <meta name="twitter:image" content="${image}">
  <title>${title} - EndLess News</title>
</head>
<body style="font-family:-apple-system,sans-serif;background:#0a0a0f;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:20px;">
  <div>
    <h1 style="font-size:1.2rem;margin-bottom:1rem;">${title}</h1>
    <p style="color:#94a3b8;margin-bottom:1.5rem;">${excerpt}</p>
    <a href="${escapeHtml(articleUrl)}" style="color:#e11d48;font-weight:700;text-decoration:none;">Read on EndLess News →</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate'
    }
  });
}