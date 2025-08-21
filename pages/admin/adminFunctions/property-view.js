// Property View Page JavaScript
// This file handles fetching and displaying property data from the API
//The report tab is not working yet
// Amenities should only show the selected amenities
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
        const response = await fetch(`/api/property/display/${propertyId}`);
        
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
            propertyMapLinkElement.textContent = data.mapLink;
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
            propertyMapLinkElement.textContent = 'Map link not available';
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
    if (!amenities) return;
    
    // Clear all existing amenity items
    clearAllAmenities();
    
    // Populate based on amenities array
    amenities.forEach(amenity => {
        const amenityId = getAmenityId(amenity);
        if (amenityId) {
            const element = document.getElementById(amenityId);
            if (element) {
                element.style.display = 'block';
            }
        }
    });
    
    // Handle other amenities
    if (otherAmenities && otherAmenities.length > 0) {
        const othersContainer = document.getElementById('others');
        if (othersContainer) {
            othersContainer.innerHTML = '';
            otherAmenities.forEach(amenity => {
                const li = document.createElement('li');
                li.className = 'p-2';
                li.innerHTML = `
                    <span class="font-inter text-primary-text">${amenity}</span>
                `;
                othersContainer.appendChild(li);
            });
        }
    }
}

// Get amenity ID based on amenity name
function getAmenityId(amenity) {
    const amenityMap = {
        'wifi': 'essentials-wifi',
        'aircon': 'essentials-aircon',
        'bedset': 'essentials-bedset',
        'hanger': 'essentials-hanger',
        'hairDryer': 'essentials-hairDryer',
        'iron': 'essentials-iron',
        'extraPillowBlanket': 'essentials-extraPillowBlanket',
        'towel': 'essentials-towel',
        'ref': 'kitchenDining-ref',
        'microwave': 'kitchenDining-microwave',
        'stove': 'kitchenDining-stove',
        'oven': 'kitchenDining-oven',
        'coffeeMaker': 'kitchenDining-coffeeMaker',
        'toaster': 'kitchenDining-toaster',
        'PotsPans': 'kitchenDining-PotsPans',
        'spices': 'kitchenDining-spices',
        'dishesCutlery': 'kitchenDining-dishesCutlery',
        'diningTable': 'kitchenDining-diningTable',
        'bathtub': 'bathroom-bathtub',
        'shower': 'bathroom-shower',
        'shampoo': 'bathroom-shampoo',
        'soap': 'bathroom-soap',
        'toilet': 'bathroom-toilet',
        'toiletPaper': 'bathroom-toiletPaper',
        'washer': 'laundry-washer',
        'dryer': 'laundry-dryer',
        'dryingRack': 'laundry-dryingRack',
        'ironBoard': 'laundry-ironBoard',
        'cleaningProduct': 'laundry-cleaningProduct',
        'tv': 'entertainment-tv',
        'streaming': 'entertainment-streaming',
        'soundSystem': 'entertainment-soundSystem',
        'consoleGames': 'entertainment-consoleGames',
        'boardGames': 'entertainment-boardGames',
        'cardGames': 'entertainment-cardGames',
        'billiard': 'entertainment-billiard',
        'smokeAlarm': 'homeSafety-smokeAlarm',
        'fireExtinguisher': 'homeSafety-fireExtinguisher',
        'firstAidKit': 'homeSafety-firstAidKit',
        'cctv': 'homeSafety-cctv',
        'smartLock': 'homeSafety-smartLock',
        'guard': 'homeSafety-guard',
        'stairGate': 'homeSafety-stairGate',
        'freeParking': 'parkTransport-freeParking',
        'paidParking': 'parkTransport-paidParking',
        'bike': 'parkTransport-bike',
        'balcony': 'outdoorNature-balcony',
        'garden': 'outdoorNature-garden',
        'grill': 'outdoorNature-grill',
        'diningTable': 'outdoorNature-diningTable',
        'firePit': 'outdoorNature-firePit',
        'pool': 'outdoorNature-pool',
        'petsAllowed': 'pets-allowed',
        'petsNotAllowed': 'pets-notAllowed',
        'petBowls': 'pets-foodBowl',
        'petBed': 'pets-bed',
        'crib': 'ff-crib',
        'babyBath': 'ff-babyBath',
        'stairGate': 'ff-stairGate'
    };
    
    return amenityMap[amenity.toLowerCase()];
}

// Clear all amenities display
function clearAllAmenities() {
    const amenityElements = document.querySelectorAll('[id*="-"]');
    amenityElements.forEach(element => {
        if (element.id.includes('-')) {
            element.style.display = 'none';
        }
    });
}

// Populate reports
function populateReports(reports) {
    if (!reports) return;
    
    const unsolvedContainer = document.querySelector('.tab-content:first-child');
    const solvedContainer = document.querySelector('.tab-content:last-child');
    
    if (!unsolvedContainer || !solvedContainer) return;
    
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
    
    const date = new Date(report.createdAt || Date.now()).toLocaleDateString();
    
    div.innerHTML = `
        <div class="flex items-center justify-between mb-1">
            <p class="text-sm font-semibold text-primary-text tracking-wide group-hover:text-primary transition-colors">
                ${report.transactionId || 'TRX-' + Math.random().toString(36).substr(2, 9)}
            </p>
            <span class="text-xs text-neutral-400">${date}</span>
        </div>
        <div class="flex items-center justify-between">
            <p class="text-xs text-neutral-700">${report.reporterName || 'Anonymous'}</p>
            <span class="text-[11px] font-medium text-white bg-primary/80 rounded-full px-2 py-0.5">
                ${report.category || 'General Issue'}
            </span>
        </div>
    `;
    
    return div;
}

// Create no reports element
function createNoReportsElement() {
    const div = document.createElement('div');
    div.className = 'w-full h-full flex justify-center items-center';
    div.innerHTML = '<p class="text-neutral-300">No reports</p>';
    return div;
}

// Initialize page functionality
function initializePage() {
    // Initialize read more toggle
    initializeReadMoreToggle();
    
    // Initialize edit button functionality
    initializeEditButton();
    
    // Initialize delete button functionality
    initializeDeleteButton();
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
function initializeDeleteButton() {
    const deleteButton = document.querySelector('button svg[fill="rose-700"]').parentElement;
    if (deleteButton) {
        deleteButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
                // Get current property ID from URL or use default
                const urlParams = new URLSearchParams(window.location.search);
                const propertyId = urlParams.get('id') || '68a0332259e435d693628999';
                
                // Here you would typically make an API call to delete the property
                console.log('Deleting property:', propertyId);
                
                // For now, just show a message
                alert('Delete functionality would be implemented here with proper API integration.');
            }
        });
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
    goToEditPage
};
