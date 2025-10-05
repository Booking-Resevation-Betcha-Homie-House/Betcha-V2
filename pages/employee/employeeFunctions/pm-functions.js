// PM Functions - Property Monitoring Management Functionality
// Get rid of the TS in the dashboard
// Get rid of the elemts in the Sidebar
//PM 90% done 
// Static data for the category for report "Disaster"
// Suppress console.log output within PM functions to keep console clean

const API_BASE_URL = 'https://betcha-api.onrender.com';

// ---- BookingContext: single source of truth for booking data ----
const BookingContext = {
    state: {
        bookingId: '',
        transNo: '',
        guestId: '',
        ewallet: '',
        amountRefund: 0,
        modeOfRefund: ''
    },
    set(partial) {
        this.state = { ...this.state, ...partial };
        try {
            if (partial.bookingId) localStorage.setItem('currentBookingId', partial.bookingId);
            if (partial.transNo) localStorage.setItem('currentTransNo', partial.transNo);
            if (partial.guestId) localStorage.setItem('currentGuestId', partial.guestId);
            if (typeof partial.amountRefund !== 'undefined') localStorage.setItem('amountRefund', String(partial.amountRefund || 0));
            if (partial.modeOfRefund) localStorage.setItem('modeOfRefund', partial.modeOfRefund);
            if (partial.ewallet) localStorage.setItem('ewalletNumber', partial.ewallet);
        } catch(_) {}
    },
    get() {
        const s = { ...this.state };
        // hydrate from storage if empty
        if (!s.bookingId) s.bookingId = localStorage.getItem('currentBookingId') || '';
        if (!s.transNo) s.transNo = localStorage.getItem('currentTransNo') || '';
        if (!s.guestId) s.guestId = localStorage.getItem('currentGuestId') || '';
        if (!s.ewallet) s.ewallet = localStorage.getItem('ewalletNumber') || '';
        if (!s.amountRefund) s.amountRefund = Number(localStorage.getItem('amountRefund') || 0);
        if (!s.modeOfRefund) s.modeOfRefund = localStorage.getItem('modeOfRefund') || '';
        return s;
    },
    async hydrateFromBooking(id) {
        if (!id) return this.get();
        try {
            const resp = await fetch(`${API_BASE_URL}/booking/${id}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
            if (!resp.ok) return this.get();
            const data = await resp.json();
            const b = data?.booking || {};
            this.set({
                bookingId: id,
                transNo: b.transNo || b?.reservation?.paymentNo || b?.package?.paymentNo || this.state.transNo,
                guestId: b.guestId || b?.guest?.id || this.state.guestId,
                ewallet: b?.reservation?.numberBankEwallets || b?.package?.numberBankEwallets || this.state.ewallet,
                amountRefund: typeof b.reservationFee !== 'undefined' ? (b.reservationFee || 0) : this.state.amountRefund,
                modeOfRefund: b?.reservation?.modeOfPayment || b?.package?.modeOfPayment || this.state.modeOfRefund
            });
        } catch(_) {}
        return this.get();
    }
};

// Resolve bookingId from common sources
function resolveBookingId(rootEl) {
    try {
        const fromDataset = rootEl?.dataset?.bookingId || '';
        if (fromDataset) return fromDataset;
        const nearest = rootEl?.closest?.('[data-booking-id]');
        if (nearest) return nearest.getAttribute('data-booking-id') || '';
        const viewBtn = document.querySelector('#viewBookingModal [data-modal-target="cancelBookingModal"]');
        if (viewBtn) return viewBtn.getAttribute('data-booking-id') || '';
        const ls = localStorage.getItem('currentBookingId') || localStorage.getItem('selectedBookingId');
        if (ls) return ls;
        const sel = localStorage.getItem('selectedBooking');
        if (sel) {
            try { const b = JSON.parse(sel); return b._id || b.bookingId || b.id || ''; } catch(_) {}
        }
        return '';
    } catch(_) { return ''; }
// ...existing code...
}
document.addEventListener('DOMContentLoaded', function() {
    // Log system access audit for property management page
    try {
        if (window.AuditTrailFunctions) {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.userId || userData.user_id || localStorage.getItem('userId') || localStorage.getItem('employeeId') || 'unknown';
            const userType = userData.role || localStorage.getItem('role') || 'employee';
            
            // Capitalize the user type for API compatibility
            const capitalizedUserType = userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();
            
            window.AuditTrailFunctions.logSystemAccess(userId, capitalizedUserType).catch(auditError => {
                console.error('Audit trail error:', auditError);
            });
        }
    } catch (auditError) {
        console.error('Audit trail error:', auditError);
    }
    
    // Note: checkRolePrivileges() will be called by universal skeleton after sidebar restoration
    initializePropertyMonitoringFeatures();
});

// Role Privilege Checking Functions
async function checkRolePrivileges() {
    try {
        const roleID = localStorage.getItem('roleID');
        if (!roleID) {
            console.warn('PM - No roleID found in localStorage');
            return;
        }

        // Fetch role privileges from API
        const roleData = await fetchRolePrivileges(roleID);
        
        if (roleData && roleData.privileges) {
            
            
            // Filter sidebar based on privileges
            filterSidebarByPrivileges(roleData.privileges);
        } else {
            console.error('PM - No privileges found in role data');
        }
    } catch (error) {
        console.error('PM - Error checking role privileges:', error);
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
        } else {
            console.error('PM - Failed to fetch role privileges:', response.status);
            return null;
        }
    } catch (error) {
        console.error('PM - Error fetching role privileges:', error);
        return null;
    }
}

function filterSidebarByPrivileges(privileges) {
    
    
    // Define what each privilege allows access to
    const privilegeMap = {
        'TS': ['ts.html'], // TS only has access to Transactions
        'PSR': ['psr.html'], // PSR has access to Property Summary Report
        'TK': ['tk.html'], // TK has access to Ticketing
        'PM': ['pm.html'] // PM has access to Property Monitoring
    };
    
    // Get ONLY sidebar navigation links using specific IDs
    const sidebarLinks = document.querySelectorAll('#sidebar-dashboard, #sidebar-psr, #sidebar-ts, #sidebar-tk, #sidebar-pm');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip dashboard link and non-management links
        if (href === 'dashboard.html' || !href.includes('.html')) {
            return;
        }
        
        let hasAccess = false;
        
        // Check if user has privilege for this link
        privileges.forEach(privilege => {
            if (privilegeMap[privilege] && privilegeMap[privilege].includes(href)) {
                hasAccess = true;
            }
        });
        
        // Hide the link if user doesn't have access
        if (!hasAccess) {
            link.style.display = 'none';
        } else {
            
            link.style.display = 'flex';
        }
    });
    
    // Hide content sections based on privileges
    hideDashboardSections(privileges);
    
    // Special handling for PM privilege - remove specific items if PM only
    if (privileges.includes('PM') && privileges.length === 1) {
        // PM only has access to Property Monitoring, hide others
        hideSpecificSidebarItems(['psr.html', 'tk.html', 'ts.html']);
    }
    
    // Check if current user should have access to this page
    if (!privileges.includes('PM')) {
        console.warn('PM - User does not have PM privilege, should not access this page');
        showAccessDeniedMessage();
    }
    
    // Show navigation after privilege filtering is complete
    const sidebarNav = document.querySelector('#sidebar nav');
    if (sidebarNav) {
        sidebarNav.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';
        sidebarNav.style.visibility = 'visible';
        sidebarNav.style.opacity = '1';
    }
}

// Export filterSidebarByPrivileges to global scope for universal skeleton
window.filterSidebarByPrivileges = filterSidebarByPrivileges;

function hideDashboardSections(privileges) {
    
    
    // Define content sections that should be hidden based on privileges
    const sectionPrivilegeMap = {
        'PSR-summary': ['PSR'], // PSR Summary section requires PSR privilege
        'tickets': ['TK'], // Tickets section requires TK privilege  
        'PM': ['PM'], // Property Monitoring section requires PM privilege
        'transactions': ['TS'] // Transactions section requires TS privilege
    };
    
    // Check each section
    Object.keys(sectionPrivilegeMap).forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (!section) {
            return;
        }
        
        const requiredPrivileges = sectionPrivilegeMap[sectionId];
        let hasAccess = false;
        
        // Check if user has any of the required privileges for this section
        privileges.forEach(privilege => {
            if (requiredPrivileges.includes(privilege)) {
                hasAccess = true;
            }
        });
        
        if (!hasAccess) {
            section.style.display = 'none';
        } else {
            
            section.style.display = 'block';
        }
    });
}

function hideSpecificSidebarItems(itemsToHide) {
    itemsToHide.forEach(href => {
        const link = document.querySelector(`nav a[href="${href}"]`);
        if (link) {
            link.style.display = 'none';
        }
    });
}

function showAccessDeniedMessage() {
    // Log unauthorized access attempt
    try {
        if (window.AuditTrailFunctions) {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.userId || userData.user_id || 'unknown';
            const userType = userData.role || 'employee';
            const capitalizedUserType = userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();
            window.AuditTrailFunctions.logUnauthorizedAccess(userId, capitalizedUserType).catch(auditError => {
                console.error('Audit trail error:', auditError);
            });
        }
    } catch (auditError) {
        console.error('Audit trail error:', auditError);
    }
    
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
                <button onclick="window.location.href='dashboard.html'" class="bg-primary text-secondary-text px-4 py-2 rounded hover:bg-primary/90">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(message);
}

// Additional PM-specific functions can be added here
function initializePropertyMonitoringFeatures() {
    console.log('🚀 Initializing Property Monitoring Features...');
    
    // Initialize PM-specific tab switching functionality
    setupPMTabSwitching();
    
    window.loadTodaysCheckins();
    
    // Check if we're coming from dashboard and should open a booking modal
    checkDashboardRedirect();
    
    // Note: Tab switching is now handled by setupPMTabSwitching() function
    // which properly manages the Check-in and Check-out tabs
    
    const endBookingConfirmBtn = document.querySelector('#checkoutModal .bg-primary');
    if (endBookingConfirmBtn) {
        endBookingConfirmBtn.addEventListener('click', handleEndBookingConfirm);
    }
    
    initializeCheckinConfirmationModal(); // Safe now - only sets up internal button listeners
    initializePMCalendar(); // Use PM-specific single-selection calendar

    // Load admins when cancel modal is opened
    document.addEventListener('click', function(e) {
        const openCancelBtn = e.target.closest('[data-modal-target="cancelBookingModal"]');
        if (openCancelBtn) {
            try { loadAdminsIntoCancelModal(); } catch (_) {}
            try {
                const modal = document.getElementById('cancelBookingModal');
                if (modal) {
                    const transNo = openCancelBtn.getAttribute('data-trans-no');
                    const guestId = openCancelBtn.getAttribute('data-guest-id');
                    const bookingId = openCancelBtn.getAttribute('data-booking-id');
                    if (transNo) modal.dataset.transNo = transNo;
                    if (guestId) modal.dataset.guestId = guestId;
                    if (bookingId) modal.dataset.bookingId = bookingId;
                    // New: derive missing identifiers from nearest card/container carrying data-booking-id
                    const nearestCarrier = openCancelBtn.closest('[data-booking-id]');
                    if (nearestCarrier) {
                        if (!modal.dataset.bookingId) modal.dataset.bookingId = nearestCarrier.getAttribute('data-booking-id') || '';
                        if (!modal.dataset.transNo && nearestCarrier.getAttribute('data-trans-no')) modal.dataset.transNo = nearestCarrier.getAttribute('data-trans-no');
                        if (!modal.dataset.guestId && nearestCarrier.getAttribute('data-guest-id')) modal.dataset.guestId = nearestCarrier.getAttribute('data-guest-id');
                    }

                    // Ensure we fetch booking context immediately when modal opens
                    const idToFetch = modal.dataset.bookingId || resolveBookingId(openCancelBtn);
                    if (!idToFetch) {
                        // Try localStorage fallbacks if opener/ancestor lacked bookingId
                        let lsId = localStorage.getItem('currentBookingId') || localStorage.getItem('selectedBookingId') || '';
                        if (!lsId) {
                            try {
                                const sb = localStorage.getItem('selectedBooking');
                                if (sb) {
                                    const b = JSON.parse(sb);
                                    lsId = b._id || b.bookingId || b.id || '';
                                }
                            } catch(_) {}
                        }
                        if (lsId) {
                            modal.dataset.bookingId = lsId;
                        }
                    }
                    const finalId = modal.dataset.bookingId || resolveBookingId(openCancelBtn) || '';
                    if (finalId) {
                        BookingContext.set({ bookingId: finalId });
                    } else {
                        console.warn('CancelModal: no bookingId available on open; cannot prepare context');
                    }
                    
                    // Always fetch full context using booking/{id} when modal opens
                    (async () => {
                        try {
                            const idToFetch = modal.dataset.bookingId || '';
                            if (idToFetch) {
                                const resp = await fetch(`${API_BASE_URL}/booking/${idToFetch}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
                                if (resp.ok) {
                                    const data = await resp.json();
                                    const b = data?.booking || {};
                                    const t = b.transNo || b?.reservation?.paymentNo || b?.package?.paymentNo || '';
                                    if (t) modal.dataset.transNo = modal.dataset.transNo || t;
                                    if (!modal.dataset.guestId && (b.guestId || b?.guest?.id)) {
                                        modal.dataset.guestId = b.guestId || b?.guest?.id;
                                    }
                                    const ew = b?.reservation?.numberBankEwallets || b?.package?.numberBankEwallets;
                                    if (ew) localStorage.setItem('ewalletNumber', ew.toString());
                                    if (typeof b.reservationFee !== 'undefined') localStorage.setItem('amountRefund', String(b.reservationFee || 0));
                                    const mode = b?.reservation?.modeOfPayment || b?.package?.modeOfPayment || '';
                                    if (mode) localStorage.setItem('modeOfRefund', mode);
                                    console.log('CancelModal: prepared context from booking API', {
                                        bookingId: idToFetch,
                                        transNo: modal.dataset.transNo || null,
                                        guestId: modal.dataset.guestId || null,
                                        ewallet: localStorage.getItem('ewalletNumber') || null,
                                        amountRefund: localStorage.getItem('amountRefund') || null,
                                        modeOfRefund: localStorage.getItem('modeOfRefund') || null
                                    });
                                }
                            }
                        } catch (e) {
                            console.warn('CancelModal: enrichment fetch failed', e);
                        }
                    })();
                }
            } catch (_) {}
        }
    });

    // Handle sending cancellation notice to selected admin
    document.addEventListener('click', function(e) {
        const sendBtn = e.target.closest('#send-cancel-notice-btn');
        if (sendBtn) {
            try { sendCancellationNoticeToAdmin(); } catch (_) {}
        }
    });
}

// PM-Specific Tab Switching Function
function setupPMTabSwitching() {
    console.log('📊 Setting up PM tab switching...');
    
    // Get all tab buttons and content containers
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log(`Found ${tabButtons.length} tab buttons and ${tabContents.length} tab contents`);
    
    if (tabButtons.length === 0 || tabContents.length === 0) {
        console.warn('PM - No tab buttons or content found');
        return;
    }
    
    
    
    // Set the first tab as active by default
    setActivePMTab(0);
    
    // Add click event listeners to all tab buttons
    tabButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            console.log(`🖱️ Tab ${index} clicked`);
            setActivePMTab(index);
        });
    });
    
}

// Function to set the active PM tab
function setActivePMTab(activeIndex) {
    
    
    // Get all tab buttons and content containers
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Update tab button styles
    tabButtons.forEach((button, index) => {
        const span = button.querySelector('span');
        if (index === activeIndex) {
            // Active tab styling
            button.classList.add('bg-white', 'font-semibold', 'shadow');
            button.classList.remove('text-neutral-500');
            if (span) {
                span.classList.remove('text-neutral-500');
                span.classList.add('text-primary');
            }
            
        } else {
            // Inactive tab styling
            button.classList.remove('bg-white', 'font-semibold', 'shadow');
            button.classList.add('text-neutral-500');
            if (span) {
                span.classList.remove('text-primary');
                span.classList.add('text-neutral-500');
            }
        }
    });
    
    // Show/hide tab content
    tabContents.forEach((content, index) => {
        if (index === activeIndex) {
            // Show active tab content
            content.classList.remove('hidden');
            
        } else {
            // Hide inactive tab content
            content.classList.add('hidden');
        }
    });
    
    // Load data for the active tab
    if (activeIndex === 0) {
        // Check-in tab - load check-in data
        
        if (typeof window.loadTodaysCheckins === 'function') {
            window.loadTodaysCheckins();
        }
    } else if (activeIndex === 1) {
        // Check-out tab - load check-out data
        
        if (typeof window.loadTodaysCheckins === 'function') {
            window.loadTodaysCheckins();
        }
    }
    
}

// Check if we should open a booking modal from dashboard redirect
function checkDashboardRedirect() {
    try {
        const shouldOpenModal = localStorage.getItem('openBookingModal');
        const selectedBooking = localStorage.getItem('selectedBooking');
        
        if (shouldOpenModal === 'true' && selectedBooking) {
            
            
            // Parse the booking data
            const booking = JSON.parse(selectedBooking);
            
            // Clear the flags
            localStorage.removeItem('openBookingModal');
            localStorage.removeItem('redirectFromDashboard');
            localStorage.removeItem('selectedBooking');
            
            // Open the check-in confirmation modal with the booking data
            setTimeout(() => {
                openBookingModalFromDashboard(booking);
            }, 500); // Small delay to ensure page is fully loaded
        }
    } catch (error) {
        console.error('Error checking dashboard redirect:', error);
        // Clear any corrupted data
        localStorage.removeItem('openBookingModal');
        localStorage.removeItem('redirectFromDashboard');
        localStorage.removeItem('selectedBooking');
    }
}

// Open booking modal from dashboard with booking data
function openBookingModalFromDashboard(booking) {
    try {
        
        
        // Get the modal element
        const modal = document.getElementById('checkinConfirmModal');
        if (!modal) {
            console.error('Check-in confirmation modal not found');
            return;
        }
        
        // Populate the modal with booking data
        populateCheckinConfirmModal(
            booking.bookingId || booking._id || '',
            booking.nameOfProperty || booking.propertyName || 'Property',
            booking.nameOfGuest || booking.guestName || 'Guest',
            booking.checkIn || '',
            booking.timeIn || '1:00 PM',
            'Confirmed', // Default status for dashboard bookings
            booking.guestId || '',
            booking.transNo || ''
        );
        
        // Open the modal
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        
        console.log('Booking modal opened successfully from dashboard');
        
    } catch (error) {
        console.error('Error opening booking modal from dashboard:', error);
    }
}

// Function to get property IDs from localStorage
async function getPropertyIds() {
    try {
        console.log('🏠 Getting property IDs from localStorage...');
        const propertiesData = localStorage.getItem('properties');
        console.log('💾 Raw properties data:', propertiesData);
        
        if (!propertiesData) {
            console.warn('⚠️ No properties data found in localStorage');
            return [];
        }
        
        const properties = JSON.parse(propertiesData);
        console.log('📋 Parsed properties:', properties);
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
        
        console.log('🏠 Final property IDs:', propertyIds);
        return propertyIds;
    } catch (error) {
        console.error('❌ Error getting property IDs:', error);
        return [];
    }
}

// Function to call the check-in API
async function fetchTodaysCheckins() {
    try {
        console.log('🔍 Fetching today\'s check-ins...');
        const propertyIds = await getPropertyIds();
        console.log('📍 Property IDs:', propertyIds);
        
        if (propertyIds.length === 0) {
            console.warn('⚠️ No property IDs found - user may need to assign properties');
            return null;
        }
        
        const requestBody = { propertyIds: propertyIds };
        console.log('📤 Request body:', requestBody);
        
        const response = await fetch(`${API_BASE_URL}/pm/bookings/checkinToday`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📡 API Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Raw API data:', data);
            const enhancedData = await enhanceBookingDataWithStatus(data);
            console.log('✨ Enhanced data:', enhancedData);
            window.lastCheckInData = enhancedData;
            return enhancedData;
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to fetch check-in data:', response.status, errorText);
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
        const checkinTabContent = document.getElementById('checkin-tab-content');
        
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
                
                const statusStr = (item.status || '').toString().toLowerCase();
                const isNotCheckedOut = !isCheckoutStatus(statusStr);
                const isNotPending = !(statusStr === 'pending' || statusStr.includes('pending'));
                return hasBookingFields && isNotCheckedOut && isNotPending;
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
                const isNotPending = !(status === 'pending' || status.includes('pending'));
                return hasBookingFields && isNotCheckedOut && isNotPending;
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
                const isNotPending = !(status === 'pending' || status.includes('pending'));
                return hasBookingFields && isNotCheckedOut && isNotPending;
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
                const statusStr = (item.status || '').toString().toLowerCase();
                const isNotCancelled = statusStr !== 'cancel' && statusStr !== 'cancelled';
                const isNotCheckedOut = !statusStr.includes('checked-out') && !statusStr.includes('checked out') && !statusStr.includes('completed');
                
                return hasBookingFields && isCheckoutToday && isNotCancelled && isNotCheckedOut;
            });
        } else if (checkoutData && checkoutData.bookings && Array.isArray(checkoutData.bookings)) {
            checkoutBookings = checkoutData.bookings.filter(item => {
                const hasBookingFields = item.bookingId || item._id || item.transNo ||
                                       (item.propertyName && item.guestName);
                const isCheckoutToday = isCheckoutDateToday(item.checkOut);
                const statusStr = (item.status || '').toString().toLowerCase();
                const isNotCancelled = statusStr !== 'cancel' && statusStr !== 'cancelled';
                const isNotCheckedOut = !statusStr.includes('checked-out') && !statusStr.includes('checked out') && !statusStr.includes('completed');
                
                if (shouldExcludeBooking(item)) return false;
                
                return hasBookingFields && isCheckoutToday && isNotCancelled && isNotCheckedOut;
            });
        } else if (checkoutData && checkoutData.data && Array.isArray(checkoutData.data)) {
            checkoutBookings = checkoutData.data.filter(item => {
                const hasBookingFields = item.bookingId || item._id || item.transNo ||
                                       (item.propertyName && item.guestName);
                const isCheckoutToday = isCheckoutDateToday(item.checkOut);
                const statusStr = (item.status || '').toString().toLowerCase();
                const isNotCancelled = statusStr !== 'cancel' && statusStr !== 'cancelled';
                const isNotCheckedOut = !statusStr.includes('checked-out') && !statusStr.includes('checked out') && !statusStr.includes('completed');
                
                if (shouldExcludeBooking(item)) return false;
                
                return hasBookingFields && isCheckoutToday && isNotCancelled && isNotCheckedOut;
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
    }
    
    // Enhanced transNo extraction
    let transNo = booking.transNo || booking.reservation?.paymentNo || '';
    if (!transNo && bookingId) {
        // Will fetch from individual API if needed
    }
    
    // Format dates for display
    const checkInFormatted = formatDate(checkInDate);
    let checkOutDatePlusOne = new Date(checkOutDate);
    checkOutDatePlusOne.setDate(checkOutDatePlusOne.getDate() + 1);
    const checkOutFormatted = formatDate(checkOutDatePlusOne);
    
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
                <div class="flex flex-col text-secondary-text">
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
                class="!px-4 !py-2 w-full bg-primary font-manrope rounded-lg cursor-pointer
                transition-all duration-300 ease-in-out active:scale-95">
                <div class="flex flex-col text-secondary-text">
                    <span class="text-sm text-center">Confirmed</span>
                    <span class="text-xs text-center">(Already Checked-In)</span>
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
                <div class="flex flex-col text-secondary-text">
                    <span class="text-sm text-center">Confirm</span>
                    <span class="text-xs text-center">(Check-in & Payment)</span>
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
    let checkOutDatePlusOne = new Date(checkOutDate);
    checkOutDatePlusOne.setDate(checkOutDatePlusOne.getDate() + 1);
    const checkOutFormatted = formatDate(checkOutDatePlusOne);
    
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
                <div class="flex flex-col text-secondary-text">
                    <span class="text-sm font-semibold">Check Out Today</span>
                    <span class="text-xs">Guest Scheduled</span>
                </div>
            </button>
        </div>
    `;
    
    return bookingDiv;
}

// Function to open the End Booking modal
async function openEndBookingModal(bookingId, propertyName, guestName, checkInDate, checkOutDate, guestId, transNo) {
    // Find the modal elements
    const modal = document.getElementById('checkoutModal');
    
    if (!modal) {
        console.error('End Booking modal not found');
        return;
    }
    
    // Show loading state first
    if (typeof showBookingModalLoading === 'function') {
        showBookingModalLoading(modal);
    }
    
    // Show the modal immediately with loading state
    modal.classList.remove('hidden');
    
    try {
        // Small delay to show loading state (improve UX)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set the modal content with booking details
        const modalTitle = modal.querySelector('.text-xl.font-bold');
        
        if (modalTitle) {
            modalTitle.textContent = `End Booking - ${propertyName}`;
        }
        
        // Store booking data for the confirm action
        modal.dataset.bookingId = bookingId;
        modal.dataset.propertyName = propertyName;
        modal.dataset.guestName = guestName;
        modal.dataset.checkInDate = checkInDate;
        modal.dataset.checkOutDate = checkOutDate;
        modal.dataset.guestId = guestId || '';
        modal.dataset.transNo = transNo || '';
        
        // Try to store propertyId if available from the latest cache
        try {
            const match = (window.lastCheckInData || []).find(b => (b.bookingId === bookingId || b._id === bookingId));
            if (match && match.propertyId) modal.dataset.propertyId = match.propertyId;
        } catch (_) {}

        // Backfill missing IDs by fetching booking details
        if (!modal.dataset.guestId || !modal.dataset.transNo || !modal.dataset.propertyId) {
            try {
                const resp = await fetch(`${API_BASE_URL}/booking/${bookingId}`);
                if (resp.ok) {
                    const payload = await resp.json();
                    const b = payload?.booking || {};
                    if (!modal.dataset.guestId && (b.guestId || b.guest?.id)) {
                        modal.dataset.guestId = b.guestId || b.guest?.id;
                    }
                    if (!modal.dataset.transNo && (b.transNo || b.reservation?.paymentNo || b.package?.paymentNo)) {
                        modal.dataset.transNo = b.transNo || b.reservation?.paymentNo || b.package?.paymentNo;
                    }
                    if (!modal.dataset.propertyId && b.propertyId) {
                        modal.dataset.propertyId = b.propertyId;
                    }
                } else {
                    console.warn('Failed to backfill booking details:', resp.status);
                }
            } catch (error) {
                console.error('Error fetching booking details:', error);
            }
        }
        
        // Initialize customer/property report checkbox functionality
        initializeCustomerReportCheckbox();
        
        // Hide loading state
        if (typeof hideBookingModalLoading === 'function') {
            hideBookingModalLoading(modal);
        }
        
    } catch (error) {
        console.error('Error opening checkout modal:', error);
        // Hide modal on error
        modal.classList.add('hidden');
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
                reportedBy: 'PM'
            };
            
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
        }
        
        // If property report checkbox is active, call the property report API
        if (includePropertyReport && propertyReportMessage) {
            // Resolve propertyId: from modal dataset or last loaded booking cache
            const propertyId = modal.dataset.propertyId || (window.lastCheckInData?.find?.(b => (b.bookingId === bookingId || b._id === bookingId))?.propertyId) || '';
            
            if (!propertyId) {
                console.warn('Property ID not found; skipping property report creation');
            } else {
                // Sender: from logged-in user's full name
                const sender = `${localStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || ''}`.trim() || 'Unknown';
                // Category: from dropdown
                const category = document.getElementById('select-property-report-category')?.value || 'Other';
                // Status: default for creation
                const status = 'Unsolved';
                // transNo: from modal dataset
                const transNoValue = transNo || modal.dataset.transNo || '';

                const propertyReportData = {
                    sender: sender,
                    category: category,
                    status: status,
                    date: new Date().toISOString(),
                    transNo: transNoValue,
                    message: propertyReportMessage
                };
                
                const propertyReportResponse = await fetch(`${API_BASE_URL}/property/${propertyId}/report`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(propertyReportData)
                });
                
                if (!propertyReportResponse.ok) {
                    throw new Error(`Property report API failed: ${propertyReportResponse.status} ${propertyReportResponse.statusText}`);
                }
            }
        }
        
        // Success path: perform checkout (update booking status)
        const checkoutResponse = await fetch(`${API_BASE_URL}/booking/update-status/${bookingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Checked-Out' })
        });
        
        if (!checkoutResponse.ok) {
            throw new Error(`Checkout failed: ${checkoutResponse.status} ${checkoutResponse.statusText}`);
        }
        
        const checkoutResult = await checkoutResponse.json();
        console.log('Checkout API success:', checkoutResult);
        
        // Audit: Log check-out activity
        try {
            const userId = localStorage.getItem('userId') || '';
            const userType = localStorage.getItem('role') || localStorage.getItem('userType') || '';
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logCheckOut === 'function' && userId) {
                window.AuditTrailFunctions.logCheckOut(userId, userType.charAt(0).toUpperCase() + userType.slice(1));
            }
        } catch (auditError) {
            console.warn('Audit trail for check-out failed:', auditError);
        }
        
        // Close modal and refresh
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        console.log('End booking processed successfully');
        
        // Refresh data to reflect changes
        if (typeof loadTodaysCheckins === 'function') {
            loadTodaysCheckins();
        }
        
        // Optional UX feedback
        console.log('✅ Booking checked out successfully.');
    } catch (error) {
        console.error('Error during end booking confirmation:', error);
    }
}

// Function to initialize customer/property report checkbox functionality
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

// Function to initialize the check-in confirmation modal button listeners only
// Note: Modal opening is now handled by modal.js, this just sets up internal button listeners
function initializeCheckinConfirmationModal() {
    // Set up event listeners for the confirm/cancel buttons inside the modal
    // This runs once on page load to set up the internal modal buttons
    const confirmBtn = document.getElementById('confirm-checkin-btn');
    const cancelBtn = document.getElementById('cancel-booking-btn');
    
    if (confirmBtn && !confirmBtn.hasAttribute('data-listener-attached')) {
        confirmBtn.setAttribute('data-listener-attached', 'true');
        confirmBtn.addEventListener('click', () => {
            const modal = document.getElementById('checkinConfirmModal');
            const bookingId = modal?.dataset?.bookingId;
            if (bookingId) {
                processCheckinConfirmation(bookingId);
            } else {
                console.error('No booking ID found in modal dataset');
            }
        });
    }
    
    if (cancelBtn && !cancelBtn.hasAttribute('data-listener-attached')) {
        cancelBtn.setAttribute('data-listener-attached', 'true');
        cancelBtn.addEventListener('click', () => {
            const modal = document.getElementById('checkinConfirmModal');
            const bookingId = modal?.dataset?.bookingId;
            if (bookingId) {
                processCheckinCancellation(bookingId);
            } else {
                console.error('No booking ID found in modal dataset for cancellation');
            }
        });
    }
}

// Function to populate the check-in confirmation modal
function populateCheckinConfirmModal(bookingId, propertyName, guestName, checkinDate, checkinTime, bookingStatus, guestId, transNo) {
    try {
        // Update modal content
        const propertyEl = document.getElementById('confirm-property-name');
        const guestEl = document.getElementById('confirm-guest-name');
        const dateEl = document.getElementById('confirm-checkin-date');
        const timeEl = document.getElementById('confirm-checkin-time');
        const bookingIdEl = document.getElementById('confirm-booking-id');
        
        if (propertyEl) propertyEl.textContent = propertyName || '--';
        if (guestEl) guestEl.textContent = guestName || '--';
        if (dateEl) dateEl.textContent = checkinDate || '--';
        if (timeEl) timeEl.textContent = checkinTime || '--';
        if (bookingIdEl) bookingIdEl.textContent = bookingId || '--';
        
        // Store all data in modal dataset for button listeners
        const modal = document.getElementById('checkinConfirmModal');
        if (modal) {
            modal.dataset.bookingId = bookingId || '';
            modal.dataset.guestId = guestId || '';
            modal.dataset.transNo = transNo || '';
            modal.dataset.propertyName = propertyName || '';
            modal.dataset.guestName = guestName || '';
        } else {
            console.error('checkinConfirmModal not found');
        }
    } catch (error) {
        console.error('Error populating checkin confirm modal:', error);
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
}

// Function to process the final check-in confirmation
async function processCheckinConfirmation(bookingId) {
    
    if (!bookingId) {
        console.error('No booking ID provided');
        return;
    }
    
    try {
        // Directly update booking status to "Checked-In" (customer report UI removed)
        await updateBookingStatus(bookingId, 'Checked-In');
        
        // Audit: Log check-in activity
        try {
            const userId = localStorage.getItem('userId') || '';
            const userType = localStorage.getItem('role') || localStorage.getItem('userType') || '';
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logCheckIn === 'function' && userId) {
                window.AuditTrailFunctions.logCheckIn(userId, userType.charAt(0).toUpperCase() + userType.slice(1));
            }
        } catch (auditError) {
            console.warn('Audit trail for check-in failed:', auditError);
        }
        
    } catch (error) {
        console.error('Error processing check-in confirmation:', error);
        console.error('Error confirming check-in. Please try again.');
    }
}

// Function to process the check-in cancellation
async function processCheckinCancellation(bookingId) {

    if (!bookingId) {
        console.error('No booking ID provided for cancellation.');
        return;
    }

    try {
        // Prepare context for cancellation request modal (admin approval flow)
        BookingContext.set({ bookingId });
        await BookingContext.hydrateFromBooking(bookingId);

        // Close the check-in confirm modal
        const checkinModal = document.getElementById('checkinConfirmModal');
        if (checkinModal) {
            checkinModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }

        // Log booking cancellation audit trail
        try {
            const userId = localStorage.getItem('userId');
            if (window.AuditTrailFunctions && userId) {
                window.AuditTrailFunctions.logBookingCancellation(userId, 'Employee');
            }
        } catch (auditError) {
            console.warn('Audit trail for booking cancellation failed:', auditError);
        }

        // Open the employee cancellation request modal
        const cancelModal = document.getElementById('cancelBookingModal');
        if (cancelModal) {
            // Attach booking context to modal dataset for downstream use
            cancelModal.dataset.bookingId = bookingId;
            const ctx = BookingContext.get();
            if (ctx.transNo) cancelModal.dataset.transNo = ctx.transNo;
            if (ctx.guestId) cancelModal.dataset.guestId = ctx.guestId;

            // Ensure admin list is loaded
            try { await loadAdminsIntoCancelModal(); } catch(_) {}

            // Show modal
            cancelModal.classList.remove('hidden');
            document.body.classList.add('modal-open');
        } else {
            console.warn('cancelBookingModal not found');
        }

    } catch (error) {
        console.error('Error preparing cancellation request:', error);
    }
}

// Function to check booking status via API
async function checkBookingStatus(bookingId, bookingElement) {
    try {
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
        
        // Close the modal first
        const modal = document.getElementById('checkinConfirmModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
        
        // Show success message
        console.log(`✅ Check-in confirmed successfully! Booking ID: ${bookingId}, Status: ${newStatus}`);
        
        // Refresh the check-in data after a short delay
        setTimeout(() => {
            window.loadTodaysCheckins();
        }, 1000);
        
    } catch (error) {
        console.error('Error updating booking status:', error);
        console.error('Error updating booking status. Please try again.');
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
                <div class="flex flex-col text-secondary-text">
                    <span class="text-sm font-semibold">Confirmed</span>
                    <span class="text-xs">Already Checked-In</span>
                </div>
            </div>
        `;
    }
}


// prepareCancelModalContext removed (redundant). Context is hydrated by the enrichment block and BookingContext.

// Build request and POST to notify cancellation endpoint

// Build request and POST to notify cancellation endpoint
async function sendCancellationNoticeToAdmin() {
    try {
        // Simplified context-driven path (early return)
        const modal = document.getElementById('cancelBookingModal') || document.getElementById('checkinConfirmModal');
        const reasonSelectEl = document.getElementById('select-cancel-reason');
        const messageTextarea = document.getElementById('input-cancel-admin');
        if (!modal || !reasonSelectEl || !messageTextarea) { console.error('Missing fields.'); return; }

        // Require a cancellation reason to be selected
        const reasonValue = reasonSelectEl.value;
        if (!reasonValue) {
            try { if (window.showToastError) window.showToastError('warning', 'Cancellation reason required', 'Please select a cancellation reason.'); } catch(_) {}
            reasonSelectEl.focus();
            return;
        }

        // Require a non-empty message before proceeding
        const messageValue = (messageTextarea.value || '').trim();
        if (!messageValue) {
            try { if (window.showToastError) window.showToastError('warning', 'Cancellation note required', 'Please add a message before sending the cancellation.'); } catch(_) {}
            messageTextarea.focus();
            return;
        }

        const bookingId = BookingContext.get().bookingId || resolveBookingId(modal);
        if (!bookingId) { console.error('Missing booking id. Open the booking card first.'); return; }
        const ctx = await BookingContext.hydrateFromBooking(bookingId);
        if (!ctx.transNo) { console.error('Missing transaction number. Open the booking card first.'); return; }

        const fromId = localStorage.getItem('employeeId') || localStorage.getItem('userId') || 'unknown-employee';
        const fromName = `${localStorage.getItem('firstName') || 'Employee'} ${localStorage.getItem('lastName') || ''}`.trim();
        const fromRole = 'employee';

        // Calculate refund amount based on who requested the cancellation
        let calculatedRefundAmount = undefined;
        try {
            const refundResponse = await fetch('https://betcha-api.onrender.com/booking/refund/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingId: bookingId,
                    refundType: reasonValue
                })
            });
            if (refundResponse.ok) {
                const refundData = await refundResponse.json();
                calculatedRefundAmount = refundData.refundAmount;
                console.log('✅ Refund amount calculated:', calculatedRefundAmount);
            } else {
                console.warn('Failed to calculate refund amount:', refundResponse.status);
            }
        } catch (error) {
            console.warn('Error calculating refund amount:', error);
        }

        const payload = {
            fromId,
            fromName,
            fromRole,
            message: messageValue,
            transNo: ctx.transNo,
            numberEwalletBank: ctx.ewallet || undefined,
            amountRefund: calculatedRefundAmount || ctx.amountRefund || undefined,
            modeOfRefund: ctx.modeOfRefund || undefined,
            reasonToGuest: messageValue,
            bookingId
        };
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

        // Check if notification service is available
        if (!window.notify || !window.notify.sendCancellation) {
            console.error('Notification service not available. Please refresh the page.');
            try { if (window.showToastError) window.showToastError('error', 'Service Error', 'Notification service not available. Please refresh the page.'); } catch(_) {}
            return;
        }

        await window.notify.sendCancellation(payload);
        console.log('✅ Cancellation notice sent to admin.');
        const cancelModal = document.getElementById('cancelBookingModal');
        if (cancelModal) { cancelModal.classList.add('hidden'); document.body.classList.remove('modal-open'); }
        return;
    } catch (err) {
        console.error('Error sending cancellation notice:', err);
        console.error(`Failed to send cancellation notice: ${err.message}`);
    }
}

// Make PM tab switching globally accessible for debugging
window.setActivePMTab = setActivePMTab;

// Main function to load today's check-ins (make globally accessible)
window.loadTodaysCheckins = async function() {
    console.log('📋 Loading today\'s check-ins...');
    try {       
        // Show loading state
        showLoadingState();
        showCheckoutLoadingState();
        
        // Fetch data from API
        const checkinData = await fetchTodaysCheckins();
        console.log('✅ Check-in data received:', checkinData);
        
        // Populate both check-in and check-out tabs
        populateCheckinTab(checkinData);
        populateCheckoutTab(checkinData);
        
    } catch (error) {
        console.error('❌ Error loading today\'s check-ins:', error);
        showErrorState();
        showCheckoutErrorState();
    }
}
// Function to show loading state
function showLoadingState() {
    const checkinTabContent = document.getElementById('checkin-tab-content');
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
    const checkinTabContent = document.getElementById('checkin-tab-content');
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
    
    
    // Listen for calendar date clicks
    document.addEventListener('click', function(e) {
        const dateElement = e.target.closest('[data-date]');
        if (dateElement) {
            const selectedDate = dateElement.dataset.date;
            
            
            // Load bookings for the selected date
            loadBookingsByDate(selectedDate);
        }
        
        // Listen for booking card clicks to open view modal
        const bookingCard = e.target.closest('[data-modal-target="viewBookingModal"]');
        if (bookingCard) {
            
            // Extract booking data from the card
            const bookingData = {
                bookingId: bookingCard.dataset.bookingId,
                propertyName: bookingCard.dataset.propertyName,
                propertyAddress: bookingCard.dataset.propertyAddress,
                guestName: bookingCard.dataset.guestName,
                checkInDate: bookingCard.dataset.checkinDate,
                checkOutDate: bookingCard.dataset.checkoutDate,
                checkInTime: bookingCard.dataset.checkinTime,
                checkOutTime: bookingCard.dataset.checkoutTime,
                guestId: bookingCard.dataset.guestId,
                transNo: bookingCard.dataset.transNo
            };
            
            
            // Populate and show the modal
            populateViewBookingModal(bookingData);
            
            // Manually open the modal
            const modal = document.getElementById('viewBookingModal');
            if (modal) {
                
                modal.classList.remove('hidden');
                document.body.classList.add('modal-open');
                // Attach for cancel flow
                const cancelBtn = modal.querySelector('[data-modal-target="cancelBookingModal"]');
                if (cancelBtn) {
                    // Persist booking context globally for downstream modals
                    try {
                        if (bookingData.bookingId) localStorage.setItem('currentBookingId', bookingData.bookingId);
                        if (bookingData.transNo) localStorage.setItem('currentTransNo', bookingData.transNo);
                        if (bookingData.guestId) localStorage.setItem('currentGuestId', bookingData.guestId);
                    } catch(_) {}
                    if (bookingData.transNo) cancelBtn.setAttribute('data-trans-no', bookingData.transNo);
                    if (bookingData.guestId) cancelBtn.setAttribute('data-guest-id', bookingData.guestId);
                    

                    // If details are missing, fetch from /booking/{id} before user opens cancel modal
                    (async () => {
                        try {
                            if (!cancelBtn.getAttribute('data-trans-no') || !cancelBtn.getAttribute('data-guest-id')) {
                                const id = bookingData.bookingId;
                                if (id) {
                                    const resp = await fetch(`${API_BASE_URL}/booking/${id}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
                                    if (resp.ok) {
                                        const data = await resp.json();
                                        const b = data?.booking || {};
                                        if (b.transNo || b?.reservation?.paymentNo || b?.package?.paymentNo) {
                                            const t = b.transNo || b?.reservation?.paymentNo || b?.package?.paymentNo;
                                            cancelBtn.setAttribute('data-trans-no', t);
                                        }
                                        if (b.guestId || b?.guest?.id) {
                                            cancelBtn.setAttribute('data-guest-id', b.guestId || b?.guest?.id);
                                        }
                                        // For completeness store ewallet
                                        if (b?.reservation?.numberBankEwallets || b?.package?.numberBankEwallets) {
                                            cancelBtn.setAttribute('data-ewallet', b?.reservation?.numberBankEwallets || b?.package?.numberBankEwallets);
                                        }
                                        
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn('ViewBooking: enrichment fetch failed', e);
                        }
                    })();
                }
            }
        }
    });
}

// PM-Specific Single-Selection Calendar Function
function initializePMCalendar() {
    console.log('📅 Initializing PM Calendar...');
    const calendarEl = document.querySelector('.calendar-instance');
    if (!calendarEl) {
        console.error('❌ Calendar element not found');
        return;
    }

    console.log('✅ Calendar element found, fetching overview data...');
    // Fetch and display calendar overview data
    fetchPMCalendarOverview();

    // Adapter: respond to calendar2.js selections
    calendarEl.addEventListener('datesSelected', (e) => {
        const dates = Array.isArray(e.detail?.dates) ? e.detail.dates : [];
        if (dates.length > 0) {
            loadBookingsByDate(dates[dates.length - 1]);
        }
    });

    // Clear booking cache when month changes
    const prevMonthBtn = calendarEl.querySelector('.prevMonth');
    const nextMonthBtn = calendarEl.querySelector('.nextMonth');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            // Clear cache on month navigation
            setTimeout(async () => {
                bookingsCache.data.clear();
                bookingsCache.month = null;
                bookingsCache.year = null;
                // Refetch calendar overview for new month
                await fetchPMCalendarOverview();
            }, 100); // Small delay to ensure calendar has updated
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            // Clear cache on month navigation
            setTimeout(async () => {
                bookingsCache.data.clear();
                bookingsCache.month = null;
                bookingsCache.year = null;
                // Refetch calendar overview for new month
                await fetchPMCalendarOverview();
            }, 100); // Small delay to ensure calendar has updated
        });
    }
}

// Function to fetch PM calendar overview data
async function fetchPMCalendarOverview() {
    try {
        // Get property IDs from localStorage
        const propertyIds = await getPropertyIds();
        if (propertyIds.length === 0) {
            console.warn('No property IDs available for calendar overview');
            return;
        }

        console.log('🔍 Fetching calendar data for property IDs:', propertyIds);

        // Call the calendar overview API
        const response = await fetch(`${API_BASE_URL}/calendar/byProperties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                propertyIds: propertyIds
            })
        });

        if (!response.ok) {
            throw new Error(`Calendar overview API failed: ${response.status} ${response.statusText}`);
        }

        const calendarData = await response.json();
        
        // Update calendar with visual indicators
        updatePMCalendarWithDates(calendarData);

        // Pre-load booking data for all dates in current month
        await preLoadCurrentMonthBookings();

    } catch (error) {
        console.error('Error fetching PM calendar overview:', error);
    }
}

// Function to update PM calendar with booking and maintenance dates
function updatePMCalendarWithDates(multiPropertyData) {
    if (!multiPropertyData || !multiPropertyData.calendar) {
        console.warn('❌ No calendar data provided');
        return;
    }

    // Aggregate all booked and maintenance dates across properties
    let allBookedDates = [];
    let allMaintenanceDates = [];

    // Process each property's calendar data
    multiPropertyData.calendar.forEach((propertyData, index) => {
        if (propertyData.booking && Array.isArray(propertyData.booking)) {
            const bookingDates = propertyData.booking.map(b => b.date);
            allBookedDates.push(...bookingDates);
        }
        
        if (propertyData.maintenance && Array.isArray(propertyData.maintenance)) {
            const maintenanceDates = propertyData.maintenance.map(m => m.date);
            allMaintenanceDates.push(...maintenanceDates);
        }
    });

    // Remove duplicates
    allBookedDates = [...new Set(allBookedDates)];
    allMaintenanceDates = [...new Set(allMaintenanceDates)];

    // Combine all unavailable dates
    const allUnavailableDates = [...allBookedDates, ...allMaintenanceDates];

    // Update the global unavailableDates array in calendar2.js
    if (typeof window !== 'undefined' && window.calendarUnavailableDates) {
        window.calendarUnavailableDates = allUnavailableDates;
    }

    // Force calendar re-render if it exists
    const calendarInstance = document.querySelector('.calendar-instance');
    if (calendarInstance) {
        // Trigger a custom event to force calendar re-render
        const event = new CustomEvent('calendarDataUpdated', {
            detail: {
                bookedDates: allBookedDates,
                maintenanceDates: allMaintenanceDates,
                allUnavailableDates: allUnavailableDates
            }
        });
        calendarInstance.dispatchEvent(event);
    } else {
        console.warn('❌ Calendar instance not found in DOM');
    }

    // Update the calendar legend with actual counts
    updatePMCalendarLegend(allBookedDates.length, allMaintenanceDates.length);
}

// Function to update PM calendar legend with actual counts
function updatePMCalendarLegend(bookedCount, maintenanceCount) {
    // Find existing legend container
    let legendContainer = document.querySelector('.pm-calendar-legend');
    
    if (!legendContainer) {
        console.warn('❌ Calendar legend container not found in DOM');
        return;
    }

    // Update legend text with counts
    const bookedLegend = legendContainer.querySelector('.pm-booked-legend');
    const maintenanceLegend = legendContainer.querySelector('.pm-maintenance-legend');
    
    if (bookedLegend) {
        bookedLegend.textContent = `- Booked (${bookedCount})`;
    }
    
    if (maintenanceLegend) {
        maintenanceLegend.textContent = `- Maintenance (${maintenanceCount})`;
    }
    
    console.log(`✅ Updated PM calendar legend: ${bookedCount} booked, ${maintenanceCount} maintenance`);
}

// Function to pre-load booking data for all dates in the current month
async function preLoadCurrentMonthBookings() {
    try {
        console.log('📅 Pre-loading booking data for current month...');
        
        // Get property IDs from localStorage
        const propertyIds = await getPropertyIds();
        if (propertyIds.length === 0) {
            console.warn('No property IDs available for pre-loading');
            return;
        }

        // Get current month's date range
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Clear and reset cache for current month
        bookingsCache.data.clear();
        bookingsCache.month = currentMonth;
        bookingsCache.year = currentYear;

        // Create array of all dates in current month
        const datesToFetch = [];
        for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
            datesToFetch.push(d.toISOString().split('T')[0]);
        }

        // Fetch bookings for all dates in parallel (with rate limiting)
        const batchSize = 5; // Process 5 dates at a time to avoid overwhelming the API
        for (let i = 0; i < datesToFetch.length; i += batchSize) {
            const batch = datesToFetch.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (dateStr) => {
                try {
                    const requestBody = {
                        checkIn: dateStr,
                        propertyIds: propertyIds
                    };
                    
                    const response = await fetch(`${API_BASE_URL}/pm/bookings/byDateAndProperties`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const bookings = Array.isArray(data) ? data : (data.bookings || data.data || []);
                        bookingsCache.data.set(dateStr, bookings);
                    } else {
                        bookingsCache.data.set(dateStr, []);
                    }
                } catch (err) {
                    console.warn(`Failed to pre-load bookings for ${dateStr}:`, err);
                    bookingsCache.data.set(dateStr, []);
                }
            }));

            // Small delay between batches to be gentle on the API
            if (i + batchSize < datesToFetch.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`📅 Successfully pre-loaded booking data for ${datesToFetch.length} dates`);
        
        // Auto-load bookings for today if it's in the current month
        const todayStr = today.toISOString().split('T')[0];
        if (datesToFetch.includes(todayStr)) {
            loadBookingsByDate(todayStr);
        }

    } catch (error) {
        console.error('Error pre-loading current month bookings:', error);
    }
}

// Cache for booking data to avoid repeated API calls
let bookingsCache = {
    data: new Map(), // Map of date string -> bookings array
    month: null,
    year: null
};

// Function to load bookings by date
async function loadBookingsByDate(selectedDate) {
    try {
        
        
        // Get property IDs from localStorage
        const propertyIds = await getPropertyIds();
        if (propertyIds.length === 0) {
            console.warn('No property IDs available');
            showCalendarBookingsError('No properties found in storage');
            return;
        }
        
        const selectedDateObj = new Date(selectedDate);
        const currentMonth = selectedDateObj.getMonth();
        const currentYear = selectedDateObj.getFullYear();
        
        // Clear cache if month changed
        if (bookingsCache.month !== currentMonth || bookingsCache.year !== currentYear) {
            bookingsCache.data.clear();
            bookingsCache.month = currentMonth;
            bookingsCache.year = currentYear;
        }
        
        // First, try to get direct bookings for this date from cache/API
        let directBookings = [];
        if (bookingsCache.data.has(selectedDate)) {
            directBookings = bookingsCache.data.get(selectedDate);
        } else {
            // Fetch bookings that start on this date
            const requestBody = {
                checkIn: selectedDate,
                propertyIds: propertyIds
            };
            
            try {
                const response = await fetch(`${API_BASE_URL}/pm/bookings/byDateAndProperties`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    directBookings = Array.isArray(data) ? data : (data.bookings || data.data || []);
                    bookingsCache.data.set(selectedDate, directBookings);
                }
            } catch (err) {
                console.warn(`Failed to fetch direct bookings for ${selectedDate}:`, err);
            }
        }
        
        // Now find bookings that span this date from cached data
        const spanningBookings = [];
        for (const [cachedDate, cachedBookings] of bookingsCache.data.entries()) {
            if (cachedDate !== selectedDate) {
                for (const booking of cachedBookings) {
                    const checkIn = booking.checkIn || booking.checkInDate;
                    const checkOut = booking.checkOut || booking.checkOutDate;
                    
                    if (checkIn && checkOut) {
                        const checkInDate = new Date(checkIn);
                        const checkOutDate = new Date(checkOut);
                        const selectedDateParsed = new Date(selectedDate);
                        
                        // Check if selected date falls within the booking period (inclusive of both check-in and check-out dates)
                        if (selectedDateParsed >= checkInDate && selectedDateParsed <= checkOutDate) {
                            // Avoid duplicates
                            const bookingId = booking._id || booking.bookingId || booking.id;
                            const isDuplicate = directBookings.some(db => {
                                const dbId = db._id || db.bookingId || db.id;
                                return dbId === bookingId;
                            });
                            
                            if (!isDuplicate) {
                                spanningBookings.push(booking);
                            }
                        }
                    }
                }
            }
        }
        
        // If we don't have enough cached data and no bookings found, fetch a broader range
        if (directBookings.length === 0 && spanningBookings.length === 0 && bookingsCache.data.size < 7) {
            await fetchNearbyDates(selectedDate, propertyIds);
            // Retry the spanning search after fetching more data
            for (const [cachedDate, cachedBookings] of bookingsCache.data.entries()) {
                if (cachedDate !== selectedDate) {
                    for (const booking of cachedBookings) {
                        const checkIn = booking.checkIn || booking.checkInDate;
                        const checkOut = booking.checkOut || booking.checkOutDate;
                        
                        if (checkIn && checkOut) {
                            const checkInDate = new Date(checkIn);
                            const checkOutDate = new Date(checkOut);
                            const selectedDateParsed = new Date(selectedDate);
                            
                            // Check if selected date falls within the booking period (inclusive of both check-in and check-out dates)
                            if (selectedDateParsed >= checkInDate && selectedDateParsed <= checkOutDate) {
                                const bookingId = booking._id || booking.bookingId || booking.id;
                                const isDuplicate = directBookings.some(db => {
                                    const dbId = db._id || db.bookingId || db.id;
                                    return dbId === bookingId;
                                }) || spanningBookings.some(sb => {
                                    const sbId = sb._id || sb.bookingId || sb.id;
                                    return sbId === bookingId;
                                });
                                
                                if (!isDuplicate) {
                                    spanningBookings.push(booking);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Combine direct and spanning bookings
        const allActiveBookings = [...directBookings, ...spanningBookings];
        
        // Populate the calendar booking display (enrich + filter cancellations)
        const enriched = await enrichAndFilterCalendarBookings(allActiveBookings);
        populateCalendarBookings(enriched, selectedDate);
        
    } catch (error) {
        console.error('Error loading bookings by date:', error);
        showCalendarBookingsError('Failed to load bookings for selected date');
    }
}

// Function to fetch bookings for nearby dates (7 days before and after)
async function fetchNearbyDates(selectedDate, propertyIds) {
    const selectedDateObj = new Date(selectedDate);
    const promises = [];
    
    // Fetch 7 days before and after the selected date
    for (let i = -7; i <= 7; i++) {
        const dateObj = new Date(selectedDateObj);
        dateObj.setDate(selectedDateObj.getDate() + i);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        if (!bookingsCache.data.has(dateStr)) {
            const promise = (async () => {
                try {
                    const requestBody = {
                        checkIn: dateStr,
                        propertyIds: propertyIds
                    };
                    
                    const response = await fetch(`${API_BASE_URL}/pm/bookings/byDateAndProperties`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const bookings = Array.isArray(data) ? data : (data.bookings || data.data || []);
                        bookingsCache.data.set(dateStr, bookings);
                    } else {
                        bookingsCache.data.set(dateStr, []);
                    }
                } catch (err) {
                    console.warn(`Failed to fetch bookings for ${dateStr}:`, err);
                    bookingsCache.data.set(dateStr, []);
                }
            })();
            promises.push(promise);
        }
    }
    
    await Promise.all(promises);
}

// Enrich bookings with full status/transNo and filter out cancelled
async function enrichAndFilterCalendarBookings(raw) {
    try {
        if (!raw || raw.length === 0) return [];
        const items = Array.isArray(raw) ? raw : (raw.bookings || raw.data || []);
        const results = await Promise.all(items.map(async (b) => {
            const id = b?._id || b?.bookingId || b?.id;
            if (!id) return null;
            try {
                const resp = await fetch(`${API_BASE_URL}/booking/${id}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
                if (!resp.ok) return null;
                const data = await resp.json();
                const full = data?.booking || {};
                const status = String(full.status || b.status || '').toLowerCase();
                if (status === 'cancel' || status === 'cancelled') return null;
                return {
                    ...b,
                    status: full.status || b.status,
                    transNo: full.transNo || b.transNo || b?.reservation?.paymentNo || b?.package?.paymentNo,
                    guestId: full.guestId || b.guestId
                };
            } catch (_) {
                return null;
            }
        }));
        return results.filter(Boolean);
    } catch (_) {
        return [];
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
    // Propagate ids for downstream modals
    if (booking.guestId || booking.guest?.id) {
        bookingDiv.setAttribute('data-guest-id', booking.guestId || booking.guest?.id);
    }
    if (booking.transNo || booking.reservation?.paymentNo || booking.package?.paymentNo) {
        bookingDiv.setAttribute('data-trans-no', booking.transNo || booking.reservation?.paymentNo || booking.package?.paymentNo);
    }
    console.log('CalendarCard dataset:', {
        bookingId: bookingDiv.getAttribute('data-booking-id'),
        guestId: bookingDiv.getAttribute('data-guest-id') || 'N/A',
        transNo: bookingDiv.getAttribute('data-trans-no') || 'N/A'
    });
    
    // Persist core identifiers on card click so downstream modals can recover context
    bookingDiv.addEventListener('click', () => {
        try {
            const id = bookingDiv.getAttribute('data-booking-id') || '';
            const t = bookingDiv.getAttribute('data-trans-no') || '';
            const g = bookingDiv.getAttribute('data-guest-id') || '';
            if (id) localStorage.setItem('currentBookingId', id);
            if (t) localStorage.setItem('currentTransNo', t);
            if (g) localStorage.setItem('currentGuestId', g);
            console.log('CalendarCard: persisted context', { id, t, g });
        } catch(_) {}
    });
    
    // Extract data from the API response structure
    const propertyName = booking.nameOfProperty || booking.propertyName || booking.property?.name || booking.property?.title || 'Property Name';
    const guestName = booking.nameOfGuest || booking.guestName || booking.customerName || booking.customer?.name || 'Guest Name';
    const checkInDate = booking.checkIn || '';
    const checkOutDate = booking.checkOut || '';
    const checkInTime = booking.timeIn || formatTime(booking.checkInTime || booking.time || '12:00 PM');
    const checkOutTime = booking.timeOut || formatTime(booking.checkOutTime || '11:00 AM');
    const bookingId = booking.bookingId || booking._id || booking.id || '';
    const status = booking.status || 'Reserved';
    
    // Format dates for display
    const checkInFormatted = formatDate(checkInDate);
    let checkOutDatePlusOne = new Date(checkOutDate);
    checkOutDatePlusOne.setDate(checkOutDatePlusOne.getDate() + 1);
    const checkOutFormatted = formatDate(checkOutDatePlusOne);
    
    // Determine status color
    let statusColor = 'bg-green-100 text-green-800';
    if (status.toLowerCase().includes('pending')) {
        statusColor = 'bg-yellow-100 text-yellow-800';
    } else if (status.toLowerCase().includes('cancel') || status.toLowerCase().includes('cancelled')) {
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
            
            <!-- Removed ID and status badge per design request -->
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

// Function to show loading state in booking modal
function showBookingModalLoading(modal) {
    // For checkin and checkout modals, use overlay instead of replacing content
    if (modal.id === 'checkinConfirmModal' || modal.id === 'checkoutModal') {
        showOverlayModalLoading(modal);
        return;
    }
    
    // Find the modal content area and replace with loading state
    const modalContent = modal.querySelector('.space-y-5');
    if (modalContent) {
        modalContent.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="flex flex-col items-center space-y-3">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p class="text-sm text-neutral-500">Loading booking details...</p>
                </div>
            </div>
        `;
    }
}

// Function to show loading state with overlay (for modals with forms/specific structure)
function showOverlayModalLoading(modal) {
    // Create an overlay instead of replacing content
    const existingOverlay = modal.querySelector('.loading-overlay');
    if (existingOverlay) return; // Already showing
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay absolute inset-0 bg-white/80 flex items-center justify-center z-10';
    overlay.innerHTML = `
        <div class="flex flex-col items-center space-y-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p class="text-sm text-neutral-500">Loading booking details...</p>
        </div>
    `;
    
    const modalContent = modal.querySelector('.modal-animate') || modal.querySelector('.bg-background');
    if (modalContent) {
        modalContent.style.position = 'relative';
        modalContent.appendChild(overlay);
    }
}

// Function to show loading state for checkin modal (overlay approach)
function showCheckinModalLoading(modal) {
    // This is now handled by showOverlayModalLoading
    showOverlayModalLoading(modal);
}

// Function to hide loading state in booking modal
function hideBookingModalLoading(modal) {
    // For checkin and checkout modals, remove overlay
    if (modal.id === 'checkinConfirmModal' || modal.id === 'checkoutModal') {
        hideOverlayModalLoading(modal);
        return;
    }
    
    // The loading state will be replaced by populateViewBookingModal
    // This function exists for consistency and future enhancements
}

// Function to hide loading state for overlay modals
function hideOverlayModalLoading(modal) {
    const overlay = modal.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Function to hide loading state for checkin modal
function hideCheckinModalLoading(modal) {
    // This is now handled by hideOverlayModalLoading
    hideOverlayModalLoading(modal);
}

// Function to populate the view booking modal with booking data
function populateViewBookingModal(bookingData) {
    const modal = document.getElementById('viewBookingModal');
    if (!modal) return;
    
    // Find the modal content container
    const modalContent = modal.querySelector('.space-y-5');
    if (!modalContent) return;
    
    // Extract and prepare data
    const propertyName = bookingData.propertyName || bookingData.nameOfProperty || 'Property Name';
    const propertyAddress = bookingData.propertyAddress || bookingData.address || '123 Sunshine Street, Manila';
    const guestName = bookingData.guestName || bookingData.nameOfGuest || bookingData.customerName || 'Guest Name';
    const checkInFormatted = formatDate(bookingData.checkInDate || bookingData.checkIn);
    let checkOutDatePlusOne = new Date(bookingData.checkOutDate || bookingData.checkOut);
    checkOutDatePlusOne.setDate(checkOutDatePlusOne.getDate() + 1);
    const checkOutFormatted = formatDate(checkOutDatePlusOne);
    const checkInTime = bookingData.checkInTime || bookingData.timeIn || '2:00 PM';
    const checkOutTime = bookingData.checkOutTime || bookingData.timeOut || '11:00 AM';
    const bookingId = bookingData.bookingId || bookingData._id || bookingData.id || '';
    
    // Rebuild the modal content
    modalContent.innerHTML = `
        <!-- Property Name -->
        <div>
            <h3 class="text-lg font-bold font-manrope text-primary-text">${propertyName}</h3>
            <p class="text-neutral-600 text-sm">${propertyAddress}</p>
        </div>

        <!-- Divider -->
        <hr class="border-neutral-100">

        <!-- Guest Info -->
        <div>
            <p class="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1">Guest Information</p>
            <p class="text-neutral-900 font-semibold">${guestName}</p>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
            <div>
                <p class="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1">Check-in</p>
                <p class="text-neutral-900">${checkInFormatted} — ${checkInTime}</p>
            </div>
            <div>
                <p class="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1">Check-out</p>
                <p class="text-neutral-900">${checkOutFormatted} — ${checkOutTime}</p>
            </div>
        </div>
    `;
    
    // Update the cancel booking button with the booking ID
    const cancelBookingBtn = modal.querySelector('[data-modal-target="cancelBookingModal"]');
    if (cancelBookingBtn && bookingId) {
        cancelBookingBtn.setAttribute('data-booking-id', bookingId);
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
        
        // Business rule: show in checkout tab on the day AFTER actual checkout date
        const showDate = new Date(checkoutDateOnly);
        showDate.setDate(showDate.getDate() + 1);
        
        const isToday = todayDate.getTime() === showDate.getTime();
        console.log('Date comparison:', {
            today: todayDate.toISOString().split('T')[0],
            checkout: checkoutDateOnly.toISOString().split('T')[0],
            showDatePlusOne: showDate.toISOString().split('T')[0],
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

// Utility: format a date string or Date into 'Mon DD, YYYY'
function formatDate(dateInput) {
    try {
        const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        console.error('formatDate error for input:', dateInput, e);
        return '';
    }
}
