//refractor or clean the code if possible

// ==================== CONSTANTS & GLOBALS ====================
const API_BASE_URL = '/api';
let currentPropertyId = null;
let currentPropertyImages = [];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Property Edit Functions - DOM loaded!');
    
    const propertyId = getPropertyIdFromUrl();
    if (propertyId) {
        initializePropertyEdit(propertyId);
    } else {
        console.log('No property ID provided. Initializing form components for manual testing.');
        initializeFormComponents();
    }
});

// ==================== UTILITY FUNCTIONS ====================
function getPropertyIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type}`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => messageEl.remove(), 5000);
}

function showErrorMessage(message) {
    showMessage(message, 'error');
    console.error('❌', message);
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
    console.log('✅', message);
}

function handleError(message, error = null) {
    if (error) console.error('Error:', error);
    showErrorMessage(message);
}

// ==================== API FUNCTIONS ====================
class PropertyAPI {
    static async fetchProperty(propertyId) {
        try {
            const response = await fetch(`${API_BASE_URL}/property/display/${propertyId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to fetch property: ${error.message}`);
        }
    }

    static async updateProperty(propertyId, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/property/update/${propertyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to update property: ${error.message}`);
        }
    }

    static async uploadImages(propertyId, files) {
        try {
            const formData = new FormData();
            files.forEach(file => formData.append('photos', file));

            const response = await fetch(`${API_BASE_URL}/property/update/photos/${propertyId}`, {
                method: 'PATCH',
                body: formData
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to upload images: ${error.message}`);
        }
    }

    static async deleteImage(imageUrl) {
        try {
            console.log('🗑️ Deleting image with URL:', imageUrl);
            console.log('🆔 Using property ID:', currentPropertyId);
            
            const response = await fetch(`${API_BASE_URL}/property/photos/delete/${currentPropertyId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    photoUrl: imageUrl
                })
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            console.log('✅ Image deleted successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to delete image:', error);
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }
}

// ==================== MAIN INITIALIZATION ====================
async function initializePropertyEdit(propertyId) {
    try {
        currentPropertyId = propertyId;
        
        // Fetch and populate property data
        const propertyData = await PropertyAPI.fetchProperty(propertyId);
        populateForm(propertyData);
        
        // Initialize form functionality
        initializeFormComponents();
        
        console.log('✅ Property edit initialized successfully');
    } catch (error) {
        handleError('Failed to load property data for editing', error);
    }
}

// ==================== FORM POPULATION ====================
function populateForm(data) {
    populateBasicInfo(data);
    populateImages(data.photoLinks);
    populateAmenities(data.amenities, data.otherAmenities);
    populateMapLink(data.mapLink);
    storePropertyId(data._id);
}

function populateBasicInfo(data) {
    const fields = {
        'input-prop-name': data.name,
        'input-prop-address': data.address,
        'input-prop-desc': data.description,
        'input-prop-packCap': data.packageCapacity,
        'input-prop-maxCap': data.maxCapacity,
        'input-prop-packPrice': data.packagePrice,
        'input-prop-rsrvFee': data.reservationFee,
        'input-prop-addPaxPrice': data.additionalPax,
        'input-prop-discount': data.discount,
        'input-prop-mapLink': data.mapLink
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && value !== undefined) {
            element.value = value;
        }
    });

    // Populate dropdowns
    populateDropdowns(data);
    
    // Populate time fields
    populateTimeFields(data);
}

function populateDropdowns(data) {
    // Populate category dropdown
    if (data.category) {
        const categoryButton = document.getElementById('categoryDropdownBtn');
        const selectedCategory = document.getElementById('selectedCategory');
        if (categoryButton && selectedCategory) {
            selectedCategory.textContent = data.category;
        }
    }
    
    // Populate status dropdown
    if (data.status) {
        const statusButton = document.getElementById('statusDropdownBtn');
        const selectedStatus = document.getElementById('selectedStatus');
        if (statusButton && selectedStatus) {
            selectedStatus.textContent = data.status;
        }
    }
}

function populateTimeFields(data) {
    // Populate check-in time
    if (data.timeIn) {
        const checkInTimeText = document.getElementById('checkInTimeText');
        const checkInTimeInput = document.getElementById('checkInTimeInput');
        if (checkInTimeText) checkInTimeText.textContent = data.timeIn;
        if (checkInTimeInput) checkInTimeInput.value = data.timeIn;
    }
    
    // Populate check-out time
    if (data.timeOut) {
        const checkOutTimeText = document.getElementById('checkOutTimeText');
        const checkOutTimeInput = document.getElementById('checkOutTimeInput');
        if (checkOutTimeText) checkOutTimeText.textContent = data.timeOut;
        if (checkOutTimeInput) checkOutTimeInput.value = data.timeOut;
    }
}

function populateDropdown(type, selectedValue) {
    if (!selectedValue) return;

    const displayElement = document.getElementById(`${type}-display`);
    const inputElement = document.getElementById(`input-prop-${type}`);
    
    if (displayElement) displayElement.textContent = selectedValue;
    if (inputElement) inputElement.value = selectedValue;
}

function populateTime(type, selectedTime) {
    if (!selectedTime) return;

    const displayElement = document.getElementById(`${type}-display`);
    const inputElement = document.getElementById(`input-prop-${type}`);
    
    if (displayElement) displayElement.textContent = selectedTime;
    if (inputElement) inputElement.value = selectedTime;
}

function populateImages(photoLinks) {
    if (!photoLinks || photoLinks.length === 0) return;

    currentPropertyImages = photoLinks;
    
    // Update main gallery display
    const photoSection = document.getElementById('PhotosSection');
    if (photoSection) {
        updateGalleryDisplay(photoLinks);
    }
}

function updateGalleryDisplay(images) {
    const photoSection = document.getElementById('PhotosSection');
    if (!photoSection || !images.length) return;

    // Clear existing content
    photoSection.innerHTML = '';

    // Create main image
    const mainImage = document.createElement('div');
    mainImage.className = 'rounded-2xl bg-cover bg-center h-full col-span-1 sm:col-span-3';
    mainImage.style.backgroundImage = `url(${images[0]})`;
    photoSection.appendChild(mainImage);

    // Create side images if available
    if (images.length > 1) {
        const sideContainer = document.createElement('div');
        sideContainer.className = 'hidden sm:grid sm:col-span-2 sm:grid-rows-2 sm:gap-3 h-full';
        
        for (let i = 1; i < Math.min(3, images.length); i++) {
            const sideImage = document.createElement('div');
            sideImage.className = 'rounded-2xl bg-cover bg-center';
            sideImage.style.backgroundImage = `url(${images[i]})`;
            sideContainer.appendChild(sideImage);
        }
        
        photoSection.appendChild(sideContainer);
    }

    // Add edit button
    addEditButton(photoSection);
}

function addEditButton(container) {
    const editButton = document.createElement('button');
    editButton.className = `absolute cursor-pointer bottom-4 right-4 !px-2 !py-1 bg-white rounded-full shadow-sm 
                           flex gap-2 items-center group hover:bg-primary hover:scale-105 hover:shadow-lg 
                           active:scale-95 transition-all duration-300 ease-in-out md:!py-3.5 md:!px-6`;
    editButton.setAttribute('data-modal-target', 'editGalleryModal');
    editButton.innerHTML = `
        <span class="text-xs font-inter group-hover:text-white transition-all duration-500 ease-in-out md:text-sm">
            Edit image
        </span>
    `;
    container.appendChild(editButton);
}

function populateAmenities(amenities, otherAmenities) {
    console.log('Populating amenities:', amenities, 'Other amenities:', otherAmenities);
    
    // Clear existing selections
    clearAmenitySelections();
    
    // Amenity mapping from data values to checkbox values
    const amenityMapping = {
        'wifi': 'wifi',
        'stove': 'stove', 
        'bathtub': 'bathtub',
        'washer': 'washer',
        'aircon': 'aircon',
        'bedset': 'bedset',
        'hanger': 'hanger',
        'hairDryer': 'hairDryer',
        'iron': 'iron',
        'extraPillowBlanket': 'extraPillowBlanket',
        'towel': 'towel',
        'ref': 'ref',
        'microwave': 'microwave',
        'oven': 'oven',
        'coffeeMaker': 'coffeeMaker',
        'toaster': 'toaster',
        'PotsPans': 'PotsPans',
        'spices': 'spices',
        'dishesCutlery': 'dishesCutlery',
        'shower': 'shower',
        'soap': 'soap',
        'toilet': 'toilet',
        'toiletPaper': 'toiletPaper',
        'dryer': 'dryer'
    };
    
    // Populate standard amenities
    if (amenities && Array.isArray(amenities)) {
        amenities.forEach(amenity => {
            // Try to find checkbox by mapped value or original value
            const mappedValue = amenityMapping[amenity] || amenity;
            let checkbox = document.querySelector(`input[type="checkbox"][value="${mappedValue}"]`);
            
            // If not found, try searching by name attribute
            if (!checkbox) {
                checkbox = document.querySelector(`input[name*="[]"][value="${mappedValue}"]`);
            }
            
            if (checkbox) {
                checkbox.checked = true;
                console.log(`✅ Checked amenity: ${amenity} -> ${mappedValue}`);
            } else {
                console.log(`❌ Amenity checkbox not found: ${amenity}`);
                // Log all available checkboxes for debugging
                const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
                console.log('Available checkboxes:', Array.from(allCheckboxes).map(cb => cb.value));
            }
        });
    }
    
    // Handle other amenities if they exist
    if (otherAmenities && Array.isArray(otherAmenities) && otherAmenities.length > 0) {
        console.log('Other amenities found:', otherAmenities);
        // Handle custom amenities if needed
    }

    // Update the visual display
    updateAmenitiesDisplay(amenities || []);
}

// Update the amenities display section
function updateAmenitiesDisplay(amenities) {
    console.log('Updating amenities display with:', amenities);
    
    // Find the amenities container using a more robust approach
    let container = null;
    
    // First try: Find by looking for the "Ammenities" text
    const amenitiesHeaders = document.querySelectorAll('p');
    for (let header of amenitiesHeaders) {
        if (header.textContent.trim().includes('Ammenities')) {
            // Get the parent container and find the UL within it
            const parent = header.closest('.bg-white');
            if (parent) {
                container = parent.querySelector('ul');
                break;
            }
        }
    }
    
    // Second try: Direct search by structure
    if (!container) {
        const amenitiesSections = document.querySelectorAll('.bg-white');
        for (let section of amenitiesSections) {
            const amenitiesText = section.querySelector('p');
            if (amenitiesText && amenitiesText.textContent.includes('Ammenities')) {
                container = section.querySelector('ul');
                break;
            }
        }
    }
    
    if (!container) {
        console.warn('Amenities display container not found. Available sections:', 
                    document.querySelectorAll('.bg-white').length);
        return;
    }
    
    console.log('Found amenities container:', container);
    
    // Clear existing display
    container.innerHTML = '';
    
    // If no amenities, show a message
    if (!amenities || amenities.length === 0) {
        container.innerHTML = `
            <li class="w-full p-2">
                <div class="flex gap-3 items-center">
                    <span class="font-inter text-neutral-400 italic">No amenities selected</span>
                </div>
            </li>
        `;
        return;
    }
    
    // Amenity display mapping
    const amenityDisplayMap = {
        'wifi': { name: 'Wifi', icon: 'M11.9999 21C11.2999 21 10.7082 20.7583 10.2249 20.275C9.74152 19.7917 9.49985 19.2 9.49985 18.5C9.49985 17.8 9.74152 17.2083 10.2249 16.725C10.7082 16.2417 11.2999 16 11.9999 16C12.6999 16 13.2915 16.2417 13.7749 16.725C14.2582 17.2083 14.4999 17.8 14.4999 18.5C14.4999 19.2 14.2582 19.7917 13.7749 20.275C13.2915 20.7583 12.6999 21 11.9999 21ZM11.9999 10C13.2499 10 14.4375 10.2 15.5629 10.6C16.6882 11 17.7089 11.55 18.6249 12.25C18.9582 12.5 19.1292 12.8293 19.1379 13.238C19.1465 13.6467 19.0005 14.0007 18.6999 14.3C18.4165 14.5833 18.0665 14.7293 17.6499 14.738C17.2332 14.7467 16.8582 14.634 16.5249 14.4C15.8915 13.9667 15.1915 13.625 14.4249 13.375C13.6582 13.125 12.8499 13 11.9999 13C11.1499 13 10.3415 13.125 9.57485 13.375C8.80818 13.625 8.10818 13.9667 7.47485 14.4C7.14152 14.6333 6.76652 14.7417 6.34985 14.725C5.93318 14.7083 5.58318 14.5583 5.29985 14.275C5.01652 13.975 4.87485 13.621 4.87485 13.213C4.87485 12.805 5.04152 12.4757 5.37485 12.225C6.29152 11.525 7.31252 10.979 8.43785 10.587C9.56318 10.195 10.7505 9.99933 11.9999 10ZM11.9999 4C14.0832 4 16.0459 4.34167 17.8879 5.025C19.7299 5.70833 21.3839 6.675 22.8499 7.925C23.1832 8.20833 23.3582 8.55833 23.3749 8.975C23.3915 9.39167 23.2499 9.75 22.9499 10.05C22.6665 10.3333 22.3165 10.4793 21.8999 10.488C21.4832 10.4967 21.1082 10.3673 20.7749 10.1C19.5749 9.11667 18.2292 8.35433 16.7379 7.813C15.2465 7.27167 13.6672 7.00067 11.9999 7C10.3325 6.99933 8.75352 7.27033 7.26285 7.813C5.77218 8.35567 4.42618 9.118 3.22485 10.1C2.89152 10.3667 2.51652 10.496 2.09985 10.488C1.68318 10.48 1.33318 10.334 1.04985 10.05C0.749851 9.75 0.608184 9.39167 0.624851 8.975C0.641518 8.55833 0.816518 8.20833 1.14985 7.925C2.61652 6.675 4.27085 5.70833 6.11285 5.025C7.95485 4.34167 9.91718 4 11.9999 4Z' },
        'aircon': { name: 'Air conditioning', icon: 'M18.0002 4C18.7959 4 19.5589 4.31607 20.1215 4.87868C20.6842 5.44129 21.0002 6.20435 21.0002 7V12C21.0002 12.7956 20.6842 13.5587 20.1215 14.1213C19.5589 14.6839 18.7959 15 18.0002 15H6.00023C5.20458 15 4.44152 14.6839 3.87891 14.1213C3.3163 13.5587 3.00023 12.7956 3.00023 12V7C3.00023 6.20435 3.3163 5.44129 3.87891 4.87868C4.44152 4.31607 5.20458 4 6.00023 4H18.0002ZM18.0002 6H6.00023C5.7553 6.00003 5.51889 6.08996 5.33586 6.25272C5.15282 6.41547 5.03589 6.63975 5.00723 6.883L5.00023 7V12C5.00026 12.2449 5.09019 12.4813 5.25294 12.6644C5.4157 12.8474 5.63998 12.9643 5.88323 12.993L6.00023 13V11C6.00026 10.7551 6.09019 10.5187 6.25294 10.3356C6.4157 10.1526 6.63998 10.0357 6.88323 10.007L7.00023 10H17.0002C17.2452 10 17.4816 10.09 17.6646 10.2527C17.8476 10.4155 17.9646 10.6397 17.9932 10.883L18.0002 11V13C18.2452 13 18.4816 12.91 18.6646 12.7473C18.8476 12.5845 18.9646 12.3603 18.9932 12.117L19.0002 12V7C19.0002 6.75507 18.9103 6.51866 18.7475 6.33563C18.5848 6.15259 18.3605 6.03566 18.1172 6.007L18.0002 6ZM16.0002 12H8.00023V13H16.0002V12ZM16.0002 7C16.2654 7 16.5198 7.10536 16.7073 7.29289C16.8949 7.48043 17.0002 7.73478 17.0002 8C17.0002 8.26522 16.8949 8.51957 16.7073 8.70711C16.5198 8.89464 16.2654 9 16.0002 9C15.735 9 15.4807 8.89464 15.2931 8.70711C15.1056 8.51957 15.0002 8.26522 15.0002 8C15.0002 7.73478 15.1056 7.48043 15.2931 7.29289C15.4807 7.10536 15.735 7 16.0002 7ZM10.0002 16C10.2654 16 10.5198 16.1054 10.7073 16.2929C10.8949 16.4804 11.0002 16.7348 11.0002 17V18.172C10.9998 18.9672 10.6836 19.7298 10.1212 20.292L9.70723 20.707C9.51863 20.8892 9.26603 20.99 9.00383 20.9877C8.74163 20.9854 8.49082 20.8802 8.30541 20.6948C8.12 20.5094 8.01483 20.2586 8.01256 19.9964C8.01028 19.7342 8.11107 19.4816 8.29323 19.293L8.70723 18.879C8.89478 18.6915 9.00017 18.4372 9.00023 18.172V17C9.00023 16.7348 9.10559 16.4804 9.29312 16.2929C9.48066 16.1054 9.73501 16 10.0002 16ZM13.0002 17C13.0002 16.7348 13.1056 16.4804 13.2931 16.2929C13.4807 16.1054 13.735 16 14.0002 16C14.2654 16 14.5198 16.1054 14.7073 16.2929C14.8949 16.4804 15.0002 16.7348 15.0002 17V18.172C15.0003 18.4372 15.1057 18.6915 15.2932 18.879L15.7072 19.293C15.8027 19.3852 15.8789 19.4956 15.9313 19.6176C15.9837 19.7396 16.0113 19.8708 16.0125 20.0036C16.0136 20.1364 15.9883 20.2681 15.9381 20.391C15.8878 20.5138 15.8135 20.6255 15.7196 20.7194C15.6257 20.8133 15.5141 20.8875 15.3912 20.9378C15.2683 20.9881 15.1366 21.0134 15.0038 21.0123C14.871 21.0111 14.7398 20.9835 14.6178 20.9311C14.4958 20.8787 14.3855 20.8025 14.2932 20.707L13.8792 20.293C13.3166 19.7305 13.0004 18.9676 13.0002 18.172V17ZM6.00023 16C6.26545 16 6.5198 16.1054 6.70734 16.2929C6.89487 16.4804 7.00023 16.7348 7.00023 17V17.613C7.00012 18.0328 6.86794 18.4418 6.62242 18.7823C6.3769 19.1228 6.03048 19.3774 5.63223 19.51L4.31623 19.949C4.06454 20.0328 3.78986 20.0132 3.55263 19.8945C3.3154 19.7758 3.13504 19.5677 3.05123 19.316C2.96742 19.0643 2.98703 18.7896 3.10574 18.5524C3.22445 18.3152 3.43254 18.1348 3.68423 18.051L5.00023 17.613V17C5.00023 16.7348 5.10559 16.4804 5.29312 16.2929C5.48066 16.1054 5.73501 16 6.00023 16ZM17.0002 17C17.0002 16.7348 17.1056 16.4804 17.2931 16.2929C17.4807 16.1054 17.735 16 18.0002 16C18.2654 16 18.5198 16.1054 18.7073 16.2929C18.8949 16.4804 19.0002 16.7348 19.0002 17V17.613L20.3162 18.051C20.5679 18.1348 20.776 18.3152 20.8947 18.5524C21.0134 18.7896 21.033 19.0643 20.9492 19.316C20.8654 19.5677 20.6851 19.7758 20.4478 19.8945C20.2106 20.0132 19.9359 20.0328 19.6842 19.949L18.3682 19.509C17.9703 19.3765 17.6241 19.1222 17.3786 18.7821C17.1331 18.4421 17.0008 18.0334 17.0002 17.614V17Z' },
        'stove': { name: 'Stove', icon: 'M12 2C13.1 2 14 2.9 14 4V6H10V4C10 2.9 10.9 2 12 2ZM21 9V7L20 8H19V6C19 5.45 18.55 5 18 5S17 5.45 17 6V8H16L15 7V9H21ZM9 7L8 8H7V6C7 5.45 6.55 5 6 5S5 5.45 5 6V8H4L3 7V9H9ZM2 10V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V10H2ZM4 12H8V16H4V12ZM10 12H14V16H10V12ZM16 12H20V16H16V12Z' },
        'bathtub': { name: 'Bathtub', icon: 'M2 12C2 11.45 2.45 11 3 11S4 11.45 4 12V13H2V12ZM20 12C20 11.45 20.45 11 21 11S22 11.45 22 12V13H20V12ZM6 12V9C6 7.9 6.9 7 8 7H16C17.1 7 18 7.9 18 9V12H20V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V12H6ZM8 9V12H16V9H8Z' },
        'washer': { name: 'Washer', icon: 'M12 2C13.1 2 14 2.9 14 4V6H10V4C10 2.9 10.9 2 12 2ZM18 8V6C18 4.9 17.1 4 16 4H8C6.9 4 6 4.9 6 6V8C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 18C9.79 18 8 16.21 8 14S9.79 10 12 10 16 11.79 16 14 14.21 18 12 18ZM12 12C10.9 12 10 12.9 10 14S10.9 16 12 16 14 15.1 14 14 13.1 12 12 12Z' },
        'bedset': { name: 'Complete bed', icon: 'M2 18V13C2 12.55 2.09167 12.1417 2.275 11.775C2.45833 11.4083 2.7 11.0833 3 10.8V8C3 7.16667 3.29167 6.45833 3.875 5.875C4.45833 5.29167 5.16667 5 6 5H10C10.3833 5 10.7417 5.071 11.075 5.213C11.4083 5.355 11.7167 5.55067 12 5.8C12.2833 5.55 12.5917 5.35433 12.925 5.213C13.2583 5.07167 13.6167 5.00067 14 5H18C18.8333 5 19.5417 5.29167 20.125 5.875C20.7083 6.45833 21 7.16667 21 8V10.8C21.3 11.0833 21.5417 11.4083 21.725 11.775C21.9083 12.1417 22 12.55 22 13V18C22 18.2833 21.904 18.521 21.712 18.713C21.52 18.905 21.2827 19.0007 21 19C20.7173 18.9993 20.48 18.9033 20.288 18.712C20.096 18.5207 20 18.2833 20 18V17H4V18C4 18.2833 3.904 18.521 3.712 18.713C3.52 18.905 3.28267 19.0007 3 19C2.71733 18.9993 2.48 18.9033 2.288 18.712C2.096 18.5207 2 18.2833 2 18ZM13 10H19V8C19 7.71667 18.904 7.47933 18.712 7.288C18.52 7.09667 18.2827 7.00067 18 7H14C13.7167 7 13.4793 7.096 13.288 7.288C13.0967 7.48 13.0007 7.71733 13 8V10ZM5 10H11V8C11 7.71667 10.904 7.47933 10.712 7.288C10.52 7.09667 10.2827 7.00067 10 7H6C5.71667 7 5.47933 7.096 5.288 7.288C5.09667 7.48 5.00067 7.71733 5 8V10Z' },
        'hanger': { name: 'Hangers', icon: 'M14.0002 6C14.0002 5.46957 13.7895 4.96086 13.4144 4.58579C13.0393 4.21071 12.5306 4 12.0002 4C11.4698 4 10.961 4.21071 10.586 4.58579C10.2109 4.96086 10.0002 5.46957 10.0002 6C10.0002 7.667 10.6702 9 12.0002 10H11.9922M11.9922 10L19.9632 14.428C20.2751 14.6012 20.535 14.8548 20.716 15.1623C20.8969 15.4698 20.9923 15.8202 20.9922 16.177V17C20.9922 17.5304 20.7815 18.0391 20.4064 18.4142C20.0313 18.7893 19.5226 19 18.9922 19H4.99219C4.46175 19 3.95305 18.7893 3.57797 18.4142C3.2029 18.0391 2.99219 17.5304 2.99219 17V16.177C2.99209 15.8202 3.08746 15.4698 3.2684 15.1623C3.44933 14.8548 3.70925 14.6012 4.02119 14.428L11.9922 10Z' },
        'hairDryer': { name: 'Hair Dryer', icon: 'M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10ZM18 11C18 11 11 14 8 14C6.4087 14 4.88258 13.3679 3.75736 12.2426C2.63214 11.1174 2 9.5913 2 8C2 6.4087 2.63214 4.88258 3.75736 3.75736C4.88258 2.63214 6.4087 2 8 2C11 2 18 5 18 5M18 11V5M18 11L22 13V3L18 5M7 13.9L7.8 19C7.9 19.5 8.4 20 9 20H11C11.6 20 11.9 19.6 11.8 19L10.9 13.5M11.64 18C11.64 18 14.94 16 18.94 16C19.4704 16 19.9791 16.2107 20.3542 16.5858C20.7293 16.9609 20.94 17.4696 20.94 18C20.94 18.5304 20.7293 19.0391 20.3542 19.4142C19.9791 19.7893 19.4704 20 18.94 20H17C16.4696 20 15.9609 20.2107 15.5858 20.5858C15.2107 20.9609 15 21.4696 15 22' }
    };
    
    // Add each amenity to the display
    amenities.forEach(amenity => {
        const displayInfo = amenityDisplayMap[amenity];
        if (displayInfo) {
            const listItem = document.createElement('li');
            listItem.className = 'w-full p-2';
            listItem.innerHTML = `
                <div class="flex gap-3 items-center">
                    <svg class="h-5 fill-primary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="${displayInfo.icon}"/>
                    </svg>
                    <span class="font-inter text-primary-text">${displayInfo.name}</span>
                </div>
            `;
            container.appendChild(listItem);
        } else {
            // Fallback for unmapped amenities
            const listItem = document.createElement('li');
            listItem.className = 'w-full p-2';
            listItem.innerHTML = `
                <div class="flex gap-3 items-center">
                    <span class="font-inter text-primary-text">${amenity}</span>
                </div>
            `;
            container.appendChild(listItem);
        }
    });
    
    console.log('Amenities display updated successfully');
}

function clearAmenitySelections() {
    // Clear all checkboxes in the amenities modal
    document.querySelectorAll('#editAmmenitiesModal input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function findAmenityCheckbox(amenityName) {
    return document.querySelector(`input[name="amenities"][value="${amenityName}"]`);
}

function populateCustomAmenities(customAmenities) {
    const container = document.querySelector('.custom-amenities-container');
    if (!container) return;

    customAmenities.forEach(amenity => {
        addCustomAmenityToContainer(container, amenity);
    });
}

function addCustomAmenityToContainer(container, amenityText) {
    const amenityElement = document.createElement('div');
    amenityElement.className = 'custom-amenity-item';
    amenityElement.innerHTML = `
        <span>${amenityText}</span>
        <button type="button" onclick="removeCustomAmenity(this)" class="remove-btn">×</button>
    `;
    container.appendChild(amenityElement);
}

function populateMapLink(mapLink) {
    const mapInput = document.getElementById('input-prop-map');
    if (mapInput && mapLink) {
        mapInput.value = mapLink;
    }
}

function storePropertyId(propertyId) {
    const hiddenInput = document.getElementById('property-id-hidden');
    if (hiddenInput) {
        hiddenInput.value = propertyId;
    }
}

// ==================== FORM COMPONENTS INITIALIZATION ====================
function initializeFormComponents() {
    initializeModalSystem();
    initializeDropdowns();
    initializeImageEditing();
    initializeSaveAndDiscardFunctionality();
}

function initializeModalSystem() {
    // Modal triggers
    document.querySelectorAll('[data-modal-target]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal-target');
            showModal(modalId);
            
            if (modalId === 'editGalleryModal') {
                initializeImageEditing();
            } else if (modalId === 'editAmmenitiesModal') {
                // Let modal.js handle Alpine.js initialization for amenities modal
                console.log('Amenities modal opened - Alpine.js handled by modal.js');
            }
        });
    });

    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = closeBtn.closest('.modal');
            if (modal) hideModal(modal.id);
        });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal(modal.id);
        });
    });
}

function initializeDropdowns() {
    setupDropdown('category', ['Hotel', 'Apartment', 'Resort', 'Villa']);
    setupDropdown('status', ['Available', 'Unavailable', 'Maintenance']);
    setupTimeDropdowns();
}

function setupDropdown(type, options) {
    const button = document.getElementById(`${type}-btn`);
    const list = document.getElementById(`${type}-list`);
    const input = document.getElementById(`input-prop-${type}`);
    const display = document.getElementById(`${type}-display`);

    if (!button || !list || !input || !display) return;

    // Toggle dropdown
    button.addEventListener('click', () => {
        list.classList.toggle('hidden');
    });

    // Handle option selection
    list.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const value = e.target.textContent.trim();
            input.value = value;
            display.textContent = value;
            list.classList.add('hidden');
        }
    });
}

function setupTimeDropdowns() {
    setupTimeDropdown('checkIn');
    setupTimeDropdown('checkOut');
}

function setupTimeDropdown(type) {
    const button = document.getElementById(`${type}-btn`);
    const list = document.getElementById(`${type}-list`);
    const input = document.getElementById(`input-prop-${type}`);
    const display = document.getElementById(`${type}-display`);

    if (!button || !list || !input || !display) return;

    // Generate time options if not already present
    if (list.children.length === 0) {
        generateTimeOptions().forEach(time => {
            const li = document.createElement('li');
            li.textContent = time;
            li.className = 'cursor-pointer hover:bg-gray-100 p-2';
            list.appendChild(li);
        });
    }

    // Toggle dropdown
    button.addEventListener('click', () => {
        list.classList.toggle('hidden');
    });

    // Handle option selection
    list.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const value = e.target.textContent.trim();
            input.value = value;
            display.textContent = value;
            list.classList.add('hidden');
        }
    });
}

function generateTimeOptions() {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            times.push(timeString);
        }
    }
    return times;
}

// ==================== IMAGE UPLOAD FUNCTIONALITY ====================
let selectedImageFiles = [];
let imageUploadInitialized = false; // Prevent multiple initialization

function initializeImageEditing() {
    if (imageUploadInitialized) {
        console.log('Image upload already initialized, skipping...');
        return;
    }
    
    const fileInput = document.querySelector('#editGalleryModal input[type="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', handleImageSelection);
        imageUploadInitialized = true;
        console.log('Image upload functionality initialized');
        
        // Populate existing images in the modal
        populateGalleryModal();
    } else {
        console.warn('File input not found in edit gallery modal');
    }
}

function populateGalleryModal() {
    console.log('📸 Populating gallery modal with existing images...');
    const gallery = document.querySelector('#editGalleryModal .grid');
    
    if (!gallery) {
        console.warn('Gallery container not found in modal');
        return;
    }

    if (!currentPropertyImages || currentPropertyImages.length === 0) {
        console.log('No existing images to display');
        return;
    }

    // Clear existing images (except file input)
    const existingImages = gallery.querySelectorAll('.existing-image');
    existingImages.forEach(img => img.remove());

    console.log('📸 Displaying', currentPropertyImages.length, 'existing images');

    currentPropertyImages.forEach((imageUrl, index) => {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'existing-image relative group rounded-lg overflow-hidden bg-gray-100';
        
        imageContainer.innerHTML = `
            <img src="${imageUrl}" 
                 alt="Property image ${index + 1}" 
                 class="w-full h-32 object-cover">
            <button onclick="deleteExistingImage('${imageUrl}', this)" 
                    class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        gallery.appendChild(imageContainer);
    });
}

async function deleteExistingImage(imageUrl, buttonElement) {
    if (!imageUrl) {
        console.error('Cannot delete image: No image URL provided');
        showErrorMessage('Cannot delete image: Invalid image URL');
        return;
    }

    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }

    try {
        console.log('🗑️ Deleting image:', imageUrl);
        
        // Show loading state
        buttonElement.innerHTML = `
            <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;
        
        // Call delete API with the full image URL
        await PropertyAPI.deleteImage(imageUrl);
        
        // Remove from current property images array
        currentPropertyImages = currentPropertyImages.filter(url => url !== imageUrl);
        
        // Remove the image container from DOM
        const imageContainer = buttonElement.closest('.existing-image');
        if (imageContainer) {
            imageContainer.remove();
        }
        
        // Update the main gallery display
        updateGalleryDisplay(currentPropertyImages);
        
        showSuccessMessage('Image deleted successfully!');
        
    } catch (error) {
        console.error('Failed to delete image:', error);
        showErrorMessage('Failed to delete image');
        
        // Reset button state
        buttonElement.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        `;
    }
}

// Make function globally accessible for onclick handlers
window.deleteExistingImage = deleteExistingImage;

function handleImageSelection(e) {
    const files = Array.from(e.target.files);
    console.log('Files selected:', files.length);
    console.log('File details:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    // Store files for later upload
    selectedImageFiles = [...selectedImageFiles, ...files];
    console.log('Total files in queue:', selectedImageFiles.length);
    
    // Show preview
    displayImagePreviews(files);
}

function displayImagePreviews(files) {
    const gallery = document.querySelector('#editGalleryModal .grid');
    if (!gallery) {
        console.warn('Image gallery container not found');
        return;
    }

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageElement = document.createElement('div');
                imageElement.className = 'relative group h-32 md:h-48';
                imageElement.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}" class="w-full h-full object-cover rounded-lg">
                    <button type="button" onclick="removeImagePreview(this, '${file.name}')" 
                            class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
                        ×
                    </button>
                    <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded max-w-[80%] truncate">
                        ${file.name}
                    </div>
                `;
                gallery.appendChild(imageElement);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImagePreview(button, fileName) {
    // Remove from selectedImageFiles array
    selectedImageFiles = selectedImageFiles.filter(file => file.name !== fileName);
    
    // Remove the preview element
    button.closest('.relative').remove();
    
    console.log('Removed image:', fileName, 'Remaining files:', selectedImageFiles.length);
}

// Make function globally accessible for onclick handlers
window.removeImagePreview = removeImagePreview;

async function uploadAllImages() {
    if (selectedImageFiles.length === 0) {
        console.log('No new images to upload');
        return;
    }

    try {
        console.log('📤 Uploading', selectedImageFiles.length, 'images...');
        
        const formData = new FormData();
        selectedImageFiles.forEach(file => {
            formData.append('photos', file);
        });

        // Try different API endpoint URLs
        const possibleUrls = [
            `/api/property/photos/append/${currentPropertyId}`,
            `/api/property/update/photos/${currentPropertyId}`,
            `/api/property/${currentPropertyId}/photos`,
            `/api/property/${currentPropertyId}/update/photos`,
            `/api/properties/${currentPropertyId}/photos`
        ];
        
        const possibleMethods = ['PATCH', 'POST', 'PUT'];
        
        let response = null;
        let lastError = null;
        
        // Try different URL and method combinations
        for (let urlIndex = 0; urlIndex < possibleUrls.length; urlIndex++) {
            for (let methodIndex = 0; methodIndex < possibleMethods.length; methodIndex++) {
                const uploadUrl = possibleUrls[urlIndex];
                const method = possibleMethods[methodIndex];
                
                try {
                    response = await fetch(uploadUrl, {
                        method: method,
                        body: formData
                    });
                    
                    if (response.ok) {
                        console.log(`✅ Success with ${method} ${uploadUrl}`);
                        break;
                    } else if (response.status !== 404 && response.status !== 405) {
                        // If it's not a "not found" or "method not allowed", investigate further
                        console.log(`⚠️ API Error: ${response.status} for ${method} ${uploadUrl}`);
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    if (urlIndex === 0 && methodIndex === 0) {
                        console.log(`🔄 Trying alternative endpoints...`);
                    }
                }
            }
            
            if (response && response.ok) {
                break;
            }
        }
        
        if (!response) {
            throw new Error(`All API attempts failed. Last error: ${lastError?.message}`);
        }

        console.log('📡 Response status:', response.status);
        
        let result = {};
        try {
            const responseText = await response.text();
            result = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.warn('⚠️ Failed to parse response as JSON');
        }

        if (response.ok) {
            console.log('✅ Images uploaded successfully');
            showSuccessMessage('Images uploaded successfully!');
            
            // Clear selected files after successful upload
            selectedImageFiles = [];
            
            // Clear previews
            const gallery = document.querySelector('#editGalleryModal .grid');
            if (gallery) {
                // Remove all preview elements except the file input label
                const previews = gallery.querySelectorAll('.relative.group');
                previews.forEach(preview => preview.remove());
            }
            
            // Refresh the property data to show new images
            await initializePropertyEdit(currentPropertyId);
            
        } else {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Image upload failed:', error);
        throw new Error(`Failed to upload images: ${error.message}`);
    }
}

// ==================== SAVE & DISCARD FUNCTIONALITY ====================
function initializeSaveAndDiscardFunctionality() {
    // Save functionality
    const saveButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (saveButton) {
        saveButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateForm()) {
                showModal('confirmDetailsModal');
            }
        });
    }

    // Confirm button in modal
    const confirmButton = document.getElementById('confirmUpdateButton');
    if (confirmButton) {
        confirmButton.onclick = () => {
            hideModal('confirmDetailsModal');
            handlePropertyUpdate();
        };
    }

    // Discard functionality
    const discardButton = document.querySelector('[data-modal-target="discardDetailsModal"]');
    if (discardButton) {
        discardButton.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('discardDetailsModal');
        });
    }
}

async function handlePropertyUpdate() {
    try {
        if (!currentPropertyId) {
            throw new Error('Property ID not found');
        }

        const formData = collectFormData();
        const hasNewImages = selectedImageFiles.length > 0;
        
        console.log('🔄 Starting property update...');

        // Update property data first
        await PropertyAPI.updateProperty(currentPropertyId, formData);
        console.log('✅ Property data updated successfully');

        // Upload images if any (using simplified approach)
        if (hasNewImages) {
            console.log('📤 Uploading new images...');
            await uploadAllImages();
        }

        showSuccessMessage('Property updated successfully!');
        
    } catch (error) {
        handleError('Failed to update property', error);
    }
}

// ==================== FORM DATA COLLECTION ====================
function collectFormData() {
    const formData = {
        name: getValue('input-prop-name'),
        address: getValue('input-prop-address'),
        description: getValue('input-prop-desc'), // Fixed: was 'input-prop-description'
        packagePrice: parseFloat(getValue('input-prop-packPrice')) || 0, // Fixed: was 'input-prop-price'
        reservationFee: parseFloat(getValue('input-prop-rsrvFee')) || 0,
        additionalPaxPrice: parseFloat(getValue('input-prop-addPaxPrice')) || 0,
        discount: parseFloat(getValue('input-prop-discount')) || 0,
        packageCapacity: parseInt(getValue('input-prop-packCap')) || 1,
        maxCapacity: parseInt(getValue('input-prop-maxCap')) || 1, // Fixed: was 'input-prop-guests'
        amenities: collectAmenities(),
        otherAmenities: collectCustomAmenities(),
        mapLink: getValue('input-prop-mapLink') // Fixed: was 'input-prop-map'
    };
    
    return formData;
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

function collectAmenities() {
    const checkedAmenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked'))
        .map(checkbox => checkbox.value);
    return checkedAmenities;
}

function collectCustomAmenities() {
    // Try to get from Alpine.js data first
    if (window.Alpine) {
        const amenitiesModal = document.querySelector('#editAmmenitiesModal [x-data]');
        
        if (amenitiesModal && amenitiesModal._x_dataStack) {
            const alpineData = amenitiesModal._x_dataStack[0];
            
            if (alpineData && alpineData.customAmenities && Array.isArray(alpineData.customAmenities)) {
                return alpineData.customAmenities;
            }
        }
    }
    
    // Fallback to DOM elements
    const domAmenities = Array.from(document.querySelectorAll('.custom-amenity-item span'))
        .map(span => span.textContent.trim());
    
    // Also try to get from the display container
    const displayItems = Array.from(document.querySelectorAll('#other-amenities-display li'))
        .map(li => li.textContent.trim());
    
    return domAmenities.length > 0 ? domAmenities : displayItems;
}

// ==================== VALIDATION ====================
function validateForm() {
    const requiredFields = [
        { id: 'input-prop-name', label: 'Property Name' },
        { id: 'input-prop-address', label: 'Address' },
        { id: 'input-prop-desc', label: 'Description' },
        { id: 'input-prop-packPrice', label: 'Package Price' },
        { id: 'input-prop-maxCap', label: 'Max Capacity' }
    ];
    
    const missingFields = requiredFields.filter(field => {
        const element = document.getElementById(field.id);
        if (!element) {
            console.warn(`❌ Field element not found: ${field.id}`);
            return true;
        }
        return !element.value?.trim();
    }).map(field => field.label);

    if (missingFields.length > 0) {
        showErrorMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return false;
    }
    
    console.log('✅ Form validation passed');
    return true;
}

// ==================== MODAL UTILITIES ====================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

// DOM manipulation utilities
window.removeCustomAmenity = function(button) {
    button.closest('.custom-amenity-item').remove();
};

window.removeImage = function(button) {
    const imageElement = button.closest('.relative');
    const imageName = imageElement.querySelector('img').alt;
    
    // Remove from newImages array
    if (window.editGalleryData) {
        window.editGalleryData.newImages = window.editGalleryData.newImages.filter(
            img => img.name !== imageName
        );
    }
    
    imageElement.remove();
};

// ==================== ALPINE.JS AMENITIES HANDLER ====================
window.amenitiesHandler = function() {
    return {
        customAmenities: [],
        newAmenity: '',
        isLoading: false,
        
        addAmenity() {
            const amenity = this.newAmenity.trim();
            
            if (!amenity) {
                this.showError('Please enter an amenity name');
                return;
            }
            
            if (amenity.length > 50) {
                this.showError('Amenity name must be 50 characters or less');
                return;
            }
            
            // Check for duplicates (case-insensitive)
            const exists = this.customAmenities.some(existing => 
                existing.toLowerCase() === amenity.toLowerCase()
            );
            
            if (exists) {
                this.showError('This amenity has already been added');
                return;
            }
            
            // Add the amenity
            this.customAmenities.push(amenity);
            this.newAmenity = '';
            
            console.log('Added custom amenity:', amenity);
            console.log('Current custom amenities:', this.customAmenities);
        },
        
        removeAmenity(index) {
            if (index >= 0 && index < this.customAmenities.length) {
                const removed = this.customAmenities.splice(index, 1)[0];
                console.log('Removed custom amenity:', removed);
            }
        },
        
        showError(message) {
            // You can customize this to show errors in your preferred way
            console.error('Amenity error:', message);
            // Example: show in a toast or modal
            alert(message);
        },
        
        // Character count for the input
        get remainingChars() {
            return 50 - this.newAmenity.length;
        },
        
        // Check if add button should be disabled
        get canAdd() {
            return this.newAmenity.trim().length > 0 && 
                   this.newAmenity.length <= 50 && 
                   !this.isLoading;
        }
    };
};
