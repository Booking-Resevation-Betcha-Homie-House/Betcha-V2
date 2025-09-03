import { showFullscreenLoading, hideFullscreenLoading } from '/src/fullscreenLoading.js';
import { validateReservationData, showToastError } from '/src/toastNotification.js';

const amenityMapping = { 'wifi': { name: 'WiFi', iconType: '/svg/wifi.svg' }, 'ref': { name: 'Refrigerator', iconType: '/svg/refrigerator.svg' }, 'bathtub': { name: 'Bathtub', iconType: '/svg/bath.svg' }, 'washer': { name: 'Washer', iconType: '/svg/washer.svg' }, 'streaming': { name: 'Streaming Services', iconType: '/svg/tv.svg' }, 'smokeAlarm': { name: 'Smoke Alarm', iconType: '/svg/smokeAlarm.svg' }, 'freeParking': { name: 'Free Parking', iconType: '/svg/parking.svg' }, 'balcony': { name: 'Balcony', iconType: '/svg/balcony.svg' }, 'allowed': { name: 'Pets Allowed', iconType: '/svg/pets.svg' }, 'crib': { name: 'Crib', iconType: '/svg/crib.svg' }, 'aircon': { name: 'Air Conditioning', iconType: '/svg/aircon.svg' }, 'bedset': { name: 'Complete Bed', iconType: '/svg/bed.svg' }, 'hanger': { name: 'Hangers', iconType: '/svg/hanger.svg' }, 'hairDryer': { name: 'Hair Dryer', iconType: '/svg/hairDryer.svg' }, 'iron': { name: 'Iron', iconType: '/svg/iron.svg' }, 'extraPillowBlanket': { name: 'Extra Pillows & Blankets', iconType: '/svg/pillow.svg' }, 'towel': { name: 'Towel', iconType: '/svg/towel.svg' }, 'microwave': { name: 'Microwave', iconType: '/svg/microwave.svg' }, 'stove': { name: 'Stove', iconType: '/svg/stove.svg' }, 'oven': { name: 'Oven', iconType: '/svg/oven.svg' }, 'coffeeMaker': { name: 'Coffee Maker', iconType: '/svg/coffeeMaker.svg' }, 'toaster': { name: 'Toaster', iconType: '/svg/toaster.svg' }, 'PotsPans': { name: 'Pots & Pans', iconType: '/svg/pots.svg' }, 'spices': { name: 'Spices', iconType: '/svg/spices.svg' }, 'dishesCutlery': { name: 'Dishes & Cutlery', iconType: '/svg/dishes.svg' }, 'diningTable': { name: 'Dining Table', iconType: '/svg/diningtable.svg' }, 'shower': { name: 'Shower', iconType: '/svg/shower.svg' }, 'shampoo': { name: 'Shampoo', iconType: '/svg/shampoo.svg' }, 'soap': { name: 'Soap', iconType: '/svg/soap.svg' }, 'toilet': { name: 'Toilet', iconType: '/svg/toilet.svg' }, 'toiletPaper': { name: 'Toilet Paper', iconType: '/svg/toiletPaper.svg' }, 'dryer': { name: 'Dryer', iconType: '/svg/dryer.svg' }, 'dryingRack': { name: 'Drying Rack', iconType: '/svg/dryingRack.svg' }, 'ironBoard': { name: 'Iron Board', iconType: '/svg/ironBoard.svg' }, 'cleaningProduct': { name: 'Cleaning Products', iconType: '/svg/cleaning.svg' }, 'tv': { name: 'TV', iconType: '/svg/tv.svg' }, 'soundSystem': { name: 'Sound System', iconType: '/svg/speaker.svg' }, 'consoleGames': { name: 'Gaming Console', iconType: '/svg/console.svg' }, 'boardGames': { name: 'Board Games', iconType: '/svg/chess.svg' }, 'cardGames': { name: 'Card Games', iconType: '/svg/card.svg' }, 'billiard': { name: 'Billiard Table', iconType: '/svg/billiard.svg' }, 'fireExtinguisher': { name: 'Fire Extinguisher', iconType: '/svg/danger.svg' }, 'firstAidKit': { name: 'First Aid Kit', iconType: '/svg/firstAid.svg' }, 'cctv': { name: 'CCTV', iconType: '/svg/cctv.svg' }, 'smartLock': { name: 'Smart Lock', iconType: '/svg/smartLock.svg' }, 'guard': { name: 'Security Guard', iconType: '/svg/guard.svg' }, 'stairGate': { name: 'Stair Gate', iconType: '/svg/gate.svg' }, 'paidParking': { name: 'Paid Parking', iconType: '/svg/parking.svg' }, 'bike': { name: 'Bicycle', iconType: '/svg/bike.svg' }, 'garden': { name: 'Garden', iconType: '/svg/garden.svg' }, 'grill': { name: 'Grill', iconType: '/svg/grill.svg' }, 'firePit': { name: 'Fire Pit', iconType: '/svg/firePit.svg' }, 'pool': { name: 'Swimming Pool', iconType: '/svg/pool.svg' }, 'petsAllowed': { name: 'Pets Allowed', iconType: '/svg/pets.svg' }, 'petsNotAllowed': { name: 'No Pets', iconType: '/svg/pets.svg' }, 'petBowls': { name: 'Pet Bowls', iconType: '/svg/bowl.svg' }, 'petBed': { name: 'Pet Bed', iconType: '/svg/bed.svg' }, 'babyBath': { name: 'Baby Bath', iconType: '/svg/bath.svg' }, default: { name: 'Other', iconType: '/svg/plus.svg' }};

// Global variable to store property data for reservation
let currentPropertyData = null;

function getAmenitySVGByMapping(amenity) {
    const normalizedKey = amenity.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase();
    const foundKey = Object.keys(amenityMapping).find(key => {
        return key.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase() === normalizedKey;
    });
    return amenityMapping[foundKey] || { name: amenity, iconType: '/svg/plus.svg' };
}

function renderAmenities(apiAmenities, otherAmenities) {
    const normalizedSet = new Set(apiAmenities.map(a => a.toLowerCase().replace(/[_-\s]+/g, '')));
    const modal = document.getElementById('ammenitiesModal');
    if (!modal) return;

    // Process each section and track if they have visible items
    modal.querySelectorAll('.px-3.mb-5').forEach(section => {
        let hasVisibleItems = false;
        
        section.querySelectorAll('li[id]').forEach(li => {
            const [, ...parts] = li.id.split("-");
            const amenityId = parts.join("-");
            if (!amenityId) return;

            const normalizedId = amenityId.toLowerCase().replace(/[_-\s]+/g, '');
            const amenityDiv = li.querySelector('.flex.gap-3.items-center');
            
            if (normalizedSet.has(normalizedId)) {
                li.classList.remove('hidden');
                if (amenityDiv) amenityDiv.classList.remove('hidden');
                hasVisibleItems = true; // Mark section as having visible items
            } else {
                li.classList.add('hidden');
                if (amenityDiv) amenityDiv.classList.add('hidden');
            }
        });
        
        // Hide or show the entire section based on whether it has visible items
        if (hasVisibleItems) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });

    const othersSection = document.querySelector('#ammenitiesModal .px-3.mb-5:last-child');
    if (!othersSection) return;

    const list = othersSection.querySelector('ul.grid');
    if (!list) return;

    list.innerHTML = '';
    
    if (otherAmenities && otherAmenities.length > 0) {
        otherAmenities.forEach(item => {
            const li = document.createElement('li');
            li.className = 'flex items-center gap-2';
            li.innerHTML = `
                <span class="w-6 h-6 flex items-center justify-center">
                    <span class="w-2 h-2 bg-black rounded-full"></span>
                </span>
                <span class="font-inter text-primary-text">${item}</span>
            `;
            list.appendChild(li);
        });
        // Remove grid layout for stacked items
        list.classList.remove('grid');
        list.classList.add('flex', 'flex-col', 'gap-1');
        othersSection.classList.remove('hidden');
    } else {
        othersSection.classList.add('hidden');
    }
}

async function fetchAndDisplayProperty() {
    try {
        showFullscreenLoading('Loading');
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        if (!propertyId) {
            hideFullscreenLoading();
            return;
        }

        const response = await fetch(`https://betcha-api.onrender.com/property/display/${propertyId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        ['photo1','photo2','photo3'].forEach((id, idx) => {
            const el = document.getElementById(id);
            if(el && data.photoLinks[idx]) {
                // Clear existing content and add overflow hidden to container
                el.innerHTML = '';
                el.classList.add('overflow-hidden');
                
                // Create inner div for the background image that will scale
                const photoDiv = document.createElement('div');
                photoDiv.className = 'w-full h-full transition-transform duration-300 ease-in-out hover:scale-110';
                photoDiv.style.backgroundImage = `url('${data.photoLinks[idx]}')`;
                photoDiv.style.backgroundSize = 'cover';
                photoDiv.style.backgroundPosition = 'center';
                photoDiv.style.backgroundRepeat = 'no-repeat';
                
                // Add the photo div inside the container
                el.appendChild(photoDiv);
            }
        });

        const allPhotoContainer = document.getElementById('allPhoto');
        if (allPhotoContainer && data.photoLinks) {
            allPhotoContainer.innerHTML = '';
            data.photoLinks.forEach((link, index) => {
                // Create container div that maintains size
                const containerDiv = document.createElement('div');
                containerDiv.className = 'rounded-xl w-full h-100 cursor-pointer overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out';
                
                // Create inner div for the background image that will scale
                const photoDiv = document.createElement('div');
                photoDiv.className = 'w-full h-full transition-transform duration-300 ease-in-out hover:scale-110';
                photoDiv.style.backgroundImage = `url('${link}')`;
                photoDiv.style.backgroundSize = 'cover';
                photoDiv.style.backgroundPosition = 'center';
                photoDiv.style.backgroundRepeat = 'no-repeat';
                
                // Add the photo div inside the container
                containerDiv.appendChild(photoDiv);
                
                containerDiv.setAttribute('alt', `Room view ${index + 1}`);
                containerDiv.setAttribute('data-image-index', index);
                
                // Optional: Add click handler for image viewing
                containerDiv.addEventListener('click', () => {
                    console.log(`Clicked on image ${index + 1}:`, link);
                    // You can add modal or lightbox functionality here
                });
                
                allPhotoContainer.appendChild(containerDiv);
            });
        }

        const infoMap = {
            roomName: data.name,
            roomAdress: data.address,
            fulladd: data.address,
            category: data.category,
            packageCapacity: data.packageCapacity || '0',
            rate: data.rating || '0',
            roomDescription: data.description,
            roomPrice: data.packagePrice ? `₱${data.packagePrice.toLocaleString()}` : '₱0',
            numOfImg: data.photoLinks ? `${data.photoLinks.length}+` : '0+'
        };
        Object.entries(infoMap).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if(el) el.textContent = value || '';
        });

        // Handle timeIn and timeOut data
        const timeInOutElement = document.getElementById('timeInOut');
        if (timeInOutElement && data.timeIn && data.timeOut) {
            // Format the time display
            const formattedTime = `${data.timeIn} - ${data.timeOut}`;
            timeInOutElement.textContent = formattedTime;
            console.log('TimeIn and TimeOut from API:', data.timeIn, data.timeOut);
        } else if (timeInOutElement) {
            // Fallback if timeIn/timeOut not available
            timeInOutElement.textContent = 'Time not available';
            console.log('TimeIn/TimeOut not available from API:', { timeIn: data.timeIn, timeOut: data.timeOut });
        }

        const mapIframe = document.getElementById('maplink');
        if (mapIframe && data.mapLink) {
            const srcMatch = data.mapLink.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) mapIframe.src = srcMatch[1];
        }

        const amenityList = document.getElementById('amenityList');
        if (amenityList && data.amenities) {
            amenityList.innerHTML = '';
            data.amenities.slice(0, 3).forEach(amenity => {
                const { name, iconType } = getAmenitySVGByMapping(amenity);
                const div = document.createElement('div');
                div.className = 'flex items-center gap-2';
                
                // Check if we have a proper icon or should use bullet
                const hasProperIcon = iconType && iconType !== '/svg/plus.svg';
                
                if (hasProperIcon) {
                    // Use the icon image
                    div.innerHTML = `
                        <img src="${iconType}" alt="${name}" class="w-6 h-6">
                        <span class="font-roboto text-base text-primary-text">${name}</span>
                    `;
                } else {
                    // Use bullet point
                    div.innerHTML = `
                        <span class="w-6 h-6 flex items-center justify-center">
                            <span class="w-2 h-2 bg-black rounded-full"></span>
                        </span>
                        <span class="font-roboto text-base text-primary-text">${name}</span>
                    `;
                }
                
                amenityList.appendChild(div);
            });
        }

        if (typeof renderAmenities === "function") {
            const amenities = Array.isArray(data.amenities) ? data.amenities : [];
            const otherAmenities = Array.isArray(data.otherAmenities) ? data.otherAmenities : [];
            renderAmenities(amenities, otherAmenities);
        }

        // Store property data globally for reservation
        currentPropertyData = {
            id: propertyId,
            name: data.name,
            address: data.address,
            packagePrice: data.packagePrice,
            additionalPax: data.additionalPax,
            reservationFee: data.reservationFee,
            packageCapacity: data.packageCapacity,
            maxCapacity: data.maxCapacity,
            images: data.photoLinks || [],
            timeIn: data.timeIn,
            timeOut: data.timeOut
        };

        // Update guest counter limits based on API maxCapacity
        updateGuestCounterLimits(data.maxCapacity);

        // Setup Reserve button functionality
        setupReserveButton();

        // Setup description toggle functionality
        setupDescriptionToggle();

        // Listen for calendar date selection events
        document.addEventListener('datesSelected', function(e) {
            console.log('Dates selected event received:', e.detail);
            // Update the reserve button state or do any additional setup
        });

    } catch (err) {
        console.error('Error fetching property:', err);
    } finally {
        hideFullscreenLoading();
    }
}

// Function to update guest counter limits based on API maxCapacity
function updateGuestCounterLimits(maxCapacity) {
    if (!maxCapacity || maxCapacity < 1) {
        console.warn('Invalid maxCapacity from API:', maxCapacity);
        return;
    }

    console.log('Updating guest counter limits to:', maxCapacity);

    // Update all guest counter containers
    document.querySelectorAll('.guest-counter').forEach(counter => {
        // Update the data-max attribute
        counter.setAttribute('data-max', maxCapacity);
        
        // Update the display text for max guest number
        const maxGuestDisplay = counter.querySelector('.maxGuestNum');
        if (maxGuestDisplay) {
            maxGuestDisplay.textContent = maxCapacity;
        }
    });

    // Update the guestCount.js functionality by triggering a re-initialization
    // We need to dispatch a custom event to let guestCount.js know about the new limit
    const updateEvent = new CustomEvent('updateGuestLimit', {
        detail: { maxCapacity: maxCapacity }
    });
    document.dispatchEvent(updateEvent);
}

// Function to setup description text toggle functionality
function setupDescriptionToggle() {
    const descWrapper = document.getElementById('descWrapper');
    const toggleText = document.getElementById('toggleText');
    const description = document.getElementById('roomDescription');
    
    if (!descWrapper || !toggleText || !description) {
        console.warn('Description toggle elements not found');
        return;
    }

    // Check if the description content is short enough that it doesn't need toggling
    const checkContentHeight = () => {
        // Temporarily expand to measure full height
        const originalMaxHeight = descWrapper.style.maxHeight;
        descWrapper.style.maxHeight = 'none';
        const fullHeight = description.scrollHeight;
        descWrapper.style.maxHeight = originalMaxHeight;
        
        // If content fits within the collapsed height (6rem = 96px), hide the toggle
        const collapsedHeight = 96; // 6rem in pixels
        
        if (fullHeight <= collapsedHeight) {
            toggleText.style.display = 'none';
        } else {
            toggleText.style.display = 'block';
            setupToggleHandler();
        }
    };

    // Setup toggle click handler
    const setupToggleHandler = () => {
        let isExpanded = false;
        
        toggleText.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (isExpanded) {
                // Collapse
                descWrapper.style.maxHeight = '6rem';
                toggleText.textContent = 'Read More';
                isExpanded = false;
            } else {
                // Expand
                descWrapper.style.maxHeight = description.scrollHeight + 'px';
                toggleText.textContent = 'Read Less';
                isExpanded = true;
            }
        });
    };

    // Check content height after a short delay to ensure content is loaded
    setTimeout(checkContentHeight, 100);
}

// Function to setup Reserve button click handler
function setupReserveButton() {
    const reserveButton = document.getElementById('reserveButton');
    if (!reserveButton) {
        console.warn('Reserve button not found');
        return;
    }

    reserveButton.addEventListener('click', () => {
        // First validate user authentication and verification
        if (!validateReservationData()) {
            return; // Modal will be shown by validateReservationData
        }

        // Get booking data from URL parameters (from search)
        const urlParams = new URLSearchParams(window.location.search);
        const bookingData = getBookingDataFromURL(urlParams);
        
        if (!currentPropertyData) {
            console.error('Property data not available');
            showToastError('error', 'Property Data Missing', 'Property information is not loaded. Please refresh the page and try again.');
            return;
        }

        if (!bookingData.checkInDate || !bookingData.checkOutDate) {
            console.error('Booking dates not available');
            console.log('Available booking data:', bookingData);
            
            // Show toast instead of alert
            showToastError('warning', 'Dates Required', 'Please select check-in and check-out dates using the calendar above before making a reservation.');
            return;
        }

        // Additional validation for guest count
        const guestCount = window.currentGuestCount || bookingData.guestCount || 1;
        if (guestCount < 1) {
            showToastError('warning', 'Guest Count Required', 'Please select at least one guest for your reservation.');
            return;
        }

        // Check if all required property data is present (from currentPropertyData, not bookingData)
        if (!currentPropertyData.name || !currentPropertyData.packagePrice) {
            console.log('Missing property data:', currentPropertyData);
            showToastError('error', 'Property Information Missing', 'Some property information is missing. Please refresh the page and try again.');
            return;
        }

        console.log('All validations passed. Proceeding with reservation...');
        console.log('Property data:', currentPropertyData);
        console.log('Booking data:', bookingData);
        
        // Navigate to confirm reservation with data
        navigateToConfirmReservation(currentPropertyData, bookingData);
    });
}

// Function to extract booking data from URL parameters
function getBookingDataFromURL(urlParams) {
    // Try URL parameters first
    let checkInDate = urlParams.get('checkIn');
    let checkOutDate = urlParams.get('checkOut');
    let guestCount = parseInt(urlParams.get('people')) || parseInt(urlParams.get('guests')) || parseInt(urlParams.get('guestCount')) || 1;
    
    // Debug: Log what we found in URL
    console.log('URL params - checkIn:', checkInDate, 'checkOut:', checkOutDate, 'people/guests:', guestCount);
    
    // If not found in URL, try to get from calendar system
    if (!checkInDate || !checkOutDate) {
        // Check if dates are stored in window object from calendar
        if (window.selectedBookingDates && window.selectedBookingDates.length >= 2) {
            checkInDate = window.selectedBookingDates[0];
            checkOutDate = window.selectedBookingDates[window.selectedBookingDates.length - 1];
            console.log('Got dates from window.selectedBookingDates:', checkInDate, checkOutDate);
        }
        
        // Also try to get from input elements
        if (!checkInDate) {
            const checkInInput = document.getElementById('searchCheckIn') || document.querySelector('input[name="checkIn"]');
            if (checkInInput && checkInInput.value) {
                checkInDate = checkInInput.value;
                console.log('Got checkIn from input:', checkInDate);
            }
        }
        
        if (!checkOutDate) {
            const checkOutInput = document.getElementById('searchCheckOut') || document.querySelector('input[name="checkOut"]');
            if (checkOutInput && checkOutInput.value) {
                checkOutDate = checkOutInput.value;
                console.log('Got checkOut from input:', checkOutDate);
            }
        }
    }
    
    // Try to get guest count from various input elements if not in URL
    if (guestCount === 1) {
        // First check if there's a global guest count from guestCount.js
        if (window.currentGuestCount && window.currentGuestCount > 1) {
            guestCount = window.currentGuestCount;
            console.log('Got guest count from window.currentGuestCount:', guestCount);
        }
        // Then try the guestCount elements that store the actual selected count
        else {
            const guestCountElement = document.getElementById('guestCount') || 
                                    document.querySelector('.guestCount');
            if (guestCountElement) {
                const elementValue = parseInt(guestCountElement.textContent) || parseInt(guestCountElement.value);
                if (elementValue && elementValue > 0) {
                    guestCount = elementValue;
                    console.log('Got guest count from guestCount element:', guestCount);
                }
            }
        }
        
        // Fallback to guestSummary text parsing
        if (guestCount === 1) {
            const guestSummary = document.getElementById('guestSummary');
            if (guestSummary && guestSummary.textContent && !guestSummary.textContent.includes('Add guests')) {
                // Extract number from text like "2 guests" or "1 guest"
                const match = guestSummary.textContent.match(/(\d+)/);
                if (match && parseInt(match[1]) > 0) {
                    guestCount = parseInt(match[1]);
                    console.log('Got guest count from guestSummary:', guestCount);
                }
            }
        }
        
        // Final fallback to other input elements
        if (guestCount === 1) {
            const guestInput = document.getElementById('searchGuestCount') || 
                              document.querySelector('input[name="guests"]') ||
                              document.querySelector('input[name="guestCount"]');
            if (guestInput) {
                const inputValue = parseInt(guestInput.textContent) || parseInt(guestInput.value);
                if (inputValue && inputValue > 0) {
                    guestCount = inputValue;
                    console.log('Got guest count from input:', guestCount);
                }
            }
        }
    }
    
    let daysOfStay = 1;
    if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        daysOfStay = Math.ceil(timeDiff / (1000 * 3600 * 24));
        console.log('Calculated days of stay:', daysOfStay);
    }

    const bookingData = {
        checkInDate,
        checkOutDate,
        guestCount,
        daysOfStay: Math.max(1, daysOfStay) // Ensure at least 1 day
    };
    
    console.log('Final booking data:', bookingData);
    return bookingData;
}

// Function to handle navigation to confirm reservation
function navigateToConfirmReservation(propertyData, bookingData) {
    const params = new URLSearchParams();
    
    // Property data
    params.append('propertyId', propertyData.id || '');
    params.append('propertyName', propertyData.name || '');
    params.append('propertyAddress', propertyData.address || '');
    if (propertyData.images && propertyData.images.length > 0) {
        params.append('images', encodeURIComponent(JSON.stringify(propertyData.images)));
    }
    
    // Booking data
    params.append('checkInDate', bookingData.checkInDate || '');
    params.append('checkOutDate', bookingData.checkOutDate || '');
    params.append('guestCount', bookingData.guestCount || '1');
    params.append('daysOfStay', bookingData.daysOfStay || '1');
    
    // Pricing data
    params.append('pricePerDay', propertyData.packagePrice || '0');
    params.append('addGuestPrice', propertyData.additionalPax || '0');
    params.append('reservationFee', propertyData.reservationFee || '0');
    params.append('packageCapacity', propertyData.packageCapacity || '1');
    
    // Time data
    params.append('timeIn', propertyData.timeIn || '');
    params.append('timeOut', propertyData.timeOut || '');
    
    console.log('Passing time data to confirm reservation:', { timeIn: propertyData.timeIn, timeOut: propertyData.timeOut });
    
    // Navigate to confirm reservation page
    window.location.href = `../auth/confirm-reservation.html?${params.toString()}`;
}

document.addEventListener('DOMContentLoaded', fetchAndDisplayProperty);

