document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".carousel-wrapper").forEach(wrapper => {
    const container = wrapper.querySelector(".carousel-track");
    const btnLeft = wrapper.parentElement.querySelector(".scrollLeft");
    const btnRight = wrapper.parentElement.querySelector(".scrollRight");

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
    };

    btnLeft.addEventListener("click", () => {
      container.scrollBy({
        left: -getCardWidth(),
        behavior: "smooth",
      });
    });

    btnRight.addEventListener("click", () => {
      container.scrollBy({
        left: getCardWidth(),
        behavior: "smooth",
      });
    });

    container.addEventListener("scroll", updateButtonStates);
    window.addEventListener("resize", updateButtonStates);
    updateButtonStates();
  });
});
