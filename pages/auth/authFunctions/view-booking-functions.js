// View Booking Functions
// This file handles fetching and populating booking data for the view-booking page

// Local toast notification function
function showToast(type, title, message, duration = 5000) {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toastContainer');
    if (!container) {
        const containerHTML = `
            <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
                <!-- Toasts will be inserted here -->
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', containerHTML);
        container = document.getElementById('toastContainer');
    }

    const toastId = 'toast-' + Date.now();

    // Set colors and icons based on type
    let bgColor = '';
    let borderColor = '';
    let iconHTML = '';
    let titleColor = '';

    switch (type) {
        case 'error':
            bgColor = 'bg-red-50';
            borderColor = 'border-red-200';
            titleColor = 'text-red-800';
            iconHTML = `
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
            `;
            break;
        case 'warning':
            bgColor = 'bg-yellow-50';
            borderColor = 'border-yellow-200';
            titleColor = 'text-yellow-800';
            iconHTML = `
                <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
            `;
            break;
        case 'success':
            bgColor = 'bg-green-50';
            borderColor = 'border-green-200';
            titleColor = 'text-green-800';
            iconHTML = `
                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
            break;
        default:
            bgColor = 'bg-neutral-50';
            borderColor = 'border-neutral-200';
            titleColor = 'text-neutral-800';
            iconHTML = `
                <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
    }

    const toastHTML = `
        <div id="${toastId}" class="toast-animation ${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 relative transform transition-all duration-300 ease-in-out translate-x-full opacity-0">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    ${iconHTML}
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium ${titleColor}">
                        ${title}
                    </p>
                    <p class="mt-1 text-sm text-neutral-600">
                        ${message}
                    </p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                    <button onclick="this.closest('.toast-animation').remove()" class="rounded-md inline-flex text-neutral-400 hover:text-neutral-500 focus:outline-none">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHTML);

    // Trigger animation
    const toastElement = document.getElementById(toastId);
    setTimeout(() => {
        toastElement.classList.remove('translate-x-full', 'opacity-0');
        toastElement.classList.add('translate-x-0', 'opacity-100');
    }, 10);

    // Auto-remove after specified duration
    if (duration > 0) {
        setTimeout(() => {
            if (toastElement && toastElement.parentNode) {
                toastElement.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => {
                    toastElement.remove();
                }, 300);
            }
        }, duration);
    }

    return toastId;
}

// Guard to prevent double execution
let isInitialized = false;

document.addEventListener('DOMContentLoaded', function () {
    if (isInitialized) {
        console.log('View Booking page already initialized, skipping...');
        return;
    }

    isInitialized = true;
    console.log('View Booking page loaded');

    // Get booking ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');

    console.log('Booking ID from URL:', bookingId);

    if (!bookingId) {
        console.error('No booking ID found in URL');
        showError('Missing booking ID. Please navigate from a valid booking link.');
        return;
    }

    // Fetch and populate booking data
    fetchAndPopulateBookingData(bookingId);
});

// Function to fetch booking data from API
async function fetchBookingData(bookingId) {
    try {
        console.log('Fetching booking data for ID:', bookingId);

        const response = await fetch(`https://betcha-api.onrender.com/booking/${bookingId}`);
        const result = await response.json();

        console.log('Booking API Response:', result);

        if (response.ok && result.booking) {
            return {
                success: true,
                booking: result.booking
            };
        } else {
            return {
                success: false,
                message: result.message || 'Failed to fetch booking data'
            };
        }
    } catch (error) {
        console.error('Error fetching booking data:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection.'
        };
    }
}

// Function to fetch and populate booking data
async function fetchAndPopulateBookingData(bookingId) {
    try {
        showLoading(true);

        const result = await fetchBookingData(bookingId);

        if (result.success) {
            const booking = result.booking;

            // Populate all booking data (including room name from propertyName)
            populateBookingData(booking);

            console.log('Booking data loaded successfully.');
            console.log('Checking for images in booking data...');
            console.log('booking.photoLinks:', booking.photoLinks);

            // Try to create carousel from booking data first (if it has images)
            let carouselCreated = false;
            if (booking.photoLinks && booking.photoLinks.length > 0) {
                createImageCarousel(booking.photoLinks);
                carouselCreated = true;
                console.log('Carousel created from booking data with', booking.photoLinks.length, 'images');
            } else {
                console.log('No photoLinks found in booking data');
            }

            // Only try to fetch property details if we need more images or address
            // and we have a valid propertyId and haven't created carousel yet
            if (booking.propertyId && !carouselCreated) {
                console.log('Trying to fetch property details since no booking images...');
                await setupImageCarousel(booking.propertyId);
            } else if (booking.propertyId && carouselCreated) {
                // Just try to get the address if carousel already created
                console.log('Fetching only property address since carousel already created...');
                await fetchPropertyAddress(booking.propertyId);
            }

        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error in fetchAndPopulateBookingData:', error);
        showError('Failed to load booking details.');
    } finally {
        showLoading(false);
    }
}

// Function to populate booking data in the UI
function populateBookingData(booking) {
    try {
        // Basic booking information
        populateElement('roomName', booking.propertyName || 'Property Name');
        populateElement('refID', booking.transNo || booking._id);
        // Ensure copy button exists and is wired up
        ensureCopyRefButton();

        // Dates
        if (booking.checkIn && booking.checkOut) {
            const checkInDate = new Date(booking.checkIn);
            const checkOutDate = new Date(booking.checkOut);

            // Add 1 day to checkout date for display
            const checkOutDatePlusOne = new Date(checkOutDate);
            checkOutDatePlusOne.setDate(checkOutDatePlusOne.getDate() + 1);

            populateElement('rsrvDate', formatDate(new Date(booking.createdAt)));
            populateElement('checkInDate', formatDate(checkInDate));
            populateElement('checkOutDate', formatDate(checkOutDatePlusOne));
        }

        // Times
        populateElement('checkInTime', booking.timeIn || 'TBD');
        populateElement('checkOutTime', booking.timeOut || 'TBD');

        // Guest information
        const totalGuests = 1 + (booking.additionalPax || 0);
        populateElement('guestCount', `${totalGuests} Guest${totalGuests > 1 ? 's' : ''}`);

        // Pricing information
        populateElement('pricePerDay', booking.packageFee?.toLocaleString() || '0');
        populateElement('daysOfStay', booking.numOfDays?.toString() || '0');
        populateElement('totalPriceDay', (booking.packageFee * booking.numOfDays)?.toLocaleString() || '0');

        populateElement('addGuestPrice', booking.additionalPaxPrice?.toLocaleString() || '0');
        populateElement('addGuestCount', booking.additionalPax?.toString() || '0');
        populateElement('totalAddGuest', (booking.additionalPaxPrice * booking.additionalPax)?.toLocaleString() || '0');

        populateElement('reservationFee', booking.reservationFee?.toLocaleString() || '0');
        populateElement('totalPrice', booking.totalFee?.toLocaleString() || '0');

        // Payment status and amounts
        calculateAndDisplayPaymentStatus(booking);

        // Payment details
        displayPaymentDetails();

        // Store booking data globally for reschedule functionality
        currentBookingData = booking;

        // Update reschedule helper text with booking duration
        updateRescheduleHelperText();

        // Check reschedule eligibility and manage calendar state
        checkRescheduleEligibility(booking);

        // Set up reschedule functionality if eligible
        setupRescheduleModal();

        console.log('Booking data populated successfully');

    } catch (error) {
        console.error('Error populating booking data:', error);
        showError('Error displaying booking information.');
    }
}

// Create and wire a copy button next to Reference ID
function ensureCopyRefButton() {
    try {
        const refElement = document.getElementById('refID');
        if (!refElement) return;

        let copyBtn = document.getElementById('copyRefBtn');
        if (!copyBtn) {
            copyBtn = document.createElement('button');
            copyBtn.id = 'copyRefBtn';
            copyBtn.type = 'button';
            copyBtn.textContent = 'Copy';
            copyBtn.innerHTML = `
              <svg class="w-5 h-5 fill-primary-text" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.875 1.25C12.2065 1.25 12.5245 1.3817 12.7589 1.61612C12.9933 1.85054 13.125 2.16848 13.125 2.5V10C13.125 10.3315 12.9933 10.6495 12.7589 10.8839C12.5245 11.1183 12.2065 11.25 11.875 11.25H10.625V12.5C10.625 12.8315 10.4933 13.1495 10.2589 13.3839C10.0245 13.6183 9.70652 13.75 9.375 13.75H3.125C2.79348 13.75 2.47554 13.6183 2.24112 13.3839C2.0067 13.1495 1.875 12.8315 1.875 12.5V5C1.875 4.66848 2.0067 4.35054 2.24112 4.11612C2.47554 3.8817 2.79348 3.75 3.125 3.75H4.375V2.5C4.375 2.16848 4.5067 1.85054 4.74112 1.61612C4.97554 1.3817 5.29348 1.25 5.625 1.25H11.875ZM9.375 5H3.125V12.5H9.375V5ZM6.25 9.375C6.41576 9.375 6.57473 9.44085 6.69194 9.55806C6.80915 9.67527 6.875 9.83424 6.875 10C6.875 10.1658 6.80915 10.3247 6.69194 10.4419C6.57473 10.5592 6.41576 10.625 6.25 10.625H5C4.83424 10.625 4.67527 10.5592 4.55806 10.4419C4.44085 10.3247 4.375 10.1658 4.375 10C4.375 9.83424 4.44085 9.67527 4.55806 9.55806C4.67527 9.44085 4.83424 9.375 5 9.375H6.25ZM11.875 2.5H5.625V3.75H9.375C9.70652 3.75 10.0245 3.8817 10.2589 4.11612C10.4933 4.35054 10.625 4.66848 10.625 5V10H11.875V2.5ZM7.5 6.875C7.6593 6.87518 7.81252 6.93617 7.92836 7.04553C8.04419 7.15489 8.1139 7.30435 8.12323 7.46337C8.13257 7.6224 8.08083 7.77899 7.97858 7.90115C7.87634 8.0233 7.73131 8.10181 7.57312 8.12063L7.5 8.125H5C4.8407 8.12482 4.68748 8.06383 4.57164 7.95447C4.45581 7.84511 4.3861 7.69565 4.37677 7.53663C4.36743 7.3776 4.41917 7.22101 4.52142 7.09885C4.62366 6.9767 4.76869 6.89819 4.92687 6.87937L5 6.875H7.5Z"/>
              </svg>
            `;
            refElement.insertAdjacentElement('afterend', copyBtn);
        }
        // Always apply current sizing/styles (also updates existing buttons)
        copyBtn.className = '!px-2 !py-0.5 ml-2 rounded-full hover:bg-neutral-200 active:scale-95 transition';

        // Attach/refresh handler
        copyBtn.onclick = async () => {
            const text = refElement.textContent?.trim();
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                showToast('success', 'Copied', 'Reference ID copied to clipboard.', 1500);
            } catch (e) {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                showToast('success', 'Copied', 'Reference ID copied to clipboard.', 1500);
            }
        };
    } catch (error) {
        console.error('Error setting up copy button:', error);
    }
}

// Function to calculate and display payment status
function calculateAndDisplayPaymentStatus(booking) {
    try {
        let amountPaid = 0;
        let pendingPayments = [];
        let remainingBalance = booking.totalFee || 0;
        let unpaidReservation = false;
        let unpaidPackage = false;

        // Check reservation payment status
        if (booking.reservation) {
            if (booking.reservation.status === 'Completed') {
                amountPaid += booking.reservationFee || 0;
            } else if (booking.reservation.status === 'Pending' &&
                booking.reservation.modeOfPayment &&
                booking.reservation.modeOfPayment !== 'Pending') {
                amountPaid += booking.reservationFee || 0;
                pendingPayments.push('Reservation');
            } else if (booking.reservation.modeOfPayment === 'Pending' ||
                booking.reservation.modeOfPayment === 'on' ||
                !booking.reservation.modeOfPayment) {
                unpaidReservation = true;
            }
        }

        // Check package payment status
        if (booking.package) {
            const packageAmount = (booking.totalFee || 0) - (booking.reservationFee || 0);
            if (booking.package.status === 'Completed') {
                amountPaid += packageAmount;
            } else if (booking.package.status === 'Pending' &&
                booking.package.modeOfPayment &&
                booking.package.modeOfPayment !== 'Pending') {
                amountPaid += packageAmount;
                pendingPayments.push('Package');
            } else if (booking.package.modeOfPayment === 'Pending' ||
                !booking.package.modeOfPayment) {
                unpaidPackage = true;
            }
        }

        remainingBalance = (booking.totalFee || 0) - amountPaid;

        // Format amount paid display (badge now indicates status)
        let amountPaidText = amountPaid.toLocaleString();

        // Update the amount paid element
        const amountPaidElement = document.getElementById('amountPaid');
        if (amountPaidElement) {
            amountPaidElement.textContent = amountPaidText;
        }

        populateElement('remainingBal', Math.max(0, remainingBalance).toLocaleString());

        // Handle payment button visibility and functionality
        handlePaymentButton(booking, remainingBalance, unpaidReservation, unpaidPackage);

        // Update simple status badge beside Transaction summary
        let status = 'Completed';
        if (pendingPayments.length > 0) status = 'Pending';
        else if (remainingBalance > 0 && (unpaidReservation || unpaidPackage)) status = 'Unpaid';
        updateTransactionSummaryStatus(status);

    } catch (error) {
        console.error('Error calculating payment status:', error);
        populateElement('amountPaid', '0');
        populateElement('remainingBal', booking.totalFee?.toLocaleString() || '0');
    }
}

// Create or update a small status badge near the Transaction summary title
function updateTransactionSummaryStatus(status) {
    try {
        // Find heading paragraph containing 'Transaction summary'
        let heading = Array.from(document.querySelectorAll('p'))
            .find(p => p.textContent && p.textContent.trim().startsWith('Transaction summary'));
        if (!heading) return;

        // Ensure badge exists
        let badge = document.getElementById('txnStatus');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'txnStatus';
            badge.className = 'hidden text-xs px-2 py-0.5 rounded-full border ml-auto';
            // Make heading a flex container for spacing, non-destructive
            heading.classList.add('flex', 'items-center', 'gap-2');
            heading.appendChild(badge);
        }

        // Reset styles
        badge.classList.remove('hidden', 'bg-yellow-50', 'text-yellow-700', 'border-yellow-300',
            'bg-green-50', 'text-green-700', 'border-green-300',
            'bg-red-50', 'text-red-700', 'border-red-300');

        if (status === 'Pending') {
            badge.classList.add('bg-yellow-50', 'text-yellow-700', 'border-yellow-300');
        } else if (status === 'Completed') {
            badge.classList.add('bg-green-50', 'text-green-700', 'border-green-300');
        } else {
            badge.classList.add('bg-red-50', 'text-red-700', 'border-red-300');
        }

        badge.textContent = status;
    } catch (e) {
        console.error('Error updating Transaction summary status:', e);
    }
}

// Function to handle payment button visibility and functionality
function handlePaymentButton(booking, remainingBalance, unpaidReservation, unpaidPackage) {
    const paymentButton = document.getElementById('paymentButton');
    if (!paymentButton) return;

    // Show button only if there's remaining balance AND unpaid items
    if (remainingBalance > 0 && (unpaidReservation || unpaidPackage)) {
        paymentButton.style.display = 'flex';

        // Determine payment type and update button text
        let paymentType = '';
        let buttonText = 'Pay balance';

        if (unpaidReservation) {
            paymentType = 'Reservation';
            buttonText = 'Pay Reservation';
        } else if (unpaidPackage) {
            paymentType = 'Package';
            buttonText = 'Pay Package';
        }

        // Update button text
        const buttonSpan = paymentButton.querySelector('span');
        if (buttonSpan) {
            buttonSpan.textContent = buttonText;
        }

        // Update onclick to pass correct parameters
        paymentButton.onclick = () => {
            window.location.href = `../auth/confirm-payment.html?paymentType=${paymentType}&bookingId=${booking._id}`;
        };

        console.log('Payment button configured:', { paymentType, buttonText, bookingId: booking._id });

    } else {
        // Hide button when no payment needed
        paymentButton.style.display = 'none';
        console.log('Payment button hidden - no payment needed');
    }
}

// Function to display payment details
function displayPaymentDetails() {
    // You can add logic here to display payment method details, 
    // payment numbers, etc. based on the booking data
}

// Function to fetch only property address
async function fetchPropertyAddress(propertyId) {
    try {
        if (!propertyId) return;

        const apiUrl = `https://betcha-api.onrender.com/property/display/${propertyId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) return;

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return;

        const result = await response.json();

        if (result && result.address) {
            populateElement('roomAddress', result.address);
        }

    } catch (error) {
        console.error('Error fetching property address:', error);
    }
}

// Function to setup image carousel (only for images and address)
async function setupImageCarousel(propertyId) {
    try {
        if (!propertyId) {
            console.warn('No property ID provided');
            return;
        }

        const apiUrl = `https://betcha-api.onrender.com/property/display/${propertyId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Property with ID ${propertyId} not found`);
            }
            return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Property API did not return JSON');
            return;
        }

        const result = await response.json();

        if (result) {
            // The property data is directly in the result, not nested in result.property
            if (result.address) {
                populateElement('roomAddress', result.address);
            }

            if (result.photoLinks && result.photoLinks.length > 0) {
                createImageCarousel(result.photoLinks);
                console.log('Carousel created from property API with', result.photoLinks.length, 'images');
            }
        }

    } catch (error) {
        console.error('Error fetching property details:', error);
    }
}

// Function to create image carousel
function createImageCarousel(images) {
    try {
        if (!images || images.length === 0) {
            console.warn('No images to display in carousel');
            return;
        }

        // Find the image container
        const imageContainer = document.querySelector('.w-full.h-\\[200px\\].rounded-3xl.overflow-hidden.group');
        if (!imageContainer) {
            console.error('Image container not found');
            return;
        }

        // Create carousel HTML
        const carouselHTML = `
            <div class="relative w-full h-full overflow-hidden">
                <div id="imageCarousel" class="w-full h-full overflow-hidden">
                    <div class="flex h-full transition-transform duration-500 ease-in-out carousel-track">
                        ${images.map((image, index) => `
                            <div class="w-full h-full flex-shrink-0 overflow-hidden">
                                <img src="${image}" class="carousel-image w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Circular Navigation Dots -->
                <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    ${images.map((_, index) => `
                        <div class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
                    `).join('')}
                </div>
            </div>
        `;

        // Replace the existing image div
        imageContainer.innerHTML = carouselHTML;

        // Setup carousel functionality
        setupCarouselControls(images.length);

        // Start auto-rotation
        startAutoCarousel(images.length);

    } catch (error) {
        console.error('Error creating image carousel:', error);
    }
}

// Function to setup carousel controls
function setupCarouselControls(imageCount) {
    try {
        const track = document.querySelector('.carousel-track');
        const dots = document.querySelectorAll('.dot');

        function updateDots(activeIndex) {
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[activeIndex]) {
                dots[activeIndex].classList.add('active');
            }
        }

        function goToSlide(index) {
            track.style.transform = `translateX(-${index * 100}%)`;
            updateDots(index);
            window.carouselCurrentIndex = index;
        }

        // Dot click handlers
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
                resetAutoCarousel(imageCount);
            });
        });

        // Store the goToSlide function globally so auto carousel can use it
        window.carouselGoToSlide = goToSlide;
        window.carouselCurrentIndex = 0;

    } catch (error) {
        console.error('Error setting up carousel controls:', error);
    }
}

// Function to show specific slide
function showSlide(index) {
    if (window.carouselGoToSlide) {
        window.carouselGoToSlide(index);
        window.carouselCurrentIndex = index;
    }
}

// Function to get current slide index
function getCurrentSlideIndex() {
    return window.carouselCurrentIndex || 0;
}

// Function to start auto carousel
function startAutoCarousel(imageCount) {
    if (imageCount <= 1) return;

    window.carouselInterval = setInterval(() => {
        const currentSlide = getCurrentSlideIndex();
        const nextSlide = (currentSlide + 1) % imageCount;
        showSlide(nextSlide);
    }, 4000); // Change slide every 4 seconds
}

// Function to reset auto carousel
function resetAutoCarousel(imageCount) {
    if (window.carouselInterval) {
        clearInterval(window.carouselInterval);
    }
    startAutoCarousel(imageCount);
}

// Utility function to populate an element safely
function populateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`Element with ID '${elementId}' not found`);
    }
}

// Utility function to format date
function formatDate(date) {
    try {
        // Handle both Date objects and date strings
        let dateObj;
        if (typeof date === 'string') {
            // Add time to avoid timezone issues
            dateObj = new Date(date + 'T12:00:00');
        } else {
            dateObj = date;
        }

        // Format as YYYY/MM/DD
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');

        return `${year}/${month}/${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

// Utility function to show loading state
function showLoading(show) {
    if (show) {
        // Create skeleton loading overlay
        const skeletonHTML = `
            <div id="skeletonLoader" class="fixed inset-0 bg-background z-50 flex flex-col">
                <!-- Header Skeleton -->
                <div class="w-full bg-white shadow-sm p-4">
                    <div class="flex items-center justify-between max-w-6xl mx-auto">
                        <div class="h-8 w-24 bg-neutral-200 rounded animate-pulse"></div>
                        <div class="h-8 w-8 bg-neutral-200 rounded-full animate-pulse"></div>
                    </div>
                </div>
                
                <!-- Main Content Skeleton -->
                <div class="flex-1 p-4 max-w-6xl mx-auto w-full">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Left Side - Image and Details -->
                        <div class="space-y-4">
                            <!-- Image Skeleton -->
                            <div class="w-full h-[200px] bg-neutral-200 rounded-3xl animate-pulse"></div>
                            
                            <!-- Room Info Skeleton -->
                            <div class="space-y-3">
                                <div class="h-6 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="h-4 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="h-4 w-2/3 bg-neutral-200 rounded animate-pulse"></div>
                            </div>
                            
                            <!-- Booking Details Skeleton -->
                            <div class="space-y-2">
                                <div class="h-5 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                                    <div class="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                                    <div class="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                                    <div class="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right Side - Payment Info -->
                        <div class="space-y-4">
                            <!-- Payment Summary Skeleton -->
                            <div class="bg-white rounded-2xl p-4 space-y-3">
                                <div class="h-5 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="border-t pt-2">
                                    <div class="flex justify-between">
                                        <div class="h-5 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-5 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Payment Status Skeleton -->
                            <div class="bg-white rounded-2xl p-4 space-y-3">
                                <div class="h-5 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add skeleton to body
        document.body.insertAdjacentHTML('beforeend', skeletonHTML);
        console.log('Loading...');
    } else {
        // Remove skeleton after minimum display time
        setTimeout(() => {
            const skeleton = document.getElementById('skeletonLoader');
            if (skeleton) {
                skeleton.remove();
            }
            console.log('Loading complete');
        }, 500); // 0.5 seconds minimum display time
    }
}

function showError(message) {
    console.error('Error:', message);
    showToast('error', 'Error', message);
}

// Function to setup reschedule modal functionality
function setupRescheduleModal() {
    try {
        console.log('Setting up reschedule modal...');

        // Set up modal open event listener
        const rescheduleButton = document.querySelector('[data-modal-target="reschedModal"]');
        if (rescheduleButton && !rescheduleButton.disabled) {
            rescheduleButton.addEventListener('click', function () {
                // Initialize calendar when modal opens
                setTimeout(() => {
                    initializeRescheduleCalendar();
                }, 100);
            });
        }

        // Set up reschedule button in modal
        const modalRescheduleBtn = document.getElementById('rescheduleSubmitBtn');
        if (modalRescheduleBtn) {
            // Remove any existing event listeners
            const newBtn = modalRescheduleBtn.cloneNode(true);
            modalRescheduleBtn.parentNode.replaceChild(newBtn, modalRescheduleBtn);

            // Add new event listener
            newBtn.addEventListener('click', function (e) {
                e.preventDefault();
                handleReschedule();
            });
        }

        console.log('Reschedule modal setup complete');
    } catch (error) {
        console.error('Error setting up reschedule modal:', error);
    }
}

// ==========================================
// STANDALONE RESCHEDULE CALENDAR IMPLEMENTATION
// This is completely independent from calendar.js/calendar2.js
// ==========================================

// Calendar state variables
let rescheduleCalendarCurrentDate = new Date();
let rescheduleSelectedStartDate = null;
let rescheduleSelectedEndDate = null;
let currentBookingData = null;

// Function to calculate booking duration
function calculateBookingDuration() {
    if (!currentBookingData || !currentBookingData.numOfDays) {
        console.warn('No booking data or daysOfStay available for duration calculation');
        return 7; // Default fallback
    }

    const duration = parseInt(currentBookingData.numOfDays, 10);

    console.log('Current booking duration from daysOfStay:', duration, 'days');
    return duration;
}

// Function to update reschedule helper text with booking duration
function updateRescheduleHelperText() {
    const helperText = document.getElementById('rescheduleHelperText');
    if (helperText) {
        const duration = calculateBookingDuration();
        helperText.textContent = `💡 Select check-in and check-out dates to reschedule your booking (${duration} days max)`;
    }
}

// Function to initialize reschedule calendar
function initializeRescheduleCalendar() {
    try {
        console.log('Initializing standalone reschedule calendar...');

        const calendarInstance = document.querySelector('#reschedModal .calendar-instance');
        if (!calendarInstance) {
            console.error('Reschedule calendar instance not found');
            return;
        }

        const leftCalendar = calendarInstance.querySelector('.leftCalendar');
        const rightCalendar = calendarInstance.querySelector('.rightCalendar');
        const leftLabel = calendarInstance.querySelector('.leftMonthLabel');
        const rightLabel = calendarInstance.querySelector('.rightMonthLabel');
        const prevBtn = calendarInstance.querySelector('.prevMonth');
        const nextBtn = calendarInstance.querySelector('.nextMonth');

        if (!leftCalendar || !rightCalendar) {
            console.error('Calendar containers not found');
            return;
        }

        // Reset selection state
        rescheduleSelectedStartDate = null;
        rescheduleSelectedEndDate = null;

        function updateRescheduleCalendars() {
            // Left calendar (current month)
            const leftMonth = new Date(rescheduleCalendarCurrentDate);
            buildRescheduleCalendar(leftCalendar, leftMonth, leftLabel);

            // Right calendar (next month) 
            const rightMonth = new Date(rescheduleCalendarCurrentDate);
            rightMonth.setMonth(rightMonth.getMonth() + 1);
            buildRescheduleCalendar(rightCalendar, rightMonth, rightLabel);
        }

        // Navigation event listeners
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                rescheduleCalendarCurrentDate.setMonth(rescheduleCalendarCurrentDate.getMonth() - 1);
                updateRescheduleCalendars();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                rescheduleCalendarCurrentDate.setMonth(rescheduleCalendarCurrentDate.getMonth() + 1);
                updateRescheduleCalendars();
            });
        }

        // Initial render
        updateRescheduleCalendars();
        updateRescheduleSelectedDateDisplay();

    } catch (error) {
        console.error('Error initializing reschedule calendar:', error);
    }
}

function buildRescheduleCalendar(container, date, labelEl) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Update month label
    labelEl.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Create calendar HTML - matching calendar.js exactly
    let html = `
      <div class="grid grid-cols-7 gap-1 text-center font-manrope font-semibold border-b border-neutral-300 pb-1 mb-2">
        <div class="w-full aspect-square flex items-center justify-center text-xs">S</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">M</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">T</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">W</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">T</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">F</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">S</div>
      </div>
      <div class="grid grid-cols-7 gap-1 text-center">
    `;

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
        html += '<div></div>';
    }

    // Add days
    for (let day = 1; day <= totalDays; day++) {
        // Create date string directly to avoid timezone issues
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentDateObj = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
        const isDisabled = currentDateObj < new Date().setHours(0, 0, 0, 0);

        console.log(`Day ${day} -> dateStr: ${dateStr}, currentDateObj: ${currentDateObj.toISOString()}`);

        const isSelected = (rescheduleSelectedStartDate && dateStr === rescheduleSelectedStartDate) ||
            (rescheduleSelectedEndDate && dateStr === rescheduleSelectedEndDate);
        const isInRange = rescheduleSelectedStartDate && rescheduleSelectedEndDate &&
            dateStr > rescheduleSelectedStartDate && dateStr < rescheduleSelectedEndDate;

        // Calculate if this date would exceed the current booking duration limit
        let isOverLimit = false;
        if (rescheduleSelectedStartDate && !rescheduleSelectedEndDate) {
            const startDate = new Date(rescheduleSelectedStartDate + 'T12:00:00');
            const daysDiff = Math.abs((currentDateObj - startDate) / (1000 * 60 * 60 * 24));
            const maxDays = calculateBookingDuration();
            isOverLimit = daysDiff > maxDays;
        }

        let classes = 'w-full aspect-square text-xs flex items-center justify-center rounded cursor-pointer transition ';

        if (isDisabled) {
            classes += 'bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-50';
        } else if (isSelected) {
            classes += 'bg-primary text-white font-bold';
        } else if (isInRange) {
            classes += 'bg-primary text-white font-bold';
        } else if (isOverLimit) {
            classes += 'bg-neutral-200 text-neutral-600 cursor-not-allowed opacity-50';
        } else {
            classes += 'bg-background text-black hover:bg-secondary';
        }

        const tooltipText = isOverLimit ? `Exceeds booking duration of ${calculateBookingDuration()} days` : '';
        html += `<div class="${classes}" data-reschedule-date="${dateStr}" ${isDisabled || isOverLimit ? 'style="pointer-events: none;"' : ''} ${tooltipText ? `title="${tooltipText}"` : ''}>${day}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    // Add click handlers to date buttons
    container.querySelectorAll('div[data-reschedule-date]').forEach(dateEl => {
        if (!dateEl.style.pointerEvents) {
            dateEl.addEventListener('click', () => handleRescheduleDateClick({ target: dateEl }));
        }
    });
}

function handleRescheduleDateClick(event) {
    const dateStr = event.target.dataset.rescheduleDate;

    // If clicking on the same start date when no end date selected, clear selection
    if (rescheduleSelectedStartDate === dateStr && !rescheduleSelectedEndDate) {
        rescheduleSelectedStartDate = null;
        rescheduleSelectedEndDate = null;
        updateRescheduleSelectedDateDisplay();
        refreshRescheduleCalendars();
        return;
    }

    // If clicking on the same end date, clear just the end date
    if (rescheduleSelectedEndDate === dateStr) {
        rescheduleSelectedEndDate = null;
        updateRescheduleSelectedDateDisplay();
        refreshRescheduleCalendars();
        return;
    }

    if (!rescheduleSelectedStartDate || (rescheduleSelectedStartDate && rescheduleSelectedEndDate)) {
        // Start new selection (clear any existing selection)
        rescheduleSelectedStartDate = dateStr;
        rescheduleSelectedEndDate = null;
        updateRescheduleSelectedDateDisplay();
    } else if (dateStr < rescheduleSelectedStartDate) {
        // If clicked date is before start date, make it the new start date
        rescheduleSelectedStartDate = dateStr;
        rescheduleSelectedEndDate = null;
        updateRescheduleSelectedDateDisplay();
    } else {
        // Complete the selection (clicked date is after start date)
        const startDate = new Date(rescheduleSelectedStartDate + 'T12:00:00');
        const endDate = new Date(dateStr + 'T12:00:00');
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const maxDays = calculateBookingDuration();

        // Check if the selection exceeds the current booking duration
        if (daysDiff > maxDays) {
            showToast('warning', 'Selection Limit', `You can only reschedule for ${maxDays} days (same as your current booking). Please select a shorter range.`);
            return;
        }

        // Minimum stay validation (at least 1 night)
        if (daysDiff < 1) {
            showToast('warning', 'Invalid Selection', 'Check-out date must be after check-in date.');
            return;
        }

        rescheduleSelectedEndDate = dateStr;
        updateRescheduleSelectedDateDisplay();
    }

    // Log current selection state
    console.log('Reschedule Date Selection:', {
        start: rescheduleSelectedStartDate,
        end: rescheduleSelectedEndDate,
        days: rescheduleSelectedStartDate && rescheduleSelectedEndDate ?
            Math.ceil((new Date(rescheduleSelectedEndDate + 'T12:00:00') - new Date(rescheduleSelectedStartDate + 'T12:00:00')) / (1000 * 60 * 60 * 24)) + 1 : 0
    });

    refreshRescheduleCalendars();
}

function refreshRescheduleCalendars() {
    const calendarInstance = document.querySelector('#reschedModal .calendar-instance');
    if (!calendarInstance) return;

    const leftCalendar = calendarInstance.querySelector('.leftCalendar');
    const rightCalendar = calendarInstance.querySelector('.rightCalendar');
    const leftLabel = calendarInstance.querySelector('.leftMonthLabel');
    const rightLabel = calendarInstance.querySelector('.rightMonthLabel');

    if (leftCalendar && rightCalendar) {
        // Left calendar (current month)
        const leftMonth = new Date(rescheduleCalendarCurrentDate);
        buildRescheduleCalendar(leftCalendar, leftMonth, leftLabel);

        // Right calendar (next month) 
        const rightMonth = new Date(rescheduleCalendarCurrentDate);
        rightMonth.setMonth(rightMonth.getMonth() + 1);
        buildRescheduleCalendar(rightCalendar, rightMonth, rightLabel);
    }
}

function updateRescheduleSelectedDateDisplay() {
    const selectedStaticDate = document.getElementById('selectedStaticDate');
    const clearBtn = document.getElementById('clearSelectionBtn');

    if (selectedStaticDate) {
        if (rescheduleSelectedStartDate && rescheduleSelectedEndDate) {
            const startDate = new Date(rescheduleSelectedStartDate);
            const endDate = new Date(rescheduleSelectedEndDate);
            selectedStaticDate.textContent = `${formatDate(startDate)} to ${formatDate(endDate)}`;
            if (clearBtn) clearBtn.classList.remove('hidden');
        } else if (rescheduleSelectedStartDate) {
            const startDate = new Date(rescheduleSelectedStartDate);
            selectedStaticDate.textContent = `Check-in: ${formatDate(startDate)}`;
            if (clearBtn) clearBtn.classList.remove('hidden');
        } else {
            selectedStaticDate.textContent = 'None';
            if (clearBtn) clearBtn.classList.add('hidden');
        }
    }
}

// Clear selection function
function clearRescheduleSelection() {
    rescheduleSelectedStartDate = null;
    rescheduleSelectedEndDate = null;
    updateRescheduleSelectedDateDisplay();
    refreshRescheduleCalendars();
}

// Make clear function globally accessible
window.clearRescheduleSelection = clearRescheduleSelection;

// Function to handle reschedule API call
async function handleReschedule() {
    try {
        console.log('Handling reschedule...');

        // Validate that dates are selected
        if (!rescheduleSelectedStartDate || !rescheduleSelectedEndDate) {
            showToast('warning', 'Select Dates', 'Please select both check-in and check-out dates for reschedule.');
            return;
        }

        // Validate that we have booking data
        if (!currentBookingData || !currentBookingData._id) {
            showToast('error', 'Error', 'Booking information not available. Please refresh the page.');
            return;
        }

        // Generate array of dates from start to end
        const newBookingDates = generateDateRange(rescheduleSelectedStartDate, rescheduleSelectedEndDate);

        console.log('Reschedule submit data:', {
            selectedStartDate: rescheduleSelectedStartDate,
            selectedEndDate: rescheduleSelectedEndDate,
            bookingId: currentBookingData._id,
            newBookingDates: newBookingDates
        });

        // Show loading state
        const rescheduleBtn = document.getElementById('rescheduleSubmitBtn');
        rescheduleBtn.disabled = true;
        rescheduleBtn.querySelector('span').textContent = 'Rescheduling...';

        // Make API call
        const response = await fetch(`https://betcha-api.onrender.com/booking/update-dates/${currentBookingData._id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                newBookingDates: newBookingDates
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Success
            showToast('success', 'Reschedule Successful', 'Your booking has been rescheduled successfully.');

            // Close modal
            const closeBtn = document.querySelector('#reschedModal [data-close-modal]');
            if (closeBtn) closeBtn.click();

            // Refresh booking data
            const urlParams = new URLSearchParams(window.location.search);
            const bookingId = urlParams.get('bookingId');
            if (bookingId) {
                setTimeout(() => {
                    fetchAndPopulateBookingData(bookingId);
                }, 1000);
            }

        } else {
            // Error
            showToast('error', 'Reschedule Failed', result.message || 'Failed to reschedule booking. Please try again.');
        }

    } catch (error) {
        console.error('Error during reschedule:', error);
        showToast('error', 'Network Error', 'Failed to connect to server. Please check your connection and try again.');
    } finally {
        // Reset button state
        const rescheduleBtn = document.getElementById('rescheduleSubmitBtn');
        if (rescheduleBtn) {
            rescheduleBtn.disabled = false;
            rescheduleBtn.querySelector('span').textContent = 'Reschedule';
        }
    }
}

// Helper function to generate date range array
function generateDateRange(startDate, endDate) {
    console.log('generateDateRange called with:', { startDate, endDate });
    const dates = [];

    // Create dates at noon to avoid timezone issues
    const currentDate = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');

    console.log('Date objects created:', {
        currentDate: currentDate.toISOString(),
        end: end.toISOString()
    });

    // Include both start and end dates
    while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dates.push(dateStr);
        console.log('Added date:', dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Generated date range:', dates);
    return dates;
}

// Function to check reschedule eligibility and manage calendar state
function checkRescheduleEligibility(booking) {
    try {
        const currentDate = new Date();
        const createdDate = new Date(booking.createdAt);
        const checkInDate = new Date(booking.checkIn);

        // Calculate days difference for both dates
        const daysSinceCreated = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
        const daysSinceCheckIn = Math.floor((currentDate - checkInDate) / (1000 * 60 * 60 * 24));

        console.log('Reschedule eligibility check:', {
            createdDate: createdDate,
            checkInDate: checkInDate,
            currentDate: currentDate,
            daysSinceCreated: daysSinceCreated,
            daysSinceCheckIn: daysSinceCheckIn
        });

        // Check if either the booking was created more than 5 days ago OR the check-in date is more than 5 days old
        const isEligible = daysSinceCreated <= 5 && daysSinceCheckIn <= 5;

        // Get reschedule button
        const rescheduleButton = document.querySelector('[data-modal-target="reschedModal"]');

        if (isEligible) {
            console.log('Booking is eligible for reschedule');
            if (rescheduleButton) {
                // Reset button to enabled state
                rescheduleButton.disabled = false;
                rescheduleButton.classList.remove('cursor-not-allowed', 'bg-neutral-200', 'border-neutral-300');
                rescheduleButton.classList.add('hover:bg-primary/10', 'hover:border-primary', 'active:bg-primary/10', 'active:border-primary');

                // Restore original button text and styling
                const buttonText = rescheduleButton.querySelector('span');
                if (buttonText) {
                    buttonText.textContent = 'Reschedule';
                    buttonText.classList.remove('text-neutral-500');
                    buttonText.classList.add('group-hover:text-primary', 'group-active:text-primary');
                }

                // Restore modal target attribute
                rescheduleButton.setAttribute('data-modal-target', 'reschedModal');
            }
            enableCalendarInputs();
        } else {
            console.log('Booking is NOT eligible for reschedule - too old');
            if (rescheduleButton) {
                // Don't set disabled=true as it prevents click events
                // Instead, style it to look disabled but keep it clickable
                rescheduleButton.classList.add('cursor-not-allowed', 'bg-neutral-200', 'border-neutral-300');
                rescheduleButton.classList.remove('hover:bg-primary/10', 'hover:border-primary', 'active:bg-primary/10', 'active:border-primary');

                // Update button text to indicate why it's disabled
                const buttonText = rescheduleButton.querySelector('span');
                if (buttonText) {
                    buttonText.textContent = 'Reschedule Unavailable';
                    buttonText.classList.add('text-neutral-500');
                    buttonText.classList.remove('group-hover:text-primary', 'group-active:text-primary');
                }

                // Remove modal target attribute to prevent modal from opening
                rescheduleButton.removeAttribute('data-modal-target');

                // Add click handler to show toast instead of opening modal
                rescheduleButton.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Reschedule button clicked - showing toast');

                    // Show toast notification
                    showToast('warning', 'Reschedule Unavailable', 'This booking is more than 5 days old and cannot be rescheduled.');
                });
            }
            disableCalendarInputs();
        }

        return isEligible;

    } catch (error) {
        console.error('Error checking reschedule eligibility:', error);
        return false;
    }
}

// Function to disable calendar inputs and interactions
function disableCalendarInputs() {
    try {
        // Wait for DOM to be fully loaded before manipulating calendar
        setTimeout(() => {
            const calendarInstances = document.querySelectorAll('.calendar-instance');

            calendarInstances.forEach(instance => {
                // Disable calendar container
                instance.style.pointerEvents = 'none';
                instance.style.opacity = '0.5';

                // Add disabled state styling
                instance.classList.add('calendar-disabled');

                // Disable all buttons within the calendar
                const buttons = instance.querySelectorAll('button');
                buttons.forEach(button => {
                    button.disabled = true;
                    button.style.cursor = 'not-allowed';
                });

                // Disable calendar cells if they exist
                const calendarCells = instance.querySelectorAll('.calendar-day, .day, [data-day]');
                calendarCells.forEach(cell => {
                    cell.style.pointerEvents = 'none';
                    cell.style.cursor = 'not-allowed';
                    cell.onclick = null; // Remove any existing click handlers
                });
            });

            // Show message in the reschedule modal if it exists
            const reschedModal = document.getElementById('reschedModal');
            if (reschedModal) {
                const messageElement = reschedModal.querySelector('.text-muted');
                if (messageElement) {
                    messageElement.textContent = 'This booking is more than 5 days old and cannot be rescheduled.';
                    messageElement.classList.add('text-red-500');
                }
            }

            console.log('Calendar inputs disabled due to booking age');
        }, 100);

    } catch (error) {
        console.error('Error disabling calendar inputs:', error);
    }
}

// Function to enable calendar inputs and interactions
function enableCalendarInputs() {
    try {
        // Wait for DOM to be fully loaded before manipulating calendar
        setTimeout(() => {
            const calendarInstances = document.querySelectorAll('.calendar-instance');

            calendarInstances.forEach(instance => {
                // Enable calendar container
                instance.style.pointerEvents = 'auto';
                instance.style.opacity = '1';

                // Remove disabled state styling
                instance.classList.remove('calendar-disabled');

                // Enable all buttons within the calendar
                const buttons = instance.querySelectorAll('button');
                buttons.forEach(button => {
                    button.disabled = false;
                    button.style.cursor = 'pointer';
                });

                // Enable calendar cells if they exist
                const calendarCells = instance.querySelectorAll('.calendar-day, .day, [data-day]');
                calendarCells.forEach(cell => {
                    cell.style.pointerEvents = 'auto';
                    cell.style.cursor = 'pointer';
                });
            });

            // Reset message in the reschedule modal if it exists
            const reschedModal = document.getElementById('reschedModal');
            if (reschedModal) {
                const messageElement = reschedModal.querySelector('.text-muted');
                if (messageElement) {
                    messageElement.textContent = 'The Reschedule Feature is only available for bookings made within the last 5 days.';
                    messageElement.classList.remove('text-red-500');
                }
            }

            console.log('Calendar inputs enabled');
        }, 100);

    } catch (error) {
        console.error('Error enabling calendar inputs:', error);
    }
}
