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
    availableToday: `${API_BASE}/admin/property/availableToday`,
    activeBookingCount: `${API_BASE}/admin/booking/activeCount`
};

// Global variables
let summaryData = null;
let topPropertiesData = null;
let dashboardChart = null;

// Initialize dashboard when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing dashboard...');
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
        
        const response = await fetch(DASHBOARD_ENDPOINTS.rankProperty);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        topPropertiesData = await response.json();
        console.log('Top properties data received:', topPropertiesData);
        
        populateTopPropertiesChart(topPropertiesData);
        
    } catch (error) {
        console.error('Error fetching top properties data:', error);
        populateTopPropertiesChart([]);
    }
}

/**
 * Fetch all count data
 */
async function fetchCountsData() {
    try {
        console.log('Fetching counts data...');
        
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
        
        // Parse responses
        const countsData = {
            employees: employeeResponse.ok ? await employeeResponse.json() : { count: 0 },
            guests: guestResponse.ok ? await guestResponse.json() : { count: 0 },
            properties: propertyResponse.ok ? await propertyResponse.json() : { count: 0 },
            todayBookings: todayBookingResponse.ok ? await todayBookingResponse.json() : { count: 0 },
            availableToday: availableTodayResponse.ok ? await availableTodayResponse.json() : { count: 0 },
            activeBookings: activeBookingResponse.ok ? await activeBookingResponse.json() : { count: 0 }
        };
        
        console.log('Counts data received:', countsData);
        populateCountsData(countsData);
        
    } catch (error) {
        console.error('Error fetching counts data:', error);
        // Set fallback values
        populateCountsData({
            employees: { count: 0 },
            guests: { count: 0 },
            properties: { count: 0 },
            todayBookings: { count: 0 },
            availableToday: { count: 0 },
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
        availableElement.textContent = data.availableToday.count || 0;
    }
    
    // Booked rooms today  
    const bookedElement = document.getElementById('bookedRoom');
    if (bookedElement) {
        bookedElement.textContent = data.todayBookings.count || 0;
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
    const availableCount = data.availableToday.count || 0;
    const bookedCount = data.todayBookings.count || 0;
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
    
    // Destroy existing chart if it exists
    if (dashboardChart) {
        dashboardChart.destroy();
    }
    
    // Prepare chart data
    const chartData = prepareChartData(data);
    
    // Create new chart
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

// Export functions for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDashboard,
        refreshDashboard,
        fetchSummaryData,
        fetchTopPropertiesData,
        fetchCountsData
    };
}

// Make refresh function globally accessible
window.refreshDashboard = refreshDashboard;