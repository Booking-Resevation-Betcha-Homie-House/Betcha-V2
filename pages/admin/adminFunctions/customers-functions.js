// Customer Functions for Admin Dashboard

// API Base URL
const API_BASE = 'https://betcha-api.onrender.com';

let customers = []; // Store all customers for searching (like allProperties in property-functions.js)
let allCustomers = []; // Additional storage to match property.js pattern exactly
let currentCustomer = null; // Track the customer currently shown in modal

// Use full API URL
const apiUrl = `${API_BASE}/guest/display`;

// Initialize the customer manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchCustomers();
        renderCustomers();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing customer manager:', error);
        showErrorState('Failed to load customers. Please try again.');
    }
});

async function fetchCustomers() {
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // The API returns a direct array of customers
        if (Array.isArray(data)) {
            customers = data;
            allCustomers = data; // Store for search functionality like property-functions.js
        } else {
            throw new Error('Invalid response format from API - expected array');
        }
        
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
}

function renderCustomers() {
    // Hide loading state
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
        loadingState.style.display = 'none';
    }

    // Find the tab content containers using specific IDs
    const activeTab = document.getElementById('active-tab');
    const inactiveTab = document.getElementById('inactive-tab');
    
    if (!activeTab || !inactiveTab) {
        console.error('Could not find active-tab or inactive-tab elements');
        return;
    }
    
    // Clear existing content
    const activeGrid = activeTab.querySelector('.grid');
    const inactiveGrid = inactiveTab.querySelector('.grid');
    
    if (activeGrid) activeGrid.innerHTML = '';
    if (inactiveGrid) inactiveGrid.innerHTML = '';

    // Separate active and inactive customers - handle both string and boolean values
    const activeCustomers = customers.filter(customer => {
        // Handle string "false", boolean false, undefined, or null as active
        return customer.archived === "false" || customer.archived === false || !customer.archived;
    });
    const inactiveCustomers = customers.filter(customer => {
        // Handle string "true" or boolean true as inactive
        return customer.archived === "true" || customer.archived === true;
    });

    // Render active customers
    if (activeCustomers.length > 0) {
        activeCustomers.forEach((customer) => {
            const customerCard = createCustomerCard(customer);
            if (activeGrid) {
                activeGrid.appendChild(customerCard);
            }
        });
    } else {
        if (activeGrid) activeGrid.innerHTML = createEmptyState('No active customers found');
    }

    // Render inactive customers
    if (inactiveCustomers.length > 0) {
        inactiveCustomers.forEach((customer) => {
            const customerCard = createCustomerCard(customer);
            if (inactiveGrid) {
                inactiveGrid.appendChild(customerCard);
            }
        });
    } else {
        if (inactiveGrid) inactiveGrid.innerHTML = createEmptyState('No inactive customers found');
    }

    // Update tab counts if needed
    updateTabCounts(activeCustomers.length, inactiveCustomers.length);

    // Always show the active tab by default after rendering
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        showTab(0); // Always show active tab by default
    }, 100);

    // If no customers at all, show a message
    if (customers.length === 0) {
        if (activeGrid) activeGrid.innerHTML = createEmptyState('No customers found in the system');
        if (inactiveGrid) inactiveGrid.innerHTML = createEmptyState('No customers found in the system');
    }
}

function createCustomerCard(customer) {
    const cardContainer = document.createElement('div');
    
    // Get first letter of firstname for avatar
    const firstLetter = customer.firstname ? customer.firstname.charAt(0).toUpperCase() : '?';
    
    // Calculate violations/warnings
    const violationCount = customer.warning || 0;

    // Handle profile picture - check if pfplink exists and is not empty
    const hasProfilePic = customer.pfplink && customer.pfplink.trim() !== '';

    cardContainer.innerHTML = `
        <div class="bg-white rounded-3xl shadow-md flex flex-col gap-5 font-inter p-5 items-center group
            hover:shadow-lg cursor-pointer
            transition-all duration-300 ease-in-out">
            
            <!-- Image -->
            <div class="w-32 h-32 bg-primary text-white rounded-full flex items-center justify-center text-4xl font-semibold font-manrope uppercase">
                ${hasProfilePic ? 
                    `<img src="${customer.pfplink}" alt="Profile" class="w-full h-full rounded-full object-cover" onerror="this.style.display='none'; this.parentElement.innerHTML='${firstLetter}';">` : 
                    `<svg class="h-full aspect-square fill-secondary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C10.9 12 9.95833 11.6083 9.175 10.825C8.39167 10.0417 8 9.1 8 8C8 6.9 8.39167 5.95833 9.175 5.175C9.95833 4.39167 10.9 4 12 4C13.1 4 14.0417 4.39167 14.825 5.175C15.6083 5.95833 16 6.9 16 8C16 9.1 15.6083 10.0417 14.825 10.825C14.0417 11.6083 13.1 12 12 12ZM4 18V17.2C4 16.6333 4.146 16.1127 4.438 15.638C4.73 15.1633 5.11733 14.8007 5.6 14.55C6.63333 14.0333 7.68333 13.646 8.75 13.388C9.81667 13.13 10.9 13.0007 12 13C13.1 12.9993 14.1833 13.1287 15.25 13.388C16.3167 13.6473 17.3667 14.0347 18.4 14.55C18.8833 14.8 19.271 15.1627 19.563 15.638C19.855 16.1133 20.0007 16.634 20 17.2V18C20 18.55 19.8043 19.021 19.413 19.413C19.0217 19.805 18.5507 20.0007 18 20H6C5.45 20 4.97933 19.8043 4.588 19.413C4.19667 19.0217 4.00067 18.5507 4 18Z"/>
                    </svg>`
                }
            </div>
            
            <!-- Content -->
            <div class="flex flex-col justify-center gap-2 text-neutral-500 items-center">
                <p class="text-base font-bold font-manrope text-primary-text 
                    transition-all duration-300 ease-in-out
                    group-hover:text-primary">
                    ${customer.firstname} ${customer.minitial || ''} ${customer.lastname}
                </p>
                <div class="flex items-center gap-2">
                    <svg class="w-4 stroke-neutral-500" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.4546 2.33325H4.45463C2.98187 2.33325 1.78796 3.52716 1.78796 4.99992V10.9999C1.78796 12.4727 2.98187 13.6666 4.45463 13.6666H11.4546C12.9274 13.6666 14.1213 12.4727 14.1213 10.9999V4.99992C14.1213 3.52716 12.9274 2.33325 11.4546 2.33325Z" stroke-width="1.5"/>
                        <path d="M1.81934 5.05981L6.62267 7.81315C7.02519 8.04672 7.48229 8.16974 7.94767 8.16974C8.41305 8.16974 8.87015 8.04672 9.27267 7.81315L14.0893 5.05981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="text-xs">${customer.email}</p>
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 fill-neutral-500" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.54134 7.17467C5.48667 3.72467 6.45934 2 8 2C9.54067 2 10.5133 3.72467 12.4587 7.17467L12.7013 7.604C14.318 10.4707 15.1267 11.904 14.396 12.952C13.6653 14 11.8573 14 8.24267 14H7.75734C4.14267 14 2.33467 14 1.604 12.952C0.873336 11.904 1.682 10.4707 3.29867 7.604L3.54134 7.17467ZM8 4.83333C8.13261 4.83333 8.25979 4.88601 8.35356 4.97978C8.44732 5.07355 8.5 5.20073 8.5 5.33333V8.66667C8.5 8.79928 8.44732 8.92645 8.35356 9.02022C8.25979 9.11399 8.13261 9.16667 8 9.16667C7.86739 9.16667 7.74022 9.11399 7.64645 9.02022C7.55268 8.92645 7.5 8.79928 7.5 8.66667V5.33333C7.5 5.20073 7.55268 5.07355 7.64645 4.97978C7.74022 4.88601 7.86739 4.83333 8 4.83333ZM8 11.3333C8.17681 11.3333 8.34638 11.2631 8.47141 11.1381C8.59643 11.013 8.66667 10.8435 8.66667 10.6667C8.66667 10.4899 8.59643 10.3203 8.47141 10.1953C8.34638 10.0702 8.17681 10 8 10C7.82319 10 7.65362 10.0702 7.5286 10.1953C7.40357 10.3203 7.33334 10.4899 7.33334 10.6667C7.33334 10.8435 7.40357 11.013 7.5286 11.1381C7.65362 11.2631 7.82319 11.3333 8 11.3333Z"/>
                    </svg>
                    <p class="text-xs">Violations: <span>${violationCount}</span></p> 
                </div>
            </div>
        </div>
    `;

    // Add click event to show customer details in modal
    cardContainer.addEventListener('click', async () => {
        await showCustomerDetails(customer);
    });

    return cardContainer;
}

function createEmptyState(message) {
    return `
        <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <svg class="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <h3 class="text-lg font-medium text-neutral-900 mb-2">No customers found</h3>
            <p class="text-neutral-500">${message}</p>
        </div>
    `;
}

function updateTabCounts(activeCount, inactiveCount) {
    // Update tab button text to show counts
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    if (tabButtons.length >= 2) {
        const activeTabBtn = tabButtons[0];
        const inactiveTabBtn = tabButtons[1];
        
        if (activeTabBtn) {
            activeTabBtn.innerHTML = `<span class="text-primary text-sm group-hover:text-primary">Active (${activeCount})</span>`;
        }
        
        if (inactiveTabBtn) {
            inactiveTabBtn.innerHTML = `<span class="text-neutral-500 text-sm group-hover:text-primary">Inactive (${inactiveCount})</span>`;
        }
    }
}

function setupEventListeners() {
    // Deactivate button functionality
    const deactivateBtn = document.getElementById('deactivateCustomerBtn');
    if (deactivateBtn) {
        deactivateBtn.addEventListener('click', handleCustomerDeactivation);
    }

    // Tab button functionality
    const activeTabBtn = document.getElementById('active-customer-tab');
    const inactiveTabBtn = document.getElementById('inactive-customer-tab');
    
    if (activeTabBtn) {
        activeTabBtn.removeAttribute('onclick');
        activeTabBtn.addEventListener('click', () => showTab(0));
    }
    
    if (inactiveTabBtn) {
        inactiveTabBtn.removeAttribute('onclick');
        inactiveTabBtn.addEventListener('click', () => showTab(1));
    }
}

function clearSearch() {
    const searchInput = document.getElementById('customer-search');
    if (searchInput) {
        searchInput.value = '';
        // Reset to show all customers like property-functions.js does with all properties
        customers = allCustomers;
        renderCustomers();
    }
}

// Function to handle tab switching for customer tabs
function setActiveTab(tabIndex) {
    showTab(tabIndex);
}

// Make setActiveTab globally accessible for customer tabs
window.setActiveTab = setActiveTab;

function showTab(tabIndex) {
    const activeTab = document.getElementById('active-tab');
    const inactiveTab = document.getElementById('inactive-tab');
    const activeTabBtn = document.getElementById('active-customer-tab');
    const inactiveTabBtn = document.getElementById('inactive-customer-tab');
    
    // Hide all tabs
    if (activeTab) {
        activeTab.classList.add('hidden');
    }
    if (inactiveTab) {
        inactiveTab.classList.add('hidden');
    }
    
    // Remove active styles from all buttons
    if (activeTabBtn) {
        activeTabBtn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
        const activeSpan = activeTabBtn.querySelector('span');
        if (activeSpan) {
            activeSpan.classList.remove('text-primary');
            activeSpan.classList.add('text-neutral-500');
        }
    }
    
    if (inactiveTabBtn) {
        inactiveTabBtn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
        const inactiveSpan = inactiveTabBtn.querySelector('span');
        if (inactiveSpan) {
            inactiveSpan.classList.remove('text-primary');
            inactiveSpan.classList.add('text-neutral-500');
        }
    }
    
    // Show selected tab and update button styles
    if (tabIndex === 0) {
        // Show active customers tab
        if (activeTab) {
            activeTab.classList.remove('hidden');
        }
        if (activeTabBtn) {
            activeTabBtn.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
            const span = activeTabBtn.querySelector('span');
            if (span) {
                span.classList.add('text-primary');
                span.classList.remove('text-neutral-500');
            }
        }
    } else if (tabIndex === 1) {
        // Show inactive customers tab
        if (inactiveTab) {
            inactiveTab.classList.remove('hidden');
        }
        if (inactiveTabBtn) {
            inactiveTabBtn.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
            const span = inactiveTabBtn.querySelector('span');
            if (span) {
                span.classList.add('text-primary');
                span.classList.remove('text-neutral-500');
            }
        }
    }
}

function renderFilteredCustomers(filteredCustomers, searchTerm = '') {
    // Hide loading state
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
        loadingState.style.display = 'none';
    }

    const activeTab = document.getElementById('active-tab');
    const inactiveTab = document.getElementById('inactive-tab');
    
    if (!activeTab || !inactiveTab) return;
    
    // Clear existing content
    const activeGrid = activeTab.querySelector('.grid');
    const inactiveGrid = inactiveTab.querySelector('.grid');
    
    if (activeGrid) activeGrid.innerHTML = '';
    if (inactiveGrid) inactiveGrid.innerHTML = '';

    // Separate filtered active and inactive customers
    const activeCustomers = filteredCustomers.filter(customer => !customer.archived);
    const inactiveCustomers = filteredCustomers.filter(customer => customer.archived);

    // Render filtered active customers
    if (activeCustomers.length > 0) {
        // Add search result header if filtering
        if (searchTerm) {
            const searchHeader = document.createElement('div');
            searchHeader.className = 'col-span-full mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg';
            searchHeader.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-blue-800">
                        <strong>${activeCustomers.length}</strong> active customer${activeCustomers.length !== 1 ? 's' : ''} found for "${searchTerm}"
                    </span>
                    <button onclick="clearSearch()" class="text-blue-600 hover:text-blue-800 underline text-sm">
                        Clear search
                    </button>
                </div>
            `;
            if (activeGrid) activeGrid.appendChild(searchHeader);
        }
        
        activeCustomers.forEach(customer => {
            const customerCard = createCustomerCard(customer);
            if (activeGrid) activeGrid.appendChild(customerCard);
        });
    } else {
        const message = searchTerm 
            ? `No active customers found matching "${searchTerm}"`
            : 'No active customers found';
        if (activeGrid) activeGrid.innerHTML = createEmptyState(message);
    }

    // Render filtered inactive customers
    if (inactiveCustomers.length > 0) {
        // Add search result header if filtering
        if (searchTerm) {
            const searchHeader = document.createElement('div');
            searchHeader.className = 'col-span-full mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg';
            searchHeader.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-gray-800">
                        <strong>${inactiveCustomers.length}</strong> inactive customer${inactiveCustomers.length !== 1 ? 's' : ''} found for "${searchTerm}"
                    </span>
                    <button onclick="clearSearch()" class="text-blue-600 hover:text-blue-800 underline text-sm">
                        Clear search
                    </button>
                </div>
            `;
            if (inactiveGrid) inactiveGrid.appendChild(searchHeader);
        }
        
        inactiveCustomers.forEach(customer => {
            const customerCard = createCustomerCard(customer);
            if (inactiveGrid) inactiveGrid.appendChild(customerCard);
        });
    } else {
        const message = searchTerm 
            ? `No inactive customers found matching "${searchTerm}"`
            : 'No inactive customers found';
        if (inactiveGrid) inactiveGrid.innerHTML = createEmptyState(message);
    }

    // Update tab counts
    updateTabCounts(activeCustomers.length, inactiveCustomers.length);

    // Show the active tab by default
    activeTab.classList.remove('hidden');
    inactiveTab.classList.add('hidden');

    // If no customers found at all, show message in active tab
    if (filteredCustomers.length === 0 && searchTerm) {
        if (activeGrid) {
            activeGrid.innerHTML = createEmptyState(`No customers found matching "${searchTerm}". Try a different search term.`);
        }
    }
}

// Function to fetch customer reports from the API
async function fetchCustomerReports(customerId) {
    try {
        const response = await fetch(`${API_BASE}/reports/${customerId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reports = await response.json();
        return reports;
    } catch (error) {
        console.error('Error fetching customer reports:', error);
        return [];
    }
}

async function showCustomerDetails(customer) {
    // Store the current customer for deactivation functionality
    currentCustomer = customer;
    
    // Get the modal element
    const modal = document.getElementById('violationModal');
    if (!modal) {
        console.error('Violation modal not found');
        return;
    }

    // Update customer name in modal
    const customerNameElement = modal.querySelector('.text-lg.font-bold.text-primary-text');
    if (customerNameElement) {
        customerNameElement.textContent = `${customer.firstname} ${customer.minitial || ''} ${customer.lastname}`;
    }

    // Update the violations section with customer details
    const violationsContainer = modal.querySelector('.overflow-y-auto.w-full.py-6');
    if (violationsContainer) {
        // Format join date
        const joinDate = customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown';
        
        // Calculate status
        const status = customer.archived ? 'Inactive' : (customer.warning ? 'Warning' : 'Active');
        const statusColor = customer.archived ? 'bg-gray-100 text-gray-700' : 
                           (customer.warning ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700');

        // Fetch customer reports
        const reports = await fetchCustomerReports(customer._id);

        violationsContainer.innerHTML = `
            <div class="bg-white rounded-xl px-4 py-3 border border-neutral-200 font-inter mb-4">
                <div class="flex items-center justify-between mb-3">
                    <p class="font-semibold text-primary-text tracking-wide">Customer Information</p>
                    <span class="text-xs px-2 py-1 rounded-full ${statusColor}">${status}</span>
                </div>
                
                <div class="space-y-2 text-sm">
                    <p class="text-neutral-700"><strong>Email:</strong> ${customer.email}</p>
                    <p class="text-neutral-700"><strong>Phone:</strong> ${customer.phoneNumber || 'Not provided'}</p>
                    <p class="text-neutral-700"><strong>Gender:</strong> ${customer.sex || 'Not specified'}</p>
                    <p class="text-neutral-700"><strong>Birthday:</strong> ${customer.birthday ? new Date(customer.birthday).toLocaleDateString() : 'Not provided'}</p>
                    <p class="text-neutral-700"><strong>Verified:</strong> ${customer.verified ? 'Yes' : 'No'}</p>
                    <p class="text-neutral-700"><strong>User Type:</strong> ${customer.userType || 'Guest'}</p>
                    <p class="text-neutral-700"><strong>Member Since:</strong> ${joinDate}</p>
                </div>
                
                ${customer.warning ? `
                    <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-yellow-800"><strong>⚠️ Warning Status:</strong> This customer has active warnings.</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="bg-white rounded-xl px-4 py-3 border border-neutral-200 font-inter">
                <div class="flex items-center justify-between mb-3">
                    <p class="font-semibold text-primary-text tracking-wide">Reports History</p>
                    <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">${reports.length} Reports</span>
                </div>
                
                ${reports.length > 0 ? `
                    <div class="space-y-3">
                        ${reports.map(report => {
                            const reportDate = new Date(report.dateCreated).toLocaleDateString();
                            return `
                                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    ${report.transNo}
                                                </span>
                                                <span class="text-xs text-gray-500">${reportDate}</span>
                                            </div>
                                            <div class="space-y-2">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-xs font-medium text-gray-700">Reported by:</span>
                                                    <span class="text-sm text-blue-700 font-semibold">${report.reportedBy}</span>
                                                </div>
                                                <div class="flex items-start gap-2">
                                                    <span class="text-xs font-medium text-gray-700 mt-0.5">Reason:</span>
                                                    <span class="text-sm text-gray-800 leading-relaxed">${report.reason || 'No reason specified'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex-shrink-0">
                                            <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <p class="text-sm text-neutral-500 text-center py-4">No reports found for this customer.</p>
                `}
            </div>
        `;
    }

    // Update the modal title section
    const modalTitleSection = modal.querySelector('.font-medium.text-primary.font-manrope');
    if (modalTitleSection) {
        modalTitleSection.textContent = 'Customer Details & Reports:';
    }

    // Update deactivate button based on customer status
    updateDeactivateButton(customer);

    // Show the modal
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function showErrorState(message) {
    // Hide loading state
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
        loadingState.style.display = 'none';
    }

    const tabContents = document.querySelectorAll('.tab-content');
    if (tabContents.length >= 1) {
        const activeTab = tabContents[0];
        const activeGrid = activeTab.querySelector('.grid');
        if (activeGrid) {
            activeGrid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <svg class="w-16 h-16 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Customers</h3>
                    <p class="text-red-500">${message}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition-colors">
                        Try Again
                    </button>
                </div>
            `;
        }
        // Show the active tab
        activeTab.classList.remove('hidden');
        // Hide other tabs
        if (tabContents.length >= 2) {
            tabContents[1].classList.add('hidden');
        }
    }
}

function updateDeactivateButton(customer) {
    const deactivateBtn = document.getElementById('deactivateCustomerBtn');
    if (!deactivateBtn) return;

    const buttonText = deactivateBtn.querySelector('span');
    
    if (customer.archived) {
        // Customer is already deactivated - show reactivate option
        deactivateBtn.classList.remove('bg-rose-700', 'disabled:bg-rose-700/60');
        deactivateBtn.classList.add('bg-green-600', 'disabled:bg-green-600/60');
        if (buttonText) {
            buttonText.textContent = 'Reactivate';
        }
    } else {
        // Customer is active - show deactivate option
        deactivateBtn.classList.remove('bg-green-600', 'disabled:bg-green-600/60');
        deactivateBtn.classList.add('bg-rose-700', 'disabled:bg-rose-700/60');
        if (buttonText) {
            buttonText.textContent = 'Deactivate';
        }
    }
}

async function handleCustomerDeactivation() {
    if (!currentCustomer) {
        console.error('No customer selected for deactivation');
        return;
    }

    const deactivateBtn = document.getElementById('deactivateCustomerBtn');
    if (!deactivateBtn) return;

    // Confirm the action
    const isArchived = currentCustomer.archived;
    const action = isArchived ? 'reactivate' : 'deactivate';
    const confirmMessage = `Are you sure you want to ${action} ${currentCustomer.firstname} ${currentCustomer.lastname}?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }

    // Disable button during API call
    deactivateBtn.disabled = true;
    const buttonText = deactivateBtn.querySelector('span');
    const originalText = buttonText ? buttonText.textContent : '';
    if (buttonText) {
        buttonText.textContent = 'Processing...';
    }

    try {
        // Use the correct API endpoints
        const endpoint = isArchived 
            ? `${API_BASE}/guest/unarchive/${currentCustomer._id}`
            : `${API_BASE}/guest/archive/${currentCustomer._id}`;

        let success = false;
        let response;

        try {
            // Use PUT method (confirmed working)
            response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                success = true;
            } else if (response.status === 404) {
                // If 404, try PATCH method as fallback
                response = await fetch(endpoint, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                success = response.ok;
            }
        } catch (fetchError) {
            console.warn('API endpoints not available:', fetchError.message);
        }

        if (success) {
            const result = await response.json();
            
            // Show success message immediately
            const successAction = !isArchived ? 'deactivated' : 'reactivated';
            alert(`Customer has been successfully ${successAction}!`);

            // Close the modal first
            const modal = document.getElementById('violationModal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }

            // Refresh data from API to get the latest state
            await refreshCustomerData();
        } else {
            // Fallback to local simulation if API is not available
            console.warn('API endpoints not available, using local simulation');
            
            // Update the customer in local array (demo mode)
            const customerIndex = customers.findIndex(c => c._id === currentCustomer._id);
            if (customerIndex !== -1) {
                customers[customerIndex].archived = !customers[customerIndex].archived;
                currentCustomer.archived = !currentCustomer.archived;
            }

            // Show demo success message
            const successAction = !isArchived ? 'deactivated' : 'reactivated';
            alert(`Customer has been ${successAction} (Demo Mode)!\n\nNote: The API endpoints are not yet available. This change is local only and will reset on page refresh.`);

            // Close the modal
            const modal = document.getElementById('violationModal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }

            // Refresh the display with current local data
            renderCustomers();
        }

        // Note: We removed the renderCustomers() call from here since it's now called in refreshCustomerData() or in the demo mode section above

    } catch (error) {
        console.error('Error updating customer status:', error);
        alert(`Failed to ${action} customer. Please try again. Error: ${error.message}`);
        
        // Restore button text
        if (buttonText) {
            buttonText.textContent = originalText;
        }
    } finally {
        // Re-enable button
        deactivateBtn.disabled = false;
    }
}

async function refreshCustomerData() {
    try {
        // Show a subtle loading indicator (optional)
        const searchInput = document.getElementById('customer-search');
        let searchTerm = '';
        if (searchInput) {
            searchTerm = searchInput.value.trim();
        }

        // Fetch fresh data from API
        await fetchCustomers();
        
        // Re-apply search if there was a search term
        if (searchTerm) {
            const value = searchTerm.toLowerCase();
            const filtered = allCustomers.filter(customer => {
                const firstName = customer.first_name || customer.firstname || '';
                const lastName = customer.last_name || customer.lastname || '';
                const email = customer.email || '';
                const fullName = `${firstName} ${lastName}`.trim();
                
                return firstName.toLowerCase().includes(value) ||
                       lastName.toLowerCase().includes(value) ||
                       fullName.toLowerCase().includes(value) ||
                       email.toLowerCase().includes(value);
            });
            customers = filtered;
        } else {
            customers = allCustomers;
        }
        
        renderCustomers();
    } catch (error) {
        console.error('Error refreshing customer data:', error);
        // Fall back to rendering current data
        renderCustomers();
    }
}

// Additional search initialization - exactly like property.js pattern
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('customer-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim().toLowerCase();
            const filtered = allCustomers.filter(customer => {
                // Search across multiple customer fields like property searches by name
                const firstName = customer.first_name || customer.firstname || '';
                const lastName = customer.last_name || customer.lastname || '';
                const email = customer.email || '';
                const fullName = `${firstName} ${lastName}`.trim();
                
                return firstName.toLowerCase().includes(value) ||
                       lastName.toLowerCase().includes(value) ||
                       fullName.toLowerCase().includes(value) ||
                       email.toLowerCase().includes(value);
            });
            
            // Update customers array and render like property-functions.js does
            customers = filtered;
            renderCustomers();
        });
    }
});
