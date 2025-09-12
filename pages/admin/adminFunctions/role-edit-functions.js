

let currentRoleId = null;

const API_BASE = 'https://betcha-api.onrender.com';

function getCurrentRoleId() {
    return sessionStorage.getItem('editRoleId');
}

async function fetchRoleById(roleId) {
    try {
        const response = await fetch(`${API_BASE}/roles/display`, {
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

function populateForm(role) {

    const roleNameInput = document.getElementById('input-role-name');
    if (roleNameInput) {
        roleNameInput.value = role.name;
    }

    const privilegeCheckboxes = document.querySelectorAll('input[name="privileges"]');
    privilegeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    if (role.privileges && Array.isArray(role.privileges)) {
        role.privileges.forEach(privilege => {
            const checkbox = document.querySelector(`input[name="privileges"][value="${privilege}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
}

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

async function updateRole(roleId, roleData) {
    try {
        const response = await fetch(`${API_BASE}/roles/update/${roleId}`, {
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

function restoreButtonState(button, originalContent) {
    button.disabled = false;
    button.innerHTML = originalContent;
}

function showSuccessMessage() {

    alert('Role updated successfully!');
}

function showErrorMessage(errors) {
    if (Array.isArray(errors)) {
        alert('Error updating role:\n' + errors.join('\n'));
    } else {
        alert('Error updating role: ' + errors);
    }
}

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

    const formData = collectFormData();
    const validationErrors = validateFormData(formData);

    if (validationErrors.length > 0) {
        showErrorMessage(validationErrors);
        return;
    }

    const originalContent = showLoadingState(confirmButton);

    try {

        await updateRole(currentRoleId, formData);

        showSuccessMessage();

        const modal = document.querySelector('.modal:not(.hidden)');
        if (modal) {
            modal.classList.add('hidden');
        }

        setTimeout(() => {
            window.location.href = 'roles.html';
        }, 1500);

    } catch (error) {
        console.error('Error in handleUpdateRole:', error);
        showErrorMessage(error.message || 'An unexpected error occurred');
    } finally {

        restoreButtonState(confirmButton, originalContent);
    }
}

async function loadRoleData() {
    try {

        currentRoleId = getCurrentRoleId();
        
        if (!currentRoleId) {
            showErrorMessage('No role selected for editing. Redirecting to roles page...');
            setTimeout(() => {
                window.location.href = 'roles.html';
            }, 2000);
            return;
        }

        const role = await fetchRoleById(currentRoleId);

        populateForm(role);

    } catch (error) {
        console.error('Error loading role data:', error);
        showErrorMessage('Error loading role data: ' + (error.message || 'Unknown error'));

        setTimeout(() => {
            window.location.href = 'roles.html';
        }, 3000);
    }
}

function updateModalPreview() {
    const formData = collectFormData();

    console.log('Current form data:', formData);
}

document.addEventListener('DOMContentLoaded', function() {

    loadRoleData();

    const confirmButton = document.getElementById('confirmEditRole');
    if (confirmButton) {
        confirmButton.addEventListener('click', handleUpdateRole);
    }

    const updateButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (updateButton) {
        updateButton.addEventListener('click', updateModalPreview);
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
