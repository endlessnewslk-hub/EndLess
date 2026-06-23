/* ═══════════════════════════════════════
   ENDLESS — ADMIN PANEL LOGIC (Cleaned & Fixed)
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

// ── Admin Password (for reset protection) ──
const ADMIN_PASSWORD = "6402@Faizan";

// ── Default Data ──
const DEFAULT_NEWS = [
    {
        id: 1718764800001,
        title: "உலக சந்தைகள் புதிய உச்சத்தை எட்டின",
        title_en: "Global Markets Rally as Inflation Data Shows Unexpected Cooling",
        title_si: "ලෝක වෙළඳපොළවල් උත්සාහයෙන් ඉහළට",
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
        content: "<p>Falcon Heavy 24 முன்னணி தகவல்தொடர்பு செயற்கைக்கோள்களை சுற்றுப்பாதையில் ஏவியது. இந்த செயற்கைக்கோள்கள் லேசர் இணைப்புகளைக் கொண்டுள்ளன.</p>",
        content_en: "<p>The Falcon Heavy carried 24 advanced communications satellites into orbit. Each satellite is equipped with laser interlinks that allow data to travel at the speed of light.</p>",
        content_si: "<p>Falcon Heavy චන්ද්‍රිකා 24ක් කක්ෂයට රැගෙන ගියේය. එක් එක් චන්ද්‍රිකාව ලේසර් අන්තර්සම්බන්ධතා සහිතව සම්පූර්ණ කර ඇත.</p>",
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
        content: "<p>MIT ஆராய்ச்சியாளர்கள் EV பயமின்மையை நீக்கும் திண்மநிலை பேட்டரி முன்மாதிரியை அறிமுகப்படுத்தினர். இது 1,200 Wh/L ஆற்றல் அடர்த்தியை அடைகிறது.</p>",
        content_en: "<p>Researchers at MIT unveil a solid-state battery prototype. The lithium-metal design achieves 1,200 Wh/L energy density, roughly three times that of current Tesla batteries.</p>",
        content_si: "<p>MIT පර්යේෂකයන් ඝන තත්ත්ව බැටරි මුල් ආදර්ශයක් හෙළිදරව් කළහ. ලිතියම්-ලෝහ නිර්මාණය 1,200 Wh/L බලශක්ති ඝනත්වයට ළඟා වේ.</p>",
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
        content: "<p>மிலான்-கோர்டினா குழு முழுக்க முழுக்க புதுப்பிக்கத்தக்க ஆற்றல் மூலங்களால் இயக்கப்படும் பூஜ்ஜிய உமிழ்வு மைதானங்களை வெளியிட்டது. ஒலிம்பிக் கிராமம் விளையாட்டுக்குப் பிறகு மலிவு வீடுகளாக மாற்றப்படும்.</p>",
        content_en: "<p>The Milan-Cortina committee reveals zero-emission venues powered entirely by renewable energy sources. The Olympic Village will be converted into affordable housing after the Games.</p>",
        content_si: "<p>මිලානෝ-කෝර්ටිනා කමිටුව පුනර්ජනනීය බලශක්ති මූලාශ්‍ර මගින් බලගැන්වූ බුද්ධිමත් විමෝචන ශාලා හෙළිදරව් කරයි. ඔලිම්පික් ගම්මිරිස් ක්‍රීඩාවෙන් පසු මිලට ගත හැකි නවාතැන් බවට පරිවර්තනය කරනු ලැබේ.</p>",
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

// ── Data Initialization ──
async function initData() {
    adminNews = JSON.parse(localStorage.getItem('endless_news')) || [];
    adminAds = JSON.parse(localStorage.getItem('endless_ads')) || [];
    adminCats = JSON.parse(localStorage.getItem('endless_categories')) || [];

    if (adminNews.length === 0) {
        adminNews = [...DEFAULT_NEWS];
        saveNews();
    }
    if (adminAds.length === 0) {
        adminAds = [...DEFAULT_ADS];
        saveAds();
    }
    if (adminCats.length === 0) {
        adminCats = [...DEFAULT_CATEGORIES];
        saveCats();
    }

    // Update category counts from actual news data
    updateCategoryCounts();

    if (db) {
        try {
            await syncFromFirebase();
        } catch (err) {
            console.warn('Firebase sync failed, using localStorage:', err);
        }
    }
}

// ── Update Category Counts from News Data ──
function updateCategoryCounts() {
    adminCats.forEach(cat => {
        const count = adminNews.filter(n => 
            n.status === 'published' && 
            (n.category === cat.name || n.category_en === cat.name_en || n.category_si === cat.name_si)
        ).length;
        cat.count = count;
    });
    saveCats();
}

// ── Firebase Sync ──
async function syncFromFirebase() {
    if (!db) return;

    try {
        const newsSnapshot = await db.collection('news').get();
        if (!newsSnapshot.empty) {
            adminNews = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem('endless_news', JSON.stringify(adminNews));
        }

        const adsSnapshot = await db.collection('ads').get();
        if (!adsSnapshot.empty) {
            adminAds = adsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem('endless_ads', JSON.stringify(adminAds));
        }

        const catsSnapshot = await db.collection('categories').get();
        if (!catsSnapshot.empty) {
            adminCats = catsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem('endless_categories', JSON.stringify(adminCats));
        }

        updateCategoryCounts();
    } catch (error) {
        console.error('Firebase read error:', error);
        throw error;
    }
}

// ── Local Storage Save ──
function saveNews() { 
    localStorage.setItem('endless_news', JSON.stringify(adminNews)); 
}
function saveAds() { 
    localStorage.setItem('endless_ads', JSON.stringify(adminAds)); 
}
function saveCats() { 
    localStorage.setItem('endless_categories', JSON.stringify(adminCats)); 
}

// ── Toast ──
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Mobile Sidebar ──
function toggleSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const mobileBtn = document.getElementById('mobile-menu-btn');

    const isOpen = sidebar.classList.contains('open');

    if (isOpen) {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        if (mobileBtn) mobileBtn.classList.remove('open');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('open');
        if (mobileBtn) mobileBtn.classList.add('open');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const mobileBtn = document.getElementById('mobile-menu-btn');

    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    if (mobileBtn) mobileBtn.classList.remove('open');
}

// ── Page Navigation ──
function showPage(page) {
    currentPage = page;
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);

    if (page === 'dashboard') renderDashboard();
    if (page === 'news') renderNewsTable();
    if (page === 'ads') renderAdsTable();
    if (page === 'categories') renderCategoriesTable();

    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

// ── Language Tab Switching ──
function switchNewsLang(lang) {
    currentNewsLang = lang;
    document.querySelectorAll('.lang-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === lang);
    });
    document.querySelectorAll('.lang-input').forEach(inp => {
        inp.style.display = inp.id.endsWith(`-${lang}`) ? 'block' : 'none';
    });
    document.querySelectorAll('.lang-textarea').forEach(ta => {
        ta.style.display = ta.id.endsWith(`-${lang}`) ? 'block' : 'none';
    });
}

// ── HTML Escape ──
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ── Dashboard Renderer ──
function renderDashboard() {
    const published = adminNews.filter(n => n.status === 'published');

    const statTotalNews = document.getElementById('stat-total-news');
    const statPublished = document.getElementById('stat-published');
    const statActiveAds = document.getElementById('stat-active-ads');
    const statCategories = document.getElementById('stat-categories');
    const recentNewsTable = document.getElementById('recent-news-table');
    const recentAdsTable = document.getElementById('recent-ads-table');

    if (statTotalNews) statTotalNews.textContent = adminNews.length;
    if (statPublished) statPublished.textContent = published.length;
    if (statActiveAds) statActiveAds.textContent = adminAds.filter(a => a.active).length;
    if (statCategories) statCategories.textContent = adminCats.length;

    if (recentNewsTable) {
        recentNewsTable.innerHTML = published.slice(0, 5).map(n => `
            <tr>
                <td>${escapeHtml(n.title_en || n.title)}</td>
                <td>${escapeHtml(n.category_en || n.category)}</td>
                <td>${new Date(n.date).toLocaleDateString()}</td>
                <td><span class="badge badge-green">Published</span></td>
            </tr>
        `).join('');
    }

    if (recentAdsTable) {
        recentAdsTable.innerHTML = adminAds.filter(a => a.active).slice(0, 5).map(a => `
            <tr>
                <td>${escapeHtml(a.title_en || a.title)}</td>
                <td>${escapeHtml(a.position)}</td>
                <td><span class="badge badge-green">Active</span></td>
            </tr>
        `).join('');
    }
}

// ── News Table Renderer ──
function renderNewsTable() {
    const tbody = document.getElementById('news-table-body');
    if (!tbody) return;

    const searchInput = document.getElementById('news-search');
    const search = searchInput ? searchInput.value.toLowerCase() : '';

    let filtered = adminNews;
    if (search) {
        filtered = adminNews.filter(n =>
            (n.title && n.title.toLowerCase().includes(search)) ||
            (n.title_en && n.title_en.toLowerCase().includes(search)) ||
            (n.title_si && n.title_si.toLowerCase().includes(search))
        );
    }

    tbody.innerHTML = filtered.map(n => {
        const langs = [];
        if (n.title) langs.push('<span class="badge badge-lang">TA</span>');
        if (n.title_en) langs.push('<span class="badge badge-lang">EN</span>');
        if (n.title_si) langs.push('<span class="badge badge-lang">SI</span>');
        const dateStr = n.date ? new Date(n.date).toLocaleDateString() : 'N/A';
        return `
        <tr>
            <td><img src="${escapeHtml(n.image || '')}" alt="" onerror="this.src='https://via.placeholder.com/60x40?text=No+Image'"></td>
            <td><strong>${escapeHtml(n.title_en || n.title || '')}</strong><br><small style="color:#6b7280;">${escapeHtml(n.title || '')}</small></td>
            <td>${escapeHtml(n.category_en || n.category || '')}</td>
            <td>${escapeHtml(n.author_en || n.author || '')}</td>
            <td>${dateStr}</td>
            <td>${langs.join('')}</td>
            <td><span class="badge ${n.status === 'published' ? 'badge-green' : 'badge-gray'}">${n.status || 'draft'}</span></td>
            <td>
                <button class="btn-icon btn-edit" onclick="editNews(${n.id})">&#9999;&#65039;</button>
                <button class="btn-icon btn-delete" onclick="deleteNews(${n.id})">&#128465;&#65039;</button>
            </td>
        </tr>
    `}).join('');
}

// ── Ads Table Renderer ──
function renderAdsTable() {
    const tbody = document.getElementById('ads-table-body');
    if (!tbody) return;

    tbody.innerHTML = adminAds.map(a => `
        <tr>
            <td><img src="${escapeHtml(a.image || '')}" alt="" style="width:80px; height:50px; object-fit:cover; border-radius:4px;" onerror="this.style.display='none'"></td>
            <td><strong>${escapeHtml(a.title_en || a.title || '')}</strong><br><small style="color:#6b7280;">${escapeHtml(a.title || '')}</small></td>
            <td>${escapeHtml(a.position || '')}</td>
            <td><a href="${escapeHtml(a.link || '#')}" target="_blank" style="color:#2563eb;">${escapeHtml((a.link || '').substring(0, 30))}...</a></td>
            <td><span class="badge ${a.active ? 'badge-green' : 'badge-gray'}">${a.active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn-icon btn-edit" onclick="editAd(${a.id})">&#9999;&#65039;</button>
                <button class="btn-icon btn-delete" onclick="deleteAd(${a.id})">&#128465;&#65039;</button>
            </td>
        </tr>
    `).join('');
}

// ── Categories Table Renderer ──
function renderCategoriesTable() {
    // Update counts before rendering
    updateCategoryCounts();

    const tbody = document.getElementById('categories-table-body');
    if (!tbody) return;

    tbody.innerHTML = adminCats.map(c => `
        <tr>
            <td><strong>${escapeHtml(c.name_en || '')}</strong><br><small style="color:#6b7280;">${escapeHtml(c.name || '')} / ${escapeHtml(c.name_si || '')}</small></td>
            <td>${c.count}</td>
            <td>
                <button class="btn-icon btn-delete" onclick="deleteCategory('${escapeHtml(c.id || '')}')">&#128465;&#65039;</button>
            </td>
        </tr>
    `).join('');
}

// ═══════════════════════════════════════
// NEWS MODAL
// ═══════════════════════════════════════
function openNewsModal(isEdit = false) {
    const modal = document.getElementById('news-modal');
    const modalTitle = document.getElementById('news-modal-title');
    const catSelect = document.getElementById('news-category');

    if (modal) modal.classList.add('open');
    if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Article' : 'Add Article';

    if (catSelect) {
        catSelect.innerHTML = adminCats.map(c => `<option value="${escapeHtml(c.name_en || '')}">${escapeHtml(c.name_en || '')}</option>`).join('');
    }

    if (!isEdit) {
        editingNewsId = null;
        const newsIdInput = document.getElementById('news-id');
        if (newsIdInput) newsIdInput.value = '';

        ['ta','en','si'].forEach(lang => {
            const titleInp = document.getElementById(`news-title-${lang}`);
            const authorInp = document.getElementById(`news-author-${lang}`);
            const contentTa = document.getElementById(`news-content-${lang}`);

            if (titleInp) titleInp.value = '';
            if (authorInp) authorInp.value = '';
            if (contentTa) contentTa.value = '';
        });

        const imageUrl = document.getElementById('news-image-url');
        const photoData = document.getElementById('news-photo-data');
        const videoData = document.getElementById('news-video-data');
        const photoPreview = document.getElementById('news-photo-preview');
        const videoPreview = document.getElementById('news-video-preview');
        const featured = document.getElementById('news-featured');
        const trending = document.getElementById('news-trending');
        const status = document.getElementById('news-status');

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
    const modal = document.getElementById('news-modal');
    if (modal) modal.classList.remove('open'); 
}

function editNews(id) {
    const news = adminNews.find(n => n.id === id);
    if (!news) return;

    editingNewsId = id;
    openNewsModal(true);

    const newsIdInput = document.getElementById('news-id');
    const catSelect = document.getElementById('news-category');

    if (newsIdInput) newsIdInput.value = news.id;
    if (catSelect) catSelect.value = news.category_en || news.category || '';

    const fields = {
        'news-title': ['title', 'title_en', 'title_si'],
        'news-author': ['author', 'author_en', 'author_si'],
        'news-content': ['content', 'content_en', 'content_si']
    };

    ['ta', 'en', 'si'].forEach((lang, idx) => {
        Object.entries(fields).forEach(([prefix, keys]) => {
            const el = document.getElementById(`${prefix}-${lang}`);
            if (el) el.value = news[keys[idx]] || '';
        });
    });

    const imageUrl = document.getElementById('news-image-url');
    const featured = document.getElementById('news-featured');
    const trending = document.getElementById('news-trending');
    const status = document.getElementById('news-status');
    const photoPreview = document.getElementById('news-photo-preview');
    const videoPreview = document.getElementById('news-video-preview');

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
    const catSelect = document.getElementById('news-category');
    const category = catSelect ? catSelect.value : '';
    const catObj = adminCats.find(c => c.name_en === category);

    const title_ta = document.getElementById('news-title-ta')?.value.trim() || '';
    const title_en = document.getElementById('news-title-en')?.value.trim() || '';
    const title_si = document.getElementById('news-title-si')?.value.trim() || '';

    const author_ta = document.getElementById('news-author-ta')?.value.trim() || '';
    const author_en = document.getElementById('news-author-en')?.value.trim() || '';
    const author_si = document.getElementById('news-author-si')?.value.trim() || '';

    const content_ta = document.getElementById('news-content-ta')?.value.trim() || '';
    const content_en = document.getElementById('news-content-en')?.value.trim() || '';
    const content_si = document.getElementById('news-content-si')?.value.trim() || '';

    const imageUrl = document.getElementById('news-image-url')?.value.trim() || '';
    const photoData = document.getElementById('news-photo-data')?.value || '';
    const videoData = document.getElementById('news-video-data')?.value || '';
    const featured = document.getElementById('news-featured')?.checked || false;
    const trending = document.getElementById('news-trending')?.checked || false;
    const status = document.getElementById('news-status')?.checked ? 'published' : 'draft';

    if (!title_ta || !category || !author_ta || !content_ta) {
        showToast('Please fill all required Tamil fields', 'error');
        switchNewsLang('ta');
        return;
    }

    const newsItem = {
        id: editingNewsId || Date.now(),
        title: title_ta,
        title_en: title_en || title_ta,
        title_si: title_si || title_ta,
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
        const idx = adminNews.findIndex(n => n.id === editingNewsId);
        if (idx !== -1) adminNews[idx] = { ...adminNews[idx], ...newsItem, id: editingNewsId };
    } else {
        adminNews.unshift(newsItem);
    }

    saveNews();
    updateCategoryCounts();

    if (db) {
        try {
            await db.collection('news').doc(String(newsItem.id)).set(newsItem);
        } catch (err) {
            console.warn('Firebase sync failed:', err);
        }
    }

    closeNewsModal();
    renderNewsTable();
    renderDashboard();

    const missing = [];
    if (!title_en) missing.push('English');
    if (!title_si) missing.push('Sinhala');
    if (missing.length > 0 && !editingNewsId) {
        showToast(`Article saved! Note: Missing ${missing.join(', ')} title - filled with Tamil`);
    } else {
        showToast(editingNewsId ? 'Article updated!' : 'Article published!');
    }
}

async function deleteNews(id) {
    if (!confirm('Delete this article?')) return;
    adminNews = adminNews.filter(n => n.id !== id);
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
function openAdModal(isEdit = false) {
    const modal = document.getElementById('ad-modal');
    const modalTitle = document.getElementById('ad-modal-title');

    if (modal) modal.classList.add('open');
    if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Advertisement' : 'Add Advertisement';

    if (!isEdit) {
        editingAdId = null;
        const adId = document.getElementById('ad-id');
        const titleTa = document.getElementById('ad-title-ta');
        const titleEn = document.getElementById('ad-title-en');
        const titleSi = document.getElementById('ad-title-si');
        const link = document.getElementById('ad-link');
        const position = document.getElementById('ad-position');
        const image = document.getElementById('ad-image');
        const imagePreview = document.getElementById('ad-image-preview');
        const active = document.getElementById('ad-active');

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
    const modal = document.getElementById('ad-modal');
    if (modal) modal.classList.remove('open'); 
}

function editAd(id) {
    const ad = adminAds.find(a => a.id === id);
    if (!ad) return;

    editingAdId = id;
    openAdModal(true);

    const adId = document.getElementById('ad-id');
    const titleTa = document.getElementById('ad-title-ta');
    const titleEn = document.getElementById('ad-title-en');
    const titleSi = document.getElementById('ad-title-si');
    const link = document.getElementById('ad-link');
    const position = document.getElementById('ad-position');
    const image = document.getElementById('ad-image');
    const active = document.getElementById('ad-active');
    const imagePreview = document.getElementById('ad-image-preview');

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
    const title_ta = document.getElementById('ad-title-ta')?.value.trim() || '';
    const title_en = document.getElementById('ad-title-en')?.value.trim() || '';
    const title_si = document.getElementById('ad-title-si')?.value.trim() || '';
    const link = document.getElementById('ad-link')?.value.trim() || '';
    const position = document.getElementById('ad-position')?.value || 'header';
    const image = document.getElementById('ad-image')?.value.trim() || 'https://via.placeholder.com/600x200?text=Ad';
    const active = document.getElementById('ad-active')?.checked || false;

    if (!title_ta || !link) { 
        showToast('Please fill Tamil title and link', 'error'); 
        return; 
    }

    const adItem = {
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
        const idx = adminAds.findIndex(a => a.id === editingAdId);
        if (idx !== -1) adminAds[idx] = { ...adminAds[idx], ...adItem, id: editingAdId };
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
    adminAds = adminAds.filter(a => a.id !== id);
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
    const modal = document.getElementById('cat-modal');
    if (modal) modal.classList.add('open');

    const nameTa = document.getElementById('cat-name-ta');
    const nameEn = document.getElementById('cat-name-en');
    const nameSi = document.getElementById('cat-name-si');

    if (nameTa) nameTa.value = '';
    if (nameEn) nameEn.value = '';
    if (nameSi) nameSi.value = '';
}

function closeCatModal() { 
    const modal = document.getElementById('cat-modal');
    if (modal) modal.classList.remove('open'); 
}

async function saveCategory() {
    const name_ta = document.getElementById('cat-name-ta')?.value.trim() || '';
    const name_en = document.getElementById('cat-name-en')?.value.trim() || '';
    const name_si = document.getElementById('cat-name-si')?.value.trim() || '';

    if (!name_en) { 
        showToast('English category name is required', 'error'); 
        return; 
    }

    const id = name_en.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const catItem = {
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
    adminCats = adminCats.filter(c => c.id !== id);
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
function handleFileUpload(inputId, previewId, dataId, type = 'image') {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const dataInput = document.getElementById(dataId);

    if (!input) return;

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (dataInput) dataInput.value = event.target.result;
            if (preview) {
                preview.src = event.target.result;
                preview.style.display = 'block';
            }
        };
        reader.onerror = () => showToast('File read failed', 'error');
        reader.readAsDataURL(file);
    });

    const uploadArea = input.closest('.upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            uploadArea.style.borderColor = 'var(--admin-primary)'; 
        });
        uploadArea.addEventListener('dragleave', () => { 
            uploadArea.style.borderColor = '#d1d5db'; 
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#d1d5db';
            const files = e.dataTransfer.files;
            if (files.length > 0) { 
                input.files = files; 
                input.dispatchEvent(new Event('change')); 
            }
        });
    }
}

// ═══════════════════════════════════════
// RESET DATA (Password Protected)
// ═══════════════════════════════════════
async function resetData() {
    const passwordInput = document.getElementById('reset-password');
    const enteredPassword = passwordInput ? passwordInput.value.trim() : '';

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

    adminNews = [...DEFAULT_NEWS];
    adminAds = [...DEFAULT_ADS];
    adminCats = [...DEFAULT_CATEGORIES];

    saveNews(); saveAds(); saveCats();

    if (db) {
        try {
            const batch = db.batch();
            adminNews.forEach(n => batch.set(db.collection('news').doc(String(n.id)), n));
            adminAds.forEach(a => batch.set(db.collection('ads').doc(String(a.id)), a));
            adminCats.forEach(c => batch.set(db.collection('categories').doc(String(c.id)), c));
            await batch.commit();
        } catch (err) {
            console.warn('Firebase batch write failed:', err);
        }
    }

    if (passwordInput) passwordInput.value = '';

    renderDashboard(); renderNewsTable(); renderAdsTable(); renderCategoriesTable();
    showToast('Data reset to defaults');
}

// ═══════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initData();

    // Mobile sidebar toggles
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const headerMenuBtn = document.getElementById('header-menu-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
    if (headerMenuBtn) headerMenuBtn.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => showPage(btn.dataset.page));
    });

    // News Modal
    const btnAddNews = document.getElementById('btn-add-news');
    const closeNewsModalBtn = document.getElementById('close-news-modal');
    const cancelNews = document.getElementById('cancel-news');
    const saveNewsBtn = document.getElementById('save-news');

    if (btnAddNews) btnAddNews.addEventListener('click', () => openNewsModal());
    if (closeNewsModalBtn) closeNewsModalBtn.addEventListener('click', closeNewsModal);
    if (cancelNews) cancelNews.addEventListener('click', closeNewsModal);
    if (saveNewsBtn) saveNewsBtn.addEventListener('click', saveNewsItem);

    // Language tabs
    document.querySelectorAll('.lang-tab').forEach(tab => {
        tab.addEventListener('click', () => switchNewsLang(tab.dataset.lang));
    });

    // Ad Modal
    const btnAddAd = document.getElementById('btn-add-ad');
    const closeAdModalBtn = document.getElementById('close-ad-modal');
    const cancelAd = document.getElementById('cancel-ad');
    const saveAdBtn = document.getElementById('save-ad');

    if (btnAddAd) btnAddAd.addEventListener('click', () => openAdModal());
    if (closeAdModalBtn) closeAdModalBtn.addEventListener('click', closeAdModal);
    if (cancelAd) cancelAd.addEventListener('click', closeAdModal);
    if (saveAdBtn) saveAdBtn.addEventListener('click', saveAdItem);

    // Category Modal
    const btnAddCat = document.getElementById('btn-add-cat');
    const closeCatModalBtn = document.getElementById('close-cat-modal');
    const cancelCat = document.getElementById('cancel-cat');
    const saveCatBtn = document.getElementById('save-cat');

    if (btnAddCat) btnAddCat.addEventListener('click', openCatModal);
    if (closeCatModalBtn) closeCatModalBtn.addEventListener('click', closeCatModal);
    if (cancelCat) cancelCat.addEventListener('click', closeCatModal);
    if (saveCatBtn) saveCatBtn.addEventListener('click', saveCategory);

    // File uploads
    handleFileUpload('news-photo-file', 'news-photo-preview', 'news-photo-data', 'image');
    handleFileUpload('news-video-file', 'news-video-preview', 'news-video-data', 'video');

    // Ad image file upload
    const adImageFile = document.getElementById('ad-image-file');
    if (adImageFile) {
        adImageFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const adImage = document.getElementById('ad-image');
                const adImagePreview = document.getElementById('ad-image-preview');
                if (adImage) adImage.value = event.target.result;
                if (adImagePreview) {
                    adImagePreview.src = event.target.result;
                    adImagePreview.style.display = 'block';
                }
            };
            reader.onerror = () => showToast('Image upload failed', 'error');
            reader.readAsDataURL(file);
        });
    }

    // Search
    const newsSearch = document.getElementById('news-search');
    if (newsSearch) newsSearch.addEventListener('input', renderNewsTable);

    // Settings - Reset Data (Password Protected)
    const btnResetData = document.getElementById('btn-reset-data');
    if (btnResetData) btnResetData.addEventListener('click', resetData);

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    renderDashboard();
});