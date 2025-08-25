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

  // Helper to open a modal by id
  function openModalById(targetId) {
    const targetModal = document.getElementById(targetId);
      console.log(`Attempting to open modal: ${targetId}`, targetModal);

      // Close other open modals but NOT the notification dropdown (it's not a .modal)
      document.querySelectorAll('.modal').forEach(modal => {
        if (modal.id !== targetId) {
          modal.classList.add('hidden');
        }
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
            
            // Note: Amenities are already populated when the page loads, no need to repopulate here
            // This prevents duplicate population issues
            console.log('🏠 Amenities modal opened - data already populated');
          }, 150);
        }
        
        // Special handling for regular amenities modal
        if (targetId === 'ammenitiesModal') {
          console.log('🏠 Regular amenities modal opened');
          
          // Check if amenities are populated in the new categorized structure
          const essentialsContainer = targetModal.querySelector('#essentialsList');
          const kitchenDiningContainer = targetModal.querySelector('#kitchenDiningList');
          const safetySecurityContainer = targetModal.querySelector('#safetySecurityList');
          const entertainmentContainer = targetModal.querySelector('#entertainmentList');
          const outdoorParkingContainer = targetModal.querySelector('#outdoorParkingList');
          const othersContainer = targetModal.querySelector('#othersContainer');
          
          if (essentialsContainer) {
            console.log('✅ Essentials container found in modal');
            if (essentialsContainer.children.length === 0) {
              console.warn('⚠️ Essentials container is empty - amenities may not have been populated');
            } else {
              console.log(`📊 Found ${essentialsContainer.children.length} essential amenities in modal`);
            }
          } else {
            console.error('❌ Essentials container not found in modal');
          }
          
          if (kitchenDiningContainer) {
            console.log('✅ Kitchen & Dining container found in modal');
            if (kitchenDiningContainer.children.length === 0) {
              console.log('ℹ️ Kitchen & Dining container is empty (no kitchen amenities)');
            } else {
              console.log(`📊 Found ${kitchenDiningContainer.children.length} kitchen & dining amenities in modal`);
            }
          } else {
            console.error('❌ Kitchen & Dining container not found in modal');
          }
          
          if (safetySecurityContainer) {
            console.log('✅ Safety & Security container found in modal');
            if (safetySecurityContainer.children.length === 0) {
              console.log('ℹ️ Safety & Security container is empty (no safety amenities)');
            } else {
              console.log(`📊 Found ${safetySecurityContainer.children.length} safety & security amenities in modal`);
            }
          } else {
            console.error('❌ Safety & Security container not found in modal');
          }
          
          if (entertainmentContainer) {
            console.log('✅ Entertainment container found in modal');
            if (entertainmentContainer.children.length === 0) {
              console.log('ℹ️ Entertainment container is empty (no entertainment amenities)');
            } else {
              console.log(`📊 Found ${entertainmentContainer.children.length} entertainment amenities in modal`);
            }
          } else {
            console.error('❌ Entertainment container not found in modal');
          }
          
          if (outdoorParkingContainer) {
            console.log('✅ Outdoor & Parking container found in modal');
            if (outdoorParkingContainer.children.length === 0) {
              console.log('ℹ️ Outdoor & Parking container is empty (no outdoor amenities)');
            } else {
              console.log(`📊 Found ${outdoorParkingContainer.children.length} outdoor & parking amenities in modal`);
            }
          } else {
            console.error('❌ Outdoor & Parking container not found in modal');
          }
          
          if (othersContainer) {
            console.log('✅ Others container found in modal');
            if (othersContainer.children.length === 0) {
              console.log('ℹ️ Others container is empty (no other amenities)');
            } else {
              console.log(`📊 Found ${othersContainer.children.length} other amenity items in modal`);
            }
          } else {
            console.error('❌ Others container not found in modal');
          }
        }
      } else {
        console.error(`Modal with ID '${targetId}' not found`);
      }
  }

  // Bind to existing elements (progressive enhancement)
  document.querySelectorAll('[data-modal-target]').forEach(btn => {
    console.log(`Found modal trigger button for: ${btn.getAttribute('data-modal-target')}`);
    btn.addEventListener('click', () => {
      openModalById(btn.getAttribute('data-modal-target'));
    });
  });

  // Delegate clicks for dynamically-added elements
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal-target]');
    if (!trigger) return;
    const targetId = trigger.getAttribute('data-modal-target');
    if (!targetId) return;
    openModalById(targetId);
  });

  // Close modal
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open'); // 👈 unlock scroll
        
        // Dispatch custom event for modal closing
        const modalClosedEvent = new CustomEvent('modalClosed', {
          detail: { modalId: modal.id, modal: modal }
        });
        document.dispatchEvent(modalClosedEvent);
      }
    });
  });

  // Close on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open'); // 👈 unlock scroll
        
        // Dispatch custom event for modal closing
        const modalClosedEvent = new CustomEvent('modalClosed', {
          detail: { modalId: modal.id, modal: modal }
        });
        document.dispatchEvent(modalClosedEvent);
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal:not(.hidden)');
      if (openModal) {
        openModal.classList.add('hidden');
        document.body.classList.remove('modal-open'); // 👈 unlock scroll
        
        // Dispatch custom event for modal closing
        const modalClosedEvent = new CustomEvent('modalClosed', {
          detail: { modalId: openModal.id, modal: openModal }
        });
        document.dispatchEvent(modalClosedEvent);
      }
    }
  });

});
