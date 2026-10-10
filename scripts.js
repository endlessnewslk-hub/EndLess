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

// ⚙️ NEWSLETTER VISIBILITY — false = hide, true = show (later true pannunga!)
const SHOW_NEWSLETTER = false;

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
    if (typeof SHOW_NEWSLETTER !== 'undefined' && !SHOW_NEWSLETTER) {
        var nlBox = document.querySelector('.newsletter');
        if (nlBox) nlBox.style.display = 'none';
        return;
    }
    var btn = document.querySelector('.newsletter [data-key="subscribe"]');
    if (!btn || btn._nlWired) return;
    btn._nlWired = true;
    btn.removeAttribute('onclick'); // remove old fake alert
    btn.addEventListener('click', function(e) { e.preventDefault(); subscribeNewsletter(); });
    var input = document.getElementById('newsletter-email');
    if (input) input.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); subscribeNewsletter(); } });
}

// ⚡ SPEED PACK v2 — perceived instant load (minnal feel!)
(function speedPack() {
    if (document.getElementById('speed-pack-on')) return;
    var mk = document.createElement('meta'); mk.id = 'speed-pack-on'; document.head.appendChild(mk);

    // 1. Preload hero image — browser fetch starts BEFORE JS data arrives
    try {
        var cache = localStorage.getItem('endless_news');
        if (cache) {
            var arts = JSON.parse(cache) || [];
            var hero = arts.find(function(a) { return a.featured && a.status !== 'draft'; }) || arts[0];
            if (hero && hero.image && hero.image.indexOf('http') === 0) {
                var pl = document.createElement('link');
                pl.rel = 'preload'; pl.as = 'image'; pl.href = hero.image;
                document.head.appendChild(pl);
            }
        }
    } catch (e) {}

    // 2. Cache-first render: show cached content INSTANTLY while Firebase refreshes
    try {
        var cachedNews = localStorage.getItem('endless_news');
        if (cachedNews && !window._instantRendered) {
            window._instantRendered = true;
            try {
                newsData = JSON.parse(cachedNews).filter(function(n) { return n.status !== 'draft'; });
                newsData.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
                isDataLoaded = true;
                hideLoading();
                renderHero(); renderFeed(); renderTrending();
                renderCategories(); renderAds(); renderTicker();
            } catch (e) {}
        }
        if (window._hideSplash) window._hideSplash();
    } catch (e) { if (window._hideSplash) window._hideSplash(); }
})();

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
        /* 📘 PREMIUM FB FOLLOW BANNER — curved, gradient, floating animation */
        '.fb-banner{position:relative;margin:1.5rem 0;border-radius:22px;overflow:hidden;background:linear-gradient(135deg,rgba(24,119,242,0.92) 0%,rgba(14,95,202,0.85) 100%);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.25);box-shadow:0 10px 36px rgba(24,119,242,0.4),inset 0 1px 0 rgba(255,255,255,0.3);display:flex;align-items:center;gap:16px;padding:20px;color:#fff;cursor:pointer;transition:transform .25s ease,box-shadow .25s ease;}',
        '.fb-banner:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(24,119,242,0.45);}',
        '.fb-banner::before{content:"";position:absolute;inset:0;background:url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="white" opacity="0.06"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07"/></svg>\') no-repeat right -20px center;background-size:120px;pointer-events:none;}',
        '.fb-banner .fb-icon{width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;backdrop-filter:blur(4px);}',
        '.fb-banner .fb-icon svg{width:26px;height:26px;fill:#fff;}',
        '.fb-banner .fb-text{flex:1;min-width:0;}',
        '.fb-banner .fb-title{font-size:1.05rem;font-weight:800;line-height:1.3;margin-bottom:2px;}',
        '.fb-banner .fb-sub{font-size:0.8rem;opacity:0.9;line-height:1.35;}',
        '.fb-banner .fb-btn{background:#fff;color:#1877F2;font-weight:800;font-size:0.82rem;padding:10px 18px;border-radius:999px;border:none;cursor:pointer;flex-shrink:0;box-shadow:0 3px 10px rgba(0,0,0,0.2);transition:all .2s;white-space:nowrap;}',
        '.fb-banner .fb-btn:hover{background:#f0f7ff;transform:scale(1.03);}',
        '.fb-banner .fb-btn:active{transform:scale(0.98);}',
        '@media(max-width:640px){.fb-banner{flex-direction:row;padding:14px 16px;gap:12px;}.fb-banner .fb-icon{width:40px;height:40px;}.fb-banner .fb-btn{padding:8px 14px;font-size:0.75rem;}.fb-banner::before{background-size:90px;}}',
        /* 🔗 RELATED ARTICLES — clean card grid (premium look) */
        '.rel-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;}',
        '.rel-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:transform .25s,box-shadow .25s;}',
        '.rel-card:hover{transform:translateY(-3px);box-shadow:0 12px 24px rgba(0,0,0,0.15);}',
        '.rel-card img{width:100%;height:110px;object-fit:cover;display:block;}',
        '.rel-card .rc-b{padding:10px 12px;}',
        '.rel-card .rc-cat{font-size:0.6rem;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.08em;}',
        '.rel-card .rc-t{font-size:0.85rem;font-weight:600;line-height:1.35;margin-top:4px;color:var(--text);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
        /* 📱 Mobile: RELATED NEWS — HORIZONTAL cards (image LEFT, text RIGHT).
           !important forces flex over base .rel-card block styles — no portrait look! */
        '@media(max-width:640px){.rel-grid{grid-template-columns:1fr!important;gap:0.9rem!important;}}',
        '@media(max-width:640px){.rel-card{display:flex!important;flex-direction:row!important;align-items:stretch!important;border-radius:14px!important;overflow:hidden!important;min-height:100px!important;}}',
        '@media(max-width:640px){.rel-card img{width:120px!important;height:100px!important;min-height:100px!important;object-fit:cover!important;flex-shrink:0!important;border-radius:0!important;}}',
        '@media(max-width:640px){.rel-card .rc-b{flex:1!important;padding:10px 14px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;}}',
        '@media(max-width:640px){.rel-card .rc-cat{font-size:0.6rem!important;margin-bottom:4px!important;}}',
        '@media(max-width:640px){.rel-card .rc-t{font-size:0.9rem!important;line-height:1.4!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;}}',
        /* ❤️ PREMIUM REACTION BUTTON — hover lift + active press */
        '#react-btn:hover{border-color:var(--primary);transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,0.12);background:var(--primary);color:#fff;}',
        '#react-btn:active{transform:translateY(0) scale(0.97);}',
        '#react-btn:hover #react-count{color:#fff;}',
        /* 🖼️ INLINE GALLERY — article content nadula images (perfect aspect) */
        '.art-img{margin:1.25rem 0;border-radius:14px;overflow:hidden;cursor:pointer;position:relative;background:var(--surface);border:1px solid var(--border);}',
        '.art-img img{width:100%;height:auto;max-height:420px;object-fit:cover;object-position:center;display:block;transition:transform .3s ease;}',
        '@media(max-width:640px){.art-img img{max-height:300px;}}',
        '.art-img:hover img{transform:scale(1.02);}',
        '.art-img .ai-count{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.6);color:#fff;font-size:0.7rem;font-weight:700;padding:4px 10px;border-radius:999px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}',
        /* 🖼️ FULLSCREEN IMAGE VIEWER — click to zoom + navigate */
        '#fs-img-ov{position:fixed;inset:0;background:rgba(0,0,0,0.94);z-index:99999;display:none;align-items:center;justify-content:center;flex-direction:column;}',
        '#fs-img-ov.open{display:flex;}',
        '#fs-img-main{max-width:92vw;max-height:82vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.5);}',
        '#fs-img-prev,#fs-img-next{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);transition:all .2s;z-index:10;}',
        '#fs-img-prev:hover,#fs-img-next:hover{background:rgba(255,255,255,0.28);transform:translateY(-50%) scale(1.08);}',
        '#fs-img-prev{left:16px;}#fs-img-next{right:16px;}',
        '#fs-img-close{position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);z-index:10;}',
        '#fs-img-meta{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.85);font-size:0.85rem;font-weight:600;background:rgba(0,0,0,0.45);padding:6px 16px;border-radius:999px;backdrop-filter:blur(8px);}',
        /* 💻 DESKTOP in-article ads — compact sidebar-size, centered */
        '@media(min-width:1024px){.modal-article .inl-ad-box{max-width:400px!important;margin-left:auto!important;margin-right:auto!important;float:none!important;}}',
        '@media(min-width:1024px){.modal-article .inl-ad-box img{max-height:260px!important;object-fit:cover;border-radius:12px;}}',
        /* 🔗 SHARE GRID — 3 columns (Telegram hidden), balanced, NO GAP */
        '.share-grid{grid-template-columns:repeat(3,1fr)!important;max-width:340px;margin:0 auto;}',
        '@media(max-width:480px){.share-grid{max-width:100%;}}',
        '.share-grid .share-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.85rem 0.3rem;gap:5px;height:100%;}',
        '.share-grid .share-btn svg{width:26px;height:26px;flex-shrink:0;margin-bottom:1px;}',
        '.share-grid .share-btn span{font-size:0.68rem;line-height:1;font-weight:700;}',
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

.gal-count{position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fff;font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:999px;z-index:5;border:1px solid rgba(255,255,255,0.2);}
.gal-img-fade{animation:galFade 0.3s ease;}
@keyframes galFade{from{opacity:0.3;}to{opacity:1;}}
.vid-wrap{position:relative;width:100%;padding-top:56.25%;margin-top:1rem;border-radius:8px;overflow:hidden;background:#000;}
.vid-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
`;
    document.head.appendChild(st);
})();

// ═══════════════════════════════════════════════════════════════
// 🎬 PREMIUM SPLASH SCREEN — "E" logo + spinning brand-color ring.
// Shows while site loads; auto-hides the moment content renders.
(function splashScreen() {
    if (document.getElementById('endless-splash')) return;
    var sp = document.createElement('div');
    sp.id = 'endless-splash';
    sp.style.cssText = 'position:fixed;inset:0;background:var(--bg,#0a0a0f);z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;transition:opacity .5s ease;';
    sp.innerHTML =
        // Ring spinner around logo — conic gradient, rotating
        '<div style="position:relative;width:110px;height:110px;">' +
        '<div style="position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,#dc2626,transparent 65%);animation:spinRing 1s linear infinite;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));"></div>' +
        '<div id="splash-logo-e" style="position:absolute;inset:10px;border-radius:22px;background:linear-gradient(135deg,#e11d48,#be123c);display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:900;font-size:44px;color:#fff;box-shadow:0 10px 30px rgba(225,29,72,0.35);">E</div>' +
        '</div>' +
        '<div id="splash-brand" style="font-family:Georgia,serif;font-size:1.3rem;font-weight:700;color:var(--text,#f1f5f9);letter-spacing:0.5px;">End<span style="color:#e11d48;">Less</span></div>' +
        '<style>@keyframes spinRing{to{transform:rotate(360deg)}}</style>';
    // Show ASAP (before body even ready, append to documentElement)
    (document.body || document.documentElement).appendChild(sp);
    // 🔤 Font: Playfair PRIMARY (Google Fonts link-a wait panni load pannu)
    try {
        // 🔤 ONLY "EndLess" text → Playfair (E logo simple Georgia-ve irukkum)
        var applyPlayfair = function() {
            var b = document.getElementById('splash-brand');
            if (b) b.style.fontFamily = "'Playfair Display',Georgia,serif";
        };
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(applyPlayfair);
        }
        if (document.fonts && document.fonts.load) {
            document.fonts.load("700 1.3rem 'Playfair Display'").then(applyPlayfair).catch(function() {});
        }
    } catch (e) {}
    window._hideSplash = function() {
        var el = document.getElementById('endless-splash');
        if (!el) return;
        el.style.opacity = '0';
        setTimeout(function() { el.remove(); }, 520);
    };
})();

// 🚨 EMERGENCY ERROR BANNER — any JS crash shows ON THE PAGE itself
// (remote debugging without console). Remove after site is stable.
window.addEventListener('error', function(e) {
    if (document.getElementById('js-err-ban')) return;
    var b = document.createElement('div');
    b.id = 'js-err-ban';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:#fff;padding:10px 14px;font-size:13px;z-index:999999;font-family:monospace;white-space:pre-wrap;';
    b.innerHTML = '<span style="display:inline-flex;vertical-align:-3px;margin-right:6px;">' + IC.alert + '</span><b>JS ERROR:</b> ' + String(e.message || 'unknown') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || '?');
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
        trending: "பிரபலமானவை", categories: "பிரிவுகள்",
        newsletter: "தினசரி சுருக்கம்",
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
        share_article: "பகிர்",
        saved_articles: "சேமித்தவை"
    },
    en: {
        nav_home: "Home", nav_world: "World", nav_tech: "Technology",
        nav_business: "Business", nav_science: "Science", nav_sports: "Sports",
        nav_health: "Health", placeholder_search: "Search news...",
        latest_news: "Latest News", load_more: "Load More Articles ↓",
        trending: "Trending", categories: "Categories",
        newsletter: "Daily Briefing",
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
        share_article: "Share",
        saved_articles: "Saved"
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
    
    // Show loading state — SKIP if instant-rendered from cache (no skeleton re-flash)
    if (!window._instantRendered) showLoading();
    
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
    // 📅 Custom weekday format: Tamil-la "ஞாயிறு" (கிழமை seka vendaam),
    // English-la full "Sunday" (long form).
    var d = new Date();
    if (currentLang === 'ta') {
        var taDays = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
        dateEl.textContent = taDays[d.getDay()] + ', ' + d.toLocaleDateString('ta-IN', { month: 'short', day: 'numeric' });
    } else {
        dateEl.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('gd_language', lang);
    // Ticker text length changes per language — re-measure speed after render
    setTimeout(initTicker, 100);
    renderDate(); // 📅 date-um language-ku eatha maariyum
    // 🔖 Saved menu label — language-ku eatha maariyum
    document.querySelectorAll('.sv-label').forEach(function(el) {
        el.textContent = lang === 'ta' ? 'சேமித்தவை' : 'Saved';
    });

    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
                el.placeholder = TRANSLATIONS[lang][key];
            } else if (el.querySelector('a')) {
                // 🔗 Footer links — update <a> text only
                el.querySelector('a').textContent = TRANSLATIONS[lang][key];
            } else if (el.querySelector('.h3-icon, [data-h3icon]')) {
                // 🎨 Sidebar h3 (Trending/Categories) — icon PRESERVE panni text mattum maathu
                var txt = el.querySelector('.h3-txt') || el.lastElementChild;
                if (txt) txt.textContent = TRANSLATIONS[lang][key];
            } else {
                el.textContent = TRANSLATIONS[lang][key];
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

    // 📘 PREMIUM FB FOLLOW BANNER — sidebar-la trending-ku keezha inject
    (function injectFBBanner() {
        var list = document.getElementById('trending-list');
        if (!list) return;
        if (document.getElementById('fb-follow-banner')) return;
        var banner = document.createElement('div');
        banner.id = 'fb-follow-banner';
        banner.className = 'fb-banner';
        banner.innerHTML =
            '<div class="fb-icon"><svg viewBox="0 0 24 24"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07"/></svg></div>' +
            '<div class="fb-text">' +
            '<div class="fb-title">' + (currentLang === 'ta' ? 'எங்களை Facebook-ல் பின்தொடருங்கள்' : 'Follow Us on Facebook') + '</div>' +
            '<div class="fb-sub">' + (currentLang === 'ta' ? 'அன்றாட முக்கிய செய்திகள் உடனுக்குடன் உங்கள் feed-ல்!' : 'Get daily breaking news in your feed!') + '</div>' +
            '</div>' +
            '<button class="fb-btn" onclick="window.open(\'https://www.facebook.com/profile.php?id=61595124984699\',\'_blank\')">' +
            (currentLang === 'ta' ? 'பின்தொடர்' : 'Follow') + ' →</button>';
        // Click anywhere on banner = open FB
        banner.addEventListener('click', function(e) {
            if (!e.target.closest('.fb-btn')) {
                window.open('https://www.facebook.com/profile.php?id=61595124984699', '_blank');
            }
        });
        list.parentNode.appendChild(banner);
    })();

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
    // 📊 Impression tracking (one per render cycle)
    try { adTrack(null, 'view'); } catch (e) {}
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

// 📊 REAL ANALYTICS v4 — + COUNTRY & SOURCE tracking (FB Insights level!)
(function() {
    var BASE = 'https://firestore.googleapis.com/v1/projects/endless-news/databases/(default)/documents';

    // 🌍 Country — once per session (sessionStorage flag)
    function trackCountry() {
        try {
            if (sessionStorage.getItem('endless_country_tracked')) return;
            fetch('https://ipwho.is/').then(function(r) { return r.json(); }).then(function(ip) {
                if (!ip || !ip.success || !ip.country_code) return;
                sessionStorage.setItem('endless_country_tracked', '1');
                var cc = ip.country_code.toUpperCase();
                var name = ip.country || cc;
                var commitUrl = BASE + ':commit?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA';
                var doc = 'projects/endless-news/databases/(default)/documents/analytics/countries';
                fetch(commitUrl, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ writes: [{ transform: { document: doc, fieldTransforms: [
                        { fieldPath: 'counts.' + cc, increment: { integerValue: 1 } },
                        { fieldPath: 'names.' + cc, stringValue: String(name).substring(0, 40) }
                    ] } }] })
                }).catch(function() {});
            }).catch(function() {});
        } catch (e) {}
    }

    // 🔗 Traffic Source — document.referrer hostname-la irundhu
    function getSource() {
        try {
            var ref = document.referrer || '';
            if (!ref) return 'direct';
            var host = new URL(ref).hostname.replace('www.', '');
            if (host.indexOf('facebook') !== -1 || host === 'fb.com' || host === 'fb.me' || host === 'l.facebook.com' || host === 'lm.facebook.com') return 'facebook';
            if (host.indexOf('whatsapp') !== -1 || host === 'wa.me') return 'whatsapp';
            if (host.indexOf('google.') !== -1) return 'google';
            if (host.indexOf('bing.') !== -1) return 'bing';
            if (host === 't.co' || host === 'x.com' || host.indexOf('twitter') !== -1) return 'x';
            if (host.indexOf('instagram') !== -1) return 'instagram';
            if (host.indexOf('telegram') !== -1 || host === 't.me') return 'telegram';
            if (host.indexOf('youtube') !== -1 || host === 'youtu.be') return 'youtube';
            if (host.indexOf('endlessnews.lk') !== -1) return 'internal';
            return 'other';
        } catch (e) { return 'direct'; }
    }
    function trackSource(src) {
        try {
            var commitUrl = BASE + ':commit?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA';
            var doc = 'projects/endless-news/databases/(default)/documents/analytics/sources';
            fetch(commitUrl, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ writes: [{ transform: { document: doc, fieldTransforms: [
                    { fieldPath: 'counts.' + src, increment: { integerValue: 1 } }
                ] } }] })
            }).catch(function() {});
        } catch (e) {}
    }
    var KEY = '?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA';
    var created = {}; // session cache — doc already created

    function docPath(name) { return BASE + '/analytics/' + name; }

    function ensureDoc(name) {
        if (created[name]) return Promise.resolve(true);
        return fetch(docPath(name) + KEY)
            .then(function(r) {
                if (r.ok) { created[name] = 1; return true; }
                // Create with zero values first (increment needs existing doc)
                return fetch(BASE + '/analytics?documentId=' + name + KEY, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields: {
                        views: { integerValue: 0 },
                        shares: { integerValue: 0 },
                        mobile: { integerValue: 0 },
                        desktop: { integerValue: 0 }
                    } })
                }).then(function(cr) {
                    created[name] = 1;
                    return true;
                });
            }).catch(function() { return false; });
    }

    function commit(writes) {
        return fetch(BASE + ':commit' + KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ writes: writes })
        });
    }

    // 🚀 Kick off country + source (once per session)
    try { trackCountry(); trackSource(getSource()); } catch (e) {}

    // ❤️ Track likes per article (Top Articles analytics-ku)
    window.analyticsLike = function(articleId) {
        try {
            var commitUrl = BASE + ':commit?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA';
            var doc = 'projects/endless-news/databases/(default)/documents/analytics/articles_' + encodeURIComponent(String(articleId));
            fetch(commitUrl, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ writes: [{ transform: { document: doc, fieldTransforms: [
                    { fieldPath: 'likes', increment: { integerValue: 1 } }
                ] } }] })
            }).catch(function() {});
        } catch (e) {}
    };

    window.analyticsTrack = function(type, articleId) {
        try {
            var today = new Date().toISOString().slice(0, 10);
            var isMobile = window.innerWidth < 768;
            var v = type === 'view' ? 1 : 0, sh = type === 'share' ? 1 : 0;
            var devField = isMobile ? 'mobile' : 'desktop';

            var docs = ['totals', 'daily_' + today];
            if (articleId) docs.push('articles_' + String(articleId));

            docs.forEach(function(name) {
                ensureDoc(name).then(function() {
                    var fields = [
                        { fieldPath: 'views', increment: { integerValue: v } },
                        { fieldPath: 'shares', increment: { integerValue: sh } },
                        { fieldPath: devField, increment: { integerValue: 1 } }
                    ];
                    if (name.indexOf('daily_') === 0) {
                        fields.push({ fieldPath: 'date', stringValue: today });
                    }
                    commit([{ transform: { document: 'projects/endless-news/databases/(default)/documents/analytics/' + name, fieldTransforms: fields } }])
                        .catch(function() {});
                });
            });
        } catch (e) {}
    };
})();

// 📰 IN-ARTICLE ADS// 📊 AD TRACKING — impressions (view) + clicks (ad tap) → ad_analytics collection
function adTrack(adId, type) {
    try {
        var today = new Date().toISOString().slice(0, 10);
        var base = 'projects/endless-news/databases/(default)/documents/ad_analytics';
        var key = '?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA';
        var url = 'https://firestore.googleapis.com/v1/' + base;
        var ensure = function(name) {
            return fetch(url + '/' + name + key).then(function(r) {
                if (r.ok) return true;
                return fetch(url + '?documentId=' + name + key, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields: { impressions: { integerValue: 0 }, clicks: { integerValue: 0 } } })
                }).then(function() { return true; });
            }).catch(function() { return false; });
        };
        var bump = function(name, imp, clk) {
            ensure(name).then(function() {
                fetch(url + ':commit' + key, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ writes: [{ transform: { document: base + '/' + name, fieldTransforms: [
                        { fieldPath: 'impressions', increment: { integerValue: imp } },
                        { fieldPath: 'clicks', increment: { integerValue: clk } }
                    ] } }] })
                }).catch(function() {});
            });
        };
        var im = type === 'view' ? 1 : 0, cl = type === 'click' ? 1 : 0;
        bump('totals', im, cl);
        bump('daily_' + today, im, cl);
        if (adId) bump('ad_' + String(adId), im, cl);
    } catch (e) {}
}
// Auto-click on all ad links (event delegation — works for all slots incl. dynamic)
document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var wrap = a.closest('.feed-ad-slot, #ad-slot-header, #ad-slot-sidebar, #ad-slot-inline, #ad-slot-modal, [class*="ad-"]');
    if (wrap) adTrack(a.dataset.adId || null, 'click');
}, true);

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
    return '<div class="inl-ad-box" style="margin:1.75rem 0;">' +
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

// 🎨 PROFESSIONAL SVG ICON LIBRARY — replaces all emojis (BBC/NYT style).
// Consistent 24px stroke icons, currentColor — theme-aware automatic!
const IC = (function() {
    function i(paths, vb) {
        return '<svg viewBox="' + (vb || '0 0 24 24') + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-0.12em;display:inline-block;">' + paths + '</svg>';
    }
    return {
        sun: i('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
        moon: i('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
        cloud: i('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'),
        cloudSun: i('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2"/>'),
        cloudMoon: i('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" transform="scale(0.5) translate(22 2)"/>'),
        rain: i('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 19v2M12 19v2M16 19v2"/>'),
        snow: i('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 19h.01M12 19h.01M16 19h.01"/>'),
        thunder: i('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M13 11l-3 5h4l-3 5"/>'),
        fog: i('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M4 15h16M6 19h12" stroke-width="1.5"/>'),
        heart: i('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
        thumbsUp: i('<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>'),
        laugh: i('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'),
        wow: i('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="4" x2="12" y2="7"/>'),
        sad: i('<circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'),
        angry: i('<circle cx="12" cy="12" r="10"/><line x1="8" y1="8" x2="12" y2="11"/><line x1="16" y1="8" x2="12" y2="11"/><path d="M8 16s1.5-1.5 4-1.5 4 1.5 4 1.5"/>'),
        bookmark: i('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
        clock: i('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
        user: i('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
        calendar: i('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
        tag: i('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),
        flame: i('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
        megaphone: i('<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'),
        search: i('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
        image: i('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
        video: i('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>'),
        mail: i('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
        alert: i('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
        trash: i('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
        eye: i('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
        share: i('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
        chart: i('<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>'),
        globe: i('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
        phone: i('<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>'),
        newsIcon: i('<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z"/>'),
        settings: i('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
        logout: i('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),
        users: i('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
        send: i('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'),
        zap: i('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
        check: i('<polyline points="20 6 9 17 4 12"/>'),
        x: i('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
        edit: i('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
        pie: i('<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>'),
        mouse: i('<rect x="6" y="3" width="12" height="18" rx="6"/><line x1="12" y1="7" x2="12" y2="11"/>'),
        monitor: i('<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>')
    };
})();

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
    if (btn) btn.innerHTML = IC.bookmark + ' ' + (i > -1 ? (currentLang === 'ta' ? 'சேமி' : 'Save') : (currentLang === 'ta' ? 'சேமித்தது' : 'Saved'));
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
    applyArticleFontScale();
}
function applyArticleFontScale() {
    // setLanguage re-renders the modal → re-apply. !important beats styles.css rules.
    var el = document.querySelector('.modal-article .article-text');
    if (el) el.style.setProperty('font-size', (1.05 * _articleFontScale).toFixed(2) + 'rem', 'important');
}

// ✈️ TELEGRAM NOTIFICATIONS — Like/share aana odane unga Telegram-ku message!
// (Browser push vida reliable — Telegram app notification, Android 100%!)
let _tgConfig = null;
async function tgLoadConfig() {
    if (_tgConfig) return _tgConfig;
    if (!db) return null;
    try {
        var doc = await db.collection('settings').doc('telegram_bot').get();
        _tgConfig = doc.exists ? doc.data() : null;
    } catch (e) { _tgConfig = null; }
    return _tgConfig;
}
async function sendTelegramNotify(text) {
    var cfg = await tgLoadConfig();
    if (!cfg || !cfg.botToken || !cfg.chatId) return; // Not configured yet — silent
    try {
        await fetch('https://api.telegram.org/bot' + cfg.botToken + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: cfg.chatId,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
    } catch (e) { /* silent */ }
}

// 📤 PUSH TRIGGER — Like/share aana odane notification trigger create pannum
// (Admin app-la listener ithai paathu push anuppum — phone + laptop!)
async function sendPushTrigger(type, articleId, articleTitle) {
    if (!db) return;
    try {
        await db.collection('push_triggers').add({
            type: type,
            articleId: String(articleId),
            articleTitle: (articleTitle || 'Article').substring(0, 60),
            timestamp: new Date().toISOString(),
            sent: false
        });
    } catch (e) { /* silent */ }
}

// ❤️ LIKE + REACTIONS — Facebook-style. Viewers: like/unlike + 6-emoji reactions.
// Counts public; admin panel-la full breakdown kaatum.
const LIKED_KEY = 'endless_liked';
// 👍 Emoji reactions — Facebook-style (consistent across all articles)
// 🎨 SVG REACTIONS — consistent premium icons (no emoji mix)
const REACTIONS = {
    like: '<svg viewBox="0 0 24 24" fill="none" stroke="#1877F2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    love: '<svg viewBox="0 0 24 24" fill="#F33E58" stroke="#F33E58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    haha: '<svg viewBox="0 0 24 24" fill="none" stroke="#F7B125" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    wow: '<svg viewBox="0 0 24 24" fill="none" stroke="#F7B125" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="8" x2="12" y2="4"/></svg>',
    sad: '<svg viewBox="0 0 24 24" fill="none" stroke="#F7B125" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    angry: '<svg viewBox="0 0 24 24" fill="none" stroke="#E9710F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;"><circle cx="12" cy="12" r="10"/><line x1="8" y1="8" x2="12" y2="11"/><line x1="16" y1="8" x2="12" y2="11"/><path d="M8 16s1.5-1.5 4-1.5 4 1.5 4 1.5"/></svg>'
};
function getLikedMap() { try { return JSON.parse(localStorage.getItem(LIKED_KEY)) || {}; } catch (e) { return {}; } }

// 🔢 FB-STYLE COMPACT NUMBER — 1000 → 1K, 2500 → 2.5K, 1000000 → 1M
function fmtCount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}

function getLikeCount(articleId, cb) {
    // Firestore REST read — public
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://firestore.googleapis.com/v1/projects/endless-news/databases/(default)/documents/likes/' + encodeURIComponent(String(articleId)) + '?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA');
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var f = JSON.parse(xhr.responseText).fields || {};
                    var total = 0, breakdown = {};
                    Object.keys(REACTIONS).forEach(function(k) {
                        var v = (f[k] && (f[k].integerValue || 0)) || 0;
                        v = parseInt(v) || 0;
                        breakdown[k] = v; total += v;
                    });
                    cb(total, breakdown);
                    return;
                } catch (e) {}
            }
            cb(0, {});
        };
        xhr.onerror = function() { cb(0, {}); };
        xhr.send();
    } catch (e) { cb(0, {}); }
}

function submitReaction(articleId, emoji, prevEmoji) {
    // Firestore REST commit — PROPER decrement on unlike
    var writes = [];
    // ALWAYS decrement prev if exists and different (or null = unlike)
    if (prevEmoji && prevEmoji !== emoji) {
        writes.push({ transform: { document: 'projects/endless-news/databases/(default)/documents/likes/' + encodeURIComponent(String(articleId)),
            fieldTransforms: [{ fieldPath: prevEmoji, increment: { integerValue: -1 } }] } });
    }
    // Increment new if exists and different
    if (emoji && emoji !== prevEmoji) {
        writes.push({ transform: { document: 'projects/endless-news/databases/(default)/documents/likes/' + encodeURIComponent(String(articleId)),
            fieldTransforms: [{ fieldPath: emoji, increment: { integerValue: 1 } }] } });
    }
    if (!writes.length) return;
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://firestore.googleapis.com/v1/projects/endless-news/databases/(default)/documents:commit?key=AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ writes: writes }));
    } catch (e) {}
}

// Like button UI + long-press emoji panel (Facebook style)
let _reactArticleId = null;
function buildReactionUI(container, articleId) {
    var liked = getLikedMap();
    var myReaction = liked[articleId] || null;
    container.innerHTML =
        '<button type="button" id="react-btn" style="display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:999px;border:1.5px solid var(--border);background:var(--surface);color:var(--text);font-size:0.95rem;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;transition:all .2s ease;box-shadow:0 2px 8px rgba(0,0,0,0.06);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-weight:600;">' +
        '<span id="react-emoji" style="display:inline-flex;width:22px;height:22px;">' + (myReaction && REACTIONS[myReaction] ? REACTIONS[myReaction] : REACTIONS.like) + '</span>' +
        '<span id="react-count" style="font-weight:700;font-size:0.9rem;"></span></button>' +
        '<div id="react-panel" style="display:none;position:fixed;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:10px 14px;box-shadow:0 12px 32px rgba(0,0,0,0.35);z-index:99999;align-items:center;gap:6px;white-space:nowrap;"></div>';
    container.style.position = 'relative';

    var panel = container.querySelector('#react-panel');
    Object.keys(REACTIONS).forEach(function(k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.style.cssText = 'background:none;border:none;width:40px;height:40px;cursor:pointer;padding:4px;transition:transform .15s;display:inline-flex;align-items:center;justify-content:center;color:inherit;border-radius:50%;';
        b.innerHTML = REACTIONS[k]; // SVG icons need innerHTML, not textContent!
        b.dataset.reaction = k;
        b.addEventListener('mouseenter', function() { this.style.transform = 'scale(1.35)'; });
        b.addEventListener('mouseleave', function() { this.style.transform = 'scale(1)'; });
        b.addEventListener('click', function(ev) { ev.stopPropagation(); pickReaction(articleId, k); });
        panel.appendChild(b);
    });

    var btn = container.querySelector('#react-btn');
    // Long-press (touch + mouse) → emoji panel; quick tap → like/unlike
    var timer = null;
    function startPress(ev) {
        ev.preventDefault();
        timer = setTimeout(function() {
            timer = null;
            var r = btn.getBoundingClientRect();
            panel.style.left = Math.max(8, Math.min(r.left - 80, window.innerWidth - 260)) + 'px';
            panel.style.top = Math.max(8, r.top - 58) + 'px';
            panel.style.display = 'flex';
        }, 450);
    }
    function endPress(ev) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
            quickLike(articleId); // Short tap = like toggle
        }
        // Long-press: timer=null already, panel open — do nothing (emoji click handles)
    }
    btn.addEventListener('touchstart', startPress, { passive: false });
    btn.addEventListener('touchend', endPress);
    btn.addEventListener('mousedown', startPress);
    btn.addEventListener('mouseup', endPress);
    btn.addEventListener('mouseleave', function() { if (timer) { clearTimeout(timer); timer = null; } });

    document.addEventListener('click', function hideP(ev) {
        if (!container.contains(ev.target)) panel.style.display = 'none';
    });

    // Initial count
    getLikeCount(articleId, function(total) {
        var c = container.querySelector('#react-count');
        if (c) c.textContent = total > 0 ? fmtCount(total) : '';
    });
}

function quickLike(articleId) {
    var liked = getLikedMap();
    var my = liked[articleId] || null;
    var next = my === 'like' ? null : 'like'; // toggle = unlike
    pickReaction(articleId, next || undefined, true);
}

function pickReaction(articleId, emojiKey, isQuick) {
    var liked = getLikedMap();
    var prev = liked[articleId] || null;
    var next = emojiKey || null;
    if (prev === next) next = null; // same = unlike
    if (next) { liked[articleId] = next; } else { delete liked[articleId]; }
    try { localStorage.setItem(LIKED_KEY, JSON.stringify(liked)); } catch (e) {}

    // 🚀 OPTIMISTIC UPDATE — UI immediately adjust, server verify later
    var delta = 0;
    if (prev && prev !== next) delta--;      // remove prev
    if (next && next !== prev) delta++;      // add new

    submitReaction(articleId, next, prev); // Firestore async write

    // 🔔 LIKE aana odane push trigger + Telegram (unlike-ku illa)
    if (next && !prev) {
        var _art = (typeof findArticleById === 'function') ? findArticleById(articleId) : null;
        var _t = _art ? (getLocalized(_art, 'title') || _art.title) : 'Article';
        sendPushTrigger('like', articleId, _t);
        sendTelegramNotify('👍 <b>New Like!</b>\n\n📰 ' + _t + '\n\n👉 endlessnews.lk');
        try { analyticsLike(articleId); } catch (e) {}
    }

    var container = document.getElementById('reaction-wrap');
    if (container) {
        var panel = container.querySelector('#react-panel');
        if (panel) panel.style.display = 'none';
        var eb = container.querySelector('#react-emoji');
        if (eb) eb.innerHTML = (next && REACTIONS[next]) ? REACTIONS[next] : REACTIONS.like;
        // Immediate local count update (optimistic)
        var c = container.querySelector('#react-count');
        var cur = parseInt(c.textContent) || 0;
        var newCount = Math.max(0, cur + delta);
        if (c) c.textContent = newCount > 0 ? newCount : '';
        // Server verify after 800ms (eventual consistency wait)
        setTimeout(function() {
            getLikeCount(articleId, function(total) {
                var c2 = container.querySelector('#react-count');
                if (c2) c2.textContent = total > 0 ? fmtCount(total) : '';
            });
        }, 800);
    }
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

// 🖼️ INLINE GALLERY — article.images → paragraphs-ku nadula thumbnails (click → fullscreen)
function pgImgKey(u) {
    // Normalize URL for dedupe: strip Cloudinary transforms + query, keep base
    var s = String(u || '').split('?')[0];
    return s.replace(/\/upload\/[^/]*\//, '/upload/').toLowerCase();
}
function injectInlineGallery(html, article) {
    var raw = [article.image].concat(Array.isArray(article.images) ? article.images : []);
    var imgs = [], seen = {};
    raw.forEach(function (u) {
        if (!u) return;
        var k = pgImgKey(u);
        if (seen[k]) return;
        seen[k] = 1;
        imgs.push(u);
    });
    if (imgs.length < 2) return html; // single image = no spread needed
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var blocks = Array.prototype.slice.call(wrap.children);
    if (blocks.length < 2) return html;
    var out = [], ii = 1; // 0 = hero (already shown)
    blocks.forEach(function(b, i) {
        out.push(b.outerHTML);
        // Every 2nd paragraph → next image (if available) — reading flow perfect
        if ((i + 1) % 2 === 0 && ii < imgs.length) {
            out.push('<div class="art-img" onclick="fsOpen(' + ii + ')">' +
                '<img src="' + escapeHtml(imgs[ii]) + '" alt="" loading="lazy">' +
                '<span class="ai-count">' + (ii + 1) + '/' + imgs.length + ' · Tap to expand</span></div>');
            ii++;
        }
    });
    while (ii < imgs.length) { // remaining images at end
        out.push('<div class="art-img" onclick="fsOpen(' + ii + ')">' +
            '<img src="' + escapeHtml(imgs[ii]) + '" alt="" loading="lazy">' +
            '<span class="ai-count">' + (ii + 1) + '/' + imgs.length + '</span></div>');
        ii++;
    }
    return out.join('');
}

// 🖼️ FULLSCREEN IMAGE VIEWER — swipe/arrow navigate, perfect fit any aspect
let _fsImgs = [], _fsIdx = 0;
function fsEnsureOverlay() {
    var ov = document.getElementById('fs-img-ov');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'fs-img-ov';
        ov.innerHTML =
            '<div id="fs-img-spin" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:44px;height:44px;border:3px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;"></div>' +
            '<img id="fs-img-main" alt="" style="transition:opacity .25s ease;">' +
            '<button id="fs-img-prev" onclick="fsNav(-1)">‹</button>' +
            '<button id="fs-img-next" onclick="fsNav(1)">›</button>' +
            '<button id="fs-img-close" onclick="fsClose()">✕</button>' +
            '<div id="fs-img-meta"></div>';
        document.body.appendChild(ov);
        ov.addEventListener('click', function(e) { if (e.target === ov) fsClose(); });
        var tx = 0;
        ov.addEventListener('touchstart', function(e) { tx = e.changedTouches[0].clientX; }, { passive: true });
        ov.addEventListener('touchend', function(e) {
            var dx = e.changedTouches[0].clientX - tx;
            if (Math.abs(dx) > 50) fsNav(dx < 0 ? 1 : -1);
        }, { passive: true });
        document.addEventListener('keydown', function(e) {
            if (!ov.classList.contains('open')) return;
            if (e.key === 'Escape') fsClose();
            if (e.key === 'ArrowLeft') fsNav(-1);
            if (e.key === 'ArrowRight') fsNav(1);
        });
    }
    return ov;
}
function fsOpen(idx) {
    var g = window._gal || { imgs: [] };
    _fsImgs = g.imgs || [];
    if (!_fsImgs.length) return;
    _fsIdx = Math.min(idx, _fsImgs.length - 1);
    fsRender();
    fsEnsureOverlay().classList.add('open');
    document.body.style.overflow = 'hidden';
}
function fsRender() {
    var img = document.getElementById('fs-img-main');
    if (img) {
        var spin = document.getElementById('fs-img-spin');
        img.style.opacity = '0';
        img.onload = function () { img.style.opacity = '1'; if (spin) spin.style.display = 'none'; };
        img.onerror = function () { img.style.opacity = '1'; if (spin) spin.style.display = 'none'; };
        img.src = _fsImgs[_fsIdx];   // src AFTER onload wired → first tap-la kooda correct
    }
    var meta = document.getElementById('fs-img-meta');
    if (meta) meta.textContent = (_fsIdx + 1) + ' / ' + _fsImgs.length;
    var p = document.getElementById('fs-img-prev'), n = document.getElementById('fs-img-next');
    if (p) p.style.display = _fsImgs.length > 1 ? 'flex' : 'none';
    if (n) n.style.display = _fsImgs.length > 1 ? 'flex' : 'none';
}
function fsNav(d) {
    _fsIdx = (_fsIdx + d + _fsImgs.length) % _fsImgs.length;
    fsRender();
}
function fsClose() {
    var ov = document.getElementById('fs-img-ov');
    if (ov) ov.classList.remove('open');
    document.body.style.overflow = '';
}



function openArticle(id) {
    const article = findArticleById(id);
    if (!article || isGarbagePost(article)) return;

    const modal = document.getElementById('article-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    let processedContent = getLocalized(article, 'content') || '';

    // 📝 SMART RENDER — single pipeline (double-conversion bug fixed):
    // 1) Already HTML (<p>, <br>) → KEEP AS-IS — spacing/breaks perfect-a irukkum
    // 2) Plain text → newlines to <p> + <br>
    // 3) Auto-linkify URLs / phones / emails (text nodes only, safe on HTML)
    var isHtmlContent = /<[a-z][\s\S]*>/i.test(processedContent);
    if (processedContent && !isHtmlContent) {
        const paras = processedContent.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
        processedContent = (paras.length ? paras : [processedContent.trim()])
            .map(p => '<p>' + p.replace(/\n/g, '<br>').replace(/\r/g, '') + '</p>').join('');
    }
    if (processedContent) {
        var tmpL = document.createElement('div');
        tmpL.innerHTML = processedContent;
        function linkifyNode(n) {
            if (n.nodeType === 3) {
                var txt = n.nodeValue;
                if (!txt || !txt.trim()) return;
                txt = txt.replace(/(https?:\/\/[^\s<>"']+|www\.[a-zA-Z0-9-]+\.[^\s<>"']+)/gi, function (m) {
                    var href = m.match(/^https?:\/\//i) ? m : 'https://' + m;
                    return '<a href="' + href + '" target="_blank" rel="noopener noreferrer" style="color:var(--primary);text-decoration:underline;font-weight:600;">' + m + '</a>';
                });
                txt = txt.replace(/(\+94|0)\d{2}[-\s]?\d{3}[-\s]?\d{4}/g, function (m) {
                    return '<a href="tel:' + m.replace(/[^\d+]/g, '') + '" style="color:var(--primary);text-decoration:underline;font-weight:600;">' + m + '</a>';
                });
                txt = txt.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g, function (m) {
                    return '<a href="mailto:' + m + '" style="color:var(--primary);text-decoration:underline;font-weight:600;">' + m + '</a>';
                });
                if (txt !== n.nodeValue) {
                    var sp = document.createElement('span');
                    sp.innerHTML = txt;
                    n.parentNode.replaceChild(sp, n);
                }
            } else if (n.nodeType === 1 && n.tagName !== 'A') {
                Array.prototype.slice.call(n.childNodes).forEach(linkifyNode);
            }
        }
        Array.prototype.slice.call(tmpL.childNodes).forEach(linkifyNode);
        processedContent = tmpL.innerHTML;
    }

    // 🖼️ INLINE GALLERY — extra images paragraphs-ku nadula spread (click → fullscreen)
    processedContent = injectInlineGallery(processedContent, article);
    // 📰 Inject in-article ads between paragraphs (before rendering)
    processedContent = injectInArticleAds(processedContent);
    if (typeof DEBUG !== 'undefined' && DEBUG) console.log('In-article ads — toggle check: ads eligible =', getInArticleAds().length);

    body.innerHTML = `
        <div class="modal-article">
            <div class="gallery-wrap" id="gallery-wrap">
                <img id="gal-main-img" src="${escapeHtml(article.image)}" alt="${escapeHtml(getLocalized(article, 'title'))}" loading="eager" onclick="fsOpen(0)">
                <span class="gal-count" id="gal-count" style="cursor:pointer;" onclick="fsOpen(0)">1/${[article.image].concat(Array.isArray(article.images) ? article.images.filter(u => u && u !== article.image) : []).length}</span>
                ${(() => {
                    const g = [article.image].concat(Array.isArray(article.images) ? article.images.filter(u => u && u !== article.image) : []);
                    window._gal = { imgs: g, idx: 0 };
                    return g.length > 1 ? `
                <span class="gal-count" id="gal-count" style="cursor:pointer;" onclick="fsOpen(0)">1/${g.length} · Tap</span>` : '';
                })()}
            </div>
            <div class="modal-body">
                <span class="category">${escapeHtml(getLocalized(article, 'category'))}</span>
                <h1>${escapeHtml(getLocalized(article, 'title'))}</h1>
                <div class="meta-bar">
                    <span>${IC.user} ${escapeHtml(getLocalized(article, 'author'))}</span>
                    <span>${IC.calendar} ${new Date(article.date).toLocaleDateString()}</span>
                    <span>${IC.tag} ${escapeHtml(getLocalized(article, 'category'))}</span>
                    <span>${IC.clock} ${readingTime(processedContent)} ${currentLang === 'ta' ? 'நிமிடம்' : 'min read'}</span>
                    <button onclick="toggleSaveArticle('${article.id}')" id="save-btn-${article.id}" style="background:none;border:1px solid var(--border);border-radius:999px;padding:3px 12px;cursor:pointer;font-size:0.8rem;color:var(--text-muted);white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">${IC.bookmark} ${isArticleSaved(article.id) ? (currentLang === 'ta' ? 'சேமித்தது' : 'Saved') : (currentLang === 'ta' ? 'சேமி' : 'Save')}</button>
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
                <!-- ❤️ REACTION BAR — clean professional (no text, button only) -->
                <div style="margin-top:2rem;padding-top:1.25rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;">
                    <span id="reaction-wrap" style="display:inline-flex;"></span>
                </div>

                ${(() => {
                    const rel = getRelatedArticles(article, 3);
                    return rel.length ? `<div style="margin-top:2.5rem;padding-top:1.5rem;border-top:2px solid var(--border);">
                        <h3 style="font-family:var(--font-heading);font-size:1.15rem;margin-bottom:1rem;color:var(--text);display:flex;align-items:center;gap:6px;"><span style="color:#e11d48;display:inline-flex;flex-shrink:0;">${typeof IC !== 'undefined' ? IC.flame : '🔥'}</span>${currentLang === 'ta' ? 'தொடர்புடைய செய்திகள்' : 'Related News'}</h3></h3>
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

    // ❤️ Reaction UI (like + long-press emoji panel)
    setTimeout(function() {
        var wrap = document.getElementById('reaction-wrap');
        if (wrap) buildReactionUI(wrap, String(id));
    }, 60);

    // 🖼️ Set gallery images for fullscreen viewer
    window._gal = { imgs: [article.image].concat(Array.isArray(article.images) ? article.images.filter(function(u) { return u && u !== article.image; }) : []) };

    // ⚡ REAL-TIME LIKE LISTENER — FB-style live count (auto-update all devices!)
    try {
        if (window._likeUnsub) window._likeUnsub(); // previous article listener off
        if (db) {
            window._likeUnsub = db.collection('likes').doc(String(id)).onSnapshot(function(doc) {
                var wrap = document.getElementById('reaction-wrap');
                if (!wrap) return;
                var total = 0;
                if (doc.exists) {
                    var f = doc.data();
                    ['like','love','haha','wow','sad','angry'].forEach(function(k) {
                        total += parseInt(f[k]) || 0;
                    });
                }
                var c = wrap.querySelector('#react-count');
                if (c) c.textContent = total > 0 ? fmtCount(total) : '';
            });
        }
    } catch (e) {}


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

// 📑 MY SAVED ARTICLES — premium page (live language toggle, theme-aware)
function openSavedPage() {
    var ov = document.getElementById('saved-page-ov');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'saved-page-ov';
        ov.style.cssText = 'position:fixed;inset:0;background:var(--bg);z-index:2000;overflow-y:auto;';
        ov.innerHTML = '<div style="max-width:900px;margin:0 auto;padding:20px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
            '<h2 id="sv-title" style="font-family:var(--font-heading);font-size:1.5rem;color:var(--text);margin:0;display:flex;align-items:center;gap:8px;"><span style="color:#e11d48;display:inline-flex;">' + IC.bookmark + '</span><span id="sv-title-text"></span></h2>' +
            '<span id="sv-count" style="background:var(--primary);color:#fff;font-size:0.75rem;font-weight:700;padding:2px 10px;border-radius:999px;"></span>' +
            '</div>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
            '<button id="sv-lang-ta" style="padding:6px 14px;border-radius:999px;border:2px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;font-weight:700;font-size:0.8rem;">தமிழ்</button>' +
            '<button id="sv-lang-en" style="padding:6px 14px;border-radius:999px;border:2px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;font-weight:700;font-size:0.8rem;">English</button>' +
            '<button id="sv-close-btn" style="padding:8px 20px;border:2px solid var(--border);border-radius:999px;background:var(--surface);color:var(--text);cursor:pointer;font-weight:600;">✕</button>' +
            '</div></div>' +
            '<div id="sv-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem;"></div></div>';
        document.body.appendChild(ov);
        var svx = document.getElementById('sv-close-btn');
        if (svx) svx.addEventListener('click', function() { ov.style.display = 'none'; document.body.style.overflow = ''; });
        ov.addEventListener('click', function(e) { if (e.target === ov) { ov.style.display = 'none'; document.body.style.overflow = ''; } });
        // 🌐 Saved page-oda OWN language toggle (real-time)
        document.getElementById('sv-lang-ta').addEventListener('click', function() { _svLang = 'ta'; renderSavedPage(); });
        document.getElementById('sv-lang-en').addEventListener('click', function() { _svLang = 'en'; renderSavedPage(); });
    }
    _svLang = currentLang; // default = site language
    ov.style.display = 'block';
    document.body.style.overflow = 'hidden';
    renderSavedPage();
}

let _svLang = 'ta';
function renderSavedPage() {
    var saved = getSavedArticles();
    var L = _svLang || 'ta';
    var t = document.getElementById('sv-title');
    if (t) { var tt = document.getElementById('sv-title-text'); if (tt) tt.textContent = L === 'ta' ? 'சேமித்த செய்திகள்' : 'My Saved Articles'; }
    var c = document.getElementById('sv-count');
    if (c) c.textContent = saved.length + (L === 'ta' ? ' செய்திகள்' : ' articles');
    // Language buttons active state
    var bta = document.getElementById('sv-lang-ta'), ben = document.getElementById('sv-lang-en');
    if (bta) { bta.style.background = L === 'ta' ? 'var(--primary)' : 'var(--surface)'; bta.style.color = L === 'ta' ? '#fff' : 'var(--text)'; bta.style.borderColor = L === 'ta' ? 'var(--primary)' : 'var(--border)'; }
    if (ben) { ben.style.background = L === 'en' ? 'var(--primary)' : 'var(--surface)'; ben.style.color = L === 'en' ? '#fff' : 'var(--text)'; ben.style.borderColor = L === 'en' ? 'var(--primary)' : 'var(--border)'; }
    var grid = document.getElementById('sv-grid');
    if (!grid) return;
    var arts = saved.map(function(id) { return newsData.find(function(n) { return String(n.id) === String(id); }); }).filter(Boolean);
    grid.innerHTML = arts.length ? arts.map(function(a) {
        return '<article class="article-card" onclick="document.getElementById(\'saved-page-ov\').style.display=\'none\';document.body.style.overflow=\'\';openArticle(\'' + a.id + '\')" style="cursor:pointer;">' +
            '<img src="' + escapeHtml(a.image) + '" alt="' + escapeHtml(getLocalized(a, 'title')) + '" loading="lazy">' +
            '<div class="card-body"><div class="meta"><span class="cat">' + escapeHtml(getLocalized(a, 'category')) + '</span><span>' + formatDate(a.date) + '</span></div>' +
            '<h3>' + escapeHtml(getLocalized(a, 'title')) + '</h3>' +
            '<button onclick="event.stopPropagation();toggleSaveArticle(\'' + a.id + '\');renderSavedPage()" style="margin-top:8px;background:none;border:1px solid var(--border);border-radius:999px;padding:4px 12px;cursor:pointer;font-size:0.75rem;color:var(--text-muted);display:inline-flex;align-items:center;gap:5px;">' + IC.trash + ' ' + (L === 'ta' ? 'அகற்று' : 'Remove') + '</button>' +
            '</div></article>';
    }).join('') : '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:3rem;">' + (L === 'ta' ? 'இன்னும் எதுவும் சேமிக்கப்படவில்லை' : 'Nothing saved yet') + '</p>';
}

function closeModal() {
    // ⚡ OFF real-time listener (save bandwidth)
    try { if (window._likeUnsub) { window._likeUnsub(); window._likeUnsub = null; } } catch (e) {}
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

    // 🔔 SHARE aana odane push trigger + Telegram
    var _st = article ? (getLocalized(article, 'title') || article.title) : 'Article';
    sendPushTrigger('share', id, _st);
    sendTelegramNotify('🔗 <b>New Share!</b>\n\n📰 ' + _st + '\n\n👉 endlessnews.lk');

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
                    <div class="share-grid" style="grid-template-columns:repeat(3,1fr);">
                        <button class="share-btn" data-platform="facebook" onclick="performShare('facebook')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            <span>Facebook</span>
                        </button>
                        <button class="share-btn" data-platform="whatsapp" onclick="performShare('whatsapp')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span>WhatsApp</span>
                        </button>
                        <button class="share-btn" data-platform="x" onclick="performShare('x')">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z"/></svg>
                            <span>X</span>
                        </button>
                        <!-- Telegram hidden -->
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
        const cloudUrl = 'https://endlessnews.lk/news/' + encodeURIComponent(id) + '?lang=' + encodeURIComponent(currentLang); // Worker Custom Domain
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
    const cloudUrl = 'https://endlessnews.lk/news/' + encodeURIComponent(id) + '?lang=' + encodeURIComponent(currentLang);

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

    function wEmoji(code, isDay) {
        // 🎨 Professional SVG icons — day/night aware
        if (code === 0) return isDay ? IC.sun : IC.moon;
        if (code <= 2) return isDay ? IC.cloudSun : IC.cloudMoon;
        if (code === 3) return IC.cloud;
        if (code === 45 || code === 48) return IC.fog;
        if (code >= 51 && code <= 57) return IC.rain;
        if (code >= 61 && code <= 67) return IC.rain;
        if (code >= 71 && code <= 77) return IC.snow;
        if (code >= 80 && code <= 82) return IC.rain;
        if (code >= 85 && code <= 86) return IC.snow;
        if (code >= 95) return IC.thunder;
        return isDay ? IC.sun : IC.moon;
    }

    function show(lat, lon, city) {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat +
              '&longitude=' + lon + '&current_weather=true')
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (!d.current_weather) return;
                var t = Math.round(d.current_weather.temperature);
                var isDay = d.current_weather.is_day === 1;
                var loc = city ? ' ' + city : '';
                weatherEl.innerHTML = wEmoji(d.current_weather.weathercode, isDay) + ' ' + t + '°C' + '<span style="opacity:0.85">' + loc + '</span>';
                try {
                    localStorage.setItem('endless_weather', JSON.stringify({
                        t: t, code: d.current_weather.weathercode, isDay: isDay, city: city, ts: Date.now()
                    }));
                } catch (e) {}
            }).catch(function() {});
    }

    // Show cached value instantly (30 min cache — fewer API calls)
    try {
        var cached = JSON.parse(localStorage.getItem('endless_weather'));
        if (cached && Date.now() - cached.ts < 1800000) {
            weatherEl.innerHTML = wEmoji(cached.code, cached.isDay) + ' ' + cached.t + '°C' +
                (cached.city ? '<span style="opacity:0.85"> ' + cached.city + '</span>' : '');
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

    // 📍 GPS refine — ALLOW pannalana exact location (Al Hasa stable-a irukkum)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            // Reverse geocode for city name (nominatim — free)
            fetch('https://nominatim.openstreetmap.org/reverse?lat=' + pos.coords.latitude +
                  '&lon=' + pos.coords.longitude + '&format=json')
                .then(function(r) { return r.json(); })
                .then(function(g) {
                    var city = (g.address && (g.address.city || g.address.town || g.address.county)) || '';
                    show(pos.coords.latitude, pos.coords.longitude, city);
                })
                .catch(function() { show(pos.coords.latitude, pos.coords.longitude, ''); });
        }, function() { /* denied — IP location stays */ }, { timeout: 8000, enableHighAccuracy: true });
    }
}

function initTheme() {
    // ☀️ LIGHT DEFAULT — new visitors-ku epovum light varum
    // (dark venum na ☀️ toggle click pannanum — saved preference respected)
    const savedTheme = localStorage.getItem('endless_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    // No system follow — default = light (data-theme not set = light CSS)
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

    // 🌐 PREMIUM SOCIAL ICONS — FB/X/IG brand SVGs (pink theme pop!)
    var FB_SVG = '<svg viewBox="0 0 24 24" fill="#1877F2" style="width:22px;height:22px;flex-shrink:0;"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07"/></svg>';
    var X_SVG = '<svg viewBox="0 0 24 24" fill="#0f172a" style="width:20px;height:20px;flex-shrink:0;"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z"/></svg>';
    var IG_SVG = '<svg viewBox="0 0 24 24" style="width:22px;height:22px;flex-shrink:0;"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#fdf497;stop-opacity:1"/><stop offset="25%" style="stop-color:#fd5949;stop-opacity:1"/><stop offset="50%" style="stop-color:#d6249f;stop-opacity:1"/><stop offset="75%" style="stop-color:#8134af;stop-opacity:1"/><stop offset="100%" style="stop-color:#515bd4;stop-opacity:1"/></linearGradient></defs><path fill="url(#ig)" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.15A4 4 0 1 1 16 12a4 4 0 0 1-4 3.99zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/></svg>';

    var SOCIALS_PREMIUM = [
        { name: 'Facebook', icon: FB_SVG, url: 'https://www.facebook.com/profile.php?id=61595124984699' },
        { name: 'X (Twitter)', icon: X_SVG, url: 'https://x.com/home' },
        { name: 'Instagram', icon: IG_SVG, url: 'https://www.instagram.com/endlessnewslk/' }
    ];

    try {
        var fSec = null;
        document.querySelectorAll('footer h4').forEach(function(h) {
            var t = (h.textContent || '').trim();
            if (t === 'எங்களை பின்தொடர்' || t === 'Follow Us') fSec = h;
        });
        if (fSec) {
            var ul = fSec.parentElement.querySelector('ul');
            if (ul) {
                ul.innerHTML = SOCIALS_PREMIUM.map(function(s) {
                    return '<li style="cursor:pointer;display:flex;align-items:center;gap:10px;padding:6px 0;" onclick="window.open(\'' + s.url + '\',\'_blank\')" onmouseover="this.style.opacity=\'0.8\'" onmouseout="this.style.opacity=\'1\'">' +
                        s.icon +
                        '<span style="font-weight:600;font-size:0.9rem;color:var(--text);">' + s.name + '</span></li>';
                }).join('');
                ul.style.listStyle = 'none';
            }
        }
    } catch (e) {}
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

setTimeout(function() { if (window._hideSplash) window._hideSplash(); }, 6000);

// 📘 PREMIUM FB BANNER — own section in sidebar, gap ooda, glassy look
(function injectFBBanner() {
    function place() {
        var sidebar = document.querySelector('.sidebar');
        if (!sidebar || document.getElementById('fb-follow-banner')) return;
        var wrap = document.createElement('div');
        wrap.id = 'fb-follow-banner';
        wrap.className = 'fb-banner';
        wrap.style.marginTop = '1.5rem';
        wrap.innerHTML =
            '<div class="fb-icon"><svg viewBox="0 0 24 24"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07"/></svg></div>' +
            '<div class="fb-text">' +
            '<div class="fb-title">' + (typeof currentLang !== 'undefined' && currentLang === 'ta' ? 'எங்களை Facebook-ல் பின்தொடருங்கள்' : 'Follow Us on Facebook') + '</div>' +
            '<div class="fb-sub">' + (typeof currentLang !== 'undefined' && currentLang === 'ta' ? 'அன்றாட முக்கிய செய்திகள் உடனுக்குடன்!' : 'Daily breaking news in your feed!') + '</div>' +
            '</div>' +
            '<button class="fb-btn" onclick="window.open(\'https://www.facebook.com/profile.php?id=61595124984699\',\'_blank\')">Follow →</button>';
        wrap.addEventListener('click', function(e) {
            if (!e.target.closest('.fb-btn')) window.open('https://www.facebook.com/profile.php?id=61595124984699', '_blank');
        });
        // TRENDING & CATEGORIES NADULA (sidebar middle — best visibility!)
        var trendingBox = null, categoriesBox = null;
        sidebar.querySelectorAll('.sidebar-box').forEach(function(bx) {
            var h = bx.querySelector('h3');
            if (!h) return;
            var t = (h.textContent || '').trim();
            if (t.indexOf('Trending') !== -1 || t.indexOf('பிரபலமானவை') !== -1) trendingBox = bx;
            if (t.indexOf('Categories') !== -1 || t.indexOf('பிரிவுகள்') !== -1) categoriesBox = bx;
        });
        if (trendingBox && categoriesBox && categoriesBox.parentNode === sidebar) {
            sidebar.insertBefore(wrap, categoriesBox);
        } else if (trendingBox && trendingBox.parentNode === sidebar) {
            sidebar.insertBefore(wrap, trendingBox.nextSibling);
        } else {
            sidebar.insertBefore(wrap, sidebar.firstChild);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place);
    else place();
})();

addEventListener('DOMContentLoaded', async () => {
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
    // 🔄 After language switch re-renders modal, restore article font zoom (A+/A-)
    setTimeout(applyArticleFontScale, 150);
    try { wireFooterLinks(); } catch (e) {}

    // 🚀 PHASE 2 — DATA: hard 15s timeout. If we already instant-rendered from
    // cache, refresh SILENTLY in background (no skeleton re-flash, minnal feel).
    var _hadInstant = window._instantRendered;
    try {
        if (_hadInstant) {
            await withTimeout(loadAllNewsData(), 15000);
            hideLoading();
            renderHero(); renderFeed(); renderTrending();
            renderCategories(); renderAds(); renderTicker();
        } else {
            await withTimeout(loadAllNewsData(), 15000);
        }
        if (window._hideSplash) window._hideSplash();
    } catch (e) {
        if (window._hideSplash) window._hideSplash();
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
        // 🛡️ Guard — duplicate listener avoid pannum (mobile double-fire fix)
        if (!loadMoreBtn._wired) {
            loadMoreBtn._wired = true;
            loadMoreBtn.addEventListener('click', function() {
                displayedCount += isMobile ? 4 : 6;
                renderFeed();
            });
        }
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

    // 🎨 Sidebar h3 icons — 🔥📂📬 → professional SVG (index.html touch pannama)
    try {
        var iconH3 = [
            ['trending', IC.flame, '#e11d48'],
            ['categories', IC.tag, '#4f46e5'],
            ['newsletter', IC.mail, '#059669']
        ];
        iconH3.forEach(function(cfg) {
            document.querySelectorAll('h3[data-key="' + cfg[0] + '"]').forEach(function(h) {
                if (h.dataset.iconDone) return;
                h.dataset.iconDone = '1';
                h.style.display = 'flex'; h.style.alignItems = 'center'; h.style.gap = '7px';
                h.innerHTML = '<span class="h3-icon" data-h3icon="1" style="color:' + cfg[2] + ';display:inline-flex;flex-shrink:0;">' + cfg[1] + '</span><span class="h3-txt">' + h.textContent.trim() + '</span>';
            });
        });
        // Ad placeholder emojis (📢) — SVG megaphone
        document.querySelectorAll('.ad-slot-placeholder span').forEach(function(sp) {
            if (sp.textContent.trim() === '📢') { sp.innerHTML = IC.megaphone; sp.style.cssText = 'display:inline-flex;color:var(--text-subtle);'; }
        });
        // Newsletter heading inside box (static h3 without data-key in some versions)
    } catch (e) {}

    // 📌 CHROME-STYLE NAV — scroll DOWN = hide, scroll UP = show (premium UX)
    // (Same pattern as Google Chrome mobile — saves screen while reading)
    try {
        var hdr = document.querySelector('.main-header');
        if (hdr && !hdr.dataset.navDone) {
            hdr.dataset.navDone = '1';
            hdr.style.position = 'fixed';
            hdr.style.top = '0';
            hdr.style.left = '0';
            hdr.style.right = '0';
            hdr.style.zIndex = '500';
            hdr.style.transition = 'transform .28s ease, box-shadow .28s ease';
            var lastY = 0;
            window.addEventListener('scroll', function() {
                var y = window.scrollY;
                if (y < 60) {
                    // Top-la irukum bodhu — EPPovum show
                    hdr.style.transform = 'translateY(0)';
                    hdr.style.boxShadow = 'none';
                } else if (y > lastY + 4) {
                    // Scroll DOWN — hide (nav eh!)
                    hdr.style.transform = 'translateY(-110%)';
                } else if (y < lastY - 4) {
                    // Scroll UP — show (chrome maari thirumba varum!)
                    hdr.style.transform = 'translateY(0)';
                    hdr.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
                }
                lastY = y;
            }, { passive: true });
            // Body padding — fixed header keezha content hide aaga koodathu
            function padBody() {
                var h = hdr.offsetHeight || 60;
                document.body.style.paddingTop = h + 'px';
            }
            padBody();
            window.addEventListener('resize', padBody);
            window.addEventListener('load', padBody);
        }
    } catch (e) {}

    // 🔖 Mobile menu-la "My Saved" link inject (index.html touch pannama)
    try {
        var mnav = document.getElementById('mobile-nav');
        var mul = mnav && mnav.querySelector('ul');
        if (mul && !document.getElementById('mnav-saved-link')) {
            var li = document.createElement('li');
            li.id = 'mnav-saved-link';
            li.innerHTML = "<a href='#' style='color:#e11d48;font-weight:700;display:inline-flex;align-items:center;gap:5px;' onclick='event.preventDefault();closeMobileMenu();openSavedPage();'>" + IC.bookmark + " <span class='sv-label'>" + (currentLang === 'ta' ? 'சேமித்தவை' : 'Saved') + "</span></a>";
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