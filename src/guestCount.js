document.addEventListener("DOMContentLoaded", () => {
  // Get shared elements
  const guestSummary = document.getElementById("guestSummary");
  const confirmBtn = document.getElementById("confirmGuestCount");
  const modal = document.getElementById("guestCountModal");
  let currentGuestCount = 1;

  document.querySelectorAll(".guest-counter").forEach(counter => {
    const decreaseBtn = counter.querySelector(".decreaseGuest");
    const increaseBtn = counter.querySelector(".increaseGuest");
    const countDisplay = counter.querySelector(".guestCount");
    const maxDisplay = counter.querySelector(".maxGuestNum");

    let count = parseInt(countDisplay.textContent) || 1;
    const max = parseInt(counter.getAttribute("data-max")) || 1;
    currentGuestCount = count; // Initialize current count

    // Optional: update span to match data-max
    if (maxDisplay) maxDisplay.textContent = max;

    decreaseBtn.addEventListener("click", () => {
      if (count > 1) {
        count--;
        currentGuestCount = count;
        // Update all guest count displays
        document.querySelectorAll(".guestCount").forEach(display => {
          display.textContent = count;
        });
      }
    });

    increaseBtn.addEventListener("click", () => {
      if (count < max) {
        count++;
        currentGuestCount = count;
        // Update all guest count displays
        document.querySelectorAll(".guestCount").forEach(display => {
          display.textContent = count;
        });
      }
    });
  });

  // Handle confirm button click
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      // Update guest summary text
      if (guestSummary) {
        guestSummary.textContent = `${currentGuestCount} ${currentGuestCount === 1 ? 'guest' : 'guests'}`;
      }
      
      // Close the modal and restore scrolling
      if (modal) {
        modal.classList.add("hidden");
        document.body.classList.remove("modal-open"); // Remove scroll lock
      }
    });
  }
});
