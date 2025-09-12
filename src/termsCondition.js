document.addEventListener("DOMContentLoaded", () => {
    const agreeBtn = document.getElementById("agreeBtn");
    const checkbox = document.getElementById("check-with-link");
    const modal = document.getElementById("policiesModal");

    agreeBtn.addEventListener("click", () => {
      checkbox.checked = true;
      checkbox.disabled = false;

      checkbox.classList.remove("cursor-not-allowed");
      checkbox.classList.add("cursor-pointer");

      checkbox.dispatchEvent(new Event('change'));

      modal.classList.add("hidden"); 

      document.body.classList.remove("modal-open");

      document.body.style.overflow = "";
    });
  });