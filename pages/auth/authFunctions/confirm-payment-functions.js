// Confirm Payment Functions
// This file handles fetching booking data and populating the confirm-payment page

// Import toast notifications
import { showToastError } from '/src/toastNotification.js';
import { showFullscreenLoading, hideFullscreenLoading } from '/src/fullscreenLoading.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Confirm Payment page loaded');
    
    // Get booking ID and payment type from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    const paymentType = urlParams.get('paymentType');
    
    console.log('Booking ID:', bookingId, 'Payment Type:', paymentType);
    
    if (!bookingId) {
        console.error('No booking ID found in URL');
        showToastError('error', 'Missing Booking ID', 'No booking ID found. Please go back and try again.');
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
    
    // Group payment methods
    paymentMethods.forEach(method => {
        const category = method.category;
        if (allowedCategories.includes(category)) {
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
        
    } catch (error) {
        console.error('Error populating payment methods:', error);
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
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                showQRCode(this);
            }
        });
    });
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

// Function to fetch and populate booking data
async function fetchAndPopulateBookingData(bookingId, paymentType) {
    try {
        const result = await fetchBookingData(bookingId);
        
        if (result.success) {
            populatePaymentData(result.booking, paymentType);
        } else {
            console.error('Failed to load booking data:', result.message);
            showToastError('error', 'Booking Error', result.message || 'Failed to load booking details.');
        }
    } catch (error) {
        console.error('Error in fetchAndPopulateBookingData:', error);
        showToastError('error', 'Error', 'An unexpected error occurred while loading booking data.');
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
        
        console.log('Extracted values:', {
            packageFee: `${packageFee} (from booking.packageFee)`,
            reservationFee: `${reservationFee} (from booking.reservationFee)`,
            additionalPaxPrice: `${additionalPaxPrice} (from booking.additionalPaxPrice)`,
            additionalPax: `${additionalPax} (from booking.additionalPax)`,
            numOfDays: `${numOfDays} (from booking.numOfDays)`,
            totalFee: `${totalFee} (from booking.totalFee)`
        });
        
        // Determine the amount to pay based on payment type
        const amountToPay = getPaymentAmount(booking, paymentType);
        
        // Update payment type indicator
        updatePaymentTypeIndicator(paymentType, amountToPay);
        
        // Populate price elements that exist in HTML
        populateElement('pricePerDay', packageFee.toLocaleString());
        populateElement('daysOfStay', numOfDays.toString());
        populateElement('totalPriceDay', (packageFee * numOfDays).toLocaleString());
        
        populateElement('addGuestPrice', additionalPaxPrice.toLocaleString());
        populateElement('addGuestCount', additionalPax.toString());
        populateElement('totalAddGuest', (additionalPaxPrice * additionalPax).toLocaleString());
        
        populateElement('reservationFee', reservationFee.toLocaleString());
        populateElement('totalPrice', amountToPay.toLocaleString());
        
        console.log('Payment data populated successfully');
        console.log('Final populated values:', {
            packageFee,
            numOfDays,
            additionalPaxPrice, 
            additionalPax,
            reservationFee,
            amountToPay,
            paymentType
        });
        
    } catch (error) {
        console.error('Error populating payment data:', error);
        showToastError('error', 'Data Error', 'Error displaying payment information.');
    }
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
    } else {
        // For full payment, use totalFee
        return booking.totalFee || 0;
    }
}

// Export functions for use in other scripts
window.fetchBookingData = fetchBookingData;
window.populatePaymentData = populatePaymentData;
window.getPaymentAmount = getPaymentAmount;
window.fetchPaymentMethods = fetchPaymentMethods;
window.populatePaymentMethods = populatePaymentMethods;
window.showQRCode = showQRCode;

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
    
    console.log('✅ All OCR elements found - setting up event listeners...');
    
    // Test file input functionality
    console.log('🧪 Testing file input element:', {
        type: fileInput.type,
        accept: fileInput.accept,
        multiple: fileInput.multiple,
        hidden: fileInput.hidden,
        disabled: fileInput.disabled
    });
    
    // Store the last selected files for OCR processing
    let lastSelectedFiles = [];
    
    // Override the file input's onchange to capture files
    fileInput.addEventListener('change', function(e) {
        console.log('🔥 File input intercepted:', e.target.files.length, 'files');
        if (e.target.files.length > 0) {
            lastSelectedFiles = Array.from(e.target.files);
            console.log('💾 Stored files for OCR:', lastSelectedFiles.map(f => f.name));
        }
    }, true); // Use capture to run before other handlers
    
    // Also add a regular listener to catch any missed events
    fileInput.addEventListener('input', function(e) {
        console.log('📥 File input event:', e.target.files.length, 'files');
        if (e.target.files.length > 0) {
            lastSelectedFiles = Array.from(e.target.files);
            console.log('💾 Stored files via input event for OCR:', lastSelectedFiles.map(f => f.name));
        }
    });
    
    // Poll the file input periodically to catch any changes we might miss
    let lastFileCount = 0;
    setInterval(() => {
        if (fileInput.files.length !== lastFileCount) {
            lastFileCount = fileInput.files.length;
            if (fileInput.files.length > 0) {
                lastSelectedFiles = Array.from(fileInput.files);
                console.log('� Polling detected files:', lastSelectedFiles.map(f => f.name));
            }
        }
    }, 500);
    
    // Setup MutationObserver to watch for preview div creation
    setupPreviewDivWatcher(previewContainer, transactionInput, () => lastSelectedFiles[0]);
    
    // Setup drag and drop functionality only (no click handlers to avoid double file picker)
    setupDragAndDropOnly(dropzone, previewContainer, transactionInput, (files) => {
        lastSelectedFiles = Array.from(files);
        console.log('💾 Stored dragged files for OCR:', lastSelectedFiles.map(f => f.name));
    });
    
    // Don't setup manual file input listeners since the existing system works
    // and we don't want double file picker dialogs
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
                        const isPreviewDiv = node.classList && 
                            node.classList.contains('flex') &&
                            node.classList.contains('items-center') &&
                            node.classList.contains('justify-between') &&
                            node.classList.contains('gap-4') &&
                            node.classList.contains('p-3') &&
                            node.classList.contains('border') &&
                            node.classList.contains('border-neutral-300') &&
                            node.classList.contains('rounded-lg') &&
                            node.classList.contains('bg-gray-50') &&
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
                                        showToastError('warning', 'File Not Found', 'Could not access the uploaded file for OCR processing. Please try uploading again.');
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

function setupDragAndDropOnly(dropzone, previewContainer, transactionInput, onFilesDropped) {
    console.log('🔧 Setting up drag and drop functionality...');
    
    // Handle drag and drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📥 Drag over dropzone');
        dropzone.classList.add('border-primary', 'bg-primary/5');
    });
    
    dropzone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
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
        console.log('🎯 Files dropped! Event target:', e.target);
        console.log('🎯 DataTransfer files count:', e.dataTransfer.files.length);
        console.log('🎯 DataTransfer files:', e.dataTransfer.files);
        
        dropzone.classList.remove('border-primary', 'bg-primary/5');
        
        if (e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            onFilesDropped(files);
            handleDroppedFiles(files);
        } else {
            console.error('❌ No files in dataTransfer');
        }
    });
    
    console.log('✅ Drag and drop setup complete');
}

async function handleDroppedFiles(files) {
    console.log('🔥 handleDroppedFiles called with:', files.length, 'files');
    if (!files || files.length === 0) {
        console.log('❌ No files to process');
        return;
    }
    
    try {
        for (let file of files) {
            console.log('📄 Processing dropped file:', file.name, 'Type:', file.type);
            
            if (!file.type.startsWith('image/')) {
                console.log('❌ Invalid file type:', file.type);
                showToastError('error', 'Invalid File', 'Please select only image files.');
                continue;
            }
            
            console.log('✅ Valid image file dropped:', file.name);
            
            // The file will be stored by onFilesDropped callback
            // The preview div will be created by the existing file handling system
            // and our MutationObserver will detect it and trigger OCR automatically
            
            // For drag and drop, we might need to trigger the existing file handling
            // by setting the files on the file input
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                // Create a new FileList-like object
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Trigger change event to let existing handlers process the file
                const changeEvent = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(changeEvent);
                
                console.log('📤 Triggered existing file processing for:', file.name);
            }
        }
    } catch (error) {
        console.error('Error processing dropped files:', error);
        showToastError('error', 'Processing Error', 'Failed to process the dropped image.');
    }
}

function extractFileInfoFromPreview(previewDiv) {
    console.log('🔍 Extracting file info from preview div...');
    
    // Look for image elements or file data in the preview
    const img = previewDiv.querySelector('img');
    const fileName = previewDiv.querySelector('[data-filename]')?.textContent || 
                    previewDiv.textContent.match(/[\w\-. ]+\.(jpg|jpeg|png|webp)/i)?.[0] ||
                    'uploaded-image.jpg';
    
    if (img && img.src.startsWith('blob:')) {
        console.log('📸 Found blob image in preview');
        return {
            blobUrl: img.src,
            fileName: fileName,
            element: previewDiv
        };
    }
    
    // If we can't find a blob, we might need to get the file from the file input
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
            console.log('✅ OCR Success:', result.transactionNumber);
            
            // Auto-fill transaction input
            if (transactionInput) {
                transactionInput.value = result.transactionNumber;
                transactionInput.classList.add('border-green-500', 'bg-green-50');
                
                // Show success animation
                setTimeout(() => {
                    transactionInput.classList.remove('border-green-500', 'bg-green-50');
                }, 3000);
            }
            
            // Show success toast
            showToastError('success', 'Success!', `Transaction number extracted: ${result.transactionNumber}`);
            
        } else {
            console.warn('⚠️ OCR failed or no transaction number found:', result);
            showToastError('warning', 'No Transaction Found', 'Could not extract transaction number from the image. Please enter it manually.');
        }
    } catch (error) {
        console.error('❌ OCR processing error:', error);
        showToastError('error', 'OCR Error', 'Failed to process the image. Please try again or enter the transaction number manually.');
    } finally {
        hideFullscreenLoading();
    }
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
            return {
                success: true,
                transactionNumber: result.result,
                fullText: result.fullText
            };
        } else {
            return {
                success: false,
                message: result.message || 'OCR processing failed'
            };
        }
    } catch (error) {
        console.error('OCR API error:', error);
        return {
            success: false,
            message: 'Network error during OCR processing'
        };
    }
}

// Export for global access
window.uploadImageForOCR = uploadImageForOCR;

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
        if (!validatePaymentForm(formData)) {
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
            showToastError('error', 'Missing Information', 'Booking ID not found. Please try again from the booking page.');
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
            showToastError('success', 'Payment Confirmed!', 'Your payment has been successfully processed.');
            
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
            showToastError('error', 'Payment Failed', errorMessage);
        }
    } catch (error) {
        console.error('💥 Payment confirmation error:', error);
        
        // Only show toast notification for errors, no modal
        showToastError('error', 'Payment Error', 'An error occurred while processing your payment. Please try again.');
    } finally {
        hideFullscreenLoading();
    }
}

function getPaymentFormData() {
    const transactionNumber = document.getElementById('transactionNumber')?.value || '';
    const bankAccountNumber = document.getElementById('bankAccountNumber')?.value || '';
    const selectedPaymentMethod = document.querySelector('input[name="payment"]:checked');
    
    const formData = {
        modeOfPayment: selectedPaymentMethod?.value || '',
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

function validatePaymentForm(formData) {
    const errors = [];
    
    if (!formData.modeOfPayment) {
        errors.push('Please select a payment method');
    }
    
    if (!formData.paymentNo) {
        errors.push('Please enter the transaction number');
    }
    
    if (!formData.numberBankEwallets) {
        errors.push('Please enter the bank account or e-wallet number');
    }
    
    if (errors.length > 0) {
        console.log('❌ Validation errors:', errors);
        showToastError('error', 'Missing Information', errors.join('. '));
        return false;
    }
    
    console.log('✅ Form validation passed');
    return true;
}

function getPaymentApiEndpoint(paymentType, bookingId) {
    const baseURL = 'https://betcha-api.onrender.com';
    
    if (paymentType === 'reservation') {
        return `${baseURL}/booking/payment/reservation/${bookingId}`;
    } else if (paymentType === 'full-payment') {
        return `${baseURL}/booking/payment/full/${bookingId}`;
    } else {
        console.warn('⚠️ Unknown payment type, defaulting to reservation:', paymentType);
        return `${baseURL}/booking/payment/reservation/${bookingId}`;
    }
}
