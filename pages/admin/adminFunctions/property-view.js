// Property View Page JavaScript
// This file handles fetching and displaying property data from the API
//The report tab is not working yet
// Amenities should only show the selected amenities

// API Base URL
const API_BASE = 'https://betcha-api.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    // Get property ID from URL parameters or use default
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id') || '68a0332259e435d693628999'; // Default ID from the API
    
    // Fetch property data
    fetchPropertyData(propertyId);
    
    // Initialize other functionality
    initializePage();
});

// Fetch property data from API
async function fetchPropertyData(propertyId) {
    try {
        const response = await fetch(`${API_BASE}/property/display/${propertyId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const propertyData = await response.json();
        console.log('Property data:', propertyData);
        
        // Populate the page with the fetched data
        populatePropertyData(propertyData);
        
    } catch (error) {
        console.error('Error fetching property data:', error);
        showErrorMessage('Failed to load property data. Please try again later.');
    }
}

// Populate all property data fields
function populatePropertyData(data) {
    // Basic property information
    populateBasicInfo(data);
    
    // Property images
    populatePropertyImages(data.photoLinks);
    
    // Property amenities
    populateAmenities(data.amenities, data.otherAmenities);
    
    // Property reports
    populateReports(data.reports);
    
    // Update page title
    document.title = `Betcha Admin | ${data.name}`;
}

// Populate basic property information
function populateBasicInfo(data) {
    // Property name and address
    const propertyNameElement = document.getElementById('propertyName');
    if (propertyNameElement) {
        propertyNameElement.textContent = data.name || 'Property Name Not Available';
    }
    
    const propertyAddressElement = document.getElementById('propertyAddress');
    if (propertyAddressElement) {
        propertyAddressElement.textContent = data.address || 'Address Not Available';
    }
    
    // Property description
    const roomDescriptionElement = document.getElementById('roomDescription');
    if (roomDescriptionElement) {
        roomDescriptionElement.textContent = data.description || 'No description available';
    }
    
    // Property category and status
    const propertyCategoryElement = document.getElementById('propertyCategory');
    if (propertyCategoryElement) {
        propertyCategoryElement.textContent = data.category || 'Category Not Available';
    }
    
    const statusTextElement = document.getElementById('statusText');
    const statusContainer = document.getElementById('statusContainer');
    if (statusTextElement && statusContainer) {
        statusTextElement.textContent = data.status || 'Status Not Available';
        
        // Update status color based on status value
        if (data.status === 'Active') {
            statusContainer.className = 'status green inline-block w-fit';
        } else if (data.status === 'Inactive') {
            statusContainer.className = 'status red inline-block w-fit';
        } else if (data.status === 'Maintenance') {
            statusContainer.className = 'status orange inline-block w-fit';
        }
    }
    // Update archive/activate button based on status
    updateArchiveButtonUI(data.status);
    
    // Ratings
    const propertyRatingsElement = document.getElementById('propertyRatings');
    if (propertyRatingsElement) {
        if (data.rating > 0) {
            propertyRatingsElement.textContent = `${data.rating}/5 (${data.rateCount} reviews)`;
        } else {
            propertyRatingsElement.textContent = 'No ratings yet';
        }
    }
    
    // Capacity information
    const propertyPackCapElement = document.getElementById('propertyPackCap');
    if (propertyPackCapElement) {
        propertyPackCapElement.textContent = data.packageCapacity || '0';
    }
    
    const propertyMaxCapElement = document.getElementById('propertyMaxCap');
    if (propertyMaxCapElement) {
        propertyMaxCapElement.textContent = data.maxCapacity || '0';
    }
    
    // Check-in/out times
    const propertyCheckInElement = document.getElementById('propertyCheckIn');
    if (propertyCheckInElement) {
        propertyCheckInElement.textContent = data.timeIn || '00:00 AM';
    }
    
    const propertyCheckOutElement = document.getElementById('propertyCheckOut');
    if (propertyCheckOutElement) {
        propertyCheckOutElement.textContent = data.timeOut || '00:00 PM';
    }
    
    // Pricing information
    const propertyPackPriceElement = document.getElementById('propertyPackPrice');
    if (propertyPackPriceElement) {
        propertyPackPriceElement.textContent = data.packagePrice || '0';
    }
    
    const propertyResrvPriceElement = document.getElementById('propertyResrvPrice');
    if (propertyResrvPriceElement) {
        propertyResrvPriceElement.textContent = data.reservationFee || '0';
    }
    
    const propertyAddPaxElement = document.getElementById('propertyAddPax');
    if (propertyAddPaxElement) {
        propertyAddPaxElement.textContent = data.additionalPax || '0';
    }
    
    // Discount
    const propertyDiscPriceElement = document.getElementById('propertyDiscPrice');
    if (propertyDiscPriceElement) {
        if (data.discount && data.discount > 0) {
            propertyDiscPriceElement.textContent = `₱${data.discount}`;
        } else {
            propertyDiscPriceElement.textContent = 'No discount';
        }
    }
    
    // Map link
    const propertyMapLinkElement = document.getElementById('propertyMapLink');
    if (propertyMapLinkElement) {
        if (data.mapLink) {
            // Extract location name from map link or use address/city
            let displayText = 'View Location on Map';
            
            // If we have address and city, use those for display
            if (data.address && data.city) {
                displayText = `${data.address}, ${data.city}`;
            } else if (data.address) {
                displayText = data.address;
            } else if (data.city) {
                displayText = data.city;
            }
            
            // Set the display text
            propertyMapLinkElement.textContent = displayText;
            propertyMapLinkElement.style.cursor = 'pointer';
            propertyMapLinkElement.onclick = () => {
                if (data.mapLink.startsWith('http')) {
                    window.open(data.mapLink, '_blank');
                } else {
                    // If it's just coordinates or address, open in Google Maps
                    const searchQuery = encodeURIComponent(data.mapLink);
                    window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
                }
            };
        } else {
            propertyMapLinkElement.textContent = 'Location not available';
            propertyMapLinkElement.style.cursor = 'default';
            propertyMapLinkElement.onclick = null;
        }
    }
    
    // City information
    if (data.city) {
        const cityInfo = document.createElement('div');
        cityInfo.innerHTML = `
            <div class="mt-2">
                <p class="font-semibold">City</p>
                <p class="text-neutral-500">${data.city}</p>
            </div>
        `;
        
        const addressSection = document.querySelector('.md\\:px-5.mb-5');
        if (addressSection) {
            addressSection.appendChild(cityInfo);
        }
    }
}

// Update Archive button to Activate when status is Archived
function updateArchiveButtonUI(status) {
    const btn = document.getElementById('archivePropertyBtn');
    if (!btn) return;

    const isArchived = (status || '').toLowerCase() === 'archived';
    if (isArchived) {
        btn.classList.remove('bg-rose-100', 'hover:bg-rose-200');
        btn.classList.add('bg-emerald-100', 'hover:bg-emerald-200');
        btn.querySelector('span')?.classList?.remove('text-rose-700');
        btn.querySelector('span')?.classList?.add('text-emerald-700');
        // Update label if it exists or rebuild content minimally
        const labelSpan = btn.querySelector('span');
        if (labelSpan) labelSpan.textContent = 'Activate';
        else btn.innerText = 'Activate';
    } else {
        btn.classList.remove('bg-emerald-100', 'hover:bg-emerald-200');
        btn.classList.add('bg-rose-100', 'hover:bg-rose-200');
        const labelSpan = btn.querySelector('span');
        if (labelSpan) labelSpan.textContent = 'Archive';
        else btn.innerText = 'Archive';
    }
}

// Populate property images
function populatePropertyImages(photoLinks) {
    if (!photoLinks || photoLinks.length === 0) {
        return;
    }
    
    const photosSection = document.getElementById('PhotosSection');
    if (!photosSection) return;
    
    // Clear existing content
    photosSection.innerHTML = '';
    
    if (photoLinks.length === 1) {
        // Single image - make it full width
        const img = createImageElement(photoLinks[0], 'rounded-2xl w-full h-full object-cover');
        photosSection.appendChild(img);
    } else if (photoLinks.length === 2) {
        // Two images - left large, right small
        const leftImg = createImageElement(photoLinks[0], 'rounded-2xl w-full h-full object-cover col-span-1 sm:col-span-3');
        const rightImg = createImageElement(photoLinks[1], 'rounded-2xl w-full h-full object-cover col-span-1 sm:col-span-2');
        
        photosSection.appendChild(leftImg);
        photosSection.appendChild(rightImg);
    } else if (photoLinks.length >= 3) {
        // Three or more images - left large, right two small
        const leftImg = createImageElement(photoLinks[0], 'rounded-2xl w-full h-full object-cover col-span-1 sm:col-span-3');
        
        const rightContainer = document.createElement('div');
        rightContainer.className = 'hidden sm:grid sm:col-span-2 sm:grid-rows-2 sm:gap-3 h-full';
        
        const topRightImg = createImageElement(photoLinks[1], 'rounded-2xl w-full h-full object-cover');
        const bottomRightImg = createImageElement(photoLinks[2], 'rounded-2xl w-full h-full object-cover');
        
        rightContainer.appendChild(topRightImg);
        rightContainer.appendChild(bottomRightImg);
        
        photosSection.appendChild(leftImg);
        photosSection.appendChild(rightContainer);
    }
    
    // Update photo count in floating button
    const photoCountElement = photosSection.querySelector('span');
    if (photoCountElement) {
        photoCountElement.textContent = `${photoLinks.length}+`;
    }
    
    // Also populate the gallery modal with all images
    populateGalleryModal(photoLinks);
}

// Create image element with proper attributes
function createImageElement(src, className) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Property photo';
    img.className = className;
    img.onerror = function() {
        this.src = '/public/images/unit01.jpg'; // Fallback image
    };
    return img;
}

// Populate amenities
function populateAmenities(amenities, otherAmenities) {
    console.log('🏠 Starting amenities population:', { amenities, otherAmenities });
    
    if (!amenities || amenities.length === 0) {
        console.warn('⚠️ No amenities provided, skipping population');
        return;
    }
    
    // Prevent duplicate population
    if (window.amenitiesPopulated) {
        console.log('⚠️ Amenities already populated, skipping duplicate population');
        return;
    }
    
    try {
    // Clear all existing amenity items
    clearAllAmenities();
    
        // Get the amenities container for the main display (first 5 amenities)
        const mainAmenitiesContainer = document.getElementById('mainAmenities');
        if (mainAmenitiesContainer) {
            mainAmenitiesContainer.innerHTML = '';
            
            // Show up to 5 amenities in the main section
            const displayAmenities = amenities.slice(0, 5);
            displayAmenities.forEach(amenity => {
                // Get amenity display info
                const amenityInfo = getAmenityDisplayInfo(amenity);
                const iconPath = getAmenityIcon(amenityInfo.icon);
                
                console.log(`🎯 Creating amenity item for "${amenity}":`, {
                    amenity,
                    amenityInfo,
                    iconPath
                });
                
                // Create amenity item for main display
                const li = document.createElement('li');
                li.className = 'w-full p-2';
                li.innerHTML = `
                    <div class="flex gap-3 items-center">
                        <img src="${iconPath}" alt="${amenityInfo.name}" class="h-5 w-5 fill-primary-text">
                        <span class="font-inter text-primary-text">${amenityInfo.name}</span>
                    </div>
                `;
                mainAmenitiesContainer.appendChild(li);
            });
            
            // Show "Show all amenities" button if there are more than 5 amenities
            if (amenities.length > 5) {
                const showAllButton = document.getElementById('showAllAmenitiesBtn');
                if (showAllButton) {
                    showAllButton.style.display = 'block';
                    showAllButton.textContent = `Show all amenities (${amenities.length})`;
                }
            }
        } else {
            console.error('❌ Main amenities container not found');
        }
        
        // Populate amenities in the new categorized modal structure
        // Combine regular amenities and other amenities to ensure all are categorized
        const allAmenities = [...amenities];
    if (otherAmenities && otherAmenities.length > 0) {
            allAmenities.push(...otherAmenities);
            console.log('🔍 Combined amenities and other amenities:', allAmenities);
        }
        
        populateCategorizedAmenities(allAmenities);
        
        // Mark amenities as populated to prevent duplicates
        window.amenitiesPopulated = true;
        console.log('✅ Amenities populated successfully');
        
    } catch (error) {
        console.error('❌ Error populating amenities:', error);
        window.amenitiesPopulated = false; // Reset flag on error
    }
}

// New function to populate categorized amenities in the modal
function populateCategorizedAmenities(amenities) {
    console.log('📁 Populating categorized amenities in modal');
    
    // Group amenities by category
    const categorizedAmenities = categorizeAmenities(amenities);
    console.log('📁 Categorized amenities:', categorizedAmenities);
    
    // Populate each category list
    Object.keys(categorizedAmenities).forEach(category => {
        const amenitiesList = categorizedAmenities[category];
        if (amenitiesList.length > 0) {
            console.log(`📁 Populating category: "${category}" with amenities:`, amenitiesList);
            
            // Get the appropriate container for this category
            let containerId = '';
            switch (category) {
                case 'Essentials':
                    containerId = 'essentialsList';
                    break;
                case 'Kitchen & Dining':
                    containerId = 'kitchenDiningList';
                    break;
                case 'Bathroom':
                    containerId = 'bathroomList';
                    break;
                case 'Laundry':
                    containerId = 'laundryList';
                    break;
                case 'Safety & Security':
                    containerId = 'safetySecurityList';
                    break;
                case 'Entertainment':
                    containerId = 'entertainmentList';
                    break;
                case 'Outdoor & Parking':
                    containerId = 'outdoorNatureList';
                    break;
                case 'Parking & Transport':
                    containerId = 'parkingTransportList';
                    break;
                case 'Pets':
                    containerId = 'petsList';
                    break;
                case 'Family Friendly':
                    containerId = 'familyFriendlyList';
                    break;
                case 'Other':
                    // Handle "Other" category by populating the others section
                    console.log(`📁 Handling "Other" category with ${amenitiesList.length} amenities`);
                    populateOtherAmenities(amenitiesList);
                    return; // Skip the rest of the loop for this category
                default:
                    console.log(`ℹ️ Category "${category}" not displayed in modal (${amenitiesList.length} amenities)`);
                    return;
            }
            
            console.log(`🔍 Looking for container with ID: ${containerId}`);
            const container = document.getElementById(containerId);
            if (container) {
                console.log(`✅ Found container for ${category}:`, container);
                container.innerHTML = '';
                
                amenitiesList.forEach(amenity => {
                    console.log(`🔍 Processing amenity for display: "${amenity}"`);
                    const amenityInfo = getAmenityDisplayInfo(amenity);
                    console.log(`📝 Amenity info for "${amenity}":`, amenityInfo);
                    const iconPath = getAmenityIcon(amenityInfo.icon);
                    console.log(`🎨 Icon path for "${amenity}": ${iconPath}`);
                    
                    const li = document.createElement('li');
                    li.className = 'p-2';
                    li.innerHTML = `
                        <div class="flex gap-3 items-center">
                            <img src="${iconPath}" alt="${amenityInfo.name}" class="h-5 w-5 fill-primary-text">
                            <span class="font-inter text-primary-text">${amenityInfo.name}</span>
                        </div>
                    `;
                    container.appendChild(li);
                    console.log(`✅ Added amenity "${amenity}" to ${category} container`);
                });
                
                console.log(`✅ Category "${category}" populated with ${amenitiesList.length} amenities`);
            } else {
                console.error(`❌ Container not found for category: ${category} (ID: ${containerId})`);
            }
        }
    });
}

// New function to populate other amenities
function populateOtherAmenities(otherAmenities) {
    console.log('🔍 Populating other amenities');
    
    const othersContainer = document.getElementById('othersContainer');
    const othersList = document.getElementById('othersList');
    
    if (othersContainer && othersList) {
        // Show/hide the others section based on whether there are other amenities
        if (otherAmenities.length > 0) {
            othersContainer.style.display = 'block';
            
            othersList.innerHTML = '';
            
            otherAmenities.forEach(amenity => {
                const amenityInfo = getAmenityDisplayInfo(amenity);
                const iconPath = getAmenityIcon(amenityInfo.icon);
                
                const li = document.createElement('li');
                li.className = 'p-2';
                li.innerHTML = `
                    <div class="flex gap-3 items-center">
                        <img src="${iconPath}" alt="${amenityInfo.name}" class="h-5 w-5 fill-primary-text">
                        <span class="font-inter text-primary-text">${amenityInfo.name}</span>
                    </div>
                `;
                othersList.appendChild(li);
            });
            
            console.log('✅ Other amenities populated successfully');
        } else {
            othersContainer.style.display = 'none';
        }
    } else {
        console.error('❌ Other amenities containers not found');
    }
}

// Function to reset amenities populated flag (useful when editing properties)
function resetAmenitiesPopulatedFlag() {
    window.amenitiesPopulated = false;
    console.log('🔄 Amenities populated flag reset');
}

// Function to ensure amenities modal works properly
function ensureAmenitiesModalWorks() {
    console.log('🔧 Ensuring amenities modal works properly...');
    
    // Check if modal exists
    const modal = document.getElementById('ammenitiesModal');
    if (!modal) {
        console.error('❌ Amenities modal not found');
        return;
    }
    
    // Check if button exists
    const button = document.getElementById('showAllAmenitiesBtn');
    if (!button) {
        console.error('❌ Show all amenities button not found');
        return;
    }
    
    // Check if categorized amenities containers exist
    const essentialsContainer = document.getElementById('essentialsList');
    const kitchenDiningContainer = document.getElementById('kitchenDiningList');
    const bathroomContainer = document.getElementById('bathroomList');
    const laundryContainer = document.getElementById('laundryList');
    const safetySecurityContainer = document.getElementById('safetySecurityList');
    const entertainmentContainer = document.getElementById('entertainmentList');
    const parkingTransportContainer = document.getElementById('parkingTransportList');
    const outdoorNatureContainer = document.getElementById('outdoorNatureList');
    const petsContainer = document.getElementById('petsList');
    const familyFriendlyContainer = document.getElementById('familyFriendlyList');
    const othersContainer = document.getElementById('othersContainer');
    
    if (!essentialsContainer) {
        console.error('❌ Essentials container not found');
    } else {
        console.log('✅ Essentials container found');
    }
    
    if (!kitchenDiningContainer) {
        console.error('❌ Kitchen & Dining container not found');
    } else {
        console.log('✅ Kitchen & Dining container found');
    }
    
    if (!bathroomContainer) {
        console.error('❌ Bathroom container not found');
    } else {
        console.log('✅ Bathroom container found');
    }
    
    if (!laundryContainer) {
        console.error('❌ Laundry container not found');
    } else {
        console.log('✅ Laundry container found');
    }
    
    if (!safetySecurityContainer) {
        console.error('❌ Safety & Security container not found');
    } else {
        console.log('✅ Safety & Security container found');
    }
    
    if (!entertainmentContainer) {
        console.error('❌ Entertainment container not found');
    } else {
        console.log('✅ Entertainment container found');
    }
    
    if (!parkingTransportContainer) {
        console.error('❌ Parking & Transport container not found');
    } else {
        console.log('✅ Parking & Transport container found');
    }
    
    if (!outdoorNatureContainer) {
        console.error('❌ Outdoor & Nature container not found');
    } else {
        console.log('✅ Outdoor & Nature container found');
    }
    
    if (!petsContainer) {
        console.error('❌ Pets container not found');
    } else {
        console.log('✅ Pets container found');
    }
    
    if (!familyFriendlyContainer) {
        console.error('❌ Family Friendly container not found');
    } else {
        console.log('✅ Family Friendly container found');
    }
    
    if (!othersContainer) {
        console.error('❌ Others container not found');
    } else {
        console.log('✅ Others container found');
    }
    
    // Add click event listener if not already present
    if (!button.hasAttribute('data-modal-target')) {
        button.setAttribute('data-modal-target', 'ammenitiesModal');
        console.log('✅ Added data-modal-target attribute to button');
    }
    
    console.log('🔧 Amenities modal setup complete');
}

// Get amenity display info (icon and friendly name)
function getAmenityDisplayInfo(amenity) {
    const amenityInfo = {
        'wifi': { icon: 'wifi', name: 'WiFi' },
        'aircon': { icon: 'aircon', name: 'Air Conditioning' },
        'bedset': { icon: 'bed', name: 'Complete Bed' },
        'hanger': { icon: 'hanger', name: 'Hangers' },
        'hairDryer': { icon: 'hairDryer', name: 'Hair Dryer' },
        'iron': { icon: 'iron', name: 'Iron' },
        'extraPillowBlanket': { icon: 'pillow', name: 'Extra Pillows & Blankets' },
        'towel': { icon: 'towel', name: 'Towel' },
        'ref': { icon: 'refrigerator', name: 'Refrigerator' },
        'microwave': { icon: 'microwave', name: 'Microwave' },
        'stove': { icon: 'stove', name: 'Stove' },
        'oven': { icon: 'oven', name: 'Oven' },
        'coffeeMaker': { icon: 'coffee', name: 'Coffee Maker' },
        'toaster': { icon: 'toaster', name: 'Toaster' },
        'PotsPans': { icon: 'pots', name: 'Pots & Pans' },
        'spices': { icon: 'spices', name: 'Spices' },
        'dishesCutlery': { icon: 'dishes', name: 'Dishes & Cutlery' },
        'diningTable': { icon: 'table', name: 'Dining Table' },
        'bathtub': { icon: 'bathtub', name: 'Bathtub' },
        'shower': { icon: 'shower', name: 'Shower' },
        'shampoo': { icon: 'shampoo', name: 'Shampoo' },
        'soap': { icon: 'soap', name: 'Soap' },
        'toilet': { icon: 'toilet', name: 'Toilet' },
        'toiletPaper': { icon: 'toiletPaper', name: 'Toilet Paper' },
        'washer': { icon: 'washer', name: 'Washer' },
        'dryer': { icon: 'dryer', name: 'Dryer' },
        'dryingRack': { icon: 'dryingRack', name: 'Drying Rack' },
        'ironBoard': { icon: 'ironBoard', name: 'Iron Board' },
        'cleaningProduct': { icon: 'cleaning', name: 'Cleaning Products' },
        'tv': { icon: 'tv', name: 'TV' },
        'streaming': { icon: 'tv', name: 'Streaming Services' },
        'soundSystem': { icon: 'speaker', name: 'Sound System' },
        'consoleGames': { icon: 'gamepad', name: 'Gaming Console' },
        'boardGames': { icon: 'chess', name: 'Board Games' },
        'cardGames': { icon: 'cards', name: 'Card Games' },
        'billiard': { icon: 'billiard', name: 'Billiard Table' },
        'smokeAlarm': { icon: 'smokeAlarm', name: 'Smoke Alarm' },
        'fireExtinguisher': { icon: 'fireExtinguisher', name: 'Fire Extinguisher' },
        'firstAidKit': { icon: 'firstAid', name: 'First Aid Kit' },
        'cctv': { icon: 'cctv', name: 'CCTV' },
        'smartLock': { icon: 'smartLock', name: 'Smart Lock' },
        'guard': { icon: 'guard', name: 'Security Guard' },
        'stairGate': { icon: 'gate', name: 'Stair Gate' },
        'freeParking': { icon: 'parking', name: 'Free Parking' },
        'paidParking': { icon: 'parking', name: 'Paid Parking' },
        'bike': { icon: 'bike', name: 'Bicycle' },
        'balcony': { icon: 'balcony', name: 'Balcony' },
        'garden': { icon: 'garden', name: 'Garden' },
        'grill': { icon: 'grill', name: 'Grill' },
        'firePit': { icon: 'firePit', name: 'Fire Pit' },
        'pool': { icon: 'pool', name: 'Swimming Pool' },
        'petsAllowed': { icon: 'pets', name: 'Pets Allowed' },
        'petsNotAllowed': { icon: 'pets', name: 'No Pets' },
        'petBowls': { icon: 'petBowl', name: 'Pet Bowls' },
        'petBed': { icon: 'petBed', name: 'Pet Bed' },
        'crib': { icon: 'crib', name: 'Crib' },
        'babyBath': { icon: 'babyBath', name: 'Baby Bath' },
        'allowed': { icon: 'pets', name: 'Pets Allowed' }
    };
    
    console.log(`🔍 getAmenityDisplayInfo called with: "${amenity}"`);
    console.log(`🔍 Available keys:`, Object.keys(amenityInfo));
    
    // Try exact match first, then case-insensitive match
    let result = amenityInfo[amenity] || amenityInfo[amenity.toLowerCase()] || { icon: 'default', name: amenity };
    console.log(`🔍 getAmenityDisplayInfo("${amenity}") -> result:`, result);
    return result;
}

// Get SVG icon for amenity type
function getAmenityIcon(iconType) {
    // Map icon types to actual SVG files in the public/svg folder
    const iconMap = {
        'wifi': 'wifi.svg',
        'refrigerator': 'refrigerator.svg',
        'bathtub': 'bath.svg',
        'washer': 'washer.svg',
        'tv': 'tv.svg',
        'smokeAlarm': 'smokeAlarm.svg',
        'parking': 'parkring.svg', // Note: this is the actual filename
        'balcony': 'balcony.svg',
        'pets': 'petPaw.svg',
        'crib': 'crib.svg',
        'aircon': 'aircon.svg',
        'bed': 'bed.svg',
        'hanger': 'hanger.svg',
        'hairDryer': 'hairDryer.svg',
        'iron': 'iron.svg',
        'pillow': 'extraPillowsBlanket.svg',
        'towel': 'towel.svg',
        'microwave': 'microwave.svg',
        'stove': 'stove.svg',
        'oven': 'oven.svg',
        'coffee': 'coffeeMaker.svg',
        'toaster': 'toaster.svg',
        'pots': 'pan.svg',
        'spices': 'salt.svg',
        'dishes': 'dishes.svg',
        'table': 'diningtable.svg',
        'shower': 'shower.svg',
        'shampoo': 'shampoo.svg',
        'soap': 'soap.svg',
        'toilet': 'toilet.svg',
        'toiletPaper': 'toiletPaper.svg',
        'dryer': 'dryer.svg',
        'dryingRack': 'ironBoard.svg',
        'ironBoard': 'ironBoard.svg',
        'cleaning': 'detergent.svg',
        'speaker': 'speaker.svg',
        'gamepad': 'console.svg',
        'chess': 'chess.svg',
        'cards': 'card.svg',
        'billiard': 'chess.svg',
        'fireExtinguisher': 'fireExtinguisher.svg',
        'firstAid': 'firstAidKit.svg',
        'cctv': 'cctv.svg',
        'smartLock': 'smartLock.svg',
        'guard': 'guard.svg',
        'gate': 'gate.svg',
        'bike': 'bike.svg',
        'garden': 'garden.svg',
        'grill': 'grill.svg',
        'firePit': 'firePit.svg',
        'pool': 'pool.svg',
        'petBowl': 'bowl.svg',
        'petBed': 'bed.svg',
        'babyBath': 'bath.svg',
        // Add more specific mappings for common amenities
        'ref': 'refrigerator.svg',
        'streaming': 'tv.svg',
        'freeParking': 'parkring.svg',
        'paidParking': 'parkring.svg',
        'allowed': 'petPaw.svg',
        'extraPillowBlanket': 'extraPillowsBlanket.svg',
        'coffeeMaker': 'coffeeMaker.svg',
        'PotsPans': 'pan.svg',
        'dishesCutlery': 'dishes.svg',
        'diningTable': 'diningtable.svg',
        'soundSystem': 'speaker.svg',
        'consoleGames': 'console.svg',
        'boardGames': 'chess.svg',
        'cardGames': 'card.svg',
        'firstAidKit': 'firstAidKit.svg',
        'petBowls': 'bowl.svg',
        'default': 'star.svg' // Fallback icon
    };
    
    // Get the icon filename, with fallback to default
    const iconFilename = iconMap[iconType] || iconMap['default'] || 'star.svg';
    const iconPath = `/public/svg/${iconFilename}`;
    
    console.log(`🎨 getAmenityIcon("${iconType}") -> ${iconPath}`);
    return iconPath;
}

// Helper function to categorize amenities
function categorizeAmenities(amenities) {
    console.log('🔍 Categorizing amenities:', amenities);
    
    const categories = {
        'Essentials': ['wifi', 'aircon', 'bedset', 'hanger', 'hairDryer', 'iron', 'extraPillowBlanket', 'towel'],
        'Kitchen & Dining': ['ref', 'microwave', 'stove', 'oven', 'coffeeMaker', 'toaster', 'PotsPans', 'spices', 'dishesCutlery', 'diningTable'],
        'Safety & Security': ['smokeAlarm', 'fireExtinguisher', 'firstAidKit', 'cctv', 'smartLock', 'guard', 'stairGate'],
        'Entertainment': ['tv', 'streaming', 'soundSystem', 'consoleGames', 'boardGames', 'cardGames', 'billiard'],
        'Outdoor & Parking': ['freeParking', 'paidParking', 'bike', 'balcony', 'garden', 'grill', 'firePit', 'pool'],
        'Bathroom': ['bathtub', 'shower', 'shampoo', 'soap', 'toilet', 'toiletPaper'],
        'Laundry': ['washer', 'dryer', 'dryingRack', 'ironBoard', 'cleaningProduct'],
        'Pets': ['petsAllowed', 'petsNotAllowed', 'petBowls', 'petBed', 'allowed'],
        'Family Friendly': ['crib', 'babyBath', 'stairGate']
    };
    
    const categorized = {};
    const processedAmenities = new Set(); // Track processed amenities to avoid duplicates
    
    amenities.forEach(amenity => {
        // Skip only truly invalid amenities
        if (!amenity || typeof amenity !== 'string' || amenity.trim() === '') {
            console.log(`⚠️ Skipping invalid amenity: "${amenity}"`);
            return;
        }
        
        if (processedAmenities.has(amenity.toLowerCase())) {
            return; // Skip if already processed
        }
        
        console.log(`🔍 Processing amenity: "${amenity}"`);
        
        let isCategorized = false;
        for (const [category, categoryAmenities] of Object.entries(categories)) {
            // Check if amenity matches any category (case-insensitive and partial matching)
            if (categoryAmenities.some(catAmenity => 
                amenity.toLowerCase().includes(catAmenity.toLowerCase()) || 
                catAmenity.toLowerCase().includes(amenity.toLowerCase())
            )) {
                console.log(`✅ Categorized "${amenity}" under "${category}"`);
                if (!categorized[category]) {
                    categorized[category] = [];
                }
                categorized[category].push(amenity);
                processedAmenities.add(amenity.toLowerCase());
                isCategorized = true;
                break;
            }
        }
        
        // If amenity doesn't match any category, add to "Other"
        if (!isCategorized) {
            console.log(`⚠️ Amenity "${amenity}" not categorized, adding to "Other"`);
            if (!categorized['Other']) {
                categorized['Other'] = [];
            }
            categorized['Other'].push(amenity);
            processedAmenities.add(amenity.toLowerCase());
        }
    });
    
    return categorized;
}

// Function to clear all amenities from all containers
function clearAllAmenities() {
    console.log('🧹 Clearing all amenities from all containers');
    
    // Clear main amenities display
    const mainAmenitiesContainer = document.getElementById('mainAmenities');
    if (mainAmenitiesContainer) {
        mainAmenitiesContainer.innerHTML = '';
        console.log('✅ Main amenities container cleared');
    }
    
    // Clear categorized amenities in modal
    const essentialsContainer = document.getElementById('essentialsList');
    const kitchenDiningContainer = document.getElementById('kitchenDiningList');
    const bathroomContainer = document.getElementById('bathroomList');
    const laundryContainer = document.getElementById('laundryList');
    const safetySecurityContainer = document.getElementById('safetySecurityList');
    const entertainmentContainer = document.getElementById('entertainmentList');
    const parkingTransportContainer = document.getElementById('parkingTransportList');
    const outdoorNatureContainer = document.getElementById('outdoorNatureList');
    const petsContainer = document.getElementById('petsList');
    const familyFriendlyContainer = document.getElementById('familyFriendlyList');
    const othersContainer = document.getElementById('othersContainer');
    const othersList = document.getElementById('othersList');
    
    if (essentialsContainer) {
        essentialsContainer.innerHTML = '';
        console.log('✅ Essentials container cleared');
    }
    
    if (kitchenDiningContainer) {
        kitchenDiningContainer.innerHTML = '';
        console.log('✅ Kitchen & Dining container cleared');
    }
    
    if (bathroomContainer) {
        bathroomContainer.innerHTML = '';
        console.log('✅ Bathroom container cleared');
    }
    
    if (laundryContainer) {
        laundryContainer.innerHTML = '';
        console.log('✅ Laundry container cleared');
    }
    
    if (safetySecurityContainer) {
        safetySecurityContainer.innerHTML = '';
        console.log('✅ Safety & Security container cleared');
    }
    
    if (entertainmentContainer) {
        entertainmentContainer.innerHTML = '';
        console.log('✅ Entertainment container cleared');
    }
    
    if (parkingTransportContainer) {
        parkingTransportContainer.innerHTML = '';
        console.log('✅ Parking & Transport container cleared');
    }
    
    if (outdoorNatureContainer) {
        outdoorNatureContainer.innerHTML = '';
        console.log('✅ Outdoor & Nature container cleared');
    }
    
    if (petsContainer) {
        petsContainer.innerHTML = '';
        console.log('✅ Pets container cleared');
    }
    
    if (familyFriendlyContainer) {
        familyFriendlyContainer.innerHTML = '';
        console.log('✅ Family Friendly container cleared');
    }
    
    if (othersList) {
        othersList.innerHTML = '';
        console.log('✅ Others list cleared');
    }
    
    // Hide others container if it exists
    if (othersContainer) {
        othersContainer.style.display = 'none';
        console.log('✅ Others container hidden');
    }
    
    console.log('🧹 All amenities containers cleared successfully');
}

// Populate reports
function populateReports(reports) {
    console.log('📋 Populating reports:', reports);
    
    if (!reports) {
        console.log('No reports data available');
        return;
    }
    
    // Find the tab content containers
    const tabContents = document.querySelectorAll('#tab-contents .tab-content');
    const unsolvedContainer = tabContents[0];
    const solvedContainer = tabContents[1];
    
    if (!unsolvedContainer || !solvedContainer) {
        console.warn('Report containers not found');
        return;
    }
    
    // Clear existing content
    unsolvedContainer.innerHTML = '';
    solvedContainer.innerHTML = '';
    
    // Populate unsolved reports
    if (reports.unsolved && reports.unsolved.length > 0) {
        console.log(`📝 Found ${reports.unsolved.length} unsolved reports`);
        reports.unsolved.forEach(report => {
            const reportElement = createReportElement(report, 'unsolved');
            unsolvedContainer.appendChild(reportElement);
        });
    } else {
        console.log('No unsolved reports');
        const noReportsElement = createNoReportsElement();
        unsolvedContainer.appendChild(noReportsElement);
    }
    
    // Populate solved reports
    if (reports.solved && reports.solved.length > 0) {
        console.log(`✅ Found ${reports.solved.length} solved reports`);
        reports.solved.forEach(report => {
            const reportElement = createReportElement(report, 'solved');
            solvedContainer.appendChild(reportElement);
        });
    } else {
        console.log('No solved reports');
        const noReportsElement = createNoReportsElement();
        solvedContainer.appendChild(noReportsElement);
    }
}

// Create report element
function createReportElement(report, status) {
    const div = document.createElement('div');
    div.className = `bg-white rounded-xl px-4 py-3 group cursor-pointer border border-neutral-200 font-inter
        transition-all duration-300 ease-in-out 
        hover:bg-primary/10 hover:border-primary`;
    div.setAttribute('data-modal-target', 'reportModal');
    
    // Format the date from the API response
    const date = new Date(report.date || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Store report data for modal display
    div.setAttribute('data-report-id', report.id);
    div.setAttribute('data-report-sender', report.sender);
    div.setAttribute('data-report-category', report.category);
    div.setAttribute('data-report-status', report.status);
    div.setAttribute('data-report-date', report.date);
    div.setAttribute('data-report-transno', report.transNo);
    div.setAttribute('data-report-message', report.message);
    
    div.innerHTML = `
        <div class="flex items-center justify-between mb-1">
            <p class="text-sm font-semibold text-primary-text tracking-wide group-hover:text-primary transition-colors">
                    ${report.transNo || 'TRX-' + Math.random().toString(36).substr(2, 9)}
            </p>
            <span class="text-xs text-neutral-400">${date}</span>
        </div>
        <div class="flex items-center justify-between">
                <p class="text-xs text-neutral-700">${report.sender || 'Anonymous'}</p>
                <div class="flex items-center gap-2">
            <span class="text-[11px] font-medium text-white bg-primary/80 rounded-full px-2 py-0.5">
                ${report.category || 'General Issue'}
            </span>
                    <span class="text-[10px] font-medium text-white ${report.status === 'Solved' ? 'bg-green-500' : 'bg-orange-500'} rounded-full px-2 py-0.5">
                        ${report.status}
            </span>
                </div>
            </div>
            <div class="mt-2">
                <p class="text-xs text-neutral-600 line-clamp-2">${report.message || 'No message provided'}</p>
        </div>
    `;
    
    // Add click event to show report details
    div.addEventListener('click', () => {
        showReportDetails(report);
    });
    
    return div;
}

// Create no reports element
function createNoReportsElement() {
    const div = document.createElement('div');
    div.className = 'w-full h-full flex justify-center items-center';
    div.innerHTML = '<p class="text-neutral-300">No reports</p>';
    return div;
}

// Show report details in modal
function showReportDetails(report) {
    console.log('📋 Showing report details:', report);
    
    // Find the report modal
    const reportModal = document.getElementById('reportModal');
    if (!reportModal) {
        console.warn('Report modal not found');
        return;
    }
    
    // Populate modal content with report data
    const modalContent = reportModal.querySelector('.modal-content');
    if (modalContent) {
        const date = new Date(report.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        modalContent.innerHTML = `
            <div class="p-4 w-full max-w-full mx-auto">
                <!-- Header Section -->
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 w-full">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-primary-text">Report Details</h3>
                            <p class="text-xs text-neutral-500 mt-0.5">${date}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Content Grid -->
                <div class="grid grid-cols-1 gap-3 mb-4 w-full">
                    <!-- Transaction Number -->
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100 w-full">
                        <label class="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 block">Transaction Number</label>
                        <p class="text-base font-mono font-bold text-blue-900 break-all">${report.transNo}</p>
                    </div>
                    
                    <!-- Info Row -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                        <div class="bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-100 min-w-0">
                            <label class="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 block">Reporter</label>
                            <p class="text-sm font-semibold text-emerald-900 truncate">${report.sender}</p>
                        </div>
                        
                        <div class="bg-gradient-to-br from-purple-50 to-violet-50 p-3 rounded-lg border border-purple-100 min-w-0">
                            <label class="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 block">Category</label>
                            <p class="text-sm font-semibold text-purple-900 truncate">${report.category}</p>
                        </div>
                        
                        <div class="bg-gradient-to-br ${report.status === 'Solved' ? 'from-green-50 to-emerald-50 border-green-100' : 'from-orange-50 to-amber-50 border-orange-100'} p-3 rounded-lg border min-w-0">
                            <label class="text-xs font-semibold ${report.status === 'Solved' ? 'text-green-600' : 'text-orange-600'} uppercase tracking-wide mb-1 block">Status</label>
                            <div class="flex items-center gap-1">
                                <p class="text-sm font-semibold ${report.status === 'Solved' ? 'text-green-900' : 'text-orange-900'} truncate">${report.status}</p>
                                ${report.status === 'Solved' ? '<svg class="w-3 h-3 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : '<svg class="w-3 h-3 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Message Section -->
                <div class="bg-gradient-to-br from-neutral-50 to-gray-50 p-3 rounded-lg border border-neutral-200 w-full">
                    <label class="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2 block">Message</label>
                    <p class="text-sm text-neutral-700 leading-relaxed break-words">${report.message}</p>
                </div>
            </div>
        `;
    }
    
    // Store the current report data for status updates
    reportModal.setAttribute('data-current-report', JSON.stringify(report));
    
    // Update button text and color based on current status, or hide for solved reports
    const closeButton = reportModal.querySelector('button[data-close-modal]');
    
    if (closeButton) {
        if (report.status === 'Solved') {
            // For solved reports, show prominent close button
            closeButton.className = 'w-full bg-gradient-to-r from-primary to-primary/90 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:from-primary/80 hover:to-primary/70 transition-all duration-300 ease-in-out border-0';
            closeButton.innerHTML = `
                <span class="font-manrope text-lg flex items-center justify-center gap-2 text-white">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Close Report
                </span>
            `;
        } else {
            // For unsolved reports, show solve button and update close button styling
            // First, create the solve button if it doesn't exist
            let solveButton = reportModal.querySelector('#solveButton');
            if (!solveButton) {
                solveButton = document.createElement('button');
                solveButton.id = 'solveButton';
                solveButton.addEventListener('click', changeReportStatus);
                solveButton.className = 'w-full bg-primary text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:bg-primary/80 transition-all duration-300 ease-in-out border-0 mb-3';
                solveButton.innerHTML = `
                    <span class="font-manrope text-lg flex items-center justify-center gap-2 text-white">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Solve Report
                    </span>
                `;
                
                // Insert solve button before close button
                const footerContainer = closeButton.parentElement;
                footerContainer.insertBefore(solveButton, closeButton);
            }
            
            // Update close button styling for unsolved reports
            closeButton.className = 'w-full bg-gradient-to-r from-neutral-200 to-neutral-300 text-neutral-700 font-semibold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg hover:from-neutral-300 hover:to-neutral-400 transition-all duration-300 ease-in-out border-0';
            closeButton.innerHTML = `
                <span class="font-manrope text-base flex items-center justify-center gap-2 text-neutral-700">
                    <svg class="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Close
                </span>
            `;
        }
    }
    
    // Show the modal
    reportModal.classList.remove('hidden');
}

// Handle reports tab switching
function setReportsActiveTab(index) {
    console.log('🔄 Switching to reports tab:', index);
    
    const tabButtons = document.querySelectorAll('.reports-tab-btn');
    const tabContents = document.querySelectorAll('#tab-contents .tab-content');
    
    if (!tabButtons || !tabContents) {
        console.warn('Reports tab elements not found');
        return;
    }
    
    // Remove active state from all buttons and contents
    tabButtons.forEach(btn => {
        btn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
        btn.classList.add('text-neutral-500');
    });
    
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    // Add active state to selected button and content
    if (tabButtons[index]) {
        tabButtons[index].classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
        tabButtons[index].classList.remove('text-neutral-500');
    }
    
    if (tabContents[index]) {
        tabContents[index].classList.remove('hidden');
    }
}

// Initialize reports tabs
function initializeReportsTabs() {
    console.log('🚀 Initializing reports tabs');
    
    // Set the first tab as active by default
    setReportsActiveTab(0);
    
    // Make the function globally accessible
    window.setReportsActiveTab = setReportsActiveTab;
}

// Change report status
async function changeReportStatus() {
    console.log('🔄 Changing report status...');
    
    // Get the current report data from the modal
    const reportModal = document.getElementById('reportModal');
    if (!reportModal) {
        console.error('Report modal not found');
        return;
    }
    
    const reportData = reportModal.getAttribute('data-current-report');
    if (!reportData) {
        console.error('No report data found');
        return;
    }
    
    const report = JSON.parse(reportData);
    console.log('📋 Current report data:', report);
    
    // Get current property ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (!propertyId) {
        console.error('No property ID found in URL');
        showErrorMessage('Cannot update report: Property ID not found');
        return;
    }
    
    // Determine new status based on current status
    const newStatus = report.status === 'Solved' ? 'Unsolved' : 'Solved';
    
    // Prepare the request body
    const requestBody = {
        id: report.id,
        status: report.status,
        newStatus: newStatus
    };
    
    console.log('📤 Sending status update request:', requestBody);
    
    try {
        // Show loading state
        const solveButton = reportModal.querySelector('#solveButton');
        if (!solveButton) {
            console.error('Solve button not found');
            return;
        }
        
        const originalText = solveButton.innerHTML;
        solveButton.innerHTML = `
            <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;
        solveButton.disabled = true;
        
        // Make the API call
        const response = await fetch(`${API_BASE}/property/${propertyId}/report/edit-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Report status updated successfully:', result);
        
        // Show success message
        showSuccessMessage(`Report status updated to ${newStatus}`);
        
        // Close the modal
        reportModal.classList.add('hidden');
        
        // Refresh the property data to show updated reports
        await fetchPropertyData(propertyId);
        
    } catch (error) {
        console.error('❌ Failed to update report status:', error);
        showErrorMessage(`Failed to update report status: ${error.message}`);
        
        // Reset button state
        solveButton.innerHTML = originalText;
        solveButton.disabled = false;
    }
}

// Function to fetch and display calendar data
async function fetchAndDisplayCalendarData() {
    try {
        // Get current property ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        
        if (!propertyId) {
            console.log('❌ No property ID found, skipping calendar data fetch');
            return;
        }
        
        console.log('📅 Fetching calendar data for property:', propertyId);
        
        // Fetch calendar data from API
        const response = await fetch(`${API_BASE}/calendar/byProperty/${propertyId}`);
        
        if (response.ok) {
            const calendarData = await response.json();
            console.log('📅 Calendar data received:', calendarData);
            
            // Update calendar with booked and maintenance dates
            updateCalendarWithDates(calendarData.calendar);
        } else {
            console.error('❌ Failed to fetch calendar data:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Error fetching calendar data:', error);
    }
}

// Function to update calendar with booked and maintenance dates
function updateCalendarWithDates(calendarData) {
    if (!calendarData) {
        console.log('❌ No calendar data provided');
        return;
    }
    
    // Get all booked dates
    const bookedDates = calendarData.booking ? calendarData.booking.map(booking => booking.date) : [];
    
    // Get all maintenance dates
    const maintenanceDates = calendarData.maintenance ? calendarData.maintenance.map(maintenance => maintenance.date) : [];
    
    console.log('📅 Booked dates:', bookedDates);
    console.log('🔧 Maintenance dates:', maintenanceDates);
    
    // Combine all unavailable dates
    const allUnavailableDates = [...bookedDates, ...maintenanceDates];
    
    // Update the global unavailableDates array in calendar2.js
    if (typeof window !== 'undefined' && window.calendarUnavailableDates) {
        window.calendarUnavailableDates = allUnavailableDates;
        console.log('✅ Updated global unavailable dates:', window.calendarUnavailableDates);
    }
    
    // Force calendar re-render if it exists
    const calendarInstance = document.querySelector('.calendar-instance');
    if (calendarInstance) {
        // Trigger a custom event to force calendar re-render
        const event = new CustomEvent('calendarDataUpdated', {
            detail: {
                bookedDates: bookedDates,
                maintenanceDates: maintenanceDates,
                allUnavailableDates: allUnavailableDates
            }
        });
        calendarInstance.dispatchEvent(event);
        console.log('✅ Calendar update event dispatched');
    }
    
    // Also update the calendar legend with actual counts
    updateCalendarLegend(bookedDates.length, maintenanceDates.length);
}

// Function to update calendar legend with actual counts
function updateCalendarLegend(bookedCount, maintenanceCount) {
    const legendContainer = document.querySelector('.text-lg.font-manrope.md\\:text-xl.mb-3');
    if (legendContainer) {
        const legendSection = legendContainer.closest('.flex.flex-col');
        if (legendSection) {
            // Update booked count
            const bookedLegend = legendSection.querySelector('.bg-primary + p');
            if (bookedLegend) {
                bookedLegend.textContent = `- Booked (${bookedCount})`;
            }
            
            // Update maintenance count
            const maintenanceLegend = legendSection.querySelector('.bg-rose-700 + p');
            if (maintenanceLegend) {
                maintenanceLegend.textContent = `- Maintenance (${maintenanceCount})`;
            }
        }
    }
}

// Function to initialize calendar functionality
function initializeCalendar() {
    console.log('📅 Initializing calendar functionality...');
    
    // Fetch calendar data when page loads
    fetchAndDisplayCalendarData();
    
    // Listen for calendar data updates
    document.addEventListener('calendarDataUpdated', (event) => {
        console.log('📅 Calendar data update received:', event.detail);
        // The calendar2.js will handle the re-render
    });
}

// Initialize page functionality
function initializePage() {
    // Reset amenities populated flag for clean state
    resetAmenitiesPopulatedFlag();
    
    // Initialize read more toggle
    initializeReadMoreToggle();
    
    // Initialize edit button functionality
    initializeEditButton();
    
    // Initialize delete button functionality
    initializeDeleteButton();
    
    // Initialize calendar functionality
    initializeCalendar();
    
    // Initialize reports tab functionality
    initializeReportsTabs();

    // Ensure amenities modal works properly
    ensureAmenitiesModalWorks();

}

// Initialize edit button functionality
function initializeEditButton() {
    const editButton = document.querySelector('button[onclick="goToEditPage()"]');
    if (editButton) {
        editButton.addEventListener('click', function(e) {
            e.preventDefault();
            goToEditPage();
        });
    }
}

// Initialize read more toggle functionality
function initializeReadMoreToggle() {
    const toggleText = document.getElementById('toggleText');
    const descWrapper = document.getElementById('descWrapper');
    
    if (toggleText && descWrapper) {
        toggleText.addEventListener('click', function() {
            const isExpanded = descWrapper.style.maxHeight === 'none' || descWrapper.style.maxHeight === '';
            
            if (isExpanded) {
                descWrapper.style.maxHeight = '6rem';
                toggleText.textContent = 'Read More';
            } else {
                descWrapper.style.maxHeight = 'none';
                toggleText.textContent = 'Read Less';
            }
        });
    }
}

// Function to navigate to edit page with property ID
function goToEditPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (propertyId) {
        window.location.href = `property-edit.html?id=${propertyId}`;
    } else {
        console.error('No property ID available for editing');
        showErrorMessage('Cannot edit property: No property ID found.');
    }
}

// Initialize delete button functionality
async function initializeDeleteButton() {
    console.log('🔍 Looking for delete button...');
    const deleteButton = document.getElementById('archivePropertyBtn');
    if (deleteButton) {
        console.log('✅ Delete button found and event listener attached');
        console.log('📍 Button element:', deleteButton);
        console.log('📍 Button text:', deleteButton.textContent);
        
        deleteButton.addEventListener('click', async function(e) {
            console.log('🖱️ Delete button clicked!');
            e.preventDefault();
            
            // Determine current status from the status text on the page
            const currentStatus = document.getElementById('statusText')?.textContent?.trim() || '';
            const isArchived = currentStatus.toLowerCase() === 'archived';
            const nextStatus = isArchived ? 'Active' : 'Archived';
            const confirmMessage = isArchived
                ? 'Activate this property? This will set the status to "Active".'
                : 'Are you sure you want to archive this property? This will set the status to "Archived".';

            if (confirm(confirmMessage)) {
                try {
                    // Get current property ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                    const propertyId = urlParams.get('id');
                    
                    if (!propertyId) {
                        showErrorMessage('Property ID not found. Cannot proceed with archiving.');
                        return;
                    }
                    
                    console.log(`Updating property status to ${nextStatus}:`, propertyId);
                    
                    // Make PATCH API call to update property status
                    const response = await fetch(`${API_BASE}/property/update/status/${propertyId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            status: nextStatus
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('Property status updated successfully:', result);
                        showSuccessMessage(`Property status set to ${nextStatus}!`);
                        // Update UI
                        document.getElementById('statusText').textContent = nextStatus;
                        updateArchiveButtonUI(nextStatus);
                        // Redirect back to properties list (same behavior for Archive and Activate)
                        setTimeout(() => { window.location.href = 'property.html'; }, 1500);
                    } else {
                        const errorData = await response.json();
                        console.error('Failed to update property status:', errorData);
                        showErrorMessage(`Failed to update property status: ${errorData.message || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('Error updating property status:', error);
                    showErrorMessage('An error occurred while updating the property status. Please try again.');
                }
            } else {
                console.log('❌ User cancelled the status change action');
            }
        });
    } else {
        console.error('❌ Delete button not found');
        console.log('🔍 Available buttons on page:', document.querySelectorAll('button'));
    }
}

// Show error message
function showErrorMessage(message) {
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Show success message
function showSuccessMessage(message) {
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 5000);
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Export functions for use in other scripts if needed
window.PropertyView = {
    fetchPropertyData,
    populatePropertyData,
    populateBasicInfo,
    populatePropertyImages,
    populateAmenities,
    populateReports,
    goToEditPage,
    resetAmenitiesPopulatedFlag,
    setReportsActiveTab,
    showReportDetails,
    changeReportStatus,
    fetchAndDisplayCalendarData,
    updateCalendarWithDates,
    initializeCalendar,
    populateGalleryModal,
    openFullSizeImage
};

// Make amenity functions globally available for property-edit-functions-clean.js
window.getAmenityDisplayInfo = getAmenityDisplayInfo;
window.getAmenityIcon = getAmenityIcon;

// Make reports functions globally available
window.setReportsActiveTab = setReportsActiveTab;
window.showReportDetails = showReportDetails;
window.changeReportStatus = changeReportStatus;

// Function to populate gallery modal with property images
function populateGalleryModal(propertyImages) {
    const galleryGrid = document.getElementById('galleryPhotoGrid');
    const noImagesMessage = document.getElementById('noImagesMessage');
    
    if (!galleryGrid) {
        console.error('❌ Gallery photo grid not found');
        return;
    }
    
    // Clear existing content
    galleryGrid.innerHTML = '';
    
    if (!propertyImages || propertyImages.length === 0) {
        // Show no images message
        if (noImagesMessage) {
            noImagesMessage.classList.remove('hidden');
        }
        console.log('📷 No property images available');
        return;
    }
    
    // Hide no images message
    if (noImagesMessage) {
        noImagesMessage.classList.add('hidden');
    }
    
    console.log('📷 Populating gallery with', propertyImages.length, 'images');
    
    // Create image elements for each property image
    propertyImages.forEach((imageUrl, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'relative group cursor-pointer overflow-hidden rounded-xl';
        
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = `Property view ${index + 1}`;
        image.className = 'w-full h-64 md:h-80 object-cover transition-transform duration-300 group-hover:scale-105';
        
        // Add loading state
        image.onload = () => {
            image.classList.add('loaded');
        };
        
        image.onerror = () => {
            // Handle broken images
            image.src = '/public/images/placeholder.jpg'; // Fallback image
            console.warn('⚠️ Failed to load image:', imageUrl);
        };
        
        // Add image info overlay on hover
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end';
        
        const imageInfo = document.createElement('div');
        imageInfo.className = 'w-full p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300';
        imageInfo.innerHTML = `
            <p class="text-sm font-medium">Property Image ${index + 1}</p>
            <p class="text-xs opacity-80">Click to view full size</p>
        `;
        
        overlay.appendChild(imageInfo);
        imageContainer.appendChild(image);
        imageContainer.appendChild(overlay);
        
        // Add click handler for full-size view (optional)
        imageContainer.addEventListener('click', () => {
            openFullSizeImage(imageUrl, `Property Image ${index + 1}`);
        });
        
        galleryGrid.appendChild(imageContainer);
    });
    
    console.log('✅ Gallery populated successfully');
}

// Function to open full-size image view
function openFullSizeImage(imageUrl, imageTitle) {
    // Create a simple full-size image modal
    const fullSizeModal = document.createElement('div');
    fullSizeModal.className = 'fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4';
    fullSizeModal.innerHTML = `
        <div class="relative max-w-full max-h-full">
            <button class="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold z-10" onclick="this.closest('.fixed').remove()">
                ×
            </button>
            <img src="${imageUrl}" alt="${imageTitle}" class="max-w-full max-h-full object-contain rounded-lg">
            <p class="text-white text-center mt-4 text-lg">${imageTitle}</p>
        </div>
    `;
    
    // Close on background click
    fullSizeModal.addEventListener('click', (e) => {
        if (e.target === fullSizeModal) {
            fullSizeModal.remove();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            fullSizeModal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
    
    document.body.appendChild(fullSizeModal);
}

// ===== MAINTENANCE MODAL FUNCTIONS =====

// Function to open the maintenance modal
function openMaintenanceModal() {
    console.log('🔧 Opening maintenance modal...');
    
    // Get property information from the page
    const propertyName = document.querySelector('.text-2xl.font-manrope')?.textContent || 'Unknown Property';
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id') || 'Unknown';
    
    // Populate property info in modal
    document.getElementById('maintenancePropertyName').textContent = propertyName;
    document.getElementById('maintenancePropertyId').textContent = propertyId;
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('maintenanceStartDate').min = today;
    document.getElementById('maintenanceEndDate').min = today;
    
    // Load current maintenance dates
    loadCurrentMaintenanceDates(propertyId);
    
    // Show the modal
    const modal = document.getElementById('maintenanceModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('modal-open');
        
        // Add backdrop click handler
        modal.addEventListener('click', function backdropClickHandler(e) {
            if (e.target === modal) {
                closeMaintenanceModal();
                modal.removeEventListener('click', backdropClickHandler);
            }
        });
        
        // Add escape key handler
        const escapeKeyHandler = function(e) {
            if (e.key === 'Escape') {
                closeMaintenanceModal();
                document.removeEventListener('keydown', escapeKeyHandler);
            }
        };
        document.addEventListener('keydown', escapeKeyHandler);
        
        // Dispatch custom event for modal opening
        const modalOpenEvent = new CustomEvent('modalOpened', {
            detail: { modalId: 'maintenanceModal', modal: modal }
        });
        document.dispatchEvent(modalOpenEvent);
    }
}

// Function to close the maintenance modal
function closeMaintenanceModal() {
    console.log('🔧 Closing maintenance modal...');
    
    const modal = document.getElementById('maintenanceModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('modal-open');
        
        // Dispatch custom event for modal closing
        const modalClosedEvent = new CustomEvent('modalClosed', {
            detail: { modalId: 'maintenanceModal', modal: modal }
        });
        document.dispatchEvent(modalClosedEvent);
    }
}

// Function to set quick maintenance dates
function setQuickMaintenanceDate(type) {
    const today = new Date();
    const startDateInput = document.getElementById('maintenanceStartDate');
    const endDateInput = document.getElementById('maintenanceEndDate');
    
    let startDate, endDate;
    
    switch (type) {
        case 'today':
            startDate = today;
            endDate = today;
            break;
        case 'week':
            startDate = today;
            endDate = new Date(today.getTime() + (6 * 24 * 60 * 60 * 1000)); // +6 days
            break;
        case 'month':
            startDate = today;
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of current month
            break;
        case 'nextWeek':
            startDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)); // Next Monday
            endDate = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000)); // +6 days
            break;
        default:
            return;
    }
    
    // Format dates for input fields
    startDateInput.value = startDate.toISOString().split('T')[0];
    endDateInput.value = endDate.toISOString().split('T')[0];
    
    console.log(`🔧 Quick maintenance date set: ${type}`, { startDate: startDateInput.value, endDate: endDateInput.value });
}

// Function to load current maintenance dates
async function loadCurrentMaintenanceDates(propertyId) {
    try {
        console.log('🔧 Loading current maintenance dates for property:', propertyId);
        
        const response = await fetch(`${API_BASE}/calendar/byProperty/${propertyId}`);
        if (response.ok) {
            const calendarData = await response.json();
            console.log('🔧 Calendar data received:', calendarData);
            
            const maintenanceDates = calendarData.calendar?.maintenance || [];
            console.log('🔧 Maintenance dates extracted:', maintenanceDates);
            console.log('🔧 Maintenance dates type:', typeof maintenanceDates);
            console.log('🔧 Maintenance dates length:', maintenanceDates.length);
            
            if (maintenanceDates.length > 0) {
                console.log('🔧 First maintenance item:', maintenanceDates[0]);
                console.log('🔧 First maintenance item type:', typeof maintenanceDates[0]);
            }
            
            displayCurrentMaintenanceDates(maintenanceDates);
        } else {
            console.error('❌ Failed to load maintenance dates:', response.status);
            displayCurrentMaintenanceDates([]);
        }
    } catch (error) {
        console.error('❌ Error loading maintenance dates:', error);
        displayCurrentMaintenanceDates([]);
    }
}

// Function to display current maintenance dates
function displayCurrentMaintenanceDates(maintenanceDates) {
    const container = document.getElementById('currentMaintenanceDates');
    if (!container) return;
    
    if (maintenanceDates.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-neutral-500">
                <svg class="w-8 h-8 mx-auto mb-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-sm">No maintenance dates set</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    maintenanceDates.forEach((maintenance, index) => {
        // Handle the case where maintenance is just a date string from calendar API
        if (typeof maintenance === 'string') {
            // Single date
            const date = new Date(maintenance);
            const displayDate = date.toLocaleDateString();
            const status = 'Active';
            const statusColor = 'bg-rose-100 text-rose-700';
            
            // Store the actual dates in data attributes for API calls
            const actualDates = [maintenance]; // Single date as array
            const datesJson = JSON.stringify(actualDates);
            
            html += `
                <div class="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-lg" 
                     data-maintenance-id="${index}"
                     data-maintenance-dates='${datesJson}'>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm font-medium text-rose-800">${displayDate}</span>
                            <span class="px-2 py-1 text-xs ${statusColor} rounded-full">${status}</span>
                        </div>
                        <p class="text-xs text-rose-600">Maintenance scheduled</p>
                    </div>
                    <div class="flex gap-2">
                        <button 
                            onclick="removeMaintenanceDate('${index}')"
                            class="p-1 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors"
                            title="Delete Maintenance (Permanently Remove)">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Handle object format (if it exists)
            const startDate = new Date(maintenance.startDate || maintenance.date).toLocaleDateString();
            const endDate = maintenance.endDate ? new Date(maintenance.endDate).toLocaleDateString() : startDate;
            const reason = maintenance.reason || 'No reason specified';
            const status = maintenance.status || 'Active';
            const statusColor = status === 'Active' ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-neutral-700';
            
            // Store the actual dates in data attributes for API calls
            const actualDates = maintenance.dates || [maintenance.startDate || maintenance.date];
            const datesJson = JSON.stringify(actualDates);
            
            html += `
                <div class="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-lg" 
                     data-maintenance-id="${maintenance._id || maintenance.id || index}"
                     data-maintenance-dates='${datesJson}'>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm font-medium text-rose-800">${startDate}${endDate !== startDate ? ` - ${endDate}` : ''}</span>
                            <span class="px-2 py-1 text-xs ${statusColor} rounded-full">${status}</span>
                        </div>
                        <p class="text-xs text-rose-600">${reason}</p>
                    </div>
                    <div class="flex gap-2">
                        <button 
                            onclick="removeMaintenanceDate('${maintenance._id || maintenance.id || index}')"
                            class="p-1 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors"
                            title="Delete Maintenance (Permanently Remove)">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

// Function to remove a maintenance date
async function removeMaintenanceDate(maintenanceId) {
    if (!confirm('Are you sure you want to remove this maintenance date?')) {
        return;
    }
    
    try {
        console.log('🔧 Removing maintenance date:', maintenanceId);
        
        // Get property ID
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        
        // Get the maintenance data to find the original dates
        const maintenanceContainer = document.getElementById('currentMaintenanceDates');
        const maintenanceElement = maintenanceContainer.querySelector(`[data-maintenance-id="${maintenanceId}"]`);
        
        if (!maintenanceElement) {
            alert('Could not find maintenance data. Please refresh and try again.');
            return;
        }
        
        // Get the dates from the data attribute (stored in correct format)
        const datesJson = maintenanceElement.getAttribute('data-maintenance-dates');
        let dates = [];
        
        try {
            dates = JSON.parse(datesJson);
            console.log('🔧 Dates extracted from data attribute:', dates);
        } catch (error) {
            console.error('❌ Error parsing dates from data attribute:', error);
            alert('Could not parse maintenance dates. Please refresh and try again.');
            return;
        }
        
        if (dates.length === 0) {
            alert('No maintenance dates found. Please refresh and try again.');
            return;
        }
        
        // Use the DELETE method to remove maintenance dates
        const deleteData = {
            dates: dates
        };
        
        console.log('🔧 Sending delete data to API:', deleteData);
        console.log('🔧 API endpoint:', `${API_BASE}/property/${propertyId}/maintenance/delete-by-dates`);
        
        const response = await fetch(`${API_BASE}/property/${propertyId}/maintenance/delete-by-dates`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deleteData)
        });
        
        if (response.ok) {
            console.log('✅ Maintenance date removed successfully');
            // Reload current maintenance dates
            loadCurrentMaintenanceDates(propertyId);
            // Refresh calendar
            fetchAndDisplayCalendarData();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Failed to remove maintenance date:', response.status, errorData);
            alert(`Failed to remove maintenance date: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('❌ Error removing maintenance date:', error);
        alert('Error removing maintenance date. Please try again.');
    }
}

// Function to save maintenance dates
async function saveMaintenanceDates() {
    const startDate = document.getElementById('maintenanceStartDate').value;
    const endDate = document.getElementById('maintenanceEndDate').value;
    const reason = document.getElementById('maintenanceReason').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date cannot be after end date.');
        return;
    }
    
    try {
        console.log('🔧 Saving maintenance dates:', { startDate, endDate, reason });
        
        // Get property ID
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        
        // Generate array of dates between start and end date
        const dates = [];
        const currentDate = new Date(startDate);
        const endDateTime = new Date(endDate);
        
        while (currentDate <= endDateTime) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log('🔧 Generated dates array:', dates);
        
        // Prepare maintenance data according to API specification
        const maintenanceData = {
            dates: dates
        };
        
        // Call API to create maintenance dates
        const response = await fetch(`${API_BASE}/property/${propertyId}/maintenance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(maintenanceData)
        });
        
        if (response.ok) {
            console.log('✅ Maintenance dates saved successfully');
            alert('Maintenance dates have been set successfully!');
            
            // Clear form
            document.getElementById('maintenanceStartDate').value = '';
            document.getElementById('maintenanceEndDate').value = '';
            document.getElementById('maintenanceReason').value = '';
            
            // Reload current maintenance dates
            loadCurrentMaintenanceDates(propertyId);
            
            // Refresh calendar
            fetchAndDisplayCalendarData();
            
            // Close modal
            closeMaintenanceModal();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Failed to save maintenance dates:', response.status, errorData);
            alert(`Failed to save maintenance dates: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('❌ Error saving maintenance dates:', error);
        alert('Error saving maintenance dates. Please try again.');
    }
}

// Function to update existing maintenance dates
async function updateMaintenanceDates(originalDates, newDates, status = 'Active') {
    try {
        console.log('🔧 Updating maintenance dates:', { originalDates, newDates, status });
        
        // Get property ID
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        
        // Prepare update data according to API specification
        const updateData = {
            originalDates: originalDates,
            newDates: newDates,
            status: status
        };
        
        // Call API to update maintenance dates
        const response = await fetch(`${API_BASE}/property/${propertyId}/maintenance/update-by-dates`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            console.log('✅ Maintenance dates updated successfully');
            return true;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Failed to update maintenance dates:', response.status, errorData);
            return false;
        }
    } catch (error) {
        console.error('❌ Error updating maintenance dates:', error);
        return false;
    }
}
