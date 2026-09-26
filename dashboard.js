function renderAnalyticsPage() {
    var totalViewsEl = document.getElementById('stat-total-views');
    var adClicksEl = document.getElementById('stat-ad-clicks');
    var mobileEl = document.getElementById('stat-mobile-users');
    var countryEl = document.getElementById('stat-top-country');

    ['…'].forEach(function(t) {
        if (totalViewsEl) totalViewsEl.textContent = t;
        if (adClicksEl) adClicksEl.textContent = t;
        if (mobileEl) mobileEl.textContent = t;
        if (countryEl) countryEl.textContent = t;
    });

    var ctx = document.getElementById('analytics-chart');
    if (ctx && analyticsChart) { analyticsChart.destroy(); analyticsChart = null; }

    if (!db) {
        ['N/A'].forEach(function(t) {
            if (totalViewsEl) totalViewsEl.textContent = t;
            if (adClicksEl) adClicksEl.textContent = t;
            if (mobileEl) mobileEl.textContent = t;
            if (countryEl) countryEl.textContent = 'No DB';
        });
        return;
    }

    // 🌍 Detect visitor country (ipwho.is — free, no key) → store aggregate
    (function detectCountry() {
        fetch('https://ipwho.is/').then(function(r) { return r.json(); }).then(function(ip) {
            if (!ip || !ip.success || !ip.country) return;
            var cc = ip.country_code || 'XX';
            db.collection('analytics').doc('countries').set({
                counts: firebase.firestore.FieldValue.increment ? undefined : undefined
            }, { merge: true }).catch(function() {});
            db.collection('analytics').doc('countries').update(
                'counts.' + cc,
                firebase.firestore.FieldValue.increment(1)
            ).catch(function() {
                db.collection('analytics').doc('countries').set({ counts: {} }, { merge: true })
                    .then(function() {
                        return db.collection('analytics').doc('countries').update(
                            'counts.' + cc, firebase.firestore.FieldValue.increment(1));
                    }).catch(function() {});
            });
        }).catch(function() {});
    })();

    db.collection('analytics').doc('totals').get().then(function(doc) {
        var t = doc.exists ? doc.data() : {};
        var views = (t.views || 0);
        var shares = (t.shares || 0);
        var mobile = t.mobile || 0, desktop = t.desktop || 0;
        var totalD = mobile + desktop;
        if (totalViewsEl) totalViewsEl.textContent = views.toLocaleString();
        if (adClicksEl) adClicksEl.textContent = shares.toLocaleString();
        if (mobileEl) mobileEl.textContent = totalD > 0 ? Math.round(mobile / totalD * 100) + '%' : '—';

        // 🌍 Top country from stored counts
        db.collection('analytics').doc('countries').get().then(function(cdoc) {
            var counts = (cdoc.exists && cdoc.data().counts) || {};
            var top = '—', topN = 0;
            Object.keys(counts).forEach(function(k) {
                if (counts[k] > topN) { topN = counts[k]; top = k; }
            });
            if (countryEl && top !== '—') {
                var names = { LK: 'Sri Lanka', IN: 'India', MY: 'Malaysia', SG: 'Singapore', AE: 'UAE', GB: 'UK', US: 'USA', CA: 'Canada', AU: 'Australia' };
                countryEl.textContent = names[top] || top;
            } else if (countryEl) countryEl.textContent = '—';
        }).catch(function() { if (countryEl) countryEl.textContent = '—'; });
    }).catch(function() {
        if (totalViewsEl) totalViewsEl.textContent = 'Error';
    });

    // 📈 Daily chart — last 7 days real data
    var today = new Date();
    var labels = [], keys = [];
    for (var i = 6; i >= 0; i--) {
        var dt = new Date(today); dt.setDate(dt.getDate() - i);
        keys.push(dt.toISOString().slice(0, 10));
        labels.push(dt.toLocaleDateString('en-GB', { weekday: 'short' }));
    }
    Promise.all(keys.map(function(k) {
        return db.collection('analytics').doc('daily_' + k).get().catch(function() { return null; });
    })).then(function(docs) {
        var data = docs.map(function(doc) {
            return (doc && doc.exists) ? (doc.data().views || 0) : 0;
        });
        if (!ctx) return;
        if (analyticsChart) analyticsChart.destroy();
        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{
                label: 'Page Views',
                data: data,
                fill: true,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#ef4444',
                pointRadius: 5,
                pointHoverRadius: 7
            }]},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(200,200,200,0.1)' }, ticks: { color: '#a0a0b8', precision: 0 } },
                    x: { grid: { display: false }, ticks: { color: '#a0a0b8' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    });

    // 🔥 Top 5 most-read articles — REAL counts from analytics/articles/*
    db.collection('analytics').get().then(function(snap) {
        var tops = [];
        snap.docs.forEach(function(doc) {
            if (doc.id.indexOf('articles/') === 0 || doc.id.split('_')[0] === 'article') {
                var v = doc.data().views || 0;
                var id = doc.id.replace('articles/', '').replace('article_', '');
                if (v > 0 && id) tops.push({ id: id, views: v });
            }
        });
        tops.sort(function(a, b) { return b.views - a.views; });
        tops = tops.slice(0, 5);
        // 🎯 Dedicated panel (injected — never touches the chart panel's tbody!)
        var host = document.getElementById('page-analytics');
        if (!host) return;
        var panel = document.getElementById('top-articles-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'panel';
            panel.id = 'top-articles-panel';
            panel.style.marginTop = '1.5rem';
            panel.innerHTML = '<h3>🔥 Top Articles (Most Read)</h3>' +
                '<div class="table-scroll"><table class="data-table compact">' +
                '<thead><tr><th>Article</th><th>Views</th></tr></thead>' +
                '<tbody id="top-articles-body"><tr><td colspan="2" style="color:#9ca3af;">Loading…</td></tr></tbody>' +
                '</table></div>';
            var chartPanel = host.querySelector('.panel');
            if (chartPanel) chartPanel.after(panel);
        }
        var tbody = document.getElementById('top-articles-body');
        if (tbody) {
            tbody.innerHTML = tops.length ? tops.map(function(t) {
                var art = (typeof adminNews !== 'undefined' ? adminNews : []).find(function(n) {
                    return String(n.id) === String(t.id);
                });
                var title = art ? (art.title_en || art.title) : ('Article #' + t.id);
                return '<tr><td>' + String(title).replace(/</g, '&lt;').substring(0, 50) + '</td>' +
                       '<td>' + t.views + ' views</td></tr>';
            }).join('') : '<tr><td colspan="2" style="color:#9ca3af;">No article data yet</td></tr>';
        }
    }).catch(function() {});
}
// ═══════════════════════════════════════════════════════════════
// 🔥 HOTFIX v2: Strict auth guard — expired sessions block cloud saves
// ═══════════════════════════════════════════════════════════════
(function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            // Token expired but guard.js let us in via session-trust — force re-login
            sessionStorage.removeItem('endless_auth_session');
            localStorage.removeItem('endless_auth_persistent');
            alert('⏰ Session expired! Please login again to save articles to cloud.');
            window.location.href = 'x7k9m2.html';
        }
    });
})();


// ═══════════════════════════════════════════════════════════════
// 🔥 HOTFIX: Image auto-compression (Firestore 1MB limit fix)
// ═══════════════════════════════════════════════════════════════
(function() {
    var _origHandleFileUpload = window.handleFileUpload;
    window.handleFileUpload = function(inputId, previewId, dataId, type) {
        type = type || 'image';
        var input = document.getElementById(inputId);
        var preview = document.getElementById(previewId);
        var dataInput = document.getElementById(dataId);
        if (!input) return;

        input.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            if (type === 'image') {
                var img = new Image();
                var objUrl = URL.createObjectURL(file);
                img.onload = function() {
                    URL.revokeObjectURL(objUrl);
                    var maxW = 900;
                    var scale = Math.min(1, maxW / img.width);
                    var canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(img.width * scale));
                    canvas.height = Math.max(1, Math.round(img.height * scale));
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    var compressed = canvas.toDataURL('image/jpeg', 0.72);
                    if (dataInput) dataInput.value = compressed;
                    if (preview) preview.src = compressed;
                    var wrap = document.getElementById('photo-preview-wrap');
                    var placeholder = document.getElementById('photo-placeholder');
                    if (wrap) wrap.style.display = 'block';
                    if (placeholder) placeholder.style.display = 'none';
                    if (typeof showToast === 'function') showToast('Photo compressed & ready', 'success');
                };
                img.onerror = function() {
                    URL.revokeObjectURL(objUrl);
                    if (typeof showToast === 'function') showToast('Image read failed', 'error');
                };
                img.src = objUrl;
                return;
            }
            if (_origHandleFileUpload) {
                var clone = input.cloneNode(true);
                input.parentNode.replaceChild(clone, input);
                _origHandleFileUpload(inputId, previewId, dataId, type);
            }
        });
    };
})();


/* ═══════════════════════════════════════
   ENDLESS — ADMIN PANEL LOGIC (Mobile Optimized)
   ═══════════════════════════════════════ */

// ── Firebase Configuration ──
const firebaseConfig = {
    apiKey: "AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA",
    authDomain: "endless-news.firebaseapp.com",
    projectId: "endless-news",
    storageBucket: "endless-news.firebasestorage.app",
    messagingSenderId: "363216005373",
    appId: "1:363216005373:web:143fb950fb04dfc1cb7694"
};

// Initialize Firebase safely
let db = null;
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();

        db.settings({
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
            ignoreUndefinedProperties: true
        });

        dbg('Firebase connected successfully');
    } else {
        console.warn('Firebase SDK not loaded - using localStorage only');
    }
} catch (err) {
    console.error('Firebase init error:', err);
}

// 🔤 BRAND FONT — admin panel "EndLess" logo = same premium Playfair font
// as the main site (Georgia missing on Android → logo looked different).
(function injectAdminBrandFont() {
    if (document.getElementById('admin-brand-font')) return;
    var link = document.createElement('link');
    link.id = 'admin-brand-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap';
    document.head.appendChild(link);
    var st = document.createElement('style');
    st.textContent = [
        '.admin-logo-icon,.sidebar-header h2,.sidebar-header h2 span,',
        '.sidebar-header h2 *{',
        "font-family:'Playfair Display',Georgia,serif!important;}"
    ].join('');
    document.head.appendChild(st);
})();

// 📬 NEWSLETTER ADMIN — subscribers, auto-briefing, one-click send
function ensureNewsletterUI() {
    if (document.getElementById('page-newsletter')) return;
    // 1. Sidebar nav item (before logout button if present)
    var nav = document.querySelector('.sidebar-nav');
    if (nav && !nav.querySelector('[data-page="newsletter"]')) {
        var b = document.createElement('button');
        b.className = 'nav-item'; b.dataset.page = 'newsletter';
        b.innerHTML = '<span>📬</span> Newsletter';
        nav.insertBefore(b, nav.querySelector('#guard-logout-btn') || null);
        b.addEventListener('click', function() { showPage('newsletter'); setTimeout(renderNewsletterPage, 60); });
    }
    // 2. Page content
    var anchor = document.getElementById('page-settings');
    if (!anchor || !anchor.parentNode) return;
    var page = document.createElement('div');
    page.id = 'page-newsletter'; page.className = 'page-content hidden';
    page.innerHTML =
        '<div class="stats-grid">' +
        '  <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-info"><h3 id="nl-count">…</h3><p>Subscribers</p></div></div>' +
        '  <div class="stat-card"><div class="stat-icon">✉️</div><div class="stat-info"><h3 id="nl-sent">…</h3><p>Total Sent</p></div></div>' +
        '</div>' +
        '<div class="panel">' +
        '  <h3>✍️ Compose Daily Briefing</h3>' +
        '  <div class="form-group"><label>Subject</label><input type="text" id="nl-subject" placeholder="🌅 EndLess Daily Briefing — ' + new Date().toLocaleDateString() + '"></div>' +
        '  <div class="form-group"><button class="btn-secondary" id="nl-gen" type="button">⚡ Auto-Generate from Latest Articles</button></div>' +
        '  <div class="form-group"><label>Email Body (HTML allowed)</label><textarea id="nl-body" rows="12" style="width:100%;padding:0.65rem 0.875rem;border:1px solid #d1d5db;border-radius:6px;font-family:inherit;font-size:0.95rem;"></textarea></div>' +
        '  <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">' +
        '    <button class="btn-primary" id="nl-send" type="button">🚀 Send to All Subscribers</button>' +
        '    <button class="btn-secondary" id="nl-test" type="button">🧪 Send Test to Admin</button>' +
        '  </div>' +
        '  <p style="color:#6b7280;font-size:0.8rem;margin-top:0.75rem;">📤 Emails send via the FREE Firebase "Trigger Email" extension (install once — guide below).</p>' +
        '</div>' +
        '<div class="panel"><h3>👥 Recent Subscribers</h3><div class="table-scroll"><table class="data-table compact"><thead><tr><th>Email</th><th>Lang</th><th>Joined</th></tr></thead><tbody id="nl-list"></tbody></table></div></div>';
    anchor.parentNode.insertBefore(page, anchor.nextSibling);
    document.getElementById('nl-gen').addEventListener('click', generateBriefing);
    document.getElementById('nl-send').addEventListener('click', function() { sendBriefing(false); });
    document.getElementById('nl-test').addEventListener('click', function() { sendBriefing(true); });
}

async function renderNewsletterPage() {
    if (!db) { var c = document.getElementById('nl-count'); if (c) c.textContent = 'No DB'; return; }
    try {
        var snap = await db.collection('subscribers').get();
        var c = document.getElementById('nl-count'); if (c) c.textContent = snap.size;
        var list = document.getElementById('nl-list');
        if (list) list.innerHTML = snap.docs.slice(0, 20).map(function(doc) {
            var s = doc.data();
            return '<tr><td>' + String(s.email || doc.id).replace(/</g, '&lt;') + '</td><td>' + (s.lang || 'ta') + '</td><td>' + (s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString() : '—') + '</td></tr>';
        }).join('') || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;">No subscribers yet</td></tr>';
    } catch (e) {}
    try {
        var log = await db.collection('newsletter_log').doc('summary').get();
        var t = document.getElementById('nl-sent');
        if (t) t.textContent = (log.exists && log.data().totalSent) || 0;
    } catch (e) {}
}

function generateBriefing() {
    var latest = adminNews.filter(function(n) { return n.status !== 'draft'; }).slice(0, 5);
    if (!latest.length) { showToast('No published articles found', 'error'); return; }
    var d = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var subj = '🌅 EndLess Daily Briefing — ' + d;
    var rows = latest.map(function(n, i) {
        var t = n.title_en || n.title || 'News';
        var link = 'https://endlessnews.lk/?article=' + encodeURIComponent(n.id);
        return (i + 1) + '️⃣ <b>' + t.replace(/</g, '&lt;') + '</b><br>&nbsp;&nbsp;&nbsp;👉 <a href="' + link + '">Read more</a>';
    }).join('<br><br>');
    var html =
        '<div style="font-family:Georgia,serif;background:#0a0a0f;color:#f1f5f9;padding:24px;border-radius:12px;max-width:600px">' +
        '<h2 style="color:#e11d48;margin:0 0 4px">End<span style="color:#fff">Less</span> News</h2>' +
        '<p style="color:#94a3b8;margin:0 0 18px">' + d + '</p><hr style="border-color:#1e293b">' +
        '<p style="font-size:18px;color:#fff"><b>🔥 Top ' + latest.length + ' Today</b></p>' +
        '<p style="line-height:2">' + rows + '</p>' +
        '<hr style="border-color:#1e293b">' +
        '<a href="https://endlessnews.lk" style="display:inline-block;background:#e11d48;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Visit Website →</a>' +
        '<p style="color:#64748b;font-size:12px;margin-top:16px">© EndLess News · You are subscribed to the Daily Briefing</p>' +
        '</div>';
    document.getElementById('nl-subject').value = subj;
    document.getElementById('nl-body').value = html;
    showToast('⚡ Briefing generated from ' + latest.length + ' articles!', 'success');
}

async function sendBriefing(testOnly) {
    var subject = (document.getElementById('nl-subject').value || '').trim();
    var html = (document.getElementById('nl-body').value || '').trim();
    if (!subject || !html) { showToast('Generate the briefing first!', 'error'); return; }
    if (!db) { showToast('No Firebase connection', 'error'); return; }
    var btn = document.getElementById(testOnly ? 'nl-test' : 'nl-send');
    var orig = btn.textContent; btn.disabled = true; btn.textContent = '⏳ Sending…';
    try {
        var recipients = [];
        if (testOnly) {
            recipients = ['endlessnewslk@gmail.com'];
        } else {
            var snap = await db.collection('subscribers').get();
            recipients = snap.docs.map(function(d) { return d.id; });
            if (!recipients.length) { showToast('No subscribers yet!', 'error'); btn.disabled = false; btn.textContent = orig; return; }
        }
        // Batch-write mail docs (Trigger Email extension sends each)
        var CHUNK = 400;
        for (var i = 0; i < recipients.length; i += CHUNK) {
            var batch = db.batch();
            recipients.slice(i, i + CHUNK).forEach(function(email) {
                var ref = db.collection('mail').doc('s' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
                batch.set(ref, { to: email, message: { subject: subject, html: html } });
            });
            await batch.commit();
        }
        await db.collection('newsletter_log').doc('summary').set({
            totalSent: firebase.firestore.FieldValue.increment(recipients.length),
            lastSent: new Date().toISOString()
        }, { merge: true });
        showToast('🚀 Sent to ' + recipients.length + ' subscriber(s)!', 'success');
        renderNewsletterPage();
    } catch (e) {
        console.warn('Send failed:', e);
        showToast('⚠️ Send failed: ' + (e && e.message ? e.message : 'unknown') + ' — Trigger Email extension install aagirukka check pannunga', 'error');
    } finally {
        btn.disabled = false; btn.textContent = orig;
    }
}

// 🔇 Production: no debug logs in console
var DEBUG = false;
function dbg() { if (DEBUG) console.log.apply(console, arguments); }

// ── State Variables ──
let adminNews = [];
let adminAds = [];
let adminCats = [];
let currentPage = 'dashboard';
let editingNewsId = null;
let editingAdId = null;
let currentNewsLang = 'ta';
let dataInitialized = false;

// ── Admin Password ──
// SECURITY: No hardcoded password. Use Firebase Auth or environment variable.
// For reset functionality, implement server-side validation.

// ── Default Data ──
const DEFAULT_NEWS = [];

const DEFAULT_ADS = [];

const DEFAULT_CATEGORIES = [];

// ── Helper: Safe JSON Parse ──
function safeJSONParse(key, fallback) {
    try {
        var data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.warn('Failed to parse ' + key + ':', e);
        return fallback;
    }
}

// ── Helper: Reload news from localStorage and restore defaults if needed ──
function reloadAdminNewsFromStorage() {
    var stored = safeJSONParse('endless_news', []);
    if (!Array.isArray(stored) || stored.length === 0) {
        console.log('reloadAdminNewsFromStorage: no stored news found, restoring DEFAULT_NEWS');
        adminNews = JSON.parse(JSON.stringify(DEFAULT_NEWS));
        saveNews();
        return;
    }

    adminNews = stored.filter(function(n) {
        return !isUntitledOrGarbage(n);
    });

    if (adminNews.length === 0) {
        console.log('reloadAdminNewsFromStorage: stored news invalid or garbage, restoring DEFAULT_NEWS');
        adminNews = JSON.parse(JSON.stringify(DEFAULT_NEWS));
        saveNews();
    }
}

// ── Helper: Check if post is garbage ──
function isUntitledOrGarbage(n) {
    if (!n || typeof n !== 'object') return true;
    var hasId = n.id !== undefined && n.id !== null && n.id !== '';
    var hasTitle = (n.title && String(n.title).trim() !== '') ||
                   (n.title_en && String(n.title_en).trim() !== '');
    return !hasId || !hasTitle;
}

// ── Data Initialization ──
async function initData() {
    if (dataInitialized) {
        dbg('initData: Already initialized, skipping');
        return Promise.resolve(); // CRITICAL FIX: Return resolved promise
    }
    dbg('=== initData() starting ===');

    reloadAdminNewsFromStorage();
    adminAds = safeJSONParse('endless_ads', []);
    adminCats = safeJSONParse('endless_categories', []);

    dbg('Loaded from localStorage - News:', adminNews.length, 'Ads:', adminAds.length, 'Cats:', adminCats.length);

    if (adminNews.length > 0) {
        dbg('First news item:', JSON.stringify(adminNews[0]).substring(0, 200));
    }

    var beforeNewsCount = adminNews.length;
    adminNews = adminNews.filter(function(n) {
        return !isUntitledOrGarbage(n);
    });
    var removedLocal = beforeNewsCount - adminNews.length;
    if (removedLocal > 0) {
        saveNews();
        console.log('Removed ' + removedLocal + ' garbage posts from localStorage');
    }

    if (adminNews.length === 0) {
        dbg('Loaded DEFAULT news data');
        adminNews = JSON.parse(JSON.stringify(DEFAULT_NEWS));
        saveNews();
    }
    if (adminAds.length === 0) {
        dbg('Loaded DEFAULT ads data');
        adminAds = JSON.parse(JSON.stringify(DEFAULT_ADS));
        saveAds();
    }
    if (adminCats.length === 0) {
        dbg('Loaded DEFAULT categories data');
        adminCats = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
        saveCats();
    }

    updateCategoryCounts();

    if (db) {
        try {
            await syncFromFirebase();
        } catch (err) {
            console.warn('Firebase sync failed, using localStorage:', err);
        }
    } else {
        dbg('No Firebase connection, using localStorage only');
    }

    // CRITICAL: After Firebase sync, check again if data is empty and restore defaults
    if (adminNews.length === 0) {
        dbg('After Firebase sync, adminNews is empty. Restoring DEFAULT_NEWS');
        adminNews = JSON.parse(JSON.stringify(DEFAULT_NEWS));
        saveNews();
    }

    ensureNewsletterUI(); // 📬 Newsletter admin tab
    var dashboard = document.getElementById('admin-dashboard');
    if (dashboard) dashboard.style.display = 'flex';

    var authLoading = document.getElementById('auth-loading-overlay');
    if (authLoading) authLoading.style.display = 'none';

    dbg('Final data - News:', adminNews.length, 'Ads:', adminAds.length, 'Cats:', adminCats.length);
    dbg('=== initData() complete ===');

    // CRITICAL FIX: Set dataInitialized ONLY after data is fully loaded
    dataInitialized = true;
    window.dataInitialized = true; // Also set global flag for guard.js

    // CRITICAL FIX: Always render current page after data is ready
    showPageContinue(currentPage);

    // CRITICAL FIX: Force re-render of news table if on news page
    if (currentPage === 'news') {
        setTimeout(function() {
            renderNewsTable();
            dbg('Forced news table re-render after init');
        }, 100);
    }

    // ── CHECK FOR EDIT PARAMETER (article edit from main website) ──
    var urlParams = new URLSearchParams(window.location.search);
    var editId = urlParams.get('edit') || localStorage.getItem('edit_article_id');
    if (editId) {
        console.log('Auto-opening article for edit:', editId);
        // Navigate to news page and open edit modal
        currentPage = 'news';
        showPageContinue('news');
        setTimeout(function() {
            editNews(parseInt(editId));
        }, 500);
        // Clear the localStorage flag
        localStorage.removeItem('edit_article_id');
        // Update URL to remove parameter
        window.history.replaceState({}, document.title, 'dashboard.html');
    }

    return Promise.resolve(); // CRITICAL FIX: Always return promise
}

// ── Update Category Counts ──
function updateCategoryCounts() {
    adminCats.forEach(function(cat) {
        var count = adminNews.filter(function(n) {
            return n.status === 'published' &&
                (n.category === cat.name || n.category_en === cat.name_en);
        }).length;
        cat.count = count;
    });
    saveCats(); 
}

// ── Firebase Sync ──
async function syncFromFirebase() {
    if (!db) return;
    try {   
        // 🔥 PARALLEL FETCH — All collections at once (3x faster)
        const [newsSnapshot, adsSnapshot, catsSnapshot] = await Promise.all([
            db.collection('news').get().catch(() => ({ empty: true, docs: [] })),
            db.collection('ads').get().catch(() => ({ empty: true, docs: [] })),
            db.collection('categories').get().catch(() => ({ empty: true, docs: [] }))
        ]);

        // Process News
        var firebaseNews = [];
        if (!newsSnapshot.empty) {
            newsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                if (!isUntitledOrGarbage(data)) firebaseNews.push(data);
            });
        }
        if (firebaseNews.length > 0) {
            adminNews = firebaseNews;
            // 🔥 Newest first — Firebase order unpredictable, sort by date
            adminNews.sort(function(a, b) {
                return new Date(b.date || 0) - new Date(a.date || 0);
            });
        } else if (adminNews.length > 0) {
            // Firebase empty but local has data — upload in background
            console.log('☁️ Firebase empty, uploading', adminNews.length, 'articles...');
            Promise.all(adminNews.map(n => 
                db.collection('news').doc(String(n.id)).set(n).catch(() => {})
            )).then(() => console.log('✅ Upload complete'));
        }
        localStorage.setItem('endless_news', JSON.stringify(adminNews));

        // Process Ads
        var firebaseAds = [];
        if (!adsSnapshot.empty) {
            firebaseAds = adsSnapshot.docs.map(doc => { const d = doc.data(); d.id = doc.id; return d; });
        }
        if (firebaseAds.length > 0) adminAds = firebaseAds;
        localStorage.setItem('endless_ads', JSON.stringify(adminAds));

        // Process Categories
        var firebaseCats = [];
        if (!catsSnapshot.empty) {
            firebaseCats = catsSnapshot.docs.map(doc => { const d = doc.data(); d.id = doc.id; return d; });
        }
        if (firebaseCats.length > 0) adminCats = firebaseCats;
        localStorage.setItem('endless_categories', JSON.stringify(adminCats));

        updateCategoryCounts();
    } catch (error) {
        console.error('Firebase read error:', error);
        dbg('Keeping local data since Firebase sync failed');
    }
}

function saveNews() {
    localStorage.setItem('endless_news', JSON.stringify(adminNews));
    
    // Generate share page for latest article
    if (adminNews && adminNews.length > 0) {
        var latestArticle = adminNews[adminNews.length - 1];
        saveSharePage(latestArticle);
    }
}

function saveAds() { localStorage.setItem('endless_ads', JSON.stringify(adminAds)); }

function saveCats() { localStorage.setItem('endless_categories', JSON.stringify(adminCats)); }

// ── Share Page Generator ──
function generateSharePage(article) {
    var articleUrl = 'https://endlessnewslk-hub.github.io/EndLess/?article=' + article.id;
    var shareUrl = 'https://endless-og.endlessnewslk.workers.dev/?article=' + article.id;
    
    var title = article.title_en || article.title || 'EndLess News';
    var lang = currentNewsLang || 'en';
    var image = article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop';
    
    var readMore = lang === 'ta' ? 'மேலும் படிக்க' : 'Continue Reading';
    var redirectText = lang === 'ta' ? 'கட்டுரைக்கு திருப்பிவிடுகிறது' : 'Redirecting to article';
    var clickHere = lang === 'ta' ? 'திருப்பிவிடவில்லை என்றால் இங்கே சொடுக்கவும்' : 'Click here if not redirected';
    
    var description = (article.excerpt || article.excerpt_en || title);
    if (description.length > 200) description = description.substring(0, 197) + '...';
    
    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:locale" content="${lang === 'ta' ? 'ta_IN' : lang === 'si' ? 'si_LK' : 'en_US'}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:site_name" content="EndLess News" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${escapeHtml(title)}" />
    <meta name="twitter:site" content="@EndLessNews" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)} - EndLess News</title>
    <link rel="canonical" href="${articleUrl}" />
    <meta http-equiv="refresh" content="3;url=${articleUrl}" />
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}.share-card{max-width:600px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5)}.share-image{width:100%;height:340px;object-fit:cover;display:block}.share-content{padding:24px}.share-logo{display:flex;align-items:center;gap:8px;margin-bottom:16px}.share-logo-icon{width:32px;height:32px;background:#e11d48;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px}.share-logo-text{font-size:18px;font-weight:700}.share-logo-text span{color:#e11d48}.share-headline{font-size:22px;font-weight:700;line-height:1.4;margin-bottom:20px;color:#fff}.share-cta{display:inline-flex;align-items:center;gap:8px;background:#e11d48;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;transition:transform .2s,box-shadow .2s}.share-cta:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(225,29,72,0.4)}.share-redirect{margin-top:20px;text-align:center;color:#888;font-size:14px}.share-redirect a{color:#e11d48;text-decoration:none}.share-spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;margin-left:8px}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:480px){.share-headline{font-size:18px}.share-image{height:240px}}</style>
</head>
<body>
    <div class="share-card">
        <img class="share-image" src="${image}" alt="${escapeHtml(title)}" />
        <div class="share-content">
            <div class="share-logo"><div class="share-logo-icon">E</div><div class="share-logo-text">End<span>Less</span> News</div></div>
            <h1 class="share-headline">${escapeHtml(title)}</h1>
            <a class="share-cta" href="${articleUrl}">${readMore} →</a>
            <div class="share-redirect">${redirectText} <span class="share-spinner"></span><br><a href="${articleUrl}">${clickHere}</a></div>
        </div>
    </div>
    <script>setTimeout(function(){window.location.href='${articleUrl}'},3000)</script>
</body>
</html>`;
}

function saveSharePage(article) {
    var html = generateSharePage(article);
    localStorage.setItem('share_page_' + article.id, html);
    console.log('✅ Share page saved for article:', article.id);
}

// ── Toast ──
function showToast(msg, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast ' + type + ' show';
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ── Mobile Sidebar ──
function toggleSidebar() {
    var sidebar = document.getElementById('admin-sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    var menuBtn = document.getElementById('header-menu-btn');
    if (!sidebar) return;
    var isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        if (menuBtn) menuBtn.classList.remove('open');
    } else {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('open');
        if (menuBtn) menuBtn.classList.add('open');
    }
}

function closeSidebar() {
    var sidebar = document.getElementById('admin-sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    var menuBtn = document.getElementById('header-menu-btn');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (menuBtn) menuBtn.classList.remove('open');
}

// ── Page Navigation ──
function showPage(page) {
    console.log('showPage called:', page);
    currentPage = page;
    
    // CRITICAL FIX: Wait for data initialization before showing page
    if (!dataInitialized) {
        console.log('Data not initialized yet, initializing now...');
        initData().then(function() {
            showPageContinue(page);
        }).catch(function() {
            // Even if Firebase fails, continue with localStorage data
            showPageContinue(page);
        });
        return;
    }
    
    showPageContinue(page);
    // CRITICAL FIX: Force render when switching to news page
    if (page === 'news') {
        setTimeout(renderNewsTable, 50);
    }
}

function showPageContinue(page) {
    document.querySelectorAll('.page-content').forEach(function(p) { p.classList.add('hidden'); });
    var targetPage = document.getElementById('page-' + page);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        console.log('Showing page:', 'page-' + page);
    } else {
        console.error('Page not found:', 'page-' + page);
    }
    document.querySelectorAll('.nav-item').forEach(function(n) {
        n.classList.toggle('active', n.dataset.page === page);
    });
    document.querySelectorAll('.nav-item-mobile').forEach(function(n) {
        n.classList.toggle('active', n.dataset.page === page);
    });
    var pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
    
    // CRITICAL FIX: Always render tables when showing page
    if (page === 'dashboard') renderDashboard();
    if (page === 'analytics') renderAnalyticsPage();
    if (page === 'news') renderNewsTable();
    if (page === 'ads') renderAdsTable();
    if (page === 'categories') renderCategoriesTable();
    
    if (window.innerWidth <= 768) closeSidebar();
    window.scrollTo(0, 0);
}

// ── Language Tab Switching ──
function switchNewsLang(lang) {
    currentNewsLang = lang;
    document.querySelectorAll('.lang-tab').forEach(function(tab) {
        tab.classList.toggle('active', tab.dataset.lang === lang);
    });
    document.querySelectorAll('.lang-input').forEach(function(inp) {
        inp.style.display = inp.id.endsWith('-' + lang) ? 'block' : 'none';
    });
    document.querySelectorAll('.lang-textarea').forEach(function(ta) {
        ta.style.display = ta.id.endsWith('-' + lang) ? 'block' : 'none';
    });
    // Also handle excerpt textareas
    document.querySelectorAll('.lang-excerpt').forEach(function(ex) {
        ex.style.display = ex.id.endsWith('-' + lang) ? 'block' : 'none';
    });
    // Toggle content wrappers (English full content area)
    document.querySelectorAll('.lang-content-wrapper').forEach(function(wrapper) {
        wrapper.style.display = wrapper.dataset.lang === lang ? 'block' : 'none';
    });
}

// ── HTML Escape ──
let analyticsChart = null;

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ── Dashboard Renderer ──
function renderDashboard() {
    var cleanNews = adminNews.filter(function(n) { return !isUntitledOrGarbage(n); });
    var published = cleanNews.filter(function(n) { return n.status === 'published'; });

    var statTotalNews = document.getElementById('stat-total-news');
    var statPublished = document.getElementById('stat-published');
    var statActiveAds = document.getElementById('stat-active-ads');
    var statCategories = document.getElementById('stat-categories');
    var recentNewsTable = document.getElementById('recent-news-table');
    var recentAdsTable = document.getElementById('recent-ads-table');

    if (statTotalNews) statTotalNews.textContent = cleanNews.length;
    if (statPublished) statPublished.textContent = published.length;
    if (statActiveAds) statActiveAds.textContent = adminAds.filter(function(a) { return a.active; }).length;
    if (statCategories) statCategories.textContent = adminCats.length;

    if (recentNewsTable) {
        recentNewsTable.innerHTML = published.slice(0, 5).map(function(n) {
            return '<tr><td>' + escapeHtml(n.title_en || n.title) + '</td><td>' +
                escapeHtml(n.category_en || n.category) + '</td><td>' +
                new Date(n.date).toLocaleDateString() + '</td><td><span class="badge badge-green">Published</span></td></tr>';
        }).join('');
    }

    if (recentAdsTable) {
        recentAdsTable.innerHTML = adminAds.filter(function(a) { return a.active; }).slice(0, 5).map(function(a) {
            return '<tr><td>' + escapeHtml(a.title_en || a.title) + '</td><td>' +
                escapeHtml(a.position) + '</td><td><span class="badge badge-green">Active</span></td></tr>';
        }).join('');
    }
}

function renderAnalyticsPage() {
    // ═══════════════════════════════════════════════════════════
    // REAL ANALYTICS — data from Firestore 'analytics' collection
    // Tracks: article views, shares, daily totals
    // ═══════════════════════════════════════════════════════════
    var totalViewsEl = document.getElementById('stat-total-views');
    var adClicksEl = document.getElementById('stat-ad-clicks');
    var mobileEl = document.getElementById('stat-mobile-users');
    var countryEl = document.getElementById('stat-top-country');

    // Fallback values while loading
    if (totalViewsEl) totalViewsEl.textContent = '…';
    if (adClicksEl) adClicksEl.textContent = '…';
    if (mobileEl) mobileEl.textContent = '…';
    if (countryEl) countryEl.textContent = '…';

    var ctx = document.getElementById('analytics-chart');
    if (ctx && analyticsChart) { analyticsChart.destroy(); analyticsChart = null; }

    if (!db) {
        if (totalViewsEl) totalViewsEl.textContent = 'N/A';
        if (adClicksEl) adClicksEl.textContent = 'N/A';
        if (mobileEl) mobileEl.textContent = 'N/A';
        if (countryEl) countryEl.textContent = 'No DB';
        return;
    }

    db.collection('analytics').doc('totals').get().then(function(doc) {
        var t = doc.exists ? doc.data() : {};
        var views = (t.views || 0) + (t.localViews || 0);
        var shares = (t.shares || 0) + (t.localShares || 0);
        var mobile = t.mobile || 0, desktop = t.desktop || 0;
        var totalDevices = mobile + desktop;
        var mobilePct = totalDevices > 0 ? Math.round(mobile / totalDevices * 100) + '%' : '—';

        if (totalViewsEl) totalViewsEl.textContent = views.toLocaleString();
        if (adClicksEl) adClicksEl.textContent = shares.toLocaleString();
        if (mobileEl) mobileEl.textContent = mobilePct;
        if (countryEl) countryEl.textContent = t.topCountry || '—';
    }).catch(function() {
        if (totalViewsEl) totalViewsEl.textContent = 'Error';
    });

    // Daily chart — last 7 days real data
    var today = new Date();
    var labels = [], keys = [];
    for (var i = 6; i >= 0; i--) {
        var dt = new Date(today); dt.setDate(dt.getDate() - i);
        var key = dt.toISOString().slice(0, 10);
        keys.push(key);
        labels.push(dt.toLocaleDateString('en-GB', { weekday: 'short' }));
    }

    Promise.all(keys.map(function(k) {
        return db.collection('analytics').doc('daily_' + k).get().catch(function() { return null; });
    })).then(function(docs) {
        var data = docs.map(function(doc) {
            return (doc && doc.exists) ? (doc.data().views || 0) : 0;
        });
        if (!ctx) return;
        if (analyticsChart) analyticsChart.destroy();
        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{
                label: 'Page Views',
                data: data,
                fill: true,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#ef4444',
                pointRadius: 5,
                pointHoverRadius: 7
            }]},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(200,200,200,0.1)' }, ticks: { color: '#a0a0b8', precision: 0 } },
                    x: { grid: { display: false }, ticks: { color: '#a0a0b8' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════
// TRACKING — called from main website (scripts.js)
// ═══════════════════════════════════════════════════════════
async function trackAnalyticsEvent(type, articleId) {
    if (!db) return;
    var today = new Date().toISOString().slice(0, 10);
    var isMobile = window.innerWidth < 768;
    try {
        var totalsRef = db.collection('analytics').doc('totals');
        var dailyRef = db.collection('analytics').doc('daily_' + today);
        var totalsDoc = await totalsRef.get();
        if (!totalsDoc.exists) {
            await totalsRef.set({ views: 0, shares: 0, mobile: 0, desktop: 0 });
        }
        var upd = {};
        upd[type === 'share' ? 'shares' : 'views'] = firebase.firestore.FieldValue.increment(1);
        upd[isMobile ? 'mobile' : 'desktop'] = firebase.firestore.FieldValue.increment(1);
        await totalsRef.update(upd);
        var dailyDoc = await dailyRef.get();
        if (!dailyDoc.exists) await dailyRef.set({ views: 0, shares: 0, date: today });
        var dUpd = {};
        dUpd[type === 'share' ? 'shares' : 'views'] = firebase.firestore.FieldValue.increment(1);
        await dailyRef.update(dUpd);
    } catch (e) { /* silent — don't break UX */ }
}
function renderNewsTable() {
    dbg('>>> renderNewsTable called. adminNews.length =', adminNews.length);
    
    // CRITICAL FIX: Reload admin news from storage before rendering
    reloadAdminNewsFromStorage();

    if (adminNews.length > 0) {
        dbg('>>> First item id:', adminNews[0].id, 'title:', (adminNews[0].title || '').substring(0, 30));
    }

    // If admin news was empty, ensure default data is always loaded.
    if (adminNews.length === 0) {
        dbg('>>> adminNews is empty after localStorage load, restoring DEFAULT_NEWS');
        adminNews = JSON.parse(JSON.stringify(DEFAULT_NEWS));
        saveNews();
    }

    var tbody = document.getElementById('news-table-body');
    var mobileCards = document.getElementById('news-mobile-cards');
    if (!tbody && !mobileCards) {
        console.error('news-table-body not found');
        return;
    }

      var searchInput = document.getElementById('news-search');
    if (searchInput && searchInput.value && searchInput.value.indexOf('@') !== -1) searchInput.value = '';
    var search = searchInput ? searchInput.value.toLowerCase() : '';

    var filtered = adminNews.filter(function(n) {
        return !isUntitledOrGarbage(n);
    });

    dbg('>>> After filter, filtered.length =', filtered.length);

    if (search) {
        filtered = filtered.filter(function(n) {
            return (n.title && n.title.toLowerCase().indexOf(search) !== -1) ||
                (n.title_en && n.title_en.toLowerCase().indexOf(search) !== -1)

        });
    }

    var btnEditStyle = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:6px;background:#3b82f6;color:#fff;cursor:pointer;font-size:16px;margin-right:6px;transition:all 0.2s;';
    var btnDeleteStyle = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:6px;background:#ef4444;color:#fff;cursor:pointer;font-size:16px;transition:all 0.2s;';
    var btnEditHover = 'this.style.background=\'#2563eb\';this.style.transform=\'scale(1.05)\';';
    var btnEditOut = 'this.style.background=\'#3b82f6\';this.style.transform=\'scale(1)\';';
    var btnDeleteHover = 'this.style.background=\'#dc2626\';this.style.transform=\'scale(1.05)\';';
    var btnDeleteOut = 'this.style.background=\'#ef4444\';this.style.transform=\'scale(1)\';';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#6b7280;">No articles found. Click "+ Add New Article" to create one.</td></tr>';
    } else {
        tbody.innerHTML = filtered.map(function(n) {
            var langs = [];
            if (n.title) langs.push('<span class="badge badge-lang">TA</span>');
            if (n.title_en) langs.push('<span class="badge badge-lang">EN</span>');

            var dateStr = n.date ? new Date(n.date).toLocaleDateString() : 'N/A';
            var imgSrc = escapeHtml(n.image || '');
            var placeholder = 'https://via.placeholder.com/60x40?text=No+Image';
            return '<tr><td><img src="' + imgSrc + '" alt="" onerror="this.src=\'' + placeholder + '\'" style="width:60px;height:40px;object-fit:cover;border-radius:4px;"></td>' +
                '<td><strong>' + escapeHtml(n.title_en || n.title || '') + '</strong><br><small style="color:#6b7280;">' + escapeHtml(n.title || '') + '</small></td>' +
                '<td>' + escapeHtml(n.category_en || n.category || '') + '</td>' +
                '<td>' + escapeHtml(n.author_en || n.author || '') + '</td>' +
                '<td>' + dateStr + '</td>' +
                '<td>' + langs.join('') + '</td>' +
                '<td><span class="badge ' + (n.status === 'published' ? 'badge-green' : 'badge-gray') + '">' + (n.status || 'draft') + '</span></td>' +
                '<td><button class="btn-icon btn-edit" style="' + btnEditStyle + '" onmouseover="' + btnEditHover + '" onmouseout="' + btnEditOut + '" onclick="editNews(' + n.id + ')" title="Edit">&#9999;&#65039;</button>' +
                '<button class="btn-icon btn-delete" style="' + btnDeleteStyle + '" onmouseover="' + btnDeleteHover + '" onmouseout="' + btnDeleteOut + '" onclick="deleteNews(' + n.id + ')" title="Delete">&#128465;&#65039;</button></td></tr>';
        }).join('');
    }

    if (mobileCards) {
        if (filtered.length === 0) {
            mobileCards.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280;">No articles found.</div>';
        } else {
            mobileCards.innerHTML = filtered.map(function(n) {
                var dateStr = n.date ? new Date(n.date).toLocaleDateString() : 'N/A';
                var imgSrc = escapeHtml(n.image || '');
                var placeholder = 'https://via.placeholder.com/60x40?text=No+Image';
                return '<div class="mobile-card" style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1rem;margin-bottom:1rem;">' +
                    '<div class="card-header" style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">' +
                    '<img src="' + imgSrc + '" alt="" onerror="this.src=\'' + placeholder + '\'" style="width:60px;height:40px;object-fit:cover;border-radius:4px;">' +
                    '<div class="card-title" style="font-weight:600;font-size:0.95rem;">' + escapeHtml(n.title_en || n.title || 'Untitled') + '</div></div>' +
                    '<div class="card-meta" style="display:flex;flex-wrap:wrap;gap:0.5rem;font-size:0.8rem;color:#6b7280;margin-bottom:0.75rem;">' +
                    '<span>' + escapeHtml(n.category_en || n.category || 'Uncategorized') + '</span><span>|</span>' +
                    '<span>' + escapeHtml(n.author_en || n.author || 'Unknown') + '</span><span>|</span>' +
                    '<span>' + dateStr + '</span><span>|</span>' +
                    '<span class="badge ' + (n.status === 'published' ? 'badge-green' : 'badge-gray') + '">' + (n.status || 'draft') + '</span></div>' +
                    '<div class="card-actions" style="display:flex;gap:0.5rem;">' +
                    '<button style="' + btnEditStyle + 'width:44px;height:44px;" onmouseover="' + btnEditHover + '" onmouseout="' + btnEditOut + '" onclick="editNews(' + n.id + ')" title="Edit">&#9999;&#65039;</button>' +
                    '<button style="' + btnDeleteStyle + 'width:44px;height:44px;" onmouseover="' + btnDeleteHover + '" onmouseout="' + btnDeleteOut + '" onclick="deleteNews(' + n.id + ')" title="Delete">&#128465;&#65039;</button></div></div>';
            }).join('');
        }
    }
}

// ── Ads Table Renderer ──
function renderAdsTable() {
    var tbody = document.getElementById('ads-table-body');
    var mobileCards = document.getElementById('ads-mobile-cards');
    var filter = document.getElementById('ad-status-filter');
    if (!tbody) return;

    var filterValue = filter ? filter.value : 'all';

    var displayAds = adminAds;
    if (filterValue !== 'all') {
        displayAds = adminAds.filter(function(a) {
            return getAdStatus(a).status === filterValue;
        });
    }

    var btnEditStyle = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:6px;background:#3b82f6;color:#fff;cursor:pointer;font-size:16px;margin-right:6px;';
    var btnDeleteStyle = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:6px;background:#ef4444;color:#fff;cursor:pointer;font-size:16px;';

    if (displayAds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#6b7280;">No ads found. Click "+ Add New Ad" to create one.</td></tr>';
    } else {
        tbody.innerHTML = displayAds.map(function(a) {
            var status = getAdStatus(a);
            var start = a.startDate ? new Date(a.startDate) : null;
            var end = a.endDate ? new Date(a.endDate) : null;
            var startStr = start ? start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-';
            var endStr = end ? end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '-';
            var imgSrc = escapeHtml(a.image || '');

            return '<tr class="ad-row ' + status.status + '"><td><img src="' + imgSrc + '" alt="" style="width:80px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.style.display=&quot;none&quot;"></td>' +
                '<td><strong>' + escapeHtml(a.title_en || a.title || '') + '</strong><br><small style="color:#6b7280;">' + escapeHtml(a.title || '') + '</small></td>' +
                '<td>' + escapeHtml(a.position || '') + '</td>' +
                '<td><div class="duration-cell"><span class="duration-start">&#9654; ' + startStr + '</span><span class="duration-arrow">&rarr;</span><span class="duration-end">&#9632; ' + endStr + '</span></div></td>' +
                '<td><span class="badge ' + status.className + '">' + status.label + '</span></td>' +
                '<td><button class="btn-icon btn-edit" style="' + btnEditStyle + '" onclick="editAd(' + a.id + ')" title="Edit">&#9999;&#65039;</button>' +
                '<button class="btn-icon btn-delete" style="' + btnDeleteStyle + '" onclick="deleteAd(' + a.id + ')" title="Delete">&#128465;&#65039;</button></td></tr>';
        }).join('');
    }

    if (mobileCards) {
        if (displayAds.length === 0) {
            mobileCards.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280;">No ads found.</div>';
        } else {
            mobileCards.innerHTML = displayAds.map(function(a) {
                var status = getAdStatus(a);
                var start = a.startDate ? new Date(a.startDate) : null;
                var end = a.endDate ? new Date(a.endDate) : null;
                var startStr = start ? start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-';
                var endStr = end ? end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '-';
                var imgSrc = escapeHtml(a.image || '');

                return '<div class="mobile-card" style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1rem;margin-bottom:1rem;">' +
                    '<div class="card-header" style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">' +
                    '<img src="' + imgSrc + '" alt="" style="width:80px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.style.display=&quot;none&quot;">' +
                    '<div class="card-title" style="font-weight:600;">' + escapeHtml(a.title_en || a.title || 'Untitled') + '</div></div>' +
                    '<div class="card-meta" style="font-size:0.8rem;color:#6b7280;margin-bottom:0.75rem;">' +
                    '<span>' + escapeHtml(a.position || 'Unknown') + '</span> | ' +
                    '<span>' + startStr + ' &rarr; ' + endStr + '</span> | ' +
                    '<span class="badge ' + status.className + '">' + status.label + '</span></div>' +
                    '<div class="card-actions" style="display:flex;gap:0.5rem;">' +
                    '<button style="' + btnEditStyle + 'width:44px;height:44px;" onclick="editAd(' + a.id + ')" title="Edit">&#9999;&#65039;</button>' +
                    '<button style="' + btnDeleteStyle + 'width:44px;height:44px;" onclick="deleteAd(' + a.id + ')" title="Delete">&#128465;&#65039;</button></div></div>';
            }).join('');
        }
    }
}

// ── Categories Table Renderer ──
function renderCategoriesTable() {
    updateCategoryCounts();

    var tbody = document.getElementById('categories-table-body');
    var mobileCards = document.getElementById('categories-mobile-cards');
    if (!tbody) return;

    var btnDeleteStyle = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:6px;background:#ef4444;color:#fff;cursor:pointer;font-size:16px;';

    if (adminCats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:2rem;color:#6b7280;">No categories found.</td></tr>';
    } else {
        tbody.innerHTML = adminCats.map(function(c) {
            var catId = escapeHtml(c.id || '');
            return '<tr><td><strong>' + escapeHtml(c.name_en || '') + '</strong><br><small style="color:#6b7280;">' +
                escapeHtml(c.name || '') + '</small></td>' +
                '<td>' + c.count + '</td>' +
                '<td><button class="btn-icon btn-delete" style="' + btnDeleteStyle + '" onclick="deleteCategory(\'' + catId + '\')" title="Delete">&#128465;&#65039;</button></td></tr>';
        }).join('');
    }

    if (mobileCards) {
        if (adminCats.length === 0) {
            mobileCards.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280;">No categories found.</div>';
        } else {
            mobileCards.innerHTML = adminCats.map(function(c) {
                var catId = escapeHtml(c.id || '');
                return '<div class="mobile-card" style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1rem;margin-bottom:1rem;">' +
                    '<div class="card-title" style="font-weight:600;margin-bottom:0.5rem;">' + escapeHtml(c.name_en || '') + '</div>' +
                    '<div class="card-meta" style="font-size:0.8rem;color:#6b7280;margin-bottom:0.75rem;">' +
                    '<span>' + escapeHtml(c.name || '') + '</span> | ' +
                    '<span>' + c.count + ' articles</span></div>' +
                    '<div class="card-actions">' +
                    '<button style="' + btnDeleteStyle + 'width:44px;height:44px;" onclick="deleteCategory(\'' + catId + '\')" title="Delete">&#128465;&#65039;</button></div></div>';
            }).join('');
        }
    }
}

// ═══════════════════════════════════════
// NEWS MODAL
// ═══════════════════════════════════════
// ☁️ CLOUDINARY AUTO-OPTIMIZE — OG/ WhatsApp-safe JPG on paste
function optimizeCloudinary(url) {
    if (!url) return url;
    // res.cloudinary.com/{cloud}/image/upload/... → insert transform once
    if (/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)
        && !/\/image\/upload\/[^/]*(w_|q_|f_)/.test(url)) {
        return url.replace('/image/upload/', '/image/upload/w_1200,q_80,f_jpg/');
    }
    return url; // already optimized OR not cloudinary → untouched
}

function attachCloudinaryOptimize(input, after) {
    if (!input || input._clOpt) return;
    input._clOpt = true;
    var t = null;
    input.addEventListener('input', function() {
        clearTimeout(t);
        t = setTimeout(function() {
            var v = input.value.trim();
            var opt = optimizeCloudinary(v);
            if (opt !== v) {
                input.value = opt;
                if (typeof showToast === 'function') showToast('☁️ Image auto-optimized for sharing!', 'success');
                if (after) after(opt);
            }
        }, 600);
    });
}

function ensureImageOptimize() {
    attachCloudinaryOptimize(document.getElementById('news-image-url'), function() {
        if (typeof viewImageUrl === 'function') viewImageUrl(); // refresh preview
    });
}

// 🎬 VIDEO LINK — YT/FB/Vimeo/Cloudinary/MP4 + auto-thumbnail
function videoInfoFor(url) {
    if (!url) return null;
    var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) return { type: 'youtube', id: m[1], thumb: 'https://i.ytimg.com/vi/' + m[1] + '/hqdefault.jpg', embed: 'https://www.youtube-nocookie.com/embed/' + m[1] };
    m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return { type: 'vimeo', id: m[1], thumb: null, embed: 'https://player.vimeo.com/video/' + m[1] };
    m = url.match(/dailymotion\.com\/video\/([\w]+)/);
    if (m) return { type: 'dm', id: m[1], thumb: 'https://www.dailymotion.com/thumbnail/video/' + m[1] };
    if (/facebook\.com|fb\.watch/.test(url)) return { type: 'fb', thumb: null };
    // ☁️ Cloudinary video → poster frame auto-derive (so_0 = first frame as jpg)
    if (/res\.cloudinary\.com\/.*\/video\/upload\//.test(url)) {
        var t = url.replace('/video/upload/', '/video/upload/so_0/').replace(/\.(mp4|webm|mov|ogg)(\?.*)?$/i, '.jpg');
        return { type: 'direct', thumb: t };
    }
    if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)) return { type: 'direct', thumb: null };
    return { type: 'link', thumb: null };
}

function fillThumbFromVideo(thumbUrl) {
    if (!thumbUrl) return;
    var imgUrl = document.getElementById('news-image-url');
    var photoData = document.getElementById('news-photo-data');
    var hasUploaded = photoData && photoData.value;
    if (imgUrl && !imgUrl.value.trim() && !hasUploaded) {
        imgUrl.value = thumbUrl;
        if (typeof viewImageUrl === 'function') viewImageUrl();
        showToast('🎬 Thumbnail auto-set from video!', 'success');
    }
}

function ensureVideoLinkUI() {
    if (document.getElementById('news-video-link')) return;
    var anchor = document.getElementById('news-video-data');
    if (!anchor) return;
    var group = anchor.closest('.form-group');
    if (!group || !group.parentNode) return;
    var wrap = document.createElement('div');
    wrap.className = 'form-group';
    wrap.innerHTML =
        '<label>🎬 Video Link (optional — YouTube / Facebook / Cloudinary / MP4)</label>' +
        '<input type="text" id="news-video-link" placeholder="https://youtube.com/watch?v=... or https://res.cloudinary.com/.../video.mp4" ' +
        'style="width:100%;padding:0.65rem 0.875rem;border:1px solid #d1d5db;border-radius:6px;font-size:1rem;">' +
        '<small style="display:block;color:#9ca3af;font-size:0.78rem;margin-top:4px;">Paste a video link — the player embeds in the article and the thumbnail auto-fills the main image.</small>';
    group.parentNode.insertBefore(wrap, group.nextSibling);
    var input = document.getElementById('news-video-link');
    var timer = null;
    input.addEventListener('input', function() {
        clearTimeout(timer);
        timer = setTimeout(function() {
            var info = videoInfoFor(input.value.trim());
            if (!info) return;
            if (info.thumb) {
                fillThumbFromVideo(info.thumb);
            } else if (info.type === 'vimeo') {
                // Vimeo thumbnail via public oEmbed
                fetch('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(input.value.trim()))
                    .then(function(r) { return r.json(); })
                    .then(function(j) { if (j && j.thumbnail_url) fillThumbFromVideo(j.thumbnail_url); })
                    .catch(function() {});
            }
        }, 500);
    });
}

// 🖼️ GALLERY — multi-image support for articles
function ensureGalleryUI() {
    if (document.getElementById('gallery-rows')) return;
    var anchor = document.getElementById('news-image-url');
    if (!anchor) return;
    var group = anchor.closest('.form-group');
    if (!group || !group.parentNode) return;
    var wrap = document.createElement('div');
    wrap.className = 'form-group';
    wrap.innerHTML =
        '<label>🖼️ Gallery Images (optional — slideshow inside article)</label>' +
        '<div id="gallery-rows"></div>' +
        '<button type="button" id="btn-add-gallery" style="padding:0.5rem 1rem;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:6px;font-weight:600;font-size:0.85rem;cursor:pointer;">＋ Add Image URL</button>' +
        '<small style="display:block;color:#9ca3af;font-size:0.78rem;margin-top:4px;">Add extra images — readers swipe/click through them in the article.</small>';
    group.parentNode.insertBefore(wrap, group.nextSibling);
    document.getElementById('btn-add-gallery').addEventListener('click', function() { addGalleryRow(); });
}

function addGalleryRow(url) {
    var rows = document.getElementById('gallery-rows');
    if (!rows) return;
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:0.5rem;align-items:center;';
    row.innerHTML =
        '<input type="text" class="gal-url" placeholder="https://example.com/image2.jpg" ' +
        'style="flex:1;padding:0.6rem 0.875rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.95rem;min-width:0;">' +
        '<button type="button" class="gal-del" title="Remove" ' +
        'style="width:38px;height:38px;flex-shrink:0;border:none;border-radius:6px;background:#fee2e2;color:#991b1b;font-size:16px;cursor:pointer;">✕</button>';
    var galInput = row.querySelector('.gal-url');
    galInput.value = url || '';
    attachCloudinaryOptimize(galInput);
    row.querySelector('.gal-del').addEventListener('click', function() { row.remove(); });
    rows.appendChild(row);
}

function clearGalleryRows() {
    var rows = document.getElementById('gallery-rows');
    if (rows) rows.innerHTML = '';
}

function getGalleryUrls() {
    var out = [];
    var inputs = document.querySelectorAll('#gallery-rows .gal-url');
    for (var i = 0; i < inputs.length; i++) {
        var v = optimizeCloudinary(inputs[i].value.trim());
        if (v) out.push(v);
    }
    return out;
}

function loadGalleryRows(news) {
    clearGalleryRows();
    if (news && Array.isArray(news.images)) {
        news.images.forEach(function(u) { if (u) addGalleryRow(u); });
    }
}

function openNewsModal(isEdit) {
    isEdit = isEdit || false;
    var modal = document.getElementById('news-modal');
    var modalTitle = document.getElementById('news-modal-title');
    var catSelect = document.getElementById('news-category');

    if (modal) modal.classList.add('open');
    if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Article' : 'Add Article';

    if (catSelect) {
        catSelect.innerHTML = adminCats.map(function(c) {
            return '<option value="' + escapeHtml(c.name_en || '') + '">' + escapeHtml(c.name_en || '') + '</option>';
        }).join('');
    }

    if (!isEdit) {
        editingNewsId = null;
        var newsIdInput = document.getElementById('news-id');
        if (newsIdInput) newsIdInput.value = '';

               ['ta', 'en'].forEach(function(lang) {
            var titleInp = document.getElementById('news-title-' + lang);
            var excerptInp = document.getElementById('news-excerpt-' + lang);
            var authorInp = document.getElementById('news-author-' + lang);
            var contentTa = document.getElementById('news-content-' + lang);
            if (titleInp) titleInp.value = '';
            if (excerptInp) excerptInp.value = '';
            if (authorInp) authorInp.value = '';
            if (contentTa) contentTa.value = '';
        });

        var imageUrl = document.getElementById('news-image-url');
        var photoData = document.getElementById('news-photo-data');
        var videoData = document.getElementById('news-video-data');
        var photoPreview = document.getElementById('news-photo-preview');
        var videoPreview = document.getElementById('news-video-preview');
        var featured = document.getElementById('news-featured');
        var trending = document.getElementById('news-trending');
        var status = document.getElementById('news-status');

        if (imageUrl) imageUrl.value = '';
        if (photoData) photoData.value = '';
        if (videoData) videoData.value = '';
        if (photoPreview) photoPreview.src = '';
        var photoWrap = document.getElementById('photo-preview-wrap');
        var photoPlaceholder = document.getElementById('photo-placeholder');
        if (photoWrap) photoWrap.style.display = 'none';
        if (photoPlaceholder) photoPlaceholder.style.display = 'block';
        if (videoPreview) videoPreview.style.display = 'none';
        if (featured) featured.checked = false;
        if (trending) trending.checked = false;
        if (status) status.checked = true;

        // Set default date to now
        var dateInput = document.getElementById('news-date');
        if (dateInput) {
            var now = new Date();
            var yyyy = now.getFullYear();
            var mm = String(now.getMonth() + 1).padStart(2, '0');
            var dd = String(now.getDate()).padStart(2, '0');
            var hh = String(now.getHours()).padStart(2, '0');
            var min = String(now.getMinutes()).padStart(2, '0');
            dateInput.value = yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + min;
        }

        clearGalleryRows();
        ensureGalleryUI(); // gallery UI inject (first open)
        ensureVideoLinkUI();
        ensureImageOptimize();
        var vlink = document.getElementById('news-video-link');
        if (vlink) vlink.value = '';
        switchNewsLang('ta');
    } else {
        ensureGalleryUI();
        ensureVideoLinkUI();
        ensureImageOptimize();
    }
}

function closeNewsModal() {
    var modal = document.getElementById('news-modal');
    if (modal) modal.classList.remove('open');
}

function editNews(id) {
    var news = adminNews.find(function(n) {
        return n.id == id;
    });
    if (!news) {
        showToast('Article not found', 'error');
        return;
    }

    editingNewsId = id;
    openNewsModal(true);

    var newsIdInput = document.getElementById('news-id');
    var catSelect = document.getElementById('news-category');

    if (newsIdInput) newsIdInput.value = news.id;
    if (catSelect) catSelect.value = news.category_en || news.category || '';

        var fields = {
        'news-title': ['title', 'title_en'],
        'news-excerpt': ['excerpt', 'excerpt_en'],
        'news-author': ['author', 'author_en'],
        'news-content': ['content', 'content_en']
    };

    ['ta', 'en', 'si'].forEach(function(lang, idx) {
        Object.keys(fields).forEach(function(prefix) {
            var keys = fields[prefix];
            var el = document.getElementById(prefix + '-' + lang);
            if (!el) return;
            el.value = news[keys[idx]] || '';
        });
    });

    var imageUrl = document.getElementById('news-image-url');
    var featured = document.getElementById('news-featured');
    var trending = document.getElementById('news-trending');
    var status = document.getElementById('news-status');
    var photoPreview = document.getElementById('news-photo-preview');
    var videoPreview = document.getElementById('news-video-preview');

    if (imageUrl) imageUrl.value = news.image || '';
    if (featured) featured.checked = !!news.featured;
    if (trending) trending.checked = !!news.trending;
    if (status) status.checked = news.status !== 'draft'; // legacy articles (no status) default to PUBLISHED

    if (news.image && photoPreview) {
        photoPreview.src = news.image;
        var wrap = document.getElementById('photo-preview-wrap');
        var placeholder = document.getElementById('photo-placeholder');
        if (wrap) wrap.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    }

    // Set date input with original publish date
    var dateInput = document.getElementById('news-date');
    if (dateInput && news.date) {
        var d = new Date(news.date);
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        var hh = String(d.getHours()).padStart(2, '0');
        var min = String(d.getMinutes()).padStart(2, '0');
        var dateStr = yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + min;
        dateInput.value = dateStr;
        dateInput.dataset.originalDate = dateStr; // Store for comparison
    }
    if (news.video && videoPreview) {
        videoPreview.src = news.video;
        videoPreview.style.display = 'block';
    }
    ensureGalleryUI();
    ensureVideoLinkUI();
    loadGalleryRows(news);
    var _vl = document.getElementById('news-video-link');
    if (_vl) _vl.value = news.videoLink || '';
    switchNewsLang('ta');
}

async function saveNewsItem() {
    var catSelect = document.getElementById('news-category');
    var category = catSelect ? catSelect.value : '';
    var catObj = adminCats.find(function(c) {
        return c.name_en === category;
    });

    var excerpt_ta_el = document.getElementById('news-excerpt-ta');
    var excerpt_en_el = document.getElementById('news-excerpt-en');

    var title_ta_el = document.getElementById('news-title-ta');
    var title_en_el = document.getElementById('news-title-en');
    var author_ta_el = document.getElementById('news-author-ta');
    var author_en_el = document.getElementById('news-author-en');
    var content_ta_el = document.getElementById('news-content-ta');
    var content_en_el = document.getElementById('news-content-en');
    var imageUrl_el = document.getElementById('news-image-url');
    var photoData_el = document.getElementById('news-photo-data');
    var videoData_el = document.getElementById('news-video-data');
    var featured_el = document.getElementById('news-featured');
    var trending_el = document.getElementById('news-trending');
    var status_el = document.getElementById('news-status');

    var title_ta = title_ta_el ? title_ta_el.value.trim() : '';
    var title_en = title_en_el ? title_en_el.value.trim() : '';

    var author_ta = author_ta_el ? author_ta_el.value.trim() : '';
    var author_en = author_en_el ? author_en_el.value.trim() : '';
    var content_ta = content_ta_el ? content_ta_el.value.trim() : '';
    var content_en = content_en_el ? content_en_el.value.trim() : '';
    var imageUrl = imageUrl_el ? imageUrl_el.value.trim() : '';
    imageUrl = optimizeCloudinary(imageUrl); // ☁️ guarantee optimized
    var photoData = photoData_el ? photoData_el.value : '';
    var videoData = videoData_el ? videoData_el.value : '';
    var _vlEl = document.getElementById('news-video-link');
    var videoLinkVal = _vlEl ? _vlEl.value.trim() : '';
    var featured = featured_el ? featured_el.checked : false;
    var trending = trending_el ? trending_el.checked : false;
    var status = status_el ? (status_el.checked ? 'published' : 'draft') : 'draft';

    var excerpt_ta = excerpt_ta_el ? excerpt_ta_el.value.trim() : '';
    var excerpt_en = excerpt_en_el ? excerpt_en_el.value.trim() : '';

    if (!title_ta || !category || !author_ta || !content_ta) {
        showToast('Please fill all required Tamil fields', 'error');
        switchNewsLang('ta');
        return;
    }

    var newsItem = {
        id: editingNewsId || Date.now(),
        title: title_ta,
        title_en: title_en || title_ta,


        excerpt: excerpt_ta,
        excerpt_en: excerpt_en || excerpt_ta,


        content: content_ta,
        content_en: content_en || content_ta,

        category: catObj ? catObj.name : category,
        category_en: catObj ? catObj.name_en : category,

        author: author_ta,
        author_en: author_en || author_ta,

        date: (function() {
            var dateInput = document.getElementById('news-date');
            var inputVal = dateInput ? dateInput.value : '';

            if (editingNewsId) {
                // EDITING: Preserve original publish date unless user explicitly changed it
                var original = adminNews.find(function(n) { return n.id == editingNewsId; });
                if (original && original.date) {
                    var origD = new Date(original.date);
                    var origStr = origD.getFullYear() + '-' + 
                        String(origD.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(origD.getDate()).padStart(2, '0') + 'T' + 
                        String(origD.getHours()).padStart(2, '0') + ':' + 
                        String(origD.getMinutes()).padStart(2, '0');
                    // If input matches original or is empty, preserve original date
                    if (!inputVal || inputVal === origStr) {
                        return original.date;
                    }
                }
                // User changed the date
                return inputVal ? new Date(inputVal).toISOString() : new Date().toISOString();
            } else {
                // NEW ARTICLE: Use selected date or current date
                return inputVal ? new Date(inputVal).toISOString() : new Date().toISOString();
            }
        })(),
        lastModified: new Date().toISOString(),
        images: getGalleryUrls(), // 🖼️ gallery slideshow images
        videoLink: videoLinkVal,  // 🎬 external video (YT/FB/Vimeo/MP4)
        image: photoData || imageUrl || (function(){
            var g = getGalleryUrls();
            if (g.length) return g[0];
            var vi = videoInfoFor(videoLinkVal);   // 🎬 video-thumb fallback
            if (vi && vi.thumb) return vi.thumb;
            return 'https://via.placeholder.com/800x400?text=EndLess+News';
        })(),
        video: videoData,
        featured: featured,
        trending: trending,
        status: status

    };

    if (editingNewsId) {
        var idx = adminNews.findIndex(function(n) {
            return n.id == editingNewsId;
        });
        if (idx !== -1) {
            adminNews[idx] = Object.assign({}, adminNews[idx], newsItem, { id: editingNewsId });
        }
    } else {
        adminNews.unshift(newsItem);
    }

    saveNews();
    updateCategoryCounts();

    if (db) {
        try {
            // Save the news item to Firebase FIRST before syncing
            await db.collection('news').doc(String(newsItem.id)).set(newsItem);
            dbg('News item saved to Firebase:', newsItem.id);
        } catch (err) {
            console.warn('Firebase write failed:', err); showToast('⚠️ Cloud save FAILED — login again & republish!', 'error');
        }
    }

    // Generate share page for this article
    saveSharePage(newsItem);

    closeNewsModal();
    renderNewsTable();
    renderDashboard();

    var missing = [];
    if (!title_en) missing.push('English');

    if (missing.length > 0 && !editingNewsId) {
        showToast('Article saved! Note: Missing ' + missing.join(', ') + ' title - filled with Tamil');
    } else {
        showToast(editingNewsId ? 'Article updated!' : 'Article published!');
    }
}

async function deleteNews(id) {
    if (!confirm('Delete this article?')) return;
    adminNews = adminNews.filter(function(n) {
        return n.id != id;
    });
    saveNews();
    updateCategoryCounts();

    if (db) {
        try {
            await db.collection('news').doc(String(id)).delete();
        } catch (err) {
            console.warn('Firebase delete failed:', err);
        }
    }

    renderNewsTable();
    renderDashboard();
    renderCategoriesTable();
    showToast('Article deleted');
}

// ── Ad Duration Helpers ──
function getAdStatus(ad) {
    var now = new Date();
    var start = ad.startDate ? new Date(ad.startDate) : null;
    var end = ad.endDate ? new Date(ad.endDate) : null;

    if (!start || !end) {
        return { status: 'active', label: 'Active', className: 'badge-green' };
    }

    if (end < now) {
        return { status: 'expired', label: 'Expired', className: 'badge-red' };
    } else if (start > now) {
        var daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
        return { status: 'scheduled', label: 'In ' + daysUntil + 'd', className: 'badge-blue' };
    } else {
        var daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return { status: 'active', label: daysLeft + 'd left', className: 'badge-green' };
    }
}

function updateDurationPreview() {
    var startInput = document.getElementById('ad-start-date');
    var endInput = document.getElementById('ad-end-date');
    var badge = document.getElementById('duration-badge');

    if (!startInput || !endInput || !badge) return;

    if (!startInput.value || !endInput.value) {
        badge.textContent = 'Select dates to see duration';
        badge.className = 'duration-badge';
        return;
    }

    var start = new Date(startInput.value);
    var end = new Date(endInput.value);
    var now = new Date();

    if (end <= start) {
        badge.textContent = 'End date must be after start date!';
        badge.className = 'duration-badge error';
        return;
    }

    var diffMs = end - start;
    var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    var diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    var durationText = '';
    if (diffDays >= 1) {
        durationText = diffDays + ' day' + (diffDays > 1 ? 's' : '');
    } else {
        durationText = diffHours + ' hour' + (diffHours > 1 ? 's' : '');
    }

    var statusText = '';
    var badgeClass = 'duration-badge';

    if (end < now) {
        statusText = ' (Will be EXPIRED)';
        badgeClass += ' expired';
    } else if (start > now) {
        var daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
        statusText = ' (Starts in ' + daysUntil + ' day' + (daysUntil > 1 ? 's' : '') + ')';
        badgeClass += ' scheduled';
    } else {
        var daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        statusText = ' (' + daysLeft + ' day' + (daysLeft > 1 ? 's' : '') + ' left)';
        badgeClass += ' active';
    }

    badge.textContent = 'Duration: ' + durationText + statusText;
    badge.className = badgeClass;
}

// ═══════════════════════════════════════
// AD MODAL
// ═══════════════════════════════════════
function ensureAdMobileImgUI() {
    if (document.getElementById('ad-mobile-image')) return;
    var anchor = document.getElementById('ad-image');
    if (!anchor) return;
    var group = anchor.closest('.form-group');
    if (!group || !group.parentNode) return;
    var wrap = document.createElement('div');
    wrap.className = 'form-group';
    wrap.innerHTML =
        '<label>Mobile Image URL (optional — phones show this instead)</label>' +
        '<input type="text" id="ad-mobile-image" placeholder="https://.../mobile-banner.jpg" ' +
        'style="width:100%;padding:0.65rem 0.875rem;border:1px solid #d1d5db;border-radius:6px;font-size:1rem;">' +
        '<small style="display:block;color:#9ca3af;font-size:0.78rem;margin-top:4px;">💡 If empty, all devices use the main image. If set, mobile users see THIS, desktop users see the main one.</small>';
    group.parentNode.insertBefore(wrap, group.nextSibling);
}

// 🎯 PER-AD in-article toggle — each ad-ku thaniya tick (Ad modal-la)
function ensureAdInArticleChk() {
    if (document.getElementById('ad-inarticle')) return;
    var anchor = document.getElementById('ad-active');
    if (!anchor) return;
    var group = anchor.closest('.form-group');
    if (!group || !group.parentNode) return;
    var wrap = document.createElement('div');
    wrap.className = 'form-group';
    wrap.innerHTML = '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-weight:600;">' +
        '<input type="checkbox" id="ad-inarticle" style="width:18px;height:18px;cursor:pointer;">' +
        ' 📰 Show in Articles <small style="color:#9ca3af;font-weight:400;">(paragraphs-ku nadula varum)</small></label>';
    group.parentNode.insertBefore(wrap, group.nextSibling);
}

function openAdModal(isEdit) {
    isEdit = isEdit || false;
    ensureAdMobileImgUI(); // 📱 mobile image field
    ensureAdInArticleChk(); // 🎯 per-ad in-article tick

    // 📐 Exact banner sizes guide (injected — updates the static info box)
    var _sizeInfo = document.querySelector('.ad-size-info');
    if (_sizeInfo) {
        _sizeInfo.innerHTML =
            '<strong>📐 Exact Banner Sizes (width × height, pixels):</strong><br>' +
            '• <b>Header:</b> 1200 × 200<br>' +
            '• <b>Sidebar:</b> 720 × 560 (add multiple — stacks with gap)<br>' +
            '• <b>Inline:</b> 1200 × 240<br>' +
            '• <b>Article View:</b> 1200 × 390';
    }
    // 🎯 Position options — injected (includes Article View slot for sponsors)
    var _pos = document.getElementById('ad-position');
    if (_pos && !_pos.querySelector('option[value="modal"]')) {
        _pos.innerHTML =
            '<option value="header">Header Banner (top of site)</option>' +
            '<option value="sidebar">Sidebar — Right Rail (stacks multiple)</option>' +
            '<option value="inline">Inline (between articles)</option>' +
            '<option value="modal">Article View (inside article popup)</option>';
    }
    var modal = document.getElementById('ad-modal');
    var modalTitle = document.getElementById('ad-modal-title');

    if (modal) modal.classList.add('open');
    if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Advertisement' : 'Add Advertisement';

    if (!isEdit) {
        editingAdId = null;
        var adId = document.getElementById('ad-id');
        var titleTa = document.getElementById('ad-title-ta');
        var titleEn = document.getElementById('ad-title-en');
        var link = document.getElementById('ad-link');
        var position = document.getElementById('ad-position');
        var image = document.getElementById('ad-image');
        var imagePreview = document.getElementById('ad-image-preview');
        var active = document.getElementById('ad-active');
        var startDate = document.getElementById('ad-start-date');
        var endDate = document.getElementById('ad-end-date');

        if (adId) adId.value = '';
        if (titleTa) titleTa.value = '';
        if (titleEn) titleEn.value = '';
        if (link) link.value = '';
        if (position) position.value = 'header';
        if (image) image.value = '';
        if (imagePreview) imagePreview.style.display = 'none';
        var mImg = document.getElementById('ad-mobile-image');
        if (mImg) mImg.value = '';
        var iaChk = document.getElementById('ad-inarticle');
        if (iaChk) iaChk.checked = false; // 🎯 default OFF
        if (active) active.checked = true;

        // Set default dates: start = now, end = now + 7 days
        var now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        var nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);

        if (startDate) startDate.value = now.toISOString().slice(0, 16);
        if (endDate) endDate.value = nextWeek.toISOString().slice(0, 16);
        updateDurationPreview();
    }
}

function closeAdModal() {
    var modal = document.getElementById('ad-modal');
    if (modal) modal.classList.remove('open');
}

function editAd(id) {
    var ad = adminAds.find(function(a) {
        return a.id == id;
    });
    if (!ad) {
        showToast('Ad not found', 'error');
        return;
    }

    editingAdId = id;
    openAdModal(true);

    var adId = document.getElementById('ad-id');
    var titleTa = document.getElementById('ad-title-ta');
    var titleEn = document.getElementById('ad-title-en');
    var link = document.getElementById('ad-link');
    var position = document.getElementById('ad-position');
    var image = document.getElementById('ad-image');
    var active = document.getElementById('ad-active');
    var imagePreview = document.getElementById('ad-image-preview');
    var startDate = document.getElementById('ad-start-date');
    var endDate = document.getElementById('ad-end-date');

    if (adId) adId.value = ad.id;
    if (titleTa) titleTa.value = ad.title || '';
    if (titleEn) titleEn.value = ad.title_en || '';
    if (link) link.value = ad.link || '';
    if (position) position.value = ad.position || 'header';
    if (image) image.value = ad.image || '';
    if (active) active.checked = !!ad.active;

    // Populate duration fields
    if (ad.startDate && startDate) {
        var sd = new Date(ad.startDate);
        sd.setMinutes(sd.getMinutes() - sd.getTimezoneOffset());
        startDate.value = sd.toISOString().slice(0, 16);
    }
    if (ad.endDate && endDate) {
        var ed = new Date(ad.endDate);
        ed.setMinutes(ed.getMinutes() - ed.getTimezoneOffset());
        endDate.value = ed.toISOString().slice(0, 16);
    }
    updateDurationPreview();

    if (ad.image && imagePreview) {
        imagePreview.src = ad.image;
        imagePreview.style.display = 'block';
    }
    var _mImg = document.getElementById('ad-mobile-image');
    if (_mImg) _mImg.value = ad.mobileImage || '';
    var _ia = document.getElementById('ad-inarticle');
    if (_ia) _ia.checked = !!ad.inArticle; // 🎯 per-ad flag restore
}

async function saveAdItem() {
    var title_ta_el = document.getElementById('ad-title-ta');
    var title_en_el = document.getElementById('ad-title-en');

    var link_el = document.getElementById('ad-link');
    var position_el = document.getElementById('ad-position');
    var image_el = document.getElementById('ad-image');
    var active_el = document.getElementById('ad-active');

    var title_ta = title_ta_el ? title_ta_el.value.trim() : '';
    var title_en = title_en_el ? title_en_el.value.trim() : '';

    var link = link_el ? link_el.value.trim() : '';
    var position = position_el ? position_el.value : 'header';
    var image = image_el ? image_el.value.trim() : 'https://via.placeholder.com/600x200?text=Ad';
    var active = active_el ? active_el.checked : false;

        if (!title_ta || !link) {
        showToast('Please fill Tamil title and link', 'error');
        return;
    }

    var startDate_el = document.getElementById('ad-start-date');
    var endDate_el = document.getElementById('ad-end-date');
    var startDateVal = startDate_el ? startDate_el.value : '';
    var endDateVal = endDate_el ? endDate_el.value : '';

    if (!startDateVal || !endDateVal) {
        showToast('Please select start and end dates', 'error');
        return;
    }

    var startDateObj = new Date(startDateVal);
    var endDateObj = new Date(endDateVal);

    if (endDateObj <= startDateObj) {
        showToast('End date must be after start date!', 'error');
        return;
    }

    var _mImgEl = document.getElementById('ad-mobile-image');
    var mobileImg = _mImgEl ? _mImgEl.value.trim() : '';
    var adItem = {
        id: editingAdId || Date.now(),
        title: title_ta,
        title_en: title_en || title_ta,
        link: link,
        image: image,
        mobileImage: mobileImg || null, // 📱 optional mobile-only image
        inArticle: (document.getElementById('ad-inarticle') || {}).checked === true, // 🎯 per-ad tick
        position: position,
        active: active,
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString()
    };

    if (editingAdId) {
        var idx = adminAds.findIndex(function(a) {
            return a.id == editingAdId;
        });
        if (idx !== -1) {
            adminAds[idx] = Object.assign({}, adminAds[idx], adItem, { id: editingAdId });
        }
    } else {
        adminAds.push(adItem);
    }

    saveAds();

    if (db) {
        try {
            await db.collection('ads').doc(String(adItem.id)).set(adItem);
        } catch (err) {
            console.warn('Firebase ad sync failed:', err);
        }
    }

    closeAdModal();
    renderAdsTable();
    renderDashboard();
    showToast(editingAdId ? 'Ad updated!' : 'Ad saved!');
}

async function deleteAd(id) {
    if (!confirm('Delete this ad?')) return;
    adminAds = adminAds.filter(function(a) {
        return a.id != id;
    });
    saveAds();

    if (db) {
        try {
            await db.collection('ads').doc(String(id)).delete();
        } catch (err) {
            console.warn('Firebase ad delete failed:', err);
        }
    }

    renderAdsTable();
    renderDashboard();
    showToast('Ad deleted');
}

// ═══════════════════════════════════════
// CATEGORY MODAL
// ═══════════════════════════════════════
function openCatModal() {
    var modal = document.getElementById('cat-modal');
    if (modal) modal.classList.add('open');

    var nameTa = document.getElementById('cat-name-ta');
    var nameEn = document.getElementById('cat-name-en');

    if (nameTa) nameTa.value = '';
    if (nameEn) nameEn.value = '';
    if (nameSi) nameSi.value = '';
}

function closeCatModal() {
    var modal = document.getElementById('cat-modal');
    if (modal) modal.classList.remove('open');
}

async function saveCategory() {
    var name_ta_el = document.getElementById('cat-name-ta');
    var name_en_el = document.getElementById('cat-name-en');


    var name_ta = name_ta_el ? name_ta_el.value.trim() : '';
    var name_en = name_en_el ? name_en_el.value.trim() : '';


    if (!name_en) {
        showToast('English category name is required', 'error');
        return;
    }

    var id = name_en.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    var catItem = {
        id: id,
        name: name_ta || name_en,
        name_en: name_en,

        count: 0
    };

    adminCats.push(catItem);
    saveCats();

    if (db) {
        try {
            await db.collection('categories').doc(String(id)).set(catItem);
        } catch (err) {
            console.warn('Firebase category sync failed:', err);
        }
    }

    closeCatModal();
    renderCategoriesTable();
    renderDashboard();
    showToast('Category added!');
}

async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return;
    adminCats = adminCats.filter(function(c) {
        return c.id !== id;
    });
    saveCats();

    if (db) {
        try {
            await db.collection('categories').doc(String(id)).delete();
        } catch (err) {
            console.warn('Firebase category delete failed:', err);
        }
    }

    renderCategoriesTable();
    renderDashboard();
    showToast('Category deleted');
}


// ── Delete Uploaded Photo ──
function deleteUploadedPhoto() {
    var fileInput = document.getElementById('news-photo-file');
    var photoData = document.getElementById('news-photo-data');
    var previewWrap = document.getElementById('photo-preview-wrap');
    var previewImg = document.getElementById('news-photo-preview');
    var placeholder = document.getElementById('photo-placeholder');

    if (fileInput) fileInput.value = '';
    if (photoData) photoData.value = '';
    if (previewImg) previewImg.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    showToast('Photo removed', 'success');
}

// ── View Image from URL ──
function viewImageUrl() {
    var urlInput = document.getElementById('news-image-url');
    var previewWrap = document.getElementById('url-image-preview-wrap');
    var previewImg = document.getElementById('url-image-preview');
    var url = urlInput ? urlInput.value.trim() : '';

    if (!url) {
        showToast('Please enter an image URL first', 'error');
        return;
    }

    previewImg.src = url;
    previewImg.onerror = function() {
        previewWrap.style.display = 'none';
        showToast('Failed to load image. Check the URL.', 'error');
    };
    previewImg.onload = function() {
        previewWrap.style.display = 'block';
    };
}

// ═══════════════════════════════════════
// FILE UPLOAD HANDLERS
// ═══════════════════════════════════════
function handleFileUpload(inputId, previewId, dataId, type) {
    type = type || 'image';
    var input = document.getElementById(inputId);
    var preview = document.getElementById(previewId);
    var dataInput = document.getElementById(dataId);

    if (!input) return;

    input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(event) {
            if (dataInput) dataInput.value = event.target.result;
            if (preview) {
                preview.src = event.target.result;
            }
            var wrap = document.getElementById('photo-preview-wrap');
            var placeholder = document.getElementById('photo-placeholder');
            if (wrap) wrap.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        };
        reader.onerror = function() {
            showToast('File read failed', 'error');
        };
        reader.readAsDataURL(file);
    });

    var uploadArea = input.closest('.upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--admin-primary)';
        });
        uploadArea.addEventListener('dragleave', function() {
            uploadArea.style.borderColor = '#d1d5db';
        });
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#d1d5db';
            var files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                input.dispatchEvent(new Event('change'));
            }
        });
    }
}

// ═══════════════════════════════════════
// RESET DATA
// ═══════════════════════════════════════
async function resetData() {
    // 🔒 HARDENED: Real gate = Firebase Auth + Security Rules (server-side).
    // Old fake password field removed — no client-side password to bypass.
    if (typeof firebase !== 'undefined' && firebase.auth) {
        var _u = firebase.auth().currentUser;
        if (!_u || _u.email !== 'endlessnewslk@gmail.com') {
            showToast('⛔ Not authorized — login as admin first', 'error');
            return;
        }
    }

    if (!confirm('WARNING: This will erase all data and restore defaults. Continue?')) return;

    localStorage.removeItem('endless_news');
    localStorage.removeItem('endless_ads');
    localStorage.removeItem('endless_categories');

    adminNews = JSON.parse(JSON.stringify(DEFAULT_NEWS));
    adminAds = JSON.parse(JSON.stringify(DEFAULT_ADS));
    adminCats = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));

    saveNews();
    saveAds();
    saveCats();

    if (db) {
        try {
            var batch = db.batch();
            adminNews.forEach(function(n) {
                batch.set(db.collection('news').doc(String(n.id)), n);
            });
            adminAds.forEach(function(a) {
                batch.set(db.collection('ads').doc(String(a.id)), a);
            });
            adminCats.forEach(function(c) {
                batch.set(db.collection('categories').doc(String(c.id)), c);
            });
            await batch.commit();
        } catch (err) {
            console.warn('Firebase batch write failed:', err);
        }
    }

    if (passwordInput) passwordInput.value = '';

    renderDashboard();
    renderNewsTable();
    renderAdsTable();
    renderCategoriesTable();
    showToast('Data reset to defaults');
}

// ═══════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    initData().then(function() {

    var headerMenuBtn = document.getElementById('header-menu-btn');
    var sidebarOverlay = document.getElementById('sidebar-overlay');

    if (headerMenuBtn) headerMenuBtn.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('.nav-item').forEach(function(btn) {
        btn.addEventListener('click', function() {
            showPage(btn.dataset.page);
        });
    });

    document.querySelectorAll('.nav-item-mobile').forEach(function(btn) {
        btn.addEventListener('click', function() {
            showPage(btn.dataset.page);
        });
    });

    var btnAddNews = document.getElementById('btn-add-news');
    var closeNewsModalBtn = document.getElementById('close-news-modal');
    var cancelNews = document.getElementById('cancel-news');
    var saveNewsBtn = document.getElementById('save-news');

    if (btnAddNews) btnAddNews.addEventListener('click', function() { openNewsModal(); });
    if (closeNewsModalBtn) closeNewsModalBtn.addEventListener('click', closeNewsModal);
    if (cancelNews) cancelNews.addEventListener('click', closeNewsModal);
    if (saveNewsBtn) saveNewsBtn.addEventListener('click', saveNewsItem);

    document.querySelectorAll('.lang-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            switchNewsLang(tab.dataset.lang);
        });
    });

    var btnAddAd = document.getElementById('btn-add-ad');
    var closeAdModalBtn = document.getElementById('close-ad-modal');
    var cancelAd = document.getElementById('cancel-ad');
    var saveAdBtn = document.getElementById('save-ad');
    var adStartDate = document.getElementById('ad-start-date');
    var adEndDate = document.getElementById('ad-end-date');
    var adStatusFilter = document.getElementById('ad-status-filter');

    if (btnAddAd) btnAddAd.addEventListener('click', function() { openAdModal(); });
    if (closeAdModalBtn) closeAdModalBtn.addEventListener('click', closeAdModal);
    if (cancelAd) cancelAd.addEventListener('click', closeAdModal);
    if (saveAdBtn) saveAdBtn.addEventListener('click', saveAdItem);

    var adStartDate = document.getElementById('ad-start-date');
    var adEndDate = document.getElementById('ad-end-date');
    var adStatusFilter = document.getElementById('ad-status-filter');

    if (adStartDate) adStartDate.addEventListener('change', updateDurationPreview);
    if (adEndDate) adEndDate.addEventListener('change', updateDurationPreview);
    if (adStatusFilter) adStatusFilter.addEventListener('change', renderAdsTable);
    if (adStartDate) adStartDate.addEventListener('change', updateDurationPreview);
    if (adEndDate) adEndDate.addEventListener('change', updateDurationPreview);
    if (adStatusFilter) adStatusFilter.addEventListener('change', renderAdsTable);

    var btnAddCat = document.getElementById('btn-add-cat');
    var closeCatModalBtn = document.getElementById('close-cat-modal');
    var cancelCat = document.getElementById('cancel-cat');
    var saveCatBtn = document.getElementById('save-cat');

    if (btnAddCat) btnAddCat.addEventListener('click', openCatModal);
    if (closeCatModalBtn) closeCatModalBtn.addEventListener('click', closeCatModal);
    if (cancelCat) cancelCat.addEventListener('click', closeCatModal);
    if (saveCatBtn) saveCatBtn.addEventListener('click', saveCategory);

    handleFileUpload('news-photo-file', 'news-photo-preview', 'news-photo-data', 'image');
    handleFileUpload('news-video-file', 'news-video-preview', 'news-video-data', 'video');

    var adImageFile = document.getElementById('ad-image-file');
    if (adImageFile) {
        adImageFile.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(event) {
                var adImage = document.getElementById('ad-image');
                var adImagePreview = document.getElementById('ad-image-preview');
                if (adImage) adImage.value = event.target.result;
                if (adImagePreview) {
                    adImagePreview.src = event.target.result;
                    adImagePreview.style.display = 'block';
                }
            };
            reader.onerror = function() {
                showToast('Image upload failed', 'error');
            };
            reader.readAsDataURL(file);
        });
    }

    var newsSearch = document.getElementById('news-search');
    if (newsSearch) newsSearch.addEventListener('input', renderNewsTable);

    var btnResetData = document.getElementById('btn-reset-data');
    if (btnResetData) btnResetData.addEventListener('click', resetData);

    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) closeSidebar();
    });

    var touchStartX = 0;
    var sidebar = document.getElementById('admin-sidebar');
    if (sidebar) {
        sidebar.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        sidebar.addEventListener('touchend', function(e) {
            var touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 100) closeSidebar();
        }, { passive: true });
    }

    // CRITICAL FIX: Render dashboard immediately after init
    renderDashboard();
    
    // CRITICAL FIX: If current page is news, render it too
    if (currentPage === 'news') {
        renderNewsTable();
    }

    // Add event listeners for copy buttons
    document.querySelectorAll('.btn-copy').forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.dataset.lang;
            const content = document.getElementById('news-content-' + lang).value;
            navigator.clipboard.writeText(content).then(() => {
                showToast('Content copied!', 'success');
            }, () => {
                showToast('Failed to copy content.', 'error');
            });
        });
    });
    }).catch(function(err) {
        console.error('initData failed:', err);
        // Ensure data is loaded even if initData fails
        reloadAdminNewsFromStorage();
        if (adminNews.length === 0) {
            adminNews = JSON.parse(JSON.stringify(DEFAULT_NEWS));
            saveNews();
        }
        renderDashboard();
        if (currentPage === 'news') renderNewsTable();
    });
});