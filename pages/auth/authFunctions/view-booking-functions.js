// View Booking Functions
// This file handles fetching and populating booking data for the view-booking page

// Guard to prevent double execution
let isInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
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
        
        // Dates
        if (booking.checkIn && booking.checkOut) {
            const checkInDate = new Date(booking.checkIn);
            const checkOutDate = new Date(booking.checkOut);
            
            populateElement('rsrvDate', formatDate(new Date(booking.createdAt)));
            populateElement('checkInDate', formatDate(checkInDate));
            populateElement('checkOutDate', formatDate(checkOutDate));
        }
        
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
        
        console.log('Booking data populated successfully');
        
    } catch (error) {
        console.error('Error populating booking data:', error);
        showError('Error displaying booking information.');
    }
}

// Function to calculate and display payment status
function calculateAndDisplayPaymentStatus(booking) {
    try {
        let amountPaid = 0;
        let pendingPayments = [];
        let remainingBalance = booking.totalFee || 0;
        
        // Check reservation payment status
        if (booking.reservation) {
            if (booking.reservation.status === 'Completed') {
                amountPaid += booking.reservationFee || 0;
            } else if (booking.reservation.status === 'Pending' && 
                       booking.reservation.modeOfPayment && 
                       booking.reservation.modeOfPayment !== 'Pending') {
                amountPaid += booking.reservationFee || 0;
                pendingPayments.push('Reservation');
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
            }
        }
        
        remainingBalance = (booking.totalFee || 0) - amountPaid;
        
        // Format amount paid display with pending indicator
        let amountPaidText = amountPaid.toLocaleString();
        if (pendingPayments.length > 0) {
            amountPaidText += ` (Pending)`;
        }
        
        // Update the amount paid element
        const amountPaidElement = document.getElementById('amountPaid');
        if (amountPaidElement) {
            amountPaidElement.textContent = amountPaidText;
        }
        
        populateElement('remainingBal', Math.max(0, remainingBalance).toLocaleString());
        
    } catch (error) {
        console.error('Error calculating payment status:', error);
        populateElement('amountPaid', '0');
        populateElement('remainingBal', booking.totalFee?.toLocaleString() || '0');
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
            <div class="relative w-full h-full">
                <div id="imageCarousel" class="w-full h-full overflow-hidden">
                    ${images.map((image, index) => `
                        <div class="carousel-slide w-full h-full bg-cover bg-center transition-all duration-500 ease-in-out group-hover:scale-110 ${index === 0 ? 'active' : ''}" 
                             style="background-image: url('${image}'); display: ${index === 0 ? 'block' : 'none'};">
                        </div>
                    `).join('')}
                </div>
                
                <!-- Carousel indicators -->
                <div class="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    ${images.map((_, index) => `
                        <button class="carousel-indicator w-2 h-2 rounded-full bg-white/50 hover:bg-white/80 transition-all ${index === 0 ? 'bg-white' : ''}" 
                                data-slide="${index}"></button>
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
        const indicators = document.querySelectorAll('.carousel-indicator');
        
        // Indicator click handlers
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                showSlide(index);
                resetAutoCarousel(imageCount);
            });
        });
        
    } catch (error) {
        console.error('Error setting up carousel controls:', error);
    }
}

// Function to show specific slide
function showSlide(index) {
    try {
        const slides = document.querySelectorAll('.carousel-slide');
        const indicators = document.querySelectorAll('.carousel-indicator');
        
        // Hide all slides
        slides.forEach(slide => {
            slide.style.display = 'none';
            slide.classList.remove('active');
        });
        
        // Remove active class from all indicators
        indicators.forEach(indicator => {
            indicator.classList.remove('bg-white');
            indicator.classList.add('bg-white/50');
        });
        
        // Show current slide
        if (slides[index]) {
            slides[index].style.display = 'block';
            slides[index].classList.add('active');
        }
        
        // Highlight current indicator
        if (indicators[index]) {
            indicators[index].classList.remove('bg-white/50');
            indicators[index].classList.add('bg-white');
        }
        
    } catch (error) {
        console.error('Error showing slide:', error);
    }
}

// Function to get current slide index
function getCurrentSlideIndex() {
    try {
        const slides = document.querySelectorAll('.carousel-slide');
        for (let i = 0; i < slides.length; i++) {
            if (slides[i].classList.contains('active')) {
                return i;
            }
        }
        return 0;
    } catch (error) {
        console.error('Error getting current slide index:', error);
        return 0;
    }
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
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
                        <div class="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                        <div class="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                </div>
                
                <!-- Main Content Skeleton -->
                <div class="flex-1 p-4 max-w-6xl mx-auto w-full">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Left Side - Image and Details -->
                        <div class="space-y-4">
                            <!-- Image Skeleton -->
                            <div class="w-full h-[200px] bg-gray-200 rounded-3xl animate-pulse"></div>
                            
                            <!-- Room Info Skeleton -->
                            <div class="space-y-3">
                                <div class="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                                <div class="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                                <div class="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            
                            <!-- Booking Details Skeleton -->
                            <div class="space-y-2">
                                <div class="h-5 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                                    <div class="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                                    <div class="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                                    <div class="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right Side - Payment Info -->
                        <div class="space-y-4">
                            <!-- Payment Summary Skeleton -->
                            <div class="bg-white rounded-2xl p-4 space-y-3">
                                <div class="h-5 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="border-t pt-2">
                                    <div class="flex justify-between">
                                        <div class="h-5 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                                        <div class="h-5 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Payment Status Skeleton -->
                            <div class="bg-white rounded-2xl p-4 space-y-3">
                                <div class="h-5 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
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

// Utility function to show error message
function showError(message) {
    console.error('Error:', message);
    alert(message); // Simple fallback
}
