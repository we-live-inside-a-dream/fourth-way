import '../scss/main.scss';
import $ from 'jquery';

$(function () {
    console.log('Fourth Way Books - Initialized');

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
