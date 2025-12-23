import '../scss/main.scss';
import $ from 'jquery';

import { translations } from './translations.js';

$(function () {
    console.log('Fourth Way Books - Initialized');

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
});
