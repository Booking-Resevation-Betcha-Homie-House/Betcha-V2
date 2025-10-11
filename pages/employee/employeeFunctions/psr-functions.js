console.log('PSR Functions loaded');

import { showToastError, showToastSuccess, showToastWarning } from '/src/toastNotification.js';

const API_BASE_URL = 'https://betcha-api.onrender.com';

// Initialization will be handled at the bottom of the file

async function checkRolePrivileges() {
    try {
        const roleID = localStorage.getItem('roleID');
        if (!roleID) {
            console.warn('No roleID found in localStorage');
            return;
        }

        console.log('PSR - Checking privileges for roleID:', roleID);
        
        // Fetch role privileges from API
        const roleData = await fetchRolePrivileges(roleID);
        
        if (roleData && roleData.privileges) {
            console.log('PSR - Role privileges:', roleData.privileges);
            
            // Filter sidebar based on privileges
            filterSidebarByPrivileges(roleData.privileges);
        } else {
            console.error('No privileges found in role data');
        }
    } catch (error) {
        console.error('Error checking role privileges:', error);
    }
}

// Expose checkRolePrivileges to window for external access
window.checkRolePrivileges = checkRolePrivileges;

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
            console.log('PSR - Role data received:', data);
            return data;
        } else {
            console.error('Failed to fetch role privileges:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error fetching role privileges:', error);
        return null;
    }
}

function filterSidebarByPrivileges(privileges) {
            console.log('PSR - Filtering sidebar and content sections with privileges:', privileges);
    
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
            console.log(`PSR - Hiding sidebar item: ${href} (no access with privileges: ${privileges.join(', ')})`);
            link.style.display = 'none';
        } else {
            console.log(`PSR - Showing sidebar item: ${href} (access granted with privileges: ${privileges.join(', ')})`);
            link.style.display = 'flex';
        }
    });
    
    // Hide content sections based on privileges
    hideDashboardSections(privileges);
    
    // Special handling for PSR privilege - remove specific items if PSR only
    if (privileges.includes('PSR') && privileges.length === 1) {
        // PSR only has access to Property Summary Report, hide others
        hideSpecificSidebarItems(['ts.html', 'tk.html', 'pm.html']);
    }
    
    // Check if current user should have access to this page
    if (!privileges.includes('PSR')) {
        console.warn('PSR - User does not have PSR privilege, should not access this page');
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
            console.log(`PSR - Hiding content section: ${sectionId} (no access with privileges: ${privileges.join(', ')})`);
            section.style.display = 'none';
        } else {
            console.log(`PSR - Showing content section: ${sectionId} (access granted with privileges: ${privileges.join(', ')})`);
            section.style.display = 'block';
        }
    });
}

function hideSpecificSidebarItems(itemsToHide) {
    itemsToHide.forEach(href => {
        const link = document.querySelector(`nav a[href="${href}"]`);
        if (link) {
            console.log(`PSR - Specifically hiding: ${href}`);
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4
                          c-.77-.833-1.964-.833-2.732 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p class="text-gray-600 mb-4">You don't have permission to access the Property Summary Report module.</p>
                <button onclick="window.location.href='dashboard.html'"
                        class="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(message);
}

// API Data Loading Functions
async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');
        
        // Load all API data
        const [summaryData, peakBookingData, transactionsData] = await Promise.all([
            fetchAdminSummary(),
            fetchPeakBookingDay(),
            fetchTransactions()
        ]);
        
        console.log('API Data Results:');
        console.log('- Summary Data:', summaryData);
        console.log('- Peak Booking Data:', peakBookingData);
        console.log('- Transactions Data:', transactionsData);
        
        // Populate the UI with data
        populateEarningsData(summaryData);
        populatePeakBookingData(peakBookingData);
        populateTransactionsData(transactionsData);
        
        console.log('Dashboard data loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show user-friendly error message
        console.log('Loading failed, will use test data...');
        // testPropertyFilter(); // Fallback to test data
    }
}

async function fetchAdminSummary() {
    try {
        const response = await fetch('https://betcha-api.onrender.com/dashboard/admin/summary');
        const data = await response.json();
        console.log('Admin Summary Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching admin summary:', error);
        return null;
    }
}

async function fetchPeakBookingDay() {
    try {
        const response = await fetch('https://betcha-api.onrender.com/psr/peakBookingDay');
        const data = await response.json();
        console.log('Peak Booking Day Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching peak booking day:', error);
        return null;
    }
}

async function fetchTransactions() {
    try {
        console.log('Fetching transactions from API...');
        const response = await fetch('https://betcha-api.onrender.com/psr/transactions');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Transactions API Response:', data);
        console.log('Transactions Array Length:', Array.isArray(data) ? data.length : 'Not an array');
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return null;
    }
}

// UI Population Functions
function populateEarningsData(summaryData) {
    if (!summaryData || !summaryData.summary) {
        console.warn('No summary data available');
        return;
    }
    
    const { TotalEarningsThisWeek, TotalEarningsThisMonth, TotalEarningsThisYear } = summaryData.summary;
    
    // Format currency values
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };
    
    // Update earnings displays
    const yearEarningElement = document.getElementById('totalYearEarning');
    const monthEarningElement = document.getElementById('totalMonthEarning');
    const weekEarningElement = document.getElementById('totalWeekEarning');
    
    if (yearEarningElement) {
        yearEarningElement.textContent = formatCurrency(TotalEarningsThisYear);
    }
    
    if (monthEarningElement) {
        monthEarningElement.textContent = formatCurrency(TotalEarningsThisMonth);
    }
    
    if (weekEarningElement) {
        weekEarningElement.textContent = formatCurrency(TotalEarningsThisWeek);
    }
    
    console.log('Earnings data populated');
}

function populatePeakBookingData(peakData) {
    if (!peakData) {
        console.warn('No peak booking data available');
        return;
    }
    
    // Format date function
    const formatDate = (dateString) => {
        if (!dateString || dateString.includes('No bookings')) {
            return 'No bookings';
        }
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };
    
    // Find and update the busiest period cards
    const cards = document.querySelectorAll('.bg-white.rounded-xl.border.border-neutral-200');
    
    cards.forEach(card => {
        const titleElement = card.querySelector('span.text-lg');
        if (!titleElement) return;
        
        const title = titleElement.textContent.trim();
        const dateElement = card.querySelector('p.text-xl.font-bold');
        const bookingCountElement = card.querySelector('p.text-sm.text-neutral-500:last-child');
        
        if (title === 'Year' && peakData.year) {
            if (dateElement) {
                dateElement.textContent = formatDate(peakData.year.peakDay);
            }
            if (bookingCountElement) {
                bookingCountElement.textContent = peakData.year.peakDay.includes('No bookings') ? 'No bookings' : 'Peak day this year';
            }
        } else if (title === 'Month' && peakData.month) {
            if (dateElement) {
                dateElement.textContent = formatDate(peakData.month.peakDay);
            }
            if (bookingCountElement) {
                bookingCountElement.textContent = peakData.month.peakDay.includes('No bookings') ? 'No bookings' : 'Peak day this month';
            }
        } else if (title === 'Week' && peakData.week) {
            if (dateElement) {
                dateElement.textContent = formatDate(peakData.week.peakDay);
            }
            if (bookingCountElement) {
                bookingCountElement.textContent = peakData.week.peakDay.includes('No bookings') ? 'No bookings this week' : 'Peak day this week';
            }
        }
    });
    
    console.log('Peak booking data populated');
}

function populateTransactionsData(transactionsData) {
    if (!transactionsData || !Array.isArray(transactionsData)) {
        console.warn('No transactions data available or data is not an array');
        return;
    }
    
    console.log(`Processing ${transactionsData.length} transactions`);
    
    // Store original data for filtering
    window.originalTransactionsData = transactionsData;
    
    // Find the transactions container - look for the specific container on PSR page
    const transactionsContainer = document.querySelector('.space-y-4.overflow-y-auto');
    if (!transactionsContainer) {
        console.warn('Transactions container not found on PSR page');
        return;
    }
    
    // Clear existing transaction items (keep the first one as template)
    const existingItems = transactionsContainer.querySelectorAll('.grid.grid-cols-2.md\\:grid-cols-4');
    existingItems.forEach((item, index) => {
        if (index > 0) { // Keep the first item as template
            item.remove();
        }
    });
    
    // Populate property filter dropdown
    populatePropertyFilter(transactionsData);
    
    // Format date function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };
    
    // Format currency function
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };
    
    // Update the first transaction item with actual data and create new ones
    transactionsData.forEach((transaction, index) => {
        let transactionElement;
        
        if (index === 0) {
            // Update the existing first item
            transactionElement = transactionsContainer.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
        } else {
            // Clone the first item for new transactions
            const template = transactionsContainer.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
            transactionElement = template.cloneNode(true);
            transactionsContainer.appendChild(transactionElement);
        }
        
        if (transactionElement) {
            // Add data attribute for filtering
            const propertyName = transaction.propertyName || transaction.property || 'Unknown Property';
            transactionElement.setAttribute('data-property', propertyName);
            
            // Update transaction number
            const transNoElement = transactionElement.querySelector('p.text-sm.font-semibold.text-neutral-800.font-inter.truncate');
            if (transNoElement) {
                transNoElement.textContent = `#${transaction.transactionNo || transaction.id || 'N/A'}`;
            }
            
            // Update property name - find the second p element with the right classes
            const propertyElements = transactionElement.querySelectorAll('p.text-sm.font-semibold.text-neutral-800.font-inter.truncate');
            if (propertyElements.length > 1) {
                propertyElements[1].textContent = propertyName;
                propertyElements[1].title = propertyName; // Add tooltip for long names
            }
            
            // Update booking date - find the third p element
            if (propertyElements.length > 2) {
                propertyElements[2].textContent = formatDate(transaction.dateOfBooking || transaction.bookingDate || transaction.date || new Date());
            }
            
            // Update amount - find the span inside the last p element
            const amountSpan = transactionElement.querySelector('span');
            if (amountSpan) {
                amountSpan.textContent = formatCurrency(transaction.amount || transaction.totalAmount || 0);
            }
        }
    });
    
    console.log(`${transactionsData.length} transactions populated on PSR page`);
}

// Property Filter Functions
function populatePropertyFilter(transactionsData) {
    const propertyFilter = document.getElementById('propertyFilter');
    if (!propertyFilter) {
        console.warn('Property filter dropdown not found');
        return;
    }
    
    // Extract unique properties from transactions
    const uniqueProperties = [...new Set(transactionsData.map(transaction => 
        transaction.propertyName || transaction.property
    ).filter(Boolean))].sort();
    
    console.log(`Property filter: Found ${uniqueProperties.length} unique properties:`, uniqueProperties);
    
    // Clear existing options except "All Properties"
    propertyFilter.innerHTML = '<option value="">All Properties</option>';
    
    // Add property options
    uniqueProperties.forEach(property => {
        const option = document.createElement('option');
        option.value = property;
        option.textContent = property;
        propertyFilter.appendChild(option);
    });
    
    // Add event listener for filtering
    propertyFilter.removeEventListener('change', handlePropertyFilter); // Remove existing listener
    propertyFilter.addEventListener('change', handlePropertyFilter);
    
    console.log(`Property filter populated with ${uniqueProperties.length} properties`);
}

function handlePropertyFilter(event) {
    const selectedProperty = event.target.value;
    const transactionElements = document.querySelectorAll('.space-y-4.overflow-y-auto .grid.grid-cols-2.md\\:grid-cols-4');
    
    console.log(`Filtering by property: "${selectedProperty}"`);
    console.log(`Found ${transactionElements.length} transaction elements`);
    
    let visibleCount = 0;
    
    transactionElements.forEach((element, index) => {
        const elementProperty = element.getAttribute('data-property');
        console.log(`Element ${index + 1}: data-property = "${elementProperty}"`);
        
        if (selectedProperty === '' || elementProperty === selectedProperty) {
            // Show element
            element.style.display = 'grid';
            visibleCount++;
            console.log(`  -> Showing element ${index + 1}`);
        } else {
            // Hide element
            element.style.display = 'none';
            console.log(`  -> Hiding element ${index + 1}`);
        }
    });
    
    console.log(`Total visible transactions: ${visibleCount}`);
}

// Download Functionality
let isDownloading = false; // Prevent multiple concurrent downloads

async function handleDownload() {
    // Prevent multiple clicks
    if (isDownloading) {
        console.log('Download already in progress, ignoring click');
        return;
    }
    
    // Get button reference more reliably
    const downloadButton = document.querySelector('#generatePSRModal .bg-primary span') || 
                          document.querySelector('#generatePSRModal button:last-child span');
    
    console.log('Download button found:', !!downloadButton);
    
    // Set loading state
    isDownloading = true;
    
    try {
        console.log('=== DOWNLOAD FUNCTION CALLED ===');
        console.log('Starting download process...');
        
        // Get selected report type
        const selectedReportType = document.querySelector('input[name="reportType"]:checked');
        if (!selectedReportType) {
            showToastWarning('Missing Selection', 'Please select a report type');
            return;
        }
        
        const reportType = selectedReportType.value;
        
        console.log('Report Type:', reportType);
        
        // Validate and get form data based on report type
        const formData = getFormDataByReportType(reportType);
        if (!formData) {
            return; // Error message already shown in getFormDataByReportType
        }
        
        // Show loading state
        if (downloadButton) {
            downloadButton.textContent = 'Downloading...';
            console.log('Set button text to: Downloading...');
        }
        
        // Make API call based on report type
        const reportData = await fetchReportData(reportType, formData);
        
        if (reportData) {
            // Download file using the provided links
            await downloadFileFromResponse(reportData);
            
            // Log PSR report generation audit trail
            try {
                if (window.AuditTrailFunctions) {
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    const userId = userData._id || userData.userId || userData.user_id || 
                                  localStorage.getItem('employeeID') || localStorage.getItem('employeeId') || 
                                  localStorage.getItem('userId');
                    
                    if (userId && userId !== 'unknown') {
                        const userType = userData.role || 'Employee';
                        window.AuditTrailFunctions.logPSRReportGeneration(userId, userType).catch(auditError => {
                            console.error('Audit trail error:', auditError);
                        });
                    } else {
                        console.warn('No valid userId found for audit trail');
                    }
                }
            } catch (auditError) {
                console.error('Audit trail error:', auditError);
            }
            
            // Close modal on successful download
            document.getElementById('generatePSRModal').classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
        
    } catch (error) {
        console.error('Download error:', error);
        showToastError('Download Error', 'An error occurred while downloading the report. Please try again.');
    } finally {
        // Always restore button text and reset flag
        if (downloadButton) {
            downloadButton.textContent = 'Download';
            console.log('Restored button text to: Download');
        }
        isDownloading = false;
    }
}

// Helper function to get employee name from localStorage
function getEmployeeName() {
    try {
        const firstName = localStorage.getItem('firstName') || '';
        const lastName = localStorage.getItem('lastName') || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || 'Unknown Employee';
    } catch (error) {
        console.error('Error getting employee name:', error);
        return 'Unknown Employee';
    }
}

function getFormDataByReportType(reportType) {
    const processedBy = getEmployeeName();
    
    switch (reportType) {
        case 'weekly': {
            const week = document.getElementById('selectWeek').value;
            const weekMonth = document.getElementById('selectWeekMonth').value;
            const weekYear = document.getElementById('selectWeekYear').value;
            
            if (!week || !weekMonth || !weekYear) {
                showToastWarning('Missing Selection', 'Please select week, month, and year for weekly report');
                return null;
            }
            
            return {
                week: parseInt(week),
                month: parseInt(weekMonth),
                year: parseInt(weekYear),
                processedBy: processedBy
            };
        }
            
        case 'monthly': {
            const month = document.getElementById('selectMonth').value;
            const monthYear = document.getElementById('selectYear').value;
            
            if (!month || !monthYear) {
                showToastWarning('Missing Selection', 'Please select month and year for monthly report');
                return null;
            }
            
            return {
                month: parseInt(month),
                year: parseInt(monthYear),
                processedBy: processedBy
            };
        }
            
        case 'quarterly': {
            const quarter = document.getElementById('selectQuarter').value;
            const quarterYear = document.getElementById('selectQuarterYear').value;
            
            if (!quarter || !quarterYear) {
                showToastWarning('Missing Selection', 'Please select quarter and year for quarterly report');
                return null;
            }
            
            const quarterNumber = parseInt(quarter.replace('Q', ''));
            
            return {
                quarter: quarterNumber,
                year: parseInt(quarterYear),
                processedBy: processedBy
            };
        }
            
        case 'semi-annual': {
            const half = document.getElementById('selectHalf').value;
            const semiYear = document.getElementById('selectSemiYear').value;
            
            if (!half || !semiYear) {
                showToastWarning('Missing Selection', 'Please select half and year for semi-annual report');
                return null;
            }
            
            const halfNumber = parseInt(half.replace('H', ''));
            
            return {
                annual: halfNumber,
                year: parseInt(semiYear),
                processedBy: processedBy
            };
        }
            
        case 'annual': {
            const annualYear = document.getElementById('selectAnnualYear').value;
            
            if (!annualYear) {
                showToastWarning('Missing Selection', 'Please select year for annual report');
                return null;
            }
            
            return {
                year: parseInt(annualYear),
                processedBy: processedBy
            };
        }
            
        default:
            showToastError('Invalid Selection', 'Invalid report type selected');
            return null;
    }
}

async function fetchReportData(reportType, formData) {
    const baseUrl = 'https://betcha-api.onrender.com/new-psr';
    let endpoint;
    
    switch (reportType) {
        case 'weekly':
            endpoint = `${baseUrl}/week-summary`;
            break;
        case 'monthly':
            endpoint = `${baseUrl}/month-summary`;
            break;
        case 'quarterly':
            endpoint = `${baseUrl}/quarter-summary`;
            break;
        case 'semi-annual':
            endpoint = `${baseUrl}/semi-annual-summary`;
            break;
        case 'annual':
            endpoint = `${baseUrl}/annual-summary`;
            break;
        default:
            throw new Error('Invalid report type');
    }
    
    console.log('Fetching report data from:', endpoint);
    console.log('Request body:', formData);
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Report data received:', data);
        return data;
        
    } catch (error) {
        console.error('Error fetching report data:', error);
        showToastError('Network Error', 'Failed to fetch report data. Please check your connection and try again.');
        return null;
    }
}

async function downloadFileFromResponse(responseData) {
    try {
        console.log('Response data:', responseData);
        
        // Check if excelLink exists in response
        if (!responseData.excelLink) {
            throw new Error('No Excel link found in response');
        }
        
        const downloadUrl = responseData.excelLink;
        const fileName = responseData.excelLink.split('/').pop(); // Extract filename from path
        
        // Construct full URL (assuming the API base URL)
        const baseUrl = 'https://betcha-api.onrender.com';
        const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${baseUrl}${downloadUrl}`;
        
        console.log('Downloading from:', fullUrl);
        console.log('Message:', responseData.message);
        
        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName;
        link.target = '_blank'; // Open in new tab as fallback
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Excel file download initiated:', fileName);
        
        // Show success message
        if (responseData.message) {
            showToastSuccess('Report Generated', responseData.message);
        }
        
    } catch (error) {
        console.error('Download error:', error);
        throw error; // Re-throw to be handled by calling function
    }
}

// Keep the old functions for backward compatibility (commented out)
/*
async function generateAndDownloadFile(reportData, reportType, fileType, formData) {
    const fileName = generateFileName(reportType, fileType, formData);
    
    if (fileType === 'Excel') {
        generateExcelFile(reportData, fileName, reportType);
    } else if (fileType === 'Pdf') {
        generatePdfFile(reportData, fileName, reportType);
    }
}

function generateFileName(reportType, fileType, formData) {
    const extension = fileType === 'Excel' ? 'xlsx' : 'pdf';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    let periodInfo = '';
    
    switch (reportType) {
        case 'weekly':
            periodInfo = `Week${formData.week}_${formData.month}-${formData.year}`;
            break;
        case 'monthly':
            periodInfo = `Month${formData.month}_${formData.year}`;
            break;
        case 'quarterly':
            periodInfo = `Q${formData.quarter}_${formData.year}`;
            break;
        case 'semi-annual':
            periodInfo = `H${formData.annual}_${formData.year}`;
            break;
        case 'annual':
            periodInfo = `Year${formData.year}`;
            break;
    }
    
    return `PSR_${reportType}_${periodInfo}_${timestamp}.${extension}`;
}

function generateExcelFile(data, fileName, reportType) {
    // Create a simple CSV format that Excel can open
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header
    csvContent += "Property Summary Report\n";
    csvContent += `Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    // Add data based on structure
    if (data && typeof data === 'object') {
        // Add headers
        csvContent += "Field,Value\n";
        
        // Add data rows
        for (const [key, value] of Object.entries(data)) {
            csvContent += `"${key}","${value}"\n`;
        }
    }
    
    // Create and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName.replace('.xlsx', '.csv'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Log data export audit
    try {
        if (window.AuditTrailFunctions) {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData._id || userData.userId || userData.user_id || 
                          localStorage.getItem('employeeID') || localStorage.getItem('employeeId') || 
                          localStorage.getItem('userId');
            
            if (userId && userId !== 'unknown') {
                const userType = userData.role || 'employee';
                window.AuditTrailFunctions.logDataExport(userId, userType).catch(auditError => {
                    console.error('Audit trail error:', auditError);
                });
            } else {
                console.warn('No valid userId found for audit trail');
            }
        }
    } catch (auditError) {
        console.error('Audit trail error:', auditError);
    }
    
    console.log('Excel file downloaded:', fileName);
}

function generatePdfFile(data, fileName, reportType) {
    // Create a simple HTML content for PDF
    let htmlContent = `
        <html>
        <head>
            <title>Property Summary Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Property Summary Report</h1>
            <p><strong>Report Type:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (data && typeof data === 'object') {
        for (const [key, value] of Object.entries(data)) {
            htmlContent += `<tr><td>${key}</td><td>${value}</td></tr>`;
        }
    }
    
    htmlContent += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // Open print dialog (user can save as PDF)
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    console.log('PDF generated for:', fileName);
}
*/

let isModalInitialized = false;

function initializeBasicModal() {
    // Prevent multiple initializations
    if (isModalInitialized) {
        console.log('Modal already initialized, skipping...');
        return;
    }
    
    // Handle modal opening
    const modalButton = document.querySelector('[data-modal-target="generatePSRModal"]');
    const modal = document.getElementById('generatePSRModal');
    
    if (modalButton && modal) {
        modalButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Opening PSR modal');
            modal.classList.remove('hidden');
            document.body.classList.add('modal-open');
        });
        
        // Handle modal closing
        const closeButtons = modal.querySelectorAll('[data-close-modal]');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                console.log('Closing PSR modal');
                modal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            });
        });
        
        // Close on backdrop click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                console.log('Closing PSR modal via backdrop');
                modal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }
        });
        
        // Handle download button click
        const downloadButton = modal.querySelector('#downloadReportBtn');
        if (downloadButton) {
            downloadButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Download button clicked!');
                handleDownload();
            });
        } else {
            console.error('Download button not found in modal');
        }
        
        isModalInitialized = true;
        console.log('Modal initialized successfully');
    }
}

function initializePSRModal() {
    console.log('Initializing PSR Modal functionality');
    
    // Get all the radio buttons for report types
    const reportTypeRadios = document.querySelectorAll('input[name="reportType"]');
    const dynamicDropdowns = document.getElementById('dynamicDropdowns');
    
    if (!dynamicDropdowns) {
        console.error('Dynamic dropdowns container not found');
        return;
    }
    
    // Get all dropdown containers
    const weeklyDropdowns = document.getElementById('weeklyDropdowns');
    const monthlyDropdowns = document.getElementById('monthlyDropdowns');
    const quarterlyDropdowns = document.getElementById('quarterlyDropdowns');
    const semiAnnualDropdowns = document.getElementById('semiAnnualDropdowns');
    const annualDropdowns = document.getElementById('annualDropdowns');
    
    console.log('Found dropdown containers:', {
        weekly: !!weeklyDropdowns,
        monthly: !!monthlyDropdowns,
        quarterly: !!quarterlyDropdowns,
        semiAnnual: !!semiAnnualDropdowns,
        annual: !!annualDropdowns
    });
    
    // Populate year dropdowns
    populateYearDropdowns();
    
    // Add event listeners to radio buttons
    reportTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('Report type changed to:', this.value);
            showRelevantDropdowns(this.value);
        });
    });
    
    // Show default dropdowns (monthly)
    showRelevantDropdowns('monthly');
}

function showRelevantDropdowns(reportType) {
    console.log('Showing dropdowns for:', reportType);
    
    // Hide all dropdown containers
    const allContainers = [
        'weeklyDropdowns',
        'monthlyDropdowns', 
        'quarterlyDropdowns',
        'semiAnnualDropdowns',
        'annualDropdowns'
    ];
    
    allContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('hidden');
        }
    });
    
    // Show relevant dropdown container
    let targetContainerId;
    switch(reportType) {
        case 'weekly':
            targetContainerId = 'weeklyDropdowns';
            populateWeekDropdown();
            break;
        case 'monthly':
            targetContainerId = 'monthlyDropdowns';
            break;
        case 'quarterly':
            targetContainerId = 'quarterlyDropdowns';
            break;
        case 'semi-annual':
            targetContainerId = 'semiAnnualDropdowns';
            break;
        case 'annual':
            targetContainerId = 'annualDropdowns';
            break;
        default:
            targetContainerId = 'monthlyDropdowns';
    }
    
    const targetContainer = document.getElementById(targetContainerId);
    if (targetContainer) {
        targetContainer.classList.remove('hidden');
        console.log('Showed container:', targetContainerId);
    } else {
        console.error('Target container not found:', targetContainerId);
    }
}

function populateYearDropdowns() {
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    
    // Generate years from 2025 to current year
    for (let year = 2025; year <= currentYear; year++) {
        yearOptions.push(`<option value="${year}">${year}</option>`);
    }
    
    const yearSelectIds = [
        'selectYear',
        'selectWeekYear', 
        'selectQuarterYear',
        'selectSemiYear',
        'selectAnnualYear'
    ];
    
    yearSelectIds.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Choose Year</option>' + yearOptions.join('');
            console.log('Populated year dropdown:', selectId);
        }
    });
}

function populateWeekDropdown() {
    const weekSelect = document.getElementById('selectWeek');
    if (!weekSelect) return;
    
    const weekOptions = [];
    for (let week = 1; week <= 4; week++) {
        weekOptions.push(`<option value="${week}">Week ${week}</option>`);
    }
    
    weekSelect.innerHTML = '<option value="">Choose Week</option>' + weekOptions.join('');
    console.log('Populated week dropdown');
}

// Debug function to test modal
function testModal() {
    const modal = document.getElementById('generatePSRModal');
    const button = document.querySelector('[data-modal-target="generatePSRModal"]');
    
    console.log('Modal element:', modal);
    console.log('Button element:', button);
    
    if (modal && button) {
        console.log('Modal classes:', modal.className);
        console.log('Button attributes:', button.getAttribute('data-modal-target'));
    }
}

// Make test function available globally for debugging
window.testPSRModal = testModal;

// Test function to verify property filter with mock data
function testPropertyFilter() {
    const mockTransactions = [
        {
            transactionNo: '0000075',
            propertyName: 'Mark Room',
            dateOfBooking: '2025-10-11',
            amount: 3000
        },
        {
            transactionNo: '0000074',
            propertyName: 'Seaside Villa',
            dateOfBooking: '2025-10-11',
            amount: 5000
        },
        {
            transactionNo: '0000073',
            propertyName: 'Mark Room',
            dateOfBooking: '2025-10-10',
            amount: 3000
        }
    ];
    
    console.log('Testing with mock data:', mockTransactions);
    populateTransactionsData(mockTransactions);
}

// Make test function available globally
window.testPropertyFilter = testPropertyFilter;

// Single initialization point
function initializePage() {
    console.log('Initializing PSR page...');
    initializePSRModal();
    initializeBasicModal();
    loadDashboardData();
    
    // Remove automatic test - only manual testing via button now
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
