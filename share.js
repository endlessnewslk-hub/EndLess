/* ═══════════════════════════════════════
   ENDLESS — SOCIAL SHARE SYSTEM
   News Channel Style Share Overlay
   Supports: Facebook, X (Twitter), WhatsApp, Copy Link
   Multi-language: Tamil, English, Sinhala
   ═══════════════════════════════════════ */

(function() {
    'use strict';

    // ── Configuration ──
    const SHARE_CONFIG = {
        brandName: 'EndLess',
        brandUrl: window.location.origin + window.location.pathname,
        maxTitleLength: 100,
        maxExcerptLength: 150
    };

    // ── Share Text Translations (fallback if scripts.js not loaded) ──
    const SHARE_I18N = {
        ta: {
            share_article: 'பகிர்',
            share_this_article: 'இந்த கட்டுரையைப் பகிர்',
            facebook: 'பேஸ்புக்',
            x: 'எக்ஸ்',
            whatsapp: 'வாட்ஸ்அப்',
            copy: 'நகலெடு',
            copied: 'நகலெடுக்கப்பட்டது!',
            link_copied: 'இணைப்பு கிளிப்போர்டில் நகலெடுக்கப்பட்டது!',
            copy_failed: 'நகலெடுக்க முடியவில்லை',
            opening_facebook: 'பேஸ்புக் திறக்கிறது...',
            opening_x: 'எக்ஸ் திறக்கிறது...',
            opening_whatsapp: 'வாட்ஸ்அப் திறக்கிறது...',
            shared_from: 'இதிலிருந்து பகிரப்பட்டது',
            read_more: 'மேலும் படிக்க:',
            via: 'வழியாக'
        },
        en: {
            share_article: 'Share',
            share_this_article: 'Share this article',
            facebook: 'Facebook',
            x: 'X',
            whatsapp: 'WhatsApp',
            copy: 'Copy',
            copied: 'Copied!',
            link_copied: 'Link copied to clipboard!',
            copy_failed: 'Failed to copy',
            opening_facebook: 'Opening Facebook...',
            opening_x: 'Opening X...',
            opening_whatsapp: 'Opening WhatsApp...',
            shared_from: 'Shared from',
            read_more: 'Read more:',
            via: 'via'
        },
        si: {
            share_article: 'බෙදාගන්න',
            share_this_article: 'මෙම ලිපිය බෙදාගන්න',
            facebook: 'ෆේස්බුක්',
            x: 'එක්ස්',
            whatsapp: 'වට්ස්ඇප්',
            copy: 'පිටපත් කරන්න',
            copied: 'පිටපත් කරන ලදී!',
            link_copied: 'සබැඳිය පසුරු පුවරුවට පිටපත් කරන ලදී!',
            copy_failed: 'පිටපත් කිරීමට අසමත් විය',
            opening_facebook: 'ෆේස්බුක් විවෘත කරමින්...',
            opening_x: 'එක්ස් විවෘත කරමින්...',
            opening_whatsapp: 'වට්ස්ඇප් විවෘත කරමින්...',
            shared_from: 'වෙතින් බෙදාගත්තේ',
            read_more: 'තවත් කියවන්න:',
            via: 'මගින්'
        }
    };

    // ── Current article being shared ──
    let currentShareArticle = null;

    // ═══════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════
    function getCurrentLang() {
        if (typeof currentLang !== 'undefined') return currentLang;
        return 'en';
    }

    function getShareText(key) {
        const lang = getCurrentLang();
        if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            return TRANSLATIONS[lang][key];
        }
        if (SHARE_I18N[lang] && SHARE_I18N[lang][key]) {
            return SHARE_I18N[lang][key];
        }
        return SHARE_I18N.en[key] || key;
    }

    function getLocalizedField(article, field) {
        const lang = getCurrentLang();
        const suffix = lang === 'ta' ? '' : `_${lang}`;
        return article[`${field}${suffix}`] || article[field] || article[`${field}_en`] || article[`${field}_si`] || '';
    }

    // ── SVG Icons (Official Logos) ──
    const ICONS = {
        facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
        x: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
        whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
        copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
        share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`
    };

    // ═══════════════════════════════════════
    // CREATE SHARE OVERLAY HTML
    // ═══════════════════════════════════════
    function createShareOverlay() {
        if (document.getElementById('share-overlay')) return;

        const overlay = document.createElement('div');
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

                <div class="share-preview">
                    <div class="share-card" id="share-card-preview">
                        <img class="share-card-image" id="share-preview-image" src="" alt="">
                        <div class="share-card-body">
                            <div class="share-card-source">
                                <div class="logo-mini">E</div>
                                <span>EndLess News</span>
                            </div>
                            <div class="share-card-title" id="share-preview-title"></div>
                            <div class="share-card-excerpt" id="share-preview-excerpt"></div>
                            <div class="share-card-link">
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
        const article = findArticleById(articleId);
        if (!article) {
            console.warn('Share: Article not found', articleId);
            return;
        }

        currentShareArticle = article;
        createShareOverlay();
        updateSharePreview(article);
        updateShareLabels();

        const overlay = document.getElementById('share-overlay');
        if (overlay) {
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    function updateShareLabels() {
        document.querySelectorAll('[data-share-key]').forEach(el => {
            const key = el.dataset.shareKey;
            el.textContent = getShareText(key);
        });
    }

    // ═══════════════════════════════════════
    // CLOSE SHARE OVERLAY
    // ═══════════════════════════════════════
    window.closeShareOverlay = function() {
        const overlay = document.getElementById('share-overlay');
        if (overlay) {
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }

        const copyBtn = document.querySelector('.share-btn-copy');
        const copyIcon = document.getElementById('copy-icon');
        const copyLabel = document.getElementById('copy-label');
        if (copyBtn) copyBtn.classList.remove('copied');
        if (copyIcon) copyIcon.innerHTML = ICONS.copy;
        if (copyLabel) copyLabel.textContent = getShareText('copy');
    };

    // ═══════════════════════════════════════
    // UPDATE SHARE PREVIEW
    // ═══════════════════════════════════════
    function updateSharePreview(article) {
        const title = getLocalizedField(article, 'title') || 'EndLess News';
        const excerpt = getLocalizedField(article, 'excerpt') || '';
        const image = article.image || 'https://via.placeholder.com/800x400?text=EndLess+News';
        const url = SHARE_CONFIG.brandUrl + '?article=' + article.id;

        const imgEl = document.getElementById('share-preview-image');
        if (imgEl) imgEl.src = image;

        const titleEl = document.getElementById('share-preview-title');
        if (titleEl) {
            titleEl.textContent = title.length > SHARE_CONFIG.maxTitleLength 
                ? title.substring(0, SHARE_CONFIG.maxTitleLength) + '...' 
                : title;
        }

        const excerptEl = document.getElementById('share-preview-excerpt');
        if (excerptEl) {
            excerptEl.textContent = excerpt.length > SHARE_CONFIG.maxExcerptLength 
                ? excerpt.substring(0, SHARE_CONFIG.maxExcerptLength) + '...' 
                : excerpt;
        }

        const urlEl = document.getElementById('share-preview-url');
        if (urlEl) urlEl.textContent = url;
    }

    // ═══════════════════════════════════════
    // FIND ARTICLE BY ID
    // ═══════════════════════════════════════
    function findArticleById(id) {
        if (id === null || id === undefined || id === '') return null;

        if (typeof newsData !== 'undefined' && Array.isArray(newsData)) {
            const found = newsData.find(n => n.id == id);
            if (found) return found;
        }

        try {
            const stored = localStorage.getItem('endless_news');
            if (stored) {
                const articles = JSON.parse(stored);
                const found = articles.find(n => n.id == id);
                if (found) return found;
            }
        } catch (e) {
            console.warn('Share: Could not read localStorage');
        }

        return null;
    }

    // ═══════════════════════════════════════
    // SHARE TO FACEBOOK
    // ═══════════════════════════════════════
    window.shareToFacebook = function() {
        if (!currentShareArticle) return;

        const url = encodeURIComponent(SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id);
        const title = encodeURIComponent(getLocalizedField(currentShareArticle, 'title') || '');

        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`;

        openShareWindow(shareUrl, 'Share on Facebook');
        showShareToast(getShareText('opening_facebook'), ICONS.facebook);
    };

    // ═══════════════════════════════════════
    // SHARE TO X (TWITTER)
    // ═══════════════════════════════════════
    window.shareToX = function() {
        if (!currentShareArticle) return;

        const url = encodeURIComponent(SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id);
        const title = getLocalizedField(currentShareArticle, 'title') || '';
        const text = encodeURIComponent(title + ' via @EndLessNews 🔗');

        const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

        openShareWindow(shareUrl, 'Share on X');
        showShareToast(getShareText('opening_x'), ICONS.x);
    };

    // ═══════════════════════════════════════
    // SHARE TO WHATSAPP
    // ═══════════════════════════════════════
    window.shareToWhatsApp = function() {
        if (!currentShareArticle) return;

        const url = encodeURIComponent(SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id);
        const title = getLocalizedField(currentShareArticle, 'title') || '';
        const readMore = getShareText('read_more');
        const text = encodeURIComponent(`*EndLess News* 📰\n\n${title}\n\n${readMore} `);

        const shareUrl = `https://wa.me/?text=${text}${url}`;

        openShareWindow(shareUrl, 'Share on WhatsApp');
        showShareToast(getShareText('opening_whatsapp'), ICONS.whatsapp);
    };

    // ═══════════════════════════════════════
    // COPY SHARE LINK
    // ═══════════════════════════════════════
    window.copyShareLink = function() {
        if (!currentShareArticle) return;

        const url = SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function() {
                showCopySuccess();
            }).catch(function() {
                fallbackCopy(url);
            });
        } else {
            fallbackCopy(url);
        }
    };

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
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
        const copyBtn = document.querySelector('.share-btn-copy');
        const copyIcon = document.getElementById('copy-icon');
        const copyLabel = document.getElementById('copy-label');

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
        const width = 600;
        const height = 500;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        window.open(url, title, `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
    }

    // ═══════════════════════════════════════
    // SHOW TOAST NOTIFICATION
    // ═══════════════════════════════════════
    function showShareToast(message, iconHtml) {
        const existing = document.getElementById('share-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'share-toast';
        toast.className = 'share-toast';
        
        const isSvg = typeof iconHtml === 'string' && iconHtml.includes('<svg');
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
        const newsGrid = document.getElementById('news-grid');
        if (newsGrid) {
            newsGrid.addEventListener('click', function(e) {
                const shareBtn = e.target.closest('.article-share-btn');
                if (shareBtn) {
                    e.stopPropagation();
                    const articleId = shareBtn.dataset.articleId;
                    if (articleId) {
                        openShareOverlay(articleId);
                    }
                }
            });
        }

        const modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.addEventListener('click', function(e) {
                const shareBtn = e.target.closest('.article-share-btn');
                if (shareBtn) {
                    e.stopPropagation();
                    const articleId = shareBtn.dataset.articleId;
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

        const shareBtn = document.createElement('button');
        shareBtn.className = 'article-share-btn';
        shareBtn.dataset.articleId = articleId;
        shareBtn.innerHTML = `
            ${ICONS.share}
            <span class="share-btn-text">${getShareText('share_article')}</span>
        `;

        container.appendChild(shareBtn);
    };

    // ═══════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════
    function init() {
        addShareButtonsToArticles();
        console.log('📤 EndLess Share System initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();