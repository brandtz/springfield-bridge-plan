/**
 * Springfield Bridge Plan - Main JavaScript
 * Building a bridge, not burning one.
 */

// =========================================
// Configuration
// =========================================
const CONFIG = {
    // Google Sheets Web App URL - Replace with your deployed script URL
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbxWWI-Nmj2qb683USxW9Nq3Ayylo9AT134wU9OknjmnB8IaDPztQFu5VzvglL-05VHj/exec',
    
    // Signature goal
    SIGNATURE_GOAL: 1000,
    
    // Site URL for sharing
    SITE_URL: 'https://springfieldbridgeplan.org',
    
    // Share text
    SHARE_TEXT: "I signed the Springfield Bridge Plan petition to support our schools and educators. Building a bridge, not burning one. Add your voice!",
};

// =========================================
// DOM Elements
// =========================================
const elements = {
    navbar: document.querySelector('.navbar'),
    navToggle: document.querySelector('.nav-toggle'),
    navMenu: document.querySelector('.nav-menu'),
    progressFill: document.querySelector('.progress-fill'),
    signatureForm: document.getElementById('signature-form'),
    submitBtn: document.getElementById('submit-btn'),
    successMessage: document.getElementById('success-message'),
    signatureCountHero: document.getElementById('signature-count-hero'),
    signatureCount: document.getElementById('signature-count'),
    goalFill: document.getElementById('goal-fill'),
    charCurrent: document.getElementById('char-current'),
    commentField: document.getElementById('comment'),
};

// =========================================
// State
// =========================================
let state = {
    lastScrollY: 0,
    currentSignatures: 0,
};

// =========================================
// Navigation
// =========================================
function initNavigation() {
    // Mobile menu toggle
    if (elements.navToggle) {
        elements.navToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    // Scroll handling
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', handleAnchorClick);
    });
}

function toggleMobileMenu() {
    const isExpanded = elements.navToggle.getAttribute('aria-expanded') === 'true';
    elements.navToggle.setAttribute('aria-expanded', !isExpanded);
    elements.navMenu.classList.toggle('active');
}

function closeMobileMenu() {
    elements.navToggle.setAttribute('aria-expanded', 'false');
    elements.navMenu.classList.remove('active');
}

function handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Update progress bar
    updateProgressBar();
    
    // Add/remove scrolled class to navbar
    if (currentScrollY > 50) {
        elements.navbar.classList.add('scrolled');
    } else {
        elements.navbar.classList.remove('scrolled');
    }
    
    // Hide/show navbar on scroll
    if (currentScrollY > state.lastScrollY && currentScrollY > 200) {
        elements.navbar.classList.add('hidden');
    } else {
        elements.navbar.classList.remove('hidden');
    }
    
    state.lastScrollY = currentScrollY;
}

function updateProgressBar() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = (window.scrollY / scrollHeight) * 100;
    elements.progressFill.style.width = `${scrollProgress}%`;
}

function handleAnchorClick(e) {
    const href = e.currentTarget.getAttribute('href');
    if (href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const navHeight = elements.navbar.offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }
}

// =========================================
// Form Handling
// =========================================
function initForm() {
    if (!elements.signatureForm) return;
    
    // Form submission
    elements.signatureForm.addEventListener('submit', handleFormSubmit);
    
    // Character counter for comment field
    if (elements.commentField) {
        elements.commentField.addEventListener('input', updateCharCount);
        elements.commentField.setAttribute('maxlength', '500');
    }
    
    // Real-time validation
    const requiredFields = elements.signatureForm.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => clearFieldError(field));
    });
}

function updateCharCount() {
    const currentLength = elements.commentField.value.length;
    elements.charCurrent.textContent = currentLength;
}

function validateField(field) {
    const errorElement = document.getElementById(`${field.id}-error`);
    let isValid = true;
    let errorMessage = '';
    
    // Check if empty
    if (field.hasAttribute('required') && !field.value.trim()) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    // Email validation
    else if (field.type === 'email' && field.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    // ZIP code validation
    else if (field.id === 'zip' && field.value) {
        const zipRegex = /^\d{5}$/;
        if (!zipRegex.test(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid 5-digit ZIP code';
        }
    }
    
    if (!isValid) {
        field.classList.add('error');
        if (errorElement) errorElement.textContent = errorMessage;
    } else {
        field.classList.remove('error');
        if (errorElement) errorElement.textContent = '';
    }
    
    return isValid;
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) errorElement.textContent = '';
}

function validateForm() {
    const requiredFields = elements.signatureForm.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        // Focus first error field
        const firstError = elements.signatureForm.querySelector('.error');
        if (firstError) firstError.focus();
        return;
    }
    
    // Show loading state
    elements.submitBtn.classList.add('loading');
    elements.submitBtn.disabled = true;
    
    // Gather form data
    const formData = {
        timestamp: new Date().toISOString(),
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        zip: document.getElementById('zip').value.trim(),
        role: document.getElementById('role').value,
        comment: document.getElementById('comment').value.trim(),
        displayName: document.getElementById('displayName').checked,
        updates: document.getElementById('updates').checked,
    };
    
    try {
        // Submit to Google Sheets
        await submitToGoogleSheets(formData);
        
        // Show success message
        showSuccessMessage();
        
        // Fetch fresh count from Google Sheets
        await fetchSignatureCount();
        
    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting your signature. Please try again.');
    } finally {
        elements.submitBtn.classList.remove('loading');
        elements.submitBtn.disabled = false;
    }
}

async function submitToGoogleSheets(data) {
    const response = await fetch(CONFIG.GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    
    return { success: true };
}

function showSuccessMessage() {
    elements.signatureForm.hidden = true;
    elements.successMessage.hidden = false;
    elements.successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// =========================================
// Signature Counter & Community Voices
// =========================================
function initSignatureCounter() {
    // Fetch the real count and comments from Google Sheets
    fetchSignatureData();
    
    // Refresh every 30 seconds
    setInterval(fetchSignatureData, 30000);
}

async function fetchSignatureData() {
    try {
        const response = await fetch(CONFIG.GOOGLE_SHEETS_URL);
        const data = await response.json();
        
        if (data.count !== undefined) {
            state.currentSignatures = data.count;
            updateSignatureDisplay(data.count, true);
        }
        
        // Update community voices if comments exist
        if (data.comments && Array.isArray(data.comments)) {
            displayCommunityVoices(data.comments);
        }
    } catch (error) {
        console.log('Could not fetch signature data:', error);
        // On error, just show 0 - don't use fake data
        updateSignatureDisplay(0, false);
        displayCommunityVoices([]);
    }
}

function displayCommunityVoices(comments) {
    const container = document.getElementById('voices-container');
    const note = document.getElementById('voices-note');
    
    if (!container) return;
    
    // If no comments, show empty state
    if (!comments || comments.length === 0) {
        container.innerHTML = `
            <div class="voices-empty">
                <div class="voices-empty-icon">💬</div>
                <p>Be the first to share your voice!</p>
                <p>Sign the petition below and share why you support the Bridge Plan.</p>
            </div>
        `;
        if (note) note.style.display = 'none';
        return;
    }
    
    // Shuffle comments for variety and take up to 6
    const shuffled = [...comments].sort(() => Math.random() - 0.5);
    const displayComments = shuffled.slice(0, 6);
    
    // Generate comment cards
    const html = displayComments.map(comment => {
        const initial = comment.firstName ? comment.firstName.charAt(0).toUpperCase() : '?';
        const name = `${comment.firstName || 'Anonymous'} ${comment.lastInitial || ''}`;
        const role = comment.role || 'Community Member';
        
        return `
            <div class="voice-card">
                <p class="voice-comment">"${escapeHtml(comment.comment)}"</p>
                <div class="voice-attribution">
                    <div class="voice-avatar">${initial}</div>
                    <div>
                        <div class="voice-name">${escapeHtml(name)}</div>
                        <div class="voice-role">${escapeHtml(role)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    if (note) note.style.display = 'block';
}

// Helper function to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateSignatureDisplay(count, animate = false) {
    if (animate) {
        animateCounter(elements.signatureCountHero, count);
        animateCounter(elements.signatureCount, count);
    } else {
        if (elements.signatureCountHero) elements.signatureCountHero.textContent = count;
        if (elements.signatureCount) elements.signatureCount.textContent = count;
    }
    
    // Update progress bar
    const percentage = Math.min((count / CONFIG.SIGNATURE_GOAL) * 100, 100);
    if (elements.goalFill) {
        elements.goalFill.style.width = `${percentage}%`;
    }
}

function animateCounter(element, target) {
    if (!element) return;
    
    const duration = 2000;
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// =========================================
// Social Sharing
// =========================================
function initSharing() {
    const shareUrl = encodeURIComponent(CONFIG.SITE_URL);
    const shareText = encodeURIComponent(CONFIG.SHARE_TEXT);
    
    // Facebook
    const facebookBtn = document.getElementById('share-facebook');
    if (facebookBtn) {
        facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        facebookBtn.target = '_blank';
        facebookBtn.rel = 'noopener noreferrer';
    }
    
    // Twitter/X
    const twitterBtn = document.getElementById('share-twitter');
    if (twitterBtn) {
        twitterBtn.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
        twitterBtn.target = '_blank';
        twitterBtn.rel = 'noopener noreferrer';
    }
    
    // Email
    const emailBtn = document.getElementById('share-email');
    if (emailBtn) {
        const subject = encodeURIComponent('Support the Springfield Bridge Plan');
        const body = encodeURIComponent(`${CONFIG.SHARE_TEXT}\n\n${CONFIG.SITE_URL}`);
        emailBtn.href = `mailto:?subject=${subject}&body=${body}`;
    }
    
    // Copy link
    const copyBtn = document.getElementById('share-copy');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(CONFIG.SITE_URL);
                copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    }
}

// =========================================
// Intersection Observer for Animations
// =========================================
function initAnimations() {
    const animatedElements = document.querySelectorAll('.pillar-card, .benefit-card, .timeline-item, .testimonial');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in', 'visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// =========================================
// Accessibility Enhancements
// =========================================
function initAccessibility() {
    // Handle reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        document.documentElement.style.scrollBehavior = 'auto';
    }
    
    // Escape key closes mobile menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.navMenu.classList.contains('active')) {
            closeMobileMenu();
            elements.navToggle.focus();
        }
    });
}

// =========================================
// Initialize
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initForm();
    initSignatureCounter();
    initSharing();
    initAnimations();
    initAccessibility();
    
    console.log('🌉 Springfield Bridge Plan - Building a bridge, not burning one.');
});
