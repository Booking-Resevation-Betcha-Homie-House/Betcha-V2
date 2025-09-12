

console.log('PSR Functions loaded');

const API_BASE_URL = 'https://betcha-api.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    console.log('PSR Functions - DOM Content Loaded');

    initializePSRModal();

    initializeBasicModal();

    loadDashboardData();
});

async function checkRolePrivileges() {
    try {
        const roleID = localStorage.getItem('roleID');
        if (!roleID) {
            console.warn('No roleID found in localStorage');
            return;
        }

        console.log('PSR - Checking privileges for roleID:', roleID);

        const roleData = await fetchRolePrivileges(roleID);
        
        if (roleData && roleData.privileges) {
            console.log('PSR - Role privileges:', roleData.privileges);

            filterSidebarByPrivileges(roleData.privileges);
        } else {
            console.error('No privileges found in role data');
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
            console.log(`PSR - Hiding sidebar item: ${href} (no access with privileges: ${privileges.join(', ')})`);
            link.style.display = 'none';
        } else {
            console.log(`PSR - Showing sidebar item: ${href} (access granted with privileges: ${privileges.join(', ')})`);
            link.style.display = 'flex';
        }
    });

    hideDashboardSections(privileges);

    if (privileges.includes('PSR') && privileges.length === 1) {

        hideSpecificSidebarItems(['ts.html', 'tk.html', 'pm.html']);
    }

    if (!privileges.includes('PSR')) {
        console.warn('PSR - User does not have PSR privilege, should not access this page');
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
        if (!section) return;
        
        const requiredPrivileges = sectionPrivilegeMap[sectionId];
        let hasAccess = false;

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

async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');

        const [summaryData, peakBookingData, transactionsData] = await Promise.all([
            fetchAdminSummary(),
            fetchPeakBookingDay(),
            fetchTransactions()
        ]);

        populateEarningsData(summaryData);
        populatePeakBookingData(peakBookingData);
        populateTransactionsData(transactionsData);
        
        console.log('Dashboard data loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
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
        const response = await fetch('https://betcha-api.onrender.com/psr/transactions');
        const data = await response.json();
        console.log('Transactions Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return null;
    }
}

function populateEarningsData(summaryData) {
    if (!summaryData || !summaryData.summary) {
        console.warn('No summary data available');
        return;
    }
    
    const { TotalEarningsThisWeek, TotalEarningsThisMonth, TotalEarningsThisYear } = summaryData.summary;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

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
        console.warn('No transactions data available');
        return;
    }

    const transactionsContainer = document.querySelector('.space-y-4.overflow-y-auto');
    if (!transactionsContainer) {
        console.warn('Transactions container not found on PSR page');
        return;
    }

    const existingItems = transactionsContainer.querySelectorAll('.grid.grid-cols-2.md\\:grid-cols-4');
    existingItems.forEach((item, index) => {
        if (index > 0) { 
            item.remove();
        }
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    transactionsData.forEach((transaction, index) => {
        let transactionElement;
        
        if (index === 0) {

            transactionElement = transactionsContainer.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
        } else {

            const template = transactionsContainer.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
            transactionElement = template.cloneNode(true);
            transactionsContainer.appendChild(transactionElement);
        }
        
        if (transactionElement) {

            const transNoElement = transactionElement.querySelector('p.text-sm.font-semibold.text-neutral-800.font-inter.truncate');
            if (transNoElement) {
                transNoElement.textContent = `#${transaction.transactionNo || transaction.id || 'N/A'}`;
            }

            const propertyElements = transactionElement.querySelectorAll('p.text-sm.font-semibold.text-neutral-800.font-inter.truncate');
            if (propertyElements.length > 1) {
                propertyElements[1].textContent = transaction.propertyName || transaction.property || 'Unknown Property';
                propertyElements[1].title = transaction.propertyName || transaction.property || 'Unknown Property'; 
            }

            if (propertyElements.length > 2) {
                propertyElements[2].textContent = formatDate(transaction.dateOfBooking || transaction.bookingDate || transaction.date || new Date());
            }

            const amountSpan = transactionElement.querySelector('span');
            if (amountSpan) {
                amountSpan.textContent = formatCurrency(transaction.amount || transaction.totalAmount || 0);
            }
        }
    });
    
    console.log(`${transactionsData.length} transactions populated on PSR page`);
}

async function handleDownload() {
    try {
        console.log('=== DOWNLOAD FUNCTION CALLED ===');
        console.log('Starting download process...');

        const selectedReportType = document.querySelector('input[name="reportType"]:checked');
        if (!selectedReportType) {
            alert('Please select a report type');
            return;
        }

        const selectedFileType = document.querySelector('input[name="fileType"]:checked');
        if (!selectedFileType) {
            alert('Please select a file type');
            return;
        }
        
        const reportType = selectedReportType.value;
        const fileType = selectedFileType.value;
        
        console.log('Report Type:', reportType);
        console.log('File Type:', fileType);

        const formData = getFormDataByReportType(reportType);
        if (!formData) {
            return; 
        }

        const downloadButton = document.querySelector('#generatePSRModal button:last-child span');
        const originalText = downloadButton.textContent;
        downloadButton.textContent = 'Downloading...';

        const reportData = await fetchReportData(reportType, formData);
        
        if (reportData) {

            await downloadFileFromResponse(reportData, fileType);

            document.getElementById('generatePSRModal').classList.add('hidden');
            document.body.classList.remove('modal-open');
        }

        downloadButton.textContent = originalText;
        
    } catch (error) {
        console.error('Download error:', error);
        alert('An error occurred while downloading the report. Please try again.');

        const downloadButton = document.querySelector('#generatePSRModal button:last-child span');
        if (downloadButton) {
            downloadButton.textContent = 'Download';
        }
    }
}

function getFormDataByReportType(reportType) {
    const currentYear = new Date().getFullYear();
    
    switch (reportType) {
        case 'weekly':
            const week = document.getElementById('selectWeek').value;
            const weekMonth = document.getElementById('selectWeekMonth').value;
            const weekYear = document.getElementById('selectWeekYear').value;
            
            if (!week || !weekMonth || !weekYear) {
                alert('Please select week, month, and year for weekly report');
                return null;
            }
            
            return {
                week: parseInt(week),
                month: parseInt(weekMonth),
                year: parseInt(weekYear)
            };
            
        case 'monthly':
            const month = document.getElementById('selectMonth').value;
            const monthYear = document.getElementById('selectYear').value;
            
            if (!month || !monthYear) {
                alert('Please select month and year for monthly report');
                return null;
            }
            
            return {
                month: parseInt(month),
                year: parseInt(monthYear)
            };
            
        case 'quarterly':
            const quarter = document.getElementById('selectQuarter').value;
            const quarterYear = document.getElementById('selectQuarterYear').value;
            
            if (!quarter || !quarterYear) {
                alert('Please select quarter and year for quarterly report');
                return null;
            }

            const quarterNumber = parseInt(quarter.replace('Q', ''));
            
            return {
                quarter: quarterNumber,
                year: parseInt(quarterYear)
            };
            
        case 'semi-annual':
            const half = document.getElementById('selectHalf').value;
            const semiYear = document.getElementById('selectSemiYear').value;
            
            if (!half || !semiYear) {
                alert('Please select half and year for semi-annual report');
                return null;
            }

            const halfNumber = parseInt(half.replace('H', ''));
            
            return {
                annual: halfNumber,
                year: parseInt(semiYear)
            };
            
        case 'annual':
            const annualYear = document.getElementById('selectAnnualYear').value;
            
            if (!annualYear) {
                alert('Please select year for annual report');
                return null;
            }
            
            return {
                year: parseInt(annualYear)
            };
            
        default:
            alert('Invalid report type selected');
            return null;
    }
}

async function fetchReportData(reportType, formData) {
    const baseUrl = 'https://betcha-api.onrender.com/psr';
    let endpoint;
    
    switch (reportType) {
        case 'weekly':
            endpoint = `${baseUrl}/weekSummary`;
            break;
        case 'monthly':
            endpoint = `${baseUrl}/monthSummary`;
            break;
        case 'quarterly':
            endpoint = `${baseUrl}/quarterSummary`;
            break;
        case 'semi-annual':
            endpoint = `${baseUrl}/semiAnnualSummary`;
            break;
        case 'annual':
            endpoint = `${baseUrl}/AnnualSummary`;
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
        alert('Failed to fetch report data. Please check your connection and try again.');
        return null;
    }
}

async function downloadFileFromResponse(responseData, fileType) {
    try {
        console.log('Response data:', responseData);
        
        let downloadUrl;
        let fileName;

        if (fileType === 'Excel' && responseData.excelLink) {
            downloadUrl = responseData.excelLink;
            fileName = responseData.excelLink.split('/').pop(); 
        } else if (fileType === 'Pdf' && responseData.pdfLink) {
            downloadUrl = responseData.pdfLink;
            fileName = responseData.pdfLink.split('/').pop(); 
        } else {
            throw new Error(`No ${fileType} link found in response`);
        }

        const baseUrl = 'https://betcha-api.onrender.com';
        const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${baseUrl}${downloadUrl}`;
        
        console.log('Downloading from:', fullUrl);
        console.log('Message:', responseData.message);

        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName;
        link.target = '_blank'; 

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`${fileType} file download initiated:`, fileName);

        if (responseData.message) {
            alert(`Report generated successfully: ${responseData.message}`);
        }
        
    } catch (error) {
        console.error('Download error:', error);
        throw error; 
    }
}

function initializeBasicModal() {

    const modalButton = document.querySelector('[data-modal-target="generatePSRModal"]');
    const modal = document.getElementById('generatePSRModal');
    
    if (modalButton && modal) {
        modalButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Opening PSR modal');
            modal.classList.remove('hidden');
            document.body.classList.add('modal-open');
        });

        const closeButtons = modal.querySelectorAll('[data-close-modal]');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                console.log('Closing PSR modal');
                modal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            });
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                console.log('Closing PSR modal via backdrop');
                modal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }
        });

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
    }
}

function initializePSRModal() {
    console.log('Initializing PSR Modal functionality');

    const reportTypeRadios = document.querySelectorAll('input[name="reportType"]');
    const dynamicDropdowns = document.getElementById('dynamicDropdowns');
    
    if (!dynamicDropdowns) {
        console.error('Dynamic dropdowns container not found');
        return;
    }

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

    populateYearDropdowns();

    reportTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('Report type changed to:', this.value);
            showRelevantDropdowns(this.value);
        });
    });

    showRelevantDropdowns('monthly');
}

function showRelevantDropdowns(reportType) {
    console.log('Showing dropdowns for:', reportType);

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

    for (let year = 2020; year <= currentYear + 2; year++) {
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

window.testPSRModal = testModal;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing PSR modal...');
    initializeBasicModal();
    loadDashboardData();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded (deferred), initializing PSR modal...');
        initializeBasicModal();
        loadDashboardData();
    });
} else {
    console.log('DOM already loaded, initializing PSR modal immediately...');
    initializeBasicModal();
    loadDashboardData();
}
