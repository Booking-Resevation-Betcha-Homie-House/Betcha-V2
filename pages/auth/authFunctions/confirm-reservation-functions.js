// Confirm Reservation Functions
// This file handles data population and functionality for the confirm-reservation page

// Import toast notifications
import { showToastError } from '/src/toastNotification.js';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Confirm Reservation page loaded');
    
    // Get data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const reservationData = getReservationDataFromURL(urlParams);
    
    // Populate the page with data
    if (reservationData) {
        populateReservationData(reservationData);
        await setupImageCarousel(); // Make this async
    } else {
        console.warn('No reservation data found in URL');
        // You might want to redirect back or show an error message
    }
    
    // Setup form validation and interactions
    setupPaymentTypeSelection();
    setupFormValidation();
    setupConfirmButton();
});

// Function to setup the confirm button click handler
function setupConfirmButton() {
    const confirmButton = document.getElementById('confirm');
    if (!confirmButton) {
        console.warn('Confirm button not found');
        return;
    }

    confirmButton.addEventListener('click', async () => {
        // Get selected payment type
        const paymentTypeRadio = document.querySelector('input[name="paymentType"]:checked');
        if (!paymentTypeRadio) {
            showToastError('warning', 'Payment Type Required', 'Please select a payment type before confirming.');
            return;
        }

        const paymentType = paymentTypeRadio.id === 'payment-reservation' ? 'Reservation' : 'Full-Payment';
        
        // Get booking data from the current page
        const bookingData = getBookingDataFromPage();
        if (!bookingData) {
            showToastError('error', 'Booking Data Missing', 'Required booking information is missing. Please try again.');
            return;
        }

        // Disable button during API call and show loading
        confirmButton.disabled = true;
        confirmButton.classList.add('opacity-50');
        const originalText = confirmButton.textContent;
        confirmButton.textContent = 'Creating Booking...';
        
        // Show loading toast
        showToastError('info', 'Processing...', 'Creating your booking, please wait...');
        
        try {
            // Call booking API
            const bookingResult = await createBooking(bookingData);
            
            if (bookingResult.success) {
                // Show success toast
                showToastError('success', 'Booking Confirmed!', 'Your booking has been created successfully. Redirecting to payment...');
                
                // Audit: booking created
                try {
                    const uid = localStorage.getItem('userId') || bookingData.guestId;
                    const role = localStorage.getItem('role') || 'Guest';
                    if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logBookingCreation === 'function' && uid) {
                        window.AuditTrailFunctions.logBookingCreation(uid, role.charAt(0).toUpperCase() + role.slice(1));
                    }
                } catch (e) {
                    console.warn('Audit booking creation failed:', e);
                }
                
                // Fire-and-forget: notify TS employees for this property
                try {
                    const propertyId = bookingData.propertyId;
                    const urlParams = new URLSearchParams(window.location.search);
                    const propertyName = urlParams.get('propertyName') || '';
                    
                    console.log('🔔 Attempting to notify TS employees...', { propertyId, propertyName });
                    
                    if (window.notify && propertyId) {
                        // Don't await this - fire and forget
                        window.notify.notifyReservationConfirmedToTS({ propertyId, propertyName })
                            .then(() => console.log('✅ TS notification sent successfully'))
                            .catch(error => console.warn('⚠️ TS notification failed (non-critical):', error));
                    } else {
                        console.warn('⚠️ Notification service not available or missing propertyId');
                    }
                } catch (e) {
                    console.warn('⚠️ notifyReservationConfirmedToTS failed (non-critical):', e);
                }
                
                // Redirect after 1 second with booking ID and payment type
                setTimeout(() => {
                    const params = new URLSearchParams();
                    params.append('bookingId', bookingResult.bookingId);
                    params.append('paymentType', paymentType);
                    window.location.href = `confirm-payment.html?${params.toString()}`;
                }, 1000);
            } else {
                showToastError('error', 'Booking Failed', bookingResult.message || 'Failed to create booking. Please try again.');
                // Restore button
                confirmButton.disabled = false;
                confirmButton.classList.remove('opacity-50');
                confirmButton.textContent = originalText;
            }
        } catch (error) {
            console.error('Booking API error:', error);
            showToastError('error', 'Booking Failed', 'An error occurred while creating your booking. Please try again.');
            // Restore button
            confirmButton.disabled = false;
            confirmButton.classList.remove('opacity-50');
            confirmButton.textContent = originalText;
        }
    });
}

// Function to get booking data from the current page
function getBookingDataFromPage() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error('User ID not found in localStorage');
        return null;
    }

    // Get data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Extract required data
    const propertyId = urlParams.get('propertyId');
    // Prefer name from localStorage; fallback to URL params; finally to 'Guest'
    const firstNameLS = (localStorage.getItem('firstName') || '').trim();
    const lastNameLS = (localStorage.getItem('lastName') || '').trim();
    const nameFromLocalStorage = `${firstNameLS} ${lastNameLS}`.trim();
    const nameFromUrl = (urlParams.get('guestName') || `${urlParams.get('firstName') || ''} ${urlParams.get('lastName') || ''}`).trim();
    const guestName = nameFromLocalStorage || nameFromUrl;
    const guestCount = parseInt(urlParams.get('guestCount')) || 1;
    const checkInDate = urlParams.get('checkInDate');
    const checkOutDate = urlParams.get('checkOutDate');

    if (!propertyId || !checkInDate || !checkOutDate) {
        console.error('Missing required booking data:', { propertyId, checkInDate, checkOutDate });
        return null;
    }

    // Generate dates array between check-in and check-out
    const datesOfBooking = generateDateRange(checkInDate, checkOutDate);

    return {
        propertyId,
        guestId: userId,
        guestName: guestName || 'Guest',
        additionalPax: Math.max(0, guestCount - 1), // Additional pax is guest count minus 1
        datesOfBooking
    };
}

// Function to generate date range array
function generateDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]); // Format: YYYY-MM-DD
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

// Function to call the booking API
async function createBooking(bookingData) {
    try {
        console.log('Creating booking with data:', bookingData);
        
        const response = await fetch('https://betcha-api.onrender.com/booking/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('Booking created successfully:', result);
            return {
                success: true,
                bookingId: result.booking?._id || result.booking?.id || result.id || result._id,
                message: result.message || 'Booking created successfully'
            };
        } else {
            console.error('Booking API error:', result);
            return {
                success: false,
                message: result.message || 'Failed to create booking'
            };
        }
    } catch (error) {
        console.error('Network error during booking creation:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection and try again.'
        };
    }
}

// Function to extract reservation data from URL parameters
function getReservationDataFromURL(urlParams) {
    const data = {};
    
    // Property information
    data.propertyId = urlParams.get('propertyId');
    data.propertyName = urlParams.get('propertyName');
    data.propertyAddress = urlParams.get('propertyAddress');
    data.images = urlParams.get('images') ? JSON.parse(decodeURIComponent(urlParams.get('images'))) : [];
    
    // Booking details
    data.checkInDate = urlParams.get('checkInDate');
    data.checkOutDate = urlParams.get('checkOutDate');
    data.guestCount = parseInt(urlParams.get('guestCount')) || 1;
    data.daysOfStay = parseInt(urlParams.get('daysOfStay')) || 1;
    
    // Pricing details
    data.pricePerDay = parseFloat(urlParams.get('pricePerDay')) || 0;
    data.addGuestPrice = parseFloat(urlParams.get('addGuestPrice')) || 0;
    data.reservationFee = parseFloat(urlParams.get('reservationFee')) || 0;
    data.packageCapacity = parseInt(urlParams.get('packageCapacity')) || 1;
    
    // Time details
    data.timeIn = urlParams.get('timeIn') || '';
    data.timeOut = urlParams.get('timeOut') || '';
    
    // Calculate additional guests and pricing
    data.additionalGuests = Math.max(0, data.guestCount - data.packageCapacity);
    data.totalPriceDay = data.pricePerDay * data.daysOfStay;
    data.totalAddGuest = data.addGuestPrice * data.additionalGuests;
    data.totalPrice = data.totalPriceDay + data.totalAddGuest + data.reservationFee;
    
    console.log('Extracted reservation data:', data);
    return data;
}

// Function to populate the page with reservation data
function populateReservationData(data) {
    try {
        // Room details with character limits
        updateElementText('roomName', truncateText(data.propertyName || 'Room Name', 30));
        updateElementText('roomAdress', truncateText(data.propertyAddress || 'Address', 40));
        
        // Booking details
        updateElementText('checkInDate', formatDate(data.checkInDate) || 'Date');
        updateElementText('checkOutDate', formatDate(data.checkOutDate) || 'Date');
        updateElementText('guestCount', data.guestCount || '1');
        
        // Time details
        updateElementText('timein', data.timeIn || 'Time not available');
        updateElementText('timeout', data.timeOut || 'Time not available');
        
        // Price details
        updateElementText('pricePerDay', data.pricePerDay.toLocaleString() || '00');
        updateElementText('daysOfStay', data.daysOfStay || '00');
        updateElementText('totalPriceDay', data.totalPriceDay.toLocaleString() || '00');
        updateElementText('addGuestPrice', data.addGuestPrice.toLocaleString() || '00');
        updateElementText('addGuestCount', data.additionalGuests || '00');
        updateElementText('totalAddGuest', data.totalAddGuest.toLocaleString() || '00');
        updateElementText('reservationFee', data.reservationFee.toLocaleString() || '00');
        updateElementText('totalPrice', data.totalPrice.toLocaleString() || '00');
        
        console.log('Reservation data populated successfully');
        
    } catch (error) {
        console.error('Error populating reservation data:', error);
    }
}

// Helper function to truncate text if it exceeds character limit
function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Helper function to update element text content
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`Element with id '${elementId}' not found`);
    }
}

// Function to format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// Function to setup image carousel
async function setupImageCarousel() {
    const imageContainer = document.getElementById('propertyImageContainer');
    
    if (!imageContainer) {
        console.warn('Image container not found');
        return;
    }
    
    // Get property ID from URL to fetch images from API
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('propertyId');
    
    console.log('Property ID for images:', propertyId); // Debug log
    
    if (!propertyId) {
        console.warn('No property ID found in URL');
        setupPlaceholderImage(imageContainer);
        return;
    }
    
    try {
        // Fetch property data from API to get photoLinks
        const apiUrl = `https://betcha-api.onrender.com/property/display/${propertyId}`;
        console.log('Fetching property images from API:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const propertyData = await response.json();
        console.log('Property data received:', propertyData);
        
        const images = propertyData.photoLinks || [];
        console.log('Photo links from API:', images);
        
        if (images && images.length > 0) {
            console.log('Setting up carousel with', images.length, 'images from API');
            setupCarouselWithImages(imageContainer, images);
        } else {
            console.log('No photoLinks found in API response, setting up placeholder');
            setupPlaceholderImage(imageContainer);
        }
        
    } catch (error) {
        console.error('Error fetching property images from API:', error);
        console.log('Falling back to placeholder image');
        setupPlaceholderImage(imageContainer);
    }
}

// Function to setup carousel with images
function setupCarouselWithImages(container, images) {
    // Clear the gray background and create carousel
    container.className = 'h-50 w-full rounded-xl mb-5 relative overflow-hidden';
    
    const carouselHTML = `
        <div class="carousel-container relative w-full h-full overflow-hidden">
            <div class="carousel-track flex transition-transform duration-500 ease-in-out h-full">
                ${images.map((image, index) => `
                    <div class="w-full h-full flex-shrink-0 overflow-hidden">
                        <img src="${image}" alt="Room Image ${index + 1}" 
                             class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                             onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-400 flex items-center justify-center\\'>    <div class=\\'text-center\\'>        <svg class=\\'w-12 h-12 text-neutral-500 mx-auto mb-2\\' fill=\\'currentColor\\' viewBox=\\'0 0 20 20\\'>            <path fill-rule=\\'evenodd\\' d=\\'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z\\' clip-rule=\\'evenodd\\'/></svg>        <p class=\\'text-neutral-600 text-xs\\'>Image not available</p>    </div></div>'" />
                    </div>
                `).join('')}
            </div>
            <!-- Circular Navigation Dots -->
            <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                ${images.map((_, index) => `
                    <div class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = carouselHTML;
    
    // Setup auto-scroll and navigation
    setupCarouselAutoScroll(container, images.length);
}

// Function to setup carousel auto-scroll
function setupCarouselAutoScroll(container, imageCount) {
    if (imageCount <= 1) return;
    
    const track = container.querySelector('.carousel-track');
    const dots = container.querySelectorAll('.dot');
    let currentSlide = 0;
    
    function updateDots(activeIndex) {
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[activeIndex]) {
            dots[activeIndex].classList.add('active');
        }
    }
    
    function goToSlide(index) {
        currentSlide = index;
        track.style.transform = `translateX(-${index * 100}%)`;
        updateDots(index);
    }
    
    // Auto-scroll interval (4 seconds to match other carousels)
    let autoScrollInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % imageCount;
        goToSlide(currentSlide);
    }, 4000);
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            // Reset auto-scroll
            clearInterval(autoScrollInterval);
            autoScrollInterval = setInterval(() => {
                currentSlide = (currentSlide + 1) % imageCount;
                goToSlide(currentSlide);
            }, 4000);
        });
    });
}

// Function to setup placeholder image
function setupPlaceholderImage(container) {
    console.log('Setting up placeholder image'); // Debug log
    container.innerHTML = `
        <div class="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-400 flex items-center justify-center">
            <div class="text-center">
                <svg class="w-16 h-16 text-neutral-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                </svg>
                <p class="text-neutral-600 text-sm font-medium">Property Image</p>
            </div>
        </div>
    `;
}

// Function to setup payment type selection
function setupPaymentTypeSelection() {
    const paymentRadios = document.querySelectorAll('input[name="paymentType"]');
    const reservationFeeRadio = document.getElementById('payment-reservation');
    
    // Set default selection to reservation fee
    if (reservationFeeRadio) {
        reservationFeeRadio.checked = true;
    }
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updatePaymentAmount(e.target.value);
        });
    });
}

// Function to update payment amount based on selection
function updatePaymentAmount(paymentType) {
    const urlParams = new URLSearchParams(window.location.search);
    const reservationFee = parseFloat(urlParams.get('reservationFee')) || 0;
    const totalPrice = parseFloat(urlParams.get('totalPrice')) || 0;
    
    // You can add visual feedback here if needed
    console.log(`Payment type selected: ${paymentType}`);
    console.log(`Amount to pay: ${paymentType === 'payment-reservation' ? reservationFee : totalPrice}`);
}

// Function to setup form validation
function setupFormValidation() {
    const checkbox = document.getElementById('check-with-link');
    const proceedButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    
    if (checkbox && proceedButton) {
        // Initially disable the proceed button
        proceedButton.disabled = true;
        proceedButton.classList.add('opacity-50', 'cursor-not-allowed');
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                proceedButton.disabled = false;
                proceedButton.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                proceedButton.disabled = true;
                proceedButton.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
    }
}

// Function to handle navigation to confirm reservation (called from reserve button)
function navigateToConfirmReservation(propertyData, bookingData) {
    const params = new URLSearchParams();
    
    // Property data (removed images parameter - now fetched from API)
    params.append('propertyId', propertyData.id || '');
    params.append('propertyName', propertyData.name || '');
    params.append('propertyAddress', propertyData.address || '');
    
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
    
    // Navigate to confirm reservation page
    window.location.href = `../auth/confirm-reservation.html?${params.toString()}`;
}

// Export function for use in other scripts
window.navigateToConfirmReservation = navigateToConfirmReservation;
