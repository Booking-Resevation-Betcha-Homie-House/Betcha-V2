// API Base URL
const API_BASE = 'https://betcha-api.onrender.com';

// Employee Edit Form Population Functions
// Add the password and confirm password field?
// Utility function to parse employee field data
function parseEmployeeFieldData(employee, fieldNames, defaultValue = null) {
    for (const field of fieldNames) {
        if (employee[field] !== undefined) {
            return employee[field];
        }
    }
    return defaultValue;
}

// Utility function to parse JSON or array data
function parseDataArray(data) {
    if (!data) return [];
    
    if (Array.isArray(data)) {
        // Handle array that might contain JSON strings
        const result = [];
        data.forEach(item => {
            if (typeof item === 'string' && (item.startsWith('[') || item.startsWith('{'))) {
                try {
                    const parsed = JSON.parse(item);
                    if (Array.isArray(parsed)) {
                        result.push(...parsed);
                    } else {
                        result.push(parsed);
                    }
                } catch (e) {
                    result.push(item);
                }
            } else {
                result.push(item);
            }
        });
        return result;
    }
    
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data.split(',').map(item => item.trim());
        }
    }
    
    return [data];
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('id');
    
    if (employeeId) {
        // Wait for Alpine.js to be fully initialized
        waitForAlpineAndPopulate(employeeId);
    } else {
        console.error('No employee ID provided in URL');
    }
    
    // Add event listener for the confirm update button
    const confirmUpdateBtn = document.getElementById('confirmUpdateBtn');
    if (confirmUpdateBtn) {
        confirmUpdateBtn.addEventListener('click', function() {
            // Show loading state immediately
            showLoadingState(true);
            
            // Submit the update (modal will close automatically on success)
            submitEmployeeUpdate();
        });
    }
    
    // Add event listener for save button to show the modal
    const saveBtn = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const modal = document.getElementById('confirmDetailsModal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        });
    }
    
    // Add event listeners for modal close buttons
    const closeModalBtns = document.querySelectorAll('[data-close-modal]');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.classList.add('hidden');
            });
        });
    });

    // Attach live preview for profile picture inputs
    const pfpInputs = document.querySelectorAll('.pfp-input');
    pfpInputs.forEach(input => {
        input.addEventListener('change', function(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type.toLowerCase())) {
                import('/src/toastNotification.js').then(module => {
                    module.showToastError(
                        'Please select a valid image file (JPG, PNG, GIF, JPEG, or WEBP).',
                        'Invalid File Type'
                    );
                });
                event.target.value = ''; // Clear the input
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                import('/src/toastNotification.js').then(module => {
                    module.showToastError(
                        'Image size should be less than 5MB.',
                        'File Too Large'
                    );
                });
                event.target.value = ''; // Clear the input
                return;
            }

            // File is valid, proceed with preview
            const avatarElement = document.getElementById('employee-avatar');
            if (!avatarElement) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                avatarElement.innerHTML = `<img src="${e.target.result}" alt="Profile Picture" class="w-full h-full rounded-full object-cover">`;
            };
            reader.readAsDataURL(file);
        });
    });
});

// Function to handle discarding changes and returning to employee view
function discardChanges() {
    console.log('🔄 discardChanges() function called');
    
    const urlParams = new URLSearchParams(window.location.search);
    console.log('📍 Current URL:', window.location.href);
    console.log('🔍 URL Parameters:', urlParams.toString());
    
    const employeeId = urlParams.get('id');
    console.log('👤 Employee ID found:', employeeId);
    
    if (employeeId) {
        const targetUrl = `employee-view.html?id=${employeeId}`;
        console.log('✅ Redirecting to employee view:', targetUrl);
        // Redirect to employee view with the current employee ID
        window.location.href = targetUrl;
    } else {
        const fallbackUrl = 'employees.html';
        console.log('⚠️ No employee ID found, redirecting to employees list:', fallbackUrl);
        // Fallback to employees list if no ID is found
        window.location.href = fallbackUrl;
    }
}

// Make discardChanges globally available
window.discardChanges = discardChanges;

// Function to wait for Alpine.js and then populate the form
function waitForAlpineAndPopulate(employeeId) {
    const maxAttempts = 50; // 5 seconds max wait
    let attempts = 0;
    
    function checkAlpine() {
        attempts++;
        
        if (window.Alpine && window.Alpine.$data) {
            populateEmployeeEditForm(employeeId);
        } else if (attempts < maxAttempts) {
            setTimeout(checkAlpine, 100);
        } else {
            console.error('Alpine.js failed to initialize after 5 seconds');
            showError('Failed to initialize form components. Please refresh the page.');
        }
    }
    
    checkAlpine();
}

async function populateEmployeeEditForm(employeeId) {
    try {
        // Fetch employee data
        const response = await fetch(`${API_BASE}/employee/display`);
        const employees = await response.json();
        
        // Find the specific employee
        const employee = employees.find(emp => emp._id === employeeId);
        
        if (!employee) {
            console.error('Employee not found with ID:', employeeId);
            return;
        }

        // Populate form sections
        populateBasicFields(employee);
        setInitialAvatar(employee);
        await populateRoles(employee);
        await populateAssignedProperties(employee);
        
    } catch (error) {
        console.error('Error loading employee data:', error);
        showErrorMessage('Failed to load employee data. Please try again.');
    }
}

function populateBasicFields(employee) {
    // Populate first name
    const firstNameInput = document.querySelector('#empFName input');
    if (firstNameInput && employee.firstname) {
        firstNameInput.value = employee.firstname;
    }
    
    // Populate last name
    const lastNameInput = document.querySelector('#empLName input');
    if (lastNameInput && employee.lastname) {
        lastNameInput.value = employee.lastname;
    }
    
    // Populate email
    const emailInput = document.querySelector('#empEmail input');
    if (emailInput && employee.email) {
        emailInput.value = employee.email;
    }
}

// Initialize the avatar with existing profile picture or initials
function setInitialAvatar(employee) {
    const avatarElement = document.getElementById('employee-avatar');
    if (!avatarElement) return;
    if (employee.pfplink) {
        avatarElement.innerHTML = `<img src="${employee.pfplink}" alt="Profile Picture" class="w-full h-full rounded-full object-cover">`;
    } else {
        const firstLetter = employee.firstname ? employee.firstname.charAt(0).toUpperCase() : '?';
        avatarElement.textContent = firstLetter;
    }
}

async function populateRoles(employee) {
    try {
        // Get role data from employee
        const employeeRoles = parseEmployeeFieldData(employee, ['roles', 'role', 'userRoles', 'assignedRoles']);
        
        if (!employeeRoles) {
            return;
        }
        
        // Fetch all available roles
        const response = await fetch(`${API_BASE}/roles/display`);
        const rolesData = await response.json();
        const allRoles = rolesData.value || rolesData;
        
        // Filter to only show ACTIVE roles
        const activeRoles = allRoles.filter(role => role.active === true);
        
        // Wait for Alpine.js initialization
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Find Alpine component for roles
        const roleComponent = document.querySelector('div[x-data*="roles"]');
        
        if (!roleComponent || !window.Alpine) {
            console.error('Role component or Alpine.js not found');
            return;
        }

        const alpineData = Alpine.$data(roleComponent);
        
        // Update roles list with ONLY active roles
        alpineData.roles = activeRoles.map(role => role.name);
        
        // Parse and set selected roles
        const employeeRolesList = parseDataArray(employeeRoles);
        
        const selectedRoleNames = employeeRolesList.map(roleData => {
            if (typeof roleData === 'string') {
                const roleByName = allRoles.find(r => r.name === roleData);
                const roleById = allRoles.find(r => r._id === roleData);
                return roleByName?.name || roleById?.name || roleData;
            }
            return roleData?.name || roleData;
        }).filter(name => name); // Keep all existing selections, even if role is now inactive
        
        // Set selected roles in Alpine with proper reactivity
        alpineData.selected = [...selectedRoleNames];
        
        // Store all roles (including inactive) for form submission - needed for existing selections
        alpineData.allRoles = allRoles;
        // Store active roles for new selections
        alpineData.activeRoles = activeRoles;
        
    } catch (error) {
        console.error('Error populating roles:', error);
    }
}

async function populateAssignedProperties(employee) {
    try {
        // Find Alpine component for properties and set loading state
        const propertyComponent = document.querySelector('div[x-data*="properties"]');
        if (!propertyComponent || !window.Alpine) {
            console.error('Property component or Alpine.js not found');
            return;
        }

        const alpineData = Alpine.$data(propertyComponent);
        
        // Keep the component in a safe loading state
        alpineData.isLoading = true;
        alpineData.properties = [];
        alpineData.selected = [];

        // Get property data from employee
        const employeeProperties = parseEmployeeFieldData(employee, ['properties', 'assignedProperties', 'userProperties']);
        if (!employeeProperties) {
            // Use a delay to ensure Alpine rendering is complete before turning off loading
            setTimeout(() => {
                alpineData.isLoading = false;
            }, 100);
            return;
        }
        
        // Fetch all properties
        const response = await fetch(`${API_BASE}/property/display`);
        const allProperties = await response.json();
        
        // Wait a bit to ensure smooth loading animation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Prepare ALL data completely before any Alpine updates
        const propertiesData = [];
        const employeePropertyData = parseDataArray(employeeProperties);
        const selectedPropertyIds = [];
        
        // Build properties data
        for (let i = 0; i < allProperties.length; i++) {
            const property = allProperties[i];
            propertiesData.push({
                name: property.propertyName || property.name || 'Unnamed Property',
                address: property.address || 'No address provided',
                id: property._id
            });
        }
        
        // Build selected properties data
        employeePropertyData.forEach(propertyItem => {
            let propertyId = null;
            
            if (typeof propertyItem === 'object' && propertyItem._id) {
                propertyId = propertyItem._id;
            } else {
                // Handle case where property is just an ID or find by name
                const matchingProperty = allProperties.find(p => String(p._id) === String(propertyItem)) ||
                                      allProperties.find(p => (p.propertyName || p.name) === String(propertyItem));
                if (matchingProperty) {
                    propertyId = matchingProperty._id;
                }
            }
            
            if (propertyId) {
                selectedPropertyIds.push(propertyId);
            }
        });
        
        // IMPORTANT: Keep loading state TRUE until we're completely done
        // This prevents the invalid Alpine template from rendering
        
        // Update properties first with empty arrays to ensure clean state
        alpineData.properties = [];
        alpineData.selected = [];
        
        // Wait for Alpine to process the empty state
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Now safely update with real data
        alpineData.properties = propertiesData;
        alpineData.selected = selectedPropertyIds;
        
        // Finally, turn off loading state after ensuring data is stable
        await new Promise(resolve => setTimeout(resolve, 100));
        alpineData.isLoading = false;
        
    } catch (error) {
        console.error('Error populating properties:', error);
        // Make sure to turn off loading state even if there's an error
        if (alpineData) {
            setTimeout(() => {
                alpineData.isLoading = false;
            }, 100);
        }
    }
}

// Function to get form data for submission
function getFormData() {
    const formData = {};
    
    // Get basic fields
    const firstNameInput = document.querySelector('#empFName input');
    const lastNameInput = document.querySelector('#empLName input');
    const emailInput = document.querySelector('#empEmail input');
    
    if (firstNameInput) formData.firstname = firstNameInput.value.trim();
    if (lastNameInput) formData.lastname = lastNameInput.value.trim();
    if (emailInput) formData.email = emailInput.value.trim();
    
    // Get selected roles
    const roleComponent = document.querySelector('[x-data*="roles"]');
    if (roleComponent) {
        try {
            const alpineData = Alpine.$data(roleComponent);
            console.log('🔍 Role Alpine Data:', {
                selected: alpineData.selected,
                allRoles: alpineData.allRoles,
                hasAllRoles: !!alpineData.allRoles,
                allRolesLength: alpineData.allRoles?.length
            });
            
            // Get role IDs instead of role names
            const roleIds = [];
            if (alpineData.selected && alpineData.allRoles) {
                alpineData.selected.forEach(roleName => {
                    const role = alpineData.allRoles.find(r => r.name === roleName);
                    console.log(`🔎 Looking for role: "${roleName}"`, role ? `Found: ${role._id}` : 'NOT FOUND');
                    if (role && role._id) {
                        roleIds.push(role._id);
                    }
                });
            }
            console.log('✅ Extracted role IDs:', roleIds);
            formData.roles = roleIds;
        } catch (error) {
            console.error('❌ Error getting roles:', error);
            formData.roles = [];
        }
    } else {
        console.warn('⚠️ Role component not found');
        formData.roles = [];
    }
    
    // Get selected properties
    const propertyComponent = document.querySelector('[x-data*="properties"]');
    if (propertyComponent) {
        try {
            const alpineData = Alpine.$data(propertyComponent);
            // The selected array should already contain property IDs
            const propertyIds = [];
            if (alpineData.selected && Array.isArray(alpineData.selected)) {
                // If selected contains property IDs directly, use them
                if (alpineData.selected.every(item => typeof item === 'string' && item.length === 24)) {
                    propertyIds.push(...alpineData.selected);
                } else if (alpineData.properties) {
                    // Otherwise, convert property names to IDs
                    alpineData.selected.forEach(propertyIdentifier => {
                        const property = alpineData.properties.find(p => 
                            p.name === propertyIdentifier || p.id === propertyIdentifier
                        );
                        if (property && property.id) {
                            propertyIds.push(property.id);
                        }
                    });
                }
            }
            formData.properties = propertyIds;
        } catch (error) {
            console.error('Error getting properties:', error);
            formData.properties = [];
        }
    } else {
        formData.properties = [];
    }
    
    return formData;
}

// Function to validate form data
function validateFormData(formData) {
    const errors = [];
    
    if (!formData.firstname || formData.firstname.length === 0) {
        errors.push('First name is required');
    }
    
    if (!formData.lastname || formData.lastname.length === 0) {
        errors.push('Last name is required');
    }
    
    if (!formData.email || formData.email.length === 0) {
        errors.push('Email address is required');
    } else {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            errors.push('Please enter a valid email address');
        }
    }
    
    if (!formData.roles || formData.roles.length === 0) {
        errors.push('At least one role must be selected');
    }
    
    return errors;
}

// Function to handle form submission
async function submitEmployeeUpdate() {
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('id');
    
    if (!employeeId) {
        console.error('No employee ID for update');
        showError('No employee ID found. Cannot update employee.');
        return;
    }
    
    try {
        // Show loading state
        showLoadingState(true);
        
        const formData = getFormData();
        
        // Validate form data
        const validationErrors = validateFormData(formData);
        if (validationErrors.length > 0) {
            showError(validationErrors.join(', '));
            showLoadingState(false);
            return;
        }
        
        // Prepare data for API call
        const updateData = {
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email
        };
        
        // Add role data - send as array of role IDs
        if (formData.roles && formData.roles.length > 0) {
            // Ensure role IDs are strings and properly formatted
            updateData.role = formData.roles.filter(id => id && typeof id === 'string');
            console.log('📋 Role IDs being sent:', updateData.role);
        } else {
            // If no roles selected, send empty array
            updateData.role = [];
            console.warn('⚠️ No roles selected');
        }
        
        // Add properties if any are selected - send as array of property IDs
        if (formData.properties && formData.properties.length > 0) {
            updateData.properties = formData.properties; // Send as array of IDs
        }
        
        // Additional validation to prevent 500 errors
        if (!updateData.firstname || updateData.firstname.trim() === '') {
            throw new Error('First name cannot be empty');
        }
        if (!updateData.lastname || updateData.lastname.trim() === '') {
            throw new Error('Last name cannot be empty');
        }
        if (!updateData.email || updateData.email.trim() === '') {
            throw new Error('Email cannot be empty');
        }
        
        // Validate role is an array
        if (!Array.isArray(updateData.role)) {
            throw new Error('Role must be an array');
        }
        
        // Debug: Log the complete payload
        console.log('🚀 Sending employee update with payload:', JSON.stringify(updateData, null, 2));
        console.log('📦 Role field specifically:', {
            type: typeof updateData.role,
            isArray: Array.isArray(updateData.role),
            length: updateData.role?.length,
            values: updateData.role
        });
        
        // Make API call to update employee
        
        const response = await fetch(`${API_BASE}/employee/update/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Server error response:', errorData);
            throw new Error(`Failed to update employee: ${response.status} - ${errorData}`);
        }
        
        const result = await response.json();
        
        // Log employee update audit
        try {
            if (window.AuditTrailFunctions) {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const userId = localStorage.userId;
                const userType = userData.role || userData.userType || 'Admin';
                await window.AuditTrailFunctions.logEmployeeUpdate(userId, userType);
                
                // If roles were updated, log role assignment
                if (updateData.role && updateData.role.length > 0) {
                    await window.AuditTrailFunctions.logRoleAssignment(userId, userType);
                }
            }
        } catch (auditError) {
            console.error('Audit trail error:', auditError);
        }
        
        // Handle profile picture update if a new one was selected
        await handleProfilePictureUpdate(employeeId);
        
        // Close the modal after successful update
        const modal = document.getElementById('confirmDetailsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Show success message
        const toastModule = await import('/src/toastNotification.js');
        toastModule.showToastSuccess('Employee updated successfully!');
        
        // Optionally redirect back to employee view or list
        setTimeout(() => {
            window.location.href = `employee-view.html?id=${employeeId}`;
        }, 2000);
        
    } catch (error) {
        console.error('Error updating employee:', error);
        const toastModule = await import('/src/toastNotification.js');
        toastModule.showToastError(`Failed to update employee: ${error.message}`);
    } finally {
        showLoadingState(false);
    }
}

// Function to handle profile picture update
async function handleProfilePictureUpdate(employeeId) {
    const profilePictureInput = document.querySelector('.pfp-input');
    
    if (!profilePictureInput || !profilePictureInput.files[0]) {
        return;
    }
    
    const profilePicture = profilePictureInput.files[0];
    
    // Additional validation before upload
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(profilePicture.type.toLowerCase())) {
        const toastModule = await import('/src/toastNotification.js');
        toastModule.showToastError(
            'Please select a valid image file (JPG, PNG, GIF, JPEG, or WEBP).',
            'Invalid File Type'
        );
        throw new Error('Invalid file type selected');
    }

    // Validate file size (max 5MB)
    if (profilePicture.size > 5 * 1024 * 1024) {
        const toastModule = await import('/src/toastNotification.js');
        toastModule.showToastError(
            'Image size should be less than 5MB.',
            'File Too Large'
        );
        throw new Error('File size too large');
    }
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('pfp', profilePicture);
        
        // Make API call to update profile picture
        const response = await fetch(`${API_BASE}/employee/update/pfp/${employeeId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to update profile picture: ${response.status} - ${errorData}`);
        }
        
        const result = await response.json();
        
        // Show success notification for profile picture update
        const toastModule = await import('/src/toastNotification.js');
        toastModule.showToastSuccess(
            'Profile picture updated successfully!',
            'Success'
        );
        
    } catch (error) {
        console.error('Error updating profile picture:', error);
        
        // Show error notification using toast
        const toastModule = await import('/src/toastNotification.js');
        toastModule.showToastError(
            `Failed to update profile picture: ${error.message}`,
            'Upload Failed'
        );
        
        throw error; // Re-throw to be caught by main function
    }
}

// Function to show loading state
function showLoadingState(isLoading) {
    const submitBtn = document.getElementById('confirmUpdateBtn');
    const cancelBtn = document.querySelector('#confirmDetailsModal .flex.gap-5 [data-close-modal]');
    
    if (submitBtn) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="text-secondary-text text-lg">Updating...</span>
                <svg class="animate-spin w-5 h-5 ml-2 fill-secondary-text" viewBox="0 0 24 24">
                    <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
                </svg>
            `;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span class="text-secondary-text text-lg transition-transform duration-500 ease-in-out group-hover:-translate-x-1">Confirm</span>
                <span class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out">
                    <svg class="w-5 h-5 ml-2 fill-secondary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.55006 15.15L18.0251 6.675C18.2251 6.475 18.4584 6.375 18.7251 6.375C18.9917 6.375 19.2251 6.475 19.4251 6.675C19.6251 6.875 19.7251 7.11267 19.7251 7.388C19.7251 7.66333 19.6251 7.90067 19.4251 8.1L10.2501 17.3C10.0501 17.5 9.81673 17.6 9.55006 17.6C9.28339 17.6 9.05006 17.5 8.85006 17.3L4.55006 13C4.35006 12.8 4.25406 12.5627 4.26206 12.288C4.27006 12.0133 4.37439 11.7757 4.57506 11.575C4.77572 11.3743 5.01339 11.2743 5.28806 11.275C5.56272 11.2757 5.80006 11.3757 6.00006 11.575L9.55006 15.15Z"/>
                    </svg>
                </span>
            `;
        }
    }
    
    // Handle cancel button state
    if (cancelBtn) {
        if (isLoading) {
            cancelBtn.disabled = true;
            cancelBtn.style.opacity = '0.5';
            cancelBtn.style.cursor = 'not-allowed';
        } else {
            cancelBtn.disabled = false;
            cancelBtn.style.opacity = '1';
            cancelBtn.style.cursor = 'pointer';
        }
    }
}

// Function to show error messages
function showError(message) {
    console.error('Error:', message);
    
    // Try to find existing error display element
    let errorElement = document.getElementById('errorMessage');
    
    if (!errorElement) {
        // Create error element if it doesn't exist
        errorElement = document.createElement('div');
        errorElement.id = 'errorMessage';
        errorElement.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
        
        // Insert at the top of the form
        const form = document.querySelector('form');
        if (form) {
            form.insertBefore(errorElement, form.firstChild);
        }
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Function to show success messages
function showSuccess(message) {
    
    // Try to find existing success display element
    let successElement = document.getElementById('successMessage');
    
    if (!successElement) {
        // Create success element if it doesn't exist
        successElement = document.createElement('div');
        successElement.id = 'successMessage';
        successElement.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
        
        // Insert at the top of the form
        const form = document.querySelector('form');
        if (form) {
            form.insertBefore(successElement, form.firstChild);
        }
    }
    
    successElement.textContent = message;
    successElement.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}
