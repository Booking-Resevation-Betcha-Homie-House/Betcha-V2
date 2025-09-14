// Confirm Payment Functions
// This file handles fetching booking data and populating the confirm-payment page

// Import toast notifications
import { showToastError } from '/src/toastNotification.js';
import { showFullscreenLoading, hideFullscreenLoading } from '/src/fullscreenLoading.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Confirm Payment page loaded');
    
    // Show skeleton loading immediately
    showSkeletonLoading();
    
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
    
    // Setup navigation warnings
    setupNavigationWarnings();
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
            }
            // Always update visual states when a selection changes
            updateOptionStates();
        });
    });

    // Initialize option states on load (normal if none selected; gray others after selection)
    updateOptionStates();
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
                
                showToastError('success', 'Already Paid!', `${paymentType} has already been paid for this booking. Redirecting to booking details...`);
                
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
            showToastError('error', 'Booking Error', result.message || 'Failed to load booking details.');
        }
    } catch (error) {
        console.error('Error in fetchAndPopulateBookingData:', error);
        hideSkeletonLoading();
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
        
        // Populate price elements that exist in HTML
        populateElement('pricePerDay', packageFee.toLocaleString());
        populateElement('daysOfStay', numOfDays.toString());
        populateElement('totalPriceDay', (packageFee * numOfDays).toLocaleString());
        
        populateElement('addGuestPrice', additionalPaxPrice.toLocaleString());
        populateElement('addGuestCount', additionalPax.toString());
        populateElement('totalAddGuest', (additionalPaxPrice * additionalPax).toLocaleString());
        
        populateElement('reservationFee', reservationFee.toLocaleString());
        
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
        showToastError('error', 'Data Error', 'Error displaying payment information.');
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
        // Package amount = (packageFee × days) + (additionalPaxPrice × additionalPax)
        const packageFee = booking.packageFee || 0;
        const numOfDays = booking.numOfDays || 1;
        const additionalPaxPrice = booking.additionalPaxPrice || 0;
        const additionalPax = booking.additionalPax || 0;
        
        const packageTotal = (packageFee * numOfDays) + (additionalPaxPrice * additionalPax);
        console.log('Package payment calculation:', {
            packageFee,
            numOfDays,
            additionalPaxPrice,
            additionalPax,
            packageTotal: packageTotal
        });
        
        return packageTotal;
    } else {
        // For full payment, use totalFee
        return booking.totalFee || 0;
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
        const totalFee = booking.totalFee || 0;
        
        if (discount === 0 || totalFee === 0) {
            return 0;
        }
        
        // Check if discount is already a percentage or absolute amount
        if (discount <= 100) {
            // Discount is a percentage, calculate the amount
            // We need to calculate based on the original total before discount
            // If totalFee is after discount: originalTotal = totalFee / (1 - discount/100)
            // But it's safer to calculate: discountAmount = totalFee * (discount / (100 - discount))
            const discountAmount = totalFee * (discount / (100 - discount));
            
            console.log('Discount amount calculation (from percentage):', {
                discountPercentage: discount,
                totalFee,
                calculatedDiscountAmount: discountAmount
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

function setupDragAndDrop(dropzone, fileInput) {
    console.log('🔧 Setting up drag and drop functionality...');
    
    // Handle drag and drop events
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
        
        dropzone.classList.remove('border-primary', 'bg-primary/5');
        
        if (e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            handleDroppedFiles(files, fileInput);
        } else {
            console.error('❌ No files in dataTransfer');
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
                showToastError('error', 'Invalid File', `${file.name} is not an image file. Please select only image files.`);
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
        showToastError('error', 'Processing Error', 'Failed to process the dropped images.');
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
            showToastError('error', 'Payment Failed', errorMessage);

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
        showToastError('error', 'Payment Error', 'An error occurred while processing your payment. Please try again.');

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
