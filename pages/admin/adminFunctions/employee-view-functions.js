/**
 * Fetches and populates the details of a single employee in employee-view.html
 * Assumes the employee ID is provided in the URL as ?id=EMPLOYEE_ID
 * Populates fields with IDs: employee-name, employee-email, employee-role, etc.
 */
// almost complete needed to finish the profile button and the notification 

// Import toast notifications
import { showToastError, showToastSuccess } from '/src/toastNotification.js';

// API Base URL
const API_BASE = 'https://betcha-api.onrender.com';

let currentEmployeeId = null;

async function populateEmployeeDetails() {
	// Get employee ID from URL
	const params = new URLSearchParams(window.location.search);
	const employeeId = params.get('id');
	
	if (!employeeId) {
		console.error('No employee ID found in URL');
		showErrorMessage('Employee ID not found in URL');
		return;
	}

	currentEmployeeId = employeeId;
	
	// Show loading state
	showLoadingState();
	
	try {
		const response = await fetch(`${API_BASE}/employee/display/${employeeId}`);
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const employee = await response.json();
		
		// Hide loading state
		hideLoadingState();
		
		// Populate employee name
		const fullName = `${employee.firstname || ''} ${employee.minitial || ''} ${employee.lastname || ''}`.trim();
		document.getElementById('employee-name').textContent = fullName;
		
		// Populate email
		document.getElementById('employee-email').textContent = employee.email || 'No email provided';
		
		// Populate role (from role array)
		const roleName = employee.role && employee.role.length > 0 ? employee.role[0].name : 'No role assigned';
		document.getElementById('employee-role').textContent = roleName;
		document.getElementById('employee-role-header').textContent = roleName;
		
		// Populate status with proper capitalization
		const status = employee.status ? employee.status.charAt(0).toUpperCase() + employee.status.slice(1) : 'Unknown';
		document.getElementById('employee-status').textContent = status;
		
		// Handle profile picture
		const avatarElement = document.getElementById('employee-avatar');
		if (employee.pfplink) {
			// If profile picture exists, replace with image
			avatarElement.innerHTML = `<img src="${employee.pfplink}" alt="Profile Picture" class="w-full h-full rounded-full object-cover">`;
		} else {
			// If no profile picture, show first letter of first name
			const firstLetter = employee.firstname ? employee.firstname.charAt(0).toUpperCase() : '?';
			avatarElement.innerHTML = firstLetter;
		}
		
		// Update edit button to include employee ID
		const editBtn = document.getElementById('edit-employee-btn');
		if (editBtn) {
			editBtn.onclick = () => window.location.href = `employee-edit.html?id=${employeeId}`;
		}
		
		// Populate assigned properties
		populateAssignedProperties(employee.properties || []);
		
		// Show/hide deactivate/reactivate buttons based on status
		updateStatusButtons(employee.status);
		
	} catch (error) {
		console.error('Error fetching employee details:', error);
		hideLoadingState();
		showErrorMessage('Failed to load employee details. Please try again.');
	}
}

async function populateAssignedProperties(properties) {
	const container = document.getElementById('assigned-properties-container');
	if (!container) return;
	
	// Use a Set to ensure unique property IDs
	const normalizedProperties = new Set();
	
	if (!properties || properties.length === 0) {
		// No properties assigned
	} else {
		// First, extract all possible property IDs
		properties.forEach((prop) => {
			if (typeof prop === 'string') {
				if (prop.startsWith('[') && prop.endsWith(']')) {
					try {
						const parsed = JSON.parse(prop);
						parsed.forEach(p => normalizedProperties.add(p.toString().trim()));
					} catch (e) {
						normalizedProperties.add(prop.toString().trim());
					}
				} else if (prop.includes(',')) {
					prop.split(',')
						.map(p => p.trim())
						.forEach(p => normalizedProperties.add(p));
				} else {
					normalizedProperties.add(prop.toString().trim());
				}
			} else if (typeof prop === 'object' && prop._id) {
				normalizedProperties.add(prop._id.toString().trim());
			} else if (prop) {
				normalizedProperties.add(prop.toString().trim());
			}
		});
	}
	
	if (normalizedProperties.length === 0) {
		container.innerHTML = `
			<div class="w-full h-[300px] flex flex-col justify-center items-center">
				<svg class="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0v-9a2 2 0 00-2-2H8a2 2 0 00-2 2v9m8 0V9a2 2 0 012-2h2a2 2 0 012 2v12M7 7h3v3H7V7z"></path>
				</svg>
				<p class="text-neutral-400 text-center">No assigned properties</p>
			</div>
		`;
		return;
	}
	
	try {
		// Show loading state
		container.innerHTML = `
			<div class="w-full h-[200px] flex justify-center items-center">
				<p class="text-neutral-400">Loading assigned properties...</p>
			</div>
		`;
		
		// Fetch all properties from API
		const response = await fetch(`${API_BASE}/property/display`);
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const allProperties = await response.json();
		
		console.log('All properties response:', allProperties); // Debug log to see full response
		
		// Filter properties that are assigned to this employee
		const assignedPropertiesData = allProperties.filter(property => {
			// Only include properties whose IDs are in our Set of normalized properties
			return normalizedProperties.has(property._id.toString().trim());
		});
		
		// Clear container and populate with property cards
		container.innerHTML = '';
		
		if (assignedPropertiesData.length === 0) {
			// Get all available property identifiers for debugging
			const availableIdentifiers = allProperties.map(prop => {
				return [prop._id, prop.propertyName, prop.name, prop.title, prop.propertyTitle].filter(id => id);
			}).flat();
			
			container.innerHTML = `
				<div class="w-full h-[400px] flex flex-col justify-center items-center p-4">
					<svg class="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-2 0H7m5 0v-9a2 2 0 00-2-2H8a2 2 0 00-2 2v9m8 0V9a2 2 0 012-2h2a2 2 0 012 2v12M7 7h3v3H7V7z"></path>
					</svg>
					<p class="text-neutral-400 text-center mb-2">Properties not found</p>
				</div>
			`;
			return;
		}
		
		assignedPropertiesData.forEach(property => {
			const propertyCard = document.createElement('div');
			propertyCard.className = `
				relative rounded-2xl cursor-pointer p-6 w-full h-auto lg:h-[140px]
				flex flex-col lg:flex-row gap-6 border border-neutral-300 group 
				hover:shadow-md hover:border-primary 
				transition-all duration-500 ease-in-out overflow-hidden
			`;
			
			// Get property image or use placeholder
			console.log('Property data:', property); // Debug log
			
			// First try to get the image from the property's photos
			let propertyImage;
			
			if (property.photos && Array.isArray(property.photos) && property.photos.length > 0) {
				// Get the first photo's Google Drive URL
				const firstPhoto = property.photos[0];
				if (firstPhoto && firstPhoto.url) {
					propertyImage = firstPhoto.url;
				}
			}
			
			// If no photo found, try other possible image sources
			if (!propertyImage) {
				if (property.mainPhotoLink) {
					propertyImage = property.mainPhotoLink;
				} else if (property.photoLinks && Array.isArray(property.photoLinks) && property.photoLinks.length > 0) {
					propertyImage = property.photoLinks[0];
				} else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
					propertyImage = property.images[0];
				} else if (property.photoLink) {
					propertyImage = property.photoLink;
				} else if (property.image) {
					propertyImage = property.image;
				}
			}
			
			// If still no image found, use default
			if (!propertyImage) {
				propertyImage = '/public/images/unit01.jpg';
			}
			
			console.log('Selected image for ' + property.name + ':', propertyImage); // Debug log
			
			// Use the image URL as is since it's already an absolute URL (Google Drive thumbnail)
			const finalImagePath = propertyImage;
			
			propertyCard.innerHTML = `
				<!-- Container for image and content -->
				<div class="flex flex-col lg:flex-row w-full h-full gap-6 relative z-10">
					<!-- 🖼️ Property Image -->
					<div class="w-full lg:w-[140px] h-[140px] lg:h-full
						relative overflow-hidden rounded-xl shrink-0
						transition-all duration-500 ease-in-out 
						group-hover:lg:w-[160px]">
						<img src="${finalImagePath}" 
							class="w-full h-full object-cover" 
							alt="${property.name}"
							onerror="this.src='/public/images/unit01.jpg'"/>
						<div class="absolute inset-0 bg-black/20 rounded-xl"></div>
					</div>

					<!-- 📋 Property Details -->
					<div class="flex flex-col justify-center flex-1 min-w-0">
						<h3 class="font-manrope font-semibold text-lg md:text-xl text-gray-900 mb-2 truncate">
							${property.name || 'Unknown Property'}
						</h3>
						<div class="flex items-center gap-2 min-w-0">
							<svg class="h-4 w-4 flex-shrink-0 text-gray-700" fill="currentColor" viewBox="0 0 12 16">
								<path d="M6 0C2.68628 0 0 2.86538 0 6.4C0 9.93458 3 12.8 6 16C9 12.8 12 9.93458 12 6.4C12 2.86538 9.31371 0 6 0ZM6 3.55555C7.4202 3.55555 8.57143 4.74946 8.57143 6.22221C8.57143 7.69501 7.4202 8.88888 6 8.88888C4.5798 8.88888 3.42857 7.69501 3.42857 6.22221C3.42857 4.74946 4.5798 3.55555 6 3.55555Z"/>
							</svg>
							<p class="text-gray-700 text-sm truncate">${property.address || 'Address not specified'}</p>
						</div>
					</div>
				</div>

				<!-- ➡️ Hover Arrow -->
				<div class="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 -translate-x-4 
					group-hover:opacity-100 group-hover:translate-x-0 
					transition-all duration-300 z-20">
					<svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 10 17">
						<path d="M1 0.5L9 8.5L1 16.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>

				<!-- ➡️ Slide-in Right Arrow -->
				<div class="absolute right-8 top-1/2 -translate-y-1/2 z-10 opacity-0 -translate-x-4 
					group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
					<svg class="w-5 h-5 stroke-gray-700" viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M1 0.5L9 8.5L1 16.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
			`;
			
				// Add click handler to view property details
			propertyCard.onclick = () => {
				// Navigate to property view page with property ID
				if (property._id) {
					window.location.href = `property-view.html?id=${property._id}`;
				} else {
					window.location.href = `property-view.html?name=${encodeURIComponent(property.name || '')}`;
				}
			};			container.appendChild(propertyCard);
		});
		
	} catch (error) {
		console.error('Error fetching properties data:', error);
		container.innerHTML = `
			<div class="w-full h-[200px] flex flex-col justify-center items-center">
				<svg class="w-16 h-16 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<p class="text-red-400 text-center">Failed to load property details</p>
				<p class="text-neutral-400 text-sm text-center mt-1">Assigned: ${properties.join(', ')}</p>
			</div>
		`;
	}
}

function updateStatusButtons(status) {
	const deactivateContainer = document.querySelector('[data-modal-target="deactivateModal"]').closest('.md\\:px-6');
	const reactivateContainer = document.querySelector('[data-modal-target="reactivateModal"]').closest('.md\\:px-6');
	
	if (status === 'active') {
		// Show deactivate button, hide reactivate button
		if (deactivateContainer) deactivateContainer.style.display = 'block';
		if (reactivateContainer) reactivateContainer.style.display = 'none';
	} else {
		// Show reactivate button, hide deactivate button  
		if (deactivateContainer) deactivateContainer.style.display = 'none';
		if (reactivateContainer) reactivateContainer.style.display = 'block';
	}
}

async function deactivateEmployee() {
	if (!currentEmployeeId) {
		console.error('No employee ID available');
		return;
	}

	try {
		const response = await fetch(`${API_BASE}/employee/archive/${currentEmployeeId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		
		// Log employee deactivation audit trail
		try {
			const adminId = localStorage.getItem('userId');
			if (window.AuditTrailFunctions && adminId) {
				window.AuditTrailFunctions.logEmployeeDeactivation(adminId, 'Admin');
			}
		} catch (auditError) {
			console.warn('Audit trail for employee deactivation failed:', auditError);
		}
		
		// Close modal
		document.getElementById('deactivateModal').classList.add('hidden');
		
		// Show success message and refresh the page
		alert('Employee deactivated successfully!');
		location.reload();
		
	} catch (error) {
		console.error('Error deactivating employee:', error);
		alert('Failed to deactivate employee. Please try again.');
	}
}

async function reactivateEmployee() {
	if (!currentEmployeeId) {
		console.error('No employee ID available');
		return;
	}

	try {
		const response = await fetch(`${API_BASE}/employee/unarchive/${currentEmployeeId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		
		// Log employee activation audit trail
		try {
			const adminId = localStorage.getItem('userId');
			if (window.AuditTrailFunctions && adminId) {
				window.AuditTrailFunctions.logEmployeeActivation(adminId, 'Admin');
			}
		} catch (auditError) {
			console.warn('Audit trail for employee activation failed:', auditError);
		}
		
		// Close modal
		document.getElementById('reactivateModal').classList.add('hidden');
		
		// Show success message and refresh the page
		alert('Employee reactivated successfully!');
		location.reload();
		
	} catch (error) {
		console.error('Error reactivating employee:', error);
		alert('Failed to reactivate employee. Please try again.');
	}
}

function showLoadingState() {
	// Show loading in name field
	const nameElement = document.getElementById('employee-name');
	if (nameElement) {
		nameElement.textContent = 'Loading...';
	}
	
	// Show loading in other fields
	const fieldsToLoad = ['employee-email', 'employee-role', 'employee-status', 'employee-role-header'];
	fieldsToLoad.forEach(fieldId => {
		const element = document.getElementById(fieldId);
		if (element) {
			element.textContent = 'Loading...';
		}
	});
}

function hideLoadingState() {
	// Loading state will be replaced by actual data, so no action needed
}

function showErrorMessage(message) {
	// You can implement a proper error display here
	// For now, just update the name field to show error
	const nameElement = document.getElementById('employee-name');
	if (nameElement) {
		nameElement.textContent = message;
		nameElement.style.color = '#ef4444'; // red color
	}
}

// Show password change confirmation modal
function showChangePasswordModal() {
	// Check if modal already exists
	let modal = document.getElementById('changePasswordModal');
	if (!modal) {
		// Create modal if it doesn't exist
		createChangePasswordModal();
		modal = document.getElementById('changePasswordModal');
	}
	
	// Show the modal
	if (modal) {
		modal.classList.remove('hidden');
		modal.classList.add('flex');
	}
}

// Create password change modal
function createChangePasswordModal() {
	const modalHTML = `
	<div id="changePasswordModal" class="modal fixed inset-0 bg-black/50 bg-opacity-50 flex items-end md:items-center justify-center hidden z-50">
		<div class="bg-background w-[400px] rounded-t-3xl overflow-hidden modal-animate md:rounded-3xl">
			<!-- Close Button -->
			<div class="w-full p-5 flex justify-end">
				<button id="passwordModalClose" class="cursor-pointer btn-round border-none hover:bg-neutral-300 flex items-center justify-center active:scale-95 transition-all duration-200">
					<span>
						<svg class="h-5 fill-primary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M12 14.1221L17.303 19.4251C17.5844 19.7065 17.966 19.8646 18.364 19.8646C18.7619 19.8646 19.1436 19.7065 19.425 19.4251C19.7064 19.1437 19.8645 18.7621 19.8645 18.3641C19.8645 17.9662 19.7064 17.5845 19.425 17.3031L14.12 12.0001L19.424 6.69711C19.5632 6.55778 19.6737 6.39238 19.749 6.21036C19.8244 6.02834 19.8631 5.83326 19.8631 5.63626C19.8631 5.43926 19.8242 5.2442 19.7488 5.06221C19.6733 4.88022 19.5628 4.71488 19.4235 4.57561C19.2841 4.43634 19.1187 4.32588 18.9367 4.25054C18.7547 4.17519 18.5596 4.13644 18.3626 4.13648C18.1656 4.13653 17.9706 4.17538 17.7886 4.25081C17.6066 4.32624 17.4412 4.43678 17.302 4.57611L12 9.87911L6.69697 4.57611C6.55867 4.43278 6.3932 4.31843 6.21024 4.23973C6.02727 4.16103 5.83046 4.11956 5.63129 4.11774C5.43212 4.11591 5.23459 4.15377 5.05021 4.22911C4.86583 4.30444 4.6983 4.41574 4.55739 4.55652C4.41649 4.69729 4.30503 4.86471 4.22952 5.04902C4.15401 5.23333 4.11597 5.43083 4.1176 5.63C4.11924 5.82917 4.16053 6.02602 4.23905 6.20906C4.31758 6.3921 4.43177 6.55767 4.57497 6.69611L9.87997 12.0001L4.57597 17.3041C4.43277 17.4425 4.31858 17.6081 4.24005 17.7912C4.16153 17.9742 4.12024 18.1711 4.1186 18.3702C4.11697 18.5694 4.15501 18.7669 4.23052 18.9512C4.30603 19.1355 4.41749 19.3029 4.55839 19.4437C4.6993 19.5845 4.86683 19.6958 5.05121 19.7711C5.23559 19.8464 5.43312 19.8843 5.63229 19.8825C5.83146 19.8807 6.02827 19.8392 6.21124 19.7605C6.3942 19.6818 6.55967 19.5674 6.69797 19.4241L12 14.1221Z"/>
						</svg>
					</span>
				</button>
			</div>
			
			<!-- Modal Content -->
			<div class="flex flex-col items-center gap-5 p-8 pt-0">
				<h3 class="font-manrope text-primary-text font-bold text-xl text-center">Change Employee Password</h3>
				<p class="font-roboto text-neutral-500 text-sm text-center">Set a new password for this employee.</p>
				
				<!-- Password Input Fields -->
				<form id="changePasswordForm" class="w-full flex flex-col gap-4">
					<div class="w-full password-wrapper input-style2 flex items-center justify-between gap-3 group relative border border-neutral-300 rounded-xl px-4 py-3">
						<svg class="w-5 h-5 fill-muted transition-colors duration-200 group-focus-within:fill-primary" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
						 <path d="M2.25 12.75H15.75C16.1625 12.75 16.5 13.0875 16.5 13.5C16.5 13.9125 16.1625 14.25 15.75 14.25H2.25C1.8375 14.25 1.5 13.9125 1.5 13.5C1.5 13.0875 1.8375 12.75 2.25 12.75ZM1.875 9.4275C2.145 9.585 2.49 9.4875 2.6475 9.2175L3 8.6025L3.36 9.225C3.5175 9.495 3.8625 9.585 4.1325 9.435C4.4025 9.2775 4.4925 8.94 4.3425 8.67L3.975 8.04H4.6875C4.995 8.04 5.25 7.785 5.25 7.4775C5.25 7.17 4.995 6.915 4.6875 6.915H3.975L4.3275 6.3C4.485 6.03 4.395 5.685 4.125 5.5275C3.9943 5.45475 3.84034 5.43599 3.696 5.47523C3.55165 5.51447 3.42838 5.60859 3.3525 5.7375L3 6.3525L2.6475 5.7375C2.57162 5.60859 2.44835 5.51447 2.304 5.47523C2.15966 5.43599 2.0057 5.45475 1.875 5.5275C1.605 5.685 1.515 6.03 1.6725 6.3L2.025 6.915H1.3125C1.005 6.915 0.75 7.17 0.75 7.4775C0.75 7.785 1.005 8.04 1.3125 8.04H2.025L1.665 8.6625C1.515 8.9325 1.605 9.2775 1.875 9.4275Z"/>
						</svg>
						<!-- Password Input -->
						<input id="newPassword" type="password" placeholder="New Password" class="password-input flex-1 bg-transparent focus:outline-none text-sm font-normal pr-12" />

						<!-- Toggle Show/Hide -->
						<button type="button" class="absolute right-4 z-10 text-muted hover:text-primary toggle-password">
							<svg class="eye-open w-5 h-5 stroke-muted transition-colors duration-200 group-focus-within:stroke-primary" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M2.45625 11.472C1.81875 10.644 1.5 10.2293 1.5 9C1.5 7.77 1.81875 7.35675 2.45625 6.528C3.729 4.875 5.8635 3 9 3C12.1365 3 14.271 4.875 15.5438 6.528C16.1813 7.3575 16.5 7.77075 16.5 9C16.5 10.23 16.1813 10.6432 15.5438 11.472C14.271 13.125 12.1365 15 9 15C5.8635 15 3.729 13.125 2.45625 11.472Z" stroke-width="1.5"/>
								<path d="M11.25 9C11.25 9.59674 11.0129 10.169 10.591 10.591C10.169 11.0129 9.59674 11.25 9 11.25C8.40326 11.25 7.83097 11.0129 7.40901 10.591C6.98705 10.169 6.75 9.59674 6.75 9C6.75 8.40326 6.98705 7.83097 7.40901 7.40901C7.83097 6.98705 8.40326 6.75 9 6.75C9.59674 6.75 10.169 6.98705 10.591 7.40901C11.0129 7.83097 11.25 8.40326 11.25 9Z" stroke-width="1.5"/>
							</svg>
							<svg class="eye-closed w-5 h-5 stroke-muted transition-colors duration-200 group-focus-within:stroke-primary hidden" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M21 9C18.6 11.6667 15.6 13 12 13C8.4 13 5.4 11.6667 3 9M3 15L5.5 11.2M21 14.976L18.508 11.2M9 17L9.5 13M15 17L14.5 13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					</div>

					<div class="w-full password-wrapper input-style2 flex items-center justify-between gap-3 group relative border border-neutral-300 rounded-xl px-4 py-3">
						<svg class="w-5 h-5 fill-muted transition-colors duration-200 group-focus-within:fill-primary" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
						 <path d="M2.25 12.75H15.75C16.1625 12.75 16.5 13.0875 16.5 13.5C16.5 13.9125 16.1625 14.25 15.75 14.25H2.25C1.8375 14.25 1.5 13.9125 1.5 13.5C1.5 13.0875 1.8375 12.75 2.25 12.75ZM1.875 9.4275C2.145 9.585 2.49 9.4875 2.6475 9.2175L3 8.6025L3.36 9.225C3.5175 9.495 3.8625 9.585 4.1325 9.435C4.4025 9.2775 4.4925 8.94 4.3425 8.67L3.975 8.04H4.6875C4.995 8.04 5.25 7.785 5.25 7.4775C5.25 7.17 4.995 6.915 4.6875 6.915H3.975L4.3275 6.3C4.485 6.03 4.395 5.685 4.125 5.5275C3.9943 5.45475 3.84034 5.43599 3.696 5.47523C3.55165 5.51447 3.42838 5.60859 3.3525 5.7375L3 6.3525L2.6475 5.7375C2.57162 5.60859 2.44835 5.51447 2.304 5.47523C2.15966 5.43599 2.0057 5.45475 1.875 5.5275C1.605 5.685 1.515 6.03 1.6725 6.3L2.025 6.915H1.3125C1.005 6.915 0.75 7.17 0.75 7.4775C0.75 7.785 1.005 8.04 1.3125 8.04H2.025L1.665 8.6625C1.515 8.9325 1.605 9.2775 1.875 9.4275Z"/>
						</svg>
						<!-- Confirm Password Input -->
						<input id="confirmNewPassword" type="password" placeholder="Confirm New Password" class="password-input flex-1 bg-transparent focus:outline-none text-sm font-normal pr-12" />

						<!-- Toggle Show/Hide -->
						<button type="button" class="absolute right-4 z-10 text-muted hover:text-primary toggle-password">
							<svg class="eye-open w-5 h-5 stroke-muted transition-colors duration-200 group-focus-within:stroke-primary" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M2.45625 11.472C1.81875 10.644 1.5 10.2293 1.5 9C1.5 7.77 1.81875 7.35675 2.45625 6.528C3.729 4.875 5.8635 3 9 3C12.1365 3 14.271 4.875 15.5438 6.528C16.1813 7.3575 16.5 7.77075 16.5 9C16.5 10.23 16.1813 10.6432 15.5438 11.472C14.271 13.125 12.1365 15 9 15C5.8635 15 3.729 13.125 2.45625 11.472Z" stroke-width="1.5"/>
								<path d="M11.25 9C11.25 9.59674 11.0129 10.169 10.591 10.591C10.169 11.0129 9.59674 11.25 9 11.25C8.40326 11.25 7.83097 11.0129 7.40901 10.591C6.98705 10.169 6.75 9.59674 6.75 9C6.75 8.40326 6.98705 7.83097 7.40901 7.40901C7.83097 6.98705 8.40326 6.75 9 6.75C9.59674 6.75 10.169 6.98705 10.591 7.40901C11.0129 7.83097 11.25 8.40326 11.25 9Z" stroke-width="1.5"/>
							</svg>
							<svg class="eye-closed w-5 h-5 stroke-muted transition-colors duration-200 group-focus-within:stroke-primary hidden" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M21 9C18.6 11.6667 15.6 13 12 13C8.4 13 5.4 11.6667 3 9M3 15L5.5 11.2M21 14.976L18.508 11.2M9 17L9.5 13M15 17L14.5 13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					</div>
				</form>
				
				<!-- Action Buttons -->
				<div class="flex flex-col gap-3 w-full mt-5">
					<button id="confirmChangePasswordBtn" class="group relative rounded-full w-full bg-primary hover:bg-primary/90 flex items-center justify-center overflow-hidden hover:cursor-pointer active:scale-95 transition-all duration-300 ease-in-out py-3">
						<span class="text-secondary-text text-sm font-medium group-hover:-translate-x-1 transition-transform duration-500 ease-in-out">
							Reset Password
						</span>
						<span class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out">
							<svg class="w-5 h-5 ml-2 fill-secondary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9.55006 15.15L18.0251 6.675C18.2251 6.475 18.4584 6.375 18.7251 6.375C18.9917 6.375 19.2251 6.475 19.4251 6.675C19.6251 6.875 19.7251 7.11267 19.7251 7.388C19.7251 7.66333 19.6251 7.90067 19.4251 8.1L10.2501 17.3C10.0501 17.5 9.81673 17.6 9.55006 17.6C9.28339 17.6 9.05006 17.5 8.85006 17.3L4.55006 13C4.35006 12.8 4.25406 12.5627 4.26206 12.288C4.27006 12.0133 4.37439 11.7757 4.57506 11.575C4.77572 11.3743 5.01339 11.2743 5.28806 11.275C5.56272 11.2757 5.80006 11.3757 6.00006 11.575L9.55006 15.15Z"/>
							</svg>
						</span>
					</button>
					<button id="cancelChangePasswordBtn" class="group relative rounded-full w-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center overflow-hidden hover:cursor-pointer active:scale-95 transition-all duration-300 ease-in-out py-3">
						<span class="text-primary-text text-sm font-medium group-hover:-translate-x-1 transition-transform duration-500 ease-in-out">
							Cancel
						</span>
						<span class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out">
							<svg class="w-5 h-5 ml-2 fill-primary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</span>
					</button>
				</div>
			</div>
		</div>
	</div>`;
	
	// Add modal to body
	document.body.insertAdjacentHTML('beforeend', modalHTML);
	
	// Add event listeners
	const modal = document.getElementById('changePasswordModal');
	const closeBtn = document.getElementById('passwordModalClose');
	const confirmBtn = document.getElementById('confirmChangePasswordBtn');
	const cancelBtn = document.getElementById('cancelChangePasswordBtn');
	
	// Close modal functions
	const closeModal = () => {
		modal.classList.add('hidden');
		modal.classList.remove('flex');
	};
	
	// Event listeners
	closeBtn.addEventListener('click', closeModal);
	cancelBtn.addEventListener('click', closeModal);
	confirmBtn.addEventListener('click', () => {
		validateAndChangePassword();
	});
	
	// Close modal when clicking background
	modal.addEventListener('click', (e) => {
		if (e.target === modal) {
			closeModal();
		}
	});
	
	// Close modal on Escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
			closeModal();
		}
	});
	
	// Add password toggle functionality
	const toggleButtons = modal.querySelectorAll('.toggle-password');
	toggleButtons.forEach(button => {
		button.addEventListener('click', function(e) {
			e.preventDefault();
			const passwordInput = this.parentElement.querySelector('.password-input');
			const eyeOpen = this.querySelector('.eye-open');
			const eyeClosed = this.querySelector('.eye-closed');
			
			if (passwordInput.type === 'password') {
				passwordInput.type = 'text';
				eyeOpen.classList.add('hidden');
				eyeClosed.classList.remove('hidden');
			} else {
				passwordInput.type = 'password';
				eyeOpen.classList.remove('hidden');
				eyeClosed.classList.add('hidden');
			}
		});
	});
}

// Function to validate and handle password change
function validateAndChangePassword() {
	const newPassword = document.getElementById('newPassword').value.trim();
	const confirmPassword = document.getElementById('confirmNewPassword').value.trim();

	// Validation checks
	if (!newPassword || !confirmPassword) {
		showToastError('Missing Fields', 'Please fill in both password fields.');
		return;
	}

	// Password validation regex: at least 8 chars, 1 uppercase, 1 lowercase, 1 special character
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(.{8,})$/;
	
	if (!passwordRegex.test(newPassword)) {
		showToastError('Invalid Password', 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 special character.');
		return;
	}

	if (newPassword !== confirmPassword) {
		showToastError('Password Mismatch', 'Passwords do not match.');
		return;
	}

	// Close modal and proceed with password change
	const modal = document.getElementById('changePasswordModal');
	modal.classList.add('hidden');
	modal.classList.remove('flex');
	
	changeEmployeePassword(newPassword);
}

// Function to handle password change
async function changeEmployeePassword(newPassword) {
	if (!currentEmployeeId) {
		console.error('No employee ID available');
		showToastError('Error', 'No employee ID found.');
		return;
	}

	try {
		const response = await fetch(`${API_BASE}/employee/update/${currentEmployeeId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ 
				password: newPassword
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		
		// Show success message
		showToastSuccess('Success', 'Employee password updated successfully!');
		
		// Log password update audit trail
		try {
			const adminId = localStorage.getItem('userId');
			if (window.AuditTrailFunctions && adminId) {
				window.AuditTrailFunctions.logPasswordUpdate(adminId, 'Admin');
			}
		} catch (auditError) {
			console.warn('Audit trail for password update failed:', auditError);
		}
		
		// Clear form fields
		document.getElementById('newPassword').value = '';
		document.getElementById('confirmNewPassword').value = '';
		
	} catch (error) {
		console.error('Error updating employee password:', error);
		showToastError('Error', 'Failed to update employee password. Please try again.');
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	populateEmployeeDetails();
	
	// Initialize modal button handlers
	initializeModalButtons();
	
	// Initialize change password button
	initializeChangePasswordButton();
});

function initializeModalButtons() {
	// Find and update the deactivate button in the modal
	const deactivateModalButton = document.querySelector('#deactivateModal button[onclick*="property-view.html"]');
	if (deactivateModalButton) {
		deactivateModalButton.onclick = deactivateEmployee;
	}
	
	// Find and update the reactivate button in the modal
	const reactivateModalButton = document.querySelector('#reactivateModal button[onclick*="property-view.html"]');
	if (reactivateModalButton) {
		reactivateModalButton.onclick = reactivateEmployee;
	}
}

function initializeChangePasswordButton() {
	// Find the change password link and override its behavior
	const changePasswordLink = document.querySelector('a[href*="reset-password.html"]');
	if (changePasswordLink) {
		changePasswordLink.addEventListener('click', function(event) {
			event.preventDefault(); // Prevent navigation
			showChangePasswordModal(); // Show modal instead
		});
	}
}
