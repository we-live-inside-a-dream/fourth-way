import { translations } from './translations.js';

const API_URL = 'http://localhost:8080/api';

function initAdmin() {
    // Language Logic
    let lang = localStorage.getItem('language') || 'en';

    function setLanguage(newLang) {
        lang = newLang;
        localStorage.setItem('language', lang);

        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';

        // Update Toggle Button
        const toggleBtn = document.getElementById('lang-toggle');
        if (toggleBtn) toggleBtn.textContent = lang === 'en' ? 'FA' : 'EN';

        // Apply Translations
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const keys = key.split('.');
            let text = translations[lang];
            keys.forEach(k => {
                if (text) text = text[k];
            });

            if (text) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = text;
                } else {
                    el.textContent = text;
                }
            }
        });
    }

    // Toggle Listener
    const toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            setLanguage(lang === 'en' ? 'fa' : 'en');
        });
    }

    // Initial Set
    setLanguage(lang);

    // Auth Logic
    // Skip auth check on login page
    if (!window.location.pathname.includes('/login.html')) {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '/admin/login.html';
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('adminToken');
                window.location.href = '/admin/login.html';
            });
        }
    }
}

// Run on load
// Since we use type="module", it defers automatically, but DOMContentLoaded is safer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}
