/**
 * Springfield Bridge Plan — site.js
 * Shared JS for all pages
 */

// Nav toggle (mobile)
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !expanded);
        navMenu.classList.toggle('nav-open');
    });
}

// Scroll progress bar
const progressFill = document.querySelector('.progress-fill');
if (progressFill) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressFill.style.width = pct + '%';
    }, { passive: true });
}

// Sticky nav shadow
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('navbar-scrolled', window.scrollY > 20);
    }, { passive: true });
}
