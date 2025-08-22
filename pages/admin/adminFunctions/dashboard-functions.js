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
    activeBookingCount: `${API_BASE}/dashboard/admin/booking/activeCount`
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
    initializeDashboard();
    initializeMonthYearFilters();
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
            fetchTopPropertiesData(),
            fetchCountsData()
        ]);
        
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
        
        populateSummaryData(summaryData);
        
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
        
        // Build URL with month and year parameters as query string
        let url = DASHBOARD_ENDPOINTS.rankProperty;
        const params = new URLSearchParams();
        
        if (currentMonthFilter && currentMonthFilter !== 'all') {
            params.append('month', currentMonthFilter);
        }
        
        if (currentYearFilter && currentYearFilter !== 'all') {
            params.append('year', currentYearFilter);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        topPropertiesData = await response.json();
        console.log('Top properties data received:', topPropertiesData);
        
        populateTopPropertiesChart(topPropertiesData);
        
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
    
    monthDropdownList.innerHTML = months.map(month => 
        `<li class="px-3 py-2 hover:bg-neutral-100 cursor-pointer transition-colors duration-200" data-month="${month.value}">${month.text}</li>`
    ).join('');
    
    console.log('Month dropdown populated with', months.length, 'options');
    
    // Toggle dropdown
    monthDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        monthDropdownList.classList.toggle('hidden');
        monthDropdownIcon.classList.toggle('rotate-180');
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
            
            // Refresh chart data with new filter
            fetchTopPropertiesData();
            
            // Close dropdown
            monthDropdownList.classList.add('hidden');
            monthDropdownIcon.classList.remove('rotate-180');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        monthDropdownList.classList.add('hidden');
        monthDropdownIcon.classList.remove('rotate-180');
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
    
    // Generate year options (current year and previous 3 years)
    const currentYear = new Date().getFullYear();
    const years = [
        { value: 'all', text: 'All Years' }
    ];
    
    for (let i = 0; i < 4; i++) {
        const year = currentYear - i;
        years.push({ value: year.toString(), text: year.toString() });
    }
    
    yearDropdownList.innerHTML = years.map(year => 
        `<li class="px-3 py-2 hover:bg-neutral-100 cursor-pointer transition-colors duration-200" data-year="${year.value}">${year.text}</li>`
    ).join('');
    
    // Toggle dropdown
    yearDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        yearDropdownList.classList.toggle('hidden');
        yearDropdownIcon.classList.toggle('rotate-180');
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
            
            // Refresh chart data with new filter
            fetchTopPropertiesData();
            
            // Close dropdown
            yearDropdownList.classList.add('hidden');
            yearDropdownIcon.classList.remove('rotate-180');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        yearDropdownList.classList.add('hidden');
        yearDropdownIcon.classList.remove('rotate-180');
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
function setMonthFilter(month) {
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
    fetchTopPropertiesData();
}

/**
 * Set year filter programmatically
 */
function setYearFilter(year) {
    currentYearFilter = year;
    
    // Update UI
    const selectedYearSpan = document.getElementById('selectedYear');
    if (selectedYearSpan) {
        selectedYearSpan.textContent = year === 'all' ? 'All Years' : year;
        selectedYearSpan.classList.remove('text-muted');
        selectedYearSpan.classList.add('text-primary-text');
    }
    
    // Refresh data
    fetchTopPropertiesData();
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
        refreshCountsOnly
    };
}

// Make functions globally accessible
window.refreshDashboard = refreshDashboard;
window.setMonthFilter = setMonthFilter;
window.setYearFilter = setYearFilter;
window.testCountsAPI = testCountsAPI;
window.refreshCountsOnly = refreshCountsOnly;