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
            // Close the modal first
            const modal = document.getElementById('confirmDetailsModal');
            if (modal) {
                modal.classList.add('hidden');
            }
            
            // Then submit the update
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
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('id');
    
    if (employeeId) {
        // Redirect to employee view with the current employee ID
        window.location.href = `employee-view.html?id=${employeeId}`;
    } else {
        // Fallback to employees list if no ID is found
        window.location.href = 'employees.html';
    }
}

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
        
        // Wait for Alpine.js initialization
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Find Alpine component for roles
        const roleComponent = document.querySelector('div[x-data*="roles"]');
        
        if (!roleComponent || !window.Alpine) {
            console.error('Role component or Alpine.js not found');
            return;
        }

        const alpineData = Alpine.$data(roleComponent);
        
        // Update roles list
        alpineData.roles = allRoles.map(role => role.name);
        
        // Parse and set selected roles
        const employeeRolesList = parseDataArray(employeeRoles);
        
        const selectedRoleNames = employeeRolesList.map(roleData => {
            if (typeof roleData === 'string') {
                const roleByName = allRoles.find(r => r.name === roleData);
                const roleById = allRoles.find(r => r._id === roleData);
                return roleByName?.name || roleById?.name || roleData;
            }
            return roleData?.name || roleData;
        }).filter(name => alpineData.roles.includes(name));
        
        // Set selected roles in Alpine with proper reactivity
        alpineData.selected = [...selectedRoleNames];
        
        // Store all roles for later use in form submission
        alpineData.allRoles = allRoles;
        
    } catch (error) {
        console.error('Error populating roles:', error);
    }
}

async function populateAssignedProperties(employee) {
    try {
        // Get property data from employee
        const employeeProperties = parseEmployeeFieldData(employee, ['properties', 'assignedProperties', 'userProperties']);
        if (!employeeProperties) return;
        
        // Fetch all properties
        const response = await fetch(`${API_BASE}/property/display`);
        const allProperties = await response.json();
        
        // Wait for Alpine.js initialization
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Find Alpine component for properties
        const propertyComponent = document.querySelector('div[x-data*="properties"]');
        if (!propertyComponent || !window.Alpine) {
            console.error('Property component or Alpine.js not found');
            return;
        }

        const alpineData = Alpine.$data(propertyComponent);
        
        // Update properties list
        alpineData.properties = allProperties.map(property => ({
            name: property.propertyName || property.name || 'Unnamed Property',
            address: property.address || 'No address provided',
            id: property._id
        }));
        
        // Parse and set selected properties
        const employeePropertyIds = parseDataArray(employeeProperties);
        const selectedPropertyNames = [];
        
        employeePropertyIds.forEach(propertyId => {
            // Try multiple matching strategies
            let matchingProperty = allProperties.find(p => String(p._id) === String(propertyId)) ||
                                 allProperties.find(p => (p.propertyName || p.name) === String(propertyId)) ||
                                 allProperties.find(p => {
                                     const propName = p.propertyName || p.name || '';
                                     return propName.toLowerCase().includes(String(propertyId).toLowerCase()) ||
                                            String(propertyId).toLowerCase().includes(propName.toLowerCase());
                                 });
            
            if (matchingProperty) {
                selectedPropertyNames.push(matchingProperty.propertyName || matchingProperty.name || 'Unnamed Property');
            }
        });
        
        // Set selected properties in Alpine with proper reactivity
        alpineData.selected = [...selectedPropertyNames];
        
    } catch (error) {
        console.error('Error populating properties:', error);
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
            // Get role IDs instead of role names
            const roleIds = [];
            if (alpineData.selected && alpineData.allRoles) {
                alpineData.selected.forEach(roleName => {
                    const role = alpineData.allRoles.find(r => r.name === roleName);
                    if (role) {
                        roleIds.push(role._id);
                    }
                });
            }
            formData.roles = roleIds;
        } catch (error) {
            console.error('Error getting roles:', error);
            formData.roles = [];
        }
    } else {
        formData.roles = [];
    }
    
    // Get selected properties
    const propertyComponent = document.querySelector('[x-data*="properties"]');
    if (propertyComponent) {
        try {
            const alpineData = Alpine.$data(propertyComponent);
            // Convert property names back to IDs
            const propertyIds = [];
            if (alpineData.selected && alpineData.properties) {
                alpineData.selected.forEach(propertyName => {
                    const property = alpineData.properties.find(p => p.name === propertyName);
                    if (property) {
                        propertyIds.push(property.id);
                    }
                });
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
            updateData.role = formData.roles; // Send as array of IDs
        }
        
        // Add properties if any are selected - the API expects comma-separated string
        if (formData.properties && formData.properties.length > 0) {
            updateData.properties = formData.properties.join(','); // Send as comma-separated string
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
        
        // Handle profile picture update if a new one was selected
        await handleProfilePictureUpdate(employeeId);
        
        // Show success message
        showSuccess('Employee updated successfully!');
        
        // Optionally redirect back to employee view or list
        setTimeout(() => {
            window.location.href = `employee-view.html?id=${employeeId}`;
        }, 2000);
        
    } catch (error) {
        console.error('Error updating employee:', error);
        showError(`Failed to update employee: ${error.message}`);
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
        
    } catch (error) {
        console.error('Error updating profile picture:', error);
        showError(`Failed to update profile picture: ${error.message}`);
        throw error; // Re-throw to be caught by main function
    }
}

// Function to show loading state
function showLoadingState(isLoading) {
    const submitBtn = document.getElementById('confirmUpdateBtn');
    
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
