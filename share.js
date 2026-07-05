/* ═══════════════════════════════════════════════════════════════════════
   ENDLESS — CLEAN SOCIAL SHARE SYSTEM
   Simple OG-based sharing like Daily Thanthi
   ═══════════════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    // ── Configuration ──
    const SHARE_CONFIG = {
        brandName: 'EndLess News',
        brandUrl: 'https://endless-news.pages.dev',
        fallbackImage: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=1200&h=630&fit=crop'
    };

    // ── Share Page URL Generator ──
    function getSharePageUrl(articleId) {
        var idMap = {
            '1718764800001': '1',
            '1718764800002': '2',
            '1718764800003': '3'
        };
        var num = idMap[String(articleId)];
        if (num) {
            return SHARE_CONFIG.brandUrl + '/share-' + num + '.html';
        }
        return SHARE_CONFIG.brandUrl + '/?article=' + articleId;
    }

    // ── Current article being shared ──
    var currentShareArticle = null;

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    function getCurrentLang() {
        if (typeof currentLang !== 'undefined') return currentLang;
        return localStorage.getItem('gd_language') || 'ta';
    }

    function getLocalizedField(article, field) {
        var lang = getCurrentLang();
        var suffix = lang === 'ta' ? '' : '_' + lang;
        var val = article[field + suffix];
        if (val && String(val).trim()) return val;
        val = article[field + '_en'];
        if (val && String(val).trim()) return val;
        val = article[field + '_si'];
        if (val && String(val).trim()) return val;
        return article[field] || '';
    }

    function findArticleById(id) {
        if (!id) return null;
        if (typeof newsData !== 'undefined' && Array.isArray(newsData)) {
            var found = newsData.find(function(n) { return n.id == id; });
            if (found) return found;
        }
        try {
            var stored = localStorage.getItem('endless_news');
            if (stored) {
                var articles = JSON.parse(stored);
                var found = articles.find(function(n) { return n.id == id; });
                if (found) return found;
            }
        } catch (e) {}
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE OG TAGS (for when user opens article directly)
    // ═══════════════════════════════════════════════════════════════════════
    function updatePageOGTags(article) {
        var title = getLocalizedField(article, 'title') || 'EndLess News';
        var excerpt = getLocalizedField(article, 'excerpt') || '';
        var image = article.image || SHARE_CONFIG.fallbackImage;
        var url = getSharePageUrl(article.id);

        // Remove old OG tags
        document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[name="description"]').forEach(function(tag) {
            tag.remove();
        });

        // Add new OG tags
        var tags = [
            { property: 'og:title', content: title },
            { property: 'og:description', content: excerpt },
            { property: 'og:image', content: image },
            { property: 'og:image:width', content: '1200' },
            { property: 'og:image:height', content: '630' },
            { property: 'og:url', content: url },
            { property: 'og:type', content: 'article' },
            { property: 'og:site_name', content: 'EndLess News' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: excerpt },
            { name: 'twitter:image', content: image },
            { name: 'description', content: excerpt }
        ];

        tags.forEach(function(tag) {
            var meta = document.createElement('meta');
            if (tag.property) meta.setAttribute('property', tag.property);
            if (tag.name) meta.setAttribute('name', tag.name);
            meta.setAttribute('content', tag.content);
            document.head.appendChild(meta);
        });

        document.title = title + ' | EndLess News';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SHARE FUNCTIONS — All use share page URL for OG preview
    // ═══════════════════════════════════════════════════════════════════════

    // ── WhatsApp ──
    window.shareToWhatsApp = function(articleId) {
        var article = findArticleById(articleId);
        if (!article) return;

        var title = getLocalizedField(article, 'title') || 'EndLess News';
        var url = getSharePageUrl(article.id);

        // Daily Thanthi style: Image + Title + URL
        var text = '*📰 ' + title + '*\n\n' + url;

        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    };

    // ── Facebook ──
    window.shareToFacebook = function(articleId) {
        var article = findArticleById(articleId);
        if (!article) return;

        var url = encodeURIComponent(getSharePageUrl(article.id));
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank');
    };

    // ── X / Twitter ──
    window.shareToX = function(articleId) {
        var article = findArticleById(articleId);
        if (!article) return;

        var title = getLocalizedField(article, 'title') || 'EndLess News';
        var url = getSharePageUrl(article.id);

        var text = encodeURIComponent('📰 ' + title + '\n\n' + url);
        window.open('https://twitter.com/intent/tweet?text=' + text, '_blank');
    };

    // ── Messenger ──
    window.shareToMessenger = function(articleId) {
        var article = findArticleById(articleId);
        if (!article) return;

        var url = encodeURIComponent(getSharePageUrl(article.id));
        window.open('https://www.facebook.com/dialog/send?link=' + url + '&app_id=363216005373&redirect_uri=' + encodeURIComponent(SHARE_CONFIG.brandUrl), '_blank');
    };

    // ── Telegram ──
    window.shareToTelegram = function(articleId) {
        var article = findArticleById(articleId);
        if (!article) return;

        var title = getLocalizedField(article, 'title') || 'EndLess News';
        var url = encodeURIComponent(getSharePageUrl(article.id));
        var text = encodeURIComponent('📰 ' + title);

        window.open('https://t.me/share/url?url=' + url + '&text=' + text, '_blank');
    };

    // ── Copy Link ──
    window.copyShareLink = function(articleId) {
        var article = findArticleById(articleId);
        if (!article) return;

        var title = getLocalizedField(article, 'title') || 'EndLess News';
        var url = getSharePageUrl(article.id);
        var text = '📰 ' + title + '\n\n' + url;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showToast('Link copied!');
            });
        } else {
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Link copied!');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SIMPLE SHARE OVERLAY (Daily Thanthi style preview)
    // ═══════════════════════════════════════════════════════════════════════
    window.openShareOverlay = function(articleId) {
        var article = findArticleById(articleId);
        if (!article) return;

        currentShareArticle = article;
        updatePageOGTags(article);

        // Remove existing overlay
        var existing = document.getElementById('share-overlay');
        if (existing) existing.remove();

        var title = getLocalizedField(article, 'title') || 'EndLess News';
        var excerpt = getLocalizedField(article, 'excerpt') || '';
        var image = article.image || SHARE_CONFIG.fallbackImage;
        var url = getSharePageUrl(article.id);

        var overlay = document.createElement('div');
        overlay.id = 'share-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
        overlay.innerHTML = `
            <div style="max-width:400px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;position:relative;">
                <button onclick="closeShareOverlay()" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.5);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;z-index:10;">&times;</button>

                <!-- Preview Card (Daily Thanthi style) -->
                <div style="background:#fff;border-radius:12px;margin:16px;overflow:hidden;">
                    <img src="${image}" style="width:100%;height:200px;object-fit:cover;display:block;" alt="${title}">
                    <div style="padding:16px;">
                        <div style="font-size:12px;color:#666;margin-bottom:8px;">📰 EndLess News</div>
                        <div style="font-size:16px;font-weight:bold;color:#000;line-height:1.4;margin-bottom:8px;">${title}</div>
                        <div style="font-size:13px;color:#444;line-height:1.5;">${excerpt.substring(0, 120)}${excerpt.length > 120 ? '...' : ''}</div>
                        <div style="font-size:12px;color:#888;margin-top:12px;">🔗 ${url.replace('https://', '')}</div>
                    </div>
                </div>

                <!-- Share Buttons -->
                <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;padding:16px;">
                    <button onclick="shareToWhatsApp('${article.id}')" style="background:#25D366;border:none;border-radius:12px;padding:12px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span style="font-size:11px;">WhatsApp</span>
                    </button>
                    <button onclick="shareToFacebook('${article.id}')" style="background:#1877F2;border:none;border-radius:12px;padding:12px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span style="font-size:11px;">Facebook</span>
                    </button>
                    <button onclick="shareToX('${article.id}')" style="background:#000;border:none;border-radius:12px;padding:12px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        <span style="font-size:11px;">X</span>
                    </button>
                    <button onclick="shareToMessenger('${article.id}')" style="background:#0084FF;border:none;border-radius:12px;padding:12px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.744 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.889-3.26-6.559 6.963z"/></svg>
                        <span style="font-size:11px;">Messenger</span>
                    </button>
                    <button onclick="shareToTelegram('${article.id}')" style="background:#26A5E4;border:none;border-radius:12px;padding:12px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                        <span style="font-size:11px;">Telegram</span>
                    </button>
                    <button onclick="copyShareLink('${article.id}')" style="background:#e11d48;border:none;border-radius:12px;padding:12px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span style="font-size:11px;">Copy</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeShareOverlay();
        });
    };

    window.closeShareOverlay = function() {
        var overlay = document.getElementById('share-overlay');
        if (overlay) overlay.remove();
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TOAST
    // ═══════════════════════════════════════════════════════════════════════
    function showToast(message) {
        var existing = document.getElementById('share-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.id = 'share-toast';
        toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;z-index:10000;font-size:14px;opacity:0;transition:opacity 0.3s;';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() { toast.style.opacity = '1'; }, 10);
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { toast.remove(); }, 300);
        }, 2000);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INJECT SHARE BUTTON INTO ARTICLE
    // ═══════════════════════════════════════════════════════════════════════
    window.injectShareButton = function(articleId, container) {
        if (!container || container.querySelector('.article-share-btn')) return;

        var btn = document.createElement('button');
        btn.className = 'article-share-btn';
        btn.dataset.articleId = articleId;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> <span>Share</span>';
        btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:#e11d48;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;';
        btn.onclick = function() { openShareOverlay(articleId); };

        container.appendChild(btn);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════
    function init() {
        // Listen for share button clicks
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.article-share-btn');
            if (btn) {
                e.stopPropagation();
                var id = btn.dataset.articleId;
                if (id) openShareOverlay(id);
            }
        });

        console.log('📤 EndLess Share System initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();