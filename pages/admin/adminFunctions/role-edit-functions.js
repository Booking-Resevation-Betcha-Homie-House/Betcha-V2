// Edit Role functionality for Admin panel

// Global variable to store the current role ID
let currentRoleId = null;

// Function to get role ID from sessionStorage (set from roles.html)
function getCurrentRoleId() {
    return sessionStorage.getItem('editRoleId');
}

// Function to fetch role details by ID
async function fetchRoleById(roleId) {
    try {
        const response = await fetch('/api/roles/display', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const roles = await response.json();
        const role = roles.find(r => r._id === roleId);
        
        if (!role) {
            throw new Error('Role not found');
        }

        return role;
    } catch (error) {
        console.error('Error fetching role:', error);
        throw error;
    }
}

// Function to populate form with role data
function populateForm(role) {
    // Populate role name
    const roleNameInput = document.getElementById('input-role-name');
    if (roleNameInput) {
        roleNameInput.value = role.name;
    }

    // Clear all checkboxes first
    const privilegeCheckboxes = document.querySelectorAll('input[name="privileges"]');
    privilegeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Check the privileges that the role has
    if (role.privileges && Array.isArray(role.privileges)) {
        role.privileges.forEach(privilege => {
            const checkbox = document.querySelector(`input[name="privileges"][value="${privilege}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
}

// Function to collect form data
function collectFormData() {
    // Get role name
    const roleNameInput = document.getElementById('input-role-name');
    const roleName = roleNameInput ? roleNameInput.value.trim() : '';

    // Get selected privileges
    const privilegeCheckboxes = document.querySelectorAll('input[name="privileges"]:checked');
    const privileges = Array.from(privilegeCheckboxes).map(checkbox => checkbox.value);

    return {
        name: roleName,
        privileges: privileges
    };
}

// Function to validate form data
function validateFormData(data) {
    const errors = [];

    // Validate role name
    if (!data.name || data.name.length === 0) {
        errors.push('Role name is required');
    }

    if (data.name && data.name.length < 2) {
        errors.push('Role name must be at least 2 characters long');
    }

    // Validate privileges
    if (!data.privileges || data.privileges.length === 0) {
        errors.push('At least one privilege must be selected');
    }

    return errors;
}

// Function to update role via API
async function updateRole(roleId, roleData) {
    try {
        const response = await fetch(`/api/roles/update/${roleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(roleData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating role:', error);
        throw error;
    }
}

// Function to show loading state
function showLoadingState(button) {
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
        <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            <span class="text-secondary-text">Updating...</span>
        </div>
    `;
    return originalContent;
}

// Function to restore button state
function restoreButtonState(button, originalContent) {
    button.disabled = false;
    button.innerHTML = originalContent;
}

// Function to show success message
function showSuccessMessage() {
    // You can customize this to use your existing notification system
    alert('Role updated successfully!');
}

// Function to show error message
function showErrorMessage(errors) {
    if (Array.isArray(errors)) {
        alert('Error updating role:\n' + errors.join('\n'));
    } else {
        alert('Error updating role: ' + errors);
    }
}

// Main function to handle role update
async function handleUpdateRole() {
    const confirmButton = document.getElementById('confirmEditRole');
    
    if (!confirmButton) {
        console.error('Confirm button not found');
        return;
    }

    if (!currentRoleId) {
        showErrorMessage('No role ID found. Please return to the roles page and try again.');
        return;
    }

    // Collect and validate form data
    const formData = collectFormData();
    const validationErrors = validateFormData(formData);

    if (validationErrors.length > 0) {
        showErrorMessage(validationErrors);
        return;
    }

    // Show loading state
    const originalContent = showLoadingState(confirmButton);

    try {
        // Update the role
        await updateRole(currentRoleId, formData);
        
        // Show success message
        showSuccessMessage();
        
        // Close any open modals
        const modal = document.querySelector('.modal:not(.hidden)');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Redirect to roles page after a short delay
        setTimeout(() => {
            window.location.href = 'roles.html';
        }, 1500);

    } catch (error) {
        console.error('Error in handleUpdateRole:', error);
        showErrorMessage(error.message || 'An unexpected error occurred');
    } finally {
        // Restore button state
        restoreButtonState(confirmButton, originalContent);
    }
}

// Function to load role data on page load
async function loadRoleData() {
    try {
        // Get role ID from sessionStorage
        currentRoleId = getCurrentRoleId();
        
        if (!currentRoleId) {
            showErrorMessage('No role selected for editing. Redirecting to roles page...');
            setTimeout(() => {
                window.location.href = 'roles.html';
            }, 2000);
            return;
        }

        // Fetch role data
        const role = await fetchRoleById(currentRoleId);
        
        // Populate form with role data
        populateForm(role);

    } catch (error) {
        console.error('Error loading role data:', error);
        showErrorMessage('Error loading role data: ' + (error.message || 'Unknown error'));
        
        // Optionally redirect back to roles page
        setTimeout(() => {
            window.location.href = 'roles.html';
        }, 3000);
    }
}

// Function to update modal content with form data (for preview)
function updateModalPreview() {
    const formData = collectFormData();
    
    // This function can be expanded to show a preview of the role data in the modal
    // For now, we'll just ensure the modal shows current form state
    console.log('Current form data:', formData);
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load existing role data
    loadRoleData();

    // Attach event listener to confirm button
    const confirmButton = document.getElementById('confirmEditRole');
    if (confirmButton) {
        confirmButton.addEventListener('click', handleUpdateRole);
    }

    // Attach event listener to the "Update" button to update modal preview
    const updateButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (updateButton) {
        updateButton.addEventListener('click', updateModalPreview);
    }

    // Optional: Add real-time validation
    const roleNameInput = document.getElementById('input-role-name');
    if (roleNameInput) {
        roleNameInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value.length > 0 && value.length < 2) {
                this.style.borderColor = '#ef4444'; // Red border for invalid
            } else {
                this.style.borderColor = ''; // Reset border
            }
        });
    }
});
