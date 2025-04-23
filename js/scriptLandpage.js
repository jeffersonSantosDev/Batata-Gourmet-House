// Simple animation for elements when they come into view
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate__animated', 'animate__fadeInUp');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card, .hero-section h1, .hero-section p').forEach(el => {
    observer.observe(el);
});

const toggleButton = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

toggleButton.addEventListener('click', () => {
    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
        setTimeout(() => {
            mobileMenu.classList.remove('scale-y-0');
            mobileMenu.classList.add('scale-y-100');
        }, 10);
    } else {
        mobileMenu.classList.remove('scale-y-100');
        mobileMenu.classList.add('scale-y-0');
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
        }, 300);
    }
});

document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('scale-y-100');
        mobileMenu.classList.add('scale-y-0');
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
        }, 300);
    });
});   
