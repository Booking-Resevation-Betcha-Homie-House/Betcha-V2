// When a property is clicked the data should be passed to the property-view.html

/**
 * Initialize admin profile picture in navigation
 */
function initializeAdminProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const adminProfileImgElement = document.getElementById('adminProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!adminProfileImgElement || !menuBtnElement) {
            console.warn('Admin profile elements not found in DOM');
            return;
        }
        
        // If profile picture exists, show it
        if (profilePicture && profilePicture.trim() !== '') {
            adminProfileImgElement.src = profilePicture;
            adminProfileImgElement.classList.remove('hidden');
            // Remove green background when showing profile picture
            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Admin profile picture loaded:', profilePicture);
        } else {
            // Keep default SVG icon visible with green background
            adminProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No admin profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing admin profile:', error);
    }
}

// Initialize profile when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminProfile();
});

// Fetch and display properties in the property list grid

// API Base URL
const API_BASE = 'https://betcha-api.onrender.com';

let allProperties = []; // Store fetched properties for searching

async function getAllProperties() {
    // Only run if we're on a page that needs properties
    const skeletonContainer = document.getElementById('skeleton-container');
    const propertiesContainer = document.getElementById('properties-container');
    
    if (!skeletonContainer && !propertiesContainer) {
        console.log('Property containers not found on this page, skipping property fetch');
        return;
    }

    // Show skeleton loading
    if (skeletonContainer) skeletonContainer.style.display = 'grid';
    if (propertiesContainer) propertiesContainer.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/property/display`);
        const data = await response.json();
        console.log('API Response:', data); // Debug: Log the full API response
        if (Array.isArray(data)) {
            allProperties = data; // Save for search
            // Debug: Log the first property to see its structure
            if (data.length > 0) {
                console.log('First property structure:', data[0]);
                console.log('First property photoLinks:', data[0].photoLinks);
            }
            renderProperties(allProperties);
            
            // Hide skeleton and show content
            if (skeletonContainer) skeletonContainer.style.display = 'none';
            if (propertiesContainer) propertiesContainer.style.display = 'grid';
        }
    } catch (error) {
        console.error('Failed to fetch properties:', error);
        // Hide skeleton on error and show empty state or error message
        if (skeletonContainer) skeletonContainer.style.display = 'none';
        if (propertiesContainer) {
            propertiesContainer.style.display = 'grid';
            propertiesContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-neutral-500 mb-4">Failed to load properties</p>
                    <button onclick="getAllProperties()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

function renderProperties(properties) {
    // Find the properties container
    const propertiesContainer = document.getElementById('properties-container');
    if (!propertiesContainer) return;
    propertiesContainer.innerHTML = '';

    if (properties.length === 0) {
        propertiesContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-neutral-500">No properties found</p>
            </div>
        `;
        return;
    }

    properties.forEach(property => {
        const propertyCard = document.createElement('a');
        propertyCard.href = `property-view.html?id=${property._id}`;
        propertyCard.className = "relative";

        // Debug: Log the image URL being generated
        const imageUrl = property.photoLinks && property.photoLinks.length > 0 ? property.photoLinks[0] : '/images/unit01.jpg';
        console.log(`Property: ${property.name}, Image URL: ${imageUrl}`);

        // Truncate text function for consistent card sizes
        const truncateText = (text, maxLength) => {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };

        // Truncate property name and address for consistent card sizes
        const truncatedName = truncateText(property.name, 25); // Max 25 characters for name
        const truncatedAddress = truncateText(`${property.address}, ${property.city}`, 25); 

        propertyCard.innerHTML = `
            <div class="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col group
                transition-all duration-300 ease-in-out
                hover:shadow-lg ">
                <!-- Image (use property image or fallback) -->
                <div class="w-full h-38 md:h-56 overflow-hidden">
                    <img src="${imageUrl}" 
                         class="w-full h-full object-cover object-center bg-neutral-300
                         transition-all duration-300 ease-in-out
                         group-hover:scale-105"
                         onerror="this.src='/images/unit01.jpg'"
                         alt="${property.name}">
                </div>
                <div class="p-5">
                    <!-- Title + Address -->
                    <div>
                        <p class="text-xl font-semibold text-primary-text mb-1 font-manrope
                            transition-all duration-300 ease-in-out
                            group-hover:text-primary" title="${property.name}">${truncatedName}</p>
                        <div class="flex items-center w-full gap-2 mb-2.5">
                            <svg class="w-auto h-3.5 fill-neutral-500" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 0C2.68628 0 0 2.86538 0 6.4C9.53674e-07 9.93458 3 12.8 6 16C9 12.8 12 9.93458 12 6.4C12 2.86538 9.31371 1.69648e-07 6 0ZM6 3.55555C7.4202 3.55555 8.57143 4.74946 8.57143 6.22221C8.57143 7.69501 7.4202 8.88888 6 8.88888C4.5798 8.88888 3.42857 7.69501 3.42857 6.22221C3.42857 4.74946 4.5798 3.55555 6 3.55555Z" />
                            </svg>
                            <p class="text-neutral-500 text-sm font-inter" title="${property.address}, ${property.city}">${truncatedAddress}</p>
                        </div>
                    </div>
                    <!-- Info Grid -->
                    <div class="grid grid-cols-2 gap-y-3 !text-xs font-inter">
                        <div>
                            <span class="block font-medium">Capacity</span>
                            <span class="text-neutral-500 ">${property.maxCapacity} pax</span>
                        </div>
                        <div>
                            <span class="block font-medium">Price</span>
                            <span class="text-neutral-500 ">₱${property.packagePrice.toLocaleString()}/night</span>
                        </div>
                        <div>
                            <span class="block font-medium">Price/Pax</span>
                            <span class="text-neutral-500 ">₱${(property.packagePrice / property.maxCapacity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div>
                            <p class="block font-semibold">Status</p>
                            <div class="status ${property.status === 'Active' ? 'green' : 'red'} !p-1 inline-block w-fit">
                                <span>${property.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        propertiesContainer.appendChild(propertyCard);
    });
}

// Run on page load
window.addEventListener('DOMContentLoaded', getAllProperties);

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('property-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim().toLowerCase();
            const filtered = allProperties.filter(p =>
                p.name && p.name.toLowerCase().includes(value)
            );
            
            // Log property search audit if search term is not empty
            if (value && value.length > 0) {
                try {
                    if (window.AuditTrailFunctions) {
                        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                        const userId = userData.userId || userData.user_id || 'unknown';
                        const userType = userData.role || 'admin';
                        window.AuditTrailFunctions.logPropertySearch(userId, userType).catch(auditError => {
                            console.error('Audit trail error:', auditError);
                        });
                    }
                } catch (auditError) {
                    console.error('Audit trail error:', auditError);
                }
            }
            
            // Ensure properties container is visible when searching
            const skeletonContainer = document.getElementById('skeleton-container');
            const propertiesContainer = document.getElementById('properties-container');
            
            if (skeletonContainer) skeletonContainer.style.display = 'none';
            if (propertiesContainer) propertiesContainer.style.display = 'grid';
            
            renderProperties(filtered);
        });
    }
});