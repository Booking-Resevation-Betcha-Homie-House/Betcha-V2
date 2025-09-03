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
          
          // Check if amenities are populated in the actual modal structure
          const modalSections = targetModal.querySelectorAll('.px-3.mb-5');
          
          if (modalSections.length > 0) {
            console.log(`✅ Found ${modalSections.length} amenity sections in modal`);
            
            modalSections.forEach((section, index) => {
              const sectionTitle = section.querySelector('p.font-manrope.text-2xl');
              const sectionName = sectionTitle ? sectionTitle.textContent.trim() : `Section ${index + 1}`;
              const amenityItems = section.querySelectorAll('li[id]');
              const visibleItems = section.querySelectorAll('li[id]:not(.hidden)');
              
              console.log(`📊 ${sectionName}: ${visibleItems.length}/${amenityItems.length} amenities visible`);
              
              if (amenityItems.length === 0) {
                console.warn(`⚠️ ${sectionName} section has no amenity items`);
              } else if (visibleItems.length === 0) {
                console.log(`ℹ️ ${sectionName} section has no visible amenities (filtered out)`);
              }
            });
            
            // Check for "Others" section specifically
            const othersSection = targetModal.querySelector('#ammenitiesModal .px-3.mb-5:last-child');
            if (othersSection) {
              const othersList = othersSection.querySelector('ul');
              if (othersList) {
                const othersItems = othersList.querySelectorAll('li');
                if (othersItems.length > 0) {
                  console.log(`📊 Others section: ${othersItems.length} items`);
                } else {
                  console.log('ℹ️ Others section is empty');
                }
              }
            }
          } else {
            console.error('❌ No amenity sections found in modal');
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
