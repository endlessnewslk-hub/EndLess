// ── Firebase Configuration (Same as dashboard) ──
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
        console.log('Firebase connected in index.js');
    }
} catch (err) {
    console.error('Firebase init error in index.js:', err);
}

// ── Load Data from Firebase or localStorage ──
async function syncFromFirebase() {
    if (!db) {
        console.log('No Firebase connection, using localStorage/default data.');
        window.newsData = getNewsFromStorage() || DEFAULT_NEWS;
        return;
    }
    try {
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
            window.newsData = firebaseNews;
            localStorage.setItem('endless_news', JSON.stringify(window.newsData));
            console.log(`Synced ${window.newsData.length} articles from Firebase.`);
        } else {
            // If Firebase is empty, fall back to localStorage or defaults
            window.newsData = getNewsFromStorage() || DEFAULT_NEWS;
            console.log('Firebase collection empty, using localStorage/default data.');
        }

    } catch (error) {
        console.error('Firebase read error in scripts.js:', error);
        // On error, gracefully fall back to localStorage or defaults
        window.newsData = getNewsFromStorage() || DEFAULT_NEWS;
    }
}

async function loadAllNewsData() {
    await syncFromFirebase();
}


/* ═══════════════════════════════════════
   ENDLESS — MAIN WEBSITE LOGIC
   MOBILE-FIRST OPTIMIZED
   3 LANGUAGE SUPPORT (Tamil/English/Sinhala)
   ═══════════════════════════════════════ */

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
        footer_desc: "உலகம் முழுவதும் சுயாதீன பத்திரிகையாளர்கள். தினமும் மில்லியன் கணக்கான வாசகர்களால் நம்பப்படுகிறது.",
        footer_sections: "பிரிவுகள்", footer_company: "நிறுவனம்",
        about_us: "எங்களைப் பற்றி", careers: "வேலைவாய்ப்பு",
        ethics: "பொருளாதார ஒழுக்கம்", contact: "தொடர்பு", advertise: "விளம்பரம்",
        follow_us: "எங்களை பின்தொடர", rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை",
        privacy: "தனியுரிமைக் கொள்கை", terms: "விதிமுறைகள்",
        all_stories: "அனைத்து கதைகள்", read_more: "மேலும் படிக்க",
        by_author: "எழுதியவர்", published_on: "வெளியிடப்பட்டது",
        breaking_news: "உடனடி செய்திகள்", ad_label: "விளம்பரம்",
        search_results: "தேடல் முடிவுகள்", no_results: "எந்த செய்தியும் கிடைக்கவில்லை",
        close: "மூடு", loading: "ஏற்றுகிறது...",
        share_article: "பகிர்",
        share_this_article: "இந்த கட்டுரையைப் பகிர்",
        share_facebook: "பேஸ்புக்",
        share_x: "எக்ஸ்",
        share_whatsapp: "வாட்ஸ்அப்",
        share_copy: "நகலெடு",
        share_copied: "நகலெடுக்கப்பட்டது!",
        share_link_copied: "இணைப்பு கிளிப்போர்டில் நகலெடுக்கப்பட்டது!",
        share_failed: "நகலெடுக்க முடியவில்லை",
        share_opening_facebook: "பேஸ்புக் திறக்கிறது...",
        share_opening_x: "எக்ஸ் திறக்கிறது...",
        share_opening_whatsapp: "வாட்ஸ்அப் திறக்கிறது...",
        shared_from: "இதிலிருந்து பகிரப்பட்டது"
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
        no_results: "No articles found", close: "Close", loading: "Loading...",
        share_article: "Share",
        share_this_article: "Share this article",
        share_facebook: "Facebook",
        share_x: "X",
        share_whatsapp: "WhatsApp",
        share_copy: "Copy",
        share_copied: "Copied!",
        share_link_copied: "Link copied to clipboard!",
        share_failed: "Failed to copy",
        share_opening_facebook: "Opening Facebook...",
        share_opening_x: "Opening X...",
        share_opening_whatsapp: "Opening WhatsApp...",
        shared_from: "Shared from"
    },
    si: {
        nav_home: "මුල් පිටුව", nav_world: "ලෝකය", nav_tech: "තාක්ෂණය",
        nav_business: "ව්‍යාපාර", nav_science: "විද්‍යාව", nav_sports: "ක්‍රීඩා",
        nav_health: "සෞඛ්‍යය", placeholder_search: "පුවත් සොයන්න...",
        latest_news: "නවතම පුවත්", load_more: "තවත් ලිපි ↓",
        trending: "🔥 ජනප්‍රියයි", categories: "📂 කාණ්ඩ",
        newsletter: "📬 දෛනික සාරාංශය",
        newsletter_desc: "වැදගත්ම කතා ඔබගේ ඊමේල් වෙත එවන්න.",
        subscribe: "දායක වන්න",
        footer_desc: "ලෝකය පුරා ස්වාධීන මාධ්‍යවේදය. දිනපතා මිලියන ගණනකි කියවනවා.",
        footer_sections: "කාණ්ඩ", footer_company: "සමාගම",
        about_us: "අපි ගැන", careers: "රැකියා", ethics: "ආචාර ධර්ම",
        contact: "සම්බන්ධතා", advertise: "ප්‍රචාරණය", follow_us: "අපව අනුගමනය කරන්න",
        rights: "සියලු හිමිකම් ඇවිරිණි", privacy: "පෞද්ගලිකත්ව ප්‍රතිපත්තිය",
        terms: "සේවා කොන්දේසි", all_stories: "සියලුම කතා",
        read_more: "තවත් කියවන්න", by_author: "ලිපිගත කළේ",
        published_on: "ප්‍රකාශිත දිනය", breaking_news: "අලුත්ම පුවත්",
        ad_label: "දැන්වීම", search_results: "සෙවුම් ප්‍රතිඵල",
        no_results: "ලිපි හමු නොවීය", close: "වසන්න", loading: "පූරණය වෙමින්...",
        share_article: "බෙදාගන්න",
        share_this_article: "මෙම ලිපිය බෙදාගන්න",
        share_facebook: "ෆේස්බුක්",
        share_x: "එක්ස්",
        share_whatsapp: "වට්ස්ඇප්",
        share_copy: "පිටපත් කරන්න",
        share_copied: "පිටපත් කරන ලදී!",
        share_link_copied: "සබැඳිය පසුරු පුවරුවට පිටපත් කරන ලදී!",
        share_failed: "පිටපත් කිරීමට අසමත් විය",
        share_opening_facebook: "ෆේස්බුක් විවෘත කරමින්...",
        share_opening_x: "එක්ස් විවෘත කරමින්...",
        share_opening_whatsapp: "වට්ස්ඇප් විවෘත කරමින්...",
        shared_from: "වෙතින් බෙදාගත්තේ"
    }
};

let currentLang = localStorage.getItem('gd_language') || 'ta';
let isMobile = window.innerWidth < 640;
let touchStartY = 0;

// Check if device is touch-capable
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('gd_language', lang);
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (TRANSLATIONS[lang][key]) {
            if (el.tagName === 'INPUT' && el.placeholder) {
                el.placeholder = TRANSLATIONS[lang][key];
            } else {
                const text = el.textContent;
                const emojiMatch = text.match(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u);
                const emoji = emojiMatch ? emojiMatch[0] : '';
                el.textContent = emoji + TRANSLATIONS[lang][key];
            }
        }
    });
    renderFeed();
    renderCategories();
    renderTrending();
    renderAds();
    renderTicker();
}

const DEFAULT_NEWS = [
    {
        id: 1718764800001,
        title: "உலக சந்தைகள் புதிய உச்சத்தை எட்டின",
        title_en: "Global Markets Rally as Inflation Data Shows Unexpected Cooling",
        title_si: "ලෝක වෙළඳපොළවල් උත්සාහයෙන් ඉහළට",
        excerpt: "பணவீக்க தரவுகள் எதிர்பாராத குளிர்ச்சியைக் காட்டுவதால் முக்கிய குறியீடுகள் புதிய உச்சங்களை எட்டின.",
        excerpt_en: "Major indices hit record highs Thursday as consumer price reports suggest the worst of the economic squeeze may be over.",
        excerpt_si: "පාරිභෝගික මිල වාර්තා පෙන්වා දෙන විට ප්‍රධාන දර්ශකයන් වාර්තාගත ඉහළ මට්ටම්වලට ළඟා විය.",
        content: "<p>பணவீக்க தரவுகள் எதிர்பாராத குளிர்ச்சியைக் காட்டுவதால் முக்கிய குறியீடுகள் புதிய உச்சங்களை எட்டின. Goldman Sachs ஆன்லிஸ்டுகள் Q3 க்கு தங்கள் கணிப்பை மேம்படுத்தினர்.</p>",
        content_en: "<p>Major indices hit record highs Thursday as consumer price reports suggest the worst of the economic squeeze may be over. Analysts at Goldman Sachs upgraded their outlook for Q3.</p>",
        content_si: "<p>පාරිභෝගික මිල වාර්තා පෙන්වා දෙන විට ප්‍රධාන දර්ශකයන් වාර්තාගත ඉහළ මට්ටම්වලට ළඟා විය. Goldman Sachs විශ්ලේෂකයන් Q3 සඳහා ඔවුන්ගේ දෘෂ්ටිවාදය උත්ශ්‍රේණි කළහ.</p>",
        category: "வணிகம்", category_en: "Business", category_si: "ව්‍යාපාර",
        author: "எலினா ரோஸ்டோவா", author_en: "Elena Rostova", author_si: "එලීනා රෝස්ටෝවා",
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        image: "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&auto=format&fit=crop",
        video: "", featured: true, trending: true, status: "published"
    },
    {
        id: 1718764800002,
        title: "SpaceX அடுத்த தலைமுறை செயற்கைக்கோள்களை வெற்றிகரமாக ஏவியது",
        title_en: "SpaceX Launches Next-Gen Satellite Constellation",
        title_si: "SpaceX ඊළඟ පරම්පරා චන්ද්‍රිකා යැවීම",
        excerpt: "Falcon Heavy 24 முன்னணி தகவல்தொடர்பு செயற்கைக்கோள்களை சுற்றுப்பாதையில் ஏவியது.",
        excerpt_en: "The Falcon Heavy carried 24 advanced communications satellites into orbit, promising global high-speed internet coverage.",
        excerpt_si: "Falcon Heavy චන්ද්‍රිකා 24ක් කක්ෂයට රැගෙන ගියේය.",
        content: "<p>Falcon Heavy 24 முன்னணி தகவல்தொடர்பு செயற்கைக்கோள்களை சுற்றுப்பாதையில் ஏவியது. இந்த செயற்கைக்கோள்கள் லேசர் இணைப்புகளைக் கொண்டுள்ளன.</p>",
        content_en: "<p>The Falcon Heavy carried 24 advanced communications satellites into orbit. Each satellite is equipped with laser interlinks that allow data to travel at the speed of light.</p>",
        content_si: "<p>Falcon Heavy චන්ද්‍රිකා 24ක් කක්ෂයට රැගෙන ගියේය. එකි එකි චන්ද්‍රිකාව ලේසර් අන්තර්සම්බන්ධතා සහිතව සම්පූර්ණ කර ඇත.</p>",
        category: "அறிவியல்", category_en: "Science", category_si: "විද්‍යාව",
        author: "ஜேம்ஸ் சென்", author_en: "James Chen", author_si: "ජේම්ස් චෙන්",
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
        image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800&auto=format&fit=crop",
        video: "", featured: true, trending: false, status: "published"
    },
    {
        id: 1718764800003,
        title: "AI பாதுகாப்பு ஒப்பந்தம் கையெழுத்தானது",
        title_en: "AI Safety Pact Signed by Leading Tech Giants",
        title_si: "AI ආරක්ෂක ගිවිසුම අත්සන් කර ඇත",
        excerpt: "Microsoft, Google, OpenAI புதிய வெளிப்படைத்தன்மை தரநிலைகளுக்கு ஒப்புக்கொண்டன.",
        excerpt_en: "Microsoft, Google, and OpenAI agree to new transparency standards and third-party auditing for large language models.",
        excerpt_si: "Microsoft, Google, OpenAI නව පාරදෘශ්‍යතා සම්මතවලට එකඟ විය.",
        content: "<p>Microsoft, Google, OpenAI புதிய வெளிப்படைத்தன்மை தரநிலைகளுக்கு ஒப்புக்கொண்டன. இந்த தன்னார்வ ஒப்பந்தம் AI உருவாக்கப்பட்ட உள்ளடக்கத்திற்கு வாட்டர்மார்க்கிங்கை அமைக்கிறது.</p>",
        content_en: "<p>Microsoft, Google, and OpenAI agree to new transparency standards. The voluntary pact sets benchmarks for watermarking AI-generated content.</p>",
        content_si: "<p>Microsoft, Google, OpenAI නව පාරදෘශ්‍යතා සම්මතවලට එකඟ විය. මෙම ස්වෙච්ඡා ගිවිසුම AI-ජනිත අන්තර්ගතයට වාටර්මාර්ක කිරීම සඳහා මානදණ්ඩ සකසයි.</p>",
        category: "தொழில்நுட்பம்", category_en: "Technology", category_si: "තාක්ෂණය",
        author: "சாரா மில்லர்", author_en: "Sarah Miller", author_si: "සාරා මිලර්",
        date: new Date(Date.now() - 3600000 * 8).toISOString(),
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
        video: "", featured: false, trending: true, status: "published"
    },
    {
        id: 1718764800004,
        title: "UN உச்சிமாநாட்டில் வரலாற்று சுற்றுச்சூழல் ஒப்பந்தம்",
        title_en: "Historic Climate Agreement Reached at UN Summit",
        title_si: "UN සමුළුවේදී ඓතිහාසික දේශගුණ ගිවිසුමක්",
        excerpt: "நாடுகள் 2030க்கான கட்டாய கார்பன் குறைப்பு இலக்குகளை ஏற்றுக்கொண்டன.",
        excerpt_en: "Nations commit to binding carbon reduction targets for 2030, with a new fund for developing nations.",
        excerpt_si: "රටවල් 2030 සඳහා බැඳීම් කාබන් අඩුකිරීමේ ඉලක්කවලට කැපවී ඇත.",
        content: "<p>நாடுகள் 2030க்கான கட்டாய கார்பன் குறைப்பு இலக்குகளை ஏற்றுக்கொண்டன. $100 பில்லியன் ஆண்டு காலநிலை நிதி தொகுப்பு வளரும் நாடுகளுக்கு ஆதரவளிக்கும்.</p>",
        content_en: "<p>Nations commit to binding carbon reduction targets for 2030. The $100 billion annual climate finance package will support renewable energy transitions in developing nations.</p>",
        content_si: "<p>රටවල් 2030 සඳහා බැඳීම් කාබන් අඩුකිරීමේ ඉලක්කවලට කැපවී ඇත. බිලියන 100ක වාර්ෂික දේශගුණ මූල්‍ය පැකේජය සංවර්ධනය වෙමින් පවතින රටවලට සහාය වේ.</p>",
        category: "உலகம்", category_en: "World", category_si: "ලෝකය",
        author: "டேவிட் ஓகோன்க்வோ", author_en: "David Okonkwo", author_si: "ඩේවිඩ් ඔකොන්ක්වෝ",
        date: new Date(Date.now() - 3600000 * 12).toISOString(),
        image: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800&auto=format&fit=crop",
        video: "", featured: false, trending: true, status: "published"
    },
    {
        id: 1718764800005,
        title: "புரட்சிகரமான பேட்டரி தொழில்நுட்பம் EV வரம்பை மடங்காக்குகிறது",
        title_en: "Revolutionary Battery Tech Triples EV Range",
        title_si: "විප්ලවීය බැටරි තාක්ෂණය EV පරාසය තෙගුණු කරයි",
        excerpt: "MIT ஆராய்ச்சியாளர்கள் EV பயமின்மையை நீக்கும் திண்மநிலை பேட்டரி முன்மாதிரியை அறிமுகப்படுத்தினர்.",
        excerpt_en: "Researchers at MIT unveil a solid-state battery prototype that could eliminate range anxiety for electric vehicles.",
        excerpt_si: "MIT පරියේෂකයන් විද්‍යුත් වාහනවලට පරාස ආතතිය ඉවත් කළ හැකි ඝන තත්ත්ව බැටරි මුල් ආදර්ශයක් හෙළිදරව් කළහ.",
        content: "<p>MIT ஆராய்ச்சியாளர்கள் EV பயமின்மையை நீக்கும் திண்மநிலை பேட்டரி முன்மாதிரியை அறிமுகப்படுத்தினர். இது 1,200 Wh/L ஆற்றல் அடர்த்தியை அடைகிறது.</p>",
        content_en: "<p>Researchers at MIT unveil a solid-state battery prototype. The lithium-metal design achieves 1,200 Wh/L energy density, roughly three times that of current Tesla batteries.</p>",
        content_si: "<p>MIT පරියේෂකයන් ඝන තත්ත්ව බැටරි මුල් ආදර්ශයක් හෙළිදරව් කළහ. ලිතියම්-ලෝහ නිර්මාණය 1,200 Wh/L බලශක්ති ඝනත්වයට ළඟා වේ.</p>",
        category: "தொழில்நுட்பம்", category_en: "Technology", category_si: "තාක්ෂණය",
        author: "பிரியா படேல்", author_en: "Priya Patel", author_si: "ප්‍රියා පටෙල්",
        date: new Date(Date.now() - 3600000 * 14).toISOString(),
        image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop",
        video: "", featured: false, trending: false, status: "published"
    },
    {
        id: 1718764800006,
        title: "ஒலிம்பிக் 2026: நிலையான மைதானங்கள் அறிமுகம்",
        title_en: "Olympics 2026: Sustainable Stadiums Unveiled",
        title_si: "ඔලිම්පික් 2026: තිරසාර ක්‍රීඩාංගණ හෙළිදරව් විය",
        excerpt: "மிலான்-கோர்டினா குழு முழுக்க முழுக்க புதுப்பிக்கத்தக்க ஆற்றல் மூலங்களால் இயக்கப்படும் பூஜ்ஜிய உமிழ்வு மைதானங்களை வெளியிட்டது.",
        excerpt_en: "The Milan-Cortina committee reveals zero-emission venues powered entirely by renewable energy sources.",
        excerpt_si: "මිලානෝ-කෝර්ටිනා කමිටුව සම්පූර්ණයෙන්ම පුනර්ජන්‍ය බලශක්ති මූලාශ්‍ර මගින් බලගැන්වූ බුද්ධිමත් විමෝචන ශාලා හෙළිදරව් කරයි.",
        content: "<p>மிலான்-கோர்டினா குழு முழுக்க முழுக்க புதுப்பிக்கத்தக்க ஆற்றல் மூலங்களால் இயக்கப்படும் பூஜ்ஜிய உமிழ்வு மைதானங்களை வெளியிட்டது. ஒலிம்பிக் கிராமம் விளையாட்டுக்குப் பிறகு மலிவு வீடுகளாக மாற்றப்படும்.</p>",
        content_en: "<p>The Milan-Cortina committee reveals zero-emission venues powered entirely by renewable energy sources. The Olympic Village will be converted into affordable housing after the Games.</p>",
        content_si: "<p>මිලානෝ-කෝර්ටිනා කමිටුව පුනර්ජන්‍ය බලශක්ති මූලාශ්‍ර මගින් බලගැන්වූ බුද්ධිමත් විමෝචන ශාලා හෙළිදරව් කරයි. ඔලිම්පික් ගම්මිරිස් ක්‍රීඩාවෙන් පසු මිලට ගත හැකි නවාතැන් බවට පරිවර්තනය කරනු ලැබේ.</p>",
        category: "விளையாட்டு", category_en: "Sports", category_si: "ක්‍රීඩා",
        author: "மார்க்கோ ரோஸி", author_en: "Marco Rossi", author_si: "මාර්කෝ රොසි",
        date: new Date(Date.now() - 3600000 * 18).toISOString(),
        image: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800&auto=format&fit=crop",
        video: "", featured: false, trending: true, status: "published"
    },
    {
        id: 1718764800007,
        title: "புதிய மலேரியா தடுப்பூசி 90% பயன்திறனைக் காட்டுகிறது",
        title_en: "New Malaria Vaccine Shows 90% Efficacy in Trials",
        title_si: "නව මැලේරියා එන්නත් සාම්පලවලදී 90% ක්‍රියාකාරිත්වය පෙන්වයි",
        excerpt: "WHO கட்டம் III சோதனை முடிவுகளை ஒட்டுண்ணி நோய்க்கு எதிரான போராட்டத்தில் திருப்புமுனையாக பாராட்டியது.",
        excerpt_en: "The WHO hails the Phase III trial results as a potential turning point in the fight against mosquito-borne disease.",
        excerpt_si: "WHO මදුරුවන් මගින් spreading රෝගයට එරෙහි සටනේ හැරවුම් ලක්ෂ්‍යක් ලෙස අදියර III සාම්පල ප්‍රතිඵල ප්‍රශංසා කළේය.",
        content: "<p>WHO கட்டம் III சோதனை முடிவுகளை ஒட்டுண்ணி நோய்க்கு எதிரான போராட்டத்தில் திருப்புமுனையாக பாராட்டியது. R21/Matrix-M தடுப்பூசி 90% பாதுகாப்பை வழங்கியது.</p>",
        content_en: "<p>The WHO hails the Phase III trial results. The R21/Matrix-M vaccine demonstrated 90% protection in children aged 5–36 months across four African countries.</p>",
        content_si: "<p>WHO අදියර III සාම්පල ප්‍රතිඵල ප්‍රශංසා කළේය. R21/Matrix-M එන්නත් අප්‍රිකානු රටවල් හතරක 5-36 මාස වයසේ දරුවන්ට 90% ආරක්ෂාව සපයන ලදී.</p>",
        category: "அறிவியல்", category_en: "Science", category_si: "විද්‍යාව",
        author: "அமரா ஓகாஃபோர்", author_en: "Amara Okafor", author_si: "අමාරා ඔකාෆෝර්",
        date: new Date(Date.now() - 3600000 * 22).toISOString(),
        image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&auto=format&fit=crop",
        video: "", featured: false, trending: false, status: "published"
    },
    {
        id: 1718764800008,
        title: "மத்திய வங்கிகள் டிஜிட்டல் நாணய கட்டமைப்பை ஒருங்கிணைக்கின்றன",
        title_en: "Central Banks Coordinate on Digital Currency Framework",
        title_si: "මධ්‍යම බැංකු ඩිජිටල් මුදල් රාමුව එකට සකසති",
        excerpt: "BIS குறுக்கு-எல்லை CBDC பரிவர்த்தனைகளுக்கு ஒருங்கிணைந்த நெறிமுறையை அறிவித்தது.",
        excerpt_en: "The BIS announces a unified protocol for cross-border CBDC transactions to reduce remittance costs.",
        excerpt_si: "BIS මායිම් තරණ CBDC ගනුදෙනු සඳහා ඒකීය ප්‍රොටෝකෝලයක් නිවේදනය කළේය.",
        content: "<p>BIS குறுக்கு-எல்லை CBDC பரிவர்த்தனைகளுக்கு ஒருங்கிணைந்த நெறிமுறையை அறிவித்தது. Project Unified Ledger வைப்-இல்லா பணம் அனுப்புவதற்கான கட்டணங்களை 80% வரை குறைக்கும்.</p>",
        content_en: "<p>The BIS announces a unified protocol for cross-border CBDC transactions. Project Unified Ledger will allow instant settlement between central bank digital currencies, cutting transfer fees by up to 80%.</p>",
        content_si: "<p>BIS මායිම් තරණ CBDC ගනුදෙනු සඳහා ඒකීය ප්‍රොටෝකෝලයක් නිවේදනය කළේය. Project Unified Ledger මධ්‍යම බැංකු ඩිජිටල් මුදල් අතර ක්ෂණික සෙට්ල්මන්ට් පහසු කරයි.</p>",
        category: "வணிகம்", category_en: "Business", category_si: "ව්‍යාපාර",
        author: "தாமஸ் வெபர்", author_en: "Thomas Weber", author_si: "තෝමස් වෙබර්",
        date: new Date(Date.now() - 3600000 * 26).toISOString(),
        image: "https://images.unsplash.com/photo-1526304640152-d4619684e484?w=800&auto=format&fit=crop",
        video: "", featured: false, trending: false, status: "published"
    },  
    {
        id: 1718764800009,
        title: "கடலடி தொல்லியலாளர்கள் பழங்கால கப்பலைக் கண்டுபிடித்தனர்",
        title_en: "Underwater Archaeologists Discover Ancient Shipwreck",
        title_si: "දිය යට පුරාවිද්‍යාඥයන් පුරාණ නැව් අනතුරක් සොයාගෙන ඇත",
        excerpt: "கிரீஸ் கடலோரத்தில் கண்டுபிடிக்கப்பட்ட 2,000 வயது ரோமானிய வணிக கப்பல் சிறப்பாக பாதுகாக்கப்பட்ட பானைகளைக் கொண்டுள்ளது.",
        excerpt_en: "A 2,000-year-old Roman trading vessel found off the coast of Greece contains perfectly preserved amphorae.",
        excerpt_si: "ග්‍රීසියේ වෙරළබඩින් සොයාගත් වසර 2000ක් පැරණි රෝමානු වෙළඳ නැව සම්පූර්ණයෙන්ම සුරකුණු ඇම්ෆෝරා ඇතුළත් වේ.",
        content: "<p>கிரீஸ் கடலோரத்தில் கண்டுபிடிக்கப்பட்ட 2,000 வயது ரோமானிய வணிக கப்பல் சிறப்பாக பாதுகாக்கப்பட்ட பானைகளைக் கொண்டுள்ளது. இந்த கப்பல் கிரேதாவின் மது, ஸ்பெயினின் ஒலிவ எண்ணெய், சிரியாவின் கண்ணாடி பொருட்களை ஏற்றிச் சென்றது.</p>",
        content_en: "<p>A 2,000-year-old Roman trading vessel found off the coast of Greece contains perfectly preserved amphorae. The cargo included wine from Crete, olive oil from Spain, and glassware from Syria.</p>",
        content_si: "<p>ග්‍රීසියේ වෙරළබඩින් සොයාගත් වසර 2000ක් පැරණි රෝමානු වෙළඳ නැව සම්පූර්ණයෙන්ම සුරකුණු ඇම්ෆෝරා ඇතුළත් වේ. බඩු තොගයට ක්‍රීට් වල මුද්‍රිත පානය, ස්පාඤ්ඤයේ ඔලිව් තෙල් සහ සිරියාවේ වීදුරු භාණ්ඩ ඇතුළත් විය.</p>",
        category: "உலகம்", category_en: "World", category_si: "ලෝකය",
        author: "சோஃபியா அந்தோனெல்லி", author_en: "Sophia Antonelli", author_si: "සොෆියා ඇන්ටොනෙල්ලි",
        date: new Date(Date.now() - 3600000 * 30).toISOString(),
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
        video: "", featured: false, trending: false, status: "published"
    },
    {
        id: 1718764800010,
        title: "F1 2026 இயந்திர விதிமுறைகளை அறிவித்தது",
        title_en: "Formula 1 Announces 2026 Engine Regulations",
        title_si: "ෆෝමියුලා 1 2026 එන්ජින් නියමයන් නිවේදනය කරයි",
        excerpt: "FIA 100% நிலையான எரிபொருட்களுக்கு மாறுவதையும் 2026 சீசனுக்கான சிறிய, திறமையான பவர் யூனிட்களையும் உறுதி செய்தது.",
        excerpt_en: "The FIA confirms a move to 100% sustainable fuels and smaller, more efficient power units for the 2026 season.",
        excerpt_si: "FIA 2026 සමය සඳහා 100% තිරසාර ඉන්ධන වෙත මාරුව තහවුරු කරයි.",
        content: "<p>FIA 100% நிலையான எரிபொருட்களுக்கு மாறுவதையும் 2026 சீசனுக்கான சிறிய, திறமையான பவர் யூனிட்களையும் உறுதி செய்தது. இயந்திரங்கள் 50% குறைந்த சக்தியை உற்பத்தி செய்யும்.</p>",
        content_en: "<p>The FIA confirms a move to 100% sustainable fuels and smaller, more efficient power units for the 2026 season. The new engines will produce 50% less power but feature active aerodynamics and manual override systems.</p>",
        content_si: "<p>FIA 2026 සමය සඳහා 100% තිරසාර ඉන්ධන වෙත මාරුව තහවුරු කරයි. නව එන්ජින් 50% අඩු බලයක් නිපදවන නමුත් ක්‍රියාකාරී වායුගතික සහ අත්පොත නැවත ලිවීමේ පද්ධති ඇතුළත් වේ.</p>",
        category: "விளையாட்டு", category_en: "Sports", category_si: "ක්‍රීඩා",
        author: "லூயிஸ் ஹாமில்டன்", author_en: "Lewis Hamilton", author_si: "ලුවිස් හැමිල්ටන්",
        date: new Date(Date.now() - 3600000 * 34).toISOString(),
        image: "https://images.unsplash.com/photo-1541447270888-83e8494f9c08?w=800&auto=format&fit=crop",
        video: "", featured: false, trending: true, status: "published"
    }
];

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
    { id: "world", name: "உலகம்", name_en: "World", name_si: "ලෝකය", count: 2 },
    { id: "technology", name: "தொழில்நுட்பம்", name_en: "Technology", name_si: "තාක්ෂණය", count: 2 },
    { id: "business", name: "வணிகம்", name_en: "Business", name_si: "ව්‍යාපාර", count: 2 },
    { id: "science", name: "அறிவியல்", name_en: "Science", name_si: "විද්‍යාව", count: 2 },
    { id: "sports", name: "விளையாட்டு", name_en: "Sports", name_si: "ක්‍රීඩා", count: 2 },
    { id: "health", name: "சுகாதாரம்", name_en: "Health", name_si: "සෞඛ්‍යය", count: 0 }
];

// ── STRICT: Auto-clean garbage posts from localStorage on every load ──
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

// Load and clean data with retry for mobile new-tab contexts
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

var rawNews = getNewsFromStorage() || DEFAULT_NEWS;
var cleanedNews = rawNews.filter(function(n) { return !isGarbagePost(n); });
if (cleanedNews.length < rawNews.length) {
    localStorage.setItem('endless_news', JSON.stringify(cleanedNews));
    console.log('Auto-removed ' + (rawNews.length - cleanedNews.length) + ' garbage post(s)');
}

window.newsData = cleanedNews.length > 0 ? cleanedNews : DEFAULT_NEWS;
let adsData = JSON.parse(localStorage.getItem('endless_ads')) || DEFAULT_ADS;
let categoriesData = JSON.parse(localStorage.getItem('endless_categories')) || DEFAULT_CATEGORIES;
let currentFilter = 'All';
let searchQuery = '';
let displayedCount = isMobile ? 4 : 6;

/* ─── HELPERS ─── */
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

/* ─── RENDER FUNCTIONS ─── */
function renderHero() {
    // CRITICAL FIX: Reload from localStorage to get latest data
    var localNews = getNewsFromStorage();
    if (localNews && localNews.length > 0) {
        newsData = localNews.filter(function(n) { return !isGarbagePost(n); });
    }
    
    const featured = newsData.filter(n => n.featured && n.status === 'published' && !isGarbagePost(n)).slice(0, 3);
    if (featured.length === 0) return;

    const main = featured[0];
    const side = featured.slice(1, 3);

    const heroSection = document.getElementById('hero-section');
    if (!heroSection) return;

    heroSection.innerHTML = `
        <div class="hero-main" onclick="openArticle(${main.id})">
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
                <div class="hero-card" onclick="openArticle(${item.id})">
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
    // CRITICAL FIX: Reload from localStorage every time to get latest data
    var localNews = getNewsFromStorage();
    if (localNews && localNews.length > 0) {
        newsData = localNews.filter(function(n) { return !isGarbagePost(n); });
    }
    
    // STRICT: Filter out garbage posts before rendering
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
        grid.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:2rem; grid-column:1/-1;">${TRANSLATIONS[currentLang].no_results}</p>`;
        document.getElementById('load-more-wrap').style.display = 'none';
        return;
    }

    grid.innerHTML = toShow.map(item => `
        <article class="article-card" onclick="openArticle(${item.id})" data-article-id="${item.id}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(getLocalized(item, 'title'))}" loading="lazy">
            <div class="card-body">
                <div class="meta">
                    <span class="cat">${escapeHtml(getLocalized(item, 'category'))}</span>
                    <span>${formatDate(item.date)}</span>
                </div>
                <h3>${escapeHtml(getLocalized(item, 'title'))}</h3>
                <p>${escapeHtml(getLocalized(item, 'excerpt'))}</p>
            </div>
        </article>
    `).join('');

    // Add share buttons to article cards
    setTimeout(function() {
        grid.querySelectorAll('.article-card').forEach(function(card) {
            var articleId = card.dataset.articleId;
            if (articleId) {
                addShareToArticleCard(card, articleId);
            }
        });
    }, 10);

    document.getElementById('load-more-wrap').style.display = filtered.length > displayedCount ? 'block' : 'none';
}

function renderTrending() {
    // CRITICAL FIX: Reload from localStorage to get latest data
    var localNews = getNewsFromStorage();
    if (localNews && localNews.length > 0) {
        newsData = localNews.filter(function(n) { return !isGarbagePost(n); });
    }
    
    const trending = newsData.filter(n => n.trending && n.status === 'published' && !isGarbagePost(n)).slice(0, 5);
    const list = document.getElementById('trending-list');
    if (!list) return;

    list.innerHTML = trending.map((item, i) => `
        <div class="trending-item" onclick="openArticle(${item.id})">
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
    // CRITICAL FIX: Reload from localStorage to get latest data
    var localNews = getNewsFromStorage();
    if (localNews && localNews.length > 0) {
        newsData = localNews.filter(function(n) { return !isGarbagePost(n); });
    }
    
    const breaking = newsData.filter(n => n.status === 'published' && !isGarbagePost(n)).slice(0, 8);
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;

    ticker.innerHTML = breaking.map(n => `
        <span class="ticker-item">${escapeHtml(getLocalized(n, 'title'))}</span>
    `).join('');
}

/* ─── ARTICLE MODAL ─── */
function openArticle(id) {
    // CRITICAL FIX: Reload from localStorage to get latest data
    var localNews = getNewsFromStorage();
    if (localNews && localNews.length > 0) {
        newsData = localNews.filter(function(n) { return !isGarbagePost(n); });
    }
    
    const article = newsData.find(n => n.id === id);
    if (!article || isGarbagePost(article)) return;

    const modal = document.getElementById('article-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    // Process content to ensure proper paragraph spacing
    let processedContent = getLocalized(article, 'content') || '';

    // If content has <br> tags but no <p> tags, convert <br><br> or multiple <br> to paragraphs
    if (!processedContent.includes('<p>') && processedContent.includes('<br')) {
        const parts = processedContent.split(/<br\s*\/?>\s*<br\s*\/?>/);
        processedContent = parts.map(part => {
            const cleanPart = part.replace(/<br\s*\/?>/g, ' ').trim();
            return cleanPart ? `<p>${cleanPart}</p>` : '';
        }).join('');
    }

    // If content has no HTML tags at all, split by newlines and wrap in <p> tags
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
                <div class="article-text">
                    ${processedContent}
                </div>
                ${article.video ? `<video controls style="width:100%; margin-top:1rem; border-radius:8px;" preload="none"><source src="${escapeHtml(article.video)}"></video>` : ''}
            </div>
        </div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Add share button to modal
    setTimeout(function() {
        addShareToModal(id);
    }, 100);

    // Add swipe to close on mobile
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

    // Remove touch listeners
    modal.removeEventListener('touchstart', handleTouchStart);
    modal.removeEventListener('touchend', handleTouchEnd);
}

function handleTouchStart(e) {
    touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e) {
    const touchEndY = e.changedTouches[0].screenY;
    const diff = touchStartY - touchEndY;

    // Swipe down to close (only if at top of scroll)
    if (diff < -80) {
        const modalBody = document.querySelector('.modal-content');
        if (modalBody && modalBody.scrollTop <= 10) {
            closeModal();
        }
    }
}

/* ─── FILTER & SEARCH ─── */
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

    // Smooth scroll to feed
    const feedSection = document.querySelector('.main-layout');
    if (feedSection) {
        const offset = feedSection.offsetTop - 80;
        window.scrollTo({ top: offset, behavior: 'smooth' });
    }
}

/* ─── MOBILE MENU ─── */
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

/* ─── THEME MANAGEMENT ─── */
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

/* ─── HEADER SCROLL EFFECT ─── */
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

/* ─── RESIZE HANDLER ─── */
function handleResize() {
    const newIsMobile = window.innerWidth < 640;
    if (newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        displayedCount = isMobile ? 4 : 6;
        renderFeed();
        renderHero();
    }
}

/* ─── LAZY LOADING OBSERVER ─── */
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllNewsData();
    // Set current year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Set current date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', dateOptions);
    }

    // Initialize theme
    initTheme();

    // Language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    // Navigation links
    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            filterCategory(link.dataset.cat);
            closeMobileMenu();
        });
    });

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            searchQuery = e.target.value;
            displayedCount = isMobile ? 4 : 6;
            renderFeed();
        }, 300));
    }

    // Load more
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            displayedCount += isMobile ? 4 : 6;
            renderFeed();
        });
    }

    // Modal close
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

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMobile = document.getElementById('close-mobile');
    const mobileOverlay = document.getElementById('mobile-overlay');

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
    if (closeMobile) closeMobile.addEventListener('click', closeMobileMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Scroll events
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                handleHeaderScroll();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    // Resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Initial render
    setLanguage(currentLang);
    renderHero();
    renderFeed();
    renderTrending();
    renderCategories();
    renderAds();
    renderTicker();

    // Initialize lazy loading
    setTimeout(initLazyLoading, 100);
});

/* ─── DEBOUNCE UTILITY ─── */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* ─── PERFORMANCE: Preload critical resources ─── */
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        // Preload next batch of images
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach((img, index) => {
            if (index < 6) {
                img.loading = 'eager';
            }
        });
    });
}


/* ═══════════════════════════════════════
   SOCIAL SHARE SYSTEM
   ═══════════════════════════════════════ */

function addShareToArticleCard(articleCard, articleId) {
    if (!articleCard) return;
    const cardBody = articleCard.querySelector('.card-body');
    if (!cardBody) return;
    if (cardBody.querySelector('.article-share-btn')) return;

    const shareBtn = document.createElement('button');
    shareBtn.className = 'article-share-btn';
    shareBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.875rem;
        background: linear-gradient(135deg, var(--primary, #e11d48), var(--primary-hover, #be123c));
        color: #fff;
        border: none;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 3px 12px rgba(225, 29, 72, 0.25);
        margin-top: 0.5rem;
        font-family: inherit;
    `;
    
    const shareText = TRANSLATIONS[currentLang].share_article || 'Share';
    
    shareBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        ${shareText}
    `;
    shareBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (typeof openShareOverlay === 'function') {
            openShareOverlay(articleId);
        }
    });
    cardBody.appendChild(shareBtn);
}

function addShareToModal(articleId) {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;
    const modalArticleBody = modalBody.querySelector('.modal-article .modal-body');
    if (!modalArticleBody) return;
    if (modalArticleBody.querySelector('.modal-share-section')) return;

    const shareText = TRANSLATIONS[currentLang].share_this_article || 'Share this article';
    const btnText = TRANSLATIONS[currentLang].share_article || 'Share';

    const shareSection = document.createElement('div');
    shareSection.className = 'modal-share-section';
    shareSection.style.cssText = `
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 2px solid var(--border, #e5e7eb);
        text-align: center;
    `;
    shareSection.innerHTML = `
        <p style="font-size: 0.85rem; color: var(--text-muted, #6b7280); margin-bottom: 0.75rem; font-weight: 600;">
            📢 ${shareText}
        </p>
        <button class="article-share-btn" style="
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.65rem 1.5rem;
            background: linear-gradient(135deg, var(--primary, #e11d48), var(--primary-hover, #be123c));
            color: #fff;
            border: none;
            border-radius: 999px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(225, 29, 72, 0.3);
            font-family: inherit;
        ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            ${btnText}
        </button>
    `;
    const btn = shareSection.querySelector('.article-share-btn');
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof openShareOverlay === 'function') {
                openShareOverlay(articleId);
            }
        });
    }
    modalArticleBody.appendChild(shareSection);
}