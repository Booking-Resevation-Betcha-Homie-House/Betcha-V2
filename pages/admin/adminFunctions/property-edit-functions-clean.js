//refractor or clean the code if possible

// ==================== CONSTANTS & GLOBALS ====================
const API_BASE_URL = 'https://betcha-api.onrender.com';
let currentPropertyId = null;
let currentPropertyImages = [];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Property Edit Functions - DOM loaded!');
    
    // Check if global amenity functions are available
    console.log('🔍 Checking global amenity functions availability:');
    console.log('  - window.getAmenityDisplayInfo:', typeof window.getAmenityDisplayInfo);
    console.log('  - window.getAmenityIcon:', typeof window.getAmenityIcon);
    
    const propertyId = getPropertyIdFromUrl();
    if (propertyId) {
        initializePropertyEdit(propertyId);
    } else {
        console.log('No property ID provided. Initializing form components for manual testing.');
        initializeFormComponents();
    }
});

// ==================== UTILITY FUNCTIONS ====================
function getPropertyIdFromUrl() { //delete this soon after testing
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type}`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => messageEl.remove(), 5000);
}

function showErrorMessage(message) {
    showMessage(message, 'error');
    console.error('❌', message);
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
    console.log('✅', message);
}

function handleError(message, error = null) {
    if (error) console.error('Error:', error);
    showErrorMessage(message);
}

// ==================== API FUNCTIONS ====================
class PropertyAPI {
    static async fetchProperty(propertyId) {
        try {
            const response = await fetch(`${API_BASE_URL}/property/display/${propertyId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to fetch property: ${error.message}`);
        }
    }

    static async updateProperty(propertyId, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/property/update/${propertyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            
            // Log property update audit
            try {
                if (window.AuditTrailFunctions) {
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    const userId = userData.userId || userData.user_id || 'unknown';
                    const userType = userData.role || 'admin';
                    await window.AuditTrailFunctions.logPropertyUpdate(userId, userType, propertyId);
                }
            } catch (auditError) {
                console.error('Audit trail error:', auditError);
            }
            
            return result;
        } catch (error) {
            throw new Error(`Failed to update property: ${error.message}`);
        }
    }

    static async uploadImages(propertyId, files) {
        try {
            const formData = new FormData();
            files.forEach(file => formData.append('photos', file));

            const response = await fetch(`${API_BASE_URL}/property/update/photos/${propertyId}`, {
                method: 'PATCH',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to upload images: ${error.message}`);
        }
    }

    static async deleteImage(imageUrl) {
        try {
            console.log('🗑️ Deleting image with URL:', imageUrl);
            console.log('🆔 Using property ID:', currentPropertyId);
            
            const response = await fetch(`${API_BASE_URL}/property/photos/delete/${currentPropertyId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    photoUrl: imageUrl
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            console.log('✅ Image deleted successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to delete image:', error);
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }
}

// ==================== MAIN INITIALIZATION ====================
async function initializePropertyEdit(propertyId) {
    try {
        currentPropertyId = propertyId;
        
        // Fetch and populate property data
        const propertyData = await PropertyAPI.fetchProperty(propertyId);
        populateForm(propertyData);
        
        // Initialize form functionality
        initializeFormComponents();
        
        console.log('✅ Property edit initialized successfully');
    } catch (error) {
        handleError('Failed to load property data for editing', error);
    }
}

// ==================== FORM POPULATION ====================
function populateForm(data) {
    populateBasicInfo(data);
    populateImages(data.photoLinks);
    populateAmenities(data.amenities, data.otherAmenities);
    populateMapLink(data.mapLink);
    storePropertyId(data._id);
}

function populateBasicInfo(data) {
    const fields = {
        'input-prop-name': data.name,
        'input-prop-city': data.city,
        'input-prop-address': data.address,
        'input-prop-desc': data.description,
        'input-prop-packCap': data.packageCapacity,
        'input-prop-maxCap': data.maxCapacity,
        'input-prop-packPrice': data.packagePrice,
        'input-prop-rsrvFee': data.reservationFee,
        'input-prop-addPaxPrice': data.additionalPax,
        'input-prop-discount': data.discount,
        'input-prop-mapLink': data.mapLink
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && value !== undefined) {
            element.value = value;
        }
    });

    // Populate dropdowns
    populateDropdowns(data);
    
    // Populate time fields
    populateTimeFields(data);
}

function populateDropdowns(data) {
    // Populate category dropdown
    if (data.category) {
        const categoryButton = document.getElementById('categoryDropdownBtn');
        const selectedCategory = document.getElementById('selectedCategory');
        if (categoryButton && selectedCategory) {
            selectedCategory.textContent = data.category;
        }
    }
    
    // Update archive/activate button UI based on status instead of dropdown
    if (data.status) {
        updateArchiveButtonUI(data.status);
    }
}

function populateTimeFields(data) {
    // Populate check-in time
    if (data.timeIn) {
        const checkInTimeText = document.getElementById('checkInTimeText');
        const checkInTimeInput = document.getElementById('checkInTimeInput');
        if (checkInTimeText) checkInTimeText.textContent = data.timeIn;
        if (checkInTimeInput) checkInTimeInput.value = data.timeIn;
    }
    
    // Populate check-out time
    if (data.timeOut) {
        const checkOutTimeText = document.getElementById('checkOutTimeText');
        const checkOutTimeInput = document.getElementById('checkOutTimeInput');
        if (checkOutTimeText) checkOutTimeText.textContent = data.timeOut;
        if (checkOutTimeInput) checkOutTimeInput.value = data.timeOut;
    }
}

function populateDropdown(type, selectedValue) {
    if (!selectedValue) return;

    const displayElement = document.getElementById(`${type}-display`);
    const inputElement = document.getElementById(`input-prop-${type}`);
    
    if (displayElement) displayElement.textContent = selectedValue;
    if (inputElement) inputElement.value = selectedValue;
}

function populateTime(type, selectedTime) {
    if (!selectedTime) return;

    const displayElement = document.getElementById(`${type}-display`);
    const inputElement = document.getElementById(`input-prop-${type}`);
    
    if (displayElement) displayElement.textContent = selectedTime;
    if (inputElement) inputElement.value = selectedTime;
}

function populateImages(photoLinks) {
    if (!photoLinks || photoLinks.length === 0) return;

    currentPropertyImages = photoLinks;
    
    // Update main gallery display
    const photoSection = document.getElementById('PhotosSection');
    if (photoSection) {
        updateGalleryDisplay(photoLinks);
    }
}

function updateGalleryDisplay(images) {
    const photoSection = document.getElementById('PhotosSection');
    if (!photoSection) return;

    // Clear existing content
    photoSection.innerHTML = '';

    // If no images, show placeholder
    if (!images || images.length === 0) {
        photoSection.innerHTML = `
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
        `;
        addEditButton(photoSection);
        return;
    }

    // Create main image (always the first image)
    const mainImage = document.createElement('div');
    mainImage.className = 'rounded-2xl bg-cover bg-center h-full col-span-1 sm:col-span-3 relative group';
    mainImage.style.backgroundImage = `url(${images[0]})`;
    // No delete button in main gallery
    photoSection.appendChild(mainImage);

    // Create side images container
    const sideContainer = document.createElement('div');
    sideContainer.className = 'hidden sm:grid sm:col-span-2 sm:grid-rows-2 sm:gap-3 h-full';
    
    // Handle second image
    if (images.length > 1) {
        const secondImage = document.createElement('div');
        secondImage.className = 'rounded-2xl bg-cover bg-center relative group';
        secondImage.style.backgroundImage = `url(${images[1]})`;
        // No delete button in main gallery
        sideContainer.appendChild(secondImage);
    } else {
        // Show placeholder for second image
        const placeholder = document.createElement('div');
        placeholder.className = 'rounded-2xl bg-neutral-300 flex items-center justify-center text-white';
        placeholder.textContent = 'No photos';
        sideContainer.appendChild(placeholder);
    }
    
    // Handle third image
    if (images.length > 2) {
        const thirdImage = document.createElement('div');
        thirdImage.className = 'rounded-2xl bg-cover bg-center relative group';
        thirdImage.style.backgroundImage = `url(${images[2]})`;
        // No delete button in main gallery
        sideContainer.appendChild(thirdImage);
    } else {
        // Show placeholder for third image
        const placeholder = document.createElement('div');
        placeholder.className = 'rounded-2xl bg-neutral-300 flex items-center justify-center text-white';
        placeholder.textContent = 'No photos';
        sideContainer.appendChild(placeholder);
    }
    
    photoSection.appendChild(sideContainer);

    // Add edit button
    addEditButton(photoSection);
}

function addEditButton(container) {
    const editButton = document.createElement('button');
    editButton.className = `absolute cursor-pointer bottom-4 right-4 px-3 py-2 bg-white rounded-2xl shadow-md 
                           flex gap-2 items-center group hover:bg-primary hover:scale-105 hover:shadow-lg 
                           active:scale-95 transition-all duration-300 ease-in-out
                           md:px-4 md:py-3`;
    editButton.setAttribute('data-modal-target', 'editGalleryModal');
    editButton.innerHTML = `
        <span>
            <svg class="h-4 w-4 fill-primary-text 
              group-hover:fill-white group-hover:rotate-12 group-hover:scale-110
              transition-all duration-300 ease-in-out" 
              viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
        </span>
        <span class="text-sm font-medium text-primary-text group-hover:text-white 
          transition-all duration-300 ease-in-out">
            Edit Photos
        </span>
    `;
    container.appendChild(editButton);
}

function populateAmenities(amenities, otherAmenities) {
    console.log('Populating amenities:', amenities, 'Other amenities:', otherAmenities);
    
    // Clear existing selections
    clearAmenitySelections();
    
    // Amenity mapping from data values to checkbox values
    const amenityMapping = {
        'wifi': 'wifi',
        'stove': 'stove', 
        'bathtub': 'bathtub',
        'washer': 'washer',
        'aircon': 'aircon',
        'bedset': 'bedset',
        'hanger': 'hanger',
        'hairDryer': 'hairDryer',
        'iron': 'iron',
        'extraPillowBlanket': 'extraPillowBlanket',
        'towel': 'towel',
        'ref': 'ref',
        'microwave': 'microwave',
        'oven': 'oven',
        'coffeeMaker': 'coffeeMaker',
        'toaster': 'toaster',
        'PotsPans': 'PotsPans',
        'spices': 'spices',
        'dishesCutlery': 'dishesCutlery',
        'shower': 'shower',
        'soap': 'soap',
        'toilet': 'toilet',
        'toiletPaper': 'toiletPaper',
        'dryer': 'dryer'
    };
    
    // Populate standard amenities
    if (amenities && Array.isArray(amenities)) {
        amenities.forEach(amenity => {
            // Try to find checkbox by mapped value or original value
            const mappedValue = amenityMapping[amenity] || amenity;
            let checkbox = document.querySelector(`input[type="checkbox"][value="${mappedValue}"]`);
            
            // If not found, try searching by name attribute
            if (!checkbox) {
                checkbox = document.querySelector(`input[name*="[]"][value="${mappedValue}"]`);
            }
            
            if (checkbox) {
                checkbox.checked = true;
                console.log(`✅ Checked amenity: ${amenity} -> ${mappedValue}`);
            } else {
                console.log(`❌ Amenity checkbox not found: ${amenity}`);
                // Log all available checkboxes for debugging
                const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
                console.log('Available checkboxes:', Array.from(allCheckboxes).map(cb => cb.value));
            }
        });
    }
    
    // Handle other amenities if they exist
    if (otherAmenities && Array.isArray(otherAmenities) && otherAmenities.length > 0) {
        console.log('Other amenities found:', otherAmenities);
        // Handle custom amenities if needed
    }

    // Update the visual display
    updateAmenitiesDisplay(amenities || []);
}

// Update the amenities display section
function updateAmenitiesDisplay(amenities) {
    console.log('Updating amenities display with:', amenities);
    
    // Find the amenities container by ID
    const container = document.getElementById('amenitiesDisplay');
    
    if (!container) {
        console.warn('Amenities display container not found with ID: amenitiesDisplay');
        return;
    }
    
    console.log('Found amenities container:', container);
    
    // Clear existing display
    container.innerHTML = '';
    
    // If no amenities, show a message
    if (!amenities || amenities.length === 0) {
        container.innerHTML = `
            <li class="w-full p-2">
                <div class="flex gap-3 items-center">
                    <span class="font-inter text-neutral-400 italic">No amenities selected</span>
                </div>
            </li>
        `;
        return;
    }
    
    // Limit to 5 amenities and get user-friendly names and icons
    const displayAmenities = amenities.slice(0, 5);
    
    // Use global amenity functions if available, otherwise fall back to local mapping
    let amenityMapping = {};
    
    if (window.getAmenityDisplayInfo) {
        // Use the global function to get display info
        displayAmenities.forEach(amenity => {
            const info = window.getAmenityDisplayInfo(amenity);
            amenityMapping[amenity] = { name: info.name, iconType: info.icon };
        });
    } else {
        // Fallback mapping
        amenityMapping = {
            'wifi': { name: 'WiFi', iconType: 'wifi' },
            'ref': { name: 'Refrigerator', iconType: 'refrigerator' },
            'bathtub': { name: 'Bathtub', iconType: 'bathtub' },
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
            'extraPillowBlanket': { name: 'Extra Pillows & Blankets', iconType: 'pillow' },
            'towel': { name: 'Towel', iconType: 'towel' },
            'microwave': { name: 'Microwave', iconType: 'microwave' },
            'stove': { name: 'Stove', iconType: 'stove' },
            'oven': { name: 'Oven', iconType: 'oven' },
            'coffeeMaker': { name: 'Coffee Maker', iconType: 'coffee' },
            'toaster': { name: 'Toaster', iconType: 'toaster' },
            'PotsPans': { name: 'Pots & Pans', iconType: 'pots' },
            'spices': { name: 'Spices', iconType: 'spices' },
            'dishesCutlery': { name: 'Dishes & Cutlery', iconType: 'dishes' },
            'diningTable': { name: 'Dining Table', iconType: 'table' },
            'shower': { name: 'Shower', iconType: 'shower' },
            'shampoo': { name: 'Shampoo', iconType: 'shampoo' },
            'soap': { name: 'Soap', iconType: 'soap' },
            'toilet': { name: 'Toilet', iconType: 'toilet' },
            'toiletPaper': { name: 'Toilet Paper', iconType: 'toiletPaper' },
            'dryer': { name: 'Dryer', iconType: 'dryer' },
            'dryingRack': { name: 'Drying Rack', iconType: 'dryingRack' },
            'ironBoard': { name: 'Iron Board', iconType: 'ironBoard' },
            'cleaningProduct': { name: 'Cleaning Products', iconType: 'cleaning' },
            'tv': { name: 'TV', iconType: 'tv' },
            'soundSystem': { name: 'Sound System', iconType: 'speaker' },
            'consoleGames': { name: 'Gaming Console', iconType: 'gamepad' },
            'boardGames': { name: 'Board Games', iconType: 'chess' },
            'cardGames': { name: 'Card Games', iconType: 'cards' },
            'billiard': { name: 'Billiard Table', iconType: 'billiard' },
            'fireExtinguisher': { name: 'Fire Extinguisher', iconType: 'fireExtinguisher' },
            'firstAidKit': { name: 'First Aid Kit', iconType: 'firstAid' },
            'cctv': { name: 'CCTV', iconType: 'cctv' },
            'smartLock': { name: 'Smart Lock', iconType: 'smartLock' },
            'guard': { name: 'Security Guard', iconType: 'guard' },
            'stairGate': { name: 'Stair Gate', iconType: 'gate' },
            'paidParking': { name: 'Paid Parking', iconType: 'parking' },
            'bike': { name: 'Bicycle', iconType: 'bike' },
            'garden': { name: 'Garden', iconType: 'garden' },
            'grill': { name: 'Grill', iconType: 'grill' },
            'firePit': { name: 'Fire Pit', iconType: 'firePit' },
            'pool': { name: 'Swimming Pool', iconType: 'pool' },
            'petsAllowed': { name: 'Pets Allowed', iconType: 'pets' },
            'petsNotAllowed': { name: 'No Pets', iconType: 'pets' },
            'petBowls': { name: 'Pet Bowls', iconType: 'petBowl' },
            'petBed': { name: 'Pet Bed', iconType: 'petBed' },
            'babyBath': { name: 'Baby Bath', iconType: 'babyBath' }
        };
    }
    
    // Add each amenity to the display
    displayAmenities.forEach(amenity => {
        const mapping = amenityMapping[amenity] || { name: amenity, iconType: 'default' };
        
        // Get the icon SVG - use global function if available, otherwise use local function
        let iconSvg;
        console.log(`🔍 Processing amenity "${amenity}" with mapping:`, mapping);
        
        if (window.getAmenityIcon) {
            const iconPath = window.getAmenityIcon(mapping.iconType);
            console.log(`✅ Using global function for "${mapping.iconType}": ${iconPath}`);
            iconSvg = `<img src="${iconPath}" alt="${mapping.name}" class="h-5 w-5 fill-primary-text">`;
        } else {
            console.log(`⚠️ Global function not available, using local fallback for "${mapping.iconType}"`);
            iconSvg = getAmenityIconFromModal(mapping.iconType);
        }
        
            const listItem = document.createElement('li');
            listItem.className = 'w-full p-2';
            listItem.innerHTML = `
                <div class="flex gap-3 items-center">
                ${iconSvg}
                <span class="font-inter text-primary-text">${mapping.name}</span>
                </div>
            `;
            container.appendChild(listItem);
    });
    
    console.log('Amenities display updated successfully - showing', displayAmenities.length, 'amenities');
}

// Function to get amenity icons from the modal - now using the same icons as property-view.js
function getAmenityIconFromModal(iconType) {
    // Use the global function from property-view.js if available, otherwise fall back to local mapping
    if (window.getAmenityIcon) {
        const iconPath = window.getAmenityIcon(iconType);
        return `<img src="${iconPath}" alt="${iconType}" class="h-5 fill-primary-text">`;
    }
    
    // Fallback icon mapping (comprehensive version)
    const iconMap = {
        'wifi': '/public/svg/wifi.svg',
        'refrigerator': '/public/svg/refrigerator.svg',
        'bathtub': '/public/svg/bath.svg',
        'washer': '/public/svg/washer.svg',
        'tv': '/public/svg/tv.svg',
        'smokeAlarm': '/public/svg/smokeAlarm.svg',
        'parking': '/public/svg/parkring.svg',
        'balcony': '/public/svg/balcony.svg',
        'pets': '/public/svg/petPaw.svg',
        'crib': '/public/svg/crib.svg',
        'aircon': '/public/svg/aircon.svg',
        'bed': '/public/svg/bed.svg',
        'hanger': '/public/svg/hanger.svg',
        'hairDryer': '/public/svg/hairDryer.svg',
        'iron': '/public/svg/iron.svg',
        'pillow': '/public/svg/extraPillowsBlanket.svg',
        'towel': '/public/svg/towel.svg',
        'microwave': '/public/svg/microwave.svg',
        'stove': '/public/svg/stove.svg',
        'oven': '/public/svg/oven.svg',
        'coffee': '/public/svg/coffeeMaker.svg',
        'toaster': '/public/svg/toaster.svg',
        'pots': '/public/svg/pan.svg',
        'spices': '/public/svg/salt.svg',
        'dishes': '/public/svg/dishes.svg',
        'table': '/public/svg/diningtable.svg',
        'shower': '/public/svg/shower.svg',
        'shampoo': '/public/svg/shampoo.svg',
        'soap': '/public/svg/soap.svg',
        'toilet': '/public/svg/toilet.svg',
        'toiletPaper': '/public/svg/toiletPaper.svg',
        'dryer': '/public/svg/dryer.svg',
        'dryingRack': '/public/svg/ironBoard.svg',
        'ironBoard': '/public/svg/ironBoard.svg',
        'cleaning': '/public/svg/detergent.svg',
        'speaker': '/public/svg/speaker.svg',
        'gamepad': '/public/svg/console.svg',
        'chess': '/public/svg/chess.svg',
        'cards': '/public/svg/card.svg',
        'billiard': '/public/svg/chess.svg',
        'fireExtinguisher': '/public/svg/fireExtinguisher.svg',
        'firstAid': '/public/svg/firstAidKit.svg',
        'cctv': '/public/svg/cctv.svg',
        'smartLock': '/public/svg/smartLock.svg',
        'guard': '/public/svg/guard.svg',
        'gate': '/public/svg/gate.svg',
        'bike': '/public/svg/bike.svg',
        'garden': '/public/svg/garden.svg',
        'grill': '/public/svg/grill.svg',
        'firePit': '/public/svg/firePit.svg',
        'pool': '/public/svg/pool.svg',
        'petBowl': '/public/svg/bowl.svg',
        'petBed': '/public/svg/bed.svg',
        'babyBath': '/public/svg/bath.svg',
        'default': '/public/svg/add.svg'
    };
    
    const iconPath = iconMap[iconType] || iconMap['default'];
    console.log(`🎨 Local fallback icon path for ${iconType}: ${iconPath}`);
    return `<img src="${iconPath}" alt="${iconType}" class="h-5 fill-primary-text">`;
}

function clearAmenitySelections() {
    // Clear all checkboxes in the amenities modal
    document.querySelectorAll('#editAmmenitiesModal input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function findAmenityCheckbox(amenityName) {
    return document.querySelector(`input[name="amenities"][value="${amenityName}"]`);
}

function populateCustomAmenities(customAmenities) {
    const container = document.querySelector('.custom-amenities-container');
    if (!container) return;

    customAmenities.forEach(amenity => {
        addCustomAmenityToContainer(container, amenity);
    });
}

function addCustomAmenityToContainer(container, amenityText) {
    const amenityElement = document.createElement('div');
    amenityElement.className = 'custom-amenity-item';
    amenityElement.innerHTML = `
        <span>${amenityText}</span>
        <button type="button" onclick="removeCustomAmenity(this)" class="remove-btn">×</button>
    `;
    container.appendChild(amenityElement);
}

function populateMapLink(mapLink) {
    const mapInput = document.getElementById('input-prop-map');
    if (mapInput && mapLink) {
        mapInput.value = mapLink;
    }
}

function storePropertyId(propertyId) {
    const hiddenInput = document.getElementById('property-id-hidden');
    if (hiddenInput) {
        hiddenInput.value = propertyId;
    }
}

// ==================== FORM COMPONENTS INITIALIZATION ====================
function initializeFormComponents() {
    initializeModalSystem();
    initializeDropdowns();
    initializeImageEditing();
    initializeSaveAndDiscardFunctionality();
}

function initializeModalSystem() {
    // Modal triggers
    document.querySelectorAll('[data-modal-target]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal-target');
            showModal(modalId);
            
            if (modalId === 'editGalleryModal') {
                initializeImageEditing();
            } else if (modalId === 'editAmmenitiesModal') {
                // Let modal.js handle Alpine.js initialization for amenities modal
                console.log('Amenities modal opened - Alpine.js handled by modal.js');
            }
        });
    });

    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = closeBtn.closest('.modal');
            if (modal) hideModal(modal.id);
        });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal(modal.id);
        });
    });
}

function initializeDropdowns() {
    setupDropdown('category', ['Hotel', 'Apartment', 'Resort', 'Villa']);
    setupTimeDropdowns();
}

function setupDropdown(type, options) {
    const button = document.getElementById(`${type}-btn`);
    const list = document.getElementById(`${type}-list`);
    const input = document.getElementById(`input-prop-${type}`);
    const display = document.getElementById(`${type}-display`);

    if (!button || !list || !input || !display) return;

    // Toggle dropdown
    button.addEventListener('click', () => {
        list.classList.toggle('hidden');
    });

    // Handle option selection
    list.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const value = e.target.textContent.trim();
            input.value = value;
            display.textContent = value;
            list.classList.add('hidden');
        }
    });
}

function setupTimeDropdowns() {
    setupTimeDropdown('checkIn');
    setupTimeDropdown('checkOut');
}

// ==================== ARCHIVE/ACTIVATE TOGGLE ====================
function initializeArchiveToggle() {
    const toggleBtn = document.getElementById('archiveToggleBtn');
    const toggleText = document.getElementById('archiveToggleText');
    const selectedStatus = document.getElementById('selectedStatus');

    if (!toggleBtn || !toggleText) return;

    const currentStatus = (selectedStatus?.textContent || '').trim();
    updateArchiveButtonUI(currentStatus);

    // Always attach handler once
    if (!toggleBtn._archiveHandlerAttached) {
        toggleBtn.addEventListener('click', async () => {
            const statusNow = (document.getElementById('statusText')?.textContent || selectedStatus?.textContent || '').trim();
            if (statusNow.toLowerCase() === 'archived') {
                await updatePropertyStatus('Active');
            }
        });
        toggleBtn._archiveHandlerAttached = true;
    }
}

function updateArchiveButtonUI(status) {
    const toggleBtn = document.getElementById('archiveToggleBtn');
    const toggleText = document.getElementById('archiveToggleText');
    if (!toggleBtn || !toggleText) return;

    const isArchived = (status || '').toLowerCase() === 'archived';

    if (isArchived) {
        // Make button prominent and actionable
        toggleBtn.classList.remove('bg-neutral-100', 'hover:bg-neutral-200');
        toggleBtn.classList.add('bg-emerald-100', 'hover:bg-emerald-200');
        toggleText.classList.remove('text-neutral-700');
        toggleText.classList.add('text-emerald-700');
        toggleText.textContent = 'Activate';
        toggleBtn.disabled = false;
        toggleBtn.style.pointerEvents = 'auto';
        toggleBtn.style.opacity = '1';
    } else {
        // In non-archived states, show as Archive but disabled (no archiving flow here)
        toggleBtn.classList.remove('bg-emerald-100', 'hover:bg-emerald-200');
        toggleBtn.classList.add('bg-neutral-100', 'hover:bg-neutral-200');
        toggleText.classList.remove('text-emerald-700');
        toggleText.classList.add('text-neutral-700');
        toggleText.textContent = 'Archive';
        toggleBtn.disabled = true;
        toggleBtn.style.pointerEvents = 'none';
        toggleBtn.style.opacity = '0.6';
    }
}

async function updatePropertyStatus(newStatus) {
    try {
        if (!currentPropertyId) throw new Error('Property ID not found');
        await PropertyAPI.updateProperty(currentPropertyId, { status: newStatus });
        
        // Log property status change audit
        try {
            if (window.AuditTrailFunctions) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userId = userData.userId || userData.user_id || 'unknown';
                const userType = userData.role || 'admin';
                if (newStatus === 'Archived') {
                    await window.AuditTrailFunctions.logPropertyArchive(userId, userType, currentPropertyId);
                } else {
                    await window.AuditTrailFunctions.logPropertyActivation(userId, userType, currentPropertyId);
                }
            }
        } catch (auditError) {
            console.error('Audit trail error:', auditError);
        }
        
        const selectedStatus = document.getElementById('selectedStatus');
        if (selectedStatus) selectedStatus.textContent = newStatus;
        updateArchiveButtonUI(newStatus);
        showSuccessMessage(`Status updated to ${newStatus}`);
        // Redirect to properties list to match archive behavior
        setTimeout(() => { window.location.href = 'property.html'; }, 1500);
    } catch (error) {
        handleError('Failed to update status', error);
    }
}

function setupTimeDropdown(type) {
    const button = document.getElementById(`${type}-btn`);
    const list = document.getElementById(`${type}-list`);
    const input = document.getElementById(`input-prop-${type}`);
    const display = document.getElementById(`${type}-display`);

    if (!button || !list || !input || !display) return;

    // Generate time options if not already present
    if (list.children.length === 0) {
        generateTimeOptions().forEach(time => {
            const li = document.createElement('li');
            li.textContent = time;
            li.className = 'cursor-pointer hover:bg-gray-100 p-2';
            list.appendChild(li);
        });
    }

    // Toggle dropdown
    button.addEventListener('click', () => {
        list.classList.toggle('hidden');
    });

    // Handle option selection
    list.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const value = e.target.textContent.trim();
            input.value = value;
            display.textContent = value;
            list.classList.add('hidden');
        }
    });
}

function generateTimeOptions() {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            times.push(timeString);
        }
    }
    return times;
}

// ==================== IMAGE UPLOAD FUNCTIONALITY ====================
let selectedImageFiles = [];
let imageUploadInitialized = false; // Prevent multiple initialization

function initializeImageEditing() {
    if (imageUploadInitialized) {
        console.log('Image upload already initialized, skipping...');
        return;
    }
    const fileInput = document.querySelector('#editGalleryModal input[type="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            handleImageSelection(e);
            await uploadAllImages(); // Automatically upload after selection
        });
        imageUploadInitialized = true;
        console.log('Image upload functionality initialized');
        // Populate existing images in the modal
        populateGalleryModal();
    } else {
        console.warn('File input not found in edit gallery modal');
    }
}

function populateGalleryModal() {
    console.log('📸 Populating gallery modal with existing images...');
    const gallery = document.querySelector('#editGalleryModal .grid');
    
    if (!gallery) {
        console.warn('Gallery container not found in modal');
        return;
    }

    if (!currentPropertyImages || currentPropertyImages.length === 0) {
        console.log('No existing images to display');
        return;
    }

    // Clear existing images (except file input)
    const existingImages = gallery.querySelectorAll('.existing-image');
    existingImages.forEach(img => img.remove());

    // Remove Save Images button if present (legacy)
    const saveBtn = gallery.parentElement?.querySelector('button[onclick="uploadAllImages()"]');
    if (saveBtn) saveBtn.remove();

    console.log('📸 Displaying', currentPropertyImages.length, 'existing images');

    currentPropertyImages.forEach((imageUrl, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'existing-image relative group rounded-lg overflow-hidden bg-gray-100';
        
        imageContainer.innerHTML = `
            <img src="${imageUrl}" 
                 alt="Property image ${index + 1}" 
                 class="w-full h-32 md:h-48 object-cover">
            <button onclick="deleteExistingImage('${imageUrl}', this)" 
                    class="absolute top-2 right-2 bg-red-500/50 hover:bg-red-600/70 text-white rounded-full w-8 h-8 flex items-center justify-center 
                           opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg backdrop-blur-sm
                           hover:scale-110 active:scale-95 text-xl font-bold leading-none border border-red-400"
                    style="color: white;">
                ×
            </button>
        `;
        
        gallery.appendChild(imageContainer);
    });
}

async function deleteExistingImage(imageUrl, buttonElement) {
    if (!imageUrl) {
        console.error('Cannot delete image: No image URL provided');
        showErrorMessage('Cannot delete image: Invalid image URL');
        return;
    }

    try {
        console.log('🗑️ Deleting image:', imageUrl);
        
        // Show loading state
        buttonElement.innerHTML = `
            <svg class="w-4 h-4 animate-spin fill-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;
        
        // Call delete API with the full image URL
        await PropertyAPI.deleteImage(imageUrl);
        
        // Remove from current property images array
        currentPropertyImages = currentPropertyImages.filter(url => url !== imageUrl);
        
        // Remove the image container from DOM
        const imageContainer = buttonElement.closest('.existing-image');
        if (imageContainer) {
            imageContainer.remove();
        }
        
        // Update the main gallery display
        updateGalleryDisplay(currentPropertyImages);
        
        showSuccessMessage('Image deleted successfully!');
        
    } catch (error) {
        console.error('Failed to delete image:', error);
        showErrorMessage('Failed to delete image');
        
        // Reset button state
        buttonElement.innerHTML = `×`;
    }
}

// Make function globally accessible for onclick handlers
window.deleteExistingImage = deleteExistingImage;

function handleImageSelection(e) {
    const files = Array.from(e.target.files);
    console.log('Files selected:', files.length);
    console.log('File details:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    // Store files for later upload
    selectedImageFiles = [...selectedImageFiles, ...files];
    console.log('Total files in queue:', selectedImageFiles.length);
    
    // Show preview
    displayImagePreviews(files);
}

function displayImagePreviews(files) {
    const gallery = document.querySelector('#editGalleryModal .grid');
    if (!gallery) {
        console.warn('Image gallery container not found');
        return;
    }

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageElement = document.createElement('div');
                imageElement.className = 'relative group h-32 md:h-48';
                imageElement.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}" class="w-full h-full object-cover rounded-lg">
                    <button type="button" onclick="removeImagePreview(this, '${file.name}')" 
                            class="absolute top-2 right-2 bg-red-500/50 hover:bg-red-600/70 text-white rounded-full w-8 h-8 flex items-center justify-center 
                                   opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg backdrop-blur-sm
                                   hover:scale-110 active:scale-95 text-xl font-bold leading-none border border-red-400"
                            style="color: white;">
                        ×
                    </button>
                    <div class="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded max-w-[80%] truncate backdrop-blur-sm">
                        ${file.name}
                    </div>
                `;
                gallery.appendChild(imageElement);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImagePreview(button, fileName) {
    // Remove from selectedImageFiles array
    selectedImageFiles = selectedImageFiles.filter(file => file.name !== fileName);
    
    // Remove the preview element
    button.closest('.relative').remove();
    
    console.log('Removed image:', fileName, 'Remaining files:', selectedImageFiles.length);
}

// Make function globally accessible for onclick handlers
window.removeImagePreview = removeImagePreview;

async function uploadAllImages() {
    if (selectedImageFiles.length === 0) {
        showErrorMessage('Please select images to upload first');
        return;
    }

    // Show loading state on upload button
    const uploadBtn = document.querySelector('button[onclick="uploadAllImages()"]');
    const originalHTML = uploadBtn?.innerHTML;
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = `
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25 stroke-white" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75 fill-white" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm font-medium text-white">Saving...</span>
        `;
    }

    try {
        console.log('📤 Uploading', selectedImageFiles.length, 'images...');
        
        const formData = new FormData();
        selectedImageFiles.forEach(file => {
            formData.append('photos', file);
        });

        // Try different API endpoint URLs
        const possibleUrls = [
            `${API_BASE_URL}/property/photos/append/${currentPropertyId}`,
            `${API_BASE_URL}/property/update/photos/${currentPropertyId}`,
            `${API_BASE_URL}/property/${currentPropertyId}/photos`,
            `${API_BASE_URL}/property/${currentPropertyId}/update/photos`,
            `${API_BASE_URL}/properties/${currentPropertyId}/photos`
        ];
        
        const possibleMethods = ['PATCH', 'POST', 'PUT'];
        
        let response = null;
        let lastError = null;
        
        // Try different URL and method combinations
        for (let urlIndex = 0; urlIndex < possibleUrls.length; urlIndex++) {
            for (let methodIndex = 0; methodIndex < possibleMethods.length; methodIndex++) {
                const uploadUrl = possibleUrls[urlIndex];
                const method = possibleMethods[methodIndex];
                
                try {
                    response = await fetch(uploadUrl, {
                        method: method,
                        body: formData
                    });
                    
                    if (response.ok) {
                        console.log(`✅ Success with ${method} ${uploadUrl}`);
                        break;
                    } else if (response.status !== 404 && response.status !== 405) {
                        // If it's not a "not found" or "method not allowed", investigate further
                        console.log(`⚠️ API Error: ${response.status} for ${method} ${uploadUrl}`);
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    if (urlIndex === 0 && methodIndex === 0) {
                        console.log(`🔄 Trying alternative endpoints...`);
                    }
                }
            }
            
            if (response && response.ok) {
                break;
            }
        }
        
        if (!response) {
            throw new Error(`All API attempts failed. Last error: ${lastError?.message}`);
        }

        console.log('📡 Response status:', response.status);
        
        let result = {};
        try {
            const responseText = await response.text();
            result = responseText ? JSON.parse(responseText) : {};
        } catch {
            console.warn('⚠️ Failed to parse response as JSON');
        }

        if (response.ok) {
            console.log('✅ Images uploaded successfully');
            showSuccessMessage('Images uploaded successfully!');
            
            // Clear selected files after successful upload
            selectedImageFiles = [];
            
            // Clear previews
            const gallery = document.querySelector('#editGalleryModal .grid');
            if (gallery) {
                // Remove all preview elements except the file input label
                const previews = gallery.querySelectorAll('.relative.group');
                previews.forEach(preview => preview.remove());
            }
            
            // Try to get updated images from response
            let updatedImages = [];
            if (result && result.photoLinks) {
                updatedImages = result.photoLinks;
            } else if (result && result.data && result.data.photoLinks) {
                updatedImages = result.data.photoLinks;
            }
            
            // If we got updated images from the response, use them
            if (updatedImages.length > 0) {
                currentPropertyImages = updatedImages;
                updateGalleryDisplay(updatedImages);
                populateGalleryModal(); // Update the modal with new images
            } else {
                // Fallback: refresh the property data to show new images
                await initializePropertyEdit(currentPropertyId);
            }
            
        } else {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Image upload failed:', error);
        showErrorMessage(`Failed to upload images: ${error.message}`);
    } finally {
        // Reset upload button
        const uploadBtn = document.querySelector('button[onclick="uploadAllImages()"]');
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = `
                <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span class="text-sm font-medium text-white">Save Images</span>
            `;
        }
    }
}

// Make function globally accessible for onclick handlers
// No longer needed to expose uploadAllImages globally since upload is automatic

// ==================== SAVE & DISCARD FUNCTIONALITY ====================
function initializeSaveAndDiscardFunctionality() {
    // Save functionality
    const saveButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (saveButton) {
        saveButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateForm()) {
                showModal('confirmDetailsModal');
            }
        });
    }

    // Confirm button in modal
    const confirmButton = document.getElementById('confirmUpdateButton');
    if (confirmButton) {
        confirmButton.onclick = () => {
            hideModal('confirmDetailsModal');
            handlePropertyUpdate();
        };
    }

    // Discard functionality
    const discardButton = document.querySelector('[data-modal-target="discardDetailsModal"]');
    if (discardButton) {
        discardButton.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('discardDetailsModal');
        });
    }

    // Confirm discard button in modal
    const confirmDiscardButton = document.getElementById('confirmDiscardButton');
    if (confirmDiscardButton) {
        confirmDiscardButton.onclick = () => {
            hideModal('discardDetailsModal');
            redirectToPropertyView();
        };
    }
}

async function handlePropertyUpdate() {
    try {
        if (!currentPropertyId) {
            throw new Error('Property ID not found');
        }

        const formData = collectFormData();
        const hasNewImages = selectedImageFiles.length > 0;
        
        console.log('🔄 Starting property update...');

        // Update property data first
        await PropertyAPI.updateProperty(currentPropertyId, formData);
        console.log('✅ Property data updated successfully');

        // Upload images if any (using simplified approach)
        if (hasNewImages) {
            console.log('📤 Uploading new images...');
            await uploadAllImages();
        }

        // Redirect to property view page
        redirectToPropertyView();
        
    } catch (error) {
        handleError('Failed to update property', error);
    }
}

// ==================== FORM DATA COLLECTION ====================
function collectFormData() {
    const formData = {
        name: getValue('input-prop-name'),
        city: getValue('input-prop-city'),
        address: getValue('input-prop-address'),
        description: getValue('input-prop-desc'), // Fixed: was 'input-prop-description'
        packagePrice: parseFloat(getValue('input-prop-packPrice')) || 0, // Fixed: was 'input-prop-price'
        reservationFee: parseFloat(getValue('input-prop-rsrvFee')) || 0,
        additionalPaxPrice: parseFloat(getValue('input-prop-addPaxPrice')) || 0,
        discount: parseFloat(getValue('input-prop-discount')) || 0,
        packageCapacity: parseInt(getValue('input-prop-packCap')) || 1,
        maxCapacity: parseInt(getValue('input-prop-maxCap')) || 1, // Fixed: was 'input-prop-guests'
        amenities: collectAmenities(),
        otherAmenities: collectCustomAmenities(),
        mapLink: getValue('input-prop-mapLink') // Fixed: was 'input-prop-map'
    };
    
    return formData;
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

function collectAmenities() {
    // Collect all checked amenity checkboxes inside the amenities modal,
    // regardless of category grouping (e.g., essentials[], kitchenDining[], bathroom[], etc.)
    const modal = document.getElementById('editAmmenitiesModal');
    const scope = modal || document;

    const checkedNodes = scope.querySelectorAll('input[type="checkbox"]:checked');
    const values = Array.from(checkedNodes)
        .map(el => el.value)
        .filter(Boolean);

    // Dedupe values
    const uniqueValues = Array.from(new Set(values));
    return uniqueValues;
}

function collectCustomAmenities() {
    // Try to get from Alpine.js data first
    if (window.Alpine) {
        const amenitiesModal = document.querySelector('#editAmmenitiesModal [x-data]');
        
        if (amenitiesModal && amenitiesModal._x_dataStack) {
            const alpineData = amenitiesModal._x_dataStack[0];
            
            if (alpineData && alpineData.customAmenities && Array.isArray(alpineData.customAmenities)) {
                return alpineData.customAmenities;
            }
        }
    }
    
    // Fallback to DOM elements
    const domAmenities = Array.from(document.querySelectorAll('.custom-amenity-item span'))
        .map(span => span.textContent.trim());
    
    // Also try to get from the display container
    const displayItems = Array.from(document.querySelectorAll('#other-amenities-display li'))
        .map(li => li.textContent.trim());
    
    return domAmenities.length > 0 ? domAmenities : displayItems;
}

// ==================== VALIDATION ====================
function validateForm() {
    const requiredFields = [
        { id: 'input-prop-name', label: 'Property Name' },
        { id: 'input-prop-city', label: 'City' },
        { id: 'input-prop-address', label: 'Address' },
        { id: 'input-prop-desc', label: 'Description' },
        { id: 'input-prop-packPrice', label: 'Package Price' },
        { id: 'input-prop-maxCap', label: 'Max Capacity' }
    ];
    
    const missingFields = requiredFields.filter(field => {
        const element = document.getElementById(field.id);
        if (!element) {
            console.warn(`❌ Field element not found: ${field.id}`);
            return true;
        }
        return !element.value?.trim();
    }).map(field => field.label);

    if (missingFields.length > 0) {
        showErrorMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return false;
    }
    
    console.log('✅ Form validation passed');
    return true;
}

// ==================== MODAL UTILITIES ====================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

// ==================== REDIRECT FUNCTIONS ====================
function redirectToPropertyView() {
    if (currentPropertyId) {
        // Redirect to property view page with the current property ID
        window.location.href = `property-view.html?id=${currentPropertyId}`;
    } else {
        // Fallback: redirect to properties list page
        console.warn('No property ID found, redirecting to properties list');
        window.location.href = 'property.html';
    }
}

// DOM manipulation utilities
window.removeCustomAmenity = function(button) {
    button.closest('.custom-amenity-item').remove();
};

window.removeImage = function(button) {
    const imageElement = button.closest('.relative');
    const imageName = imageElement.querySelector('img').alt;
    
    // Remove from newImages array
    if (window.editGalleryData) {
        window.editGalleryData.newImages = window.editGalleryData.newImages.filter(
            img => img.name !== imageName
        );
    }
    
    imageElement.remove();
};

// ==================== ALPINE.JS AMENITIES HANDLER ====================
window.amenitiesHandler = function() {
    return {
        customAmenities: [],
        newAmenity: '',
        isLoading: false,
        
        addAmenity() {
            const amenity = this.newAmenity.trim();
            
            if (!amenity) {
                this.showError('Please enter an amenity name');
                return;
            }
            
            if (amenity.length > 50) {
                this.showError('Amenity name must be 50 characters or less');
                return;
            }
            
            // Check for duplicates (case-insensitive)
            const exists = this.customAmenities.some(existing => 
                existing.toLowerCase() === amenity.toLowerCase()
            );
            
            if (exists) {
                this.showError('This amenity has already been added');
                return;
            }
            
            // Add the amenity
            this.customAmenities.push(amenity);
            this.newAmenity = '';
            
            console.log('Added custom amenity:', amenity);
            console.log('Current custom amenities:', this.customAmenities);
        },
        
        removeAmenity(index) {
            if (index >= 0 && index < this.customAmenities.length) {
                const removed = this.customAmenities.splice(index, 1)[0];
                console.log('Removed custom amenity:', removed);
            }
        },
        
        showError(message) {
            // You can customize this to show errors in your preferred way
            console.error('Amenity error:', message);
            // Example: show in a toast or modal
            alert(message);
        },
        
        // Character count for the input
        get remainingChars() {
            return 50 - this.newAmenity.length;
        },
        
        // Check if add button should be disabled
        get canAdd() {
            return this.newAmenity.trim().length > 0 && 
                   this.newAmenity.length <= 50 && 
                   !this.isLoading;
        }
    };
};
