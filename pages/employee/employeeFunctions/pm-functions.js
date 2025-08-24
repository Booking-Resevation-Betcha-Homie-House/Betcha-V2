// PM Functions - Property Monitoring Management Functionality
// Get rid of the TS in the dashboard
// Get rid of the elemts in the Sidebar
//PM 90% done 
// Static data for the category for report "Disaster"
const API_BASE_URL = 'https://betcha-api.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    checkRolePrivileges();
    initializePropertyMonitoringFeatures();
});

// Role Privilege Checking Functions
async function checkRolePrivileges() {
    try {
        const roleID = localStorage.getItem('roleID');
        if (!roleID) return;

        const roleData = await fetchRolePrivileges(roleID);
        
        if (roleData && roleData.privileges) {
            filterSidebarByPrivileges(roleData.privileges);
        }
    } catch (error) {
        console.error('Error checking role privileges:', error);
    }
}

async function fetchRolePrivileges(roleID) {
    try {
        const response = await fetch(`${API_BASE_URL}/roles/display/${roleID}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching role privileges:', error);
        return null;
    }
}

function filterSidebarByPrivileges(privileges) {
    const privilegeMap = {
        'TS': ['ts.html'],
        'PSR': ['psr.html'],
        'TK': ['tk.html'],
        'PM': ['pm.html']
    };
    
    const sidebarLinks = document.querySelectorAll('nav a[href]');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === 'dashboard.html' || !href.includes('.html')) return;
        
        let hasAccess = false;
        privileges.forEach(privilege => {
            if (privilegeMap[privilege] && privilegeMap[privilege].includes(href)) {
                hasAccess = true;
            }
        });
        
        link.style.display = hasAccess ? 'flex' : 'none';
    });
    
    if (!privileges.includes('PM')) {
        showAccessDeniedMessage();
    }
}

function showAccessDeniedMessage() {
    const message = document.createElement('div');
    message.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    message.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
            <div class="text-center">
                <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p class="text-gray-600 mb-4">You don't have permission to access the Property Monitoring module.</p>
                <button onclick="window.location.href='dashboard.html'" class="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(message);
}

// Additional PM-specific functions can be added here
function initializePropertyMonitoringFeatures() {
    window.loadTodaysCheckins();
    
    const tabButtons = document.querySelectorAll('[data-tab]');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            setTimeout(() => {
                loadTodaysCheckins();
            }, 100);
        });
    });
    
    const endBookingConfirmBtn = document.querySelector('#checkoutModal .bg-primary');
    if (endBookingConfirmBtn) {
        endBookingConfirmBtn.addEventListener('click', handleEndBookingConfirm);
    }
    
    initializeCheckinConfirmationModal();
    initializeCalendarBookings();
}

// Function to get property IDs from localStorage
async function getPropertyIds() {
    try {
        const propertiesData = localStorage.getItem('properties');
        if (!propertiesData) return [];
        
        const properties = JSON.parse(propertiesData);
        let propertyIds = [];
        
        if (Array.isArray(properties)) {
            propertyIds = properties.map(property => {
                if (typeof property === 'string') return property;
                return property._id || property.id || property.propertyId;
            }).filter(id => id);
        } else if (typeof properties === 'string') {
            propertyIds = [properties];
        } else if (properties && properties.propertyIds) {
            propertyIds = properties.propertyIds;
        }
        
        return propertyIds;
    } catch (error) {
        console.error('Error getting property IDs:', error);
        return [];
    }
}

// Function to call the check-in API
async function fetchTodaysCheckins() {
    try {
        const propertyIds = await getPropertyIds();
        
        if (propertyIds.length === 0) return null;
        
        const requestBody = { propertyIds: propertyIds };
        
        const response = await fetch(`${API_BASE_URL}/pm/bookings/checkinToday`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
            const data = await response.json();
            const enhancedData = await enhanceBookingDataWithStatus(data);
            window.lastCheckInData = enhancedData;
            return enhancedData;
        } else {
            console.error('Failed to fetch check-in data:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching check-in data:', error);
        return null;
    }
}

// Function to populate the check-in tab with data
function populateCheckinTab(checkinData) {
    try {
        const tabGroup = document.querySelector('[data-tab-group]');
        const checkinTabContent = tabGroup ? tabGroup.querySelector('.tab-content .space-y-4') : null;
        
        if (!checkinTabContent) {
            console.error('Check-in tab content container not found');
            return;
        }
        
        checkinTabContent.innerHTML = '';
        
        let bookings = [];
        
        if (Array.isArray(checkinData)) {
            bookings = checkinData.filter(item => {
                const hasBookingFields = item.bookingId || item._id || item.transNo || 
                                       (item.nameOfGuest && item.nameOfProperty) || 
                                       (item.guestName && item.propertyName) ||
                                       (item.propertyName && item.guestName);
                
                if (shouldExcludeBooking(item)) return false;
                
                const isNotCheckedOut = !isCheckoutStatus(item.status);
                return hasBookingFields && isNotCheckedOut;
            });
        } else if (checkinData && checkinData.bookings && Array.isArray(checkinData.bookings)) {
            bookings = checkinData.bookings.filter(item => {
                const hasBookingFields = item.bookingId || item._id || item.transNo ||
                                       (item.propertyName && item.guestName);
                const status = (item.status || '').toString().toLowerCase();
                const isNotCheckedOut = !status.includes('checkout') && 
                                      !status.includes('checked-out') && 
                                      !status.includes('checked out') &&
                                      !status.includes('complete') &&
                                      !status.includes('finished') &&
                                      !status.includes('ended');
                return hasBookingFields && isNotCheckedOut;
            });
        } else if (checkinData && checkinData.data && Array.isArray(checkinData.data)) {
            bookings = checkinData.data.filter(item => {
                const hasBookingFields = item.bookingId || item._id || item.transNo ||
                                       (item.propertyName && item.guestName);
                const status = (item.status || '').toString().toLowerCase();
                const isNotCheckedOut = !status.includes('checkout') && 
                                      !status.includes('checked-out') && 
                                      !status.includes('checked out') &&
                                      !status.includes('complete') &&
                                      !status.includes('finished') &&
                                      !status.includes('ended');
                return hasBookingFields && isNotCheckedOut;
            });
        }
        
        if (bookings.length === 0) {
            checkinTabContent.innerHTML = `
                <div class="flex items-center justify-center h-40">
                    <div class="text-center">
                        <svg class="w-12 h-12 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        <p class="text-neutral-500 font-medium">No check-ins scheduled for today</p>
                        <p class="text-neutral-400 text-sm mt-1">All caught up!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        bookings.forEach(booking => {
            const bookingElement = createCheckinBookingElement(booking);
            checkinTabContent.appendChild(bookingElement);
        });
        
    } catch (error) {
        console.error('Error populating check-in tab:', error);
        showErrorState();
    }
}

// Function to populate checkout tab with checked-out bookings
function populateCheckoutTab(checkoutData) {
    try {
        const checkoutTabContent = document.getElementById('checkout-tab-content');
        
        if (!checkoutTabContent) {
            console.error('Check-out tab content container not found');
            return;
        }
        
        checkoutTabContent.innerHTML = '';
        
        let checkoutBookings = [];
        
        if (Array.isArray(checkoutData)) {
            checkoutBookings = checkoutData.filter(item => {
                const hasBookingFields = item.bookingId || item._id || item.transNo || 
                                       (item.nameOfGuest && item.nameOfProperty) || 
                                       (item.guestName && item.propertyName) ||
                                       (item.propertyName && item.guestName);
                
                if (shouldExcludeBooking(item)) return false;
                
                const isCheckoutToday = isCheckoutDateToday(item.checkOut);
                const isNotCancelled = item.status !== 'Cancel' && item.status !== 'Cancelled';
                
                return hasBookingFields && isCheckoutToday && isNotCancelled;
            });
        } else if (checkoutData && checkoutData.bookings && Array.isArray(checkoutData.bookings)) {
            checkoutBookings = checkoutData.bookings.filter(item => {
                const hasBookingFields = item.bookingId || item._id || item.transNo ||
                                       (item.propertyName && item.guestName);
                const isCheckoutToday = isCheckoutDateToday(item.checkOut);
                const isNotCancelled = item.status !== 'Cancel' && item.status !== 'Cancelled';
                
                if (shouldExcludeBooking(item)) return false;
                
                return hasBookingFields && isCheckoutToday && isNotCancelled;
            });
        } else if (checkoutData && checkoutData.data && Array.isArray(checkoutData.data)) {
            checkoutBookings = checkoutData.data.filter(item => {
                const hasBookingFields = item.bookingId || item._id || item.transNo ||
                                       (item.propertyName && item.guestName);
                const isCheckoutToday = isCheckoutDateToday(item.checkOut);
                const isNotCancelled = item.status !== 'Cancel' && item.status !== 'Cancelled';
                
                if (shouldExcludeBooking(item)) return false;
                
                return hasBookingFields && isCheckoutToday && isNotCancelled;
            });
        }
        
        if (checkoutBookings.length === 0) {
            checkoutTabContent.innerHTML = `
                <div class="flex items-center justify-center h-40">
                    <div class="text-center">
                        <svg class="w-12 h-12 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p class="text-neutral-500 font-medium">No check-outs scheduled for today</p>
                        <p class="text-neutral-400 text-sm mt-1">No guests are scheduled to check out today!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        checkoutBookings.forEach(booking => {
            const bookingElement = createCheckoutBookingElement(booking);
            checkoutTabContent.appendChild(bookingElement);
        });
        
    } catch (error) {
        console.error('Error populating check-out tab:', error);
        const checkoutTabContent = document.getElementById('checkout-tab-content');
        if (checkoutTabContent) {
            checkoutTabContent.innerHTML = `
                <div class="flex items-center justify-center h-40">
                    <div class="text-center">
                        <svg class="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                        <p class="text-red-500 font-medium mb-2">Error loading check-outs</p>
                        <button onclick="window.loadTodaysCheckins()" class="text-primary hover:underline text-sm">Try again</button>
                    </div>
                </div>
            `;
        }
    }
}

// Function to create a booking element for check-in
function createCheckinBookingElement(booking) {
    const bookingDiv = document.createElement('div');
    bookingDiv.className = `flex flex-col md:flex-row md:items-center md:justify-between bg-neutral-50 border border-neutral-200 p-4 rounded-xl font-inter
        transition-all duration-300 ease-in-out hover:bg-neutral-100`;
    
    // Extract data from the API response structure
    const checkInTime = booking.timeIn || formatTime(booking.checkInTime || booking.time || booking.checkIn);
    const guestName = booking.guestName || booking.nameOfGuest || booking.customerName || booking.customer?.name || 'Guest Name';
    const propertyName = booking.propertyName || booking.nameOfProperty || booking.property?.name || booking.property?.title || 'Property Name';
    const bookingId = booking._id || booking.bookingId || booking.id || '';
    const checkInDate = booking.checkIn || '';
    const checkOutDate = booking.checkOut || '';
    const status = booking.status || 'Reserved';
    
    // Enhanced guestId extraction with debugging
    let guestId = booking.guestId || booking.customer?.guestId || '';
    if (!guestId && bookingId) {
        // If guestId is not available, try to get it from the individual booking API
        console.log(`GuestId not found in main data for booking ${bookingId}, will fetch from individual API`);
    }
    
    // Enhanced transNo extraction
    let transNo = booking.transNo || booking.reservation?.paymentNo || '';
    if (!transNo && bookingId) {
        console.log(`TransNo not found in main data for booking ${bookingId}, will fetch from individual API`);
    }
    
    console.log(`Extracted data for booking ${bookingId}:`, {
        guestId: guestId || 'NOT_FOUND',
        transNo: transNo || 'NOT_FOUND',
        guestName,
        propertyName,
        status
    });
    
    // Format dates for display
    const checkInFormatted = formatDate(checkInDate);
    const checkOutFormatted = formatDate(checkOutDate);
    
    // Determine what to show in the action area based on status
    let actionContent = '';
    let statusColor = 'bg-blue-100 text-blue-800';
    
    // Determine status color and action content
    const statusLower = status.toString().toLowerCase();
    if (statusLower.includes('checkout') || statusLower.includes('checked-out') || statusLower.includes('checked out') ||
        statusLower.includes('complete') || statusLower.includes('finished') || statusLower.includes('ended')) {
        // This should not appear in check-in tab, but show it for debugging
        statusColor = 'bg-red-100 text-red-800';
        actionContent = `
            <div class="!px-4 !py-2 w-full bg-red-600 font-manrope rounded-lg flex items-center justify-center">
                <div class="flex flex-col text-white">
                    <span class="text-sm font-semibold">ERROR: Checked-Out</span>
                    <span class="text-xs">Should not appear here</span>
                </div>
            </div>
        `;
    } else if (statusLower.includes('checked-in') || statusLower.includes('checked in')) {
        statusColor = 'bg-green-100 text-green-800';
        actionContent = `
            <div 
                data-modal-target="checkinConfirmModal"
                data-booking-id="${bookingId}"
                data-property-name="${propertyName}"
                data-guest-name="${guestName}"
                data-checkin-date="${checkInFormatted}"
                data-checkin-time="${checkInTime}"
                data-booking-status="Checked-In"
                data-guest-id="${guestId}"
                data-trans-no="${transNo}"
                class="!px-4 !py-2 w-full bg-green-600 font-manrope rounded-lg flex items-center justify-center cursor-pointer
                transition-all duration-300 ease-in-out active:scale-95">
                <div class="flex flex-col text-white">
                    <span class="text-sm font-semibold">Confirmed</span>
                    <span class="text-xs">Already Checked-In</span>
                </div>
            </div>
        `;
    } else {
        // Pending or reserved status
        statusColor = 'bg-yellow-100 text-yellow-800';
        actionContent = `
            <button 
                data-modal-target="checkinConfirmModal"
                data-booking-id="${bookingId}"
                data-property-name="${propertyName}"
                data-guest-name="${guestName}"
                data-checkin-date="${checkInFormatted}"
                data-checkin-time="${checkInTime}"
                data-booking-status="${status}"
                data-guest-id="${guestId}"
                data-trans-no="${transNo}"
                class="!px-4 !py-2 w-full bg-primary font-manrope rounded-lg cursor-pointer
                transition-all duration-300 ease-in-out active:scale-95">
                <div class="flex flex-col text-white">
                    <span class="text-sm">Confirm</span>
                    <span class="text-xs">(Check-in & Payment)</span>
                </div>
            </button>
        `;
    }
    
    bookingDiv.innerHTML = `
        <div>
            <p class="font-medium font-manrope">${propertyName}</p>
            <p class="text-sm text-neutral-500">Guest: <span class="font-semibold">${guestName}</span></p>
            <p class="text-sm text-neutral-500">Check-in: <span>${checkInFormatted} at ${checkInTime}</span></p>
            ${checkOutDate ? `<p class="text-sm text-neutral-400">Check-out: <span>${checkOutFormatted} at ${booking.timeOut || '11:00 AM'}</span></p>` : ''}
            <!-- Debug: Show status for troubleshooting -->
            <p class="text-xs mt-1">
                <span class="px-2 py-1 rounded-full ${statusColor} font-medium">Status: ${status}</span>
            </p>
        </div>
        <div class="mt-3 md:mt-0">
            ${actionContent}
        </div>
    `;
    
    // If not checked-in, fetch the latest status from API
    if (!statusLower.includes('checked-in') && !statusLower.includes('checked in') && bookingId) {
        checkBookingStatus(bookingId, bookingDiv);
    }
    
    return bookingDiv;
}

// Function to create a booking element for check-out
function createCheckoutBookingElement(booking) {
    const bookingDiv = document.createElement('div');
    bookingDiv.className = `flex flex-col md:flex-row md:items-center md:justify-between bg-neutral-50 border border-neutral-200 p-4 rounded-xl font-inter
        transition-all duration-300 ease-in-out hover:bg-neutral-100`;
    
    // Extract data from the API response structure
    const checkOutTime = booking.timeOut || formatTime(booking.checkOutTime || '11:00 AM');
    const guestName = booking.guestName || booking.nameOfGuest || booking.customerName || booking.customer?.name || 'Guest Name';
    const propertyName = booking.propertyName || booking.nameOfProperty || booking.property?.name || booking.property?.title || 'Property Name';
    const bookingId = booking._id || booking.bookingId || booking.id || '';
    const checkInDate = booking.checkIn || '';
    const checkOutDate = booking.checkOut || '';
    const status = booking.status || 'Checked-Out';
    const guestId = booking.guestId || '';
    const transNo = booking.transNo || '';
    
    // Format dates for display
    const checkInFormatted = formatDate(checkInDate);
    const checkOutFormatted = formatDate(checkOutDate);
    
    bookingDiv.innerHTML = `
        <div>
            <p class="font-medium font-manrope">${propertyName}</p>
            <p class="text-sm text-neutral-500">Guest: <span class="font-semibold">${guestName}</span></p>
            <p class="text-sm text-neutral-400">Check-in: <span>${checkInFormatted}</span></p>
            <p class="text-sm text-neutral-500">Check-out: <span class="font-semibold">${checkOutFormatted} at ${checkOutTime}</span></p>
        </div>
        <div class="mt-3 md:mt-0">
            <button 
                class="!px-4 !py-2 w-full bg-green-600 font-manrope rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors duration-200"
                onclick="openEndBookingModal('${bookingId}', '${propertyName}', '${guestName}', '${checkInFormatted}', '${checkOutFormatted}', '${guestId}', '${transNo}')"
                title="Click to confirm checkout"
            >
                <div class="flex flex-col text-white">
                    <span class="text-sm font-semibold">Check Out Today</span>
                    <span class="text-xs">Guest Scheduled</span>
                </div>
            </button>
        </div>
    `;
    
    return bookingDiv;
}

// Function to open the End Booking modal
function openEndBookingModal(bookingId, propertyName, guestName, checkInDate, checkOutDate, guestId, transNo) {
    // Find the modal elements
    const modal = document.getElementById('checkoutModal');
    
    if (!modal) {
        console.error('End Booking modal not found');
        return;
    }
    
    // Set the modal content with booking details
    const modalTitle = modal.querySelector('.text-xl.font-bold');
    const remarksTextarea = modal.querySelector('#input-checkout-remarks');
    
    if (modalTitle) {
        modalTitle.textContent = `End Booking - ${propertyName}`;
    }
    
    if (remarksTextarea) {
        remarksTextarea.value = '';
        remarksTextarea.placeholder = `Enter property-related remarks for ${propertyName}...`;
    }
    
    // Store booking data for the confirm action
    modal.dataset.bookingId = bookingId;
    modal.dataset.propertyName = propertyName;
    modal.dataset.guestName = guestName;
    modal.dataset.checkInDate = checkInDate;
    modal.dataset.checkOutDate = checkOutDate;
    modal.dataset.guestId = guestId;
    modal.dataset.transNo = transNo;
    
    // Initialize customer report checkbox functionality
    initializeCustomerReportCheckbox();
    
    // Show the modal
    modal.classList.remove('hidden');
    
    // Focus on the remarks textarea
    if (remarksTextarea) {
        remarksTextarea.focus();
    }
}

// Function to initialize customer report checkbox functionality
function initializeCustomerReportCheckbox() {
    // Initialize customer report checkbox
    const customerCheckbox = document.getElementById('include-customer-report');
    const customerReportSection = document.getElementById('customer-report-section');
    const customerReportTextarea = document.getElementById('input-customer-report');
    
    if (customerCheckbox && customerReportSection && customerReportTextarea) {
        // Remove existing event listeners to prevent duplicates
        const newCustomerCheckbox = customerCheckbox.cloneNode(true);
        customerCheckbox.parentNode.replaceChild(newCustomerCheckbox, customerCheckbox);
        
        // Reset checkbox and hide section
        newCustomerCheckbox.checked = false;
        customerReportSection.classList.add('hidden');
        customerReportTextarea.value = '';
        
        // Add event listener for checkbox toggle
        newCustomerCheckbox.addEventListener('change', function() {
            if (this.checked) {
                customerReportSection.classList.remove('hidden');
                customerReportTextarea.focus();
            } else {
                customerReportSection.classList.add('hidden');
                customerReportTextarea.value = '';
            }
        });
    }
    
    // Initialize property report checkbox
    const propertyCheckbox = document.getElementById('include-property-report');
    const propertyReportSection = document.getElementById('property-report-section');
    const propertyReportTextarea = document.getElementById('input-property-report');
    
    if (propertyCheckbox && propertyReportSection && propertyReportTextarea) {
        // Remove existing event listeners to prevent duplicates
        const newPropertyCheckbox = propertyCheckbox.cloneNode(true);
        propertyCheckbox.parentNode.replaceChild(newPropertyCheckbox, propertyCheckbox);
        
        // Reset checkbox and hide section
        newPropertyCheckbox.checked = false;
        propertyReportSection.classList.add('hidden');
        propertyReportTextarea.value = '';
        
        // Add event listener for checkbox toggle
        newPropertyCheckbox.addEventListener('change', function() {
            if (this.checked) {
                propertyReportSection.classList.remove('hidden');
                propertyReportTextarea.focus();
            } else {
                propertyReportSection.classList.add('hidden');
                propertyReportTextarea.value = '';
            }
        });
    }
}

// Function to handle End Booking confirmation
async function handleEndBookingConfirm() {
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;
    
    const bookingId = modal.dataset.bookingId;
    const propertyName = modal.dataset.propertyName;
    const guestName = modal.dataset.guestName;
    const guestId = modal.dataset.guestId;
    const transNo = modal.dataset.transNo;
    const propertyRemarks = document.getElementById('input-checkout-remarks')?.value || '';
    const includeCustomerReport = document.getElementById('include-customer-report')?.checked || false;
    const customerReportRemarks = includeCustomerReport ? (document.getElementById('input-customer-report')?.value || '') : '';
    const includePropertyReport = document.getElementById('include-property-report')?.checked || false;
    const propertyReportMessage = includePropertyReport ? (document.getElementById('input-property-report')?.value || '') : '';
    
    if (!bookingId) {
        console.error('No booking ID found for confirmation');
        return;
    }
    
    try {
        // If customer report checkbox is active, call the /report API
        if (includeCustomerReport && customerReportRemarks && guestId) {
            const reportData = {
                guestId: guestId,
                reason: customerReportRemarks,
                transNo: transNo || '',
                reportedBy: 'PM' // Using PM as the reportedBy value
            };
            
            console.log('Sending customer report:', reportData);
            
            const reportResponse = await fetch(`${API_BASE_URL}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });
            
            if (!reportResponse.ok) {
                throw new Error(`Report API failed: ${reportResponse.status} ${reportResponse.statusText}`);
            }
            
            const reportResult = await reportResponse.json();
            console.log('Customer report submitted successfully:', reportResult);
        }
        
        // If property report checkbox is active, call the property report API
        if (includePropertyReport && propertyReportMessage) {
            // Get current date in ISO format
            const currentDate = new Date().toISOString();
            
            const propertyReportData = {
                sender: guestName || 'PM Staff',
                category: 'Disaster', // Static category as requested - easily editable in the future
                status: 'Unsolved',
                date: currentDate,
                transNo: transNo || '',
                message: propertyReportMessage
            };
            
            console.log('Sending property report:', propertyReportData);
            
            // TODO: PROPERTY ID HARDCODED - EASILY EDITABLE LOCATION
            // Current property ID: 6859662f5153fadbed4ebe48
            // To change: Replace the hardcoded ID in the URL below
            // This could be made dynamic by getting it from the booking data in the future
            const propertyReportResponse = await fetch(`${API_BASE_URL}/property/6859662f5153fadbed4ebe48/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(propertyReportData)
            });
            
            if (!propertyReportResponse.ok) {
                throw new Error(`Property Report API failed: ${propertyReportResponse.status} ${propertyReportResponse.statusText}`);
            }
            
            const propertyReportResult = await propertyReportResponse.json();
            console.log('Property report submitted successfully:', propertyReportResult);
        }
        
        // Prepare confirmation data
        const confirmationData = {
            bookingId,
            propertyName,
            guestName,
            propertyRemarks,
            includeCustomerReport,
            customerReportRemarks,
            includePropertyReport,
            propertyReportMessage
        };
        
        console.log('Booking confirmation data:', confirmationData);
        
        // Here you would typically call an API to update the booking status
        // For now, we'll just log the action and close the modal
        
        // Close the modal
        modal.classList.add('hidden');
        
        // Show success message with summary
        let successMessage = `Booking ended successfully for ${guestName} at ${propertyName}`;
        if (includeCustomerReport && customerReportRemarks) {
            successMessage += `\n\nCustomer report submitted successfully.`;
        }
        if (includePropertyReport && propertyReportMessage) {
            successMessage += `\n\nProperty report submitted successfully.`;
        }
        
        alert(successMessage);
        
        // Refresh the data to reflect the change
        loadTodaysCheckins();
        
    } catch (error) {
        console.error('Error during booking confirmation:', error);
        
        // Show error message
        let errorMessage = `Error ending booking: ${error.message}`;
        if (includeCustomerReport) {
            errorMessage += '\n\nCustomer report could not be submitted.';
        }
        if (includePropertyReport) {
            errorMessage += '\n\nProperty report could not be submitted.';
        }
        
        alert(errorMessage);
    }
}

// Helper function to format time
function formatTime(timeInput) {
    if (!timeInput) return '12:00 PM';
    
    try {
        // If it's already a formatted time string, return as is
        if (typeof timeInput === 'string' && timeInput.includes(':')) {
            return timeInput;
        }
        
        // If it's a date string or timestamp, format it
        const date = new Date(timeInput);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            });
        }
        
        return '12:00 PM';
    } catch (error) {
        console.error('Error formatting time:', error);
        return '12:00 PM';
    }
}

// Helper function to format date
function formatDate(dateInput) {
    if (!dateInput) return 'Today';
    
    try {
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
        
        return dateInput; // Return as-is if it's already a string
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateInput;
    }
}

// Function to initialize the check-in confirmation modal
function initializeCheckinConfirmationModal() {
    document.addEventListener('click', async (e) => {
        const button = e.target.closest('[data-modal-target="checkinConfirmModal"]');
        if (button) {
            const bookingId = button.dataset.bookingId;
            const propertyName = button.dataset.propertyName;
            const guestName = button.dataset.guestName;
            const checkinDate = button.dataset.checkinDate;
            const checkinTime = button.dataset.checkinTime;
            const bookingStatus = button.dataset.bookingStatus;
            const guestId = button.dataset.guestId;
            const transNo = button.dataset.transNo;
            
            console.log('Button dataset extracted:', {
                bookingId,
                propertyName,
                guestName,
                checkinDate,
                checkinTime,
                bookingStatus,
                guestId: guestId || 'NOT_FOUND',
                transNo: transNo || 'NOT_FOUND'
            });
            
            console.log('Full button dataset:', Object.fromEntries(Object.entries(button.dataset)));
            
            // Populate the modal with booking details
            populateCheckinConfirmModal(bookingId, propertyName, guestName, checkinDate, checkinTime, bookingStatus, guestId, transNo);
            
            // Open the modal
            const modal = document.getElementById('checkinConfirmModal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.classList.add('modal-open');
                console.log('Opening checkinConfirmModal manually');
                
                // Store guestId and transNo in modal dataset for later use
                modal.dataset.guestId = guestId;
                modal.dataset.transNo = transNo;
            } else {
                console.error('checkinConfirmModal not found in DOM');
            }
            
            // Initialize the customer report checkbox functionality
            initializeCheckinCustomerReportCheckbox();
            
            // Set up event listeners for the buttons
            const confirmBtn = document.getElementById('confirm-checkin-btn');
            if (confirmBtn) {
                confirmBtn.onclick = () => processCheckinConfirmation(bookingId);
            }
            
            const cancelBtn = document.getElementById('cancel-booking-btn');
            if (cancelBtn) {
                cancelBtn.onclick = () => processCheckinCancellation(bookingId);
            }
        }
    });
}

// Function to populate the check-in confirmation modal
function populateCheckinConfirmModal(bookingId, propertyName, guestName, checkinDate, checkinTime, bookingStatus, guestId, transNo) {
    // Update modal content
    document.getElementById('confirm-property-name').textContent = propertyName || '--';
    document.getElementById('confirm-guest-name').textContent = guestName || '--';
    document.getElementById('confirm-checkin-date').textContent = checkinDate || '--';
    document.getElementById('confirm-checkin-time').textContent = checkinTime || '--';
    document.getElementById('confirm-booking-id').textContent = bookingId || '--';
    
    // Store guestId and transNo in modal dataset
    const modal = document.getElementById('checkinConfirmModal');
    if (modal) {
        modal.dataset.guestId = guestId || '';
        modal.dataset.transNo = transNo || '';
        
        console.log('Modal dataset updated:', {
            guestId: guestId || 'EMPTY',
            transNo: transNo || 'EMPTY',
            fullDataset: Object.fromEntries(Object.entries(modal.dataset))
        });
    }
    
    // Store booking ID in the confirm button for later use
    const confirmBtn = document.getElementById('confirm-checkin-btn');
    if (confirmBtn) {
        confirmBtn.dataset.currentBookingId = bookingId;
        
        // Show/hide confirmation button based on status
        if (bookingStatus === 'Checked-In') {
            // Hide the confirmation button for already checked-in bookings
            confirmBtn.style.display = 'none';
            
            // Update modal title and icon for confirmed bookings
            const modalTitle = document.querySelector('#checkinConfirmModal h2');
            if (modalTitle) {
                modalTitle.textContent = 'Booking Details';
            }
            
            // Update the blue info box
            const infoBox = document.querySelector('#checkinConfirmModal .bg-blue-50');
            if (infoBox) {
                infoBox.innerHTML = `
                    <p class="text-blue-800 text-sm">
                        <strong>Status:</strong> This guest has already been checked in and payment has been processed.
                    </p>
                `;
            }
        } else {
            // Show the confirmation button for pending bookings
            confirmBtn.style.display = 'block';
            
            // Reset modal title and icon for pending bookings
            const modalTitle = document.querySelector('#checkinConfirmModal h2');
            if (modalTitle) {
                modalTitle.textContent = 'Confirm Check-in';
            }
            
            // Reset the blue info box
            const infoBox = document.querySelector('#checkinConfirmModal .bg-blue-50');
            if (infoBox) {
                infoBox.innerHTML = `
                    <p class="text-blue-800 text-sm">
                        <strong>Next Steps:</strong> After confirmation, please process payment and provide room access to the guest.
                    </p>
                `;
            }
        }
    }
    
    console.log('Populated check-in confirmation modal for booking:', bookingId, 'Status:', bookingStatus);
}

// Function to initialize the customer report checkbox functionality for check-in modal
function initializeCheckinCustomerReportCheckbox() {
    const customerCheckbox = document.getElementById('include-customer-report-checkin');
    const customerReportSection = document.getElementById('customer-report-section-checkin');
    const customerReportTextarea = document.getElementById('input-customer-report-checkin');
    
    if (customerCheckbox && customerReportSection && customerReportTextarea) {
        // Remove existing event listeners to prevent duplicates
        const newCheckbox = customerCheckbox.cloneNode(true);
        customerCheckbox.parentNode.replaceChild(newCheckbox, customerCheckbox);
        
        // Add new event listener
        newCheckbox.addEventListener('change', function() {
            if (this.checked) {
                customerReportSection.classList.remove('hidden');
                customerReportTextarea.focus();
            } else {
                customerReportSection.classList.add('hidden');
                customerReportTextarea.value = '';
            }
        });
    }
}

// Function to process the final check-in confirmation
async function processCheckinConfirmation(bookingId) {
    console.log('Processing check-in confirmation for booking:', bookingId);
    
    if (!bookingId) {
        alert('Error: No booking ID provided');
        return;
    }
    
    try {
        // Check if customer report checkbox is active
        const includeCustomerReport = document.getElementById('include-customer-report-checkin')?.checked || false;
        const customerReportRemarks = includeCustomerReport ? (document.getElementById('input-customer-report-checkin')?.value || '') : '';
        
        // If customer report checkbox is active and remarks are provided, call the /report API
        if (includeCustomerReport && customerReportRemarks) {
            try {
                // Get guestId and transNo from modal dataset
                const modal = document.getElementById('checkinConfirmModal');
                let guestId = modal.dataset.guestId || '';
                let transNo = modal.dataset.transNo || '';
                
                console.log('Customer report data check:', {
                    includeCustomerReport,
                    customerReportRemarks,
                    guestId: guestId || 'NOT_FOUND',
                    transNo: transNo || 'NOT_FOUND',
                    modalDataset: modal ? Object.fromEntries(Object.entries(modal.dataset)) : 'MODAL_NOT_FOUND'
                });
                
                // If guestId is missing, try to fetch it from the individual booking API
                if (!guestId && bookingId) {
                    console.log('GuestId missing, fetching from individual booking API...');
                    try {
                        const bookingResponse = await fetch(`${API_BASE_URL}/booking/${bookingId}`);
                        if (bookingResponse.ok) {
                            const bookingData = await bookingResponse.json();
                            if (bookingData.booking) {
                                guestId = bookingData.booking.guestId || '';
                                transNo = transNo || bookingData.booking.transNo || '';
                                console.log('Fetched from individual API:', { guestId, transNo });
                            }
                        }
                    } catch (fetchError) {
                        console.error('Error fetching individual booking data:', fetchError);
                    }
                }
                
                if (guestId) {
                    const customerReportData = {
                        guestId: guestId,
                        reason: customerReportRemarks,
                        transNo: transNo,
                        reportedBy: 'PM Staff'
                    };
                    
                    console.log('Submitting customer report with data:', customerReportData);
                    
                    const reportResponse = await fetch(`${API_BASE_URL}/report`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(customerReportData)
                    });
                    
                    if (!reportResponse.ok) {
                        throw new Error(`Customer Report API failed: ${reportResponse.status} ${reportResponse.statusText}`);
                    }
                    
                    console.log('Customer report submitted successfully');
                } else {
                    console.warn('No guestId available for customer report even after API fetch');
                    console.warn('Modal dataset contents:', modal ? Object.fromEntries(Object.entries(modal.dataset)) : 'MODAL_NOT_FOUND');
                }
            } catch (error) {
                console.error('Error submitting customer report:', error);
                // Continue with check-in process even if report fails
            }
        }
        
        // Call API to update booking status to "Checked-In"
        await updateBookingStatus(bookingId, 'Checked-In');
        
    } catch (error) {
        console.error('Error processing check-in confirmation:', error);
        alert('Error confirming check-in. Please try again.');
    }
}

// Function to process the check-in cancellation
async function processCheckinCancellation(bookingId) {
    console.log('Processing check-in cancellation for booking:', bookingId);

    if (!bookingId) {
        alert('Error: No booking ID provided for cancellation.');
        return;
    }

    try {
        // Check if customer report checkbox is active
        const includeCustomerReport = document.getElementById('include-customer-report-checkin')?.checked || false;
        const customerReportRemarks = includeCustomerReport ? (document.getElementById('input-customer-report-checkin')?.value || '') : '';
        
        // If customer report checkbox is active and remarks are provided, call the /report API
        if (includeCustomerReport && customerReportRemarks) {
            try {
                // Get guestId and transNo from modal dataset
                const modal = document.getElementById('checkinConfirmModal');
                let guestId = modal.dataset.guestId || '';
                let transNo = modal.dataset.transNo || '';
                
                console.log('Customer report data check (cancellation):', {
                    includeCustomerReport,
                    customerReportRemarks,
                    guestId: guestId || 'NOT_FOUND',
                    transNo: transNo || 'NOT_FOUND',
                    modalDataset: modal ? Object.fromEntries(Object.entries(modal.dataset)) : 'MODAL_NOT_FOUND'
                });
                
                // If guestId is missing, try to fetch it from the individual booking API
                if (!guestId && bookingId) {
                    console.log('GuestId missing, fetching from individual booking API...');
                    try {
                        const bookingResponse = await fetch(`${API_BASE_URL}/booking/${bookingId}`);
                        if (bookingResponse.ok) {
                            const bookingData = await bookingResponse.json();
                            if (bookingData.booking) {
                                guestId = bookingData.booking.guestId || '';
                                transNo = transNo || bookingData.booking.transNo || '';
                                console.log('Fetched from individual API:', { guestId, transNo });
                            }
                        }
                    } catch (fetchError) {
                        console.error('Error fetching individual booking data:', fetchError);
                    }
                }
                
                if (guestId) {
                    const customerReportData = {
                        guestId: guestId,
                        reason: customerReportRemarks,
                        transNo: transNo,
                        reportedBy: 'PM Staff'
                    };
                    
                    console.log('Submitting customer report with data (cancellation):', customerReportData);
                    
                    const reportResponse = await fetch(`${API_BASE_URL}/report`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(customerReportData)
                    });
                    
                    if (!reportResponse.ok) {
                        throw new Error(`Customer Report API failed: ${reportResponse.status} ${reportResponse.statusText}`);
                    }
                    
                    console.log('Customer report submitted successfully (cancellation)');
                } else {
                    console.warn('No guestId available for customer report');
                }
            } catch (error) {
                console.error('Error submitting customer report (cancellation):', error);
                // Continue with cancellation process even if report fails
            }
        }

        // Call API to update the booking status to "Cancel"
        const response = await fetch(`${API_BASE_URL}/booking/update-status/${bookingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'Cancel'
            })
        });

        if (!response.ok) {
            throw new Error(`Cancellation failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Booking cancelled successfully:', data);

        // Close the modal
        const modal = document.getElementById('checkinConfirmModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }

        alert(`✅ Check-in cancelled successfully!\n\nBooking ID: ${bookingId}`);
        loadTodaysCheckins(); // Refresh the data

    } catch (error) {
        console.error('Error during check-in cancellation:', error);
        alert(`Error cancelling check-in: ${error.message}`);
    }
}

// Function to check booking status via API
async function checkBookingStatus(bookingId, bookingElement) {
    try {
        console.log('Checking status for booking:', bookingId);
        
        const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Booking status response:', data);
        
        if (data.booking && data.booking.status === 'Checked-In') {
            // Update the booking element to show "Confirmed"
            updateBookingElementToConfirmed(bookingElement);
        }
        
    } catch (error) {
        console.error('Error checking booking status:', error);
        // Don't show error to user for status checks, just log it
    }
}

// Function to update booking status via PATCH API
async function updateBookingStatus(bookingId, newStatus) {
    try {
        console.log(`Updating booking ${bookingId} status to:`, newStatus);
        
        const response = await fetch(`${API_BASE_URL}/booking/update-status/${bookingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: newStatus
            })
        });
        
        if (!response.ok) {
            throw new Error(`Status update failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Status update response:', data);
        
        // Close the modal first
        const modal = document.getElementById('checkinConfirmModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
        
        // Show success message
        alert(`✅ Check-in confirmed successfully!\n\nBooking ID: ${bookingId}\nStatus: ${newStatus}\n\nNext steps:\n• Guest has been checked in\n• Payment processed\n• Room access provided`);
        
        // Refresh the check-in data after a short delay
        setTimeout(() => {
            window.loadTodaysCheckins();
        }, 1000);
        
    } catch (error) {
        console.error('Error updating booking status:', error);
        alert('Error updating booking status. Please try again.');
    }
}

// Function to update booking element to show confirmed status
function updateBookingElementToConfirmed(bookingElement) {
    const actionDiv = bookingElement.querySelector('.mt-3.md\\:mt-0');
    if (actionDiv) {
        // Get existing data attributes
        const existingButton = bookingElement.querySelector('[data-booking-id]');
        const bookingId = existingButton?.dataset.bookingId || '';
        const propertyName = existingButton?.dataset.propertyName || '';
        const guestName = existingButton?.dataset.guestName || '';
        const checkinDate = existingButton?.dataset.checkinDate || '';
        const checkinTime = existingButton?.dataset.checkinTime || '';
        
        actionDiv.innerHTML = `
            <div 
                data-modal-target="checkinConfirmModal"
                data-booking-id="${bookingId}"
                data-property-name="${propertyName}"
                data-guest-name="${guestName}"
                data-checkin-date="${checkinDate}"
                data-checkin-time="${checkinTime}"
                data-booking-status="Checked-In"
                class="!px-4 !py-2 w-full bg-green-600 font-manrope rounded-lg flex items-center justify-center cursor-pointer
                transition-all duration-300 ease-in-out active:scale-95">
                <div class="flex flex-col text-white">
                    <span class="text-sm font-semibold">Confirmed</span>
                    <span class="text-xs">Already Checked-In</span>
                </div>
            </div>
        `;
    }
}

// Main function to load today's check-ins (make globally accessible)
window.loadTodaysCheckins = async function() {
    try {
        console.log('Loading today\'s check-ins and check-outs...');
        
        // Show loading state
        showLoadingState();
        showCheckoutLoadingState();
        
        // Fetch data from API
        const checkinData = await fetchTodaysCheckins();
        
        // Populate both check-in and check-out tabs
        populateCheckinTab(checkinData);
        populateCheckoutTab(checkinData);
        
    } catch (error) {
        console.error('Error loading today\'s check-ins:', error);
        showErrorState();
        showCheckoutErrorState();
    }
}

// Function to show loading state
function showLoadingState() {
    const tabGroup = document.querySelector('[data-tab-group]');
    const checkinTabContent = tabGroup ? tabGroup.querySelector('.tab-content .space-y-4') : null;
    if (checkinTabContent) {
        checkinTabContent.innerHTML = `
            <div class="flex items-center justify-center h-40">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p class="text-neutral-500 font-medium">Loading check-ins...</p>
                    <button onclick="window.loadTodaysCheckins()" class="text-primary hover:underline text-sm mt-2">Refresh</button>
                </div>
            </div>
        `;
    }
}

// Function to show error state
function showErrorState() {
    const tabGroup = document.querySelector('[data-tab-group]');
    const checkinTabContent = tabGroup ? tabGroup.querySelector('.tab-content .space-y-4') : null;
    if (checkinTabContent) {
        checkinTabContent.innerHTML = `
            <div class="flex items-center justify-center h-40">
                <div class="text-center">
                    <svg class="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                    <p class="text-red-500 font-medium mb-2">Error loading check-ins</p>
                    <p class="text-sm text-neutral-500 mb-3">Check console for detailed error information</p>
                    <button onclick="window.loadTodaysCheckins()" class="text-primary hover:underline text-sm">Try again</button>
                </div>
            </div>
        `;
    }
}

// Function to show loading state for checkout tab
function showCheckoutLoadingState() {
    const checkoutTabContent = document.getElementById('checkout-tab-content');
    if (checkoutTabContent) {
        checkoutTabContent.innerHTML = `
            <div class="flex items-center justify-center h-40">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p class="text-neutral-500 font-medium">Loading check-outs...</p>
                </div>
            </div>
        `;
    }
}

// Function to show error state for checkout tab
function showCheckoutErrorState() {
    const checkoutTabContent = document.getElementById('checkout-tab-content');
    if (checkoutTabContent) {
        checkoutTabContent.innerHTML = `
            <div class="flex items-center justify-center h-40">
                <div class="text-center">
                    <svg class="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                    <p class="text-red-500 font-medium mb-2">Error loading check-outs</p>
                    <button onclick="window.loadTodaysCheckins()" class="text-primary hover:underline text-sm">Try again</button>
                </div>
            </div>
        `;
    }
}

// Function to initialize calendar date selection for booking display
function initializeCalendarBookings() {
    console.log('Initializing calendar booking functionality...');
    
    // Listen for calendar date clicks
    document.addEventListener('click', function(e) {
        const dateElement = e.target.closest('[data-date]');
        if (dateElement && !dateElement.classList.contains('cursor-not-allowed')) {
            const selectedDate = dateElement.dataset.date;
            console.log('Calendar date selected:', selectedDate);
            
            // Load bookings for the selected date
            loadBookingsByDate(selectedDate);
        }
        
        // Listen for booking card clicks to open view modal
        const bookingCard = e.target.closest('[data-modal-target="viewBookingModal"]');
        if (bookingCard) {
            console.log('Booking card clicked for modal');
            
            // Extract booking data from the card
            const bookingData = {
                bookingId: bookingCard.dataset.bookingId,
                propertyName: bookingCard.dataset.propertyName,
                propertyAddress: bookingCard.dataset.propertyAddress,
                guestName: bookingCard.dataset.guestName,
                checkInDate: bookingCard.dataset.checkinDate,
                checkOutDate: bookingCard.dataset.checkoutDate,
                checkInTime: bookingCard.dataset.checkinTime,
                checkOutTime: bookingCard.dataset.checkoutTime
            };
            
            // Populate and show the modal
            populateViewBookingModal(bookingData);
            
            // Manually open the modal
            const modal = document.getElementById('viewBookingModal');
            if (modal) {
                console.log('Opening viewBookingModal manually');
                modal.classList.remove('hidden');
                document.body.classList.add('modal-open');
            }
        }
    });
}

// Function to load bookings by date
async function loadBookingsByDate(selectedDate) {
    try {
        console.log('Loading bookings for date:', selectedDate);
        
        // Get property IDs from localStorage
        const propertyIds = await getPropertyIds();
        if (propertyIds.length === 0) {
            console.warn('No property IDs available');
            showCalendarBookingsError('No properties found in storage');
            return;
        }
        
        // Prepare API request body
        const requestBody = {
            checkIn: selectedDate,
            propertyIds: propertyIds
        };
        
        console.log('Calendar API request body:', requestBody);
        
        // Call the API
        const response = await fetch(`${API_BASE_URL}/pm/bookings/byDateAndProperties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }
        
        const bookingsData = await response.json();
        console.log('Calendar bookings data received:', bookingsData);
        
        // Populate the calendar booking display
        populateCalendarBookings(bookingsData, selectedDate);
        
    } catch (error) {
        console.error('Error loading bookings by date:', error);
        showCalendarBookingsError('Failed to load bookings for selected date');
    }
}

// Function to populate calendar bookings display
function populateCalendarBookings(bookingsData, selectedDate) {
    const calendarBookingsContainer = document.querySelector('.overflow-y-auto.space-y-4.rounded-lg.bg-neutral-200.p-5.h-\\[500px\\]');
    
    if (!calendarBookingsContainer) {
        console.error('Calendar bookings container not found');
        return;
    }
    
    // Clear existing content
    calendarBookingsContainer.innerHTML = '';
    
    if (!bookingsData || bookingsData.length === 0) {
        // Show no bookings message
        const noBookingsDiv = document.createElement('div');
        noBookingsDiv.className = 'w-full h-full flex justify-center items-center text-center text-sm font-manrope text-neutral-500';
        noBookingsDiv.innerHTML = `
            <div class="flex flex-col items-center">
                <svg class="w-12 h-12 text-neutral-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p>No bookings for this date</p>
            </div>
        `;
        calendarBookingsContainer.appendChild(noBookingsDiv);
        return;
    }
    
    // Create booking elements
    bookingsData.forEach(booking => {
        const bookingElement = createCalendarBookingElement(booking);
        calendarBookingsContainer.appendChild(bookingElement);
    });
    
    console.log(`Populated ${bookingsData.length} calendar bookings for ${selectedDate}`);
}

// Function to create a calendar booking element
function createCalendarBookingElement(booking) {
    const bookingDiv = document.createElement('div');
    bookingDiv.className = `rounded-lg cursor-pointer px-5 py-3 w-full h-fit flex flex-col md:flex-row justify-between gap-3 shadow-sm bg-white border border-neutral-200 group 
        hover:border-neutral-500 transition-all duration-500 ease-in-out overflow-hidden`;
    
    // Add data attributes for modal population
    bookingDiv.setAttribute('data-modal-target', 'viewBookingModal');
    bookingDiv.setAttribute('data-booking-id', booking.bookingId || booking._id || booking.id || '');
    bookingDiv.setAttribute('data-property-name', booking.nameOfProperty || booking.propertyName || booking.property?.name || 'Property Name');
    bookingDiv.setAttribute('data-property-address', booking.address || booking.property?.address || '123 Sunshine Street, Manila');
    bookingDiv.setAttribute('data-guest-name', booking.nameOfGuest || booking.guestName || booking.customerName || 'Guest Name');
    bookingDiv.setAttribute('data-checkin-date', booking.checkIn || '');
    bookingDiv.setAttribute('data-checkout-date', booking.checkOut || '');
    bookingDiv.setAttribute('data-checkin-time', booking.timeIn || formatTime(booking.checkInTime || '2:00 PM'));
    bookingDiv.setAttribute('data-checkout-time', booking.timeOut || formatTime(booking.checkOutTime || '11:00 AM'));
    
    // Extract data from the API response structure
    const propertyName = booking.nameOfProperty || booking.propertyName || booking.property?.name || booking.property?.title || 'Property Name';
    const guestName = booking.nameOfGuest || booking.guestName || booking.customerName || booking.customer?.name || 'Guest Name';
    const checkInDate = booking.checkIn || '';
    const checkOutDate = booking.checkOut || '';
    const checkInTime = booking.timeIn || formatTime(booking.checkInTime || booking.time || '12:00 PM');
    const checkOutTime = booking.timeOut || formatTime(booking.checkOutTime || '11:00 AM');
    const bookingId = booking.bookingId || booking._id || booking.id || '';
    const status = booking.status || 'Confirmed';
    
    // Format dates for display
    const checkInFormatted = formatDate(checkInDate);
    const checkOutFormatted = formatDate(checkOutDate);
    
    // Determine status color
    let statusColor = 'bg-green-100 text-green-800';
    if (status.toLowerCase().includes('pending')) {
        statusColor = 'bg-yellow-100 text-yellow-800';
    } else if (status.toLowerCase().includes('cancelled')) {
        statusColor = 'bg-red-100 text-red-800';
    }
    
    bookingDiv.innerHTML = `
        <div class="flex-1 flex flex-col">
            <!-- Property name -->
            <p class="font-manrope font-semibold text-lg truncate whitespace-nowrap max-w-full md:max-w-[220px]">
                ${propertyName}
            </p>
            
            <!-- Guest name -->
            <div class="flex gap-1.5 items-center text-xs text-neutral-500 overflow-hidden max-w-full md:max-w-[220px]">
                <svg class="h-3.5 fill-neutral-500 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <p class="truncate whitespace-nowrap">Guest: ${guestName}</p>
            </div>
            
            <!-- Dates and times -->
            <div class="text-xs text-neutral-500 mt-1 xl:mt-0">
                <span id="checkInDate">${checkInFormatted}</span> - 
                <span id="checkOutDate">${checkOutFormatted}</span>
            </div>
            
            <!-- Booking ID and Status -->
            <div class="flex items-center gap-2 mt-2">
                <span class="text-xs text-neutral-400 font-mono">ID: ${bookingId}</span>
                <span class="text-xs px-2 py-1 rounded-full ${statusColor} font-medium">${status}</span>
            </div>
        </div>
    `;
    
    return bookingDiv;
}

// Function to show calendar bookings error
function showCalendarBookingsError(message) {
    const calendarBookingsContainer = document.querySelector('.overflow-y-auto.space-y-4.rounded-lg.bg-neutral-200.p-5.h-\\[500px\\]');
    
    if (!calendarBookingsContainer) {
        console.error('Calendar bookings container not found');
        return;
    }
    
    calendarBookingsContainer.innerHTML = `
        <div class="w-full h-full flex justify-center items-center text-center text-sm font-manrope text-red-500">
            <div class="flex flex-col items-center">
                <svg class="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <p>${message}</p>
            </div>
        </div>
    `;
}

// Function to populate the view booking modal with booking data
function populateViewBookingModal(bookingData) {
    // Update property name and address
    const propertyNameElement = document.querySelector('#viewBookingModal .text-lg.font-bold');
    const propertyAddressElement = document.querySelector('#viewBookingModal .text-neutral-600');
    
    if (propertyNameElement) {
        propertyNameElement.textContent = bookingData.propertyName || 'Property Name';
    }
    if (propertyAddressElement) {
        propertyAddressElement.textContent = bookingData.propertyAddress || '123 Sunshine Street, Manila';
    }
    
    // Update guest name
    const guestNameElement = document.querySelector('#viewBookingModal .text-neutral-900.font-semibold');
    if (guestNameElement) {
        guestNameElement.textContent = bookingData.guestName || 'Guest Name';
    }
    
    // Update check-in date and time
    const checkInContainer = document.querySelector('#viewBookingModal .grid.grid-cols-2 > div:first-child .text-neutral-900');
    if (checkInContainer) {
        const checkInFormatted = formatDate(bookingData.checkInDate);
        checkInContainer.innerHTML = `<span>${checkInFormatted}</span> — <span>${bookingData.checkInTime || '2:00 PM'}</span>`;
    }
    
    // Update check-out date and time
    const checkOutContainer = document.querySelector('#viewBookingModal .grid.grid-cols-2 > div:last-child .text-neutral-900');
    if (checkOutContainer) {
        const checkOutFormatted = formatDate(bookingData.checkOutDate);
        checkOutContainer.innerHTML = `<span>${checkOutFormatted}</span> — <span>${bookingData.checkOutTime || '11:00 AM'}</span>`;
    }
    
    // Update the cancel booking button with the booking ID
    const cancelBookingBtn = document.querySelector('#viewBookingModal [data-modal-target="cancelBookingModal"]');
    if (cancelBookingBtn && bookingData.bookingId) {
        cancelBookingBtn.setAttribute('data-booking-id', bookingData.bookingId);
    }
}

// Function to check if a booking status should go to check-out tab
function isCheckoutStatus(status) {
    if (!status) return false; // Return false for undefined/null status
    
    const statusLower = status.toString().toLowerCase();
    
    // Check for exact status matches from validBookingStatuses
    if (statusLower === 'checked-out' || statusLower === 'completed' || statusLower === 'cancel') {
        return true;
    }
    
    // Check for partial matches
    if (statusLower.includes('checkout') || 
        statusLower.includes('checked-out') || 
        statusLower.includes('checked out') ||
        statusLower.includes('complete') ||
        statusLower.includes('finished') ||
        statusLower.includes('ended')) {
        return true;
    }
    
    return false;
}

// Function to check if a booking status should go to check-in tab
function isCheckinStatus(status) {
    if (!status) return false; // Return false for undefined/null status
    
    const statusLower = status.toString().toLowerCase();
    
    // Check for exact status matches from validBookingStatuses
    if (statusLower === 'pending payment' || statusLower === 'reserved' || statusLower === 'fully-paid' || statusLower === 'checked-in') {
        return true;
    }
    
    // Check for partial matches
    if (statusLower.includes('pending') || 
        statusLower.includes('reserved') || 
        statusLower.includes('confirmed') ||
        statusLower.includes('checked-in') ||
        statusLower.includes('checked in')) {
        return true;
    }
    
    return false;
}

// Function to check if a booking should be excluded due to missing status
function shouldExcludeBooking(item) {
    // If no status is available, we can't determine which tab it belongs to
    if (!item.status) {
        console.warn('Booking has no status, excluding from both tabs:', item);
        return true;
    }
    return false;
}

// Function to check if a booking's checkout date is today
function isCheckoutDateToday(checkOutDate) {
    if (!checkOutDate) return false;
    
    try {
        const today = new Date();
        const checkoutDate = new Date(checkOutDate);
        
        // Reset time to compare only dates
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const checkoutDateOnly = new Date(checkoutDate.getFullYear(), checkoutDate.getMonth(), checkoutDate.getDate());
        
        const isToday = todayDate.getTime() === checkoutDateOnly.getTime();
        console.log('Date comparison:', {
            today: todayDate.toISOString().split('T')[0],
            checkout: checkoutDateOnly.toISOString().split('T')[0],
            isToday: isToday
        });
        
        return isToday;
    } catch (error) {
        console.error('Error checking checkout date:', error);
        return false;
    }
}

// Function to enhance booking data with individual status checks
async function enhanceBookingDataWithStatus(bookings) {
    if (!Array.isArray(bookings)) return bookings;
    
    const enhancedBookings = [];
    
    for (const booking of bookings) {
        if (booking.message) continue;
        
        if (booking.status) {
            enhancedBookings.push(booking);
            continue;
        }
        
        const bookingId = booking.bookingId || booking._id;
        if (bookingId) {
            try {
                const statusResponse = await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    if (statusData.booking && statusData.booking.status) {
                        const enhancedBooking = { ...booking, status: statusData.booking.status };
                        enhancedBookings.push(enhancedBooking);
                        continue;
                    }
                }
            } catch (error) {
                console.error(`Error fetching status for booking ${bookingId}:`, error);
            }
        }
        
        const enhancedBooking = { ...booking, status: 'Unknown' };
        enhancedBookings.push(enhancedBooking);
    }
    
    return enhancedBookings;
}
