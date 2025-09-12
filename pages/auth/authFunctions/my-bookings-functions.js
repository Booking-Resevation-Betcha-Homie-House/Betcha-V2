// My Bookings JavaScript Functions
// This file handles fetching and rendering booking cards dynamically

const API_BASE_URL = 'https://betcha-api.onrender.com';

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
        'confirmed': { bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
        'checked-in': { bgColor: 'bg-green-100', textColor: 'text-green-600' },
        'checked-out': { bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
        'cancelled': { bgColor: 'bg-red-100', textColor: 'text-red-600' },
        'canceled': { bgColor: 'bg-red-100', textColor: 'text-red-600' },
        'cancel': { bgColor: 'bg-red-100', textColor: 'text-red-600' },
        'completed': { bgColor: 'bg-green-100', textColor: 'text-green-600' },
        'complete': { bgColor: 'bg-green-100', textColor: 'text-green-600' }
    };
    
    return statusMap[status.toLowerCase()] || { bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
}

// Function to create a booking card
function createBookingCard(booking, propertyPhoto = null) {
    const statusStyle = getStatusStyle(booking.status);
    const checkInDate = formatDate(booking.checkIn);
    const checkOutDate = formatDate(booking.checkOut);
    
    // Use property photo if available, otherwise fallback
    const roomImage = propertyPhoto || '/images/unit03.jpg';

    return `
        <div class="relative rounded-2xl cursor-pointer p-5 w-full h-auto md:h-[200px] flex flex-col md:flex-row gap-5 shadow-sm bg-white border border-neutral-300 group hover:shadow-lg hover:border-primary-text transition-all duration-500 ease-in-out overflow-hidden"
             onclick="navigateToBooking('${booking._id}')">

            <!-- 🖼️ Room Image -->
            <div class="w-full md:w-[30%] group-hover:md:w-[35%] h-[200px] md:h-full bg-cover bg-center rounded-xl z-10 transition-all duration-500 ease-in-out"
                 style="background-image: url('${roomImage}')">
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
async function fetchPropertyPhoto(propertyId) {
    try {
        const response = await fetch(`${API_BASE_URL}/property/display/${propertyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.warn(`Failed to fetch property ${propertyId}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        // Return the first photo if available
        if (data.photoLinks && data.photoLinks.length > 0) {
            return data.photoLinks[0];
        }
        
        return null;
    } catch (error) {
        console.warn(`Error fetching property ${propertyId}:`, error);
        return null;
    }
}

// Function to navigate to booking details
function navigateToBooking(bookingId) {
    window.location.href = `view-booking.html?bookingId=${bookingId}`;
}

// Function to set active booking tab
function setActiveBookingTab(index) {
    console.log(`Switching to tab ${index}`);
    
    // Get tab buttons and content containers
    const tabBtns = document.querySelectorAll('.tab-btn');
    const containers = [
        'pendingContainer',
        'rateContainer', 
        'completedContainer'
    ];
    
    // Update button styles
    tabBtns.forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
            btn.classList.remove('text-neutral-500');
        } else {
            btn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
            btn.classList.add('text-neutral-500');
        }
    });

    // Show selected content, hide others
    containers.forEach((containerId, i) => {
        const content = document.getElementById(containerId);
        if (content) {
            if (i === index) {
                console.log(`Showing container: ${containerId}`);
                console.log(`Container content:`, content.innerHTML);
                content.classList.remove('hidden');
                content.classList.add('flex', 'flex-col', 'flex-1');
            } else {
                console.log(`Hiding container: ${containerId}`);
                content.classList.add('hidden');
                content.classList.remove('flex', 'flex-col', 'flex-1');
            }
        } else {
            console.error(`Container ${containerId} not found!`);
        }
    });
}

// Override the global setActiveTab function for my-bookings page
window.setActiveTab = setActiveBookingTab;

// Function to render bookings for a specific tab
async function renderBookings(bookings, containerId) {
    console.log(`renderBookings called for ${containerId} with:`, bookings);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found`);
        return;
    }

    if (!bookings || bookings.length === 0) {
        console.log(`No bookings for ${containerId}, showing empty message`);
        
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

    console.log(`Rendering ${bookings.length} bookings for ${containerId}`);
    
    // Fetch property photos for all bookings concurrently
    const bookingsWithPhotos = await Promise.all(
        bookings.map(async (booking) => {
            const propertyPhoto = await fetchPropertyPhoto(booking.propertyId);
            return { booking, propertyPhoto };
        })
    );
    
    // Render booking cards with photos
    container.innerHTML = bookingsWithPhotos
        .map(({ booking, propertyPhoto }) => createBookingCard(booking, propertyPhoto))
        .join('');
}

// Function to show skeleton loading
function showSkeletonLoading() {
    const skeletonHTML = Array(3).fill(createSkeletonLoader()).join('');
    
    document.getElementById('pendingContainer').innerHTML = skeletonHTML;
    document.getElementById('rateContainer').innerHTML = skeletonHTML;
    document.getElementById('completedContainer').innerHTML = skeletonHTML;
}

// Function to fetch and render bookings
async function fetchAndRenderBookings() {
    try {
        // Show skeleton loading
        showSkeletonLoading();

        // Get user ID from localStorage or URL params
        const userId = localStorage.getItem('userId') || new URLSearchParams(window.location.search).get('userId');
        
        if (!userId) {
            throw new Error('User ID not found');
        }

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
        console.log('Fetched bookings:', data);

        // Handle the response structure - API already returns grouped bookings
        let categorizedBookings = {
            pending: [],
            toRate: [],
            completed: []
        };
        
        if (data.message === 'Bookings grouped successfully.') {
            // API returns: { message, pending: [], completed: [], rate: [] }
            categorizedBookings.pending = data.pending || [];
            categorizedBookings.toRate = data.rate || [];
            categorizedBookings.completed = data.completed || [];
        } else if (data.success && data.data && Array.isArray(data.data)) {
            // If data.data is an array of booking groups
            let allBookings = [];
            data.data.forEach(group => {
                if (group.bookings && Array.isArray(group.bookings)) {
                    allBookings = allBookings.concat(group.bookings);
                }
            });
            // Since this format doesn't come pre-grouped, we'd need to manually categorize
            // For now, just put everything in pending
            categorizedBookings.pending = allBookings;
        } else if (Array.isArray(data)) {
            // If data is directly an array of bookings
            categorizedBookings.pending = data;
        } else {
            console.warn('Unexpected data structure:', data);
        }

        console.log('Categorized bookings:', categorizedBookings);

        // Keep skeleton loading while we fetch property photos
        // Don't clear containers yet - skeleton is still showing
        
        // Render bookings in their respective tabs (async) - this will replace skeleton loading
        await Promise.all([
            renderBookings(categorizedBookings.pending, 'pendingContainer'),
            renderBookings(categorizedBookings.toRate, 'rateContainer'),
            renderBookings(categorizedBookings.completed, 'completedContainer')
        ]);

        console.log('All bookings and property photos loaded successfully');

    } catch (error) {
        console.error('Error fetching bookings:', error);
        
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
        
        document.getElementById('pendingContainer').innerHTML = errorHTML;
        document.getElementById('rateContainer').innerHTML = errorHTML;
        document.getElementById('completedContainer').innerHTML = errorHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('My Bookings page loaded');
    
    // Set initial active tab (Pending = index 0)
    setActiveBookingTab(0);
    
    // Add a small delay for skeleton loading effect
    setTimeout(() => {
        fetchAndRenderBookings();
    }, 500);
});
