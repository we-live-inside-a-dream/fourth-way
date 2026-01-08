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
        applyTranslations();
    }

    function applyTranslations() {
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
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    urlInput.value = data.url;

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
                fileInput.value = '';
            }
        });
    }

    // ============================================
    // PAGE-SPECIFIC HANDLERS
    // ============================================

    // Login Page Handler
    function initLoginPage() {
        const form = document.getElementById('login-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.toLowerCase();
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-msg');

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('adminToken', data.token);
                    window.location.href = '/admin/dashboard.html';
                } else {
                    errorDiv.textContent = 'Invalid credentials';
                    errorDiv.style.display = 'block';
                }
            } catch (err) {
                console.error(err);
                errorDiv.textContent = 'Server error';
                errorDiv.style.display = 'block';
            }
        });
    }

    // Books List Page Handler
    function initBooksPage() {
        async function loadBooks() {
            try {
                const res = await fetch(`${API_URL}/books`);
                const books = await res.json();

                const tbody = document.getElementById('books-table-body');
                if (!tbody) return;

                tbody.innerHTML = '';

                books.forEach(book => {
                    const title = book.title ? (book.title.en || 'No Title') : 'No Title';
                    const author = book.author ? (book.author.en || 'No Author') : 'No Author';

                    const row = `
                        <tr>
                            <td>${title}</td>
                            <td>${author}</td>
                            <td style="text-transform: capitalize;">${book.category}</td>
                            <td>
                                <a href="/admin/edit-book.html?id=${book.id}" class="btn-edit" data-i18n="admin.books.edit">Edit</a>
                            </td>
                        </tr>
                   `;
                    tbody.insertAdjacentHTML('beforeend', row);
                });

                // Apply translations to dynamic content
                applyTranslations();

            } catch (err) {
                console.error(err);
                const tbody = document.getElementById('books-table-body');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;" data-i18n="admin.books.loadFail">Failed to load books</td></tr>';
                }
            }
        }

        loadBooks();
    }

    // Add Book Page Handler
    function initAddBookPage() {
        setupImageUpload('image-upload', 'image');

        const form = document.getElementById('book-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = form.querySelector('.btn-submit');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            const formData = new FormData(form);
            const getVal = (n) => formData.get(n);

            const payload = {
                category: getVal('category'),
                image: getVal('image'),
                payhipLink: getVal('payhipLink'),
                amazonLink: getVal('amazonLink'),
                appleLink: getVal('appleLink'),
                featured: getVal('featured') === 'true',
                title: { en: getVal('title.en'), fa: getVal('title.fa') },
                author: { en: getVal('author.en'), fa: getVal('author.fa') },
                translator: { en: getVal('translator.en'), fa: getVal('translator.fa') },
                description: { en: getVal('description.en'), fa: getVal('description.fa') },
                btnText: { en: getVal('btnText.en'), fa: getVal('btnText.fa') },
            };

            try {
                const res = await fetch(`${API_URL}/books`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    showToast('Book created successfully!', 'success');
                    setTimeout(() => window.location.href = '/admin/books.html', 1500);
                } else {
                    showToast('Failed to create book.', 'error');
                }
            } catch (err) {
                showToast('Error creating book.', 'error');
                console.error(err);
            } finally {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        });
    }

    // Edit Book Page Handler
    function initEditBookPage() {
        setupImageUpload('image-upload', 'image');

        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');

        if (!bookId) {
            const container = document.querySelector('.container');
            if (container) {
                container.innerHTML = '<p style="color:red">No book ID specified.</p>';
            }
            return;
        }

        const form = document.getElementById('book-form');
        const msgDiv = document.getElementById('msg');

        // Update form title to show ID
        const h2 = document.querySelector('h2');
        if (h2) h2.textContent += ` (${bookId})`;

        // Load Data
        async function loadData() {
            try {
                const res = await fetch(`${API_URL}/books/${bookId}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();

                const setVal = (name, val) => {
                    const el = form.querySelector(`[name="${name}"]`);
                    if (el) el.value = val || '';
                };

                setVal('category', data.category);
                setVal('image', data.image);
                setVal('payhipLink', data.payhipLink);
                setVal('amazonLink', data.amazonLink);
                setVal('appleLink', data.appleLink);
                setVal('featured', data.featured);

                if (data.title) { setVal('title.en', data.title.en); setVal('title.fa', data.title.fa); }
                if (data.author) { setVal('author.en', data.author.en); setVal('author.fa', data.author.fa); }
                if (data.translator) { setVal('translator.en', data.translator.en); setVal('translator.fa', data.translator.fa); }
                if (data.description) { setVal('description.en', data.description.en); setVal('description.fa', data.description.fa); }
                if (data.btnText) { setVal('btnText.en', data.btnText.en); setVal('btnText.fa', data.btnText.fa); }

            } catch (e) {
                console.error(e);
                if (msgDiv) msgDiv.innerHTML = '<span style="color:red">Failed to load data</span>';
            }
        }

        loadData();

        // Submit
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const saveBtn = form.querySelector('.btn-submit');
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;

                const formData = new FormData(form);
                const getVal = (n) => formData.get(n);

                const payload = {
                    id: bookId,
                    category: getVal('category'),
                    image: getVal('image'),
                    payhipLink: getVal('payhipLink'),
                    amazonLink: getVal('amazonLink'),
                    appleLink: getVal('appleLink'),
                    featured: getVal('featured') === 'true',
                    title: { en: getVal('title.en'), fa: getVal('title.fa') },
                    author: { en: getVal('author.en'), fa: getVal('author.fa') },
                    translator: { en: getVal('translator.en'), fa: getVal('translator.fa') },
                    description: { en: getVal('description.en'), fa: getVal('description.fa') },
                    btnText: { en: getVal('btnText.en'), fa: getVal('btnText.fa') },
                };

                try {
                    const res = await fetch(`${API_URL}/books/${bookId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        showToast('Saved successfully!', 'success');
                    } else {
                        showToast('Failed to save.', 'error');
                    }
                } catch (err) {
                    showToast('Error saving data.', 'error');
                } finally {
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                }
            });
        }
    }

    // Hero Page Handler
    function initHeroPage() {
        const form = document.getElementById('hero-form');
        const msgDiv = document.getElementById('msg');
        if (!form) return;

        // Load Data
        async function loadData() {
            try {
                const res = await fetch(`${API_URL}/hero`);
                const data = await res.json();

                const setVal = (name, val) => {
                    const el = form.querySelector(`[name="${name}"]`);
                    if (el) el.value = val || '';
                };

                if (data.title) { setVal('title.en', data.title.en); setVal('title.fa', data.title.fa); }
                if (data.subtitle) { setVal('subtitle.en', data.subtitle.en); setVal('subtitle.fa', data.subtitle.fa); }
                if (data.writtenBtn) { setVal('writtenBtn.en', data.writtenBtn.en); setVal('writtenBtn.fa', data.writtenBtn.fa); }
                if (data.translatedBtn) { setVal('translatedBtn.en', data.translatedBtn.en); setVal('translatedBtn.fa', data.translatedBtn.fa); }
                if (data.aboutTitle) { setVal('aboutTitle.en', data.aboutTitle.en); setVal('aboutTitle.fa', data.aboutTitle.fa); }
                if (data.aboutText) { setVal('aboutText.en', data.aboutText.en); setVal('aboutText.fa', data.aboutText.fa); }

                // Handle Images
                const imagesContainer = document.getElementById('about-images-list');
                const imagesList = data.aboutImages || [];

                const renderImages = () => {
                    imagesContainer.innerHTML = '';
                    imagesList.forEach((url, idx) => {
                        const div = document.createElement('div');
                        div.style.cssText = 'position: relative; width: 100px; height: 100px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden;';
                        div.innerHTML = `
                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
                            <button type="button" class="btn-remove" data-idx="${idx}" style="position: absolute; top: 2px; right: 2px; background: rgba(255,0,0,0.8); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; line-height: 20px; text-align: center; cursor: pointer; font-size: 12px;">&times;</button>
                        `;
                        imagesContainer.appendChild(div);
                    });

                    // Add listeners to remove buttons
                    document.querySelectorAll('.btn-remove').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const idx = parseInt(e.target.dataset.idx);
                            imagesList.splice(idx, 1);
                            renderImages();
                        });
                    });
                };

                renderImages();

                // Add Image Logic
                const btnAddImage = document.getElementById('btn-add-image');
                const fileInput = document.getElementById('aboutImage-upload');

                btnAddImage.addEventListener('click', () => fileInput.click());

                fileInput.addEventListener('change', async (e) => {
                    if (!e.target.files.length) return;
                    const file = e.target.files[0];
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);

                    try {
                        btnAddImage.textContent = 'Uploading...';
                        btnAddImage.disabled = true;

                        const res = await fetch(`${API_URL}/upload`, {
                            method: 'POST',
                            body: uploadFormData
                        });
                        const uploadData = await res.json();

                        if (uploadData.url) {
                            imagesList.push(uploadData.url);
                            renderImages();
                        }
                    } catch (err) {
                        console.error(err);
                        alert('Upload failed');
                    } finally {
                        btnAddImage.textContent = 'Add Image';
                        btnAddImage.disabled = false;
                        fileInput.value = '';
                    }
                });

                // Expose list to submit handler
                form.AboutImagesList = imagesList;

            } catch (e) {
                console.error(e);
                if (msgDiv) msgDiv.innerHTML = '<span style="color:red">Failed to load data</span>';
            }
        }

        loadData();

        // Submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = form.querySelector('.btn-submit');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            const formData = new FormData(form);
            const getVal = (n) => formData.get(n);

            const payload = {
                title: { en: getVal('title.en'), fa: getVal('title.fa') },
                subtitle: { en: getVal('subtitle.en'), fa: getVal('subtitle.fa') },
                writtenBtn: { en: getVal('writtenBtn.en'), fa: getVal('writtenBtn.fa') },
                translatedBtn: { en: getVal('translatedBtn.en'), fa: getVal('translatedBtn.fa') },
                aboutTitle: { en: getVal('aboutTitle.en'), fa: getVal('aboutTitle.fa') },
                aboutText: { en: getVal('aboutText.en'), fa: getVal('aboutText.fa') },
                aboutImages: form.AboutImagesList || []
            };

            try {
                const res = await fetch(`${API_URL}/hero`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    showToast('Saved successfully!', 'success');
                } else {
                    showToast('Failed to save.', 'error');
                }
            } catch (err) {
                showToast('Error saving data.', 'error');
            } finally {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        });
    }

    // ============================================
    // PAGE ROUTER - Auto-detect and init page
    // ============================================
    const path = window.location.pathname;

    if (path.includes('login.html')) {
        initLoginPage();
    } else if (path.includes('books.html') && !path.includes('add-book') && !path.includes('edit-book')) {
        initBooksPage();
    } else if (path.includes('add-book.html')) {
        initAddBookPage();
    } else if (path.includes('edit-book.html')) {
        initEditBookPage();
    } else if (path.includes('hero.html')) {
        initHeroPage();
    }
    // dashboard.html doesn't need specific logic - core admin.js handles it

    // Expose utils
    window.admin = {
        applyTranslations: applyTranslations,
        getLang: () => lang,
        showToast: showToast,
        setupImageUpload: setupImageUpload
    };
}

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}
