

const API_BASE = 'https://betcha-api.onrender.com';

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

let summaryData = null;
let topPropertiesData = null;
let dashboardChart = null;
let currentMonthFilter = null;
let currentYearFilter = null;

document.addEventListener('DOMContentLoaded', function() {

    initializeMonthYearFilters();

    initializeAdminProfile();

    initializeDashboard();

    initializeAuditTabs();
});

function initializeAdminProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const adminProfileImgElement = document.getElementById('adminProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!adminProfileImgElement || !menuBtnElement) {
            console.warn('Admin profile elements not found in DOM');
            return;
        }

        if (profilePicture && profilePicture.trim() !== '') {
            adminProfileImgElement.src = profilePicture;
            adminProfileImgElement.classList.remove('hidden');

            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Admin profile picture loaded:', profilePicture);
        } else {

            adminProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No admin profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing admin profile:', error);
    }
}

async function initializeDashboard() {
    try {

        try {
            if (window.AuditTrailFunctions) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userId = userData.userId || userData.user_id || 'unknown';
                const userType = userData.role || 'admin';
                await window.AuditTrailFunctions.logSystemAccess(userId, userType);
            }
        } catch (auditError) {
            console.error('Audit trail error:', auditError);
        }

        await Promise.all([
            fetchSummaryData(),
            fetchCountsData()
        ]);

        await fetchTopPropertiesData();
        await fetchAuditTrailData(); 

        hideLoadingStates();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorState('Failed to load dashboard data. Please refresh the page.');

        hideLoadingStates();
    }
}

function hideLoadingStates() {

    const skeletonElements = ['earningsSkeleton', 'chartsSkeleton', 'auditTrailsSkeleton'];
    const contentElements = ['earningsContent', 'chartsContent', 'auditTrailsContent'];
    
    skeletonElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    contentElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('hidden');
        }
    });
}

function showChartLoading() {
    const chartsSkeleton = document.getElementById('chartsSkeleton');
    const chartsContent = document.getElementById('chartsContent');
    
    if (chartsSkeleton) chartsSkeleton.classList.remove('hidden');
    if (chartsContent) chartsContent.classList.add('hidden');
}

function hideChartLoading() {
    const chartsSkeleton = document.getElementById('chartsSkeleton');
    const chartsContent = document.getElementById('chartsContent');
    
    if (chartsSkeleton) chartsSkeleton.classList.add('hidden');
    if (chartsContent) chartsContent.classList.remove('hidden');
}

async function fetchSummaryData() {
    try {
        const response = await fetch(DASHBOARD_ENDPOINTS.summary);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        summaryData = await response.json();

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

        populateSummaryData({
            yearlyEarnings: 0,
            monthlyEarnings: 0,
            weeklyEarnings: 0
        });
    }
}

async function fetchTopPropertiesData() {
    try {

        showChartLoading();

        const url = DASHBOARD_ENDPOINTS.rankProperty;
        const monthNum = (currentMonthFilter && currentMonthFilter !== 'all')
            ? parseInt(String(currentMonthFilter), 10)
            : undefined;
        const yearNum = (currentYearFilter && currentYearFilter !== 'all')
            ? parseInt(String(currentYearFilter), 10)
            : undefined;

        const payload = {};
        if (!Number.isNaN(monthNum)) payload.month = monthNum;
        if (!Number.isNaN(yearNum)) payload.year = yearNum;

        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const monthParam = (typeof payload.month === 'number') ? `month=${payload.month}` : '';
            const yearParam = (typeof payload.year === 'number') ? `year=${payload.year}` : '';
            const qs = [monthParam, yearParam].filter(Boolean).join('&');
            const fallbackUrl = qs ? `${url}?${qs}` : url;
            response = await fetch(fallbackUrl);
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        topPropertiesData = await response.json();

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

        chartData = chartData.map(item => ({
            propertyName: item.propertyName || item.name || 'Unknown Property',
            totalEarnings: typeof item.totalEarnings === 'number' ? item.totalEarnings : (typeof item.earned === 'number' ? item.earned : 0)
        }));

        if (window.updateTopRoomsChart) {
            const labels = chartData.map(i => i.propertyName || i.name || 'Unknown Property');
            const values = chartData.map(i => i.totalEarnings || 0);
            window.updateTopRoomsChart(labels, values);
        } else {

            populateTopPropertiesChart(chartData);
        }

        hideChartLoading();
        
    } catch (error) {
        console.error('Error fetching top properties data:', error);
        populateTopPropertiesChart([]);

        hideChartLoading();
    }
}

async function fetchCountsData() {
    try {

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

        const countsData = {
            employees: employeeResponse.ok ? await employeeResponse.json() : { count: 0 },
            guests: guestResponse.ok ? await guestResponse.json() : { count: 0 },
            properties: propertyResponse.ok ? await propertyResponse.json() : { count: 0 },
            todayBookings: todayBookingResponse.ok ? await todayBookingResponse.json() : { activeBookingsToday: 0 },
            availableToday: availableTodayResponse.ok ? await availableTodayResponse.json() : { availableRoomCount: 0 },
            activeBookings: activeBookingResponse.ok ? await activeBookingResponse.json() : { count: 0 }
        };
        
        populateCountsData(countsData);
        
    } catch (error) {
        console.error('Error fetching counts data:', error);

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

async function fetchAuditTrailData() {
    try {
        const response = await fetch(DASHBOARD_ENDPOINTS.auditTrails);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const auditData = await response.json();

        populateAuditTrailCards(auditData);
        
    } catch (error) {
        console.error('Error fetching audit trail data:', error);

        populateAuditTrailCards([]);
    }
}

function populateAuditTrailCards(auditData) {

    if (!Array.isArray(auditData)) {
        console.warn('Audit data is not an array, using empty array');
        auditData = [];
    }

    const adminData = auditData.filter(item => item && item.userType === 'Admin').slice(0, 5);
    const employeeData = auditData.filter(item => item && item.userType === 'Employee').slice(0, 5);
    const customerData = auditData.filter(item => item && item.userType === 'Guest').slice(0, 5);

    populateAuditTab(0, adminData); 
    populateAuditTab(1, employeeData); 
    populateAuditTab(2, customerData); 
}

function populateAuditTab(tabIndex, data) {

    const auditContainer = document.getElementById('tab-contents');
    const group = auditContainer ? auditContainer.closest('[data-tab-group]') : null;
    const tabContents = group ? group.querySelectorAll('.tab-content') : document.querySelectorAll('.tab-content');
    const tabContent = tabContents[tabIndex];
    if (!tabContent) {
        console.warn(`Tab content ${tabIndex} not found`);
        return;
    }
    
    const gridContainer = tabContent.querySelector('.grid');
    if (!gridContainer) {
        console.warn(`Grid container for tab ${tabIndex} not found`);
        return;
    }

    gridContainer.innerHTML = '';
    
    if (!data || data.length === 0) {

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

    data.forEach(item => {
        const card = createAuditTrailCard(item);
        gridContainer.appendChild(card);
    });
}

function createAuditTrailCard(auditItem) {
    const card = document.createElement('div');
    card.className = 'bg-neutral-50 rounded-xl border border-neutral-200 p-4 hover:bg-neutral-100 transition-all duration-300 ease-in-out';

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

function populateSummaryData(data) {

    const yearElement = document.getElementById('totalYearEarning');
    if (yearElement) {
        yearElement.textContent = formatCurrency(data.yearlyEarnings || 0);
    }

    const monthElement = document.getElementById('totalMonthEarning');
    if (monthElement) {
        monthElement.textContent = formatCurrency(data.monthlyEarnings || 0);
    }

    const weekElement = document.getElementById('totalWeekEarning');
    if (weekElement) {
        weekElement.textContent = formatCurrency(data.weeklyEarnings || 0);
    }
}

function populateCountsData(data) {

    const availableElement = document.getElementById('availableRental');
    if (availableElement) {
        const availableCount = data.availableToday.availableRoomCount || 0;
        availableElement.textContent = availableCount;
    }

    const bookedElement = document.getElementById('bookedRoom');
    if (bookedElement) {
        const bookedCount = data.todayBookings.activeBookingsToday || 0;
        bookedElement.textContent = bookedCount;
    }

    const employeeElement = document.getElementById('totalEmployee');
    if (employeeElement) {
        employeeElement.textContent = data.employees.count || 0;
    }

    const customerElement = document.getElementById('totalCustomer');
    if (customerElement) {
        customerElement.textContent = data.guests.count || 0;
    }

    const roomElement = document.getElementById('totalRoom');
    if (roomElement) {
        roomElement.textContent = data.properties.count || 0;
    }

    const transactionElement = document.getElementById('totalTransaction');
    if (transactionElement) {
        transactionElement.textContent = data.activeBookings.count || 0;
    }

    updateProgressBars(data);
}

function updateProgressBars(data) {
    const availableCount = data.availableToday.availableRoomCount || 0;
    const bookedCount = data.todayBookings.activeBookingsToday || 0;
    const totalProperties = data.properties.count || 1; 

    const availableProgress = Math.round((availableCount / totalProperties) * 100);
    const availableProgressBar = document.querySelector('.bg-primary .bg-white');
    if (availableProgressBar) {
        availableProgressBar.style.width = `${Math.min(availableProgress, 100)}%`;
    }

    const bookedProgress = Math.round((bookedCount / totalProperties) * 100);
    const bookedProgressBars = document.querySelectorAll('.bg-primary .bg-white');
    if (bookedProgressBars.length > 1) {
        bookedProgressBars[1].style.width = `${Math.min(bookedProgress, 100)}%`;
    }
}

function populateTopPropertiesChart(data) {
    
    const chartCanvas = document.getElementById('topRoomsChart');
    if (!chartCanvas) {
        console.warn('Top rooms chart canvas not found');
        return;
    }

    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not yet available, retrying in 200ms');
        setTimeout(() => populateTopPropertiesChart(data), 200);
        return;
    }

    topPropertiesData = data;

    if (dashboardChart) {
        try {
            dashboardChart.destroy();
            dashboardChart = null;
        } catch (error) {
            console.warn('Error destroying existing chart:', error);
            dashboardChart = null;
        }
    }

    const existingChart = Chart.getChart(chartCanvas);
    if (existingChart) {
        try {
            existingChart.destroy();
        } catch (error) {
            console.warn('Error destroying chart attached to canvas:', error);
        }
    }

    const sortedData = sortPropertiesByEarnings([...data]);

    const chartData = prepareChartData(sortedData);

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

function prepareChartData(data) {

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

    const labels = data.map(item => {

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

function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function showErrorState(message) {
    console.error('Dashboard error:', message);

}

async function refreshDashboard() {
    await initializeDashboard();
}

function initializeMonthYearFilters() {
    initializeMonthDropdown();
    initializeYearDropdown();

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');

    const yyyy = String(Math.max(2025, now.getFullYear()));
    currentMonthFilter = mm;
    currentYearFilter = yyyy;

    setMonthFilter(mm, true);
    setYearFilter(yyyy, true);
}

function initializeMonthDropdown() {
    const monthDropdownBtn = document.getElementById('monthDropdownBtn');
    const monthDropdownList = document.getElementById('monthDropdownList');
    const monthDropdownIcon = document.getElementById('monthDropdownIcon');
    const selectedMonthSpan = document.getElementById('selectedMonth');
    
    if (!monthDropdownBtn || !monthDropdownList) {
        console.warn('Month dropdown elements not found');
        return;
    }

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

    monthDropdownList.classList.add('hidden');
    monthDropdownList.classList.remove('block');

    let isMonthDropdownOpen = false; 
    
    monthDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (!isMonthDropdownOpen) {

            monthDropdownList.classList.remove('hidden');
            monthDropdownList.classList.add('block');
            monthDropdownBtn.setAttribute('aria-expanded', 'true');
            monthDropdownIcon.classList.add('rotate-180');
            isMonthDropdownOpen = true;
        } else {

            monthDropdownList.classList.add('hidden');
            monthDropdownList.classList.remove('block');
            monthDropdownBtn.setAttribute('aria-expanded', 'false');
            monthDropdownIcon.classList.remove('rotate-180');
            isMonthDropdownOpen = false; 
        }
    });

    monthDropdownList.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            const monthValue = e.target.getAttribute('data-month');
            const monthText = e.target.textContent;

            selectedMonthSpan.textContent = monthText;
            selectedMonthSpan.classList.remove('text-muted');
            selectedMonthSpan.classList.add('text-primary-text');

            currentMonthFilter = monthValue;

            fetchTopPropertiesData();

            monthDropdownList.classList.add('hidden');
            monthDropdownIcon.classList.remove('rotate-180');
            isMonthDropdownOpen = false; 
        }
    });

    document.addEventListener('click', function() {
        monthDropdownList.classList.add('hidden');
        monthDropdownList.classList.remove('block');
        monthDropdownBtn.setAttribute('aria-expanded', 'false');
        monthDropdownIcon.classList.remove('rotate-180');
        isMonthDropdownOpen = false; 
    });
}

function initializeYearDropdown() {
    const yearDropdownBtn = document.getElementById('yearDropdownBtn');
    const yearDropdownList = document.getElementById('yearDropdownList');
    const yearDropdownIcon = document.getElementById('yearDropdownIcon');
    const selectedYearSpan = document.getElementById('selectedYear');
    
    if (!yearDropdownBtn || !yearDropdownList) {
        console.warn('Year dropdown elements not found');
        return;
    }

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

    yearDropdownList.classList.add('hidden');
    yearDropdownList.classList.remove('block');

    let isYearDropdownOpen = false; 
    
    yearDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (!isYearDropdownOpen) {

            yearDropdownList.classList.remove('hidden');
            yearDropdownList.classList.add('block');
            yearDropdownBtn.setAttribute('aria-expanded', 'true');
            yearDropdownIcon.classList.add('rotate-180');
            isYearDropdownOpen = true;
        } else {

            yearDropdownList.classList.add('hidden');
            yearDropdownList.classList.remove('block');
            yearDropdownBtn.setAttribute('aria-expanded', 'false');
            yearDropdownIcon.classList.remove('rotate-180');
            isYearDropdownOpen = false;
        }
    });

    yearDropdownList.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            const yearValue = e.target.getAttribute('data-year');
            const yearText = e.target.textContent;

            selectedYearSpan.textContent = yearText;
            selectedYearSpan.classList.remove('text-muted');
            selectedYearSpan.classList.add('text-primary-text');

            currentYearFilter = yearValue;

            fetchTopPropertiesData();

            yearDropdownList.classList.add('hidden');
            yearDropdownIcon.classList.remove('rotate-180');
            isYearDropdownOpen = false; 
        }
    });

    document.addEventListener('click', function() {
        yearDropdownList.classList.add('hidden');
        yearDropdownList.classList.remove('block');
        yearDropdownBtn.setAttribute('aria-expanded', 'false');
        yearDropdownIcon.classList.remove('rotate-180');
        isYearDropdownOpen = false; 
    });
}

function sortPropertiesByEarnings(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return data;
    }
    
    return data.sort((a, b) => {
        const earningsA = a.totalEarnings || a.earnings || 0;
        const earningsB = b.totalEarnings || b.earnings || 0;
        return earningsB - earningsA; 
    });
}

function setMonthFilter(month, suppressFetch) {
    currentMonthFilter = month;

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

    if (!suppressFetch) fetchTopPropertiesData();
}

function setYearFilter(year, suppressFetch) {
    currentYearFilter = year;

    const selectedYearSpan = document.getElementById('selectedYear');
    if (selectedYearSpan) {
        selectedYearSpan.textContent = year === 'all' ? 'All Years' : year;
        selectedYearSpan.classList.remove('text-muted');
        selectedYearSpan.classList.add('text-primary-text');
    }

    if (!suppressFetch) fetchTopPropertiesData();
}

async function refreshCountsOnly() {
    await fetchCountsData();
}

async function refreshAuditTrails() {
    await fetchAuditTrailData();
}

function setActiveTab(tabIndex) {

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

    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach((content, index) => {
        if (index === tabIndex) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

function setAuditTab(tabIndex) {
    const auditContent = document.getElementById('tab-contents');
    if (!auditContent) {
        console.warn('Audit tab contents container not found');
        return;
    }
    const group = auditContent.closest('[data-tab-group]');
    if (!group) {
        console.warn('Audit tab group container not found');
        return;
    }

    const tabButtons = group.querySelectorAll('.tab-btn');
    tabButtons.forEach((btn, index) => {
        if (index === tabIndex) {
            btn.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
            btn.classList.remove('text-neutral-500');
        } else {
            btn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
            btn.classList.add('text-neutral-500');
        }
    });

    const tabContents = group.querySelectorAll('.tab-content');
    tabContents.forEach((content, index) => {
        if (index === tabIndex) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

function initializeAuditTabs() {
    const auditContent = document.getElementById('tab-contents');
    const group = auditContent ? auditContent.closest('[data-tab-group]') : null;
    if (!group) {
        console.warn('Audit tab group not found during initialization');
        return;
    }

    const tabButtons = group.querySelectorAll('.tab-btn');
    tabButtons.forEach((btn, index) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            setAuditTab(index);
        });
    });

    setAuditTab(0);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDashboard,
        refreshDashboard,
        fetchSummaryData,
        fetchTopPropertiesData,
        fetchCountsData,
        setMonthFilter,
        setYearFilter,
        refreshCountsOnly,
        setActiveTab,
        refreshAuditTrails,
        sendGuestNotification
    };
}

window.refreshDashboard = refreshDashboard;
window.setMonthFilter = setMonthFilter;
window.setYearFilter = setYearFilter;

window.refreshCountsOnly = refreshCountsOnly;
window.setActiveTab = setActiveTab;
window.refreshAuditTrails = refreshAuditTrails;
window.sendGuestNotification = sendGuestNotification;

async function sendGuestNotification(notificationData) {
    try {
        const result = await window.notify.sendMessage(notificationData);

        showNotificationSuccess('Guest notification sent successfully!');
        return result;
        
    } catch (error) {
        console.error('Error sending guest notification:', error);
        showNotificationError(`Failed to send notification: ${error.message}`);
        throw error;
    }
}

function showNotificationSuccess(message) {

    const successElement = document.createElement('div');
    successElement.id = 'notification-success';
    successElement.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    successElement.innerHTML = `
        <svg class="w-5 h-5 fill-green-500" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span class="font-medium">${message}</span>
    `;

    const existingSuccess = document.getElementById('notification-success');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    document.body.appendChild(successElement);

    setTimeout(() => {
        if (successElement.parentNode) {
            successElement.remove();
        }
    }, 5000);
}

function showNotificationError(message) {

    const errorElement = document.createElement('div');
    errorElement.id = 'notification-error';
    errorElement.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    errorElement.innerHTML = `
        <svg class="w-5 h-5 fill-red-500" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <span class="font-medium">${message}</span>
    `;

    const existingError = document.getElementById('notification-error');
    if (existingError) {
        existingError.remove();
    }
    
    document.body.appendChild(errorElement);

    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
    }, 8000);
}

function initializeGuestNotifications() {

    const guestMsgBtn = document.getElementById('guestMsgBtn');
    if (guestMsgBtn) {
        guestMsgBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {

                const adminId = localStorage.getItem('adminId') || localStorage.getItem('userId') || 'admin-user';
                const adminName = localStorage.getItem('adminName') || localStorage.getItem('firstName') + ' ' + localStorage.getItem('lastName') || 'Admin User';

                const notificationPayload = {
                    fromId: adminId,
                    fromName: adminName,
                    fromRole: "admin",
                    toId: "685009ff53a090e126b9e2b4", 
                    toName: "Jon Do",
                    toRole: "guest",
                    message: "Welcome to Betcha Booking! We're excited to have you stay with us."
                };

                await sendGuestNotification(notificationPayload);
                
            } catch (error) {
                console.error('Failed to send guest notification:', error);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {

    setTimeout(() => {
        initializeGuestNotifications();
    }, 1000);
});

window.initializeGuestNotifications = initializeGuestNotifications;
window.showNotificationSuccess = showNotificationSuccess;
window.showNotificationError = showNotificationError;

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

        criteria.hasSuccessField = typeof response.success === 'boolean';
        criteria.hasMessageField = typeof response.message === 'string';
        criteria.hasDataField = response.data && typeof response.data === 'object';
        
        if (criteria.hasDataField) {
            criteria.hasNotifId = response.data.notifId && typeof response.data.notifId === 'string';
            criteria.hasStatusRejection = response.data.statusRejection && typeof response.data.statusRejection === 'string';
            criteria.hasUpdatedAt = response.data.updatedAt && typeof response.data.updatedAt === 'string';
        }

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

        criteria.hasSuccessField = typeof response.success === 'boolean';
        criteria.hasMessageField = typeof response.message === 'string';
        criteria.hasDataField = response.data && typeof response.data === 'object';
        
        if (criteria.hasDataField) {
            criteria.hasBookingId = response.data.bookingId && typeof response.data.bookingId === 'string';
            criteria.hasStatus = response.data.status && typeof response.data.status === 'string';
            criteria.hasUpdatedAt = response.data.updatedAt && typeof response.data.updatedAt === 'string';
        }

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

window.validateNotificationStatusResponse = validateNotificationStatusResponse;
window.validateBookingStatusResponse = validateBookingStatusResponse;

async function updateNotificationStatus(notifId, statusRejection) {
    try {
        if (!notifId) {
            throw new Error('Notification ID is required');
        }
        
        if (!['Rejected', 'Complete'].includes(statusRejection)) {
            throw new Error('Status must be either "Rejected" or "Complete"');
        }
        
        const url = `${API_BASE}/notify/status-rejection/${notifId}`;
        const body = { statusRejection };
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();

        showNotificationSuccess(`Cancellation request ${statusRejection.toLowerCase()} successfully`);
        
        return result;
        
    } catch (error) {
        console.error('Error updating notification status:', error);

        showNotificationError(`Failed to update notification status: ${error.message}`);
        
        throw error;
    }
}

async function cancelBooking(bookingId) {
    try {
        if (!bookingId) {
            throw new Error('Booking ID is required');
        }
        
        const url = `${API_BASE}/booking/update-status/${bookingId}`;
        const body = { status: 'Cancel' };
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();

        try {
            if (window.AuditTrailFunctions) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userId = userData.userId || userData.user_id || 'unknown';
                const userType = userData.role || 'admin';
                await window.AuditTrailFunctions.logBookingCancellation(userId, userType, bookingId);
            }
        } catch (auditError) {
            console.error('Audit trail error:', auditError);
        }

        showNotificationSuccess('Booking cancelled successfully');
        
        return result;
        
    } catch (error) {
        console.error('Error cancelling booking:', error);

        showNotificationError(`Failed to cancel booking: ${error.message}`);
        
        throw error;
    }
}

async function handleCancellationRequest(notifId, bookingId, action) {
    try {

        if (bookingId) {
            try {
                const bookingResponse = await fetch(`${API_BASE}/booking/${bookingId}`);
                const bookingData = await bookingResponse.json();

            } catch (fetchError) {
                console.error('Error fetching booking details:', fetchError);
            }
        }
        
        if (action === 'accept') {

            if (!bookingId) {
                throw new Error('Booking ID is required when accepting cancellation');
            }

            const notifResult = await updateNotificationStatus(notifId, 'Complete');

            const bookingResult = await cancelBooking(bookingId);
            
            return {
                success: true,
                action: 'accepted',
                notification: notifResult,
                booking: bookingResult,
                message: 'Cancellation request accepted and booking cancelled'
            };
            
        } else if (action === 'reject') {

            const notifResult = await updateNotificationStatus(notifId, 'Rejected');
            
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
        console.error('Error handling cancellation request:', error);

        showNotificationError(`Failed to process cancellation request: ${error.message}`);
        
        throw error;
    }
}

function createCancellationActionButtons(notifId, bookingId, container) {

    const existingButtons = container.querySelectorAll('.cancellation-action-btn');
    existingButtons.forEach(btn => btn.remove());

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-2 mt-3';

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors cancellation-action-btn';
    acceptBtn.textContent = 'Accept Cancellation';
    acceptBtn.addEventListener('click', async () => {
        try {
            acceptBtn.disabled = true;
            acceptBtn.textContent = 'Processing...';
            
            await handleCancellationRequest(notifId, bookingId, 'accept');

        } catch (error) {
            console.error('Failed to accept cancellation:', error);
        } finally {
            acceptBtn.disabled = false;
            acceptBtn.textContent = 'Accept Cancellation';
        }
    });

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors cancellation-action-btn';
    rejectBtn.textContent = 'Reject Cancellation';
    rejectBtn.addEventListener('click', async () => {
        try {
            rejectBtn.disabled = true;
            rejectBtn.textContent = 'Processing...';
            
            await handleCancellationRequest(notifId, bookingId, 'reject');

        } catch (error) {
            console.error('Failed to reject cancellation:', error);
        } finally {
            rejectBtn.disabled = false;
            rejectBtn.textContent = 'Reject Cancellation';
        }
    });

    buttonContainer.appendChild(acceptBtn);
    buttonContainer.appendChild(rejectBtn);
    container.appendChild(buttonContainer);
}

function initializeCancellationManagement() {

    initializeStaticModalButtons();

    const notificationElements = document.querySelectorAll('[data-notification-id]');
    
    notificationElements.forEach(element => {
        const notifId = element.dataset.notificationId;
        const bookingId = element.dataset.bookingId;
        
        if (notifId && bookingId) {

            const isCancellationRequest = element.textContent.toLowerCase().includes('cancellation') ||
                                        element.textContent.toLowerCase().includes('cancel');
            
            if (isCancellationRequest) {
                createCancellationActionButtons(notifId, bookingId, element);
            }
        }
    });
}

function initializeStaticModalButtons() {

    const rejectBtn = document.getElementById('cancelRejectBtn');
    if (rejectBtn) {
        rejectBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {

                const modal = document.getElementById('cancelModal');
                if (!modal) {
                    throw new Error('Cancel modal not found');
                }
                
                const notifId = modal.dataset.notificationId;
                if (!notifId) {
                    throw new Error('No notification ID found in modal data');
                }

                let bookingId = modal.dataset.bookingId;

                if (!bookingId) {
                    const transNo = modal.querySelector('#cancel-transNo, #transNo')?.textContent?.replace('Transaction no. ', '') || 
                                   modal.querySelector('[data-trans-no]')?.textContent;
                    
                    if (transNo) {
                        try {
                            const searchResponse = await fetch(`${API_BASE}/booking/trans/${encodeURIComponent(transNo)}`);
                            const searchData = await searchResponse.json();
                            
                            if (searchData && (searchData.booking || searchData.data)) {
                                const b = searchData.booking || searchData.data;
                                bookingId = b._id || b.id || b.bookingId || '';
                                if (bookingId) modal.dataset.bookingId = bookingId;
                            }
                        } catch (searchError) {
                            console.error('Error searching for booking by transaction number:', searchError);
                        }
                    }
                }

                const originalText = rejectBtn.textContent;
                rejectBtn.disabled = true;
                rejectBtn.textContent = 'Processing...';

                await updateNotificationStatus(notifId, 'Rejected');

                try {
                    const fromId = localStorage.getItem('adminId') || localStorage.getItem('userId') || 'admin-user';
                    const fromName = localStorage.getItem('adminName') || `${localStorage.getItem('firstName') || 'Admin'} ${localStorage.getItem('lastName') || 'User'}`.trim();
                    const toId = modal.dataset.fromId || '';
                    const toName = 'Employee';
                    const payload = {
                        fromId,
                        fromName,
                        fromRole: 'admin',
                        toId,
                        toName,
                        toRole: 'employee',
                        message: 'Your cancellation request has been reviewed and rejected by the admin. The booking will remain active. This thread does not accept replies. For any concerns, please reach out to the admin via the designated support channel.'
                    };
                    const msgResp = await fetch(`${API_BASE}/notify/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    await msgResp.json().catch(() => ({}));
                } catch (msgErr) {
                    console.warn('Failed to send rejection message:', msgErr);
                }

                const closeBtn = modal.querySelector('[data-close-modal]');
                if (closeBtn) {
                    closeBtn.click();
                }

                if (typeof fetchNotifications === 'function') {
                    fetchNotifications();
                }
                
            } catch (error) {
                console.error('Error rejecting cancellation request:', error);
                showNotificationError(`Failed to reject cancellation: ${error.message}`);
            } finally {

                rejectBtn.disabled = false;
                rejectBtn.textContent = originalText;
            }
        });
    }

    const approveBtn = document.getElementById('approveCancelBtn');
    if (approveBtn) {
        approveBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {

                const modal = document.getElementById('cancelModal');
                if (!modal) {
                    throw new Error('Cancel modal not found');
                }
                
                const notifId = modal.dataset.notificationId;
                let bookingId = modal.dataset.bookingId;
                
                if (!notifId) {
                    throw new Error('No notification ID found in modal data');
                }

                if (!bookingId) {
                    const transNo = modal.querySelector('#cancel-transNo, #transNo')?.textContent?.replace('Transaction no. ', '') || 
                                   modal.querySelector('[data-trans-no]')?.textContent;
                    if (transNo) {
                        try {
                            const searchResponse = await fetch(`${API_BASE}/booking/trans/${encodeURIComponent(transNo)}`);
                            const searchData = await searchResponse.json();
                            if (searchData && (searchData.booking || searchData.data)) {
                                const b = searchData.booking || searchData.data;
                                bookingId = b._id || b.id || b.bookingId || '';
                                if (bookingId) modal.dataset.bookingId = bookingId;
                            }
                        } catch (e2) {
                            console.warn('Failed to resolve bookingId from transNo:', e2);
                        }
                    }
                }
                
                if (!bookingId) {
                    throw new Error('No booking ID found in modal data');
                }

                const originalText = approveBtn.textContent;
                approveBtn.disabled = true;
                approveBtn.textContent = 'Processing...';

                await handleCancellationRequest(notifId, bookingId, 'accept');

                const closeBtn = modal.querySelector('[data-close-modal]');
                if (closeBtn) {
                    closeBtn.click();
                }

                if (typeof fetchNotifications === 'function') {
                    fetchNotifications();
                }
                
            } catch (error) {
                console.error('Error approving cancellation request:', error);
                showNotificationError(`Failed to approve cancellation: ${error.message}`);
            } finally {

                approveBtn.disabled = false;
                approveBtn.textContent = originalText;
            }
        });
    }
}

window.updateNotificationStatus = updateNotificationStatus;
window.cancelBooking = cancelBooking;
window.handleCancellationRequest = handleCancellationRequest;
window.createCancellationActionButtons = createCancellationActionButtons;
window.initializeCancellationManagement = initializeCancellationManagement;

