

const API_BASE = 'https://betcha-api.onrender.com';
const LANDING_GET_URL = `${API_BASE}/landing/display/68a735c07753114c9e87c793`;
const LANDING_PUT_URL = `${API_BASE}/landing/update/68a735c07753114c9e87c793`;
const PROPERTY_LIST_URL = `${API_BASE}/property/display`;

let landingPageData = null;
let allProperties = [];
let currentFeaturedIds = [];

let bannerTitle, bannerDescription, bannerImage, featuredUnitsContainer;

let editModal, titleInput, descriptionInput, fileInput, previewContainer, colorRadios, saveButton;

let propertySearchInput, propertyListContainer, selectedPropertiesContainer;

function getLandingPageSkeleton() {
    const skeleton = document.getElementById('landingPageSkeleton');
    if (!skeleton) {
        console.error('Landing page skeleton element not found');
    }
    return skeleton;
}

function getLandingPageContent() {
    const content = document.getElementById('landingPageContent');
    if (!content) {
        console.error('Landing page content element not found');
    }
    return content;
}

function showSkeleton() {
    const skeleton = getLandingPageSkeleton();
    const content = getLandingPageContent();
    
    if (skeleton) {
        skeleton.classList.remove('hidden');
    }
    if (content) {
        content.classList.add('hidden');
    }
}

function hideSkeleton() {
    const skeleton = getLandingPageSkeleton();
    const content = getLandingPageContent();
    
    if (skeleton) {
        skeleton.classList.add('hidden');
    }
    if (content) {
        content.classList.remove('hidden');
        content.style.display = 'flex'; 
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    fetchLandingPageData();
    fetchAllProperties();
    setupEditModalEvents();
    setupFileUpload();
});

function initializeDOMElements() {

    bannerTitle = document.getElementById('banner-title');
    bannerDescription = document.getElementById('banner-description');
    bannerImage = document.getElementById('banner-image');
    featuredUnitsContainer = document.getElementById('featured-units-container');

    editModal = document.getElementById('editLPContent');
    titleInput = document.getElementById('input-lpc-title');
    descriptionInput = document.getElementById('input-lpc-subtitle');
    fileInput = document.getElementById('fileInput');
    previewContainer = document.getElementById('previewContainer');
    colorRadios = document.querySelectorAll('input[name="color"]');

    if (editModal) {
        const buttons = editModal.querySelectorAll('button');
        saveButton = Array.from(buttons).find(btn => 
            btn.textContent.includes('Save') || 
            btn.querySelector('span')?.textContent.includes('Save')
        );
    }

    propertySearchInput = document.getElementById('property-search');
    propertyListContainer = document.getElementById('property-list');
    selectedPropertiesContainer = document.getElementById('selected-properties');
}

async function fetchAllProperties() {
    try {
        
        const response = await fetch(PROPERTY_LIST_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        allProperties = Array.isArray(data) ? data.filter(property => property.status === 'Active') : [];
        
    } catch (error) {
        console.error('Error fetching properties:', error);
        allProperties = [];
        showErrorMessage('Failed to load properties list.');
    }
}

async function fetchLandingPageData() {
    try {
        showSkeleton();
        
        const response = await fetch(LANDING_GET_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        landingPageData = data;
        populateLandingPageContent(data);
        hideSkeleton();
        
    } catch (error) {
        console.error('Error fetching landing page data:', error);
        hideSkeleton();
        showErrorMessage('Failed to load landing page content. Please try again.');
    }
}

function populateLandingPageContent(data) {
    try {

        if (bannerTitle && data.title) {
            bannerTitle.textContent = data.title;
        }
        
        if (bannerDescription && data.content) {
            bannerDescription.textContent = data.content;
        }
        
        if (bannerImage && data.imageLink) {
            bannerImage.src = data.imageLink;
            bannerImage.alt = data.title || 'Banner Image';
        }

        if (data.txtColor) {
            const color = data.txtColor.toLowerCase() === 'black' ? '#000000' : '#ffffff';
            if (bannerTitle) bannerTitle.style.color = color;
            if (bannerDescription) bannerDescription.style.color = color;
        }

        if (data.featured && Array.isArray(data.featured)) {

            currentFeaturedIds = data.featured.map(property => property._id);
            populateFeaturedUnits(data.featured);
        }
        
    } catch (error) {
        console.error('Error populating landing page content:', error);
        showErrorMessage('Error displaying landing page content.');
    }
}

function populateFeaturedUnits(units) {
    if (!featuredUnitsContainer) {
        console.warn('Featured units container not found');
        return;
    }

    const children = featuredUnitsContainer.children;
    while (children.length > 1) {
        children[1].remove();
    }

    if (!units || units.length === 0) {
        return;
    }

    const templateUnit = children[0];
    
    units.forEach((unit, index) => {
        let unitElement;
        
        if (index === 0) {

            unitElement = templateUnit;
        } else {

            unitElement = templateUnit.cloneNode(true);
            featuredUnitsContainer.appendChild(unitElement);
        }

        updateUnitElement(unitElement, unit);
    });
}

function updateUnitElement(unitElement, unitData) {
    try {

        const bgDiv = unitElement.querySelector('.absolute.inset-0');
        if (bgDiv && unitData.photoLinks && unitData.photoLinks.length > 0) {
            bgDiv.style.backgroundImage = `url('${unitData.photoLinks[0]}')`;
        }

        const nameElement = unitElement.querySelector('h2');
        if (nameElement && unitData.name) {
            nameElement.textContent = unitData.name;
        }

        const locationElement = unitElement.querySelector('p.font-inter.text-secondary-text.text-sm');
        if (locationElement) {
            const location = unitData.city ? `${unitData.address}, ${unitData.city}` : unitData.address;
            if (location) {
                locationElement.textContent = location;
            }
        }
        
    } catch (error) {
        console.error('Error updating unit element:', error);
    }
}

function setupEditModalEvents() {
    if (!editModal) return;

    const editButton = document.querySelector('[data-modal-target="editLPContent"]');
    if (editButton) {
        editButton.addEventListener('click', populateEditModal);
    }

    if (saveButton) {
        saveButton.addEventListener('click', handleSaveChanges);
    }

    colorRadios.forEach(radio => {
        radio.addEventListener('change', handleColorChange);
    });

    if (propertySearchInput) {
        propertySearchInput.addEventListener('input', handlePropertySearch);
    }
}

function populateEditModal() {
    if (!landingPageData) return;

    try {

        if (titleInput && landingPageData.title) {
            titleInput.value = landingPageData.title;
        }

        if (descriptionInput && landingPageData.content) {
            descriptionInput.value = landingPageData.content;
        }

        if (landingPageData.txtColor && colorRadios.length > 0) {
            const colorValue = landingPageData.txtColor; 
            colorRadios.forEach(radio => {
                radio.checked = (radio.value === colorValue);
            });
        }

        populatePropertyList();
        
    } catch (error) {
        console.error('Error populating edit modal:', error);
    }
}

function populatePropertyList(searchTerm = '') {
    if (!propertyListContainer || !allProperties.length) {
        if (propertyListContainer) {
            propertyListContainer.innerHTML = '<div class="p-4 text-center text-neutral-500">No properties available</div>';
        }
        return;
    }

    const filteredProperties = allProperties.filter(property => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            property.name?.toLowerCase().includes(searchLower) ||
            property.address?.toLowerCase().includes(searchLower) ||
            property.city?.toLowerCase().includes(searchLower)
        );
    });

    let propertyListHTML = '';
    
    if (filteredProperties.length === 0) {
        propertyListHTML = '<div class="p-4 text-center text-neutral-500">No properties found</div>';
    } else {
        propertyListHTML = filteredProperties.map(property => {
            const isChecked = currentFeaturedIds.includes(property._id);
            const location = property.city ? `${property.address}, ${property.city}` : property.address;
            
            return `
                <label class="relative flex items-center gap-2 p-2 hover:bg-neutral-50 cursor-pointer">
                    <input 
                        type="checkbox" 
                        class="peer appearance-none w-4 h-4 rounded border-2 mr-2 border-neutral-300 checked:bg-primary checked:border-primary focus:outline-none property-checkbox"
                        value="${property._id}"
                        data-name="${property.name}"
                        ${isChecked ? 'checked' : ''}
                        onchange="handlePropertySelection(this)"
                    >
                    <svg class="absolute left-2 mt-[2px] w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200" viewBox="0 0 20 20" fill="none">
                        <path d="M5 10.5L8.5 14L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div class="flex flex-col">
                        <span class="font-medium font-manrope">${property.name || 'Unnamed Property'}</span>
                        <span class="text-xs font-inter text-neutral-500">${location || 'No address'}</span>
                    </div>
                </label>
            `;
        }).join('');
    }

    propertyListContainer.innerHTML = propertyListHTML;

    updateSelectedPropertiesDisplay();
}

function handlePropertySearch(event) {
    const searchTerm = event.target.value;
    populatePropertyList(searchTerm);
}

function handlePropertySelection(checkbox) {
    const propertyId = checkbox.value;
    const propertyName = checkbox.getAttribute('data-name');
    
    if (checkbox.checked) {

        if (!currentFeaturedIds.includes(propertyId)) {
            currentFeaturedIds.push(propertyId);
        }
    } else {

        const index = currentFeaturedIds.indexOf(propertyId);
        if (index > -1) {
            currentFeaturedIds.splice(index, 1);
        }
    }

    updateSelectedPropertiesDisplay();
}

function updateSelectedPropertiesDisplay() {
    if (!selectedPropertiesContainer) return;

    if (currentFeaturedIds.length === 0) {
        selectedPropertiesContainer.innerHTML = '';
        return;
    }

    const selectedPropertiesHTML = currentFeaturedIds.map(propertyId => {
        const property = allProperties.find(p => p._id === propertyId);
        if (!property) return '';

        return `
            <span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>${property.name}</span>
                <button onclick="removeSelectedProperty('${propertyId}')" class="text-blue-500 hover:text-blue-700 p-0">
                    <svg class="fill-neutral-500 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 14.1221L17.303 19.4251C17.5844 19.7065 17.966 19.8646 18.364 19.8646C18.7619 19.8646 19.1436 19.7065 19.425 19.4251C19.7064 19.1437 19.8645 18.7621 19.8645 18.3641C19.8645 17.9662 19.7064 17.5845 19.425 17.3031L14.12 12.0001L19.424 6.69711C19.5632 6.55778 19.6737 6.39238 19.749 6.21036C19.8244 6.02834 19.8631 5.83326 19.8631 5.63626C19.8631 5.43926 19.8242 5.2442 19.7488 5.06221C19.6733 4.88022 19.5628 4.71488 19.4235 4.57561C19.2841 4.43634 19.1187 4.32588 18.9367 4.25054C18.7547 4.17519 18.5596 4.13644 18.3626 4.13648C18.1656 4.13653 17.9706 4.17538 17.7886 4.25081C17.6066 4.32624 17.4412 4.43678 17.302 4.57611L12 9.87911L6.69697 4.57611C6.55867 4.43278 6.3932 4.31843 6.21024 4.23973C6.02727 4.16103 5.83046 4.11956 5.63129 4.11774C5.43212 4.11591 5.23459 4.15377 5.05021 4.22911C4.86583 4.30444 4.6983 4.41574 4.55739 4.55652C4.41649 4.69729 4.30503 4.86471 4.22952 5.04902C4.15401 5.23333 4.11597 5.43083 4.1176 5.63C4.11924 5.82917 4.16053 6.02602 4.23905 6.20906C4.31758 6.3921 4.43177 6.55767 4.57497 6.69611L9.87997 12.0001L4.57597 17.3041C4.43277 17.4425 4.31858 17.6081 4.24005 17.7912C4.16153 17.9742 4.12024 18.1711 4.1186 18.3702C4.11697 18.5694 4.15501 18.7669 4.23052 18.9512C4.30603 19.1355 4.41749 19.3029 4.55839 19.4437C4.6993 19.5845 4.86683 19.6958 5.05121 19.7711C5.23559 19.8464 5.43312 19.8843 5.63229 19.8825C5.83146 19.8807 6.02827 19.8392 6.21124 19.7605C6.3942 19.6818 6.55967 19.5674 6.69797 19.4241L12 14.1221Z"/>
                    </svg>
                </button>
            </span>
        `;
    }).join('');

    selectedPropertiesContainer.innerHTML = selectedPropertiesHTML;
}

function removeSelectedProperty(propertyId) {
    const index = currentFeaturedIds.indexOf(propertyId);
    if (index > -1) {
        currentFeaturedIds.splice(index, 1);
    }

    const checkbox = propertyListContainer?.querySelector(`input[value="${propertyId}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }

    updateSelectedPropertiesDisplay();
}

function handleColorChange(event) {

}

function setupFileUpload() {
    if (!fileInput || !previewContainer) return;

    const dropzone = document.getElementById('dropzone');

    if (fileInput.dataset.eventsAttached === 'true') {
        return;
    }

    fileInput.addEventListener('change', handleFileSelection);

    if (dropzone) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', handleDragOver);
        dropzone.addEventListener('drop', handleFileDrop);
        dropzone.addEventListener('dragleave', handleDragLeave);
    }

    fileInput.dataset.eventsAttached = 'true';
}

function handleFileSelection(event) {
    const files = event.target.files;
    if (files.length > 0) {
        displayFilePreview(files[0]);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('border-primary');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('border-primary');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('border-primary');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        displayFilePreview(files[0]);
    }
}

function displayFilePreview(file) {
    if (!previewContainer) return;

    if (!file.type.startsWith('image/')) {
        showErrorMessage('Please select a valid image file.');
        return;
    }

    previewContainer.innerHTML = '';

    const previewDiv = document.createElement('div');
    previewDiv.className = 'flex items-center gap-3 p-3 bg-neutral-50 rounded-lg';

    const img = document.createElement('img');
    img.className = 'w-16 h-16 object-cover rounded';
    img.alt = 'Preview';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex-1';
    fileInfo.innerHTML = `
        <p class="text-sm font-medium">${file.name}</p>
        <p class="text-xs text-neutral-500">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
    `;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'text-red-500 hover:text-red-700 p-1';
    removeBtn.innerHTML = '✕';
    removeBtn.addEventListener('click', () => {
        previewContainer.innerHTML = '';
        fileInput.value = '';
    });

    const reader = new FileReader();
    reader.onload = (e) => {
        img.src = e.target.result;

        const bannerImage = document.getElementById('banner-image');
        if (bannerImage) {
            bannerImage.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);

    previewDiv.appendChild(img);
    previewDiv.appendChild(fileInfo);
    previewDiv.appendChild(removeBtn);
    previewContainer.appendChild(previewDiv);
}

async function handleSaveChanges() {
    try {

        if (saveButton) {
            saveButton.disabled = true;
            const originalText = saveButton.querySelector('span')?.textContent || 'Save';
            const spanElement = saveButton.querySelector('span');
            if (spanElement) spanElement.textContent = 'Saving...';
        }

        const formData = new FormData();

        if (titleInput?.value) {
            formData.append('title', titleInput.value);
        }
        
        if (descriptionInput?.value) {
            formData.append('content', descriptionInput.value);
        }

        const selectedColor = getSelectedColor();
        formData.append('txtColor', selectedColor);

        if (fileInput?.files && fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        }

        const selectedUnits = getSelectedUnits();
        if (selectedUnits.length > 0) {

            selectedUnits.forEach(propertyId => {
                formData.append('featured[]', propertyId);
            });
        }

        const response = await fetch(LANDING_PUT_URL, {
            method: 'PUT',
            body: formData
        });

        let result;
        try {
            result = await response.json();
        } catch (e) {
            result = { message: 'No response data' };
        }

        if (response.ok) {
            showSuccessMessage('Landing page updated successfully!');

            closeEditModal();

            showSkeleton();
            await fetchLandingPageData();
            
        } else {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Error saving landing page changes:', error);
        showErrorMessage('Failed to save changes: ' + error.message);
        
    } finally {

        if (saveButton) {
            saveButton.disabled = false;
            const spanElement = saveButton.querySelector('span');
            if (spanElement) spanElement.textContent = 'Save';
        }
    }
}

function getSelectedColor() {
    const selectedRadio = Array.from(colorRadios).find(radio => radio.checked);
    return selectedRadio ? selectedRadio.value : 'White'; 
}

function getSelectedUnits() {
    return currentFeaturedIds;
}

function closeEditModal() {
    if (editModal) {
        editModal.classList.add('hidden');
    }
}

function showSuccessMessage(message) {

    let messageEl = document.getElementById('success-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'success-message';
        messageEl.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
        document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = '✅ ' + message;
    messageEl.classList.remove('hidden');

    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 3000);
}

function showErrorMessage(message) {

    let messageEl = document.getElementById('error-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'error-message';
        messageEl.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
        document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = '❌ ' + message;
    messageEl.classList.remove('hidden');

    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 5000);
}

window.handlePropertySelection = handlePropertySelection;
window.removeSelectedProperty = removeSelectedProperty;
