//Can now add images from the file input with id="images" but doesnt display the images in the preview

// Function to update PhotosSection display - defined globally first
function updatePhotosSection(images) {
  const photosSection = document.getElementById('PhotosSection');
  if (!photosSection) return;

  console.log('Updating PhotosSection with images:', images); // Debug log

  // Clear existing content
  photosSection.innerHTML = '';

  if (images.length === 0) {
    // Show "No photos" state
    photosSection.innerHTML = `
      <!-- Big Left Image -->
      <div class="rounded-2xl bg-neutral-300 h-full col-span-1 sm:col-span-3 flex items-center justify-center text-white">
        No photos
      </div>

      <!-- Right side two images -->
      <div class="hidden sm:grid sm:col-span-2 sm:grid-rows-2 sm:gap-3 h-full">
        <div class="rounded-2xl bg-neutral-300 flex items-center justify-center text-white">
          No photos
        </div>
        <div class="rounded-2xl bg-neutral-300 flex items-center justify-center text-white">
          No photos
        </div>
      </div>

      <!-- Floating Button -->
      <button 
        class="absolute cursor-pointer bottom-4 right-4 !px-2 !py-1 bg-white rounded-full shadow-sm flex gap-2 items-center group 
              hover:bg-primary hover:scale-105 hover:shadow-lg active:scale-95 
              transition-all duration-300 ease-in-out
              md:!py-3.5 md:!px-6">
          <span>
            <svg class="h-3 w-auto fill-primary-text 
              group-hover:fill-white group-hover:rotate-10 group-hover:scale-105
              transition-all duration-500 ease-in-out
              md:h-4" 
              viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_430_867)">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.75 0.75C7.167 0.75 5.267 0.836 3.97 0.9285C2.32 1.0465 1.0465 2.3195 0.9285 3.9705C0.836 5.267 0.75 7.167 0.75 9.75C0.75 12.333 0.836 14.233 0.9285 15.53C1.0435 17.137 2.2535 18.3865 3.841 18.56C3.77772 17.1242 3.74738 15.6872 3.75 14.25C3.75 11.6335 3.837 9.698 3.9325 8.3635C4.1035 5.9685 5.9685 4.1035 8.3635 3.9325C9.698 3.8375 11.6335 3.75 14.25 3.75C15.975 3.75 17.4035 3.788 18.56 3.841C18.3865 2.2535 17.137 1.0435 15.53 0.9285C14.233 0.836 12.333 0.75 9.75 0.75ZM14.25 5.25C11.667 5.25 9.767 5.336 8.47 5.4285C6.82 5.5465 5.5465 6.8195 5.4285 8.4705C5.336 9.767 5.25 11.667 5.25 14.25C5.25 16.833 5.336 18.733 5.4285 20.03C5.5465 21.68 6.8195 22.9535 8.4705 23.0715C9.767 23.164 11.667 23.25 14.25 23.25C16.833 23.25 18.733 23.164 20.03 23.0715C21.68 22.9535 22.9535 21.6805 23.0715 20.0295C23.164 18.733 23.25 16.833 23.25 14.25C23.25 11.667 23.164 9.767 23.0715 8.47C22.9535 6.82 21.6805 5.5465 20.0295 5.4285C18.733 5.336 16.833 5.25 14.25 5.25ZM16.25 10.25C16.25 9.71957 16.4607 9.21086 16.8358 8.83579C17.2109 8.46071 17.7196 8.25 18.25 8.25C18.7804 8.25 19.2891 8.46071 19.6642 8.83579C20.0393 9.21086 20.25 9.71957 20.25 10.25C20.25 10.7804 20.0393 11.2891 19.6642 11.6642C19.2891 12.0393 18.7804 12.25 18.25 12.25C17.7196 12.25 17.2109 12.0393 16.8358 11.6642C16.4607 11.2891 16.25 10.7804 16.25 10.25ZM21.7085 17.195C21.1768 16.7093 20.6327 16.2371 20.077 15.779C19.3305 15.168 18.3285 15.0715 17.509 15.618C16.977 15.973 16.263 16.5005 15.3445 17.2785C13.949 15.95 12.9745 15.1015 12.3245 14.5695C11.5775 13.959 10.5755 13.862 9.756 14.4085C9.077 14.8615 8.0995 15.597 6.78 16.7765C6.813 18.0825 6.868 19.1245 6.925 19.923C6.99 20.8295 7.671 21.5105 8.5775 21.575C9.836 21.665 11.7 21.75 14.25 21.75C16.8 21.75 18.664 21.665 19.923 21.575C20.8295 21.51 21.5105 20.8295 21.575 19.923C21.626 19.2115 21.675 18.307 21.7085 17.195Z"/>
              </g> 
          </svg>
        </span>
        <span class="text-xs font-inter group-hover:text-white 
          transition-all duration-500 ease-in-out
          md:text-sm">
            Edit image
        </span>
    </button>
    `;
    return;
  }

  // Create the main layout with actual images
  let photosHTML = '';

  if (images.length === 1) {
    // Single image - take full width
    photosHTML = `
      <div class="rounded-2xl h-full col-span-1 sm:col-span-5 overflow-hidden">
        <img src="${images[0].url}" alt="Property photo" class="w-full h-full object-cover">
      </div>
    `;
  } else if (images.length === 2) {
    // Two images - left large, right small
    photosHTML = `
      <div class="rounded-2xl h-full col-span-1 sm:col-span-3 overflow-hidden">
        <img src="${images[0].url}" alt="Property photo" class="w-full h-full object-cover">
      </div>
      <div class="hidden sm:block sm:col-span-2 h-full">
        <div class="rounded-2xl h-full overflow-hidden">
          <img src="${images[1].url}" alt="Property photo" class="w-full h-full object-cover">
        </div>
      </div>
    `;
  } else {
    // Three or more images - left large, right grid
    photosHTML = `
      <div class="rounded-2xl h-full col-span-1 sm:col-span-3 overflow-hidden">
        <img src="${images[0].url}" alt="Property photo" class="w-full h-full object-cover">
      </div>
      <div class="hidden sm:grid sm:col-span-2 sm:grid-rows-2 sm:gap-3 h-full">
        <div class="rounded-2xl overflow-hidden">
          <img src="${images[1].url}" alt="Property photo" class="w-full h-full object-cover">
        </div>
        <div class="rounded-2xl overflow-hidden">
          <img src="${images[2].url}" alt="Property photo" class="w-full h-full object-cover">
        </div>
      </div>
    `;
  }

  // Add the floating edit button
  photosHTML += `
    <button 
      class="absolute cursor-pointer bottom-4 right-4 !px-2 !py-1 bg-white rounded-full shadow-sm flex gap-2 items-center group 
            hover:bg-primary hover:scale-105 hover:shadow-lg active:scale-95 
            transition-all duration-300 ease-in-out
            md:!py-3.5 md:!px-6">
        <span>
          <svg class="h-3 w-auto fill-primary-text 
            group-hover:fill-white group-hover:rotate-10 group-hover:scale-105
            transition-all duration-500 ease-in-out
            md:h-4" 
            viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_430_867)">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9.75 0.75C7.167 0.75 5.267 0.836 3.97 0.9285C2.32 1.0465 1.0465 2.3195 0.9285 3.9705C0.836 5.267 0.75 7.167 0.75 9.75C0.75 12.333 0.836 14.233 0.9285 15.53C1.0435 17.137 2.2535 18.3865 3.841 18.56C3.77772 17.1242 3.74738 15.6872 3.75 14.25C3.75 11.6335 3.837 9.698 3.9325 8.3635C4.1035 5.9685 5.9685 4.1035 8.3635 3.9325C9.698 3.8375 11.6335 3.75 14.25 3.75C15.975 3.75 17.4035 3.788 18.56 3.841C18.3865 2.2535 17.137 1.0435 15.53 0.9285C14.233 0.836 12.333 0.75 9.75 0.75ZM14.25 5.25C11.667 5.25 9.767 5.336 8.47 5.4285C6.82 5.5465 5.5465 6.8195 5.4285 8.4705C5.336 9.767 5.25 11.667 5.25 14.25C5.25 16.833 5.336 18.733 5.4285 20.03C5.5465 21.68 6.8195 22.9535 8.4705 23.0715C9.767 23.164 11.667 23.25 14.25 23.25C16.833 23.25 18.733 23.164 20.03 23.0715C21.68 22.9535 22.9535 21.6805 23.0715 20.0295C23.164 18.733 23.25 16.833 23.25 14.25C23.25 11.667 23.164 9.767 23.0715 8.47C22.9535 6.82 21.6805 5.5465 20.0295 5.4285C18.733 5.336 16.833 5.25 14.25 5.25ZM16.25 10.25C16.25 9.71957 16.4607 9.21086 16.8358 8.83579C17.2109 8.46071 17.7196 8.25 18.25 8.25C18.7804 8.25 19.2891 8.46071 19.6642 8.83579C20.0393 9.21086 20.25 9.71957 20.25 10.25C20.25 10.7804 20.0393 11.2891 19.6642 11.6642C19.2891 12.0393 18.7804 12.25 18.25 12.25C17.7196 12.25 17.2109 12.0393 16.8358 11.6642C16.4607 11.2891 16.25 10.7804 16.25 10.25ZM21.7085 17.195C21.1768 16.7093 20.6327 16.2371 20.077 15.779C19.3305 15.168 18.3285 15.0715 17.509 15.618C16.977 15.973 16.263 16.5005 15.3445 17.2785C13.949 15.95 12.9745 15.1015 12.3245 14.5695C11.5775 13.959 10.5755 13.862 9.756 14.4085C9.077 14.8615 8.0995 15.597 6.78 16.7765C6.813 18.0825 6.868 19.1245 6.925 19.923C6.99 20.8295 7.671 21.5105 8.5775 21.575C9.836 21.665 11.7 21.75 14.25 21.75C16.8 21.75 18.664 21.665 19.923 21.575C20.8295 21.51 21.5105 20.8295 21.575 19.923C21.626 19.2115 21.675 18.307 21.7085 17.195Z"/>
            </g> 
        </svg>
      </span>
      <span class="text-xs font-inter group-hover:text-white 
        transition-all duration-500 ease-in-out
        md:text-sm">
        Edit image
    </span>
  </button>
  `;

  photosSection.innerHTML = photosHTML;
}

// Expose the function globally immediately
window.updatePhotosSection = updatePhotosSection;



document.addEventListener('DOMContentLoaded', function () {
  // Find the Confirm button inside the confirmDetailsModal
  const confirmModal = document.getElementById('confirmDetailsModal');
  if (!confirmModal) return;

  // Find the Confirm button (the one that says Confirm)
  const confirmBtn = Array.from(confirmModal.querySelectorAll('button'))
    .find(btn => btn.textContent && btn.textContent.trim().toLowerCase().includes('confirm'));
  if (!confirmBtn) return;

  // Function to sync modal state with PhotosSection
  function syncModalWithPhotosSection() {
    const imageContainer = document.querySelector('[x-data*="images"]');
    if (imageContainer && window.Alpine) {
      const alpineData = window.Alpine.$data(imageContainer);
      if (alpineData && alpineData.images) {
        updatePhotosSection(alpineData.images);
      }
    }
  }

  // Set up Alpine.js watchers for the edit gallery modal
  if (window.Alpine) {
    // Wait for Alpine to be ready
    window.Alpine.nextTick(() => {
      const imageContainer = document.querySelector('[x-data*="images"]');
      if (imageContainer) {
        const alpineData = window.Alpine.$data(imageContainer);
        if (alpineData) {
          // Watch for changes in the images array
          const originalImages = alpineData.images;
          Object.defineProperty(alpineData, 'images', {
            get() {
              return originalImages;
            },
            set(newValue) {
              originalImages.length = 0;
              originalImages.push(...newValue);
              updatePhotosSection(originalImages);
            }
          });

          // Also watch selectedFiles for consistency
          const originalSelectedFiles = alpineData.selectedFiles;
          Object.defineProperty(alpineData, 'selectedFiles', {
            get() {
              return originalSelectedFiles;
            },
            set(newValue) {
              originalSelectedFiles.length = 0;
              originalSelectedFiles.push(...newValue);
            }
          });
        }
      }
    });
  }

  // Alternative approach: Use MutationObserver to watch for changes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        // Check if the edit gallery modal is open and has images
        const editGalleryModal = document.getElementById('editGalleryModal');
        if (editGalleryModal && !editGalleryModal.classList.contains('hidden')) {
          const imageContainer = editGalleryModal.querySelector('[x-data*="images"]');
          if (imageContainer && window.Alpine) {
            const alpineData = window.Alpine.$data(imageContainer);
            if (alpineData && alpineData.images) {
              // Small delay to ensure Alpine.js has finished updating
              setTimeout(() => {
                updatePhotosSection(alpineData.images);
              }, 100);
            }
          }
        }
      }
    });
  });

  // Start observing the document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Listen for modal close to sync state
  document.addEventListener('modalClosed', function() {
    syncModalWithPhotosSection();
  });

  // Listen for clicks on the PhotosSection to open the modal
  document.addEventListener('click', function(e) {
    if (e.target.closest('#PhotosSection')) {
      const editGalleryModal = document.getElementById('editGalleryModal');
      if (editGalleryModal) {
        editGalleryModal.classList.remove('hidden');
        editGalleryModal.classList.add('flex');
        document.body.classList.add('modal-open'); // Lock scroll
        
        // Dispatch custom event for modal opening
        const modalOpenEvent = new CustomEvent('modalOpened', {
          detail: { modalId: 'editGalleryModal', modal: editGalleryModal }
        });
        document.dispatchEvent(modalOpenEvent);
      }
    }
  });

  confirmBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    // Validate minimum image requirement
    const imageContainer = document.querySelector('[x-data*="images"]');
    let selectedFiles = [];
    
    if (imageContainer && window.Alpine) {
      const alpineData = window.Alpine.$data(imageContainer);
      if (alpineData && alpineData.selectedFiles) {
        selectedFiles = alpineData.selectedFiles;
      }
    } else {
      // Fallback to direct file input access
      const fileInput = document.getElementById('images');
      if (fileInput && fileInput.files) {
        selectedFiles = Array.from(fileInput.files);
      }
    }

    // Check if at least 3 images are selected
    if (selectedFiles.length < 3) {
      alert(`Please select at least 3 images. You currently have ${selectedFiles.length} image(s) selected.`);
      return;
    }

    // Basic validation for required fields
    const requiredFields = [
      { id: 'input-prop-name', label: 'Property Name' },
      { id: 'input-prop-city', label: 'City' },
      { id: 'input-prop-address', label: 'Address' },
      { id: 'input-prop-desc', label: 'Description' }
    ];

    for (const field of requiredFields) {
      const element = document.getElementById(field.id);
      if (!element || !element.value.trim()) {
        alert(`Please fill in the ${field.label} field.`);
        if (element) element.focus();
        return;
      }
    }

    // Collect form data
    const formData = new FormData();
   // Main info
    const name = document.getElementById('input-prop-name').value.trim();
    console.log('Name:', name);
    formData.append('name', name);

    const address = document.getElementById('input-prop-address').value.trim();
    console.log('Address:', address);
    formData.append('address', address);

    const mapLink = document.getElementById('input-prop-mapLink').value.trim();
    console.log('Map Link:', mapLink);
    formData.append('mapLink', mapLink);

    const city = document.getElementById('input-prop-city').value.trim();
    console.log('City:', city);
    formData.append('city', city);

    const description = document.getElementById('input-prop-desc').value.trim();
    console.log('Description:', description);
    formData.append('description', description);

    // Category
    const category = document.getElementById('selectedCategory').textContent.trim();
    console.log('Category:', category);
    formData.append('category', category);

    // Capacities & Prices
    const packageCapacity = document.getElementById('input-prop-packCap').value;
    console.log('Package Capacity:', packageCapacity);
    formData.append('packageCapacity', packageCapacity);

    const maxCapacity = document.getElementById('input-prop-maxCap').value;
    console.log('Max Capacity:', maxCapacity);
    formData.append('maxCapacity', maxCapacity);

    const timeIn = document.getElementById('checkInTimeText').textContent.trim();
    console.log('Time In:', timeIn);
    formData.append('timeIn', timeIn);

    const timeOut = document.getElementById('checkOutTimeText').textContent.trim();
    console.log('Time Out:', timeOut);
    formData.append('timeOut', timeOut);

    const packagePrice = document.getElementById('input-prop-packPrice').value;
    console.log('Package Price:', packagePrice);
    formData.append('packagePrice', packagePrice);

    const additionalPax = document.getElementById('input-prop-addPaxPrice').value;
    console.log('Additional Pax:', additionalPax);
    formData.append('additionalPax', additionalPax);

    const reservationFee = document.getElementById('input-prop-rsrvFee').value;
    console.log('Reservation Fee:', reservationFee);
    formData.append('reservationFee', reservationFee);

    const discount = document.getElementById('input-prop-discount').value;
    console.log('Discount:', discount);
    formData.append('discount', discount);

    // Gather default amenities (checked checkboxes NOT in amenitiesList)
    const amenities = [];
    document.querySelectorAll('#editAmmenitiesModal input[type="checkbox"]:checked').forEach(cb => {
      if (!cb.closest('#amenitiesList') && cb.value) {
        amenities.push(cb.value);
      }
    });
    console.log('Default Amenities:', amenities);
    amenities.forEach(a => formData.append('amenities[]', a));

    // Gather otherAmenities (checked checkboxes inside amenitiesList)
    const otherAmenities = [];
    document.querySelectorAll('#amenitiesList input[type="checkbox"]:checked').forEach(cb => {
      if (cb.value) otherAmenities.push(cb.value);
    });
    console.log('Other Amenities:', otherAmenities);
    otherAmenities.forEach(a => formData.append('amenities[]', a));

    // Add images to form data (we already validated above)
    for (let i = 0; i < selectedFiles.length; i++) {
      console.log('Photo:', selectedFiles[i]);
      formData.append('photo', selectedFiles[i]);
    }

    // Send to API
    try {
      const response = await fetch(`${API_BASE}/property/create`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Property added successfully!');
        
        // Audit: Log property creation
        try {
            const userId = localStorage.getItem('userId') || '';
            const userType = localStorage.getItem('role') || localStorage.getItem('userType') || '';
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPropertyCreation === 'function' && userId) {
                window.AuditTrailFunctions.logPropertyCreation(userId, userType.charAt(0).toUpperCase() + userType.slice(1));
            }
        } catch (auditError) {
            console.warn('Audit trail for property creation failed:', auditError);
        }
        
        window.location.href = 'property.html'; // Redirect or reset as needed
      } else {
        const error = await response.json().catch(() => ({}));
        alert('Error: ' + (error.message || 'Failed to add property.'));
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  });
});