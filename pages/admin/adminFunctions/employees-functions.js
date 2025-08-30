// Employee Functions for Admin Dashboard

// API Base URL
const API_BASE = 'https://betcha-api.onrender.com';

let employees = [];

// Use full API URL
const apiUrl = `${API_BASE}/employee/display`;

// Initialize the employee manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Employee Manager...');
    try {
        console.log('Fetching employees from API...');
        await fetchEmployees();
        console.log('Rendering employees...');
        renderEmployees();
        console.log('Setting up event listeners...');
        setupEventListeners();
        console.log('Employee Manager initialized successfully!');
    } catch (error) {
        console.error('Error initializing employee manager:', error);
        showErrorState('Failed to load employees. Please try again.');
    }
});

async function fetchEmployees() {
    try {
        console.log('Making API request to:', apiUrl);
        const response = await fetch(apiUrl);
        console.log('API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        employees = await response.json();
        console.log('Fetched employees:', employees);
        console.log('Number of employees:', employees.length);
        
        // Handle case when API returns empty array
        if (!Array.isArray(employees)) {
            throw new Error('Invalid response format from API');
        }
    } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
    }
}

function renderEmployees() {
    console.log('Starting to render employees...');
    console.log('Total employees to render:', employees.length);
    
    // Log status values for debugging
    if (employees.length > 0) {
        console.log('Employee status values:');
        employees.forEach((emp, index) => {
            console.log(`Employee ${index + 1}: status="${emp.status}", name="${emp.firstname} ${emp.lastname}"`);
        });
    }
    
    // Hide loading state
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
        loadingState.style.display = 'none';
    }

    const activeTab = document.getElementById('active-tab');
    const inactiveTab = document.getElementById('inactive-tab');
    
    if (!activeTab || !inactiveTab) {
        console.error('Could not find active-tab or inactive-tab elements');
        return;
    }

    // Clear existing content
    activeTab.querySelector('.grid').innerHTML = '';
    inactiveTab.querySelector('.grid').innerHTML = '';

    // Separate active and inactive employees - be more flexible with status values
    const activeEmployees = employees.filter(emp => emp.status === 'active' || emp.status === 'Active' || !emp.status);
    const inactiveEmployees = employees.filter(emp => emp.status === 'archived' || emp.status === 'Archived' || emp.status === 'inactive' || emp.status === 'Inactive');

    console.log('Active employees found:', activeEmployees.length);
    console.log('Inactive employees found:', inactiveEmployees.length);

    // Render active employees
    if (activeEmployees.length > 0) {
        console.log('Rendering active employees...');
        activeEmployees.forEach(employee => {
            const employeeCard = createEmployeeCard(employee);
            activeTab.querySelector('.grid').appendChild(employeeCard);
        });
    } else {
        console.log('No active employees found, showing empty state');
        activeTab.querySelector('.grid').innerHTML = createEmptyState('No active employees found');
    }

    // Render inactive employees
    if (inactiveEmployees.length > 0) {
        console.log('Rendering inactive employees...');
        inactiveEmployees.forEach(employee => {
            const employeeCard = createEmployeeCard(employee);
            inactiveTab.querySelector('.grid').appendChild(employeeCard);
        });
    } else {
        console.log('No inactive employees found, showing empty state');
        inactiveTab.querySelector('.grid').innerHTML = createEmptyState('No inactive employees found');
    }

    // Update tab counts if needed
    updateTabCounts(activeEmployees.length, inactiveEmployees.length);

    // Always show the active tab by default after rendering
    console.log('Setting default active tab...');
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        showTab(0); // Always show active tab by default
    }, 100);

    // If no employees at all, show a message
    if (employees.length === 0) {
        activeTab.querySelector('.grid').innerHTML = createEmptyState('No employees found in the system');
        inactiveTab.querySelector('.grid').innerHTML = createEmptyState('No employees found in the system');
    }
    
    console.log('Finished rendering employees');
}

// Function to handle tab switching
function setActiveTab(tabIndex) {
    showTab(tabIndex);
}

// Make setActiveTab globally accessible
window.setActiveTab = setActiveTab;

function showTab(tabIndex) {
    console.log('Switching to tab:', tabIndex);
    const activeTab = document.getElementById('active-tab');
    const inactiveTab = document.getElementById('inactive-tab');
    const activeTabBtn = document.getElementById('active-employee-tab');
    const inactiveTabBtn = document.getElementById('inactive-employee-tab');
    
    console.log('Active tab element:', activeTab);
    console.log('Inactive tab element:', inactiveTab);
    console.log('Active tab button:', activeTabBtn);
    console.log('Inactive tab button:', inactiveTabBtn);
    
    // Hide all tabs
    if (activeTab) {
        activeTab.classList.add('hidden');
        console.log('Hidden active tab');
    }
    if (inactiveTab) {
        inactiveTab.classList.add('hidden');
        console.log('Hidden inactive tab');
    }
    
    // Remove active styles from all buttons
    if (activeTabBtn) {
        activeTabBtn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
        const activeSpan = activeTabBtn.querySelector('span');
        if (activeSpan) {
            activeSpan.classList.remove('text-primary');
            activeSpan.classList.add('text-neutral-500');
        }
        console.log('Reset active button styles');
    }
    
    if (inactiveTabBtn) {
        inactiveTabBtn.classList.remove('bg-white', 'text-primary', 'font-semibold', 'shadow');
        const inactiveSpan = inactiveTabBtn.querySelector('span');
        if (inactiveSpan) {
            inactiveSpan.classList.remove('text-primary');
            inactiveSpan.classList.add('text-neutral-500');
        }
        console.log('Reset inactive button styles');
    }
    
    // Show selected tab and update button styles
    if (tabIndex === 0) {
        // Show active employees tab
        if (activeTab) {
            activeTab.classList.remove('hidden');
            console.log('Active tab now visible, classes:', activeTab.className);
        }
        if (activeTabBtn) {
            activeTabBtn.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
            const span = activeTabBtn.querySelector('span');
            if (span) {
                span.classList.add('text-primary');
                span.classList.remove('text-neutral-500');
            }
            console.log('Updated active button styles');
        }
    } else if (tabIndex === 1) {
        // Show inactive employees tab
        if (inactiveTab) {
            inactiveTab.classList.remove('hidden');
            console.log('Inactive tab now visible, classes:', inactiveTab.className);
        }
        if (inactiveTabBtn) {
            inactiveTabBtn.classList.add('bg-white', 'text-primary', 'font-semibold', 'shadow');
            const span = inactiveTabBtn.querySelector('span');
            if (span) {
                span.classList.add('text-primary');
                span.classList.remove('text-neutral-500');
            }
            console.log('Updated inactive button styles');
        }
    }
    
    console.log('Tab switch completed');
}

function createEmployeeCard(employee) {
    const card = document.createElement('a');
    card.href = `employee-view.html?id=${employee._id}`;
    
    // Get first letter of firstname for avatar
    const firstLetter = employee.firstname ? employee.firstname.charAt(0).toUpperCase() : '?';
    
    // Get role name
    const roleName = employee.role && employee.role.length > 0 ? employee.role[0].name : 'No Role';

    card.innerHTML = `
        <div class="bg-white rounded-3xl shadow-md flex flex-col gap-5 font-inter p-5 items-center group
            hover:shadow-lg 
            transition-all duration-300 ease-in-out">
            
            <div class="w-32 h-32 bg-primary text-white rounded-full flex items-center justify-center text-4xl font-semibold font-manrope uppercase">
                ${employee.pfplink ? 
                    `<img src="${employee.pfplink}" alt="Profile" class="w-full h-full rounded-full object-cover">` : 
                    firstLetter
                }
            </div>
            
            <!-- Content -->
            <div class="flex flex-col justify-center gap-2 text-neutral-500 items-center">
                <p class="text-base font-bold font-manrope text-primary-text 
                    transition-all duration-300 ease-in-out
                    group-hover:text-primary">
                    ${formatEmployeeName(employee)}
                </p>
                <div class="flex items-center gap-2">
                    <svg class="w-4 stroke-neutral-500" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.4546 2.33325H4.45463C2.98187 2.33325 1.78796 3.52716 1.78796 4.99992V10.9999C1.78796 12.4727 2.98187 13.6666 4.45463 13.6666H11.4546C12.9274 13.6666 14.1213 12.4727 14.1213 10.9999V4.99992C14.1213 3.52716 12.9274 2.33325 11.4546 2.33325Z" stroke-width="1.5"/>
                        <path d="M1.81934 5.05981L6.62267 7.81315C7.02519 8.04672 7.48229 8.16974 7.94767 8.16974C8.41305 8.16974 8.87015 8.04672 9.27267 7.81315L14.0893 5.05981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="text-xs">${employee.email}</p>
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 stroke-neutral-500" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 9.25C9.79493 9.25 11.25 7.79493 11.25 6C11.25 4.20507 9.79493 2.75 8 2.75C6.20507 2.75 4.75 4.20507 4.75 6C4.75 7.79493 6.20507 9.25 8 9.25Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2.75 14.25C2.75 11.75 4.75 9.25 8 9.25C11.25 9.25 13.25 11.75 13.25 14.25" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="text-xs">${roleName}</p>
                </div>
                <div class="flex items-center gap-2">
                    <svg class="w-4 stroke-neutral-500" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 1.33337C11.682 1.33337 14.6667 4.31804 14.6667 8.00004C14.6667 11.682 11.682 14.6667 8 14.6667C4.318 14.6667 1.33334 11.682 1.33334 8.00004C1.33334 4.31804 4.318 1.33337 8 1.33337ZM8 2.66671C6.58551 2.66671 5.22896 3.22861 4.22877 4.2288C3.22857 5.229 2.66667 6.58555 2.66667 8.00004C2.66667 9.41453 3.22857 10.7711 4.22877 11.7713C5.22896 12.7715 6.58551 13.3334 8 13.3334C9.41449 13.3334 10.771 12.7715 11.7712 11.7713C12.7714 10.7711 13.3333 9.41453 13.3333 8.00004C13.3333 6.58555 12.7714 5.229 11.7712 4.2288C10.771 3.22861 9.41449 2.66671 8 2.66671ZM8 10.6667C8.17681 10.6667 8.34638 10.7369 8.47141 10.862C8.59643 10.987 8.66667 11.1566 8.66667 11.3334C8.66667 11.5102 8.59643 11.6798 8.47141 11.8048C8.34638 11.9298 8.17681 12 8 12C7.82319 12 7.65362 11.9298 7.5286 11.8048C7.40357 11.6798 7.33334 11.5102 7.33334 11.3334C7.33334 11.1566 7.40357 10.987 7.5286 10.862C7.65362 10.7369 7.82319 10.6667 8 10.6667ZM8 4.33337C8.56152 4.33339 9.10551 4.52894 9.53852 4.88644C9.97154 5.24394 10.2665 5.74106 10.3729 6.29243C10.4792 6.84379 10.3902 7.41497 10.1212 7.90785C9.85217 8.40073 9.41991 8.78455 8.89867 8.99337C8.82146 9.02176 8.75187 9.06762 8.69534 9.12737C8.666 9.16071 8.66134 9.20337 8.662 9.24737L8.66667 9.33337C8.66648 9.50329 8.60142 9.66673 8.48477 9.79029C8.36812 9.91384 8.2087 9.9882 8.03907 9.99816C7.86945 10.0081 7.70242 9.95292 7.57211 9.84386C7.44181 9.7348 7.35807 9.5801 7.338 9.41137L7.33334 9.33337V9.16671C7.33334 8.39804 7.95334 7.93671 8.40267 7.75604C8.58555 7.68301 8.74507 7.56155 8.86413 7.4047C8.98318 7.24784 9.05725 7.06152 9.0784 6.86575C9.09955 6.66997 9.06696 6.47213 8.98415 6.29347C8.90134 6.11481 8.77143 5.96208 8.60836 5.85169C8.4453 5.7413 8.25524 5.67741 8.05861 5.66689C7.86197 5.65636 7.66618 5.6996 7.49227 5.79195C7.31835 5.88431 7.17287 6.0223 7.07147 6.19109C6.97006 6.35989 6.91654 6.55312 6.91667 6.75004C6.91667 6.92685 6.84643 7.09642 6.72141 7.22145C6.59638 7.34647 6.42681 7.41671 6.25 7.41671C6.07319 7.41671 5.90362 7.34647 5.7786 7.22145C5.65357 7.09642 5.58334 6.92685 5.58334 6.75004C5.58334 6.1091 5.83795 5.49441 6.29116 5.0412C6.74437 4.58799 7.35906 4.33337 8 4.33337Z"/>
                    </svg>
                    <p class="text-xs">${employee.status}</p>
                </div>
            </div>
        </div>
    `;

    return card;
}

// Function to format employee name as "First Name Middle Initial and First Letter of their Surname"
function formatEmployeeName(employee) {
    const firstName = employee.firstname || '';
    const middleInitial = employee.minitial || '';
    const lastName = employee.lastname || '';
    
    // Get first letter of surname
    const surnameFirstLetter = lastName.charAt(0) || '';
    
    // Format: "First Name Middle Initial. and First Letter of their Surname"
    if (firstName && middleInitial && surnameFirstLetter) {
        return `${firstName} ${middleInitial}. ${surnameFirstLetter}`;
    } else if (firstName && surnameFirstLetter) {
        return `${firstName} ${surnameFirstLetter}`;
    } else if (firstName) {
        return firstName;
    } else {
        return 'Unknown';
    }
}

function createEmptyState(message) {
    return `
        <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <svg class="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <h3 class="text-lg font-medium text-neutral-900 mb-2">No employees found</h3>
            <p class="text-neutral-500">${message}</p>
        </div>
    `;
}

function updateTabCounts(activeCount, inactiveCount) {
    // Update tab button text to show counts
    const activeTabBtn = document.querySelector('.tab-btn:first-child');
    const inactiveTabBtn = document.querySelector('.tab-btn:last-child');
    
    if (activeTabBtn) {
        activeTabBtn.innerHTML = `<span class="text-primary text-sm group-hover:text-primary">Active (${activeCount})</span>`;
    }
    
    if (inactiveTabBtn) {
        inactiveTabBtn.innerHTML = `<span class="text-neutral-500 text-sm group-hover:text-primary">Inactive (${inactiveCount})</span>`;
    }
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('input[placeholder="Search"]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterEmployees(e.target.value);
        });
    }

    // Add Employee button functionality - navigate to employee-add.html
    const addEmployeeBtn = document.querySelector('button[onclick*="employee-add.html"]');
    if (addEmployeeBtn) {
        // Remove the onclick attribute to prevent conflicts
        addEmployeeBtn.removeAttribute('onclick');
        
        addEmployeeBtn.addEventListener('click', () => {
            window.location.href = 'employee-add.html';
        });
    }

    // Tab button functionality
    const activeTabBtn = document.getElementById('active-employee-tab');
    const inactiveTabBtn = document.getElementById('inactive-employee-tab');
    
    if (activeTabBtn) {
        activeTabBtn.removeAttribute('onclick');
        activeTabBtn.addEventListener('click', () => showTab(0));
    }
    
    if (inactiveTabBtn) {
        inactiveTabBtn.removeAttribute('onclick');
        inactiveTabBtn.addEventListener('click', () => showTab(1));
    }
}

function filterEmployees(searchTerm) {
    // If search term is empty, show all employees
    if (!searchTerm.trim()) {
        renderEmployees();
        return;
    }

    const filteredEmployees = employees.filter(employee => {
        const fullName = `${employee.firstname} ${employee.minitial} ${employee.lastname}`.toLowerCase();
        const email = employee.email.toLowerCase();
        const role = employee.role && employee.role.length > 0 ? employee.role[0].name.toLowerCase() : '';
        
        return fullName.includes(searchTerm.toLowerCase()) || 
               email.includes(searchTerm.toLowerCase()) || 
               role.includes(searchTerm.toLowerCase());
    });

    renderFilteredEmployees(filteredEmployees);
}

function renderFilteredEmployees(filteredEmployees) {
    const activeTab = document.getElementById('active-tab');
    const inactiveTab = document.getElementById('inactive-tab');
    
    if (!activeTab || !inactiveTab) return;

    // Clear existing content
    activeTab.querySelector('.grid').innerHTML = '';
    inactiveTab.querySelector('.grid').innerHTML = '';

    // Separate filtered active and inactive employees
    const activeEmployees = filteredEmployees.filter(emp => emp.status === 'active');
    const inactiveEmployees = filteredEmployees.filter(emp => emp.status === 'archived');

    // Render filtered active employees
    if (activeEmployees.length > 0) {
        activeEmployees.forEach(employee => {
            const employeeCard = createEmployeeCard(employee);
            activeTab.querySelector('.grid').appendChild(employeeCard);
        });
    } else {
        activeTab.querySelector('.grid').innerHTML = createEmptyState('No active employees match your search');
    }

    // Render filtered inactive employees
    if (inactiveEmployees.length > 0) {
        inactiveEmployees.forEach(employee => {
            const employeeCard = createEmployeeCard(employee);
            inactiveTab.querySelector('.grid').appendChild(employeeCard);
        });
    } else {
        inactiveTab.querySelector('.grid').innerHTML = createEmptyState('No inactive employees match your search');
    }

    // Update tab counts
    updateTabCounts(activeEmployees.length, inactiveEmployees.length);
}

function showErrorState(message) {
    // Hide loading state
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
        loadingState.style.display = 'none';
    }

    // Show error state in the main content area
    const tabContents = document.getElementById('tab-contents');
    if (tabContents) {
        tabContents.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full">
                <div class="text-center">
                    <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <h3 class="text-lg font-medium text-neutral-900 mb-2">Something went wrong</h3>
                    <p class="text-neutral-500 mb-4">${message}</p>
                    <button onclick="retryLoad()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }
}

async function retryLoad() {
    try {
        // Show loading state
        const tabContents = document.getElementById('tab-contents');
        if (tabContents) {
            tabContents.innerHTML = `
                <div id="loading-state" class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                        <p class="text-neutral-500">Loading employees...</p>
                    </div>
                </div>
                
                <div  class="tab-content hidden " id="active-tab">
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 h-full">
                        <!-- Active employees will be populated here dynamically -->
                    </div>
                </div>
                <div  class="tab-content hidden " id="inactive-tab">
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 h-full">
                        <!-- Inactive employees will be populated here dynamically -->
                    </div>
                </div>
            `;
        }

        await fetchEmployees();
        renderEmployees();
    } catch (error) {
        console.error('Error retrying load:', error);
        showErrorState('Failed to load employees again. Please check your connection and try again.');
    }
}

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchEmployees,
        renderEmployees,
        createEmployeeCard,
        filterEmployees
    };
}
