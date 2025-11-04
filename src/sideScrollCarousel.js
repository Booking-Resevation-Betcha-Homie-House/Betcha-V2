function initializeCarousel(wrapper) {
  const container = wrapper.querySelector(".carousel-track");
  const btnLeft = wrapper.parentElement.querySelector(".scrollLeft");
  const btnRight = wrapper.parentElement.querySelector(".scrollRight");

  if (!container || !btnLeft || !btnRight) return;

  let isScrolling = false;

  const getCardWidth = () => {
    const card = container.querySelector(".card");
    if (!card) return 320;
    const style = window.getComputedStyle(card);
    const gap = parseInt(style.marginRight) || 20;
    return card.offsetWidth + gap;
  };

  const updateButtonStates = () => {
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    btnLeft.disabled = container.scrollLeft <= 1;
    btnRight.disabled = container.scrollLeft >= maxScrollLeft - 1;

    // Add/remove disabled styling
    if (btnLeft.disabled) {
      btnLeft.classList.add('disabled');
    } else {
      btnLeft.classList.remove('disabled');
    }
    if (btnRight.disabled) {
      btnRight.classList.add('disabled');
    } else {
      btnRight.classList.remove('disabled');
    }
  };

  const scrollLeft = () => {
    if (isScrolling) return;
    isScrolling = true;
    const cardWidth = getCardWidth();
    container.scrollBy({
      left: -cardWidth,
      behavior: "smooth",
    });
    setTimeout(() => {
      isScrolling = false;
      updateButtonStates();
    }, 300);
  };

  const scrollRight = () => {
    if (isScrolling) return;
    isScrolling = true;
    const cardWidth = getCardWidth();
    container.scrollBy({
      left: cardWidth,
      behavior: "smooth",
    });
    setTimeout(() => {
      isScrolling = false;
      updateButtonStates();
    }, 300);
  };

  btnLeft.addEventListener("click", scrollLeft);
  btnRight.addEventListener("click", scrollRight);
  container.addEventListener("scroll", updateButtonStates);
  window.addEventListener("resize", updateButtonStates);

  // Initial update with delay to ensure content is loaded
  setTimeout(updateButtonStates, 100);

  // Re-check button states when content changes
  const observer = new MutationObserver(() => {
    setTimeout(updateButtonStates, 100);
  });
  observer.observe(container, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".carousel-wrapper").forEach(initializeCarousel);
});

// Export the function for use in other files
window.initializeCarousel = initializeCarousel;
