

let allRoles = [];

const API_BASE = 'https://betcha-api.onrender.com';

function getRolesSkeleton() {
    const skeleton = document.getElementById('rolesSkeleton');
    if (!skeleton) {
        console.error('Roles skeleton element not found');
    }
    return skeleton;
}

function getRolesGrid() {
    const grid = document.getElementById('rolesGrid');
    if (!grid) {
        console.error('Roles grid element not found');
    }
    return grid;
}

function showSkeleton() {
    const skeleton = getRolesSkeleton();
    const grid = getRolesGrid();
    
    if (skeleton) {
        skeleton.classList.remove('hidden');
    }
    if (grid) {
        grid.classList.add('hidden');
    }
}

function hideSkeleton() {
    const skeleton = getRolesSkeleton();
    const grid = getRolesGrid();
    
    if (skeleton) {
        skeleton.classList.add('hidden');
    }
    if (grid) {
        grid.classList.remove('hidden');
    }
}

async function fetchRoles() {
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
        return roles;
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
}

function createRoleCard(role) {
    const privilegesPills = role.privileges.map(privilege => 
        `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-300/50 text-neutral-700 transition-all duration-200 ">${privilege}</span>`
    ).join('');

    return `
        <div class="bg-white rounded-3xl shadow-md flex flex-col font-inter p-5 group
          hover:shadow-lg 
          transition-all duration-300 ease-in-out h-full">
          <!-- Content -->
          <div class="flex flex-col flex-grow justify-between">
            <div class="flex flex-col gap-3 text-neutral-500">
              <p class="text-base font-bold font-manrope text-primary-text 
                transition-all duration-300 ease-in-out
              group-hover:text-primary">
                ${role.name}
              </p>
              <p class="text-xs font-medium text-neutral-600">Privileges:</p>
              <div class="flex flex-wrap gap-2 mb-4">
                  ${privilegesPills}
              </div>
            </div>
            
            <!-- Buttons Container - Always at bottom -->
            <div class="flex gap-3 w-full mt-auto">
                  <button 
                      onclick="editRole('${role._id}')"
                      class="flex gap-2 justify-center items-center bg-primary/10 w-full cursor-pointer
                      transition-all duration-300 ease-in-out py-3
                      hover:bg-primary/20 hover:scale-105 rounded-2xl active:scale-95"
                      >
                      <svg class="w-5 stroke-primary" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V8" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M12.2499 1.75003C12.5151 1.48481 12.8748 1.33582 13.2499 1.33582C13.625 1.33582 13.9847 1.48481 14.2499 1.75003C14.5151 2.01525 14.6641 2.37496 14.6641 2.75003C14.6641 3.1251 14.5151 3.48481 14.2499 3.75003L8.24123 9.75936C8.08293 9.91753 7.88737 10.0333 7.67257 10.096L5.75723 10.656C5.69987 10.6728 5.63906 10.6738 5.58117 10.6589C5.52329 10.6441 5.47045 10.614 5.4282 10.5717C5.38594 10.5295 5.35583 10.4766 5.341 10.4188C5.32617 10.3609 5.32717 10.3001 5.3439 10.2427L5.9039 8.32736C5.96692 8.11273 6.08292 7.9174 6.24123 7.75936L12.2499 1.75003Z" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                  </button>

                  <button 
                      onclick="deleteRole('${role._id}')"
                      class="flex gap-2 justify-center items-center w-full cursor-pointer
                      transition-all duration-300 ease-in-out bg-rose-100 py-3
                      hover:bg-rose-200 hover:scale-105 rounded-2xl active:scale-95">
                      <svg class="w-5 fill-rose-700" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4.66666 14C4.3 14 3.98622 13.8696 3.72533 13.6087C3.46444 13.3478 3.33378 13.0338 3.33333 12.6667V4H2.66666V2.66667H6V2H10V2.66667H13.3333V4H12.6667V12.6667C12.6667 13.0333 12.5362 13.3473 12.2753 13.6087C12.0144 13.87 11.7004 14.0004 11.3333 14H4.66666ZM11.3333 4H4.66666V12.6667H11.3333V4ZM6 11.3333H7.33333V5.33333H6V11.3333ZM8.66666 11.3333H10V5.33333H8.66666V11.3333Z"/>
                      </svg>
                  </button>
              </div>
          </div>
        </div>
    `;
}

async function populateRoles(rolesToDisplay = null) {
    const rolesGrid = getRolesGrid();
    
    if (!rolesGrid) {
        console.error('Roles grid container not found');
        return;
    }

    if (!rolesToDisplay) {
        showSkeleton();
    }

    try {
        let roles = rolesToDisplay;

        if (!roles) {
            roles = await fetchRoles();
            allRoles = roles; 
        }
        
        if (roles.length === 0) {
            hideSkeleton();
            rolesGrid.innerHTML = '<div class="col-span-full text-center text-neutral-500">No roles found.</div>';
            return;
        }

        const rolesHTML = roles.map(role => createRoleCard(role)).join('');
        rolesGrid.innerHTML = rolesHTML;
        hideSkeleton();

    } catch (error) {
        console.error('Error populating roles:', error);
        hideSkeleton();
        rolesGrid.innerHTML = '<div class="col-span-full text-center text-red-500">Error loading roles. Please try again later.</div>';
    }
}

function searchRoles(searchTerm) {
    if (!allRoles || allRoles.length === 0) {
        return;
    }

    hideSkeleton();

    const filteredRoles = allRoles.filter(role => {
        const searchLower = searchTerm.toLowerCase();

        const nameMatch = role.name.toLowerCase().includes(searchLower);

        const privilegeMatch = role.privileges.some(privilege => 
            privilege.toLowerCase().includes(searchLower)
        );
        
        return nameMatch || privilegeMatch;
    });

    populateRoles(filteredRoles);
}

function initializeSearch() {
    const searchInput = document.querySelector('input[placeholder="Search"]');
    const searchButton = document.getElementById('searchButton');
    
    if (!searchInput) {
        console.error('Search input not found');
        return;
    }

    function performSearch() {
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm === '') {

            populateRoles(allRoles);
        } else {

            searchRoles(searchTerm);
        }
    }

    searchInput.addEventListener('input', function(e) {
        performSearch();
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    if (searchButton) {
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
}

function editRole(roleId) {

    sessionStorage.setItem('editRoleId', roleId);
    window.location.href = 'roles-edit.html';
}

async function deleteRole(roleId) {
    if (!confirm('Are you sure you want to delete this role?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/roles/delete/${roleId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await populateRoles();
        alert('Role deleted successfully!');

    } catch (error) {
        console.error('Error deleting role:', error);
        alert('Error deleting role. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    populateRoles();
    initializeSearch();
});
