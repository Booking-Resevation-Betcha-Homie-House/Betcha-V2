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

// Function to update amenities display based on modal selections
function updateAmenitiesDisplay() {
  const displayList = document.getElementById('amenitiesDisplayList');
  if (!displayList) return;

  // Get all checked amenities from the modal
  const checkedAmenities = [];
  
  // Get standard amenities (checkboxes NOT in amenitiesList)
  document.querySelectorAll('#editAmmenitiesModal input[type="checkbox"]:checked').forEach(checkbox => {
    if (!checkbox.closest('#amenitiesList')) {
      // Get the label text to determine the actual amenity
      const label = checkbox.closest('label');
      const labelText = label ? label.querySelector('span:last-child')?.textContent?.trim() : '';
      
      // Map based on actual label text to handle duplicate values
      let amenityKey = checkbox.value;
      let amenityName = labelText;
      let iconType = 'default';
      
      // Handle specific cases where HTML values are incorrect
      if (checkbox.value === 'diningTable') {
        if (labelText === 'Outdoor dining area') {
          amenityKey = 'outdoorDining';
          amenityName = 'Outdoor Dining Area';
          iconType = 'diningtable';
        } else if (labelText === 'Fire pit') {
          amenityKey = 'firePit';
          amenityName = 'Fire Pit';
          iconType = 'firePit';
        } else if (labelText === 'Pool') {
          amenityKey = 'pool';
          amenityName = 'Swimming Pool';
          iconType = 'pool';
        } else {
          // Default case: actual "Dining Table" checkbox
          amenityKey = 'diningTable';
          amenityName = 'Dining Table';
          iconType = 'diningtable';

        }
      } else if (checkbox.value === 'shower' && labelText === 'Shampoo & Conditioner') {
        amenityKey = 'shampoo';
        amenityName = 'Shampoo & Conditioner';
        iconType = 'shampoo';
      } else if (checkbox.value === 'notAllowed') {
        amenityName = 'Pets Not Allowed';
        iconType = 'petPaw';
      } else if (checkbox.value === 'foodBowl') {
        amenityName = 'Pet Bowls';
        iconType = 'bowl';
      } else if (checkbox.value === 'bed' && labelText === 'Pet bed') {
        amenityName = 'Pet Bed';
        iconType = 'petPaw';
      } else {
        // Use mapping for other amenities
        const mapping = getAmenityMapping();
        const amenityInfo = mapping[checkbox.value];
        
        if (amenityInfo) {
          amenityName = amenityInfo.name;
          iconType = amenityInfo.iconType;
        } else {
          // Fallback: use the actual label text from the checkbox
          amenityName = labelText || checkbox.value;
          // Special case: if this is actually a dining table but not caught above
          if (labelText === 'Dining Table' || checkbox.value === 'diningTable') {
            iconType = 'diningtable';
          } else {
            iconType = 'default';
          }
        }
      }
      
      checkedAmenities.push({
        value: amenityKey,
        name: amenityName,
        icon: getAmenitySVGIcon(iconType, amenityName),
        iconType: iconType
      });
    }
  });
  
  // Get custom amenities (from Alpine.js amenitiesHandler)
  const amenitiesContainer = document.querySelector('[x-data*="amenitiesHandler"]');
  if (amenitiesContainer && window.Alpine) {
    try {
      const alpineData = window.Alpine.$data(amenitiesContainer);
      if (alpineData && alpineData.amenities) {
        alpineData.amenities.forEach(amenity => {
          if (amenity.checked) {
            checkedAmenities.push({
              value: amenity.name,
              name: amenity.name,
              icon: '•' // Simple bullet for custom amenities
            });
          }
        });
      }
    } catch (error) {
      console.log('Could not access Alpine.js data:', error);
    }
  }

  // Clear and populate display
  displayList.innerHTML = '';
  
  if (checkedAmenities.length === 0) {
    displayList.innerHTML = `
      <li class="w-full p-2">
        <div class="flex gap-3 items-center">
          <span class="font-inter text-neutral-400 italic">No amenities selected</span>
        </div>
      </li>
    `;
    return;
  }

  // Show up to 5 amenities
  const displayAmenities = checkedAmenities.slice(0, 5);
  
  displayAmenities.forEach(amenity => {
    const li = document.createElement('li');
    li.className = 'w-full p-2';
    
    if (amenity.icon === '•') {
      // Custom amenity with bullet point
      li.innerHTML = `
        <div class="flex gap-3 items-center">
          <span class="w-5 h-5 flex items-center justify-center">
            <span class="w-2 h-2 bg-primary-text rounded-full"></span>
          </span>
          <span class="font-inter text-primary-text">${amenity.name}</span>
        </div>
      `;
    } else {
      // Standard amenity with proper icon
      li.innerHTML = `
        <div class="flex gap-3 items-center">
          ${amenity.icon}
          <span class="font-inter text-primary-text">${amenity.name}</span>
        </div>
      `;
    }
    
    displayList.appendChild(li);
  });
  
  // Add "and X more" if there are more than 5
  if (checkedAmenities.length > 5) {
    const moreCount = checkedAmenities.length - 5;
    const moreLi = document.createElement('li');
    moreLi.className = 'w-full p-2';
    moreLi.innerHTML = `
      <div class="flex gap-3 items-center">
        <span class="font-inter text-neutral-500 italic">and ${moreCount} more...</span>
      </div>
    `;
    displayList.appendChild(moreLi);
  }
}

// Comprehensive amenity mapping with names and icon types - matches property-edit-functions-clean.js
function getAmenityMapping() {
  return {
    'wifi': { name: 'WiFi', iconType: 'wifi' },
    'ref': { name: 'Refrigerator', iconType: 'refrigerator' },
    'bathtub': { name: 'Bathtub', iconType: 'bath' },
    'washer': { name: 'Washer', iconType: 'washer' },
    'streaming': { name: 'Streaming Services', iconType: 'tv' },
    'smokeAlarm': { name: 'Smoke Alarm', iconType: 'smokeAlarm' },
    'freeParking': { name: 'Free Parking', iconType: 'parking' },
    'balcony': { name: 'Balcony', iconType: 'balcony' },
    'allowed': { name: 'Pets Allowed', iconType: 'pets' },
    'crib': { name: 'Crib', iconType: 'crib' },
    'aircon': { name: 'Air Conditioning', iconType: 'aircon' },
    'bedset': { name: 'Complete Bed', iconType: 'bed' },
    'hanger': { name: 'Hangers', iconType: 'hanger' },
    'hairDryer': { name: 'Hair Dryer', iconType: 'hairDryer' },
    'iron': { name: 'Iron', iconType: 'iron' },
    'extraPillowBlanket': { name: 'Extra Pillows & Blankets', iconType: 'extraPillowsBlanket' },
    'towel': { name: 'Towel', iconType: 'towel' },
    'microwave': { name: 'Microwave', iconType: 'microwave' },
    'stove': { name: 'Stove', iconType: 'stove' },
    'oven': { name: 'Oven', iconType: 'oven' },
    'coffeeMaker': { name: 'Coffee Maker', iconType: 'coffeeMaker' },
    'toaster': { name: 'Toaster', iconType: 'toaster' },
    'PotsPans': { name: 'Pots & Pans', iconType: 'pan' },
    'spices': { name: 'Spices', iconType: 'salt' },

    
    // Fix for incorrect HTML values - multiple checkboxes use 'diningTable'
    'diningTable': { name: 'Dining Table', iconType: 'diningtable' },
    
    // Bathroom amenities - 'shower' value is used incorrectly for "Shampoo & Conditioner"
    'shower': { name: 'Shampoo & Conditioner', iconType: 'shampoo' },
    'shampoo': { name: 'Shampoo & Conditioner', iconType: 'shampoo' },
    'soap': { name: 'Body Soap', iconType: 'soap' },
    'toilet': { name: 'Toilet', iconType: 'toilet' },
    'toiletPaper': { name: 'Toilet Paper', iconType: 'toiletPaper' },
    'dryer': { name: 'Dryer', iconType: 'dryer' },
    'dryingRack': { name: 'Drying Rack', iconType: 'ironBoard' },
    'ironBoard': { name: 'Iron Board', iconType: 'ironBoard' },
    'cleaningProduct': { name: 'Cleaning Products', iconType: 'detergent' },
    'tv': { name: 'TV', iconType: 'tv' },
    'soundSystem': { name: 'Sound System', iconType: 'speaker' },
    'consoleGames': { name: 'Gaming Console', iconType: 'console' },
    'boardGames': { name: 'Board Games', iconType: 'chess' },
    'cardGames': { name: 'Card Games', iconType: 'card' },
    'billiard': { name: 'Pool', iconType: '8ball' },
    'fireExtinguisher': { name: 'Fire Extinguisher', iconType: 'fireExtinguisher' },
    'firstAidKit': { name: 'First Aid Kit', iconType: 'firstAidKit' },
    'cctv': { name: 'CCTV', iconType: 'cctv' },
    'smartLock': { name: 'Smart Lock', iconType: 'smartLock' },
    'guard': { name: 'Security Guard', iconType: 'guard' },
    'stairGate': { name: 'Stair Gate', iconType: 'gate' },
    'paidParking': { name: 'Paid Parking', iconType: 'parkring' },
    'bike': { name: 'Bicycle storage/rack', iconType: 'bike' },
    'garden': { name: 'Garden/Backyard', iconType: 'garden' },
    'grill': { name: 'BBQ Grill', iconType: 'grill' },
    'firePit': { name: 'Fire Pit', iconType: 'firePit' },
    'pool': { name: 'Swimming Pool', iconType: 'pool' },
    'outdoorDining': { name: 'Outdoor Dining Area', iconType: 'diningtable' },
    'petsAllowed': { name: 'Pets Allowed', iconType: 'petPaw' },
    
    // Fix for incorrect HTML values in pets section  
    'notAllowed': { name: 'Pets Not Allowed', iconType: 'petPaw' },
    'petsNotAllowed': { name: 'Pets Not Allowed', iconType: 'petPaw' },
    'foodBowl': { name: 'Pet Bowls', iconType: 'bowl' },
    'petBowls': { name: 'Pet Bowls', iconType: 'bowl' },
    'bed': { name: 'Pet Bed', iconType: 'petPaw' },
    'petBed': { name: 'Pet Bed', iconType: 'petPaw' },
    
    'babyBath': { name: 'Baby Bath', iconType: 'bath' }
  };
}

// Helper function to get display name for amenities
function getAmenityDisplayName(value) {
  const mapping = getAmenityMapping();
  return mapping[value]?.name || value;
}

// Helper function to get amenity icons based on icon type
function getAmenityIcon(value) {
  const mapping = getAmenityMapping();
  const iconType = mapping[value]?.iconType || 'default';
  
  // Check if a global icon function exists (from other parts of your app)
  if (window.getAmenityIcon && typeof window.getAmenityIcon === 'function') {
    try {
      const iconPath = window.getAmenityIcon(iconType);
      return `<img src="${iconPath}" alt="${getAmenityDisplayName(value)}" class="h-5 w-5">`;
    } catch (error) {
      console.log('Global icon function failed, using fallback');
    }
  }
  
  // Fallback to SVG icons for common amenities or simple colored indicators
  return getAmenitySVGIcon(iconType, getAmenityDisplayName(value));
}

// Function to generate SVG icons for amenities
function getAmenitySVGIcon(iconType, name) {
  // Fallback icon mapping - matches property-edit-functions-clean.js and available SVG files
  const iconMap = {
    'wifi': '/svg/wifi.svg',
    'refrigerator': '/svg/refrigerator.svg',
    'bath': '/svg/bath.svg',
    'washer': '/svg/washer.svg',
    'tv': '/svg/tv.svg',
    'smokeAlarm': '/svg/smokeAlarm.svg',
    'parking': '/svg/parkring.svg',
    'parkring': '/svg/parkring.svg',
    'balcony': '/svg/balcony.svg',
    'pets': '/svg/petPaw.svg',
    'petPaw': '/svg/petPaw.svg',
    'crib': '/svg/crib.svg',
    'aircon': '/svg/aircon.svg',
    'bed': '/svg/bed.svg',
    'hanger': '/svg/hanger.svg',
    'hairDryer': '/svg/hairDryer.svg',
    'iron': '/svg/iron.svg',
    'extraPillowsBlanket': '/svg/extraPillowsBlanket.svg',
    'towel': '/svg/towel.svg',
    'microwave': '/svg/microwave.svg',
    'stove': '/svg/stove.svg',
    'oven': '/svg/oven.svg',
    'coffeeMaker': '/svg/coffeeMaker.svg',
    'toaster': '/svg/toaster.svg',
    'pan': '/svg/pan.svg',
    'salt': '/svg/salt.svg',
    'dishes': '/svg/dishes.svg',
    'diningtable': '/svg/diningtable.svg',
    'shower': '/svg/shower.svg',
    'shampoo': '/svg/shampoo.svg',
    'soap': '/svg/soap.svg',
    'toilet': '/svg/toilet.svg',
    'toiletPaper': '/svg/toiletPaper.svg',
    'dryer': '/svg/dryer.svg',
    'ironBoard': '/svg/ironBoard.svg',
    'detergent': '/svg/detergent.svg',
    'speaker': '/svg/speaker.svg',
    'console': '/svg/console.svg',
    'chess': '/svg/chess.svg',
    '8ball': '/svg/8ball.svg',
    'fireExtinguisher': '/svg/fireExtinguisher.svg',
    'firstAidKit': '/svg/firstAidKit.svg',
    'cctv': '/svg/cctv.svg',
    'smartLock': '/svg/smartLock.svg',
    'guard': '/svg/guard.svg',
    'gate': '/svg/gate.svg',
    'bike': '/svg/bike.svg',
    'garden': '/svg/garden.svg',
    'grill': '/svg/grill.svg',
    'firePit': '/svg/firePit.svg',
    'pool': '/svg/pool.svg',
    'bowl': '/svg/bowl.svg',
    'card': '/svg/card.svg',
    'default': '/svg/add.svg'
  };

  const iconPath = iconMap[iconType] || iconMap['default'];
  

  
  return `<img src="${iconPath}" alt="${name || iconType}" class="h-5 w-5">`;
}

// Function to setup amenities event listeners
function setupAmenitiesListeners() {
  const modal = document.getElementById('editAmmenitiesModal');
  if (!modal) {
    console.log('⚠️  Amenities modal not found, retrying...');
    setTimeout(setupAmenitiesListeners, 500);
    return;
  }

  // Remove any existing listeners to prevent duplicates
  document.querySelectorAll('#editAmmenitiesModal input[type="checkbox"]').forEach(checkbox => {
    checkbox.removeEventListener('change', updateAmenitiesDisplay);
    checkbox.addEventListener('change', updateAmenitiesDisplay);
  });

  // Initial display update
  updateAmenitiesDisplay();
  console.log('🎯 Amenities display system initialized with', document.querySelectorAll('#editAmmenitiesModal input[type="checkbox"]').length, 'checkboxes');
}

// Expose functions globally
window.updateAmenitiesDisplay = updateAmenitiesDisplay;
window.setupAmenitiesListeners = setupAmenitiesListeners;

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
    
    // Find and disable ALL close buttons (X and Cancel)
    const closeButtons = confirmModal.querySelectorAll('[data-close-modal]');
    const originalCloseModalAttrs = [];
    
    // Set loading state
    confirmBtn.disabled = true;
    
    // Disable all close buttons
    closeButtons.forEach((btn, index) => {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      // Store original attribute for restoration
      originalCloseModalAttrs[index] = btn.getAttribute('data-close-modal');
      // Remove data-close-modal attribute to prevent modal closing
      btn.removeAttribute('data-close-modal');
      // Completely disable pointer events
      btn.style.pointerEvents = 'none';
    });
    
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
      
      // Restore all close buttons
      closeButtons.forEach((btn, index) => {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        // Restore data-close-modal attribute
        if (originalCloseModalAttrs[index] !== null) {
          btn.setAttribute('data-close-modal', originalCloseModalAttrs[index]);
        }
        btn.style.pointerEvents = '';
      });
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

  // Initialize amenities display update
  setTimeout(setupAmenitiesListeners, 1000);

  // Listen for modal events to update display when modal is closed/opened
  document.addEventListener('click', function(e) {
    // When modal is closed
    if (e.target.matches('[data-close-modal]') && 
        e.target.closest('#editAmmenitiesModal')) {
      setTimeout(updateAmenitiesDisplay, 100);
    }
    
    // When modal is opened
    if (e.target.matches('[data-modal-target="editAmmenitiesModal"]')) {
      setTimeout(() => {
        // Re-setup listeners when modal opens
        setupAmenitiesListeners();
      }, 200);
    }
  });
  
  // Event delegation for checkbox changes in amenities modal
  document.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox' && 
        e.target.closest('#editAmmenitiesModal')) {
      updateAmenitiesDisplay();
    }
  });

  // Listen for clicks on custom amenity checkboxes (Alpine.js managed)
  document.addEventListener('click', function(e) {
    if (e.target.matches('#amenitiesList input[type="checkbox"]')) {
      setTimeout(updateAmenitiesDisplay, 50);
    }
  });

  // Listen for custom amenity additions/removals
  const amenitiesObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.id === 'amenitiesList' && 
          (mutation.type === 'childList' || mutation.type === 'subtree')) {
        setTimeout(updateAmenitiesDisplay, 50);
      }
    });
  });

  // Start observing the amenities list for changes
  setTimeout(() => {
    const amenitiesList = document.getElementById('amenitiesList');
    if (amenitiesList) {
      amenitiesObserver.observe(amenitiesList, {
        childList: true,
        subtree: true
      });
    }
  }, 1500);
});