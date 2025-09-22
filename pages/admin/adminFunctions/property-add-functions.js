// Property Add Page Functions
// Handles form submission, image display, and employee assignment

// API Base URL
const API_BASE = 'https://betcha-api.onrender.com';

console.log('property-add-functions.js: Script loaded!');

// Function to load employees from API
async function loadEmployees() {
  console.log('loadEmployees: Starting to load employees...');
  try {
    const response = await fetch('https://betcha-api.onrender.com/employee/display');
    if (!response.ok) {
      console.error('Failed to fetch employees:', response.status);
      return;
    }

    const employees = await response.json();
    console.log('loadEmployees: API response received:', employees);
    
    // Wait for Alpine.js container to be ready
    const maxAttempts = 20;
    let attempts = 0;
    
    function updateEmployees() {
      attempts++;
      console.log(`loadEmployees: Attempt ${attempts} to update employees...`);
      const container = document.getElementById('assigned-employees-container');
      console.log('loadEmployees: Container found:', !!container);
      console.log('loadEmployees: Alpine available:', !!window.Alpine);
      
      if (container && window.Alpine) {
        try {
          const alpineData = window.Alpine.$data(container);
          console.log('loadEmployees: Alpine data:', alpineData);
          
          if (alpineData && alpineData.employees !== undefined) {
            // Transform API data to expected format
            const transformedEmployees = employees.map((emp, index) => {
              let roleName = 'Employee';
              if (emp.role && Array.isArray(emp.role) && emp.role.length > 0) {
                roleName = emp.role[0].name || 'Employee';
              }
              
              return {
                id: emp.employeeID || emp._id || `emp-${index}`,
                name: `${emp.firstname || 'Unknown'} ${emp.lastname || 'Employee'}`,
                position: roleName
              };
            });
            
            // Ensure unique IDs
            const uniqueEmployees = [];
            const usedIds = new Set();
            
            transformedEmployees.forEach((emp, index) => {
              let uniqueId = emp.id;
              let counter = 1;
              
              while (usedIds.has(uniqueId)) {
                uniqueId = `${emp.id}-${counter}`;
                counter++;
              }
              
              usedIds.add(uniqueId);
              uniqueEmployees.push({ ...emp, id: uniqueId });
            });
            
            console.log('loadEmployees: Setting employees to:', uniqueEmployees);
            alpineData.employees = uniqueEmployees;
            console.log('loadEmployees: Employees updated successfully!');
            return;
          } else {
            console.log('loadEmployees: Alpine data structure not ready yet');
          }
        } catch (error) {
          console.error('loadEmployees: Error accessing Alpine data:', error);
        }
      } else {
        console.log('loadEmployees: Still waiting for container or Alpine...');
      }
      
      if (attempts < maxAttempts) {
        setTimeout(updateEmployees, 250);
      } else {
        console.error('loadEmployees: Failed to update employees after maximum attempts');
      }
    }
    
    updateEmployees();
  } catch (error) {
    console.error('loadEmployees: Error loading employees:', error);
  }
}

// Function to assign employees to a newly created property
async function assignEmployeesToProperty(propertyId, employeeIds) {
  const promises = employeeIds.map(async (employeeId) => {
    try {
      const response = await fetch(`${API_BASE}/employee/display`);
      const employees = await response.json();
      const employee = employees.find(emp => emp._id === employeeId);
      
      if (employee) {
        const currentProperties = employee.properties || [];
        const updatedProperties = [...currentProperties, propertyId];
        
        await fetch(`${API_BASE}/employee/update/${employeeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstname: employee.firstname,
            lastname: employee.lastname,
            email: employee.email,
            role: employee.role,
            properties: updatedProperties
          })
        });
      }
    } catch (error) {
      console.error(`Failed to assign property to employee ${employeeId}:`, error);
    }
  });
  
  await Promise.all(promises);
}

// Function to update PhotosSection display
function updatePhotosSection(images) {
  const photosSection = document.getElementById('PhotosSection');
  if (!photosSection) return;

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
      <div class="rounded-2xl h-full col-span-1 sm:col-span-5 bg-cover bg-center bg-no-repeat" 
           style="background-image: url('${images[0].url}')">
      </div>
    `;
  } else if (images.length === 2) {
    // Two images - left large, right small
    photosHTML = `
      <div class="rounded-2xl h-full col-span-1 sm:col-span-3 bg-cover bg-center bg-no-repeat" 
           style="background-image: url('${images[0].url}')">
      </div>
      <div class="hidden sm:block sm:col-span-2 h-full">
        <div class="rounded-2xl h-full bg-cover bg-center bg-no-repeat" 
             style="background-image: url('${images[1].url}')">
        </div>
      </div>
    `;
  } else {
    // Three or more images - left large, right grid
    photosHTML = `
      <div class="rounded-2xl h-full col-span-1 sm:col-span-3 bg-cover bg-center bg-no-repeat" 
           style="background-image: url('${images[0].url}')">
      </div>
      <div class="hidden sm:grid sm:col-span-2 sm:grid-rows-2 sm:gap-3 h-full">
        <div class="rounded-2xl bg-cover bg-center bg-no-repeat" 
             style="background-image: url('${images[1].url}')">
        </div>
        <div class="rounded-2xl bg-cover bg-center bg-no-repeat" 
             style="background-image: url('${images[2].url}')">
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
  console.log('DOMContentLoaded: Event fired!');
  
  // Find the Confirm button inside the confirmDetailsModal
  const confirmModal = document.getElementById('confirmDetailsModal');
  console.log('DOMContentLoaded: confirmModal found:', !!confirmModal);
  
  let confirmBtn = null;
  if (confirmModal) {
    // Find the Confirm button by ID
    confirmBtn = document.getElementById('confirmPropertyBtn');
    console.log('DOMContentLoaded: confirmBtn found:', !!confirmBtn);
  }

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

  // Only add confirmBtn event listener if the button exists
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    // Prevent double submission by disabling button and showing loading
    if (confirmBtn.disabled) return;
    
    // Store original button content
    const originalContent = confirmBtn.innerHTML;
    
    // Set loading state
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `
      <div class="flex items-center justify-center gap-2">
        <svg class="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Creating Property...</span>
      </div>
    `;
    
    // Function to restore button state
    const restoreButton = () => {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = originalContent;
    };

    try {
      // Get selected employees before validation
    const employeeContainer = document.getElementById('assigned-employees-container');
    let selectedEmployeeIds = [];
    
    if (employeeContainer && window.Alpine) {
      const alpineData = window.Alpine.$data(employeeContainer);
      selectedEmployeeIds = alpineData.selected || [];
    }

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
      restoreButton();
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
        restoreButton();
        return;
      }
    }

    // Collect form data
    const formData = new FormData();
    
    // Main info
    formData.append('name', document.getElementById('input-prop-name').value.trim());
    formData.append('address', document.getElementById('input-prop-address').value.trim());
    formData.append('mapLink', document.getElementById('input-prop-mapLink').value.trim());
    formData.append('city', document.getElementById('input-prop-city').value.trim());
    formData.append('description', document.getElementById('input-prop-desc').value.trim());

    // Category
    formData.append('category', document.getElementById('selectedCategory').textContent.trim());

    // Capacities & Prices
    formData.append('packageCapacity', document.getElementById('input-prop-packCap').value);
    formData.append('maxCapacity', document.getElementById('input-prop-maxCap').value);
    formData.append('timeIn', document.getElementById('checkInTimeText').textContent.trim());
    formData.append('timeOut', document.getElementById('checkOutTimeText').textContent.trim());
    formData.append('packagePrice', document.getElementById('input-prop-packPrice').value);
    formData.append('additionalPax', document.getElementById('input-prop-addPaxPrice').value);
    formData.append('reservationFee', document.getElementById('input-prop-rsrvFee').value);
    formData.append('discount', document.getElementById('input-prop-discount').value);

    // Gather default amenities (checked checkboxes NOT in amenitiesList)
    const amenities = [];
    document.querySelectorAll('#editAmmenitiesModal input[type="checkbox"]:checked').forEach(cb => {
      if (!cb.closest('#amenitiesList') && cb.value) {
        amenities.push(cb.value);
      }
    });
    amenities.forEach(a => formData.append('amenities[]', a));

    // Gather otherAmenities (checked checkboxes inside amenitiesList)
    const otherAmenities = [];
    document.querySelectorAll('#amenitiesList input[type="checkbox"]:checked').forEach(cb => {
      if (cb.value) otherAmenities.push(cb.value);
    });
    otherAmenities.forEach(a => formData.append('amenities[]', a));

    // Add images to form data
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('photo', selectedFiles[i]);
    }

    // Send to API
    try {
      console.log('Sending property creation request to:', `${API_BASE}/property/create`);
      console.log('FormData contents:', Array.from(formData.entries()));
      
      const response = await fetch(`${API_BASE}/property/create`, {
        method: 'POST',
        body: formData
      });

      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Property creation result:', result);
        const newPropertyId = result._id || result.id || result.propertyId;
        
        // Assign selected employees to the new property
        if (selectedEmployeeIds.length > 0 && newPropertyId) {
          console.log('Assigning employees to property:', selectedEmployeeIds);
          try {
            await assignEmployeesToProperty(newPropertyId, selectedEmployeeIds);
            console.log('Employee assignment completed');
          } catch (assignError) {
            console.warn('Property created but employee assignment failed:', assignError);
          }
        }
        
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
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        const error = await response.json().catch(() => ({ message: errorText }));
        alert('Error: ' + (error.message || 'Failed to add property.'));
        restoreButton();
      }
    } catch (err) {
      console.error('Network/Fetch Error:', err);
      alert('Network error: ' + err.message);
      restoreButton();
    }
    } catch (outerErr) {
      console.error('Unexpected error in property creation:', outerErr);
      alert('An unexpected error occurred. Please try again.');
      restoreButton();
    }
  }); // End of confirmBtn event listener
  } // End of confirmBtn conditional

  // Initialize employee loading
  console.log('DOMContentLoaded: Initializing employee loading...');
  setTimeout(loadEmployees, 500);
});