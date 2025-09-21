document.addEventListener('DOMContentLoaded', () => {
  
  const track = document.querySelector(".carousel-track");
  const images = document.querySelectorAll(".carousel-image");
  const dots = document.querySelectorAll(".dot");

  let index = 0;
  const totalRealSlides = images.length;

  // Clone the first slide and append to loop
  const clone = images[0].cloneNode(true);
  track.appendChild(clone);

  function updateDots(i) {
    dots.forEach(dot => dot.classList.remove("active"));
    if (dots[i]) dots[i].classList.add("active");
  }

  function slide() {
    index++;

    // Slide to next
    track.style.transition = "transform 0.7s ease-in-out";
    track.style.transform = `translateX(-${index * 100}%)`;

    // If it's the last (cloned) slide
    if (index === totalRealSlides) {
      updateDots(0); // Show first dot while it's sliding
      setTimeout(() => {
        // Instantly reset without animation
        track.style.transition = "none";
        track.style.transform = "translateX(0%)";
        index = 0;
      }, 500); // After transition duration
    } else {
      updateDots(index);
    }
  }

  // Init first dot as active
  updateDots(0);
  setInterval(slide, 7000);
});

