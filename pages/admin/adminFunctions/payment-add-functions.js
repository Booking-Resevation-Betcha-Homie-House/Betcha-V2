

import { showToastError } from '/src/toastNotification.js';

const API_BASE_URL = 'https://betcha-api.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
    setupFormSubmission();

    setTimeout(() => {
        setupPaymentMethodIntegration();
    }, 100);
});

function setupPaymentMethodIntegration() {

    const selectedMethodElement = document.getElementById('selectedPaymentMethod');

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const selectedText = selectedMethodElement.textContent.trim();

                if (selectedText !== 'Select Payment') {
                    selectedMethodElement.setAttribute('data-value', selectedText);
                }
            }
        });
    });

    observer.observe(selectedMethodElement, {
        childList: true,
        characterData: true,
        subtree: true
    });
}

function initializeFileUpload() {
    const fileInput = document.getElementById('qr-upload');
    const placeholder = document.getElementById('qr-placeholder');

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (file) {

            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {

                placeholder.style.backgroundImage = `url(${e.target.result})`;
                placeholder.style.backgroundSize = 'cover';
                placeholder.style.backgroundPosition = 'center';
                placeholder.style.backgroundRepeat = 'no-repeat';

                placeholder.innerHTML = `
                    <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-all duration-300 hover:bg-black/60">
                        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" 
                                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4-4m0 0l-4 4m4-4v12" />
                        </svg>
                        <span class="text-xs font-medium">Change Image</span>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else {

            resetPlaceholder();
        }
    });

    function resetPlaceholder() {
        placeholder.style.backgroundImage = '';
        placeholder.style.backgroundSize = '';
        placeholder.style.backgroundPosition = '';
        placeholder.style.backgroundRepeat = '';
        
        placeholder.innerHTML = `
            <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" 
                    d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4-4m0 0l-4 4m4-4v12" />
            </svg>
            <span class="text-sm font-medium">Upload QR Code</span>
        `;
    }
}

function setupFormSubmission() {

    const addButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    
    if (addButton) {
        addButton.addEventListener('click', function(e) {

            if (!preModalValidation()) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

        });
    }

    setupModalConfirmation();
}

function preModalValidation() {
    const selectedMethod = document.getElementById('selectedPaymentMethod');
    const customNameInput = document.getElementById('input-payment-name');
    
    const selectedCategory = selectedMethod.getAttribute('data-value');

    if (!selectedCategory || selectedCategory === 'Select Payment') {
        showError('Please select a payment method');
        return false;
    }

    if (selectedCategory === 'Other') {
        const customName = customNameInput.value.trim();
        if (!customName) {
            showError('Please enter a custom payment name');
            customNameInput.focus();
            return false;
        }
    }
    
    return true;
}

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

async function validateAndSubmitForm() {
    const selectedMethod = document.getElementById('selectedPaymentMethod');
    const customNameInput = document.getElementById('input-payment-name');
    const fileInput = document.getElementById('qr-upload');

    const selectedCategory = selectedMethod.getAttribute('data-value');
    const paymentName = customNameInput.value.trim() || selectedCategory || '';

    if (!selectedCategory) {
        showError('Please select a payment method.');
        return;
    }

    if (!paymentName) {
        showError('Please enter a payment name.');
        customNameInput.focus();
        return;
    }

    if (!fileInput.files[0]) {
        showError('Please upload a QR code image.');
        return;
    }

    showLoadingState();

    try {

        const formData = new FormData();
        formData.append('paymentName', paymentName);
        formData.append('category', selectedCategory);
        
        if (fileInput.files[0]) {
            formData.append('qrPicture', fileInput.files[0]);
        }

        const response = await fetch(`${API_BASE_URL}/paymentPlatform/create`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorData}`);
        }

        const result = await response.json();
        const created = result?.newPayment || result?.data || result?.payment || result?.paymentPlatform || result;

        const modal = document.getElementById('confirmDetailsModal');
        if (modal) {
            modal.classList.add('hidden');
        }

        hideLoadingState();
        showSuccess('Payment method created successfully!');

        clearForm();

        setTimeout(() => {
            window.location.href = 'payment.html';
        }, 1500);

    } catch (error) {
        console.error('Error creating payment:', error);
        hideLoadingState();
        showError(`Error creating payment method: ${error.message}`);
    }
}

function showLoadingState() {
    const addButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (addButton) {
        addButton.disabled = true;
        addButton.innerHTML = `
            <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm text-primary">Creating...</span>
        `;
    }
}

function hideLoadingState() {
    const addButton = document.querySelector('[data-modal-target="confirmDetailsModal"]');
    if (addButton) {
        addButton.disabled = false;
        addButton.innerHTML = `
            <svg class="w-4 stroke-primary" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.66666 7.99996H8M8 7.99996H13.3333M8 7.99996V2.66663M8 7.99996V13.3333" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="text-sm text-primary">Add</span>
        `;
    }
}

function showSuccess(message) {
    return showToastError('success', 'Success', message);
}

function showError(message) {
    return showToastError('error', 'Error', message);
}

function clearForm() {
    const selectedPaymentMethod = document.getElementById('selectedPaymentMethod');
    const customNameInput = document.getElementById('input-payment-name');
    const fileInput = document.getElementById('qr-upload');
    const preview = document.getElementById('qr-preview');
    const placeholder = document.getElementById('qr-placeholder');

    selectedPaymentMethod.textContent = 'Select Payment';
    selectedPaymentMethod.removeAttribute('data-value');
    customNameInput.value = '';
    fileInput.value = '';

    preview.src = '';
    preview.style.display = 'none';
    placeholder.style.display = 'flex';

}

document.addEventListener('DOMContentLoaded', function() {
    const cancelButtons = document.querySelectorAll('[data-modal-target="discardDetailsModal"]');
    
    cancelButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const selectedMethod = document.getElementById('selectedPaymentMethod');
            const customNameInput = document.getElementById('input-payment-name');
            const fileInput = document.getElementById('qr-upload');
            
            const hasData = selectedMethod.getAttribute('data-value') || 
                           customNameInput.value.trim() || 
                           fileInput.files.length > 0;
            
            if (hasData) {
                if (confirm('Are you sure you want to discard your changes? All unsaved data will be lost.')) {
                    clearForm();
                    window.location.href = 'payment.html';
                }
            } else {
                window.location.href = 'payment.html';
            }
        });
    });

    const discardButtons = document.querySelectorAll('button[onclick*="payment.html"]');
    discardButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const selectedMethod = document.getElementById('selectedPaymentMethod');
            const customNameInput = document.getElementById('input-payment-name');
            const fileInput = document.getElementById('qr-upload');
            
            const hasData = selectedMethod.getAttribute('data-value') || 
                           customNameInput.value.trim() || 
                           fileInput.files.length > 0;
            
            if (hasData) {
                if (confirm('Are you sure you want to discard your changes? All unsaved data will be lost.')) {
                    window.location.href = 'payment.html';
                }
            } else {
                window.location.href = 'payment.html';
            }
        });
    });
});
