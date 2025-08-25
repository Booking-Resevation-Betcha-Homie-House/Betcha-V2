// Dashboard not still finished Drop down issues Data population issue ? since no data for top property

// Dashboard Functions for Admin Dashboard
console.log('Dashboard functions script loaded');

// API Base URLs
const API_BASE = 'https://betcha-api.onrender.com';

// Dashboard API endpoints
const DASHBOARD_ENDPOINTS = {
    summary: `${API_BASE}/dashboard/admin/summary`,
    rankProperty: `${API_BASE}/dashboard/admin/rankProperty`,
    employeeCount: `${API_BASE}/dashboard/admin/employee/activeCount`,
    guestCount: `${API_BASE}/dashboard/admin/guest/activeCount`,
    propertyCount: `${API_BASE}/dashboard/admin/property/activeCount`,
    todayBookingCount: `${API_BASE}/dashboard/admin/booking/todayCount`,
    availableToday: `${API_BASE}/dashboard/admin/property/availableToday`,
    activeBookingCount: `${API_BASE}/dashboard/admin/booking/activeCount`,
    auditTrails: `${API_BASE}/dashboard/admin/audit`
};

// Global variables
let summaryData = null;
let topPropertiesData = null;
let dashboardChart = null;
let currentMonthFilter = null;
let currentYearFilter = null;

// Initialize dashboard when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing dashboard...');
    // Initialize filters first to avoid undefined month/year
    initializeMonthYearFilters();
    // Then load summary and counts
    initializeDashboard();
});

/**
 * Initialize all dashboard functionality
 */
async function initializeDashboard() {
    try {
        console.log('Starting dashboard initialization...');
        
        // Show loading states
        showLoadingStates();
        
        // Fetch all dashboard data
        await Promise.all([
            fetchSummaryData(),
            fetchCountsData()
        ]);
        // Fetch Top Rentals after defaults are set by filters
        await fetchTopPropertiesData();
        await fetchAuditTrailData(); // Fetch audit trails
        
        console.log('Dashboard initialized successfully!');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorState('Failed to load dashboard data. Please refresh the page.');
    }
}

/**
 * Show loading states for dashboard elements
 */
function showLoadingStates() {
    const loadingElements = [
        'totalYearEarning',
        'totalMonthEarning', 
        'totalWeekEarning',
        'availableRental',
        'bookedRoom',
        'totalEmployee',
        'totalCustomer',
        'totalRoom',
        'totalTransaction'
    ];
    
    loadingElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '...';
        }
    });
}

/**
 * Fetch summary data (earnings)
 */
async function fetchSummaryData() {
    try {
        console.log('Fetching summary data from:', DASHBOARD_ENDPOINTS.summary);
        
        const response = await fetch(DASHBOARD_ENDPOINTS.summary);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        summaryData = await response.json();
        console.log('Summary data received:', summaryData);
        
        // Normalize API shape to UI shape
        const normalized = (summaryData && summaryData.summary)
            ? {
                yearlyEarnings: summaryData.summary.TotalEarningsThisYear || 0,
                monthlyEarnings: summaryData.summary.TotalEarningsThisMonth || 0,
                weeklyEarnings: summaryData.summary.TotalEarningsThisWeek || 0
            }
            : {
                yearlyEarnings: 0,
                monthlyEarnings: 0,
                weeklyEarnings: 0
            };
        
        populateSummaryData(normalized);
        
    } catch (error) {
        console.error('Error fetching summary data:', error);
        // Set fallback values
        populateSummaryData({
            yearlyEarnings: 0,
            monthlyEarnings: 0,
            weeklyEarnings: 0
        });
    }
}

/**
 * Fetch top properties ranking data
 */
async function fetchTopPropertiesData() {
    try {
        console.log('Fetching top properties data from:', DASHBOARD_ENDPOINTS.rankProperty);
        console.log('Current filters - Month:', currentMonthFilter, 'Year:', currentYearFilter);
        
        // Build POST body with numeric fields
        const url = DASHBOARD_ENDPOINTS.rankProperty;
        const monthNum = (currentMonthFilter && currentMonthFilter !== 'all')
            ? parseInt(String(currentMonthFilter), 10)
            : undefined;
        const yearNum = (currentYearFilter && currentYearFilter !== 'all')
            ? parseInt(String(currentYearFilter), 10)
            : undefined;

        console.log('Parsed values - Month:', monthNum, 'Year:', yearNum);

        const payload = {};
        if (!Number.isNaN(monthNum)) payload.month = monthNum;
        if (!Number.isNaN(yearNum)) payload.year = yearNum;

        console.log('Fetching Top Rentals with POST body:', payload);

        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Fallback to GET with query params if POST is not supported on this deployment
        if (!response.ok) {
            const monthParam = (typeof payload.month === 'number') ? `month=${payload.month}` : '';
            const yearParam = (typeof payload.year === 'number') ? `year=${payload.year}` : '';
            const qs = [monthParam, yearParam].filter(Boolean).join('&');
            const fallbackUrl = qs ? `${url}?${qs}` : url;
            console.warn('POST failed, retrying GET:', fallbackUrl);
            response = await fetch(fallbackUrl);
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        topPropertiesData = await response.json();
        console.log('Top properties raw data:', topPropertiesData);
        
        // Normalize to array of items with name and earnings
        let chartData = [];
        if (topPropertiesData && typeof topPropertiesData === 'object') {
            if (Array.isArray(topPropertiesData)) {
                chartData = topPropertiesData;
            } else if (topPropertiesData.topProperty) {
                const tp = topPropertiesData.topProperty;
                if (Array.isArray(tp)) {
                    chartData = tp;
                } else if (tp && typeof tp === 'object') {
                    chartData = Object.values(tp);
                }
            }
        }

        // Map to unified keys expected by chart prep
        chartData = chartData.map(item => ({
            propertyName: item.propertyName || item.name || 'Unknown Property',
            totalEarnings: typeof item.totalEarnings === 'number' ? item.totalEarnings : (typeof item.earned === 'number' ? item.earned : 0)
        }));

        console.log('Processed chart data:', chartData);
        // If the built-in chart exists, update it to preserve design
        if (window.updateTopRoomsChart) {
            const labels = chartData.map(i => i.propertyName || i.name || 'Unknown Property');
            const values = chartData.map(i => i.totalEarnings || 0);
            window.updateTopRoomsChart(labels, values);
        } else {
            // Fallback to internal chart renderer
            populateTopPropertiesChart(chartData);
        }
        
    } catch (error) {
        console.error('Error fetching top properties data:', error);
        console.warn('Using empty chart due to API error');
        populateTopPropertiesChart([]);
    }
}

/**
 * Fetch all count data
 */
async function fetchCountsData() {
    try {
        console.log('Fetching counts data...');
        
        // Log all endpoints being used
        console.log('Using endpoints:', DASHBOARD_ENDPOINTS);
        
        // Fetch all counts in parallel
        const [
            employeeResponse,
            guestResponse,
            propertyResponse,
            todayBookingResponse,
            availableTodayResponse,
            activeBookingResponse
        ] = await Promise.all([
            fetch(DASHBOARD_ENDPOINTS.employeeCount),
            fetch(DASHBOARD_ENDPOINTS.guestCount),
            fetch(DASHBOARD_ENDPOINTS.propertyCount),
            fetch(DASHBOARD_ENDPOINTS.todayBookingCount),
            fetch(DASHBOARD_ENDPOINTS.availableToday),
            fetch(DASHBOARD_ENDPOINTS.activeBookingCount)
        ]);
        
        // Log response status for debugging
        console.log('API Response Status:', {
            employee: employeeResponse.status,
            guest: guestResponse.status,
            property: propertyResponse.status,
            todayBooking: todayBookingResponse.status,
            availableToday: availableTodayResponse.status,
            activeBooking: activeBookingResponse.status
        });
        
        // Parse responses
        const countsData = {
            employees: employeeResponse.ok ? await employeeResponse.json() : { count: 0 },
            guests: guestResponse.ok ? await guestResponse.json() : { count: 0 },
            properties: propertyResponse.ok ? await propertyResponse.json() : { count: 0 },
            todayBookings: todayBookingResponse.ok ? await todayBookingResponse.json() : { activeBookingsToday: 0 },
            availableToday: availableTodayResponse.ok ? await availableTodayResponse.json() : { availableRoomCount: 0 },
            activeBookings: activeBookingResponse.ok ? await activeBookingResponse.json() : { count: 0 }
        };
        
        console.log('Counts data received:', countsData);
        
        // Log specific values for debugging
        console.log('Available today count:', countsData.availableToday.availableRoomCount);
        console.log('Booked today count:', countsData.todayBookings.activeBookingsToday);
        
        populateCountsData(countsData);
        
    } catch (error) {
        console.error('Error fetching counts data:', error);
        // Set fallback values
        populateCountsData({
            employees: { count: 0 },
            guests: { count: 0 },
            properties: { count: 0 },
            todayBookings: { activeBookingsToday: 0 },
            availableToday: { availableRoomCount: 0 },
            activeBookings: { count: 0 }
        });
    }
}

/**
 * Fetch audit trail data
 */
async function fetchAuditTrailData() {
    try {
        console.log('Fetching audit trail data from:', DASHBOARD_ENDPOINTS.auditTrails);
        
        const response = await fetch(DASHBOARD_ENDPOINTS.auditTrails);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const auditData = await response.json();
        console.log('Audit trail data received:', auditData);
        
        // Populate audit trail cards
        populateAuditTrailCards(auditData);
        
    } catch (error) {
        console.error('Error fetching audit trail data:', error);
        // Set fallback values
        populateAuditTrailCards([]);
    }
}

/**
 * Populate audit trail cards in the dashboard
 */
function populateAuditTrailCards(auditData) {
    console.log('Populating audit trail cards:', auditData);
    
    // Validate audit data
    if (!Array.isArray(auditData)) {
        console.warn('Audit data is not an array, using empty array');
        auditData = [];
    }
    
    // Filter data by user type for each tab
    const adminData = auditData.filter(item => item && item.userType === 'Admin').slice(0, 5);
    const employeeData = auditData.filter(item => item && item.userType === 'Employee').slice(0, 5);
    const customerData = auditData.filter(item => item && item.userType === 'Guest').slice(0, 5);
    
    console.log('Filtered data - Admin:', adminData.length, 'Employee:', employeeData.length, 'Customer:', customerData.length);
    
    // Populate each tab
    populateAuditTab(0, adminData); // Admin tab
    populateAuditTab(1, employeeData); // Employee tab
    populateAuditTab(2, customerData); // Customer tab
}

/**
 * Populate a specific audit trail tab
 */
function populateAuditTab(tabIndex, data) {
    const tabContent = document.querySelectorAll('.tab-content')[tabIndex];
    if (!tabContent) {
        console.warn(`Tab content ${tabIndex} not found`);
        return;
    }
    
    const gridContainer = tabContent.querySelector('.grid');
    if (!gridContainer) {
        console.warn(`Grid container for tab ${tabIndex} not found`);
        return;
    }
    
    // Clear existing content
    gridContainer.innerHTML = '';
    
    if (!data || data.length === 0) {
        // Show no data message
        const tabNames = ['Admin', 'Employee', 'Customer'];
        const tabName = tabNames[tabIndex] || 'Unknown';
        gridContainer.innerHTML = `
            <div class="col-span-full flex items-center justify-center h-32">
                <div class="text-center">
                    <p class="text-neutral-500 text-lg mb-2">No ${tabName} audit trails available</p>
                    <p class="text-neutral-400 text-sm">No activities have been recorded for this user type yet.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Create audit trail cards
    data.forEach(item => {
        const card = createAuditTrailCard(item);
        gridContainer.appendChild(card);
    });
    
    console.log(`Populated tab ${tabIndex} with ${data.length} audit trail cards`);
}

/**
 * Create an individual audit trail card
 */
function createAuditTrailCard(auditItem) {
    const card = document.createElement('div');
    card.className = 'bg-neutral-50 rounded-xl border border-neutral-200 p-4 hover:bg-neutral-100 transition-all duration-300 ease-in-out';
    
    // Validate required fields
    if (!auditItem || !auditItem.dateTime) {
        console.warn('Invalid audit item:', auditItem);
        card.innerHTML = `
            <p class="font-semibold text-neutral-800 font-manrope mb-3">
                Invalid Data
            </p>
            <div class="flex flex-col gap-2 text-xs text-neutral-500 font-inter">
                <p><span class="font-medium text-neutral-700">Error:</span> Invalid audit trail data</p>
            </div>
        `;
        return card;
    }
    
    // Format date
    let formattedDate = 'Invalid Date';
    let formattedTime = 'Invalid Time';
    
    try {
        const date = new Date(auditItem.dateTime);
        if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            formattedTime = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        }
    } catch (error) {
        console.warn('Error formatting date:', error);
    }
    
    // Get display name (for Guest users, show "Customer" instead)
    const displayUserType = auditItem.userType === 'Guest' ? 'Customer' : (auditItem.userType || 'Unknown');
    const refNo = auditItem.refNo || 'N/A';
    const userId = auditItem.userId || 'N/A';
    const activity = auditItem.activity || 'No activity recorded';
    
    card.innerHTML = `
        <p class="font-semibold text-neutral-800 font-manrope mb-3">
            Reference #${refNo}
        </p>
        <div class="flex flex-col gap-2 text-xs text-neutral-500 font-inter">
            <p><span class="font-medium text-neutral-700">Date:</span> ${formattedDate} | ${formattedTime}</p>
            <p><span class="font-medium text-neutral-700">User ID:</span> ${userId}</p>
            <p><span class="font-medium text-neutral-700">Activity:</span> ${activity}</p>
            <p><span class="font-medium text-neutral-700">User Type:</span> ${displayUserType}</p>
        </div>
    `;
    
    return card;
}

/**
 * Populate summary data (earnings)
 */
function populateSummaryData(data) {
    console.log('Populating summary data:', data);
    
    // Year earnings
    const yearElement = document.getElementById('totalYearEarning');
    if (yearElement) {
        yearElement.textContent = formatCurrency(data.yearlyEarnings || 0);
    }
    
    // Month earnings
    const monthElement = document.getElementById('totalMonthEarning');
    if (monthElement) {
        monthElement.textContent = formatCurrency(data.monthlyEarnings || 0);
    }
    
    // Week earnings
    const weekElement = document.getElementById('totalWeekEarning');
    if (weekElement) {
        weekElement.textContent = formatCurrency(data.weeklyEarnings || 0);
    }
}

/**
 * Populate counts data
 */
function populateCountsData(data) {
    console.log('Populating counts data:', data);
    
    // Available rentals today
    const availableElement = document.getElementById('availableRental');
    if (availableElement) {
        const availableCount = data.availableToday.availableRoomCount || 0;
        availableElement.textContent = availableCount;
        console.log('Updated available rentals:', availableCount);
    } else {
        console.warn('Available rental element not found');
    }
    
    // Booked rooms today  
    const bookedElement = document.getElementById('bookedRoom');
    if (bookedElement) {
        const bookedCount = data.todayBookings.activeBookingsToday || 0;
        bookedElement.textContent = bookedCount;
        console.log('Updated booked rooms:', bookedCount);
    } else {
        console.warn('Booked room element not found');
    }
    
    // Total employees
    const employeeElement = document.getElementById('totalEmployee');
    if (employeeElement) {
        employeeElement.textContent = data.employees.count || 0;
    }
    
    // Total customers
    const customerElement = document.getElementById('totalCustomer');
    if (customerElement) {
        customerElement.textContent = data.guests.count || 0;
    }
    
    // Total properties
    const roomElement = document.getElementById('totalRoom');
    if (roomElement) {
        roomElement.textContent = data.properties.count || 0;
    }
    
    // Total transactions (active bookings)
    const transactionElement = document.getElementById('totalTransaction');
    if (transactionElement) {
        transactionElement.textContent = data.activeBookings.count || 0;
    }
    
    // Update progress bars if needed
    updateProgressBars(data);
}

/**
 * Update progress bars for available/booked rentals
 */
function updateProgressBars(data) {
    const availableCount = data.availableToday.availableRoomCount || 0;
    const bookedCount = data.todayBookings.activeBookingsToday || 0;
    const totalProperties = data.properties.count || 1; // Prevent division by zero
    
    // Available rentals progress
    const availableProgress = Math.round((availableCount / totalProperties) * 100);
    const availableProgressBar = document.querySelector('.bg-primary .bg-white');
    if (availableProgressBar) {
        availableProgressBar.style.width = `${Math.min(availableProgress, 100)}%`;
    }
    
    // Booked rentals progress  
    const bookedProgress = Math.round((bookedCount / totalProperties) * 100);
    const bookedProgressBars = document.querySelectorAll('.bg-primary .bg-white');
    if (bookedProgressBars.length > 1) {
        bookedProgressBars[1].style.width = `${Math.min(bookedProgress, 100)}%`;
    }
}

/**
 * Populate top properties chart
 */
function populateTopPropertiesChart(data) {
    console.log('Populating top properties chart:', data);
    
    const chartCanvas = document.getElementById('topRoomsChart');
    if (!chartCanvas) {
        console.warn('Top rooms chart canvas not found');
        return;
    }

    // Ensure Chart is available; if not, retry shortly
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not yet available, retrying in 200ms');
        setTimeout(() => populateTopPropertiesChart(data), 200);
        return;
    }
    
    // Store the original data
    topPropertiesData = data;
    
    // Destroy existing chart if it exists (more robust approach)
    if (dashboardChart) {
        try {
            dashboardChart.destroy();
            dashboardChart = null;
        } catch (error) {
            console.warn('Error destroying existing chart:', error);
            dashboardChart = null;
        }
    }
    
    // Also check for any chart instance attached to this canvas
    const existingChart = Chart.getChart(chartCanvas);
    if (existingChart) {
        try {
            existingChart.destroy();
        } catch (error) {
            console.warn('Error destroying chart attached to canvas:', error);
        }
    }
    
    // Sort data by earnings (highest to lowest) by default
    const sortedData = sortPropertiesByEarnings([...data]);
    
    // Prepare chart data
    const chartData = prepareChartData(sortedData);
    
    // Create new chart
    try {
        const ctx = chartCanvas.getContext('2d');
        dashboardChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            label: function(context) {
                                return `Earnings: ₱${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₱' + formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating chart:', error);
        dashboardChart = null;
    }
}

/**
 * Prepare chart data from API response
 */
function prepareChartData(data) {
    // Handle empty or invalid data
    if (!Array.isArray(data) || data.length === 0) {
        return {
            labels: ['No Data'],
            datasets: [{
                label: 'Earnings',
                data: [0],
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1
            }]
        };
    }
    
    // Extract property names and earnings
    const labels = data.map(item => {
        // Truncate long property names
        const name = item.propertyName || item.name || 'Unknown Property';
        return name.length > 15 ? name.substring(0, 15) + '...' : name;
    });
    
    const earnings = data.map(item => item.totalEarnings || item.earnings || 0);
    
    return {
        labels: labels,
        datasets: [{
            label: 'Earnings',
            data: earnings,
            backgroundColor: 'rgba(99, 102, 241, 0.5)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1
        }]
    };
}

/**
 * Format currency values
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Show error state
 */
function showErrorState(message) {
    console.error('Dashboard error:', message);
    
    // You could show a toast notification or modal here
    // For now, just log the error
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
    console.log('Refreshing dashboard data...');
    await initializeDashboard();
}

/**
 * Initialize month and year filter dropdowns
 */
/**
 * Initialize month and year filters for the dashboard
 */
function initializeMonthYearFilters() {
    console.log('Initializing month/year filters...');
    initializeMonthDropdown();
    initializeYearDropdown();
    
    // Set sensible defaults to current month/year
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    // If current year is below 2025, default to 2025
    const yyyy = String(Math.max(2025, now.getFullYear()));
    currentMonthFilter = mm;
    currentYearFilter = yyyy;
    
    // Reflect defaults in UI
    setMonthFilter(mm, true);
    setYearFilter(yyyy, true);
    
    console.log('Month/year filters initialized');
}

/**
 * Initialize month dropdown functionality
 */
function initializeMonthDropdown() {
    console.log('Initializing month dropdown...');
    
    const monthDropdownBtn = document.getElementById('monthDropdownBtn');
    const monthDropdownList = document.getElementById('monthDropdownList');
    const monthDropdownIcon = document.getElementById('monthDropdownIcon');
    const selectedMonthSpan = document.getElementById('selectedMonth');
    
    console.log('Month dropdown elements:', {
        btn: !!monthDropdownBtn,
        list: !!monthDropdownList,
        icon: !!monthDropdownIcon,
        span: !!selectedMonthSpan
    });
    
    if (!monthDropdownBtn || !monthDropdownList) {
        console.warn('Month dropdown elements not found');
        return;
    }
    
    // Populate month options
    const months = [
        { value: 'all', text: 'All Months' },
        { value: '01', text: 'January' },
        { value: '02', text: 'February' },
        { value: '03', text: 'March' },
        { value: '04', text: 'April' },
        { value: '05', text: 'May' },
        { value: '06', text: 'June' },
        { value: '07', text: 'July' },
        { value: '08', text: 'August' },
        { value: '09', text: 'September' },
        { value: '10', text: 'October' },
        { value: '11', text: 'November' },
        { value: '12', text: 'December' }
    ];
    
    const monthOptions = months.map(month => 
        `<li class="px-3 py-2 hover:bg-neutral-100 cursor-pointer transition-colors duration-200" data-month="${month.value}">${month.text}</li>`
    ).join('');
    
    monthDropdownList.innerHTML = monthOptions;
    // Explicitly ensure the dropdown is hidden after populating content
    monthDropdownList.classList.add('hidden');
    monthDropdownList.classList.remove('block');
    
    console.log('Month dropdown populated with HTML:', monthOptions.substring(0, 100) + '...');
    console.log('Month dropdown list element:', monthDropdownList);
    console.log('Month dropdown list classes (after explicit hide):', monthDropdownList.className);
    console.log('Month dropdown list computed display (after explicit hide):', window.getComputedStyle(monthDropdownList).display);
    
    // Toggle dropdown
    let isMonthDropdownOpen = false; // Track state independently
    
    monthDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Month dropdown clicked!');
        console.log('Current state - isMonthDropdownOpen:', isMonthDropdownOpen);
        
        if (!isMonthDropdownOpen) {
            // Open dropdown
            monthDropdownList.classList.remove('hidden');
            monthDropdownList.classList.add('block');
            monthDropdownBtn.setAttribute('aria-expanded', 'true');
            monthDropdownIcon.classList.add('rotate-180');
            isMonthDropdownOpen = true;
            console.log('Month dropdown opened');
        } else {
            // Close dropdown
            monthDropdownList.classList.add('hidden');
            monthDropdownList.classList.remove('block');
            monthDropdownBtn.setAttribute('aria-expanded', 'false');
            monthDropdownIcon.classList.remove('rotate-180');
            isMonthDropdownOpen = false; // Reset state
            console.log('Month dropdown closed');
        }
        
        console.log('After toggle - isMonthDropdownOpen:', isMonthDropdownOpen);
        console.log('After toggle - Month list classes:', monthDropdownList.className);
        console.log('After toggle - Month list computed display:', window.getComputedStyle(monthDropdownList).display);
    });
    
    // Handle month selection
    monthDropdownList.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            const monthValue = e.target.getAttribute('data-month');
            const monthText = e.target.textContent;
            
            // Update UI
            selectedMonthSpan.textContent = monthText;
            selectedMonthSpan.classList.remove('text-muted');
            selectedMonthSpan.classList.add('text-primary-text');
            
            // Update current month filter
            currentMonthFilter = monthValue;
            console.log('Month filter updated to:', monthValue, 'Current filter:', currentMonthFilter);
            
            // Refresh chart data with new filter
            fetchTopPropertiesData();
            
            // Close dropdown
            monthDropdownList.classList.add('hidden');
            monthDropdownIcon.classList.remove('rotate-180');
            isMonthDropdownOpen = false; // Reset state
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        monthDropdownList.classList.add('hidden');
        monthDropdownList.classList.remove('block');
        monthDropdownBtn.setAttribute('aria-expanded', 'false');
        monthDropdownIcon.classList.remove('rotate-180');
        isMonthDropdownOpen = false; // Reset state
    });
}

/**
 * Initialize year dropdown functionality
 */
function initializeYearDropdown() {
    const yearDropdownBtn = document.getElementById('yearDropdownBtn');
    const yearDropdownList = document.getElementById('yearDropdownList');
    const yearDropdownIcon = document.getElementById('yearDropdownIcon');
    const selectedYearSpan = document.getElementById('selectedYear');
    
    if (!yearDropdownBtn || !yearDropdownList) {
        console.warn('Year dropdown elements not found');
        return;
    }
    
    // Generate year options from 2025 up to current year + 5
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 5;
    const years = [
        { value: 'all', text: 'All Years' }
    ];

    for (let y = 2025; y <= maxYear; y++) {
        years.push({ value: y.toString(), text: y.toString() });
    }
    
    const yearOptions = years.map(year => 
        `<li class="px-3 py-2 hover:bg-neutral-100 cursor-pointer transition-colors duration-200" data-year="${year.value}">${year.text}</li>`
    ).join('');
    
    yearDropdownList.innerHTML = yearOptions;
    // Explicitly ensure the dropdown is hidden after populating content
    yearDropdownList.classList.add('hidden');
    yearDropdownList.classList.remove('block');
    
    console.log('Year dropdown populated with HTML:', yearOptions.substring(0, 100) + '...');
    console.log('Year dropdown list element:', yearDropdownList);
    console.log('Year dropdown list classes (after explicit hide):', yearDropdownList.className);
    console.log('Year dropdown list computed display (after explicit hide):', window.getComputedStyle(yearDropdownList).display);
    
    // Toggle dropdown
    let isYearDropdownOpen = false; // Track state independently
    
    yearDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Year dropdown clicked!');
        console.log('Current state - isYearDropdownOpen:', isYearDropdownOpen);
        
        if (!isYearDropdownOpen) {
            // Open dropdown
            yearDropdownList.classList.remove('hidden');
            yearDropdownList.classList.add('block');
            yearDropdownBtn.setAttribute('aria-expanded', 'true');
            yearDropdownIcon.classList.add('rotate-180');
            isYearDropdownOpen = true;
            console.log('Year dropdown opened');
        } else {
            // Close dropdown
            yearDropdownList.classList.add('hidden');
            yearDropdownList.classList.remove('block');
            yearDropdownBtn.setAttribute('aria-expanded', 'false');
            yearDropdownIcon.classList.remove('rotate-180');
            isYearDropdownOpen = false;
            console.log('Year dropdown closed');
        }
        
        console.log('After toggle - isYearDropdownOpen:', isYearDropdownOpen);
        console.log('After toggle - Year list classes:', yearDropdownList.className);
        console.log('After toggle - Year list computed display:', window.getComputedStyle(yearDropdownList).display);
    });
    
    // Handle year selection
    yearDropdownList.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            const yearValue = e.target.getAttribute('data-year');
            const yearText = e.target.textContent;
            
            // Update UI
            selectedYearSpan.textContent = yearText;
            selectedYearSpan.classList.remove('text-muted');
            selectedYearSpan.classList.add('text-primary-text');
            
            // Update current year filter
            currentYearFilter = yearValue;
            console.log('Year filter updated to:', yearValue, 'Current filter:', currentYearFilter);
            
            // Refresh chart data with new filter
            fetchTopPropertiesData();
            
            // Close dropdown
            yearDropdownList.classList.add('hidden');
            yearDropdownIcon.classList.remove('rotate-180');
            isYearDropdownOpen = false; // Reset state
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        yearDropdownList.classList.add('hidden');
        yearDropdownList.classList.remove('block');
        yearDropdownBtn.setAttribute('aria-expanded', 'false');
        yearDropdownIcon.classList.remove('rotate-180');
        isYearDropdownOpen = false; // Reset state
    });
}

/**
 * Sort properties by earnings (highest to lowest)
 */
function sortPropertiesByEarnings(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return data;
    }
    
    return data.sort((a, b) => {
        const earningsA = a.totalEarnings || a.earnings || 0;
        const earningsB = b.totalEarnings || b.earnings || 0;
        return earningsB - earningsA; // Highest to lowest
    });
}

/**
 * Set month filter programmatically
 */
function setMonthFilter(month, suppressFetch) {
    currentMonthFilter = month;
    
    // Update UI
    const selectedMonthSpan = document.getElementById('selectedMonth');
    if (selectedMonthSpan) {
        const monthNames = {
            'all': 'All Months',
            '01': 'January', '02': 'February', '03': 'March',
            '04': 'April', '05': 'May', '06': 'June',
            '07': 'July', '08': 'August', '09': 'September',
            '10': 'October', '11': 'November', '12': 'December'
        };
        
        selectedMonthSpan.textContent = monthNames[month] || 'Month';
        selectedMonthSpan.classList.remove('text-muted');
        selectedMonthSpan.classList.add('text-primary-text');
    }
    
    // Refresh data
    if (!suppressFetch) fetchTopPropertiesData();
}

/**
 * Set year filter programmatically
 */
function setYearFilter(year, suppressFetch) {
    currentYearFilter = year;
    
    // Update UI
    const selectedYearSpan = document.getElementById('selectedYear');
    if (selectedYearSpan) {
        selectedYearSpan.textContent = year === 'all' ? 'All Years' : year;
        selectedYearSpan.classList.remove('text-muted');
        selectedYearSpan.classList.add('text-primary-text');
    }
    
    // Refresh data
    if (!suppressFetch) fetchTopPropertiesData();
}

/**
 * Manual test function for API endpoints
 */
async function testCountsAPI() {
    console.log('=== Testing Counts API Endpoints ===');
    
    try {
        // Test Available Today
        console.log('Testing Available Today:', DASHBOARD_ENDPOINTS.availableToday);
        const availableResponse = await fetch(DASHBOARD_ENDPOINTS.availableToday);
        console.log('Available Today Status:', availableResponse.status);
        if (availableResponse.ok) {
            const availableData = await availableResponse.json();
            console.log('Available Today Data:', availableData);
        }
        
        // Test Today Bookings
        console.log('Testing Today Bookings:', DASHBOARD_ENDPOINTS.todayBookingCount);
        const bookingsResponse = await fetch(DASHBOARD_ENDPOINTS.todayBookingCount);
        console.log('Today Bookings Status:', bookingsResponse.status);
        if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json();
            console.log('Today Bookings Data:', bookingsData);
        }
        
        // Test Active Bookings
        console.log('Testing Active Bookings:', DASHBOARD_ENDPOINTS.activeBookingCount);
        const activeResponse = await fetch(DASHBOARD_ENDPOINTS.activeBookingCount);
        console.log('Active Bookings Status:', activeResponse.status);
        if (activeResponse.ok) {
            const activeData = await activeResponse.json();
            console.log('Active Bookings Data:', activeData);
        }
        
    } catch (error) {
        console.error('Error testing API endpoints:', error);
    }
    
    console.log('=== API Test Complete ===');
}

/**
 * Force refresh counts data for testing
 */
async function refreshCountsOnly() {
    console.log('Force refreshing counts data...');
    await fetchCountsData();
}

/**
 * Refresh audit trail data
 */
async function refreshAuditTrails() {
    console.log('Refreshing audit trail data...');
    await fetchAuditTrailData();
}

/**
 * Set active tab for audit trails
 */
function setActiveTab(tabIndex) {
    console.log('Setting active tab:', tabIndex);
    
    // Remove active state from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach((btn, index) => {
        if (index === tabIndex) {
            btn.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
            btn.classList.remove('text-neutral-500');
        } else {
            btn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
            btn.classList.add('text-neutral-500');
        }
    });
    
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach((content, index) => {
        if (index === tabIndex) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
    
    console.log('Tab switched to:', tabIndex);
}

// Export functions for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDashboard,
        refreshDashboard,
        fetchSummaryData,
        fetchTopPropertiesData,
        fetchCountsData,
        setMonthFilter,
        setYearFilter,
        testCountsAPI,
        refreshCountsOnly,
        setActiveTab,
        refreshAuditTrails,
        sendGuestNotification
    };
}

// Make functions globally accessible
window.refreshDashboard = refreshDashboard;
window.setMonthFilter = setMonthFilter;
window.setYearFilter = setYearFilter;
window.testCountsAPI = testCountsAPI;
window.refreshCountsOnly = refreshCountsOnly;
window.setActiveTab = setActiveTab;
window.refreshAuditTrails = refreshAuditTrails;
window.sendGuestNotification = sendGuestNotification;

// Guest Notification Functionality
// ================================

/**
 * Send notification message to guest
 * @param {Object} notificationData - The notification payload
 * @returns {Promise<Object>} - API response
 */
async function sendGuestNotification(notificationData) {
    try {
        console.log('Sending guest notification:', notificationData);
        
        const response = await fetch(`${API_BASE}/notify/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationData)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Guest notification sent successfully:', result);
        
        // Show success message
        showNotificationSuccess('Guest notification sent successfully!');
        
        return result;
        
    } catch (error) {
        console.error('Error sending guest notification:', error);
        
        // Show error message
        showNotificationError(`Failed to send notification: ${error.message}`);
        
        throw error;
    }
}

/**
 * Show success notification message
 * @param {string} message - Success message to display
 */
function showNotificationSuccess(message) {
    // Create success message element
    const successElement = document.createElement('div');
    successElement.id = 'notification-success';
    successElement.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    successElement.innerHTML = `
        <svg class="w-5 h-5 fill-green-500" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span class="font-medium">${message}</span>
    `;
    
    // Remove existing success message if any
    const existingSuccess = document.getElementById('notification-success');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    document.body.appendChild(successElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (successElement.parentNode) {
            successElement.remove();
        }
    }, 5000);
}

/**
 * Show error notification message
 * @param {string} message - Error message to display
 */
function showNotificationError(message) {
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.id = 'notification-error';
    errorElement.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    errorElement.innerHTML = `
        <svg class="w-5 h-5 fill-red-500" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <span class="font-medium">${message}</span>
    `;
    
    // Remove existing error message if any
    const existingError = document.getElementById('notification-error');
    if (existingError) {
        existingError.remove();
    }
    
    document.body.appendChild(errorElement);
    
    // Auto-remove after 8 seconds (longer for errors)
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
    }, 8000);
}

/**
 * Initialize guest notification functionality
 * Sets up event listeners for guest message buttons
 */
function initializeGuestNotifications() {
    console.log('Initializing guest notification functionality...');
    
    // Set up event listener for guest message button
    const guestMsgBtn = document.getElementById('guestMsgBtn');
    if (guestMsgBtn) {
        console.log('Guest message button found, setting up event listener');
        
        guestMsgBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Guest message button clicked');
            
            try {
                // Get admin user data from localStorage or use defaults
                const adminId = localStorage.getItem('adminId') || localStorage.getItem('userId') || 'admin-user';
                const adminName = localStorage.getItem('adminName') || localStorage.getItem('firstName') + ' ' + localStorage.getItem('lastName') || 'Admin User';
                
                // Create sample notification payload
                const notificationPayload = {
                    fromId: adminId,
                    fromName: adminName,
                    fromRole: "admin",
                    toId: "685009ff53a090e126b9e2b4", // Sample guest ID
                    toName: "Jon Do",
                    toRole: "guest",
                    message: "Welcome to Betcha Booking! We're excited to have you stay with us."
                };
                
                console.log('Sending notification with payload:', notificationPayload);
                
                // Send the notification
                await sendGuestNotification(notificationPayload);
                
            } catch (error) {
                console.error('Failed to send guest notification:', error);
            }
        });
        
        console.log('Guest message button event listener set up successfully');
    } else {
        console.warn('Guest message button (guestMsgBtn) not found in the DOM');
    }
}

// Initialize guest notifications when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other dashboard elements to load
    setTimeout(() => {
        initializeGuestNotifications();
    }, 1000);
});

// Make guest notification functions globally accessible
window.initializeGuestNotifications = initializeGuestNotifications;
window.showNotificationSuccess = showNotificationSuccess;
window.showNotificationError = showNotificationError;

// API Testing Functions for Notification & Booking Updates
// ======================================================

/**
 * Test the notification status update API
 * @param {string} notifId - Notification ID to test
 * @param {string} statusRejection - Status to test ("Rejected" or "Complete")
 */
async function testNotificationStatusAPI(notifId = 'test-notif-123', statusRejection = 'Complete') {
    try {
        console.log('🧪 Testing Notification Status API...');
        console.log('Endpoint:', `${API_BASE}/notify/status-rejection/${notifId}`);
        console.log('Payload:', { statusRejection });
        
        const response = await fetch(`${API_BASE}/notify/status-rejection/${notifId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statusRejection })
        });
        
        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Notification Status API Response:', result);
        
        // Test if response meets our criteria
        const meetsCriteria = validateNotificationStatusResponse(result);
        console.log('📋 Meets API Criteria:', meetsCriteria);
        
        return { success: true, data: result, meetsCriteria };
        
    } catch (error) {
        console.error('❌ Notification Status API Test Failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Test the booking status update API
 * @param {string} bookingId - Booking ID to test
 * @param {string} status - Status to test ("Cancel")
 */
async function testBookingStatusAPI(bookingId = 'test-booking-456', status = 'Cancel') {
    try {
        console.log('🧪 Testing Booking Status API...');
        console.log('Endpoint:', `${API_BASE}/booking/update-status/${bookingId}`);
        console.log('Payload:', { status });
        
        const response = await fetch(`${API_BASE}/booking/update-status/${bookingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Booking Status API Response:', result);
        
        // Test if response meets our criteria
        const meetsCriteria = validateBookingStatusResponse(result);
        console.log('📋 Meets API Criteria:', meetsCriteria);
        
        return { success: true, data: result, meetsCriteria };
        
    } catch (error) {
        console.error('❌ Booking Status API Test Failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Validate notification status API response against our criteria
 * @param {Object} response - API response to validate
 * @returns {Object} Validation result with details
 */
function validateNotificationStatusResponse(response) {
    const criteria = {
        hasSuccessField: false,
        hasMessageField: false,
        hasDataField: false,
        hasNotifId: false,
        hasStatusRejection: false,
        hasUpdatedAt: false,
        overallValid: false
    };
    
    try {
        // Check required fields
        criteria.hasSuccessField = typeof response.success === 'boolean';
        criteria.hasMessageField = typeof response.message === 'string';
        criteria.hasDataField = response.data && typeof response.data === 'object';
        
        if (criteria.hasDataField) {
            criteria.hasNotifId = response.data.notifId && typeof response.data.notifId === 'string';
            criteria.hasStatusRejection = response.data.statusRejection && typeof response.data.statusRejection === 'string';
            criteria.hasUpdatedAt = response.data.updatedAt && typeof response.data.updatedAt === 'string';
        }
        
        // Overall validation
        criteria.overallValid = criteria.hasSuccessField && 
                               criteria.hasMessageField && 
                               criteria.hasDataField &&
                               criteria.hasNotifId &&
                               criteria.hasStatusRejection;
        
    } catch (error) {
        console.error('Error validating notification response:', error);
        criteria.overallValid = false;
    }
    
    return criteria;
}

/**
 * Validate booking status API response against our criteria
 * @param {Object} response - API response to validate
 * @returns {Object} Validation result with details
 */
function validateBookingStatusResponse(response) {
    const criteria = {
        hasSuccessField: false,
        hasMessageField: false,
        hasDataField: false,
        hasBookingId: false,
        hasStatus: false,
        hasUpdatedAt: false,
        overallValid: false
    };
    
    try {
        // Check required fields
        criteria.hasSuccessField = typeof response.success === 'boolean';
        criteria.hasMessageField = typeof response.message === 'string';
        criteria.hasDataField = response.data && typeof response.data === 'object';
        
        if (criteria.hasDataField) {
            criteria.hasBookingId = response.data.bookingId && typeof response.data.bookingId === 'string';
            criteria.hasStatus = response.data.status && typeof response.data.status === 'string';
            criteria.hasUpdatedAt = response.data.updatedAt && typeof response.data.updatedAt === 'string';
        }
        
        // Overall validation
        criteria.overallValid = criteria.hasSuccessField && 
                               criteria.hasMessageField && 
                               criteria.hasDataField &&
                               criteria.hasBookingId &&
                               criteria.hasStatus;
        
    } catch (error) {
        console.error('Error validating booking response:', error);
        criteria.overallValid = false;
    }
    
    return criteria;
}

/**
 * Run comprehensive API tests for notification and booking functionality
 */
async function runComprehensiveAPITests() {
    console.log('🚀 Starting Comprehensive API Tests...');
    console.log('=====================================');
    
    // Test 1: Notification Status API
    console.log('\n📧 Test 1: Notification Status Update API');
    console.log('----------------------------------------');
    const notifTest = await testNotificationStatusAPI();
    
    // Test 2: Booking Status API
    console.log('\n📋 Test 2: Booking Status Update API');
    console.log('------------------------------------');
    const bookingTest = await testBookingStatusAPI();
    
    // Summary
    console.log('\n📊 API Test Summary');
    console.log('==================');
    console.log('Notification API:', notifTest.success ? '✅ PASSED' : '❌ FAILED');
    console.log('Booking API:', bookingTest.success ? '✅ PASSED' : '❌ FAILED');
    
    if (notifTest.success && notifTest.meetsCriteria) {
        console.log('✅ Notification API meets all criteria for implementation');
    } else {
        console.log('⚠️ Notification API may need adjustments before implementation');
    }
    
    if (bookingTest.success && bookingTest.meetsCriteria) {
        console.log('✅ Booking API meets all criteria for implementation');
    } else {
        console.log('⚠️ Booking API may need adjustments before implementation');
    }
    
    return {
        notification: notifTest,
        booking: bookingTest,
        allPassed: notifTest.success && bookingTest.success
    };
}

// Make test functions globally accessible
window.testNotificationStatusAPI = testNotificationStatusAPI;
window.testBookingStatusAPI = testBookingStatusAPI;
window.runComprehensiveAPITests = runComprehensiveAPITests;
window.validateNotificationStatusResponse = validateNotificationStatusResponse;
window.validateBookingStatusResponse = validateBookingStatusResponse;

// Enhanced API Testing Functions with Real Data Support
// ===================================================

/**
 * Get sample notification IDs from the system (if available)
 * This would typically come from a notifications list or database
 */
function getSampleNotificationIds() {
    // In a real system, you'd fetch this from your notifications API
    // For now, return common patterns that might exist
    return [
        '685597501a58eb359c2a0e8d', // Sample ID from your payload
        '685009ff53a090e126b9e2b4', // Another sample ID
        // Add more sample IDs as needed
    ];
}

/**
 * Get sample booking IDs from the system (if available)
 * This would typically come from a bookings list or database
 */
function getSampleBookingIds() {
    // In a real system, you'd fetch this from your bookings API
    // For now, return common patterns that might exist
    return [
        'booking-001',
        'booking-002',
        // Add more sample IDs as needed
    ];
}

/**
 * Test notification status API with real or sample IDs
 * @param {string} notifId - Notification ID to test (optional, will use sample if not provided)
 * @param {string} statusRejection - Status to test ("Rejected" or "Complete")
 */
async function testNotificationStatusAPIWithRealData(notifId = null, statusRejection = 'Complete') {
    try {
        // Use provided ID or get a sample ID
        const testNotifId = notifId || getSampleNotificationIds()[0];
        
        if (!testNotifId) {
            throw new Error('No notification ID available for testing. Please provide a valid ID.');
        }
        
        console.log('🧪 Testing Notification Status API with Real Data...');
        console.log('Endpoint:', `${API_BASE}/notify/status-rejection/${testNotifId}`);
        console.log('Payload:', { statusRejection });
        console.log('Using Notification ID:', testNotifId);
        
        const response = await fetch(`${API_BASE}/notify/status-rejection/${testNotifId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statusRejection })
        });
        
        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Notification Status API Response:', result);
        
        // Test if response meets our criteria
        const meetsCriteria = validateNotificationStatusResponse(result);
        console.log('📋 Meets API Criteria:', meetsCriteria);
        
        return { success: true, data: result, meetsCriteria, notifId: testNotifId };
        
    } catch (error) {
        console.error('❌ Notification Status API Test Failed:', error);
        return { success: false, error: error.message, notifId: notifId || 'unknown' };
    }
}

/**
 * Test booking status API with real or sample IDs
 * @param {string} bookingId - Booking ID to test (optional, will use sample if not provided)
 * @param {string} status - Status to test ("Cancel")
 */
async function testBookingStatusAPIWithRealData(bookingId = null, status = 'Cancel') {
    try {
        // Use provided ID or get a sample ID
        const testBookingId = bookingId || getSampleBookingIds()[0];
        
        if (!testBookingId) {
            throw new Error('No booking ID available for testing. Please provide a valid ID.');
        }
        
        console.log('🧪 Testing Booking Status API with Real Data...');
        console.log('Endpoint:', `${API_BASE}/booking/update-status/${testBookingId}`);
        console.log('Payload:', { status });
        console.log('Using Booking ID:', testBookingId);
        
        const response = await fetch(`${API_BASE}/booking/update-status/${testBookingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        console.log('Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Booking Status API Response:', result);
        
        // Test if response meets our criteria
        const meetsCriteria = validateBookingStatusResponse(result);
        console.log('📋 Meets API Criteria:', meetsCriteria);
        
        return { success: true, data: result, meetsCriteria, bookingId: testBookingId };
        
    } catch (error) {
        console.error('❌ Booking Status API Test Failed:', error);
        return { success: false, error: error.message, bookingId: bookingId || 'unknown' };
    }
}

/**
 * Interactive test function that prompts for real IDs
 */
async function testWithUserProvidedIDs() {
    console.log('🔍 Interactive API Testing with User-Provided IDs');
    console.log('================================================');
    
    // Prompt for notification ID
    const notifId = prompt('Enter a real Notification ID to test (or leave empty to use sample):');
    const statusRejection = prompt('Enter status to test ("Rejected" or "Complete"):', 'Complete');
    
    // Prompt for booking ID
    const bookingId = prompt('Enter a real Booking ID to test (or leave empty to use sample):');
    const status = prompt('Enter status to test (default: "Cancel"):', 'Cancel');
    
    console.log('\n📧 Testing with provided IDs:');
    console.log('Notification ID:', notifId || 'Using sample');
    console.log('Status Rejection:', statusRejection);
    console.log('Booking ID:', bookingId || 'Using sample');
    console.log('Status:', status);
    
    // Run tests with provided IDs
    const notifTest = await testNotificationStatusAPIWithRealData(notifId, statusRejection);
    const bookingTest = await testBookingStatusAPIWithRealData(bookingId, status);
    
    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    console.log('Notification API:', notifTest.success ? '✅ PASSED' : '❌ FAILED');
    console.log('Booking API:', bookingTest.success ? '✅ PASSED' : '❌ FAILED');
    
    return { notification: notifTest, booking: bookingTest };
}

// Make enhanced test functions globally accessible
window.testNotificationStatusAPIWithRealData = testNotificationStatusAPIWithRealData;
window.testBookingStatusAPIWithRealData = testBookingStatusAPIWithRealData;
window.testWithUserProvidedIDs = testWithUserProvidedIDs;
window.getSampleNotificationIds = getSampleNotificationIds;
window.getSampleBookingIds = getSampleBookingIds;

// Production Notification & Booking Management Functions
// ===================================================

/**
 * Update notification status (Reject or Accept cancellation request)
 * @param {string} notifId - Notification ID to update
 * @param {string} statusRejection - Status: "Rejected" or "Complete"
 * @returns {Promise<Object>} - API response
 */
async function updateNotificationStatus(notifId, statusRejection) {
    try {
        if (!notifId) {
            throw new Error('Notification ID is required');
        }
        
        if (!['Rejected', 'Complete'].includes(statusRejection)) {
            throw new Error('Status must be either "Rejected" or "Complete"');
        }
        
        console.log('🔄 Updating notification status...');
        console.log('Notification ID:', notifId);
        console.log('Status:', statusRejection);
        
        const response = await fetch(`${API_BASE}/notify/status-rejection/${notifId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ statusRejection })
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Notification status updated successfully:', result);
        
        // Show success message
        showNotificationSuccess(`Cancellation request ${statusRejection.toLowerCase()} successfully`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error updating notification status:', error);
        
        // Show error message
        showNotificationError(`Failed to update notification status: ${error.message}`);
        
        throw error;
    }
}

/**
 * Update booking status to "Cancel" (only called when admin accepts cancellation)
 * @param {string} bookingId - Booking ID to update
 * @returns {Promise<Object>} - API response
 */
async function cancelBooking(bookingId) {
    try {
        if (!bookingId) {
            throw new Error('Booking ID is required');
        }
        
        console.log('🔄 Cancelling booking...');
        console.log('Booking ID:', bookingId);
        
        const response = await fetch(`${API_BASE}/booking/update-status/${bookingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'Cancel' })
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Booking cancelled successfully:', result);
        
        // Show success message
        showNotificationSuccess('Booking cancelled successfully');
        
        return result;
        
    } catch (error) {
        console.error('❌ Error cancelling booking:', error);
        
        // Show error message
        showNotificationError(`Failed to cancel booking: ${error.message}`);
        
        throw error;
    }
}

/**
 * Handle cancellation request workflow
 * This function manages the complete flow: update notification status + cancel booking if accepted
 * @param {string} notifId - Notification ID
 * @param {string} bookingId - Booking ID (required if accepting cancellation)
 * @param {string} action - "accept" or "reject"
 * @returns {Promise<Object>} - Result of the operation
 */
async function handleCancellationRequest(notifId, bookingId, action) {
    try {
        console.log('🚀 Handling cancellation request...');
        console.log('Action:', action);
        console.log('Notification ID:', notifId);
        console.log('Booking ID:', bookingId);
        
        if (action === 'accept') {
            // Admin accepts cancellation
            if (!bookingId) {
                throw new Error('Booking ID is required when accepting cancellation');
            }
            
            // Step 1: Update notification status to "Complete"
            console.log('📝 Step 1: Updating notification status to "Complete"');
            const notifResult = await updateNotificationStatus(notifId, 'Complete');
            
            // Step 2: Cancel the booking
            console.log('📝 Step 2: Cancelling the booking');
            const bookingResult = await cancelBooking(bookingId);
            
            console.log('✅ Cancellation request accepted and processed successfully');
            
            return {
                success: true,
                action: 'accepted',
                notification: notifResult,
                booking: bookingResult,
                message: 'Cancellation request accepted and booking cancelled'
            };
            
        } else if (action === 'reject') {
            // Admin rejects cancellation
            console.log('📝 Rejecting cancellation request');
            const notifResult = await updateNotificationStatus(notifId, 'Rejected');
            
            console.log('✅ Cancellation request rejected successfully');
            
            return {
                success: true,
                action: 'rejected',
                notification: notifResult,
                message: 'Cancellation request rejected'
            };
            
        } else {
            throw new Error('Invalid action. Must be "accept" or "reject"');
        }
        
    } catch (error) {
        console.error('❌ Error handling cancellation request:', error);
        
        // Show error message
        showNotificationError(`Failed to process cancellation request: ${error.message}`);
        
        throw error;
    }
}

/**
 * Create UI elements for handling cancellation requests
 * This function creates accept/reject buttons for notification items
 * @param {string} notifId - Notification ID
 * @param {string} bookingId - Booking ID
 * @param {HTMLElement} container - Container to append buttons to
 */
function createCancellationActionButtons(notifId, bookingId, container) {
    // Remove existing buttons if any
    const existingButtons = container.querySelectorAll('.cancellation-action-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-2 mt-3';
    
    // Accept button
    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors cancellation-action-btn';
    acceptBtn.textContent = 'Accept Cancellation';
    acceptBtn.addEventListener('click', async () => {
        try {
            acceptBtn.disabled = true;
            acceptBtn.textContent = 'Processing...';
            
            await handleCancellationRequest(notifId, bookingId, 'accept');
            
            // Optionally refresh the notifications list
            // refreshNotifications();
            
        } catch (error) {
            console.error('Failed to accept cancellation:', error);
        } finally {
            acceptBtn.disabled = false;
            acceptBtn.textContent = 'Accept Cancellation';
        }
    });
    
    // Reject button
    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors cancellation-action-btn';
    rejectBtn.textContent = 'Reject Cancellation';
    rejectBtn.addEventListener('click', async () => {
        try {
            rejectBtn.disabled = true;
            rejectBtn.textContent = 'Processing...';
            
            await handleCancellationRequest(notifId, bookingId, 'reject');
            
            // Optionally refresh the notifications list
            // refreshNotifications();
            
        } catch (error) {
            console.error('Failed to reject cancellation:', error);
        } finally {
            rejectBtn.disabled = false;
            rejectBtn.textContent = 'Reject Cancellation';
        }
    });
    
    // Add buttons to container
    buttonContainer.appendChild(acceptBtn);
    buttonContainer.appendChild(rejectBtn);
    container.appendChild(buttonContainer);
}

/**
 * Initialize cancellation management functionality
 * Sets up event listeners and prepares the system for handling cancellation requests
 */
function initializeCancellationManagement() {
    console.log('🚀 Initializing cancellation management system...');
    
    // Look for notification elements that might contain cancellation requests
    const notificationElements = document.querySelectorAll('[data-notification-id]');
    
    notificationElements.forEach(element => {
        const notifId = element.dataset.notificationId;
        const bookingId = element.dataset.bookingId;
        
        if (notifId && bookingId) {
            console.log('Found notification with booking:', { notifId, bookingId });
            
            // Check if this notification is a cancellation request
            const isCancellationRequest = element.textContent.toLowerCase().includes('cancellation') ||
                                        element.textContent.toLowerCase().includes('cancel');
            
            if (isCancellationRequest) {
                console.log('Adding cancellation action buttons to notification:', notifId);
                createCancellationActionButtons(notifId, bookingId, element);
            }
        }
    });
    
    console.log('✅ Cancellation management system initialized');
}

// Make production functions globally accessible
window.updateNotificationStatus = updateNotificationStatus;
window.cancelBooking = cancelBooking;
window.handleCancellationRequest = handleCancellationRequest;
window.createCancellationActionButtons = createCancellationActionButtons;
window.initializeCancellationManagement = initializeCancellationManagement;

// Initialize cancellation management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other dashboard elements to load
    setTimeout(() => {
        initializeCancellationManagement();
    }, 1500);
});