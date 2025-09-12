

const API_BASE = 'https://betcha-api.onrender.com';

let currentEmployeeId = null;

async function populateEmployeeDetails() {

	const params = new URLSearchParams(window.location.search);
	const employeeId = params.get('id');
	
	if (!employeeId) {
		console.error('No employee ID found in URL');
		showErrorMessage('Employee ID not found in URL');
		return;
	}

	currentEmployeeId = employeeId;

	showLoadingState();
	
	try {
		const response = await fetch(`${API_BASE}/employee/display/${employeeId}`);
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const employee = await response.json();

		hideLoadingState();

		const fullName = `${employee.firstname || ''} ${employee.minitial || ''} ${employee.lastname || ''}`.trim();
		document.getElementById('employee-name').textContent = fullName;

		document.getElementById('employee-email').textContent = employee.email || 'No email provided';

		const roleName = employee.role && employee.role.length > 0 ? employee.role[0].name : 'No role assigned';
		document.getElementById('employee-role').textContent = roleName;
		document.getElementById('employee-role-header').textContent = roleName;

		const status = employee.status ? employee.status.charAt(0).toUpperCase() + employee.status.slice(1) : 'Unknown';
		document.getElementById('employee-status').textContent = status;

		const avatarElement = document.getElementById('employee-avatar');
		if (employee.pfplink) {

			avatarElement.innerHTML = `<img src="${employee.pfplink}" alt="Profile Picture" class="w-full h-full rounded-full object-cover">`;
		} else {

			const firstLetter = employee.firstname ? employee.firstname.charAt(0).toUpperCase() : '?';
			avatarElement.innerHTML = firstLetter;
		}

		const editBtn = document.getElementById('edit-employee-btn');
		if (editBtn) {
			editBtn.onclick = () => window.location.href = `employee-edit.html?id=${employeeId}`;
		}

		populateAssignedProperties(employee.properties || []);

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

	let normalizedProperties = [];
	
	if (!properties || properties.length === 0) {

	} else {
		properties.forEach((prop, index) => {
			if (typeof prop === 'string') {

				if (prop.startsWith('[') && prop.endsWith(']')) {
					try {
						const parsed = JSON.parse(prop);
						normalizedProperties.push(...parsed);
					} catch (e) {
						normalizedProperties.push(prop);
					}
				}

				else if (prop.includes(',') && prop.length > 20) { 
					const splitProps = prop.split(',').map(p => p.trim());
					normalizedProperties.push(...splitProps);
				}

				else {
					normalizedProperties.push(prop);
				}
			} else {

				normalizedProperties.push(prop);
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

		container.innerHTML = `
			<div class="w-full h-[200px] flex justify-center items-center">
				<p class="text-neutral-400">Loading assigned properties...</p>
			</div>
		`;

		const response = await fetch(`${API_BASE}/property/display`);
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const allProperties = await response.json();

		const assignedPropertiesData = allProperties.filter(property => {

			const propertyIdentifiers = [
				property._id,                    
				property.propertyName,           
				property.name,                   
				property.title,                  
				property.propertyTitle          
			].filter(identifier => identifier); 

			return normalizedProperties.some(assignedProp => {
				const normalizedAssigned = assignedProp.toString().trim().toLowerCase();
				return propertyIdentifiers.some(identifier => 
					identifier.toString().trim().toLowerCase() === normalizedAssigned
				);
			});
		});

		container.innerHTML = '';
		
		if (assignedPropertiesData.length === 0) {

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
				relative rounded-2xl cursor-pointer p-8 w-full h-auto lg:h-[140px] 
				flex flex-col lg:flex-row gap-8 bg-white border border-neutral-300 group 
				hover:shadow-md hover:border-primary 
				transition-all duration-500 ease-in-out overflow-hidden
			`;

			const propertyImage = property.images && property.images.length > 0 
				? property.images[0] 
				: '/images/unit01.jpg'; 

			const propertyName = property.propertyName || property.name || 'Unknown Property';

			const propertyAddress = property.address || property.location || 'Address not specified';
			
			propertyCard.innerHTML = `
				<!-- 🖼️ Property Image -->
				<div class="w-full lg:w-[20%] group-hover:lg:w-[25%] h-[150px] lg:h-full 
					bg-cover bg-center rounded-xl z-10 relative overflow-hidden
					transition-all duration-500 ease-in-out"
					style="background-image: url('${propertyImage}')">
					<!-- Image overlay for better contrast -->
					<div class="absolute inset-0 bg-black/20 rounded-xl"></div>
				</div>

				<!-- 📋 Property Details -->
				<div class="w-full lg:flex-1 text-start flex flex-col justify-center z-10 px-2">
					<p class="font-manrope font-semibold text-lg truncate mb-2 max-w-full md:max-w-[280px] md:text-xl text-gray-900 drop-shadow-sm">${propertyName}</p>
					<div class="flex gap-2 items-center">
						<svg class="h-4 w-4 fill-gray-700 flex-shrink-0 drop-shadow-sm" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
							<path d="M6 0C2.68628 0 0 2.86538 0 6.4C0 9.93458 3 12.8 6 16C9 12.8 12 9.93458 12 6.4C12 2.86538 9.31371 0 6 0ZM6 3.55555C7.4202 3.55555 8.57143 4.74946 8.57143 6.22221C8.57143 7.69501 7.4202 8.88888 6 8.88888C4.5798 8.88888 3.42857 7.69501 3.42857 6.22221C3.42857 4.74946 4.5798 3.55555 6 3.55555Z"/>
						</svg>
						<p class="font-roboto text-gray-700 text-sm truncate drop-shadow-sm">${propertyAddress}</p>
					</div>
					${property.description ? `
						<p class="text-sm text-gray-600 mt-2 line-clamp-2 drop-shadow-sm">${property.description}</p>
					` : ''}
				</div>

				<!-- ➡️ Slide-in Right Arrow -->
				<div class="absolute right-8 top-1/2 -translate-y-1/2 z-10 opacity-0 -translate-x-4 
					group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
					<svg class="w-5 h-5 stroke-gray-700" viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M1 0.5L9 8.5L1 16.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
			`;

			propertyCard.onclick = () => {

				if (property._id) {
					window.location.href = `property-view.html?id=${property._id}`;
				} else {
					window.location.href = `property-view.html?name=${encodeURIComponent(propertyName)}`;
				}
			};
			
			container.appendChild(propertyCard);
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

		if (deactivateContainer) deactivateContainer.style.display = 'block';
		if (reactivateContainer) reactivateContainer.style.display = 'none';
	} else {

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

		document.getElementById('deactivateModal').classList.add('hidden');

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

		document.getElementById('reactivateModal').classList.add('hidden');

		alert('Employee reactivated successfully!');
		location.reload();
		
	} catch (error) {
		console.error('Error reactivating employee:', error);
		alert('Failed to reactivate employee. Please try again.');
	}
}

function showLoadingState() {

	const nameElement = document.getElementById('employee-name');
	if (nameElement) {
		nameElement.textContent = 'Loading...';
	}

	const fieldsToLoad = ['employee-email', 'employee-role', 'employee-status', 'employee-role-header'];
	fieldsToLoad.forEach(fieldId => {
		const element = document.getElementById(fieldId);
		if (element) {
			element.textContent = 'Loading...';
		}
	});
}

function hideLoadingState() {

}

function showErrorMessage(message) {

	const nameElement = document.getElementById('employee-name');
	if (nameElement) {
		nameElement.textContent = message;
		nameElement.style.color = '#ef4444'; 
	}
}

document.addEventListener('DOMContentLoaded', () => {
	populateEmployeeDetails();

	initializeModalButtons();
});

function initializeModalButtons() {

	const deactivateModalButton = document.querySelector('#deactivateModal button[onclick*="property-view.html"]');
	if (deactivateModalButton) {
		deactivateModalButton.onclick = deactivateEmployee;
	}

	const reactivateModalButton = document.querySelector('#reactivateModal button[onclick*="property-view.html"]');
	if (reactivateModalButton) {
		reactivateModalButton.onclick = reactivateEmployee;
	}
}
