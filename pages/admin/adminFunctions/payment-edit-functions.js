// Payment edit functions for admin panel
// Main functionality: Edit existing payment methods with auto-population, validation, and image upload

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PAYMENT_CATEGORIES = ['GCash', 'Maya', 'GoTyme', 'Union Bank'];
const CATEGORY_IMAGES = {
    'GCash': '/images/qr-gcash1.png',
    'Gcash': '/images/qr-gcash1.png',
    'gcash': '/images/qr-gcash1.png',
    'Maya': '/images/qr-maya.png',
    'maya': '/images/qr-maya.png',
    'GoTyme': '/images/qr-gotyme.png',
    'gotyme': '/images/qr-gotyme.png',
    'Union Bank': '/images/qr-ub.png',
    'unionbank': '/images/qr-ub.png'
};

// API Base URL
const API_BASE = 'https://betcha-api.onrender.com';

// Global variables
let currentPaymentId = null;
let currentPaymentData = null;
let allPayments = []; // Store all payments for search functionality

// Initialize edit functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeEditForm();
    setupPaymentMethodIntegration();
    initializeFileUpload();
    setupFormSubmission();
    setupSearchFunctionality();
});

// Initialize the edit form with payment data
async function initializeEditForm() {
    // Get payment ID from sessionStorage
    currentPaymentId = sessionStorage.getItem('editPaymentId');
    
    if (!currentPaymentId) {
        showError('No payment ID found. Redirecting to payment list...');
        setTimeout(() => {
            window.location.href = 'payment.html';
        }, 2000);
        return;
    }

    try {
        showLoadingState();
        
        // Fetch payment data
        const response = await fetch(`${API_BASE}/payments/display`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch payment data: ${response.status}`);
        }

        const payments = await response.json();
        
        // Store all payments for search functionality
        allPayments = payments;
        
        // Find the specific payment
        currentPaymentData = payments.find(payment => payment._id === currentPaymentId);
        
        if (!currentPaymentData) {
            throw new Error('Payment not found');
        }

        // Populate form fields
        populateFormFields(currentPaymentData);
        
        hideLoadingState();
        
    } catch (error) {
        console.error('Error fetching payment data:', error);
        hideLoadingState();
        showError(`Error loading payment data: ${error.message}`);
        
        setTimeout(() => {
            window.location.href = 'payment.html';
        }, 3000);
    }
}

// Populate form fields with payment data
function populateFormFields(paymentData) {
    // Set payment method dropdown
    const selectedMethodElement = document.getElementById('selectedPaymentMethod');
    const paymentNameDiv = document.getElementById('paymentNameDiv');
    const customNameInput = document.getElementById('input-payment-name');
    
    // Determine the category - use category field if available, otherwise derive from paymentName
    let category = paymentData.category;
    if (!category && paymentData.paymentName) {
        // Try to match paymentName with available categories
        category = PAYMENT_CATEGORIES.find(cat => 
            paymentData.paymentName.toLowerCase().includes(cat.toLowerCase())
        ) || 'Other';
    }
    
    // Set the payment method category in dropdown
    if (category) {
        selectedMethodElement.textContent = category;
        selectedMethodElement.setAttribute('data-value', category);
        selectedMethodElement.classList.remove('text-neutral-400');
        selectedMethodElement.classList.add('text-primary-text');
        
        // Show custom name field if "Other" category or if category doesn't match standard options
        if (category === 'Other' || !PAYMENT_CATEGORIES.includes(category)) {
            paymentNameDiv.classList.remove('hidden');
            customNameInput.value = paymentData.paymentName || '';
        } else {
            paymentNameDiv.classList.add('hidden');
            customNameInput.value = paymentData.paymentName || category;
        }
    } else {
        // Fallback - treat as "Other" if no category can be determined
        selectedMethodElement.textContent = 'Other';
        selectedMethodElement.setAttribute('data-value', 'Other');
        selectedMethodElement.classList.remove('text-neutral-400');
        selectedMethodElement.classList.add('text-primary-text');
        paymentNameDiv.classList.remove('hidden');
        customNameInput.value = paymentData.paymentName || '';
    }
    
    // Set QR image if available
    if (paymentData.qrPhotoLink && paymentData.qrPhotoLink.trim() !== '') {
        const preview = document.getElementById('qr-preview');
        const placeholder = document.getElementById('qr-placeholder');
        
        if (preview && placeholder) {
            preview.src = paymentData.qrPhotoLink;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
    }
}

// Setup integration with paymentMethodOption.js dropdown
function setupPaymentMethodIntegration() {
    const selectedMethodElement = document.getElementById('selectedPaymentMethod');
    const customNameDiv = document.getElementById('paymentNameDiv');
    const paymentDropdownList = document.getElementById('paymentDropdownList');
    
    // Consolidated function to handle dropdown state changes
    function handleDropdownSelection(selectedValue) {
        if (!selectedValue || selectedValue === 'Select Payment') return;
        
        // Store the selected value as data attribute
        selectedMethodElement.setAttribute('data-value', selectedValue);
        
        // Handle "Other" category visibility
        const customNameInput = document.getElementById('input-payment-name');
        if (selectedValue === 'Other') {
            customNameDiv.classList.remove('hidden');
        } else {
            customNameDiv.classList.add('hidden');
            // Clear custom name input when not "Other"
            if (customNameInput) {
                customNameInput.value = '';
            }
        }
    }
    
    // Monitor dropdown list clicks to capture selections
    if (paymentDropdownList) {
        paymentDropdownList.addEventListener('click', function(e) {
            const listItem = e.target.closest('li');
            if (listItem) {
                handleDropdownSelection(listItem.textContent.trim());
            }
        });
    }
    
    // Fallback: MutationObserver to watch for changes to the selected payment method
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const selectedText = selectedMethodElement.textContent.trim();
                handleDropdownSelection(selectedText);
            }
        });
    });
    
    // Start observing
    observer.observe(selectedMethodElement, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

// Consolidated file validation function
function validateImageFile(file, inputElement = null) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file (PNG, JPG, JPEG, GIF).');
        if (inputElement) inputElement.value = '';
        return false;
    }

    // Validate file size using constant
    if (file.size > MAX_FILE_SIZE) {
        showError('File size must be less than 5MB.');
        if (inputElement) inputElement.value = '';
        return false;
    }

    return true;
}

// Initialize file upload functionality
function initializeFileUpload() {
    const fileInput = document.getElementById('qr-upload');
    const preview = document.getElementById('qr-preview');
    const placeholder = document.getElementById('qr-placeholder');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // Use consolidated validation
                if (!validateImageFile(file, fileInput)) {
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (preview && placeholder) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                        placeholder.style.display = 'none';
                    }
                };
                
                reader.onerror = function() {
                    showError('Error reading the selected file. Please try again.');
                    fileInput.value = '';
                };
                
                reader.readAsDataURL(file);
            } else {
                // If no file selected, restore placeholder if there was no existing image
                if (preview && placeholder && !currentPaymentData?.qrPhotoLink) {
                    preview.style.display = 'none';
                    placeholder.style.display = 'flex';
                }
            }
        });
    }
}

// Setup form submission
function setupFormSubmission() {
    // Add validation to the Update button before opening modal
    const updateButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    
    if (updateButton) {
        updateButton.addEventListener('click', function(e) {
            // Validate form before opening modal
            if (!preModalValidation()) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            // If validation passes, modal will open normally
        });
    }
    
    // Set up the confirmation button in the modal
    setupModalConfirmation();
}

// Consolidated validation function
function validatePaymentForm() {
    const selectedMethod = document.getElementById('selectedPaymentMethod');
    const customNameInput = document.getElementById('input-payment-name');
    
    const selectedCategory = selectedMethod.getAttribute('data-value') || selectedMethod.textContent.trim();
    
    // Check if payment method is selected
    if (!selectedCategory || selectedCategory === 'Select Payment') {
        showError('Please select a payment method');
        return { isValid: false };
    }
    
    // Determine and validate payment name
    let paymentName;
    if (selectedCategory === 'Other') {
        paymentName = customNameInput.value.trim();
        if (!paymentName) {
            showError('Please enter a custom payment name');
            customNameInput.focus();
            return { isValid: false };
        }
    } else {
        paymentName = customNameInput.value.trim() || selectedCategory;
    }
    
    return { 
        isValid: true, 
        selectedCategory, 
        paymentName 
    };
}

// Pre-modal validation (uses consolidated validation)
function preModalValidation() {
    return validatePaymentForm().isValid;
}

// Setup modal confirmation button
function setupModalConfirmation() {
    const modal = document.getElementById('confirmDetailsModal');
    
    if (modal) {
        const confirmButton = modal.querySelector('button[onclick*="payment.html"]');
        
        if (confirmButton) {
            confirmButton.removeAttribute('onclick');
            confirmButton.addEventListener('click', function(e) {
                e.preventDefault();
                validateAndSubmitForm();
            });
        }
    }
}

// Validate and submit form
async function validateAndSubmitForm() {
    const validation = validatePaymentForm();
    if (!validation.isValid) return;
    
    const { selectedCategory, paymentName } = validation;
    const fileInput = document.getElementById('qr-upload');
    
    showLoadingState();

    try {
        // Handle image upload
        let qrPhotoLink = currentPaymentData.qrPhotoLink || '';
        
        if (fileInput.files[0]) {
            // Convert the new image to base64 for direct storage
            const file = fileInput.files[0];
            
            // Use consolidated validation (no need to clear input in submission context)
            if (!validateImageFile(file)) {
                hideLoadingState();
                return;
            }
            
            try {
                // Convert to base64 - this is what the API expects
                qrPhotoLink = await convertFileToBase64(file);
                console.log('New image converted to base64, size:', qrPhotoLink.length, 'characters');
                
            } catch (fileError) {
                console.error('Error processing image file:', fileError);
                showError('Error processing the uploaded image. Please try again.');
                hideLoadingState();
                return;
            }
        }

        // Create payment data
        const paymentData = {
            paymentName: paymentName,
            category: selectedCategory,
            qrPhotoLink: qrPhotoLink
        };

        console.log('Updating payment data:', paymentData);

        // Make API call to update payment
        const response = await fetch(`${API_BASE}/payments/update/${currentPaymentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Update failed (${response.status}): ${errorData}`);
        }

        const result = await response.json();
        console.log('Payment updated successfully:', result);
        
        // Verify if image was updated
        const hasNewImage = fileInput.files[0];
        const successMessage = hasNewImage 
            ? 'Payment method and image updated successfully!' 
            : 'Payment method updated successfully!';
        
        // Close the confirmation modal
        const modal = document.getElementById('confirmDetailsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Show success and redirect
        hideLoadingState();
        showSuccess(successMessage);
        
        // Clear the stored payment ID
        sessionStorage.removeItem('editPaymentId');
        
        // Redirect to payment list page after a short delay
        setTimeout(() => {
            window.location.href = 'payment.html';
        }, 1500);

    } catch (error) {
        console.error('Error updating payment:', error);
        hideLoadingState();
        showError(`Error updating payment method: ${error.message}`);
    }
}

// Helper function to convert file to base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        
        reader.onerror = function(error) {
            reject(error);
        };
        
        reader.readAsDataURL(file);
    });
}

// Utility functions for loading states and notifications
function showLoadingState() {
    // Loading state implementation
}

function hideLoadingState() {
    // Hide loading state implementation
}

function showSuccess(message) {
    // Create and show success toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toast.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showError(message) {
    // Create and show error toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-5 right-5 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toast.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Search functionality for payments
function setupSearchFunctionality() {
    // Create search functionality similar to property-functions.js
    const searchInput = document.getElementById('payment-search');
    
    // If there's no search input on the edit page, we can create one or skip
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim().toLowerCase();
            filterPayments(value);
        });
    }
    
    // Setup alternative search functionality for payment name auto-complete
    setupPaymentNameAutocomplete();
}

// Filter payments based on search term
function filterPayments(searchTerm) {
    if (!allPayments.length) return;
    
    const filteredPayments = allPayments.filter(payment => {
        const name = payment.paymentName ? payment.paymentName.toLowerCase() : '';
        const category = payment.category ? payment.category.toLowerCase() : '';
        
        return name.includes(searchTerm) || category.includes(searchTerm);
    });
    
    // You could render these filtered payments if needed
    return filteredPayments;
}

// Setup payment name autocomplete functionality
function setupPaymentNameAutocomplete() {
    const customNameInput = document.getElementById('input-payment-name');
    const selectedMethodElement = document.getElementById('selectedPaymentMethod');
    
    if (customNameInput && allPayments.length > 0) {
        // Create datalist for autocomplete
        let datalist = document.getElementById('payment-names-datalist');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'payment-names-datalist';
            customNameInput.setAttribute('list', 'payment-names-datalist');
            customNameInput.parentNode.appendChild(datalist);
        }
        
        // Populate datalist with existing payment names
        const uniqueNames = [...new Set(allPayments.map(p => p.paymentName).filter(Boolean))];
        datalist.innerHTML = uniqueNames.map(name => `<option value="${name}">`).join('');
        
        // Add input event listener for smart suggestions
        customNameInput.addEventListener('input', function(e) {
            const inputValue = e.target.value.toLowerCase();
            const selectedCategory = selectedMethodElement.getAttribute('data-value') || selectedMethodElement.textContent.trim();
            
            // Filter suggestions based on category if available
            let suggestions = allPayments.filter(payment => {
                const nameMatch = payment.paymentName && payment.paymentName.toLowerCase().includes(inputValue);
                const categoryMatch = !selectedCategory || selectedCategory === 'Select Payment' || payment.category === selectedCategory;
                return nameMatch && categoryMatch;
            }).map(p => p.paymentName);
            
            // Remove duplicates
            suggestions = [...new Set(suggestions)];
            
            // Update datalist
            datalist.innerHTML = suggestions.map(name => `<option value="${name}">`).join('');
        });
    }
}

// Enhanced search with category filtering
function searchPaymentsByCategory(category, searchTerm = '') {
    if (!allPayments.length) return [];
    
    return allPayments.filter(payment => {
        const categoryMatch = !category || payment.category === category;
        const nameMatch = !searchTerm || 
            (payment.paymentName && payment.paymentName.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return categoryMatch && nameMatch;
    });
}

// Get payment suggestions for form
function getPaymentSuggestions(partialName) {
    if (!allPayments.length || !partialName) return [];
    
    const searchTerm = partialName.toLowerCase();
    return allPayments
        .filter(payment => payment.paymentName && payment.paymentName.toLowerCase().includes(searchTerm))
        .map(payment => ({
            id: payment._id,
            name: payment.paymentName,
            category: payment.category,
            qrPhotoLink: payment.qrPhotoLink
        }))
        .slice(0, 5); // Limit to 5 suggestions
}

// Quick search for specific payment by ID
function findPaymentById(paymentId) {
    return allPayments.find(payment => payment._id === paymentId);
}

// Search payments by multiple criteria
function advancedPaymentSearch(criteria) {
    if (!allPayments.length) return [];
    
    return allPayments.filter(payment => {
        const nameMatch = !criteria.name || 
            (payment.paymentName && payment.paymentName.toLowerCase().includes(criteria.name.toLowerCase()));
        
        const categoryMatch = !criteria.category || payment.category === criteria.category;
        
        const dateMatch = !criteria.dateFrom || !criteria.dateTo || 
            (new Date(payment.createdAt) >= new Date(criteria.dateFrom) && 
             new Date(payment.createdAt) <= new Date(criteria.dateTo));
        
        return nameMatch && categoryMatch && dateMatch;
    });
}

// Render payment search results (utility function for potential future use)
function renderPaymentSearchResults(payments, containerId = 'payment-search-results') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!payments || payments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-neutral-500">
                <svg class="w-12 h-12 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"></path>
                </svg>
                <p>No payments found matching your search criteria</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = payments.map(payment => `
        <div class="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-all duration-300" 
             data-payment-id="${payment._id}">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden">
                    <img src="${getPaymentImageUrl(payment.qrPhotoLink, payment.category)}" 
                         alt="${payment.paymentName}" 
                         class="w-full h-full object-cover"
                         onerror="this.src='${getPaymentImageUrl('', payment.category)}'">
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-primary-text">${payment.paymentName}</h3>
                    ${payment.category ? `<p class="text-sm text-neutral-500">${payment.category}</p>` : ''}
                    <p class="text-xs text-neutral-400">Created: ${formatPaymentDate(payment.createdAt)}</p>
                </div>
                <button onclick="selectPaymentForEdit('${payment._id}')" 
                        class="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all duration-300">
                    Select
                </button>
            </div>
        </div>
    `).join('');
}

// Helper function to get payment image URL
function getPaymentImageUrl(qrPhotoLink, category) {
    if (qrPhotoLink && qrPhotoLink.trim() !== '') {
        if (qrPhotoLink.includes('thumbnail')) {
            return qrPhotoLink;
        }
        
        const driveFileIdMatch = qrPhotoLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (driveFileIdMatch) {
            const fileId = driveFileIdMatch[1];
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`;
        }
        
        return qrPhotoLink;
    }
    
    return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['GCash'];
}

// Helper function to format payment date
function formatPaymentDate(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
}

// Function to select a payment for editing (utility function)
function selectPaymentForEdit(paymentId) {
    sessionStorage.setItem('editPaymentId', paymentId);
    window.location.reload(); // Reload to load the selected payment
}
