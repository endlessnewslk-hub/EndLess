/* ═══════════════════════════════════════
   ENDLESS — SOCIAL SHARE SYSTEM
   News Channel Style Share Overlay
   Supports: Facebook, X (Twitter), WhatsApp, Copy Link
   ═══════════════════════════════════════ */

(function() {
    'use strict';

    // ── Configuration ──
    const SHARE_CONFIG = {
        brandName: 'EndLess',
        brandUrl: window.location.origin + window.location.pathname,
        brandLogo: window.location.origin + '/favicon.ico',
        maxTitleLength: 100,
        maxExcerptLength: 150
    };

    // ── Current article being shared ──
    let currentShareArticle = null;

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
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                <span id="share-preview-url"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="share-actions">
                    <button class="share-btn share-btn-facebook" onclick="shareToFacebook()">
                        <div class="share-btn-icon">📘</div>
                        <span class="share-btn-label">Facebook</span>
                    </button>
                    <button class="share-btn share-btn-x" onclick="shareToX()">
                        <div class="share-btn-icon">𝕏</div>
                        <span class="share-btn-label">X</span>
                    </button>
                    <button class="share-btn share-btn-whatsapp" onclick="shareToWhatsApp()">
                        <div class="share-btn-icon">💬</div>
                        <span class="share-btn-label">WhatsApp</span>
                    </button>
                    <button class="share-btn share-btn-copy" onclick="copyShareLink()">
                        <div class="share-btn-icon" id="copy-icon">📋</div>
                        <span class="share-btn-label" id="copy-label">Copy</span>
                    </button>
                </div>

                <div class="share-footer">
                    <p>
                        <span class="logo-mini">E</span>
                        Shared from <strong>EndLess</strong> — World News & Analysis
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeShareOverlay();
        });

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeShareOverlay();
        });
    }

    // ═══════════════════════════════════════
    // SHOW SHARE OVERLAY
    // ═══════════════════════════════════════
    window.openShareOverlay = function(articleId) {
        // Find article data
        const article = findArticleById(articleId);
        if (!article) {
            console.warn('Share: Article not found', articleId);
            return;
        }

        currentShareArticle = article;

        // Create overlay if not exists
        createShareOverlay();

        // Update preview
        updateSharePreview(article);

        // Show overlay
        const overlay = document.getElementById('share-overlay');
        if (overlay) {
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    // ═══════════════════════════════════════
    // CLOSE SHARE OVERLAY
    // ═══════════════════════════════════════
    window.closeShareOverlay = function() {
        const overlay = document.getElementById('share-overlay');
        if (overlay) {
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }

        // Reset copy button
        const copyBtn = document.querySelector('.share-btn-copy');
        const copyIcon = document.getElementById('copy-icon');
        const copyLabel = document.getElementById('copy-label');
        if (copyBtn) copyBtn.classList.remove('copied');
        if (copyIcon) copyIcon.textContent = '📋';
        if (copyLabel) copyLabel.textContent = 'Copy';
    };

    // ═══════════════════════════════════════
    // UPDATE SHARE PREVIEW
    // ═══════════════════════════════════════
    function updateSharePreview(article) {
        const title = article.title_en || article.title || article.title_si || 'EndLess News';
        const excerpt = article.excerpt_en || article.excerpt || article.excerpt_si || '';
        const image = article.image || 'https://via.placeholder.com/800x400?text=EndLess+News';
        const url = SHARE_CONFIG.brandUrl + '?article=' + article.id;

        // Update image
        const imgEl = document.getElementById('share-preview-image');
        if (imgEl) imgEl.src = image;

        // Update title (truncate if too long)
        const titleEl = document.getElementById('share-preview-title');
        if (titleEl) {
            titleEl.textContent = title.length > SHARE_CONFIG.maxTitleLength 
                ? title.substring(0, SHARE_CONFIG.maxTitleLength) + '...' 
                : title;
        }

        // Update excerpt
        const excerptEl = document.getElementById('share-preview-excerpt');
        if (excerptEl) {
            excerptEl.textContent = excerpt.length > SHARE_CONFIG.maxExcerptLength 
                ? excerpt.substring(0, SHARE_CONFIG.maxExcerptLength) + '...' 
                : excerpt;
        }

        // Update URL
        const urlEl = document.getElementById('share-preview-url');
        if (urlEl) urlEl.textContent = url;
    }

    // ═══════════════════════════════════════
    // FIND ARTICLE BY ID
    // ═══════════════════════════════════════
    function findArticleById(id) {
        if (id === null || id === undefined) return null;

        // Try to find in newsData (from scripts.js)
        if (typeof newsData !== 'undefined' && Array.isArray(newsData)) {
            // Use loose equality to handle string/number ID mismatch
            const found = newsData.find(n => n.id == id);
            if (found) return found;
        }

        // Try localStorage
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
        const title = encodeURIComponent(currentShareArticle.title_en || currentShareArticle.title || '');

        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`;

        openShareWindow(shareUrl, 'Share on Facebook');
        showShareToast('Opening Facebook...', '📘');
    };

    // ═══════════════════════════════════════
    // SHARE TO X (TWITTER)
    // ═══════════════════════════════════════
    window.shareToX = function() {
        if (!currentShareArticle) return;

        const url = encodeURIComponent(SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id);
        const title = currentShareArticle.title_en || currentShareArticle.title || '';
        // FIX: Removed broken line break inside string literal
        const text = encodeURIComponent(title + ' via @EndLessNews 🔗');

        const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

        openShareWindow(shareUrl, 'Share on X');
        showShareToast('Opening X...', '𝕏');
    };

    // ═══════════════════════════════════════
    // SHARE TO WHATSAPP
    // ═══════════════════════════════════════
    window.shareToWhatsApp = function() {
        if (!currentShareArticle) return;

        const url = encodeURIComponent(SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id);
        const title = currentShareArticle.title_en || currentShareArticle.title || '';
        const text = encodeURIComponent('*EndLess News* 📰\n\n' + title + '\n\nRead more: ');

        // Use WhatsApp Web/API
        const shareUrl = `https://wa.me/?text=${text}${url}`;

        openShareWindow(shareUrl, 'Share on WhatsApp');
        showShareToast('Opening WhatsApp...', '💬');
    };

    // ═══════════════════════════════════════
    // COPY SHARE LINK
    // ═══════════════════════════════════════
    window.copyShareLink = function() {
        if (!currentShareArticle) return;

        const url = SHARE_CONFIG.brandUrl + '?article=' + currentShareArticle.id;

        // Copy to clipboard
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
        textarea.setAttribute('readonly', ''); // Prevent keyboard from showing on mobile
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 999999); // For mobile

        try {
            document.execCommand('copy');
            showCopySuccess();
        } catch (err) {
            showShareToast('Failed to copy', '❌');
        }

        document.body.removeChild(textarea);
    }

    function showCopySuccess() {
        const copyBtn = document.querySelector('.share-btn-copy');
        const copyIcon = document.getElementById('copy-icon');
        const copyLabel = document.getElementById('copy-label');

        if (copyBtn) copyBtn.classList.add('copied');
        if (copyIcon) copyIcon.textContent = '✅';
        if (copyLabel) copyLabel.textContent = 'Copied!';

        showShareToast('Link copied to clipboard!', '✅');

        setTimeout(function() {
            if (copyBtn) copyBtn.classList.remove('copied');
            if (copyIcon) copyIcon.textContent = '📋';
            if (copyLabel) copyLabel.textContent = 'Copy';
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
    function showShareToast(message, icon) {
        // Remove existing toast
        const existing = document.getElementById('share-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'share-toast';
        toast.className = 'share-toast';
        toast.innerHTML = `<span class="share-toast-icon">${icon}</span> ${message}`;
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(function() {
            toast.classList.add('show');
        });

        // Remove after delay
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
        // Add share button to article cards in news grid
        const newsGrid = document.getElementById('news-grid');
        if (newsGrid) {
            // Use event delegation for dynamically added articles
            newsGrid.addEventListener('click', function(e) {
                const shareBtn = e.target.closest('.article-share-btn');
                if (shareBtn) {
                    e.stopPropagation();
                    // FIX: Removed parseInt to preserve string IDs and avoid NaN
                    const articleId = shareBtn.dataset.articleId;
                    if (articleId) {
                        openShareOverlay(articleId);
                    }
                }
            });
        }

        // Add share button to article modal
        const modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.addEventListener('click', function(e) {
                const shareBtn = e.target.closest('.article-share-btn');
                if (shareBtn) {
                    e.stopPropagation();
                    // FIX: Removed parseInt to preserve string IDs and avoid NaN
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

        // Check if share button already exists
        if (container.querySelector('.article-share-btn')) return;

        const shareBtn = document.createElement('button');
        shareBtn.className = 'article-share-btn';
        shareBtn.dataset.articleId = articleId;
        shareBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
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

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();