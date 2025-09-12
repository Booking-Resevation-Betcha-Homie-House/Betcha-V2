document.addEventListener('DOMContentLoaded', () => {
  console.log('Modal.js loaded successfully');

  const smodal = document.getElementById("fullscreenModalCard");
  const scloseBtn = document.getElementById("closeFullscreenModal");

  if (smodal && scloseBtn) {
    scloseBtn.addEventListener("click", () => {
      smodal.classList.remove("opacity-100");
      smodal.classList.add("opacity-0");
      document.body.classList.remove("modal-open"); 

      setTimeout(() => {
        smodal.classList.add("hidden");
        smodal.classList.remove("opacity-0");
      }, 300);
    });
  }

  function openModalById(targetId) {
    const targetModal = document.getElementById(targetId);
      console.log(`Attempting to open modal: ${targetId}`, targetModal);

      document.querySelectorAll('.modal').forEach(modal => {
        if (modal.id !== targetId) {
          modal.classList.add('hidden');
        }
      });

      if (targetModal) {
        console.log(`Opening modal: ${targetId}`);
        targetModal.classList.remove('hidden');
        document.body.classList.add('modal-open'); 

        const modalOpenEvent = new CustomEvent('modalOpened', {
          detail: { modalId: targetId, modal: targetModal }
        });
        document.dispatchEvent(modalOpenEvent);

        if (targetId === 'editAmmenitiesModal') {
          setTimeout(() => {
            
            if (window.Alpine && window.Alpine.initTree) {
              window.Alpine.initTree(targetModal);
              console.log('🔄 Alpine.js re-initialized for amenities modal via initTree');
            }

            const xDataElements = targetModal.querySelectorAll('[x-data]');
            if (xDataElements.length === 0) {
              console.warn('⚠️ No x-data elements found in amenities modal');
            } else {
              console.log(`📊 Found ${xDataElements.length} Alpine.js components in modal`);
            }

            console.log('🏠 Amenities modal opened - data already populated');
          }, 150);
        }

        if (targetId === 'ammenitiesModal') {
          console.log('🏠 Regular amenities modal opened');

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

  document.querySelectorAll('[data-modal-target]').forEach(btn => {
    console.log(`Found modal trigger button for: ${btn.getAttribute('data-modal-target')}`);
    btn.addEventListener('click', () => {
      openModalById(btn.getAttribute('data-modal-target'));
    });
  });

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal-target]');
    if (!trigger) return;
    const targetId = trigger.getAttribute('data-modal-target');
    if (!targetId) return;
    openModalById(targetId);
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open'); 

        const modalClosedEvent = new CustomEvent('modalClosed', {
          detail: { modalId: modal.id, modal: modal }
        });
        document.dispatchEvent(modalClosedEvent);
      }
    });
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open'); 

        const modalClosedEvent = new CustomEvent('modalClosed', {
          detail: { modalId: modal.id, modal: modal }
        });
        document.dispatchEvent(modalClosedEvent);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal:not(.hidden)');
      if (openModal) {
        openModal.classList.add('hidden');
        document.body.classList.remove('modal-open'); 

        const modalClosedEvent = new CustomEvent('modalClosed', {
          detail: { modalId: openModal.id, modal: openModal }
        });
        document.dispatchEvent(modalClosedEvent);
      }
    }
  });

});
