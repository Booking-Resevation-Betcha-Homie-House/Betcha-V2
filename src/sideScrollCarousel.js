function initializeCarousel(wrapper) {
  const container = wrapper.querySelector(".carousel-track");
  const btnLeft = wrapper.parentElement.querySelector(".scrollLeft");
  const btnRight = wrapper.parentElement.querySelector(".scrollRight");

  if (!container || !btnLeft || !btnRight) return;

  const getCardWidth = () => {
    const card = container.querySelector(".card");
    const style = window.getComputedStyle(card);
    const gap = parseInt(style.marginRight) || 20;
    return card ? card.offsetWidth + gap : 320;
  };

  const updateButtonStates = () => {
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    btnLeft.disabled = container.scrollLeft <= 0;
    btnRight.disabled = container.scrollLeft >= maxScrollLeft - 5;

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

  const handleScroll = () => {
    const cardWidth = getCardWidth();
    container.scrollBy({
      left: cardWidth * (event.target === btnLeft ? -1 : 1),
      behavior: "smooth",
    });
  };

  btnLeft.addEventListener("click", handleScroll);
  btnRight.addEventListener("click", handleScroll);
  container.addEventListener("scroll", updateButtonStates);
  window.addEventListener("resize", updateButtonStates);

  updateButtonStates();

  const observer = new MutationObserver(updateButtonStates);
  observer.observe(container, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".carousel-wrapper").forEach(initializeCarousel);
});

window.initializeCarousel = initializeCarousel;
