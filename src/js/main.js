import '../scss/main.scss';
import $ from 'jquery';
import { API_URL } from './config.js';

import { translations } from './translations.js';

$(function () {
    console.log('Fourth Way Books - Initialized');

    // Theme Handling
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(currentTheme);

    $('#theme-toggle').on('click', function () {
        const newTheme = $('html').attr('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        $('html').attr('data-theme', theme);
        localStorage.setItem('theme', theme);
        const iconClass = theme === 'dark' ? 'fa-sun' : 'fa-moon';
        $('#theme-toggle i').removeClass('fa-sun fa-moon').addClass(iconClass);
    }

    // Language Handling
    const currentLang = localStorage.getItem('lang') || 'en';
    setLanguage(currentLang);

    $('#lang-toggle').on('click', function () {
        const newLang = $('html').attr('lang') === 'en' ? 'fa' : 'en';
        setLanguage(newLang);
    });

    function setLanguage(lang) {
        $('html').attr('lang', lang);
        $('body').attr('dir', lang === 'fa' ? 'rtl' : 'ltr');
        localStorage.setItem('lang', lang);

        // Update Toggle Text
        $('#lang-toggle').text(lang === 'en' ? 'FA' : 'EN');

        // Update Content
        $('[data-i18n]').each(function () {
            const key = $(this).data('i18n');
            // Skip dynamic keys handled by API
            // removed manual skip check

            const keys = key.split('.');
            let text = translations[lang];

            keys.forEach(k => {
                text = text ? text[k] : null;
            });

            if (text) {
                if ($(this).is('input, textarea')) {
                    $(this).attr('placeholder', text);
                } else {
                    $(this).text(text);
                }
            }
        });

        // Fetch and Render Hero Data
        loadHeroData(lang);
        loadBooks(lang);
        loadBookDetails(lang);

        // Dynamic Year Update (Persian numbers for FA)
        const year = new Date().getFullYear();
        const yearText = lang === 'fa' ? year.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]) : year;
        $('.footer-year').text(yearText);


    }

    // Mobile Menu Toggle
    const $menuToggle = $('#menu-toggle');
    const $navLinks = $('.nav-links');

    $menuToggle.on('click', function (e) {
        e.stopPropagation();
        $navLinks.toggleClass('active');
        $(this).attr('aria-expanded', $navLinks.hasClass('active'));
    });

    $(document).on('click', function (e) {
        if ($navLinks.hasClass('active') && !$(e.target).closest('.nav-links').length && !$(e.target).closest('#menu-toggle').length) {
            $navLinks.removeClass('active');
            $menuToggle.attr('aria-expanded', 'false');
        }
    });

    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function (event) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 80
            }, 1000);
        }
    });

    // Hero Carousel Logic
    const $carouselItems = $('.hero-carousel .carousel-item');
    if ($carouselItems.length > 1) {
        let currentIndex = 0;
        setInterval(() => {
            $carouselItems.eq(currentIndex).removeClass('active');
            currentIndex = (currentIndex + 1) % $carouselItems.length;
            $carouselItems.eq(currentIndex).addClass('active');
        }, 5000); // Change every 5 seconds
    }

    // API Functions
    // API Functions

    function loadHeroData(lang) {
        // Only load hero if we are on the home page (simplistic check)
        const $heroTitle = $('h1[data-i18n="hero.title"]');
        if (!$heroTitle.length) return;

        $.ajax({
            url: `${API_URL}/hero`,
            method: 'GET',
            success: function (data) {
                if (!data) return;

                // Helper to get text based on lang
                const getText = (field) => field ? (field[lang] || field['en']) : '';

                // Update Hero content
                if (data.title) $heroTitle.text(getText(data.title));
                if (data.subtitle) $('p[data-i18n="hero.subtitle"]').text(getText(data.subtitle));
                if (data.callCaption) $('[data-i18n="hero.callCaption"]').text(getText(data.callCaption));

                // Update buttons
                if (data.writtenBtn) $('a[data-i18n="hero.writtenBtn"]').text(getText(data.writtenBtn));
                if (data.translatedBtn) $('a[data-i18n="hero.translatedBtn"]').text(getText(data.translatedBtn));

                // Update About Section
                if (data.aboutTitle) $('h2[data-i18n="home.aboutTitle"]').text(getText(data.aboutTitle));
                if (data.aboutText) $('p[data-i18n="home.aboutText"]').text(getText(data.aboutText));

                // Update Carousel
                if (data.aboutImages && data.aboutImages.length) {
                    const track = $('#about-carousel-track');
                    track.empty();

                    // Duplicate set for seamless scrolling
                    // 6 sets to ensure we cover enough width for the animation
                    const repeatCount = 6;
                    const images = [];
                    for (let i = 0; i < repeatCount; i++) {
                        images.push(...data.aboutImages);
                    }

                    images.forEach(url => {
                        track.append(`<img src="${url}" alt="Gallery Image">`);
                    });
                }
            },
            error: function (err) {
                console.error("Failed to fetch hero data:", err);
            }
        });
    }

    function loadBooks(lang) {
        const $grid = $('.books-grid');
        if (!$grid.length) return;

        const category = $grid.data('category');
        const $loading = $grid.find('.loading');

        $.ajax({
            url: `${API_URL}/books`,
            method: 'GET',
            success: function (books) {
                if (!books) return;
                $loading.hide(); // Hide loading text

                // Clear existing items except loading div (or just empty and append)
                // $grid.find('.book-card').parent().remove(); // Remove existing cards
                // Simpler: Empty and re-append loading hidden
                $grid.empty();

                const getText = (field) => field ? (field[lang] || field['en']) : '';

                books.forEach(book => {
                    // Filter by category if specified
                    if (category && book.category !== category) return;

                    // Construct HTML
                    const title = getText(book.title);
                    const author = getText(book.author);
                    const desc = getText(book.description);
                    const btnText = getText(book.btnText); // Not used in card currently but useful
                    // const readMore = lang === 'fa' ? 'بیشتر بخوانید' : 'Read More'; // Hardcoded for now or use data-i18n?
                    // Better to use translation text.
                    const readMore = translations[lang].pages.readMore;

                    const html = `
                    <a href="/book-details.html?id=${book.id}" style="text-decoration: none; color: inherit; display: block;">
                        <article class="book-card">
                            <div class="book-cover">
                                <img src="${book.image}" alt="${title} Cover" onerror="this.src='https://via.placeholder.com/300x450'">
                            </div>
                            <div class="book-info">
                                <h3>${title}</h3>
                                <p class="author">${author}</p>
                                <p>${desc.substring(0, 150)}...</p>
                                <div class="actions">
                                    <span class="btn btn-details">${readMore}</span>
                                </div>
                            </div>
                        </article>
                    </a>
                    `;
                    $grid.append(html);
                });
            },
            error: function (err) {
                console.error("Failed to load books:", err);
                $loading.text('Error loading books.');
            }
        });
    }

    function loadBookDetails(lang) {
        const $detailsContainer = $('#book-details-container');
        if (!$detailsContainer.length) return;

        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');
        if (!bookId) return;

        $.ajax({
            url: `${API_URL}/books`, // Ideally fetch single book /api/books/:id
            method: 'GET',
            success: function (books) {
                const book = books.find(b => b.id === bookId);
                if (book) {
                    renderBookDetails(book, lang, $detailsContainer);
                } else {
                    $detailsContainer.html('<p style="text-align: center;">Book not found.</p>');
                }
            },
            error: function () {
                $detailsContainer.html('<p style="text-align: center;">Error loading book details.</p>');
            }
        });
    }

    function renderBookDetails(book, lang, $container) {
        const getText = (field) => field ? (field[lang] || field['en']) : '';

        const title = getText(book.title);
        const author = getText(book.author);
        const translator = getText(book.translator);
        const desc = getText(book.description);
        const btnText = getText(book.btnText);

        // Update Title
        document.title = `${title} | Fourth Way Books`;

        const html = `
            <div class="book-detail-card" style="display: flex; flex-direction: column; align-items: center; max-width: 800px; margin: 0 auto; background: var(--color-white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div class="book-cover" style="margin-bottom: 2rem; width: 100%; max-width: 400px;">
                    <img src="${book.image}" alt="${title}" style="width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                </div>
                <h1 style="color: var(--color-primary); margin-bottom: 0.5rem; text-align: center;">${title}</h1>
                <p class="author" style="color: var(--color-secondary); font-style: italic; margin-bottom: 0.5rem;">${author}</p>
                ${translator ? `<p class="translator" style="color: var(--color-secondary); font-style: italic; margin-bottom: 1.5rem;">${lang === 'fa' ? 'مترجم: ' : 'Translator: '}${translator}</p>` : ''}
                <div class="description" style="line-height: 1.8; color: var(--color-text); margin-bottom: 2rem; text-align: justify;">
                    <p>${desc}</p>
                </div>
                ${(btnText === 'Coming Soon...' || btnText === 'به زودی' || btnText == 'Coming Soon' || btnText == 'به زودی') ?
                `<span class="btn btn-primary disabled" style="padding: 1rem 2rem; font-size: 1.1rem; text-decoration: none; display: inline-block;">${btnText}</span>` :
                `<a href="${book.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1.1rem; text-decoration: none; display: inline-block;">${btnText}</a>`
            }
            </div>
        `;
        $container.html(html);
    }
});
