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

        db.disableNetwork().then(function() {
            return db.enableNetwork();
        }).catch(function(err) {
            console.warn('Network toggle error:', err);
        });

        console.log('Firebase connected successfully');
    } else {
        console.warn('Firebase SDK not loaded - using localStorage only');
    }
} catch (err) {
    console.error('Firebase init error:', err);
}

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
const ADMIN_PASSWORD = "6402@Faizan";

// ── Default Data ──
const DEFAULT_NEWS = [
    {
        id: 1718764800001,
        title: "Global Markets Rally as Inflation Data Shows Unexpected Cooling",
        title_en: "Global Markets Rally as Inflation Data Shows Unexpected Cooling",
        title_si: "Global Markets Rally as Inflation Data Shows Unexpected Cooling",
        excerpt: "Major indices hit record highs Thursday as consumer price reports suggest the worst of the economic squeeze may be over.",
        excerpt_en: "Major indices hit record highs Thursday as consumer price reports suggest the worst of the economic squeeze may be over.",
        excerpt_si: "Major indices hit record highs Thursday as consumer price reports suggest the worst of the economic squeeze may be over.",
        content: "<p>Major indices hit record highs Thursday as consumer price reports suggest the worst of the economic squeeze may be over.</p>",
        content_en: "<p>Major indices hit record highs Thursday as consumer price reports suggest the worst of the economic squeeze may be over.</p>",
        content_si: "<p>Major indices hit record highs Thursday as consumer price reports suggest the worst of the economic squeeze may be over.</p>",
        category: "Business", category_en: "Business", category_si: "Business",
        author: "Elena Rostova", author_en: "Elena Rostova", author_si: "Elena Rostova",
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        image: "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&auto=format&fit=crop",
        video: "", featured: true, trending: true, status: "published"
    },
    {
        id: 1718764800002,
        title: "SpaceX Launches Next-Gen Satellite Constellation",
        title_en: "SpaceX Launches Next-Gen Satellite Constellation",
        title_si: "SpaceX Launches Next-Gen Satellite Constellation",
        content: "<p>The Falcon Heavy carried 24 advanced communications satellites into orbit. Each satellite is equipped with laser interlinks.</p>",
        content_en: "<p>The Falcon Heavy carried 24 advanced communications satellites into orbit. Each satellite is equipped with laser interlinks.</p>",
        content_si: "<p>The Falcon Heavy carried 24 advanced communications satellites into orbit. Each satellite is equipped with laser interlinks.</p>",
        category: "Science", category_en: "Science", category_si: "Science",
        author: "James Chen", author_en: "James Chen", author_si: "James Chen",
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
        image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&auto=format&fit=crop",
        video: "", featured: true, trending: false, status: "published"
    },
    {
        id: 1718764800003,
        title: "AI Safety Pact Signed by Leading Tech Giants",
        title_en: "AI Safety Pact Signed by Leading Tech Giants",
        title_si: "AI Safety Pact Signed by Leading Tech Giants",
        content: "<p>Microsoft, Google, and OpenAI agree to new transparency standards. The voluntary pact sets benchmarks for watermarking AI-generated content.</p>",
        content_en: "<p>Microsoft, Google, and OpenAI agree to new transparency standards. The voluntary pact sets benchmarks for watermarking AI-generated content.</p>",
        content_si: "<p>Microsoft, Google, and OpenAI agree to new transparency standards. The voluntary pact sets benchmarks for watermarking AI-generated content.</p>",
        category: "Technology", category_en: "Technology", category_si: "Technology",
        author: "Sarah Miller", author_en: "Sarah Miller", author_si: "Sarah Miller",
        date: new Date(Date.now() - 3600000 * 8).toISOString(),
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
        video: "", featured: false, trending: true, status: "published"
    }
];

const DEFAULT_ADS = [
    {
        id: 1, title: "EndLess Premium", title_en: "EndLess Premium", title_si: "EndLess Premium",
        link: "https://example.com/premium",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop",
        position: "header", active: true
    },
    {
        id: 2, title: "Tech Gadgets Sale", title_en: "Tech Gadgets Sale", title_si: "Tech Gadgets Sale",
        link: "https://example.com/gadgets",
        image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&auto=format&fit=crop",
        position: "sidebar", active: true
    }
];

const DEFAULT_CATEGORIES = [
    { id: "world", name: "World", name_en: "World", name_si: "World", count: 2 },
    { id: "technology", name: "Technology", name_en: "Technology", name_si: "Technology", count: 2 },
    { id: "business", name: "Business", name_en: "Business", name_si: "Business", count: 2 },
    { id: "science", name: "Science", name_en: "Science", name_si: "Science", count: 2 },
    { id: "sports", name: "Sports", name_en: "Sports", name_si: "Sports", count: 2 },
    { id: "health", name: "Health", name_en: "Health", name_si: "Health", count: 0 }
];

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

// ── Helper: Check if post is garbage ──
function isUntitledOrGarbage(n) {
    if (!n || typeof n !== 'object') return true;
    var hasId = n.id !== undefined && n.id !== null && n.id !== '';
    var hasTitle = (n.title && String(n.title).trim() !== '') ||
                   (n.title_en && String(n.title_en).trim() !== '') ||
                   (n.title_si && String(n.title_si).trim() !== '');
    return !hasId || !hasTitle;
}

// ── Data Initialization ──
async function initData() {
    if (dataInitialized) {
        console.log('initData: Already initialized, skipping');
        return Promise.resolve(); // CRITICAL FIX: Return resolved promise
    }
    dataInitialized = true;

    console.log('=== initData() starting ===');

    adminNews = safeJSONParse('endless_news', []);
    adminAds = safeJSONParse('endless_ads', []);
    adminCats = safeJSONParse('endless_categories', []);

    console.log('Loaded from localStorage - News:', adminNews.length, 'Ads:', adminAds.length, 'Cats:', adminCats.length);

    if (adminNews.length > 0) {
        console.log('First news item:', JSON.stringify(adminNews[0]).substring(0, 200));
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
        console.log('Loaded DEFAULT news data');
        adminNews = JSON.parse(JSON.stringify(DEFAULT_NEWS));
        saveNews();
    }
    if (adminAds.length === 0) {
        console.log('Loaded DEFAULT ads data');
        adminAds = JSON.parse(JSON.stringify(DEFAULT_ADS));
        saveAds();
    }
    if (adminCats.length === 0) {
        console.log('Loaded DEFAULT categories data');
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
        console.log('No Firebase connection, using localStorage only');
    }

    var dashboard = document.getElementById('admin-dashboard');
    if (dashboard) dashboard.style.display = 'flex';

    var authLoading = document.getElementById('auth-loading-overlay');
    if (authLoading) authLoading.style.display = 'none';

    console.log('Final data - News:', adminNews.length, 'Ads:', adminAds.length, 'Cats:', adminCats.length);
    console.log('=== initData() complete ===');

    // CRITICAL FIX: Always render current page after data is ready
    showPageContinue(currentPage);

    return Promise.resolve(); // CRITICAL FIX: Always return promise
}

// ── Update Category Counts ──
function updateCategoryCounts() {
    adminCats.forEach(function(cat) {
        var count = adminNews.filter(function(n) {
            return n.status === 'published' &&
                (n.category === cat.name || n.category_en === cat.name_en || n.category_si === cat.name_si);
        }).length;
        cat.count = count;
    });
    saveCats();
}

// ── Firebase Sync ──
async function syncFromFirebase() {
    if (!db) return;
    try {
        var newsSnapshot = await db.collection('news').get({ source: 'server' });
        if (!newsSnapshot.empty) {
            var firebaseNews = [];
            newsSnapshot.docs.forEach(function(doc) {
                var data = doc.data();
                data.id = doc.id;
                if (!isUntitledOrGarbage(data)) firebaseNews.push(data);
            });
            var allNews = adminNews.concat(firebaseNews);
            var seenIds = {};
            adminNews = allNews.filter(function(n) {
                if (seenIds[n.id]) return false;
                seenIds[n.id] = true;
                return !isUntitledOrGarbage(n);
            });
            localStorage.setItem('endless_news', JSON.stringify(adminNews));
        }
        var adsSnapshot = await db.collection('ads').get({ source: 'server' });
        if (!adsSnapshot.empty) {
            adminAds = adsSnapshot.docs.map(function(doc) {
                var data = doc.data(); data.id = doc.id; return data;
            });
            localStorage.setItem('endless_ads', JSON.stringify(adminAds));
        }
        var catsSnapshot = await db.collection('categories').get({ source: 'server' });
        if (!catsSnapshot.empty) {
            adminCats = catsSnapshot.docs.map(function(doc) {
                var data = doc.data(); data.id = doc.id; return data;
            });
            localStorage.setItem('endless_categories', JSON.stringify(adminCats));
        }
        updateCategoryCounts();
    } catch (error) {
        console.error('Firebase read error:', error);
        throw error;
    }
}

// ── Local Storage Save ──
function saveNews() { localStorage.setItem('endless_news', JSON.stringify(adminNews)); }
function saveAds() { localStorage.setItem('endless_ads', JSON.stringify(adminAds)); }
function saveCats() { localStorage.setItem('endless_categories', JSON.stringify(adminCats)); }

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
}

// ── HTML Escape ──
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

// ── News Table Renderer ──
function renderNewsTable() {
    console.log('>>> renderNewsTable called. adminNews.length =', adminNews.length);
    if (adminNews.length > 0) {
        console.log('>>> First item id:', adminNews[0].id, 'title:', (adminNews[0].title || '').substring(0, 30));
    }

    var tbody = document.getElementById('news-table-body');
    var mobileCards = document.getElementById('news-mobile-cards');
    if (!tbody) {
        console.error('news-table-body not found');
        return;
    }

    var searchInput = document.getElementById('news-search');
    var search = searchInput ? searchInput.value.toLowerCase() : '';

    var filtered = adminNews.filter(function(n) {
        return !isUntitledOrGarbage(n);
    });

    console.log('>>> After filter, filtered.length =', filtered.length);

    if (search) {
        filtered = filtered.filter(function(n) {
            return (n.title && n.title.toLowerCase().indexOf(search) !== -1) ||
                (n.title_en && n.title_en.toLowerCase().indexOf(search) !== -1) ||
                (n.title_si && n.title_si.toLowerCase().indexOf(search) !== -1);
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
            if (n.title_si) langs.push('<span class="badge badge-lang">SI</span>');
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
    if (!tbody) return;

    var btnEditStyle = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:6px;background:#3b82f6;color:#fff;cursor:pointer;font-size:16px;margin-right:6px;';
    var btnDeleteStyle = 'display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;border-radius:6px;background:#ef4444;color:#fff;cursor:pointer;font-size:16px;';

    if (adminAds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#6b7280;">No ads found. Click "+ Add New Ad" to create one.</td></tr>';
    } else {
        tbody.innerHTML = adminAds.map(function(a) {
            var imgSrc = escapeHtml(a.image || '');
            return '<tr><td><img src="' + imgSrc + '" alt="" style="width:80px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.style.display=\'none\'"></td>' +
                '<td><strong>' + escapeHtml(a.title_en || a.title || '') + '</strong><br><small style="color:#6b7280;">' + escapeHtml(a.title || '') + '</small></td>' +
                '<td>' + escapeHtml(a.position || '') + '</td>' +
                '<td><a href="' + escapeHtml(a.link || '#') + '" target="_blank" style="color:#2563eb;">' + escapeHtml((a.link || '').substring(0, 30)) + '...</a></td>' +
                '<td><span class="badge ' + (a.active ? 'badge-green' : 'badge-gray') + '">' + (a.active ? 'Active' : 'Inactive') + '</span></td>' +
                '<td><button class="btn-icon btn-edit" style="' + btnEditStyle + '" onclick="editAd(' + a.id + ')" title="Edit">&#9999;&#65039;</button>' +
                '<button class="btn-icon btn-delete" style="' + btnDeleteStyle + '" onclick="deleteAd(' + a.id + ')" title="Delete">&#128465;&#65039;</button></td></tr>';
        }).join('');
    }

    if (mobileCards) {
        if (adminAds.length === 0) {
            mobileCards.innerHTML = '<div style="text-align:center;padding:2rem;color:#6b7280;">No ads found.</div>';
        } else {
            mobileCards.innerHTML = adminAds.map(function(a) {
                var imgSrc = escapeHtml(a.image || '');
                return '<div class="mobile-card" style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1rem;margin-bottom:1rem;">' +
                    '<div class="card-header" style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">' +
                    '<img src="' + imgSrc + '" alt="" style="width:80px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.style.display=\'none\'">' +
                    '<div class="card-title" style="font-weight:600;">' + escapeHtml(a.title_en || a.title || 'Untitled') + '</div></div>' +
                    '<div class="card-meta" style="font-size:0.8rem;color:#6b7280;margin-bottom:0.75rem;">' +
                    '<span>' + escapeHtml(a.position || 'Unknown') + '</span> | ' +
                    '<span class="badge ' + (a.active ? 'badge-green' : 'badge-gray') + '">' + (a.active ? 'Active' : 'Inactive') + '</span></div>' +
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
                escapeHtml(c.name || '') + ' / ' + escapeHtml(c.name_si || '') + '</small></td>' +
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
                    '<span>' + escapeHtml(c.name || '') + ' / ' + escapeHtml(c.name_si || '') + '</span> | ' +
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

               ['ta', 'en', 'si'].forEach(function(lang) {
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
        if (photoPreview) photoPreview.style.display = 'none';
        if (videoPreview) videoPreview.style.display = 'none';
        if (featured) featured.checked = false;
        if (trending) trending.checked = false;
        if (status) status.checked = true;

        switchNewsLang('ta');
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
        'news-title': ['title', 'title_en', 'title_si'],
        'news-excerpt': ['excerpt', 'excerpt_en', 'excerpt_si'],
        'news-author': ['author', 'author_en', 'author_si'],
        'news-content': ['content', 'content_en', 'content_si']
    };

    ['ta', 'en', 'si'].forEach(function(lang, idx) {
        Object.keys(fields).forEach(function(prefix) {
            var keys = fields[prefix];
            var el = document.getElementById(prefix + '-' + lang);
            if (el) el.value = news[keys[idx]] || '';
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
    if (status) status.checked = news.status === 'published';

    if (news.image && photoPreview) {
        photoPreview.src = news.image;
        photoPreview.style.display = 'block';
    }
    if (news.video && videoPreview) {
        videoPreview.src = news.video;
        videoPreview.style.display = 'block';
    }
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
    var excerpt_si_el = document.getElementById('news-excerpt-si');

    var title_ta_el = document.getElementById('news-title-ta');
    var title_en_el = document.getElementById('news-title-en');
    var title_si_el = document.getElementById('news-title-si');
    var author_ta_el = document.getElementById('news-author-ta');
    var author_en_el = document.getElementById('news-author-en');
    var author_si_el = document.getElementById('news-author-si');
    var content_ta_el = document.getElementById('news-content-ta');
    var content_en_el = document.getElementById('news-content-en');
    var content_si_el = document.getElementById('news-content-si');
    var imageUrl_el = document.getElementById('news-image-url');
    var photoData_el = document.getElementById('news-photo-data');
    var videoData_el = document.getElementById('news-video-data');
    var featured_el = document.getElementById('news-featured');
    var trending_el = document.getElementById('news-trending');
    var status_el = document.getElementById('news-status');

    var title_ta = title_ta_el ? title_ta_el.value.trim() : '';
    var title_en = title_en_el ? title_en_el.value.trim() : '';
    var title_si = title_si_el ? title_si_el.value.trim() : '';
    var author_ta = author_ta_el ? author_ta_el.value.trim() : '';
    var author_en = author_en_el ? author_en_el.value.trim() : '';
    var author_si = author_si_el ? author_si_el.value.trim() : '';
    var content_ta = content_ta_el ? content_ta_el.value.trim() : '';
    var content_en = content_en_el ? content_en_el.value.trim() : '';
    var content_si = content_si_el ? content_si_el.value.trim() : '';
    var imageUrl = imageUrl_el ? imageUrl_el.value.trim() : '';
    var photoData = photoData_el ? photoData_el.value : '';
    var videoData = videoData_el ? videoData_el.value : '';
    var featured = featured_el ? featured_el.checked : false;
    var trending = trending_el ? trending_el.checked : false;
    var status = status_el ? (status_el.checked ? 'published' : 'draft') : 'draft';

    var title_ta = title_ta_el ? title_ta_el.value.trim() : '';
    var title_en = title_en_el ? title_en_el.value.trim() : '';
    var title_si = title_si_el ? title_si_el.value.trim() : '';

    var excerpt_ta = excerpt_ta_el ? excerpt_ta_el.value.trim() : '';
    var excerpt_en = excerpt_en_el ? excerpt_en_el.value.trim() : '';
    var excerpt_si = excerpt_si_el ? excerpt_si_el.value.trim() : '';

    if (!title_ta || !category || !author_ta || !content_ta) {
        showToast('Please fill all required Tamil fields', 'error');
        switchNewsLang('ta');
        return;
    }

    var newsItem = {
        id: editingNewsId || Date.now(),
        title: title_ta,
        title_en: title_en || title_ta,
 title_si: title_si || title_ta,

        excerpt: excerpt_ta,
        excerpt_en: excerpt_en || excerpt_ta,
        excerpt_si: excerpt_si || excerpt_ta,

        content: content_ta,
        content_en: content_en || content_ta,
        content_si: content_si || content_ta,
        category: catObj ? catObj.name : category,
        category_en: catObj ? catObj.name_en : category,
        category_si: catObj ? catObj.name_si : category,
        author: author_ta,
        author_en: author_en || author_ta,
        author_si: author_si || author_ta,
        date: new Date().toISOString(),
        image: photoData || imageUrl || 'https://via.placeholder.com/800x400?text=EndLess+News',
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
            await syncFromFirebase();
        } catch (err) {
            console.warn('Firebase sync failed, using localStorage:', err);
        }
    } else {
        console.log('No Firebase connection, using localStorage only');
    }

    closeNewsModal();
    renderNewsTable();
    renderDashboard();

    var missing = [];
    if (!title_en) missing.push('English');
    if (!title_si) missing.push('Sinhala');
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

// ═══════════════════════════════════════
// AD MODAL
// ═══════════════════════════════════════
function openAdModal(isEdit) {
    isEdit = isEdit || false;
    var modal = document.getElementById('ad-modal');
    var modalTitle = document.getElementById('ad-modal-title');

    if (modal) modal.classList.add('open');
    if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Advertisement' : 'Add Advertisement';

    if (!isEdit) {
        editingAdId = null;
        var adId = document.getElementById('ad-id');
        var titleTa = document.getElementById('ad-title-ta');
        var titleEn = document.getElementById('ad-title-en');
        var titleSi = document.getElementById('ad-title-si');
        var link = document.getElementById('ad-link');
        var position = document.getElementById('ad-position');
        var image = document.getElementById('ad-image');
        var imagePreview = document.getElementById('ad-image-preview');
        var active = document.getElementById('ad-active');

        if (adId) adId.value = '';
        if (titleTa) titleTa.value = '';
        if (titleEn) titleEn.value = '';
        if (titleSi) titleSi.value = '';
        if (link) link.value = '';
        if (position) position.value = 'header';
        if (image) image.value = '';
        if (imagePreview) imagePreview.style.display = 'none';
        if (active) active.checked = true;
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
    var titleSi = document.getElementById('ad-title-si');
    var link = document.getElementById('ad-link');
    var position = document.getElementById('ad-position');
    var image = document.getElementById('ad-image');
    var active = document.getElementById('ad-active');
    var imagePreview = document.getElementById('ad-image-preview');

    if (adId) adId.value = ad.id;
    if (titleTa) titleTa.value = ad.title || '';
    if (titleEn) titleEn.value = ad.title_en || '';
    if (titleSi) titleSi.value = ad.title_si || '';
    if (link) link.value = ad.link || '';
    if (position) position.value = ad.position || 'header';
    if (image) image.value = ad.image || '';
    if (active) active.checked = !!ad.active;

    if (ad.image && imagePreview) {
        imagePreview.src = ad.image;
        imagePreview.style.display = 'block';
    }
}

async function saveAdItem() {
    var title_ta_el = document.getElementById('ad-title-ta');
    var title_en_el = document.getElementById('ad-title-en');
    var title_si_el = document.getElementById('ad-title-si');
    var link_el = document.getElementById('ad-link');
    var position_el = document.getElementById('ad-position');
    var image_el = document.getElementById('ad-image');
    var active_el = document.getElementById('ad-active');

    var title_ta = title_ta_el ? title_ta_el.value.trim() : '';
    var title_en = title_en_el ? title_en_el.value.trim() : '';
    var title_si = title_si_el ? title_si_el.value.trim() : '';
    var link = link_el ? link_el.value.trim() : '';
    var position = position_el ? position_el.value : 'header';
    var image = image_el ? image_el.value.trim() : 'https://via.placeholder.com/600x200?text=Ad';
    var active = active_el ? active_el.checked : false;

    if (!title_ta || !link) {
        showToast('Please fill Tamil title and link', 'error');
        return;
    }

    var adItem = {
        id: editingAdId || Date.now(),
        title: title_ta,
        title_en: title_en || title_ta,
        title_si: title_si || title_ta,
        link: link,
        image: image,
        position: position,
        active: active
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
    var nameSi = document.getElementById('cat-name-si');

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
    var name_si_el = document.getElementById('cat-name-si');

    var name_ta = name_ta_el ? name_ta_el.value.trim() : '';
    var name_en = name_en_el ? name_en_el.value.trim() : '';
    var name_si = name_si_el ? name_si_el.value.trim() : '';

    if (!name_en) {
        showToast('English category name is required', 'error');
        return;
    }

    var id = name_en.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    var catItem = {
        id: id,
        name: name_ta || name_en,
        name_en: name_en,
        name_si: name_si || name_en,
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
                preview.style.display = 'block';
            }
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
    var passwordInput = document.getElementById('reset-password');
    var enteredPassword = passwordInput ? passwordInput.value.trim() : '';

    if (!enteredPassword) {
        showToast('Please enter admin password to reset data', 'error');
        return;
    }

    if (enteredPassword !== ADMIN_PASSWORD) {
        showToast('Incorrect admin password. Reset cancelled.', 'error');
        if (passwordInput) passwordInput.value = '';
        return;
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
    initData();

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

    if (btnAddAd) btnAddAd.addEventListener('click', function() { openAdModal(); });
    if (closeAdModalBtn) closeAdModalBtn.addEventListener('click', closeAdModal);
    if (cancelAd) cancelAd.addEventListener('click', closeAdModal);
    if (saveAdBtn) saveAdBtn.addEventListener('click', saveAdItem);

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
});