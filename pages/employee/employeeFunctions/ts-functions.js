// TS Functions - Transaction Specialist Management Functionality
console.log('TS Functions loaded');

// API Base URL
const API_BASE_URL = 'https://betcha-api.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    console.log('TS Functions - DOM Content Loaded');
    
    // Note: checkRolePrivileges() will be called by universal skeleton after sidebar restoration
    
    // Initialize transaction functionality
    initializeTransactionFeatures();
    
    // Check if we're coming from dashboard and should open a transaction modal
    checkDashboardRedirect();
});

// Check if we should open a transaction modal from dashboard redirect
function checkDashboardRedirect() {
    try {
        const shouldOpenModal = localStorage.getItem('openTransactionModal');
        const selectedTransaction = localStorage.getItem('selectedTransaction');
        
        if (shouldOpenModal === 'true' && selectedTransaction) {
            console.log('Dashboard redirect detected, opening transaction modal...');
            
            // Parse the transaction data
            const transaction = JSON.parse(selectedTransaction);
            
            // Clear the flags
            localStorage.removeItem('openTransactionModal');
            localStorage.removeItem('redirectFromDashboard');
            
            // Wait a bit for the page to fully load, then open the modal
            setTimeout(() => {
                openTransactionModal(transaction, true); // Skip API call since we have transaction data
            }, 500);
        }
    } catch (error) {
        console.error('Error checking dashboard redirect:', error);
        // Clear flags on error
        localStorage.removeItem('openTransactionModal');
        localStorage.removeItem('redirectFromDashboard');
    }
}

// Initialize Transaction Features
async function initializeTransactionFeatures() {
    try {
        console.log('Initializing transaction features...');
        
        // Load transaction data on page load
        await loadTransactionData();
        
        // Set up tab switching functionality
        setupTabSwitching();
        
    } catch (error) {
        console.error('Error initializing transaction features:', error);
    }
}

// Load Transaction Data from API
async function loadTransactionData() {
    try {
        console.log('Loading transaction data...');
        
        // Get property IDs from localStorage
        const propertyIds = getPropertyIdsFromStorage();
        
        if (!propertyIds || propertyIds.length === 0) {
            console.warn('No property IDs found in localStorage. Creating test property for demo.');
            // For testing purposes, use the sample property ID from the API documentation
            const testPropertyIds = ["685c32000741b89b5f2c97b9"];
            
            // Save test property to localStorage for future use
            localStorage.setItem('properties', JSON.stringify(testPropertyIds));
            
            console.log('Using test property IDs:', testPropertyIds);
            propertyIds = testPropertyIds;
        }
        
        console.log('Property IDs:', propertyIds);
        
        // Fetch transactions from API
        const transactionData = await fetchTransactionsByProperties(propertyIds);
        
        if (transactionData) {
            console.log('Transaction data received:', transactionData);
            
            // Populate the UI with transaction data
            populateTransactionTabs(transactionData);
        }
        
    } catch (error) {
        console.error('Error loading transaction data:', error);
    }
}

// Get Property IDs from localStorage
function getPropertyIdsFromStorage() {
    try {
        // First try to get from direct properties storage (as set by login-functions.js)
        const properties = localStorage.getItem('properties');
        if (properties) {
            const propertyIds = JSON.parse(properties);
            console.log('Found properties in localStorage:', propertyIds);
            return propertyIds;
        }
        
        // Fallback: try to get from user data
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            console.log('User data:', user);
            
            // Check if user has properties array
            if (user.properties && Array.isArray(user.properties)) {
                return user.properties;
            }
            
            // Check if properties are in a different structure
            if (user.property && Array.isArray(user.property)) {
                return user.property;
            }
        }
        
        // Try alternative storage keys
        const propertyIds = localStorage.getItem('propertyIds');
        if (propertyIds) {
            return JSON.parse(propertyIds);
        }
        
        console.warn('No property IDs found in localStorage. Available keys:', Object.keys(localStorage));
        return [];
        
    } catch (error) {
        console.error('Error getting property IDs from storage:', error);
        return [];
    }
}

// Fetch Transactions by Properties from API
async function fetchTransactionsByProperties(propertyIds) {
    try {
        console.log('Fetching transactions for properties:', propertyIds);
        
        const response = await fetch(`${API_BASE_URL}/ts/transactionsByProperties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                propertyIds: propertyIds
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        return data;
        
    } catch (error) {
        console.error('Error fetching transactions by properties:', error);
        throw error;
    }
}

// Populate Transaction Tabs with Data
function populateTransactionTabs(transactionData) {
    try {
        console.log('Populating transaction tabs with data:', transactionData);
        
        // Get tab content containers
        const tabContents = document.querySelectorAll('.tab-content');
        
        if (tabContents.length >= 2) {
            // Populate Pending transactions (first tab)
            populateTransactionTab(tabContents[0], transactionData.pending || [], 'pending');
            
            // Populate Completed transactions (second tab)
            populateTransactionTab(tabContents[1], transactionData.completed || [], 'completed');
        } else {
            console.error('Tab content containers not found');
        }
        
    } catch (error) {
        console.error('Error populating transaction tabs:', error);
    }
}

// Populate Individual Transaction Tab
function populateTransactionTab(tabContainer, transactions, tabType) {
    try {
        console.log(`Populating ${tabType} tab with ${transactions.length} transactions`);
        
        // Clear existing content
        tabContainer.innerHTML = '';
        
        // Sort by transaction number descending (e.g., "#000000072" -> 72)
        const getTransNoValue = (t) => {
            const raw = t?.transNo ?? t?.transactionNo ?? t?.trans_no ?? t?.transNO;
            if (raw === undefined || raw === null) return -Infinity;
            const str = String(raw);
            const match = str.match(/\d+/g);
            if (!match) return -Infinity;
            // Join digits to support formats like "000000072"
            return parseInt(match.join(''), 10);
        };
        const sorted = [...transactions].sort((a, b) => getTransNoValue(b) - getTransNoValue(a));
        
        if (sorted.length === 0) {
            // Show empty state
            tabContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-center">
                    <svg class="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p class="text-neutral-500 text-lg font-medium">No ${tabType} transactions</p>
                    <p class="text-neutral-400 text-sm">Transactions will appear here when available</p>
                </div>
            `;
            return;
        }
        
        // Create transaction items
        sorted.forEach((transaction, index) => {
            console.log(`Creating transaction element ${index + 1}:`, transaction);
            const transactionElement = createTransactionElement(transaction, tabType);
            tabContainer.appendChild(transactionElement);
        });
        
    } catch (error) {
        console.error(`Error populating ${tabType} tab:`, error);
    }
}

// Create Transaction Element
function createTransactionElement(transaction, tabType) {
    try {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'grid grid-cols-2 md:grid-cols-4 gap-5 p-4 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer active:scale-95 hover:bg-neutral-100 transition-all duration-300 ease-in-out mb-4';
        transactionDiv.setAttribute('data-booking-id', transaction.bookingId);
        
        // Format dates
        const checkInDate = new Date(transaction.checkIn).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const checkOutDate = new Date(transaction.checkOut).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Format amount
        const formattedAmount = parseFloat(transaction.totalAmount).toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP'
        });
        
        // Get status color class
        const statusColorClass = getStatusColorClass(transaction.status);
        
        transactionDiv.innerHTML = `
            <div class="flex-1 min-w-0">
                <p class="text-xs text-neutral-500 font-manrope">Trans#</p>
                <p class="text-sm font-semibold text-neutral-800 font-inter truncate">#${transaction.transNo}</p>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs text-neutral-500 font-manrope">Guest</p>
                <p class="text-sm font-semibold text-neutral-800 font-inter truncate">${transaction.nameOfGuest}</p>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs text-neutral-500 font-manrope">Property</p>
                <p class="text-sm font-semibold text-neutral-800 font-inter truncate">${transaction.propertyName}</p>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs text-neutral-500 font-manrope">Check-in Date</p>
                <p class="text-sm font-semibold text-neutral-800 font-inter truncate">${checkInDate}</p>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs text-neutral-500 font-manrope">Check-out Date</p>
                <p class="text-sm font-semibold text-neutral-800 font-inter truncate">${checkOutDate}</p>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs text-neutral-500 font-manrope">Payment Mode</p>
                <p class="text-sm font-semibold text-neutral-800 font-inter truncate">${transaction.paymentMode}</p>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs text-neutral-500 font-manrope">Total Amount</p>
                <p class="text-sm font-semibold text-neutral-800 font-inter truncate">${formattedAmount}</p>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs text-neutral-500 font-manrope">Status</p>
                <p class="text-sm font-semibold ${statusColorClass} w-fit font-inter truncate">${transaction.status}</p>
            </div>
        `;
        
        // Add click event listener to open modal
        transactionDiv.addEventListener('click', () => {
            console.log('Transaction clicked:', transaction);
            openTransactionModal(transaction);
        });
        
        return transactionDiv;
        
    } catch (error) {
        console.error('Error creating transaction element:', error);
        return document.createElement('div');
    }
}

// Get Status Color Class
function getStatusColorClass(status) {
    const normalized = String(status || '').toLowerCase();
    
    // Rose red for any cancel/refund variants
    if (normalized.includes('cancel') || normalized.includes('refunded')) {
        return 'text-rose-600';
    }
    
    // Yellow for any pending variants
    if (normalized.includes('pending')) {
        return 'text-yellow-600';
    }
    
    // Everything else is green
    return 'text-green-600';
}

// Setup Tab Switching Functionality
function setupTabSwitching() {
    try {
        console.log('Setting up tab switching functionality');
        
        // Define setActiveTab function globally so it can be called from HTML onclick
        window.setActiveTab = function(tabIndex) {
            console.log('Switching to tab:', tabIndex);
            
            // Get all tab buttons and contents
            const tabButtons = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            
            console.log(`Found ${tabButtons.length} tab buttons and ${tabContents.length} tab contents`);
            
            // Remove active classes from all tabs
            tabButtons.forEach(btn => {
                btn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
                btn.classList.add('text-neutral-500');
                const span = btn.querySelector('span');
                if (span) {
                    span.classList.remove('text-primary');
                    span.classList.add('text-neutral-500');
                }
            });
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Activate selected tab
            if (tabButtons[tabIndex]) {
                tabButtons[tabIndex].classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
                tabButtons[tabIndex].classList.remove('text-neutral-500');
                const span = tabButtons[tabIndex].querySelector('span');
                if (span) {
                    span.classList.add('text-primary');
                    span.classList.remove('text-neutral-500');
                }
            }
            
            // Show selected tab content
            if (tabContents[tabIndex]) {
                tabContents[tabIndex].classList.remove('hidden');
                console.log(`Tab ${tabIndex} content shown`);
            } else {
                console.error(`Tab content ${tabIndex} not found`);
            }
        };
        
        // Set default active tab (pending - index 0) after a short delay
        setTimeout(() => {
            console.log('Setting default active tab...');
            window.setActiveTab(0);
        }, 100);
        
    } catch (error) {
        console.error('Error setting up tab switching:', error);
    }
}

// Open Transaction Modal with Data
function openTransactionModal(transaction, skipApiCall = false) {
    try {
        console.log('Opening transaction modal for:', transaction);
        
        // Get the modal element
        const modal = document.getElementById('viewTSModal');
        if (!modal) {
            console.error('Transaction modal not found');
            return;
        }
        
        // Show loading state
        showModalLoadingState(modal);
        
        // Close all open modals first
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        
        // Open the transaction modal
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open'); // Lock scroll
        
        // Setup modal close functionality
        setupModalCloseHandlers(modal);
        
        // Always fetch detailed booking information for accurate pricing
        console.log('Fetching detailed booking information for accurate pricing');
        fetchBookingDetails(transaction.bookingId, modal, transaction);
        
        console.log('Transaction modal opened successfully');
        
    } catch (error) {
        console.error('Error opening transaction modal:', error);
    }
}

// Show Modal Loading State
function showModalLoadingState(modal) {
    try {
        // Show loading message in modal
        const modalContent = modal.querySelector('.overflow-y-auto');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p class="mt-4 text-neutral-600">Loading transaction details...</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error showing loading state:', error);
    }
}

// Fetch Booking Details from API
async function fetchBookingDetails(bookingId, modal, transactionData) {
    try {
        console.log('Fetching booking details for booking ID:', bookingId);
        
        const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Booking details received:', data);
        
        if (data.booking) {
            // Restore modal content and populate with detailed data
            restoreModalContent(modal);
            populateModalWithBookingData(modal, data.booking, transactionData);
        } else {
            throw new Error('No booking data in response');
        }
        
    } catch (error) {
        console.error('Error fetching booking details:', error);
        
        // Fallback: restore modal and use transaction data
        restoreModalContent(modal);
        populateModalWithTransactionData(modal, transactionData);
        
        // Show error message
        showErrorMessage(modal, 'Could not load detailed booking information. Showing basic transaction data.');
    }
}

// Restore Modal Content Structure
function restoreModalContent(modal) {
    try {
        const modalContent = modal.querySelector('.overflow-y-auto');
        if (modalContent) {
            console.log('Restoring modal content...');
            modalContent.innerHTML = `
                <p class="text-lg font-bold text-primary-text font-manrope" data-transaction-number>Transaction no.</p>
                <p class="text-neutral-700 font-semibold">Guest: <span class="font-normal" data-guest-name>Name</span></p>
                <p class="text-neutral-700 font-semibold">Property: <span class="font-normal" data-property-name>Property name</span></p>
                <p class="text-neutral-700 font-semibold">Check-in: <span class="font-normal" data-checkin-date>Date</span></p>
                <p class="text-neutral-700 font-semibold">Check-out: <span class="font-normal" data-checkout-date>Date</span></p>
                <p class="text-neutral-700 font-semibold">Check-in Time: <span class="font-normal" data-checkin-time>Time</span></p>
                <p class="text-neutral-700 font-semibold">Check-out Time: <span class="font-normal" data-checkout-time>Time</span></p>
                <p class="text-neutral-700 font-semibold">Payment Category: <span class="font-normal" data-payment-category>Category</span></p>
                <p class="text-neutral-700 font-semibold">Status: <span class="font-normal" data-status>Status</span></p>
                <p class="text-neutral-700 font-semibold">Booking ID: <span class="font-normal" data-booking-id>ID</span></p>
                
                <div class="space-y-4 mt-5">
                    <!-- Status Timeline -->
                    <div class="flex flex-col rounded-lg border border-neutral-300 p-5 bg-white">
                        <p class="text-neutral-700 font-semibold">Status:</p>
                        <div class="p-5 max-w-xs mx-auto">
                            <ol class="relative border-s border-neutral-200">
                                <!-- Step 1 -->
                                <li class="mb-6 ms-4">
                                    <span class="absolute flex items-center justify-center w-3 h-3 bg-neutral-300 rounded-full -start-1.5 ring-4 ring-background" data-status-step="reserved"></span>
                                    <h3 class="text-sm font-medium leading-tight">Reserved</h3>
                                    <p class="text-xs text-neutral-500">Booking reserved successfully</p>
                                </li>
                                
                                <!-- Step 2 -->
                                <li class="mb-6 ms-4">
                                    <span class="absolute flex items-center justify-center w-3 h-3 bg-neutral-300 rounded-full -start-1.5 ring-4 ring-background" data-status-step="paid"></span>
                                    <h3 class="text-sm font-medium leading-tight">Fully Paid</h3>
                                    <p class="text-xs text-neutral-500">Payment confirmed</p>
                                </li>
                                
                                <!-- Step 3 -->
                                <li class="mb-6 ms-4">
                                    <span class="absolute flex items-center justify-center w-3 h-3 bg-neutral-300 rounded-full -start-1.5 ring-4 ring-background" data-status-step="checkin"></span>
                                    <h3 class="text-sm font-medium leading-tight">Check In</h3>
                                    <p class="text-xs text-neutral-500">Guest has checked in</p>
                                </li>

                                <!-- Step 4 -->
                                <li class="mb-6 ms-4">
                                    <span class="absolute flex items-center justify-center w-3 h-3 bg-neutral-300 rounded-full -start-1.5 ring-4 ring-background" data-status-step="checkout"></span>
                                    <h3 class="text-sm font-medium leading-tight">Check Out</h3>
                                    <p class="text-xs text-neutral-500">Guest has checked out</p>
                                </li>

                                <!-- Step 5 -->
                                <li class="mb-6 ms-4">
                                    <span class="absolute flex items-center justify-center w-3 h-3 bg-neutral-300 rounded-full -start-1.5 ring-4 ring-background" data-status-step="completed"></span>
                                    <h3 class="text-sm font-medium leading-tight">Completed</h3>
                                    <p class="text-xs text-neutral-500">Booking completed</p>
                                </li>

                                <!-- Cancelled (The bg should be bg-rose-700) -->
                                <li class="ms-4">
                                    <span class="absolute flex items-center justify-center w-3 h-3 bg-neutral-300 rounded-full -start-1.5 ring-4 ring-background" data-status-step="cancelled"></span>
                                    <h3 class="text-sm font-medium leading-tight">Cancelled</h3>
                                    <p class="text-xs text-neutral-500">Booking Cancelled</p>
                                </li>
                            </ol>
                        </div>
                    </div>
                    
                    <!-- Price Details -->
                    <div class="rounded-lg border border-neutral-300 p-5 bg-white">
                        <p class="text-neutral-700 font-semibold">Price details:</p>
                        <div class="flex justify-between items-center">
                            <div class="text-primary-text font-inter">
                                <p>₱ <span id="pricePerDay">00</span><span> x </span> <span id="daysOfStay">00</span> <span>day/s</span></p>
                            </div>
                            <p class="text-primary-text font-inter">₱ <span id="totalPriceDay">00</span></p>
                        </div>
                        <div class="flex justify-between items-center mb-3">
                            <div class="text-primary-text font-inter">
                                <p>₱ <span id="addGuestPrice">00</span><span> x </span> <span id="daysOfStay">00</span> <span>guest/s</span></p>
                            </div>
                            <p class="text-primary-text font-inter">₱ <span id="totalAddGuest">00</span></p>
                        </div>
                        
                        <div class="flex justify-between items-center">
                            <p class="text-primary-text font-inter">Reservation fee</p>
                            <p class="text-primary-text font-inter">₱ <span id="reservationFee">00</span></p>
                        </div>
                        <div class="flex justify-between items-center mb-5">
                            <p class="text-primary-text font-inter">Discount</p>
                            <p class="text-primary-text font-inter"><span id="discount">00</span>%</p>
                        </div>
                        <hr class="my-4 border-t border-neutral-300">
                        <div class="flex justify-between items-center">
                            <p class="text-primary-text text-xl font-bold font-manrope">Total:</p>
                            <p class="text-primary-text text-xl font-inter" data-total-amount>₱ <span id="totalPrice">00</span></p>
                        </div>
                    </div>
                    
                    <!-- Payment Details -->
                    <div class="rounded-lg border border-neutral-200 p-5 bg-white" id="reservationPaymentSection">
                        <div class="flex flex-col md:flex-row md:justify-between md:items-center font-inter w-full">
                            <div class="mb-5 md:mb-0">
                                <p class="font-semibold text-neutral-800 font-manrope">Reservation Payment</p>
                                <p class="text-sm text-neutral-500">Payment No: <span data-reservation-payment-no>Pending</span></p>
                                <p class="text-sm text-neutral-500">Mode: <span data-reservation-payment-mode>Pending</span></p>
                                <p class="text-sm text-neutral-500">Bank/Ewallet No: <span data-reservation-bank-ewallet-no>Pending</span></p>
                                <p class="text-sm text-neutral-500">Status: <span data-reservation-payment-status>Pending</span></p>
                                <p class="font-medium mt-1">₱ <span data-reservation-fee-amount>0</span></p>
                            </div>
                            <div class="flex gap-3">
                                <button class="cursor-pointer bg-primary/10 !text-primary !text-sm rounded-lg px-4 py-2 hover:bg-primary/20 active:scale-95 transition-all duration-300 ease-in-out" data-approve-reservation>Approve</button>
                                <button class="cursor-pointer bg-rose-200 !text-rose-700 !text-sm rounded-lg px-4 py-2 hover:bg-rose-300 active:scale-95 transition-all duration-300 ease-in-out" data-decline-reservation>Decline</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="rounded-lg border border-neutral-200 p-5 bg-white" id="packagePaymentSection">
                        <div class="flex flex-col md:flex-row md:justify-between md:items-center font-inter w-full">
                            <div class="mb-5 md:mb-0">
                                <p class="font-semibold text-neutral-800 font-manrope">Package Payment</p>
                                <p class="text-sm text-neutral-500">Payment No: <span data-package-payment-no>Pending</span></p>
                                <p class="text-sm text-neutral-500">Mode: <span data-package-payment-mode>Pending</span></p>
                                <p class="text-sm text-neutral-500">Bank/Ewallet No: <span data-package-bank-ewallet-no>Pending</span></p>
                                <p class="text-sm text-neutral-500">Status: <span data-package-payment-status>Pending</span></p>
                                <p class="font-medium mt-1">₱ <span data-package-fee-amount>0</span></p>
                            </div>
                            <div class="flex gap-3">
                                <button class="cursor-pointer bg-primary/10 !text-primary !text-sm rounded-lg px-4 py-2 hover:bg-primary/20 active:scale-95 transition-all duration-300 ease-in-out" data-approve-package>Approve</button>
                                <button class="cursor-pointer bg-rose-200 !text-rose-700 !text-sm rounded-lg px-4 py-2 hover:bg-rose-300 active:scale-95 transition-all duration-300 ease-in-out" data-decline-package>Decline</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            console.log('Modal content restored successfully');
        }
    } catch (error) {
        console.error('Error restoring modal content:', error);
    }
}

// Populate Modal with Detailed Booking Data
function populateModalWithBookingData(modal, booking, transactionData) {
    try {
        console.log('Populating modal with detailed booking data:', booking);
        
        // Format dates
        const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        
        const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Update modal content with booking data
        const updateElement = (selector, value) => {
            const element = modal.querySelector(selector);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Element not found: ${selector}`);
            }
        };
        
        // Update basic booking details
        updateElement('[data-transaction-number]', `Transaction #${booking.transNo}`);
        updateElement('[data-guest-name]', booking.guestName);
        updateElement('[data-property-name]', booking.propertyName);
        updateElement('[data-checkin-date]', checkInDate);
        updateElement('[data-checkout-date]', checkOutDate);
        updateElement('[data-checkin-time]', booking.timeIn || 'N/A');
        updateElement('[data-checkout-time]', booking.timeOut || 'N/A');
        updateElement('[data-payment-category]', booking.paymentCategory || 'N/A');
        updateElement('[data-status]', booking.status);
        updateElement('[data-booking-id]', booking._id);
        
        // Update price details with actual booking data
        const packageFeePerDay = Math.round(booking.packageFee / booking.numOfDays);
        const totalAdditionalPaxFee = booking.additionalPaxPrice * booking.additionalPax;
        
        updateElement('#pricePerDay', packageFeePerDay.toLocaleString());
        updateElement('#daysOfStay', booking.numOfDays);
        updateElement('#totalPriceDay', booking.packageFee.toLocaleString());
        updateElement('#addGuestPrice', booking.additionalPaxPrice.toLocaleString());
        updateElement('#addGuestCount', booking.additionalPax);
        updateElement('#totalAddGuest', totalAdditionalPaxFee.toLocaleString());
        updateElement('#reservationFee', booking.reservationFee.toLocaleString());
        updateElement('#discount', booking.discount);
        updateElement('#totalPrice', booking.totalFee.toLocaleString());
        
        // Update total amount display
        const formattedAmount = parseFloat(booking.totalFee).toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP'
        });
        const totalAmountElement = modal.querySelector('[data-total-amount]');
        if (totalAmountElement) {
            totalAmountElement.textContent = formattedAmount;
        }
        
        // Update payment details
        updatePaymentDetails(modal, booking);
        
        // Update payment section visibility
        updatePaymentSectionVisibility(modal, booking);
        
        // Update status progression
        updateStatusProgressionDetailed(modal, booking.status);
        
        // Update status color
        const statusElement = modal.querySelector('[data-status]');
        if (statusElement) {
            statusElement.classList.remove('text-green-600', 'text-yellow-600', 'text-red-600', 'text-neutral-800');
            const statusColorClass = getStatusColorClass(booking.status);
            statusElement.classList.add(statusColorClass.split(' ')[0]);
        }
        
        // Setup button event listeners
        setupPaymentButtons(modal, booking);
        
        console.log('Modal populated successfully with detailed booking data');
        
    } catch (error) {
        console.error('Error populating modal with booking data:', error);
    }
}

// Update Payment Details
function updatePaymentDetails(modal, booking) {
    try {
        // Update reservation payment details
        const updateElement = (selector, value) => {
            const element = modal.querySelector(selector);
            if (element) element.textContent = value;
        };
        
        // Debug logging for bank/ewallet numbers
        console.log('=== DEBUGGING PAYMENT DATA POPULATION ===');
        console.log('Full booking object:', booking);
        console.log('Reservation object:', booking.reservation);
        console.log('Package object:', booking.package);
        console.log('Reservation paymentNo:', booking.reservation?.paymentNo);
        console.log('Reservation modeOfPayment:', booking.reservation?.modeOfPayment);
        console.log('Reservation numberBankEwallets:', booking.reservation?.numberBankEwallets);
        console.log('Reservation status:', booking.reservation?.status);
        console.log('Package paymentNo:', booking.package?.paymentNo);
        console.log('Package modeOfPayment:', booking.package?.modeOfPayment);
        console.log('Package numberBankEwallets:', booking.package?.numberBankEwallets);
        console.log('Package status:', booking.package?.status);
        console.log('=== END DEBUGGING ===');
        
        // Reservation payment
        updateElement('[data-reservation-payment-no]', booking.reservation?.paymentNo || 'Pending');
        updateElement('[data-reservation-payment-mode]', booking.reservation?.modeOfPayment || 'Pending');
        updateElement('[data-reservation-bank-ewallet-no]', booking.reservation?.numberBankEwallets || 'Pending');
        updateElement('[data-reservation-payment-status]', booking.reservation?.status || 'Pending');
        updateElement('[data-reservation-fee-amount]', booking.reservationFee?.toLocaleString() || '0');
        
        // Package payment
        updateElement('[data-package-payment-no]', booking.package?.paymentNo || 'Pending');
        updateElement('[data-package-payment-mode]', booking.package?.modeOfPayment || 'Pending');
        updateElement('[data-package-bank-ewallet-no]', booking.package?.numberBankEwallets || 'Pending');
        updateElement('[data-package-payment-status]', booking.package?.status || 'Pending');
        updateElement('[data-package-fee-amount]', booking.packageFee?.toLocaleString() || '0');
        
    } catch (error) {
        console.error('Error updating payment details:', error);
    }
}

// Update Payment Section Visibility
function updatePaymentSectionVisibility(modal, booking) {
    try {
        console.log('Updating payment section visibility based on reservation status');
        
        const reservationSection = modal.querySelector('#reservationPaymentSection');
        const packageSection = modal.querySelector('#packagePaymentSection');
        
        if (!reservationSection || !packageSection) {
            console.warn('Payment sections not found in modal');
            return;
        }
        
        // Check if reservation payment number is pending
        const reservationPaymentNo = booking.reservation?.paymentNo;
        const isReservationPaymentPending = !reservationPaymentNo || 
            reservationPaymentNo === 'Pending' || 
            reservationPaymentNo === null || 
            reservationPaymentNo === undefined;
        
        // Check if package payment number is pending
        const packagePaymentNo = booking.package?.paymentNo;
        const isPackagePaymentPending = !packagePaymentNo || 
            packagePaymentNo === 'Pending' || 
            packagePaymentNo === null || 
            packagePaymentNo === undefined;
        
        console.log('Reservation payment number:', reservationPaymentNo);
        console.log('Reservation payment pending status:', isReservationPaymentPending);
        console.log('Package payment number:', packagePaymentNo);
        console.log('Package payment pending status:', isPackagePaymentPending);
        console.log('Reservation payment details:', booking.reservation);
        console.log('Package payment details:', booking.package);
        
        // Show/Hide reservation payment section based on payment number
        if (isReservationPaymentPending) {
            reservationSection.style.display = 'none';
            console.log('Reservation payment section hidden - no actual payment number');
        } else {
            reservationSection.style.display = 'block';
            console.log('Reservation payment section visible - has actual payment number');
        }
        
        // Hide package payment section if:
        // 1. Reservation payment number is "Pending" OR
        // 2. Package payment number is "Pending"
        if (isReservationPaymentPending || isPackagePaymentPending) {
            packageSection.style.display = 'none';
            if (isReservationPaymentPending) {
                console.log('Package payment section hidden - reservation payment number is pending');
            }
            if (isPackagePaymentPending) {
                console.log('Package payment section hidden - package payment number is pending');
            }
        } else {
            // Show package payment section only if both reservation and package payment numbers are NOT "Pending"
            packageSection.style.display = 'block';
            console.log('Package payment section visible - both reservation and package payment numbers are not pending');
        }
        
    } catch (error) {
        console.error('Error updating payment section visibility:', error);
    }
}

// Setup Payment Button Event Listeners
function setupPaymentButtons(modal, booking) {
    try {
        console.log('Setting up payment button event listeners');
        
        // Reservation payment buttons
        const approveReservationBtn = modal.querySelector('[data-approve-reservation]');
        const declineReservationBtn = modal.querySelector('[data-decline-reservation]');
        
        // Package payment buttons
        const approvePackageBtn = modal.querySelector('[data-approve-package]');
        const declinePackageBtn = modal.querySelector('[data-decline-package]');
        
        // Setup reservation payment buttons
        if (approveReservationBtn) {
            approveReservationBtn.addEventListener('click', () => {
                handlePaymentAction('approve', 'reservation', booking);
            });
        }
        
        if (declineReservationBtn) {
            declineReservationBtn.addEventListener('click', () => {
                handlePaymentAction('decline', 'reservation', booking);
            });
        }
        
        // Setup package payment buttons
        if (approvePackageBtn) {
            approvePackageBtn.addEventListener('click', () => {
                handlePaymentAction('approve', 'package', booking);
            });
        }
        
        if (declinePackageBtn) {
            declinePackageBtn.addEventListener('click', () => {
                handlePaymentAction('decline', 'package', booking);
            });
        }
        
        // Hide buttons for already processed payments
        updateButtonVisibility(modal, booking);
        
    } catch (error) {
        console.error('Error setting up payment buttons:', error);
    }
}

// Handle Payment Action (Approve/Decline)
async function handlePaymentAction(action, paymentType, booking) {
    try {
        console.log(`${action} ${paymentType} payment for booking:`, booking._id);
        
        if (action === 'approve') {
            // Handle approve action
            await approvePayment(paymentType, booking);
        } else if (action === 'decline') {
            // Handle decline action
            await declinePayment(paymentType, booking);
        }
        
            } catch (error) {
        console.error(`Error handling ${action} ${paymentType} payment:`, error);
    }
}

// Approve Payment Function
async function approvePayment(paymentType, booking) {
    try {


        // Prepare the API endpoint and body based on payment type using existing booking data
        const baseURL = 'https://betcha-api.onrender.com';
        let endpoint, requestBody;

        if (paymentType === 'reservation') {
            endpoint = `${baseURL}/booking/payment/reservation/${booking._id}`;
            requestBody = {
                modeOfPayment: booking.reservation?.modeOfPayment || 'GCash',
                paymentNo: booking.reservation?.paymentNo || '',
                numberBankEwallets: booking.reservation?.numberBankEwallets || ''
            };
        } else if (paymentType === 'package') {
            endpoint = `${baseURL}/booking/payment/package/${booking._id}`;
            requestBody = {
                modeOfPayment: booking.package?.modeOfPayment || 'GCash',
                paymentNo: booking.package?.paymentNo || '',
                numberBankEwallets: booking.package?.numberBankEwallets || ''
            };
        }

        console.log(`Approving ${paymentType} payment with data:`, requestBody);
        console.log(`API endpoint: ${endpoint}`);

        // Make the PATCH API call
        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`${paymentType} payment approval response:`, data);

        // Notify PMs for this property
        try {
            const propertyId = booking.propertyId || data?.booking?.propertyId || booking?.property?._id;
            if (window.notify && propertyId) {
                const message = `Reservation payment was ${paymentType === 'reservation' ? 'approved' : 'updated'} for transaction #${booking.transNo || data?.booking?.transNo || ''}.`;
                console.log('[Notify][TS] Fan-out to PMs (approve)', { propertyId, message });
                await window.notify.notifyEmployeesByProperty({
                    propertyId,
                    privilege: 'PM',
                    buildMessageFor: () => ({ message })
                });
            }
        } catch (e) {
            console.warn('[Notify][TS] PM notify failed (approve):', e);
        }

        // Notify Guest about approval
        try {
            const guestId = booking.guestId || data?.booking?.guestId;
            const guestName = booking.guestName || data?.booking?.guestName || 'Guest';
            const transNo = booking.transNo || data?.booking?.transNo || '';
            // Resolve current employee identity
            const userDataRaw = localStorage.getItem('userData');
            const emp = userDataRaw ? JSON.parse(userDataRaw) : {};
            const fromId = emp?._id || localStorage.getItem('userId') || '';
            const fromName = emp?.firstname && emp?.lastname ? `${emp.firstname} ${emp.lastname}` : (emp?.name || 'Employee');
            if (window.notify && guestId && fromId) {
                const message = `Your ${paymentType === 'reservation' ? 'reservation' : 'package'} payment has been approved for transaction #${transNo}.`;
                console.log('[Notify][TS->Guest] Sending approval message', { toId: guestId, toName: guestName, message });
                await window.notify.sendMessage({
                    fromId,
                    fromName,
                    fromRole: 'employee',
                    toId: guestId,
                    toName: guestName,
                    toRole: 'guest',
                    message,
                    category: 'payment-status'
                });
            }
        } catch (e) {
            console.warn('[Notify][TS->Guest] Guest notify failed (approve):', e);
        }



        // Call payment checking API to update status
        const statusUpdateResponse = await updatePaymentStatus(paymentType, booking._id, 'approve');

        // Hide buttons immediately after successful API call
        const modal = document.getElementById('viewTSModal');
        if (modal) {
            // Hide the specific buttons immediately for instant feedback
            if (paymentType === 'reservation') {
                const approveBtn = modal.querySelector('[data-approve-reservation]');
                const declineBtn = modal.querySelector('[data-decline-reservation]');
                if (approveBtn) approveBtn.style.display = 'none';
                if (declineBtn) declineBtn.style.display = 'none';
            } else if (paymentType === 'package') {
                const approveBtn = modal.querySelector('[data-approve-package]');
                const declineBtn = modal.querySelector('[data-decline-package]');
                if (approveBtn) approveBtn.style.display = 'none';
                if (declineBtn) declineBtn.style.display = 'none';
            }
            
            console.log('Fetching fresh booking data after approval...');
            await fetchBookingDetails(booking._id, modal, booking);
        }

        // Reload the transaction list
        await loadTransactionData();

    } catch (error) {
        console.error(`Error approving ${paymentType} payment:`, error);
    }
}

// Decline Payment Function
async function declinePayment(paymentType, booking) {
    try {


        console.log(`Declining ${paymentType} payment for booking:`, booking._id);

        // Call payment checking API to update status
        await updatePaymentStatus(paymentType, booking._id, 'decline');



        // Hide buttons immediately after successful API call
        const modal = document.getElementById('viewTSModal');
        if (modal) {
            // Hide the specific buttons immediately for instant feedback
            if (paymentType === 'reservation') {
                const approveBtn = modal.querySelector('[data-approve-reservation]');
                const declineBtn = modal.querySelector('[data-decline-reservation]');
                if (approveBtn) approveBtn.style.display = 'none';
                if (declineBtn) declineBtn.style.display = 'none';
            } else if (paymentType === 'package') {
                const approveBtn = modal.querySelector('[data-approve-package]');
                const declineBtn = modal.querySelector('[data-decline-package]');
                if (approveBtn) approveBtn.style.display = 'none';
                if (declineBtn) declineBtn.style.display = 'none';
            }
            
            // Fetch updated booking data
            await fetchBookingDetails(booking._id, modal, booking);
        }

        // PM notifications are only sent on approvals; skip for declines

        // Notify Guest about decline
        try {
            const guestId = booking.guestId;
            const guestName = booking.guestName || 'Guest';
            const transNo = booking.transNo || '';
            const userDataRaw = localStorage.getItem('userData');
            const emp = userDataRaw ? JSON.parse(userDataRaw) : {};
            const fromId = emp?._id || localStorage.getItem('userId') || '';
            const fromName = emp?.firstname && emp?.lastname ? `${emp.firstname} ${emp.lastname}` : (emp?.name || 'Employee');
            if (window.notify && guestId && fromId) {
                const message = `Your ${paymentType === 'reservation' ? 'reservation' : 'package'} payment has been declined for transaction #${transNo}.`;
                console.log('[Notify][TS->Guest] Sending decline message', { toId: guestId, toName: guestName, message });
                await window.notify.sendMessage({
                    fromId,
                    fromName,
                    fromRole: 'employee',
                    toId: guestId,
                    toName: guestName,
                    toRole: 'guest',
                    message,
                    category: 'payment-status'
                });
            }
        } catch (e) {
            console.warn('[Notify][TS->Guest] Guest notify failed (decline):', e);
        }

        // Reload the transaction list
        await loadTransactionData();

    } catch (error) {
        console.error(`Error declining ${paymentType} payment:`, error);
    }
}

// Update Payment Status Function (for both approve and decline)
async function updatePaymentStatus(paymentType, bookingId, action) {
    try {
        const baseURL = 'https://betcha-api.onrender.com';
        const endpoint = `${baseURL}/booking/paymentChecking/${paymentType}/${bookingId}`;
        
        let requestBody;
        if (action === 'approve') {
            requestBody = {
                bookingStatus: "Reserved",
                paymentStatus: "Approved"
            };
        } else if (action === 'decline') {
            requestBody = {
                bookingStatus: "Cancel",
                paymentStatus: "Declined"
            };
        }

        console.log(`Updating ${paymentType} payment status with data:`, requestBody);
        console.log(`Payment checking API endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`${paymentType} payment status update response:`, data);

        return data;

    } catch (error) {
        console.error(`Error updating ${paymentType} payment status:`, error);
        throw error;
    }
}

// Update Button Visibility Based on Payment Status
function updateButtonVisibility(modal, booking) {
    try {
        // Get button elements
        const approveReservationBtn = modal.querySelector('[data-approve-reservation]');
        const declineReservationBtn = modal.querySelector('[data-decline-reservation]');
        const approvePackageBtn = modal.querySelector('[data-approve-package]');
        const declinePackageBtn = modal.querySelector('[data-decline-package]');
        
        // Check reservation payment number (consistent with section visibility logic)
        const reservationPaymentNo = booking.reservation?.paymentNo;
        const isReservationPaymentPending = !reservationPaymentNo || 
            reservationPaymentNo === 'Pending' || 
            reservationPaymentNo === null || 
            reservationPaymentNo === undefined;
        
        // Hide reservation buttons if payment is already processed (status not pending)
        if (booking.reservation && booking.reservation.status !== 'Pending') {
            if (approveReservationBtn) approveReservationBtn.style.display = 'none';
            if (declineReservationBtn) declineReservationBtn.style.display = 'none';
        } else {
            // Show reservation buttons if payment is still pending and has actual payment number
            if (!isReservationPaymentPending) {
                if (approveReservationBtn) approveReservationBtn.style.display = 'inline-block';
                if (declineReservationBtn) declineReservationBtn.style.display = 'inline-block';
            } else {
                if (approveReservationBtn) approveReservationBtn.style.display = 'none';
                if (declineReservationBtn) declineReservationBtn.style.display = 'none';
            }
        }
        
        // Handle package buttons visibility
        if (isReservationPaymentPending) {
            // Hide package buttons if reservation payment number is still "Pending"
            if (approvePackageBtn) approvePackageBtn.style.display = 'none';
            if (declinePackageBtn) declinePackageBtn.style.display = 'none';
            console.log('Package payment buttons hidden - reservation payment number is pending');
        } else {
            // Show package buttons if reservation payment number is not "Pending"
            // But hide if package payment is already processed
            if (booking.package && booking.package.status !== 'Pending') {
                if (approvePackageBtn) approvePackageBtn.style.display = 'none';
                if (declinePackageBtn) declinePackageBtn.style.display = 'none';
                console.log('Package payment buttons hidden - package payment already processed');
            } else {
                if (approvePackageBtn) approvePackageBtn.style.display = 'inline-block';
                if (declinePackageBtn) declinePackageBtn.style.display = 'inline-block';
                console.log('Package payment buttons visible - reservation processed and package pending');
            }
        }
        
        console.log('Button visibility updated based on payment status and workflow');
        
    } catch (error) {
        console.error('Error updating button visibility:', error);
    }
}

// Update Status Progression (Enhanced for detailed booking data)
function updateStatusProgressionDetailed(modal, currentStatus) {
    try {
        console.log('Updating detailed status progression for status:', currentStatus);
        console.log('Modal element:', modal);
        console.log('Modal HTML structure:', modal.innerHTML);
        
        // Define status progression order and mapping
        const statusProgression = [
            { key: 'reserved', status: 'Reserved' },
            { key: 'paid', status: 'Fully Paid' },
            { key: 'checkin', status: 'Check In' },
            { key: 'checkout', status: 'Check Out' },
            { key: 'completed', status: 'Completed' }
        ];
        
        // Map API status to progression status
        const statusMapping = {
            'Pending Payment': 'Reserved',
            'Reserved': 'Reserved',
            'Fully-Paid': 'Fully-Paid',
            'Checked-In': 'Check In',
            'Check In': 'Check In',
            'Checked-Out': 'Check Out',
            'Check Out': 'Check Out',
            'Completed': 'Completed',
            'Cancel': 'Cancelled',
            'Cancelled': 'Cancelled'
        };
        
        const mappedStatus = statusMapping[currentStatus] || currentStatus;
        const currentStepIndex = statusProgression.findIndex(step => step.status === mappedStatus);
        
        console.log(`Status mapping: ${currentStatus} -> ${mappedStatus}`);
        console.log(`Looking for step with status: ${mappedStatus}`);
        console.log(`Available steps:`, statusProgression.map(s => s.status));
        console.log(`Current step index: ${currentStepIndex}`);
        
        // Update status steps
        statusProgression.forEach((step, index) => {
            const stepElement = modal.querySelector(`[data-status-step="${step.key}"]`);
            console.log(`Looking for step ${step.key}:`, stepElement);
            if (stepElement) {
                console.log(`Found step element for ${step.key}, updating classes...`);
                stepElement.classList.remove('bg-primary', 'bg-neutral-300', 'bg-rose-700');
                
                if (mappedStatus === 'Cancelled') {
                    stepElement.classList.add('bg-neutral-300');
                    console.log(`Step ${step.key} set to neutral (cancelled)`);
                } else if (index <= currentStepIndex) {
                    stepElement.classList.add('bg-primary');
                    console.log(`Step ${step.key} set to primary (completed)`);
                } else {
                    stepElement.classList.add('bg-neutral-300');
                    console.log(`Step ${step.key} set to neutral (not reached)`);
                }
            } else {
                console.warn(`Step element not found for: ${step.key}`);
            }
        });
        
        // Handle cancelled status
        if (mappedStatus === 'Cancelled') {
            const cancelledElement = modal.querySelector('[data-status-step="cancelled"]');
            if (cancelledElement) {
                cancelledElement.classList.remove('bg-neutral-300');
                cancelledElement.classList.add('bg-rose-700');
            }
        }
        
        console.log(`Detailed status progression updated: ${currentStatus} -> ${mappedStatus} (step ${currentStepIndex})`);
        
    } catch (error) {
        console.error('Error updating detailed status progression:', error);
    }
}

// Show Error Message in Modal
function showErrorMessage(modal, message) {
    try {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4';
        errorDiv.innerHTML = `
            <div class="flex">
                <div class="py-1">
                    <svg class="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                    </svg>
                </div>
                <div>
                    <p class="font-bold">Warning</p>
                    <p class="text-sm">${message}</p>
                </div>
            </div>
        `;
        
        const modalContent = modal.querySelector('.overflow-y-auto');
        if (modalContent) {
            modalContent.insertBefore(errorDiv, modalContent.firstChild);
        }
    } catch (error) {
        console.error('Error showing error message:', error);
    }
}

// Populate Modal with Transaction Data
function populateModalWithTransactionData(modal, transaction) {
    try {
        console.log('Populating modal with transaction data:', transaction);
        
        // Format dates
        const checkInDate = new Date(transaction.checkIn).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        
        const checkOutDate = new Date(transaction.checkOut).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Calculate days of stay
        const checkIn = new Date(transaction.checkIn);
        const checkOut = new Date(transaction.checkOut);
        const daysOfStay = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        // Format amount
        const totalAmount = parseFloat(transaction.totalAmount);
        const formattedAmount = totalAmount.toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP'
        });
        
        // Calculate price details (simplified calculation)
        const pricePerDay = Math.round(totalAmount / daysOfStay);
        const basePrice = pricePerDay * daysOfStay;
        const reservationFee = Math.round(totalAmount * 0.1); // 10% reservation fee
        const additionalGuestFee = 0; // Default to 0
        const discount = 0; // Default to 0
        
        // Update modal content with transaction data
        const updateElement = (selector, value) => {
            const element = modal.querySelector(selector);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Element not found: ${selector}`);
            }
        };
        
        // Update basic transaction details
        updateElement('[data-transaction-number]', `Transaction #${transaction.transNo}`);
        updateElement('[data-guest-name]', transaction.nameOfGuest);
        updateElement('[data-property-name]', transaction.propertyName);
        updateElement('[data-checkin-date]', checkInDate);
        updateElement('[data-checkout-date]', checkOutDate);
        updateElement('[data-checkin-time]', '1:00 PM'); // Default time since not in transaction data
        updateElement('[data-checkout-time]', '11:00 AM'); // Default time since not in transaction data
        updateElement('[data-payment-category]', transaction.paymentMode || 'N/A');
        updateElement('[data-status]', transaction.status);
        updateElement('[data-booking-id]', transaction.bookingId);
        
        // Update price details using IDs
        updateElement('#pricePerDay', pricePerDay.toLocaleString());
        updateElement('#daysOfStay', daysOfStay);
        updateElement('#totalPriceDay', basePrice.toLocaleString());
        updateElement('#addGuestPrice', '0');
        updateElement('#addGuestCount', '0');
        updateElement('#totalAddGuest', '0');
        updateElement('#reservationFee', reservationFee.toLocaleString());
        updateElement('#discount', discount);
        updateElement('#totalPrice', totalAmount.toLocaleString());
        
        // Update total amount display
        const totalAmountElement = modal.querySelector('[data-total-amount]');
        if (totalAmountElement) {
            totalAmountElement.textContent = formattedAmount;
        }
        
        // Update status progression
        console.log('About to update status progression...');
        setTimeout(() => {
            console.log('Calling updateStatusProgression after delay...');
            updateStatusProgression(modal, transaction.status);
        }, 500); // Increased delay to ensure content is rendered
        
        // Update status color
        const statusElement = modal.querySelector('[data-status]');
        if (statusElement) {
            // Remove existing color classes
            statusElement.classList.remove('text-green-600', 'text-yellow-600', 'text-red-600', 'text-neutral-800');
            // Add appropriate color class
            const statusColorClass = getStatusColorClass(transaction.status);
            statusElement.classList.add(statusColorClass.split(' ')[0]); // Get the first class (text-color)
        }
        
        console.log('Modal populated successfully with transaction data');
        
    } catch (error) {
        console.error('Error populating modal with transaction data:', error);
    }
}

// Update Status Progression
function updateStatusProgression(modal, currentStatus) {
    try {
        console.log('Updating status progression for status:', currentStatus);
        console.log('Modal element:', modal);
        
        // Get all status step elements (the span elements with the dots)
        const statusSteps = modal.querySelectorAll('ol li span');
        
        if (statusSteps.length === 0) {
            console.warn('No status steps found in modal');
            // Let's see what's actually in the modal
            console.log('Modal HTML:', modal.innerHTML);
            console.log('Looking for ol li span elements...');
            const olElements = modal.querySelectorAll('ol');
            console.log('Found ol elements:', olElements.length);
            olElements.forEach((ol, index) => {
                console.log(`OL ${index}:`, ol);
                const liElements = ol.querySelectorAll('li');
                console.log(`  LI elements: ${liElements.length}`);
                liElements.forEach((li, liIndex) => {
                    const spanElements = li.querySelectorAll('span');
                    console.log(`    LI ${liIndex} span elements: ${spanElements.length}`);
                });
            });
            return;
        }
        
        console.log(`Found ${statusSteps.length} status steps`);
        statusSteps.forEach((step, index) => {
            console.log(`Step ${index + 1}:`, step);
        });
        
        // Define the status progression order based on the HTML structure
        const statusProgression = [
            'Reserved',      // Step 1
            'Fully-Paid',    // Step 2  
            'Check In',      // Step 3
            'Check Out',     // Step 4
            'Completed',     // Step 5
            'Cancelled'      // Step 6
        ];
        
        // Map API status to progression status
        const statusMapping = {
            'Pending Payment': 'Reserved',
            'Reserved': 'Reserved',
            'Fully-Paid': 'Fully-Paid',
            'Checked In': 'Check In',
            'Checked Out': 'Check Out',
            'Completed': 'Completed',
            'Cancel': 'Cancelled',
            'Cancelled': 'Cancelled'
        };
        
        const mappedStatus = statusMapping[currentStatus] || currentStatus;
        const currentStepIndex = statusProgression.indexOf(mappedStatus);
        
        console.log(`Status mapping: ${currentStatus} -> ${mappedStatus} (step ${currentStepIndex})`);
        
        // Reset all status steps to neutral
        statusSteps.forEach((step, index) => {
            // Remove all status classes
            step.classList.remove('bg-primary', 'bg-neutral-300', 'bg-rose-700', 'bg-blue-500');
            
            // Add default neutral class
            step.classList.add('bg-neutral-300');
        });
        
        if (mappedStatus === 'Cancelled') {
            // Handle cancelled status - only show cancelled step as active
            statusSteps.forEach((step, index) => {
                if (index === 5) { // Last step (Cancelled)
                    step.classList.remove('bg-neutral-300');
                    step.classList.add('bg-rose-700');
                }
            });
            console.log('Status progression updated: Cancelled (red dot)');
        } else if (currentStepIndex >= 0) {
            // Normal progression - highlight completed steps
            statusSteps.forEach((step, index) => {
                if (index <= currentStepIndex) {
                    step.classList.remove('bg-neutral-300');
                    // Use a more explicit blue color that should be visible
                    step.classList.add('bg-blue-500'); // Completed steps
                }
            });
            console.log(`Status progression updated: ${mappedStatus} (step ${currentStepIndex + 1} of ${statusProgression.length})`);
        } else {
            console.warn(`Unknown status: ${mappedStatus}, keeping all steps neutral`);
        }
        
        // Debug: Log the final state of each step
        statusSteps.forEach((step, index) => {
            const classes = step.className;
            console.log(`Step ${index + 1}: ${classes}`);
        });
        
    } catch (error) {
        console.error('Error updating status progression:', error);
    }
}

// Setup Modal Close Handlers
function setupModalCloseHandlers(modal) {
    try {
        // Close button handler
        const closeButton = modal.querySelector('[data-close-modal]');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModal(modal);
            });
        }
        
        // Click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
        
        // ESC key to close
        const escKeyHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal(modal);
                document.removeEventListener('keydown', escKeyHandler);
            }
        };
        document.addEventListener('keydown', escKeyHandler);
        
    } catch (error) {
        console.error('Error setting up modal close handlers:', error);
    }
}

// Close Modal Function
function closeModal(modal) {
    try {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open'); // Unlock scroll
        console.log('Modal closed successfully');
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

// Role Privilege Checking Functions
async function checkRolePrivileges() {
    try {
        const roleID = localStorage.getItem('roleID');
        if (!roleID) {
            console.warn('No roleID found in localStorage');
            return;
        }

        console.log('Checking privileges for roleID:', roleID);
        
        // Fetch role privileges from API
        const roleData = await fetchRolePrivileges(roleID);
        
        if (roleData && roleData.privileges) {
            console.log('Role privileges:', roleData.privileges);
            
            // Filter sidebar and content based on privileges
            filterSidebarByPrivileges(roleData.privileges);
        } else {
            console.warn('No privileges found in role data, using default TS privileges');
            // Default to TS privileges for this page
            filterSidebarByPrivileges(['TS']);
        }
    } catch (error) {
        console.error('Error checking role privileges:', error);
    }
}

async function fetchRolePrivileges(roleID) {
    try {
        const response = await fetch(`${API_BASE_URL}/roles/display/${roleID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Role data received:', data);
            return data;
        } else {
            if (response.status === 404) {
                console.warn(`Role not found for roleID: ${roleID}. Assuming default privileges.`);
                // Return default privileges for TS (Transaction Specialist)
                return {
                    privileges: ['TS'],
                    roleName: 'Transaction Specialist',
                    _id: roleID
                };
            }
            console.error('Failed to fetch role privileges:', response.status);
            // Return default privileges for TS page
            return {
                privileges: ['TS'],
                roleName: 'Transaction Specialist',
                _id: roleID
            };
        }
    } catch (error) {
        console.error('Error fetching role privileges:', error);
        // Return default privileges for TS page
        return {
            privileges: ['TS'],
            roleName: 'Transaction Specialist',
            _id: roleID
        };
    }
}

function filterSidebarByPrivileges(privileges) {
    console.log('TS - Filtering sidebar and content sections with privileges:', privileges);
    
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
            console.log(`TS - Hiding sidebar item: ${href} (no access with privileges: ${privileges.join(', ')})`);
            link.style.display = 'none';
        } else {
            console.log(`TS - Showing sidebar item: ${href} (access granted with privileges: ${privileges.join(', ')})`);
            link.style.display = 'flex';
        }
    });
    
    // Hide content sections based on privileges
    hideDashboardSections(privileges);
    
    // Special handling for TS privilege - remove specific items if TS only
    if (privileges.includes('TS') && privileges.length === 1) {
        // TS only has access to Transactions, hide others
        hideSpecificSidebarItems(['psr.html', 'tk.html', 'pm.html']);
    }
    
    // Check if current user should have access to this page
    if (!privileges.includes('TS')) {
        console.warn('TS - User does not have TS privilege, should not access this page');
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
        if (!section) return;
        
        const requiredPrivileges = sectionPrivilegeMap[sectionId];
        let hasAccess = false;
        
        // Check if user has any of the required privileges for this section
        privileges.forEach(privilege => {
            if (requiredPrivileges.includes(privilege)) {
                hasAccess = true;
            }
        });
        
        if (!hasAccess) {
            console.log(`TS - Hiding content section: ${sectionId} (no access with privileges: ${privileges.join(', ')})`);
            section.style.display = 'none';
        } else {
            console.log(`TS - Showing content section: ${sectionId} (access granted with privileges: ${privileges.join(', ')})`);
            section.style.display = 'block';
        }
    });
}

function hideSpecificSidebarItems(itemsToHide) {
    itemsToHide.forEach(href => {
        const link = document.querySelector(`nav a[href="${href}"]`);
        if (link) {
            console.log(`TS - Specifically hiding: ${href}`);
            link.style.display = 'none';
        }
    });
}

function showAccessDeniedMessage() {
    // Create access denied message
    const message = document.createElement('div');
    message.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    message.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
            <div class="text-center">
                <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p class="text-gray-600 mb-4">You don't have permission to access the Transactions module.</p>
                <button onclick="window.location.href='dashboard.html'" class="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(message);
}

// Additional TS-specific functions can be added here
// function initializeTransactionFeatures() {
//     // Transaction-specific functionality
// }
