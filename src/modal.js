document.addEventListener('DOMContentLoaded', () => {
  console.log('Modal.js loaded successfully');

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
    console.log(`Found modal trigger button for: ${btn.getAttribute('data-modal-target')}`);
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modal-target');
      const targetModal = document.getElementById(targetId);
      console.log(`Attempting to open modal: ${targetId}`, targetModal);

      // Close all open modals
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
      });

      // Open target modal
      if (targetModal) {
        console.log(`Opening modal: ${targetId}`);
        targetModal.classList.remove('hidden');
        document.body.classList.add('modal-open'); // 👈 lock scroll
        
        // Dispatch custom event for modal opening
        const modalOpenEvent = new CustomEvent('modalOpened', {
          detail: { modalId: targetId, modal: targetModal }
        });
        document.dispatchEvent(modalOpenEvent);
        
        // Special handling for amenities modal to ensure Alpine.js components work
        if (targetId === 'editAmmenitiesModal') {
          setTimeout(() => {
            // Use initTree method only to avoid multiple Alpine.start() calls
            if (window.Alpine && window.Alpine.initTree) {
              window.Alpine.initTree(targetModal);
              console.log('🔄 Alpine.js re-initialized for amenities modal via initTree');
            }
            
            // Force a re-evaluation of Alpine.js directives
            const xDataElements = targetModal.querySelectorAll('[x-data]');
            if (xDataElements.length === 0) {
              console.warn('⚠️ No x-data elements found in amenities modal');
            } else {
              console.log(`📊 Found ${xDataElements.length} Alpine.js components in modal`);
            }
            
            // Re-apply amenity selections when modal opens (if function exists)
            if (window.currentPropertyData && window.populateAmenities) {
              window.populateAmenities(window.currentPropertyData.amenities, window.currentPropertyData.otherAmenities);
              console.log('🏠 Amenities data repopulated in modal');
            }
          }, 150);
        }
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
