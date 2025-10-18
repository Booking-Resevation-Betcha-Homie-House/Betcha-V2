// My Bookings JavaScript Functions
// This file handles fetching and rendering booking cards dynamically

import { ToastNotification } from '/src/toastNotification.js';
const toast = new ToastNotification('bottom', 'right');
const API_BASE_URL = 'https://betcha-api.onrender.com';

// Global variable to store categorized bookings
let globalBookingsData = {
    all: [],
    pending: [],
    toRate: [],
    completed: []
};

// Photo cache to avoid duplicate API calls
const photoCache = new Map();

// Function to process items with controlled concurrency
async function processWithConcurrency(items, asyncFn, concurrency = 3) {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map(asyncFn));
        results.push(...batchResults);
        
        // Small delay between batches to be kind to the server
        if (i + concurrency < items.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    return results;
}

// Function to sort bookings by transaction number (descending - newest first)
function sortBookingsByTransactionNumber(bookings) {
    return [...bookings].sort((a, b) => {
        const transA = a.transNo || '';
        const transB = b.transNo || '';
        
        // Extract numbers from transaction strings for proper numeric sorting
        const numA = parseInt(transA.replace(/\D/g, '')) || 0;
        const numB = parseInt(transB.replace(/\D/g, '')) || 0;
        
        return numB - numA; // Descending order (newest first)
    });
}

// Function to categorize bookings based on specific status requirements
function categorizeBookingsByStatus(bookings) {
    console.log('🔄 Starting categorization for', bookings.length, 'bookings (pre-sorted by transaction number)');
    
    const categorized = {
        pending: [],
        toRate: [],
        completed: []
    };
    
    bookings.forEach((booking, index) => {
        const status = booking.status ? booking.status.trim() : '';
        const rating = booking.rating || 0;
        
        // Only log first few for performance
        if (index < 3) {
            console.log(`📊 Booking ${index + 1}:`, {
                id: booking._id,
                transNo: booking.transNo,
                status: status,
                rating: rating,
                propertyName: booking.propertyName
            });
        }
        
        // Pending: 'Pending Payment', 'Reserved', 'Fully-Paid', 'Checked-In', 'Checked-Out'
        if (['Pending Payment', 'Reserved', 'Fully-Paid', 'Checked-In', 'Checked-Out'].includes(status)) {
            categorized.pending.push(booking);
        }
        // To Rate: 'Completed' with rating = 0
        else if (status === 'Completed' && rating === 0) {
            categorized.toRate.push(booking);
        }
        // Completed: 'Completed' (with rating > 0), 'Cancel'
        else if ((status === 'Completed' && rating > 0) || status === 'Cancel') {
            categorized.completed.push(booking);
        }
        // Default to pending for unknown statuses
        else {
            categorized.pending.push(booking);
        }
    });
    
    console.log('📈 Categorization results:', {
        pending: categorized.pending.length,
        toRate: categorized.toRate.length,
        completed: categorized.completed.length
    });
    
    return categorized;
}

// Function to create skeleton loading cards
function createSkeletonLoader() {
    return `
        <div class="relative rounded-2xl p-5 w-full h-auto md:h-[200px] flex flex-col md:flex-row gap-5 shadow-sm bg-white border border-neutral-200 animate-pulse overflow-hidden">
            <!-- 🖼️ Image Skeleton -->
            <div class="w-full md:w-[30%] h-[200px] md:h-full bg-neutral-200 rounded-xl"></div>

            <!-- 📋 Booking Info Skeleton -->
            <div class="w-full md:flex-1 flex flex-col justify-end">
                <!-- Title -->
                <div class="w-3/4 h-6 bg-neutral-200 rounded mb-3"></div>

                <!-- Address -->
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-4 h-4 bg-neutral-300 rounded-full"></div>
                    <div class="w-2/3 h-4 bg-neutral-200 rounded"></div>
                </div>

                <!-- Dates -->
                <div class="flex gap-4 items-center mb-3">
                    <div class="w-20 h-4 bg-neutral-200 rounded"></div>
                    <div class="w-4 h-4 bg-neutral-300 rounded-full"></div>
                    <div class="w-20 h-4 bg-neutral-200 rounded"></div>
                </div>

                <!-- Status -->
                <div class="w-24 h-6 bg-neutral-200 rounded-full mt-2"></div>
            </div>
        </div>
    `;
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Function to get status styling
function getStatusStyle(status) {
    const statusMap = {
        'pending': { bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
        'pending payment': { bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
        'transferred': { bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
        'reserved': { bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
        'fully-paid': { bgColor: 'bg-green-100', textColor: 'text-green-600' },
        'checked-in': { bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
        'checked-out': { bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
        'completed': { bgColor: 'bg-green-100', textColor: 'text-green-600' },
        'cancelled': { bgColor: 'bg-red-100', textColor: 'text-red-600' },
        'canceled': { bgColor: 'bg-red-100', textColor: 'text-red-600' },
        'cancel': { bgColor: 'bg-red-100', textColor: 'text-red-600' },
        'confirmed': { bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
        'complete': { bgColor: 'bg-green-100', textColor: 'text-green-600' }
    };
    
    return statusMap[status.toLowerCase()] || { bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
}

// Function to create a booking card
function createBookingCard(booking, propertyPhoto = null, isToRateTab = false) {
    const statusStyle = getStatusStyle(booking.status);
    const checkInDate = formatDate(booking.checkIn);
    
    // Add 1 day to check-out date
    const checkOutDateObj = new Date(booking.checkOut);
    checkOutDateObj.setDate(checkOutDateObj.getDate() + 1);
    const checkOutDate = formatDate(checkOutDateObj.toISOString());
    
    // Use property photo if available, otherwise white background
    const roomImage = propertyPhoto || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IndoaXRlIi8+PC9zdmc+';

    // Different click handler for "To Rate" tab
    const clickHandler = isToRateTab 
        ? `onclick="openToRateModal('${booking._id}', '${booking.propertyName}', '${booking.checkIn}', '${booking.checkOut}')"` 
        : `onclick="navigateToBooking('${booking._id}')"`;

    return `
        <div class="relative rounded-2xl cursor-pointer p-5 w-full h-auto md:h-[200px] flex flex-col md:flex-row gap-5 shadow-sm bg-white border border-neutral-300 group hover:shadow-lg hover:border-primary-text transition-all duration-500 ease-in-out overflow-hidden"
             ${clickHandler}>

            <!-- 🖼️ Room Image -->
            <div class="w-full md:w-[30%] group-hover:md:w-[35%] h-[200px] md:h-full bg-cover bg-center rounded-xl z-10 transition-all duration-500 ease-in-out"
                 style="background-image: url('${roomImage}')" 
                 data-property-id="${booking.propertyId}"
                 data-booking-id="${booking._id}">
            </div>

            <!-- 📋 Booking Details -->
            <div class="w-full md:flex-1 text-start flex flex-col justify-end z-10">
                <p class="font-manrope font-semibold text-xl truncate mb-2 max-w-full md:max-w-[250px] md:text-3xl">
                    ${booking.propertyName || 'Room'}
                </p>

                <!-- Address -->
                <div class="flex gap-2 items-center">
                    <svg class="h-4 fill-neutral-500" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 0C2.68628 0 0 2.86538 0 6.4C0 9.93458 3 12.8 6 16C9 12.8 12 9.93458 12 6.4C12 2.86538 9.31371 0 6 0ZM6 3.55555C7.4202 3.55555 8.57143 4.74946 8.57143 6.22221C8.57143 7.69501 7.4202 8.88888 6 8.88888C4.5798 8.88888 3.42857 7.69501 3.42857 6.22221C3.42857 4.74946 4.5798 3.55555 6 3.55555Z"/>
                    </svg>
                    <p class="font-roboto text-neutral-500 text-sm truncate">
                        Transaction: ${booking.transNo || 'N/A'}
                    </p>
                </div>

                <!-- Dates -->
                <div class="flex gap-4 items-center mb-2 text-sm font-roboto text-neutral-500">
                    <p>${checkInDate}</p>
                    <span>
                        <svg class="w-4 h-4 fill-neutral-500" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.707 6.13598L20.364 11.793C20.5515 11.9805 20.6568 12.2348 20.6568 12.5C20.6568 12.7651 20.5515 13.0194 20.364 13.207L14.707 18.864C14.5184 19.0461 14.2658 19.1469 14.0036 19.1447C13.7414 19.1424 13.4906 19.0372 13.3052 18.8518C13.1198 18.6664 13.0146 18.4156 13.0123 18.1534C13.01 17.8912 13.1108 17.6386 13.293 17.45L17.243 13.5H4C3.73478 13.5 3.48043 13.3946 3.29289 13.2071C3.10536 13.0195 3 12.7652 3 12.5C3 12.2348 3.10536 11.9804 3.29289 11.7929C3.48043 11.6053 3.73478 11.5 4 11.5H17.243L13.293 7.54998Z"/>
                        </svg>
                    </span>
                    <p>${checkOutDate}</p>
                </div>

                <!-- Booking Status -->
                <div class="mt-2">
                    <span class="inline-block ${statusStyle.bgColor} ${statusStyle.textColor} text-xs font-semibold px-3 py-1 rounded-full">
                        ${booking.status || 'Pending'}
                    </span>
                </div>
            </div>

            <!-- ➡️ Slide-in Right Arrow from LEFT to RIGHT -->
            <div class="absolute right-8 top-1/2 -translate-y-1/2 z-10 opacity-0 -translate-x-4 
                        group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <svg class="w-5 h-5 stroke-primary-text" viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 0.5L9 8.5L1 16.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        </div>
    `;
}

// Function to fetch property photo
// Optimized function to fetch property photo with caching
async function fetchPropertyPhoto(propertyId) {
    // Check cache first
    if (photoCache.has(propertyId)) {
        return photoCache.get(propertyId);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/property/display/${propertyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.warn(`Failed to fetch property ${propertyId}: ${response.status}`);
            photoCache.set(propertyId, null); // Cache the failure
            return null;
        }

        const data = await response.json();
        
        // Get the first photo if available
        const photo = data.photoLinks && data.photoLinks.length > 0 ? data.photoLinks[0] : null;
        
        // Cache the result
        photoCache.set(propertyId, photo);
        return photo;
        
    } catch (error) {
        console.warn(`Error fetching property ${propertyId}:`, error);
        photoCache.set(propertyId, null); // Cache the failure
        return null;
    }
}

// Function to update card image once loaded
function updateCardImage(bookingId, propertyId, imageUrl) {
    if (!imageUrl) return;
    
    // Find ALL image elements for this booking across all tabs (since the same booking might appear in multiple tabs)
    const imageElements = document.querySelectorAll(`[data-booking-id="${bookingId}"][data-property-id="${propertyId}"]`);
    
    imageElements.forEach((imageElement) => {
        // Update the background image with smooth transition
        imageElement.style.backgroundImage = `url('${imageUrl}')`;
        console.log(`✅ Updated image for booking ${bookingId} in container`);
    });
}

// Function to load images progressively
async function loadImagesProgressively(bookings) {
    console.log(`🖼️ Starting progressive image loading for ${bookings.length} bookings...`);
    
    // Process images with controlled concurrency
    await processWithConcurrency(
        bookings,
        async (booking) => {
            try {
                const photo = await fetchPropertyPhoto(booking.propertyId);
                if (photo) {
                    updateCardImage(booking._id, booking.propertyId, photo);
                }
            } catch (error) {
                console.warn(`Failed to load progressive image for ${booking.propertyId}:`, error);
            }
        },
        6 // Higher concurrency for background loading
    );
    
    console.log(`🎉 Progressive image loading completed`);
}

// Function to navigate to booking details
function navigateToBooking(bookingId) {
    window.location.href = `view-booking.html?bookingId=${bookingId}`;
}

// Function to set active booking tab
function setActiveBookingTab(index) {
    console.log(`🔄 Switching to tab ${index}`);
    
    // Get tab buttons and content containers
    const tabBtns = document.querySelectorAll('.tab-btn');
    const containers = [
        'allContainer',      // Tab 0: All
        'pendingContainer',  // Tab 1: Pending
        'rateContainer',     // Tab 2: To Rate
        'completedContainer' // Tab 3: Completed
    ];
    
    console.log(`📋 Available containers:`, containers);
    console.log(`🎯 Target container:`, containers[index]);
    
    // Update button styles
    tabBtns.forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
            btn.classList.remove('text-neutral-500', 'hover:bg-primary/10');
        } else {
            btn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
            btn.classList.add('text-neutral-500', 'hover:bg-primary/10');
        }
    });

    // Show selected content, hide others
    containers.forEach((containerId, i) => {
        const content = document.getElementById(containerId);
        if (content) {
            if (i === index) {
                console.log(`✅ Showing container: ${containerId}`);
                content.classList.remove('hidden');
                
                // Trigger image loading for newly visible tab if data is available
                const tabData = getBookingsForTab(index);
                if (tabData && tabData.length > 0) {
                    // Check if images need to be loaded for this tab
                    loadImagesForVisibleTab(tabData, containerId);
                }
            } else {
                console.log(`🚫 Hiding container: ${containerId}`);
                content.classList.add('hidden');
            }
        } else {
            console.error(`❌ Container ${containerId} not found!`);
        }
    });
}

// Helper function to get bookings data for a specific tab
function getBookingsForTab(tabIndex) {
    switch (tabIndex) {
        case 0: return globalBookingsData.all;
        case 1: return globalBookingsData.pending;
        case 2: return globalBookingsData.toRate;
        case 3: return globalBookingsData.completed;
        default: return [];
    }
}

// Function to load images for newly visible tab
async function loadImagesForVisibleTab(bookings, containerId) {
    console.log(`🖼️ Loading images for visible tab: ${containerId}`);
    
    // Check which images still need to be loaded
    const bookingsNeedingImages = bookings.filter(booking => {
        const imageElement = document.querySelector(`#${containerId} [data-booking-id="${booking._id}"]`);
        if (!imageElement) return false;
        
        // Check if image is still using fallback (white background)
        const currentBg = imageElement.style.backgroundImage;
        return !currentBg || currentBg.includes('data:image/svg+xml') || currentBg === '';
    });
    
    if (bookingsNeedingImages.length === 0) {
        console.log(`🎉 All images already loaded for ${containerId}`);
        return;
    }
    
    console.log(`📸 Loading ${bookingsNeedingImages.length} missing images for ${containerId}`);
    
    // Load missing images with controlled concurrency
    await processWithConcurrency(
        bookingsNeedingImages,
        async (booking) => {
            try {
                // Check if image is already cached
                let photo = photoCache.get(booking.propertyId);
                if (photo === undefined) {
                    // Not in cache, fetch it
                    photo = await fetchPropertyPhoto(booking.propertyId);
                }
                
                if (photo) {
                    updateCardImage(booking._id, booking.propertyId, photo);
                }
            } catch (error) {
                console.warn(`Failed to load image for ${booking.propertyId}:`, error);
            }
        },
        3 // Lower concurrency for tab switching
    );
}

// Set up the required global functions
window.setActiveTab = setActiveBookingTab;
window.navigateToBooking = navigateToBooking;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Set initial active tab (All = index 0)
    setActiveBookingTab(0);
    // Start fetching immediately for better performance
    fetchAndRenderBookings();
});

// Global variable to store current booking being rated
let currentRatingBookingId = null;

// Function to open the rating modal for "To Rate" bookings
function openToRateModal(bookingId, propertyName, checkIn, checkOut) {
    console.log('🌟 Opening rating modal for booking:', bookingId);
    
    // Store the booking ID for later use
    currentRatingBookingId = bookingId;
    
    // Format dates for display
    const checkInFormatted = formatDate(checkIn);
    const checkOutDateObj = new Date(checkOut);
    checkOutDateObj.setDate(checkOutDateObj.getDate() + 1);
    const checkOutFormatted = formatDate(checkOutDateObj.toISOString());
    
    // Update modal content
    const modal = document.getElementById('toRateModal');
    const unitNameElement = modal.querySelector('h2');
    const checkInDateElement = modal.querySelector('#checkInDate');
    const checkOutDateElement = modal.querySelector('#checkOutDate');
    
    if (unitNameElement) unitNameElement.textContent = propertyName || 'Unit Name';
    if (checkInDateElement) checkInDateElement.textContent = checkInFormatted;
    if (checkOutDateElement) checkOutDateElement.textContent = checkOutFormatted;
    
    // Reset rating
    resetRating();
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Add event listener to confirm button if not already added
    const confirmButton = modal.querySelector('#submitRatingBtn');
    if (confirmButton) {
        // Remove existing listeners
        confirmButton.replaceWith(confirmButton.cloneNode(true));
        const newConfirmButton = modal.querySelector('#submitRatingBtn');
        
        newConfirmButton.addEventListener('click', submitRating);
    }
}

// Function to reset rating display
function resetRating() {
    const starContainer = document.querySelector('#starRating');
    const ratingValue = document.querySelector('#ratingValue span');
    
    if (starContainer) {
        starContainer.innerHTML = '';
        // Create 5 stars
        for (let i = 1; i <= 5; i++) {
            const star = createStar(i);
            starContainer.appendChild(star);
        }
        
        // Add container-level mouse leave event to restore rating when leaving the entire star area
        starContainer.addEventListener('mouseleave', () => restoreCurrentRating());
        
        // Set default rating to 1
        setRating(1);
    }
    
    if (ratingValue) {
        ratingValue.textContent = '1';
    }
}

// Function to create a star element
function createStar(index) {
    const star = document.createElement('div');
    star.className = 'star cursor-pointer transition-colors duration-200';
    star.dataset.rating = index;
    
    star.innerHTML = `
        <svg class="w-10 h-10 fill-gray-300 hover:fill-yellow-400 transition-colors duration-200" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
    `;
    
    // Add click and hover events
    star.addEventListener('click', () => setRating(index));
    star.addEventListener('mouseenter', () => previewRating(index));
    star.addEventListener('mouseleave', restoreCurrentRating);
    
    return star;
}

// Function to set rating
function setRating(rating) {
    console.log('⭐ Setting rating:', rating);
    
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.querySelector('#ratingValue span');
    const ratingText = document.querySelector('#ratingValue');
    
    // Update star colors
    stars.forEach((star, index) => {
        const svg = star.querySelector('svg');
        if (index < rating) {
            svg.classList.remove('fill-gray-300');
            svg.classList.add('fill-yellow-400');
        } else {
            svg.classList.remove('fill-yellow-400');
            svg.classList.add('fill-gray-300');
        }
    });
    
    // Update rating value display with proper singular/plural
    if (ratingValue) {
        ratingValue.textContent = rating;
    }
    
    if (ratingText) {
        const starText = rating === 1 ? 'star' : 'stars';
        ratingText.innerHTML = `<span>${rating}</span> ${starText}`;
    }
    
    // Store current rating
    window.currentRating = rating;
}

// Function to preview rating on hover
function previewRating(rating) {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.querySelector('#ratingValue span');
    const ratingText = document.querySelector('#ratingValue');
    
    // Update star colors for preview
    stars.forEach((star, index) => {
        const svg = star.querySelector('svg');
        if (index < rating) {
            svg.classList.remove('fill-gray-300');
            svg.classList.add('fill-yellow-400');
        } else {
            svg.classList.remove('fill-yellow-400');
            svg.classList.add('fill-gray-300');
        }
    });
    
    // Update rating value display for preview
    if (ratingValue) {
        ratingValue.textContent = rating;
    }
    
    if (ratingText) {
        const starText = rating === 1 ? 'star' : 'stars';
        ratingText.innerHTML = `<span>${rating}</span> ${starText}`;
    }
}

// Function to restore current rating when mouse leaves
function restoreCurrentRating() {
    const currentRating = window.currentRating || 1;
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.querySelector('#ratingValue span');
    const ratingText = document.querySelector('#ratingValue');
    
    // Restore star colors to current rating
    stars.forEach((star, index) => {
        const svg = star.querySelector('svg');
        if (index < currentRating) {
            svg.classList.remove('fill-gray-300');
            svg.classList.add('fill-yellow-400');
        } else {
            svg.classList.remove('fill-yellow-400');
            svg.classList.add('fill-gray-300');
        }
    });
    
    // Restore rating value display
    if (ratingValue) {
        ratingValue.textContent = currentRating;
    }
    
    if (ratingText) {
        const starText = currentRating === 1 ? 'star' : 'stars';
        ratingText.innerHTML = `<span>${currentRating}</span> ${starText}`;
    }
}

// Function to submit rating to API
async function submitRating() {
    if (!currentRatingBookingId) {
        console.error('❌ No booking ID available for rating');
        return;
    }
    
    const rating = window.currentRating || 1; // Default to 1 if no rating selected
    if (rating < 1 || rating > 5) {
        toast.show('error', 'Error', 'Please select a rating from 1 to 5 stars');
        return;
    }
    
    console.log('📤 Submitting rating:', rating, 'for booking:', currentRatingBookingId);
    
    const confirmButton = document.querySelector('#submitRatingBtn');
    const originalText = confirmButton.querySelector('span').textContent;
    
    try {
        // Show loading state
        confirmButton.querySelector('span').textContent = 'Submitting...';
        confirmButton.disabled = true;
        
        // Submit rating to API
        const response = await fetch(`${API_BASE_URL}/booking/rate/${currentRatingBookingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rating: rating
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to submit rating: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Rating submitted successfully:', result);
        
        // Close modal
        document.getElementById('toRateModal').classList.add('hidden');
        document.getElementById('toRateModal').classList.remove('flex');
        
        // Show success message using toast
        toast.show('success', 'Success', 'Rating submitted successfully!');
        
        // Refresh bookings and stay on To Rate tab (index 2)
        await fetchAndRenderBookings();
        setActiveBookingTab(2);
        
    } catch (error) {
        console.error('❌ Error submitting rating:', error);
        toast.show('error', 'Error', 'Failed to submit rating. Please try again.');
        
        // Restore button state
        confirmButton.querySelector('span').textContent = originalText;
        confirmButton.disabled = false;
    }
}

// Make functions globally available
window.openToRateModal = openToRateModal;
window.setRating = setRating;
window.previewRating = previewRating;
window.restoreCurrentRating = restoreCurrentRating;
window.submitRating = submitRating;

// Function to render bookings for a specific tab
// Optimized function to render bookings with sorting and complete loading
async function renderBookings(bookings, containerId) {
    console.log(`🎨 renderBookings called for ${containerId} with ${bookings?.length || 0} bookings`);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container with ID '${containerId}' not found`);
        return;
    }

    if (!bookings || bookings.length === 0) {
        console.log(`📭 No bookings for ${containerId}, showing empty message`);
        
        // Create specific messages for each tab
        let emptyMessage = 'No bookings found';
        if (containerId === 'pendingContainer') {
            emptyMessage = 'No Pending Bookings';
        } else if (containerId === 'rateContainer') {
            emptyMessage = 'No Bookings To Rate';
        } else if (containerId === 'completedContainer') {
            emptyMessage = 'No Completed Bookings';
        }
        
        container.innerHTML = `
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center py-10">
                    <p class="text-neutral-500 text-lg">${emptyMessage}</p>
                </div>
            </div>
        `;
        return;
    }

    console.log(`🔢 Sorting ${bookings.length} bookings by transaction number...`);
    
    // Sort bookings by transaction number (newest first)
    const sortedBookings = sortBookingsByTransactionNumber(bookings);
    
    console.log(`⚡ Rendering booking cards immediately with placeholder images...`);
    
    // Check if this is the "To Rate" container to use different click behavior
    const isToRateTab = containerId === 'rateContainer';
    
    // Render all cards immediately with fallback images
    const immediateHTML = sortedBookings
        .map(booking => createBookingCard(booking, null, isToRateTab)) // Pass isToRateTab flag
        .join('');
    
    // Display cards immediately
    container.innerHTML = immediateHTML;
    
    console.log(`✅ ${sortedBookings.length} booking cards displayed immediately in ${containerId}`);
    
    // Load images progressively in background (non-blocking)
    loadImagesProgressively(sortedBookings).catch(error => {
        console.warn('Progressive image loading failed:', error);
    });
    
    console.log(`🖼️ Progressive image loading started for ${containerId}`);
}

// Function to show skeleton loading
function showSkeletonLoading() {
    // Show more skeleton cards for better loading experience
    const skeletonHTML = Array(4).fill(createSkeletonLoader()).join('');
    
    document.getElementById('allContainer').innerHTML = skeletonHTML;
    document.getElementById('pendingContainer').innerHTML = skeletonHTML;
    document.getElementById('rateContainer').innerHTML = skeletonHTML;
    document.getElementById('completedContainer').innerHTML = skeletonHTML;
    
    console.log('💀 Skeleton loading displayed across all tabs');
}

// Function to fetch and render bookings
async function fetchAndRenderBookings() {
    const startTime = performance.now();
    console.log('🚀 Starting optimized booking fetch...');
    
    try {
        // Show skeleton loading
        showSkeletonLoading();

        // Get user ID from localStorage or URL params
        const userId = localStorage.getItem('userId') || new URLSearchParams(window.location.search).get('userId');
        
        if (!userId) {
            throw new Error('User ID not found');
        }

        console.log('📡 Fetching bookings for user:', userId);

        // Fetch bookings
        const response = await fetch(`${API_BASE_URL}/booking/guest/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🔍 API Response received in', performance.now() - startTime, 'ms');

        let allBookingsArray = [];
        
        // Handle different API response structures efficiently
        if (data.message === 'Bookings grouped successfully.') {
            // API returns pre-grouped: { message, pending: [], completed: [], rate: [] }
            console.log('📊 Processing pre-grouped API response');
            allBookingsArray = [
                ...(data.pending || []),
                ...(data.rate || []),
                ...(data.completed || [])
            ];
        } else if (data.success && data.data && Array.isArray(data.data)) {
            // If data.data is an array of booking groups
            console.log('📋 Processing grouped booking data');
            allBookingsArray = data.data.flatMap(group => group.bookings || []);
        } else if (Array.isArray(data)) {
            // If data is directly an array of bookings
            console.log('📄 Processing direct booking array');
            allBookingsArray = data;
        } else {
            console.warn('⚠️ Unexpected data structure:', data);
            allBookingsArray = [];
        }

        console.log('📊 Total bookings found:', allBookingsArray.length);

        // Sort all bookings once by transaction number
        const sortedBookings = sortBookingsByTransactionNumber(allBookingsArray);
        console.log('🔢 Bookings sorted by transaction number in', performance.now() - startTime, 'ms');

        // Categorize the already sorted bookings
        const categorizedBookings = categorizeBookingsByStatus(sortedBookings);

        // Store globally for tab switching (already sorted)
        globalBookingsData = {
            all: sortedBookings,
            pending: categorizedBookings.pending,
            toRate: categorizedBookings.toRate,
            completed: categorizedBookings.completed
        };

        console.log('💾 Global data stored:', {
            all: globalBookingsData.all.length,
            pending: globalBookingsData.pending.length,
            toRate: globalBookingsData.toRate.length,
            completed: globalBookingsData.completed.length
        });
        
        // Render bookings in their respective tabs (immediately with progressive image loading)
        const renderStartTime = performance.now();
        await Promise.all([
            renderBookings(globalBookingsData.all, 'allContainer'),
            renderBookings(globalBookingsData.pending, 'pendingContainer'),
            renderBookings(globalBookingsData.toRate, 'rateContainer'),
            renderBookings(globalBookingsData.completed, 'completedContainer')
        ]);

        const totalTime = performance.now() - startTime;
        const renderTime = performance.now() - renderStartTime;
        console.log(`✅ All booking data displayed in ${renderTime.toFixed(2)}ms (total: ${totalTime.toFixed(2)}ms)`);
        console.log(`🖼️ Images will continue loading in background...`);

    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        
        // Show error message in all tabs
        const errorHTML = `
            <div class="text-center py-10">
                <p class="text-red-500 text-lg">Error loading bookings</p>
                <p class="text-neutral-500 text-sm mt-2">${error.message}</p>
                <button onclick="fetchAndRenderBookings()" 
                        class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    Retry
                </button>
            </div>
        `;
        
        document.getElementById('allContainer').innerHTML = errorHTML;
        document.getElementById('pendingContainer').innerHTML = errorHTML;
        document.getElementById('rateContainer').innerHTML = errorHTML;
        document.getElementById('completedContainer').innerHTML = errorHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 My Bookings page loaded');
    
    // Set initial active tab (All = index 0)
    setActiveBookingTab(0);
    
    // Start fetching immediately for better performance
    console.log('📡 Starting immediate data fetch...');
    fetchAndRenderBookings();
    
    // Add close modal functionality
    const toRateModal = document.getElementById('toRateModal');
    const closeButtons = toRateModal.querySelectorAll('[data-close-modal]');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            toRateModal.classList.add('hidden');
            toRateModal.classList.remove('flex');
            currentRatingBookingId = null;
        });
    });
    
    // Close modal when clicking outside
    toRateModal.addEventListener('click', (e) => {
        if (e.target === toRateModal) {
            toRateModal.classList.add('hidden');
            toRateModal.classList.remove('flex');
            currentRatingBookingId = null;
        }
    });
});
