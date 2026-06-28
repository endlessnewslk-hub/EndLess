/* ═══════════════════════════════════════
   ENDLESS — RICH SOCIAL SHARE SYSTEM
   Open Graph / Instant Article Style Share Cards
   Supports: Facebook, X (Twitter), WhatsApp, Messenger, Telegram, Copy Link
   Multi-language: Tamil, English, Sinhala
   ═══════════════════════════════════════ */

(function() {
    'use strict';

    // ── Configuration ──
    const SHARE_CONFIG = {
        brandName: 'EndLess News',
        brandUrl: (function() {
            var url = window.location.origin + window.location.pathname;
            return url.replace(/\/+$/, '');
        })(),
        brandLogo: window.location.origin + '/favicon.ico',
        maxTitleLength: 120,
        maxExcerptLength: 160
    };

    // ── Share Text Translations ──
    const SHARE_I18N = {
        ta: {
            share_article: 'பகிர்',
            share_this_article: 'இந்த கட்டுரையைப் பகிர்',
            facebook: 'பேஸ்புக்',
            x: 'எக்ஸ்',
            whatsapp: 'வாட்ஸ்அப்',
            messenger: 'மெசஞ்சர்',
            telegram: 'டெலிகிராம்',
            copy: 'நகலெடு',
            copied: 'நகலெடுக்கப்பட்டது!',
            link_copied: 'இணைப்பு கிளிப்போர்டில் நகலெடுக்கப்பட்டது!',
            copy_failed: 'நகலெடுக்க முடியவில்லை',
            opening_facebook: 'பேஸ்புக் திறக்கிறது...',
            opening_x: 'எக்ஸ் திறக்கிறது...',
            opening_whatsapp: 'வாட்ஸ்அப் திறக்கிறது...',
            opening_messenger: 'மெசஞ்சர் திறக்கிறது...',
            opening_telegram: 'டெலிகிராம் திறக்கிறது...',
            shared_from: 'இதிலிருந்து பகிரப்பட்டது',
            read_more: 'மேலும் படிக்க:',
            via: 'வழியாக',
            share_preview: 'பகிர்வு முன்னோட்டம்',
            news: 'செய்திகள்',
            breaking: 'உடனடி செய்தி',
            trending: 'பிரபலமானவை'
        },
        en: {
            share_article: 'Share',
            share_this_article: 'Share this article',
            facebook: 'Facebook',
            x: 'X',
            whatsapp: 'WhatsApp',
            messenger: 'Messenger',
            telegram: 'Telegram',
            copy: 'Copy',
            copied: 'Copied!',
            link_copied: 'Link copied to clipboard!',
            copy_failed: 'Failed to copy',
            opening_facebook: 'Opening Facebook...',
            opening_x: 'Opening X...',
            opening_whatsapp: 'Opening WhatsApp...',
            opening_messenger: 'Opening Messenger...',
            opening_telegram: 'Opening Telegram...',
            shared_from: 'Shared from',
            read_more: 'Read more:',
            via: 'via',
            share_preview: 'Share Preview',
            news: 'News',
            breaking: 'Breaking',
            trending: 'Trending'
        },
        si: {
            share_article: 'බෙදාගන්න',
            share_this_article: 'මෙම ලිපිය බෙදාගන්න',
            facebook: 'ෆේස්බුක්',
            x: 'එක්ස්',
            whatsapp: 'වට්ස්ඇප්',
            messenger: 'මැසෙන්ජර්',
            telegram: 'ටෙලිග්‍රෑම්',
            copy: 'පිටපත් කරන්න',
            copied: 'පිටපත් කරන ලදී!',
            link_copied: 'සබැඳිය පසුරු පුවරුවට පිටපත් කරන ලදී!',
            copy_failed: 'පිටපත් කිරීමට අසමත් විය',
            opening_facebook: 'ෆේස්බුක් විවෘත කරමින්...',
            opening_x: 'එක්ස් විවෘත කරමින්...',
            opening_whatsapp: 'වට්ස්ඇප් විවෘත කරමින්...',
            opening_messenger: 'මැසෙන්ජර් විවෘත කරමින්...',
            opening_telegram: 'ටෙලිග්‍රෑම් විවෘත කරමින්...',
            shared_from: 'වෙතින් බෙදාගත්තේ',
            read_more: 'තවත් කියවන්න:',
            via: 'මගින්',
            share_preview: 'බෙදාගැනීමේ පෙරදසුන',
            news: 'පුවත්',
            breaking: 'අලුත්ම',
            trending: 'ජනප්‍රිය'
        }
    };

    // ── Current article being shared ──
    let currentShareArticle = null;

    // ═══════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════
    function getCurrentLang() {
        if (typeof currentLang !== 'undefined') return currentLang;
        return localStorage.getItem('gd_language') || 'ta';
    }

    function getShareText(key) {
        var lang = getCurrentLang();
        if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            return TRANSLATIONS[lang][key];
        }
        if (SHARE_I18N[lang] && SHARE_I18N[lang][key]) {
            return SHARE_I18N[lang][key];
        }
        return SHARE_I18N.en[key] || key;
    }

    function getLocalizedField(article, field) {
        var lang = getCurrentLang();
        var suffix = lang === 'ta' ? '' : '_' + lang;
        var val = article[field + suffix];
        if (val && String(val).trim()) return val;
        // Fallback chain
        val = article[field + '_en'];
        if (val && String(val).trim()) return val;
        val = article[field + '_si'];
        if (val && String(val).trim()) return val;
        return article[field] || '';
    }

    function formatShareDate(dateStr) {
        if (!dateStr) return '';
        var date = new Date(dateStr);
        var lang = getCurrentLang();
        var options = { day: 'numeric', month: 'long', year: 'numeric' };

        if (lang === 'ta') return date.toLocaleDateString('ta-IN', options);
        if (lang === 'si') return date.toLocaleDateString('si-LK', options);
        return date.toLocaleDateString('en-US', options);
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ── SVG Icons (Official Logos) ──
    var ICONS = {
        facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
        messenger: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.744 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.889-3.26-6.559 6.963z"/></svg>',
        telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
        copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
        calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
        trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'
    };

    // ═══════════════════════════════════════
    // CREATE SHARE OVERLAY HTML
    // ═══════════════════════════════════════
    function createShareOverlay() {
        if (document.getElementById('share-overlay')) return;

        var overlay = document.createElement('div');
        overlay.id = 'share-overlay';
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-container">
                <div class="share-header">
                    <button class="share-close" onclick="closeShareOverlay()" aria-label="Close">&times;</button>
                    <div class="share-brand">
                        <div class="share-brand-icon">E</div>
                        <div class="share-brand-text">End<span>Less</span></div>
                    </div>
                </div>

                <div class="share-preview-section">
                    <div class="share-preview-label" data-share-key="share_preview">Share Preview</div>

                    <div class="rich-share-card" id="share-card-preview">
                        <div class="rich-card-image-wrap">
                            <img class="rich-card-image" id="share-preview-image" src="" alt="" loading="eager">
                            <div class="rich-card-image-overlay">
                                <div class="rich-card-badge" id="share-preview-badge" style="display:none;">
                                    <span class="rich-badge-icon">🔥</span>
                                    <span id="share-preview-badge-text">Trending</span>
                                </div>
                            </div>
                        </div>

                        <div class="rich-card-body">
                            <div class="rich-card-source">
                                <div class="rich-source-logo">
                                    <span class="rich-logo-text">E</span>
                                </div>
                                <div class="rich-source-info">
                                    <span class="rich-source-name">ENDLESS NEWS</span>
                                    <span class="rich-source-verified">✓ Verified</span>
                                </div>
                            </div>

                            <h3 class="rich-card-title" id="share-preview-title"></h3>

                            <p class="rich-card-excerpt" id="share-preview-excerpt"></p>

                            <div class="rich-card-meta">
                                <span class="rich-meta-item">
                                    ${ICONS.calendar}
                                    <span id="share-preview-date"></span>
                                </span>
                                <span class="rich-meta-item" id="share-preview-category-wrap">
                                    <span class="rich-category-dot"></span>
                                    <span id="share-preview-category"></span>
                                </span>
                                <span class="rich-meta-item">
                                    ${ICONS.eye}
                                    <span>2.4K views</span>
                                </span>
                            </div>

                            <div class="rich-card-link">
                                ${ICONS.link}
                                <span id="share-preview-url"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="share-actions">
                    <button class="share-btn share-btn-facebook" onclick="shareToFacebook()">
                        <div class="share-btn-icon">${ICONS.facebook}</div>
                        <span class="share-btn-label" data-share-key="facebook">Facebook</span>
                    </button>
                    <button class="share-btn share-btn-x" onclick="shareToX()">
                        <div class="share-btn-icon">${ICONS.x}</div>
                        <span class="share-btn-label" data-share-key="x">X</span>
                    </button>
                    <button class="share-btn share-btn-whatsapp" onclick="shareToWhatsApp()">
                        <div class="share-btn-icon">${ICONS.whatsapp}</div>
                        <span class="share-btn-label" data-share-key="whatsapp">WhatsApp</span>
                    </button>
                    <button class="share-btn share-btn-messenger" onclick="shareToMessenger()">
                        <div class="share-btn-icon">${ICONS.messenger}</div>
                        <span class="share-btn-label" data-share-key="messenger">Messenger</span>
                    </button>
                    <button class="share-btn share-btn-telegram" onclick="shareToTelegram()">
                        <div class="share-btn-icon">${ICONS.telegram}</div>
                        <span class="share-btn-label" data-share-key="telegram">Telegram</span>
                    </button>
                    <button class="share-btn share-btn-copy" onclick="copyShareLink()">
                        <div class="share-btn-icon" id="copy-icon">${ICONS.copy}</div>
                        <span class="share-btn-label" id="copy-label" data-share-key="copy">Copy</span>
                    </button>
                </div>

                <div class="share-footer">
                    <p>
                        <span class="logo-mini">E</span>
                        <span data-share-key="shared_from">Shared from</span> <strong>EndLess</strong> — World News & Analysis
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeShareOverlay();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeShareOverlay();
        });
    }

    // ═══════════════════════════════════════
    // SHOW SHARE OVERLAY
    // ═══════════════════════════════════════
    window.openShareOverlay = function(articleId) {
        var article = findArticleById(articleId);
        if (!article) {
            console.warn('Share: Article not found', articleId);
            return;
        }

        currentShareArticle = article;
        createShareOverlay();
        updateSharePreview(article);
        updateShareLabels();
        updateOpenGraphTags(article);

        var overlay = document.getElementById('share-overlay');
        if (overlay) {
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    function updateShareLabels() {
        document.querySelectorAll('[data-share-key]').forEach(function(el) {
            var key = el.dataset.shareKey;
            el.textContent = getShareText(key);
        });
    }

    // ═══════════════════════════════════════
    // UPDATE OPEN GRAPH META TAGS
    // ═══════════════════════════════════════
    function updateOpenGraphTags(article) {
        var title = getLocalizedField(article, 'title') || 'EndLess News';
        var excerpt = getLocalizedField(article, 'excerpt') || '';
        var image = article.image || 'https://via.placeholder.com/1200x630?text=EndLess+News';
        var url = SHARE_CONFIG.brandUrl + '?article=' + article.id;
        var category = getLocalizedField(article, 'category') || 'News';

        // Remove existing OG tags
        document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[name="description"]').forEach(function(tag) {
            tag.remove();
        });

        // Create new OG tags
        var ogTags = [
            { property: 'og:title', content: title },
            { property: 'og:description', content: excerpt },
            { property: 'og:image', content: image },
            { property: 'og:image:width', content: '1200' },
            { property: 'og:image:height', content: '630' },
            { property: 'og:image:alt', content: title },
            { property: 'og:url', content: url },
            { property: 'og:type', content: 'article' },
            { property: 'og:site_name', content: 'EndLess News' },
            { property: 'og:locale', content: getCurrentLang() === 'ta' ? 'ta_IN' : getCurrentLang() === 'si' ? 'si_LK' : 'en_US' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: excerpt },
            { name: 'twitter:image', content: image },
            { name: 'twitter:image:alt', content: title },
            { name: 'twitter:site', content: '@EndLessNews' },
            { name: 'description', content: excerpt }
        ];

        ogTags.forEach(function(tag) {
            var meta = document.createElement('meta');
            if (tag.property) meta.setAttribute('property', tag.property);
            if (tag.name) meta.setAttribute('name', tag.name);
            meta.setAttribute('content', tag.content);
            document.head.appendChild(meta);
        });

        // Update document title
        document.title = title + ' | EndLess News';
    }

    // ═══════════════════════════════════════
    // CLOSE SHARE OVERLAY
    // ═══════════════════════════════════════
    window.closeShareOverlay = function() {
        var overlay = document.getElementById('share-overlay');
        if (overlay) {
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }

        var copyBtn = document.querySelector('.share-btn-copy');
        var copyIcon = document.getElementById('copy-icon');
        var copyLabel = document.getElementById('copy-label');
        if (copyBtn) copyBtn.classList.remove('copied');
        if (copyIcon) copyIcon.innerHTML = ICONS.copy;
        if (copyLabel) copyLabel.textContent = getShareText('copy');
    };

    // ═══════════════════════════════════════
    // UPDATE SHARE PREVIEW (Rich Card Style)
    // ═══════════════════════════════════════
    function updateSharePreview(article) {
        var title = getLocalizedField(article, 'title') || 'EndLess News';
        var excerpt = getLocalizedField(article, 'excerpt') || '';
        var image = article.image || 'https://via.placeholder.com/800x400?text=EndLess+News';
        var url = SHARE_CONFIG.brandUrl + '?article=' + article.id;
        var date = formatShareDate(article.date);
        var category = getLocalizedField(article, 'category') || getShareText('news');
        var isTrending = article.trending || false;

        // Image
        var imgEl = document.getElementById('share-preview-image');
        if (imgEl) {
            imgEl.src = image;
            imgEl.alt = title;
        }

        // Badge
        var badgeEl = document.getElementById('share-preview-badge');
        var badgeTextEl = document.getElementById('share-preview-badge-text');
        if (badgeEl && badgeTextEl) {
            if (isTrending) {
                badgeEl.style.display = 'inline-flex';
                badgeTextEl.textContent = getShareText('trending');
            } else {
                badgeEl.style.display = 'none';
            }
        }

        // Title
        var titleEl = document.getElementById('share-preview-title');
        if (titleEl) {
            titleEl.textContent = title.length > SHARE_CONFIG.maxTitleLength 
                ? title.substring(0, SHARE_CONFIG.maxTitleLength) + '...' 
                : title;
        }

        // Excerpt
        var excerptEl = document.getElementById('share-preview-excerpt');
        if (excerptEl) {
            excerptEl.textContent = excerpt.length > SHARE_CONFIG.maxExcerptLength 
                ? excerpt.substring(0, SHARE_CONFIG.maxExcerptLength) + '...' 
                : excerpt;
        }

        // Date
        var dateEl = document.getElementById('share-preview-date');
        if (dateEl) dateEl.textContent = date;

        // Category
        var catEl = document.getElementById('share-preview-category');
        if (catEl) catEl.textContent = category;

        // URL
        var urlEl = document.getElementById('share-preview-url');
        if (urlEl) urlEl.textContent = url;
    }

    // ═══════════════════════════════════════
    // FIND ARTICLE BY ID
    // ═══════════════════════════════════════
    function findArticleById(id) {
        if (id === null || id === undefined || id === '') return null;

        // Check global newsData first
        if (typeof newsData !== 'undefined' && Array.isArray(newsData)) {
            var found = newsData.find(function(n) { return n.id == id; });
            if (found) return found;
        }

        // Check localStorage
        try {
            var stored = localStorage.getItem('endless_news');
            if (stored) {
                var articles = JSON.parse(stored);
                var found = articles.find(function(n) { return n.id == id; });
                if (found) return found;
            }
        } catch (e) {
            console.warn('Share: Could not read localStorage');
        }

        return null;
    }

    // ═══════════════════════════════════════
    // GENERATE RICH SHARE TEXT
    // ═══════════════════════════════════════
    function generateShareText(article, platform) {
        var lang = getCurrentLang();
        var title = getLocalizedField(article, 'title') || 'EndLess News';
        var excerpt = getLocalizedField(article, 'excerpt') || '';
        var url = SHARE_CONFIG.brandUrl + '?article=' + article.id;
        var category = getLocalizedField(article, 'category') || 'News';
        var readMore = getShareText('read_more');
        var via = getShareText('via');

        if (platform === 'facebook') {
            return title + '\n\n' + excerpt + '\n\n🏷️ ' + category + '\n\n' + readMore + ' ' + url + '\n\n' + via + ' EndLess News 📰';
        }

        if (platform === 'x') {
            var shortExcerpt = excerpt.substring(0, 100) + (excerpt.length > 100 ? '...' : '');
            return title + '\n\n' + shortExcerpt + '\n\n🔗 ' + url + '\n\n' + via + ' @EndLessNews';
        }

        if (platform === 'whatsapp') {
            return '*📰 ' + title + '*\n\n_' + excerpt + '_\n\n🏷️ *' + category + '* | EndLess News\n\n' + readMore + ' 👇\n' + url;
        }

        if (platform === 'messenger') {
            return title + '\n\n' + excerpt + '\n\n🏷️ ' + category + ' | EndLess News\n\n' + readMore + ' ' + url;
        }

        if (platform === 'telegram') {
            return '📰 <b>' + title + '</b>\n\n' + excerpt + '\n\n🏷️ ' + category + ' | EndLess News\n\n' + readMore + ' ' + url;
        }

        if (platform === 'copy') {
            return '📰 ' + title + '\n\n' + excerpt + '\n\n🏷️ ' + category + ' | EndLess News\n📅 ' + formatShareDate(article.date) + '\n\n' + readMore + ' ' + url;
        }

        return title + ' — ' + url;
    }

    // ═══════════════════════════════════════
    // SHARE TO FACEBOOK
    // ═══════════════════════════════════════
    window.shareToFacebook = function() {
        if (!currentShareArticle) return;

        var url = encodeURIComponent(SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id);
        var title = encodeURIComponent(getLocalizedField(currentShareArticle, 'title') || '');
        var description = encodeURIComponent(getLocalizedField(currentShareArticle, 'excerpt') || '');
        var image = encodeURIComponent(currentShareArticle.image || '');

        var shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + url + 
            '&quote=' + encodeURIComponent(generateShareText(currentShareArticle, 'facebook')) +
            '&picture=' + image + '&title=' + title + '&description=' + description;

        openShareWindow(shareUrl, 'Share on Facebook');
        showShareToast(getShareText('opening_facebook'), ICONS.facebook);
    };

    // ═══════════════════════════════════════
    // SHARE TO X (TWITTER)
    // ═══════════════════════════════════════
    window.shareToX = function() {
        if (!currentShareArticle) return;

        var url = encodeURIComponent(SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id);
        var text = encodeURIComponent(generateShareText(currentShareArticle, 'x'));

        var shareUrl = 'https://twitter.com/intent/tweet?text=' + text + '&url=' + url;

        openShareWindow(shareUrl, 'Share on X');
        showShareToast(getShareText('opening_x'), ICONS.x);
    };

    // ═══════════════════════════════════════
    // SHARE TO WHATSAPP
    // ═══════════════════════════════════════
    window.shareToWhatsApp = function() {
        if (!currentShareArticle) return;

        var text = encodeURIComponent(generateShareText(currentShareArticle, 'whatsapp'));
        var shareUrl = 'https://wa.me/?text=' + text;

        openShareWindow(shareUrl, 'Share on WhatsApp');
        showShareToast(getShareText('opening_whatsapp'), ICONS.whatsapp);
    };

    // ═══════════════════════════════════════
    // SHARE TO MESSENGER
    // ═══════════════════════════════════════
    window.shareToMessenger = function() {
        if (!currentShareArticle) return;

        var url = encodeURIComponent(SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id);
        var shareUrl = 'https://www.facebook.com/dialog/send?link=' + url + '&app_id=363216005373&redirect_uri=' + encodeURIComponent(SHARE_CONFIG.brandUrl);

        openShareWindow(shareUrl, 'Share on Messenger');
        showShareToast(getShareText('opening_messenger'), ICONS.messenger);
    };

    // ═══════════════════════════════════════
    // SHARE TO TELEGRAM
    // ═══════════════════════════════════════
    window.shareToTelegram = function() {
        if (!currentShareArticle) return;

        var url = encodeURIComponent(SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id);
        var text = encodeURIComponent(getLocalizedField(currentShareArticle, 'title') || 'EndLess News');

        var shareUrl = 'https://t.me/share/url?url=' + url + '&text=' + text;

        openShareWindow(shareUrl, 'Share on Telegram');
        showShareToast(getShareText('opening_telegram'), ICONS.telegram);
    };

    // ═══════════════════════════════════════
    // COPY SHARE LINK
    // ═══════════════════════════════════════
    window.copyShareLink = function() {
        if (!currentShareArticle) return;

        var richText = generateShareText(currentShareArticle, 'copy');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(richText).then(function() {
                showCopySuccess();
            }).catch(function() {
                fallbackCopy(richText);
            });
        } else {
            fallbackCopy(richText);
        }
    };

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 999999);

        try {
            document.execCommand('copy');
            showCopySuccess();
        } catch (err) {
            showShareToast(getShareText('copy_failed'), '❌');
        }

        document.body.removeChild(textarea);
    }

    function showCopySuccess() {
        var copyBtn = document.querySelector('.share-btn-copy');
        var copyIcon = document.getElementById('copy-icon');
        var copyLabel = document.getElementById('copy-label');

        if (copyBtn) copyBtn.classList.add('copied');
        if (copyIcon) copyIcon.innerHTML = ICONS.check;
        if (copyLabel) copyLabel.textContent = getShareText('copied');

        showShareToast(getShareText('link_copied'), ICONS.check);

        setTimeout(function() {
            if (copyBtn) copyBtn.classList.remove('copied');
            if (copyIcon) copyIcon.innerHTML = ICONS.copy;
            if (copyLabel) copyLabel.textContent = getShareText('copy');
        }, 2000);
    }

    // ═══════════════════════════════════════
    // OPEN SHARE WINDOW
    // ═══════════════════════════════════════
    function openShareWindow(url, title) {
        var width = 600;
        var height = 600;
        var left = (window.innerWidth - width) / 2;
        var top = (window.innerHeight - height) / 2;

        window.open(url, title, 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',scrollbars=yes,resizable=yes,status=yes');
    }

    // ═══════════════════════════════════════
    // SHOW TOAST NOTIFICATION
    // ═══════════════════════════════════════
    function showShareToast(message, iconHtml) {
        var existing = document.getElementById('share-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.id = 'share-toast';
        toast.className = 'share-toast';

        var isSvg = typeof iconHtml === 'string' && iconHtml.indexOf('<svg') !== -1;
        toast.innerHTML = `
            <span class="share-toast-icon ${isSvg ? 'share-toast-svg' : ''}">${iconHtml}</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('show');
        });

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 400);
        }, 2500);
    }

    // ═══════════════════════════════════════
    // ADD SHARE BUTTONS TO ARTICLES
    // ═══════════════════════════════════════
    function addShareButtonsToArticles() {
        // Listen for clicks on article cards
        var newsGrid = document.getElementById('news-grid');
        if (newsGrid) {
            newsGrid.addEventListener('click', function(e) {
                var shareBtn = e.target.closest('.article-share-btn');
                if (shareBtn) {
                    e.stopPropagation();
                    var articleId = shareBtn.dataset.articleId;
                    if (articleId) {
                        openShareOverlay(articleId);
                    }
                }
            });
        }

        // Listen for clicks in modal
        var modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.addEventListener('click', function(e) {
                var shareBtn = e.target.closest('.article-share-btn');
                if (shareBtn) {
                    e.stopPropagation();
                    var articleId = shareBtn.dataset.articleId;
                    if (articleId) {
                        openShareOverlay(articleId);
                    }
                }
            });
        }
    }

    // ═══════════════════════════════════════
    // INJECT SHARE BUTTON INTO ARTICLE HTML
    // ═══════════════════════════════════════
    window.injectShareButton = function(articleId, container) {
        if (!container) return;
        if (container.querySelector('.article-share-btn')) return;

        var shareBtn = document.createElement('button');
        shareBtn.className = 'article-share-btn';
        shareBtn.dataset.articleId = articleId;
        shareBtn.innerHTML = ICONS.share + '<span class="share-btn-text">' + getShareText('share_article') + '</span>';

        container.appendChild(shareBtn);
    };

    // ═══════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════
    function init() {
        addShareButtonsToArticles();
        console.log('📤 EndLess Rich Share System initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();