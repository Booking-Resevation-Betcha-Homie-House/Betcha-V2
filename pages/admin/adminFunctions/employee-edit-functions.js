// Employee Edit Form Population Functions

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('id');
    
    if (employeeId) {
        populateEmployeeEditForm(employeeId);
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
});

async function populateEmployeeEditForm(employeeId) {
    console.log('Populating employee edit form for ID:', employeeId);
    
    try {
        // Fetch employee data
        const response = await fetch('https://betcha-api.onrender.com/employee/display');
        const employees = await response.json();
        
        console.log('All employees fetched:', employees);
        
        // Find the specific employee
        const employee = employees.find(emp => emp._id === employeeId);
        
        if (!employee) {
            console.error('Employee not found with ID:', employeeId);
            return;
        }
        
        console.log('Employee found:', employee);
        
        // Populate basic fields
        populateBasicFields(employee);
        
        // Populate roles
        await populateRoles(employee);
        
        // Populate assigned properties
        await populateAssignedProperties(employee);
        
    } catch (error) {
        console.error('Error fetching employee data:', error);
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

async function populateRoles(employee) {
    console.log('Populating roles for employee:', employee.roles);
    
    try {
        // First, fetch all available roles from the API
        const response = await fetch('https://betcha-api.onrender.com/roles/display');
        const rolesData = await response.json();
        const allRoles = rolesData.value || rolesData; // Handle both formats
        
        console.log('All roles fetched from API:', allRoles);
        
        // Wait for Alpine.js to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Find the Alpine.js component for roles
        const roleComponent = document.querySelector('[x-data*="roles"]');
        if (roleComponent) {
            try {
                // Get the Alpine.js data
                const alpineData = Alpine.$data(roleComponent);
                
                // Update the roles array with real data from API
                alpineData.roles = allRoles.map(role => role.name);
                alpineData.allRoles = allRoles; // Store full role data for ID lookup
                
                // Parse employee roles (could be string or array)
                let employeeRoles = [];
                if (employee.roles) {
                    if (typeof employee.roles === 'string') {
                        try {
                            // Try to parse as JSON array
                            employeeRoles = JSON.parse(employee.roles);
                        } catch (e) {
                            // If not JSON, split by comma
                            employeeRoles = employee.roles.split(',').map(role => role.trim());
                        }
                    } else if (Array.isArray(employee.roles)) {
                        employeeRoles = employee.roles;
                    }
                }
                
                console.log('Parsed employee roles:', employeeRoles);
                
                // Set the selected roles in Alpine.js
                alpineData.selected = employeeRoles.filter(role => 
                    alpineData.roles.includes(role)
                );
                
                console.log('Selected roles set to:', alpineData.selected);
                
            } catch (error) {
                console.error('Error setting roles:', error);
            }
        }
        
    } catch (error) {
        console.error('Error fetching roles from API:', error);
    }
}

async function populateAssignedProperties(employee) {
    console.log('Populating assigned properties for employee:', employee.properties);
    
    try {
        // Fetch all properties
        const response = await fetch('https://betcha-api.onrender.com/property/display');
        const allProperties = await response.json();
        
        console.log('All properties fetched:', allProperties);
        
        // Wait for Alpine.js to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Find the Alpine.js component for properties
        const propertyComponent = document.querySelector('[x-data*="properties"]');
        if (propertyComponent) {
            try {
                const alpineData = Alpine.$data(propertyComponent);
                
                // Update the properties list with real data
                alpineData.properties = allProperties.map(property => ({
                    name: property.propertyName || property.name || 'Unnamed Property',
                    address: property.address || 'No address provided',
                    id: property._id
                }));
                
                // Parse employee properties
                let employeePropertyIds = [];
                if (employee.properties) {
                    if (typeof employee.properties === 'string') {
                        try {
                            // Try to parse as JSON array
                            employeePropertyIds = JSON.parse(employee.properties);
                        } catch (e) {
                            // If not JSON, split by comma and clean up
                            employeePropertyIds = employee.properties.split(',')
                                .map(id => id.trim().replace(/^"(.*)"$/, '$1'));
                        }
                    } else if (Array.isArray(employee.properties)) {
                        employeePropertyIds = employee.properties;
                    }
                }
                
                console.log('Parsed employee property IDs:', employeePropertyIds);
                
                // Normalize property IDs (remove ObjectId wrapper if present)
                employeePropertyIds = employeePropertyIds.map(id => {
                    if (typeof id === 'object' && id.$oid) {
                        return id.$oid;
                    }
                    return String(id).trim();
                });
                
                // Find matching properties and set selected property names
                const selectedPropertyNames = [];
                employeePropertyIds.forEach(propertyId => {
                    const matchingProperty = allProperties.find(property => 
                        String(property._id) === propertyId
                    );
                    if (matchingProperty) {
                        selectedPropertyNames.push(matchingProperty.propertyName || matchingProperty.name || 'Unnamed Property');
                    }
                });
                
                console.log('Selected property names:', selectedPropertyNames);
                
                // Set the selected properties in Alpine.js
                alpineData.selected = selectedPropertyNames;
                
            } catch (error) {
                console.error('Error setting properties:', error);
            }
        }
        
    } catch (error) {
        console.error('Error fetching properties:', error);
    }
}

// Function to get form data for submission
function getFormData() {
    const formData = {};
    
    // Get basic fields
    const firstNameInput = document.querySelector('#empFName input');
    const lastNameInput = document.querySelector('#empLName input');
    const emailInput = document.querySelector('#empEmail input');
    
    console.log('Input elements found:', {
        firstNameInput: !!firstNameInput,
        lastNameInput: !!lastNameInput,
        emailInput: !!emailInput
    });
    
    if (firstNameInput) formData.firstname = firstNameInput.value.trim();
    if (lastNameInput) formData.lastname = lastNameInput.value.trim();
    if (emailInput) formData.email = emailInput.value.trim();
    
    console.log('Basic form data extracted:', {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email
    });
    
    // Get selected roles
    const roleComponent = document.querySelector('[x-data*="roles"]');
    console.log('Role component found:', !!roleComponent);
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
            formData.roleNames = alpineData.selected || []; // Keep names for debugging
            console.log('Roles extracted:', { names: formData.roleNames, ids: formData.roles });
        } catch (error) {
            console.error('Error getting roles:', error);
            formData.roles = [];
            formData.roleNames = [];
        }
    } else {
        console.warn('Role component not found');
        formData.roles = [];
        formData.roleNames = [];
    }
    
    // Get selected properties
    const propertyComponent = document.querySelector('[x-data*="properties"]');
    console.log('Property component found:', !!propertyComponent);
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
            console.log('Properties extracted:', formData.properties);
        } catch (error) {
            console.error('Error getting properties:', error);
            formData.properties = [];
        }
    } else {
        console.warn('Property component not found');
        formData.properties = [];
    }
    
    console.log('Final form data:', formData);
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
        console.log('Form data to submit:', formData);
        
        // Validate form data
        const validationErrors = validateFormData(formData);
        if (validationErrors.length > 0) {
            showError(validationErrors.join(', '));
            showLoadingState(false);
            return;
        }
        
        // Prepare data for API call
        // Based on the API response structure, let's try sending minimal required fields first
        const updateData = {
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email
        };
        
        // Add role data - the API seems to expect a comma-separated string of role IDs
        if (formData.roles && formData.roles.length > 0) {
            updateData.role = formData.roles.join(','); // Send as comma-separated string
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
        
        console.log('Update data being sent:', updateData);
        console.log('Employee ID:', employeeId);
        console.log('API URL:', `https://betcha-api.onrender.com/employee/update/${employeeId}`);
        
        // Make API call to update employee
        const response = await fetch(`https://betcha-api.onrender.com/employee/update/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Server error response:', errorData);
            throw new Error(`Failed to update employee: ${response.status} - ${errorData}`);
        }
        
        const result = await response.json();
        console.log('Employee update response:', result);
        
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
    const profilePictureInput = document.querySelector('input[type="file"]');
    
    if (!profilePictureInput || !profilePictureInput.files[0]) {
        console.log('No new profile picture selected');
        return;
    }
    
    const profilePicture = profilePictureInput.files[0];
    console.log('Updating profile picture:', profilePicture.name);
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('pfp', profilePicture);
        
        // Make API call to update profile picture
        const response = await fetch(`https://betcha-api.onrender.com/employee/update/pfp/${employeeId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to update profile picture: ${response.status} - ${errorData}`);
        }
        
        const result = await response.json();
        console.log('Profile picture update response:', result);
        
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
    console.log('Success:', message);
    
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
