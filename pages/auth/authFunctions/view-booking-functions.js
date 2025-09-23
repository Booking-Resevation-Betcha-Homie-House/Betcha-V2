// View Booking Functions
// This file handles fetching and populating booking data for the view-booking page

// Import centralized toast notification system
import { showToastError } from '/src/toastNotification.js';

// Use centralized toast function (alias for consistency with existing code)
function showToast(type, title, message, duration = 5000) {
    return showToastError(type, title, message, duration);
}

// Guard to prevent double execution
let isInitialized = false;

document.addEventListener('DOMContentLoaded', function () {
    if (isInitialized) {
        console.log('View Booking page already initialized, skipping...');
        return;
    }

    isInitialized = true;
    console.log('View Booking page loaded');

    // Get booking ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');

    console.log('Booking ID from URL:', bookingId);

    if (!bookingId) {
        console.error('No booking ID found in URL');
        showError('Missing booking ID. Please navigate from a valid booking link.');
        return;
    }

    // Fetch and populate booking data
    fetchAndPopulateBookingData(bookingId);
});

// Function to fetch booking data from API
async function fetchBookingData(bookingId) {
    try {
        console.log('Fetching booking data for ID:', bookingId);

        const response = await fetch(`https://betcha-api.onrender.com/booking/${bookingId}`);
        const result = await response.json();

        console.log('Booking API Response:', result);

        if (response.ok && result.booking) {
            return {
                success: true,
                booking: result.booking
            };
        } else {
            return {
                success: false,
                message: result.message || 'Failed to fetch booking data'
            };
        }
    } catch (error) {
        console.error('Error fetching booking data:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection.'
        };
    }
}

// Function to fetch and populate booking data
async function fetchAndPopulateBookingData(bookingId) {
    try {
        showLoading(true);

        const result = await fetchBookingData(bookingId);

        if (result.success) {
            const booking = result.booking;

            // Populate all booking data (including room name from propertyName)
            populateBookingData(booking);

            console.log('Booking data loaded successfully.');
            console.log('Checking for images in booking data...');
            console.log('booking.photoLinks:', booking.photoLinks);

            // Try to create carousel from booking data first (if it has images)
            let carouselCreated = false;
            if (booking.photoLinks && booking.photoLinks.length > 0) {
                createImageCarousel(booking.photoLinks);
                carouselCreated = true;
                console.log('Carousel created from booking data with', booking.photoLinks.length, 'images');
            } else {
                console.log('No photoLinks found in booking data');
            }

            // Only try to fetch property details if we need more images or address
            // and we have a valid propertyId and haven't created carousel yet
            if (booking.propertyId && !carouselCreated) {
                console.log('Trying to fetch property details since no booking images...');
                await setupImageCarousel(booking.propertyId);
            } else if (booking.propertyId && carouselCreated) {
                // Just try to get the address if carousel already created
                console.log('Fetching only property address since carousel already created...');
                await fetchPropertyAddress(booking.propertyId);
            }

        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error in fetchAndPopulateBookingData:', error);
        showError('Failed to load booking details.');
    } finally {
        showLoading(false);
    }
}

// Function to populate booking data in the UI
// Function to handle booking status specific UI changes
function handleBookingStatus(booking) {
    const status = booking.status;
    const paymentButton = document.getElementById('paymentButton');
    const remainingBalanceWrapper = document.querySelector('.w-full.h-fit.p-5.bg-primary\\/10');
    const rescheduleBtn = document.querySelector('[data-modal-target="reschedModal"]');

    // Check for cancellation first
    const isCancelled = status === 'Cancel' || status === 'Cancelled' || status === 'cancelled';
    
    if (isCancelled && booking.refund) {
        // Remove payment button and remaining balance display
        if (paymentButton) {
            paymentButton.closest('.flex.justify-between.items-center')?.remove();
        }
        if (remainingBalanceWrapper) {
            remainingBalanceWrapper.remove();
        }

        // Create refund amount display
        const refundSection = document.createElement('div');
        refundSection.className = 'w-full h-fit p-5 bg-rose-50 border border-rose-200 rounded-lg mb-5';
        refundSection.innerHTML = `
            <div class="flex flex-col justify-center items-center gap-3">
                <p class="text-rose-600 font-manrope">Refund Amount</p>
                <p class="text-rose-600 font-inter font-bold text-5xl">₱ ${booking.refund.refundAmount.toLocaleString()}</p>
                <p class="text-rose-500 text-sm font-inter">${booking.refund.approved ? 'Refund Approved' : 'Refund Pending'}</p>
            </div>
        `;

        // Insert refund section before the transaction summary ends
        const transactionSummary = document.querySelector('.flex.flex-col.border.border-gray-300.bg-white.rounded-3xl.p-5.overflow-hidden.mb-5');
        if (transactionSummary) {
            transactionSummary.insertAdjacentElement('beforeend', refundSection);
        }
    } else if (status === 'Completed') {
        // Remove only the payment button and remaining balance display
        if (paymentButton) {
            paymentButton.closest('.flex.justify-between.items-center')?.remove();
        }
        if (remainingBalanceWrapper) {
            remainingBalanceWrapper.remove();
        }
    }

    // Handle reschedule button for both Completed and Cancelled status
    if (status === 'Completed' || isCancelled) {
        if (rescheduleBtn) {
            // Remove modal trigger
            rescheduleBtn.removeAttribute('data-modal-target');
            // Disable the button
            rescheduleBtn.disabled = true;
            // Remove any click handlers
            rescheduleBtn.onclick = null;
            rescheduleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
            
            // Update text and styles based on status
            rescheduleBtn.querySelector('span').textContent = isCancelled ? 'Cancelled' : 'Completed';
            // Add disabled styles from the HTML
            rescheduleBtn.classList.add('disabled:bg-neutral-200', 'disabled:border-neutral-300', 'disabled:cursor-not-allowed', 'disabled:active:scale-100');
            const buttonText = rescheduleBtn.querySelector('span');
            if (buttonText) {
                buttonText.classList.add('group-disabled:text-neutral-500', 'group-disabled:group-hover:text-neutral-500');
            }
        }
    }
}

function populateBookingData(booking) {
    try {
        // Handle status-specific UI changes first
        handleBookingStatus(booking);
        
        // Basic booking information
        populateElement('roomName', booking.propertyName || 'Property Name');
        populateElement('refID', booking.transNo || booking._id);
        // Ensure copy button exists and is wired up
        ensureCopyRefButton();

        // Dates
        if (booking.checkIn && booking.checkOut) {
            const checkInDate = new Date(booking.checkIn);
            const checkOutDate = new Date(booking.checkOut);

            // Add 1 day to checkout date for display
            const checkOutDatePlusOne = new Date(checkOutDate);
            checkOutDatePlusOne.setDate(checkOutDatePlusOne.getDate() + 1);

            populateElement('rsrvDate', formatDate(new Date(booking.createdAt)));
            populateElement('checkInDate', formatDate(checkInDate));
            populateElement('checkOutDate', formatDate(checkOutDatePlusOne));
        }

        // Times
        populateElement('checkInTime', booking.timeIn || 'TBD');
        populateElement('checkOutTime', booking.timeOut || 'TBD');

        // Guest information
        const totalGuests = 1 + (booking.additionalPax || 0);
        populateElement('guestCount', `${totalGuests} Guest${totalGuests > 1 ? 's' : ''}`);

        // Pricing information
        populateElement('pricePerDay', booking.packageFee?.toLocaleString() || '0');
        populateElement('daysOfStay', booking.numOfDays?.toString() || '0');
        populateElement('totalPriceDay', (booking.packageFee * booking.numOfDays)?.toLocaleString() || '0');

        populateElement('addGuestPrice', booking.additionalPaxPrice?.toLocaleString() || '0');
        populateElement('addGuestCount', booking.additionalPax?.toString() || '0');
        populateElement('totalAddGuest', (booking.additionalPaxPrice * booking.additionalPax)?.toLocaleString() || '0');

        populateElement('reservationFee', booking.reservationFee?.toLocaleString() || '0');
        
        // Update reservation fee display with parentheses and tooltip
        updateReservationFeeDisplay(booking.reservationFee);
        
        // Calculate base subtotal (package fee + additional guest fees)
        const baseSubtotal = (booking.packageFee * booking.numOfDays) + (booking.additionalPaxPrice * booking.additionalPax);
        
        // Handle discount calculation
        const discount = booking.discount || 0;
        const reservationFee = booking.reservationFee || 0;
        let discountAmount = 0;
        let subtotalAfterDiscount = baseSubtotal;
        
        if (discount > 0) {
            // Discount should be calculated on (subtotal - reservationFee)
            const discountBase = baseSubtotal - reservationFee;
            
            // Check if discount is a percentage or absolute amount
            if (discount <= 100) {
                // Percentage discount - apply to discount base (subtotal - reservation fee)
                discountAmount = Math.round((discountBase * discount) / 100);
                populateElement('discountPercentage', `${discount}%`);
            } else {
                // Absolute discount amount
                discountAmount = discount;
                // Calculate percentage for display based on discount base
                const percentage = ((discount / discountBase) * 100).toFixed(1);
                populateElement('discountPercentage', `${percentage}%`);
            }
            
            // Calculate subtotal after discount (before reservation fee)
            subtotalAfterDiscount = baseSubtotal - discountAmount;
            
            // Populate discount amount
            populateElement('discount', discountAmount.toLocaleString());
            
            // Show discount section
            const discountSection = document.getElementById('discountSection');
            if (discountSection) {
                discountSection.style.display = 'flex';
            }
            
            console.log('Discount calculation (reservation fee excluded from discount):', {
                baseSubtotal: baseSubtotal,
                reservationFee: reservationFee,
                discountBase: discountBase,
                discountPercent: discount,
                discountAmount: discountAmount,
                subtotalAfterDiscount: subtotalAfterDiscount,
                calculation: `(${baseSubtotal} - ${reservationFee}) × ${discount}% = ${discountAmount}`
            });
            
        } else {
            // No discount - hide discount section
            const discountSection = document.getElementById('discountSection');
            if (discountSection) {
                discountSection.style.display = 'none';
            }
            populateElement('discount', '0');
            populateElement('discountPercentage', '0%');
        }
        
        // Populate the subtotal (base amount before discount)
        populateElement('subtotal', baseSubtotal.toLocaleString());
        
        // Total is subtotal minus discount (reservation fee shown separately)
        const calculatedTotal = subtotalAfterDiscount;
        populateElement('totalPrice', calculatedTotal.toLocaleString());
        
        // Store the calculated total globally for payment calculations
        window.calculatedBookingTotal = calculatedTotal;
        
        console.log('Final calculation verification:', {
            baseSubtotal: baseSubtotal,
            discountAmount: discountAmount,
            subtotalAfterDiscount: subtotalAfterDiscount,
            reservationFeeDisplayOnly: booking.reservationFee,
            calculatedTotal: calculatedTotal,
            calculation: `Subtotal: ${baseSubtotal}, Discount: -${discountAmount}, Total: ${calculatedTotal}`,
            apiTotal: booking.totalFee
        });

        // Payment status and amounts
        calculateAndDisplayPaymentStatus(booking);

        // Payment details
        displayPaymentDetails();

        // Store booking data globally for reschedule functionality
        currentBookingData = booking;

        // Update reschedule helper text with booking duration
        updateRescheduleHelperText();

        // Check reschedule eligibility and manage calendar state
        checkRescheduleEligibility(booking);

        // Set up reschedule functionality if eligible
        setupRescheduleModal();

        console.log('Booking data populated successfully');

    } catch (error) {
        console.error('Error populating booking data:', error);
        showError('Error displaying booking information.');
    }
}

// Create and wire a copy button next to Reference ID
function ensureCopyRefButton() {
    try {
        const refElement = document.getElementById('refID');
        if (!refElement) return;

        let copyBtn = document.getElementById('copyRefBtn');
        if (!copyBtn) {
            copyBtn = document.createElement('button');
            copyBtn.id = 'copyRefBtn';
            copyBtn.type = 'button';
            copyBtn.textContent = 'Copy';
            copyBtn.innerHTML = `
              <svg class="w-5 h-5 fill-primary-text" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.875 1.25C12.2065 1.25 12.5245 1.3817 12.7589 1.61612C12.9933 1.85054 13.125 2.16848 13.125 2.5V10C13.125 10.3315 12.9933 10.6495 12.7589 10.8839C12.5245 11.1183 12.2065 11.25 11.875 11.25H10.625V12.5C10.625 12.8315 10.4933 13.1495 10.2589 13.3839C10.0245 13.6183 9.70652 13.75 9.375 13.75H3.125C2.79348 13.75 2.47554 13.6183 2.24112 13.3839C2.0067 13.1495 1.875 12.8315 1.875 12.5V5C1.875 4.66848 2.0067 4.35054 2.24112 4.11612C2.47554 3.8817 2.79348 3.75 3.125 3.75H4.375V2.5C4.375 2.16848 4.5067 1.85054 4.74112 1.61612C4.97554 1.3817 5.29348 1.25 5.625 1.25H11.875ZM9.375 5H3.125V12.5H9.375V5ZM6.25 9.375C6.41576 9.375 6.57473 9.44085 6.69194 9.55806C6.80915 9.67527 6.875 9.83424 6.875 10C6.875 10.1658 6.80915 10.3247 6.69194 10.4419C6.57473 10.5592 6.41576 10.625 6.25 10.625H5C4.83424 10.625 4.67527 10.5592 4.55806 10.4419C4.44085 10.3247 4.375 10.1658 4.375 10C4.375 9.83424 4.44085 9.67527 4.55806 9.55806C4.67527 9.44085 4.83424 9.375 5 9.375H6.25ZM11.875 2.5H5.625V3.75H9.375C9.70652 3.75 10.0245 3.8817 10.2589 4.11612C10.4933 4.35054 10.625 4.66848 10.625 5V10H11.875V2.5ZM7.5 6.875C7.6593 6.87518 7.81252 6.93617 7.92836 7.04553C8.04419 7.15489 8.1139 7.30435 8.12323 7.46337C8.13257 7.6224 8.08083 7.77899 7.97858 7.90115C7.87634 8.0233 7.73131 8.10181 7.57312 8.12063L7.5 8.125H5C4.8407 8.12482 4.68748 8.06383 4.57164 7.95447C4.45581 7.84511 4.3861 7.69565 4.37677 7.53663C4.36743 7.3776 4.41917 7.22101 4.52142 7.09885C4.62366 6.9767 4.76869 6.89819 4.92687 6.87937L5 6.875H7.5Z"/>
              </svg>
            `;
            refElement.insertAdjacentElement('afterend', copyBtn);
        }
        // Always apply current sizing/styles (also updates existing buttons)
        copyBtn.className = '!px-2 !py-0.5 ml-2 rounded-full hover:bg-neutral-200 active:scale-95 transition';

        // Attach/refresh handler
        copyBtn.onclick = async () => {
            const text = refElement.textContent?.trim();
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                showToast('success', 'Copied', 'Reference ID copied to clipboard.', 1500);
            } catch (e) {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                showToast('success', 'Copied', 'Reference ID copied to clipboard.', 1500);
            }
        };
    } catch (error) {
        console.error('Error setting up copy button:', error);
    }
}

// Function to calculate and display payment status
function calculateAndDisplayPaymentStatus(booking) {
    try {
        let amountPaid = 0;
        let pendingPayments = [];
        
        // Use the calculated total instead of API total
        const correctTotal = window.calculatedBookingTotal || booking.totalFee || 0;
        let remainingBalance = correctTotal;
        let unpaidReservation = false;
        let unpaidPackage = false;

        // Check reservation payment status
        if (booking.reservation) {
            if (booking.reservation.status === 'Completed') {
                amountPaid += booking.reservationFee || 0;
            } else if (booking.reservation.status === 'Pending' &&
                booking.reservation.modeOfPayment &&
                booking.reservation.modeOfPayment !== 'Pending') {
                amountPaid += booking.reservationFee || 0;
                pendingPayments.push('Reservation');
            } else if (booking.reservation.modeOfPayment === 'Pending' ||
                booking.reservation.modeOfPayment === 'on' ||
                !booking.reservation.modeOfPayment) {
                unpaidReservation = true;
            }
        }

        // Check package payment status
        if (booking.package) {
            // Package amount is the full calculated total (reservation fee shown separately)
            const packageAmount = correctTotal;
            if (booking.package.status === 'Completed') {
                amountPaid += packageAmount;
            } else if (booking.package.status === 'Pending' &&
                booking.package.modeOfPayment &&
                booking.package.modeOfPayment !== 'Pending') {
                amountPaid += packageAmount;
                pendingPayments.push('Package');
            } else if (booking.package.modeOfPayment === 'Pending' ||
                !booking.package.modeOfPayment) {
                unpaidPackage = true;
            }
        }

        remainingBalance = correctTotal - amountPaid;

        // Format amount paid display (badge now indicates status)
        let amountPaidText = amountPaid.toLocaleString();

        // Update the amount paid element
        const amountPaidElement = document.getElementById('amountPaid');
        if (amountPaidElement) {
            amountPaidElement.textContent = amountPaidText;
        }

        // Update totalPaid field with detailed payment logic and get actual paid amount
        const actualPaidAmount = updateTotalPaidField(booking, correctTotal);

        // Calculate remaining balance: total - actual paid amount
        const newRemainingBalance = correctTotal - actualPaidAmount;
        populateElement('remainingBal', Math.max(0, newRemainingBalance).toLocaleString());

        // Handle payment button visibility and functionality
        handlePaymentButton(booking, remainingBalance, unpaidReservation, unpaidPackage);

        // Update simple status badge beside Transaction summary
        let status = 'Unpaid'; // Default status
        
        // Check if booking is cancelled first
        const isCancelled = booking.status === 'Cancel' || booking.status === 'Cancelled' || booking.status === 'cancelled';
        
        if (isCancelled) {
            status = 'Cancel';
        } else {
            // Check reservation and package payment status
            const reservationApproved = booking.reservation?.status === 'Approved';
            const packageApproved = booking.package?.status === 'Approved';
            
            // Check if payments have been attempted (not all fields are "Pending")
            const reservationAttempted = booking.reservation?.modeOfPayment && 
                                       booking.reservation.modeOfPayment !== 'Pending';
            const packageAttempted = booking.package?.modeOfPayment && 
                                   booking.package.modeOfPayment !== 'Pending';
            
            console.log('Payment status check:', {
                reservationApproved,
                packageApproved,
                reservationAttempted,
                packageAttempted,
                reservationStatus: booking.reservation?.status,
                packageStatus: booking.package?.status,
                reservationModeOfPayment: booking.reservation?.modeOfPayment,
                packageModeOfPayment: booking.package?.modeOfPayment
            });
            
            if (reservationApproved && packageApproved) {
                status = 'Fully-Paid';
            } else if (packageApproved && !reservationApproved) {
                status = 'Fully-Paid'; // Package approved means full payment (check package first)
            } else if (reservationApproved && !packageApproved) {
                status = 'Reserved';
            } else if (reservationAttempted || packageAttempted) {
                // Payment attempted but not approved yet
                status = 'Pending';
            } else {
                // No payment attempted (all fields are "Pending")
                status = 'Unpaid';
            }
        }
        
        updateTransactionSummaryStatus(status);

    } catch (error) {
        console.error('Error calculating payment status:', error);
        populateElement('amountPaid', '0');
        const correctTotal = window.calculatedBookingTotal || booking.totalFee || 0;
        populateElement('remainingBal', correctTotal.toLocaleString());
    }
}

// Function to update the totalPaid field with detailed payment logic
function updateTotalPaidField(booking, correctTotal) {
    try {
        const totalPaidElement = document.getElementById('totalPaid');
        if (!totalPaidElement) {
            console.warn('totalPaid element not found');
            return 0;
        }

        // Check payment statuses and attempts
        const reservationApproved = booking.reservation?.status === 'Approved';
        const packageApproved = booking.package?.status === 'Approved';
        const reservationAttempted = booking.reservation?.modeOfPayment && 
                                   booking.reservation.modeOfPayment !== 'Pending';
        const packageAttempted = booking.package?.modeOfPayment && 
                                booking.package.modeOfPayment !== 'Pending';

        let displayText = '';
        let isPending = false;
        let tooltipText = '';
        let actualPaidAmount = 0; // This will be returned for remaining balance calculation

        // Case 1: Both reservation and package have payment attempts
        if (reservationAttempted && packageAttempted) {
            if (reservationApproved && packageApproved) {
                // Both approved - show full amount without parentheses
                displayText = `${correctTotal.toLocaleString()}`;
                actualPaidAmount = correctTotal;
                isPending = false;
            } else if (packageApproved) {
                // Package approved (check package first) - show full amount without parentheses
                displayText = `${correctTotal.toLocaleString()}`;
                actualPaidAmount = correctTotal;
                isPending = false;
            } else {
                // Package not approved (even if reservation is approved) - show full amount with parentheses (yellow)
                displayText = `(${correctTotal.toLocaleString()})`;
                // For pending, we consider it as not fully paid yet
                actualPaidAmount = reservationApproved ? (booking.reservationFee || 0) : 0;
                isPending = true;
                tooltipText = 'Payment is pending approval';
            }
        }
        // Case 2: Only reservation has payment attempt
        else if (reservationAttempted && !packageAttempted) {
            const reservationFee = booking.reservationFee || 0;
            if (reservationApproved) {
                // Reservation approved - show reservation amount without parentheses
                displayText = `${reservationFee.toLocaleString()}`;
                actualPaidAmount = reservationFee;
                isPending = false;
            } else {
                // Reservation pending - show reservation amount with parentheses (yellow)
                displayText = `(${reservationFee.toLocaleString()})`;
                actualPaidAmount = 0; // Pending means not yet paid
                isPending = true;
                tooltipText = 'Reservation payment is pending approval';
            }
        }
        // Case 3: Only package has payment attempt
        else if (!reservationAttempted && packageAttempted) {
            const packageAmount = correctTotal - (booking.reservationFee || 0);
            if (packageApproved) {
                // Package approved - show package amount without parentheses
                displayText = `${packageAmount.toLocaleString()}`;
                actualPaidAmount = packageAmount;
                isPending = false;
            } else {
                // Package pending - show package amount with parentheses (yellow)
                displayText = `(${packageAmount.toLocaleString()})`;
                actualPaidAmount = 0; // Pending means not yet paid
                isPending = true;
                tooltipText = 'Package payment is pending approval';
            }
        }
        // Case 4: No payment attempts
        else {
            displayText = '0';
            actualPaidAmount = 0;
            isPending = false;
        }

        // Update the element
        totalPaidElement.textContent = displayText;
        
        // Apply styling
        if (isPending) {
            totalPaidElement.style.color = '#d97706'; // Yellow-600
            totalPaidElement.title = tooltipText;
        } else {
            totalPaidElement.style.color = ''; // Reset to default
            totalPaidElement.title = '';
        }

        console.log('Total paid field updated:', {
            displayText,
            actualPaidAmount,
            isPending,
            tooltipText,
            reservationApproved,
            packageApproved,
            reservationAttempted,
            packageAttempted
        });

        return actualPaidAmount; // Return the actual paid amount for remaining balance calculation

    } catch (error) {
        console.error('Error updating totalPaid field:', error);
        return 0;
    }
}

// Function to update reservation fee display with parentheses and tooltip
function updateReservationFeeDisplay(reservationFee) {
    try {
        const reservationFeeElement = document.getElementById('reservationFee');
        if (!reservationFeeElement) {
            console.warn('reservationFee element not found');
            return;
        }

        const amount = reservationFee || 0;
        // Display in parentheses to indicate it's not included in total
        reservationFeeElement.textContent = `(${amount.toLocaleString()})`;
        
        // Add tooltip to explain it's not included in total
        reservationFeeElement.title = 'Reservation fee is non-discountable but it is included in the package fee.';
        
        // Add subtle styling to indicate it's informational (removed italic)
        reservationFeeElement.style.color = '#6b7280'; // Gray-500
        reservationFeeElement.style.fontStyle = 'normal'; // Remove italic
        
        // Try to move the reservation fee element above subtotal if possible
        moveReservationFeeAboveSubtotal();

        console.log('Reservation fee display updated:', {
            amount: amount,
            displayText: `(${amount.toLocaleString()})`
        });

    } catch (error) {
        console.error('Error updating reservation fee display:', error);
    }
}

// Function to move reservation fee element above subtotal in the DOM
function moveReservationFeeAboveSubtotal() {
    try {
        const reservationFeeElement = document.getElementById('reservationFee');
        const subtotalElement = document.getElementById('subtotal');
        
        if (!reservationFeeElement || !subtotalElement) {
            console.warn('Could not find reservation fee or subtotal elements for reordering');
            return;
        }
        
        // Find the parent containers (likely the row elements)
        const reservationFeeRow = reservationFeeElement.closest('div, tr, li') || reservationFeeElement.parentElement;
        const subtotalRow = subtotalElement.closest('div, tr, li') || subtotalElement.parentElement;
        
        if (reservationFeeRow && subtotalRow && reservationFeeRow !== subtotalRow) {
            // Move reservation fee row before subtotal row
            subtotalRow.parentNode.insertBefore(reservationFeeRow, subtotalRow);
            console.log('✅ Moved reservation fee above subtotal');
        } else {
            console.log('⚠️ Could not move reservation fee - elements not found or same row');
        }
        
    } catch (error) {
        console.error('Error moving reservation fee above subtotal:', error);
    }
}

// Create or update a small status badge near the Transaction summary title
function updateTransactionSummaryStatus(status) {
    try {
        // Find heading paragraph containing 'Transaction summary'
        let heading = Array.from(document.querySelectorAll('p'))
            .find(p => p.textContent && p.textContent.trim().startsWith('Transaction summary'));
        if (!heading) return;

        // Ensure badge exists
        let badge = document.getElementById('txnStatus');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'txnStatus';
            badge.className = 'hidden text-xs px-2 py-0.5 rounded-full border ml-auto';
            // Make heading a flex container for spacing, non-destructive
            heading.classList.add('flex', 'items-center', 'gap-2');
            heading.appendChild(badge);
        }

        // Reset styles
        badge.classList.remove('hidden', 'bg-yellow-50', 'text-yellow-700', 'border-yellow-300',
            'bg-green-50', 'text-green-700', 'border-green-300',
            'bg-red-50', 'text-red-700', 'border-red-300',
            'bg-blue-50', 'text-blue-700', 'border-blue-300',
            'bg-gray-50', 'text-gray-700', 'border-gray-300');

        if (status === 'Pending') {
            badge.classList.add('bg-yellow-50', 'text-yellow-700', 'border-yellow-300');
        } else if (status === 'Fully-Paid') {
            badge.classList.add('bg-green-50', 'text-green-700', 'border-green-300');
        } else if (status === 'Reserved') {
            badge.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-300');
        } else if (status === 'Cancel') {
            badge.classList.add('bg-red-50', 'text-red-700', 'border-red-300');
        } else { // Unpaid
            badge.classList.add('bg-gray-50', 'text-gray-700', 'border-gray-300');
        }

        badge.textContent = status;
    } catch (e) {
        console.error('Error updating Transaction summary status:', e);
    }
}

// Function to handle payment button visibility and functionality
function handlePaymentButton(booking, remainingBalance, unpaidReservation, unpaidPackage) {
    const paymentButton = document.getElementById('paymentButton');
    if (!paymentButton) return;

    // Check if booking is cancelled
    const isCancelled = booking.status === 'Cancel' || booking.status === 'Cancelled' || booking.status === 'cancelled';

    // Hide button if booking is cancelled
    if (isCancelled) {
        paymentButton.style.display = 'none';
        console.log('Payment button hidden - booking is cancelled');
        return;
    }

    // Show button only if there's remaining balance AND unpaid items
    if (remainingBalance > 0 && (unpaidReservation || unpaidPackage)) {
        paymentButton.style.display = 'flex';

        // Determine payment type and update button text
        let paymentType = '';
        let buttonText = 'Pay balance';

        if (unpaidReservation) {
            paymentType = 'Reservation';
            buttonText = 'Pay Reservation';
        } else if (unpaidPackage) {
            paymentType = 'Package';
            buttonText = 'Pay Package';
        }

        // Update button text
        const buttonSpan = paymentButton.querySelector('span');
        if (buttonSpan) {
            buttonSpan.textContent = buttonText;
        }

        // Update onclick to pass correct parameters
        paymentButton.onclick = () => {
            window.location.href = `../auth/confirm-payment.html?paymentType=${paymentType}&bookingId=${booking._id}`;
        };

        console.log('Payment button configured:', { paymentType, buttonText, bookingId: booking._id });

    } else {
        // Hide button when no payment needed
        paymentButton.style.display = 'none';
        console.log('Payment button hidden - no payment needed');
    }
}

// Function to display payment details
function displayPaymentDetails() {
    // You can add logic here to display payment method details, 
    // payment numbers, etc. based on the booking data
}

// Function to fetch only property address
async function fetchPropertyAddress(propertyId) {
    try {
        if (!propertyId) return;

        const apiUrl = `https://betcha-api.onrender.com/property/display/${propertyId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) return;

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return;

        const result = await response.json();

        if (result && result.address) {
            populateElement('roomAddress', result.address);
            
            // Also load the map with this address and mapLink if available
            loadMapPreview(result.address, result.latitude, result.longitude, result.mapLink);
        }

    } catch (error) {
        console.error('Error fetching property address:', error);
    }
}

// Function to setup image carousel (only for images and address)
async function setupImageCarousel(propertyId) {
    try {
        if (!propertyId) {
            console.warn('No property ID provided');
            return;
        }

        const apiUrl = `https://betcha-api.onrender.com/property/display/${propertyId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Property with ID ${propertyId} not found`);
            }
            return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Property API did not return JSON');
            return;
        }

        const result = await response.json();

        if (result) {
            // The property data is directly in the result, not nested in result.property
            if (result.address) {
                populateElement('roomAddress', result.address);
                
                // Also load the map with this address and mapLink if available
                loadMapPreview(result.address, result.latitude, result.longitude, result.mapLink);
            }

            if (result.photoLinks && result.photoLinks.length > 0) {
                createImageCarousel(result.photoLinks);
                console.log('Carousel created from property API with', result.photoLinks.length, 'images');
            }
        }

    } catch (error) {
        console.error('Error fetching property details:', error);
    }
}

// Function to create image carousel
function createImageCarousel(images) {
    try {
        if (!images || images.length === 0) {
            console.warn('No images to display in carousel');
            // Keep the loading placeholder if no images
            return;
        }

        // Find the image container
        const imageContainer = document.querySelector('.w-full.h-\\[200px\\].rounded-3xl.overflow-hidden.group');
        if (!imageContainer) {
            console.error('Image container not found');
            return;
        }

        if (images.length === 1) {
            // Single image - just display it without carousel
            imageContainer.innerHTML = `
                <img src="${images[0]}" 
                     class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
                     onerror="this.src='/public/images/unit01.jpg'"
                     alt="Property image" />
            `;
            return;
        }

        // Multiple images - create carousel
        const carouselHTML = `
            <div class="relative w-full h-full overflow-hidden">
                <div id="imageCarousel" class="w-full h-full overflow-hidden">
                    <div class="flex h-full transition-transform duration-500 ease-in-out carousel-track">
                        ${images.map((image, index) => `
                            <div class="w-full h-full flex-shrink-0 overflow-hidden">
                                <img src="${image}" 
                                     class="carousel-image w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                                     onerror="this.src='/public/images/unit01.jpg'"
                                     alt="Property image ${index + 1}" />
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Circular Navigation Dots -->
                <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    ${images.map((_, index) => `
                        <div class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>
                    `).join('')}
                </div>
            </div>
        `;

        // Replace the existing image div
        imageContainer.innerHTML = carouselHTML;

        // Setup carousel functionality
        setupCarouselControls(images.length);

        // Start auto-rotation
        startAutoCarousel(images.length);

    } catch (error) {
        console.error('Error creating image carousel:', error);
    }
}

// Function to setup carousel controls
function setupCarouselControls(imageCount) {
    try {
        const track = document.querySelector('.carousel-track');
        const dots = document.querySelectorAll('.dot');

        function updateDots(activeIndex) {
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[activeIndex]) {
                dots[activeIndex].classList.add('active');
            }
        }

        function goToSlide(index) {
            track.style.transform = `translateX(-${index * 100}%)`;
            updateDots(index);
            window.carouselCurrentIndex = index;
        }

        // Dot click handlers
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
                resetAutoCarousel(imageCount);
            });
        });

        // Store the goToSlide function globally so auto carousel can use it
        window.carouselGoToSlide = goToSlide;
        window.carouselCurrentIndex = 0;

    } catch (error) {
        console.error('Error setting up carousel controls:', error);
    }
}

// Function to show specific slide
function showSlide(index) {
    if (window.carouselGoToSlide) {
        window.carouselGoToSlide(index);
        window.carouselCurrentIndex = index;
    }
}

// Function to get current slide index
function getCurrentSlideIndex() {
    return window.carouselCurrentIndex || 0;
}

// Function to start auto carousel
function startAutoCarousel(imageCount) {
    if (imageCount <= 1) return;

    window.carouselInterval = setInterval(() => {
        const currentSlide = getCurrentSlideIndex();
        const nextSlide = (currentSlide + 1) % imageCount;
        showSlide(nextSlide);
    }, 4000); // Change slide every 4 seconds
}

// Function to reset auto carousel
function resetAutoCarousel(imageCount) {
    if (window.carouselInterval) {
        clearInterval(window.carouselInterval);
    }
    startAutoCarousel(imageCount);
}

// Utility function to populate an element safely
function populateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`Element with ID '${elementId}' not found`);
    }
}

// Utility function to format date
function formatDate(date) {
    try {
        // Handle both Date objects and date strings
        let dateObj;
        if (typeof date === 'string') {
            // Add time to avoid timezone issues
            dateObj = new Date(date + 'T12:00:00');
        } else {
            dateObj = date;
        }

        // Format as YYYY/MM/DD
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');

        return `${year}/${month}/${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

// Utility function to show loading state
function showLoading(show) {
    if (show) {
        // Create skeleton loading overlay
        const skeletonHTML = `
            <div id="skeletonLoader" class="fixed inset-0 bg-background z-50 flex flex-col">
                <!-- Header Skeleton -->
                <div class="w-full bg-white shadow-sm p-4">
                    <div class="flex items-center justify-between max-w-6xl mx-auto">
                        <div class="h-8 w-24 bg-neutral-200 rounded animate-pulse"></div>
                        <div class="h-8 w-8 bg-neutral-200 rounded-full animate-pulse"></div>
                    </div>
                </div>
                
                <!-- Main Content Skeleton -->
                <div class="flex-1 p-4 max-w-6xl mx-auto w-full">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Left Side - Image and Details -->
                        <div class="space-y-4">
                            <!-- Image Skeleton -->
                            <div class="w-full h-[200px] bg-neutral-200 rounded-3xl animate-pulse"></div>
                            
                            <!-- Room Info Skeleton -->
                            <div class="space-y-3">
                                <div class="h-6 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="h-4 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="h-4 w-2/3 bg-neutral-200 rounded animate-pulse"></div>
                            </div>
                            
                            <!-- Booking Details Skeleton -->
                            <div class="space-y-2">
                                <div class="h-5 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                                    <div class="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                                    <div class="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                                    <div class="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right Side - Payment Info -->
                        <div class="space-y-4">
                            <!-- Payment Summary Skeleton -->
                            <div class="bg-white rounded-2xl p-4 space-y-3">
                                <div class="h-5 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="border-t pt-2">
                                    <div class="flex justify-between">
                                        <div class="h-5 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-5 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Payment Status Skeleton -->
                            <div class="bg-white rounded-2xl p-4 space-y-3">
                                <div class="h-5 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                    <div class="flex justify-between">
                                        <div class="h-4 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                                        <div class="h-4 w-1/4 bg-neutral-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add skeleton to body
        document.body.insertAdjacentHTML('beforeend', skeletonHTML);
        console.log('Loading...');
    } else {
        // Remove skeleton after minimum display time
        setTimeout(() => {
            const skeleton = document.getElementById('skeletonLoader');
            if (skeleton) {
                skeleton.remove();
            }
            console.log('Loading complete');
        }, 500); // 0.5 seconds minimum display time
    }
}

function showError(message) {
    console.error('Error:', message);
    showToast('error', 'Error', message);
}

// Function to setup reschedule modal functionality
function setupRescheduleModal() {
    try {
        console.log('Setting up reschedule modal...');

        // Set up modal open event listener
        const rescheduleButton = document.querySelector('[data-modal-target="reschedModal"]');
        if (rescheduleButton && !rescheduleButton.disabled) {
            rescheduleButton.addEventListener('click', function () {
                // Initialize calendar when modal opens
                setTimeout(async () => {
                    await initializeRescheduleCalendar();
                }, 100);
            });
        }

        // Set up reschedule button in modal
        const modalRescheduleBtn = document.getElementById('rescheduleSubmitBtn');
        if (modalRescheduleBtn) {
            // Remove any existing event listeners
            const newBtn = modalRescheduleBtn.cloneNode(true);
            modalRescheduleBtn.parentNode.replaceChild(newBtn, modalRescheduleBtn);

            // Add new event listener
            newBtn.addEventListener('click', function (e) {
                e.preventDefault();
                handleReschedule();
            });
        }

        console.log('Reschedule modal setup complete');
    } catch (error) {
        console.error('Error setting up reschedule modal:', error);
    }
}

// ==========================================
// STANDALONE RESCHEDULE CALENDAR IMPLEMENTATION
// This is completely independent from calendar.js/calendar2.js
// ==========================================

// Store booked and maintenance dates globally for reschedule calendar
let rescheduleBookedDates = new Set();
let rescheduleMaintenanceDates = new Set();

// Function to check if a date is checkout-only for reschedule calendar
function isRescheduleCheckoutOnlyDate(dateStr) {
    // A date is checkout-only if:
    // 1. It's booked
    // 2. The previous day is available (not booked and not maintenance)
    if (!rescheduleBookedDates.has(dateStr)) {
        return false;
    }
    
    const date = new Date(dateStr);
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousDayStr = previousDay.toISOString().split('T')[0];
    
    // Check if previous day is available
    const isPreviousDayAvailable = !rescheduleBookedDates.has(previousDayStr) && !rescheduleMaintenanceDates.has(previousDayStr);
    
    return isPreviousDayAvailable;
}

// Function to fetch calendar data for reschedule
async function fetchRescheduleCalendarData(propertyId) {
    try {
        console.log('Fetching reschedule calendar data for property:', propertyId);
        const response = await fetch(`https://betcha-api.onrender.com/calendar/byProperty/${propertyId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Reschedule calendar data received:', data);
        
        // Clear existing dates
        rescheduleBookedDates.clear();
        rescheduleMaintenanceDates.clear();
        
        // Add booked dates to Set (excluding current booking)
        if (data.calendar && data.calendar.booking) {
            data.calendar.booking.forEach(booking => {
                // Exclude current booking dates from blocked dates
                if (currentBookingData && currentBookingData._id !== booking.bookingId) {
                    rescheduleBookedDates.add(booking.date);
                }
            });
        }
        
        // Add maintenance dates to Set
        if (data.calendar && data.calendar.maintenance) {
            data.calendar.maintenance.forEach(maintenance => {
                rescheduleMaintenanceDates.add(maintenance.date);
            });
        }

        console.log('Reschedule booked dates:', Array.from(rescheduleBookedDates));
        console.log('Reschedule maintenance dates:', Array.from(rescheduleMaintenanceDates));
        
        // Don't auto-refresh here since we're called during initialization
        console.log('Calendar data loaded successfully');
    } catch (err) {
        console.error('Error fetching reschedule calendar data:', err);
    }
}

// Calendar state variables
let rescheduleCalendarCurrentDate = new Date();
let currentBookingData = null;
let rescheduleSelectedDates = new Set(); // Store multiple selected dates
let rescheduleSelectionStart = null; // Start of date range
let rescheduleSelectionEnd = null; // End of date range
let rescheduleIsRangeSelection = false; // Flag for range selection mode

// Function to calculate booking duration
function calculateBookingDuration() {
    if (!currentBookingData || !currentBookingData.numOfDays) {
        console.warn('No booking data or daysOfStay available for duration calculation');
        return 7; // Default fallback
    }

    const duration = parseInt(currentBookingData.numOfDays, 10);

    console.log('Current booking duration from daysOfStay:', duration, 'days');
    return duration;
}

// Function to update reschedule helper text with booking duration
function updateRescheduleHelperText() {
    const helperText = document.getElementById('rescheduleHelperText');
    if (helperText) {
        const duration = calculateBookingDuration();
        const nightText = duration === 1 ? 'night' : 'nights';
        helperText.textContent = `💡 Select check-in and check-out dates to reschedule your booking (${duration} ${nightText} max)`;
    }
}

// Function to initialize reschedule calendar
async function initializeRescheduleCalendar() {
    try {
        console.log('Initializing standalone reschedule calendar...');

        const calendarInstance = document.querySelector('#reschedModal .calendar-instance');
        if (!calendarInstance) {
            console.error('Reschedule calendar instance not found');
            return;
        }

        const leftCalendar = calendarInstance.querySelector('.leftCalendar');
        const rightCalendar = calendarInstance.querySelector('.rightCalendar');
        const leftLabel = calendarInstance.querySelector('.leftMonthLabel');
        const rightLabel = calendarInstance.querySelector('.rightMonthLabel');
        const prevBtn = calendarInstance.querySelector('.prevMonth');
        const nextBtn = calendarInstance.querySelector('.nextMonth');

        if (!leftCalendar || !rightCalendar) {
            console.error('Calendar containers not found');
            return;
        }

        // Reset selection state
        rescheduleSelectedDates.clear();
        rescheduleSelectionStart = null;
        rescheduleIsRangeSelection = false;

        // Fetch calendar data for the property FIRST, then render
        if (currentBookingData && currentBookingData.propertyId) {
            console.log('Fetching calendar data before rendering...');
            await fetchRescheduleCalendarData(currentBookingData.propertyId);
        } else {
            console.warn('No currentBookingData or propertyId available');
        }

        function updateRescheduleCalendars() {
            // Left calendar (current month)
            const leftMonth = new Date(rescheduleCalendarCurrentDate);
            buildRescheduleCalendar(leftCalendar, leftMonth, leftLabel);

            // Right calendar (next month) 
            const rightMonth = new Date(rescheduleCalendarCurrentDate);
            rightMonth.setMonth(rightMonth.getMonth() + 1);
            buildRescheduleCalendar(rightCalendar, rightMonth, rightLabel);
        }

        // Navigation event listeners
        if (prevBtn) {
            // Remove existing listeners
            const newPrevBtn = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
            
            newPrevBtn.addEventListener('click', () => {
                rescheduleCalendarCurrentDate.setMonth(rescheduleCalendarCurrentDate.getMonth() - 1);
                updateRescheduleCalendars();
            });
        }

        if (nextBtn) {
            // Remove existing listeners
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            
            newNextBtn.addEventListener('click', () => {
                rescheduleCalendarCurrentDate.setMonth(rescheduleCalendarCurrentDate.getMonth() + 1);
                updateRescheduleCalendars();
            });
        }

        // Initial render
        updateRescheduleCalendars();
        updateRescheduleSelectedDateDisplay();

    } catch (error) {
        console.error('Error initializing reschedule calendar:', error);
    }
}

function buildRescheduleCalendar(container, date, labelEl) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Update month label
    labelEl.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Create calendar HTML - matching calendar.js exactly
    let html = `
      <div class="grid grid-cols-7 gap-1 text-center font-manrope font-semibold border-b border-neutral-300 pb-1 mb-2">
        <div class="w-full aspect-square flex items-center justify-center text-xs">S</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">M</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">T</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">W</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">T</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">F</div>
        <div class="w-full aspect-square flex items-center justify-center text-xs">S</div>
      </div>
      <div class="grid grid-cols-7 gap-1 text-center">
    `;

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
        html += '<div></div>';
    }

    // Add days
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isBooked = rescheduleBookedDates.has(dateStr);
        const isMaintenance = rescheduleMaintenanceDates.has(dateStr);
        const isCheckoutOnly = isRescheduleCheckoutOnlyDate(dateStr);
        const isSelected = rescheduleSelectedDates.has(dateStr);
        
        // Get today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateObj = new Date(dateStr);
        const isPast = dateObj < today;

        // Handle highlighting for selected dates and preview
        let isInRange = false;
        
        // Simple logic: if date is in selected dates, it's in range
        if (rescheduleSelectedDates.has(dateStr)) {
            isInRange = true;
        }

        // Check if this date would exceed the current booking duration limit
        let isOverLimit = false;
        if (rescheduleSelectionStart && rescheduleIsRangeSelection) {
            const startDate = new Date(rescheduleSelectionStart);
            const daysDiff = Math.abs((dateObj - startDate) / (1000 * 60 * 60 * 24));
            const maxDays = calculateBookingDuration() + 1; // Add +1 to allow one extra day
            
            // Debug logging
            console.log('Duration check:', {
                selectedStart: rescheduleSelectionStart,
                hoveredDate: dateStr,
                daysDiff,
                maxDays,
                originalBookingDuration: calculateBookingDuration(),
                currentBookingDuration: currentBookingData?.numOfDays
            });
            
            // Allow selection up to the current booking duration + 1 day
            isOverLimit = daysDiff >= maxDays;
        }

        let classes = "w-full aspect-square text-xs flex items-center justify-center rounded cursor-pointer transition ";
        
        if (isPast) {
            classes += "bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-50";
        } else if (isMaintenance) {
            classes += "bg-red-100 text-red-600 cursor-not-allowed"; // Red tint for maintenance
        } else if (isSelected || isInRange) {
            // Simple styling for selected/range dates
            const allSelectedDates = Array.from(rescheduleSelectedDates).sort();
            const isLastDate = allSelectedDates.length > 1 && dateStr === allSelectedDates[allSelectedDates.length - 1];
            
            if (isLastDate) {
                classes += "bg-green-200 text-green-700 font-bold"; // Light green for checkout date
            } else {
                classes += "bg-primary text-white font-bold"; // Primary color for selected dates
            }
        } else if (isCheckoutOnly) {
            classes += "bg-orange-100 text-orange-600 cursor-pointer hover:bg-orange-200 checkout-only"; // Special styling for unselected checkout-only
        } else if (isBooked && !isCheckoutOnly) {
            classes += "bg-neutral-200 text-neutral-600 cursor-not-allowed"; // Grey for unavailable booked dates
        } else if (isOverLimit) {
            classes += "bg-neutral-200 text-neutral-600 cursor-not-allowed opacity-50";
        } else {
            classes += "bg-background text-black hover:bg-secondary";
        }

        // Add tooltip data attribute for checkout-only dates and over-limit dates
        let tooltipAttr = '';
        if (isCheckoutOnly) {
            tooltipAttr = 'data-tooltip="Checkout only"';
        } else if (isOverLimit) {
            tooltipAttr = `data-tooltip="Exceeds booking duration of ${calculateBookingDuration() + 1} days"`;
        }
        
        const isClickDisabled = (isBooked && !isCheckoutOnly) || isMaintenance || isPast || isOverLimit;
        
        html += `<div class="${classes}" data-reschedule-date="${dateStr}" ${tooltipAttr} ${isClickDisabled ? 'style="pointer-events: none;"' : ''}>${day}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    // Add click handlers to date buttons
    container.querySelectorAll('div[data-reschedule-date]').forEach(dateEl => {
        if (!dateEl.style.pointerEvents) {
            dateEl.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRescheduleDateClick({ target: dateEl });
            });
        }
    });

    // Simplified mouse hover (no re-rendering during hover)
    container.addEventListener('mousemove', (e) => {
        if (!rescheduleIsRangeSelection) return;
        
        const dateEl = e.target.closest('[data-reschedule-date]');
        if (dateEl) {
            const dateStr = dateEl.dataset.rescheduleDate;
            const isPast = new Date(dateStr) < new Date().setHours(0,0,0,0);
            
            if (!isPast) {
                // Just store hover date without re-rendering
                container.closest('.calendar-instance').dataset.hoverDate = dateStr;
            }
        }
    });
    
    // Mouse leave listener to clear preview
    container.addEventListener('mouseleave', () => {
        if (rescheduleIsRangeSelection) {
            delete container.closest('.calendar-instance').dataset.hoverDate;
        }
    });

    // Add tooltip functionality
    addRescheduleTooltipListeners(container);
}

// Function to add tooltip functionality to reschedule calendar
function addRescheduleTooltipListeners(container) {
    container.querySelectorAll('[data-tooltip]').forEach(element => {
        let tooltip = null;
        
        element.addEventListener('mouseenter', (e) => {
            const tooltipText = e.target.getAttribute('data-tooltip');
            if (!tooltipText) return;
            
            // Create tooltip element
            tooltip = document.createElement('div');
            tooltip.className = 'absolute bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50 pointer-events-none';
            tooltip.textContent = tooltipText;
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.top = '-30px';
            tooltip.style.left = '50%';
            
            // Position relative to the hovered element
            e.target.style.position = 'relative';
            e.target.appendChild(tooltip);
        });
        
        element.addEventListener('mouseleave', () => {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
        });
    });
}

function handleRescheduleDateClick(event) {
    const dateStr = event.target.dataset.rescheduleDate;
    const dateObj = new Date(dateStr);
    const isCheckoutOnly = isRescheduleCheckoutOnlyDate(dateStr);
    const isBooked = rescheduleBookedDates.has(dateStr);

    // Check if this date would be over limit
    let isOverLimit = false;
    if (rescheduleSelectionStart && rescheduleIsRangeSelection) {
        const startDate = new Date(rescheduleSelectionStart);
        const daysDiff = Math.abs((dateObj - startDate) / (1000 * 60 * 60 * 24));
        const maxDays = calculateBookingDuration() + 1; // Add +1 to allow one extra day
        isOverLimit = daysDiff >= maxDays;
    }

    console.log('Date clicked:', dateStr, {
        isBooked,
        isCheckoutOnly,
        isPast: dateObj < new Date().setHours(0,0,0,0),
        isOverLimit,
        rescheduleSelectionStart,
        rescheduleIsRangeSelection,
        totalBookedDates: rescheduleBookedDates.size,
        bookedDatesArray: Array.from(rescheduleBookedDates),
        currentBookingDuration: currentBookingData?.numOfDays
    });

    // Prevent clicking on unavailable dates (but allow checkout-only)
    if ((isBooked && !isCheckoutOnly) || dateObj < new Date().setHours(0,0,0,0) || isOverLimit) {
        console.log('Date blocked:', dateStr, {
            reason: isOverLimit ? 'over-duration-limit' : 
                   (isBooked && !isCheckoutOnly) ? 'booked-not-checkout' : 'past-date',
            isBooked,
            isCheckoutOnly,
            isOverLimit,
            isPast: dateObj < new Date().setHours(0,0,0,0)
        });
        return;
    }

    if (!rescheduleSelectionStart) {
        // First click - start selection
        console.log('Starting selection with:', dateStr);
        rescheduleSelectionStart = dateStr;
        rescheduleIsRangeSelection = true;
        rescheduleSelectedDates.clear();
        rescheduleSelectedDates.add(dateStr);
        
        // Update display immediately
        updateRescheduleSelectedDateDisplay();
        
        // Re-render calendar after small delay to avoid conflicts
        setTimeout(() => {
            refreshRescheduleCalendars();
        }, 10);
        return;
    }

    if (rescheduleIsRangeSelection) {
        // Second click - complete range selection
        console.log('Completing selection with:', dateStr);
        
        const startDate = new Date(rescheduleSelectionStart);
        const endDate = new Date(dateStr);
        
        // Ensure we have the dates in correct order
        const actualStart = startDate <= endDate ? rescheduleSelectionStart : dateStr;
        const actualEnd = startDate <= endDate ? dateStr : rescheduleSelectionStart;
        
        // Check duration limit
        const daysDiff = Math.ceil((new Date(actualEnd) - new Date(actualStart)) / (1000 * 60 * 60 * 24));
        const maxDays = calculateBookingDuration() + 1; // Add +1 to allow one extra day
        
        if (daysDiff > maxDays) {
            showToast('warning', 'Selection Limit', `You can only reschedule for ${maxDays} days (current booking + 1 extra day). Please select a shorter range.`);
            return;
        }

        // Minimum stay validation (at least 1 night)
        if (daysDiff < 1) {
            showToast('warning', 'Invalid Selection', 'Check-out date must be after check-in date.');
            return;
        }

        // Generate the range (excluding checkout date for backend)
        const selectedDates = [];
        const current = new Date(actualStart);
        const end = new Date(actualEnd);
        
        while (current < end) { // Use < instead of <= to exclude checkout date
            const currentStr = current.toISOString().split('T')[0];
            selectedDates.push(currentStr);
            current.setDate(current.getDate() + 1);
        }

        // Update state
        rescheduleSelectedDates.clear();
        selectedDates.forEach(date => rescheduleSelectedDates.add(date));
        
        // Add checkout date to selection for display purposes only
        rescheduleSelectedDates.add(actualEnd);
        
        rescheduleSelectionStart = actualStart;
        rescheduleSelectionEnd = actualEnd;
        rescheduleIsRangeSelection = false; // Complete the selection
        
        console.log('Selection completed:', {
            start: actualStart,
            end: actualEnd,
            nightsOnly: selectedDates,
            daysForDisplay: Array.from(rescheduleSelectedDates).sort()
        });
        
        // Update display immediately
        updateRescheduleSelectedDateDisplay();
        
        // Re-render calendar after small delay
        setTimeout(() => {
            refreshRescheduleCalendars();
        }, 10);
    } else {
        // Already have a complete selection - start new selection
        console.log('Resetting selection, starting with:', dateStr);
        rescheduleSelectionStart = dateStr;
        rescheduleSelectionEnd = null;
        rescheduleIsRangeSelection = true;
        rescheduleSelectedDates.clear();
        rescheduleSelectedDates.add(dateStr);
        
        // Update display immediately
        updateRescheduleSelectedDateDisplay();
        
        // Re-render calendar after small delay
        setTimeout(() => {
            refreshRescheduleCalendars();
        }, 10);
    }
}

function refreshRescheduleCalendars() {
    const calendarInstance = document.querySelector('#reschedModal .calendar-instance');
    if (!calendarInstance) return;

    const leftCalendar = calendarInstance.querySelector('.leftCalendar');
    const rightCalendar = calendarInstance.querySelector('.rightCalendar');
    const leftLabel = calendarInstance.querySelector('.leftMonthLabel');
    const rightLabel = calendarInstance.querySelector('.rightMonthLabel');

    if (leftCalendar && rightCalendar) {
        console.log('Refreshing reschedule calendars...');
        
        // Clear any existing timeouts to prevent conflicts
        if (leftCalendar.hoverTimeout) clearTimeout(leftCalendar.hoverTimeout);
        if (rightCalendar.hoverTimeout) clearTimeout(rightCalendar.hoverTimeout);
        
        // Left calendar (current month)
        const leftMonth = new Date(rescheduleCalendarCurrentDate);
        buildRescheduleCalendar(leftCalendar, leftMonth, leftLabel);

        // Right calendar (next month) 
        const rightMonth = new Date(rescheduleCalendarCurrentDate);
        rightMonth.setMonth(rightMonth.getMonth() + 1);
        buildRescheduleCalendar(rightCalendar, rightMonth, rightLabel);
    }
}

function updateRescheduleSelectedDateDisplay() {
    const selectedStaticDate = document.getElementById('selectedStaticDate');
    const clearBtn = document.getElementById('clearSelectionBtn');

    if (selectedStaticDate) {
        if (rescheduleSelectionStart && rescheduleSelectionEnd && !rescheduleIsRangeSelection) {
            // Display completed selection in MM/DD/YYYY format
            const startFormatted = new Date(rescheduleSelectionStart).toLocaleDateString('en-US');
            const endFormatted = new Date(rescheduleSelectionEnd).toLocaleDateString('en-US');
            
            const nights = Array.from(rescheduleSelectedDates).filter(date => date !== rescheduleSelectionEnd).length;
            selectedStaticDate.innerHTML = `<span class="font-bold">${startFormatted}</span> to <span class="font-bold">${endFormatted}</span> (${nights} ${nights === 1 ? 'night' : 'nights'})`;
            
            if (clearBtn) clearBtn.classList.remove('hidden');
        } else if (rescheduleSelectionStart && rescheduleIsRangeSelection) {
            // Display partial selection
            const startFormatted = new Date(rescheduleSelectionStart).toLocaleDateString('en-US');
            selectedStaticDate.innerHTML = `<span class="font-bold">${startFormatted}</span> (select checkout date)`;
            
            if (clearBtn) clearBtn.classList.remove('hidden');
        } else {
            // No selection
            selectedStaticDate.innerHTML = '<span class="text-neutral-400">Select check-in and check-out dates</span>';
            if (clearBtn) clearBtn.classList.add('hidden');
        }
    }
}

// Clear selection function
function clearRescheduleSelection() {
    rescheduleSelectionStart = null;
    rescheduleSelectionEnd = null;
    rescheduleIsRangeSelection = false;
    rescheduleSelectedDates.clear();
    updateRescheduleSelectedDateDisplay();
    refreshRescheduleCalendars();
}

// Make clear function globally accessible
window.clearRescheduleSelection = clearRescheduleSelection;

// Function to handle reschedule API call
async function handleReschedule() {
    try {
        console.log('Handling reschedule...');

        // Validate that dates are selected
        if (!rescheduleSelectionStart || !rescheduleSelectionEnd || rescheduleIsRangeSelection) {
            showToast('warning', 'Select Dates', 'Please select both check-in and check-out dates for reschedule.');
            return;
        }

        // Validate that we have booking data
        if (!currentBookingData || !currentBookingData._id) {
            showToast('error', 'Error', 'Booking information not available. Please refresh the page.');
            return;
        }

        // Generate array of dates (excluding checkout date for backend)
        const selectedDatesArray = Array.from(rescheduleSelectedDates).sort();
        const newBookingDates = selectedDatesArray.filter(date => date !== rescheduleSelectionEnd);

        console.log('Reschedule submit data:', {
            selectionStart: rescheduleSelectionStart,
            selectionEnd: rescheduleSelectionEnd,
            bookingId: currentBookingData._id,
            newBookingDates: newBookingDates,
            totalNights: newBookingDates.length
        });

        // Show loading state
        const rescheduleBtn = document.getElementById('rescheduleSubmitBtn');
        rescheduleBtn.disabled = true;
        rescheduleBtn.querySelector('span').textContent = 'Rescheduling...';

        // Make API call
        const response = await fetch(`https://betcha-api.onrender.com/booking/update-dates/${currentBookingData._id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                newBookingDates: newBookingDates
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Success
            showToast('success', 'Reschedule Successful', 'Your booking has been rescheduled successfully.');

            // Close modal
            const closeBtn = document.querySelector('#reschedModal [data-close-modal]');
            if (closeBtn) closeBtn.click();

            // Refresh booking data
            const urlParams = new URLSearchParams(window.location.search);
            const bookingId = urlParams.get('bookingId');
            if (bookingId) {
                setTimeout(() => {
                    fetchAndPopulateBookingData(bookingId);
                }, 1000);
            }

        } else {
            // Error
            showToast('error', 'Reschedule Failed', result.message || 'Failed to reschedule booking. Please try again.');
        }

    } catch (error) {
        console.error('Error during reschedule:', error);
        showToast('error', 'Network Error', 'Failed to connect to server. Please check your connection and try again.');
    } finally {
        // Reset button state
        const rescheduleBtn = document.getElementById('rescheduleSubmitBtn');
        if (rescheduleBtn) {
            rescheduleBtn.disabled = false;
            rescheduleBtn.querySelector('span').textContent = 'Reschedule';
        }
    }
}

// Helper function to generate date range array
// Function to check reschedule eligibility and manage calendar state
function checkRescheduleEligibility(booking) {
    try {
        const currentDate = new Date();
        const createdDate = new Date(booking.createdAt);
        const checkInDate = new Date(booking.checkIn);

        // Calculate days difference for both dates
        const daysSinceCreated = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
        const daysSinceCheckIn = Math.floor((currentDate - checkInDate) / (1000 * 60 * 60 * 24));

        // Check if booking is cancelled
        const isCancelled = booking.status === 'Cancel' || booking.status === 'Cancelled' || booking.status === 'cancelled';

        console.log('Reschedule eligibility check:', {
            createdDate: createdDate,
            checkInDate: checkInDate,
            currentDate: currentDate,
            daysSinceCreated: daysSinceCreated,
            daysSinceCheckIn: daysSinceCheckIn,
            bookingStatus: booking.status,
            isCancelled: isCancelled
        });

        // Check if either the booking was created more than 5 days ago OR the check-in date is more than 5 days old OR booking is cancelled
        const isEligible = !isCancelled && daysSinceCreated <= 5 && daysSinceCheckIn <= 5;

        // Get reschedule button
        const rescheduleButton = document.querySelector('[data-modal-target="reschedModal"]');

        if (isEligible) {
            console.log('Booking is eligible for reschedule');
            if (rescheduleButton) {
                // Reset button to enabled state
                rescheduleButton.disabled = false;
                rescheduleButton.classList.remove('cursor-not-allowed', 'bg-neutral-200', 'border-neutral-300');
                rescheduleButton.classList.add('hover:bg-primary/10', 'hover:border-primary', 'active:bg-primary/10', 'active:border-primary');

                // Restore original button text and styling
                const buttonText = rescheduleButton.querySelector('span');
                if (buttonText) {
                    buttonText.textContent = 'Reschedule';
                    buttonText.classList.remove('text-neutral-500');
                    buttonText.classList.add('group-hover:text-primary', 'group-active:text-primary');
                }

                // Restore modal target attribute
                rescheduleButton.setAttribute('data-modal-target', 'reschedModal');
            }
            enableCalendarInputs();
        } else {
            let disabledReason = '';
            let toastMessage = '';
            
            if (isCancelled) {
                disabledReason = 'Booking Cancelled';
                toastMessage = 'This booking has been cancelled and cannot be rescheduled.';
                console.log('Booking is NOT eligible for reschedule - booking is cancelled');
            } else {
                disabledReason = 'Reschedule Unavailable';
                toastMessage = 'This booking is more than 5 days old and cannot be rescheduled.';
                console.log('Booking is NOT eligible for reschedule - too old');
            }
            
            if (rescheduleButton) {
                // Don't set disabled=true as it prevents click events
                // Instead, style it to look disabled but keep it clickable
                rescheduleButton.classList.add('cursor-not-allowed', 'bg-neutral-200', 'border-neutral-300');
                rescheduleButton.classList.remove('hover:bg-primary/10', 'hover:border-primary', 'active:bg-primary/10', 'active:border-primary');

                // Update button text to indicate why it's disabled
                const buttonText = rescheduleButton.querySelector('span');
                if (buttonText) {
                    buttonText.textContent = disabledReason;
                    buttonText.classList.add('text-neutral-500');
                    buttonText.classList.remove('group-hover:text-primary', 'group-active:text-primary');
                }

                // Remove modal target attribute to prevent modal from opening
                rescheduleButton.removeAttribute('data-modal-target');

                // Remove any existing click handlers to prevent multiple listeners
                const newButton = rescheduleButton.cloneNode(true);
                rescheduleButton.parentNode.replaceChild(newButton, rescheduleButton);

                // Add click handler to show toast instead of opening modal
                newButton.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Reschedule button clicked - showing toast');

                    // Show toast notification
                    const toastType = isCancelled ? 'error' : 'warning';
                    const toastTitle = isCancelled ? 'Booking Cancelled' : 'Reschedule Unavailable';
                    showToast(toastType, toastTitle, toastMessage);
                });
            }
            disableCalendarInputs();
        }

        return isEligible;

    } catch (error) {
        console.error('Error checking reschedule eligibility:', error);
        return false;
    }
}

// Function to disable calendar inputs and interactions
function disableCalendarInputs() {
    try {
        // Wait for DOM to be fully loaded before manipulating calendar
        setTimeout(() => {
            const calendarInstances = document.querySelectorAll('.calendar-instance');

            calendarInstances.forEach(instance => {
                // Disable calendar container
                instance.style.pointerEvents = 'none';
                instance.style.opacity = '0.5';

                // Add disabled state styling
                instance.classList.add('calendar-disabled');

                // Disable all buttons within the calendar
                const buttons = instance.querySelectorAll('button');
                buttons.forEach(button => {
                    button.disabled = true;
                    button.style.cursor = 'not-allowed';
                });

                // Disable calendar cells if they exist
                const calendarCells = instance.querySelectorAll('.calendar-day, .day, [data-day]');
                calendarCells.forEach(cell => {
                    cell.style.pointerEvents = 'none';
                    cell.style.cursor = 'not-allowed';
                    cell.onclick = null; // Remove any existing click handlers
                });
            });

            // Show message in the reschedule modal if it exists
            const reschedModal = document.getElementById('reschedModal');
            if (reschedModal) {
                const messageElement = reschedModal.querySelector('.text-muted');
                if (messageElement) {
                    messageElement.textContent = 'This booking is more than 5 days old and cannot be rescheduled.';
                    messageElement.classList.add('text-red-500');
                }
            }

            console.log('Calendar inputs disabled due to booking age');
        }, 100);

    } catch (error) {
        console.error('Error disabling calendar inputs:', error);
    }
}

// Function to enable calendar inputs and interactions
function enableCalendarInputs() {
    try {
        // Wait for DOM to be fully loaded before manipulating calendar
        setTimeout(() => {
            const calendarInstances = document.querySelectorAll('.calendar-instance');

            calendarInstances.forEach(instance => {
                // Enable calendar container
                instance.style.pointerEvents = 'auto';
                instance.style.opacity = '1';

                // Remove disabled state styling
                instance.classList.remove('calendar-disabled');

                // Enable all buttons within the calendar
                const buttons = instance.querySelectorAll('button');
                buttons.forEach(button => {
                    button.disabled = false;
                    button.style.cursor = 'pointer';
                });

                // Enable calendar cells if they exist
                const calendarCells = instance.querySelectorAll('.calendar-day, .day, [data-day]');
                calendarCells.forEach(cell => {
                    cell.style.pointerEvents = 'auto';
                    cell.style.cursor = 'pointer';
                });
            });

            // Reset message in the reschedule modal if it exists
            const reschedModal = document.getElementById('reschedModal');
            if (reschedModal) {
                const messageElement = reschedModal.querySelector('.text-muted');
                if (messageElement) {
                    messageElement.textContent = 'The Reschedule Feature is only available for bookings made within the last 5 days.';
                    messageElement.classList.remove('text-red-500');
                }
            }

            console.log('Calendar inputs enabled');
        }, 100);

    } catch (error) {
        console.error('Error enabling calendar inputs:', error);
    }
}

// Function to load map preview
function loadMapPreview(address, latitude, longitude, mapLink) {
    try {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // First, try to use the mapLink property if available (like view-property page)
        if (mapLink) {
            console.log('Using mapLink from property data:', mapLink);
            
            // Check if mapLink is an iframe embed code
            if (mapLink.includes('<iframe')) {
                // If it's already an iframe, just inject it (update styling for consistency)
                const styledMapLink = mapLink.replace(/class="[^"]*"/g, 'class="w-full h-full rounded-2xl"');
                mapContainer.innerHTML = styledMapLink;
            } else if (mapLink.startsWith('https://www.google.com/maps/embed')) {
                // If it's a direct embed URL, create iframe
                mapContainer.innerHTML = `
                    <iframe src="${mapLink}" 
                        class="w-full h-full rounded-2xl"
                        style="border:0;" 
                        allowfullscreen="" 
                        loading="lazy" 
                        referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                `;
            } else {
                // Try to extract URL from iframe src if it's in a different format
                const srcMatch = mapLink.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                    mapContainer.innerHTML = `
                        <iframe src="${srcMatch[1]}" 
                            class="w-full h-full rounded-2xl"
                            style="border:0;" 
                            allowfullscreen="" 
                            loading="lazy" 
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    `;
                } else {
                    // Fallback to coordinate/address method
                    console.log('Could not parse mapLink, falling back to coordinate/address method');
                    generateMapFromCoordinates();
                }
            }
            
            // Set up directions button
            setupDirectionsButton(address, latitude, longitude);
            return;
        }

        // Fallback: Generate map from coordinates/address if no mapLink
        function generateMapFromCoordinates() {
            // Create map query - prefer coordinates if available, fallback to address
            let mapQuery;
            if (latitude && longitude) {
                mapQuery = `${latitude},${longitude}`;
            } else if (address) {
                mapQuery = encodeURIComponent(address);
            } else {
                console.error('No location data available for map');
                mapContainer.innerHTML = '<span class="text-neutral-500 font-inter">Location not available</span>';
                return;
            }

            // Create the map iframe with the property location and pin marker
            let mapEmbedUrl;
            
            if (latitude && longitude) {
                // For coordinates, use the coordinate-based pin method
                mapEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${latitude},${longitude}!5e1!3m2!1sen!2sph!4v${Date.now()}!5m2!1sen!2sph`;
            } else {
                // For address, use the simpler method with markers parameter
                mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&output=embed&maptype=satellite&markers=${mapQuery}`;
            }
            
            console.log('Loading map with URL (with pin marker):', mapEmbedUrl);
            
            mapContainer.innerHTML = `
                <iframe src="${mapEmbedUrl}" 
                    class="w-full h-full rounded-2xl"
                    style="border:0;" 
                    allowfullscreen="" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade">
                </iframe>
            `;
        }

        generateMapFromCoordinates();

        // Set up directions button
        setupDirectionsButton(address, latitude, longitude);
        
    } catch (error) {
        console.error('Error loading map preview:', error);
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) {
            mapContainer.innerHTML = '<span class="text-neutral-500 font-inter">Error loading map</span>';
        }
    }
}

// Function to setup directions button
function setupDirectionsButton(address, latitude, longitude) {
    try {
        const directionsButtonContainer = document.getElementById('directionsButtonContainer');
        const directionsBtn = document.getElementById('directionsBtn');
        const mapContainer = document.getElementById('mapContainer');
        
        if (!directionsButtonContainer || !directionsBtn || !mapContainer) {
            console.error('Directions button elements not found');
            return;
        }

        // Show the directions button
        directionsButtonContainer.classList.remove('hidden');

        // Create directions query - prefer coordinates if available, fallback to address
        let directionsQuery;
        if (latitude && longitude) {
            directionsQuery = `${latitude},${longitude}`;
        } else if (address) {
            directionsQuery = encodeURIComponent(address);
        } else {
            console.error('No location data available for directions');
            return;
        }

        // Set up click handler for directions button
        let isShowingDirections = false;
        let originalMapContent = '';
        
        directionsBtn.onclick = () => {
            console.log('Directions button clicked');
            
            // Get the text element
            const directionsText = document.getElementById('directionsText');
            
            if (!isShowingDirections) {
                // Store original map content before changing it
                originalMapContent = mapContainer.innerHTML;
                
                // Change text to "Get Location"
                if (directionsText) {
                    directionsText.textContent = "Get Location";
                }
                
                // Show loading animation immediately
                console.log('Loading directions...');
                mapContainer.innerHTML = `
                    <div class="w-full h-full bg-neutral-100 flex items-center justify-center rounded-2xl">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p class="text-neutral-600 font-inter">Getting your location...</p>
                        </div>
                    </div>
                `;
                
                // Check if geolocation is available
                if (navigator.geolocation) {
                    console.log('Geolocation available, requesting user location...');
                    
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const userLat = position.coords.latitude;
                            const userLng = position.coords.longitude;
                            
                            // Create directions URL with user location and our precise destination (driving mode)
                            const directionsEmbedUrl = `https://maps.google.com/maps?saddr=${userLat},${userLng}&daddr=${directionsQuery}&output=embed&maptype=satellite&dirflg=d`;
                            
                            console.log('Generated directions URL:', directionsEmbedUrl);
                            
                            // Update the iframe with directions from user's actual location
                            mapContainer.innerHTML = `
                                <iframe src="${directionsEmbedUrl}" 
                                    class="w-full h-full rounded-2xl"
                                    style="border:0;" 
                                    allowfullscreen="" 
                                    loading="lazy" 
                                    referrerpolicy="no-referrer-when-downgrade">
                                </iframe>
                            `;
                            
                            isShowingDirections = true;
                        },
                        (error) => {
                            console.error('Geolocation error:', error);
                            
                            // Show loading briefly before showing fallback
                            mapContainer.innerHTML = `
                                <div class="w-full h-full bg-neutral-100 flex items-center justify-center rounded-2xl">
                                    <div class="text-center">
                                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                        <p class="text-neutral-600 font-inter">Loading map...</p>
                                    </div>
                                </div>
                            `;
                            
                            // Add a brief delay to show loading, then show fallback
                            setTimeout(() => {
                                // Use simple maps.google.com URL for fallback (no API key needed)
                                const fallbackEmbedUrl = `https://maps.google.com/maps?q=${directionsQuery}&output=embed&maptype=satellite&dirflg=d`;
                                
                                console.log('Generated fallback directions URL:', fallbackEmbedUrl);
                                
                                mapContainer.innerHTML = `
                                    <div class="w-full h-full bg-neutral-100 flex flex-col rounded-2xl overflow-hidden">
                                        <div class="p-2 bg-yellow-100 text-yellow-800 text-center text-xs">
                                            <p>Location access denied. Showing property location.</p>
                                        </div>
                                        <iframe src="${fallbackEmbedUrl}" 
                                            class="w-full flex-1"
                                            style="border:0;" 
                                            allowfullscreen="" 
                                            loading="lazy" 
                                            referrerpolicy="no-referrer-when-downgrade">
                                        </iframe>
                                    </div>
                                `;
                                
                                isShowingDirections = true;
                            }, 800); // 800ms delay to show loading
                        },
                        { 
                            enableHighAccuracy: true, 
                            timeout: 10000, 
                            maximumAge: 300000 
                        }
                    );
                } else {
                    // Browser doesn't support geolocation, show loading then fallback
                    console.log('Geolocation not supported, showing loading then fallback...');
                    
                    // Show loading briefly before showing fallback
                    setTimeout(() => {
                        // Use simple maps.google.com URL (no API key needed)
                        const fallbackEmbedUrl = `https://maps.google.com/maps?q=${directionsQuery}&output=embed&maptype=satellite&dirflg=d`;
                        
                        console.log('Generated no-geolocation fallback URL:', fallbackEmbedUrl);
                        
                        mapContainer.innerHTML = `
                            <div class="w-full h-full bg-neutral-100 flex flex-col rounded-2xl overflow-hidden">
                                <div class="p-2 bg-blue-100 text-blue-800 text-center text-xs">
                                    <p>Geolocation not supported. Showing property location.</p>
                                </div>
                                <iframe src="${fallbackEmbedUrl}" 
                                    class="w-full flex-1"
                                    style="border:0;" 
                                    allowfullscreen="" 
                                    loading="lazy" 
                                    referrerpolicy="no-referrer-when-downgrade">
                                </iframe>
                            </div>
                        `;
                        
                        isShowingDirections = true;
                    }, 800); // 800ms delay to show loading
                }
            } else {
                // Go back to original location view
                console.log('Returning to original location view...');
                
                // Change text back to "Get Directions"
                if (directionsText) {
                    directionsText.textContent = "Get Directions";
                }
                
                // Show loading while switching back to original view
                mapContainer.innerHTML = `
                    <div class="w-full h-full bg-neutral-100 flex items-center justify-center rounded-2xl">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p class="text-neutral-600 font-inter">Loading map...</p>
                        </div>
                    </div>
                `;
                
                // Add a brief delay to show loading, then restore original content
                setTimeout(() => {
                    // Restore original map content
                    mapContainer.innerHTML = originalMapContent;
                    isShowingDirections = false;
                }, 600); // 600ms delay to show loading
            }
        };
        
    } catch (error) {
        console.error('Error setting up directions button:', error);
    }
}
