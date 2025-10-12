// Audit Trail Functions
let auditData = [];
let filteredData = [];
let customerData = []; // Store customer data for name mapping
let customerNameMap = new Map(); // Map userId to customer name

// Fetch audit trail data from API
async function fetchAuditTrails() {
    try {
        // Show loading state for the current active tab
        showLoadingState();
        
        // Add a small delay to ensure skeleton is visible
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Fetch both audit trails and customer data
        const [auditResponse, customerResponse] = await Promise.all([
            fetch('https://betcha-api.onrender.com/audit/getAll'),
            fetch('https://betcha-api.onrender.com/guest/display')
        ]);
        
        if (!auditResponse.ok) {
            throw new Error(`HTTP error! status: ${auditResponse.status}`);
        }
        
        if (!customerResponse.ok) {
            console.warn('Could not fetch customer data, will use user IDs instead');
        }
        
        auditData = await auditResponse.json();
        filteredData = [...auditData];
        
        // Process customer data if available
        if (customerResponse.ok) {
            customerData = await customerResponse.json();
            createCustomerNameMap();
        }
        
        console.log('Fetched audit data:', auditData);
        console.log('Available user types:', [...new Set(auditData.map(item => item.userType))]);
        console.log('Fetched customer data:', customerData);
        
        // Debug: Show sample audit item structure
        if (auditData.length > 0) {
            console.log('Sample audit item structure:', auditData[0]);
            console.log('All refNo values:', auditData.map(item => ({ refNo: item.refNo, type: typeof item.refNo })));
        }
        
        // Set up search functionality after data is loaded
        console.log('Setting up search functionality...');
        setupSearch();
        console.log('Search setup completed');
        
        // Don't automatically render here - let the calling function handle it
        
    } catch (error) {
        console.error('Error fetching audit trails:', error);
        hideLoadingState();
        showErrorMessage('Failed to load audit trail data: ' + error.message);
    }
}

// Create a mapping from userId to customer name
function createCustomerNameMap() {
    customerNameMap.clear();
    customerData.forEach(customer => {
        if (customer._id && customer.firstname && customer.lastname) {
            const fullName = `${customer.firstname} ${customer.lastname}`;
            customerNameMap.set(customer._id, fullName);
        }
    });
    console.log('Created customer name map:', customerNameMap);
}

// Get display name for a user (customer name if available, otherwise userId)
function getDisplayName(userId, userType) {
    if (userType === 'Guest' && customerNameMap.has(userId)) {
        return customerNameMap.get(userId);
    }
    return userId || 'N/A';
}

// Filter data by user type
function filterByUserType(userType) {
    console.log('=== FILTERING DEBUG ===');
    console.log('Filtering by user type:', userType);
    console.log('Total audit data count:', auditData.length);
    console.log('Available user types in data:', [...new Set(auditData.map(item => item.userType))]);
    
    if (userType === 'Guest') {
        console.log('Note: Filtering for "Guest" userType (displayed as "Customer" in UI)');
        console.log('Sample Guest data:', auditData.filter(item => item.userType === 'Guest').slice(0, 2));
    }
    
    if (userType === 'All') {
        filteredData = [...auditData];
    } else {
        filteredData = auditData.filter(item => item.userType === userType);
    }
    
    console.log('Filtered data count:', filteredData.length);
    console.log('Filtered data sample:', filteredData.slice(0, 2));
    console.log('=== END FILTERING DEBUG ===');
    
    // If no data for this user type, show appropriate message
    if (filteredData.length === 0) {
        showNoDataMessage(userType);
    } else {
        renderAuditTrails();
    }
}

// Render audit trails in the current tab
function renderAuditTrails() {
    console.log('=== RENDERING DEBUG ===');
    console.log('Rendering audit trails with filtered data count:', filteredData.length);
    
    const tabIndex = getCurrentTabIndex();
    const elementIds = getTabElementIds(tabIndex);
    const gridContainer = document.getElementById(elementIds.content);
    
    if (gridContainer) {
        console.log(`Grid container found for tab ${tabIndex}`);
        gridContainer.innerHTML = '';
        
        if (filteredData.length === 0) {
            console.log('No filtered data, showing no data message');
            gridContainer.innerHTML = `
                <div class="col-span-full flex items-center justify-center h-32">
                    <p class="text-neutral-500 text-center">No audit trails found for this user type.</p>
                </div>
            `;
            hideLoadingState();
            return;
        }
        
        console.log(`Rendering ${filteredData.length} audit cards`);
        filteredData.forEach((audit, auditIndex) => {
            const auditCardHTML = createAuditCard(audit);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = auditCardHTML;
            const auditCard = tempDiv.firstElementChild;
            gridContainer.appendChild(auditCard);
            console.log(`Added audit card ${auditIndex + 1} to grid`);
        });
        
        // Hide skeleton and show content
        hideLoadingState();
    } else {
        console.log(`No grid container found for tab ${tabIndex}`);
    }
    
    console.log('=== END RENDERING DEBUG ===');
}

// Create individual audit trail card
function createAuditCard(audit) {
    // Format date
    let formattedDate = 'N/A';
    try {
        const dateString = audit.dateTimePH || audit.dateTime;
        if (dateString) {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
        }
    } catch (error) {
        console.error('Error formatting date:', error);
    }

    // Map Guest to Customer for display
    const displayUserType = audit.userType === 'Guest' ? 'Customer' : audit.userType;

    return `
        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${
                        displayUserType === 'Admin' ? 'bg-red-100 text-red-800' :
                        displayUserType === 'Employee' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                    }">
                        ${displayUserType}
                    </span>
                </div>
                <span class="text-xs text-neutral-500">${formattedDate}</span>
            </div>
            
            <div class="space-y-2">
                <div>
                    <span class="text-sm font-medium text-neutral-700">${displayUserType === 'Customer' ? 'Customer Name:' : 'User ID:'}</span>
                    <span class="text-sm text-neutral-600 ml-2">${getDisplayName(audit.userId, audit.userType)}</span>
                </div>
                <div>
                    <span class="text-sm font-medium text-neutral-700">Activity:</span>
                    <span class="text-sm text-neutral-600 ml-2">${audit.activity || 'N/A'}</span>
                </div>
                <div>
                    <span class="text-sm font-medium text-neutral-700">Reference #:</span>
                    <span class="text-sm text-neutral-600 ml-2">${audit.refNo || 'N/A'}</span>
                </div>
                <div>
                    <span class="text-sm font-medium text-neutral-700">User Type:</span>
                    <span class="text-sm text-neutral-600 ml-2">${displayUserType}</span>
                </div>
            </div>
        </div>
    `;
}



// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('audit-search');
    if (searchInput) {
        console.log('Search input found, setting up event listener');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            console.log('Search term entered:', searchTerm);
            performSearch(searchTerm);
        });
    } else {
        console.error('Search input not found!');
    }
}

// Perform search on audit data
function performSearch(searchTerm) {
    console.log('=== SEARCH DEBUG ===');
    console.log('Search term:', searchTerm);
    console.log('Total audit data count:', auditData.length);
    console.log('Current filtered data count:', filteredData.length);
    
    if (!searchTerm.trim()) {
        console.log('Empty search term, showing current filtered data');
        // If search is empty, show current filtered data
        renderAuditTrails();
        return;
    }
    
    // Search across ALL audit data, not just filtered data
    const searchResults = auditData.filter(audit => {
        const displayName = getDisplayName(audit.userId, audit.userType);
        
        // Convert all values to strings for safe searching
        const activityStr = audit.activity ? String(audit.activity).toLowerCase() : '';
        const userIdStr = audit.userId ? String(audit.userId).toLowerCase() : '';
        const displayNameStr = displayName ? String(displayName).toLowerCase() : '';
        const userTypeStr = audit.userType ? String(audit.userType).toLowerCase() : '';
        const refNoStr = audit.refNo ? String(audit.refNo).toLowerCase() : '';
        
        const matches = activityStr.includes(searchTerm) ||
                       userIdStr.includes(searchTerm) ||
                       displayNameStr.includes(searchTerm) ||
                       userTypeStr.includes(searchTerm) ||
                       refNoStr.includes(searchTerm);
        
        if (matches) {
            console.log('Match found:', {
                userId: audit.userId,
                userType: audit.userType,
                activity: audit.activity,
                displayName: displayName,
                refNo: audit.refNo,
                searchTerm: searchTerm,
                matchedFields: {
                    activity: activityStr.includes(searchTerm),
                    userId: userIdStr.includes(searchTerm),
                    displayName: displayNameStr.includes(searchTerm),
                    userType: userTypeStr.includes(searchTerm),
                    refNo: refNoStr.includes(searchTerm)
                }
            });
        }
        
        return matches;
    });
    
    console.log('Search results count:', searchResults.length);
    console.log('=== END SEARCH DEBUG ===');
    
    // Render search results
    renderSearchResults(searchResults);
}

// Render search results
function renderSearchResults(results) {
    console.log('=== RENDERING SEARCH RESULTS DEBUG ===');
    console.log('Rendering search results:', results.length);
    
    const tabIndex = getCurrentTabIndex();
    const elementIds = getTabElementIds(tabIndex);
    const gridContainer = document.getElementById(elementIds.content);
    
    if (gridContainer) {
        console.log(`Grid container found for tab ${tabIndex}, clearing and rendering search results`);
        gridContainer.innerHTML = '';
        
        if (results.length === 0) {
            console.log('No search results, showing no results message');
            gridContainer.innerHTML = `
                <div class="col-span-full flex items-center justify-center h-32">
                    <p class="text-neutral-500 text-center">No results found for your search.</p>
                </div>
            `;
            hideLoadingState();
            return;
        }
        
        console.log(`Rendering ${results.length} search result cards`);
        results.forEach((audit, auditIndex) => {
            const auditCardHTML = createAuditCard(audit);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = auditCardHTML;
            const auditCard = tempDiv.firstElementChild;
            gridContainer.appendChild(auditCard);
            console.log(`Added search result card ${auditIndex + 1} to grid`);
        });
        
        // Hide skeleton and show content
        hideLoadingState();
    } else {
        console.log(`No grid container found for tab ${tabIndex}`);
    }
    
    console.log('=== END RENDERING SEARCH RESULTS DEBUG ===');
}

// Get current active tab index
function getCurrentTabIndex() {
    const tabContents = document.querySelectorAll('#tab-contents .tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        if (!tabContents[i].classList.contains('hidden')) {
            return i;
        }
    }
    return 0; // Default to first tab
}

// Get tab-specific element IDs
function getTabElementIds(tabIndex) {
    const tabNames = ['Admin', 'Employee', 'Customer'];
    const tabName = tabNames[tabIndex] || 'Admin';
    return {
        skeleton: `auditSkeleton${tabName}`,
        content: `auditContent${tabName}`
    };
}

// Show loading state with skeleton
function showLoadingState() {
    const tabIndex = getCurrentTabIndex();
    const elementIds = getTabElementIds(tabIndex);
    
    const skeletonContainer = document.getElementById(elementIds.skeleton);
    const contentContainer = document.getElementById(elementIds.content);
    
    if (skeletonContainer) skeletonContainer.classList.remove('hidden');
    if (contentContainer) contentContainer.classList.add('hidden');
}

// Hide skeleton and show content
function hideLoadingState() {
    const tabIndex = getCurrentTabIndex();
    const elementIds = getTabElementIds(tabIndex);
    
    const skeletonContainer = document.getElementById(elementIds.skeleton);
    const contentContainer = document.getElementById(elementIds.content);
    
    if (skeletonContainer) skeletonContainer.classList.add('hidden');
    if (contentContainer) contentContainer.classList.remove('hidden');
}

// Show no data message
function showNoDataMessage(userType) {
    const tabIndex = getCurrentTabIndex();
    const elementIds = getTabElementIds(tabIndex);
    const gridContainer = document.getElementById(elementIds.content);
    
    if (gridContainer) {
        // Map Guest to Customer for display
        const displayUserType = userType === 'Guest' ? 'Customer' : userType;
        gridContainer.innerHTML = `
            <div class="col-span-full flex items-center justify-center h-32">
                <p class="text-neutral-500 text-center">No audit trails found for ${displayUserType} users.</p>
            </div>
        `;
        // Hide skeleton and show content
        hideLoadingState();
    }
}

// Show error message
function showErrorMessage(message) {
    const tabIndex = getCurrentTabIndex();
    const elementIds = getTabElementIds(tabIndex);
    const gridContainer = document.getElementById(elementIds.content);
    
    if (gridContainer) {
        gridContainer.innerHTML = `
            <div class="col-span-full flex items-center justify-center h-32">
                <div class="text-center">
                    <div class="text-red-400 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                    <p class="text-red-500 mb-4">${message}</p>
                    <button onclick="fetchAuditTrails()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                        Retry
                    </button>
                </div>
            </div>
        `;
        // Hide skeleton and show content
        hideLoadingState();
    }
}

// Enhanced tab switching function for audit trails
function setActiveAuditTab(tabIndex) {
    console.log('=== TAB SWITCHING DEBUG ===');
    console.log('Switching to tab index:', tabIndex);
    
    const tabButtons = document.querySelectorAll('.flex.gap-1.bg-neutral-100.rounded-full.p-1.w-full.shadow-sm.my-5.md\\:max-w-md .tab-btn');
    const tabContents = document.querySelectorAll('#tab-contents .tab-content');
    
    console.log('Found tab buttons:', tabButtons.length);
    console.log('Found tab contents:', tabContents.length);
    
    // Remove active state from all buttons and their spans
    tabButtons.forEach(btn => {
        btn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
        const span = btn.querySelector('span');
        if (span) {
            span.classList.remove('text-primary');
            span.classList.add('text-neutral-500');
        }
    });
    
    // Hide all tab contents
    tabContents.forEach(content => content.classList.add('hidden'));
    
    // Activate selected tab
    if (tabButtons[tabIndex]) {
        console.log(`Activating tab button ${tabIndex}`);
        tabButtons[tabIndex].classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
        const span = tabButtons[tabIndex].querySelector('span');
        if (span) {
            span.classList.add('text-primary');
            span.classList.remove('text-neutral-500');
        }
    }
    
    if (tabContents[tabIndex]) {
        console.log(`Showing tab content ${tabIndex}`);
        tabContents[tabIndex].classList.remove('hidden');
    }
    
    // Filter data based on selected tab
    let userType;
    switch(tabIndex) {
        case 0: // Admin tab
            userType = 'Admin';
            break;
        case 1: // Employee tab
            userType = 'Employee';
            break;
        case 2: // Customer tab
            userType = 'Guest'; // Map Customer tab to Guest userType for filtering
            break;
        default:
            userType = 'All';
    }
    
    console.log(`Filtering for user type: ${userType}`);
    console.log('=== END TAB SWITCHING DEBUG ===');
    
    // Check if audit data is available
    if (auditData.length === 0) {
        console.log('No audit data available yet, showing loading state');
        showLoadingState();
        return;
    }
    
    // Show skeleton loading for the new tab
    showLoadingState();
    
    // Add a small delay to ensure skeleton is visible before filtering
    setTimeout(() => {
        filterByUserType(userType);
    }, 100);
}

// Initialize audit trail functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED DEBUG ===');
    
    // Check if search input exists
    const searchInput = document.getElementById('audit-search');
    console.log('Search input found on DOM load:', !!searchInput);
    
    // Set up tab button event listeners
    const tabButtons = document.querySelectorAll('.flex.gap-1.bg-neutral-100.rounded-full.p-1.w-full.shadow-sm.my-5.md\\:max-w-md .tab-btn');
    console.log('Found tab buttons:', tabButtons.length);
    
    tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            console.log(`Tab button ${index} clicked`);
            setActiveAuditTab(index);
        });
    });
    
    // First fetch audit trails data
    fetchAuditTrails().then(() => {
        // After data is loaded, initialize the Admin tab with the data
        console.log('Data loaded, now setting up Admin tab');
        setActiveAuditTab(0);
        
        // Double-check search setup after tab initialization
        console.log('Double-checking search setup after tab initialization...');
        setupSearch();
    });
    
    console.log('=== END DOM CONTENT LOADED DEBUG ===');
});

// Export functions for global use
window.auditTrailFunctions = {
    fetchAuditTrails,
    filterByUserType,
    performSearch,
    setActiveAuditTab
};

// Make functions available globally for HTML onclick handlers
window.setActiveAuditTab = setActiveAuditTab;
window.fetchAuditTrails = fetchAuditTrails;
