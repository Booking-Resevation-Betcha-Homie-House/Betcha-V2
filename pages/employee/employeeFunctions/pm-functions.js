

const API_BASE_URL = 'https://betcha-api.onrender.com';

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
}

document.addEventListener('DOMContentLoaded', function() {

    try {
        if (window.AuditTrailFunctions) {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.userId || userData.user_id || 'unknown';
            const userType = userData.role || 'employee';
            window.AuditTrailFunctions.logSystemAccess(userId, userType).catch(auditError => {
                console.error('Audit trail error:', auditError);
            });
        }
    } catch (auditError) {
        console.error('Audit trail error:', auditError);
    }

    initializePropertyMonitoringFeatures();
});

async function checkRolePrivileges() {
    try {
        const roleID = localStorage.getItem('roleID');
        if (!roleID) {
            console.warn('PM - No roleID found in localStorage');
            return;
        }

        const roleData = await fetchRolePrivileges(roleID);
        
        if (roleData && roleData.privileges) {

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

    const privilegeMap = {
        'TS': ['ts.html'], 
        'PSR': ['psr.html'], 
        'TK': ['tk.html'], 
        'PM': ['pm.html'] 
    };

    const sidebarLinks = document.querySelectorAll('#sidebar-dashboard, #sidebar-psr, #sidebar-ts, #sidebar-tk, #sidebar-pm');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');

        if (href === 'dashboard.html' || !href.includes('.html')) {
            return;
        }
        
        let hasAccess = false;

        privileges.forEach(privilege => {
            if (privilegeMap[privilege] && privilegeMap[privilege].includes(href)) {
                hasAccess = true;
            }
        });

        if (!hasAccess) {
            link.style.display = 'none';
        } else {
            
            link.style.display = 'flex';
        }
    });

    hideDashboardSections(privileges);

    if (privileges.includes('PM') && privileges.length === 1) {

        hideSpecificSidebarItems(['psr.html', 'tk.html', 'ts.html']);
    }

    if (!privileges.includes('PM')) {
        console.warn('PM - User does not have PM privilege, should not access this page');
        showAccessDeniedMessage();
    }

    const sidebarNav = document.querySelector('#sidebar nav');
    if (sidebarNav) {
        sidebarNav.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';
        sidebarNav.style.visibility = 'visible';
        sidebarNav.style.opacity = '1';
    }
}

window.filterSidebarByPrivileges = filterSidebarByPrivileges;

function hideDashboardSections(privileges) {

    const sectionPrivilegeMap = {
        'PSR-summary': ['PSR'], 
        'tickets': ['TK'], 
        'PM': ['PM'], 
        'transactions': ['TS'] 
    };

    Object.keys(sectionPrivilegeMap).forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (!section) {
            return;
        }
        
        const requiredPrivileges = sectionPrivilegeMap[sectionId];
        let hasAccess = false;

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

    try {
        if (window.AuditTrailFunctions) {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.userId || userData.user_id || 'unknown';
            const userType = userData.role || 'employee';
            window.AuditTrailFunctions.logUnauthorizedAccess(userId, userType).catch(auditError => {
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
                <button onclick="window.location.href='dashboard.html'" class="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(message);
}

function initializePropertyMonitoringFeatures() {

    setupPMTabSwitching();
    
    window.loadTodaysCheckins();

    checkDashboardRedirect();

    const endBookingConfirmBtn = document.querySelector('#checkoutModal .bg-primary');
    if (endBookingConfirmBtn) {
        endBookingConfirmBtn.addEventListener('click', handleEndBookingConfirm);
    }
    
    initializeCheckinConfirmationModal();
    initializePMCalendar(); 

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

                    const nearestCarrier = openCancelBtn.closest('[data-booking-id]');
                    if (nearestCarrier) {
                        if (!modal.dataset.bookingId) modal.dataset.bookingId = nearestCarrier.getAttribute('data-booking-id') || '';
                        if (!modal.dataset.transNo && nearestCarrier.getAttribute('data-trans-no')) modal.dataset.transNo = nearestCarrier.getAttribute('data-trans-no');
                        if (!modal.dataset.guestId && nearestCarrier.getAttribute('data-guest-id')) modal.dataset.guestId = nearestCarrier.getAttribute('data-guest-id');
                    }

                    const idToFetch = modal.dataset.bookingId || resolveBookingId(openCancelBtn);
                    if (!idToFetch) {

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

    document.addEventListener('click', function(e) {
        const sendBtn = e.target.closest('#send-cancel-notice-btn');
        if (sendBtn) {
            try { sendCancellationNoticeToAdmin(); } catch (_) {}
        }
    });
}

function setupPMTabSwitching() {

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length === 0 || tabContents.length === 0) {
        console.warn('PM - No tab buttons or content found');
        return;
    }

    setActivePMTab(0);

    tabButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            
            setActivePMTab(index);
        });
    });
    
}

function setActivePMTab(activeIndex) {

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach((button, index) => {
        const span = button.querySelector('span');
        if (index === activeIndex) {

            button.classList.add('bg-white', 'font-semibold', 'shadow');
            button.classList.remove('text-neutral-500');
            if (span) {
                span.classList.remove('text-neutral-500');
                span.classList.add('text-primary');
            }
            
        } else {

            button.classList.remove('bg-white', 'font-semibold', 'shadow');
            button.classList.add('text-neutral-500');
            if (span) {
                span.classList.remove('text-primary');
                span.classList.add('text-neutral-500');
            }
        }
    });

    tabContents.forEach((content, index) => {
        if (index === activeIndex) {

            content.classList.remove('hidden');
            
        } else {

            content.classList.add('hidden');
        }
    });

    if (activeIndex === 0) {

        if (typeof window.loadTodaysCheckins === 'function') {
            window.loadTodaysCheckins();
        }
    } else if (activeIndex === 1) {

        if (typeof window.loadTodaysCheckins === 'function') {
            window.loadTodaysCheckins();
        }
    }
    
}

function checkDashboardRedirect() {
    try {
        const shouldOpenModal = localStorage.getItem('openBookingModal');
        const selectedBooking = localStorage.getItem('selectedBooking');
        
        if (shouldOpenModal === 'true' && selectedBooking) {

            const booking = JSON.parse(selectedBooking);

            localStorage.removeItem('openBookingModal');
            localStorage.removeItem('redirectFromDashboard');
            localStorage.removeItem('selectedBooking');

            setTimeout(() => {
                openBookingModalFromDashboard(booking);
            }, 500); 
        }
    } catch (error) {
        console.error('Error checking dashboard redirect:', error);

        localStorage.removeItem('openBookingModal');
        localStorage.removeItem('redirectFromDashboard');
        localStorage.removeItem('selectedBooking');
    }
}

function openBookingModalFromDashboard(booking) {
    try {

        const modal = document.getElementById('checkinConfirmModal');
        if (!modal) {
            console.error('Check-in confirmation modal not found');
            return;
        }

        populateCheckinConfirmModal(
            booking.bookingId || booking._id || '',
            booking.nameOfProperty || booking.propertyName || 'Property',
            booking.nameOfGuest || booking.guestName || 'Guest',
            booking.checkIn || '',
            booking.timeIn || '1:00 PM',
            'Confirmed', 
            booking.guestId || '',
            booking.transNo || ''
        );

        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        
        console.log('Booking modal opened successfully from dashboard');
        
    } catch (error) {
        console.error('Error opening booking modal from dashboard:', error);
    }
}

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

function createCheckinBookingElement(booking) {
    const bookingDiv = document.createElement('div');
    bookingDiv.className = `flex flex-col md:flex-row md:items-center md:justify-between bg-neutral-50 border border-neutral-200 p-4 rounded-xl font-inter
        transition-all duration-300 ease-in-out hover:bg-neutral-100`;

    const checkInTime = booking.timeIn || formatTime(booking.checkInTime || booking.time || booking.checkIn);
    const guestName = booking.guestName || booking.nameOfGuest || booking.customerName || booking.customer?.name || 'Guest Name';
    const propertyName = booking.propertyName || booking.nameOfProperty || booking.property?.name || booking.property?.title || 'Property Name';
    const bookingId = booking._id || booking.bookingId || booking.id || '';
    const checkInDate = booking.checkIn || '';
    const checkOutDate = booking.checkOut || '';
    const status = booking.status || 'Reserved';

    let guestId = booking.guestId || booking.customer?.guestId || '';
    if (!guestId && bookingId) {

    }

    let transNo = booking.transNo || booking.reservation?.paymentNo || '';
    if (!transNo && bookingId) {

    }

    const checkInFormatted = formatDate(checkInDate);
    const checkOutFormatted = formatDate(checkOutDate);

    let actionContent = '';
    let statusColor = 'bg-blue-100 text-blue-800';

    const statusLower = status.toString().toLowerCase();
    if (statusLower.includes('checkout') || statusLower.includes('checked-out') || statusLower.includes('checked out') ||
        statusLower.includes('complete') || statusLower.includes('finished') || statusLower.includes('ended')) {

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

    if (!statusLower.includes('checked-in') && !statusLower.includes('checked in') && bookingId) {
        checkBookingStatus(bookingId, bookingDiv);
    }
    
    return bookingDiv;
}

function createCheckoutBookingElement(booking) {
    const bookingDiv = document.createElement('div');
    bookingDiv.className = `flex flex-col md:flex-row md:items-center md:justify-between bg-neutral-50 border border-neutral-200 p-4 rounded-xl font-inter
        transition-all duration-300 ease-in-out hover:bg-neutral-100`;

    const checkOutTime = booking.timeOut || formatTime(booking.checkOutTime || '11:00 AM');
    const guestName = booking.guestName || booking.nameOfGuest || booking.customerName || booking.customer?.name || 'Guest Name';
    const propertyName = booking.propertyName || booking.nameOfProperty || booking.property?.name || booking.property?.title || 'Property Name';
    const bookingId = booking._id || booking.bookingId || booking.id || '';
    const checkInDate = booking.checkIn || '';
    const checkOutDate = booking.checkOut || '';
    const status = booking.status || 'Checked-Out';
    const guestId = booking.guestId || '';
    const transNo = booking.transNo || '';

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

function openEndBookingModal(bookingId, propertyName, guestName, checkInDate, checkOutDate, guestId, transNo) {

    const modal = document.getElementById('checkoutModal');
    
    if (!modal) {
        console.error('End Booking modal not found');
        return;
    }

    const modalTitle = modal.querySelector('.text-xl.font-bold');
    
    if (modalTitle) {
        modalTitle.textContent = `End Booking - ${propertyName}`;
    }

    modal.dataset.bookingId = bookingId;
    modal.dataset.propertyName = propertyName;
    modal.dataset.guestName = guestName;
    modal.dataset.checkInDate = checkInDate;
    modal.dataset.checkOutDate = checkOutDate;
    modal.dataset.guestId = guestId || '';
    modal.dataset.transNo = transNo || '';

    try {
        const match = (window.lastCheckInData || []).find(b => (b.bookingId === bookingId || b._id === bookingId));
        if (match && match.propertyId) modal.dataset.propertyId = match.propertyId;
    } catch (_) {}

    (async () => {
        try {
            if (!modal.dataset.guestId || !modal.dataset.transNo || !modal.dataset.propertyId) {
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
            }
        } catch (e) {
            console.warn('Error backfilling booking details:', e);
        }
    })();

    initializeCustomerReportCheckbox();

    modal.classList.remove('hidden');
}

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

        if (includePropertyReport && propertyReportMessage) {

            const propertyId = modal.dataset.propertyId || (window.lastCheckInData?.find?.(b => (b.bookingId === bookingId || b._id === bookingId))?.propertyId) || '';
            
            if (!propertyId) {
                console.warn('Property ID not found; skipping property report creation');
            } else {

                const sender = `${localStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || ''}`.trim() || 'Unknown';

                const category = document.getElementById('select-property-report-category')?.value || 'Other';

                const status = 'Unsolved';

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

        try {
            const userId = localStorage.getItem('userId') || '';
            const userType = localStorage.getItem('role') || localStorage.getItem('userType') || '';
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logCheckOut === 'function' && userId) {
                window.AuditTrailFunctions.logCheckOut(userId, userType.charAt(0).toUpperCase() + userType.slice(1));
            }
        } catch (auditError) {
            console.warn('Audit trail for check-out failed:', auditError);
        }

        modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        console.log('End booking processed successfully');

        if (typeof loadTodaysCheckins === 'function') {
            loadTodaysCheckins();
        }

        console.log('✅ Booking checked out successfully.');
    } catch (error) {
        console.error('Error during end booking confirmation:', error);
    }
}

function initializeCustomerReportCheckbox() {

    const customerCheckbox = document.getElementById('include-customer-report');
    const customerReportSection = document.getElementById('customer-report-section');
    const customerReportTextarea = document.getElementById('input-customer-report');
    
    if (customerCheckbox && customerReportSection && customerReportTextarea) {

        const newCustomerCheckbox = customerCheckbox.cloneNode(true);
        customerCheckbox.parentNode.replaceChild(newCustomerCheckbox, customerCheckbox);

        newCustomerCheckbox.checked = false;
        customerReportSection.classList.add('hidden');
        customerReportTextarea.value = '';

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

    const propertyCheckbox = document.getElementById('include-property-report');
    const propertyReportSection = document.getElementById('property-report-section');
    const propertyReportTextarea = document.getElementById('input-property-report');
    
    if (propertyCheckbox && propertyReportSection && propertyReportTextarea) {

        const newPropertyCheckbox = propertyCheckbox.cloneNode(true);
        propertyCheckbox.parentNode.replaceChild(newPropertyCheckbox, propertyCheckbox);

        newPropertyCheckbox.checked = false;
        propertyReportSection.classList.add('hidden');
        propertyReportTextarea.value = '';

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

            populateCheckinConfirmModal(bookingId, propertyName, guestName, checkinDate, checkinTime, bookingStatus, guestId, transNo);

            const modal = document.getElementById('checkinConfirmModal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.classList.add('modal-open');

                modal.dataset.guestId = guestId;
                modal.dataset.transNo = transNo;
            } else {
                console.error('checkinConfirmModal not found in DOM');
            }

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

function populateCheckinConfirmModal(bookingId, propertyName, guestName, checkinDate, checkinTime, bookingStatus, guestId, transNo) {

    document.getElementById('confirm-property-name').textContent = propertyName || '--';
    document.getElementById('confirm-guest-name').textContent = guestName || '--';
    document.getElementById('confirm-checkin-date').textContent = checkinDate || '--';
    document.getElementById('confirm-checkin-time').textContent = checkinTime || '--';
    document.getElementById('confirm-booking-id').textContent = bookingId || '--';

    const modal = document.getElementById('checkinConfirmModal');
    if (modal) {
        modal.dataset.guestId = guestId || '';
        modal.dataset.transNo = transNo || '';
    }

    const confirmBtn = document.getElementById('confirm-checkin-btn');
    if (confirmBtn) {
        confirmBtn.dataset.currentBookingId = bookingId;

        if (bookingStatus === 'Checked-In') {

            confirmBtn.style.display = 'none';

            const modalTitle = document.querySelector('#checkinConfirmModal h2');
            if (modalTitle) {
                modalTitle.textContent = 'Booking Details';
            }

            const infoBox = document.querySelector('#checkinConfirmModal .bg-blue-50');
            if (infoBox) {
                infoBox.innerHTML = `
                    <p class="text-blue-800 text-sm">
                        <strong>Status:</strong> This guest has already been checked in and payment has been processed.
                    </p>
                `;
            }
        } else {

            confirmBtn.style.display = 'block';

            const modalTitle = document.querySelector('#checkinConfirmModal h2');
            if (modalTitle) {
                modalTitle.textContent = 'Confirm Check-in';
            }

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

async function processCheckinConfirmation(bookingId) {
    
    if (!bookingId) {
        console.error('No booking ID provided');
        return;
    }
    
    try {

        await updateBookingStatus(bookingId, 'Checked-In');

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

async function processCheckinCancellation(bookingId) {

    if (!bookingId) {
        console.error('No booking ID provided for cancellation.');
        return;
    }

    try {

        BookingContext.set({ bookingId });
        await BookingContext.hydrateFromBooking(bookingId);

        const checkinModal = document.getElementById('checkinConfirmModal');
        if (checkinModal) {
            checkinModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }

        const cancelModal = document.getElementById('cancelBookingModal');
        if (cancelModal) {

            cancelModal.dataset.bookingId = bookingId;
            const ctx = BookingContext.get();
            if (ctx.transNo) cancelModal.dataset.transNo = ctx.transNo;
            if (ctx.guestId) cancelModal.dataset.guestId = ctx.guestId;

            try { await loadAdminsIntoCancelModal(); } catch(_) {}

            cancelModal.classList.remove('hidden');
            document.body.classList.add('modal-open');
        } else {
            console.warn('cancelBookingModal not found');
        }

    } catch (error) {
        console.error('Error preparing cancellation request:', error);
    }
}

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

            updateBookingElementToConfirmed(bookingElement);
        }
        
    } catch (error) {
        console.error('Error checking booking status:', error);

    }
}

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

        const modal = document.getElementById('checkinConfirmModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }

        console.log(`✅ Check-in confirmed successfully! Booking ID: ${bookingId}, Status: ${newStatus}`);

        setTimeout(() => {
            window.loadTodaysCheckins();
        }, 1000);
        
    } catch (error) {
        console.error('Error updating booking status:', error);
        console.error('Error updating booking status. Please try again.');
    }
}

function updateBookingElementToConfirmed(bookingElement) {
    const actionDiv = bookingElement.querySelector('.mt-3.md\\:mt-0');
    if (actionDiv) {

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

async function loadAdminsIntoCancelModal() {
    try {
        const selectEl = document.getElementById('select-cancel-admin');
        if (!selectEl) return;

        if (!selectEl.dataset.loaded) {
            selectEl.innerHTML = `<option value="" disabled selected>Loading admins...</option>`;
            const resp = await fetch(`${API_BASE_URL}/admin/display`, { method: 'GET' });
            if (!resp.ok) throw new Error(`Failed to fetch admins: ${resp.status}`);
            const admins = await resp.json();

            selectEl.innerHTML = `<option value="" disabled selected>Select an admin</option>`;
            (admins || []).forEach(a => {
                const id = a._id || a.id || '';
                const name = [a.firstname, a.minitial, a.lastname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || 'Unnamed Admin';
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = name;
                selectEl.appendChild(opt);
            });

            selectEl.dataset.loaded = 'true';
        }
    } catch (err) {
        console.error('Error loading admins for cancel modal:', err);
        const selectEl = document.getElementById('select-cancel-admin');
        if (selectEl) {
            selectEl.innerHTML = `<option value="" disabled selected>Failed to load admins</option>`;
        }
    }
}

async function sendCancellationNoticeToAdmin() {
    try {

        const modal = document.getElementById('cancelBookingModal') || document.getElementById('checkinConfirmModal');
        const selectEl = document.getElementById('select-cancel-admin');
        const messageTextarea = document.getElementById('input-cancel-admin');
        if (!modal || !selectEl || !messageTextarea) { console.error('Missing fields.'); return; }

        const messageValue = (messageTextarea.value || '').trim();
        if (!messageValue) {
            try { if (window.showToastError) window.showToastError('warning', 'Cancellation reason required', 'Please add a message before sending the cancellation.'); } catch(_) {}
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
        const toId = selectEl.value;
        const toName = 'admin';
        if (!toId) { console.error('Please select an admin to notify.'); return; }

        const payload = {
            fromId,
            fromName,
            fromRole,
            toId,
            toName,
            toRole: 'admin',
            message: messageValue,
            transNo: ctx.transNo,
            numberEwalletBank: ctx.ewallet || undefined,
            amountRefund: ctx.amountRefund || undefined,
            modeOfRefund: ctx.modeOfRefund || undefined,
            reasonToGuest: messageValue,
            bookingId
        };
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

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

window.setActivePMTab = setActivePMTab;

window.loadTodaysCheckins = async function() {
    try {       

        showLoadingState();
        showCheckoutLoadingState();

        const checkinData = await fetchTodaysCheckins();

        populateCheckinTab(checkinData);
        populateCheckoutTab(checkinData);
        
    } catch (error) {
        console.error('Error loading today\'s check-ins:', error);
        showErrorState();
        showCheckoutErrorState();
    }
}

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

function initializeCalendarBookings() {

    document.addEventListener('click', function(e) {
        const dateElement = e.target.closest('[data-date]');
        if (dateElement) {
            const selectedDate = dateElement.dataset.date;

            loadBookingsByDate(selectedDate);
        }

        const bookingCard = e.target.closest('[data-modal-target="viewBookingModal"]');
        if (bookingCard) {

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

            populateViewBookingModal(bookingData);

            const modal = document.getElementById('viewBookingModal');
            if (modal) {
                
                modal.classList.remove('hidden');
                document.body.classList.add('modal-open');

                const cancelBtn = modal.querySelector('[data-modal-target="cancelBookingModal"]');
                if (cancelBtn) {

                    try {
                        if (bookingData.bookingId) localStorage.setItem('currentBookingId', bookingData.bookingId);
                        if (bookingData.transNo) localStorage.setItem('currentTransNo', bookingData.transNo);
                        if (bookingData.guestId) localStorage.setItem('currentGuestId', bookingData.guestId);
                    } catch(_) {}
                    if (bookingData.transNo) cancelBtn.setAttribute('data-trans-no', bookingData.transNo);
                    if (bookingData.guestId) cancelBtn.setAttribute('data-guest-id', bookingData.guestId);

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

function initializePMCalendar() {
    const calendarEl = document.querySelector('.calendar-instance');
    if (!calendarEl) return;

    fetchPMCalendarOverview();

    calendarEl.addEventListener('datesSelected', (e) => {
        const dates = Array.isArray(e.detail?.dates) ? e.detail.dates : [];
        if (dates.length > 0) {
            loadBookingsByDate(dates[dates.length - 1]);
        }
    });
}

async function fetchPMCalendarOverview() {
    try {

        const propertyIds = await getPropertyIds();
        if (propertyIds.length === 0) {
            console.warn('No property IDs available for calendar overview');
            return;
        }

        console.log('🔍 Fetching calendar data for property IDs:', propertyIds);

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

        updatePMCalendarWithDates(calendarData);

    } catch (error) {
        console.error('Error fetching PM calendar overview:', error);
    }
}

function updatePMCalendarWithDates(multiPropertyData) {
    if (!multiPropertyData || !multiPropertyData.calendar) {
        console.warn('❌ No calendar data provided');
        return;
    }

    let allBookedDates = [];
    let allMaintenanceDates = [];

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

    allBookedDates = [...new Set(allBookedDates)];
    allMaintenanceDates = [...new Set(allMaintenanceDates)];

    const allUnavailableDates = [...allBookedDates, ...allMaintenanceDates];

    if (typeof window !== 'undefined' && window.calendarUnavailableDates) {
        window.calendarUnavailableDates = allUnavailableDates;
    }

    const calendarInstance = document.querySelector('.calendar-instance');
    if (calendarInstance) {

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

    updatePMCalendarLegend(allBookedDates.length, allMaintenanceDates.length);
}

function updatePMCalendarLegend(bookedCount, maintenanceCount) {

    let legendContainer = document.querySelector('.pm-calendar-legend');
    
    if (!legendContainer) {

        const calendarContainer = document.querySelector('.calendar-instance').parentElement;
        
        if (calendarContainer) {
            legendContainer = document.createElement('div');
            legendContainer.className = 'pm-calendar-legend mt-4';
            legendContainer.innerHTML = `
                <div class="flex flex-col">
                    <div class="flex items-center justify-between mb-3">
                        <p class="text-lg font-manrope md:text-xl">Calendar legend</p>
                    </div>
                    <div class="flex gap-2 ml-3">
                        <div class="aspect-square h-5 bg-primary rounded shadow"></div>
                        <p class="font-inter text-primary-text pm-booked-legend">- Booked (0)</p>
                    </div>
                    <div class="flex gap-2 ml-3">
                        <div class="aspect-square h-5 bg-rose-700 rounded shadow"></div>
                        <p class="font-inter text-primary-text pm-maintenance-legend">- Maintenance (0)</p>
                    </div>
                </div>
            `;
            calendarContainer.appendChild(legendContainer);
        } else {
            console.warn('❌ Calendar container not found, cannot create legend');
        }
    }

    if (legendContainer) {
        const bookedLegend = legendContainer.querySelector('.pm-booked-legend');
        const maintenanceLegend = legendContainer.querySelector('.pm-maintenance-legend');
        
        if (bookedLegend) {
            bookedLegend.textContent = `- Booked (${bookedCount})`;
        }
        if (maintenanceLegend) {
            maintenanceLegend.textContent = `- Maintenance (${maintenanceCount})`;
        }
    } else {
        console.warn('❌ Legend container not available for update');
    }
}

async function loadBookingsByDate(selectedDate) {
    try {

        const propertyIds = await getPropertyIds();
        if (propertyIds.length === 0) {
            console.warn('No property IDs available');
            showCalendarBookingsError('No properties found in storage');
            return;
        }

        const requestBody = {
            checkIn: selectedDate,
            propertyIds: propertyIds
        };

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

        const enriched = await enrichAndFilterCalendarBookings(bookingsData);
        populateCalendarBookings(enriched, selectedDate);
        
    } catch (error) {
        console.error('Error loading bookings by date:', error);
        showCalendarBookingsError('Failed to load bookings for selected date');
    }
}

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

function populateCalendarBookings(bookingsData, selectedDate) {
    const calendarBookingsContainer = document.querySelector('.overflow-y-auto.space-y-4.rounded-lg.bg-neutral-200.p-5.h-\\[500px\\]');
    
    if (!calendarBookingsContainer) {
        console.error('Calendar bookings container not found');
        return;
    }

    calendarBookingsContainer.innerHTML = '';
    
    if (!bookingsData || bookingsData.length === 0) {

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

    bookingsData.forEach(booking => {
        const bookingElement = createCalendarBookingElement(booking);
        calendarBookingsContainer.appendChild(bookingElement);
    });

}

function createCalendarBookingElement(booking) {
    const bookingDiv = document.createElement('div');
    bookingDiv.className = `rounded-lg cursor-pointer px-5 py-3 w-full h-fit flex flex-col md:flex-row justify-between gap-3 shadow-sm bg-white border border-neutral-200 group 
        hover:border-neutral-500 transition-all duration-500 ease-in-out overflow-hidden`;

    bookingDiv.setAttribute('data-modal-target', 'viewBookingModal');
    bookingDiv.setAttribute('data-booking-id', booking.bookingId || booking._id || booking.id || '');
    bookingDiv.setAttribute('data-property-name', booking.nameOfProperty || booking.propertyName || booking.property?.name || 'Property Name');
    bookingDiv.setAttribute('data-property-address', booking.address || booking.property?.address || '123 Sunshine Street, Manila');
    bookingDiv.setAttribute('data-guest-name', booking.nameOfGuest || booking.guestName || booking.customerName || 'Guest Name');
    bookingDiv.setAttribute('data-checkin-date', booking.checkIn || '');
    bookingDiv.setAttribute('data-checkout-date', booking.checkOut || '');
    bookingDiv.setAttribute('data-checkin-time', booking.timeIn || formatTime(booking.checkInTime || '2:00 PM'));
    bookingDiv.setAttribute('data-checkout-time', booking.timeOut || formatTime(booking.checkOutTime || '11:00 AM'));

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

    const propertyName = booking.nameOfProperty || booking.propertyName || booking.property?.name || booking.property?.title || 'Property Name';
    const guestName = booking.nameOfGuest || booking.guestName || booking.customerName || booking.customer?.name || 'Guest Name';
    const checkInDate = booking.checkIn || '';
    const checkOutDate = booking.checkOut || '';
    const checkInTime = booking.timeIn || formatTime(booking.checkInTime || booking.time || '12:00 PM');
    const checkOutTime = booking.timeOut || formatTime(booking.checkOutTime || '11:00 AM');
    const bookingId = booking.bookingId || booking._id || booking.id || '';
    const status = booking.status || 'Reserved';

    const checkInFormatted = formatDate(checkInDate);
    const checkOutFormatted = formatDate(checkOutDate);

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

function populateViewBookingModal(bookingData) {

    const propertyNameElement = document.querySelector('#viewBookingModal .text-lg.font-bold');
    const propertyAddressElement = document.querySelector('#viewBookingModal .text-neutral-600');
    
    if (propertyNameElement) {
        propertyNameElement.textContent = bookingData.propertyName || 'Property Name';
    }
    if (propertyAddressElement) {
        propertyAddressElement.textContent = bookingData.propertyAddress || '123 Sunshine Street, Manila';
    }

    const guestNameElement = document.querySelector('#viewBookingModal .text-neutral-900.font-semibold');
    if (guestNameElement) {
        guestNameElement.textContent = bookingData.guestName || 'Guest Name';
    }

    const checkInContainer = document.querySelector('#viewBookingModal .grid.grid-cols-2 > div:first-child .text-neutral-900');
    if (checkInContainer) {
        const checkInFormatted = formatDate(bookingData.checkInDate);
        checkInContainer.innerHTML = `<span>${checkInFormatted}</span> — <span>${bookingData.checkInTime || '2:00 PM'}</span>`;
    }

    const checkOutContainer = document.querySelector('#viewBookingModal .grid.grid-cols-2 > div:last-child .text-neutral-900');
    if (checkOutContainer) {
        const checkOutFormatted = formatDate(bookingData.checkOutDate);
        checkOutContainer.innerHTML = `<span>${checkOutFormatted}</span> — <span>${bookingData.checkOutTime || '11:00 AM'}</span>`;
    }

    const cancelBookingBtn = document.querySelector('#viewBookingModal [data-modal-target="cancelBookingModal"]');
    if (cancelBookingBtn && bookingData.bookingId) {
        cancelBookingBtn.setAttribute('data-booking-id', bookingData.bookingId);
    }
}

function isCheckoutStatus(status) {
    if (!status) return false; 
    
    const statusLower = status.toString().toLowerCase();

    if (statusLower === 'checked-out' || statusLower === 'completed' || statusLower === 'cancel') {
        return true;
    }

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

function isCheckinStatus(status) {
    if (!status) return false; 
    
    const statusLower = status.toString().toLowerCase();

    if (statusLower === 'pending payment' || statusLower === 'reserved' || statusLower === 'fully-paid' || statusLower === 'checked-in') {
        return true;
    }

    if (statusLower.includes('pending') || 
        statusLower.includes('reserved') || 
        statusLower.includes('confirmed') ||
        statusLower.includes('checked-in') ||
        statusLower.includes('checked in')) {
        return true;
    }
    
    return false;
}

function shouldExcludeBooking(item) {

    if (!item.status) {
        console.warn('Booking has no status, excluding from both tabs:', item);
        return true;
    }
    return false;
}

function isCheckoutDateToday(checkOutDate) {
    if (!checkOutDate) return false;
    
    try {
        const today = new Date();
        const checkoutDate = new Date(checkOutDate);

        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const checkoutDateOnly = new Date(checkoutDate.getFullYear(), checkoutDate.getMonth(), checkoutDate.getDate());

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
