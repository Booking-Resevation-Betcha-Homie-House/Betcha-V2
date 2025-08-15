document.addEventListener('DOMContentLoaded', () => {

  const smodal = document.getElementById("fullscreenModalCard");
  const scloseBtn = document.getElementById("closeFullscreenModal");

  if (smodal && scloseBtn) {
    scloseBtn.addEventListener("click", () => {
      smodal.classList.remove("opacity-100");
      smodal.classList.add("opacity-0");
      document.body.classList.remove("modal-open"); // 👈 unlock scroll

      setTimeout(() => {
        smodal.classList.add("hidden");
        smodal.classList.remove("opacity-0");
      }, 300);
    });
  }

  // Open modal
  document.querySelectorAll('[data-modal-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-target');
      const targetModal = document.getElementById(targetId);

      // Close all open modals
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
      });

      // Open target modal
      if (targetModal) {
        targetModal.classList.remove('hidden');
        document.body.classList.add('modal-open'); // 👈 lock scroll
      }
    });
  });

  // Close modal
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open'); // 👈 unlock scroll
      }
    });
  });

  // Close on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open'); // 👈 unlock scroll
      }
    });
  });

});
