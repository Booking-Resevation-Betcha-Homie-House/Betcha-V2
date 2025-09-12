document.addEventListener('DOMContentLoaded', () => {
  
  const track = document.querySelector(".carousel-track");
  const images = document.querySelectorAll(".carousel-image");
  const dots = document.querySelectorAll(".dot");

  let index = 0;
  const totalRealSlides = images.length;

  const clone = images[0].cloneNode(true);
  track.appendChild(clone);

  function updateDots(i) {
    dots.forEach(dot => dot.classList.remove("active"));
    if (dots[i]) dots[i].classList.add("active");
  }

  function slide() {
    index++;

    track.style.transition = "transform 0.5s ease-in-out";
    track.style.transform = `translateX(-${index * 100}%)`;

    if (index === totalRealSlides) {
      updateDots(0); 
      setTimeout(() => {
        
        track.style.transition = "none";
        track.style.transform = "translateX(0%)";
        index = 0;
      }, 500); 
    } else {
      updateDots(index);
    }
  }

  updateDots(0);
  setInterval(slide, 4000);
});

