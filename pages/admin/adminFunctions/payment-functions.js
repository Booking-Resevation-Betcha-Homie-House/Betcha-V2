// Payment functions for admin panel
const API_BASE_URL = 'https://betcha-api.onrender.com';

// Constants for reusable styles and configurations
const UI_STYLES = {
    button: {
        primary: "bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300",
        edit: "flex gap-2 justify-center items-center bg-primary/10 w-full cursor-pointer transition-all duration-300 ease-in-out hover:bg-primary/20 hover:scale-105 rounded-2xl active:scale-95 py-2",
        delete: "flex gap-2 justify-center items-center w-full cursor-pointer transition-all duration-300 ease-in-out bg-rose-100 hover:bg-rose-200 hover:scale-105 rounded-2xl active:scale-95 py-2"
    },
    state: "col-span-full flex flex-col items-center justify-center py-12"
};

// Utility function to get payment grid element
function getPaymentGrid() {
    const grid = document.getElementById('paymentGrid');
    if (!grid) {
        console.error('Payment grid element not found');
    }
    return grid;
}

// Utility function to get payment skeleton element
function getPaymentSkeleton() {
    const skeleton = document.getElementById('paymentSkeleton');
    if (!skeleton) {
        console.error('Payment skeleton element not found');
    }
    return skeleton;
}

// Function to show skeleton loading
function showSkeleton() {
    const skeleton = getPaymentSkeleton();
    const grid = getPaymentGrid();
    
    if (skeleton) {
        skeleton.classList.remove('hidden');
    }
    if (grid) {
        grid.classList.add('hidden');
    }
}

// Function to hide skeleton loading
function hideSkeleton() {
    const skeleton = getPaymentSkeleton();
    const grid = getPaymentGrid();
    
    if (skeleton) {
        skeleton.classList.add('hidden');
    }
    if (grid) {
        grid.classList.remove('hidden');
    }
}

// Function to set payment grid content
function setPaymentGridContent(content) {
    const paymentGrid = getPaymentGrid();
    if (paymentGrid) {
        paymentGrid.innerHTML = content;
    }
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
}

// Function to process Google Drive links to get thumbnail
function getImageUrl(qrPhotoLink, category) {
    // If we have a valid qrPhotoLink, use it
    if (qrPhotoLink && qrPhotoLink.trim() !== '') {
        // If it's already a thumbnail link, use it directly
        if (qrPhotoLink.includes('thumbnail')) {
            return qrPhotoLink;
        }
        
        // If it's a Google Drive link, try to convert it to a thumbnail
        const driveFileIdMatch = qrPhotoLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (driveFileIdMatch) {
            const fileId = driveFileIdMatch[1];
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`;
        }
        
        // If it's a regular URL, use it directly
        return qrPhotoLink;
    }
    
    // If no qrPhotoLink, use category-specific fallback images
    const categoryImages = {
        'gcash': '/images/qr-gcash1.png',
        'maya': '/images/qr-maya.png',
        'gotyme': '/images/qr-gotyme.png',
        'union bank': '/images/qr-ub.png',
        'unionbank': '/images/qr-ub.png'
    };
    
    // Normalize category to lowercase and return image or default
    const normalizedCategory = category?.toLowerCase() || '';
    return categoryImages[normalizedCategory] || '/images/qr-gcash1.png';
}

// Function to create payment card HTML
function createPaymentCard(payment) {
    const formattedDate = formatDate(payment.createdAt);
    const imageUrl = getImageUrl(payment.qrPhotoLink, payment.category);
    
    // Status badge for active/inactive
    const statusBadge = payment.active 
        ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>'
        : '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>';
    
    return `
        <div id="payment-card-${payment._id}" class="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col group p-5 items-center
            transition-all duration-300 ease-in-out
            hover:shadow-lg " data-payment-id="${payment._id}">
            <div class="rounded-xl overflow-hidden mb-3 bg-neutral-300 h-32 w-32 flex items-center justify-center">
                <img src="${imageUrl}" 
                     alt="${payment.paymentName}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='${getImageUrl('', payment.category)}'"
                     loading="lazy">
            </div>
            <div class="flex flex-col items-center mb-2">
                <p class="text-lg font-manrope font-medium text-center mb-1">${payment.paymentName}</p>
                ${statusBadge}
            </div>
            ${payment.category ? `<p class="text-xs font-inter text-neutral-500 mb-1 text-center">${payment.category}</p>` : ''}
            <p class="text-sm font-inter text-center">Date created: <span>${formattedDate}</span></p>
            <div class="flex gap-3 w-full mt-3">
                <button 
                    onclick="editPayment('${payment._id}')"
                    class="${UI_STYLES.button.edit}"
                    title="Edit Payment">
                    <svg class="w-5 stroke-primary" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V8" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12.2499 1.75003C12.5151 1.48481 12.8748 1.33582 13.2499 1.33582C13.625 1.33582 13.9847 1.48481 14.2499 1.75003C14.5151 2.01525 14.6641 2.37496 14.6641 2.75003C14.6641 3.1251 14.5151 3.48481 14.2499 3.75003L8.24123 9.75936C8.08293 9.91753 7.88737 10.0333 7.67257 10.096L5.75723 10.656C5.69987 10.6728 5.63906 10.6738 5.58117 10.6589C5.52329 10.6441 5.47045 10.614 5.4282 10.5717C5.38594 10.5295 5.35583 10.4766 5.341 10.4188C5.32617 10.3609 5.32717 10.3001 5.3439 10.2427L5.9039 8.32736C5.96692 8.11273 6.08292 7.9174 6.24123 7.75936L12.2499 1.75003Z" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>

                <button 
                    onclick="deletePayment('${payment._id}', '${payment.paymentName}')"
                    class="flex gap-2 justify-center items-center w-full cursor-pointer transition-all duration-300 ease-in-out ${payment.active ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'} hover:scale-105 rounded-2xl active:scale-95 py-2"
                    title="${payment.active ? 'Deactivate' : 'Activate'} Payment">
                    <span class="text-sm font-medium ${payment.active ? 'text-red-700' : 'text-green-700'}">${payment.active ? 'Deactivate' : 'Activate'}</span>
                </button>
            </div>
        </div>
    `;
}

// Function to load payment methods
async function loadPaymentMethods() {
    try {
        showSkeleton();
        
        const response = await fetch(`${API_BASE_URL}/payments/display`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const payments = await response.json();
        
        if (payments && payments.length > 0) {
            // Clear existing content and add payment cards
            const paymentGrid = getPaymentGrid();
            if (paymentGrid) {
                paymentGrid.innerHTML = payments.map(payment => createPaymentCard(payment)).join('');
            }
            hideSkeleton();
        } else {
            hideSkeleton();
            showEmptyState();
        }
        
    } catch (error) {
        console.error('Error loading payment methods:', error);
        hideSkeleton();
        showErrorState();
    }
}

// Function to show loading state
function showLoadingState() {
    setPaymentGridContent(`
        <div class="${UI_STYLES.state}">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p class="text-neutral-500">Loading payment methods...</p>
        </div>
    `);
}

// Function to show empty state
function showEmptyState() {
    const paymentGrid = getPaymentGrid();
    if (paymentGrid) {
        paymentGrid.innerHTML = `
            <div class="${UI_STYLES.state}">
                <svg class="w-16 h-16 text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
                <h3 class="text-lg font-medium text-neutral-500 mb-2">No Payment Methods</h3>
                <p class="text-neutral-400 text-center">No payment methods have been added yet.</p>
                <button 
                    onclick="window.location.href='payment-add.html'"
                    class="${UI_STYLES.button.primary}">
                    Add Payment Method
                </button>
            </div>
        `;
    }
}

// Function to show error state
function showErrorState() {
    const paymentGrid = getPaymentGrid();
    if (paymentGrid) {
        paymentGrid.innerHTML = `
            <div class="${UI_STYLES.state}">
                <svg class="w-16 h-16 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="text-lg font-medium text-red-500 mb-2">Error Loading Payment Methods</h3>
                <p class="text-neutral-400 text-center mb-4">There was an error loading the payment methods.</p>
                <button 
                    onclick="loadPaymentMethods()"
                    class="${UI_STYLES.button.primary}">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Function to handle edit payment
function editPayment(paymentId) {
    // Store the payment ID in sessionStorage to pass to edit page
    sessionStorage.setItem('editPaymentId', paymentId);
    window.location.href = 'payment-edit.html';
}

// Function to handle toggle payment active status
async function deletePayment(paymentId, paymentName) {
    if (!confirm(`Are you sure you want to toggle the status of "${paymentName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/payments/toggle-active/${paymentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Failed to update payment method status');
        }
        
        alert('Payment method status updated successfully!');
        loadPaymentMethods();
        
    } catch (error) {
        console.error('Error updating payment method status:', error);
        alert('Error updating payment method status. Please try again.');
    }
}

// Function to handle search
function setupSearch() {
    const searchInput = document.querySelector('input[placeholder="Search"]');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const paymentCards = document.querySelectorAll('[data-payment-id]');
            
            // If we're searching and the skeleton is visible, hide it
            if (searchTerm) {
                hideSkeleton();
            }
            
            paymentCards.forEach(card => {
                const paymentName = card.querySelector('.text-lg').textContent.toLowerCase();
                const category = card.querySelector('.text-xs')?.textContent.toLowerCase() || '';
                
                if (paymentName.includes(searchTerm) || category.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const paymentGrid = getPaymentGrid();
    if (paymentGrid) {
        loadPaymentMethods();
        setupSearch();
    }
});

window.deletePayment = deletePayment;
window.editPayment = editPayment;