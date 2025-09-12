document.addEventListener("DOMContentLoaded", () => {
    const agreeBtn = document.getElementById("agreeBtn");
    const checkbox = document.getElementById("check-with-link");
    const modal = document.getElementById("policiesModal");

    agreeBtn.addEventListener("click", () => {
      checkbox.checked = true;
      checkbox.disabled = false;

      checkbox.classList.remove("cursor-not-allowed");
      checkbox.classList.add("cursor-pointer");

      // Trigger the change event to enable the proceed button
      checkbox.dispatchEvent(new Event('change'));

      modal.classList.add("hidden"); // Close the modal
      
      // Restore body scroll (remove modal-open class that locks scroll)
      document.body.classList.remove("modal-open");
      
      // Also remove any inline overflow style if present
      document.body.style.overflow = "";
    });
  });