// Confirm Reservation Functions
// This file handles data population and functionality for the confirm-reservation page

// Import toast notifications
import { showToastError } from '/src/toastNotification.js';

document.addEventListener('DOMContentLoaded', async function() {
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
    
    // Setup navigation warnings
    setupNavigationWarnings();
});

// Function to setup the confirm button click handler
function setupConfirmButton() {
    const confirmButton = document.getElementById('confirm');
    const confirmText = document.getElementById('confirm-text'); // 👈 grab the span
    if (!confirmButton || !confirmText) {
        console.warn('Confirm button or text span not found');
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
        confirmButton.classList.add('opacity-70');
        confirmButton.classList.remove('group-hover:-translate-x-1');
        const originalText = confirmText.textContent;
        confirmText.textContent = 'Creating Booking...'; // 👈 only update span text
        
        // Show loading toast
        showToastError('info', 'Processing...', 'Creating your booking, please wait...');
        
        try {
            // Call booking API
            const bookingResult = await createBooking(bookingData);
            
            if (bookingResult.success) {
                showToastError('success', 'Booking Confirmed!', 'Your booking has been created successfully. Redirecting to payment...');
                
                // Audit logging
                try {
                    const uid = localStorage.getItem('userId') || bookingData.guestId;
                    const role = localStorage.getItem('role') || 'Guest';
                    if (window.AuditTrailFunctions?.logBookingCreation && uid) {
                        window.AuditTrailFunctions.logBookingCreation(uid, role.charAt(0).toUpperCase() + role.slice(1));
                    }
                } catch (e) {
                    console.warn('Audit booking creation failed:', e);
                }
                
                // Notify TS employees (fire-and-forget)
                try {
                    const propertyId = bookingData.propertyId;
                    const urlParams = new URLSearchParams(window.location.search);
                    const propertyName = urlParams.get('propertyName') || '';
                    
                    if (window.notify && propertyId) {
                        window.notify.notifyReservationConfirmedToTS({ propertyId, propertyName })
                            .then(() => console.log('✅ TS notification sent successfully'))
                            .catch(error => console.warn('⚠️ TS notification failed:', error));
                    }
                } catch (e) {
                    console.warn('⚠️ notifyReservationConfirmedToTS failed:', e);
                }
                
                // Redirect immediately to payment page
                const params = new URLSearchParams();
                params.append('bookingId', bookingResult.bookingId);
                params.append('paymentType', paymentType);
                window.location.href = `confirm-payment.html?${params.toString()}`;
            } else {
                showToastError('error', 'Booking Failed', bookingResult.message || 'Failed to create booking. Please try again.');
                // Restore button
                confirmButton.disabled = false;
                confirmButton.classList.remove('opacity-70');
                confirmButton.classList.add('group-hover:-translate-x-1');
                confirmText.textContent = originalText; // 👈 restore text
            }
        } catch (error) {
            console.error('Booking API error:', error);
            showToastError('error', 'Booking Failed', 'An error occurred while creating your booking. Please try again.');
            // Restore button
            confirmButton.disabled = false;
            confirmButton.classList.remove('opacity-70');
            confirmButton.classList.add('group-hover:-translate-x-1');
            confirmText.textContent = originalText; // 👈 restore text
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
    
    console.log('🔍 All URL parameters:');
    for (const [key, value] of urlParams.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    // Extract required data
    const propertyId = urlParams.get('propertyId');
    // Prefer name from localStorage; fallback to URL params; finally to 'Guest'
    const firstNameLS = (localStorage.getItem('firstName') || '').trim();
    const lastNameLS = (localStorage.getItem('lastName') || '').trim();
    const nameFromLocalStorage = `${firstNameLS} ${lastNameLS}`.trim();
    const nameFromUrl = (urlParams.get('guestName') || `${urlParams.get('firstName') || ''} ${urlParams.get('lastName') || ''}`).trim();
    const guestName = nameFromLocalStorage || nameFromUrl;
    const guestCount = parseInt(urlParams.get('guestCount')) || 1;
    const packageCapacity = parseInt(urlParams.get('packageCapacity')) || 1;
    const checkInDate = urlParams.get('checkInDate');
    const checkOutDate = urlParams.get('checkOutDate');

    console.log('📊 Extracted values before calculation:');
    console.log(`  guestCount: ${guestCount}`);
    console.log(`  packageCapacity: ${packageCapacity}`);
    console.log(`  additionalPax from URL: ${urlParams.get('additionalPax')}`);

    if (!propertyId || !checkInDate || !checkOutDate) {
        console.error('Missing required booking data:', { propertyId, checkInDate, checkOutDate });
        return null;
    }

    // Generate dates array between check-in and check-out
    const datesOfBooking = generateDateRange(checkInDate, checkOutDate);

    // Calculate additional pax correctly (guests beyond package capacity)
    const additionalPax = Math.max(0, guestCount - packageCapacity);
    
    // Also get additionalPax from URL if provided (this should override calculation)
    const additionalPaxFromURL = urlParams.get('additionalPax');
    const finalAdditionalPax = additionalPaxFromURL !== null ? parseInt(additionalPaxFromURL) : additionalPax;
    
    console.log('🎯 Additional Pax calculation:');
    console.log(`  Calculated additionalPax: ${additionalPax}`);
    console.log(`  AdditionalPax from URL: ${additionalPaxFromURL}`);
    console.log(`  Final additionalPax to use: ${finalAdditionalPax}`);

    // Get additional booking details from URL
    const packageFee = parseFloat(urlParams.get('pricePerDay')) || 0;
    const additionalPaxPrice = parseFloat(urlParams.get('addGuestPrice')) || 0;
    const reservationFee = parseFloat(urlParams.get('reservationFee')) || 0;
    const discount = parseFloat(urlParams.get('discount')) || 0;
    const numOfDays = datesOfBooking.length;

    console.log('Booking data being sent to API:', {
        propertyId,
        guestId: userId,
        guestName: guestName || 'Guest',
        additionalPax: finalAdditionalPax,
        datesOfBooking,
        packageFee,
        additionalPaxPrice,
        reservationFee,
        discount,
        numOfDays,
        guestCount,
        packageCapacity
    });

    return {
        propertyId,
        guestId: userId,
        guestName: guestName || 'Guest',
        additionalPax: finalAdditionalPax,
        datesOfBooking,
        packageFee,
        additionalPaxPrice,
        reservationFee,
        discount,
        numOfDays,
        guestCount,
        packageCapacity
    };
}

// Function to generate date range array (excluding checkout date)
function generateDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // Only include dates up to (but NOT including) the checkout date
    while (currentDate < end) {
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
            
            // Get the booking ID from the response
            const bookingId = result.booking?._id || result.booking?.id || result.id || result._id;
            
            if (bookingId) {
                // Update booking status to "Pending Payment"
                try {
                    console.log('Updating booking status to Pending Payment for booking ID:', bookingId);
                    
                    const statusResponse = await fetch(`https://betcha-api.onrender.com/booking/update-status/${bookingId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            // status: "Pending Payment"
                        })
                    });
                    
                    if (statusResponse.ok) {
                        console.log('Booking status updated to Pending Payment successfully');
                    } else {
                        console.warn('Failed to update booking status, but booking was created');
                    }
                } catch (statusError) {
                    console.warn('Error updating booking status:', statusError);
                    // Don't fail the entire process if status update fails
                }
            }
            
            return {
                success: true,
                bookingId: bookingId,
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
    
    // Calculate days of stay correctly (number of nights)
    if (data.checkInDate && data.checkOutDate) {
        const checkIn = new Date(data.checkInDate);
        const checkOut = new Date(data.checkOutDate);
        data.daysOfStay = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    } else {
        data.daysOfStay = parseInt(urlParams.get('daysOfStay')) || 1;
    }
    
    // Pricing details
    data.pricePerDay = parseFloat(urlParams.get('pricePerDay')) || 0;
    data.addGuestPrice = parseFloat(urlParams.get('addGuestPrice')) || 0;
    data.reservationFee = parseFloat(urlParams.get('reservationFee')) || 0;
    data.packageCapacity = parseInt(urlParams.get('packageCapacity')) || 1;
    data.discount = parseFloat(urlParams.get('discount')) || 0;
    
    // Time details
    data.timeIn = urlParams.get('timeIn') || '';
    data.timeOut = urlParams.get('timeOut') || '';
    
    // Calculate additional guests - prefer additionalPax param if provided, otherwise calculate
    const additionalPaxParam = urlParams.get('additionalPax');
    
    if (additionalPaxParam !== null) {
        data.additionalGuests = parseInt(additionalPaxParam) || 0;
    } else {
        data.additionalGuests = Math.max(0, data.guestCount - data.packageCapacity);
    }
    
    data.totalPriceDay = data.pricePerDay * data.daysOfStay;
    data.totalAddGuest = data.addGuestPrice * data.additionalGuests;
    
    // Calculate subtotal before discount (package + additional guests, NOT including reservation fee)
    data.subtotal = data.totalPriceDay + data.totalAddGuest;
    
    // Apply discount if any
    data.discountAmount = (data.subtotal * data.discount) / 100;
    data.totalAfterDiscount = data.subtotal - data.discountAmount;
    
    // Final total is after discount, and reservation fee is subtracted (not added)
    data.totalPrice = data.totalAfterDiscount - data.reservationFee;
    
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
        
        // Time details
        updateElementText('timein', data.timeIn || 'Time not available');
        updateElementText('timeout', data.timeOut || 'Time not available');
        
        // Price details
        updateElementText('pricePerDay', data.pricePerDay.toLocaleString() || '00');
        updateElementText('daysOfStay', data.daysOfStay || '00');
        updateElementText('totalPriceDay', data.totalPriceDay.toLocaleString() || '00');
        updateElementText('addGuestPrice', data.addGuestPrice.toLocaleString() || '00');
        updateElementText('addGuestCount', data.additionalGuests || '0');
        updateElementText('totalAddGuest', data.totalAddGuest.toLocaleString() || '00');
        updateElementText('reservationFee', data.reservationFee.toLocaleString() || '00');
        
        // Discount details
        const discountAmount = data.discountAmount || 0;
        
        updateElementText('discountPercentage', (data.discount || 0) + '%');
        updateElementText('discount', discountAmount.toLocaleString());
        updateElementText('subtotal', data.subtotal ? data.subtotal.toLocaleString() : '00'); // Subtotal without reservation fee
        
        updateElementText('totalPrice', data.totalPrice.toLocaleString() || '00'); // Final total after discount and reservation fee deduction
        
    } catch (error) {
        console.error('❌ Error populating reservation data:', error);
        console.error('Stack trace:', error.stack);
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
        console.error(`❌ Element with id '${elementId}' not found`);
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
    
    // Calculate additional guests for this booking
    const guestCount = parseInt(bookingData.guestCount) || 1;
    const packageCapacity = parseInt(propertyData.packageCapacity) || 1;
    const additionalPax = Math.max(0, guestCount - packageCapacity);
    
    // Pricing data
    params.append('pricePerDay', propertyData.packagePrice || '0');
    params.append('addGuestPrice', propertyData.additionalPax || '0');
    params.append('reservationFee', propertyData.reservationFee || '0');
    params.append('packageCapacity', propertyData.packageCapacity || '1');
    params.append('discount', propertyData.discount || '0');
    params.append('additionalPax', additionalPax.toString());
    
    // Time data (if available)
    params.append('timeIn', propertyData.timeIn || '');
    params.append('timeOut', propertyData.timeOut || '');
    
    // Navigate to confirm reservation page
    window.location.href = `../auth/confirm-reservation.html?${params.toString()}`;
}

// Export function for use in other scripts
window.navigateToConfirmReservation = navigateToConfirmReservation;

// Function to setup navigation warnings
function setupNavigationWarnings() {
    let isBookingConfirmed = false;
    
    // Mark booking as confirmed when user clicks confirm button
    const confirmButton = document.getElementById('confirm');
    if (confirmButton) {
        confirmButton.addEventListener('click', () => {
            isBookingConfirmed = true;
        });
    }
    
    // Simple approach: Override window.history.back globally
    const originalBack = window.history.back;
    window.history.back = function() {
        if (!isBookingConfirmed) {
            const shouldLeave = confirm('Your booking will be cancelled if you leave this page. Are you sure?');
            if (shouldLeave) {
                originalBack.call(window.history);
            }
        } else {
            originalBack.call(window.history);
        }
    };
    
    // Auto-trigger user interaction to enable beforeunload
    setTimeout(() => {
        document.dispatchEvent(new Event('click'));
    }, 100);
    
    // Browser navigation warning
    window.addEventListener('beforeunload', (e) => {
        if (!isBookingConfirmed) {
            e.preventDefault();
            e.returnValue = 'Your booking will be cancelled if you leave this page.';
            return e.returnValue;
        }
    });
}
