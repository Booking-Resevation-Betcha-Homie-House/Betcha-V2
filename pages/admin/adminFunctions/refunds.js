// Refunds Management Functions
const API_BASE = 'https://betcha-api.onrender.com';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadRefunds();
    setupSearchFilter();
});

// Load all refunds from API
async function loadRefunds() {
    const skeletonContainer = document.getElementById('auditSkeletonAdmin');
    const contentContainer = document.getElementById('auditContentAdmin');

    try {
        // Show skeleton while loading
        skeletonContainer.classList.remove('hidden');
        contentContainer.classList.add('hidden');

        const response = await fetch(`${API_BASE}/refund/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch refunds: ${response.statusText}`);
        }

        const refunds = await response.json();
        
        // Hide skeleton and show content
        skeletonContainer.classList.add('hidden');
        contentContainer.classList.remove('hidden');

        // Render refunds
        renderRefunds(refunds);
    } catch (error) {
        console.error('Error loading refunds:', error);
        
        // Hide skeleton
        skeletonContainer.classList.add('hidden');
        contentContainer.classList.remove('hidden');
        
        // Show error message
        contentContainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <svg class="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-neutral-500 text-lg font-medium mb-2">Failed to load refunds</p>
                <p class="text-neutral-400 text-sm">${error.message}</p>
            </div>
        `;
    }
}

// Render refunds cards
function renderRefunds(refunds) {
    const contentContainer = document.getElementById('auditContentAdmin');

    if (!refunds || refunds.length === 0) {
        contentContainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <svg class="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="text-neutral-500 text-lg font-medium">No refunds found</p>
                <p class="text-neutral-400 text-sm">Refund requests will appear here</p>
            </div>
        `;
        return;
    }

    contentContainer.innerHTML = refunds.map(refund => createRefundCard(refund)).join('');
}

// Create individual refund card
function createRefundCard(refund) {
    const { bookingId, guestId, amount, createdAt } = refund;
    
    // Format date
    const refundDate = new Date(createdAt);
    const formattedDate = refundDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const formattedTime = refundDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    // Format check-in and check-out dates
    const checkInDate = new Date(bookingId.checkIn);
    const checkOutDate = new Date(bookingId.checkOut);
    const formattedCheckIn = checkInDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const formattedCheckOut = checkOutDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });

    // Refunded status badge color (always green)
    const statusColor = 'bg-green-100 text-green-700';

    return `
        <div class="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer group"
             onclick='openRefundModal(${JSON.stringify(refund).replace(/'/g, "&apos;")})'>
            <div class="flex flex-col gap-3">
                <!-- Header -->
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-primary-text group-hover:text-primary transition-colors duration-200 line-clamp-1">
                            ${bookingId.propertyName}
                        </h3>
                        <p class="text-xs text-neutral-400 mt-1">Trans #${bookingId.transNo}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
                        Refunded
                    </span>
                </div>

                <!-- Divider -->
                <hr class="border-neutral-200">

                <!-- Guest Info -->
                <div class="space-y-2">
                    <div class="flex items-center gap-2 text-sm">
                        <svg class="w-4 h-4 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="text-neutral-600 font-medium">${guestId.firstname} ${guestId.lastname}</span>
                    </div>

                    <div class="flex items-center gap-2 text-sm">
                        <svg class="w-4 h-4 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span class="text-neutral-500 text-xs truncate">${guestId.email}</span>
                    </div>

                    <div class="flex items-center gap-2 text-sm">
                        <svg class="w-4 h-4 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span class="text-neutral-500 text-sm">${guestId.phoneNumber}</span>
                    </div>
                </div>

                <!-- Divider -->
                <hr class="border-neutral-200">

                <!-- Booking Details -->
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-neutral-500">Check-in:</span>
                        <span class="text-neutral-700 font-medium">${formattedCheckIn}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-neutral-500">Check-out:</span>
                        <span class="text-neutral-700 font-medium">${formattedCheckOut}</span>
                    </div>
                </div>

                <!-- Divider -->
                <hr class="border-neutral-200">

                <!-- Refund Amount -->
                <div class="bg-primary/5 rounded-lg p-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-neutral-600">Refund Amount:</span>
                        <span class="text-xl font-bold text-primary">₱${parseFloat(amount).toLocaleString()}</span>
                    </div>
                </div>

                <!-- Date -->
                <div class="flex items-center justify-between text-xs text-neutral-400 mt-2">
                    <span>${formattedDate}</span>
                    <span>${formattedTime}</span>
                </div>
            </div>
        </div>
    `;
}

// Open refund details modal
function openRefundModal(refund) {
    const { bookingId, guestId, amount, image, createdAt } = refund;
    
    // Format dates
    const refundDate = new Date(createdAt);
    const formattedDate = refundDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const checkInDate = new Date(bookingId.checkIn);
    const checkOutDate = new Date(bookingId.checkOut);
    const formattedCheckIn = checkInDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const formattedCheckOut = checkOutDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });

    // Create modal content
    const modalContent = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick="closeRefundModal(event)">
            <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="bg-white border-b border-neutral-200 px-6 py-4 flex-shrink-0">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-primary-text">Refund Details</h2>
                        <button onclick="closeRefundModal()" class="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                            <svg class="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-6 space-y-6 overflow-y-auto flex-1">
                    <!-- Property Info -->
                    <div class="bg-primary/5 rounded-2xl p-4">
                        <h3 class="text-lg font-semibold text-primary-text mb-2">${bookingId.propertyName}</h3>
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-neutral-600">Transaction #</span>
                            <span class="text-sm font-medium text-primary">${bookingId.transNo}</span>
                            <span class="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Refunded</span>
                        </div>
                    </div>

                    <!-- Guest Information -->
                    <div class="space-y-3">
                        <h4 class="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Guest Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-start gap-3">
                                <div class="p-2 bg-primary/10 rounded-lg">
                                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-xs text-neutral-500">Full Name</p>
                                    <p class="text-sm font-medium text-neutral-700">${guestId.firstname} ${guestId.lastname}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="p-2 bg-primary/10 rounded-lg">
                                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-xs text-neutral-500">Email</p>
                                    <p class="text-sm font-medium text-neutral-700 break-all">${guestId.email}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <div class="p-2 bg-primary/10 rounded-lg">
                                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p class="text-xs text-neutral-500">Phone</p>
                                    <p class="text-sm font-medium text-neutral-700">${guestId.phoneNumber}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Booking Details -->
                    <div class="space-y-3">
                        <h4 class="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Booking Details</h4>
                        <div class="bg-neutral-50 rounded-xl p-4 space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-neutral-600">Check-in Date</span>
                                <span class="text-sm font-medium text-neutral-700">${formattedCheckIn}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-neutral-600">Check-out Date</span>
                                <span class="text-sm font-medium text-neutral-700">${formattedCheckOut}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Refund Amount -->
                    <div class="space-y-3">
                        <h4 class="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Refund Information</h4>
                        <div class="bg-primary/10 rounded-xl p-5 border-2 border-primary/20">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-sm text-neutral-600 mb-1">Refund Amount</p>
                                    <p class="text-3xl font-bold text-primary">₱${parseFloat(amount).toLocaleString()}</p>
                                </div>
                                <svg class="w-12 h-12 text-primary/30" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                                </svg>
                            </div>
                            <p class="text-xs text-neutral-500 mt-3">Requested on ${formattedDate}</p>
                        </div>
                    </div>

                    <!-- Proof Image -->
                    ${image ? `
                    <div class="space-y-3">
                        <h4 class="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Payment Proof</h4>
                        <div class="rounded-xl overflow-hidden border border-neutral-200">
                            <img src="${image}" alt="Refund proof" 
                                 class="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                 onclick="window.open('${image}', '_blank')">
                        </div>
                        <p class="text-xs text-neutral-500 text-center">Click image to view full size</p>
                    </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="bg-white border-t border-neutral-200 px-6 py-4 flex-shrink-0">
                    <button onclick="closeRefundModal()" 
                            class="w-full py-3 bg-primary !text-white rounded-xl font-medium hover:bg-primary/90 active:scale-95 transition-all duration-200">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    const modalDiv = document.createElement('div');
    modalDiv.id = 'refundModal';
    modalDiv.innerHTML = modalContent;
    document.body.appendChild(modalDiv);
}

// Close refund modal
function closeRefundModal(event) {
    // Close only if clicking backdrop or close button
    if (!event || event.target === event.currentTarget || event.type === 'click') {
        const modal = document.getElementById('refundModal');
        if (modal) {
            modal.remove();
        }
    }
}

// Setup search filter
function setupSearchFilter() {
    const searchInput = document.getElementById('audit-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            filterRefunds(searchTerm);
        });
    }
}

// Filter refunds based on search term
function filterRefunds(searchTerm) {
    const cards = document.querySelectorAll('#auditContentAdmin > div');
    let visibleCount = 0;

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Show "no results" message if no cards are visible
    const contentContainer = document.getElementById('auditContentAdmin');
    const existingMessage = contentContainer.querySelector('.no-results-message');
    
    if (visibleCount === 0 && searchTerm) {
        if (!existingMessage) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results-message col-span-full flex flex-col items-center justify-center py-12 text-center';
            noResultsDiv.innerHTML = `
                <svg class="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p class="text-neutral-500 text-lg font-medium">No refunds found</p>
                <p class="text-neutral-400 text-sm">Try searching with different keywords</p>
            `;
            contentContainer.appendChild(noResultsDiv);
        }
    } else if (existingMessage) {
        existingMessage.remove();
    }
}

// Make functions globally available
window.openRefundModal = openRefundModal;
window.closeRefundModal = closeRefundModal;
