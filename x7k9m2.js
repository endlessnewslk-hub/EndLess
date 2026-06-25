/* ═══════════════════════════════════════════════════════
   ENDLESS — PREMIUM LOGIN SYSTEM (Firebase Auth)
   Features: Login, Register, Forgot Password, Google Sign-In
   Security: Input validation, XSS protection, Rate limiting
   ═══════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════
// STEP 1: FIREBASE CONFIGURATION
// Replace these with your actual Firebase project credentials
// ═══════════════════════════════════════════════════════
const firebaseConfig = {
    apiKey: "AIzaSyDXcTKDUxqcwJ5g0spGM4PlDqKfKQX7nYA",
    authDomain: "endless-news.firebaseapp.com",
    projectId: "endless-news",
    storageBucket: "endless-news.firebasestorage.app",
    messagingSenderId: "363216005373",
    appId: "1:363216005373:web:143fb950fb04dfc1cb7694"
};

// ═══════════════════════════════════════════════════════
// STEP 2: INITIALIZE FIREBASE
// ═══════════════════════════════════════════════════════
let auth = null;
let app = null;

// Allowed admin emails
const ALLOWED_ADMIN_EMAILS = ['endlessnewslk@gmail.com'];

try {
    if (typeof firebase !== 'undefined') {
        // Initialize Firebase App (prevent duplicate initialization)
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }
        // Get Auth instance
        auth = firebase.auth();
        console.log('✅ Firebase Auth initialized successfully');
    } else {
        console.error('❌ Firebase SDK not loaded');
        showErrorModal('System Error', 'Firebase SDK failed to load. Please refresh the page.');
    }
} catch (err) {
    console.error('❌ Firebase initialization error:', err);
    showErrorModal('System Error', 'Failed to initialize authentication system.');
}

// ═══════════════════════════════════════════════════════
// STEP 3: DEFAULT CREDENTIALS (For First-Time Setup)
// These are pre-filled for convenience - REMOVE IN PRODUCTION
// ═══════════════════════════════════════════════════════
const DEFAULT_EMAIL = "endlessnewslk@gmail.com";
const DEFAULT_PASSWORD = "6402@Faizan";

// ═══════════════════════════════════════════════════════
// STEP 4: SECURITY CONFIGURATION
// ═══════════════════════════════════════════════════════
const SECURITY = {
    // Max login attempts before temporary lock
    maxAttempts: 5,
    // Lock duration in minutes
    lockDuration: 15,
    // Session timeout in hours (auto-logout)
    sessionTimeout: 24,
    // Remember me duration in days
    rememberMeDays: 30
};

// Track login attempts
let loginAttempts = parseInt(localStorage.getItem('login_attempts') || '0');
let lockTimer = null;

// ═══════════════════════════════════════════════════════
// STEP 5: DOM ELEMENT REFERENCES
// ═══════════════════════════════════════════════════════
const elements = {
    // Forms
    loginForm: document.getElementById('login-form'),
    forgotForm: document.getElementById('forgot-form'),

    // Input fields
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    resetEmail: document.getElementById('reset-email'),
    rememberMe: document.getElementById('remember-me'),

    // Error messages
    emailError: document.getElementById('email-error'),
    passwordError: document.getElementById('password-error'),
    resetEmailError: document.getElementById('reset-email-error'),

    // Buttons
    btnLogin: document.getElementById('btn-login'),
    btnReset: document.getElementById('btn-reset'),
    btnGoogle: document.getElementById('btn-google'),
    togglePassword: document.getElementById('toggle-password'),
    eyeIcon: document.getElementById('eye-icon'),

    // Cards
    loginCard: document.getElementById('login-card'),
    forgotCard: document.getElementById('forgot-card'),

    // Links
    forgotLink: document.getElementById('forgot-link'),
    backToLogin: document.getElementById('back-to-login'),

    // Modals
    successModal: document.getElementById('success-modal'),
    errorModal: document.getElementById('error-modal'),
    loadingOverlay: document.getElementById('loading-overlay'),

    // Modal content
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    errorModalTitle: document.getElementById('error-modal-title'),
    errorModalMessage: document.getElementById('error-modal-message'),
    btnModalOk: document.getElementById('btn-modal-ok'),
    btnErrorOk: document.getElementById('btn-error-ok'),

    // Theme
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),

    // Canvas
    canvas: document.getElementById('particles-canvas')
};

// ═══════════════════════════════════════════════════════
// STEP 6: INPUT VALIDATION HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Validate email format using regex
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { valid: boolean, message: string }
 */
function validatePassword(password) {
    if (!password || password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters' };
    }
    return { valid: true, message: '' };
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Raw input
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Clear all error messages
 */
function clearErrors() {
    elements.emailError.textContent = '';
    elements.passwordError.textContent = '';
    elements.resetEmailError.textContent = '';
    elements.email?.classList.remove('error');
    elements.password?.classList.remove('error');
    elements.resetEmail?.classList.remove('error');
}

/**
 * Show field error
 * @param {HTMLElement} field - Input field
 * @param {HTMLElement} errorEl - Error message element
 * @param {string} message - Error message
 */
function showFieldError(field, errorEl, message) {
    field.classList.add('error');
    errorEl.textContent = message;
    field.focus();
}

// ═══════════════════════════════════════════════════════
// STEP 7: UI STATE MANAGEMENT
// ═══════════════════════════════════════════════════════

/**
 * Show loading state on button
 * @param {HTMLElement} btn - Button element
 * @param {boolean} loading - Loading state
 */
function setButtonLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');

    if (loading) {
        btn.disabled = true;
        text.classList.add('hidden');
        loader.classList.remove('hidden');
    } else {
        btn.disabled = false;
        text.classList.remove('hidden');
        loader.classList.add('hidden');
    }
}

/**
 * Show full-screen loading overlay
 * @param {boolean} show - Show or hide
 */
function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('open');
    } else {
        elements.loadingOverlay.classList.remove('open');
    }
}

/**
 * Show success modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {function} callback - Optional callback on OK
 */
function showSuccessModal(title, message, callback) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.successModal.classList.add('open');

    elements.btnModalOk.onclick = () => {
        elements.successModal.classList.remove('open');
        if (callback) callback();
    };
}

/**
 * Show error modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 */
function showErrorModal(title, message) {
    elements.errorModalTitle.textContent = title;
    elements.errorModalMessage.textContent = message;
    elements.errorModal.classList.add('open');

    elements.btnErrorOk.onclick = () => {
        elements.errorModal.classList.remove('open');
    };
}

/**
 * Switch between login and forgot password cards
 * @param {string} view - 'login' or 'forgot'
 */
function switchView(view) {
    if (view === 'forgot') {
        elements.loginCard.classList.add('hidden');
        elements.forgotCard.classList.remove('hidden');
        elements.forgotCard.style.animation = 'fadeInUp 0.4s ease-out';
        elements.resetEmail?.focus();
    } else {
        elements.forgotCard.classList.add('hidden');
        elements.loginCard.classList.remove('hidden');
        elements.loginCard.style.animation = 'fadeInUp 0.4s ease-out';
        elements.email?.focus();
    }
    clearErrors();
}

// ═══════════════════════════════════════════════════════
// STEP 8: LOGIN ATTEMPT TRACKING (Rate Limiting)
// ═══════════════════════════════════════════════════════

/**
 * Check if account is temporarily locked
 * @returns {boolean} - True if locked
 */
function isAccountLocked() {
    const lockUntil = localStorage.getItem('lock_until');
    if (lockUntil) {
        const now = Date.now();
        if (now < parseInt(lockUntil)) {
            const remaining = Math.ceil((parseInt(lockUntil) - now) / 60000);
            showErrorModal(
                'Account Locked',
                `Too many failed attempts. Please try again in ${remaining} minute(s).`
            );
            return true;
        } else {
            // Lock expired, reset
            localStorage.removeItem('lock_until');
            localStorage.setItem('login_attempts', '0');
            loginAttempts = 0;
        }
    }
    return false;
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt() {
    loginAttempts++;
    localStorage.setItem('login_attempts', String(loginAttempts));

    if (loginAttempts >= SECURITY.maxAttempts) {
        const lockUntil = Date.now() + (SECURITY.lockDuration * 60000);
        localStorage.setItem('lock_until', String(lockUntil));
        showErrorModal(
            'Account Locked',
            `Too many failed attempts. Your account is locked for ${SECURITY.lockDuration} minutes.`
        );
    }
}

/**
 * Reset login attempts on successful login
 */
function resetAttempts() {
    localStorage.removeItem('login_attempts');
    localStorage.removeItem('lock_until');
    loginAttempts = 0;
}

// ═══════════════════════════════════════════════════════
// STEP 9: SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════

/**
 * Create authenticated session
 * @param {object} user - Firebase user object
 */
function createSession(user) {
    const session = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        loginTime: Date.now(),
        expiresAt: Date.now() + (SECURITY.sessionTimeout * 3600000)
    };

    // Store session
    sessionStorage.setItem('endless_auth_session', JSON.stringify(session));

    // If remember me is checked, also store in localStorage
    if (elements.rememberMe?.checked) {
        const persistent = {
            ...session,
            expiresAt: Date.now() + (SECURITY.rememberMeDays * 86400000)
        };
        localStorage.setItem('endless_auth_persistent', JSON.stringify(persistent));
    }

    resetAttempts();
}

/**
 * Check if user is already authenticated
 * @returns {boolean} - True if authenticated
 */
function checkExistingSession() {
    // Check session storage first (current session)
    const session = sessionStorage.getItem('endless_auth_session');
    if (session) {
        try {
            const data = JSON.parse(session);
            if (Date.now() < data.expiresAt) {
                return true;
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
                return true;
            }
            localStorage.removeItem('endless_auth_persistent');
        } catch (e) {
            localStorage.removeItem('endless_auth_persistent');
        }
    }

    return false;
}

/**
 * Redirect to admin panel
 */
function redirectToAdmin() {
    showLoading(true);
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 800);
}

// ═══════════════════════════════════════════════════════
// STEP 10: AUTHENTICATION FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function signInWithEmail(email, password) {
    if (!auth) {
        showErrorModal('System Error', 'Authentication service is not available.');
        return;
    }

    // Check rate limiting
    if (isAccountLocked()) return;

    setButtonLoading(elements.btnLogin, true);
    showLoading(true);

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // STRICT: Check if email is in allowed admin list
        if (!ALLOWED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            await auth.signOut();
            showErrorModal('Access Denied', 'This email is not authorized for admin access.');
            setButtonLoading(elements.btnLogin, false);
            showLoading(false);
            return;
        }

        // Create session
        createSession(user);

        // Show success and redirect
        showSuccessModal(
            'Welcome Back! 👋',
            `Successfully signed in as ${user.email}. Redirecting to admin panel...`,
            redirectToAdmin
        );

    } catch (error) {
        console.error('Login error:', error);
        recordFailedAttempt();

        // Handle specific Firebase errors
        let errorTitle = 'Login Failed';
        let errorMessage = 'An unexpected error occurred. Please try again.';

        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email format. Please check your email address.';
                showFieldError(elements.email, elements.emailError, errorMessage);
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled. Please contact support.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Please register first.';
                showFieldError(elements.email, elements.emailError, 'Email not registered');
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                showFieldError(elements.password, elements.passwordError, 'Invalid password');
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Invalid email or password. Please check your credentials.';
                break;
            default:
                errorMessage = error.message || 'Authentication failed. Please try again.';
        }

        showErrorModal(errorTitle, errorMessage);
    } finally {
        setButtonLoading(elements.btnLogin, false);
        showLoading(false);
    }
}

/**
 * Sign in with Google
 */
async function signInWithGoogle() {
    if (!auth) {
        showErrorModal('System Error', 'Authentication service is not available.');
        return;
    }

    setButtonLoading(elements.btnGoogle, true);
    showLoading(true);

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // STRICT: Check if email is in allowed admin list
        if (!ALLOWED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            await auth.signOut();
            showErrorModal('Access Denied', 'This Google account is not authorized for admin access.');
            setButtonLoading(elements.btnGoogle, false);
            showLoading(false);
            return;
        }

        createSession(user);

        showSuccessModal(
            'Welcome! 🎉',
            `Successfully signed in with Google as ${user.displayName || user.email}.`,
            redirectToAdmin
        );

    } catch (error) {
        console.error('Google sign-in error:', error);

        let errorMessage = 'Google sign-in failed.';
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign-in popup was closed. Please try again.';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Popup was blocked. Please allow popups for this site.';
                break;
            case 'auth/cancelled-popup-request':
                errorMessage = 'Multiple popups detected. Please try again.';
                break;
            case 'auth/account-exists-with-different-credential':
                errorMessage = 'An account already exists with this email using a different sign-in method.';
                break;
            default:
                errorMessage = error.message || 'Google sign-in failed. Please try again.';
        }

        showErrorModal('Google Sign-In Failed', errorMessage);
    } finally {
        setButtonLoading(elements.btnGoogle, false);
        showLoading(false);
    }
}

/**
 * Send password reset email
 * @param {string} email - User email
 */
async function sendPasswordReset(email) {
    if (!auth) {
        showErrorModal('System Error', 'Authentication service is not available.');
        return;
    }

    // STRICT: Only admin email can receive reset link
    const ADMIN_EMAIL = 'endlessnewslk@gmail.com';
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        showErrorModal('Access Denied', 'This email is not authorized for password reset.');
        return;
    }

    setButtonLoading(elements.btnReset, true);
    showLoading(true);

    try {
        await auth.sendPasswordResetEmail(email, {
            url: window.location.origin + '/x7k9r.html',
            handleCodeInApp: false
        });

        showSuccessModal(
            'Reset Link Sent! 📧',
            `A password reset link has been sent to ${email}. Please check your inbox and spam folder.`,
            () => switchView('login')
        );

    } catch (error) {
        console.error('Password reset error:', error);

        let errorMessage = 'Failed to send reset email.';
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email format.';
                showFieldError(elements.resetEmail, elements.resetEmailError, 'Invalid email');
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                showFieldError(elements.resetEmail, elements.resetEmailError, 'Email not registered');
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many requests. Please try again later.';
                break;
            default:
                errorMessage = error.message || 'Failed to send reset email. Please try again.';
        }

        showErrorModal('Reset Failed', errorMessage);
    } finally {
        setButtonLoading(elements.btnReset, false);
        showLoading(false);
    }
}

// ═══════════════════════════════════════════════════════
// STEP 11: THEME MANAGEMENT (Dark/Light Mode)
// ═══════════════════════════════════════════════════════

/**
 * Initialize theme from localStorage or system preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('endless_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeIcon('light');
    }
}

/**
 * Toggle between dark and light mode
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('endless_theme', newTheme);
    updateThemeIcon(newTheme);
}

/**
 * Update theme toggle icon
 * @param {string} theme - Current theme
 */
function updateThemeIcon(theme) {
    elements.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ═══════════════════════════════════════════════════════
// STEP 12: PARTICLE BACKGROUND ANIMATION
// ═══════════════════════════════════════════════════════

/**
 * Initialize animated particle background
 */
function initParticles() {
    const canvas = elements.canvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId = null;

    // Resize canvas
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 38, 38, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Create particles
    const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Draw connections
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(220, 38, 38, ${0.1 * (1 - distance / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        drawConnections();
        animationId = requestAnimationFrame(animate);
    }

    animate();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (animationId) cancelAnimationFrame(animationId);
    });
}

// ═══════════════════════════════════════════════════════
// STEP 13: EVENT LISTENERS
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // STRICT: Prevent browser caching of this page
    if (window.history && window.history.pushState) {
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = function() {
            window.history.pushState(null, null, window.location.href);
        };
    }

    // Initialize theme
    initTheme();

    // Initialize particles
    initParticles();

    // STRICT: Login page should ALWAYS show login form
    // Do NOT auto-redirect to dashboard even if session exists
    // User must explicitly login every time they visit this page

    // STRICT: Clear any previously saved credentials on load
    // This ensures no pre-filled data after logout
    if (elements.email) {
        elements.email.value = '';
        elements.email.autocomplete = 'off';
    }
    if (elements.password) {
        elements.password.value = '';
        elements.password.autocomplete = 'off';
    }

    // Clear browser's saved password prompt
    elements.loginForm?.setAttribute('autocomplete', 'off');

    // STRICT: Clear any stored form data from browser
    try {
        document.querySelectorAll('input').forEach(input => {
            input.value = '';
        });
    } catch(e) {}

    // Theme toggle
    elements.themeToggle?.addEventListener('click', toggleTheme);

    // Password visibility toggle
    elements.togglePassword?.addEventListener('click', () => {
        const type = elements.password.type === 'password' ? 'text' : 'password';
        elements.password.type = type;
        elements.eyeIcon.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // View switchers
    elements.forgotLink?.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('forgot');
    });

    elements.backToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('login');
    });

    // Login form submission
    elements.loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email = sanitizeInput(elements.email.value.trim());
        const password = elements.password.value;

        // Validate inputs
        let hasError = false;

        if (!email) {
            showFieldError(elements.email, elements.emailError, 'Email is required');
            hasError = true;
        } else if (!isValidEmail(email)) {
            showFieldError(elements.email, elements.emailError, 'Please enter a valid email');
            hasError = true;
        }

        if (!password) {
            showFieldError(elements.password, elements.passwordError, 'Password is required');
            hasError = true;
        }

        if (hasError) return;

        // Attempt login
        await signInWithEmail(email, password);
    });

    // Forgot password form submission
    elements.forgotForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email = sanitizeInput(elements.resetEmail.value.trim());

        if (!email) {
            showFieldError(elements.resetEmail, elements.resetEmailError, 'Email is required');
            return;
        }

        if (!isValidEmail(email)) {
            showFieldError(elements.resetEmail, elements.resetEmailError, 'Please enter a valid email');
            return;
        }

        await sendPasswordReset(email);
    });

    // Google sign-in DISABLED - Admin only via email/password
    // elements.btnGoogle?.addEventListener('click', signInWithGoogle);

    // Close modals on overlay click
    elements.successModal?.addEventListener('click', (e) => {
        if (e.target === elements.successModal) {
            elements.successModal.classList.remove('open');
        }
    });

    elements.errorModal?.addEventListener('click', (e) => {
        if (e.target === elements.errorModal) {
            elements.errorModal.classList.remove('open');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Close modals with Escape
        if (e.key === 'Escape') {
            elements.successModal?.classList.remove('open');
            elements.errorModal?.classList.remove('open');
        }
    });

    // Focus first input
    elements.email?.focus();
});

// ═══════════════════════════════════════════════════════
// STEP 14: EXPORT FOR EXTERNAL USE
// ═══════════════════════════════════════════════════════

// Make functions available globally for inline onclick handlers
window.showSuccessModal = showSuccessModal;
window.showErrorModal = showErrorModal;
window.showLoading = showLoading;