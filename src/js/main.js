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
                // Update Page Title and Meta Tags
                document.title = `${bookData.title} | Fourth Way Books`;

                // Meta Description
                let metaDesc = document.querySelector('meta[name="description"]');
                if (!metaDesc) {
                    metaDesc = document.createElement('meta');
                    metaDesc.name = "description";
                    document.head.appendChild(metaDesc);
                }
                metaDesc.content = bookData.description.substring(0, 160); // Limit to 160 chars for SEO

                // OG Title
                let ogTitle = document.querySelector('meta[property="og:title"]');
                if (!ogTitle) {
                    ogTitle = document.createElement('meta');
                    ogTitle.setAttribute('property', 'og:title');
                    document.head.appendChild(ogTitle);
                }
                ogTitle.content = bookData.title;

                // OG Description
                let ogDesc = document.querySelector('meta[property="og:description"]');
                if (!ogDesc) {
                    ogDesc = document.createElement('meta');
                    ogDesc.setAttribute('property', 'og:description');
                    document.head.appendChild(ogDesc);
                }
                ogDesc.content = bookData.description;

                // OG Image
                let ogImage = document.querySelector('meta[property="og:image"]');
                if (!ogImage) {
                    ogImage = document.createElement('meta');
                    ogImage.setAttribute('property', 'og:image');
                    document.head.appendChild(ogImage);
                }
                // Construct absolute URL for image if possible, or use relative
                // Ensure image path is clean
                let imagePath = bookData.image;
                if (imagePath.startsWith('./')) {
                    imagePath = imagePath.substring(2);
                } else if (imagePath.startsWith('/')) {
                    imagePath = imagePath.substring(1);
                }

                // If it's not an absolute URL, prepend domain
                if (!imagePath.startsWith('http')) {
                    ogImage.content = `https://babaklotfikish.com/${imagePath}`;
                } else {
                    ogImage.content = imagePath;
                }


                const html = `
                    <div class="book-detail-card" style="display: flex; flex-direction: column; align-items: center; max-width: 800px; margin: 0 auto; background: var(--color-white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div class="book-cover" style="margin-bottom: 2rem; width: 100%; max-width: 400px;">
                            <img src="${bookData.image}" alt="${bookData.title}" style="width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                        </div>
                        <h1 style="color: var(--color-primary); margin-bottom: 0.5rem; text-align: center;">${bookData.title}</h1>
                        <p class="author" style="color: var(--color-secondary); font-style: italic; margin-bottom: 0.5rem;">${bookData.author}</p>
                        ${bookData.translator ? `<p class="translator" style="color: var(--color-secondary); font-style: italic; margin-bottom: 1.5rem;">${lang === 'fa' ? 'مترجم: ' : 'Translator: '}${bookData.translator}</p>` : ''}
                        <div class="description" style="line-height: 1.8; color: var(--color-text); margin-bottom: 2rem; text-align: justify;">
                            <p>${bookData.description}</p>
                        </div>
                        ${(bookData.btnText === 'Coming Soon...' || bookData.btnText === '...به زودی') ?
                        `<span class="btn btn-primary disabled" style="padding: 1rem 2rem; font-size: 1.1rem; text-decoration: none; display: inline-block;">${bookData.btnText}</span>` :
                        `<a href="${bookData.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1.1rem; text-decoration: none; display: inline-block;">${bookData.btnText}</a>`
                    }
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
});
