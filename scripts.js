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
        console.log('Firebase connected');
    }
} catch (err) {
    console.error('Firebase init error:', err);
}

/* ═══════════════════════════════════════════════════════
   ENDLESS — MAIN WEBSITE LOGIC
   MOBILE-FIRST OPTIMIZED
   3 LANGUAGE SUPPORT (Tamil/English/Sinhala)
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
    si: {
        nav_home: "මුල් පිටුව", nav_world: "ලෝකය", nav_tech: "තාක්ෂණය",
        nav_business: "ව්‍යාපාර", nav_science: "විද්‍යාව", nav_sports: "ක්‍රීඩා",
        nav_health: "සෞඛ්‍යය", placeholder_search: "පුවත් සොයන්න...",
        latest_news: "නවතම පුවත්", load_more: "තවත් ලිපි ↓",
        trending: "🔥 ජනප්‍රියම", categories: "📂 කාණ්ඩ",
        newsletter: "📬 දෛනික සාරාංශය",
        newsletter_desc: "වැදගත්ම කතා ඔබගේ ඊමේල් වෙත එවන්න.",
        subscribe: "දායක වන්න",
        footer_desc: "ලෝකය පුරා ස්වාධීන මාධ්‍යවේදය. දිනපතා මිලියන ගණනකින් විශ්වාස කෙරේ.",
        footer_sections: "කාණ්ඩ", footer_company: "සමාගම",
        about_us: "අපි ගැන", careers: "රැකියා", ethics: "ආචාර ධර්ම",
        contact: "සම්බන්ධතා", advertise: "ප්‍රචාරණ", follow_us: "අපව අනුගමනය කරන්න",
        rights: "සියලු හිමිකම්ම ඇවිරිණි", privacy: "පුද්ගලිකත්ව ප්‍රතිපත්තිය",
        terms: "සේවා කොන්දේසි", all_stories: "සියලුම කතා",
        read_more: "තවත් කියවන්න", by_author: "ලිපිගත කළේ",
        published_on: "ප්‍රකාශිත දිනය", breaking_news: "අලුත්ම පුවත්",
        ad_label: "දැන්වීම", search_results: "සෙවුම් ප්‍රතිඵල",
        no_results: "ලිපි හමු නොවීය",
        no_articles_yet: "තවම ලිපි නැත. කරුණාකර පරිපාலක පැනලයෙන් ප්‍රකාශයට පත් කරන්න.",
        close: "වසන්න", loading: "පූරණය වෙමින්...",
        share_article: "බෙදාගන්න"
    }
};

let currentLang = localStorage.getItem('gd_language') || 'ta';
let isMobile = window.innerWidth < 640;
let touchStartY = 0;
let isDataLoaded = false;

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const DEFAULT_NEWS = [];

const DEFAULT_ADS = [
    {
        id: 1, title: "EndLess பிரீமியம்", title_en: "EndLess Premium", title_si: "EndLess ප්‍රිමියම්",
        link: "https://example.com/premium",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop",
        position: "header", active: true
    },
    {
        id: 2, title: "டெக் கேஜெட் விற்பனை", title_en: "Tech Gadgets Sale", title_si: "ටෙක් ගැජට් විකිණීම",
        link: "https://example.com/gadgets",
        image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&auto=format&fit=crop",
        position: "sidebar", active: true
    }
];

const DEFAULT_CATEGORIES = [
    { id: "world", name: "உலகம்", name_en: "World", name_si: "ලෝකය", count: 0 },
    { id: "technology", name: "தொழில்நுட்பம்", name_en: "Technology", name_si: "තාක්ෂණය", count: 0 },
    { id: "business", name: "வணிகம்", name_en: "Business", name_si: "ව්‍යාපාර", count: 0 },
    { id: "science", name: "அறிவியல்", name_en: "Science", name_si: "විද්‍යාව", count: 0 },
    { id: "sports", name: "விளையாட்டு", name_en: "Sports", name_si: "ක්‍රීඩා", count: 0 },
    { id: "health", name: "சுகாதாரம்", name_en: "Health", name_si: "සෞඛ්‍යය", count: 0 }
];

function isGarbagePost(n) {
    if (!n || typeof n !== 'object') return true;
    var t = String(n.title || '').trim();
    var t_en = String(n.title_en || '').trim();
    var t_si = String(n.title_si || '').trim();
    var isBad = function(s) {
        if (!s) return true;
        var x = String(s).trim().toLowerCase();
        return x === '' || x === 'untitled' || x === 'undefined' || x === 'null' ||
               x === 'nan' || x === '[object object]';
    };
    var hasTitle = !isBad(t) || !isBad(t_en) || !isBad(t_si);
    var hasId = n.id !== undefined && n.id !== null && n.id !== '';
    return !hasTitle || !hasId;
}

function getNewsFromStorage() {
    var data = localStorage.getItem('endless_news');
    if (data) {
        try {
            var parsed = JSON.parse(data);
            console.log('Loaded', parsed.length, 'articles from localStorage');
            return parsed;
        } catch(e) {
            console.warn('Failed to parse news from localStorage');
        }
    }
    return null;
}

var newsData = [];
window.newsData = newsData;
let adsData = JSON.parse(localStorage.getItem('endless_ads')) || DEFAULT_ADS;
let categoriesData = JSON.parse(localStorage.getItem('endless_categories')) || DEFAULT_CATEGORIES;
let currentFilter = 'All';
let searchQuery = '';
let displayedCount = 4;

async function syncFromFirebase() {
    var localNews = getNewsFromStorage();
    newsData = (localNews || []).filter(function(n) { return !isGarbagePost(n); });

    if (!db) {
        console.log('No Firebase connection, using localStorage only:', newsData.length, 'articles');
        return;
    }

    try {
        console.log('Fetching articles from Firebase...');
        const newsSnapshot = await db.collection('news').get({ source: 'server' });
        let firebaseNews = [];

        if (!newsSnapshot.empty) {
            newsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                if (!isGarbagePost(data)) {
                    firebaseNews.push(data);
                }
            });
        }

        if (firebaseNews.length > 0) {
            var existingIds = new Set(firebaseNews.map(n => String(n.id)));
            var merged = [...firebaseNews];
            if (localNews) {
                localNews.forEach(function(n) {
                    if (!existingIds.has(String(n.id)) && !isGarbagePost(n)) {
                        merged.push(n);
                    }
                });
            }
            newsData = merged;
            localStorage.setItem('endless_news', JSON.stringify(newsData));
            console.log('Synced', newsData.length, 'articles (Firebase + localStorage merged)');
        } else {
            console.log('Firebase empty, using localStorage:', newsData.length, 'articles');
        }
    } catch (error) {
        console.error('Firebase read error:', error);
        console.log('Using localStorage fallback:', newsData.length, 'articles');
    }
}

async function loadAllNewsData() {
    await syncFromFirebase();
    isDataLoaded = true;
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
    return date.toLocaleDateString(currentLang === 'ta' ? 'ta-IN' : currentLang === 'si' ? 'si-LK' : 'en-US', { month: 'short', day: 'numeric' });
}

function getCategoryName(catId) {
    const cat = categoriesData.find(c => c.id === catId || c.name === catId || c.name_en === catId);
    if (!cat) return catId;
    return currentLang === 'ta' ? cat.name : currentLang === 'en' ? cat.name_en : cat.name_si;
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

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('gd_language', lang);

    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
            if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
                el.placeholder = TRANSLATIONS[lang][key];
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

    const spinnerHTML = `
        <div style="text-align:center; padding:3rem; grid-column:1/-1;">
            <div style="display:inline-block; width:40px; height:40px; border:3px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin 1s linear infinite;"></div>
            <p style="margin-top:1rem; color:var(--text-muted); font-size:0.9rem;">${TRANSLATIONS[currentLang].loading}</p>
        </div>
    `;

    if (grid) grid.innerHTML = spinnerHTML;
    if (hero) hero.innerHTML = spinnerHTML;
    if (trending) trending.innerHTML = `<div style="text-align:center; padding:1.5rem;">${TRANSLATIONS[currentLang].loading}</div>`;
    if (ticker) ticker.innerHTML = `<span class="ticker-item">${TRANSLATIONS[currentLang].loading}</span>`;
}

function hideLoading() {
    const grid = document.getElementById('news-grid');
    const hero = document.getElementById('hero-section');
    if (grid && grid.innerHTML.includes('animation:spin')) grid.innerHTML = '';
    if (hero && hero.innerHTML.includes('animation:spin')) hero.innerHTML = '';
}

function renderHero() {
    const featured = newsData.filter(n => n.featured && n.status === 'published' && !isGarbagePost(n)).slice(0, 3);
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
    let filtered = newsData.filter(n => n.status === 'published' && !isGarbagePost(n));

    if (currentFilter !== 'All') {
        const catNames = categoriesData.filter(c =>
            c.name_en === currentFilter || c.name === currentFilter
        ).map(c => [c.name, c.name_en, c.name_si]).flat();
        filtered = filtered.filter(n => catNames.includes(n.category) || catNames.includes(n.category_en));
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(n =>
            (n.title && n.title.toLowerCase().includes(q)) ||
            (n.title_en && n.title_en.toLowerCase().includes(q)) ||
            (n.title_si && n.title_si.toLowerCase().includes(q)) ||
            (n.excerpt && n.excerpt.toLowerCase().includes(q)) ||
            (n.excerpt_en && n.excerpt_en.toLowerCase().includes(q)) ||
            (n.excerpt_si && n.excerpt_si.toLowerCase().includes(q))
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

    const loadMoreWrap = document.getElementById('load-more-wrap');
    if (loadMoreWrap) loadMoreWrap.style.display = filtered.length > displayedCount ? 'block' : 'none';
}

function renderTrending() {
    const trending = newsData.filter(n => n.trending && n.status === 'published' && !isGarbagePost(n)).slice(0, 5);
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
            <span>${currentLang === 'ta' ? escapeHtml(cat.name) : currentLang === 'en' ? escapeHtml(cat.name_en) : escapeHtml(cat.name_si)}</span>
            <span class="count">${cat.count}</span>
        </li>
    `).join('');
}

function renderAds() {
    const activeAds = adsData.filter(a => a.active);

    const headerAd = activeAds.find(a => a.position === 'header');
    const headerContainer = document.getElementById('header-ad-container');
    if (headerContainer && headerAd) {
        headerContainer.innerHTML = `
            <div class="ad-label">${TRANSLATIONS[currentLang].ad_label}</div>
            <div class="ad-box">
                <a href="${escapeHtml(headerAd.link)}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHtml(headerAd.image)}" alt="${escapeHtml(getLocalized(headerAd, 'title'))}" loading="lazy" style="width:100%; max-height:100px; object-fit:cover;">
                </a>
            </div>
        `;
    }

    const sidebarAd = activeAds.find(a => a.position === 'sidebar');
    const sidebarContainer = document.getElementById('sidebar-ad-container');
    if (sidebarContainer) {
        if (sidebarAd) {
            sidebarContainer.innerHTML = `
                <div class="ad-label">${TRANSLATIONS[currentLang].ad_label}</div>
                <a href="${escapeHtml(sidebarAd.link)}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHtml(sidebarAd.image)}" alt="${escapeHtml(getLocalized(sidebarAd, 'title'))}" loading="lazy" style="width:100%; max-height:200px; object-fit:cover;">
                </a>
            `;
        } else {
            sidebarContainer.innerHTML = '';
        }
    }

    const inlineAd = activeAds.find(a => a.position === 'inline');
    const inlineContainer = document.getElementById('inline-ad-container');
    if (inlineContainer && inlineAd) {
        inlineContainer.innerHTML = `
            <div class="ad-label">${TRANSLATIONS[currentLang].ad_label}</div>
            <div class="ad-box">
                <a href="${escapeHtml(inlineAd.link)}" target="_blank" rel="noopener noreferrer">
                    <img src="${escapeHtml(inlineAd.image)}" alt="${escapeHtml(getLocalized(inlineAd, 'title'))}" loading="lazy" style="width:100%; max-height:160px; object-fit:cover;">
                </a>
            </div>
        `;
    }
}

function renderTicker() {
    const breaking = newsData.filter(n => n.status === 'published' && !isGarbagePost(n)).slice(0, 8);
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

    body.innerHTML = `
        <div class="modal-article">
            <img src="${escapeHtml(article.image)}" alt="${escapeHtml(getLocalized(article, 'title'))}" loading="eager">
            <div class="modal-body">
                <span class="category">${escapeHtml(getLocalized(article, 'category'))}</span>
                <h1>${escapeHtml(getLocalized(article, 'title'))}</h1>
                <div class="meta-bar">
                    <span>👤 ${escapeHtml(getLocalized(article, 'author'))}</span>
                    <span>📅 ${new Date(article.date).toLocaleDateString()}</span>
                    <span>🏷️ ${escapeHtml(getLocalized(article, 'category'))}</span>
                </div>
                <button onclick="shareArticle('${article.id}')" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.65rem 1.5rem;background:linear-gradient(135deg, var(--primary, #e11d48), var(--primary-hover, #be123c));color:#fff;border:none;border-radius:999px;font-size:0.9rem;font-weight:700;cursor:pointer;margin:1rem 0;font-family:inherit;box-shadow:0 4px 15px rgba(225,29,72,0.3);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    ${TRANSLATIONS[currentLang].share_article || 'Share'}
                </button>
                <div class="article-text">
                    ${processedContent}
                </div>
                ${article.video ? `<video controls style="width:100%; margin-top:1rem; border-radius:8px;" preload="none"><source src="${escapeHtml(article.video)}"></video>` : ''}
            </div>
        </div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

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
}

function shareArticle(id) {
    const article = findArticleById(id);
    if (!article) {
        alert('Article not found!');
        return;
    }

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
        const BASE_URL = 'https://endless-og.endlessnewslk.workers.dev/';
    const cloudUrl = BASE_URL + '?article=' + encodeURIComponent(id) + '&lang=' + encodeURIComponent(currentLang);
    const linkInput = document.getElementById('share-link-input');
    if (linkInput) linkInput.value = cloudUrl;

    shareOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeShareModal() {
    const shareOverlay = document.getElementById('share-modal-overlay');
    if (shareOverlay) {
        shareOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function performShare(platform) {
    const shareOverlay = document.getElementById('share-modal-overlay');
    const id = shareOverlay ? shareOverlay.dataset.articleId : null;
    if (!id) return;

    const article = findArticleById(id);
    if (!article) return;

    const title = getLocalized(article, 'title') || 'EndLess News';
        const BASE_URL = 'https://endless-og.endlessnewslk.workers.dev/';
    const articleUrl = BASE_URL + '?article=' + encodeURIComponent(id) + '&lang=' + encodeURIComponent(currentLang);

    let shareUrl = '';

    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}&quote=${encodeURIComponent(title)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(title + '\n\n' + articleUrl)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`;
            break;
        case 'x':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`;
            break;
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=500,top=100,left=100');
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
}

function handleTouchEnd(e) {
    const touchEndY = e.changedTouches[0].screenY;
    const diff = touchStartY - touchEndY;

    if (diff < -80) {
        const modalBody = document.querySelector('.modal-content');
        if (modalBody && modalBody.scrollTop <= 10) {
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
        titleEl.textContent = catObj ? (currentLang === 'ta' ? catObj.name : currentLang === 'en' ? catObj.name_en : catObj.name_si) : cat;
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

    let scrollPos = 0;
    setInterval(() => {
        scrollPos += 1;
        if (scrollPos > ticker.scrollWidth - ticker.clientWidth) {
            scrollPos = 0;
        }
        ticker.style.transform = `translateX(-${scrollPos}px)`;
    }, 30);
}

function syncNewsFromStorage() {
    var localNews = getNewsFromStorage();
    if (localNews && localNews.length > 0) {
        newsData = (localNews || []).filter(function(n) { return !isGarbagePost(n); });
        console.log('News synced from localStorage:', newsData.length, 'articles');
        renderHero();
        renderFeed();
        renderTrending();
    }
}

function syncAdsFromStorage() {
    var localAds = JSON.parse(localStorage.getItem('endless_ads')) || DEFAULT_ADS;
    if (Array.isArray(localAds) && localAds.length > 0) {
        adsData = localAds;
        console.log('Ads synced:', adsData.length, 'ads');
        renderAds();
    }
}

function syncCategoriesFromStorage() {
    var localCats = JSON.parse(localStorage.getItem('endless_categories')) || DEFAULT_CATEGORIES;
    if (Array.isArray(localCats) && localCats.length > 0) {
        categoriesData = localCats;
        console.log('Categories synced:', categoriesData.length, 'categories');
        renderCategories();
        renderTrending();
        renderFeed();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    await loadAllNewsData();
    hideLoading();

    if (newsData.length === 0) {
        console.log('No articles from Firebase, retrying in 2 seconds...');
        setTimeout(async function() {
            await syncFromFirebase();
            if (newsData.length > 0) {
                renderHero();
                renderFeed();
                renderTrending();
                renderTicker();
            }
        }, 2000);
    }

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', dateOptions);
    }

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
        searchInput.addEventListener('input', debounce((e) => {
            searchQuery = e.target.value;
            displayedCount = isMobile ? 4 : 6;
            renderFeed();
        }, 300));
    }

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

    const urlParams = new URLSearchParams(window.location.search);
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

    setInterval(() => {
        syncNewsFromStorage();
        syncAdsFromStorage();
        syncCategoriesFromStorage();
    }, 10000);

    initLazyLoading();
    initTicker();
});