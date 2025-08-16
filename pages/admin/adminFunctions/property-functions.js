// When a property is clicked the data should be passed to the property-view.html

// Fetch and display properties in the property list grid

let allProperties = []; // Store fetched properties for searching

async function getAllProperties() {
    try {
        const response = await fetch('https://betcha-api.onrender.com/property/display');
        const data = await response.json();
        if (Array.isArray(data)) {
            allProperties = data; // Save for search
            renderProperties(allProperties);
        }
    } catch (error) {
        console.error('Failed to fetch properties:', error);
    }
}

function renderProperties(properties) {
    // Find the grid container for properties
    const grid = document.querySelector('.grid.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4.h-full');
    if (!grid) return;
    grid.innerHTML = '';

    properties.forEach(property => {
        const propertyCard = document.createElement('a');
        propertyCard.href = `property-view.html?id=${property._id}`;
        propertyCard.className = "relative";

        propertyCard.innerHTML = `
            <div class="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col group
                transition-all duration-300 ease-in-out
                hover:shadow-lg ">
                <!-- Image (placeholder if not available) -->
                <div class="w-full h-38 md:h-56 overflow-hidden">
                    <img src="/public/images/unit01.jpg" class="w-full h-full object-cover object-center bg-neutral-300
                        transition-all duration-300 ease-in-out
                        group-hover:scale-105">
                </div>
                <div class="p-5">
                    <!-- Title + Address -->
                    <div>
                        <p class="text-xl font-semibold text-primary-text mb-1 font-manrope
                            transition-all duration-300 ease-in-out
                            group-hover:text-primary">${property.name}</p>
                        <div class="flex items-center w-full gap-2 mb-2.5">
                            <svg class="w-auto h-3.5 fill-neutral-500" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 0C2.68628 0 0 2.86538 0 6.4C9.53674e-07 9.93458 3 12.8 6 16C9 12.8 12 9.93458 12 6.4C12 2.86538 9.31371 1.69648e-07 6 0ZM6 3.55555C7.4202 3.55555 8.57143 4.74946 8.57143 6.22221C8.57143 7.69501 7.4202 8.88888 6 8.88888C4.5798 8.88888 3.42857 7.69501 3.42857 6.22221C3.42857 4.74946 4.5798 3.55555 6 3.55555Z" />
                            </svg>
                            <p class="text-neutral-500 text-sm font-inter">${property.address}, ${property.city}</p>
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
        grid.appendChild(propertyCard);
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
            renderProperties(filtered);
        });
    }
});