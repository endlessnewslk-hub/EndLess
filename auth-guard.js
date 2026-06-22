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
    loginPage: 'login.html',
    // Admin page URL
    adminPage: 'admin.html',
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
 * Main authentication check - runs on every page load
 */
function checkAuthentication() {
    const session = verifySession();

    if (!session) {
        console.warn('🔒 Auth Guard: No valid session found');
        redirectToLogin('session_expired');
        return false;
    }

    // Verify with Firebase if available
    if (guardAuth) {
        guardAuth.onAuthStateChanged((user) => {
            if (!user) {
                console.warn('🔒 Auth Guard: Firebase user not found');
                clearAllSessions();
                redirectToLogin('auth_required');
                return;
            }

            // Check authorization
            if (!isAuthorized(user.email)) {
                console.warn('🔒 Auth Guard: Unauthorized email', user.email);
                clearAllSessions();
                redirectToLogin('unauthorized');
                return;
            }

            currentUser = user;
            console.log('🔒 Auth Guard: User authenticated', user.email);

            // Update UI with user info
            updateUserUI(user);
        });
    } else {
        // Fallback: trust session storage if Firebase not available
        if (!isAuthorized(session.email)) {
            clearAllSessions();
            redirectToLogin('unauthorized');
            return false;
        }
        currentUser = session;
        updateUserUI(session);
    }

    return true;
}

/**
 * Redirect to login page with reason
 * @param {string} reason - Redirect reason code
 */
function redirectToLogin(reason) {
    const params = new URLSearchParams();
    params.set('reason', reason);
    params.set('redirect', encodeURIComponent(window.location.href));

    // Show brief message before redirect
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
            padding: 2rem;
        ">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🔒</div>
            <h2 style="margin-bottom: 0.5rem;">Access Denied</h2>
            <p style="color: #a0a0b8; margin-bottom: 2rem;">
                ${getReasonMessage(reason)}
            </p>
            <p style="color: #6b6b8a; font-size: 0.875rem;">Redirecting to login...</p>
        </div>
    `;

    setTimeout(() => {
        window.location.href = `${SESSION_CONFIG.loginPage}?${params.toString()}`;
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

// ═══════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════

/**
 * Clear all authentication data
 */
function clearAllSessions() {
    sessionStorage.removeItem('endless_auth_session');
    localStorage.removeItem('endless_auth_persistent');

    // Also clear any other auth-related data
    sessionStorage.removeItem('endless_theme');

    // Sign out from Firebase
    if (guardAuth) {
        guardAuth.signOut().catch(err => console.warn('Sign out error:', err));
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

    // Check session validity periodically
    sessionCheckInterval = setInterval(() => {
        const session = verifySession();
        if (!session) {
            console.warn('🔒 Auth Guard: Session expired during monitoring');
            clearAllSessions();
            redirectToLogin('session_expired');
        }
    }, SESSION_CONFIG.checkInterval);

    // Refresh session on user activity
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
        document.addEventListener(event, debounce(refreshSession, 60000), { passive: true });
    });
}

/**
 * Debounce helper
 */
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

// ═══════════════════════════════════════════════════════
// LOGOUT FUNCTIONALITY
// ═══════════════════════════════════════════════════════

/**
 * Sign out user and redirect to login
 * @param {string} reason - Optional logout reason
 */
async function logout(reason = 'logged_out') {
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
    document.querySelectorAll('input[type="email"], input[type="password"]').forEach(input => {
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
    window.location.replace(`${SESSION_CONFIG.loginPage}?${params.toString()}`);
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
function showLoadingOverlay(message = 'Loading...') {
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
    // Update admin header user display
    const userDisplay = document.querySelector('.admin-user span');
    if (userDisplay && user.email) {
        const displayName = user.displayName || user.email.split('@')[0];
        userDisplay.innerHTML = `👤 <strong>${displayName}</strong> <small style="color:#9ca3af;">(${user.email})</small>`;
    }

    // Add logout button to sidebar if not exists
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav && !document.getElementById('guard-logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'guard-logout-btn';
        logoutBtn.className = 'nav-item';
        logoutBtn.style.cssText = 'color: #ef4444; margin-top: auto; border-left-color: #ef4444;';
        logoutBtn.innerHTML = '<span>🚪</span> Sign Out';
        logoutBtn.onclick = () => logout();

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

    // Warn before leaving with unsaved changes (optional)
    window.onbeforeunload = function(e) {
        // Only warn if there are unsaved changes
        // Return undefined to allow navigation without warning
        return undefined;
    };

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
window.currentUser = currentUser;