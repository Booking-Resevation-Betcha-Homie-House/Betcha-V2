/**
 * Initialize employee profile picture in navigation
 * Sets the profile picture as background image on the menuBtn div
 */
function initializeEmployeeProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!menuBtnElement) {
            console.warn('Menu button element not found in DOM');
            return;
        }
        
        // Always hide the img element since we're using background-image
        const imgElement = document.getElementById('employeeProfileImg');
        if (imgElement) {
            imgElement.style.display = 'none';
        }
        
        // If profile picture exists, show it as background on menuBtn
        if (profilePicture && profilePicture.trim() !== '') {
            // Set profile picture as background image on the menuBtn
            menuBtnElement.style.backgroundImage = `url('${profilePicture}')`;
            menuBtnElement.style.backgroundSize = 'cover';
            menuBtnElement.style.backgroundPosition = 'center';
            menuBtnElement.style.backgroundRepeat = 'no-repeat';
            
            // Remove green background
            menuBtnElement.classList.remove('bg-primary');
            
            // Hide the SVG icon when profile picture is shown
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.style.display = 'none';
            }
            
            console.log('Employee profile picture loaded as background:', profilePicture);
        } else {
            // No profile picture - keep default SVG icon with green background
            menuBtnElement.style.backgroundImage = '';
            menuBtnElement.classList.add('bg-primary');
            
            // Show the SVG icon
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.style.display = '';
            }
            
            console.log('No employee profile picture, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing employee profile:', error);
    }
}

/**
 * Fetch and display assigned properties for the employee
 */
async function loadAssignedProperties() {
    try {
        // Try to get employee ID from multiple sources
        let employeeID = localStorage.getItem('userId') || 
                        localStorage.getItem('employeeID') || 
                        localStorage.getItem('_id') || 
                        localStorage.getItem('id');
        
        const token = localStorage.getItem('token');
        
        if (!employeeID) {
            // Try to extract from userData if available
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    employeeID = parsed._id || parsed.id || parsed.employeeID || parsed.userId;
                } catch (e) {
                    console.warn('Could not parse userData:', e);
                }
            }
        }
        
        if (!employeeID) {
            console.warn('Employee ID not found in localStorage');
            displayNoProperties();
            return;
        }

        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`https://betcha-api.onrender.com/employee/display/${employeeID}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            console.warn('Failed to fetch employee data:', response.status, response.statusText);
            displayNoProperties();
            return;
        }

        const employeeData = await response.json();
        const properties = employeeData.properties || [];
        
        if (properties.length > 0) {
            displayAssignedProperties(properties);
            
            // Trigger PM functions to reload now that properties are available
            if (typeof window.loadTodaysCheckins === 'function') {
                console.log('🔄 Triggering PM functions reload after properties loaded');
                setTimeout(() => {
                    window.loadTodaysCheckins();
                }, 100);
            }
            
            // Trigger calendar overview reload if on PM page
            if (document.querySelector('.calendar-instance') && typeof window.fetchPMCalendarOverview === 'function') {
                setTimeout(() => {
                    window.fetchPMCalendarOverview();
                }, 200);
            }
        } else {
            displayNoProperties();
        }
        
    } catch (error) {
        console.error('Error loading assigned properties:', error);
        displayNoProperties();
    }
}

/**
 * Display assigned properties in the UI
 */
function displayAssignedProperties(properties) {
    const container = document.getElementById('assignedPropertiesContainer');
    
    if (!container) {
        console.warn('Assigned properties container not found');
        return;
    }

    if (!properties || properties.length === 0) {
        displayNoProperties();
        return;
    }

    // Save properties to localStorage for use by other functions (PM, TS, etc.)
    try {
        const propertyIds = properties.map(property => property._id || property.id).filter(id => id);
        localStorage.setItem('properties', JSON.stringify(propertyIds));
        console.log('✅ Properties saved to localStorage:', propertyIds);
    } catch (error) {
        console.error('❌ Error saving properties to localStorage:', error);
    }

    // Clear existing content
    container.innerHTML = '';
    
    // Create property items
    properties.forEach((property) => {
        const propertyElement = document.createElement('div');
        propertyElement.className = 'flex flex-row items-center justify-between p-4 bg-neutral-100 rounded-xl border border-neutral-200 w-full gap-4';
        
        // Extract location from address or use city
        const location = property.city || property.address || 'Location not specified';
        const shortLocation = location.length > 50 ? location.substring(0, 50) + '...' : location;
        
        // Determine status color
        const isActive = property.status && property.status.toLowerCase() === 'active';
        const statusClass = isActive ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-600';
        const statusText = isActive ? 'Active' : 'Inactive';
        
        propertyElement.innerHTML = `
            <div class="flex-1 min-w-0">
                <p class="text-base font-semibold text-primary-text font-manrope truncate">${property.name || 'Property Name'}</p>
                <p class="text-sm text-neutral-500 font-inter truncate">${shortLocation}</p>
            </div>
            <div class="flex-shrink-0">
                <span class="text-xs px-3 py-1 rounded-full ${statusClass} font-medium">
                    ${statusText}
                </span>
            </div>
        `;
        
        container.appendChild(propertyElement);
    });
}

/**
 * Display message when no properties are assigned
 */
function displayNoProperties() {
    const container = document.getElementById('assignedPropertiesContainer');
    
    if (!container) {
        console.warn('Assigned properties container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-6 text-center">
            <svg class="w-12 h-12 fill-neutral-300 mb-3" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
            </svg>
            <p class="text-sm text-neutral-400 font-manrope">No properties assigned</p>
            <p class="text-xs text-neutral-400 font-inter mt-1">Contact your administrator for property assignments</p>
        </div>
    `;
}

/**
 * Fetch and display employee privileges from roleId
 */
async function loadEmployeePrivileges() {
    try {
        const roleId = localStorage.getItem('roleID') || localStorage.getItem('roleId');
        
        if (!roleId) {
            console.warn('Role ID not found in localStorage');
            return;
        }

        const response = await fetch(`https://betcha-api.onrender.com/roles/display/${roleId}`);
        
        if (!response.ok) {
            console.warn('Failed to fetch role privileges:', response.status);
            return;
        }

        const roleData = await response.json();
        
        if (roleData && roleData.privileges && Array.isArray(roleData.privileges)) {
            // Update the privileges display
            const privilegeElements = document.querySelectorAll('.text-base.font-medium.text-primary-text.font-manrope');
            
            // Find the privileges element (it's the third one after email and role)
            if (privilegeElements[2]) {
                const privilegesText = roleData.privileges.join(', ');
                privilegeElements[2].textContent = privilegesText;
                console.log('Privileges loaded from API:', privilegesText);
                
                // Also store in localStorage for future use
                localStorage.setItem('privileges', JSON.stringify(roleData.privileges));
            }
        }
        
    } catch (error) {
        console.error('Error loading employee privileges:', error);
    }
}

// Initialize profile when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeEmployeeProfile();
    loadAssignedProperties();
    loadEmployeePrivileges();
});
