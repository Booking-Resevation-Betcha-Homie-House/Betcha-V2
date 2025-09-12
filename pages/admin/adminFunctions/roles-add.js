

const API_BASE = 'https://betcha-api.onrender.com';

function collectFormData() {

    const roleNameInput = document.getElementById('input-role-name');
    const roleName = roleNameInput ? roleNameInput.value.trim() : '';

    const privilegeCheckboxes = document.querySelectorAll('input[name="privileges"]:checked');
    const privileges = Array.from(privilegeCheckboxes).map(checkbox => checkbox.value);

    return {
        name: roleName,
        privileges: privileges
    };
}

function validateFormData(data) {
    const errors = [];

    if (!data.name || data.name.length === 0) {
        errors.push('Role name is required');
    }

    if (data.name && data.name.length < 2) {
        errors.push('Role name must be at least 2 characters long');
    }

    if (!data.privileges || data.privileges.length === 0) {
        errors.push('At least one privilege must be selected');
    }

    return errors;
}

async function createRole(roleData) {
    try {
        const response = await fetch(`${API_BASE}/roles/create`, {
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

function restoreButtonState(button, originalContent) {
    button.disabled = false;
    button.innerHTML = originalContent;
}

function showSuccessMessage() {

    alert('Role created successfully!');
}

function showErrorMessage(errors) {
    if (Array.isArray(errors)) {
        alert('Error creating role:\n' + errors.join('\n'));
    } else {
        alert('Error creating role: ' + errors);
    }
}

function clearForm() {

    const roleNameInput = document.getElementById('input-role-name');
    if (roleNameInput) {
        roleNameInput.value = '';
    }

    const privilegeCheckboxes = document.querySelectorAll('input[name="privileges"]');
    privilegeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

async function handleCreateRole() {
    const confirmButton = document.getElementById('confirmAddRole');
    
    if (!confirmButton) {
        console.error('Confirm button not found');
        return;
    }

    const formData = collectFormData();
    const validationErrors = validateFormData(formData);

    if (validationErrors.length > 0) {
        showErrorMessage(validationErrors);
        return;
    }

    const originalContent = showLoadingState(confirmButton);

    try {

        await createRole(formData);

        showSuccessMessage();

        clearForm();

        const modal = document.querySelector('.modal:not(.hidden)');
        if (modal) {
            modal.classList.add('hidden');
        }

        setTimeout(() => {
            window.location.href = 'roles.html';
        }, 1500);

    } catch (error) {
        console.error('Error in handleCreateRole:', error);
        showErrorMessage(error.message || 'An unexpected error occurred');
    } finally {

        restoreButtonState(confirmButton, originalContent);
    }
}

function updateModalPreview() {
    const formData = collectFormData();

    console.log('Current form data:', formData);
}

document.addEventListener('DOMContentLoaded', function() {

    const confirmButton = document.getElementById('confirmAddRole');
    if (confirmButton) {
        confirmButton.addEventListener('click', handleCreateRole);
    }

    const addButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (addButton) {
        addButton.addEventListener('click', updateModalPreview);
    }

    const roleNameInput = document.getElementById('input-role-name');
    if (roleNameInput) {
        roleNameInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value.length > 0 && value.length < 2) {
                this.style.borderColor = '#ef4444'; 
            } else {
                this.style.borderColor = ''; 
            }
        });
    }
});
