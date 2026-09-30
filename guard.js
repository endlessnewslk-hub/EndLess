/* ═══════════════════════════════════════════════════════
   ENDLESS — AUTH GUARD (Security Lock System)
   Place this script at the TOP of your admin.js file
   or include it before admin.js in your HTML.

   This module protects ALL admin pages by:
   - Checking authentication status on page load
   - Redirecting unauthenticated users to login
   - Auto-logout on session expiry
   - Providing logout functionality
   ═══════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════
// FIREBASE CONFIGURATION (Same as login.js)
// ═══════════════════════════════════════════════════════
const GUARD_CONFIG = {
    apiKey: "AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA",
    authDomain: "endless-news.firebaseapp.com",
    projectId: "endless-news",
    storageBucket: "endless-news.firebasestorage.app",
    messagingSenderId: "363216005373",
    appId: "1:363216005373:web:143fb950fb04dfc1cb7694"
};

// ═══════════════════════════════════════════════════════
// SESSION CONFIGURATION
// ═══════════════════════════════════════════════════════
const SESSION_CONFIG = {
    // Session timeout in hours
    timeout: 24,
    // Check interval in milliseconds (every 30 seconds)
    checkInterval: 30000,
    // Login page URL
    loginPage: 'x7k9m2.html',
    // Admin page URL
    adminPage: 'news88-adm.html',
    // Allowed admin emails (whitelist)
    allowedEmails: ['endlessnewslk@gmail.com']
};

// ═══════════════════════════════════════════════════════
// AUTH GUARD STATE
// ═══════════════════════════════════════════════════════
let guardAuth = null;
let guardApp = null;
let sessionCheckInterval = null;
let currentUser = null;
let authCheckComplete = false;

// ═══════════════════════════════════════════════════════
// INITIALIZE FIREBASE AUTH (if not already initialized)
// ═══════════════════════════════════════════════════════
function initGuardAuth() {
    try {
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                guardApp = firebase.initializeApp(GUARD_CONFIG);
            } else {
                guardApp = firebase.app();
            }
            guardAuth = firebase.auth();
            console.log('🔒 Auth Guard: Firebase initialized');
            return true;
        }
    } catch (err) {
        console.error('🔒 Auth Guard: Firebase init failed', err);
    }
    return false;
}

// ═══════════════════════════════════════════════════════
// CHECK AUTHENTICATION STATUS
// ═══════════════════════════════════════════════════════

/**
 * Verify if user has a valid session
 * @returns {object|null} - Session data or null
 */
function verifySession() {
    // Check session storage first
    const session = sessionStorage.getItem('endless_auth_session');
    if (session) {
        try {
            const data = JSON.parse(session);
            if (Date.now() < data.expiresAt) {
                return data;
            }
            sessionStorage.removeItem('endless_auth_session');
        } catch (e) {
            sessionStorage.removeItem('endless_auth_session');
        }
    }

    // Check localStorage (remember me)
    const persistent = localStorage.getItem('endless_auth_persistent');
    if (persistent) {
        try {
            const data = JSON.parse(persistent);
            if (Date.now() < data.expiresAt) {
                // Restore session
                sessionStorage.setItem('endless_auth_session', JSON.stringify(data));
                return data;
            }
            localStorage.removeItem('endless_auth_persistent');
        } catch (e) {
            localStorage.removeItem('endless_auth_persistent');
        }
    }

    return null;
}

/**
 * Check if user is authorized (email whitelist)
 * @param {string} email - User email
 * @returns {boolean} - True if authorized
 */
function isAuthorized(email) {
    if (!email) return false;
    return SESSION_CONFIG.allowedEmails.includes(email.toLowerCase());
}

/**
 * Show access denied screen and redirect
 */
function showAccessDenied(reason) {
    // Hide the admin dashboard content immediately
    const dashboard = document.getElementById('admin-dashboard');
    if (dashboard) {
        dashboard.style.display = 'none';
    }

    // Show redirect message
    const body = document.body;
    body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #0f0f1a;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 2rem 1rem;
        ">
            <div style="font-size: 4rem; margin-bottom: 1rem; animation: pulse 2s infinite;">🔒</div>
            <h2 style="margin-bottom: 0.5rem; font-size: 1.5rem;">Access Denied</h2>
            <p style="color: #a0a0b8; margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.5;">
                ${getReasonMessage(reason)}
            </p>
            <div style="
                width: 40px;
                height: 40px;
                border: 3px solid rgba(220, 38, 38, 0.2);
                border-top-color: #dc2626;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            "></div>
            <p style="color: #6b6b8a; font-size: 0.875rem;">Redirecting to login...</p>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            </style>
        </div>
    `;

    setTimeout(function() {
        window.location.replace(SESSION_CONFIG.loginPage + '?reason=' + reason + '&_t=' + Date.now());
    }, 2000);
}

/**
 * Get human-readable reason message
 * @param {string} reason - Reason code
 * @returns {string} - Human-readable message
 */
function getReasonMessage(reason) {
    const messages = {
        'session_expired': 'Your session has expired. Please sign in again.',
        'auth_required': 'Authentication required. Please sign in to continue.',
        'unauthorized': 'You do not have permission to access this page.',
        'logged_out': 'You have been signed out successfully.',
        'password_changed': 'Password changed. Please sign in again.',
        'security_logout': 'You have been logged out for security reasons.'
    };
    return messages[reason] || 'Please sign in to continue.';
}

/**
 * Main authentication check - runs on every page load
 * SYNCHRONOUS check first, then async Firebase verification
 */
function checkAuthentication() {
    // 🔒 HARDENED: localStorage sessions are UX hints ONLY — never identity proof.
    // The ONLY gate is Firebase Auth (server-verified by Security Rules too).
    // STEP 1: Firebase Auth state — the single source of truth
    if (guardAuth) {
        guardAuth.onAuthStateChanged(function(user) {

            if (!user) {
                console.warn('🔒 Auth Guard: Firebase user not found');
                clearAllSessions();
                showAccessDenied('auth_required');
                return;
            }

            // Check authorization
            if (!isAuthorized(user.email)) {
                console.warn('🔒 Auth Guard: Unauthorized email', user.email);
                clearAllSessions();
                showAccessDenied('unauthorized');
                return;
            }

            currentUser = user;
            console.log('🔒 Auth Guard: Firebase user authenticated', user.email);
            updateUserUI(user);

            // Show dashboard now that auth is confirmed
            const dashboard = document.getElementById('admin-dashboard');
            if (dashboard) {
                dashboard.style.display = '';
                dashboard.classList.add('auth-verified');
            }

            // Remove loading overlay
            const loadingOverlay = document.getElementById('auth-loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }

            // Trigger initData if not already done
            if (typeof initData === 'function' && !window.dataInitialized) {
                initData();
            }
        });
    } else {
        // 🔒 HARDENED: Firebase unavailable → DENY. A forged localStorage
        // session must NEVER open the admin panel.
        console.error('🔒 Auth Guard: Firebase SDK unavailable — access denied');
        showAccessDenied('auth_required');
    }

    return true;
}

// ═══════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════

/**
 * Clear all authentication data
 */
function clearAllSessions() {
    sessionStorage.removeItem('endless_auth_session');
    localStorage.removeItem('endless_auth_persistent');
    sessionStorage.removeItem('endless_theme');

    // Also clear any other auth-related data
    if (guardAuth) {
        guardAuth.signOut().catch(function(err) { console.warn('Sign out error:', err); });
    }

    currentUser = null;
}

/**
 * Refresh session expiry time
 */
function refreshSession() {
    const session = verifySession();
    if (session) {
        session.expiresAt = Date.now() + (SESSION_CONFIG.timeout * 3600000);
        sessionStorage.setItem('endless_auth_session', JSON.stringify(session));

        // Also update persistent if exists
        const persistent = localStorage.getItem('endless_auth_persistent');
        if (persistent) {
            const data = JSON.parse(persistent);
            data.expiresAt = Date.now() + (30 * 86400000); // 30 days for remember me
            localStorage.setItem('endless_auth_persistent', JSON.stringify(data));
        }
    }
}

/**
 * Start session monitoring
 */
function startSessionMonitor() {
    // Clear any existing interval
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
    }

    // 🔥 FIXED: Monitor FIREBASE AUTH STATE (not sessionStorage).
    // Mobile Chrome kills background tabs & clears sessionStorage → old monitor
    // falsely kicked users out. Firebase Auth persists in IndexedDB, survives
    // tab kills, and auto-refreshes tokens — the ONLY real source of truth.
    // Forced logout now happens ONLY on true sign-out.
    sessionCheckInterval = setInterval(function() {
        if (!guardAuth) return;
        guardAuth.currentUser ? null : (function() {
            console.warn('🔒 Auth Guard: Firebase user signed out — redirecting');
            clearAllSessions();
            showAccessDenied('session_expired');
        })();
    }, SESSION_CONFIG.checkInterval);

    // Refresh session on user activity
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(function(event) {
        document.addEventListener(event, debounce(refreshSession, 60000), { passive: true });
    });
}

/**
 * Debounce helper
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
        const args = arguments;
        const later = function() {
            clearTimeout(timeout);
            func.apply(null, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ═══════════════════════════════════════════════════════
// LOGOUT FUNCTIONALITY
// ═══════════════════════════════════════════════════════

/**
 * Sign out user and redirect to login
 * @param {string} reason - Optional logout reason
 */
async function logout(reason) {
    reason = reason || 'logged_out';
    showLoadingOverlay('Signing out...');

    try {
        // Sign out from Firebase
        if (guardAuth) {
            await guardAuth.signOut();
        }
    } catch (err) {
        console.warn('Firebase sign out error:', err);
    }

    // Clear ALL sessions and stored data
    clearAllSessions();

    // STRICT: Prevent browser from saving form data
    document.querySelectorAll('input[type="email"], input[type="password"]').forEach(function(input) {
        input.value = '';
        input.autocomplete = 'off';
    });

    // Clear browser history to prevent back button
    if (window.history && window.history.pushState) {
        window.history.pushState(null, '', window.location.href);
    }

    // Redirect to login with cache buster (prevents back button showing cached page)
    const params = new URLSearchParams();
    params.set('reason', reason);
    params.set('_t', Date.now());
    window.location.replace(SESSION_CONFIG.loginPage + '?' + params.toString());
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
function showLoadingOverlay(message) {
    message = message || 'Loading...';
    const existing = document.getElementById('guard-loading-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'guard-loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(15, 15, 26, 0.95);
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    overlay.innerHTML = `
        <div style="
            width: 50px;
            height: 50px;
            border: 3px solid rgba(220, 38, 38, 0.2);
            border-top-color: #dc2626;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <p style="color: #a0a0b8;">${message}</p>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    `;
    document.body.appendChild(overlay);
}

// ═══════════════════════════════════════════════════════
// UI UPDATES
// ═══════════════════════════════════════════════════════

/**
 * Update admin UI with current user info
 * @param {object} user - User object
 */
function updateUserUI(user) {
    // 🎨 GOOGLE-STYLE PROFILE MENU — compact E logo + "EndLess" in header,
    // click → premium dropdown card (photo, name, email, actions)
    const userBox = document.querySelector('.admin-user');
    if (userBox && user.email && !document.getElementById('profile-btn')) {
        const displayName = user.displayName || user.email.split('@')[0];
        const photo = user.photoURL || '';
        var avatarHtml;
        if (photo) {
            avatarHtml = '<img src="' + photo + '" alt="" style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:2px solid #dc2626;">';
        } else {
            avatarHtml = '<span style="display:inline-flex;width:30px;height:30px;background:linear-gradient(135deg,#e11d48,#be123c);border-radius:9px;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:900;font-size:16px;color:#fff;box-shadow:0 2px 8px rgba(225,29,72,0.4);">E</span>';
        }

        // Compact header button
        userBox.innerHTML =
            '<button id="profile-btn" style="display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;border:1.5px solid #e5e7eb;border-radius:999px;background:#fff;cursor:pointer;transition:all .2s;max-width:190px;overflow:hidden;" title="Account">' +
            avatarHtml +
            '<span style="font-weight:700;font-size:0.9rem;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + displayName + '</span>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5" style="width:12px;height:12px;flex-shrink:0;"><polyline points="6 9 12 15 18 9"/></svg>' +
            '</button>';

        // Dropdown card (Google style)
        var card = document.createElement('div');
        card.id = 'profile-card';
        card.style.cssText = 'display:none;position:fixed;top:64px;right:16px;width:300px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.15);z-index:99999;overflow:hidden;font-family:inherit;';
        card.innerHTML =
            '<div style="padding:22px 20px 16px;text-align:center;border-bottom:1px solid #f3f4f6;">' +
                '<div style="margin-bottom:12px;">' +
                    (photo
                        ? '<img src="' + photo + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid #dc2626;">'
                        : '<span style="display:inline-flex;width:64px;height:64px;background:linear-gradient(135deg,#e11d48,#be123c);border-radius:18px;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:900;font-size:32px;color:#fff;box-shadow:0 6px 18px rgba(225,29,72,0.35);">E</span>') +
                '</div>' +
                '<div style="font-size:1.05rem;font-weight:700;color:#111827;">' + displayName + '</div>' +
                '<div style="font-size:0.8rem;color:#6b7280;margin-top:2px;">' + user.email + '</div>' +
                '<div style="margin-top:6px;"><span style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:0.65rem;font-weight:700;padding:2px 10px;border-radius:999px;letter-spacing:0.05em;">ADMINISTRATOR</span></div>' +
            '</div>' +
            '<div style="padding:8px;">' +
                '<a href="index.html" target="_blank" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;color:#374151;text-decoration:none;font-size:0.88rem;font-weight:600;transition:background .15s;">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
                    'View Main Website</a>' +
                '<button id="pc-signout" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:none;border-radius:10px;background:none;color:#dc2626;font-size:0.88rem;font-weight:600;cursor:pointer;text-align:left;transition:background .15s;">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
                    'Sign Out</button>' +
            '</div>';
        document.body.appendChild(card);

        // Hover effects (clean, no inline handlers)
        card.querySelectorAll('a,button').forEach(function(el) {
            el.addEventListener('mouseenter', function() { this.style.background = this.id === 'pc-signout' ? '#fef2f2' : '#f9fafb'; });
            el.addEventListener('mouseleave', function() { this.style.background = ''; });
        });
        // Toggle
        var btn = document.getElementById('profile-btn');
        btn.addEventListener('click', function(ev) {
            ev.stopPropagation();
            card.style.display = card.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', function(ev) {
            if (card.style.display === 'block' && !card.contains(ev.target)) {
                card.style.display = 'none';
            }
        });
        document.getElementById('pc-signout').addEventListener('click', function() {
            if (typeof logout === 'function') logout();
        });
        // Header box sizing
        userBox.style.display = 'flex';
        userBox.style.alignItems = 'center';
        userBox.style.maxWidth = '200px';
    }

    // Add logout button to sidebar if not exists
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav && !document.getElementById('guard-logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'guard-logout-btn';
        logoutBtn.className = 'nav-item';
        logoutBtn.style.cssText = 'color: #ef4444; margin-top: auto; border-left-color: #ef4444;';
        logoutBtn.innerHTML = '<span>🚪</span> Sign Out';
        logoutBtn.onclick = function() { logout(); };

        // Insert at the end of sidebar-nav
        sidebarNav.appendChild(logoutBtn);
    }

    // Also update the sidebar footer to show auth status
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'auth-status';
        statusDiv.style.cssText = 'font-size: 0.7rem; color: #10b981; text-align: center; padding: 0.5rem; border-top: 1px solid #374151; margin-top: 0.5rem;';
        statusDiv.innerHTML = '🟢 Secure Session Active';
        if (!document.getElementById('auth-status')) {
            sidebarFooter.appendChild(statusDiv);
        }
    }
}

// ═══════════════════════════════════════════════════════
// SECURITY HEADERS & PROTECTIONS
// ═══════════════════════════════════════════════════════

/**
 * Apply security protections
 */
function applySecurityProtections() {
    // Prevent back button after logout
    if (window.history && window.history.pushState) {
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = function() {
            window.history.pushState(null, null, window.location.href);
        };
    }

    // Disable right-click context menu (optional security measure)
    // document.addEventListener('contextmenu', e => e.preventDefault());
}

// ═══════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════

/**
 * Initialize Auth Guard
 * This runs immediately when the script loads
 */
(function initAuthGuard() {
    console.log('🔒 Auth Guard: Initializing...');

    // STRICT: If we're on the login page, don't run auth checks
    // Login page should always be accessible
    const currentPage = window.location.pathname.split('/').pop() || '';
    const isLoginPage = currentPage === 'x7k9m2.html' || currentPage === '' || currentPage === 'index.html';

    if (isLoginPage) {
        console.log('🔒 Auth Guard: Login page detected, skipping auth check');
        return;
    }

    // Initialize Firebase
    initGuardAuth();

    // Check authentication
    const isAuth = checkAuthentication();

    if (isAuth) {
        // Start session monitoring
        startSessionMonitor();

        // Apply security protections
        applySecurityProtections();

        console.log('🔒 Auth Guard: Active and monitoring');
    }
})();

// ═══════════════════════════════════════════════════════
// EXPORTS (Global)
// ═══════════════════════════════════════════════════════
window.logout = logout;
window.checkAuthentication = checkAuthentication;
window.refreshSession = refreshSession;
Object.defineProperty(window, 'currentUser', {
    get: function() { return currentUser; }
});     