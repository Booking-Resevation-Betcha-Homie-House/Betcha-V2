/**
 * Landing Page Animations
 * Professional advertising-style animations for the landing page
 */

// Intersection Observer for scroll-triggered animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

// Create observer instance
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animated');
      // Optional: stop observing after animation
      // observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  
  // Observe all animated elements
  const animatedElements = document.querySelectorAll(
    '.animate-on-scroll, .fade-in-up, .slide-in-left, .slide-in-right, .scale-in'
  );
  
  animatedElements.forEach(el => observer.observe(el));
  
  // Parallax effect on scroll
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleParallax();
        ticking = false;
      });
      ticking = true;
    }
  });
  
  // Shimmer effect on featured units (random intervals)
  initShimmerEffect();
});

// Parallax scroll effect
function handleParallax() {
  const scrolled = window.pageYOffset;
  const parallaxElements = document.querySelectorAll('.parallax');
  
  parallaxElements.forEach(el => {
    const speed = el.dataset.speed || 0.5;
    const yPos = -(scrolled * speed);
    el.style.transform = `translateY(${yPos}px)`;
  });
}

// Shimmer effect on random intervals
function initShimmerEffect() {
  const shimmerElements = document.querySelectorAll('.shimmer-effect');
  
  shimmerElements.forEach((el) => {
    // Random delay between 3-8 seconds
    const randomDelay = 3000 + Math.random() * 5000;
    
    setInterval(() => {
      el.classList.add('shimmer-active');
      setTimeout(() => {
        el.classList.remove('shimmer-active');
      }, 1500);
    }, randomDelay);
  });
}

// Export for use in other files if needed
export { observer, handleParallax };
