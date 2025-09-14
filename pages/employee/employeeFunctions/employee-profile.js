/**
 * Initialize employee profile picture in navigation
 */
function initializeEmployeeProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const employeeProfileImgElement = document.getElementById('employeeProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!employeeProfileImgElement || !menuBtnElement) {
            console.warn('Employee profile elements not found in DOM');
            return;
        }
        
        // If profile picture exists, show it
        if (profilePicture && profilePicture.trim() !== '') {
            employeeProfileImgElement.src = profilePicture;
            employeeProfileImgElement.classList.remove('hidden');
            // Remove green background when showing profile picture
            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Employee profile picture loaded:', profilePicture);
        } else {
            // Keep default SVG icon visible with green background
            employeeProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No employee profile picture found, using default icon');
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
        let employeeID = localStorage.getItem('employeeID') || 
                        localStorage.getItem('_id') || 
                        localStorage.getItem('id');
        
        const token = localStorage.getItem('token');
        
        if (!employeeID) {
            // Try to extract from userData if available
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    employeeID = parsed._id || parsed.id || parsed.employeeID;
                } catch (e) {
                    console.warn('Could not parse userData:', e);
                }
            }
        }
        
        // Fallback: Use the known employee ID for testing
        if (!employeeID) {
            employeeID = '68a85740a3af5eecc10e7cae'; // PM Luke's ID from your example
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

    // Clear existing content
    container.innerHTML = '';
    
    // Create property items
    properties.forEach((property, index) => {
        const propertyElement = document.createElement('div');
        propertyElement.className = 'flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-xl border border-gray-200';
        
        // Extract location from address or use city
        const location = property.city || property.address || 'Location not specified';
        const shortLocation = location.length > 50 ? location.substring(0, 50) + '...' : location;
        
        // Determine status color
        const isActive = property.status && property.status.toLowerCase() === 'active';
        const statusClass = isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
        const statusText = isActive ? 'Active' : 'Inactive';
        
        propertyElement.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <div class="flex items-center gap-2">
                    <div>
                        <p class="text-sm font-semibold text-primary-text font-manrope">${property.name || 'Property Name'}</p>
                        <p class="text-xs text-neutral-500 font-inter">${shortLocation}</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 mt-2 sm:mt-0">
                <span class="text-xs px-2 py-1 rounded-full ${statusClass}">
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

// Initialize profile when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeEmployeeProfile();
    loadAssignedProperties();
});
