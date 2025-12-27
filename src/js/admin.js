import { translations } from './translations.js';
import { API_URL } from './config.js';

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

    // Theme Logic
    let theme = localStorage.getItem('theme') || 'light';

    function setTheme(newTheme) {
        theme = newTheme;
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);

        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    // Theme Listener
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            setTheme(theme === 'dark' ? 'light' : 'dark');
        });
    }

    // Initial Theme Set
    setTheme(theme);

    // Initial Lang Set
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


    // Toast Logic
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Force reflow
        void toast.offsetWidth;

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Image Upload Logic
    function setupImageUpload(fileInputId, urlInputId, previewId = null) {
        const fileInput = document.getElementById(fileInputId);
        const urlInput = document.getElementById(urlInputId);

        if (!fileInput || !urlInput) return;

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            // Show loading state (simple text change for now)
            const originalLabel = fileInput.previousElementSibling ? fileInput.previousElementSibling.textContent : 'Upload';
            if (fileInput.previousElementSibling) fileInput.previousElementSibling.textContent = 'Uploading...';

            try {
                const response = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    body: formData // No Content-Type header needed, browser sets it for FormData
                });

                if (response.ok) {
                    const data = await response.json();
                    urlInput.value = data.url;

                    // Trigger input event to handle any bound listeners
                    urlInput.dispatchEvent(new Event('input'));

                    if (previewId) {
                        const preview = document.getElementById(previewId);
                        if (preview) preview.src = data.url;
                    }
                    showToast('Image uploaded successfully!', 'success');
                } else {
                    showToast('Upload failed', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Upload error', 'error');
            } finally {
                if (fileInput.previousElementSibling) fileInput.previousElementSibling.textContent = originalLabel;
                // Clear input so selecting same file works again
                fileInput.value = '';
            }
        });
    }

    // Expose utils
    window.admin = {
        applyTranslations: () => {
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
        },
        getLang: () => lang,
        showToast: showToast,
        setupImageUpload: setupImageUpload
    };
}

// Run on load
// Since we use type="module", it defers automatically, but DOMContentLoaded is safer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}
