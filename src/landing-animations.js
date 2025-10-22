/**
 * Landing Page Animations
 * Professional advertising-style animations for the landing page
 */

// Check for browser compatibility
console.log('Landing animations script loaded');

// Fallback for browsers without Intersection Observer support
if (!('IntersectionObserver' in window)) {
  console.warn('IntersectionObserver not supported, using fallback');
  // Immediately show all animated elements
  document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll(
      '.animate-on-scroll, .fade-in-up, .slide-in-left, .slide-in-right, .scale-in'
    );
    animatedElements.forEach(el => el.classList.add('animated'));
  });
} else {
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
        console.log('Animated element:', entry.target.className);
        // Optional: stop observing after animation
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Initialize animations when DOM is ready
  const initAnimations = () => {
    console.log('Initializing animations...');
    
    // Observe all animated elements
    const animatedElements = document.querySelectorAll(
      '.animate-on-scroll, .fade-in-up, .slide-in-left, .slide-in-right, .scale-in'
    );
    
    console.log('Found animated elements:', animatedElements.length);
    
    if (animatedElements.length === 0) {
      console.warn('No animated elements found! Check if CSS is loaded.');
    }
    
    animatedElements.forEach(el => {
      observer.observe(el);
      console.log('Observing:', el.className);
    });
    
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
  };

  // Try multiple initialization strategies
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    // DOM already loaded
    initAnimations();
  }
  
  // Backup: force init after a delay
  setTimeout(() => {
    if (document.querySelectorAll('.animated').length === 0) {
      console.log('Animations not initialized, forcing init...');
      initAnimations();
    }
  }, 500);
}

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
export { handleParallax };
