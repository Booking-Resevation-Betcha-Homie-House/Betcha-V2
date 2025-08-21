// Add Role functionality for Admin panel

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

// Function to create a new role via API
async function createRole(roleData) {
    try {
        const response = await fetch('/api/roles/create', {
            method: 'POST',
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
        console.error('Error creating role:', error);
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
            <span class="text-secondary-text">Creating...</span>
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
    alert('Role created successfully!');
}

// Function to show error message
function showErrorMessage(errors) {
    if (Array.isArray(errors)) {
        alert('Error creating role:\n' + errors.join('\n'));
    } else {
        alert('Error creating role: ' + errors);
    }
}

// Function to clear form
function clearForm() {
    // Clear role name
    const roleNameInput = document.getElementById('input-role-name');
    if (roleNameInput) {
        roleNameInput.value = '';
    }

    // Clear all privilege checkboxes
    const privilegeCheckboxes = document.querySelectorAll('input[name="privileges"]');
    privilegeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Main function to handle role creation
async function handleCreateRole() {
    const confirmButton = document.getElementById('confirmAddRole');
    
    if (!confirmButton) {
        console.error('Confirm button not found');
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
        // Create the role
        await createRole(formData);
        
        // Show success message
        showSuccessMessage();
        
        // Clear the form
        clearForm();
        
        // Close any open modals
        const modal = document.querySelector('.modal:not(.hidden)');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Optionally redirect to roles page after a short delay
        setTimeout(() => {
            window.location.href = 'roles.html';
        }, 1500);

    } catch (error) {
        console.error('Error in handleCreateRole:', error);
        showErrorMessage(error.message || 'An unexpected error occurred');
    } finally {
        // Restore button state
        restoreButtonState(confirmButton, originalContent);
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
    // Attach event listener to confirm button
    const confirmButton = document.getElementById('confirmAddRole');
    if (confirmButton) {
        confirmButton.addEventListener('click', handleCreateRole);
    }

    // Attach event listener to the "Add" button to update modal preview
    const addButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (addButton) {
        addButton.addEventListener('click', updateModalPreview);
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
