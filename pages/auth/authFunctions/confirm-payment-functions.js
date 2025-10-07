// Confirm Payment Functions
// This file handles fetching booking data and populating the confirm-payment page

// Import toast notifications
import { showToastSuccess, showToastError, showToastWarning } from '/src/toastNotification.js';
import { showFullscreenLoading, hideFullscreenLoading } from '/src/fullscreenLoading.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Confirm Payment page loaded');
    
    // Show skeleton loading immediately
    showSkeletonLoading();
    
    // Initialize timeout variable for transaction input debouncing
    window.transactionInputTimeout = null;
    
    // Cleanup timeout on page unload
    window.addEventListener('beforeunload', function() {
        if (window.transactionInputTimeout) {
            clearTimeout(window.transactionInputTimeout);
        }
    });
    
    // Audit: payment initiation (page load implies intent to pay)
    try {
        const uid = localStorage.getItem('userId') || '';
        const role = (localStorage.getItem('role') || 'Guest');
        if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPaymentInitiation === 'function' && uid) {
            window.AuditTrailFunctions.logPaymentInitiation(uid, role.charAt(0).toUpperCase() + role.slice(1));
        }
    } catch (error) {
        console.warn('Audit trail logging failed:', error);
    }
    
    // Get booking ID and payment type from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    const paymentType = urlParams.get('paymentType');
    
    console.log('Booking ID:', bookingId, 'Payment Type:', paymentType);
    
    if (!bookingId) {
        console.error('No booking ID found in URL');
        hideSkeletonLoading();
        showToastError('Missing Booking ID', 'No booking ID found. Please go back and try again.');
        return;
    }
    
    // Fetch and populate booking data
    fetchAndPopulateBookingData(bookingId, paymentType);
    
    // Fetch and populate payment methods
    fetchAndPopulatePaymentMethods();
    
    // Setup OCR file drop functionality
    console.log('🔧 Setting up OCR file drop functionality...');
    setupFileDropOCR();
    
    // Setup payment confirmation functionality
    setupPaymentConfirmation(bookingId, paymentType);
    
    // Setup navigation warnings
    setupNavigationWarnings();
    
    // Setup data mode toggle
    setupDataModeToggle();
});

// Function to fetch payment methods from API
async function fetchPaymentMethods() {
    try {
        console.log('Fetching payment methods...');
        
        const response = await fetch('https://betcha-api.onrender.com/payments/display');
        const result = await response.json();
        
        if (response.ok) {
            console.log('Payment methods fetched successfully:', result);
            return {
                success: true,
                paymentMethods: result
            };
        } else {
            console.error('Failed to fetch payment methods:', result);
            return {
                success: false,
                message: result.message || 'Failed to fetch payment methods'
            };
        }
    } catch (error) {
        console.error('Network error while fetching payment methods:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection and try again.'
        };
    }
}

// Function to fetch and populate payment methods
async function fetchAndPopulatePaymentMethods() {
    try {
        const result = await fetchPaymentMethods();
        
        if (result.success) {
            populatePaymentMethods(result.paymentMethods);
        } else {
            console.error('Failed to load payment methods:', result.message);
            // Don't show error toast for payment methods as it's not critical
            // Keep the static payment methods as fallback
        }
    } catch (error) {
        console.error('Error in fetchAndPopulatePaymentMethods:', error);
        // Keep the static payment methods as fallback
    }
}

// Function to group payment methods by category
function groupPaymentMethodsByCategory(paymentMethods) {
    const allowedCategories = ['GCash', 'Maya', 'GoTyme', 'Union Bank', 'Other'];
    const grouped = {};
    
    // Initialize groups
    allowedCategories.forEach(category => {
        grouped[category] = [];
    });
    
    // Group payment methods - only include ACTIVE ones
    paymentMethods.forEach(method => {
        const category = method.category;
        if (allowedCategories.includes(category) && method.active === true) {
            grouped[category].push(method);
        }
    });
    
    return grouped;
}

// Function to populate payment methods on the page
function populatePaymentMethods(paymentMethods) {
    console.log('Populating payment methods:', paymentMethods);
    
    try {
        // Group payment methods by category
        const groupedMethods = groupPaymentMethodsByCategory(paymentMethods);
        
        // Find the payment methods container - look for the div that contains payment methods
        let paymentContainer = null;
        const containers = document.querySelectorAll('div');
        for (let container of containers) {
            if (container.classList.contains('flex') && 
                container.classList.contains('flex-col') && 
                container.classList.contains('p-5') &&
                container.textContent.includes('Select payment method')) {
                paymentContainer = container;
                break;
            }
        }
        
        if (!paymentContainer) {
            console.warn('Payment methods container not found');
            return;
        }
        
        // Find the existing payment method labels (after the "Select payment method" text)
        const existingLabels = paymentContainer.querySelectorAll('label[for^="payment-"]');
        
        // Remove existing payment method labels
        existingLabels.forEach(label => label.remove());
        
        // Create new payment method options
        let paymentMethodsHtml = '';
        
        Object.entries(groupedMethods).forEach(([category, methods]) => {
            if (methods.length > 0) {
                // Show all methods for each category, not just the first one
                methods.forEach((method, index) => {
                    const categoryId = category.toLowerCase().replace(/\s+/g, '');
                    const methodId = `${categoryId}-${index + 1}`; // Add index to make unique IDs
                    const categoryName = category;
                    const methodName = method.paymentName || category;
                    
                    // Get the logo image
                    const logoSrc = getPaymentLogo(category);
                    
                    paymentMethodsHtml += `
                        <label for="payment-${methodId}" class="flex justify-between items-center p-5 border-b border-b-neutral-300 cursor-pointer hover:bg-neutral-50 transition peer-checked:border-primary">
                            <div class="flex gap-5 justify-center items-center">
                                <div class="w-6 flex justify-center">
                                    <img src="${logoSrc}" alt="${categoryName} logo" onerror="this.style.display='none'">
                                </div>
                                <span class="text-primary-text font-manrope">${methodName}</span>
                            </div>
                            <div class="relative flex items-center">
                                <input 
                                    type="radio" 
                                    name="payment" 
                                    id="payment-${methodId}" 
                                    value="${methodName}"
                                    data-qr="${method.qrPhotoLink}"
                                    data-payment-id="${method._id}"
                                    data-payment-name="${method.paymentName}"
                                    data-category="${category}"
                                    class="peer h-5 w-5 appearance-none rounded-full border border-primary-text checked:border-primary transition-all" 
                                />
                                <span class="absolute bg-primary w-3 h-3 rounded-full opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"></span>
                            </div>
                        </label>
                    `;
                });
            }
        });
        
        // Insert the new payment methods HTML after the "Select payment method:" paragraph
        const selectText = Array.from(paymentContainer.querySelectorAll('p')).find(p => 
            p.textContent.includes('Select payment method:')
        );
        
        if (selectText) {
            selectText.insertAdjacentHTML('afterend', paymentMethodsHtml);
            console.log('Payment methods inserted after "Select payment method:" paragraph');
        } else {
            // Fallback: insert at the beginning of the container if we can't find the paragraph
            console.warn('Could not find "Select payment method:" paragraph, inserting at container start');
            paymentContainer.insertAdjacentHTML('afterbegin', paymentMethodsHtml);
        }
        
        // Add QR code display area after payment methods
        addQRCodeDisplayArea(paymentContainer);
        
        // Setup payment method selection handlers
        setupPaymentMethodHandlers();
        
        console.log('Payment methods populated successfully');
        
        // Store payment methods globally for use in other functions
        window.currentPaymentMethods = groupedMethods;
        
        // Hide skeleton loading for payment methods after they're populated
        hidePaymentMethodsSkeleton();
        
    } catch (error) {
        console.error('Error populating payment methods:', error);
        hidePaymentMethodsSkeleton();
    }
}

// Function to get payment logo based on category
function getPaymentLogo(category) {
    const logoMap = {
        'GCash': '/public/images/gcash.png',
        'Maya': '/public/images/maya.png',
        'GoTyme': '/public/images/gotyme.png',
        'Union Bank': '/public/images/unionbank.jpeg',
        'Other': '/public/images/payment-default.png'
    };
    
    return logoMap[category] || '/public/images/payment-default.png';
}

// Function to add QR code display area
function addQRCodeDisplayArea(paymentContainer) {
    // Check if QR display area already exists
    if (document.getElementById('qrCodeDisplayArea')) {
        return;
    }
    
    const qrDisplayHtml = `
        <div id="qrCodeDisplayArea" class="mt-5 p-5 border border-neutral-300 rounded-lg bg-neutral-50 hidden">
            <div class="text-center">
                <p class="text-sm text-neutral-600 mb-3 font-inter">Scan QR Code to Pay</p>
                <div class="flex justify-center mb-3">
                    <img id="qrCodeImage" src="" alt="Payment QR Code" class="max-w-48 max-h-48 border border-neutral-200 rounded-lg shadow-sm">
                </div>
                <p id="paymentMethodName" class="text-sm font-medium text-primary-text"></p>
                <p class="text-xs text-neutral-500 mt-2">Please complete the payment and upload your proof of payment below.</p>
            </div>
        </div>
    `;
    
    paymentContainer.insertAdjacentHTML('beforeend', qrDisplayHtml);
}

// Function to setup payment method selection handlers
function setupPaymentMethodHandlers() {
    const paymentRadios = document.querySelectorAll('input[name="payment"]');

    function updateOptionStates() {
        const anyChecked = Array.from(paymentRadios).some(r => r.checked);

        paymentRadios.forEach(radio => {
            const label = radio.closest('label');
            if (!label) return;

            if (anyChecked) {
                if (radio.checked) {
                    label.classList.remove('opacity-50', 'grayscale', 'pointer-events-none');
                } else {
                    label.classList.add('opacity-50', 'grayscale');
                    // label.classList.add('pointer-events-none'); // optional hard lock
                }
            } else {
                // No selection yet: everything looks normal
                label.classList.remove('opacity-50', 'grayscale', 'pointer-events-none');
            }
        });
    }

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                showQRCode(this);
                // Update validation rules when payment method changes
                updateBankAccountValidation(this);
            }
            // Always update visual states when a selection changes
            updateOptionStates();
            
            // Check if any payment method is selected
            updateInputStatesBasedOnSelection();
            
            // Update confirm button state
            updateConfirmButtonState();
        });
    });

    // Initialize option states on load (normal if none selected; gray others after selection)
    updateOptionStates();
    
    // Check initial selection state
    updateInputStatesBasedOnSelection();
    
    // Setup bank account/e-wallet validation
    setupBankAccountValidation();
    
    // Setup confirm button validation
    setupConfirmButtonValidation();
}

// Function to update input states based on payment method selection
function updateInputStatesBasedOnSelection() {
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const anySelected = Array.from(paymentRadios).some(radio => radio.checked);
    
    if (anySelected) {
        console.log('✅ Payment method selected - inputs enabled');
    } else {
        console.log('❌ No payment method selected - inputs disabled');
        disablePaymentInputs();
        hideFloatingValidation();
        // Clear validation rules
        window.currentValidationRules = null;
        // Update confirm button state
        updateConfirmButtonState();
    }
}

// Function to setup bank account/e-wallet validation
function setupBankAccountValidation() {
    const bankAccountInput = document.getElementById('bankAccountNumber');
    const transactionInput = document.getElementById('transactionNumber');
    
    if (!bankAccountInput || !transactionInput) {
        console.warn('Input fields not found');
        return;
    }

    // Initially disable inputs since no payment method is selected
    disablePaymentInputs();

    // Create floating validation tooltip
    createFloatingValidationTooltip();

    // Add real-time validation
    bankAccountInput.addEventListener('input', function() {
        validateBankAccountInput(this.value);
        updateConfirmButtonState();
    });

    // Add input restriction to only allow numbers for bank account
    bankAccountInput.addEventListener('keypress', function(e) {
        // Allow only numbers (0-9), backspace, delete, tab, and arrow keys
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Add input restriction to only allow numbers and letters for transaction number
    transactionInput.addEventListener('keypress', function(e) {
        // Allow only alphanumeric characters (a-z, A-Z, 0-9), backspace, delete, tab, and arrow keys
        if (!/[a-zA-Z0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Add input validation for transaction number
    transactionInput.addEventListener('input', async function() {
        updateConfirmButtonState();
        
        // Check amount in real-time if Prod Data mode is enabled
        const transactionNumber = this.value.trim();
        if (isProdDataMode() && transactionNumber.length > 0) {
            console.log('🔍 Transaction input changed in Prod Data mode - checking amount...');
            
            // Add a small delay to avoid too many API calls while typing
            clearTimeout(window.transactionInputTimeout);
            window.transactionInputTimeout = setTimeout(async () => {
                try {
                    const verificationResult = await verifyTransactionAmount(transactionNumber, true);
                    
                    if (verificationResult.success) {
                        console.log('✅ Real-time amount verification passed');
                    } else if (verificationResult.showAmountModal) {
                        console.log('💰 Real-time amount verification - showing amount mismatch modal');
                        showAmountMismatchModal(verificationResult.apiAmount, verificationResult.expectedAmount);
                    } else {
                        console.log('⚠️ Real-time transaction verification failed:', verificationResult.error);
                    }
                } catch (error) {
                    console.error('❌ Error during real-time amount verification:', error);
                }
            }, 1000); // 1 second delay after user stops typing
        }
    });

    // Prevent pasting non-numeric content in bank account field
    bankAccountInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const numericPaste = paste.replace(/\D/g, '');
        this.value = numericPaste;
        validateBankAccountInput(numericPaste);
    });

    // Prevent pasting invalid content in transaction number field
    transactionInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const alphanumericPaste = paste.replace(/[^a-zA-Z0-9]/g, '');
        this.value = alphanumericPaste;
    });

    // Hide tooltip when input loses focus and is valid
    bankAccountInput.addEventListener('blur', function() {
        const rules = window.currentValidationRules;
        if (rules && this.value) {
            const cleanValue = this.value.replace(/\D/g, '');
            if (cleanValue.length === rules.expectedLength && 
                (!rules.isEWallet || cleanValue.startsWith('09'))) {
                hideFloatingValidation();
            }
        }
    });

    console.log('✅ Bank account validation setup complete');
}

// Function to update validation rules based on selected payment method
function updateBankAccountValidation(selectedRadio) {
    const category = selectedRadio.dataset.category || '';
    const paymentName = selectedRadio.dataset.paymentName || '';
    
    console.log(`🔧 Updating validation for payment method: ${paymentName} (${category})`);
    
    // Enable inputs when payment method is selected
    enablePaymentInputs();
    
    // Store current validation rules globally
    window.currentValidationRules = {
        category: category,
        paymentName: paymentName,
        isEWallet: category === 'GCash' || category === 'Maya',
        expectedLength: (category === 'GCash' || category === 'Maya') ? 11 : 9
    };
    
    // Update placeholder text
    const bankAccountInput = document.getElementById('bankAccountNumber');
    if (bankAccountInput) {
        if (window.currentValidationRules.isEWallet) {
            bankAccountInput.placeholder = `Enter your ${category} number (11 digits)`;
        } else {
            bankAccountInput.placeholder = `Enter your ${paymentName} account number (9 digits)`;
        }
    }
    
    // Validate current input
    if (bankAccountInput && bankAccountInput.value) {
        validateBankAccountInput(bankAccountInput.value);
    }
}

// Function to validate bank account input
function validateBankAccountInput(value) {
    // Get current validation rules
    const rules = window.currentValidationRules;
    if (!rules) {
        // No payment method selected yet
        hideFloatingValidation();
        return;
    }

    // Clean the input (remove non-numeric characters for validation)
    const cleanValue = value.replace(/\D/g, '');
    const expectedLength = rules.expectedLength;
    const isEWallet = rules.isEWallet;
    const paymentName = rules.paymentName;

    console.log(`🔍 Validating: "${value}" (clean: "${cleanValue}") for ${paymentName}`);

    if (cleanValue.length === 0) {
        hideFloatingValidation();
        return;
    }

    if (cleanValue.length < expectedLength) {
        showFloatingValidation(
            `${isEWallet ? 'E-wallet' : 'Account'} number must be ${expectedLength} digits. Currently ${cleanValue.length}/${expectedLength}`
        );
    } else if (cleanValue.length > expectedLength) {
        showFloatingValidation(
            `${isEWallet ? 'E-wallet' : 'Account'} number must be exactly ${expectedLength} digits. Currently ${cleanValue.length}/${expectedLength}`
        );
    } else {
        // Exactly the right length
        if (isEWallet) {
            // Additional validation for e-wallets - must start with "09"
            if (!cleanValue.startsWith('09')) {
                showFloatingValidation(
                    `${rules.category} numbers must start with "09"`
                );
            } else {
                showFloatingValidation(
                    `Valid ${rules.category} number format`
                );
            }
        } else {
            showFloatingValidation(
                `Valid account number format`
            );
        }
    }
}

// Function to create floating validation tooltip
function createFloatingValidationTooltip() {
    // Create tooltip element if it doesn't exist
    if (document.getElementById('floatingValidationTooltip')) {
        return; // Already exists
    }

    const tooltip = document.createElement('div');
    tooltip.id = 'floatingValidationTooltip';
    tooltip.className = 'absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg pointer-events-none transition-all duration-200 opacity-0';
    tooltip.style.transform = 'translateY(-5px) scale(0.95)';
    
    document.body.appendChild(tooltip);
    console.log('✅ Floating validation tooltip created');
}

// Function to show floating validation message
function showFloatingValidation(message) {
    const tooltip = document.getElementById('floatingValidationTooltip');
    const bankAccountInput = document.getElementById('bankAccountNumber');
    
    if (!tooltip || !bankAccountInput) return;

    // Update tooltip content and styling
    tooltip.textContent = message;
    tooltip.className = 'absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg pointer-events-none transition-all duration-200';
    
    // Use neutral styling similar to refund information
    tooltip.classList.add('bg-neutral-700', 'text-white', 'border-neutral-600');

    // Position tooltip directly below the input field, aligned horizontally
    const inputRect = bankAccountInput.getBoundingClientRect();
    const margin = 4; // Small margin between input and tooltip

    // Position relative to the input element's parent for better alignment
    tooltip.style.position = 'absolute';
    tooltip.style.left = `${inputRect.left + window.scrollX}px`;
    tooltip.style.top = `${inputRect.bottom + margin + window.scrollY}px`;
    tooltip.style.width = `${inputRect.width}px`; // Match input width
    tooltip.style.textAlign = 'left';
    
    // Show tooltip with animation
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translateY(0) scale(1)';
    
    // Auto-hide messages after 3 seconds for better readability
    clearTimeout(window.validationTimeout);
    window.validationTimeout = setTimeout(() => {
        hideFloatingValidation();
    }, 3000);
}

// Function to hide floating validation message
function hideFloatingValidation() {
    const tooltip = document.getElementById('floatingValidationTooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(-5px) scale(0.95)';
    }
    
    // Clear any pending timeout
    if (window.validationTimeout) {
        clearTimeout(window.validationTimeout);
    }
}

// Function to clear all payment inputs and files
function clearPaymentInputs() {
    const bankAccountInput = document.getElementById('bankAccountNumber');
    const transactionInput = document.getElementById('transactionNumber');
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const qrDisplayArea = document.getElementById('qrCodeDisplayArea');
    
    // Clear input values
    if (bankAccountInput) bankAccountInput.value = '';
    if (transactionInput) transactionInput.value = '';
    
    // Clear file input
    if (fileInput) fileInput.value = '';
    
    // Reset dropzone
    if (dropzone) {
        // Remove any preview images
        const previews = dropzone.querySelectorAll('.preview-image');
        previews.forEach(preview => preview.remove());
        
        // Reset dropzone text
        const dropzoneText = dropzone.querySelector('.dropzone-text');
        if (dropzoneText) {
            dropzoneText.textContent = 'Drag and drop or click to upload payment receipt';
        }
    }
    
    // Hide QR code display
    if (qrDisplayArea) {
        qrDisplayArea.classList.add('hidden');
    }
    
    // Uncheck all payment method radios
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    paymentRadios.forEach(radio => radio.checked = false);
    
    // Update UI states
    updateInputStatesBasedOnSelection();
    updateConfirmButtonState();
}

// Function to disable payment inputs when no payment method is selected
function disablePaymentInputs() {
    const bankAccountInput = document.getElementById('bankAccountNumber');
    const transactionInput = document.getElementById('transactionNumber');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    
    if (bankAccountInput) {
        bankAccountInput.disabled = true;
        bankAccountInput.placeholder = 'Select a payment method first';
        bankAccountInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        bankAccountInput.value = ''; // Clear any existing value
        
        // Add click handler to show reminder
        bankAccountInput.addEventListener('click', showPaymentMethodReminder);
        console.log('🔒 Bank account input disabled');
    }
    
    if (transactionInput) {
        transactionInput.disabled = true;
        transactionInput.placeholder = 'Select a payment method first';
        transactionInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        transactionInput.value = ''; // Clear any existing value
        
        // Add click handler to show reminder
        transactionInput.addEventListener('click', showPaymentMethodReminder);
        console.log('🔒 Transaction input disabled');
    }
    
    // Disable dropzone and file input
    if (dropzone) {
        dropzone.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        dropzone.setAttribute('data-disabled', 'true');
        
        // Add overlay text to indicate dropzone is disabled
        let disabledOverlay = dropzone.querySelector('.disabled-overlay');
        if (!disabledOverlay) {
            disabledOverlay = document.createElement('div');
            disabledOverlay.className = 'disabled-overlay absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center z-10 rounded-lg';
            disabledOverlay.innerHTML = `
                <div class="text-center">
                    <p class="text-sm font-medium text-gray-600">Select a payment method first</p>
                    <p class="text-xs text-gray-500">to upload receipt</p>
                </div>
            `;
            dropzone.style.position = 'relative';
            dropzone.appendChild(disabledOverlay);
        }
        console.log('🔒 Dropzone disabled');
    }
    
    if (fileInput) {
        fileInput.disabled = true;
        console.log('🔒 File input disabled');
    }
    
    // Update confirm button state after clearing inputs
    updateConfirmButtonState();
}

// Function to enable payment inputs when payment method is selected
function enablePaymentInputs() {
    const bankAccountInput = document.getElementById('bankAccountNumber');
    const transactionInput = document.getElementById('transactionNumber');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    
    if (bankAccountInput) {
        bankAccountInput.disabled = false;
        bankAccountInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        
        // Remove click handler
        bankAccountInput.removeEventListener('click', showPaymentMethodReminder);
        console.log('🔓 Bank account input enabled');
    }
    
    if (transactionInput) {
        transactionInput.disabled = false;
        transactionInput.placeholder = 'Enter transaction number';
        transactionInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
        
        // Remove click handler
        transactionInput.removeEventListener('click', showPaymentMethodReminder);
        console.log('🔓 Transaction input enabled');
    }
    
    // Enable dropzone and file input
    if (dropzone) {
        dropzone.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        dropzone.removeAttribute('data-disabled');
        
        // Remove disabled overlay
        const disabledOverlay = dropzone.querySelector('.disabled-overlay');
        if (disabledOverlay) {
            disabledOverlay.remove();
        }
        console.log('🔓 Dropzone enabled');
    }
    
    if (fileInput) {
        fileInput.disabled = false;
        console.log('🔓 File input enabled');
    }
    
    // Update confirm button state after enabling inputs
    updateConfirmButtonState();
}

// Function to show reminder when clicking disabled inputs
function showPaymentMethodReminder() {
    showToastWarning('Payment Method Required', 'Please select a payment method first before entering payment details.');
}

// Function to setup confirm button validation
function setupConfirmButtonValidation() {
    const confirmButton = document.getElementById('confirmPaymentButton');
    if (!confirmButton) {
        console.warn('Confirm payment button not found');
        return;
    }

    // Initially disable the confirm button
    disableConfirmButton();
    
    console.log('✅ Confirm button validation setup complete');
}

// Function to validate all form inputs
function validateAllInputs() {
    const paymentSelected = document.querySelector('input[name="payment"]:checked');
    const transactionInput = document.getElementById('transactionNumber');
    const bankAccountInput = document.getElementById('bankAccountNumber');
    
    // Check if payment method is selected
    if (!paymentSelected) {
        return { isValid: false, reason: 'No payment method selected' };
    }
    
    // Check if transaction number is filled
    if (!transactionInput || !transactionInput.value.trim()) {
        return { isValid: false, reason: 'Transaction number is empty' };
    }
    
    // Check if bank account number is filled
    if (!bankAccountInput || !bankAccountInput.value.trim()) {
        return { isValid: false, reason: 'Bank account number is empty' };
    }
    
    // Validate bank account format
    const rules = window.currentValidationRules;
    if (rules) {
        const cleanValue = bankAccountInput.value.replace(/\D/g, '');
        
        // Check correct length
        if (cleanValue.length !== rules.expectedLength) {
            return { isValid: false, reason: 'Bank account number has incorrect length' };
        }
        
        // Check "09" prefix for e-wallets
        if (rules.isEWallet && !cleanValue.startsWith('09')) {
            return { isValid: false, reason: 'E-wallet number must start with "09"' };
        }
    }
    
    return { isValid: true, reason: 'All inputs are valid' };
}

// Function to update confirm button state
function updateConfirmButtonState() {
    const validation = validateAllInputs();
    
    console.log('🔍 Form validation result:', validation);
    
    if (validation.isValid) {
        enableConfirmButton();
    } else {
        disableConfirmButton();
    }
}

// Function to disable confirm button
function disableConfirmButton() {
    const confirmButton = document.getElementById('confirmPaymentButton');
    if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.classList.add('opacity-50', 'cursor-not-allowed');
        confirmButton.classList.remove('hover:bg-primary-dark', 'focus:ring-primary');
        console.log('🔒 Confirm button disabled');
    }
}

// Function to enable confirm button
function enableConfirmButton() {
    const confirmButton = document.getElementById('confirmPaymentButton');
    if (confirmButton) {
        confirmButton.disabled = false;
        confirmButton.classList.remove('opacity-50', 'cursor-not-allowed');
        confirmButton.classList.add('hover:bg-primary-dark', 'focus:ring-primary');
        console.log('🔓 Confirm button enabled');
    }
}

// Function to show QR code when payment method is selected
function showQRCode(selectedRadio) {
    const qrDisplayArea = document.getElementById('qrCodeDisplayArea');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const paymentMethodName = document.getElementById('paymentMethodName');
    
    if (!qrDisplayArea || !qrCodeImage || !paymentMethodName) {
        console.warn('QR display elements not found');
        return;
    }
    
    try {
        // Get QR code and payment method name from the selected radio button
        const qrData = selectedRadio.getAttribute('data-qr');
        const paymentName = selectedRadio.getAttribute('data-payment-name');
        const paymentId = selectedRadio.getAttribute('data-payment-id');
        
        if (!qrData) {
            console.warn('No QR data found for selected payment method');
            qrDisplayArea.classList.add('hidden');
            return;
        }
        
        // Update QR code image
        qrCodeImage.src = qrData;
        qrCodeImage.onerror = function() {
            console.error('Failed to load QR code image');
            this.src = '/public/images/qr-placeholder.png'; // Fallback image
        };
        
        // Update payment method name
        paymentMethodName.textContent = paymentName || 'Selected Payment Method';
        
        // Show the QR display area
        qrDisplayArea.classList.remove('hidden');
        
        // Store selected payment info globally
        window.selectedPaymentMethod = {
            id: paymentId,
            name: paymentName,
            qrData: qrData,
            radioElement: selectedRadio
        };
        
        console.log('QR code displayed for payment method:', paymentName);
        
        // Scroll to QR code area smoothly
        qrDisplayArea.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
        
    } catch (error) {
        console.error('Error displaying QR code:', error);
        qrDisplayArea.classList.add('hidden');
    }
}

// Function to fetch booking data from API
async function fetchBookingData(bookingId) {
    try {
        console.log('Fetching booking data for ID:', bookingId);
        
        const response = await fetch(`https://betcha-api.onrender.com/booking/${bookingId}`);
        const result = await response.json();
        
        console.log('API Response Status:', response.status, response.statusText);
        console.log('Full API Response:', JSON.stringify(result, null, 2));
        
        if (response.ok) {
            console.log('Booking data fetched successfully:', result);
            
            // Check if the response has the expected structure
            if (result.booking) {
                console.log('Found booking object in response.booking');
                return {
                    success: true,
                    booking: result.booking
                };
            } else if (result.message && result.message.includes('Booking retrieved successfully')) {
                console.log('API returned success message, using result.booking');
                return {
                    success: true,
                    booking: result.booking
                };
            } else {
                console.log('Unexpected response structure, using result directly');
                return {
                    success: true,
                    booking: result
                };
            }
        } else {
            console.error('Failed to fetch booking data:', result);
            return {
                success: false,
                message: result.message || 'Failed to fetch booking data'
            };
        }
    } catch (error) {
        console.error('Network error while fetching booking data:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection and try again.'
        };
    }
}

// Function to check if a specific payment type has already been made
function checkIfPaymentAlreadyMade(booking, paymentType) {
    try {
        console.log('🔍 Checking payment status for:', paymentType);
        console.log('📊 Full booking data structure:', JSON.stringify(booking, null, 2));
        console.log('📋 Booking payment data:', {
            reservation: booking.reservation,
            package: booking.package,
            paymentCategory: booking.paymentCategory,
            bookingStatus: booking.status
        });
        
        if (paymentType === 'Reservation') {
            // Check if reservation payment is made
            // Payment is made if modeOfPayment is NOT "Pending" (means payment method was used)
            const reservationPaid = booking.reservation && 
                                  booking.reservation.modeOfPayment && 
                                  booking.reservation.modeOfPayment !== 'Pending';
            
            console.log('💰 Reservation payment check:', {
                modeOfPayment: booking.reservation?.modeOfPayment,
                status: booking.reservation?.status,
                isPaid: reservationPaid
            });
            
            return reservationPaid;
            
        } else if (paymentType === 'Package') {
            // Check if package payment is made
            // Payment is made if modeOfPayment is NOT "Pending" (means payment method was used)
            const packagePaid = booking.package && 
                              booking.package.modeOfPayment && 
                              booking.package.modeOfPayment !== 'Pending';
            
            console.log('📦 Package payment check:', {
                modeOfPayment: booking.package?.modeOfPayment,
                status: booking.package?.status,
                isPaid: packagePaid
            });
            
            return packagePaid;
            
        } else if (paymentType === 'Full-Payment') {
            // For full payment, check if both reservation and package payments are made
            const reservationPaid = booking.reservation && 
                                  booking.reservation.modeOfPayment && 
                                  booking.reservation.modeOfPayment !== 'Pending';
            
            const packagePaid = booking.package && 
                              booking.package.modeOfPayment && 
                              booking.package.modeOfPayment !== 'Pending';
            
            const fullPaymentPaid = reservationPaid && packagePaid;
            
            console.log('💳 Full payment check:', {
                reservationPaid,
                packagePaid,
                fullPaymentPaid,
                reservationModeOfPayment: booking.reservation?.modeOfPayment,
                packageModeOfPayment: booking.package?.modeOfPayment
            });
            
            return fullPaymentPaid;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error checking payment status:', error);
        return false;
    }
}

// Function to fetch and populate booking data
async function fetchAndPopulateBookingData(bookingId, paymentType) {
    try {
        const result = await fetchBookingData(bookingId);
        
        if (result.success) {
            console.log('✅ Booking data loaded successfully');
            console.log('🔍 Full booking object received:', JSON.stringify(result.booking, null, 2));
            
            // Check if the requested payment type is already paid
            const isAlreadyPaid = checkIfPaymentAlreadyMade(result.booking, paymentType);
            
            console.log(`💳 Payment check result for ${paymentType}:`, isAlreadyPaid);
            
            if (isAlreadyPaid) {
                console.log(`🚫 ${paymentType} payment already made, redirecting to view-booking`);
                console.log('📍 Redirect URL:', `view-booking.html?bookingId=${bookingId}`);
                
                showToastSuccess('Already Paid!', `${paymentType} has already been paid for this booking. Redirecting to booking details...`);
                
                // Redirect back to view-booking after a short delay to show the toast
                console.log('🔄 Initiating redirect...');
                setTimeout(() => {
                    window.location.href = `view-booking.html?bookingId=${bookingId}`;
                }, 1500);
                return;
            }
            
            console.log('✅ Payment not yet made, proceeding to populate payment form');
            populatePaymentData(result.booking, paymentType);
            
            // Hide skeleton loading after data is populated
            setTimeout(() => {
                hideSkeletonLoading();
            }, 500); // Small delay to ensure smooth transition
        } else {
            console.error('❌ Failed to load booking data:', result.message);
            hideSkeletonLoading();
            showToastError('Booking Error', result.message || 'Failed to load booking details.');
        }
    } catch (error) {
        console.error('Error in fetchAndPopulateBookingData:', error);
        hideSkeletonLoading();
        showToastError('Error', 'An unexpected error occurred while loading booking data.');
    }
}

// Function to populate payment data on the page
function populatePaymentData(booking, paymentType) {
    try {
        console.log('Populating payment data:', booking, 'Payment type:', paymentType);
        console.log('Raw booking object keys:', Object.keys(booking));
        console.log('Raw booking object:', JSON.stringify(booking, null, 2));
        
        // Only populate elements that exist in the HTML
        // Let's check the actual field names from your API sample:
        // From your API sample, the fields should be:
        // packageFee: 1, reservationFee: 100, additionalPaxPrice: 100, additionalPax: 2, numOfDays: 3, totalFee: 302.97
        
        const packageFee = booking.packageFee || 0;
        const reservationFee = booking.reservationFee || 0;
        const additionalPaxPrice = booking.additionalPaxPrice || 0;
        const additionalPax = booking.additionalPax || 0;
        const numOfDays = booking.numOfDays || 1;
        const totalFee = booking.totalFee || 0;
        const discount = booking.discount || 0;
        
        console.log('Extracted values:', {
            packageFee: `${packageFee} (from booking.packageFee)`,
            reservationFee: `${reservationFee} (from booking.reservationFee)`,
            additionalPaxPrice: `${additionalPaxPrice} (from booking.additionalPaxPrice)`,
            additionalPax: `${additionalPax} (from booking.additionalPax)`,
            numOfDays: `${numOfDays} (from booking.numOfDays)`,
            totalFee: `${totalFee} (from booking.totalFee)`,
            discount: `${discount} (from booking.discount)`
        });
        
        console.log('🔍 Full booking object for discount check:', {
            hasDiscountField: 'discount' in booking,
            discountValue: booking.discount,
            discountType: typeof booking.discount,
            bookingKeys: Object.keys(booking)
        });
        
        console.log('🔍 Discount processing:', {
            hasDiscount: discount > 0,
            discountValue: discount,
            discountPercentage: calculateDiscountPercentage(booking)
        });
        
        // Determine the amount to pay based on payment type
        const amountToPay = getPaymentAmount(booking, paymentType);
        
        // Calculate discount percentage if discount exists
        const discountPercentage = calculateDiscountPercentage(booking);
        const discountAmount = calculateDiscountAmount(booking);
        
        // Update payment type indicator
        updatePaymentTypeIndicator(paymentType, amountToPay);
        
        // Calculate subtotal (package fee + additional guests)
        const subtotal = (packageFee * numOfDays) + (additionalPaxPrice * additionalPax);
        console.log('🧮 Calculated subtotal:', subtotal);
        
        // Populate price elements that exist in HTML
        populateElement('pricePerDay', packageFee.toLocaleString());
        populateElement('daysOfStay', numOfDays.toString());
        populateElement('totalPriceDay', (packageFee * numOfDays).toLocaleString());
        
        populateElement('addGuestPrice', additionalPaxPrice.toLocaleString());
        populateElement('addGuestCount', additionalPax.toString());
        populateElement('totalAddGuest', (additionalPaxPrice * additionalPax).toLocaleString());
        
        // Populate subtotal
        populateElement('subtotal', subtotal.toLocaleString());
        
        // Handle reservation fee display based on payment type
        const reservationFeeSection = document.getElementById('reservationFeeSection') || 
                                     document.querySelector('.reservation-fee-row') ||
                                     document.getElementById('reservationFee')?.closest('div');
        
        if (paymentType === 'Full Payment') {
            // Hide reservation fee for full payment
            console.log('🎨 Hiding reservation fee for Full Payment');
            populateElement('reservationFee', '0');
            if (reservationFeeSection) {
                reservationFeeSection.style.display = 'none';
                console.log('✅ Reservation fee section hidden for Full Payment');
            }
        } else {
            // Show reservation fee for other payment types
            console.log('🎨 Showing reservation fee for', paymentType);
            populateElement('reservationFee', reservationFee.toLocaleString());
            if (reservationFeeSection) {
                reservationFeeSection.style.display = 'flex';
                console.log('✅ Reservation fee section shown for', paymentType);
            }
        }
        
        // Handle discount display
        console.log('🎨 Processing discount display:', { 
            originalDiscount: discount, 
            discountPercentage, 
            discountAmount 
        });
        
        const discountSection = document.getElementById('discountSection');
        console.log('🔍 Discount section element found:', !!discountSection);
        
        // FOR TESTING: Always show discount with mock data if no real discount exists
        const DEVELOPMENT_MODE = false; // Set to false in production
        const mockDiscount = 50;
        const mockDiscountPercentage = 10.5;
        
        if (discount > 0) {
            console.log('✅ Discount found, showing discount section');
            populateElement('discount', discountAmount.toLocaleString());
            populateElement('discountPercentage', `${discountPercentage}%`);
            
            // Show discount section
            if (discountSection) {
                discountSection.style.display = 'flex';
                console.log('✅ Discount section made visible');
            }
        } else if (DEVELOPMENT_MODE && discount === 0) {
            console.log('🔧 Development mode: showing mock discount');
            populateElement('discount', mockDiscount.toLocaleString());
            populateElement('discountPercentage', `${mockDiscountPercentage}%`);
            
            // Show discount section with mock data
            if (discountSection) {
                discountSection.style.display = 'flex';
                console.log('✅ Mock discount section made visible');
            }
        } else {
            console.log('❌ No discount found, hiding discount section');
            // Hide discount section if no discount
            if (discountSection) {
                discountSection.style.display = 'none';
                console.log('✅ Discount section hidden');
            }
        }
        
        populateElement('totalPrice', amountToPay.toLocaleString());
        
        console.log('Payment data populated successfully');
        console.log('Final populated values:', {
            packageFee,
            numOfDays,
            additionalPaxPrice, 
            additionalPax,
            reservationFee,
            discount,
            discountAmount,
            discountPercentage,
            amountToPay,
            paymentType
        });
        
        // Ensure input fields are visible after data population
        ensureInputFieldsVisible();
        
    } catch (error) {
        console.error('Error populating payment data:', error);
        showToastError('Data Error', 'Error displaying payment information.');
    }
}

// Function to ensure input fields are visible
function ensureInputFieldsVisible() {
    console.log('🔧 Ensuring input fields are visible...');
    
    const inputIds = ['transactionNumber', 'bankAccountNumber'];
    inputIds.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // Remove any display: none styling
            input.style.display = '';
            
            // Check if it's still hidden by computed styles
            const computedStyle = window.getComputedStyle(input);
            if (computedStyle.display === 'none') {
                input.style.display = 'block';
                console.log(`🔧 Force displayed ${inputId} as block`);
            }
            
            // Make sure it's not hidden by visibility
            if (computedStyle.visibility === 'hidden') {
                input.style.visibility = 'visible';
                console.log(`🔧 Force set visibility for ${inputId}`);
            }
            
            console.log(`✅ ${inputId} final state:`, {
                display: input.style.display,
                computedDisplay: computedStyle.display,
                visible: input.offsetParent !== null
            });
        } else {
            console.warn(`❌ Input field not found: ${inputId}`);
        }
    });
}

// Helper function to populate an element safely
function populateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        console.log(`Populated ${elementId} with: ${value}`);
    } else {
        console.warn(`Element with ID '${elementId}' not found`);
    }
}

// Function to update payment type indicator
function updatePaymentTypeIndicator(paymentType, amountToPay) {
    try {
        const paymentTypeElement = document.getElementById('paymentType');
        const paymentTypeDescElement = document.getElementById('paymentTypeDescription');
        
        if (paymentTypeElement && paymentTypeDescElement) {
            if (paymentType === 'Reservation') {
                paymentTypeElement.textContent = 'Reservation Fee';
                paymentTypeDescElement.textContent = 'Secure your booking with a reservation fee - pay the remaining balance later';
            } else if (paymentType === 'Package') {
                paymentTypeElement.textContent = 'Package Payment';
                paymentTypeDescElement.textContent = 'Pay for your package - complete your booking experience';
            } else {
                paymentTypeElement.textContent = 'Full Payment';
                paymentTypeDescElement.textContent = 'Complete payment for your entire booking';
            }
            
            console.log(`Updated payment type indicator: ${paymentType} - ₱${amountToPay.toLocaleString()}`);
        } else {
            console.warn('Payment type indicator elements not found');
        }
    } catch (error) {
        console.error('Error updating payment type indicator:', error);
    }
}

// Function to get payment amount based on type
function getPaymentAmount(booking, paymentType) {
    if (paymentType === 'Reservation') {
        return booking.reservationFee || 0;
    } else if (paymentType === 'Package') {
        // Package amount = ((packageFee × days) + (additionalPaxPrice × additionalPax)) - discount - reservationFee
        // Step 1: Calculate base subtotal
        const packageFee = booking.packageFee || 0;
        const numOfDays = booking.numOfDays || 1;
        const additionalPaxPrice = booking.additionalPaxPrice || 0;
        const additionalPax = booking.additionalPax || 0;
        const reservationFee = booking.reservationFee || 0;
        const discount = booking.discount || 0;
        
        // Step 2: Calculate subtotal (before discount and before reservation fee)
        const subtotal = (packageFee * numOfDays) + (additionalPaxPrice * additionalPax);
        
        // Step 3: Calculate discount amount on discount base (subtotal - reservation fee)
        const discountBase = subtotal - reservationFee;
        let discountAmount = 0;
        if (discount > 0 && discount <= 100) {
            // Percentage discount on discount base (excludes reservation fee)
            discountAmount = Math.round((discountBase * discount) / 100);
        } else if (discount > 100) {
            // Absolute discount amount
            discountAmount = discount;
        }
        
        // Step 4: Calculate subtotal after discount
        const subtotalAfterDiscount = subtotal - discountAmount;
        
        // Step 5: Subtract reservation fee (since it's already paid separately)
        const packageAmount = subtotalAfterDiscount - reservationFee;
        
        console.log('Package payment calculation (reservation fee excluded from discount):', {
            packageFee,
            numOfDays,
            additionalPaxPrice,
            additionalPax,
            subtotal: subtotal,
            reservationFee,
            discountBase,
            discount: discount,
            discountAmount: discountAmount,
            subtotalAfterDiscount: subtotalAfterDiscount,
            finalPackageAmount: packageAmount,
            calculation: `((${subtotal} - ${reservationFee}) × ${discount}% = ${discountAmount}) → (${subtotal} - ${discountAmount}) - ${reservationFee} = ${packageAmount}`
        });
        
        return Math.max(0, packageAmount); // Ensure it's never negative
    } else {
        // For full payment, calculate: (Subtotal - Discount) without subtracting reservation fee
        const packageFee = booking.packageFee || 0;
        const numOfDays = booking.numOfDays || 1;
        const additionalPaxPrice = booking.additionalPaxPrice || 0;
        const additionalPax = booking.additionalPax || 0;
        const reservationFee = booking.reservationFee || 0;
        const discount = booking.discount || 0;
        
        // Calculate subtotal (WITHOUT reservation fee for full payment)
        const subtotal = (packageFee * numOfDays) + (additionalPaxPrice * additionalPax);
        
        // Calculate discount amount on discount base (subtotal - reservation fee)
        const discountBase = subtotal - reservationFee;
        let discountAmount = 0;
        if (discount > 0) {
            if (discount <= 1) {
                // Discount is already a decimal (e.g., 0.05 for 5%)
                discountAmount = discountBase * discount;
            } else if (discount <= 100) {
                // Discount is a percentage (e.g., 5 for 5%) - apply to discount base
                discountAmount = (discountBase * discount) / 100;
            } else {
                // Discount is an absolute amount
                discountAmount = discount;
            }
        }
        
        // Full payment = Subtotal - Discount (reservation fee NOT subtracted)
        const fullPaymentAmount = subtotal - discountAmount;
        
        console.log('Full payment calculation (reservation fee excluded from discount):', {
            packageFee,
            numOfDays,
            additionalPaxPrice,
            additionalPax,
            reservationFee,
            discountBase,
            discount,
            subtotal,
            discountAmount,
            finalFullPaymentAmount: fullPaymentAmount,
            calculation: `((${subtotal} - ${reservationFee}) × ${discount}% = ${discountAmount}) → (${subtotal} - ${discountAmount}) = ${fullPaymentAmount}`
        });
        
        return Math.max(0, fullPaymentAmount); // Ensure it's never negative
    }
}

// Function to calculate discount percentage
function calculateDiscountPercentage(booking) {
    try {
        const discount = booking.discount || 0;
        const totalFee = booking.totalFee || 0;
        
        if (discount === 0 || totalFee === 0) {
            return 0;
        }
        
        // Check if discount is already a percentage (typically less than 100)
        // or if it's an absolute amount (typically larger than 100)
        if (discount <= 100) {
            // Discount is likely already a percentage
            console.log('Discount appears to be a percentage:', discount);
            return discount;
        } else {
            // Discount is an absolute amount, calculate percentage
            console.log('Discount appears to be an absolute amount:', discount);
            
            // Calculate the original total before discount
            const originalTotal = totalFee + discount;
            
            // Calculate percentage: (discount / originalTotal) * 100
            const percentage = (discount / originalTotal) * 100;
            
            // Round to 1 decimal place
            const roundedPercentage = Math.round(percentage * 10) / 10;
            
            console.log('Discount percentage calculation (absolute):', {
                discount,
                totalFee,
                originalTotal,
                percentage,
                roundedPercentage
            });
            
            return roundedPercentage;
        }
    } catch (error) {
        console.error('Error calculating discount percentage:', error);
        return 0;
    }
}

// Function to calculate discount amount from percentage
function calculateDiscountAmount(booking) {
    try {
        const discount = booking.discount || 0;
        
        if (discount === 0) {
            return 0;
        }
        
        // Check if discount is already a percentage or absolute amount
        if (discount <= 100) {
            // Discount is a percentage, calculate the amount from discount base (subtotal - reservation fee)
            const packageFee = booking.packageFee || 0;
            const numOfDays = booking.numOfDays || 1;
            const additionalPaxPrice = booking.additionalPaxPrice || 0;
            const additionalPax = booking.additionalPax || 0;
            const reservationFee = booking.reservationFee || 0;
            
            // Calculate subtotal (before discount and before reservation fee)
            const subtotal = (packageFee * numOfDays) + (additionalPaxPrice * additionalPax);
            
            // Discount base = subtotal - reservation fee (reservation fee excluded from discount)
            const discountBase = subtotal - reservationFee;
            
            // Calculate discount amount from percentage on discount base
            const discountAmount = (discountBase * discount) / 100;
            
            console.log('Discount amount calculation (reservation fee excluded):', {
                discountPercentage: discount,
                packageFee,
                numOfDays,
                additionalPaxPrice,
                additionalPax,
                reservationFee,
                subtotal,
                discountBase,
                calculatedDiscountAmount: discountAmount,
                calculation: `(${subtotal} - ${reservationFee}) × ${discount}% = ${discountAmount}`
            });
            
            return Math.round(discountAmount);
        } else {
            // Discount is already an absolute amount
            console.log('Discount is already an absolute amount:', discount);
            return discount;
        }
    } catch (error) {
        console.error('Error calculating discount amount:', error);
        return 0;
    }
}

// Export functions for use in other scripts
window.fetchBookingData = fetchBookingData;
window.populatePaymentData = populatePaymentData;
window.getPaymentAmount = getPaymentAmount;
window.fetchPaymentMethods = fetchPaymentMethods;
window.populatePaymentMethods = populatePaymentMethods;
window.showQRCode = showQRCode;
window.checkIfPaymentAlreadyMade = checkIfPaymentAlreadyMade;

// Skeleton loading functions
function showSkeletonLoading() {
    console.log('🔄 Showing skeleton loading...');
    
    // Create skeleton loading styles if not already present
    if (!document.getElementById('skeleton-styles')) {
        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.textContent = `
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
            }
            
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .skeleton-text {
                height: 1rem;
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }
            
            .skeleton-text-lg {
                height: 1.5rem;
                border-radius: 4px;
                margin-bottom: 0.75rem;
            }
            
            .skeleton-button {
                height: 2.5rem;
                border-radius: 6px;
                margin-bottom: 1rem;
            }
            
            .skeleton-input {
                height: 2.25rem;
                border-radius: 4px;
                margin-bottom: 1rem;
            }
            
            .skeleton-card {
                height: 4rem;
                border-radius: 8px;
                margin-bottom: 0.75rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add skeleton loading to payment type section
    addSkeletonToElement('paymentType', 'skeleton-text-lg', '60%');
    addSkeletonToElement('paymentTypeDescription', 'skeleton-text', '80%');
    
    // Add skeleton loading to price elements
    const priceElements = [
        'pricePerDay', 'daysOfStay', 'totalPriceDay',
        'addGuestPrice', 'addGuestCount', 'totalAddGuest',
        'reservationFee', 'discount', 'discountPercentage', 'totalPrice'
    ];
    
    priceElements.forEach(elementId => {
        addSkeletonToElement(elementId, 'skeleton-text', '50%');
    });
    
    // Add skeleton loading to payment methods container
    const paymentContainer = document.querySelector('.flex.flex-col.p-5');
    if (paymentContainer) {
        const existingPaymentMethods = paymentContainer.querySelectorAll('label[for^="payment-"]');
        existingPaymentMethods.forEach(method => method.style.display = 'none');
        
        // Add skeleton payment method cards
        for (let i = 0; i < 5; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'skeleton skeleton-card payment-method-skeleton';
            paymentContainer.appendChild(skeletonCard);
        }
    }
    
    // Add skeleton loading to form inputs
    addSkeletonToInput('transactionNumber');
    addSkeletonToInput('bankAccountNumber');
    
    // Add skeleton loading to confirm button
    const confirmButton = document.getElementById('confirmPaymentButton1');
    if (confirmButton) {
        confirmButton.style.display = 'none';
        const skeletonButton = document.createElement('div');
        skeletonButton.className = 'skeleton skeleton-button confirm-button-skeleton';
        skeletonButton.style.width = '100%';
        confirmButton.parentNode.insertBefore(skeletonButton, confirmButton);
    }
}

function hideSkeletonLoading() {
    console.log('✅ Hiding skeleton loading...');
    
    // Debug: Check current state of input fields before restoration
    const transactionInput = document.getElementById('transactionNumber');
    const bankAccountInput = document.getElementById('bankAccountNumber');
    console.log('🔍 Input fields before restoration:', {
        transactionNumber: {
            found: !!transactionInput,
            display: transactionInput?.style.display,
            visible: transactionInput?.offsetParent !== null
        },
        bankAccountNumber: {
            found: !!bankAccountInput,
            display: bankAccountInput?.style.display,
            visible: bankAccountInput?.offsetParent !== null
        }
    });
    
    // Remove skeleton classes and restore original content
    document.querySelectorAll('.skeleton').forEach(element => {
        if (element.classList.contains('payment-method-skeleton') || 
            element.classList.contains('confirm-button-skeleton') ||
            element.classList.contains('input-skeleton')) {
            element.remove();
            console.log('🗑️ Removed skeleton element:', element.className);
        } else {
            element.classList.remove('skeleton', 'skeleton-text', 'skeleton-text-lg', 'skeleton-input');
            element.style.width = '';
            element.style.height = '';
        }
    });
    
    // Restore input fields visibility
    const inputIds = ['transactionNumber', 'bankAccountNumber'];
    inputIds.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.style.display = '';
            console.log(`✅ Restored visibility for input: ${inputId}, new display: ${input.style.display}`);
        } else {
            console.warn(`❌ Input not found: ${inputId}`);
        }
    });
    
    // Restore payment methods visibility
    const paymentContainer = document.querySelector('.flex.flex-col.p-5');
    if (paymentContainer) {
        const existingPaymentMethods = paymentContainer.querySelectorAll('label[for^="payment-"]');
        existingPaymentMethods.forEach(method => method.style.display = '');
    }
    
    // Restore confirm button
    const confirmButton = document.getElementById('confirmPaymentButton1');
    if (confirmButton) {
        confirmButton.style.display = '';
    }
    
    // Remove skeleton payment method cards
    document.querySelectorAll('.payment-method-skeleton').forEach(skeleton => {
        skeleton.remove();
    });
    
    // Remove skeleton button
    document.querySelectorAll('.confirm-button-skeleton').forEach(skeleton => {
        skeleton.remove();
    });
    
    // Final check: Verify input fields are visible
    setTimeout(() => {
        const transactionInput = document.getElementById('transactionNumber');
        const bankAccountInput = document.getElementById('bankAccountNumber');
        console.log('🔍 Final input fields state:', {
            transactionNumber: {
                found: !!transactionInput,
                display: transactionInput?.style.display,
                visible: transactionInput?.offsetParent !== null,
                computedDisplay: transactionInput ? window.getComputedStyle(transactionInput).display : 'N/A'
            },
            bankAccountNumber: {
                found: !!bankAccountInput,
                display: bankAccountInput?.style.display,
                visible: bankAccountInput?.offsetParent !== null,
                computedDisplay: bankAccountInput ? window.getComputedStyle(bankAccountInput).display : 'N/A'
            }
        });
        
        // Force show if they're still hidden
        if (transactionInput && window.getComputedStyle(transactionInput).display === 'none') {
            transactionInput.style.display = 'block';
            console.log('🔧 Force showed transactionNumber input');
        }
        if (bankAccountInput && window.getComputedStyle(bankAccountInput).display === 'none') {
            bankAccountInput.style.display = 'block';
            console.log('🔧 Force showed bankAccountNumber input');
        }
        
        // Call the dedicated function to ensure input fields are visible
        ensureInputFieldsVisible();
    }, 100);
}

function addSkeletonToElement(elementId, skeletonClass, width = '100%') {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('skeleton', skeletonClass);
        element.style.width = width;
        element.textContent = '';
    }
}

function addSkeletonToInput(elementId) {
    const element = document.getElementById(elementId);
    console.log(`🔧 Adding skeleton to input: ${elementId}`, {
        found: !!element,
        currentDisplay: element?.style.display,
        parentNode: !!element?.parentNode
    });
    
    if (element) {
        element.style.display = 'none';
        const skeletonInput = document.createElement('div');
        skeletonInput.className = 'skeleton skeleton-input input-skeleton';
        skeletonInput.style.width = '100%';
        skeletonInput.setAttribute('data-original-input', elementId); // Add identifier for debugging
        element.parentNode.insertBefore(skeletonInput, element);
        console.log(`✅ Skeleton added for ${elementId}, original input hidden`);
    } else {
        console.warn(`❌ Input element not found: ${elementId}`);
    }
}

function hidePaymentMethodsSkeleton() {
    console.log('✅ Hiding payment methods skeleton...');
    
    // Remove skeleton payment method cards
    document.querySelectorAll('.payment-method-skeleton').forEach(skeleton => {
        skeleton.remove();
    });
    
    // Restore payment methods visibility
    const paymentContainer = document.querySelector('.flex.flex-col.p-5');
    if (paymentContainer) {
        const existingPaymentMethods = paymentContainer.querySelectorAll('label[for^="payment-"]');
        existingPaymentMethods.forEach(method => method.style.display = '');
    }
}

function setupFileDropOCR() {
    console.log('🔧 setupFileDropOCR called');
    
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const transactionInput = document.querySelector('input[placeholder="Transaction number"]');
    
    console.log('OCR Elements found:', {
        dropzone: !!dropzone,
        fileInput: !!fileInput,
        previewContainer: !!previewContainer,
        transactionInput: !!transactionInput
    });
    
    if (!dropzone || !fileInput || !previewContainer) {
        console.warn('⚠️ File drop elements not found - OCR setup skipped');
        return;
    }
    
    console.log('✅ All OCR elements found - setting up drag & drop and preview watcher...');
    
    // Store the last selected files for OCR processing
    let lastSelectedFiles = [];
    
    // Setup drag and drop functionality
    setupDragAndDrop(dropzone, fileInput);
    
    // Listen to file input changes to capture files for OCR
    fileInput.addEventListener('change', function(e) {
        console.log('🔥 File input changed:', e.target.files.length, 'files');
        if (e.target.files.length > 0) {
            lastSelectedFiles = Array.from(e.target.files);
            console.log('💾 Stored files for OCR:', lastSelectedFiles.map(f => f.name));
        }
    });
    
    // Setup preview div watcher to trigger OCR when preview appears
    setupPreviewDivWatcher(previewContainer, transactionInput, () => lastSelectedFiles[0]);
    
    console.log('✅ OCR system ready - will trigger automatically when preview div appears');
}

function setupPreviewDivWatcher(previewContainer, transactionInput, getLastFile) {
    console.log('👀 Setting up preview div watcher...');
    
    // Create a MutationObserver to watch for new preview divs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if this is the preview div we're looking for
                        // Updated to match the actual imageInput.js structure
                        const isPreviewDiv = node.classList && 
                            node.classList.contains('flex') &&
                            node.classList.contains('items-center') &&
                            node.classList.contains('justify-between') &&
                            node.classList.contains('gap-4') &&
                            node.classList.contains('p-3') &&
                            node.classList.contains('border') &&
                            node.classList.contains('border-neutral-300') &&
                            node.classList.contains('rounded-lg') &&
                            node.classList.contains('mb-5');
                        
                        if (isPreviewDiv) {
                            console.log('🎯 Preview div detected! Triggering OCR...');
                            console.log('📄 Preview div:', node);
                            
                            // Get the stored file
                            const lastFile = getLastFile();
                            if (lastFile) {
                                console.log('📁 Using stored file for OCR:', lastFile.name);
                                triggerOCRFromPreview({ file: lastFile, fileName: lastFile.name, element: node }, transactionInput);
                            } else {
                                console.log('❌ No stored file available for OCR');
                                
                                // Fallback: check file input directly
                                const fileInput = document.getElementById('fileInput');
                                if (fileInput && fileInput.files.length > 0) {
                                    console.log('🔄 Found files in file input:', fileInput.files.length);
                                    const file = fileInput.files[0];
                                    console.log('📁 Using file from input for OCR:', file.name);
                                    triggerOCRFromPreview({ file: file, fileName: file.name, element: node }, transactionInput);
                                } else {
                                    // Last resort: try to extract from preview or file input
                                    const fileInfo = extractFileInfoFromPreview(node);
                                    if (fileInfo) {
                                        console.log('📁 File info extracted from preview:', fileInfo);
                                        triggerOCRFromPreview(fileInfo, transactionInput);
                                    } else {
                                        console.log('⚠️ Could not get file for OCR processing');
                                        showToastWarning('File Not Found', 'Could not access the uploaded file for OCR processing. Please try uploading again.');
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });
    });
    
    // Start observing the preview container
    observer.observe(previewContainer, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Preview div watcher setup complete');
}

function setupDragAndDrop(dropzone, fileInput) {
    console.log('🔧 Setting up drag and drop functionality...');
    
    // Handle drag and drop events
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if dropzone is disabled
        if (dropzone.getAttribute('data-disabled') === 'true') {
            console.log('📥 Drag over dropzone - but dropzone is disabled');
            showPaymentMethodReminder();
            return;
        }
        
        console.log('📥 Drag over dropzone');
        dropzone.classList.add('border-primary', 'bg-primary/5');
    });
    
    dropzone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if dropzone is disabled
        if (dropzone.getAttribute('data-disabled') === 'true') {
            console.log('📥 Drag enter dropzone - but dropzone is disabled');
            return;
        }
        
        console.log('📥 Drag enter dropzone');
    });
    
    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📤 Drag leave dropzone');
        // Only remove styles if leaving the dropzone completely
        if (!dropzone.contains(e.relatedTarget)) {
            dropzone.classList.remove('border-primary', 'bg-primary/5');
        }
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if dropzone is disabled
        if (dropzone.getAttribute('data-disabled') === 'true') {
            console.log('🎯 Files dropped but dropzone is disabled');
            showPaymentMethodReminder();
            return;
        }
        
        console.log('🎯 Files dropped! Event target:', e.target);
        console.log('🎯 DataTransfer files count:', e.dataTransfer.files.length);
        
        dropzone.classList.remove('border-primary', 'bg-primary/5');
        
        if (e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            handleDroppedFiles(files, fileInput);
        } else {
            console.error('❌ No files in dataTransfer');
        }
    });
    
    // Add click handler to check for disabled state
    dropzone.addEventListener('click', (e) => {
        // Check if dropzone is disabled
        if (dropzone.getAttribute('data-disabled') === 'true') {
            e.preventDefault();
            e.stopPropagation();
            console.log('👆 Dropzone clicked but is disabled');
            showPaymentMethodReminder();
            return;
        }
    });
    
    console.log('✅ Drag and drop setup complete');
}

function handleDroppedFiles(files, fileInput) {
    console.log('🔥 handleDroppedFiles called with:', files.length, 'files');
    
    if (!files || files.length === 0) {
        console.log('❌ No files to process');
        return;
    }
    
    try {
        // Filter for image files only
        const imageFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                console.log('❌ Invalid file type:', file.type, 'for file:', file.name);
                showToastError('Invalid File', `${file.name} is not an image file. Please select only image files.`);
                return false;
            }
            return true;
        });
        
        if (imageFiles.length === 0) {
            console.log('❌ No valid image files found');
            return;
        }
        
        console.log('✅ Valid image files:', imageFiles.map(f => f.name));
        
        // Set the files to the file input to trigger existing file handling
        const dataTransfer = new DataTransfer();
        imageFiles.forEach(file => {
            dataTransfer.items.add(file);
        });
        
        fileInput.files = dataTransfer.files;
        
        // Trigger change event to let existing handlers process the files
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);
        
        console.log('📤 Triggered existing file processing for dropped files');
        
    } catch (error) {
        console.error('Error processing dropped files:', error);
        showToastError('Processing Error', 'Failed to process the dropped images.');
    }
}



function extractFileInfoFromPreview(previewDiv) {
    console.log('🔍 Extracting file info from preview div...');
    console.log('🔍 Preview div structure:', previewDiv.outerHTML);
    
    // Look for image elements in the preview (imageInput.js creates img with data URL)
    const img = previewDiv.querySelector('img');
    
    // Extract filename from the paragraph element (imageInput.js structure)
    const fileNameElement = previewDiv.querySelector('p.text-sm.font-semibold');
    const fileName = fileNameElement?.textContent?.trim() || 
                    previewDiv.textContent.match(/[\w\-. ]+\.(jpg|jpeg|png|webp)/i)?.[0] ||
                    'uploaded-image.jpg';
    
    console.log('📸 Found image:', !!img);
    console.log('📝 Extracted filename:', fileName);
    
    if (img && img.src) {
        console.log('📸 Found image with src:', img.src.substring(0, 50) + '...');
        
        // If it's a data URL (base64), we need to convert it to a blob
        if (img.src.startsWith('data:')) {
            console.log('🔄 Converting data URL to blob...');
            return {
                dataUrl: img.src,
                fileName: fileName,
                element: previewDiv
            };
        } else if (img.src.startsWith('blob:')) {
            console.log('📸 Found blob image in preview');
            return {
                blobUrl: img.src,
                fileName: fileName,
                element: previewDiv
            };
        }
    }
    
    // Fallback: try to get the file from the file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput && fileInput.files.length > 0) {
        console.log('📁 Using file from input element');
        return {
            file: fileInput.files[0],
            fileName: fileInput.files[0].name,
            element: previewDiv
        };
    }
    
    console.log('❌ Could not extract file info from preview');
    return null;
}

async function triggerOCRFromPreview(fileInfo, transactionInput) {
    try {
        console.log('🚀 Triggering OCR from preview div...');
        showFullscreenLoading('Processing Image');
        
        let file = fileInfo.file;
        
        // If we have a data URL (base64), convert it to a file
        if (fileInfo.dataUrl && !file) {
            console.log('🔄 Converting data URL to file...');
            const response = await fetch(fileInfo.dataUrl);
            const blob = await response.blob();
            file = new File([blob], fileInfo.fileName, { type: blob.type });
        }
        
        // If we have a blob URL, convert it to a file
        if (fileInfo.blobUrl && !file) {
            console.log('🔄 Converting blob to file...');
            const response = await fetch(fileInfo.blobUrl);
            const blob = await response.blob();
            file = new File([blob], fileInfo.fileName, { type: blob.type });
        }
        
        if (!file) {
            throw new Error('No file available for OCR processing');
        }
        
        console.log('📤 Calling OCR API with file:', file.name);
        const result = await window.uploadImageForOCR(file);
        
        if (result.success && result.transactionNumber) {
            console.log('✅ OCR Success! Found transaction number:', result.transactionNumber);
            
            // Validate the extracted transaction number before using it
            if (isValidTransactionNumber(result.transactionNumber)) {
                // Check for amount mismatch FIRST before filling input or showing success
                console.log('🔍 Checking amount mismatch before proceeding...');
                
                // Check if we're in Production Data mode and need to verify amount
                if (isProdDataMode()) {
                    try {
                        // Use the amount data directly from OCR response
                        const apiAmount = result.amount;
                        const expectedAmount = getExpectedTotalAmount();
                        
                        console.log('💰 Comparing amounts - Expected:', expectedAmount, 'API:', apiAmount);
                        
                        // Allow for small floating point differences (less than 1 cent)
                        if (apiAmount && Math.abs(apiAmount - expectedAmount) >= 0.01) {
                            console.log('💰 Amount mismatch detected during OCR - showing mismatch modal');
                            showAmountMismatchModal(apiAmount, expectedAmount);
                            return; // Exit early, don't fill input or show success
                        }
                        
                        console.log('✅ Amount verification passed - proceeding with input fill');
                    } catch (error) {
                        console.error('❌ Error during amount verification:', error);
                        showOCRRetryModal('Failed to verify transaction amount. Please try again.');
                        return; // Exit early on verification error
                    }
                } else {
                    console.log('📊 Test Data mode - skipping amount verification');
                }
                
                // Only fill input and show success if amount verification passed (or in test mode)
                if (transactionInput) {
                    transactionInput.value = result.transactionNumber;
                    transactionInput.classList.add('border-green-500', 'bg-green-50');
                    
                    // Manually trigger the input event to activate real-time amount checking
                    const inputEvent = new Event('input', { bubbles: true });
                    transactionInput.dispatchEvent(inputEvent);
                    console.log('🔄 Triggered input event for real-time amount checking');
                    
                    // Show success animation
                    setTimeout(() => {
                        transactionInput.classList.remove('border-green-500', 'bg-green-50');
                    }, 3000);
                }
                
                // Show success toast
                showToastSuccess('Success!', `Transaction number extracted: ${result.transactionNumber}`);
            } else {
                console.log('❌ Extracted text failed validation:', result.transactionNumber);
                
                // Create a more specific error message based on what was extracted
                let errorMessage = `Extracted text "${result.transactionNumber}" does not appear to be a valid transaction number.`;
                
                if (result.transactionNumber.toLowerCase().includes('not found')) {
                    errorMessage = 'No transaction number could be detected in the image. Please ensure the receipt shows the transaction number clearly and try again.';
                } else if (result.transactionNumber.toLowerCase().includes('error')) {
                    errorMessage = 'There was an error processing the image. Please try again with a clearer, well-lit photo of your receipt.';
                }
                
                // Show modal since the extracted text is not a valid transaction number
                showOCRRetryModal(errorMessage);
            }
            
        } else {
            console.warn('⚠️ OCR failed or no transaction number found:', result);
            
            // Show modal asking user to try again with clearer image
            showOCRRetryModal(result.message || 'Could not extract transaction number from the image.');
        }
    } catch (error) {
        console.error('❌ OCR processing error:', error);
        
        // Show modal for processing errors too
        showOCRRetryModal('Failed to process the image. This might be due to poor image quality or network issues.');
    } finally {
        hideFullscreenLoading();
    }
}

// Function to validate if extracted text is a valid transaction number
function isValidTransactionNumber(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    
    const normalizedText = text.trim().toLowerCase();
    
    // Check for common error messages that indicate OCR failure
    const errorIndicators = [
        'reference number not found',
        'no reference number',
        'not found',
        'error',
        'failed',
        'unable to',
        'could not',
        'no transaction',
        'transaction not found',
        'receipt not found',
        'invalid',
        'unclear image',
        'poor quality',
        'text not found',
        'no text detected'
    ];
    
    // If the text contains any error indicators, it's not a valid transaction number
    for (const indicator of errorIndicators) {
        if (normalizedText.includes(indicator)) {
            console.log(`🚫 Text contains error indicator: "${indicator}"`);
            return false;
        }
    }
    
    // Check if text is too short (transaction numbers are usually at least 4 characters)
    if (text.trim().length < 4) {
        console.log('🚫 Text too short to be a transaction number');
        return false;
    }
    
    // Check if text is too long (most transaction numbers are under 50 characters)
    if (text.trim().length > 50) {
        console.log('🚫 Text too long to be a transaction number');
        return false;
    }
    
    // Check if text contains mostly alphanumeric characters (allowing some special chars)
    const validPattern = /^[A-Za-z0-9\-_#@$&*()+=[\]{}|\\:";'<>?,./~`!%^]+$/;
    if (!validPattern.test(text.trim())) {
        console.log('🚫 Text contains invalid characters');
        return false;
    }
    
    // Check if text has at least some alphanumeric content
    const hasAlphanumeric = /[A-Za-z0-9]/.test(text);
    if (!hasAlphanumeric) {
        console.log('🚫 Text does not contain alphanumeric characters');
        return false;
    }
    
    console.log('✅ Text appears to be a valid transaction number');
    return true;
}

// Make uploadImageForOCR available globally
async function uploadImageForOCR(file) {
    try {
        console.log('Uploading image for OCR:', file.name);
        
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('https://betcha-api.onrender.com/ocr/scan/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('OCR API Response:', result);
        
        if (response.ok && result.result) {
            // Validate if the extracted text is actually a transaction number
            const extractedText = result.result.trim();
            console.log('🔍 Validating extracted text:', extractedText);
            
            if (isValidTransactionNumber(extractedText)) {
                return {
                    success: true,
                    transactionNumber: extractedText,
                    amount: result.amount, // Include amount from OCR response
                    fullText: result.fullText
                };
            } else {
                console.log('❌ Extracted text is not a valid transaction number:', extractedText);
                return {
                    success: false,
                    message: 'No valid transaction number found in the image. Please ensure the receipt is clear and try again.'
                };
            }
        } else {
            // Provide more specific error messages
            let errorMessage = 'Could not extract transaction number from the image.';
            
            if (response.status === 400) {
                errorMessage = 'Invalid image format. Please upload a clear JPEG or PNG image.';
            } else if (response.status === 413) {
                errorMessage = 'Image file is too large. Please use a smaller image.';
            } else if (response.status >= 500) {
                errorMessage = 'Server error during image processing. Please try again.';
            } else if (result.message) {
                errorMessage = result.message;
            }
            
            return {
                success: false,
                message: errorMessage
            };
        }
    } catch (error) {
        console.error('OCR API error:', error);
        
        let errorMessage = 'Network error during OCR processing.';
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the OCR service. Please check your internet connection.';
        } else if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again with a smaller image.';
        }
        
        return {
            success: false,
            message: errorMessage
        };
    }
}

// Export for global access
window.uploadImageForOCR = uploadImageForOCR;
window.isValidTransactionNumber = isValidTransactionNumber;

// Function to show OCR retry modal
function showOCRRetryModal(message) {
    console.log('🔄 Showing OCR retry modal with message:', message);
    
    // Remove existing modal if present
    const existingModal = document.getElementById('ocrRetryModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal HTML
    const modalHTML = `
        <div id="ocrRetryModal" class="modal fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div class="modal-content bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 opacity-0">
                <div class="p-6">
                    <!-- Header centered -->
                    <div class="text-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-900">
                            Transaction Number Not Found
                        </h3>
                    </div>
                    
                    <!-- Icon and Message -->
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                            </svg>
                        </div>
                        
                        <p class="text-gray-600 mb-6">
                            ${message}
                        </p>
                    </div>
                    
                    <!-- Suggestions -->
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <h4 class="text-sm font-medium text-green-900 mb-2">For better results, please ensure:</h4>
                        <ul class="text-sm text-green-800 space-y-1">
                            <li>• Image is clear and valid receipt</li>
                            <li>• Transaction number is fully visible</li>
                            <li>• No shadows or glare on the receipt</li>
                            <li>• Image is not blurry or rotated</li>
                        </ul>
                    </div>
                    
                    <!-- Action Button -->
                    <div class="flex justify-center">
                        <button id="tryAgainBtn" class="group relative rounded-full w-full bg-primary hover:bg-primary/90 flex items-center justify-center overflow-hidden hover:cursor-pointer active:scale-95 transition-all duration-300 ease-in-out py-3">
                            <span class="text-white text-sm font-medium group-hover:-translate-x-1 transition-transform duration-500 ease-in-out">
                                Try Again
                            </span>
                            <span class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out">
                                <svg class="w-5 h-5 ml-2 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal element
    const modal = document.getElementById('ocrRetryModal');
    const modalContent = modal.querySelector('.bg-white');
    
    // Show modal with animation
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
    
    // Setup event listeners
    setupOCRRetryModalEventListeners(modal);
    
    // Focus management
    const tryAgainBtn = modal.querySelector('#tryAgainBtn');
    if (tryAgainBtn) {
        tryAgainBtn.focus();
    }
}

// Function to setup OCR retry modal event listeners
function setupOCRRetryModalEventListeners(modal) {
    const tryAgainBtn = modal.querySelector('#tryAgainBtn');
    const closeModalBtn = modal.querySelector('#closeModalBtn');
    
    // Try Again - trigger file input
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            console.log('🔄 User chose to try again with new image');
            hideOCRRetryModal();
            
            // Clear existing file input and preview
            clearFileInputAndPreview();
            
            // Trigger file input
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.click();
            } else {
                showToastError('Error', 'File input not found. Please refresh the page.');
            }
        });
    }
    
    // Close modal button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            console.log('❌ Close button clicked');
            hideOCRRetryModal();
        });
    }
    
    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            console.log('🔄 Modal backdrop clicked - clearing inputs and files');
            
            // Clear file input and preview
            clearFileInputAndPreview();
            
            // Clear form inputs and data
            clearFormInputsAndData();
            
            hideOCRRetryModal();
        }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            hideOCRRetryModal();
            document.removeEventListener('keydown', handleEscapeKey);
        }
    });
}

// Function to hide OCR retry modal
function hideOCRRetryModal() {
    const modal = document.getElementById('ocrRetryModal');
    if (modal) {
        const modalContent = modal.querySelector('.bg-white');
        
        // Hide with animation
        modalContent.classList.add('scale-95', 'opacity-0');
        modalContent.classList.remove('scale-100', 'opacity-100');
        
        // Remove from DOM after animation
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Function to clear file input and preview
function clearFileInputAndPreview() {
    console.log('🧹 Clearing file input and preview...');
    
    // Clear file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Clear preview container
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    
    // Reset dropzone appearance
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
        dropzone.classList.remove('border-primary', 'bg-primary/5');
    }
    
    console.log('✅ File input and preview cleared');
}

// Function to clear form inputs and data
function clearFormInputsAndData() {
    console.log('🧹 Clearing form inputs and data...');
    
    // Clear transaction number input
    const transactionInput = document.getElementById('transactionNumber');
    if (transactionInput) {
        transactionInput.value = '';
        transactionInput.classList.remove('border-green-500', 'bg-green-50');
    }
    
    // Clear bank account number input
    const bankAccountInput = document.getElementById('bankAccountNumber');
    if (bankAccountInput) {
        bankAccountInput.value = '';
    }
    
    // Clear payment method selection
    const selectedPaymentMethod = document.querySelector('input[name="payment"]:checked');
    if (selectedPaymentMethod) {
        selectedPaymentMethod.checked = false;
    }
    
    console.log('✅ Form inputs and data cleared');
}

// Setup payment confirmation functionality
function setupPaymentConfirmation(bookingId, paymentType) {
    console.log('🔧 Setting up payment confirmation for:', { bookingId, paymentType });
    
    const confirmButton = document.getElementById('confirmPaymentButton1');
    if (!confirmButton) {
        console.error('❌ Confirm payment button not found');
        return;
    }
    
    confirmButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('💳 Payment confirmation button clicked');
        
        await processPaymentConfirmation(bookingId, paymentType);
    });
    
    console.log('✅ Payment confirmation setup complete');
}

async function processPaymentConfirmation(bookingId, paymentType) {
    try {
        console.log('🚀 Processing payment confirmation...');
        showFullscreenLoading('Processing Payment');
        
        // Get form data
        const formData = getPaymentFormData();
        console.log('📝 Form data:', formData);
        
        // Validate form data
        if (!(await validatePaymentForm(formData))) {
            hideFullscreenLoading();
            return;
        }
        
        // Debug: Check what we're working with
        console.log('🔗 Payment confirmation params:', {
            bookingId,
            paymentType,
            currentURL: window.location.href
        });
        
        if (!bookingId) {
            console.error('❌ No booking ID provided');
            showToastError('Missing Information', 'Booking ID not found. Please try again from the booking page.');
            hideFullscreenLoading();
            return;
        }
        
        // Determine API endpoint based on payment type
        const apiEndpoint = getPaymentApiEndpoint(paymentType, bookingId);
        console.log('🌐 API endpoint:', apiEndpoint);
        console.log('📦 Payload to send:', JSON.stringify(formData, null, 2));
        console.log('🔧 HTTP Method: PATCH');
        
        // Send payment request
        const response = await fetch(apiEndpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 Raw response status:', response.status, response.statusText);
        
        let result;
        try {
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                // Response is not JSON (likely HTML error page)
                const textResponse = await response.text();
                console.log('📄 Non-JSON response received:', textResponse.substring(0, 200) + '...');
                result = { 
                    error: 'Server returned non-JSON response', 
                    status: response.status,
                    statusText: response.statusText 
                };
            }
        } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError);
            result = { 
                error: 'Failed to parse server response', 
                status: response.status,
                statusText: response.statusText 
            };
        }
        
        console.log('📡 Payment API response:', result);
        
        if (response.ok) {
            console.log('✅ Payment confirmation successful');

            const responseBookingId = result.booking?._id || result.booking?.id || result.id || result._id || bookingId;
            
            if (responseBookingId) {

                try {
                    console.log('Updating booking status to Pending Payment for booking ID:', responseBookingId);
                    
                    const statusResponse = await fetch(`https://betcha-api.onrender.com/booking/update-status/${responseBookingId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            status: "Pending Payment"
                        })
                    });
                    
                    if (statusResponse.ok) {
                        console.log('Booking status updated to Pending Payment successfully');
                    } else {
                        console.warn('Failed to update booking status, but payment was processed');
                    }
                } catch (statusError) {
                    console.warn('Error updating booking status:', statusError);
                    // Don't fail the entire process if status update fails
                }
            }
            
            showToastSuccess('Payment Confirmed!', 'Your payment has been successfully processed.');
            
            // Audit: payment completed
            try {
                const uid = localStorage.getItem('userId') || '';
                const role = (localStorage.getItem('role') || 'Guest');
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPaymentCompletion === 'function' && uid) {
                    window.AuditTrailFunctions.logPaymentCompletion(uid, role.charAt(0).toUpperCase() + role.slice(1));
                }
            } catch (error) {
                console.warn('Audit trail logging failed:', error);
            }
            
            // Fire-and-forget notifications to TS and booking email
            try {
                const bookingObj = result?.booking || {};
                const propertyId = bookingObj.propertyId || null;
                const guestEmail = result?.guestEmail || localStorage.getItem('email') || '';
                const amount = bookingObj.totalFee ?? null;
                const unitName = bookingObj.propertyName || '';
                const checkIn = bookingObj.checkIn || '';
                const checkOut = bookingObj.checkOut || '';
                const timeIn = bookingObj.timeIn || '';
                const timeOut = bookingObj.timeOut || '';
                const methodOfPayment = (getPaymentFormData()?.modeOfPayment) || '';
                const typeOfPayment = paymentType || '';

                if (window.notify && propertyId) {
                    const notifyArgs = {
                        propertyId,
                        email: guestEmail,
                        amount,
                        typeOfPayment,
                        methodOfPayment,
                        unitName,
                        checkIn,
                        checkOut,
                        timeIn,
                        timeOut
                    };
                    console.log('[Notify] Triggering TS notification and booking email...', notifyArgs);
                    window.notify
                        .notifyPaymentCompletedToTS(notifyArgs)
                        .then((res) => console.log('[Notify] Dispatched TS notifications result:', res))
                        .catch((err) => console.error('[Notify] Dispatch failed:', err));
                } else {
                    console.warn('[Notify] Skipped: missing propertyId or notify service not loaded');
                }
            } catch (e) {
                console.warn('notifyPaymentCompletedToTS failed:', e);
            }
            
            // Update the modal button to include bookingId in the URL
            const modalActionButton = document.getElementById('modalActionButton');
            if (modalActionButton) {
                modalActionButton.onclick = () => {
                    window.location.href = `view-booking.html?bookingId=${bookingId}`;
                };
                console.log('✅ Modal button updated with bookingId:', bookingId);
            }
            
            // Show success modal only on successful payment
            setTimeout(() => {
                const successModal = document.getElementById('successBookingModal');
                if (successModal) {
                    successModal.classList.remove('hidden');
                }
            }, 1000);
        } else {
            console.error('❌ Payment confirmation failed:', result);
            
            // Handle different error scenarios
            let errorMessage = 'Failed to process payment. Please try again.';
            if (response.status === 404) {
                errorMessage = 'Payment endpoint not found. Please contact support.';
            } else if (response.status === 400) {
                errorMessage = result.message || 'Invalid payment data. Please check your information.';
            } else if (response.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (result.message) {
                errorMessage = result.message;
            }
            
            // Only show toast notification for errors, no modal
            showToastError('Payment Failed', errorMessage);

            // Audit: payment failure
            try {
                const uid = localStorage.getItem('userId') || '';
                const role = (localStorage.getItem('role') || 'Guest');
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPaymentFailure === 'function' && uid) {
                    window.AuditTrailFunctions.logPaymentFailure(uid, role.charAt(0).toUpperCase() + role.slice(1));
                }
            } catch (error) {
                console.warn('Audit trail logging failed:', error);
            }
        }
    } catch (error) {
        console.error('💥 Payment confirmation error:', error);
        
        // Only show toast notification for errors, no modal
            showToastError('Payment Error', 'An error occurred while processing your payment. Please try again.');        // Audit: payment failure
        try {
            const uid = localStorage.getItem('userId') || '';
            const role = (localStorage.getItem('role') || 'Guest');
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPaymentFailure === 'function' && uid) {
                window.AuditTrailFunctions.logPaymentFailure(uid, role.charAt(0).toUpperCase() + role.slice(1));
            }
        } catch (error) {
            console.warn('Audit trail logging failed:', error);
        }
    } finally {
        hideFullscreenLoading();
    }
}

function getPaymentFormData() {
    const transactionNumber = document.getElementById('transactionNumber')?.value || '';
    const bankAccountNumber = document.getElementById('bankAccountNumber')?.value || '';
    const selectedPaymentMethod = document.querySelector('input[name="payment"]:checked');
    
    const formData = {
        modeOfPayment: selectedPaymentMethod?.dataset?.category || '',
        paymentNo: transactionNumber,
        numberBankEwallets: bankAccountNumber,
        category: selectedPaymentMethod?.dataset?.category || ''
    };
    
    console.log('📋 Extracted form data:', {
        transactionNumber,
        bankAccountNumber,
        selectedPaymentMethodId: selectedPaymentMethod?.id,
        selectedPaymentMethodValue: selectedPaymentMethod?.value,
        selectedPaymentMethodCategory: selectedPaymentMethod?.dataset?.category,
        formData
    });
    
    return formData;
}

async function validatePaymentForm(formData) {
    console.log('🚀 validatePaymentForm called with:', formData);
    console.log('🔍 Checking Prod Data mode status:', isProdDataMode());
    
    const errors = [];
    
    if (!formData.modeOfPayment) {
        errors.push('Please select a payment method');
    }
    
    if (!formData.paymentNo) {
        errors.push('Please enter the transaction number');
    }
    
    if (!formData.numberBankEwallets) {
        errors.push('Please enter the bank account or e-wallet number');
    } else {
        // Validate bank account/e-wallet number format
        const validationResult = validateBankAccountFormat(formData.numberBankEwallets);
        if (!validationResult.isValid) {
            errors.push(validationResult.message);
        }
    }

    // Check for amount validation in Prod Data mode
    if (isProdDataMode() && formData.paymentNo) {
        console.log('🔍 Prod Data mode enabled - checking transaction verification...');
        console.log('💳 Transaction number:', formData.paymentNo);
        
        // Skip verification for manually entered transaction numbers
        // Amount verification only happens during OCR image upload process
        // when we have the actual receipt image and amount data
        console.log('📊 Skipping verification for manually entered transaction number');
        console.log('💡 Amount verification only happens during OCR image upload process');
    } else {
        console.log('ℹ️ Prod Data mode disabled or no transaction number - skipping amount verification');
    }
    
    if (errors.length > 0) {
        console.log('❌ Validation errors:', errors);
        showToastError('Invalid Information', errors.join('. '));
        return false;
    }
    
    console.log('✅ Form validation passed');
    return true;
}

// Function to validate bank account format during form submission
function validateBankAccountFormat(value) {
    const rules = window.currentValidationRules;
    if (!rules) {
        return { isValid: true }; // No validation rules set
    }

    const cleanValue = value.replace(/\D/g, '');
    const expectedLength = rules.expectedLength;

    // Check correct length
    if (cleanValue.length !== expectedLength) {
        return {
            isValid: false,
            message: `${rules.category} number must be ${expectedLength} digits`
        };
    }

    // Check "09" prefix for e-wallets
    if (rules.isEWallet && !cleanValue.startsWith('09')) {
        return {
            isValid: false,
            message: `${rules.category} number must start with "09"`
        };
    }

    return { isValid: true };
}

// Function to verify transaction amount with API (for Production Data mode)
async function verifyTransactionAmount(transactionNumber, isRealTime = false) {
    try {
        const prefix = isRealTime ? '⚡ REAL-TIME' : '📝 CONFIRM';
        console.log(`${prefix} - Verifying transaction amount for:`, transactionNumber);
        
        let apiData;
        
        // FOR TESTING: Simulate API response based on your example
        // Comment this out when you have the real API working
        if (transactionNumber === '357293852') {
            console.log(`${prefix} - Using simulated API response for testing`);
            apiData = {
                result: "357293852",
                amount: 1305.91,
                fullText: "Successfully sent to\nA\nAlipay GN\nPHP 1,305.91\nAmount Due PHP 1348.04 ( SGD 32.00)\nExchange Rate SGD 1= PHP 4212612838\nPayment Method GCash\nAlipay+™ Discount - php 42.13\nSGD1 OFF(1.00 SGD) - php 4213\nRef. No. 357293852\n23 November 2022 01:24 PM\nShow the reference number to the cashier and expect an SMS\nfor your verification.\nGCash Payment\nPowered pyAlipay -L\nTRANSLATE FOR MERCHANT\n"
            };
        } else {
            // Make actual API call to verify transaction
            const response = await fetch(`https://betcha-api.onrender.com/transaction/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transactionNumber: transactionNumber
                })
            });
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`${prefix} - Transaction verification result:`, result);
            apiData = {
                result: result.result,
                amount: result.amount,
                fullText: result.fullText
            };
        }
        
        // Now perform amount comparison
        const apiAmount = apiData.amount;
        const expectedAmount = getExpectedTotalAmount();
        
        console.log(`${prefix} - Amount comparison:`, {
            apiAmount,
            expectedAmount,
            difference: Math.abs(apiAmount - expectedAmount),
            matches: Math.abs(apiAmount - expectedAmount) < 0.01
        });
        
        // Allow for small floating point differences (less than 1 cent)
        if (Math.abs(apiAmount - expectedAmount) >= 0.01) {
            console.log(`${prefix} - Amount mismatch detected`);
            return {
                success: false,
                showAmountModal: true,
                apiAmount: apiAmount,
                expectedAmount: expectedAmount,
                data: apiData
            };
        }
        
        console.log(`${prefix} - Transaction amount verified successfully`);
        return {
            success: true,
            data: apiData
        };
        
    } catch (error) {
        const prefix = isRealTime ? '⚡ REAL-TIME' : '📝 CONFIRM';
        console.error(`${prefix} - Transaction verification failed:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Function to check if Prod Data mode is enabled
function isProdDataMode() {
    const dataTypeToggle = document.getElementById('dataTypeToggle');
    const isEnabled = dataTypeToggle ? dataTypeToggle.checked : false;
    console.log('🔧 isProdDataMode check:', {
        toggleFound: !!dataTypeToggle,
        isChecked: dataTypeToggle?.checked,
        result: isEnabled
    });
    return !isEnabled;
}

// Function to handle data mode change
function handleDataModeChange() {
    // Clear all payment inputs when switching modes
    clearPaymentInputs();
    
    // Clear file preview specifically
    clearFilePreview();
    
    console.log('🔄 Data mode changed - all inputs and previews cleared');
}

// Function to clear file preview
function clearFilePreview() {
    // Clear all preview elements
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) {
        // Clear the container's contents
        previewContainer.innerHTML = '';
        
        // Reset the container to its initial state
        previewContainer.innerHTML = `
            <div class="dropzone-text text-center text-neutral-600 text-sm">
                Drag and drop or click to upload payment receipt
            </div>
        `;
    }
    
    // Clear any preview thumbnails and images
    const previews = document.querySelectorAll('.preview-image, .preview-thumbnail');
    previews.forEach(preview => preview.remove());
    
    // Reset dropzone to initial state
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
        // Clear any preview elements in the dropzone
        const dropzonePreview = dropzone.querySelector('.preview-container');
        if (dropzonePreview) {
            dropzonePreview.innerHTML = `
                <div class="dropzone-text text-center text-neutral-600 text-sm">
                    Drag and drop or click to upload payment receipt
                </div>
            `;
        }
        
        // Remove any highlighting styles
        dropzone.classList.remove('border-primary', 'bg-primary/5');
    }
    
    // Clear OCR preview if it exists
    const ocrPreview = document.getElementById('ocrPreview');
    if (ocrPreview) {
        ocrPreview.innerHTML = '';
    }
    
    // Clear the file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    console.log('🧹 File preview cleared and dropzone reset');
}

// Function to setup data mode toggle
function setupDataModeToggle() {
    const dataTypeToggle = document.getElementById('dataTypeToggle');
    if (dataTypeToggle) {
        dataTypeToggle.addEventListener('change', handleDataModeChange);
        console.log('✅ Data mode toggle event listener setup complete');
    }
}

// Function to get expected total amount from the page
function getExpectedTotalAmount() {
    const totalElement = document.getElementById('totalPrice');
    if (totalElement) {
        const totalText = totalElement.textContent.trim();
        console.log('💰 Total element found, text:', totalText);
        // Extract numeric value from "1,305.91" format
        const numericValue = totalText.replace(/,/g, '');
        const parsedAmount = parseFloat(numericValue);
        console.log('💰 Parsed amount:', parsedAmount);
        return parsedAmount;
    }
    console.warn('❌ totalPrice element not found');
    return 0;
}

// Function to show amount mismatch modal
function showAmountMismatchModal(apiAmount, expectedAmount) {
    console.log('💰 Showing amount mismatch modal with amounts:', { apiAmount, expectedAmount });
    
    // Get the modal element
    const modal = document.getElementById('amountMismatchModal');
    if (!modal) {
        console.error('Amount mismatch modal not found');
        return;
    }
    
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) {
        console.error('Modal content not found');
        return;
    }
    
    // Update modal content with actual amounts
    const apiAmountElement = modal.querySelector('#apiAmount');
    const expectedAmountElement = modal.querySelector('#expectedAmount');
    
    if (apiAmountElement) {
        apiAmountElement.textContent = `₱${apiAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    if (expectedAmountElement) {
        expectedAmountElement.textContent = `₱${expectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Function to clear inputs and close modal
    function clearInputsAndCloseModal() {
        console.log('🧹 Clearing inputs and closing modal...');
        
        // Hide modal with animation
        modalContent.classList.add('scale-95', 'opacity-0');
        modalContent.classList.remove('scale-100', 'opacity-100');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
        
        // Clear current file input and preview
        clearFileInputAndPreview();
        
        // Clear transaction number field
        const transactionInput = document.getElementById('transactionNumber');
        if (transactionInput) {
            transactionInput.value = '';
            transactionInput.classList.remove('border-green-500', 'bg-green-50');
            console.log('🔄 Cleared transaction number field');
        }
        
        // Clear bank account field
        const bankAccountInput = document.getElementById('bankAccountNumber');
        if (bankAccountInput) {
            bankAccountInput.value = '';
            console.log('🔄 Cleared bank account field');
        }
        
        // Focus on the file input area
        const dropzone = document.getElementById('dropzone');
        if (dropzone) {
            dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
            dropzone.classList.add('border-primary', 'bg-primary/5');
            setTimeout(() => {
                dropzone.classList.remove('border-primary', 'bg-primary/5');
            }, 2000);
        }
        
        console.log('✅ Ready for new image upload');
    }
    
    // Setup "Upload Another Picture" button event listener
    const uploadAnotherBtn = modal.querySelector('#uploadAnotherPictureBtn');
    if (uploadAnotherBtn) {
        // Remove any existing event listeners
        const newUploadBtn = uploadAnotherBtn.cloneNode(true);
        uploadAnotherBtn.parentNode.replaceChild(newUploadBtn, uploadAnotherBtn);
        
        // Add new event listener
        newUploadBtn.addEventListener('click', function() {
            console.log('📸 Upload Another Picture button clicked');
            clearInputsAndCloseModal();
        });
    }
    
    // Setup click outside modal to clear inputs and close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            console.log('👆 Clicked outside modal - clearing inputs');
            clearInputsAndCloseModal();
        }
    });
    
    // Prevent ESC key from closing (user must choose to upload another picture)
    function preventEscapeClose(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            console.log('⚠️ ESC key blocked - user must upload another picture');
        }
    }
    
    // Add ESC key prevention
    document.addEventListener('keydown', preventEscapeClose, true);
    
    // Remove ESC prevention when modal closes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const isHidden = modal.classList.contains('hidden');
                if (isHidden) {
                    document.removeEventListener('keydown', preventEscapeClose, true);
                    observer.disconnect();
                }
            }
        });
    });
    observer.observe(modal, { attributes: true });
    
    // Show the modal with animation
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Set initial animation state
    modalContent.classList.add('scale-95', 'opacity-0');
    modalContent.classList.remove('scale-100', 'opacity-100');
    
    // Trigger animation
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
    
    // Focus management
    const uploadBtn = modal.querySelector('#uploadAnotherPictureBtn');
    if (uploadBtn) {
        uploadBtn.focus();
    }
    
    console.log('📋 Amount mismatch modal displayed (no escape options):', { apiAmount, expectedAmount });
}

function getPaymentApiEndpoint(paymentType, bookingId) {
    const baseURL = 'https://betcha-api.onrender.com';
    
    if (paymentType === 'Reservation') {
        return `${baseURL}/booking/payment/reservation/${bookingId}`;
    } else if (paymentType === 'Full-Payment') {
        return `${baseURL}/booking/payment/full/${bookingId}`;
    } else if (paymentType === 'Package') {
        return `${baseURL}/booking/payment/package/${bookingId}`;
    } else {
        console.warn('⚠️ Unknown payment type, defaulting to reservation:', paymentType);
        return `${baseURL}/booking/payment/reservation/${bookingId}`;
    }
}

// Function to setup navigation warnings
function setupNavigationWarnings() {
    let isPaymentConfirmed = false;
    
    // Mark payment as confirmed when user completes payment
    const confirmButtons = document.querySelectorAll('#confirmPaymentButton, #confirmPaymentButton1');
    confirmButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                isPaymentConfirmed = true;
            });
        }
    });
    
    // Override window.history.back globally
    const originalBack = window.history.back;
    window.history.back = function() {
        if (!isPaymentConfirmed) {
            const shouldLeave = confirm('Your payment will be cancelled if you leave this page. Are you sure?');
            if (shouldLeave) {
                originalBack.call(window.history);
            }
        } else {
            originalBack.call(window.history);
        }
    };
    
    // Auto-trigger user interaction to enable beforeunload
    setTimeout(() => {
        document.dispatchEvent(new Event('click'));
    }, 100);
    
    // Browser navigation warning
    window.addEventListener('beforeunload', (e) => {
        if (!isPaymentConfirmed) {
            e.preventDefault();
            e.returnValue = 'Your payment will be cancelled if you leave this page.';
            return e.returnValue;
        }
    });
}
