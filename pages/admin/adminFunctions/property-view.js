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

// (Removed) console.log override; logs are stripped from this file

// ===== Amenity metadata and category constants =====
// Single source of truth for amenity display name and icon filename
const AMENITY_META = {
    wifi: { name: 'WiFi', icon: 'wifi.svg' },
    aircon: { name: 'Air Conditioning', icon: 'aircon.svg' },
    bedset: { name: 'Complete Bed', icon: 'bed.svg' },
    hanger: { name: 'Hangers', icon: 'hanger.svg' },
    hairDryer: { name: 'Hair Dryer', icon: 'hairDryer.svg' },
    iron: { name: 'Iron', icon: 'iron.svg' },
    extraPillowBlanket: { name: 'Extra Pillows & Blankets', icon: 'extraPillowsBlanket.svg' },
    towel: { name: 'Towel', icon: 'towel.svg' },
    ref: { name: 'Refrigerator', icon: 'refrigerator.svg' },
    microwave: { name: 'Microwave', icon: 'microwave.svg' },
    stove: { name: 'Stove', icon: 'stove.svg' },
    oven: { name: 'Oven', icon: 'oven.svg' },
    coffeeMaker: { name: 'Coffee Maker', icon: 'coffeeMaker.svg' },
    toaster: { name: 'Toaster', icon: 'toaster.svg' },
    potsPans: { name: 'Pots & Pans', icon: 'pan.svg' },
    PotsPans: { name: 'Pots & Pans', icon: 'pan.svg' },
    spices: { name: 'Spices', icon: 'salt.svg' },
    dishesCutlery: { name: 'Dishes & Cutlery', icon: 'dishes.svg' },
    diningTable: { name: 'Dining Table', icon: 'diningtable.svg' },
    bathtub: { name: 'Bathtub', icon: 'bath.svg' },
    shower: { name: 'Shower', icon: 'shower.svg' },
    shampoo: { name: 'Shampoo', icon: 'shampoo.svg' },
    soap: { name: 'Soap', icon: 'soap.svg' },
    toilet: { name: 'Toilet', icon: 'toilet.svg' },
    toiletPaper: { name: 'Toilet Paper', icon: 'toiletPaper.svg' },
    washer: { name: 'Washer', icon: 'washer.svg' },
    dryer: { name: 'Dryer', icon: 'dryer.svg' },
    dryingRack: { name: 'Drying Rack', icon: 'ironBoard.svg' },
    ironBoard: { name: 'Iron Board', icon: 'ironBoard.svg' },
    cleaningProduct: { name: 'Cleaning Products', icon: 'detergent.svg' },
    tv: { name: 'TV', icon: 'tv.svg' },
    streaming: { name: 'Streaming Services', icon: 'tv.svg' },
    soundSystem: { name: 'Sound System', icon: 'speaker.svg' },
    consoleGames: { name: 'Gaming Console', icon: 'console.svg' },
    boardGames: { name: 'Board Games', icon: 'chess.svg' },
    cardGames: { name: 'Card Games', icon: 'card.svg' },
    billiard: { name: 'Billiard Table', icon: 'chess.svg' },
    smokeAlarm: { name: 'Smoke Alarm', icon: 'smokeAlarm.svg' },
    fireExtinguisher: { name: 'Fire Extinguisher', icon: 'fireExtinguisher.svg' },
    firstAidKit: { name: 'First Aid Kit', icon: 'firstAidKit.svg' },
    cctv: { name: 'CCTV', icon: 'cctv.svg' },
    smartLock: { name: 'Smart Lock', icon: 'smartLock.svg' },
    guard: { name: 'Security Guard', icon: 'guard.svg' },
    stairGate: { name: 'Stair Gate', icon: 'gate.svg' },
    freeParking: { name: 'Free Parking', icon: 'parkring.svg' },
    paidParking: { name: 'Paid Parking', icon: 'parkring.svg' },
    bike: { name: 'Bicycle', icon: 'bike.svg' },
    balcony: { name: 'Balcony', icon: 'balcony.svg' },
    garden: { name: 'Garden', icon: 'garden.svg' },
    grill: { name: 'Grill', icon: 'grill.svg' },
    firePit: { name: 'Fire Pit', icon: 'firePit.svg' },
    pool: { name: 'Swimming Pool', icon: 'pool.svg' },
    bed: { name: 'Bed', icon: 'bed.svg' },
    petsAllowed: { name: 'Pets Allowed', icon: 'petPaw.svg' },
    petsNotAllowed: { name: 'No Pets', icon: 'petPaw.svg' },
    notAllowed: { name: 'No Pets', icon: 'petPaw.svg' },
    petBowls: { name: 'Pet Bowls', icon: 'bowl.svg' },
    foodBowl: { name: 'Pet Bowls', icon: 'bowl.svg' },
    petBed: { name: 'Pet Bed', icon: 'bed.svg' },
    crib: { name: 'Crib', icon: 'crib.svg' },
    babyBath: { name: 'Baby Bath', icon: 'bath.svg' },
    allowed: { name: 'Pets Allowed', icon: 'petPaw.svg' }
};

// No fuzzy normalization needed – API provides canonical amenity keys

// Category definitions shared across categorization and rendering
const CATEGORIES = {
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

// Map of category to modal container id
const CATEGORY_TO_CONTAINER_ID = {
    'Essentials': 'essentialsList',
    'Kitchen & Dining': 'kitchenDiningList',
    'Bathroom': 'bathroomList',
    'Laundry': 'laundryList',
    'Safety & Security': 'safetySecurityList',
    'Entertainment': 'entertainmentList',
    'Outdoor & Parking': 'outdoorNatureList',
    'Parking & Transport': 'parkingTransportList',
    'Pets': 'petsList',
    'Family Friendly': 'familyFriendlyList',
    'Other': 'othersList'
};
// Fetch property data from API
async function fetchPropertyData(propertyId) {
    try {
        const response = await fetch(`${API_BASE}/property/display/${propertyId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const propertyData = await response.json();
        
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
    
    // Initialize read more toggle after content is populated
    setTimeout(() => {
        initializeReadMoreToggle();
    }, 100);
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
        // Keep default "No photos" state - don't change anything
        return;
    }
    
    // Get the individual photo elements
    const photo1 = document.getElementById('photo1');
    const photo2Container = document.getElementById('photo2');
    const photo2 = photo2Container ? photo2Container.querySelector('div:first-child') : null;
    const photo3 = document.getElementById('photo3');
    
    if (!photo1) return;
    
    // Set background image for photo1 (first image)
    if (photoLinks.length >= 1) {
        photo1.style.backgroundImage = `url('${photoLinks[0]}')`;
        photo1.style.backgroundSize = 'cover';
        photo1.style.backgroundPosition = 'center';
        photo1.style.backgroundRepeat = 'no-repeat';
        photo1.innerHTML = ''; // Remove "No photos" text
    }
    
    // Set background image for photo2 (second image)
    if (photoLinks.length >= 2 && photo2) {
        photo2.style.backgroundImage = `url('${photoLinks[1]}')`;
        photo2.style.backgroundSize = 'cover';
        photo2.style.backgroundPosition = 'center';
        photo2.style.backgroundRepeat = 'no-repeat';
        photo2.innerHTML = ''; // Remove "No photos" text
    }
    
    // Set background image for photo3 (third image)
    if (photoLinks.length >= 3 && photo3) {
        photo3.style.backgroundImage = `url('${photoLinks[2]}')`;
        photo3.style.backgroundSize = 'cover';
        photo3.style.backgroundPosition = 'center';
        photo3.style.backgroundRepeat = 'no-repeat';
        photo3.innerHTML = ''; // Remove "No photos" text
    }
    
    // Update photo count in floating button
    const photoCountElement = document.getElementById('photoCount');
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
function renderAmenities({ amenities, otherAmenities, mainLimit = 5 }) {
    if (!amenities || amenities.length === 0) return;
    if (window.amenitiesPopulated) return;
    try {
        clearAllAmenities();
        const mainAmenitiesContainer = document.getElementById('mainAmenities');
        if (mainAmenitiesContainer) {
            mainAmenitiesContainer.innerHTML = '';
            const displayAmenities = amenities.slice(0, mainLimit);
            displayAmenities.forEach(amenity => {
                const amenityInfo = getAmenityDisplayInfo(amenity);
                const iconPath = getAmenityIcon(amenityInfo.icon);
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
            const showAllButton = document.getElementById('showAllAmenitiesBtn');
            if (showAllButton) {
                if (amenities.length > mainLimit) {
                    showAllButton.style.display = 'block';
                    showAllButton.textContent = `Show all amenities (${amenities.length})`;
                } else {
                    showAllButton.style.display = 'none';
                }
            }
        }
        const allAmenities = [...amenities];
        if (otherAmenities && otherAmenities.length > 0) allAmenities.push(...otherAmenities);
        populateCategorizedAmenities(allAmenities);
        window.amenitiesPopulated = true;
    } catch (error) {
        window.amenitiesPopulated = false;
    }
}

function populateAmenities(amenities, otherAmenities) {
    renderAmenities({ amenities, otherAmenities, mainLimit: 5 });
}

// New function to populate categorized amenities in the modal
function populateCategorizedAmenities(amenities) {
    
    // Group amenities by category
    const categorizedAmenities = categorizeAmenities(amenities);
    
    // Populate each category list
    Object.keys(categorizedAmenities).forEach(category => {
        const amenitiesList = categorizedAmenities[category];
        if (amenitiesList.length > 0) {
            
            // Get the appropriate container for this category
            let containerId = CATEGORY_TO_CONTAINER_ID[category] || '';
            if (category === 'Other') {
                populateOtherAmenities(amenitiesList);
                return; // Skip the rest of the loop for this category
            }
            
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
                
                amenitiesList.forEach(amenity => {
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
                    container.appendChild(li);
                });
                
            } else {
                console.error(`❌ Container not found for category: ${category} (ID: ${containerId})`);
            }
        }
    });
}

// New function to populate other amenities
function populateOtherAmenities(otherAmenities) {
    
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
}

// (Removed) ensureAmenitiesModalWorks: redundant existence checks not needed in production

// Get amenity display info (icon and friendly name)
function getAmenityDisplayInfo(amenity) {
    const key = (amenity || '').toString();
    const meta = AMENITY_META[key] || { name: key, icon: 'star.svg' };
    return { icon: meta.icon.replace('.svg', ''), name: meta.name };
}

// Get SVG icon for amenity type
function getAmenityIcon(iconType) {
    const v = (iconType || '').toString();
    const filename = v.endsWith('.svg') ? v : `${v}.svg`;
    return `/public/svg/${filename}`;
}

// Helper function to categorize amenities
function categorizeAmenities(amenities) {
    
    const categorized = {};
    const processedAmenities = new Set(); // Track processed amenities to avoid duplicates
    
    amenities.forEach(amenity => {
        // Skip only truly invalid amenities
        if (!amenity || typeof amenity !== 'string' || amenity.trim() === '') {
            return;
        }
        
        if (processedAmenities.has(amenity.toLowerCase())) {
            return; // Skip if already processed
        }
        
        
        let isCategorized = false;
        for (const [category, categoryAmenities] of Object.entries(CATEGORIES)) {
            // Check if amenity matches any category (case-insensitive and partial matching)
            if (categoryAmenities.some(catAmenity => 
                amenity.toLowerCase().includes(catAmenity.toLowerCase()) || 
                catAmenity.toLowerCase().includes(amenity.toLowerCase())
            )) {
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
    
    // Clear main amenities display
    const mainAmenitiesContainer = document.getElementById('mainAmenities');
    if (mainAmenitiesContainer) {
        mainAmenitiesContainer.innerHTML = '';
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
    }
    
    if (kitchenDiningContainer) {
        kitchenDiningContainer.innerHTML = '';
    }
    
    if (bathroomContainer) {
        bathroomContainer.innerHTML = '';
    }
    
    if (laundryContainer) {
        laundryContainer.innerHTML = '';
    }
    
    if (safetySecurityContainer) {
        safetySecurityContainer.innerHTML = '';
    }
    
    if (entertainmentContainer) {
        entertainmentContainer.innerHTML = '';
    }
    
    if (parkingTransportContainer) {
        parkingTransportContainer.innerHTML = '';
    }
    
    if (outdoorNatureContainer) {
        outdoorNatureContainer.innerHTML = '';
    }
    
    if (petsContainer) {
        petsContainer.innerHTML = '';
    }
    
    if (familyFriendlyContainer) {
        familyFriendlyContainer.innerHTML = '';
    }
    
    if (othersList) {
        othersList.innerHTML = '';
    }
    
    // Hide others container if it exists
    if (othersContainer) {
        othersContainer.style.display = 'none';
    }
    
}

// Populate reports
function populateReports(reports) {
    
    if (!reports) {
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
        reports.unsolved.forEach(report => {
            const reportElement = createReportElement(report, 'unsolved');
            unsolvedContainer.appendChild(reportElement);
        });
    } else {
        const noReportsElement = createNoReportsElement();
        unsolvedContainer.appendChild(noReportsElement);
    }
    
    // Populate solved reports
    if (reports.solved && reports.solved.length > 0) {
        reports.solved.forEach(report => {
            const reportElement = createReportElement(report, 'solved');
            solvedContainer.appendChild(reportElement);
        });
    } else {
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
    
    // Set the first tab as active by default
    setReportsActiveTab(0);
    
    // Make the function globally accessible
    window.setReportsActiveTab = setReportsActiveTab;
}

// Change report status
async function changeReportStatus() {
    
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
            return;
        }
        
        
        // Fetch calendar data from API
        const response = await fetch(`${API_BASE}/calendar/byProperty/${propertyId}`);
        
        if (response.ok) {
            const calendarData = await response.json();
            
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
        return;
    }
    
    // Get all booked dates
    const bookedDates = calendarData.booking ? calendarData.booking.map(booking => booking.date) : [];
    
    // Get all maintenance dates
    const maintenanceDates = calendarData.maintenance ? calendarData.maintenance.map(maintenance => maintenance.date) : [];
    
    
    // Combine all unavailable dates
    const allUnavailableDates = [...bookedDates, ...maintenanceDates];
    
    // Update the global unavailableDates array in calendar2.js
    if (typeof window !== 'undefined' && window.calendarUnavailableDates) {
        window.calendarUnavailableDates = allUnavailableDates;
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
    
    // Fetch calendar data when page loads
    fetchAndDisplayCalendarData();
    
    // Listen for calendar data updates
    document.addEventListener('calendarDataUpdated', (event) => {
        // The calendar2.js will handle the re-render
    });
}

// Initialize page functionality
function initializePage() {
    // Reset amenities populated flag for clean state
    resetAmenitiesPopulatedFlag();
    
    // Initialize delete button functionality
    initializeDeleteButton();
    
    // Initialize calendar functionality
    initializeCalendar();
    
    // Initialize reports tab functionality
    initializeReportsTabs();

}

// Initialize edit button functionality
function initializeEditButton() {
    // Redundant when inline onclick exists; no extra binding needed
}

// Initialize read more toggle functionality
function initializeReadMoreToggle() {
    const toggleText = document.getElementById('toggleText');
    const descWrapper = document.getElementById('descWrapper');
    
    if (toggleText && descWrapper) {
        // Remove any existing event listeners by cloning the element
        const newToggleText = toggleText.cloneNode(true);
        toggleText.parentNode.replaceChild(newToggleText, toggleText);
        
        // Check if content overflows the collapsed height
        const contentHeight = descWrapper.scrollHeight;
        const maxHeight = 96; // 6rem = 96px
        
        if (contentHeight <= maxHeight) {
            // Content fits, hide the toggle link
            newToggleText.style.display = 'none';
        } else {
            // Content overflows, show the toggle link
            newToggleText.style.display = 'block';
            
            newToggleText.addEventListener('click', function() {
                const isExpanded = descWrapper.style.maxHeight === 'none';
                
                if (isExpanded) {
                    descWrapper.style.maxHeight = '6rem';
                    newToggleText.textContent = 'Read More';
                } else {
                    descWrapper.style.maxHeight = 'none';
                    newToggleText.textContent = 'Read Less';
                }
            });
        }
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
    const deleteButton = document.getElementById('archivePropertyBtn');
    if (deleteButton) {
        
        deleteButton.addEventListener('click', async function(e) {
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
            }
        });
    } else {
        console.error('❌ Delete button not found');
    }
}

// Unified toast helper
function showToast(type, message) {
    const baseClass = 'fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    const colorClass = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    const div = document.createElement('div');
    div.className = `${baseClass} ${colorClass}`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => {
        if (div.parentNode) {
            div.parentNode.removeChild(div);
        }
    }, 5000);
}

// Backwards-compatible wrappers
function showErrorMessage(message) {
    showToast('error', message);
}

function showSuccessMessage(message) {
    showToast('success', message);
}

// (Removed) formatCurrency, formatDate: not used in this file

// (Removed) window.PropertyView aggregate export: not referenced elsewhere

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
        return;
    }
    
    // Hide no images message
    if (noImagesMessage) {
        noImagesMessage.classList.add('hidden');
    }
    
    
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
    
}

// Function to load current maintenance dates
async function loadCurrentMaintenanceDates(propertyId) {
    try {
        
        const response = await fetch(`${API_BASE}/calendar/byProperty/${propertyId}`);
        if (response.ok) {
            const calendarData = await response.json();
            
            const maintenanceDates = calendarData.calendar?.maintenance || [];
            
            if (maintenanceDates.length > 0) {
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
        
        const response = await fetch(`${API_BASE}/property/${propertyId}/maintenance/delete-by-dates`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deleteData)
        });
        
        if (response.ok) {
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
