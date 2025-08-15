document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".guest-counter").forEach(counter => {
    const decreaseBtn = counter.querySelector(".decreaseGuest");
    const increaseBtn = counter.querySelector(".increaseGuest");
    const countDisplay = counter.querySelector(".guestCount");
    const maxDisplay = counter.querySelector(".maxGuestNum");

    let count = parseInt(countDisplay.textContent) || 1;
    const max = parseInt(counter.getAttribute("data-max")) || 1;

    // Optional: update span to match data-max
    if (maxDisplay) maxDisplay.textContent = max;

    decreaseBtn.addEventListener("click", () => {
      if (count > 1) {
        count--;
        countDisplay.textContent = count;
      }
    });

    increaseBtn.addEventListener("click", () => {
      if (count < max) {
        count++;
        countDisplay.textContent = count;
      }
    });
  });
});
