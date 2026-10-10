function renderAnalyticsPage() {
    var page = document.getElementById('page-analytics');
    if (!page) return;

    // 🎨 Full rebuild once — FB Insights style layout
    if (!document.getElementById('an-fb-root')) {
        page.innerHTML =
        '<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));">' +
            '<div class="stat-card"><div class="stat-icon">' + IC.eye + '</div><div class="stat-info"><h3 id="an-views">—</h3><p>Total Views</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">' + IC.heart + '</div><div class="stat-info"><h3 id="an-likes">—</h3><p>Total Likes</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">' + IC.share + '</div><div class="stat-info"><h3 id="an-shares">—</h3><p>Shares</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">' + IC.phone + '</div><div class="stat-info"><h3 id="an-mobile">—</h3><p>Mobile %</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon" style="background:#fef3c7;">⚡</div><div class="stat-info"><h3 id="an-engage">—</h3><p>Engagement</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon" style="background:#dbeafe;">' + IC.globe + '</div><div class="stat-info"><h3 id="an-countries">—</h3><p>Countries</p></div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-bottom:1.5rem;" class="an-grid-1">' +
            '<div class="panel"><h3>📈 Views — Last 7 Days</h3><div style="height:220px;"><canvas id="analytics-chart"></canvas></div></div>' +
            '<div class="panel"><h3>📱 Devices</h3><div style="height:220px;display:flex;align-items:center;justify-content:center;"><canvas id="an-devices"></canvas></div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:1.5rem;margin-bottom:1.5rem;" class="an-grid-2">' +
            '<div class="panel"><h3>🔗 Traffic Sources</h3><div style="height:230px;display:flex;align-items:center;justify-content:center;"><canvas id="an-sources"></canvas></div></div>' +
            '<div class="panel"><h3>🌍 Visitor Countries</h3><div id="an-countries-list" style="max-height:230px;overflow-y:auto;"><p style="color:#9ca3af;text-align:center;padding:1.5rem;">Loading…</p></div></div>' +
        '</div>' +
        '<div class="panel" id="top-articles-panel"><h3>🔥 Top Articles</h3><div class="table-scroll"><table class="data-table compact"><thead><tr><th>#</th><th>Article</th><th>Views</th><th>Likes</th></tr></thead><tbody id="top-articles-body"><tr><td colspan="4" style="text-align:center;color:#9ca3af;">Loading…</td></tr></tbody></table></div></div>' +
        '<style>@media(max-width:900px){.an-grid-1,.an-grid-2{grid-template-columns:1fr!important;}}</style>';
    }

    if (!db) { document.getElementById('an-views').textContent = 'N/A'; return; }

    // 📊 Totals
    db.collection('analytics').doc('totals').get().then(function(doc) {
        var t = doc.exists ? doc.data() : {};
        var views = t.views || 0, shares = t.shares || 0;
        var mob = t.mobile || 0, desk = t.desktop || 0;
        document.getElementById('an-views').textContent = (views || 0).toLocaleString();
        document.getElementById('an-shares').textContent = (shares || 0).toLocaleString();
        var totD = mob + desk;
        document.getElementById('an-mobile').textContent = totD > 0 ? Math.round(mob / totD * 100) + '%' : '—';
        var engage = views > 0 ? Math.min(100, Math.round((shares + (t.likes || 0)) / views * 100)) : 0;
        document.getElementById('an-engage').textContent = engage + '%';
    });

    // ❤️ Total likes (sum of all likes docs)
    db.collection('likes').get().then(function(snap) {
        var total = 0;
        snap.docs.forEach(function(d) {
            var f = d.data();
            ['like','love','haha','wow','sad','angry'].forEach(function(k) { total += parseInt(f[k]) || 0; });
        });
        document.getElementById('an-likes').textContent = (total || 0).toLocaleString();
    }).catch(function() {});

    // 📈 7-day views chart
    var today = new Date(), labels = [], keys = [];
    for (var i = 6; i >= 0; i--) {
        var dt = new Date(today); dt.setDate(dt.getDate() - i);
        keys.push(dt.toISOString().slice(0, 10));
        labels.push(dt.toLocaleDateString('en-GB', { weekday: 'short' }));
    }
    Promise.all(keys.map(function(k) {
        return db.collection('analytics').doc('daily_' + k).get().catch(function() { return null; });
    })).then(function(docs) {
        var data = docs.map(function(x) { return (x && x.exists) ? (x.data().views || 0) : 0; });
        var ctx = document.getElementById('analytics-chart');
        if (!ctx) return;
        if (analyticsChart) analyticsChart.destroy();
        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Views', data: data, fill: true, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4, pointRadius: 4, pointBackgroundColor: '#ef4444' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0, color: '#94a3b8' }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } } }
        });
    });

    // 📱 Devices doughnut
    db.collection('analytics').doc('totals').get().then(function(doc) {
        var t = doc.exists ? doc.data() : {};
        var ctx = document.getElementById('an-devices');
        if (!ctx) return;
        if (window._anDevChart) window._anDevChart.destroy();
        window._anDevChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Mobile', 'Desktop'], datasets: [{ data: [t.mobile || 0, t.desktop || 0], backgroundColor: ['#ef4444', '#3b82f6'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 } } } } }
        });
    });

    // 🔗 Sources doughnut + 🌍 Countries table (parallel)
    db.collection('analytics').doc('sources').get().then(function(doc) {
        var counts = (doc.exists && doc.data().counts) || {};
        var ctx = document.getElementById('an-sources');
        if (ctx) {
            if (window._anSrcChart) window._anSrcChart.destroy();
            var keys2 = Object.keys(counts);
            var colors = { facebook: '#1877F2', whatsapp: '#25D366', google: '#4285F4', direct: '#94a3b8', x: '#111827', instagram: '#E1306C', telegram: '#229ED9', bing: '#0c8484', youtube: '#FF0000', internal: '#f59e0b', other: '#cbd5e1' };
            window._anSrcChart = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: keys2.map(function(k) { return k.charAt(0).toUpperCase() + k.slice(1); }), datasets: [{ data: keys2.map(function(k) { return counts[k]; }), backgroundColor: keys2.map(function(k) { return colors[k] || '#cbd5e1'; }), borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 10 }, boxWidth: 12 } } } }
            });
        }
    }).catch(function() {});

    // 🌍 Countries
    db.collection('analytics').doc('countries').get().then(function(doc) {
        var counts = (doc.exists && doc.data().counts) || {};
        var names = (doc.exists && doc.data().names) || {};
        var COUNTRY_NAMES = { LK: 'Sri Lanka', IN: 'India', US: 'USA', GB: 'United Kingdom', AE: 'UAE', SA: 'Saudi Arabia', CA: 'Canada', AU: 'Australia', MY: 'Malaysia', SG: 'Singapore', QA: 'Qatar', KW: 'Kuwait', FR: 'France', DE: 'Germany', IT: 'Italy', JP: 'Japan', KR: 'South Korea', CN: 'China', PK: 'Pakistan', BD: 'Bangladesh', NP: 'Nepal', ID: 'Indonesia', TH: 'Thailand', TR: 'Turkey', RU: 'Russia', BR: 'Brazil', NL: 'Netherlands', SE: 'Sweden', NO: 'Norway', IE: 'Ireland', ZA: 'South Africa', EG: 'Egypt', IL: 'Israel', HK: 'Hong Kong', TW: 'Taiwan', NZ: 'New Zealand' };
        var entries = Object.keys(counts).map(function(cc) {
            return { cc: cc, count: counts[cc], name: names[cc] || COUNTRY_NAMES[cc] || cc };
        }).sort(function(a, b) { return b.count - a.count; });
        document.getElementById('an-countries').textContent = entries.length || 0;
        var max = entries.length ? entries[0].count : 1;
        var el = document.getElementById('an-countries-list');
        if (!el) return;
        el.innerHTML = entries.length ? entries.slice(0, 12).map(function(e) {
            return '<div style="display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid #f1f5f9;">' +
                '<img src="https://flagcdn.com/w40/' + e.cc.toLowerCase() + '.png" alt="' + e.cc + '" style="width:26px;height:18px;object-fit:cover;border-radius:3px;flex-shrink:0;" onerror="this.style.display=\'none\'">' +
                '<span style="flex:1;font-size:0.85rem;font-weight:600;color:#374151;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + e.name + '</span>' +
                '<div style="width:34%;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;flex-shrink:0;"><div style="height:100%;width:' + Math.round(e.count / max * 100) + '%;background:linear-gradient(90deg,#ef4444,#f97316);border-radius:99px;"></div></div>' +
                '<span style="font-size:0.85rem;font-weight:800;color:#111827;width:44px;text-align:right;flex-shrink:0;">' + e.count.toLocaleString() + '</span></div>';
        }).join('') : '<p style="color:#9ca3af;text-align:center;padding:1.5rem;">No data yet — visitors vandha countries inga kaatum!</p>';
    }).catch(function() {});

    // 🔥 Top articles — views (analytics) + likes (LIKES COLLECTION — past + present!)
    Promise.all([
        db.collection('analytics').get(),
        db.collection('likes').get()
    ]).then(function(results) {
        var viewsMap = {}, likesMap = {};
        results[0].docs.forEach(function(doc) {
            if (doc.id.indexOf('articles_') === 0) viewsMap[doc.id.replace('articles_', '')] = doc.data().views || 0;
        });
        results[1].docs.forEach(function(doc) {
            var f = doc.data(), t = 0;
            ['like','love','haha','wow','sad','angry'].forEach(function(k) { t += parseInt(f[k]) || 0; });
            likesMap[doc.id] = t;
        });
        var allIds = Object.keys(viewsMap);
        Object.keys(likesMap).forEach(function(id) { if (allIds.indexOf(id) === -1) allIds.push(id); });
        var arts = allIds.map(function(id) { return { id: id, views: viewsMap[id] || 0, likes: likesMap[id] || 0 }; });
        arts.sort(function(a, b) { return (b.views + b.likes) - (a.views + a.likes); });
        var lookup = {};
        (typeof adminNews !== 'undefined' ? adminNews : []).forEach(function(n) { lookup[String(n.id)] = n; });
        var tb = document.getElementById('top-articles-body');
        if (!tb) return;
        tb.innerHTML = arts.length ? arts.slice(0, 8).map(function(a, i) {
            var n = lookup[a.id];
            var title = n ? String(n.title_en || n.title).replace(/</g, '&lt;').substring(0, 50) : 'Article #' + a.id;
            return '<tr><td>' + (i + 1) + '</td><td><strong>' + title + '</strong></td><td>' + (a.views || 0).toLocaleString() + '</td><td>' + (a.likes || 0) + '</td></tr>';
        }).join('') : '<tr><td colspan="4" style="text-align:center;color:#9ca3af;">No article data yet — articles view/like panna inga varum!</td></tr>';
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
            alert('Session expired! Please login again.');
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
                // ☁️ SMART SINGLE UPLOAD — HEAD illama na HEAD, irundha GALLERY!
                if (typeof uploadToCloudinary === 'function') {
                    var imgUrlField = document.getElementById('news-image-url');
                    var hasHead = imgUrlField && imgUrlField.value.trim();
                    showToast('☁️ Uploading...', 'success');
                    uploadToCloudinary(file).then(function(cloudUrl) {
                        if (!cloudUrl) return;
                        if (!hasHead) {
                            // 🖼️ FIRST upload = HEAD
                            var photoData = document.getElementById('news-photo-data');
                            var preview = document.getElementById('news-photo-preview');
                            if (photoData) photoData.value = cloudUrl;
                            imgUrlField.value = cloudUrl;
                            if (typeof viewImageUrl === 'function') viewImageUrl();
                            if (preview) preview.src = cloudUrl;
                            var wrap = document.getElementById('photo-preview-wrap');
                            var ph = document.getElementById('photo-placeholder');
                            if (wrap) wrap.style.display = 'block';
                            if (ph) ph.style.display = 'none';
                            showToast('✅ HEAD image set!', 'success');
                        } else {
                            // 📸 NEXT uploads = GALLERY (article inline)
                            if (typeof addGalleryRow === 'function') {
                                addGalleryRow(cloudUrl);
                                showToast('✅ Gallery image added!', 'success');
                            } else {
                                showToast('⚠️ Gallery system illa — URL copy pannunga', 'error');
                            }
                        }
                    });
                    return;
                }
                // Fallback single
                if (typeof uploadToCloudinary === 'function') {
                    showToast('☁️ Uploading to Cloudinary...', 'success');
                    uploadToCloudinary(file).then(function(cloudUrl) {
                        if (!cloudUrl) return;
                        if (dataInput) dataInput.value = cloudUrl;
                        var imgUrlField = document.getElementById('news-image-url');
                        if (imgUrlField) {
                            imgUrlField.value = cloudUrl;
                            if (typeof viewImageUrl === 'function') viewImageUrl();
                        }
                        if (preview) preview.src = cloudUrl;
                        var wrap = document.getElementById('photo-preview-wrap');
                        var placeholder = document.getElementById('photo-placeholder');
                        if (wrap) wrap.style.display = 'block';
                        if (placeholder) placeholder.style.display = 'none';
                    });
                    return;
                }
                // Fallback base64
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

// 🔤🔤 POSTER FONTS — Noto Sans/Serif Tamil + Playfair Display.
// CRITICAL: the poster canvas NEEDS these @font-face declarations. Without the
// stylesheet, document.fonts.load() silently fails on fresh devices (especially
// mobile!) and Tamil text renders in the plain system font. PC-la cache-nala
// work aagum, mobile-la illa — ithan fix.
(function injectPosterFonts() {
    if (document.getElementById('poster-fonts-css')) return;
    var link = document.createElement('link');
    link.id = 'poster-fonts-css';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700;800&family=Noto+Serif+Tamil:wght@700;800&family=Playfair+Display:wght@700;800;900&family=Inter:wght@500;600;700&family=Arimo:wght@400;700&family=Latha&display=swap';   // ⭐ Inter = FOLLOW US / URL text (identical on PC + mobile)
    document.head.appendChild(link);
})();

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
        '  <div class="stat-card"><div class="stat-icon">' + IC.users + '</div><div class="stat-info"><h3 id="nl-count">…</h3><p>Subscribers</p></div></div>' +
        '  <div class="stat-card"><div class="stat-icon">' + IC.mail + '</div><div class="stat-info"><h3 id="nl-sent">…</h3><p>Total Sent</p></div></div>' +
        '</div>' +
        '<div class="panel">' +
        '  <h3>' + IC.edit + ' Compose Daily Briefing</h3>' +
        '  <div class="form-group"><label>' + IC.send + ' Subject</label><input type="text" id="nl-subject" placeholder="🌅 EndLess Daily Briefing — ' + new Date().toLocaleDateString() + '"></div>' +
        '  <div class="form-group"><button class="btn-secondary" id="nl-gen" type="button">' + IC.zap + ' Auto-Generate from Latest Articles</button></div>' +
        '  <div class="form-group"><label>' + IC.edit + ' Email Body (HTML allowed)</label><textarea id="nl-body" rows="12" style="width:100%;padding:0.65rem 0.875rem;border:1px solid #d1d5db;border-radius:6px;font-family:inherit;font-size:0.95rem;"></textarea></div>' +
        '  <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">' +
        '    <button class="btn-primary" id="nl-send" type="button">Send to All Subscribers</button>' +
        '    <button class="btn-secondary" id="nl-test" type="button">Send Test to Admin</button>' +
        '  </div>' +
        '  <p style="color:#6b7280;font-size:0.8rem;margin-top:0.75rem;">Emails send via the FREE Firebase "Trigger Email" extension (install once — guide below).</p>' +
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
    showToast('Briefing generated from ' + latest.length + ' articles!', 'success');
}

async function sendBriefing(testOnly) {
    var subject = (document.getElementById('nl-subject').value || '').trim();
    var html = (document.getElementById('nl-body').value || '').trim();
    if (!subject || !html) { showToast('Generate the briefing first!', 'error'); return; }
    if (!db) { showToast('No Firebase connection', 'error'); return; }
    var btn = document.getElementById(testOnly ? 'nl-test' : 'nl-send');
    var orig = btn.textContent; btn.disabled = true; btn.textContent = 'Sending…';
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
        showToast('Send failed: ' + (e && e.message ? e.message : 'unknown') + ' — Trigger Email extension install aagirukka check pannunga', 'error');
    } finally {
        btn.disabled = false; btn.textContent = orig;
    }
}

// 🎨 ADMIN SVG ICONS (Lucide-style — same set as main site)
const IC = (function() {
    function i(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.1em;height:1.1em;vertical-align:-0.15em;display:inline-block;">' + p + '</svg>'; }
    return {
        chart: i('<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>'),
        pie: i('<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>'),
        news: i('<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z"/>'),
        megaphone: i('<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'),
        tag: i('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/>'),
        settings: i('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
        logout: i('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),
        heart: i('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
        mail: i('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
        users: i('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
        send: i('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
        zap: i('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
        check: i('<polyline points="20 6 9 17 4 12"/>'),
        eye: i('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
        phone: i('<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'),
        globe: i('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
        mouse: i('<rect x="6" y="3" width="12" height="18" rx="6"/><line x1="12" y1="7" x2="12" y2="11"/>'),
        edit: i('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
        trash: i('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
        x: i('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        flask: i('<path d="M9 3h6M10 3v6.34L4.62 17.7A2 2 0 0 0 6.36 21h11.28a2 2 0 0 0 1.74-3.3L14 9.34V3"/><line x1="7" y1="15" x2="17" y2="15"/>'),
        outbox: i('<path d="M21 3H3v18h18V3zM12 18v-6"/><path d="M8 12l4-4 4 4"/>'),
        broom: i('<path d="M19 3l-7 7M14 5l5 5M5 21c.5-4.5 3-8 7-9l2-2"/>'),
        image: i('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
        video: i('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>'),
        link: i('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>')
    };
})();

// 🔄 Replace emoji icons with SVGs — sidebar nav, stat cards, buttons
function iconifyAdmin() {
    // Sidebar nav: <span>EMOJI</span> Label → SVG
    var navMap = { '📊': IC.chart, '📈': IC.pie, '📝': IC.news, '📢': IC.megaphone, '🏷️': IC.tag, '⚙️': IC.settings, '📬': IC.mail, '🚪': IC.logout };
    document.querySelectorAll('.sidebar-nav .nav-item span, .mobile-bottom-nav .nav-item-mobile i').forEach(function(sp) {
        var t = sp.textContent.trim();
        if (navMap[t]) { sp.innerHTML = navMap[t]; sp.style.cssText = 'display:inline-flex;color:#f87171;'; }
    });
    // Stat card icons
    var statMap = { '📝': IC.news, '👁️': IC.eye, '📢': IC.megaphone, '🏷️': IC.tag, '👀': IC.eye, '🖱️': IC.mouse, '📱': IC.phone, '🌍': IC.globe, '👥': IC.users, '✉️': IC.mail };
    document.querySelectorAll('.stat-icon').forEach(function(sp) {
        var t = sp.textContent.trim();
        if (statMap[t]) { sp.innerHTML = statMap[t]; sp.style.cssText += 'display:grid;place-items:center;color:#dc2626;'; }
    });
    // 📰 Panel h3 headings (dashboard.html-la static emojis): 📈 Recent Articles, 📢 Active Ads
    var h3Map = { '📈': IC.chart, '📊': IC.chart, '📢': IC.megaphone, '✍️': IC.edit, '👥': IC.users };
    document.querySelectorAll('.panel h3').forEach(function(h) {
        if (h.dataset.iconDone) return;
        var raw = h.textContent.trim();
        var emoji = raw.split(' ')[0];
        if (h3Map[emoji]) {
            h.dataset.iconDone = '1';
            h.style.display = 'flex'; h.style.alignItems = 'center'; h.style.gap = '7px';
            h.innerHTML = '<span style="color:#dc2626;display:inline-flex;flex-shrink:0;">' + h3Map[emoji] + '</span><span>' + raw.substring(emoji.length).trim() + '</span>';
        }
    });
    // Likes column header
    var th = document.getElementById('th-likes');
    if (th) th.innerHTML = '<span style="color:#dc2626;display:inline-flex;vertical-align:-3px;">' + IC.heart + '</span> Likes';
}

// 🧹 UNIVERSAL EMOJI SWEEPER v2 — TEXT-NODE walker: labels, buttons, notes, checkboxes — ELLAM!
const EMOJI_MAP = {
    '\u270F\uFE0F':'edit','\u270F':'edit','✏️':'edit','✏':'edit',
    '\uD83D\uDDD1\uFE0F':'trash','\uD83D\uDDD1':'trash','🗑️':'trash','🗑':'trash',
    '\uD83D\uDD0D':'search','🔍':'search','🔎':'search',
    '\u2795':'plus','➕':'plus',
    '\u2714\uFE0F':'check','\u2714':'check','✔️':'check','✔':'check','✅':'check',
    '\u2716\uFE0F':'x','\u2716':'x','✖️':'x','✖':'x','✕':'x','❌':'x',
    '📅':'calendar','\uD83D\uDCC5':'calendar','\uD83D\uDCC6':'calendar',
    '📧':'mail','✉️':'mail','✉':'mail',
    '👤':'user','👥':'users',
    '📱':'phone','💻':'monitor',
    '🌐':'globe','🌍':'globe','🌎':'globe',
    '⚠️':'alert','⚠':'alert',
    '🔔':'bell',
    '📈':'trend','📉':'trend','📊':'chart',
    '📢':'megaphone',
    '💰':'coins',
    '📝':'edit',
    '🏷️':'tag','🏷':'tag',
    '⚙️':'settings','⚙':'settings',
    '🚪':'logout',
    '📌':'pin','📍':'pin',
    '🔧':'wrench','🔨':'hammer',
    '🔒':'lock','🔓':'lock',
    '⭐':'star','🌟':'star',
    '🔥':'flame',
    '⏱️':'clock','⌛':'clock',
    '👁️':'eye','👁':'eye','👀':'eye',
    '💬':'msg',
    '📤':'send','📥':'send','🚀':'rocket',
    '🛡️':'shield','🛡':'shield','⚔️':'shield',
    '🧪':'flask','📤':'outbox',
    '🧹':'broom',
    '🖼️':'image','🖼':'image',
    '🎬':'video',
    '🔗':'link'
};

function sweepTextNodes(root) {
    if (!root || typeof IC === 'undefined') return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node) {
        var text = node.nodeValue;
        if (!text) return;
        var parent = node.parentElement;
        if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.closest('svg')) return;
        if (parent.closest('.sidebar-nav')) return; // sidebar = iconifyAdmin (consistent brand red)
        if (parent.closest('button') && parent.closest('button').getAttribute('onclick') && parent.closest('button').getAttribute('onclick').indexOf('openPosterModal') !== -1) return; // 🎨 poster buttons — DON'T touch!
        var found = [];
        Object.keys(EMOJI_MAP).forEach(function(em) {
            if (text.indexOf(em) !== -1 && IC[EMOJI_MAP[em]]) {
                found.push({ em: em, icon: IC[EMOJI_MAP[em]] });
                text = text.split(em).join('\u0001'); // placeholder
            }
        });
        if (!found.length) return;
        var frag = document.createDocumentFragment();
        text.split('\u0001').forEach(function(part, i) {
            if (part) frag.appendChild(document.createTextNode(part));
            if (i < found.length) {
                var sp = document.createElement('span');
                sp.style.cssText = 'display:inline-flex;vertical-align:-2px;margin-right:3px;';
                sp.innerHTML = found[i].icon;
                frag.appendChild(sp);
            }
        });
        node.parentNode.replaceChild(frag, node);
    });
}
var _sweeping = false, _sweepCount = 0, _sweepT = null;
function sweepAllEmojis() {
    if (_sweeping) return;
    _sweeping = true;
    try {
        iconifyAdmin(); // FIRST — sidebar/stats/panels with consistent brand red
        sweepTextNodes(document.getElementById('admin-dashboard') || document.body);
    } catch (e) {}
    _sweeping = false;
    _sweepCount++;
    // Auto-stop after 8 sweeps — static content done, renders handle the rest
    if (_sweepCount >= 8 && _sweepMO) { _sweepMO.disconnect(); _sweepMO = null; }
}

// Run on init (few times to catch late content) — NO permanent observer (freeze fix)
setTimeout(sweepAllEmojis, 700);
setTimeout(sweepAllEmojis, 2000);
setTimeout(sweepAllEmojis, 4000);
// Debounced light observer — only while warming up, auto-disconnects
var _sweepMO = new MutationObserver(function() {
    if (_sweeping || _sweepCount >= 8) return;
    clearTimeout(_sweepT);
    _sweepT = setTimeout(sweepAllEmojis, 500);
});
setTimeout(function() {
    if (_sweepCount >= 8) return;
    var host = document.getElementById('admin-dashboard') || document.body;
    _sweepMO.observe(host, { childList: true, subtree: true });
}, 1200);

// 🎨 ACTION BUTTON SVGs — replace ✏️/🗑 emoji entities with professional icons
const ACT_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
const ACT_DEL  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
function swapActionButtons(root) {
    (root || document).querySelectorAll('button').forEach(function(btn) {
        var t = (btn.textContent || '').trim();
        if (t === '\u270F\uFE0F' || t === '✏️' || t.indexOf('✏') !== -1) {
            if (!btn.dataset.svgDone) { btn.dataset.svgDone = '1'; btn.innerHTML = ACT_EDIT; btn.title = btn.title || 'Edit'; }
        } else if (t === '\uD83D\uDDD1\uFE0F' || t === '🗑️' || t.indexOf('🗑') !== -1) {
            if (!btn.dataset.svgDone) { btn.dataset.svgDone = '1'; btn.innerHTML = ACT_DEL; btn.title = btn.title || 'Delete'; }
        }
    });
}
// Auto-swap after each table render
var _origRenderNews = typeof renderNewsTable === 'function' ? renderNewsTable : null;
var _origRenderAds = typeof renderAdsTable === 'function' ? renderAdsTable : null;
var _origRenderCats = typeof renderCategoriesTable === 'function' ? renderCategoriesTable : null;
if (_origRenderNews) { renderNewsTable = function() { _origRenderNews.apply(this, arguments); swapActionButtons(document.getElementById('page-news')); }; }
if (_origRenderAds) { renderAdsTable = function() { _origRenderAds.apply(this, arguments); swapActionButtons(document.getElementById('page-ads')); }; }
if (_origRenderCats) { renderCategoriesTable = function() { _origRenderCats.apply(this, arguments); swapActionButtons(document.getElementById('page-categories')); }; }
// 🧹 MODAL SWEEPS — Add/Edit article + ad modal open pannum bodhu emoji labels-a sweep pannum
var _origOpenNews = typeof openNewsModal === 'function' ? openNewsModal : null;
if (_origOpenNews) {
    openNewsModal = function() {
        _origOpenNews.apply(this, arguments);
        setTimeout(function() {
            sweepTextNodes(document.getElementById('news-modal'));
        }, 200);
    };
}
var _origOpenAd = typeof openAdModal === 'function' ? openAdModal : null;
if (_origOpenAd) {
    openAdModal = function() {
        _origOpenAd.apply(this, arguments);
        setTimeout(function() { sweepTextNodes(document.getElementById('ad-modal')); }, 200);
    };
}

// 🛡️ Global toast guard — any function calling showToast must not crash
if (typeof window.showToast !== 'function') {
    window.showToast = function(msg, type) {
        try {
            var t = document.createElement('div');
            t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:' +
                (type === 'error' ? '#dc2626' : '#059669') +
                ';color:#fff;padding:12px 20px;border-radius:10px;font-weight:600;z-index:99999;max-width:90vw;box-shadow:0 8px 24px rgba(0,0,0,0.25);';
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(function() { t.remove(); }, 2600);
        } catch (e) {}
    };
}

// ✈️ TELEGRAM BOT SETUP — Settings page-la inject (simple: token paste → auto chat ID!)
async function ensureTelegramUI() {
    var page = document.getElementById('page-settings');
    if (!page || document.getElementById('tg-setup-panel')) return;

    var panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = 'tg-setup-panel';
    panel.style.marginTop = '1.5rem';
    panel.innerHTML =
        '<h3>✈️ Telegram Notifications (New Like/Share alerts)</h3>' +
        '<p style="color:#6b7280;font-size:0.85rem;margin-bottom:0.75rem;">' +
        'Like/share aana odane unga Telegram app-ku notification varum! Setup (2 min):' +
        '<br>1️⃣ Telegram-la <b>@BotFather</b> search → /newbot → name kudunga → <b>Token</b> copy pannunga<br>' +
        '2️⃣ Token-a keezha paste pannunga → "Find My Chat ID" click pannunga<br>' +
        '3️⃣ Telegram-la unga bot-ku oru message anuppuunga (e.g., "hi") → approm button click!</p>' +
        '<div class="form-group"><label>Bot Token</label>' +
        '<input type="text" id="tg-bot-token" placeholder="123456:ABC-DEF..." style="width:100%;padding:0.6rem 0.875rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.95rem;"></div>' +
        '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">' +
        '<button class="btn-primary" id="tg-find-chat" type="button">🔍 Find My Chat ID</button>' +
        '<button class="btn-primary" id="tg-save" type="button">💾 Save</button>' +
        '<button class="btn-secondary" id="tg-test" type="button">🧪 Test Message</button>' +
        '</div>' +
        '<p id="tg-status" style="margin-top:0.75rem;font-size:0.85rem;font-weight:600;color:#6b7280;">Status: —</p>';

    page.appendChild(panel);

    // Load saved config
    try {
        if (db) {
            var doc = await db.collection('settings').doc('telegram_bot').get();
            if (doc.exists) {
                var c = doc.data();
                document.getElementById('tg-bot-token').value = c.botToken || '';
                document.getElementById('tg-status').textContent = 'Status: ✅ Connected (Chat ID: ' + (c.chatId || '?') + ')';
                document.getElementById('tg-status').style.color = '#059669';
            }
        }
    } catch (e) {}

    // Find Chat ID — fetches bot updates, finds user's chat
    document.getElementById('tg-find-chat').addEventListener('click', async function() {
        var token = document.getElementById('tg-bot-token').value.trim();
        var status = document.getElementById('tg-status');
        if (!token) { status.textContent = 'Status: ❌ Token first paste pannunga!'; status.style.color = '#dc2626'; return; }

        status.textContent = 'Status: ⏳ Searching... (unga bot-ku Telegram-la oru message anuppuunga!)';
        try {
            var r = await fetch('https://api.telegram.org/bot' + token + '/getUpdates');
            var j = await r.json();
            if (j.ok && j.result && j.result.length) {
                // Latest message-oda chat id
                var chatId = j.result[j.result.length - 1].message.chat.id;
                status.textContent = 'Status: ✅ Chat ID found: ' + chatId + ' → Ipo "Save" click pannunga!';
                status.style.color = '#059669';
                window._tgChatId = chatId;
            } else {
                status.textContent = 'Status: ❌ Messages illa! Bot-ku oru "hi" message anuppu, approm thirumba try pannu.';
                status.style.color = '#dc2626';
            }
        } catch (e) {
            status.textContent = 'Status: ❌ Error — token sariya check pannu';
            status.style.color = '#dc2626';
        }
    });

    // Save
    document.getElementById('tg-save').addEventListener('click', async function() {
        var token = document.getElementById('tg-bot-token').value.trim();
        var chatId = window._tgChatId;
        var status = document.getElementById('tg-status');
        if (!token || !chatId) { status.textContent = 'Status: ❌ Token + Chat ID venum (Find Chat ID click pannu!)'; status.style.color = '#dc2626'; return; }
        try {
            await db.collection('settings').doc('telegram_bot').set({
                botToken: token, chatId: String(chatId), savedAt: new Date().toISOString()
            });
            status.textContent = 'Status: ✅ SAVED! Ippo vera browser-la LIKE pannu — Telegram-la varum!';
            status.style.color = '#059669';
            showToast('✈️ Telegram connected!', 'success');
        } catch (e) {
            status.textContent = 'Status: ❌ Save failed';
            status.style.color = '#dc2626';
        }
    });

    // Test
    document.getElementById('tg-test').addEventListener('click', async function() {
        var status = document.getElementById('tg-status');
        try {
            var doc = await db.collection('settings').doc('telegram_bot').get();
            if (!doc.exists || !doc.data().botToken) { status.textContent = 'Status: ❌ First Save pannu!'; return; }
            var c = doc.data();
            var r = await fetch('https://api.telegram.org/bot' + c.botToken + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: c.chatId, text: '🧪 Test OK! Telegram notifications WORKING! 🎉\n\n👉 endlessnews.lk' })
            });
            var j = await r.json();
            status.textContent = j.ok ? 'Status: ✅ Test sent! Telegram app check pannu!' : 'Status: ❌ Test failed: ' + (j.description || '');
            status.style.color = j.ok ? '#059669' : '#dc2626';
        } catch (e) { status.textContent = 'Status: ❌ Error'; }
    });
}

// ☁️ CLOUDINARY DIRECT UPLOAD — Device image → auto Cloudinary → URL!
// Cloudinary account create pannunga → Cloud Name + Unsigned Preset eduthukkunga!
const CLOUDINARY_CONFIG = {
    cloudName: 'df2pc8kd0',      // e.g., 'df2pc8kd0'
    uploadPreset: 'endless_unsigned' // e.g., 'endless_unsigned' (UNSIGNED preset create pannunga!)
};

// 📦 MULTI-UPLOAD: Files[] → First = HEAD image, Rest = GALLERY (article inline)!
// Drag & drop / multi-select — ellame ithula handle aagum!
async function uploadImagesSmart(files) {
    if (!files || !files.length) return;
    if (typeof uploadToCloudinary !== 'function') return;

    // Image files mattum filter
    var imgs = Array.prototype.slice.call(files).filter(function(f) { return f.type.indexOf('image/') === 0; });
    if (!imgs.length) { showToast('❌ Images mattum (JPG/PNG)', 'error'); return; }

    showToast('☁️ Uploading ' + imgs.length + ' image(s)...', 'success');

    for (var i = 0; i < imgs.length; i++) {
        var url = await uploadToCloudinary(imgs[i]);
        if (!url) continue;

        if (i === 0) {
            // 🎯 FIRST image = HEAD/HERO (main image URL field)
            var imgUrlField = document.getElementById('news-image-url');
            var photoData = document.getElementById('news-photo-data');
            var preview = document.getElementById('news-photo-preview');
            if (photoData) photoData.value = url;
            if (imgUrlField) {
                imgUrlField.value = url;
                if (typeof viewImageUrl === 'function') viewImageUrl();
            }
            if (preview) preview.src = url;
            var wrap = document.getElementById('photo-preview-wrap');
            var ph = document.getElementById('photo-placeholder');
            if (wrap) wrap.style.display = 'block';
            if (ph) ph.style.display = 'none';
        } else {
            // 📸 REST = GALLERY (article inline-a varum!)
            if (typeof addGalleryRow === 'function') {
                addGalleryRow(url);
            }
        }
    }
    showToast('✅ ' + imgs.length + ' uploaded! (1st = Head, rest = Gallery)', 'success');
}

async function uploadToCloudinary(file, onProgress) {
    if (CLOUDINARY_CONFIG.cloudName === 'YOUR_CLOUD_NAME') {
        showToast('⚠️ Cloudinary setup pending — Cloud Name + Preset add pannunga (dashboard.js top)', 'error');
        return null;
    }
    if (!file) return null;

    var formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    // Progress simulation (FormData fetch-la real progress kidaikaathu — simple % spin)
    if (onProgress) onProgress(30);

    try {
        var r = await fetch('https://api.cloudinary.com/v1_1/' + CLOUDINARY_CONFIG.cloudName + '/image/upload', {
            method: 'POST',
            body: formData
        });
        var data = await r.json();

        if (onProgress) onProgress(100);

        if (data.secure_url) {
            // Auto-optimize for OG/share (unga purana fix-um!)
            var url = data.secure_url;
            if (url.indexOf('/upload/') !== -1 && url.indexOf('w_1200') === -1) {
                url = url.replace('/upload/', '/upload/w_1200,q_80,f_jpg/');
            }
            showToast('☁️ Uploaded & optimized!', 'success');
            return url;
        } else {
            showToast('❌ Upload failed: ' + (data.error && data.error.message || 'unknown'), 'error');
            return null;
        }
    } catch (e) {
        showToast('❌ Upload error: ' + e.message, 'error');
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// 🔤 POSTER FONT PICKER — built-in Tamil & English fonts + custom add
// Selected font = per-language override (neenga easy-a maatha mudiyum)
const POSTER_FONT_LIST = [
    { name: 'Noto Sans Tamil',   g: 'Noto Sans Tamil:wght@400;700;800',  tags: 'ta' },
    { name: 'Catamaran',         g: 'Catamaran:wght@700;800',            tags: 'ta' },
    { name: 'Mukta Malar',       g: 'Mukta Malar:wght@700;800',          tags: 'ta' },
    { name: 'Nirmala UI',        g: null,                                 tags: 'ta system' },
    { name: 'Catamaran',         g: 'Catamaran:wght@700;800',            tags: 'en ta' },
    { name: 'Playfair Display',  g: 'Playfair Display:wght@700;800;900', tags: 'en' },
    { name: 'Georgia (system)',  g: null,                                 tags: 'en system' },
    { name: 'Inter',             g: 'Inter:wght@700;800',                tags: 'en' },
    { name: 'Lora',              g: 'Lora:wght@700',                     tags: 'en' }
];

// 🔤 Ensure a Google font is loaded (returns promise). Local/system fonts resolve instantly.
function pgLoadFont(spec) {
    if (!spec || !spec.g) return Promise.resolve();       // system font — nothing to load
    var parts = spec.g.split(':');
    var fam = parts[0].replace(/\+/g, ' ');
    if (document.fonts.check('700 20px "' + fam + '"')) return Promise.resolve();
    return document.fonts.load('700 20px "' + fam + '"').catch(function () {});
}

// ═══════════════════════════════════════════════════════════════
// 🎨 SOCIAL POSTER GENERATOR — Al Jazeera/BBC style news cards!
// One click → branded poster (image + headline + excerpt + brand)
// Sizes: 1:1 (IG/FB), 16:9 (X), 9:16 (Story) · Tamil/English · Download/Share
// ═══════════════════════════════════════════════════════════════
const POSTER_SIZES = {
    square: { w: 1080, h: 1080, label: '1:1 · Instagram / FB Post' },
    p45:    { w: 1080, h: 1350, label: '4:5 · Instagram Portrait' },
    p34:    { w: 1080, h: 1440, label: '3:4 · Portrait' },
    p23:    { w: 1080, h: 1620, label: '2:3 · Pinterest / FB' },
    story:  { w: 1080, h: 1920, label: '9:16 · Story / Status' },
    wide:   { w: 1200, h: 675,  label: '16:9 · X / FB Link Card' }
};

function pgWrapText(ctx, text, maxW) {
    var words = String(text || '').split(/\s+/), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
        else line = test;
        if (lines.length >= 5) break; // safety cap
    }
    if (line) lines.push(line);
    return lines;
}

function pgRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function pgLoadImg(url) {
    return new Promise(function(res, rej) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() { res(img); };
        img.onerror = rej;
        img.src = url;
    });
}

async function generatePoster(article, sizeKey, lang, mode, quality) {
    mode = mode || 'full';   // 'full' = headline+excerpt | 'headline' = big text only
    var q = (quality === 'hd') ? 2 : 1;   // 🖥️ HD = 2x resolution for crisp social sharing
    var S = POSTER_SIZES[sizeKey] || POSTER_SIZES.square;
    var W = S.w * q, H = S.h * q;
    var isWide = W > H;                 // 16:9 landscape
    var isStory = sizeKey === 'story';  // 9:16 full portrait

    // 🔤🔤 FONT PICKER — resolve headline & brand fonts (per language override)
    var defaultFont = (article._font && article._font[lang]) || { head: 'Catamaran', brand: 'Playfair Display' };   // ⭐ default
    var TAMIL_STACK = '"' + (defaultFont.head || 'Catamaran') + '", "Latha", "Noto Sans Tamil", Arial';   // ⭐ default: Catamaran   // ⭐ Latha = Nirmala UI mobile-twin (same metrics)
    var BRAND_STACK = '"' + (defaultFont.brand || 'Playfair Display') + '", Georgia, serif';
    // Preload any selected Google fonts (system fonts resolve instantly), with timeout
    var chosen = [{ name: 'Inter', g: 'Inter:wght@500;600;700' }];   // ⭐ always preload (FOLLOW US + URL)
    chosen.push({ name: 'Arimo', g: 'Arimo:wght@400;700' });          // ⭐ Arial-twin for mobile (metric-compatible)
    chosen.push({ name: 'Latha', g: 'Latha' });                        // ⭐ Nirmala UI mobile-twin (metric-compatible)
    POSTER_FONT_LIST.forEach(function (s) {
        var n = s.name.replace(/\s*\(system\)\s*$/, '');
        if ((defaultFont.head && n === defaultFont.head) || (defaultFont.brand && n === defaultFont.brand)) chosen.push(s);
    });
    // 🔤 Font wait — PC/mobile IDENTICAL layout-ku mukkiyam:
    // measure & draw with the SAME loaded font. Slow networks-la 1 retry + 5s cap.
    try {
        for (var _try = 0; _try < 2; _try++) {
            await Promise.race([
                Promise.all(chosen.map(pgLoadFont)).then(function () { return document.fonts.ready; }),
                new Promise(function (res) { setTimeout(res, 5000); })
            ]);
            var allOk = chosen.every(function (s) {
                if (!s.g) return true;   // system font — nothing to verify
                var fam = s.g.split(':')[0].replace(/\+/g, ' ');
                return document.fonts.check('700 20px "' + fam + '"');
            });
            if (allOk) break;
        }
    } catch (e) {}

    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');

    var title = lang === 'en' ? (article.title_en || article.title) : (article.title || article.title_en);
    var excerpt = lang === 'en' ? (article.excerpt_en || article.excerpt) : (article.excerpt || article.excerpt_en);
    var cat = lang === 'en' ? (article.category_en || article.category) : (article.category || article.category_en);

    // 🎨 Word highlights — selected words render in brand pink
    function pgNormWord(w) {
        return String(w || '').replace(/^[\s\.,;:!?"'’“”\-–—()\[\]]+|[\s\.,;:!?"'’“”\-–—()\[\]]+$/g, '');
    }
    var hlSet = (article._hl || []).map(pgNormWord);

    // 🗺️ Poster category display names — e.g. "Local" news shows as இலங்கை / SRI LANKA
    //    (extend this map anytime: map key = lowercase category_en)
    var CAT_POSTER_NAMES = {
        'local': { ta: 'இலங்கை', en: 'SRI LANKA' }
    };
    var catKey = String(article.category_en || article.category || '').trim().toLowerCase();
    if (CAT_POSTER_NAMES[catKey]) {
        cat = lang === 'en' ? CAT_POSTER_NAMES[catKey].en : CAT_POSTER_NAMES[catKey].ta;
    }

    // 💬 Headline-only mode: excerpt hidden, headline grows to fill
    if (mode === 'headline') excerpt = '';

    // 📅 Date — language ku eatha maari (weekday + full date)
    var d = article.date ? new Date(article.date) : new Date();
    var dateStr = '';
    try {
        dateStr = d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'ta-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    } catch (e) { dateStr = d.toDateString(); }

    var mX = Math.round(W * 0.045);     // side margin
    var maxW = W - mX * 2;
    var gap = Math.round(H * 0.016);

    // Brand bar metrics (fixed at bottom)
    var barH = Math.round(H * (isWide ? 0.12 : 0.082));
    var barY = H - barH - Math.round(H * 0.026);

    // ── FULL text wrapping (no line cap — user wants EVERYTHING) ──
    function fullWrap(text, maxWidth) {
        var words = String(text || '').split(/\s+/), lines = [], line = '';
        for (var i = 0; i < words.length; i++) {
            var test = line ? line + ' ' + words[i] : words[i];
            if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = words[i]; }
            else line = test;
        }
        if (line) lines.push(line);
        return lines;
    }

    // ── 🎨 Colored word-wrap: same greedy logic, keeps per-word highlight info ──
    function wrapColored(text, maxWidth) {
        var words = String(text || '').split(/\s+/), lines = [], cur = [], curStr = '';
        for (var i = 0; i < words.length; i++) {
            var w = words[i];
            var test = curStr ? curStr + ' ' + w : w;
            if (ctx.measureText(test).width > maxWidth && curStr) { lines.push(cur); cur = []; curStr = w; }
            else curStr = test;
            cur.push({ t: w, hl: hlSet.indexOf(pgNormWord(w)) !== -1 });
        }
        if (cur.length) lines.push(cur);
        return lines;
    }

    // ── Text layout calculator (scale = font multiplier) ──
    var baseHead = Math.round(W * (isWide ? 0.046 : 0.064));
    var minHead = Math.max(20, Math.round(W * 0.022));
    var minExc = 15;
    function calcLayout(sc) {
        var hs = Math.max(minHead, Math.round(baseHead * sc));
        var lh = Math.round(hs * 1.3);
        ctx.font = '800 ' + hs + 'px ' + TAMIL_STACK;
        ctx.textBaseline = 'top';
        var hl = wrapColored(title, maxW);
        var es = Math.max(minExc, Math.round(hs * 0.52));
        var elh = Math.round(es * 1.48);
        ctx.font = '400 ' + es + 'px ' + TAMIL_STACK;
        var el = excerpt ? fullWrap(excerpt, maxW) : [];
        var need = hl.length * lh + (el.length ? gap + el.length * elh : 0);
        return { hs: hs, lh: lh, hl: hl, es: es, elh: elh, el: el, need: need };
    }

    // ── ⭐ AUTO-FIT: full text must fit above the brand bar ──
    // 1) Start with base image height
    var imgH = Math.round(H * (isWide ? 0.48 : (isStory ? 0.42 : 0.45)));
    var minImgH = Math.round(H * 0.20);
    // 💬 Reserve CTA pill space in headline mode — headline NEVER touches the pill
    // 💬 CTA pill shows in BOTH modes — always reserve its space (never overlap text)
    var ctaReserve = Math.round(W * 0.018) * 1.95 + Math.round(H * 0.018) + Math.round(H * 0.026);
    var y, avail, L;

    function reflow() {
        // y = where headline starts (after image + date + accent)
        y = imgH + Math.round(H * 0.045)                 // date
          + Math.round(W * 0.020 * 1.8)                   // date line height
          + Math.max(6, Math.round(H * 0.007))            // accent bar
          + Math.round(H * 0.02);                         // gap after accent
        avail = barY - y - gap - ctaReserve;   // keep text clear of the CTA pill
        if (mode === 'headline') {
            // ⭐⭐ Binary search: LARGEST font that exactly fills the space
            var lo = 0.05, hi = 4.0, best = null;
            for (var it = 0; it < 14; it++) {
                var mid = (lo + hi) / 2;
                var t = calcLayout(mid);
                if (t.need <= avail) { best = t; lo = mid; } else { hi = mid; }
            }
            L = best || calcLayout(lo);
        } else {
            // Full mode: base size, shrink only if needed
            var sc = 1;
            L = calcLayout(sc);
            while (L.need > avail && L.hs > minHead) {
                sc *= 0.93;
                L = calcLayout(sc);
            }
        }
    }
    reflow();
    // 2) If STILL too tall → shrink image area to free vertical space, retry
    if (L.need > avail && imgH > minImgH) {
        imgH = Math.max(minImgH, imgH - (L.need - avail) - Math.round(H * 0.01));
        reflow();
    }

    // 🔄 LAYOUT VERIFY — measurement & drawing must use the identical loaded font.
    // If a font finished loading after measuring, re-measure & reflow once.
    (function pgVerifyLayout() {
        ctx.font = '800 ' + L.hs + 'px ' + TAMIL_STACK;
        var recheck = wrapColored(title, maxW);
        if (recheck.length !== L.hl.length) reflow();
    })();

    // ═══ DRAW ═══

    // 1) Dark brand background (gradient)
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#13131f'); bg.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // 2) Article image — cover fit at final (possibly shrunk) height
    try {
        var img = await pgLoadImg(article.image);
        var scale = Math.max(W / img.width, imgH / img.height);
        var iw = img.width * scale, ih = img.height * scale;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W, imgH); ctx.clip();
        ctx.drawImage(img, (W - iw) / 2, (imgH - ih) / 2, iw, ih);
        ctx.restore();
    } catch (e) {}

    // Gradient fade image → bg
    var fadeH = Math.round(H * 0.2);
    var fade = ctx.createLinearGradient(0, imgH - fadeH, 0, imgH + Math.round(H * 0.04));
    fade.addColorStop(0, 'rgba(10,10,15,0)');
    fade.addColorStop(1, 'rgba(10,10,15,1)');
    ctx.fillStyle = fade; ctx.fillRect(0, imgH - fadeH, W, fadeH + Math.round(H * 0.05));

    // 3) Category chip (over image, top-left)
    if (cat) {
        ctx.font = '700 ' + Math.round(W * 0.021) + 'px ' + TAMIL_STACK;
        var cw = ctx.measureText(String(cat).toUpperCase()).width + Math.round(W * 0.05);
        var chH = Math.round(H * 0.045);
        pgRoundRect(ctx, mX, Math.round(H * 0.038), cw, chH, chH / 2);
        ctx.fillStyle = '#e11d48'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.fillText(String(cat).toUpperCase(), mX + Math.round(W * 0.025), Math.round(H * 0.038) + chH / 2 + 2);
    }

    // 4) 📅 Date line — image keezha, headline mela
    ctx.font = '600 ' + Math.round(W * 0.020) + 'px ' + TAMIL_STACK;
    ctx.fillStyle = '#94a3b8'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillText(dateStr, mX, imgH + Math.round(H * 0.045));

    // 5) Red accent line
    var accH = Math.max(6, Math.round(H * 0.007));
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(mX, y - Math.round(H * 0.02) - accH, Math.round(W * 0.12), accH);

    // 6) HEADLINE — full text, auto-scaled font
    ctx.font = '800 ' + L.hs + 'px ' + TAMIL_STACK;
    ctx.textBaseline = 'top';
    var spaceW = ctx.measureText(' ').width;
    L.hl.forEach(function (tokens, i) {
        var wx = mX;
        tokens.forEach(function (tok) {
            ctx.fillStyle = tok.hl ? '#fb7185' : '#ffffff';   // 🎨 highlighted word = brand pink
            ctx.fillText(tok.t, wx, y + i * L.lh);
            wx += ctx.measureText(tok.t).width + spaceW;
        });
    });
    var ey = y + L.hl.length * L.lh + (L.el.length ? gap : 0);

    // 7) EXCERPT — full text, auto-scaled font
    if (L.el.length) {
        ctx.font = '400 ' + L.es + 'px ' + TAMIL_STACK;
        ctx.fillStyle = '#b6bdc9';
        L.el.forEach(function (ln, i) {
            ctx.fillText(ln, mX, ey + i * L.elh);
        });
    }

    // 7b) 💬 CTA pill — professional "read full news" chip (BOTH poster modes)
    if (true) {
        var cta = lang === 'en' ? 'READ THE FULL NEWS' : '\u0BAE\u0BC1\u0BB4\u0BC1 \u0B9A\u0BC6\u0BAF\u0BCD\u0BA4\u0BBF\u0BAF\u0BC8\u0BAA\u0BCD \u0BAA\u0B9F\u0BBF\u0B95\u0BCD\u0B95';
        var ctaSize = Math.max(15, Math.round(W * 0.018));   // ⭐ smaller, decent pill
        ctx.textAlign = 'left';
        // Shrink font until pill fits poster width
        var tw, padX, arrowW, pillW, pillH;
        do {
            ctx.font = '700 ' + ctaSize + 'px ' + TAMIL_STACK;
            tw = ctx.measureText(cta).width;
            padX = Math.round(W * 0.035);
            arrowW = Math.round(ctaSize * 0.95);
            pillW = tw + padX * 2 + arrowW;
            pillH = Math.round(ctaSize * 1.95);
            if (pillW <= maxW || ctaSize <= 11) break;
            ctaSize -= 2;
        } while (true);
        var pillX = Math.round((W - pillW) / 2);
        var pillY = barY - Math.round(H * 0.018) - pillH;

        // ⭐ Premium divider: full-width hairlines aligned to poster margins (image borders),
        //    gradient-fading toward the pill — editorial print style
        var flY = pillY + pillH / 2;
        var lw = Math.max(1.5, W * 0.0015);
        var lineL = mX, lineR = W - mX;
        var gapToPill = Math.round(W * 0.025);
        // Left hairline: strong at margin → fades into pill
        var gl = ctx.createLinearGradient(lineL, 0, pillX - gapToPill, 0);
        gl.addColorStop(0, 'rgba(251,113,133,0.55)');
        gl.addColorStop(1, 'rgba(251,113,133,0.06)');
        ctx.strokeStyle = gl;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(lineL, flY); ctx.lineTo(pillX - gapToPill, flY);
        ctx.stroke();
        // Right hairline: fades out from pill → strong at margin
        var gr = ctx.createLinearGradient(pillX + pillW + gapToPill, 0, lineR, 0);
        gr.addColorStop(0, 'rgba(251,113,133,0.06)');
        gr.addColorStop(1, 'rgba(251,113,133,0.55)');
        ctx.strokeStyle = gr;
        ctx.beginPath();
        ctx.moveTo(pillX + pillW + gapToPill, flY); ctx.lineTo(lineR, flY);
        ctx.stroke();

        // Pill: mask the line cleanly, then brand fill + outline
        pgRoundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
        ctx.fillStyle = 'rgba(10,10,15,0.94)';   // covers the divider line under the pill
        ctx.fill();
        ctx.fillStyle = 'rgba(225,29,72,0.14)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(251,113,133,0.9)';
        ctx.lineWidth = Math.max(2, W * 0.002);
        ctx.stroke();

        // Text (vertically centered in pill)
        ctx.fillStyle = '#f8fafc';
        ctx.textBaseline = 'middle';
        ctx.fillText(cta, pillX + padX, pillY + pillH / 2 + ctaSize * 0.06);

        // Vector down-chevron (no emoji — crisp icon)
        var ax = pillX + pillW - padX - arrowW * 0.45;
        var ay = pillY + pillH / 2;
        var s = arrowW * 0.30;
        ctx.beginPath();
        ctx.moveTo(ax - s, ay - s * 0.55);
        ctx.lineTo(ax, ay + s * 0.55);
        ctx.lineTo(ax + s, ay - s * 0.55);
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = Math.max(2.5, W * 0.0025);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
    }

    // 8) Brand bar — site logo maari correct-a set 🎨
    var barX = mX, barW = W - mX * 2;
    ctx.fillStyle = 'rgba(225,29,72,0.12)';
    pgRoundRect(ctx, barX, barY, barW, barH, barH * 0.32);
    ctx.fill();

    // E logo — site gradient maari (#e11d48 → #be123c), Playfair 'E'
    var logoS = barH * 0.6;
    var logoX = barX + Math.round(W * 0.02);
    var logoY = barY + (barH - logoS) / 2;
    var lg = ctx.createLinearGradient(logoX, logoY, logoX + logoS, logoY + logoS);
    lg.addColorStop(0, '#e11d48'); lg.addColorStop(1, '#be123c');
    pgRoundRect(ctx, logoX, logoY, logoS, logoS, logoS * 0.28);
    ctx.fillStyle = lg; ctx.fill();
    ctx.font = '900 ' + Math.round(logoS * 0.6) + 'px ' + BRAND_STACK;
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('E', logoX + logoS / 2, logoY + logoS / 2 + logoS * 0.04);

    // "EndLess News" — Playfair: 'End' white + 'Less News' red (site maari)
    var textX = logoX + logoS + Math.round(W * 0.022);
    ctx.textAlign = 'left';
    var nameSize = Math.round(barH * 0.32);
    ctx.font = '800 ' + nameSize + 'px ' + BRAND_STACK;
    ctx.textBaseline = 'middle';
    var endW = ctx.measureText('End').width;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('End', textX, barY + barH * 0.38);
    ctx.fillStyle = '#fb7185';
    ctx.fillText('Less News', textX + endW, barY + barH * 0.38);

    // URL — keezha small line
    ctx.font = '600 ' + Math.round(barH * 0.22) + 'px "Arimo", Arial';   // ⭐ Arial look: PC=real Arial, mobile=Arimo
    ctx.fillStyle = '#fb7185';
    ctx.fillText('endlessnews.lk', textX, barY + barH * 0.72);

    // 8b) FOLLOW US — premium right side: label + 4 vector social icons in brand colour (BOTH modes)
    (function drawSocial() {
        var ico = Math.round(barH * 0.36);   // official logos carry inner padding
        var icoGap = Math.round(ico * 0.42);
        var labelGap = Math.round(ico * 0.6);
        var rowW = ico * 4 + icoGap * 3;
        var lblSize = Math.max(11, Math.round(barH * 0.19));
        ctx.font = '700 ' + lblSize + 'px "Arimo", Arial';   // ⭐ Arial look: PC=real Arial, mobile=Arimo (metric-compatible twin)
        var lblW = ctx.measureText('FOLLOW US').width;
        var grpW = lblW + labelGap + rowW;
        var gx = barX + barW - Math.round(W * 0.022) - grpW;
        var gy = barY + barH / 2;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Label — small, muted, vertically centered with icons
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '700 ' + lblSize + 'px "Arimo", Arial';   // ⭐ Arial look: PC=real Arial, mobile=Arimo (metric-compatible twin)
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('FOLLOW US', gx, gy + lblSize * 0.06);

        // Icons — brand pink, consistent stroke weight = premium uniform look
        ctx.strokeStyle = '#fb7185';
        ctx.fillStyle = '#fb7185';
        ctx.lineWidth = Math.max(2, Math.round(W * 0.0018));

        var ix = gx + lblW + labelGap;
        var iy = gy - ico / 2;

        // Icons — EXACT official logos (same paths as website), filled in brand pink
        ctx.fillStyle = '#fb7185';
        var GLYPHS = {
            fb: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07",
            wa: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
            x: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z",
            ig: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.15A4 4 0 1 1 16 12a4 4 0 0 1-4 3.99zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"
        };
        function drawGlyph(d, x, y, s) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(s / 24, s / 24);
            ctx.fill(new Path2D(d));
            ctx.restore();
        }
        drawGlyph(GLYPHS.fb, ix, iy, ico);
        ix += ico + icoGap;
        drawGlyph(GLYPHS.wa, ix, iy, ico);
        ix += ico + icoGap;
        drawGlyph(GLYPHS.x, ix, iy, ico);
        ix += ico + icoGap;
        drawGlyph(GLYPHS.ig, ix, iy, ico);

        ctx.textBaseline = 'top';
    })();

    return cv;
}

// 🎨 POSTER MODAL — size + language + preview + download + share
let _pgArticle = null;
let _pgOverrides = {};   // ✏️ user text edits per lang: {title_ta, excerpt_ta, title_en, excerpt_en}
async function openPosterModal(articleId) {
    _pgArticle = (typeof adminNews !== 'undefined' ? adminNews : []).find(function(n) { return String(n.id) === String(articleId); });
    if (!_pgArticle) { showToast('Article not found', 'error'); return; }

    var ov = document.getElementById('poster-gen-ov');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'poster-gen-ov';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9500;display:none;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
        ov.innerHTML =
            '<div style="background:#fff;border-radius:18px;max-width:640px;width:100%;padding:24px;position:relative;max-height:94vh;overflow-y:auto;">' +
            '<button onclick="document.getElementById(\'poster-gen-ov\').style.display=\'none\'" style="position:absolute;top:14px;right:14px;width:36px;height:36px;border:none;border-radius:50%;background:#f3f4f6;cursor:pointer;font-size:16px;">✕</button>' +
            '<h3 style="font-size:1.2rem;font-weight:800;margin-bottom:4px;">🎨 Social Poster Generator</h3>' +
            '<p style="color:#6b7280;font-size:0.85rem;margin-bottom:16px;">One click → branded news card (Al Jazeera style!) — Download & Post FB/IG/X!</p>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +
                '<select id="pg-size" style="flex:1;min-width:150px;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-weight:600;">' +
                    '<option value="square">1:1 · Instagram / FB Post</option>' +
                    '<option value="p45">4:5 · Instagram Portrait</option>' +
                    '<option value="p34">3:4 · Portrait</option>' +
                    '<option value="p23">2:3 · Pinterest / FB</option>' +
                    '<option value="story">9:16 · Story / Status</option>' +
                    '<option value="wide">16:9 · X / FB Link Card</option>' +
                '</select>' +
                '<select id="pg-lang" style="flex:1;min-width:120px;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-weight:600;">' +
                    '<option value="ta">தமிழ்</option>' +
                    '<option value="en">English</option>' +
                '</select>' +
                '<select id="pg-mode" style="flex:1;min-width:160px;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-weight:600;font-family:inherit;">' +
                    '<option value="full">🖼️ Full Poster (Headline + Excerpt)</option>' +
                    '<option value="headline">💬 Headline Only (Big Text)</option>' +
                '</select>' +
                '<select id="pg-quality" title="HD = 2x resolution, best for WhatsApp/social sharing" style="flex:1;min-width:130px;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-weight:600;font-family:inherit;">' +
                    '<option value="std">📱 Standard (1080px)</option>' +
                    '<option value="hd">🖥️ HD (2160px)</option>' +
                '</select>' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
            '<button type="button" id="pg-edit-toggle" style="width:100%;padding:10px 14px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:10px;font-weight:700;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;">✏️ Edit Headline & Excerpt (optional)</button>' +
            '<button type="button" id="pg-font-toggle" style="margin-top:8px;width:100%;padding:10px 14px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:10px;font-weight:700;font-size:0.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;">🔤 Fonts (Tamil & English)</button>' +
            '<div id="pg-font-panel" style="display:none;margin-top:8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:12px;">' +
                '<p id="pg-font-lang-note" style="margin:0 0 8px;font-size:0.72rem;color:#6b7280;font-weight:700;"></p>' +
                '<label style="display:block;font-size:0.72rem;font-weight:700;color:#374151;margin-bottom:4px;">Tamil (headline / text) font</label>' +
                '<div id="pg-font-ta" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;"></div>' +
                '<label style="display:block;font-size:0.72rem;font-weight:700;color:#374151;margin-bottom:4px;">English (brand) font</label>' +
                '<div id="pg-font-en" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;"></div>' +
                '<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.78rem;font-weight:700;color:#374151;">＋ Add custom font (Google Fonts)</summary>' +
                '<input type="text" id="pg-font-custom" placeholder="e.g. Baloo 2  or  Noto Sans Tamil:wght@700" style="margin-top:6px;width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.85rem;font-family:inherit;box-sizing:border-box;">' +
                '<button type="button" id="pg-font-custom-add" style="margin-top:6px;padding:6px 14px;background:#dc2626;color:#fff;border:none;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;">Add font</button></details>' +
            '</div>' +
            '<div id="pg-edit-panel" style="display:none;margin-top:8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:12px;">' +
                '<label style="display:block;font-size:0.75rem;font-weight:700;color:#374151;margin-bottom:4px;">Headline</label>' +
                '<textarea id="pg-edit-title" rows="2" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.9rem;font-family:inherit;resize:vertical;margin-bottom:8px;box-sizing:border-box;"></textarea>' +
                '<label style="display:block;font-size:0.75rem;font-weight:700;color:#374151;margin-bottom:4px;">Highlight words (tap to make pink) <span style="color:#fb7185;">■</span></label>' +
                '<div id="pg-hl-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;"></div>' +
                '<label style="display:block;font-size:0.75rem;font-weight:700;color:#374151;margin-bottom:4px;">Excerpt</label>' +
                '<textarea id="pg-edit-excerpt" rows="3" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.85rem;font-family:inherit;resize:vertical;box-sizing:border-box;"></textarea>' +
                '<button type="button" id="pg-edit-reset" style="margin-top:8px;padding:6px 14px;background:#fee2e2;color:#991b1b;border:none;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;">↺ Reset to original</button>' +
                '<p style="margin:8px 0 0;font-size:0.72rem;color:#9ca3af;">Your edits apply to <b id="pg-edit-lang-label">தமிழ்</b> version only — switch language to edit that version separately.</p>' +
            '</div>' +
            '</div>' +
'<div style="background:#0a0a0f;border-radius:12px;padding:12px;display:flex;justify-content:center;margin-bottom:14px;max-height:46vh;overflow:auto;">' +
                '<img id="pg-preview" style="max-width:100%;max-height:44vh;border-radius:8px;" alt="Poster preview">' +
            '</div>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                '<button class="btn-primary" id="pg-download" style="flex:1;min-width:140px;">⬇️ Download PNG</button>' +
                '<button class="btn-secondary" id="pg-share" style="flex:1;min-width:140px;">📤 Share</button>' +
            '</div></div>';
        document.body.appendChild(ov);
        ov.addEventListener('click', function(e) { if (e.target === ov) ov.style.display = 'none'; });
        document.getElementById('pg-size').addEventListener('change', pgRenderPreview);
        document.getElementById('pg-mode').addEventListener('change', pgRenderPreview);
        document.getElementById('pg-quality').addEventListener('change', pgRenderPreview);
        document.getElementById('pg-lang').addEventListener('change', function() { pgLoadEditFields(); pgRenderFontPicker(); pgRenderPreview(); });

        // 🔤 FONT PICKER PANEL
        var _pgCustomFonts = [];
        function pgDefaultFont() {
            return { head: 'Catamaran', brand: 'Playfair Display' };   // ⭐ DEFAULT: Catamaran (same on PC + mobile)
        }
        function pgGetFont() {
            var lang = document.getElementById('pg-lang').value;
            if (!_pgOverrides['font_' + lang]) _pgOverrides['font_' + lang] = pgDefaultFont();
            return _pgOverrides['font_' + lang];
        }
        function pgFontChip(containerId, listKey, currentName, onPick) {
            var box = document.getElementById(containerId);
            if (!box) return;
            box.innerHTML = '';
            function mkChip(name, sub, sys) {
                var b = document.createElement('button');
                b.type = 'button';
                b.style.cssText = 'padding:5px 12px;border-radius:999px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid ' +
                    (name === currentName ? '#dc2626' : '#d1d5db') + ';background:' + (name === currentName ? '#dc2626' : '#fff') + ';color:' + (name === currentName ? '#fff' : '#374151') + ';';
                b.textContent = name + (sys ? ' ·' : '');
                b.title = sub || name;
                b.addEventListener('click', function () { onPick(name); });
                box.appendChild(b);
            }
            POSTER_FONT_LIST.forEach(function (s) {
                var isSys = !s.g;
                var name = s.name.replace(/\s*\(system\)\s*$/, '');
                if (listKey === 'ta' && s.tags.indexOf('ta') !== -1) mkChip(name, s.name + (isSys ? ' (system font)' : ''), isSys);
                if (listKey === 'en' && s.tags.indexOf('en') !== -1) mkChip(name, s.name, isSys);
            });
            _pgCustomFonts.forEach(function (f) {
                mkChip(f.name, 'custom', false);
            });
        }
        function pgRenderFontPicker() {
            var lang = document.getElementById('pg-lang').value;
            var note = document.getElementById('pg-font-lang-note');
            if (note) note.textContent = 'Selecting fonts for: ' + (lang === 'en' ? 'English version' : 'தமிழ் version') + ' — switch language to set the other.';
            var cur = pgGetFont();
            pgFontChip('pg-font-ta', 'ta', cur.head, function (name) {
                pgGetFont().head = name;
                pgRenderFontPicker();
                clearTimeout(_pgEditT);
                _pgEditT = setTimeout(pgRenderPreview, 350);
            });
            pgFontChip('pg-font-en', 'en', cur.brand, function (name) {
                pgGetFont().brand = name;
                pgRenderFontPicker();
                clearTimeout(_pgEditT);
                _pgEditT = setTimeout(pgRenderPreview, 350);
            });
        }
        var pgFontToggle = document.getElementById('pg-font-toggle');
        var pgFontPanel = document.getElementById('pg-font-panel');
        pgFontToggle.addEventListener('click', function () {
            var open = pgFontPanel.style.display !== 'none';
            pgFontPanel.style.display = open ? 'none' : 'block';
            pgFontToggle.textContent = open ? '🔤 Fonts (Tamil & English)' : '🔤 Hide Fonts';
            if (!open) pgRenderFontPicker();
        });
        document.getElementById('pg-font-custom-add').addEventListener('click', function () {
            var raw = (document.getElementById('pg-font-custom').value || '').trim();
            if (!raw) return;
            var name = raw.split(':')[0].trim();
            if (!name) return;
            var exists = POSTER_FONT_LIST.some(function (s) { return s.name.replace(/\s*\(system\)\s*$/, '') === name; }) ||
                         _pgCustomFonts.some(function (f) { return f.name === name; });
            if (!exists) {
                POSTER_FONT_LIST.push({ name: name, g: raw.replace(/\s+/g, '+').replace(':', ':'), tags: 'ta en' });
                _pgCustomFonts.push({ name: name, g: raw });
            }
            document.getElementById('pg-font-custom').value = '';
            pgRenderFontPicker();
        });

        // ✏️ EDIT TEXT PANEL — live editable headline/excerpt
        var _pgEditT = null;
        function pgLoadEditFields() {
            var lang = document.getElementById('pg-lang').value;
            var t = document.getElementById('pg-edit-title');
            var x = document.getElementById('pg-edit-excerpt');
            if (!t || !x || !_pgArticle) return;
            t.value = _pgOverrides.hasOwnProperty('title_' + lang)
                ? _pgOverrides['title_' + lang]
                : (lang === 'en' ? (_pgArticle.title_en || _pgArticle.title || '') : (_pgArticle.title || _pgArticle.title_en || ''));
            x.value = _pgOverrides.hasOwnProperty('excerpt_' + lang)
                ? _pgOverrides['excerpt_' + lang]
                : (lang === 'en' ? (_pgArticle.excerpt_en || _pgArticle.excerpt || '') : (_pgArticle.excerpt || _pgArticle.excerpt_en || ''));
            var lbl = document.getElementById('pg-edit-lang-label');
            if (lbl) lbl.textContent = lang === 'en' ? 'English' : 'தமிழ்';
            pgRenderChips();
        }

        // 🎨 Word highlight chips — tap a word to toggle brand-pink on the poster
        function pgNormChip(w) {
            return String(w || '').replace(/^[\s\.,;:!?"'’“”\-–—()\[\]]+|[\s\.,;:!?"'’“”\-–—()\[\]]+$/g, '');
        }
        function pgRenderChips() {
            var box = document.getElementById('pg-hl-chips');
            if (!box) return;
            var lang = document.getElementById('pg-lang').value;
            var title = (document.getElementById('pg-edit-title') || { value: '' }).value;
            var hl = _pgOverrides['hl_' + lang] || (_pgOverrides['hl_' + lang] = []);
            box.innerHTML = '';
            String(title).split(/\s+/).forEach(function (w) {
                if (!w) return;
                var nw = pgNormChip(w);
                if (!nw) return;
                var b = document.createElement('button');
                b.type = 'button';
                b.textContent = w;
                var on = hl.indexOf(nw) !== -1;
                b.style.cssText = 'padding:4px 10px;border-radius:999px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;border:1.5px solid ' +
                    (on ? '#fb7185' : '#d1d5db') + ';background:' + (on ? '#fb7185' : '#fff') + ';color:' + (on ? '#fff' : '#374151') + ';';
                b.addEventListener('click', function () {
                    var i = hl.indexOf(nw);
                    if (i !== -1) hl.splice(i, 1); else hl.push(nw);
                    pgRenderChips();
                    clearTimeout(_pgEditT);
                    _pgEditT = setTimeout(pgRenderPreview, 250);
                });
                box.appendChild(b);
            });
        }
        var pgEditToggle = document.getElementById('pg-edit-toggle');
        var pgEditPanel = document.getElementById('pg-edit-panel');
        pgEditToggle.addEventListener('click', function() {
            var open = pgEditPanel.style.display !== 'none';
            pgEditPanel.style.display = open ? 'none' : 'block';
            pgEditToggle.textContent = open ? '✏️ Edit Headline & Excerpt (optional)' : '✏️ Hide Text Editor';
            if (!open) pgLoadEditFields();
        });
        var pgEditTitle = document.getElementById('pg-edit-title');
        var pgEditExcerpt = document.getElementById('pg-edit-excerpt');
        function pgOnEdit() {
            var lang = document.getElementById('pg-lang').value;
            _pgOverrides['title_' + lang] = pgEditTitle.value;
            _pgOverrides['excerpt_' + lang] = pgEditExcerpt.value;
            clearTimeout(_pgEditT);
            _pgEditT = setTimeout(function() { pgRenderPreview(); pgRenderChips(); }, 400);   // debounced live re-render
        }
        pgEditTitle.addEventListener('input', pgOnEdit);
        pgEditExcerpt.addEventListener('input', pgOnEdit);
        document.getElementById('pg-edit-reset').addEventListener('click', function() {
            _pgOverrides = {};
            pgLoadEditFields();
            pgRenderPreview();
        });
        document.getElementById('pg-download').addEventListener('click', pgDownload);
        document.getElementById('pg-share').addEventListener('click', pgShare);
    }
    ov.style.display = 'flex';
    pgRenderPreview();
}

let _pgCanvas = null;
async function pgRenderPreview() {
    if (!_pgArticle) return;
    var size = document.getElementById('pg-size').value;
    var lang = document.getElementById('pg-lang').value;
    var img = document.getElementById('pg-preview');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='; // spinner placeholder
    // ✏️ Apply user text edits (per language) over the article data
    var o = _pgOverrides;
    var eff = Object.assign({}, _pgArticle, {
        title: o.hasOwnProperty('title_ta') ? o.title_ta : _pgArticle.title,
        title_en: o.hasOwnProperty('title_en') ? o.title_en : _pgArticle.title_en,
        excerpt: o.hasOwnProperty('excerpt_ta') ? o.excerpt_ta : _pgArticle.excerpt,
        excerpt_en: o.hasOwnProperty('excerpt_en') ? o.excerpt_en : _pgArticle.excerpt_en,
        _hl: o['hl_' + lang] || [],   // 🎨 per-language highlighted words
        _font: o['font_ta'] || o['font_en'] ? { ta: o['font_ta'] || pgDefaultFont(), en: o['font_en'] || pgDefaultFont() } : null
    });
    try {
        var mode = (document.getElementById('pg-mode') || { value: 'full' }).value;
        var quality = (document.getElementById('pg-quality') || { value: 'std' }).value;
        _pgCanvas = await generatePoster(eff, size, lang, mode, quality);
        img.src = _pgCanvas.toDataURL('image/png');
    } catch (e) {
        showToast('Poster error: ' + e.message, 'error');
    }
}

function pgDownload() {
    if (!_pgCanvas) return;
    var a = document.createElement('a');
    a.download = 'endless-poster-' + (_pgArticle ? _pgArticle.id : 'news') + '.png';
    a.href = _pgCanvas.toDataURL('image/png');
    a.click();
    showToast('⬇️ Poster downloaded!', 'success');
}

async function pgShare() {
    if (!_pgCanvas) return;
    try {
        _pgCanvas.toBlob(async function(blob) {
            var file = new File([blob], 'endless-news.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'EndLess News', text: (_pgArticle.title_en || _pgArticle.title || '') });
            } else {
                pgDownload(); // fallback
            }
        }, 'image/png');
    } catch (e) { pgDownload(); }
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
    iconifyAdmin(); // 🎨 SVG icons replace emojis
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
            dbg(' Firebase empty, uploading', adminNews.length, 'articles...');
            Promise.all(adminNews.map(n => 
                db.collection('news').doc(String(n.id)).set(n).catch(() => {})
            )).then(() => dbg('Upload complete'));
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
    if (page === 'settings') ensureTelegramUI();
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

    // ❤️ Likes column header — inject once after Date th
    (function ensureLikesHeader() {
        var thead = document.querySelector('#page-news thead tr');
        if (!thead || document.getElementById('th-likes')) return;
        var ths = thead.querySelectorAll('th');
        var dateTh = null;
        ths.forEach(function(th) { if ((th.textContent || '').trim() === 'Date') dateTh = th; });
        var th = document.createElement('th');
        th.id = 'th-likes'; th.textContent = '❤️ Likes';
        if (dateTh) dateTh.after(th); else thead.appendChild(th);
    })();

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#6b7280;">No articles found. Click "+ Add New Article" to create one.</td></tr>';
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
                '<td class="likes-cell" data-aid="' + escapeHtml(String(n.id)) + '" style="white-space:nowrap;">…</td>' +
                '<td>' + langs.join('') + '</td>' +
                '<td><span class="badge ' + (n.status === 'published' ? 'badge-green' : 'badge-gray') + '">' + (n.status || 'draft') + '</span></td>' +
                '<td><button class="btn-icon btn-edit" style="' + btnEditStyle + '" onmouseover="' + btnEditHover + '" onmouseout="' + btnEditOut + '" onclick="editNews(' + n.id + ')" title="Edit">&#9999;&#65039;</button>' +
                '<button class="btn-icon btn-delete" style="' + btnDeleteStyle + '" onclick="deleteNews(' + n.id + ')" title="Delete">&#128465;&#65039;</button>' +
                '<button onclick="openPosterModal(' + n.id + ')" title="🎨 Social Poster" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:6px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;cursor:pointer;font-size:16px;margin-left:6px;">🎨</button></td></tr>';
        }).join('');
    }

    // ❤️ Populate like counts per article (likes collection)
    if (db && tbody) {
        tbody.querySelectorAll('.likes-cell').forEach(function(cell) {
            var aid = cell.dataset.aid;
            db.collection('likes').doc(String(aid)).get().then(function(doc) {
                var f = doc.exists ? doc.data() : {};
                var total = 0, parts = [];
                var rcols = { like: '#1877F2', love: '#F33E58', haha: '#F7B125', wow: '#F7B125', sad: '#F7B125', angry: '#E9710F' };
                Object.keys(rcols).forEach(function(k) {
                    var v = parseInt(f[k]) || 0;
                    if (v > 0) { total += v; parts.push('<span style="color:' + rcols[k] + ';display:inline-flex;vertical-align:-2px;">' + IC.heart + '</span>' + v); }
                });
                cell.innerHTML = total > 0 ? parts.join(' ') : '0';
            }).catch(function() { cell.textContent = '0'; });
        });
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
                    '<button style="' + btnDeleteStyle + 'width:44px;height:44px;" onclick="deleteNews(' + n.id + ')" title="Delete">&#128465;&#65039;</button>' +
                    '<button onclick="openPosterModal(' + n.id + ')" title="🎨 Poster" style="width:44px;height:44px;border:none;border-radius:6px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;cursor:pointer;font-size:18px;">🎨</button></div></div>';
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
                if (typeof showToast === 'function') showToast('Image auto-optimized for sharing!', 'success');
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
    // 📸 Gallery upload button — NEWS modal-la dhaan add aaganum!
    setTimeout(ensureGalleryUploadBtn, 200);
    // 📱 Mobile: Enter key in inputs must NOT submit/close modal (keyboard "Go" button)
    var nf = document.getElementById('news-form');
    if (nf) { nf.setAttribute('novalidate', 'novalidate'); nf.setAttribute('onsubmit', 'return false;'); }
    setTimeout(function() {
        var modal = document.getElementById('news-modal');
        if (!modal || modal._enterGuard) return;
        modal._enterGuard = true;
        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true); // capture phase — stops mobile submit before any handler
    }, 60);
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

// 📊 AD ANALYTICS — Manage Ads toolbar-la button; real-time stats modal
function ensureAdAnalyticsUI() {
    if (document.getElementById('btn-ad-analytics')) return;
    var toolbar = document.querySelector('#page-ads .page-toolbar');
    if (!toolbar) return;
    var b = document.createElement('button');
    b.id = 'btn-ad-analytics';
    b.className = 'btn-secondary';
    b.type = 'button';
    b.style.marginLeft = 'auto';
    b.innerHTML = (typeof IC !== 'undefined' ? IC.chart : '📊') + ' Ad Analytics';
    toolbar.appendChild(b);
    b.addEventListener('click', openAdAnalytics);
}

async function openAdAnalytics() {
    var ov = document.getElementById('ad-analytics-ov');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'ad-analytics-ov';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9000;display:flex;align-items:center;justify-content:center;padding:18px;';
        ov.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:680px;width:100%;max-height:88vh;overflow-y:auto;padding:24px;position:relative;">' +
            '<button id="aa-close" style="position:absolute;top:14px;right:14px;width:34px;height:34px;border:none;border-radius:50%;background:#f3f4f6;color:#374151;font-size:16px;cursor:pointer;">✕</button>' +
            '<h3 style="font-size:1.2rem;font-weight:700;margin-bottom:18px;display:flex;align-items:center;gap:8px;">' + (typeof IC !== 'undefined' ? IC.chart : '') + ' Ad Performance Analytics</h3>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:20px;">' +
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:1.6rem;font-weight:800;color:#0f172a;" id="aa-impr">—</div><div style="font-size:0.75rem;color:#64748b;font-weight:600;">IMPRESSIONS</div></div>' +
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:1.6rem;font-weight:800;color:#0f172a;" id="aa-clicks">—</div><div style="font-size:0.75rem;color:#64748b;font-weight:600;">CLICKS</div></div>' +
            '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:1.6rem;font-weight:800;color:#dc2626;" id="aa-ctr">—</div><div style="font-size:0.75rem;color:#991b1b;font-weight:600;">CTR %</div></div>' +
            '</div>' +
            '<div style="margin-bottom:16px;"><canvas id="aa-chart" height="120"></canvas></div>' +
            '<h4 style="font-size:0.95rem;font-weight:700;margin-bottom:10px;">Top Performing Ads</h4>' +
            '<div class="table-scroll" style="border:1px solid #e2e8f0;border-radius:10px;"><table class="data-table compact"><thead><tr><th>Ad</th><th>Position</th><th>Impr.</th><th>Clicks</th><th>CTR</th></tr></thead><tbody id="aa-top"><tr><td colspan="5" style="text-align:center;color:#94a3b8;">Loading…</td></tr></tbody></table></div>' +
            '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">' +
            '<h4 style="font-size:0.95rem;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:6px;">' + (typeof IC !== 'undefined' ? IC.users : '👥') + ' Active Campaigns & Contacts</h4>' +
            '<div class="table-scroll" style="border:1px solid #e2e8f0;border-radius:10px;max-height:200px;overflow-y:auto;"><table class="data-table compact"><thead><tr><th>Ad</th><th>Client</th><th>Contact</th><th>Duration</th><th>Days Left</th><th>Earned (est.)</th></tr></thead><tbody id="aa-campaigns"><tr><td colspan="6" style="text-align:center;color:#94a3b8;">Loading…</td></tr></tbody></table></div></div>' +
            '<div style="margin-top:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px 14px;font-size:0.82rem;color:#0c4a6e;">' +
            '<strong>💡 Tip:</strong> Ad edit pannum bodhu client name, phone, rate add pannunga — ithu auto-track aagum. Daily rate × active days = estimated earnings.</div>' +
            '<p style="color:#94a3b8;font-size:0.75rem;margin-top:12px;">Click tracking — website-la ad click pannum bodhu auto-count aagum. Duration: admin-la set panna start/end date.</p></div>';
        document.body.appendChild(ov);
        document.getElementById('aa-close').addEventListener('click', function() { ov.style.display = 'none'; });
        ov.addEventListener('click', function(e) { if (e.target === ov) ov.style.display = 'none'; });
    }
    ov.style.display = 'flex';
    if (!db) return;
    try {
        var totals = await db.collection('ad_analytics').doc('totals').get();
        var t = totals.exists ? totals.data() : {};
        document.getElementById('aa-impr').textContent = (t.impressions || 0).toLocaleString();
        document.getElementById('aa-clicks').textContent = (t.clicks || 0).toLocaleString();
        var ctr = (t.impressions || 0) > 0 ? ((t.clicks || 0) / t.impressions * 100).toFixed(1) : '0.0';
        document.getElementById('aa-ctr').textContent = ctr + '%';
        // Daily chart (last 7 days)
        var days = [], keys = [];
        for (var i = 6; i >= 0; i--) {
            var dt = new Date(); dt.setDate(dt.getDate() - i);
            keys.push(dt.toISOString().slice(0, 10));
            days.push(dt.toLocaleDateString('en-GB', { weekday: 'short' }));
        }
        var docs = await Promise.all(keys.map(function(k) { return db.collection('ad_analytics').doc('daily_' + k).get().catch(function() { return null; }); }));
        var data = docs.map(function(x) { return x && x.exists ? (x.data().impressions || 0) : 0; });
        var ctx = document.getElementById('aa-chart');
        if (ctx && typeof Chart !== 'undefined') {
            if (window._aaChart) window._aaChart.destroy();
            window._aaChart = new Chart(ctx, { type: 'bar', data: { labels: days, datasets: [{ data: data, backgroundColor: '#dc2626', borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
        }
        // Top ads
        var snap = await db.collection('ad_analytics').where('impressions', '>', 0).get().catch(function() { return { docs: [] }; });
        var rows = snap.docs.filter(function(doc) { return doc.id.indexOf('ad_') === 0; }).map(function(doc) {
            var v = doc.data();
            return { id: doc.id.replace('ad_', ''), imp: v.impressions || 0, clk: v.clicks || 0 };
        }).sort(function(a, b) { return b.imp - a.imp; }).slice(0, 5);
        var adNames = {};
        (typeof adminAds !== 'undefined' ? adminAds : []).forEach(function(a) { adNames[String(a.id)] = a.title_en || a.title || 'Ad #' + a.id; });
        // 💼 Active campaigns — client, contact, duration, earnings
        try {
            var now = new Date();
            var campRows = (typeof adminAds !== 'undefined' ? adminAds : []).filter(function(a) {
                return a && a.active !== false && (!a.endDate || new Date(a.endDate) >= now);
            }).map(function(a) {
                var start = a.startDate ? new Date(a.startDate) : null;
                var end = a.endDate ? new Date(a.endDate) : null;
                var daysLeft = end ? Math.max(0, Math.ceil((end - now) / 86400000)) : '∞';
                var totalDays = start && end ? Math.max(1, Math.ceil((end - start) / 86400000)) : 30;
                var rate = parseFloat(a.dailyRate) || 0;
                var activeDays = start ? Math.max(0, Math.min(totalDays, Math.floor((now - start) / 86400000))) : 0;
                var earned = rate > 0 ? 'Rs.' + (rate * activeDays).toLocaleString() : '—';
                return {
                    name: (a.title_en || a.title || 'Ad').replace(/</g, '&lt;').substring(0, 24),
                    client: (a.clientName || a.client || '—').replace(/</g, '&lt'),
                    contact: (a.clientPhone || a.clientEmail || '—').replace(/</g, '&lt'),
                    dur: (start ? start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—') + ' → ' + (end ? end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '∞'),
                    left: daysLeft,
                    earned: earned
                };
            });
            document.getElementById('aa-campaigns').innerHTML = campRows.length ? campRows.map(function(c) {
                return '<tr><td><strong>' + c.name + '</strong></td><td>' + c.client + '</td><td>' + c.contact + '</td><td style="white-space:nowrap;">' + c.dur + '</td><td>' + (c.left === '∞' ? '∞' : c.left + 'd') + '</td><td style="color:#059669;font-weight:700;">' + c.earned + '</td></tr>';
            }).join('') : '<tr><td colspan="6" style="text-align:center;color:#94a3b8;">No active campaigns</td></tr>';
        } catch (e) {}

        // Top ads
        document.getElementById('aa-top').innerHTML = rows.length ? rows.map(function(r) {
            return '<tr><td><strong>' + String(adNames[r.id] || 'Ad #' + r.id).replace(/</g, '&lt;').substring(0, 30) + '</strong></td><td>—</td><td>' + r.imp + '</td><td>' + r.clk + '</td><td>' + (r.imp > 0 ? (r.clk / r.imp * 100).toFixed(1) : '0.0') + '%</td></tr>';
        }).join('') : '<tr><td colspan="5" style="text-align:center;color:#94a3b8;">No ad data yet — clicks start tracking automatically.</td></tr>';
    } catch (e) {}
}

// 💼 CLIENT FIELDS — ad modal-la contact + rate (sponsor tracking)
function ensureAdClientUI() {
    if (document.getElementById('ad-client-name')) return;
    var anchor = document.getElementById('ad-link');
    if (!anchor) return;
    var group = anchor.closest('.form-group');
    if (!group || !group.parentNode) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
        '<div class="form-row" style="margin-top:0.75rem;">' +
        '<div class="form-group" style="margin-bottom:0.6rem;"><label>Client / Company Name</label><input type="text" id="ad-client-name" placeholder="e.g., Jaffna Electronics" style="width:100%;padding:0.6rem 0.875rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.95rem;"></div>' +
        '<div class="form-group" style="margin-bottom:0.6rem;"><label>Contact (Phone / Email)</label><input type="text" id="ad-client-contact" placeholder="077xxxxxxx or email" style="width:100%;padding:0.6rem 0.875rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.95rem;"></div>' +
        '</div>' +
        '<div class="form-group" style="margin-bottom:0;"><label>Daily Rate (Rs. — for earnings estimate)</label><input type="number" id="ad-daily-rate" placeholder="e.g., 150" min="0" style="width:100%;padding:0.6rem 0.875rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.95rem;"></div>';
    group.parentNode.insertBefore(wrap, group.nextSibling);
}

// 📸 GALLERY UPLOAD BUTTON — "Add Image URL" pakkathla "📁 Upload Photo" button!
// Click → device file → auto Cloudinary → gallery row add!
function ensureGalleryUploadBtn() {
    if (document.getElementById('btn-upload-gallery')) return;
    // "＋ Add Image URL" button = #btn-add-gallery — athu pakkathla insert pannuvom
    var anchor = document.getElementById('btn-add-gallery') || document.getElementById('gallery-rows');
    if (!anchor || !anchor.parentNode) return;

    var up = document.createElement('button');
    up.id = 'btn-upload-gallery';
    up.type = 'button';
    up.style.cssText = 'margin-left:8px;padding:0.5rem 1rem;background:linear-gradient(135deg,#1877F2,#0e5fca);color:#fff;border:none;border-radius:6px;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;';
    up.innerHTML = '📁 Upload Photo';
    up.title = 'Device-la irundhu photo upload — auto Cloudinary!';
    up.addEventListener('click', function() {
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        inp.onchange = function() {
            if (!inp.files || !inp.files[0]) return;
            if (typeof uploadToCloudinary === 'function') {
                showToast('☁️ Gallery upload...', 'success');
                uploadToCloudinary(inp.files[0]).then(function(url) {
                    if (url && typeof addGalleryRow === 'function') {
                        addGalleryRow(url);
                        showToast('✅ Gallery image added!', 'success');
                    }
                });
            }
        };
        inp.click();
    });
    anchor.parentNode.insertBefore(up, anchor.nextSibling);
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
    // 🎯 DRAG & DROP multi-image zone (HEAD + GALLERY auto-split!)
    setTimeout(function() {
        var area = document.getElementById('photo-upload-area');
        if (!area || area._dropWired) return;
        area._dropWired = true;
        ['dragover','dragenter'].forEach(function(ev) {
            area.addEventListener(ev, function(e) { e.preventDefault(); area.style.borderColor = '#1877F2'; area.style.background = '#eff6ff'; });
        });
        ['dragleave','drop'].forEach(function(ev) {
            area.addEventListener(ev, function(e) { e.preventDefault(); area.style.borderColor = ''; area.style.background = ''; });
        });
        area.addEventListener('drop', function(e) {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                if (typeof uploadImagesSmart === 'function') uploadImagesSmart(e.dataTransfer.files);
            }
        });
        // Hint text update
        var ph2 = document.getElementById('photo-placeholder');
        if (ph2) {
            var small = ph2.querySelector('small');
            if (small) small.textContent = 'Click OR Drag & Drop — 1st image = Head, rest = Gallery';
        }
    }, 150);
    ensureAdInArticleChk(); // 🎯 per-ad in-article tick
    ensureAdAnalyticsUI(); // 📊 Ad Analytics button
    ensureAdClientUI(); // 💼 client fields

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
    var _cn = document.getElementById('ad-client-name');
    if (_cn) _cn.value = ad.clientName || '';
    var _cc = document.getElementById('ad-client-contact');
    if (_cc) _cc.value = ad.clientPhone || '';
    var _dr = document.getElementById('ad-daily-rate');
    if (_dr) _dr.value = ad.dailyRate || '';
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
        clientName: (document.getElementById('ad-client-name') || {}).value || '',
        clientPhone: (document.getElementById('ad-client-contact') || {}).value || '',
        dailyRate: parseFloat((document.getElementById('ad-daily-rate') || {}).value) || 0,
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
            showToast('Not authorized — login as admin first', 'error');
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