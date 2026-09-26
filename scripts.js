// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA",
    authDomain: "endless-news.firebaseapp.com",
    projectId: "endless-news",
    storageBucket: "endless-news.firebasestorage.app",
    messagingSenderId: "363216005373",
    appId: "1:363216005373:web:143fb950fb04dfc1cb7694"
};

// Initialize Firebase
let db = null;
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        dbg('Firebase connected');
    }
} catch (err) {
    console.error('Firebase init error:', err);
}

// 🔤 BRAND FONT — same "EndLess" look on EVERY device.
// Georgia exists on Windows/Mac but NOT on Android → logo looked different on phones.
// Playfair Display (Google Fonts) = premium Georgia-style serif, loads everywhere.
(function injectBrandFont() {
    if (document.getElementById('brand-font-css')) return;
    var link = document.createElement('link');
    link.id = 'brand-font-css';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap';
    document.head.appendChild(link);
    var st = document.createElement('style');
    st.id = 'brand-font-css';
    st.textContent = [
        '.logo,.logo-end,.logo-less,.logo-icon,.footer-logo,',
        '.logo-title,.logo-accent,.bname,.brand .name,',
        '.share-logo-text,.share-logo-icon,.admin-logo-icon{',
        "font-family:'Playfair Display',Georgia,'Times New Roman',serif!important;}"
    ].join('');
    document.head.appendChild(st);
})();

// 🎨 SHARE MODAL THEME FIX — styles.css-la var(--card-bg) ku variable illa,
// so dark fallback EPPAVUME use aagudhu (light mode-la kooda dark card!).
// Ithu site-oda REAL theme variables-ku override pannum: light → light, dark → dark.
(function injectShareThemeFix() {
    if (document.getElementById('share-theme-fix')) return;
    var st = document.createElement('style');
    st.id = 'share-theme-fix';
    st.textContent = [
        '.share-modal-content{background:var(--surface)!important;border-color:var(--border)!important;}',
        '.share-modal-header h3{color:var(--text)!important;}',
        '.modal-close{color:var(--text-muted)!important;}',
        '.modal-close:hover{background:var(--border)!important;color:var(--text)!important;}',
        '.share-btn{background:var(--bg)!important;border-color:var(--border)!important;color:var(--primary)!important;}',
        '.share-btn span{color:var(--text)!important;}',
        '.share-btn:hover{background:var(--primary-glow)!important;border-color:var(--primary)!important;}',
        '.share-copy-label{color:var(--text-muted)!important;}',
        '.share-copy-box input{background:var(--bg)!important;border-color:var(--border)!important;color:var(--text)!important;}'
    ].join('');
    document.head.appendChild(st);
})();

// 📬 NEWSLETTER — subscribe box → Firestore 'subscribers' + welcome email
async function subscribeNewsletter() {
    var input = document.getElementById('newsletter-email');
    var email = input ? input.value.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(currentLang === 'ta' ? '⚠️ சரியான மின்னஞ்சலை உள்ளிடவும்' : '⚠️ Please enter a valid email');
        return;
    }
    if (!db) { alert('Network error — try again'); return; }
    try {
        var ref = db.collection('subscribers').doc(email);
        var doc = await ref.get();
        if (doc.exists) {
            alert(currentLang === 'ta' ? '✅ நீங்கள் ஏற்கனவே சந்தா சேர்ந்துள்ளீர்கள்!' : '✅ Already subscribed!');
            return;
        }
        await ref.set({ email: email, lang: currentLang, subscribedAt: new Date().toISOString() });
        // 💌 Welcome email (requires Trigger Email extension)
        try {
            await db.collection('mail').doc('w_' + Date.now()).set({
                to: email,
                message: {
                    subject: '🌅 Welcome to EndLess News Daily Briefing!',
                    html: '<div style="font-family:Georgia,serif;background:#0a0a0f;color:#f1f5f9;padding:24px;border-radius:12px">' +
                          '<h2 style="color:#e11d48">End<span style="color:#fff">Less</span> News</h2>' +
                          '<p>You are now subscribed! Your daily Tamil &amp; English news briefing arrives every morning.</p>' +
                          '<a href="https://endlessnews.lk" style="color:#e11d48;font-weight:700">Visit Website →</a></div>'
                }
            });
        } catch (_) {}
        if (input) input.value = '';
        alert(currentLang === 'ta' ? '🎉 சந்தா வெற்றி! நாளை முதல் சுருக்கம் வரும்.' : '🎉 Subscribed! First briefing arrives tomorrow.');
    } catch (e) {
        alert(currentLang === 'ta' ? '⚠️ பிழை — மீண்டும் முயற்சிக்கவும்' : '⚠️ Error — please try again');
    }
}

function wireNewsletterBox() {
    var btn = document.querySelector('.newsletter [data-key="subscribe"]');
    if (!btn || btn._nlWired) return;
    btn._nlWired = true;
    btn.removeAttribute('onclick'); // remove old fake alert
    btn.addEventListener('click', function(e) { e.preventDefault(); subscribeNewsletter(); });
    var input = document.getElementById('newsletter-email');
    if (input) input.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); subscribeNewsletter(); } });
}

// ⚡ PERFORMANCE SUITE — instant first paint, smooth images, zero font flash
(function perfSuite() {
    if (document.getElementById('perf-preloads')) return;
    var frag = document.createDocumentFragment();

    // 1. Preload critical CSS for instant first render (styles.css is render-blocking)
    var css = document.createElement('link');
    css.rel = 'preload'; css.href = 'styles.css?v=perf1'; css.as = 'style'; css.id = 'perf-preloads';
    frag.appendChild(css);

    // 2. Font: display=swap already set; add preconnect for faster Google Fonts
    var p1 = document.createElement('link'); p1.rel = 'preconnect'; p1.href = 'https://fonts.googleapis.com';
    var p2 = document.createElement('link'); p2.rel = 'preconnect'; p2.href = 'https://fonts.gstatic.com'; p2.crossOrigin = '';
    frag.appendChild(p1); frag.appendChild(p2);
    // Playfair (logo font) — preloaded so brand shows instantly, no fallback flash
    var pf = document.createElement('link');
    pf.rel = 'preload'; pf.as = 'font'; pf.type = 'font/woff2'; pf.crossOrigin = '';
    pf.href = 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2';
    frag.appendChild(pf);
    document.head.appendChild(frag);

    // 3. Smooth image rendering + PREMIUM HOVER RESTORED (fade-in + hover lift/zoom)
    var st = document.createElement('style');
    st.textContent = [
        /* Fade-in on load (performance) */
        '.article-card img{opacity:0;transition:opacity .45s ease,transform .6s ease;}',
        '.article-card img.ld{opacity:1;}',
        '.hero-main img,.hero-card img{opacity:0;transition:opacity .5s ease,transform .6s ease;}',
        '.hero-main img.ld,.hero-card img.ld{opacity:1;}',
        /* ✨ PREMIUM HOVER: cursor mela — lift, shadow, scale (styles.css overrides maintained) */
        '.article-card{cursor:pointer;}',
        '.article-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -8px rgba(0,0,0,0.25);}',
        '.article-card:hover img{transform:scale(1.05);}',
        '.hero-card{cursor:pointer;}',
        '.hero-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -8px rgba(0,0,0,0.25);}',
        '.hero-card:hover img{transform:scale(1.05);}',
        '.hero-main{cursor:pointer;}',
        '.hero-main:hover{transform:translateY(-4px);box-shadow:0 20px 40px -8px rgba(0,0,0,0.3);}',
        '.hero-main:hover img{transform:scale(1.08);}',
        /* 🏷️ Hide static HTML ad labels — adCard prints its own translated label */
        '.ad-slot-label{display:none!important;}',
        /* 🔗 RELATED ARTICLES — clean card grid (premium look) */
        '.rel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;}',
        '.rel-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:transform .25s,box-shadow .25s;}',
        '.rel-card:hover{transform:translateY(-3px);box-shadow:0 12px 24px rgba(0,0,0,0.15);}',
        '.rel-card img{width:100%;height:110px;object-fit:cover;display:block;}',
        '.rel-card .rc-b{padding:10px 12px;}',
        '.rel-card .rc-cat{font-size:0.6rem;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.08em;}',
        '.rel-card .rc-t{font-size:0.85rem;font-weight:600;line-height:1.35;margin-top:4px;color:var(--text);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
        '@media(max-width:640px){.rel-grid{grid-template-columns:repeat(3,1fr);gap:0.6rem;}.rel-card img{height:80px;}.rel-card .rc-t{font-size:0.78rem;}.rel-card .rc-b{padding:8px;}}',
        /* 📱 FEED ADS: full-width between article cards; hidden on desktop (sidebar there) */
        '.feed-ad-slot{grid-column:1/-1;margin:0.25rem 0 1rem;}',
        '@media(min-width:1024px){.feed-ad-slot{display:none!important;}}',
        /* 📱 MOBILE: hide sidebar AD slot — sidebar column sits below the feed on
           mobile (looked like "ads at the end"). Mobile sees in-feed ads instead.
           Trending/categories/newsletter in the sidebar still show as normal. */
        '@media(max-width:1023px){#ad-slot-sidebar{display:none!important;}}',
        /* 📰 MOBILE AD FIX: styles.css .modal-article img{height:260px!important;cover}
           catches injected ad images too → ads looked cropped/tiny on phones.
           Exempt ad images: natural size, full width, no forced height. */
        '.modal-article img.inl-ad-img{height:auto!important;min-height:0!important;max-height:none!important;object-fit:fill!important;border-radius:0;}',
        '@media(max-width:640px){.modal-article img.inl-ad-img{height:auto!important;max-height:none!important;}}'
    ].join('');
    document.head.appendChild(st);

    function armImages(scope) {
        (scope || document).querySelectorAll('img').forEach(function(img) {
            if (img.dataset.arm) return; img.dataset.arm = '1';
            function show() { img.classList.add('ld'); }
            // Instant if already loaded
            if (img.complete && img.naturalWidth > 0) { show(); return; }
            // Cross-origin safe: listen on capture phase (bypasses CORS event blocking)
            img.addEventListener('load', show, { once: true, capture: true });
            img.addEventListener('error', show, { once: true, capture: true });
            // ⏱️ SAFETY NET: if image takes >2s (CORS/slow), force show — never invisible!
            setTimeout(function() { show(); }, 2000);
        });
    }
    // Watch for dynamically injected content (feeds, heroes, ads)
    var mo = new MutationObserver(function(muts) {
        muts.forEach(function(m) { m.addedNodes && m.addedNodes.forEach && m.addedNodes.forEach(function(n) {
            if (n.nodeType === 1) armImages(n);
        }); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window._armImages = armImages;
})();

// 🖼️ PREMIUM GALLERY CSS (self-contained — no styles.css change needed)
(function injectGalleryCSS() {
    if (document.getElementById('gal-css')) return;
    var st = document.createElement('style');
    st.id = 'gal-css';
    st.textContent = `
.gallery-wrap{position:relative;}
.gallery-wrap img{width:100%;display:block;}
.gal-arrow{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.35);color:#fff;font-size:22px;line-height:1;cursor:pointer;transition:all 0.2s ease;z-index:5;text-shadow:0 1px 4px rgba(0,0,0,0.4);}
.gal-arrow:hover{background:rgba(255,255,255,0.32);transform:translateY(-50%) scale(1.08);}
.gal-arrow:active{transform:translateY(-50%) scale(0.96);}
.gal-prev{left:12px;}
.gal-next{right:12px;}
.gal-count{position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fff;font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:999px;z-index:5;border:1px solid rgba(255,255,255,0.2);}
.gal-img-fade{animation:galFade 0.3s ease;}
@keyframes galFade{from{opacity:0.3;}to{opacity:1;}}
.vid-wrap{position:relative;width:100%;padding-top:56.25%;margin-top:1rem;border-radius:8px;overflow:hidden;background:#000;}
.vid-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
`;
    document.head.appendChild(st);
})();

// ═══════════════════════════════════════════════════════════════
// 🚨 EMERGENCY ERROR BANNER — any JS crash shows ON THE PAGE itself
// (remote debugging without console). Remove after site is stable.
window.addEventListener('error', function(e) {
    if (document.getElementById('js-err-ban')) return;
    var b = document.createElement('div');
    b.id = 'js-err-ban';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:#fff;padding:10px 14px;font-size:13px;z-index:999999;font-family:monospace;white-space:pre-wrap;';
    b.textContent = '⚠️ JS ERROR: ' + (e.message || 'unknown') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || '?');
    if (document.body) document.body.appendChild(b);
});

const DEBUG = false; // 🔇 production: no debug logs in visitor console
function dbg() { if (DEBUG) console.log.apply(console, arguments); }

/* ═══════════════════════════════════════════════════════
   ENDLESS — MAIN WEBSITE LOGIC
   MOBILE-FIRST OPTIMIZED
   2 LANGUAGE SUPPORT (Tamil/English)
   ═══════════════════════════════════════════════════════ */

const TRANSLATIONS = {
    ta: {
        nav_home: "முகப்பு", nav_world: "உலகம்", nav_tech: "தொழில்நுட்பம்",
        nav_business: "வணிகம்", nav_science: "அறிவியல்", nav_sports: "விளையாட்டு",
        nav_health: "சுகாதாரம்", placeholder_search: "செய்திகளைத் தேடு...",
        latest_news: "சமீபத்திய செய்திகள்", load_more: "மேலும் கட்டுரைகள் ↓",
        trending: "🔥 பிரபலமானவை", categories: "📂 பிரிவுகள்",
        newsletter: "📬 தினசரி சுருக்கம்",
        newsletter_desc: "முக்கியமான செய்திகளை உங்கள் மின்னஞ்சலுக்கு அனுப்புங்கள்.",
        subscribe: "சந்தா சேர்",
        footer_desc: "உலகம் முழுவதும் சுயாதீன பத்திரிகையாளர். தினமும் மில்லியன் கணக்கான வாசகர்களால் நம்பப்படுகிறது.",
        footer_sections: "பிரிவுகள்", footer_company: "நிறுவனம்",
        about_us: "எங்களைப் பற்றி", careers: "வேலைவாய்ப்பு", ethics: "பொருளாதார ஒழுக்கம்",
        contact: "தொடர்பு", advertise: "விளம்பரம்", follow_us: "எங்களை பின்தொடர்",
        rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை", privacy: "தனியுரிமைக் கொள்கை", terms: "விதிமுறைகள்",
        all_stories: "அனைத்து கதைகள்", read_more: "மேலும் படிக்க", by_author: "எழுதியவர்",
        published_on: "வெளியிடப்பட்டது", breaking_news: "உடனடி செய்திகள்",
        ad_label: "விளம்பரம்", search_results: "தேடல் முடிவுகள்",
        no_results: "எந்த செய்தியும் கிடைக்கவில்லை",
        no_articles_yet: "இன்னும் செய்திகள் எதுவும் இல்லை. நிர்வாகி பேனலில் இருந்து கட்டுரைகளைப் பதிவு செய்யுங்கள்.",
        close: "மூடு", loading: "ஏற்றுகிறது...",
        share_article: "பகிர்"
    },
    en: {
        nav_home: "Home", nav_world: "World", nav_tech: "Technology",
        nav_business: "Business", nav_science: "Science", nav_sports: "Sports",
        nav_health: "Health", placeholder_search: "Search news...",
        latest_news: "Latest News", load_more: "Load More Articles ↓",
        trending: "🔥 Trending", categories: "📂 Categories",
        newsletter: "📬 Daily Briefing",
        newsletter_desc: "Get the most important stories delivered to your inbox every morning.",
        subscribe: "Subscribe",
        footer_desc: "Independent journalism from around the world. Trusted by millions of readers daily.",
        footer_sections: "Sections", footer_company: "Company",
        about_us: "About Us", careers: "Careers", ethics: "Code of Ethics",
        contact: "Contact", advertise: "Advertise", follow_us: "Follow Us",
        rights: "All rights reserved", privacy: "Privacy Policy", terms: "Terms of Service",
        all_stories: "All Stories", read_more: "Read More", by_author: "By",
        published_on: "Published on", breaking_news: "Breaking News",
        ad_label: "Advertisement", search_results: "Search Results",
        no_results: "No articles found",
        no_articles_yet: "No articles yet. Please publish from the admin panel.",
        close: "Close", loading: "Loading...",
        share_article: "Share"
    },
};

// 🌍 DEFAULT LANGUAGE: TAMIL for every new visitor worldwide.
// English only when the USER explicitly toggles (saved in their device).
// 🛡️ Bulletproof storage — blocked/corrupt localStorage must NEVER crash the script
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

var _savedLang = lsGet('gd_language');
let currentLang = (_savedLang === 'ta' || _savedLang === 'en') ? _savedLang : 'ta';
lsSet('gd_language', currentLang);
let isMobile = window.innerWidth < 640;
let touchStartY = 0;
let isDataLoaded = false;

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const DEFAULT_NEWS = [];

// 🔥 NO hardcoded ads — Firebase/admin panel is the ONLY source of truth.
const DEFAULT_ADS = [];

const DEFAULT_CATEGORIES = [
    { id: "world", name: "உலகம்", name_en: "World", count: 0 },
    { id: "technology", name: "தொழில்நுட்பம்", name_en: "Technology", count: 0 },
    { id: "business", name: "வணிகம்", name_en: "Business", count: 0 },
    { id: "science", name: "அறிவியல்", name_en: "Science", count: 0 },
    { id: "sports", name: "விளையாட்டு", name_en: "Sports", count: 0 },
    { id: "health", name: "சுகாதாரம்", name_en: "Health", count: 0 }
];

function isGarbagePost(n) {
    if (!n || typeof n !== 'object') {
        dbg('isGarbagePost: not an object');
        return true;
    }
    var t = String(n.title || '').trim();
    var t_en = String(n.title_en || '').trim();
    var isBad = function(s) {
        if (!s) return true;
        var x = String(s).trim().toLowerCase();
        return x === '' || x === 'untitled' || x === 'undefined' || x === 'null' ||
               x === 'nan' || x === '[object object]';
    };
    var hasTitle = !isBad(t) || !isBad(t_en);
    var idStr = String(n.id || '').trim();
    var hasId = idStr !== '' && idStr !== 'undefined' && idStr !== 'null' && idStr !== '0';
    
    // (debug logs removed — logic intact)
    return !hasTitle || !hasId;
}

function getNewsFromStorage() {
    var data = localStorage.getItem('endless_news');
    if (data) {
        try {
            var parsed = JSON.parse(data);
            dbg('Loaded', parsed.length, 'articles from localStorage');
            return parsed;
        } catch(e) {
            console.warn('Failed to parse news from localStorage');
        }
    }
    return null;
}

var newsData = [];
window.newsData = newsData;
// 🛡️ Safe parse — corrupted localStorage (quota damage) must NEVER crash the script
function safeJSON(key, fallback) {
    try {
        var raw = lsGet(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        try { localStorage.removeItem(key); } catch (_) {} // self-heal: drop corrupt data
        return fallback;
    }
}
let adsData = safeJSON('endless_ads', DEFAULT_ADS);
let categoriesData = safeJSON('endless_categories', DEFAULT_CATEGORIES);
let currentFilter = 'All';
let searchQuery = '';
let displayedCount = 4;

async function syncFromFirebase() {
    // 🔥 FIREBASE IS THE ONLY SOURCE OF TRUTH
    newsData = [];

    if (!db) {
        dbg('⚠️ No Firebase connection');
        return;
    }

    try {
        dbg('☁️ Fetching articles from Firebase...');
        // 🔒 Server-side filter: published-only preferred (drafts stay in Firebase).
        // FALLBACK: if that query errors, fetch all and filter client-side
        // (missing status = legacy article → treated as published; explicit 'draft' → hidden).
        let newsSnapshot;
        try {
            newsSnapshot = await db.collection('news').where('status', '==', 'published').get({ source: 'server' });
        } catch (qErr) {
            console.warn('Published-only query failed, using fallback fetch:', qErr && qErr.message);
            newsSnapshot = await db.collection('news').get({ source: 'server' });
        }
        let firebaseNews = [];
        let rejectedCount = 0;

        dbg('📄 Firestore docs found:', newsSnapshot.size);

        if (!newsSnapshot.empty) {
            newsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const originalId = data.id;
                data.id = doc.id;
                
                if (isGarbagePost(data)) {
                    rejectedCount++;
                } else {
                    firebaseNews.push(data);
                }
            });
        }

        newsData = firebaseNews;
        // 🔥 Sort newest first — Firebase order unpredictable, date ensures latest on top
        newsData.sort(function(a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });
        dbg('✅ Final newsData:', newsData.length, 'articles (rejected:', rejectedCount, ')');
        
        // 💾 Cache is OPTIONAL — a full localStorage (base64 photos!) must NEVER
        // wipe the articles we just fetched. Isolated try/catch.
        try {
            if (newsData.length > 0) localStorage.setItem('endless_news', JSON.stringify(newsData));
        } catch (cacheErr) {
            console.warn('localStorage cache skipped (quota):', cacheErr && cacheErr.message);
        }

        // 🔥 ADS: Firebase is the ONLY source — overwrites stale localStorage test ads
        try {
            const adsSnap = await db.collection('ads').get({ source: 'server' });
            if (!adsSnap.empty) {
                adsData = adsSnap.docs.map(function(doc) {
                    var a = doc.data(); a.id = doc.id; return a;
                });
                localStorage.setItem('endless_ads', JSON.stringify(adsData));
                dbg('✅ Ads synced from Firebase:', adsData.length);
            } else {
                adsData = [];   // Firebase empty → show NOTHING
                localStorage.setItem('endless_ads', '[]');
            }
        } catch (adErr) {
            dbg('Ads sync failed:', adErr);
        }

    } catch (error) {
        console.error('❌ Firebase read error:', error);
        newsData = [];
    }
}

// ⏱️ Hard timeout: a hanging network request must NEVER freeze the site
function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function(_, rej) {
        setTimeout(function() { rej(new Error('TIMEOUT after ' + ms + 'ms')); }, ms);
    })]);
}

async function loadAllNewsData() {
    isDataLoaded = false;
    
    // Show loading state
    showLoading();
    
    // Fetch from Firebase (source of truth)
    await syncFromFirebase();
    
    isDataLoaded = true;
    
    // Hide loading
    hideLoading();
    
    // 🔥 RENDER IMMEDIATELY after Firebase fetch
    renderHero();
    renderFeed();
    renderTrending();
    renderCategories();
    renderAds();
    renderTicker();
}

function getLocalized(item, field) {
    const suffix = currentLang === 'ta' ? '' : `_${currentLang}`;
    return item[`${field}${suffix}`] || item[field];
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(currentLang === 'ta' ? 'ta-IN' : 'en-US', { month: 'short', day: 'numeric' });
}

function getCategoryName(catId) {
    const cat = categoriesData.find(c => c.id === catId || c.name === catId || c.name_en === catId);
    if (!cat) return catId;
    return currentLang === 'ta' ? cat.name : cat.name_en;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function findArticleById(id) {
    const searchId = String(id);
    return newsData.find(n => String(n.id) === searchId);
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 📅 Language-aware date — ta → தமிழ் date, en → English date
function renderDate() {
    const dateEl = document.getElementById('current-date');
    if (!dateEl) return;
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString(
        currentLang === 'ta' ? 'ta-IN' : 'en-US', dateOptions
    );
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('gd_language', lang);
    // Ticker text length changes per language — re-measure speed after render
    setTimeout(initTicker, 100);
    renderDate(); // 📅 date-um language-ku eatha maariyum

    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
                el.placeholder = TRANSLATIONS[lang][key];
            } else {
                // 🔗 Preserve footer links — update text INSIDE the <a>, never erase it
                var link = el.querySelector('a');
                if (link) {
                    link.textContent = TRANSLATIONS[lang][key];
                } else {
                    el.textContent = TRANSLATIONS[lang][key];
                }
            }
        }
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    renderHero();
    renderFeed();
    renderTrending();
    renderCategories();
    renderAds();
    renderTicker();
}

function showLoading() {
    const grid = document.getElementById('news-grid');
    const hero = document.getElementById('hero-section');
    const trending = document.getElementById('trending-list');
    const ticker = document.getElementById('ticker-content');

    // Hero skeleton
    const heroSkeleton = `
        <div class="hero-grid">
            <div class="skeleton skeleton-hero-main"></div>
            <div class="skeleton-hero-side">
                <div class="skeleton skeleton-hero-card"></div>
                <div class="skeleton skeleton-hero-card"></div>
            </div>
        </div>
    `;

    // Article card skeleton (repeat 4 times)
    const articleSkeleton = `
        <div class="skeleton-article">
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton-text">
                <div class="skeleton skeleton-line short"></div>
                <div class="skeleton skeleton-line title"></div>
                <div class="skeleton skeleton-line" style="width:80%"></div>
            </div>
        </div>
    `;

    // Trending skeleton (3 items)
    const trendingSkeleton = `
        <div class="skeleton skeleton-trending"></div>
        <div class="skeleton skeleton-trending"></div>
        <div class="skeleton skeleton-trending"></div>
    `;

    if (hero) hero.innerHTML = heroSkeleton;
    if (grid) grid.innerHTML = articleSkeleton.repeat(4);
    if (trending) trending.innerHTML = trendingSkeleton;
    if (ticker) ticker.innerHTML = `<span class="ticker-item">Loading latest news...</span>`;
}

function hideLoading() {
    const grid = document.getElementById('news-grid');
    const hero = document.getElementById('hero-section');
    const trending = document.getElementById('trending-list');
    const ticker = document.getElementById('ticker-content');
    
    // Clear skeletons OR spinners
    if (grid && (grid.querySelector('.skeleton') || grid.innerHTML.includes('animation:spin'))) {
        grid.innerHTML = '';
    }
    if (hero && (hero.querySelector('.skeleton') || hero.innerHTML.includes('animation:spin'))) {
        hero.innerHTML = '';
    }
    if (trending && trending.querySelector('.skeleton')) trending.innerHTML = '';
    if (ticker && ticker.innerHTML.includes('Loading')) ticker.innerHTML = '';
}

function renderHero() {
    const featured = newsData.filter(n => n.featured && (n.status !== 'draft') && !isGarbagePost(n)).slice(0, 3);
    const heroSection = document.getElementById('hero-section');
    if (!heroSection) return;

    if (featured.length === 0) {
        heroSection.innerHTML = '';
        return;
    }

    const main = featured[0];
    const side = featured.slice(1, 3);

    heroSection.innerHTML = `
        <div class="hero-main" onclick="openArticle('${main.id}')">
            <img src="${escapeHtml(main.image)}" alt="${escapeHtml(getLocalized(main, 'title'))}" loading="eager">
            <div class="overlay"></div>
            <div class="hero-content">
                <span class="category">${escapeHtml(getLocalized(main, 'category'))}</span>
                <h2>${escapeHtml(getLocalized(main, 'title'))}</h2>
                <p>${escapeHtml(getLocalized(main, 'excerpt'))}</p>
            </div>
        </div>
        <div class="hero-side">
            ${side.map(item => `
                <div class="hero-card" onclick="openArticle('${item.id}')">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(getLocalized(item, 'title'))}" loading="lazy">
                    <div class="card-body">
                        <div class="category">${escapeHtml(getLocalized(item, 'category'))}</div>
                        <h3>${escapeHtml(getLocalized(item, 'title'))}</h3>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderFeed() {
    let filtered = newsData.filter(n => (n.status !== 'draft') && !isGarbagePost(n));

    if (currentFilter !== 'All') {
        const catNames = categoriesData.filter(c =>
            c.name_en === currentFilter || c.name === currentFilter
        ).map(c => [c.name, c.name_en]).flat();
        filtered = filtered.filter(n => catNames.includes(n.category) || catNames.includes(n.category_en));
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(n =>
            (n.title && n.title.toLowerCase().includes(q)) ||
            (n.title_en && n.title_en.toLowerCase().includes(q)) ||
            
            (n.excerpt && n.excerpt.toLowerCase().includes(q)) ||
            (n.excerpt_en && n.excerpt_en.toLowerCase().includes(q))
            
        );
    }

    const toShow = filtered.slice(0, displayedCount);
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    if (toShow.length === 0) {
        if (!isDataLoaded) {
            return;
        }
        grid.innerHTML = `
            <div style="text-align:center; padding:3rem; grid-column:1/-1;">
                <p style="font-size:1.1rem; color:var(--text-muted); margin-bottom:0.5rem;">📭</p>
                <p style="color:var(--text-muted); font-size:0.95rem;">${TRANSLATIONS[currentLang].no_articles_yet}</p>
            </div>
        `;
        const loadMoreWrap = document.getElementById('load-more-wrap');
        if (loadMoreWrap) loadMoreWrap.style.display = 'none';
        return;
    }

    grid.innerHTML = toShow.map(item => `
        <article class="article-card" onclick="openArticle('${item.id}')" data-article-id="${item.id}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(getLocalized(item, 'title'))}" loading="lazy">
            <div class="card-body">
                <div class="meta">
                    <span class="cat">${escapeHtml(getLocalized(item, 'category'))}</span>
                    <span>${formatDate(item.date)}</span>
                </div>
                <h3>${escapeHtml(getLocalized(item, 'title'))}</h3>
                <p>${escapeHtml(getLocalized(item, 'excerpt'))}</p>
                <button onclick="event.stopPropagation(); shareArticle('${item.id}')" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.4rem 0.875rem;background:linear-gradient(135deg, var(--primary, #e11d48), var(--primary-hover, #be123c));color:#fff;border:none;border-radius:999px;font-size:0.75rem;font-weight:700;cursor:pointer;margin-top:0.5rem;font-family:inherit;box-shadow:0 3px 12px rgba(225,29,72,0.25);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    ${TRANSLATIONS[currentLang].share_article || 'Share'}
                </button>
            </div>
        </article>
    `).join('');

    // 📱 MOBILE FEED ADS — same sidebar ads, placed between article cards
    // (desktop shows them in the right rail; hidden ≥1024px via CSS).
    (function mobileFeedAds() {
        var now = new Date();
        var ads = (typeof adsData !== 'undefined' ? adsData : []).filter(function(a) {
            if (!a || !a.active) return false;
            if (a.startDate && new Date(a.startDate) > now) return false;
            if (a.endDate && new Date(a.endDate) < now) return false;
            return a.position === 'sidebar';
        }).slice(0, 4); // max 4 in feed — each ad once
        if (!ads.length) return;
        var cards = Array.prototype.slice.call(grid.children);
        // Insert ad BEFORE the NEXT card (never after the LAST → in CSS Grid a
        // sibling after the final item renders as a NEW ROW = "ad at scroll end" trap!)
        var maxInsert = Math.min(cards.length - 1, ads.length);
        for (var i = 0; i < maxInsert; i++) {
            var ad = document.createElement('div');
            ad.className = 'feed-ad-slot';
            ad.innerHTML =
                '<div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--text-subtle);margin-bottom:0.5rem;font-weight:700;">' + (TRANSLATIONS[currentLang] ? TRANSLATIONS[currentLang].ad_label : 'Advertisement') + '</div>' +
                '<a href="' + escapeHtml(ads[i].link) + '" target="_blank" rel="noopener noreferrer" style="display:block;border-radius:12px;overflow:hidden;box-shadow:0 3px 14px rgba(0,0,0,0.10);line-height:0;">' +
                '<img src="' + escapeHtml(pickAdImg(ads[i])) + '" alt="' + escapeHtml(getLocalized(ads[i], 'title')) + '" loading="lazy" style="width:100%;height:auto;display:block;">' +
                '</a>';
            cards[i + 1].before(ad); // ← BEFORE next card, NEVER after last
        }
    })();

    const loadMoreWrap = document.getElementById('load-more-wrap');
    if (loadMoreWrap) loadMoreWrap.style.display = filtered.length > displayedCount ? 'block' : 'none';
}

function renderTrending() {
    const trending = newsData.filter(n => n.trending && (n.status !== 'draft') && !isGarbagePost(n)).slice(0, 5);
    const list = document.getElementById('trending-list');
    if (!list) return;

    if (trending.length === 0 && isDataLoaded) {
        list.innerHTML = `<div style="text-align:center; padding:1rem; color:var(--text-muted); font-size:0.85rem;">${TRANSLATIONS[currentLang].no_articles_yet}</div>`;
        return;
    }

    list.innerHTML = trending.map((item, i) => `
        <div class="trending-item" onclick="openArticle('${item.id}')">
            <span class="trending-num">${i + 1}</span>
            <div class="trending-info">
                <h4>${escapeHtml(getLocalized(item, 'title'))}</h4>
                <span>${escapeHtml(getLocalized(item, 'category'))} · ${formatDate(item.date)}</span>
            </div>
        </div>
    `).join('');
}

function renderCategories() {
    const list = document.getElementById('category-list');
    if (!list) return;

    list.innerHTML = categoriesData.map(cat => `
        <li onclick="filterCategory('${escapeHtml(cat.name_en)}')">
            <span>${currentLang === 'ta' ? escapeHtml(cat.name) : escapeHtml(cat.name_en)}</span>
            <span class="count">${cat.count}</span>
        </li>
    `).join('');
}

function renderAds() {
    // 🔥 Only ads that are (a) active AND (b) inside their start/end date window
    var now = new Date();
    const activeAds = adsData.filter(function(a) {
        if (!a || !a.active) return false;
        if (a.startDate && new Date(a.startDate) > now) return false;
        if (a.endDate && new Date(a.endDate) < now) return false;
        return true;
    });

    // 🧹 Strip the old dashed-box/min-height chrome from a slot → ads look standalone
    function neutralizeSlot(el) {
        if (!el) return;
        el.style.border = 'none';
        el.style.background = 'transparent';
        el.style.minHeight = '0';
        el.style.maxHeight = 'none';      // .ad-slot-header CSS caps 120px → squeezes tall images
        el.style.boxShadow = 'none';
        el.style.padding = '0';
        // 🧱 CRITICAL: .ad-slot CSS has display:flex → children lay out in a ROW
        // (2 sidebar ads sat side-by-side + shrank). Force BLOCK → vertical stack,
        // each ad at natural full width.
        el.style.display = 'block';
    }

    // 💎 ONE premium card style for EVERY slot (header/sidebar/inline/article view)
    function adCard(a, wide) {
        return `
        <div style="margin-bottom:1.5rem;">
            <div class="ad-label" style="margin-bottom:0.5rem;">${TRANSLATIONS[currentLang].ad_label}</div>
            <a href="${escapeHtml(a.link)}" target="_blank" rel="noopener noreferrer" style="display:block;border-radius:12px;overflow:hidden;box-shadow:0 3px 14px rgba(0,0,0,0.10);line-height:0;">
                <img src="${escapeHtml(pickAdImg(a))}" alt="${escapeHtml(getLocalized(a, 'title'))}" loading="lazy" style="width:100%;height:auto;display:block;">
            </a>
        </div>`;
    }

    // Header — wide natural banner (desktop wide, mobile same)
    const headerAd = activeAds.find(a => a.position === 'header');
    const headerContainer = document.getElementById('header-ad-container');
    const headerSlot = document.getElementById('ad-slot-header');
    if (headerContainer) headerContainer.style.display = headerAd ? '' : 'none';
    if (headerSlot) {
        neutralizeSlot(headerSlot);
        headerSlot.innerHTML = headerAd ? adCard(headerAd, true) : '';
    }

    // Sidebar — EACH AD its own card, clean stack, no merge
    const sidebarAds = activeAds.filter(a => a.position === 'sidebar');
    const sidebarSlot = document.getElementById('ad-slot-sidebar');
    if (sidebarSlot) {
        neutralizeSlot(sidebarSlot);
        sidebarSlot.innerHTML = sidebarAds.length ? sidebarAds.map(adCard).join('') : '';
        sidebarSlot.style.display = sidebarAds.length ? 'block' : 'none'; // block, not '' (CSS flex!)
        sidebarSlot.style.marginBottom = '0';
    }

    // Inline
    const inlineAd = activeAds.find(a => a.position === 'inline');
    const inlineSlot = document.getElementById('ad-slot-inline');
    if (inlineSlot) {
        neutralizeSlot(inlineSlot);
        inlineSlot.innerHTML = inlineAd ? adCard(inlineAd) : '';
        inlineSlot.style.display = inlineAd ? 'block' : 'none';
    }

    // 🎯 Article View — same premium card, no box chrome
    const modalAd = activeAds.find(a => a.position === 'modal');
    const modalSlot = document.getElementById('ad-slot-modal');
    if (modalSlot) {
        neutralizeSlot(modalSlot);
        if (modalAd) {
            modalSlot.innerHTML = adCard(modalAd);
            modalSlot.style.display = 'block';
        } else {
            modalSlot.innerHTML = '';
            modalSlot.style.display = 'none';
        }
    }
}

// ── AdSense placeholders removed: admin panel / Firebase is the ONLY ad source ──
// ── AdSense placeholders removed: admin panel / Firebase is the ONLY ad source ──
// ── Initialize AdSense Slots (called after AdSense approve) ──
function initAdSenseSlots() {
    // Replace placeholder divs with actual AdSense code
    // Call this after Google AdSense approval + code paste
    const slots = ['ad-slot-header', 'ad-slot-sidebar', 'ad-slot-inline', 'ad-slot-modal'];
    slots.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.querySelector('.ad-slot-placeholder')) {
            // Slot is empty (no direct ad) → ready for AdSense
            el.classList.add('adsense-ready');
        }
    });
}

function renderTicker() {
    const breaking = newsData.filter(n => (n.status !== 'draft') && !isGarbagePost(n)).slice(0, 8);
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;

    if (breaking.length === 0 && isDataLoaded) {
        ticker.innerHTML = `<span class="ticker-item">${TRANSLATIONS[currentLang].no_articles_yet}</span>`;
        return;
    }

    ticker.innerHTML = breaking.map(n => `
        <span class="ticker-item">${escapeHtml(getLocalized(n, 'title'))}</span>
    `).join('');
}

// 📱 MOBILE/DESKTOP image picker — GLOBAL (used by renderAds, feed ads, in-article ads)
function pickAdImg(a) {
    return (window.innerWidth < 768 && a.mobileImage) ? a.mobileImage : a.image;
}

// 📊 REAL ANALYTICS — lightweight REST write (Firestore REST API, no SDK auth needed)
// Tracks: page views, article views, shares. Counters stored in analytics collection.
function analyticsTrack(type, articleId) {
    try {
        var today = new Date().toISOString().slice(0, 10);
        var isMobile = window.innerWidth < 768;
        var payload = {
            writes: [{
                transform: {
                    document: 'projects/endless-news/databases/(default)/documents/analytics/totals',
                    fieldTransforms: [
                        { fieldPath: 'views', increment: { integerValue: type === 'view' ? 1 : 0 } },
                        { fieldPath: 'shares', increment: { integerValue: type === 'share' ? 1 : 0 } },
                        { fieldPath: isMobile ? 'mobile' : 'desktop', increment: { integerValue: 1 } }
                    ]
                }
            }]
        };
        if (articleId) {
            payload.writes.push({
                transform: {
                    document: 'projects/endless-news/databases/(default)/documents/analytics/articles/' + encodeURIComponent(String(articleId)),
                    fieldTransforms: [
                        { fieldPath: 'views', increment: { integerValue: 1 } },
                        { fieldPath: 'lastViewed', setToServerValue: 'REQUEST_TIME' }
                    ]
                }
            });
        }
        payload.writes.push({
            transform: {
                document: 'projects/endless-news/databases/(default)/documents/analytics/daily_' + today,
                fieldTransforms: [
                    { fieldPath: 'views', increment: { integerValue: type === 'view' ? 1 : 0 } },
                    { fieldPath: 'shares', increment: { integerValue: type === 'share' ? 1 : 0 } },
                    { fieldPath: 'date', setToServerValue: 'REQUEST_TIME' }
                ]
            }
        });
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://firestore.googleapis.com/v1/projects/endless-news/databases/(default)/documents:commit?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload)); // fire-and-forget
    } catch (e) { /* silent */ }
}

// 📰 IN-ARTICLE ADS — inject active ads between paragraphs (sidebar ads reused)
function getInArticleAds() {
    var now = new Date();
    var all = (typeof adsData !== 'undefined' ? adsData : []).filter(function(a) {
        if (!a || !a.active) return false;
        if (a.inArticle !== true) return false; // 🎯 PER-AD tick — Ad Manager-la enable pannina ads mattum
        if (a.startDate && new Date(a.startDate) > now) return false;
        if (a.endDate && new Date(a.endDate) < now) return false;
        return true;
    });
    // 📋 Order: Header first → Sidebar ads → Inline last
    var header = all.filter(function(a) { return a.position === 'header'; });
    var side = all.filter(function(a) { return a.position === 'sidebar'; });
    var inl = all.filter(function(a) { return a.position === 'inline'; });
    var ordered = header.concat(side, inl);
    // Dedupe by id
    var seen = {}, out = [];
    ordered.forEach(function(a) {
        var k = String(a.id || a.image);
        if (!seen[k]) { seen[k] = 1; out.push(a); }
    });
    return out;
}

function inArticleAdHtml(ad) {
    // 📐 Natural sizing: banner = wide-thin, square = square — NO letterbox,
    // NO max-height crop. Fits perfectly on mobile + desktop.
    // 🚫 No title text in the reading area — clean image-only sponsored box.
    return '<div style="margin:1.75rem 0;">' +
        '<div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.15em;color:var(--text-subtle);margin-bottom:0.5rem;font-weight:700;">Sponsored · ' + (TRANSLATIONS[currentLang] ? TRANSLATIONS[currentLang].ad_label : 'Advertisement') + '</div>' +
        '<a href="' + escapeHtml(ad.link) + '" target="_blank" rel="noopener noreferrer" style="display:block;border-radius:12px;overflow:hidden;box-shadow:0 3px 14px rgba(0,0,0,0.10);line-height:0;">' +
        '<img class="inl-ad-img" src="' + escapeHtml(pickAdImg(ad)) + '" alt="' + escapeHtml(getLocalized(ad, 'title')) + '" loading="lazy" style="width:100%;height:auto;display:block;">' +
        '</a></div>';
}

function injectInArticleAds(html) {
    var ads = getInArticleAds();
    if (!ads.length) return html;
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var blocks = Array.prototype.slice.call(wrap.children);
    var n = blocks.length;
    if (n < 2) return html; // too short — no ads

    // 🧠 SMART SPACING: each ad appears EXACTLY ONCE — never repeated.
    var insertAt = {}; // blockIndex -> ad object
    var ai = 0;
    if (ads.length >= n) {
        // 📊 Many ads: EVERY paragraph gap gets one (1:1, each ad once)
        for (var i = 0; i < n; i++) insertAt[i] = ads[ai++];
    } else {
        // 📉 Fewer ads: spread EVENLY across the article (2nd/3rd gap spacing).
        // Premium rule: first ad never right after paragraph 1 — reader engages first.
        var prev = 0;
        for (var j = 0; j < ads.length; j++) {
            var pos = Math.round((j + 1) * (n - 1) / (ads.length + 1));
            if (pos < 1) pos = 1;                 // min: after paragraph 2
            if (pos <= prev) pos = prev + 1;      // never two ads adjacent
            if (pos > n - 1) break;               // no room left → goes to END
            insertAt[pos] = ads[j];
            ai++;
            prev = pos;
        }
    }

    var out = [];
    blocks.forEach(function(b, i) {
        out.push(b.outerHTML);
        if (insertAt[i]) out.push(inArticleAdHtml(insertAt[i]));
    });
    // Paragraphs mudinja → michama ads ellam article END-la (each shown once)
    while (ai < ads.length) {
        out.push(inArticleAdHtml(ads[ai]));
        ai++;
    }
    return out.join('');
}

// 🎬 VIDEO — detect link type & render proper player
function getVideoInfo(url) {
    if (!url) return null;
    var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) return { type: 'youtube', id: m[1] };
    m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return { type: 'vimeo', id: m[1] };
    if (/facebook\.com|fb\.watch/.test(url)) return { type: 'fb' };
    if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)) return { type: 'direct' };
    return { type: 'link' };
}

function videoBlockHtml(article) {
    var vl = article.videoLink;
    var poster = escapeHtml(article.image || '');
    if (vl) {
        var info = getVideoInfo(vl);
        if (info && info.type === 'youtube') {
            return `<div class="vid-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${info.id}" title="Video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        }
        if (info && info.type === 'vimeo') {
            return `<div class="vid-wrap"><iframe src="https://player.vimeo.com/video/${info.id}" title="Video" loading="lazy" allowfullscreen></iframe></div>`;
        }
        if (info && info.type === 'fb') {
            return `<div class="vid-wrap"><iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(vl)}&show_text=false" title="Video" loading="lazy" allowfullscreen style="border:none;overflow:hidden"></iframe></div>`;
        }
        if (info && info.type === 'direct') {
            return `<video controls playsinline poster="${poster}" style="width:100%;margin-top:1rem;border-radius:8px;" preload="metadata"><source src="${escapeHtml(vl)}"></video>`;
        }
        return `<p style="margin-top:1rem;"><a href="${escapeHtml(vl)}" target="_blank" rel="noopener" style="color:#e11d48;font-weight:700;">▶️ Watch video</a></p>`;
    }
    if (article.video) {
        return `<video controls playsinline poster="${poster}" style="width:100%;margin-top:1rem;border-radius:8px;" preload="none"><source src="${escapeHtml(article.video)}"></video>`;
    }
    return '';
}

// 📱 BACK-BUTTON LAYER SYSTEM (whole website) — BACK always closes the
// topmost layer (article modal / share card / mobile menu) instead of
// exiting the site. Instagram/YouTube app pattern. ✕ button-um same-a work aagum.
let _layerStack = [];
let _closingById = null;

function pushLayer(id, closeFn) {
    try { history.pushState({ el: id }, ''); } catch (e) {}
    _layerStack.push({ id: id, fn: closeFn });
}

// ⏱️ READING TIME — word count / 200 ≈ minutes
function readingTime(text) {
    var words = String(text || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
}

// 🔖 SAVE FOR LATER — localStorage bookmarks
const SAVED_KEY = 'endless_saved_articles';
function getSavedArticles() {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch (e) { return []; }
}
function isArticleSaved(id) { return getSavedArticles().indexOf(String(id)) !== -1; }
function toggleSaveArticle(id) {
    var list = getSavedArticles();
    var i = list.indexOf(String(id));
    if (i > -1) { list.splice(i, 1); } else { list.push(String(id)); }
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch (e) {}
    var btn = document.getElementById('save-btn-' + id);
    if (btn) btn.innerHTML = '🔖 ' + (i > -1 ? (currentLang === 'ta' ? 'சேமி' : 'Save') : (currentLang === 'ta' ? 'சேமித்தது' : 'Saved'));
    var msg = i > -1 ? (currentLang === 'ta' ? 'அகற்றப்பட்டது' : 'Removed') : (currentLang === 'ta' ? '✅ சேமிக்கப்பட்டது!' : '✅ Saved!');
    // Toast fallback — main site-la showToast illa (dashboard only), so inline toast
    if (typeof showToast === 'function') { showToast(msg, 'success'); }
    else {
        var t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#059669;color:#fff;padding:10px 22px;border-radius:999px;font-weight:700;z-index:999999;font-size:0.9rem;box-shadow:0 8px 24px rgba(0,0,0,0.3);';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function() { t.remove(); }, 1800);
    }
}

// 🔠 FONT SIZE CONTROL — article content zoom (A- / A / A+)
let _articleFontScale = 1;
function adjustFontSize(delta) {
    if (delta === 0) { _articleFontScale = 1; }
    else { _articleFontScale = Math.min(1.5, Math.max(0.8, _articleFontScale + delta * 0.15)); }
    var el = document.querySelector('.modal-article .article-text');
    if (el) el.style.fontSize = (1.05 * _articleFontScale).toFixed(2) + 'rem';
}

// 🔗 RELATED ARTICLES — same category, exclude current, top 3
function getRelatedArticles(article, limit) {
    limit = limit || 3;
    var cat = article.category_en || article.category;
    var pool = newsData.filter(function(n) {
        return String(n.id) !== String(article.id)
            && n.status !== 'draft'
            && (n.category_en === cat || n.category === cat);
    });
    return pool.slice(0, limit);
}
function relatedArticleHtml(a) {
    return '<div class="rel-card" onclick="openArticle(\'' + a.id + '\')">' +
        '<img src="' + escapeHtml(a.image) + '" alt="' + escapeHtml(getLocalized(a, 'title')) + '" loading="lazy">' +
        '<div class="rc-b"><div class="rc-cat">' + escapeHtml(getLocalized(a, 'category')) + '</div>' +
        '<div class="rc-t">' + escapeHtml(getLocalized(a, 'title')) + '</div></div></div>';
}

// BACK button pressed → browser pops history → close the topmost layer
window.addEventListener('popstate', function() {
    var layer = _layerStack.pop();
    if (layer) {
        _closingById = layer.id;
        try { layer.fn(); } catch (e) {}
        _closingById = null;
    }
});

// Called when a layer closes via ✕ / programmatically — sync stack + history
function layerClosed(id) {
    for (var i = _layerStack.length - 1; i >= 0; i--) {
        if (_layerStack[i].id === id) {
            _layerStack.splice(i, 1);
            if (_closingById !== id) {
                try { history.back(); } catch (e) {} // consume pushed entry
            }
            break;
        }
    }
}

// 🖼️ Gallery navigation (glassy arrows + swipe)
function galNav(dir) {
    var g = window._gal;
    if (!g || !g.imgs || g.imgs.length < 2) return;
    g.idx = (g.idx + dir + g.imgs.length) % g.imgs.length;
    var img = document.getElementById('gal-main-img');
    if (img) {
        img.src = g.imgs[g.idx];
        img.classList.remove('gal-img-fade');
        void img.offsetWidth;
        img.classList.add('gal-img-fade');
    }
    var c = document.getElementById('gal-count');
    if (c) c.textContent = (g.idx + 1) + '/' + g.imgs.length;
}

function openArticle(id) {
    const article = findArticleById(id);
    if (!article || isGarbagePost(article)) return;

    const modal = document.getElementById('article-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    let processedContent = getLocalized(article, 'content') || '';

    if (!processedContent.includes('<p>') && processedContent.includes('<br')) {
        const parts = processedContent.split(/<br\s*\/?>\s*<br\s*\/?>/);
        processedContent = parts.map(part => {
            const cleanPart = part.replace(/<br\s*\/?>/g, ' ').trim();
            return cleanPart ? `<p>${cleanPart}</p>` : '';
        }).join('');
    }

    if (!processedContent.includes('<') || !processedContent.includes('>')) {
        const paragraphs = processedContent.split(/\n\n|\n/).filter(p => p.trim());
        processedContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    }

    // 📰 Inject in-article ads between paragraphs (before rendering)
    processedContent = injectInArticleAds(processedContent);

    body.innerHTML = `
        <div class="modal-article">
            <div class="gallery-wrap" id="gallery-wrap">
                <img id="gal-main-img" src="${escapeHtml(article.image)}" alt="${escapeHtml(getLocalized(article, 'title'))}" loading="eager">
                ${(() => {
                    const g = [article.image].concat(Array.isArray(article.images) ? article.images.filter(u => u && u !== article.image) : []);
                    window._gal = { imgs: g, idx: 0 };
                    return g.length > 1 ? `
                <button class="gal-arrow gal-prev" onclick="galNav(-1)" aria-label="Previous">‹</button>
                <button class="gal-arrow gal-next" onclick="galNav(1)" aria-label="Next">›</button>
                <span class="gal-count" id="gal-count">1/${g.length}</span>` : '';
                })()}
            </div>
            <div class="modal-body">
                <span class="category">${escapeHtml(getLocalized(article, 'category'))}</span>
                <h1>${escapeHtml(getLocalized(article, 'title'))}</h1>
                <div class="meta-bar">
                    <span>👤 ${escapeHtml(getLocalized(article, 'author'))}</span>
                    <span>📅 ${new Date(article.date).toLocaleDateString()}</span>
                    <span>🏷️ ${escapeHtml(getLocalized(article, 'category'))}</span>
                    <span>⏱️ ${readingTime(processedContent)} ${currentLang === 'ta' ? 'நிமிடம்' : 'min read'}</span>
                    <button onclick="toggleSaveArticle('${article.id}')" id="save-btn-${article.id}" style="background:none;border:1px solid var(--border);border-radius:999px;padding:3px 12px;cursor:pointer;font-size:0.8rem;color:var(--text-muted);white-space:nowrap;">🔖 ${isArticleSaved(article.id) ? (currentLang === 'ta' ? 'சேமித்தது' : 'Saved') : (currentLang === 'ta' ? 'சேமி' : 'Save')}</button>
                    <span style="margin-left:auto;display:flex;gap:4px;">
                        <button onclick="adjustFontSize(-1)" title="Smaller" style="background:none;border:1px solid var(--border);border-radius:6px;width:30px;height:30px;cursor:pointer;color:var(--text);font-size:0.75rem;">A-</button>
                        <button onclick="adjustFontSize(0)" title="Normal" style="background:none;border:1px solid var(--border);border-radius:6px;width:30px;height:30px;cursor:pointer;color:var(--text);font-size:0.85rem;">A</button>
                        <button onclick="adjustFontSize(1)" title="Bigger" style="background:none;border:1px solid var(--border);border-radius:6px;width:30px;height:30px;cursor:pointer;color:var(--text);font-size:1rem;">A+</button>
                    </span>
                </div>
                <button onclick="shareArticle('${article.id}')" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.65rem 1.5rem;background:linear-gradient(135deg, var(--primary, #e11d48), var(--primary-hover, #be123c));color:#fff;border:none;border-radius:999px;font-size:0.9rem;font-weight:700;cursor:pointer;margin:1rem 0;font-family:inherit;box-shadow:0 4px 15px rgba(225,29,72,0.3);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    ${TRANSLATIONS[currentLang].share_article || 'Share'}
                </button>
                <div class="article-text">
                    ${processedContent}
                </div>
                ${(() => {
                    const rel = getRelatedArticles(article, 3);
                    return rel.length ? `<div style="margin-top:2.5rem;padding-top:1.5rem;border-top:2px solid var(--border);">
                        <h3 style="font-family:var(--font-heading);font-size:1.15rem;margin-bottom:1rem;color:var(--text);">${currentLang === 'ta' ? '🔥 தொடர்புடைய செய்திகள்' : '🔥 Related News'}</h3>
                        <div class="rel-grid">${rel.map(relatedArticleHtml).join('')}</div>
                    </div>` : '';
                })()}
                ${videoBlockHtml(article)}
            </div>
        </div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // 📱 Layer: BACK button closes this modal (not the site)
    pushLayer('article', closeModal);

    // 📊 Track article view
    analyticsTrack('view', id);

    // 🖼️ Swipe left/right on gallery image to change photo (mobile)
    (function() {
        var wrap = document.getElementById('gallery-wrap');
        if (!wrap || !window._gal || window._gal.imgs.length < 2) return;
        var tx = 0;
        wrap.addEventListener('touchstart', function(e) { tx = e.changedTouches[0].clientX; }, { passive: true });
        wrap.addEventListener('touchend', function(e) {
            var dx = e.changedTouches[0].clientX - tx;
            if (Math.abs(dx) > 50) galNav(dx < 0 ? 1 : -1);
        }, { passive: true });
    })();

    // 📊 Track article view (fire-and-forget — never blocks UX)
    try {
        var vw = new XMLHttpRequest();
        vw.open('POST', 'https://firestore.googleapis.com/v1/projects/endless-news/databases/(default)/documents/analytics:commit?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA');
        vw.setRequestHeader('Content-Type', 'application/json');
        var todayKey = new Date().toISOString().slice(0, 10);
        var mob = window.innerWidth < 768;
        vw.send(JSON.stringify({ writes: [
            { transform: { document: 'projects/endless-news/databases/(default)/documents/analytics/totals', fieldTransforms: [{ fieldPath: 'views', increment: { integerValue: 1 } }, { fieldPath: mob ? 'mobile' : 'desktop', increment: { integerValue: 1 } }] } },
            { transform: { document: 'projects/endless-news/databases/(default)/documents/analytics/daily_' + todayKey, fieldTransforms: [{ fieldPath: 'views', increment: { integerValue: 1 } }] } }
        ]}));
    } catch (e) { /* silent */ }

    if (isTouchDevice) {
        modal.addEventListener('touchstart', handleTouchStart, { passive: true });
        modal.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
}

function closeModal() {
    const modal = document.getElementById('article-modal');
    if (!modal) return;

    modal.classList.remove('open');
    document.body.style.overflow = '';

    modal.removeEventListener('touchstart', handleTouchStart);
    modal.removeEventListener('touchend', handleTouchEnd);

    // 📱 Sync back-button layer stack
    layerClosed('article');
}

function shareArticle(id) {
    const article = findArticleById(id);
    if (!article) {
        alert('Article not found!');
        return;
    }
    // 📊 Track share (modal open = share intent)
    analyticsTrack('share', id);

    // 📊 Track share (fire-and-forget)
    try {
        var sw = new XMLHttpRequest();
        sw.open('POST', 'https://firestore.googleapis.com/v1/projects/endless-news/databases/(default)/documents/analytics:commit?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA');
        sw.setRequestHeader('Content-Type', 'application/json');
        var shareToday = new Date().toISOString().slice(0, 10);
        sw.send(JSON.stringify({ writes: [
            { transform: { document: 'projects/endless-news/databases/(default)/documents/analytics/totals', fieldTransforms: [{ fieldPath: 'shares', increment: { integerValue: 1 } }] } },
            { transform: { document: 'projects/endless-news/databases/(default)/documents/analytics/daily_' + shareToday, fieldTransforms: [{ fieldPath: 'shares', increment: { integerValue: 1 } }] } }
        ]}));
    } catch (e) { /* silent */ }

    let shareOverlay = document.getElementById('share-modal-overlay');
    if (!shareOverlay) {
        shareOverlay = document.createElement('div');
        shareOverlay.id = 'share-modal-overlay';
        shareOverlay.className = 'modal-overlay';
        shareOverlay.innerHTML = `
            <div class="modal-content share-modal-content" onclick="event.stopPropagation()">
                <div class="share-modal-header">
                    <h3>${TRANSLATIONS[currentLang].share_article || 'Share Article'}</h3>
                    <button class="modal-close" onclick="closeShareModal()" aria-label="Close">&times;</button>
                </div>
                <div class="share-modal-body">
                    <div class="share-grid">
                        <button class="share-btn" data-platform="facebook" onclick="performShare('facebook')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            <span>Facebook</span>
                        </button>
                        <button class="share-btn" data-platform="whatsapp" onclick="performShare('whatsapp')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span>WhatsApp</span>
                        </button>
                        <button class="share-btn" data-platform="telegram" onclick="performShare('telegram')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            <span>Telegram</span>
                        </button>
                        <button class="share-btn" data-platform="x" onclick="performShare('x')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
                            <span>X</span>
                        </button>
                    </div>
                    <div class="share-copy-section">
                        <p class="share-copy-label">Or copy link</p>
                        <div class="share-copy-box">
                            <input type="text" id="share-link-input" readonly>
                            <button class="btn-copy-link" onclick="copyShareLink()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copy</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(shareOverlay);

        shareOverlay.addEventListener('click', (e) => {
            if (e.target === shareOverlay) closeShareModal();
        });
    }

    shareOverlay.dataset.articleId = id;

    const title = getLocalized(article, 'title') || 'EndLess News';
        const cloudUrl = 'https://endlessnews.lk/news/' + encodeURIComponent(id) + '?lang=' + encodeURIComponent(currentLang) + '&v=2026'; // Worker Custom Domain
    const linkInput = document.getElementById('share-link-input');
    if (linkInput) linkInput.value = cloudUrl;

    shareOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    // 📱 BACK closes share card too
    pushLayer('share', closeShareModal);
}

function closeShareModal() {
    const shareOverlay = document.getElementById('share-modal-overlay');
    if (shareOverlay) {
        shareOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }
    layerClosed('share');
}

function performShare(platform) {
    const shareOverlay = document.getElementById('share-modal-overlay');
    const id = shareOverlay ? shareOverlay.dataset.articleId : null;
    if (!id) return;

    const article = findArticleById(id);
    if (!article) return;

    // 🔥 FIX: use localized title based on currently selected language (ta/en)
    const title = getLocalized(article, 'title') || article.title_en || article.title || 'EndLess News';
    // Professional share link via Worker Custom Domain — DNS-level direct to worker,
    // no route matching needed. Dinamalar-style main domain ✅
    const cloudUrl = 'https://endlessnews.lk/news/' + encodeURIComponent(id) + '?lang=' + encodeURIComponent(currentLang) + '&v=2026';

    // Language-aware share text: Tamil selected → Tamil message, English → English
    const shareText = currentLang === 'en'
        ? (title + '\n\n📰 Read more on EndLess News:\n')
        : (title + '\n\n📰 மேலும் படிக்க EndLess News:\n');

    let shareUrl = '';

    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cloudUrl)}&quote=${encodeURIComponent(title)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + cloudUrl)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(cloudUrl)}&text=${encodeURIComponent(title)}`;
            break;
        case 'x':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(cloudUrl)}`;
            break;
    }

    if (shareUrl) {
        const win = window.open(shareUrl, '_blank', 'width=600,height=500,top=100,left=100');
        // Popup blocked → navigate in same tab instead of failing silently
        if (!win) window.location.href = shareUrl;
    }

    closeShareModal();
}

function copyShareLink() {
    const linkInput = document.getElementById('share-link-input');
    if (!linkInput) return;

    linkInput.select();
    linkInput.setSelectionRange(0, 99999);

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(linkInput.value).then(() => {
            const btn = document.querySelector('.btn-copy-link span');
            if (btn) btn.textContent = 'Copied!';
            setTimeout(() => { if (btn) btn.textContent = 'Copy'; }, 2000);
        });
    } else {
        document.execCommand('copy');
        const btn = document.querySelector('.btn-copy-link span');
        if (btn) btn.textContent = 'Copied!';
        setTimeout(() => { if (btn) btn.textContent = 'Copy'; }, 2000);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Link copied! Paste it on Facebook/WhatsApp.');
}

function handleTouchStart(e) {
    touchStartY = e.changedTouches[0].screenY;
    touchStartTime = Date.now();
}

function handleTouchEnd(e) {
    const touchEndY = e.changedTouches[0].screenY;
    const diff = touchStartY - touchEndY;
    const duration = Date.now() - touchStartTime;
    
    // Stricter: swipe down > 150px AND must take at least 200ms (not a fast flick)
    if (diff < -150 && duration > 200) {
        const modalBody = document.querySelector('.modal-content');
        // Must be exactly at top (scrollTop === 0), not just near top
        if (modalBody && modalBody.scrollTop === 0) {
            closeModal();
        }
    }
}

function filterCategory(cat) {
    currentFilter = cat;
    displayedCount = isMobile ? 4 : 6;

    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.cat === cat);
    });

    const titleEl = document.getElementById('feed-title');
    if (cat === 'All') {
        titleEl.textContent = TRANSLATIONS[currentLang].latest_news;
    } else {
        const catObj = categoriesData.find(c => c.name_en === cat);
        titleEl.textContent = catObj ? (currentLang === 'ta' ? catObj.name : catObj.name_en) : cat;
    }

    renderFeed();

    const feedSection = document.querySelector('.main-layout');
    if (feedSection) {
        const offset = feedSection.offsetTop - 80;
        window.scrollTo({ top: offset, behavior: 'smooth' });
    }
}

function handleSearch(e) {
    searchQuery = e.target.value.trim();
    displayedCount = isMobile ? 4 : 6;
    renderFeed();
}

function loadMore() {
    displayedCount += isMobile ? 4 : 6;
    renderFeed();
}

function handleNewsletter(e) {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value;
    if (email) {
        alert('Thank you for subscribing! 🎉');
        document.getElementById('newsletter-email').value = '';
    }
}

function openMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    const mobileOverlay = document.getElementById('mobile-overlay');
    if (mobileNav && mobileOverlay) {
        mobileNav.classList.add('open');
        mobileOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        // 📱 BACK closes the menu drawer too
        pushLayer('menu', closeMobileMenu);
    }
}

function closeMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    const mobileOverlay = document.getElementById('mobile-overlay');
    if (mobileNav && mobileOverlay) {
        mobileNav.classList.remove('open');
        mobileOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }
    layerClosed('menu');
}

// ═══════════════════════════════════════════════════════════════
// 🌤️ REAL-TIME WEATHER — free, no API key, no payment
// Open-Meteo (weather) + ipwho.is (location) — both free forever
// Falls back to GPS if visitor grants permission
// ═══════════════════════════════════════════════════════════════
function initWeather() {
    var weatherEl = document.getElementById('weather');
    if (!weatherEl) return;

    function wEmoji(code) {
        if (code === 0) return '☀️';
        if (code <= 2) return '🌤️';
        if (code === 3) return '☁️';
        if (code === 45 || code === 48) return '🌫️';
        if (code >= 51 && code <= 57) return '🌦️';
        if (code >= 61 && code <= 67) return '🌧️';
        if (code >= 71 && code <= 77) return '🌨️';
        if (code >= 80 && code <= 82) return '🌦️';
        if (code >= 85 && code <= 86) return '🌨️';
        if (code >= 95) return '⛈️';
        return '🌡️';
    }

    function show(lat, lon, city) {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat +
              '&longitude=' + lon + '&current_weather=true')
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (!d.current_weather) return;
                var t = Math.round(d.current_weather.temperature);
                var loc = city ? ' ' + city : '';
                weatherEl.textContent = wEmoji(d.current_weather.weathercode) + ' ' + t + '°C' + loc;
                try {
                    localStorage.setItem('endless_weather', JSON.stringify({
                        t: t, code: d.current_weather.weathercode, city: city, ts: Date.now()
                    }));
                } catch (e) {}
            }).catch(function() {});
    }

    // Show cached value instantly (30 min cache — fewer API calls)
    try {
        var cached = JSON.parse(localStorage.getItem('endless_weather'));
        if (cached && Date.now() - cached.ts < 1800000) {
            weatherEl.textContent = wEmoji(cached.code) + ' ' + cached.t + '°C' +
                (cached.city ? ' ' + cached.city : '');
        }
    } catch (e) {}

    // IP-based location (no permission needed — automatic for every visitor)
    fetch('https://ipwho.is/')
        .then(function(r) { return r.json(); })
        .then(function(ip) {
            if (ip && ip.success && ip.latitude) {
                show(ip.latitude, ip.longitude, ip.city || '');
            }
        }).catch(function() {});

    // Refine with GPS if visitor allows (more accurate)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            show(pos.coords.latitude, pos.coords.longitude, '');
        }, function() { /* denied — IP location stays */ }, { timeout: 5000 });
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('endless_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('endless_theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('endless_theme', 'dark');
    }
}

function handleHeaderScroll() {
    const header = document.querySelector('.main-header');
    if (header) {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
}

function handleResize() {
    const newIsMobile = window.innerWidth < 640;
    if (newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        displayedCount = isMobile ? 4 : 6;
        renderFeed();
        renderHero();
    }
}

function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imgObserver.unobserve(img);
                }
            });
        }, { rootMargin: '50px' });

        document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
    }
}

function initTicker() {
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;

    // 🔥 FIX: old JS transform FIGHT with CSS animation (CSS won → fixed slow 30s).
    // Now: CSS animation only, with dynamic duration ≈ 90px/sec → fast & smooth.
    // Re-measure after every render (setLanguage/feed changes headline lengths).
    function setSpeed() {
        requestAnimationFrame(function() {
            var w = ticker.scrollWidth;
            if (w > 100) {
                var secs = Math.max(12, w / 90); // ~90px per second
                ticker.style.animationDuration = secs.toFixed(1) + 's';
            }
        });
    }
    setSpeed();
    // Also re-speed after images/fonts load (width may change)
    window.addEventListener('load', setSpeed);
}

function syncNewsFromStorage() {
    var localNews = getNewsFromStorage();
    if (localNews && localNews.length > 0) {
        newsData = (localNews || []).filter(function(n) { return !isGarbagePost(n); });
        dbg('News synced from localStorage:', newsData.length, 'articles');
        renderHero();
        renderFeed();
        renderTrending();
    }
}

function syncAdsFromStorage() {
    var localAds = safeJSON('endless_ads', DEFAULT_ADS);
    if (Array.isArray(localAds) && localAds.length > 0) {
        adsData = localAds;
        dbg('Ads synced:', adsData.length, 'ads');
        renderAds();
    }
}

function syncCategoriesFromStorage() {
    var localCats = safeJSON('endless_categories', DEFAULT_CATEGORIES);
    if (Array.isArray(localCats) && localCats.length > 0) {
        categoriesData = localCats;
        dbg('Categories synced:', categoriesData.length, 'categories');
        renderCategories();
        renderTrending();
        renderFeed();
    }
}

// ⚙️ FOOTER VISIBILITY — EASY TOGGLE: true = show, false = hide.
// Neenga hide pannirukkura items-a future-la show pannanum na,
// false → true nu maathunga mattum podhum! (Upload after change.)
const FOOTER_VISIBILITY = {
    about_us: true,
    careers: false,      // 🔒 HIDDEN — future-la true pannunga
    ethics: false,       // 🔒 HIDDEN — future-la true pannunga
    contact: true,
    advertise: true,
    privacy: true,
    terms: true
};

// 🔗 FOOTER LINKS — wire footer items to static pages (no index.html edit needed)
function wireFooterLinks() {
    var map = {
        about_us: 'about.html', careers: 'careers.html', ethics: 'ethics.html',
        contact: 'contact.html', advertise: 'advertise.html',
        privacy: 'privacy.html', terms: 'terms.html'
    };
    Object.keys(map).forEach(function(key) {
        var li = document.querySelector('footer [data-key="' + key + '"]');
        if (!li) return;
        // ⚙️ Toggle: hidden items are removed from footer
        if (FOOTER_VISIBILITY[key] === false) {
            li.style.display = 'none';
            return;
        }
        li.style.display = '';
        if (!li.querySelector('a')) {
            var a = document.createElement('a');
            a.href = map[key];
            a.style.cssText = 'color:inherit;text-decoration:none;';
            while (li.firstChild) a.appendChild(li.firstChild);
            li.appendChild(a);
        }
    });

    // 🏷️ FOOTER SECTIONS — click filters that category on the main site.
    // English & Tamil labels matched against categoriesData.
    var footer = document.querySelector('footer');
    if (!footer) return;
    var sectionH = null;
    footer.querySelectorAll('h4').forEach(function(h) {
        var t = (h.textContent || '').trim();
        if (t === 'பிரிவுகள்' || t === 'Sections') sectionH = h;
    });
    if (!sectionH) return;
    var ul = sectionH.parentElement.querySelector('ul');
    if (!ul) return;
    Array.prototype.forEach.call(ul.children, function(li) {
        if (li.querySelector('a')) return;
        var label = (li.textContent || '').trim();
        var hit = categoriesData.find(function(c) {
            return c.name_en === label || c.name === label;
        });
        li.style.cursor = 'pointer';
        li.setAttribute('role', 'button');
        li.setAttribute('tabindex', '0');
        function go() {
            var target = hit ? (hit.name_en || label) : label;
            // ⚡ From ANY page (About/Contact/...) → jump to home + filter
            if (!document.getElementById('news-grid')) {
                var sep = location.search ? '&' : '?';
                location.href = 'index.html' + sep + 'cat=' + encodeURIComponent(target);
                return;
            }
            filterCategory(target);
        }
        li.addEventListener('click', go);
        li.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
        });
    });
}

// 🔥 FORCE SW UPDATE: stale service workers serve old files on mobile.
// Check for a new SW on every load; reload ONCE when it takes control.
(function forceSwUpdate() {
    if (!('serviceWorker' in navigator)) return;
    var reloaded = false;
    navigator.serviceWorker.getRegistrations().then(function(regs) {
        regs.forEach(function(reg) { reg.update(); });
    });
    navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (!reloaded) { reloaded = true; window.location.reload(); }
    });
})();

document.addEventListener('DOMContentLoaded', async () => {
    // 🚀 PHASE 0.5 — Defer non-critical heavy engines until browser is IDLE.
    // Ads/analytics/sw-update must never delay the first interactive paint.
    var _defer = (window.requestIdleCallback || function(cb) { setTimeout(cb, 1200); });
    _defer(function() {
        try { renderAds(); } catch (e) {}
        try { initAdSenseSlots && initAdSenseSlots(); } catch (e) {}
        try { initTicker(); } catch (e) {}
    });

    // 🚀 PHASE 1 — INSTANT UI: date/weather/theme/language run FIRST.
    // Even if Firebase hangs/blocks, the page is alive and interactive.
    try { renderDate(); } catch (e) {}
    try { initTheme(); } catch (e) {}
    try { initWeather(); } catch (e) {}
    try { setLanguage(currentLang); } catch (e) {}
    try { wireFooterLinks(); } catch (e) {}

    // 🚀 PHASE 2 — DATA: hard 15s timeout. Hang/fail aana kooda UI alive,
    // user sees a clear refresh message instead of a dead page.
    try {
        await withTimeout(loadAllNewsData(), 15000);
    } catch (e) {
        console.warn('Data load failed or timed out:', e && e.message);
        try {
            isDataLoaded = true;
            hideLoading();
            renderHero(); renderFeed(); renderTrending();
            renderCategories(); renderAds(); renderTicker();
        } catch (_) {}
        var _g = document.getElementById('news-grid');
        if (_g && !_g.querySelector('.article-card')) {
            _g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;color:var(--text-muted)">⚠️ Live data connect aaga la — internet check pannunga illai refresh (Ctrl+Shift+R)</div>';
        }
    }

    if (newsData.length === 0) {
        dbg('ℹ️ No articles found in Firebase. Publish from admin panel.');
    }
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    renderDate(); // 📅 respects saved language (ta/en)

    initWeather(); // 🌤️ real-time weather by visitor location
    wireNewsletterBox(); // 📬 newsletter subscribe

    initTheme();
    setLanguage(currentLang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            filterCategory(link.dataset.cat);
            closeMobileMenu();
        });
    });

        const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const feedTitle = document.getElementById('feed-title');
        
        const debouncedSearch = debounce((e) => {
            searchQuery = e.target.value.trim();
            displayedCount = isMobile ? 4 : 6;
            renderFeed();
        
            // 3. Update title with result count
            const feedTitle = document.getElementById('feed-title');
            if (feedTitle && feedTitle.dataset.original) {
            if (!searchQuery) {
            feedTitle.textContent = feedTitle.dataset.original;
            } else {
            const q = searchQuery.toLowerCase();
            const count = newsData.filter(n => 
            (n.status !== 'draft') && !isGarbagePost(n) && (
            (n.title && n.title.toLowerCase().includes(q)) ||
            (n.title_en && n.title_en.toLowerCase().includes(q)) ||
            
            (n.excerpt && n.excerpt.toLowerCase().includes(q)) ||
            (n.excerpt_en && n.excerpt_en.toLowerCase().includes(q))
            )
            ).length;
            feedTitle.textContent = `🔍 "${searchQuery}" — ${count} result${count !== 1 ? 's' : ''}`;
            }
            }
        }, 300);
        searchInput.addEventListener('input', (e) => {
            // 1. Immediate feedback — show "Searching..." instantly
            if (feedTitle) {
                if (!feedTitle.dataset.original) feedTitle.dataset.original = feedTitle.textContent;
                feedTitle.innerHTML = `<span class="search-indicator">🔍 Searching<span>.</span><span>.</span><span>.</span></span>`;
            }
            // 2. Debounced actual search
            debouncedSearch(e);
        });
    }
    
    // Debounced search function

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            displayedCount += isMobile ? 4 : 6;
            renderFeed();
        });
    }

    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    const articleModal = document.getElementById('article-modal');
    if (articleModal) {
        articleModal.addEventListener('click', (e) => {
            if (e.target === articleModal) closeModal();
        });
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMobile = document.getElementById('close-mobile');
    const mobileOverlay = document.getElementById('mobile-overlay');

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
    if (closeMobile) closeMobile.addEventListener('click', closeMobileMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                handleHeaderScroll();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });

    window.addEventListener('resize', debounce(handleResize, 250));

    // 🔖 Mobile menu-la "My Saved" link inject (index.html touch pannama)
    try {
        var mnav = document.getElementById('mobile-nav');
        var mul = mnav && mnav.querySelector('ul');
        if (mul && !document.getElementById('mnav-saved-link')) {
            var li = document.createElement('li');
            li.id = 'mnav-saved-link';
            li.innerHTML = "<a href='#' style='color:#e11d48;font-weight:700;' onclick='event.preventDefault();closeMobileMenu();openSavedPage();'>🔖 சேமித்தவை / Saved</a>";
            mul.appendChild(li);
        }
    } catch (e) {}

    const urlParams = new URLSearchParams(window.location.search);
    // 🏷️ Footer cross-page jump: ?cat=World → auto-filter that category
    const urlCat = urlParams.get('cat');
    if (urlCat && typeof filterCategory === 'function') {
        setTimeout(function() { filterCategory(urlCat); }, 400);
    }
    // 🔥 Share-language chain: ?lang=en/ta from shared links must set the site language
    const urlLang = urlParams.get('lang');
    if (urlLang && (urlLang === 'ta' || urlLang === 'en') && urlLang !== currentLang) {
        setLanguage(urlLang);
    }
    const sharedArticleId = urlParams.get('article');
    if (sharedArticleId && !document.getElementById('article-modal')?.classList.contains('open')) {
        setTimeout(() => openArticle(sharedArticleId), 800);
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'endless_news') {
            syncNewsFromStorage();
        } else if (e.key === 'endless_ads') {
            syncAdsFromStorage();
        } else if (e.key === 'endless_categories') {
            syncCategoriesFromStorage();
        }
    });

        // 🔥 Firebase-only: No periodic localStorage sync needed
    // Website reads directly from Firebase on every load
    dbg('✅ Firebase-only mode active. No localStorage polling.');

    initLazyLoading();
    initTicker();
});