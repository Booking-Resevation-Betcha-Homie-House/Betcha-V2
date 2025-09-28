/**
 * Fetches and populates the details of a single employee in employee-view.html
 * Assumes the employee ID is provided in the URL as ?id=EMPLOYEE_ID
 * Populates fields with IDs: employee-name, employee-email, employee-role, etc.
 */
// almost complete needed to finish the profile button and the notification 

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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	populateEmployeeDetails();
	
	// Initialize modal button handlers
	initializeModalButtons();
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
