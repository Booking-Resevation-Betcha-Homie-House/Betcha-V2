

const API_BASE = 'https://betcha-api.onrender.com';

async function addEmployee() {
    let originalText = ''; 
    
    try {

        const firstName = document.querySelector('input[placeholder="First name"]').value.trim();
        const middleInitial = document.querySelector('input[placeholder="M.I."]').value.trim();
        const lastName = document.querySelector('input[placeholder="Last name"]').value.trim();
        const email = document.querySelector('input[type="email"]').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const profilePictureInput = document.querySelector('input[type="file"]');
        const profilePicture = profilePictureInput.files[0];

        let selectedRoles = [];

        const roleSelector = document.getElementById('roleSelector');
        if (roleSelector && window.Alpine) {
            try {
                const alpineData = Alpine.$data(roleSelector);
                if (alpineData && alpineData.selected && alpineData.selected.length > 0) {

                    selectedRoles = alpineData.selected.map(roleName => {
                        const role = window.allRoles?.find(r => r.name === roleName);
                        return role ? role._id : roleName; 
                    });
                }
            } catch (error) {
                console.warn('Could not get roles from Alpine.js:', error);
            }
        }

        if (selectedRoles.length === 0) {
            const roleCheckboxes = document.querySelectorAll('input[type="checkbox"][data-role-id]');
            selectedRoles = Array.from(roleCheckboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => checkbox.getAttribute('data-role-id'));
        }

        const propertyCheckboxes = document.querySelectorAll('input[type="checkbox"][data-property-id]');
        const selectedProperties = Array.from(propertyCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.getAttribute('data-property-id')); 

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            showError('Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }

        if (selectedRoles.length === 0) {
            showError('Please select at least one role');
            return;
        }

        const formData = new FormData();
        formData.append('firstname', firstName);
        formData.append('minitial', middleInitial);
        formData.append('lastname', lastName);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', selectedRoles.join(','));
        formData.append('properties', JSON.stringify(selectedProperties));

        const confirmBtn = document.getElementById('confirmEmployeeBtn');
        originalText = confirmBtn.innerHTML; 
        confirmBtn.innerHTML = `
            <span class="text-secondary-text text-lg">Adding...</span>
            <svg class="animate-spin w-5 h-5 ml-2 fill-secondary-text" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
        `;
        confirmBtn.disabled = true;

        const response = await fetch(`${API_BASE}/employee/create`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let errorMessage = 'Failed to add employee';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {

                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();

        showSuccess('Employee added successfully!');

        try {
            const userId = localStorage.getItem('userId') || '';
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logEmployeeCreation === 'function' && userId) {
                window.AuditTrailFunctions.logEmployeeCreation(userId);
            }
        } catch (auditError) {
            console.warn('Audit trail for employee creation failed:', auditError);
        }

        resetForm();

        setTimeout(() => {
            const modal = document.getElementById('confirmDetailsModal');
            if (modal) {
                modal.classList.add('hidden');
            }
            window.location.href = 'employees.html';
        }, 1500);

    } catch (error) {
        console.error('Error adding employee:', error);
        showError(error.message || 'Failed to add employee. Please try again.');

        const confirmBtn = document.getElementById('confirmEmployeeBtn');
        if (confirmBtn) {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorText = document.getElementById('errorText');
    
    if (errorContainer && errorText) {
        errorText.textContent = message;
        errorContainer.classList.remove('hidden');
        errorContainer.classList.add('flex');

        setTimeout(() => {
            errorContainer.classList.add('hidden');
            errorContainer.classList.remove('flex');
        }, 5000);
    }
}

function showSuccess(message) {

    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5 fill-white" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(successDiv);

    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

function resetForm() {

    document.querySelector('input[placeholder="First name"]').value = '';
    document.querySelector('input[placeholder="M.I."]').value = '';
    document.querySelector('input[placeholder="Last name"]').value = '';
    document.querySelector('input[type="email"]').value = '';
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';

    const profilePictureInput = document.querySelector('input[type="file"]');
    if (profilePictureInput) {
        profilePictureInput.value = '';
    }

    const roleSelector = document.getElementById('roleSelector');
    if (roleSelector && window.Alpine) {
        try {
            const alpineData = Alpine.$data(roleSelector);
            if (alpineData) {
                alpineData.selected = [];
            }
        } catch (error) {
            console.warn('Could not reset Alpine.js roles:', error);
        }
    }

    const roleCheckboxes = document.querySelectorAll('input[type="checkbox"][data-role-id]');
    roleCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    const propertyCheckboxes = document.querySelectorAll('input[type="checkbox"][data-property-id]');
    propertyCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    updateSelectedRolesDisplay();

    updateSelectedPropertiesDisplay();

    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.classList.add('hidden');
        errorContainer.classList.remove('flex');
    }
}

function validateForm() {
    const firstName = document.querySelector('input[placeholder="First name"]').value.trim();
    const middleInitial = document.querySelector('input[placeholder="M.I."]').value.trim();
    const lastName = document.querySelector('input[placeholder="Last name"]').value.trim();
    const email = document.querySelector('input[type="email"]').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showError('Please fill in all required fields');
        return false;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return false;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return false;
    }
    
    return true;
}

document.addEventListener('DOMContentLoaded', function() {

    const confirmBtn = document.getElementById('confirmEmployeeBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (validateForm()) {
                addEmployee();
            }
        });
    }

    document.addEventListener('alpine:init', () => {

        populateRoles();
    });

    setTimeout(() => {
        populateRoles();
    }, 500);

    populateProperties();
});

async function populateRoles() {
    try {
        const response = await fetch(`${API_BASE}/roles/display`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch roles: ${response.statusText}`);
        }
        
        const rolesData = await response.json();
        const roles = rolesData.value || rolesData; 

        window.allRoles = roles;

        const roleSelector = document.getElementById('roleSelector');
        if (roleSelector) {
            try {

                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (window.Alpine && Alpine.$data) {
                    const alpineData = Alpine.$data(roleSelector);
                    if (alpineData) {
                        alpineData.roles = roles.map(role => role.name);
                    }
                }
            } catch (error) {
                console.warn('Could not update Alpine.js roles:', error);

                populateRolesManually(roles);
            }
        }
        
    } catch (error) {
        console.error('Error fetching roles:', error);
        showError('Failed to load roles. Please refresh the page.');
    }
}

function populateRolesManually(roles) {

    const roleListContainer = document.querySelector('.border.border-gray-200.rounded-lg.max-h-48.overflow-y-auto');
    
    if (roleListContainer) {

        const templates = roleListContainer.querySelectorAll('template');
        roleListContainer.innerHTML = '';

        templates.forEach(template => {
            roleListContainer.appendChild(template);
        });

        if (templates.length === 0) {
            roles.forEach(role => {
                const roleItem = document.createElement('label');
                roleItem.className = 'relative flex items-center p-2 hover:bg-gray-50 cursor-pointer';
                roleItem.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="peer mr-2 appearance-none w-4 h-4 rounded border-2 border-neutral-300 checked:bg-primary checked:border-primary focus:outline-none"
                        value="${role.name}"
                        data-role-id="${role._id}"
                    >
                    <svg class="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" viewBox="0 0 20 20" fill="none">
                        <path d="M5 10.5L8.5 14L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="ml-1">${role.name}</span>
                `;

                const checkbox = roleItem.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', function() {
                    updateSelectedRolesDisplay();
                });
                
                roleListContainer.appendChild(roleItem);
            });

        }
    } else {
        console.error('Role list container not found');
    }
}

function updateSelectedRolesDisplay() {
    let selectedRoles = [];

    const roleSelector = document.getElementById('roleSelector');
    if (roleSelector && window.Alpine) {
        try {
            const alpineData = Alpine.$data(roleSelector);
            if (alpineData && alpineData.selected) {
                selectedRoles = alpineData.selected.map(roleName => ({
                    id: window.allRoles?.find(r => r.name === roleName)?._id || roleName,
                    name: roleName
                }));
            }
        } catch (error) {
            console.warn('Could not get roles from Alpine.js for display update:', error);
        }
    }

    if (selectedRoles.length === 0) {
        const roleCheckboxes = document.querySelectorAll('input[type="checkbox"][data-role-id]');
        selectedRoles = Array.from(roleCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => ({
                id: checkbox.getAttribute('data-role-id'),
                name: checkbox.value
            }));
    }

    const selectedRolesContainer = document.querySelector('.flex.flex-wrap.gap-2');
    
    if (selectedRolesContainer) {

        selectedRolesContainer.innerHTML = '';

        selectedRoles.forEach(role => {
            const roleTag = document.createElement('span');
            roleTag.className = 'bg-primary/10 text-primary !px-3 !py-1 rounded-full text-sm flex items-center gap-2';
            roleTag.innerHTML = `
                <span>${role.name}</span>
                <button onclick="removeRole('${role.id}')" class="text-blue-500 hover:text-blue-700 !p-0">
                    <svg class="fill-neutral-500 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 14.1221L17.303 19.4251C17.5844 19.7065 17.966 19.8646 18.364 19.8646C18.7619 19.8646 19.1436 19.7065 19.425 19.4251C19.7064 19.1437 19.8645 18.7621 19.8645 18.3641C19.8645 17.9662 19.7064 17.5845 19.425 17.3031L14.12 12.0001L19.424 6.69711C19.5632 6.55778 19.6737 6.39238 19.749 6.21036C19.8244 6.02834 19.8631 5.83326 19.8631 5.63626C19.8631 5.43926 19.8242 5.2442 19.7488 5.06221C19.6733 4.88022 19.5628 4.71488 19.4235 4.57561C19.2841 4.43634 19.1187 4.32588 18.9367 4.25054C18.7547 4.17519 18.5596 4.13644 18.3626 4.13648C18.1656 4.13653 17.9706 4.17538 17.7886 4.25081C17.6066 4.32624 17.4412 4.43678 17.302 4.57611L12 9.87911L6.69697 4.57611C6.55867 4.43278 6.3932 4.31843 6.21024 4.23973C6.02727 4.16103 5.83046 4.11956 5.63129 4.11774C5.43212 4.11591 5.23459 4.15377 5.05021 4.22911C4.86583 4.30444 4.6983 4.41574 4.55739 4.55652C4.41649 4.69729 4.30503 4.86471 4.22952 5.04902C4.15401 5.23333 4.11597 5.43083 4.1176 5.63C4.11924 5.82917 4.16053 6.02602 4.23905 6.20906C4.31758 6.3921 4.43177 6.55767 4.57497 6.69611L9.87997 12.0001L4.57597 17.3041C4.43277 17.4425 4.31858 17.6081 4.24005 17.7912C4.16153 17.9742 4.12024 18.1711 4.1186 18.3702C4.11697 18.5694 4.15501 18.7669 4.23052 18.9512C4.30603 19.1355 4.41749 19.3029 4.55839 19.4437C4.6993 19.5845 4.86683 19.6958 5.05121 19.7711C5.23559 19.8464 5.43312 19.8843 5.63229 19.8825C5.83146 19.8807 6.02827 19.8392 6.21124 19.7605C6.3942 19.6818 6.55967 19.5674 6.69797 19.4241L12 14.1221Z"/>
                    </svg>
                </button>
            `;
            selectedRolesContainer.appendChild(roleTag);
        });
    }
}

function removeRole(roleId) {

    const roleSelector = document.getElementById('roleSelector');
    if (roleSelector && window.Alpine) {
        try {
            const alpineData = Alpine.$data(roleSelector);
            if (alpineData && alpineData.selected) {
                const roleName = window.allRoles?.find(r => r._id === roleId)?.name || roleId;
                alpineData.selected = alpineData.selected.filter(s => s !== roleName);
            }
        } catch (error) {
            console.warn('Could not remove role from Alpine.js:', error);
        }
    }

    const roleCheckbox = document.querySelector(`input[type="checkbox"][data-role-id="${roleId}"]`);
    if (roleCheckbox) {
        roleCheckbox.checked = false;
    }
    
    updateSelectedRolesDisplay();
}

window.removeRole = removeRole;

async function populateProperties() {
    try {
        const response = await fetch(`${API_BASE}/property/display`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch properties: ${response.statusText}`);
        }
        
        const properties = await response.json();

        const propertyListContainer = document.getElementById('propertyListContainer');
        
        if (propertyListContainer) {

            propertyListContainer.innerHTML = '';

            window.allProperties = properties;

            properties.forEach(property => {
                const propertyItem = document.createElement('label');
                propertyItem.className = 'relative flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer';
                propertyItem.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="peer appearance-none w-4 h-4 rounded border-2 mr-2 border-neutral-300 checked:bg-primary checked:border-primary focus:outline-none"
                        value="${property.name}"
                        data-property-id="${property._id}"
                    >
                    <svg class="absolute left-2 mt-[2px] w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" viewBox="0 0 20 20" fill="none">
                        <path d="M5 10.5L8.5 14L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div class="flex flex-col">
                        <span class="font-medium font-manrope">${property.name}</span>
                        <span class="text-xs font-inter text-neutral-500">${property.address}, ${property.city}</span>
                    </div>
                `;

                const checkbox = propertyItem.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', function() {
                    updateSelectedPropertiesDisplay();
                });
                
                propertyListContainer.appendChild(propertyItem);
            });

            const searchInput = document.getElementById('propertySearch');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    filterProperties(this.value);
                });
            }

        } else {
            console.error('Property list container not found');
        }
        
    } catch (error) {
        console.error('Error fetching properties:', error);
        showError('Failed to load properties. Please refresh the page.');
    }
}

function updateSelectedPropertiesDisplay() {
    const propertyCheckboxes = document.querySelectorAll('input[type="checkbox"][data-property-id]');
    const selectedProperties = Array.from(propertyCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => ({
            id: checkbox.getAttribute('data-property-id'),
            name: checkbox.value
        }));

    const selectedPropertiesContainer = document.getElementById('selectedPropertiesContainer');
    
    if (selectedPropertiesContainer) {

        selectedPropertiesContainer.innerHTML = '';

        selectedProperties.forEach(property => {
            const propertyTag = document.createElement('span');
            propertyTag.className = 'bg-primary/10 text-primary !px-3 !py-1 rounded-full text-sm flex items-center gap-2';
            propertyTag.innerHTML = `
                <span>${property.name}</span>
                <button onclick="removeProperty('${property.id}')" class="text-blue-500 hover:text-blue-700 !p-0">
                    <svg class="fill-neutral-500 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 14.1221L17.303 19.4251C17.5844 19.7065 17.966 19.8646 18.364 19.8646C18.7619 19.8646 19.1436 19.7065 19.425 19.4251C19.7064 19.1437 19.8645 18.7621 19.8645 18.3641C19.8645 17.9662 19.7064 17.5845 19.425 17.3031L14.12 12.0001L19.424 6.69711C19.5632 6.55778 19.6737 6.39238 19.749 6.21036C19.8244 6.02834 19.8631 5.83326 19.8631 5.63626C19.8631 5.43926 19.8242 5.2442 19.7488 5.06221C19.6733 4.88022 19.5628 4.71488 19.4235 4.57561C19.2841 4.43634 19.1187 4.32588 18.9367 4.25054C18.7547 4.17519 18.5596 4.13644 18.3626 4.13648C18.1656 4.13653 17.9706 4.17538 17.7886 4.25081C17.6066 4.32624 17.4412 4.43678 17.302 4.57611L12 9.87911L6.69697 4.57611C6.55867 4.43278 6.3932 4.31843 6.21024 4.23973C6.02727 4.16103 5.83046 4.11956 5.63129 4.11774C5.43212 4.11591 5.23459 4.15377 5.05021 4.22911C4.86583 4.30444 4.6983 4.41574 4.55739 4.55652C4.41649 4.69729 4.30503 4.86471 4.22952 5.04902C4.15401 5.23333 4.11597 5.43083 4.1176 5.63C4.11924 5.82917 4.16053 6.02602 4.23905 6.20906C4.31758 6.3921 4.43177 6.55767 4.57497 6.69611L9.87997 12.0001L4.57597 17.3041C4.43277 17.4425 4.31858 17.6081 4.24005 17.7912C4.16153 17.9742 4.12024 18.1711 4.1186 18.3702C4.11697 18.5694 4.15501 18.7669 4.23052 18.9512C4.30603 19.1355 4.41749 19.3029 4.55839 19.4437C4.6993 19.5845 4.86683 19.6958 5.05121 19.7711C5.23559 19.8464 5.43312 19.8843 5.63229 19.8825C5.83146 19.8807 6.02827 19.8392 6.21124 19.7605C6.3942 19.6818 6.55967 19.5674 6.69797 19.4241L12 14.1221Z"/>
                    </svg>
                </button>
            `;
            selectedPropertiesContainer.appendChild(propertyTag);
        });
    }
}

function removeProperty(propertyId) {
    const propertyCheckbox = document.querySelector(`input[type="checkbox"][data-property-id="${propertyId}"]`);
    if (propertyCheckbox) {
        propertyCheckbox.checked = false;
        updateSelectedPropertiesDisplay();
    }
}

window.removeProperty = removeProperty;

function filterProperties(searchTerm) {
    if (!window.allProperties) return;
    
    const propertyListContainer = document.getElementById('propertyListContainer');
    if (!propertyListContainer) return;

    propertyListContainer.innerHTML = '';

    const filteredProperties = window.allProperties.filter(property => 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredProperties.forEach(property => {
        const propertyItem = document.createElement('label');
        propertyItem.className = 'relative flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer';
        propertyItem.innerHTML = `
            <input 
                type="checkbox" 
                class="peer appearance-none w-4 h-4 rounded border-2 mr-2 border-neutral-300 checked:bg-primary checked:border-primary focus:outline-none"
                value="${property.name}"
                data-property-id="${property._id}"
            >
            <svg class="absolute left-2 mt-[2px] w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" viewBox="0 0 20 20" fill="none">
                <path d="M5 10.5L8.5 14L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="flex flex-col">
                <span class="font-medium font-manrope">${property.name}</span>
                <span class="text-xs font-inter text-neutral-500">${property.address}, ${property.city}</span>
            </div>
        `;

        const checkbox = propertyItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            updateSelectedPropertiesDisplay();
        });
        
        propertyListContainer.appendChild(propertyItem);
    });
}

