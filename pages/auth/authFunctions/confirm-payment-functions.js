

import { showToastError } from '/src/toastNotification.js';
import { showFullscreenLoading, hideFullscreenLoading } from '/src/fullscreenLoading.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Confirm Payment page loaded');

    showSkeletonLoading();

    try {
        const uid = localStorage.getItem('userId') || '';
        const role = (localStorage.getItem('role') || 'Guest');
        if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPaymentInitiation === 'function' && uid) {
            window.AuditTrailFunctions.logPaymentInitiation(uid, role.charAt(0).toUpperCase() + role.slice(1));
        }
    } catch (_) {}

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

    fetchAndPopulateBookingData(bookingId, paymentType);

    fetchAndPopulatePaymentMethods();

    console.log('🔧 Setting up OCR file drop functionality...');
    setupFileDropOCR();

    setupPaymentConfirmation(bookingId, paymentType);
});

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

async function fetchAndPopulatePaymentMethods() {
    try {
        const result = await fetchPaymentMethods();
        
        if (result.success) {
            populatePaymentMethods(result.paymentMethods);
        } else {
            console.error('Failed to load payment methods:', result.message);

        }
    } catch (error) {
        console.error('Error in fetchAndPopulatePaymentMethods:', error);

    }
}

function groupPaymentMethodsByCategory(paymentMethods) {
    const allowedCategories = ['GCash', 'Maya', 'GoTyme', 'Union Bank', 'Other'];
    const grouped = {};

    allowedCategories.forEach(category => {
        grouped[category] = [];
    });

    paymentMethods.forEach(method => {
        const category = method.category;
        if (allowedCategories.includes(category)) {
            grouped[category].push(method);
        }
    });
    
    return grouped;
}

function populatePaymentMethods(paymentMethods) {
    console.log('Populating payment methods:', paymentMethods);
    
    try {

        const groupedMethods = groupPaymentMethodsByCategory(paymentMethods);

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

        const existingLabels = paymentContainer.querySelectorAll('label[for^="payment-"]');

        existingLabels.forEach(label => label.remove());

        let paymentMethodsHtml = '';
        
        Object.entries(groupedMethods).forEach(([category, methods]) => {
            if (methods.length > 0) {

                methods.forEach((method, index) => {
                    const categoryId = category.toLowerCase().replace(/\s+/g, '');
                    const methodId = `${categoryId}-${index + 1}`; 
                    const categoryName = category;
                    const methodName = method.paymentName || category;

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

        const selectText = Array.from(paymentContainer.querySelectorAll('p')).find(p => 
            p.textContent.includes('Select payment method:')
        );
        
        if (selectText) {
            selectText.insertAdjacentHTML('afterend', paymentMethodsHtml);
            console.log('Payment methods inserted after "Select payment method:" paragraph');
        } else {

            console.warn('Could not find "Select payment method:" paragraph, inserting at container start');
            paymentContainer.insertAdjacentHTML('afterbegin', paymentMethodsHtml);
        }

        addQRCodeDisplayArea(paymentContainer);

        setupPaymentMethodHandlers();
        
        console.log('Payment methods populated successfully');

        window.currentPaymentMethods = groupedMethods;

        hidePaymentMethodsSkeleton();
        
    } catch (error) {
        console.error('Error populating payment methods:', error);
        hidePaymentMethodsSkeleton();
    }
}

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

function addQRCodeDisplayArea(paymentContainer) {

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

                }
            } else {

                label.classList.remove('opacity-50', 'grayscale', 'pointer-events-none');
            }
        });
    }

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                showQRCode(this);
            }

            updateOptionStates();
        });
    });

    updateOptionStates();
}

function showQRCode(selectedRadio) {
    const qrDisplayArea = document.getElementById('qrCodeDisplayArea');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const paymentMethodName = document.getElementById('paymentMethodName');
    
    if (!qrDisplayArea || !qrCodeImage || !paymentMethodName) {
        console.warn('QR display elements not found');
        return;
    }
    
    try {

        const qrData = selectedRadio.getAttribute('data-qr');
        const paymentName = selectedRadio.getAttribute('data-payment-name');
        const paymentId = selectedRadio.getAttribute('data-payment-id');
        
        if (!qrData) {
            console.warn('No QR data found for selected payment method');
            qrDisplayArea.classList.add('hidden');
            return;
        }

        qrCodeImage.src = qrData;
        qrCodeImage.onerror = function() {
            console.error('Failed to load QR code image');
            this.src = '/public/images/qr-placeholder.png'; 
        };

        paymentMethodName.textContent = paymentName || 'Selected Payment Method';

        qrDisplayArea.classList.remove('hidden');

        window.selectedPaymentMethod = {
            id: paymentId,
            name: paymentName,
            qrData: qrData,
            radioElement: selectedRadio
        };
        
        console.log('QR code displayed for payment method:', paymentName);

        qrDisplayArea.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
        
    } catch (error) {
        console.error('Error displaying QR code:', error);
        qrDisplayArea.classList.add('hidden');
    }
}

async function fetchBookingData(bookingId) {
    try {
        console.log('Fetching booking data for ID:', bookingId);
        
        const response = await fetch(`https://betcha-api.onrender.com/booking/${bookingId}`);
        const result = await response.json();
        
        console.log('API Response Status:', response.status, response.statusText);
        console.log('Full API Response:', JSON.stringify(result, null, 2));
        
        if (response.ok) {
            console.log('Booking data fetched successfully:', result);

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

async function fetchAndPopulateBookingData(bookingId, paymentType) {
    try {
        const result = await fetchBookingData(bookingId);
        
        if (result.success) {
            console.log('✅ Booking data loaded successfully');
            console.log('🔍 Full booking object received:', JSON.stringify(result.booking, null, 2));

            const isAlreadyPaid = checkIfPaymentAlreadyMade(result.booking, paymentType);
            
            console.log(`💳 Payment check result for ${paymentType}:`, isAlreadyPaid);
            
            if (isAlreadyPaid) {
                console.log(`🚫 ${paymentType} payment already made, redirecting to view-booking`);
                console.log('📍 Redirect URL:', `view-booking.html?bookingId=${bookingId}`);
                
                showToastError('success', 'Already Paid!', `${paymentType} has already been paid for this booking. Redirecting to booking details...`);

                console.log('🔄 Initiating redirect...');
                setTimeout(() => {
                    window.location.href = `view-booking.html?bookingId=${bookingId}`;
                }, 1500);
                return;
            }
            
            console.log('✅ Payment not yet made, proceeding to populate payment form');
            populatePaymentData(result.booking, paymentType);

            setTimeout(() => {
                hideSkeletonLoading();
            }, 500); 
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

function populatePaymentData(booking, paymentType) {
    try {
        console.log('Populating payment data:', booking, 'Payment type:', paymentType);
        console.log('Raw booking object keys:', Object.keys(booking));
        console.log('Raw booking object:', JSON.stringify(booking, null, 2));

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

        const amountToPay = getPaymentAmount(booking, paymentType);

        const discountPercentage = calculateDiscountPercentage(booking);
        const discountAmount = calculateDiscountAmount(booking);

        updatePaymentTypeIndicator(paymentType, amountToPay);

        populateElement('pricePerDay', packageFee.toLocaleString());
        populateElement('daysOfStay', numOfDays.toString());
        populateElement('totalPriceDay', (packageFee * numOfDays).toLocaleString());
        
        populateElement('addGuestPrice', additionalPaxPrice.toLocaleString());
        populateElement('addGuestCount', additionalPax.toString());
        populateElement('totalAddGuest', (additionalPaxPrice * additionalPax).toLocaleString());
        
        populateElement('reservationFee', reservationFee.toLocaleString());

        console.log('🎨 Processing discount display:', { 
            originalDiscount: discount, 
            discountPercentage, 
            discountAmount 
        });
        
        const discountSection = document.getElementById('discountSection');
        console.log('🔍 Discount section element found:', !!discountSection);

        const DEVELOPMENT_MODE = false; 
        const mockDiscount = 50;
        const mockDiscountPercentage = 10.5;
        
        if (discount > 0) {
            console.log('✅ Discount found, showing discount section');
            populateElement('discount', discountAmount.toLocaleString());
            populateElement('discountPercentage', `${discountPercentage}%`);

            if (discountSection) {
                discountSection.style.display = 'flex';
                console.log('✅ Discount section made visible');
            }
        } else if (DEVELOPMENT_MODE && discount === 0) {
            console.log('🔧 Development mode: showing mock discount');
            populateElement('discount', mockDiscount.toLocaleString());
            populateElement('discountPercentage', `${mockDiscountPercentage}%`);

            if (discountSection) {
                discountSection.style.display = 'flex';
                console.log('✅ Mock discount section made visible');
            }
        } else {
            console.log('❌ No discount found, hiding discount section');

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

        ensureInputFieldsVisible();
        
    } catch (error) {
        console.error('Error populating payment data:', error);
        showToastError('error', 'Data Error', 'Error displaying payment information.');
    }
}

function ensureInputFieldsVisible() {
    console.log('🔧 Ensuring input fields are visible...');
    
    const inputIds = ['transactionNumber', 'bankAccountNumber'];
    inputIds.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {

            input.style.display = '';

            const computedStyle = window.getComputedStyle(input);
            if (computedStyle.display === 'none') {
                input.style.display = 'block';
                console.log(`🔧 Force displayed ${inputId} as block`);
            }

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

function populateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        console.log(`Populated ${elementId} with: ${value}`);
    } else {
        console.warn(`Element with ID '${elementId}' not found`);
    }
}

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

function getPaymentAmount(booking, paymentType) {
    if (paymentType === 'Reservation') {
        return booking.reservationFee || 0;
    } else if (paymentType === 'Package') {

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

        return booking.totalFee || 0;
    }
}

function calculateDiscountPercentage(booking) {
    try {
        const discount = booking.discount || 0;
        const totalFee = booking.totalFee || 0;
        
        if (discount === 0 || totalFee === 0) {
            return 0;
        }

        if (discount <= 100) {

            console.log('Discount appears to be a percentage:', discount);
            return discount;
        } else {

            console.log('Discount appears to be an absolute amount:', discount);

            const originalTotal = totalFee + discount;

            const percentage = (discount / originalTotal) * 100;

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

function calculateDiscountAmount(booking) {
    try {
        const discount = booking.discount || 0;
        const totalFee = booking.totalFee || 0;
        
        if (discount === 0 || totalFee === 0) {
            return 0;
        }

        if (discount <= 100) {

            const discountAmount = totalFee * (discount / (100 - discount));
            
            console.log('Discount amount calculation (from percentage):', {
                discountPercentage: discount,
                totalFee,
                calculatedDiscountAmount: discountAmount
            });
            
            return Math.round(discountAmount);
        } else {

            console.log('Discount is already an absolute amount:', discount);
            return discount;
        }
    } catch (error) {
        console.error('Error calculating discount amount:', error);
        return 0;
    }
}

window.fetchBookingData = fetchBookingData;
window.populatePaymentData = populatePaymentData;
window.getPaymentAmount = getPaymentAmount;
window.fetchPaymentMethods = fetchPaymentMethods;
window.populatePaymentMethods = populatePaymentMethods;
window.showQRCode = showQRCode;
window.checkIfPaymentAlreadyMade = checkIfPaymentAlreadyMade;

function showSkeletonLoading() {
    console.log('🔄 Showing skeleton loading...');

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

    addSkeletonToElement('paymentType', 'skeleton-text-lg', '60%');
    addSkeletonToElement('paymentTypeDescription', 'skeleton-text', '80%');

    const priceElements = [
        'pricePerDay', 'daysOfStay', 'totalPriceDay',
        'addGuestPrice', 'addGuestCount', 'totalAddGuest',
        'reservationFee', 'discount', 'discountPercentage', 'totalPrice'
    ];
    
    priceElements.forEach(elementId => {
        addSkeletonToElement(elementId, 'skeleton-text', '50%');
    });

    const paymentContainer = document.querySelector('.flex.flex-col.p-5');
    if (paymentContainer) {
        const existingPaymentMethods = paymentContainer.querySelectorAll('label[for^="payment-"]');
        existingPaymentMethods.forEach(method => method.style.display = 'none');

        for (let i = 0; i < 5; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'skeleton skeleton-card payment-method-skeleton';
            paymentContainer.appendChild(skeletonCard);
        }
    }

    addSkeletonToInput('transactionNumber');
    addSkeletonToInput('bankAccountNumber');

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

    const paymentContainer = document.querySelector('.flex.flex-col.p-5');
    if (paymentContainer) {
        const existingPaymentMethods = paymentContainer.querySelectorAll('label[for^="payment-"]');
        existingPaymentMethods.forEach(method => method.style.display = '');
    }

    const confirmButton = document.getElementById('confirmPaymentButton1');
    if (confirmButton) {
        confirmButton.style.display = '';
    }

    document.querySelectorAll('.payment-method-skeleton').forEach(skeleton => {
        skeleton.remove();
    });

    document.querySelectorAll('.confirm-button-skeleton').forEach(skeleton => {
        skeleton.remove();
    });

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

        if (transactionInput && window.getComputedStyle(transactionInput).display === 'none') {
            transactionInput.style.display = 'block';
            console.log('🔧 Force showed transactionNumber input');
        }
        if (bankAccountInput && window.getComputedStyle(bankAccountInput).display === 'none') {
            bankAccountInput.style.display = 'block';
            console.log('🔧 Force showed bankAccountNumber input');
        }

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
        skeletonInput.setAttribute('data-original-input', elementId); 
        element.parentNode.insertBefore(skeletonInput, element);
        console.log(`✅ Skeleton added for ${elementId}, original input hidden`);
    } else {
        console.warn(`❌ Input element not found: ${elementId}`);
    }
}

function hidePaymentMethodsSkeleton() {
    console.log('✅ Hiding payment methods skeleton...');

    document.querySelectorAll('.payment-method-skeleton').forEach(skeleton => {
        skeleton.remove();
    });

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
    
    console.log('✅ All OCR elements found - setting up event listeners...');

    console.log('🧪 Testing file input element:', {
        type: fileInput.type,
        accept: fileInput.accept,
        multiple: fileInput.multiple,
        hidden: fileInput.hidden,
        disabled: fileInput.disabled
    });

    let lastSelectedFiles = [];

    fileInput.addEventListener('change', function(e) {
        console.log('🔥 File input intercepted:', e.target.files.length, 'files');
        if (e.target.files.length > 0) {
            lastSelectedFiles = Array.from(e.target.files);
            console.log('💾 Stored files for OCR:', lastSelectedFiles.map(f => f.name));
        }
    }, true); 

    fileInput.addEventListener('input', function(e) {
        console.log('📥 File input event:', e.target.files.length, 'files');
        if (e.target.files.length > 0) {
            lastSelectedFiles = Array.from(e.target.files);
            console.log('💾 Stored files via input event for OCR:', lastSelectedFiles.map(f => f.name));
        }
    });

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

    setupPreviewDivWatcher(previewContainer, transactionInput, () => lastSelectedFiles[0]);

    setupDragAndDropOnly(dropzone, previewContainer, transactionInput, (files) => {
        lastSelectedFiles = Array.from(files);
        console.log('💾 Stored dragged files for OCR:', lastSelectedFiles.map(f => f.name));
    });

    console.log('✅ OCR system ready - will trigger automatically when preview div appears');
}

function setupPreviewDivWatcher(previewContainer, transactionInput, getLastFile) {
    console.log('👀 Setting up preview div watcher...');

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {

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

                            const lastFile = getLastFile();
                            if (lastFile) {
                                console.log('📁 Using stored file for OCR:', lastFile.name);
                                triggerOCRFromPreview({ file: lastFile, fileName: lastFile.name, element: node }, transactionInput);
                            } else {
                                console.log('❌ No stored file available for OCR');

                                const fileInput = document.getElementById('fileInput');
                                if (fileInput && fileInput.files.length > 0) {
                                    console.log('🔄 Found files in file input:', fileInput.files.length);
                                    const file = fileInput.files[0];
                                    console.log('📁 Using file from input for OCR:', file.name);
                                    triggerOCRFromPreview({ file: file, fileName: file.name, element: node }, transactionInput);
                                } else {

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

    observer.observe(previewContainer, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Preview div watcher setup complete');
}

function setupDragAndDropOnly(dropzone, previewContainer, transactionInput, onFilesDropped) {
    console.log('🔧 Setting up drag and drop functionality...');

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

            const fileInput = document.getElementById('fileInput');
            if (fileInput) {

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;

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

            if (transactionInput) {
                transactionInput.value = result.transactionNumber;
                transactionInput.classList.add('border-green-500', 'bg-green-50');

                setTimeout(() => {
                    transactionInput.classList.remove('border-green-500', 'bg-green-50');
                }, 3000);
            }

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

window.uploadImageForOCR = uploadImageForOCR;

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

        const formData = getPaymentFormData();
        console.log('📝 Form data:', formData);

        if (!validatePaymentForm(formData)) {
            hideFullscreenLoading();
            return;
        }

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

        const apiEndpoint = getPaymentApiEndpoint(paymentType, bookingId);
        console.log('🌐 API endpoint:', apiEndpoint);
        console.log('📦 Payload to send:', JSON.stringify(formData, null, 2));
        console.log('🔧 HTTP Method: PATCH');

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

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {

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

            try {
                const uid = localStorage.getItem('userId') || '';
                const role = (localStorage.getItem('role') || 'Guest');
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPaymentCompletion === 'function' && uid) {
                    window.AuditTrailFunctions.logPaymentCompletion(uid, role.charAt(0).toUpperCase() + role.slice(1));
                }
            } catch (_) {}

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

            const modalActionButton = document.getElementById('modalActionButton');
            if (modalActionButton) {
                modalActionButton.onclick = () => {
                    window.location.href = `view-booking.html?bookingId=${bookingId}`;
                };
                console.log('✅ Modal button updated with bookingId:', bookingId);
            }

            setTimeout(() => {
                const successModal = document.getElementById('successBookingModal');
                if (successModal) {
                    successModal.classList.remove('hidden');
                }
            }, 1000);
        } else {
            console.error('❌ Payment confirmation failed:', result);

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

            showToastError('error', 'Payment Failed', errorMessage);

            try {
                const uid = localStorage.getItem('userId') || '';
                const role = (localStorage.getItem('role') || 'Guest');
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPaymentFailure === 'function' && uid) {
                    window.AuditTrailFunctions.logPaymentFailure(uid, role.charAt(0).toUpperCase() + role.slice(1));
                }
            } catch (_) {}
        }
    } catch (error) {
        console.error('💥 Payment confirmation error:', error);

        showToastError('error', 'Payment Error', 'An error occurred while processing your payment. Please try again.');

        try {
            const uid = localStorage.getItem('userId') || '';
            const role = (localStorage.getItem('role') || 'Guest');
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPaymentFailure === 'function' && uid) {
                window.AuditTrailFunctions.logPaymentFailure(uid, role.charAt(0).toUpperCase() + role.slice(1));
            }
        } catch (_) {}
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
