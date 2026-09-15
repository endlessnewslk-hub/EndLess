// ═══════════════════════════════════════════════════════════════
// EndLess News — Article Image Proxy (Pages Function)
// URL: endlessnews.lk/news-img/ARTICLE_ID
// Crawlers can't read base64 data-URIs → this serves them as real images
// ═══════════════════════════════════════════════════════════════

const FIREBASE_API_KEY = 'AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA';
const PROJECT_ID = 'endless-news';
const SITE_URL = 'https://endlessnews.lk';
const FALLBACK_IMAGE = SITE_URL + '/logo-og.png';

function str(field) {
  return (field && field.stringValue) || '';
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function getArticleImage(id, attempts) {
  attempts = attempts || 3;
  for (var i = 0; i < attempts; i++) {
    try {
      const url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
        '/databases/(default)/documents/news/' + encodeURIComponent(id) +
        '?key=' + FIREBASE_API_KEY;
      const res = await fetch(url, { cf: { cacheTtl: 86400 } });
      if (!res.ok) { await sleep(300 * (i + 1)); continue; }
      const doc = await res.json();
      return str((doc.fields || {}).image);
    } catch (e) {
      if (i < attempts - 1) await sleep(300 * (i + 1));
    }
  }
  return '';
}

export async function onRequestGet(context) {
  const { params } = context;
  const id = decodeURIComponent(params.id || '');
  if (!id) return Response.redirect(FALLBACK_IMAGE, 302);

  const raw = await getArticleImage(id);

  // Base64 image → decode & serve directly
  if (raw && raw.indexOf('data:') === 0) {
    const m = raw.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
    if (!m) return Response.redirect(FALLBACK_IMAGE, 302);
    const binary = atob(m[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Response(bytes, {
      headers: {
        'Content-Type': m[1],
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }

  // External URL → redirect; missing → logo
  if (raw && raw.indexOf('http') === 0) return Response.redirect(raw, 302);
  return Response.redirect(FALLBACK_IMAGE, 302);
}