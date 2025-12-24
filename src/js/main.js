import '../scss/main.scss';
import $ from 'jquery';

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

        // Dynamic Year Update (Persian numbers for FA)
        const year = new Date().getFullYear();
        const yearText = lang === 'fa' ? year.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]) : year;
        $('.footer-year').text(yearText);

        // Render Book Details if on details page
        const $detailsContainer = $('#book-details-container');
        if ($detailsContainer.length) {
            const urlParams = new URLSearchParams(window.location.search);
            const bookId = urlParams.get('id');
            const bookData = translations[lang].details[bookId];

            if (bookData) {
                const html = `
                    <div class="book-detail-card" style="display: flex; flex-direction: column; align-items: center; max-width: 800px; margin: 0 auto; background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div class="book-cover" style="margin-bottom: 2rem; width: 100%; max-width: 400px;">
                            <img src="${bookData.image}" alt="${bookData.title}" style="width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        </div>
                        <h1 style="color: #2E1A47; margin-bottom: 0.5rem; text-align: center;">${bookData.title}</h1>
                        <p class="author" style="color: #C5A059; font-style: italic; margin-bottom: 1.5rem;">${bookData.author}</p>
                        <div class="description" style="line-height: 1.8; color: #333; margin-bottom: 2rem; text-align: justify;">
                            <p>${bookData.description}</p>
                        </div>
                         <a href="${bookData.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1.1rem; text-decoration: none; display: inline-block;">${bookData.btnText}</a>
                    </div>
                `;
                $detailsContainer.html(html);
            } else {
                $detailsContainer.html('<p style="text-align: center;">Book not found.</p>');
            }
        }
    }

    // Mobile Menu Toggle
    const $menuToggle = $('#menu-toggle');
    const $navLinks = $('.nav-links');

    $menuToggle.on('click', function () {
        $navLinks.toggleClass('active');
        $(this).attr('aria-expanded', $navLinks.hasClass('active'));
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
});
