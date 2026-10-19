// ============================================================
// GUARANTEED PRELOADER INITIALIZATION & SAFETY FALLBACK
// ============================================================
(function() {
    let preloaderDismissed = false;
    function dismissPreloader() {
        if (preloaderDismissed) return;
        preloaderDismissed = true;
        
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('preloader-fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
        document.body.classList.remove('no-scroll');
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(dismissPreloader, 400);
    } else {
        window.addEventListener('DOMContentLoaded', () => setTimeout(dismissPreloader, 400));
        window.addEventListener('load', () => setTimeout(dismissPreloader, 400));
    }
    
    // Hard fallback timeout (maximum 1.5 seconds)
    setTimeout(dismissPreloader, 1500);
})();

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    }
}, { passive: true });

// Mobile & Desktop Hamburger Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('nav-active');
    });
}

// Close menu when a link is clicked
const navItems = document.querySelectorAll('.nav-links li a');
if (navItems && navLinks) {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('nav-active');
        });
    });
}

// Close menu when clicking anywhere outside the menu and hamburger button
document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('nav-active')) {
        if (!navLinks.contains(e.target) && (!hamburger || !hamburger.contains(e.target))) {
            navLinks.classList.remove('nav-active');
        }
    }
});

// Close menu when user scrolls the page
window.addEventListener('scroll', () => {
    if (navLinks && navLinks.classList.contains('nav-active')) {
        navLinks.classList.remove('nav-active');
    }
}, { passive: true });

// Reveal Elements on Scroll — throttled via requestAnimationFrame for smoothness
const revealElements = document.querySelectorAll('.reviews-slider-container, .vibe-text, .contact-container, .main-menu-section');

let revealScheduled = false;
const revealOnScroll = () => {
    if (revealScheduled) return;
    revealScheduled = true;
    requestAnimationFrame(() => {
        revealScheduled = false;
        const windowHeight = window.innerHeight;
        const elementVisible = 150;
        revealElements.forEach((el) => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                el.style.transition = 'opacity 0.7s ease-out, transform 0.7s ease-out';
            } else if (!el.style.opacity) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(40px)';
            }
        });
    });
};

window.addEventListener('scroll', revealOnScroll, { passive: true });
revealOnScroll();

// Banner Image Slider
const bannerImages = document.querySelectorAll('.hero-bg img');
const leftZone = document.querySelector('.hero-nav-zone.left-zone');
const rightZone = document.querySelector('.hero-nav-zone.right-zone');

let currentImageIndex = 0;
let lastDisplayedIndex = -1;
let bannerInterval;

function updateBannerBg(imgElement) {
    const bannerContainer = document.querySelector('.hero-bg');
    if (bannerContainer && imgElement) {
        bannerContainer.style.setProperty('--bg-image', `url("${imgElement.src}")`);
    }
}

function transitionToBannerImage(targetIndex) {
    if (targetIndex === lastDisplayedIndex) return;
    if (targetIndex < 0 || targetIndex >= bannerImages.length) return;
    
    bannerImages.forEach(img => {
        img.classList.remove('active', 'prev');
    });
    
    if (lastDisplayedIndex !== -1 && lastDisplayedIndex < bannerImages.length) {
        bannerImages[lastDisplayedIndex].classList.add('prev');
    }
    
    bannerImages[targetIndex].classList.add('active');
    updateBannerBg(bannerImages[targetIndex]);
    lastDisplayedIndex = targetIndex;
}

function rotateBanner() {
    if (bannerImages.length <= 1) return;
    const nextIndex = (currentImageIndex + 1) % bannerImages.length;
    transitionToBannerImage(nextIndex);
    currentImageIndex = nextIndex;
}

function startBannerTimer() {
    stopBannerTimer();
    if (bannerImages.length > 1) {
        bannerInterval = setInterval(rotateBanner, 5000);
    }
}

function stopBannerTimer() {
    if (bannerInterval) {
        clearInterval(bannerInterval);
    }
}

if (bannerImages.length > 0) {
    transitionToBannerImage(0);
    startBannerTimer();
}

if (leftZone && bannerImages.length > 1) {
    leftZone.addEventListener('click', () => {
        const prevIndex = (currentImageIndex - 1 + bannerImages.length) % bannerImages.length;
        currentImageIndex = prevIndex;
        transitionToBannerImage(currentImageIndex);
        startBannerTimer();
    });
}

if (rightZone && bannerImages.length > 1) {
    rightZone.addEventListener('click', () => {
        const nextIndex = (currentImageIndex + 1) % bannerImages.length;
        currentImageIndex = nextIndex;
        transitionToBannerImage(currentImageIndex);
        startBannerTimer();
    });
}

// ============================================================
// CUSTOMER REVIEWS SLIDER & DYNAMIC GOOGLE DRIVE REVIEWS
// ============================================================
const CUSTOMER_REVIEW_API_URL = "https://script.google.com/macros/s/AKfycbwpyvC6LnmD5eOu7QLZGJ1MFfZ0Vzb1UrPiB5Sx7Hisf8es6KNa8Dc41G40HxpMTyBWxg/exec";

const reviewsSliderContainer = document.querySelector('.reviews-slider');
const reviewsDotsContainer = document.querySelector('.slider-dots');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

let reviewItems = document.querySelectorAll('.reviews-slider .review-slide');
let reviewDots = document.querySelectorAll('.slider-dots .dot');
let currentReviewIndex = 0;
let reviewInterval;

function escapeReviewHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[m]));
}

function updateReviewSliderElements() {
    reviewItems = document.querySelectorAll('.reviews-slider .review-slide');
    reviewDots = document.querySelectorAll('.slider-dots .dot');

    if (reviewDots && reviewDots.length > 0) {
        reviewDots.forEach(dot => {
            dot.onclick = (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                showReview(index);
                startReviewTimer();
            };
        });
    }

    if (reviewItems.length > 0) {
        showReview(0);
        startReviewTimer();
    }
}

function showReview(index) {
    if (!reviewItems || reviewItems.length === 0) return;

    if (index >= reviewItems.length) {
        currentReviewIndex = 0;
    } else if (index < 0) {
        currentReviewIndex = reviewItems.length - 1;
    } else {
        currentReviewIndex = index;
    }

    reviewItems.forEach((item, i) => {
        if (i === currentReviewIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (reviewDots) {
        reviewDots.forEach((dot, i) => {
            if (i === currentReviewIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

function startReviewTimer() {
    stopReviewTimer();
    if (reviewItems && reviewItems.length > 1) {
        reviewInterval = setInterval(() => {
            showReview(currentReviewIndex + 1);
        }, 5000);
    }
}

function stopReviewTimer() {
    if (reviewInterval) {
        clearInterval(reviewInterval);
    }
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        showReview(currentReviewIndex + 1);
        startReviewTimer();
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        showReview(currentReviewIndex - 1);
        startReviewTimer();
    });
}

// Initial setup with default static slides
updateReviewSliderElements();

// Fetch approved online reviews from Google Drive / Sheets API
async function fetchApprovedReviews() {
    if (!CUSTOMER_REVIEW_API_URL || !reviewsSliderContainer || !reviewsDotsContainer) return;

    try {
        const response = await fetch(CUSTOMER_REVIEW_API_URL, { method: 'GET' });
        if (!response.ok) return;

        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.reviews) && data.reviews.length > 0) {
            renderReviews(data.reviews);
        }
    } catch (err) {
        console.warn('Could not load online customer reviews, keeping default gallery:', err);
    }
}

function renderReviews(reviews) {
    if (!reviewsSliderContainer || !reviewsDotsContainer || !reviews.length) return;

    let slidesHtml = '';
    let dotsHtml = '';

    reviews.forEach((rev, idx) => {
        const activeClass = idx === 0 ? 'active' : '';
        const name = escapeReviewHtml(rev.name || 'Valued Customer');
        const quote = rev.review ? `<p class="reviewer-quote">"${escapeReviewHtml(rev.review)}"</p>` : '';

        slidesHtml += `
            <div class="review-slide ${activeClass}">
                <img src="${rev.imageUrl}" alt="Customer Review by ${name}" loading="lazy" onerror="this.onerror=null; this.src='assets/review_1.webp';">
                <div class="review-slide-info">
                    <span class="reviewer-badge"><i class="fas fa-check-circle"></i> Customer Photo</span>
                    <span class="reviewer-name"><i class="fas fa-user-circle"></i> ${name}</span>
                    ${quote}
                </div>
            </div>
        `;

        dotsHtml += `<span class="dot ${activeClass}" data-index="${idx}"></span>`;
    });

    reviewsSliderContainer.innerHTML = slidesHtml;
    reviewsDotsContainer.innerHTML = dotsHtml;

    updateReviewSliderElements();
}

// Fetch reviews on page load
fetchApprovedReviews();

// ============================================================
// ============================================================
// MAIN RESTAURANT MENU HORIZONTAL SCROLL & THREE-DOT CATEGORY FILTER
// ============================================================
const mainRestaurantMenuScroll = document.getElementById('main-restaurant-menu-scroll');
const mainMenuFilterWrapper = document.getElementById('main-menu-filter-dropdown-wrapper');
const mainMenuFilterBtn = document.getElementById('main-menu-filter-dots-btn');
const mainMenuFilterDropdown = document.getElementById('main-menu-filter-dropdown-menu');
const mainCurrentFilterLabel = document.getElementById('main-current-filter-label');
const inPageMenuTabs = document.querySelectorAll('#main-menu-filter-dropdown-menu .menu-tab-btn, .main-menu-section .menu-tab-btn');
const inPageFoodCards = document.querySelectorAll('#main-restaurant-menu-scroll .food-menu-card, .main-menu-section .food-menu-card');

// Toggle Dropdown when clicking three-dot button
if (mainMenuFilterBtn && mainMenuFilterWrapper) {
    mainMenuFilterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = mainMenuFilterWrapper.classList.toggle('open');
        mainMenuFilterBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close Dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!mainMenuFilterWrapper.contains(e.target)) {
            mainMenuFilterWrapper.classList.remove('open');
            mainMenuFilterBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mainMenuFilterWrapper.classList.contains('open')) {
            mainMenuFilterWrapper.classList.remove('open');
            mainMenuFilterBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

if (mainRestaurantMenuScroll) {
    let isPointerDown = false;
    let startXMain = 0;
    let scrollLeftMain = 0;
    let velX = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumId = null;
    let scrollPauseTimer = null;

    // Pause float animations during scroll for zero lag
    function onMenuScrolling() {
        mainRestaurantMenuScroll.classList.add('is-scrolling');
        clearTimeout(scrollPauseTimer);
        scrollPauseTimer = setTimeout(() => {
            mainRestaurantMenuScroll.classList.remove('is-scrolling');
        }, 150);
    }
    mainRestaurantMenuScroll.addEventListener('scroll', onMenuScrolling, { passive: true });

    // Mouse drag
    mainRestaurantMenuScroll.addEventListener('mousedown', (e) => {
        isPointerDown = true;
        startXMain = e.pageX;
        scrollLeftMain = mainRestaurantMenuScroll.scrollLeft;
        velX = 0;
        lastX = e.pageX;
        lastTime = performance.now();
        if (momentumId) cancelAnimationFrame(momentumId);
        mainRestaurantMenuScroll.style.scrollBehavior = 'auto';
        mainRestaurantMenuScroll.classList.add('is-scrolling');
    });

    window.addEventListener('mouseup', () => {
        if (!isPointerDown) return;
        isPointerDown = false;
        mainRestaurantMenuScroll.style.scrollBehavior = '';
        // Momentum glide
        let vel = velX;
        function glide() {
            if (Math.abs(vel) < 0.5) {
                mainRestaurantMenuScroll.classList.remove('is-scrolling');
                return;
            }
            mainRestaurantMenuScroll.scrollLeft -= vel;
            vel *= 0.92;
            momentumId = requestAnimationFrame(glide);
        }
        momentumId = requestAnimationFrame(glide);
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPointerDown) return;
        const now = performance.now();
        const dt = now - lastTime || 1;
        velX = (e.pageX - lastX) / dt * 16;
        lastX = e.pageX;
        lastTime = now;
        const walk = e.pageX - startXMain;
        mainRestaurantMenuScroll.scrollLeft = scrollLeftMain - walk;
    });

    // Touch swipe — let native touch handle it, just pause animations
    mainRestaurantMenuScroll.addEventListener('touchstart', () => {
        if (momentumId) cancelAnimationFrame(momentumId);
    }, { passive: true });
}


if (inPageMenuTabs.length > 0) {
    inPageMenuTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            const siblingTabs = document.querySelectorAll('#main-menu-filter-dropdown-menu .menu-tab-btn, .main-menu-section .menu-tab-btn');
            siblingTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const selectedCategory = tab.getAttribute('data-category');

            // Update main button label
            if (mainCurrentFilterLabel) {
                const icon = tab.querySelector('.tab-icon, i:not(.active-indicator-icon)');
                const titleSpan = tab.querySelector('.tab-title');
                const title = titleSpan ? titleSpan.textContent : tab.textContent.trim();
                const iconClass = icon ? icon.className : 'fas fa-utensils';
                mainCurrentFilterLabel.innerHTML = `<i class="${iconClass}"></i> <span>${title}</span>`;
            }

            if (inPageFoodCards.length > 0) {
                inPageFoodCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            }

            // Smoothly reset track to beginning when category is clicked
            if (mainRestaurantMenuScroll) {
                mainRestaurantMenuScroll.scrollTo({ left: 0, behavior: 'smooth' });
            }

            // Close dropdown menu after selection
            if (mainMenuFilterWrapper) {
                mainMenuFilterWrapper.classList.remove('open');
                if (mainMenuFilterBtn) {
                    mainMenuFilterBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
}

// ============================================================
// SLIDE-OUT MESSAGE PANEL LOGIC
// ============================================================
const closeMsgPanelBtn = document.getElementById('close-msg-panel-btn');
const msgPanel = document.getElementById('msg-panel');
const msgPanelOverlay = document.getElementById('msg-panel-overlay');
const msgPanelForm = document.getElementById('msg-panel-form');
const submitMsgBtn = document.getElementById('submit-msg-btn');
const msgStatusContainer = document.getElementById('msg-status-container');
const openMsgPanelDirectBtn = document.getElementById('open-msg-panel-direct-btn');

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwFRBfgECv4kyCOJCrjDmpbWn4oIkiCJOpGndOI_d3SCzTtWGuG14uJZ2xGtUIDEsL8/exec";

function openMessagePanel() {
    if (msgPanel && msgPanelOverlay) {
        msgPanel.classList.add('active');
        msgPanelOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    }
}

function closeMessagePanel() {
    if (msgPanel && msgPanelOverlay) {
        msgPanel.classList.remove('active');
        msgPanelOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        if (msgStatusContainer) {
            msgStatusContainer.style.display = 'none';
            msgStatusContainer.className = 'msg-status-container';
        }
    }
}

if (openMsgPanelDirectBtn) {
    openMsgPanelDirectBtn.addEventListener('click', openMessagePanel);
}

if (closeMsgPanelBtn) {
    closeMsgPanelBtn.addEventListener('click', closeMessagePanel);
}

if (msgPanelOverlay) {
    msgPanelOverlay.addEventListener('click', closeMessagePanel);
}

if (msgPanelForm) {
    msgPanelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('msg-name').value.trim();
        const email = document.getElementById('msg-email').value.trim();
        const content = document.getElementById('msg-content').value.trim();
        
        if (!name || !email || !content) return;
        
        if (submitMsgBtn) {
            submitMsgBtn.disabled = true;
            submitMsgBtn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';
        }
        
        try {
            const formData = new URLSearchParams();
            formData.append('Name', name);
            formData.append('Email_or_Phone', email);
            formData.append('Message', content);
            
            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });
            
            if (msgStatusContainer) {
                msgStatusContainer.style.display = 'block';
                msgStatusContainer.className = 'msg-status-container status-success';
                msgStatusContainer.innerHTML = '<i class="fas fa-check-circle"></i> Message sent successfully!';
            }
            msgPanelForm.reset();
            setTimeout(closeMessagePanel, 2000);
        } catch (error) {
            if (msgStatusContainer) {
                msgStatusContainer.style.display = 'block';
                msgStatusContainer.className = 'msg-status-container status-error';
                msgStatusContainer.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error sending message. Please try again.';
            }
        } finally {
            if (submitMsgBtn) {
                submitMsgBtn.disabled = false;
                submitMsgBtn.innerHTML = '<span>Send Message</span> <i class="fas fa-paper-plane"></i>';
            }
        }
    });
}

// ============================================================
// IN-PAGE FULL MENU POPUP MODAL LOGIC (With Three-Dot Filter Dropdown)
// ============================================================
const fullMenuModal = document.getElementById('full-menu-modal');
const openFullMenuModalBtn = document.getElementById('open-full-menu-modal-btn');
const closeFullMenuModalBtn = document.getElementById('close-full-menu-modal-btn');
const closeFullMenuIconBtn = document.getElementById('close-full-menu-icon-btn');
const fullMenuModalOverlay = document.getElementById('full-menu-modal-overlay');
const modalMenuSearchInput = document.getElementById('modal-menu-search-input');
const modalMenuSearchClearBtn = document.getElementById('modal-menu-search-clear');
const modalMenuFilterWrapper = document.getElementById('modal-menu-filter-dropdown-wrapper');
const modalMenuFilterBtn = document.getElementById('modal-menu-filter-dots-btn');
const modalCurrentFilterLabel = document.getElementById('modal-current-filter-label');
const modalCategoryTabs = document.querySelectorAll('#modal-menu-filter-dropdown-menu .menu-tab-btn, #modal-menu-category-tabs .menu-tab-btn, .full-menu-modal .menu-tab-btn');
const modalFoodCards = document.querySelectorAll('#modal-full-menu-grid .food-menu-card, .full-menu-modal .food-menu-card');
const modalNoResultsMsg = document.getElementById('modal-no-results-msg');
const modalTimingBtn = document.getElementById('modal-timing-btn');
const modalOrderTimingsSection = document.getElementById('modal-order-timings');

let modalActiveCategory = 'all';

// Modal 3-Dot Filter Dropdown Toggle
if (modalMenuFilterBtn && modalMenuFilterWrapper) {
    modalMenuFilterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = modalMenuFilterWrapper.classList.toggle('open');
        modalMenuFilterBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
        if (!modalMenuFilterWrapper.contains(e.target)) {
            modalMenuFilterWrapper.classList.remove('open');
            modalMenuFilterBtn.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalMenuFilterWrapper.classList.contains('open')) {
            modalMenuFilterWrapper.classList.remove('open');
            modalMenuFilterBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

function updateModalSearchClearBtn() {
    if (!modalMenuSearchClearBtn || !modalMenuSearchInput) return;
    if (modalMenuSearchInput.value.length > 0) {
        modalMenuSearchClearBtn.classList.add('visible');
    } else {
        modalMenuSearchClearBtn.classList.remove('visible');
    }
}

function filterModalMenu() {
    if (!modalFoodCards || modalFoodCards.length === 0) return;
    const query = modalMenuSearchInput ? modalMenuSearchInput.value.toLowerCase().trim() : '';
    let visibleCount = 0;

    modalFoodCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const keywords = (card.getAttribute('data-keywords') || '') + ' ' + card.innerText.toLowerCase();

        // When searching, show matching items regardless of whichever category filter is currently active
        const matchesCategory = (query !== '' || modalActiveCategory === 'all' || cardCategory === modalActiveCategory);
        const matchesSearch = query === '' || keywords.includes(query);

        if (matchesCategory && matchesSearch) {
            card.classList.remove('hidden');
            visibleCount++;
        } else {
            card.classList.add('hidden');
        }
    });

    if (modalNoResultsMsg) {
        modalNoResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

function openFullMenuModal() {
    if (fullMenuModal) {
        fullMenuModal.classList.add('active');
        fullMenuModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');

        modalActiveCategory = 'all';
        if (modalCategoryTabs) {
            modalCategoryTabs.forEach(t => {
                if (t.getAttribute('data-category') === 'all') {
                    t.classList.add('active');
                } else {
                    t.classList.remove('active');
                }
            });
        }
        if (modalCurrentFilterLabel) {
            modalCurrentFilterLabel.innerHTML = `<i class="fas fa-utensils"></i> <span>All Items</span>`;
        }
        if (modalMenuFilterWrapper) {
            modalMenuFilterWrapper.classList.remove('open');
            if (modalMenuFilterBtn) {
                modalMenuFilterBtn.setAttribute('aria-expanded', 'false');
            }
        }
        if (modalMenuSearchInput) {
            modalMenuSearchInput.value = '';
        }
        updateModalSearchClearBtn();
        filterModalMenu();
    }
}

function closeFullMenuModal() {
    if (fullMenuModal) {
        fullMenuModal.classList.remove('active');
        fullMenuModal.setAttribute('aria-hidden', 'true');
        
        const msgActive = msgPanel && msgPanel.classList.contains('active');
        if (!msgActive) {
            document.body.classList.remove('no-scroll');
        }
    }
}

if (openFullMenuModalBtn) {
    openFullMenuModalBtn.addEventListener('click', openFullMenuModal);
}

if (closeFullMenuModalBtn) {
    closeFullMenuModalBtn.addEventListener('click', closeFullMenuModal);
}

if (closeFullMenuIconBtn) {
    closeFullMenuIconBtn.addEventListener('click', closeFullMenuModal);
}

if (fullMenuModalOverlay) {
    fullMenuModalOverlay.addEventListener('click', closeFullMenuModal);
}

if (modalCategoryTabs.length > 0) {
    modalCategoryTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            modalCategoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            modalActiveCategory = tab.getAttribute('data-category');

            // Update modal button label
            if (modalCurrentFilterLabel) {
                const icon = tab.querySelector('.tab-icon, i:not(.active-indicator-icon)');
                const titleSpan = tab.querySelector('.tab-title');
                const title = titleSpan ? titleSpan.textContent : tab.textContent.trim();
                const iconClass = icon ? icon.className : 'fas fa-utensils';
                modalCurrentFilterLabel.innerHTML = `<i class="${iconClass}"></i> <span>${title}</span>`;
            }

            // Close modal dropdown after selection
            if (modalMenuFilterWrapper) {
                modalMenuFilterWrapper.classList.remove('open');
                if (modalMenuFilterBtn) {
                    modalMenuFilterBtn.setAttribute('aria-expanded', 'false');
                }
            }
            
            // Clear search input on tab selection so category items are clearly displayed
            if (modalMenuSearchInput && modalMenuSearchInput.value.trim() !== '') {
                modalMenuSearchInput.value = '';
                updateModalSearchClearBtn();
            }
            
            filterModalMenu();
        });
    // Hide/dismiss mobile keypad when Enter / Search key is pressed
    modalMenuSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            modalMenuSearchInput.blur();
        }
    });
    });
}

if (modalMenuSearchInput) {
    modalMenuSearchInput.addEventListener('input', () => {
        updateModalSearchClearBtn();
        const query = modalMenuSearchInput.value.toLowerCase().trim();
        // If searching with a query while on a specific filter tab, switch tab to 'all' so UI reflects all matching items
        if (query !== '' && modalActiveCategory !== 'all') {
            modalActiveCategory = 'all';
            if (modalCategoryTabs) {
                modalCategoryTabs.forEach(t => {
                    if (t.getAttribute('data-category') === 'all') {
                        t.classList.add('active');
                    } else {
                        t.classList.remove('active');
                    }
                });
            }
            if (modalCurrentFilterLabel) {
                modalCurrentFilterLabel.innerHTML = `<i class="fas fa-utensils"></i> <span>All Items</span>`;
            }
        }
        filterModalMenu();
    });
    // Hide/dismiss mobile keypad when Enter / Search key is pressed
    modalMenuSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            modalMenuSearchInput.blur();
        }
    });
}

if (modalMenuSearchClearBtn && modalMenuSearchInput) {
    modalMenuSearchClearBtn.addEventListener('click', () => {
        modalMenuSearchInput.value = '';
        updateModalSearchClearBtn();
        filterModalMenu();
        modalMenuSearchInput.focus();
    });
}

// Two-Way Scroll for Modal Timings Button (Down to Timings / Up to Top)
const modalBody = document.querySelector('.full-menu-modal-body');
const modalTimingIcon = modalTimingBtn ? modalTimingBtn.querySelector('i') : null;
const modalTimingText = modalTimingBtn ? modalTimingBtn.querySelector('span') : null;

function isNearModalTimings() {
    if (!modalOrderTimingsSection || !modalBody) return false;
    const modalBodyRect = modalBody.getBoundingClientRect();
    const timingsRect = modalOrderTimingsSection.getBoundingClientRect();
    const isScrolledToBottom = (modalBody.scrollTop + modalBody.clientHeight >= modalBody.scrollHeight - 150);
    return (timingsRect.top <= modalBodyRect.bottom - 120) || isScrolledToBottom;
}

if (modalTimingBtn && modalOrderTimingsSection && modalBody) {
    modalTimingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isNearModalTimings()) {
            modalBody.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            modalOrderTimingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    modalBody.addEventListener('scroll', () => {
        if (isNearModalTimings()) {
            modalTimingBtn.classList.add('at-bottom');
            if (modalTimingIcon) modalTimingIcon.className = 'fas fa-arrow-up';
            if (modalTimingText) modalTimingText.innerText = 'Top';
            modalTimingBtn.title = 'Scroll back to Top (উপরে ফিরে যান)';
        } else {
            modalTimingBtn.classList.remove('at-bottom');
            if (modalTimingIcon) modalTimingIcon.className = 'fas fa-clock';
            if (modalTimingText) modalTimingText.innerText = 'Timings';
            modalTimingBtn.title = 'Order Timings (অর্ডার সময়সূচী)';
        }
    }, { passive: true });
}

// Close full menu modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (fullMenuModal && fullMenuModal.classList.contains('active')) {
            closeFullMenuModal();
        }
        if (reviewUploadModal && reviewUploadModal.classList.contains('active')) {
            closeReviewModal();
        }
    }
});

// ============================================================
// CUSTOMER REVIEW PHOTO UPLOAD MODAL & GOOGLE DRIVE INTEGRATION
// ============================================================
const reviewUploadModal = document.getElementById('review-upload-modal');
const openUploadReviewBtn = document.getElementById('open-upload-review-btn');
const closeUploadModalBtn = document.getElementById('close-upload-modal-btn');
const closeUploadModalOverlay = document.getElementById('close-upload-modal-overlay');
const reviewUploadForm = document.getElementById('customer-review-upload-form');
const reviewCustomerName = document.getElementById('review-customer-name');
const reviewCustomerText = document.getElementById('review-customer-text');
const reviewPhotoInput = document.getElementById('review-photo-input');
const reviewDropzoneBox = document.getElementById('review-dropzone-box');
const reviewDropzoneEmpty = document.getElementById('review-dropzone-empty');
const reviewDropzonePreview = document.getElementById('review-dropzone-preview');
const reviewPreviewImg = document.getElementById('review-preview-img');
const reviewChangePhotoBtn = document.getElementById('review-change-photo-btn');
const reviewUploadStatus = document.getElementById('review-upload-status');
const reviewSubmitBtn = document.getElementById('review-submit-btn');
const reviewBtnSpinner = document.getElementById('review-btn-spinner');
const reviewBtnText = document.getElementById('review-btn-text');

let selectedImageBase64 = null;
let selectedImageType = 'image/jpeg';

function showReviewUploadStatus(message, type) {
    if (!reviewUploadStatus) return;
    reviewUploadStatus.innerHTML = message;
    reviewUploadStatus.className = 'review-upload-status ' + (type || '');
    reviewUploadStatus.style.display = 'block';
}

function resetReviewImageSelection() {
    selectedImageBase64 = null;
    selectedImageType = 'image/jpeg';
    if (reviewPhotoInput) reviewPhotoInput.value = '';
    if (reviewPreviewImg) reviewPreviewImg.src = '';
    if (reviewDropzonePreview) reviewDropzonePreview.style.display = 'none';
    if (reviewDropzoneEmpty) reviewDropzoneEmpty.style.display = 'flex';
}

function openReviewModal() {
    if (reviewUploadModal) {
        reviewUploadModal.classList.add('active');
        reviewUploadModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        if (reviewUploadStatus) {
            reviewUploadStatus.style.display = 'none';
            reviewUploadStatus.innerHTML = '';
        }
    }
}

function closeReviewModal() {
    if (reviewUploadModal) {
        reviewUploadModal.classList.remove('active');
        reviewUploadModal.setAttribute('aria-hidden', 'true');
        const menuActive = fullMenuModal && fullMenuModal.classList.contains('active');
        const msgActive = typeof msgPanel !== 'undefined' && msgPanel && msgPanel.classList.contains('active');
        if (!menuActive && !msgActive) {
            document.body.classList.remove('no-scroll');
        }
    }
}

if (openUploadReviewBtn) {
    openUploadReviewBtn.addEventListener('click', openReviewModal);
}

if (closeUploadModalBtn) {
    closeUploadModalBtn.addEventListener('click', closeReviewModal);
}

if (closeUploadModalOverlay) {
    closeUploadModalOverlay.addEventListener('click', closeReviewModal);
}

// Client-side image compression to optimize speed & prevent Google Drive bandwidth limits
function compressImageFile(file, maxWidth = 1280, maxHeight = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                const base64 = dataUrl.split(',')[1];
                resolve({ dataUrl, base64, mimeType: 'image/jpeg' });
            };
            img.onerror = () => reject(new Error('ছবি লোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('ফাইল রিড করতে ব্যর্থ হয়েছে।'));
        reader.readAsDataURL(file);
    });
}

async function handleSelectedPhoto(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showReviewUploadStatus('<i class="fas fa-exclamation-circle"></i> অনুগ্রহ করে একটি ইমেজ ফাইল (JPG, PNG, WEBP) নির্বাচন করুন।', 'error');
        return;
    }

    try {
        showReviewUploadStatus('<i class="fas fa-spinner fa-spin"></i> ছবি প্রসেস করা হচ্ছে...', '');
        const compressed = await compressImageFile(file);
        selectedImageBase64 = compressed.base64;
        selectedImageType = compressed.mimeType;

        if (reviewPreviewImg) {
            reviewPreviewImg.src = compressed.dataUrl;
        }
        if (reviewDropzoneEmpty) {
            reviewDropzoneEmpty.style.display = 'none';
        }
        if (reviewDropzonePreview) {
            reviewDropzonePreview.style.display = 'flex';
        }
        if (reviewUploadStatus) {
            reviewUploadStatus.style.display = 'none';
        }
    } catch (err) {
        showReviewUploadStatus('<i class="fas fa-exclamation-circle"></i> ' + err.message, 'error');
        resetReviewImageSelection();
    }
}

if (reviewDropzoneBox) {
    reviewDropzoneBox.addEventListener('click', (e) => {
        // Only open file picker if clicked on empty dropzone or box, not on the change button
        if (!selectedImageBase64 && reviewPhotoInput && !e.target.closest('#review-change-photo-btn')) {
            reviewPhotoInput.click();
        }
    });

    // Drag and Drop
    ['dragenter', 'dragover'].forEach(eventName => {
        reviewDropzoneBox.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            reviewDropzoneBox.style.borderColor = '#ffd700';
            reviewDropzoneBox.style.backgroundColor = 'rgba(255, 215, 0, 0.08)';
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        reviewDropzoneBox.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            reviewDropzoneBox.style.borderColor = '';
            reviewDropzoneBox.style.backgroundColor = '';
        });
    });

    reviewDropzoneBox.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            handleSelectedPhoto(dt.files[0]);
        }
    });
}

if (reviewPhotoInput) {
    reviewPhotoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleSelectedPhoto(e.target.files[0]);
        }
    });
}

if (reviewChangePhotoBtn && reviewPhotoInput) {
    reviewChangePhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        reviewPhotoInput.click();
    });
}

// Form Submission to Google Apps Script
if (reviewUploadForm) {
    reviewUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = reviewCustomerName ? reviewCustomerName.value.trim() : '';
        const reviewText = reviewCustomerText ? reviewCustomerText.value.trim() : '';

        if (!name) {
            showReviewUploadStatus('<i class="fas fa-exclamation-circle"></i> অনুগ্রহ করে আপনার নাম লিখুন।', 'error');
            if (reviewCustomerName) reviewCustomerName.focus();
            return;
        }

        if (!selectedImageBase64) {
            showReviewUploadStatus('<i class="fas fa-exclamation-circle"></i> অনুগ্রহ করে একটি ছবি তুলুন বা সিলেক্ট করুন।', 'error');
            return;
        }

        // Lock form & show spinner
        if (reviewSubmitBtn) reviewSubmitBtn.disabled = true;
        if (reviewBtnSpinner) reviewBtnSpinner.style.display = 'inline-block';
        if (reviewBtnText) reviewBtnText.innerHTML = '<span>আপলোড হচ্ছে...</span>';

        showReviewUploadStatus('<i class="fas fa-circle-notch fa-spin"></i> আপনার রিভিউ ও ছবি Google Drive-এ আপলোড হচ্ছে...', '');

        try {
            const payload = JSON.stringify({
                name: name,
                review: reviewText,
                imageBase64: selectedImageBase64,
                imageType: selectedImageType || 'image/jpeg'
            });

            const res = await fetch(CUSTOMER_REVIEW_API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8' // Crucial: avoids CORS preflight OPTIONS rejection
                },
                body: payload
            });

            const data = await res.json();

            if (data.status === 'success') {
                showReviewUploadStatus(
                    `<i class="fas fa-check-circle"></i> ধন্যবাদ <strong>${escapeReviewHtml(name)}</strong>! আপনার ছবি ও রিভিউ সফলভাবে জমা হয়েছে।`,
                    'success'
                );

                reviewUploadForm.reset();
                resetReviewImageSelection();

                // Re-fetch approved reviews immediately so the new review appears on screen
                fetchApprovedReviews();

                // Auto close modal after 3 seconds
                setTimeout(() => {
                    closeReviewModal();
                    if (reviewUploadStatus) {
                        reviewUploadStatus.style.display = 'none';
                    }
                }, 3000);
            } else {
                showReviewUploadStatus(
                    `<i class="fas fa-exclamation-circle"></i> ${escapeReviewHtml(data.message || 'আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')}`,
                    'error'
                );
            }
        } catch (err) {
            console.error('Customer review upload error:', err);
            showReviewUploadStatus(
                '<i class="fas fa-exclamation-circle"></i> আপলোড সম্পন্ন করা যায়নি। ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।',
                'error'
            );
        } finally {
            if (reviewSubmitBtn) reviewSubmitBtn.disabled = false;
            if (reviewBtnSpinner) reviewBtnSpinner.style.display = 'none';
            if (reviewBtnText) reviewBtnText.innerHTML = '<i class="fas fa-paper-plane"></i> ছবি আপলোড করুন';
        }
    });
}
