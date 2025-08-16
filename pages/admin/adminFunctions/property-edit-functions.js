// Property Edit Functions
// This file handles populating the edit form with existing property data
// and manages the edit functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get property ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (propertyId) {
        // Fetch property data and populate the edit form
        fetchPropertyDataForEdit(propertyId);
    } else {
        console.error('No property ID provided for editing');
        showErrorMessage('No property ID provided. Please go back and select a property to edit.');
    }
    
    // Initialize edit form functionality
    initializeEditForm();
});

// Fetch property data for editing
async function fetchPropertyDataForEdit(propertyId) {
    try {
        const response = await fetch(`https://betcha-api.onrender.com/property/display/${propertyId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const propertyData = await response.json();
        console.log('Property data for editing:', propertyData);
        
        // Populate the edit form with the fetched data
        populateEditForm(propertyData);
        
    } catch (error) {
        console.error('Error fetching property data for editing:', error);
        showErrorMessage('Failed to load property data for editing. Please try again later.');
    }
}

// Populate the edit form with existing property data
function populateEditForm(data) {
    // Basic property information
    populateBasicInfoForEdit(data);
    
    // Property images (if any)
    populateImagesForEdit(data.photoLinks);
    
    // Property amenities
    populateAmenitiesForEdit(data.amenities, data.otherAmenities);
    
    // Map link
    populateMapLinkForEdit(data.mapLink);
    
    // Store the property ID for form submission
    storePropertyId(data._id);
}

// Populate basic property information in edit form
function populateBasicInfoForEdit(data) {
    // Property name
    const nameInput = document.getElementById('input-prop-name');
    if (nameInput) {
        nameInput.value = data.name || '';
    }
    
    // Property address
    const addressInput = document.getElementById('input-prop-address');
    if (addressInput) {
        addressInput.value = data.address || '';
    }
    
    // Property description
    const descTextarea = document.getElementById('input-prop-desc');
    if (descTextarea) {
        descTextarea.value = data.description || '';
    }
    
    // Category dropdown
    populateCategoryDropdown(data.category);
    
    // Status dropdown
    populateStatusDropdown(data.status);
    
    // Package capacity
    const packCapInput = document.getElementById('input-prop-packCap');
    if (packCapInput) {
        packCapInput.value = data.packageCapacity || '';
    }
    
    // Maximum capacity
    const maxCapInput = document.getElementById('input-prop-maxCap');
    if (maxCapInput) {
        maxCapInput.value = data.maxCapacity || '';
    }
    
    // Check-in time
    populateCheckInTime(data.timeIn);
    
    // Check-out time
    populateCheckOutTime(data.timeOut);
    
    // Package price
    const packPriceInput = document.getElementById('input-prop-packPrice');
    if (packPriceInput) {
        packPriceInput.value = data.packagePrice || '';
    }
    
    // Reservation fee
    const rsrvFeeInput = document.getElementById('input-prop-rsrvFee');
    if (rsrvFeeInput) {
        rsrvFeeInput.value = data.reservationFee || '';
    }
    
    // Additional pax price
    const addPaxPriceInput = document.getElementById('input-prop-addPaxPrice');
    if (addPaxPriceInput) {
        addPaxPriceInput.value = data.additionalPax || '';
    }
    
    // Discount
    const discountInput = document.getElementById('input-prop-discount');
    if (discountInput) {
        discountInput.value = data.discount || '';
    }
}

// Populate category dropdown
function populateCategoryDropdown(selectedCategory) {
    const categoryDropdownBtn = document.getElementById('categoryDropdownBtn');
    const selectedCategorySpan = document.getElementById('selectedCategory');
    
    if (categoryDropdownBtn && selectedCategorySpan) {
        // Set the selected category text
        selectedCategorySpan.textContent = selectedCategory || 'Select Category';
        
        // Populate dropdown options
        const categoryOptions = [
            'Hotel', 'Resort', 'Apartment', 'House', 'Condo', 'Villa', 'Cabin', 'Other'
        ];
        
        const dropdownList = document.getElementById('categoryDropdownList');
        if (dropdownList) {
            dropdownList.innerHTML = '';
            
            categoryOptions.forEach(category => {
                const li = document.createElement('li');
                li.className = 'px-4 py-2 hover:bg-primary/10 cursor-pointer transition-colors';
                li.textContent = category;
                li.onclick = () => {
                    selectedCategorySpan.textContent = category;
                    dropdownList.classList.add('hidden');
                    // Store selected value
                    document.getElementById('selectedCategory').dataset.value = category;
                };
                dropdownList.appendChild(li);
            });
        }
        
        // Toggle dropdown
        categoryDropdownBtn.onclick = () => {
            const dropdownList = document.getElementById('categoryDropdownList');
            const icon = document.getElementById('categoryDropdownIcon');
            if (dropdownList) {
                dropdownList.classList.toggle('hidden');
                if (icon) {
                    icon.style.transform = dropdownList.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            }
        };
    }
}

// Populate status dropdown
function populateStatusDropdown(selectedStatus) {
    const statusDropdownBtn = document.getElementById('statusDropdownBtn');
    const selectedStatusSpan = document.getElementById('selectedStatus');
    
    if (statusDropdownBtn && selectedStatusSpan) {
        // Set the selected status text
        selectedStatusSpan.textContent = selectedStatus || 'Select Status';
        
        // Populate dropdown options
        const statusOptions = [
            'Active', 'Inactive', 'Maintenance', 'Booked', 'Available'
        ];
        
        const dropdownList = document.getElementById('statusDropdownList');
        if (dropdownList) {
            dropdownList.innerHTML = '';
            
            statusOptions.forEach(status => {
                const li = document.createElement('li');
                li.className = 'px-4 py-2 hover:bg-primary/10 cursor-pointer transition-colors';
                li.textContent = status;
                li.onclick = () => {
                    selectedStatusSpan.textContent = status;
                    dropdownList.classList.add('hidden');
                    // Store selected value
                    document.getElementById('selectedStatus').dataset.value = status;
                };
                dropdownList.appendChild(li);
            });
        }
        
        // Toggle dropdown
        statusDropdownBtn.onclick = () => {
            const dropdownList = document.getElementById('statusDropdownList');
            const icon = document.getElementById('statusDropdownIcon');
            if (dropdownList) {
                dropdownList.classList.toggle('hidden');
                if (icon) {
                    icon.style.transform = dropdownList.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            }
        };
    }
}

// Populate check-in time dropdown
function populateCheckInTime(selectedTime) {
    const checkInTimeBtn = document.getElementById('checkInTimeBtn');
    const checkInTimeText = document.getElementById('checkInTimeText');
    
    if (checkInTimeBtn && checkInTimeText) {
        // Set the selected time text
        checkInTimeText.textContent = selectedTime || 'Select Time';
        
        // Generate time options (every 30 minutes)
        const timeOptions = generateTimeOptions();
        
        const dropdownList = document.getElementById('checkInTimeList');
        if (dropdownList) {
            dropdownList.innerHTML = '';
            
            timeOptions.forEach(time => {
                const li = document.createElement('li');
                li.className = 'px-4 py-2 hover:bg-primary/10 cursor-pointer transition-colors';
                li.textContent = time;
                li.onclick = () => {
                    checkInTimeText.textContent = time;
                    dropdownList.classList.add('hidden');
                    // Store selected value
                    document.getElementById('checkInTimeInput').value = time;
                };
                dropdownList.appendChild(li);
            });
        }
        
        // Toggle dropdown
        checkInTimeBtn.onclick = () => {
            const dropdownList = document.getElementById('checkInTimeList');
            if (dropdownList) {
                dropdownList.classList.toggle('hidden');
            }
        };
    }
}

// Populate check-out time dropdown
function populateCheckOutTime(selectedTime) {
    const checkOutTimeBtn = document.getElementById('checkOutTimeBtn');
    const checkOutTimeText = document.getElementById('checkOutTimeText');
    
    if (checkOutTimeBtn && checkOutTimeText) {
        // Set the selected time text
        checkOutTimeText.textContent = selectedTime || 'Select Time';
        
        // Generate time options (every 30 minutes)
        const timeOptions = generateTimeOptions();
        
        const dropdownList = document.getElementById('checkOutTimeList');
        if (dropdownList) {
            dropdownList.innerHTML = '';
            
            timeOptions.forEach(time => {
                const li = document.createElement('li');
                li.className = 'px-4 py-2 hover:bg-primary/10 cursor-pointer transition-colors';
                li.textContent = time;
                li.onclick = () => {
                    checkOutTimeText.textContent = time;
                    dropdownList.classList.add('hidden');
                    // Store selected value
                    document.getElementById('checkOutTimeInput').value = time;
                };
                dropdownList.appendChild(li);
            });
        }
        
        // Toggle dropdown
        checkOutTimeBtn.onclick = () => {
            const dropdownList = document.getElementById('checkOutTimeList');
            if (dropdownList) {
                dropdownList.classList.toggle('hidden');
            }
        };
    }
}

// Generate time options for dropdowns
function generateTimeOptions() {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
            const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
            times.push({ value: timeString, display: displayTime });
        }
    }
    return times.map(t => t.display);
}

// Populate images for editing
function populateImagesForEdit(photoLinks) {
    if (!photoLinks || photoLinks.length === 0) {
        return;
    }
    
    const photosSection = document.getElementById('PhotosSection');
    if (!photosSection) return;
    
    // For now, just show a placeholder since image editing might require more complex handling
    // You can extend this to show existing images with edit/delete options
    console.log('Property has images:', photoLinks);
}

// Populate amenities for editing
function populateAmenitiesForEdit(amenities, otherAmenities) {
    if (!amenities) return;
    
    console.log('Property amenities:', amenities);
    console.log('Other amenities:', otherAmenities);
    
    // Clear all checkboxes first
    clearAllAmenityCheckboxes();
    
    // Populate predefined amenities based on the amenities array
    let checkedCount = 0;
    amenities.forEach(amenity => {
        const amenityId = getAmenityIdForEdit(amenity);
        if (amenityId) {
            const checkbox = document.querySelector(`input[name="${amenityId.name}"][value="${amenityId.value}"]`);
            if (checkbox) {
                checkbox.checked = true;
                checkedCount++;
                console.log(`✓ Checked amenity: ${amenityId.name} - ${amenityId.value}`);
            } else {
                console.warn(`⚠ Could not find checkbox for amenity: ${amenityId.name} - ${amenityId.value}`);
            }
        } else {
            console.warn(`⚠ No mapping found for amenity: ${amenity}`);
        }
    });
    
    console.log(`Successfully checked ${checkedCount} out of ${amenities.length} predefined amenities`);
    
    // Handle other amenities (custom amenities) - use a more robust approach
    if (otherAmenities && otherAmenities.length > 0) {
        console.log(`Attempting to populate ${otherAmenities.length} custom amenities...`);
        // Wait for Alpine.js to be ready, then populate custom amenities
        // Use a longer delay and retry mechanism to ensure Alpine.js is fully initialized
        setTimeout(() => {
            populateCustomAmenities(otherAmenities);
        }, 500);
    }
}

// Populate custom amenities in the Alpine.js component
function populateCustomAmenities(customAmenities, retryCount = 0) {
    try {
        // Try to get the Alpine.js component instance
        const amenitiesContainer = document.querySelector('[x-data="amenitiesHandler()"]');
        if (amenitiesContainer && amenitiesContainer.__x) {
            const amenitiesHandler = amenitiesContainer.__x.$data;
            
            if (amenitiesHandler && amenitiesHandler.amenities) {
                // Clear existing custom amenities
                amenitiesHandler.amenities = [];
                
                // Add each custom amenity
                customAmenities.forEach(amenityName => {
                    amenitiesHandler.amenities.push({ 
                        name: amenityName, 
                        checked: true 
                    });
                });
                
                console.log('Successfully added custom amenities via Alpine.js:', customAmenities);
                return true;
            }
        }
        
        // If Alpine.js is not ready and we haven't exceeded retry attempts, retry
        if (retryCount < 3) {
            console.log(`Alpine.js not ready, retrying in 500ms (attempt ${retryCount + 1}/3)`);
            setTimeout(() => {
                populateCustomAmenities(customAmenities, retryCount + 1);
            }, 500);
            return false;
        }
        
        // Fallback: manually populate the amenities list
        console.log('Alpine.js not available after retries, using fallback method');
        populateCustomAmenitiesFallback(customAmenities);
        return false;
        
    } catch (error) {
        console.warn('Could not access Alpine.js component, using fallback method:', error);
        populateCustomAmenitiesFallback(customAmenities);
        return false;
    }
}

// Fallback method for populating custom amenities
function populateCustomAmenitiesFallback(customAmenities) {
    const amenitiesList = document.getElementById('amenitiesList');
    if (!amenitiesList) return;
    
    // Clear existing custom amenities (keep the "Add New Amenity" item)
    const addNewItem = amenitiesList.querySelector('li:last-child');
    amenitiesList.innerHTML = '';
    
    // Add each custom amenity
    customAmenities.forEach(amenityName => {
        const li = document.createElement('li');
        li.className = 'p-2 flex items-center justify-between w-full';
        li.innerHTML = `
            <label class="relative flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    class="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border border-neutral-300 checked:bg-primary checked:border-primary"
                    name="other[]" 
                    value="${amenityName}"
                    checked
                />
                <!-- Check icon -->
                <svg class="absolute left-0 w-5 h-5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10.5L8.5 14L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="font-inter text-primary-text">${amenityName}</span>
            </label>

            <!-- Remove button -->
            <button type="button" class="cursor-pointer !p-1" onclick="removeCustomAmenity(this)">
                <svg class="w-5 h-5 stroke-neutral-500 hover:stroke-neutral-700" fill="none" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;
        amenitiesList.appendChild(li);
    });
    
    // Re-add the "Add New Amenity" item
    if (addNewItem) {
        amenitiesList.appendChild(addNewItem);
    }
    
    console.log('Added custom amenities via fallback method:', customAmenities);
}

// Function to remove custom amenities (for the fallback method)
function removeCustomAmenity(button) {
    const li = button.closest('li');
    if (li) {
        li.remove();
    }
}

// Make removeCustomAmenity globally available for HTML onclick
window.removeCustomAmenity = removeCustomAmenity;

// Get amenity ID and value for edit form based on amenity name
function getAmenityIdForEdit(amenity) {
    const amenityMap = {
        'wifi': { name: 'essentials[]', value: 'wifi' },
        'aircon': { name: 'essentials[]', value: 'aircon' },
        'bedset': { name: 'essentials[]', value: 'bedset' },
        'hanger': { name: 'essentials[]', value: 'hanger' },
        'hairDryer': { name: 'essentials[]', value: 'hairDryer' },
        'iron': { name: 'essentials[]', value: 'iron' },
        'extraPillowBlanket': { name: 'essentials[]', value: 'extraPillowBlanket' },
        'towel': { name: 'essentials[]', value: 'towel' },
        'ref': { name: 'kitchenDining[]', value: 'ref' },
        'microwave': { name: 'kitchenDining[]', value: 'microwave' },
        'stove': { name: 'kitchenDining[]', value: 'stove' },
        'oven': { name: 'kitchenDining[]', value: 'oven' },
        'coffeeMaker': { name: 'kitchenDining[]', value: 'coffeeMaker' },
        'toaster': { name: 'kitchenDining[]', value: 'toaster' },
        'PotsPans': { name: 'kitchenDining[]', value: 'PotsPans' },
        'spices': { name: 'kitchenDining[]', value: 'spices' },
        'dishesCutlery': { name: 'kitchenDining[]', value: 'dishesCutlery' },
        'diningTable': { name: 'kitchenDining[]', value: 'diningTable' },
        'bathtub': { name: 'bathroom[]', value: 'bathtub' },
        'shower': { name: 'bathroom[]', value: 'shower' },
        'shampoo': { name: 'bathroom[]', value: 'shampoo' },
        'soap': { name: 'bathroom[]', value: 'soap' },
        'toilet': { name: 'bathroom[]', value: 'toilet' },
        'toiletPaper': { name: 'bathroom[]', value: 'toiletPaper' },
        'washer': { name: 'laundry[]', value: 'washer' },
        'dryer': { name: 'laundry[]', value: 'dryer' },
        'dryingRack': { name: 'laundry[]', value: 'dryingRack' },
        'ironBoard': { name: 'laundry[]', value: 'ironBoard' },
        'cleaningProduct': { name: 'laundry[]', value: 'cleaningProduct' },
        'tv': { name: 'entertainment[]', value: 'tv' },
        'streaming': { name: 'entertainment[]', value: 'streaming' },
        'soundSystem': { name: 'entertainment[]', value: 'soundSystem' },
        'consoleGames': { name: 'entertainment[]', value: 'consoleGames' },
        'boardGames': { name: 'entertainment[]', value: 'boardGames' },
        'cardGames': { name: 'entertainment[]', value: 'cardGames' },
        'billiard': { name: 'entertainment[]', value: 'billiard' },
        'smokeAlarm': { name: 'homeSafety[]', value: 'smokeAlarm' },
        'fireExtinguisher': { name: 'homeSafety[]', value: 'fireExtinguisher' },
        'firstAidKit': { name: 'homeSafety[]', value: 'firstAidKit' },
        'cctv': { name: 'homeSafety[]', value: 'cctv' },
        'smartLock': { name: 'homeSafety[]', value: 'smartLock' },
        'guard': { name: 'homeSafety[]', value: 'guard' },
        'stairGate': { name: 'homeSafety[]', value: 'stairGate' },
        'freeParking': { name: 'parkTransport[]', value: 'freeParking' },
        'paidParking': { name: 'parkTransport[]', value: 'paidParking' },
        'bike': { name: 'parkTransport[]', value: 'bike' },
        'balcony': { name: 'outdoorNature[]', value: 'balcony' },
        'garden': { name: 'outdoorNature[]', value: 'garden' },
        'grill': { name: 'outdoorNature[]', value: 'grill' },
        'firePit': { name: 'outdoorNature[]', value: 'firePit' },
        'pool': { name: 'outdoorNature[]', value: 'pool' },
        'petsAllowed': { name: 'pets[]', value: 'allowed' },
        'petsNotAllowed': { name: 'pets[]', value: 'notAllowed' },
        'petBowls': { name: 'pets[]', value: 'foodBowl' },
        'petBed': { name: 'pets[]', value: 'bed' },
        'crib': { name: 'ff[]', value: 'crib' },
        'babyBath': { name: 'ff[]', value: 'babyBath' },
        'stairGate': { name: 'ff[]', value: 'stairGate' }
    };
    
    return amenityMap[amenity.toLowerCase()];
}

// Clear all amenity checkboxes
function clearAllAmenityCheckboxes() {
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    console.log('Cleared all amenity checkboxes');
}

// Populate map link for editing
function populateMapLinkForEdit(mapLink) {
    const mapLinkInput = document.getElementById('input-prop-mapLink');
    if (mapLinkInput && mapLink) {
        mapLinkInput.value = mapLink;
    }
}

// Store property ID for form submission
function storePropertyId(propertyId) {
    // Store the property ID in a hidden input or data attribute
    // This will be needed when submitting the form to update the correct property
    const form = document.querySelector('form') || document.body;
    let hiddenInput = document.getElementById('property-id-hidden');
    
    if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'property-id-hidden';
        hiddenInput.name = 'propertyId';
        form.appendChild(hiddenInput);
    }
    
    hiddenInput.value = propertyId;
}

// Initialize edit form functionality
function initializeEditForm() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('[id$="DropdownList"], [id$="TimeList"]');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target) && !event.target.closest('[id$="Btn"]')) {
                dropdown.classList.add('hidden');
            }
        });
    });
    
    // Initialize save functionality
    initializeSaveFunctionality();
    
    // Initialize discard functionality
    initializeDiscardFunctionality();
}

// Initialize save functionality
function initializeSaveFunctionality() {
    const saveButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (saveButton) {
        saveButton.onclick = () => {
            // Validate form data
            if (validateEditForm()) {
                // Show confirmation modal or proceed with save
                console.log('Form is valid, proceeding with save...');
                // You can implement the actual save logic here
            }
        };
    }
}

// Initialize discard functionality
function initializeDiscardFunctionality() {
    const discardButton = document.querySelector('[data-modal-target="discardDetailsModal"]');
    if (discardButton) {
        discardButton.onclick = () => {
            // Show confirmation modal for discarding changes
            console.log('Discard changes clicked...');
            // You can implement the actual discard logic here
        };
    }
}

// Validate edit form
function validateEditForm() {
    const requiredFields = [
        'input-prop-name',
        'input-prop-address',
        'input-prop-desc',
        'input-prop-packCap',
        'input-prop-maxCap',
        'input-prop-packPrice',
        'input-prop-rsrvFee',
        'input-prop-addPaxPrice'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#ef4444'; // Red border for invalid fields
        } else if (field) {
            field.style.borderColor = ''; // Reset border color
        }
    });
    
    // Check if category and status are selected
    const selectedCategory = document.getElementById('selectedCategory');
    const selectedStatus = document.getElementById('selectedStatus');
    
    if (selectedCategory && selectedCategory.textContent === 'Select Category') {
        isValid = false;
        console.log('Category not selected');
    }
    
    if (selectedStatus && selectedStatus.textContent === 'Select Status') {
        isValid = false;
        console.log('Status not selected');
    }
    
    if (!isValid) {
        showErrorMessage('Please fill in all required fields and select category and status.');
    }
    
    return isValid;
}

// Show error message
function showErrorMessage(message) {
    console.error(message);
    // You can implement a more user-friendly error display here
    // For example, show a toast notification or modal
}

// Show success message
function showSuccessMessage(message) {
    console.log(message);
    // You can implement a success message display here
}

// Export functions for use in other files if needed
window.propertyEditFunctions = {
    populateEditForm,
    validateEditForm,
    showErrorMessage,
    showSuccessMessage,
    populateAmenitiesForEdit,
    getAmenityIdForEdit,
    clearAllAmenityCheckboxes,
    populateCustomAmenities,
    populateCustomAmenitiesFallback,
    removeCustomAmenity,
    testAmenitiesFunctionality
};

// Test function to verify amenities functionality
function testAmenitiesFunctionality() {
    console.log('🧪 Testing amenities functionality...');
    
    // Test predefined amenities
    const testAmenities = ['wifi', 'aircon', 'tv', 'pool'];
    console.log('Testing predefined amenities:', testAmenities);
    
    // Test custom amenities
    const testCustomAmenities = ['Custom Amenity 1', 'Custom Amenity 2'];
    console.log('Testing custom amenities:', testCustomAmenities);
    
    // Simulate populating amenities
    populateAmenitiesForEdit(testAmenities, testCustomAmenities);
    
    console.log('🧪 Amenities test completed. Check console for results.');
}

// Make test function globally available
window.testAmenitiesFunctionality = testAmenitiesFunctionality;
