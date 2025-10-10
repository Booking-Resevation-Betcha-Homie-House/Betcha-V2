// Form validation and API integration
let canResendOTP = true;
let resendTimer = 60;

// Regular expressions for validation
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;

// Function to calculate age from birthdate
function calculateAge(birthMonth, birthDay, birthYear) {
    const today = new Date();
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay); // month is 0-indexed
    
    // Calculate age in years
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // If birthday hasn't occurred this year, subtract a year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Function to check if user is exactly 18 or older today
function isAtLeast18Today(birthMonth, birthDay, birthYear) {
    const age = calculateAge(birthMonth, birthDay, birthYear);
    const today = new Date();
    
    // Must be at least 18 years old as of today
    if (age < 18) {
        return false;
    }
    
    // Additional check: if they're exactly 18, make sure their birthday has passed
    if (age === 18) {
        const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
        return today >= thisYearBirthday;
    }
    
    return true; // 19 or older
}

// Step 1 form validation (ID verification)
function validateStep1() {
    const selectedID = document.querySelector('#selectedID')?.textContent?.trim();
    const idPreviewContainer = document.getElementById('IDpreviewContainer');
    const hasUploadedFiles = idPreviewContainer && idPreviewContainer.children.length > 0;
    
    // Also check stored files as backup
    const hasStoredFiles = window.uploadedIDFiles && window.uploadedIDFiles.length > 0;

    // Check if ID type is selected
    if (!selectedID || selectedID === 'Select an ID type' || selectedID === '' || selectedID === 'Select valid ID') {
        showError('Please select a valid ID type');
        return false;
    }

    // Check if ID file is uploaded (check both preview container and stored files)
    if (!hasUploadedFiles && !hasStoredFiles) {
        showError('Please upload a photo of your ID');
        return false;
    }

    hideError();
    return true;
}

// Step 2 form validation (Personal information)
function validateStep2() {
    const firstName = document.querySelector('#step2 input[placeholder="First name"]')?.value;
    const lastName = document.querySelector('#step2 input[placeholder="Last name"]')?.value;
    const selectedSex = document.querySelector('#selectedSex')?.textContent;
    const monthElement = document.querySelector('#selectedMonth');
    const dayElement = document.querySelector('#selectedDay');
    const yearElement = document.querySelector('#selectedYear');

    // Check if elements exist before accessing properties
    if (!firstName) {
        showError('First name field not found');
        return false;
    }
    if (!lastName) {
        showError('Last name field not found');
        return false;
    }
    if (!selectedSex) {
        showError('Sex selection not found');
        return false;
    }
    if (!monthElement || !dayElement || !yearElement) {
        showError('Birthdate fields not found');
        return false;
    }

    const monthValue = monthElement.dataset?.value;
    const day = dayElement.textContent;
    const year = yearElement.textContent;

    // Validate required fields (except middle initial)
    if (!firstName.trim()) {
        showError('First name is required');
        return false;
    }
    if (!lastName.trim()) {
        showError('Last name is required');
        return false;
    }
    if (selectedSex === 'Sex') {
        showError('Please select your sex');
        return false;
    }
    if (monthElement.textContent === 'Month' || day === 'Month' || year === 'Month') {
        showError('Please select your complete birthdate');
        return false;
    }

    // Check if user is at least 18 years old as of today
    const age = calculateAge(parseInt(monthValue), parseInt(day), parseInt(year));
    const isEligible = isAtLeast18Today(parseInt(monthValue), parseInt(day), parseInt(year));
    
    if (!isEligible) {
        const today = new Date();
        const nextBirthday = new Date(today.getFullYear(), parseInt(monthValue) - 1, parseInt(day));
        
        // If birthday already passed this year, next birthday is next year
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        if (age === 17) {
            const daysUntil18 = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            showError(`You must be 18 years old to register. You will turn 18 in ${daysUntil18} day${daysUntil18 === 1 ? '' : 's'}.`);
        } else {
            showError('You must be at least 18 years old to register');
        }
        return false;
    }

    hideError();
    return true;
}

// Step 3 form validation (Contact & password)
function validateStep3() {
    const email = document.querySelector('#step3 input[type="email"]')?.value;
    const phone = document.querySelector('#step3 input[type="tel"]')?.value;
    const password = document.querySelector('#step3 #password')?.value;
    const confirmPassword = document.querySelector('#step3 #confirmPassword')?.value;

    // Check if elements exist
    if (!email) {
        showError('Email field not found');
        return false;
    }
    if (!phone) {
        showError('Phone field not found');
        return false;
    }
    if (!password) {
        showError('Password field not found');
        return false;
    }
    if (!confirmPassword) {
        showError('Confirm password field not found');
        return false;
    }

    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return false;
    }
    if (!phone.trim()) {
        showError('Phone number is required');
        return false;
    }
    if (!passwordRegex.test(password)) {
        showError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
        return false;
    }
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return false;
    }

    hideError();
    return true;
}

// Show error message
function showError(message) {
    // Hide all error containers first
    hideError();
    
    // Create or update floating error message
    let floatingError = document.getElementById('floating-error');
    if (!floatingError) {
        floatingError = document.createElement('div');
        floatingError.id = 'floating-error';
        floatingError.className = `
            fixed top-4 left-1/2 transform -translate-x-1/2 z-50
            bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg
            max-w-sm w-auto text-center text-sm font-medium
            transition-all duration-300 ease-in-out
            animate-pulse
        `.replace(/\s+/g, ' ').trim();
        document.body.appendChild(floatingError);
    }
    
    floatingError.textContent = message;
    floatingError.style.display = 'block';
    floatingError.style.opacity = '1';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (floatingError) {
            floatingError.style.opacity = '0';
            setTimeout(() => {
                if (floatingError && floatingError.style.opacity === '0') {
                    floatingError.style.display = 'none';
                }
            }, 300);
        }
    }, 5000);

    // Update button states when error is shown
    updateRegisterButtonState();
    updateNextButtonState();
}

// Hide error message
function hideError() {
    const floatingError = document.getElementById('floating-error');
    if (floatingError) {
        floatingError.style.opacity = '0';
        setTimeout(() => {
            if (floatingError && floatingError.style.opacity === '0') {
                floatingError.style.display = 'none';
            }
        }, 300);
    }
    
    // Also hide any existing error containers (fallback)
    const errorContainers = document.querySelectorAll('[id^="errorContainer"]');
    errorContainers.forEach(container => {
        container.classList.add('hidden');
        container.classList.remove('flex');
    });

    // Update button states when error is hidden
    updateRegisterButtonState();
    updateNextButtonState();
}

// Function to check if register button should be enabled
function updateRegisterButtonState() {
    const registerBtn = document.getElementById('registerBtn2');
    if (!registerBtn) return;

    const email = document.querySelector('#step3 input[type="email"]')?.value;
    const phone = document.querySelector('#step3 input[type="tel"]')?.value;
    const password = document.querySelector('#step3 #password')?.value;
    const confirmPassword = document.querySelector('#step3 #confirmPassword')?.value;

    // Check if any error is currently being displayed
    const errorContainers = document.querySelectorAll('#errorContainer');
    const hasVisibleError = Array.from(errorContainers).some(container => 
        !container.classList.contains('hidden')
    );

    // Check if all fields are filled and valid
    const isEmailValid = email && email.length > 0 && emailRegex.test(email);
    const isPhoneValid = phone && phone.trim().length > 0;
    const isPasswordValid = password && password.length > 0 && passwordRegex.test(password);
    const isConfirmPasswordValid = confirmPassword && confirmPassword.length > 0 && password === confirmPassword;

    // Button should be enabled only if all fields are valid AND no errors are shown
    const allValid = isEmailValid && isPhoneValid && isPasswordValid && isConfirmPasswordValid && !hasVisibleError;

    if (allValid) {
        // Enable button
        registerBtn.disabled = false;
        registerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        registerBtn.classList.add('hover:cursor-pointer');
    } else {
        // Disable button
        registerBtn.disabled = true;
        registerBtn.classList.add('opacity-50', 'cursor-not-allowed');
        registerBtn.classList.remove('hover:cursor-pointer');
    }
}

// Function to check if next button should be enabled
function updateNextButtonState() {
    // Check which step we're on and update the appropriate button
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    
    // Step 1 -> Step 2 button
    if (step1 && !step1.classList.contains('hidden')) {
        const nextBtn1 = document.getElementById('nextBtn1');
        if (!nextBtn1) return;

        // Check if any error is currently being displayed
        const errorContainers = document.querySelectorAll('#errorContainer');
        const hasVisibleError = Array.from(errorContainers).some(container => 
            !container.classList.contains('hidden')
        );

        // Check step 1 fields (ID verification)
        const selectedID = document.querySelector('#selectedID')?.textContent?.trim();
        const idPreviewContainer = document.getElementById('IDpreviewContainer');
        const hasUploadedFiles = idPreviewContainer && idPreviewContainer.children.length > 0;

        const isStep1Valid = selectedID && selectedID !== 'Select an ID type' && selectedID !== '' && hasUploadedFiles;

        // Button should be enabled only if step 1 is valid AND no errors are shown
        const canProceed = isStep1Valid && !hasVisibleError;

        if (canProceed) {
            // Enable button
            nextBtn1.disabled = false;
            nextBtn1.classList.remove('opacity-50', 'cursor-not-allowed');
            nextBtn1.classList.add('hover:cursor-pointer');
        } else {
            // Disable button
            nextBtn1.disabled = true;
            nextBtn1.classList.add('opacity-50', 'cursor-not-allowed');
            nextBtn1.classList.remove('hover:cursor-pointer');
        }
    }
    
    // Step 2 -> Step 3 button
    if (step2 && !step2.classList.contains('hidden')) {
        const nextBtn2 = document.getElementById('nextBtn2');
        if (!nextBtn2) return;

        // Check if any error is currently being displayed
        const errorContainers = document.querySelectorAll('#errorContainer');
        const hasVisibleError = Array.from(errorContainers).some(container => 
            !container.classList.contains('hidden')
        );

        // Check step 2 fields (personal info)
        const firstName = document.querySelector('#step2 input[placeholder="First name"]')?.value || '';
        const lastName = document.querySelector('#step2 input[placeholder="Last name"]')?.value || '';
        const selectedSex = document.querySelector('#selectedSex')?.textContent || 'Sex';
        const monthElement = document.querySelector('#selectedMonth');
        const dayElement = document.querySelector('#selectedDay');
        const yearElement = document.querySelector('#selectedYear');

        const isStep2Valid = firstName.trim() && lastName.trim() && 
                            selectedSex !== 'Sex' &&
                            monthElement && monthElement.textContent !== 'Month' &&
                            dayElement && dayElement.textContent !== 'Month' &&
                            yearElement && yearElement.textContent !== 'Month';

        // Button should be enabled only if step 2 is valid AND no errors are shown
        const canProceed = isStep2Valid && !hasVisibleError;

        if (canProceed) {
            // Enable button
            nextBtn2.disabled = false;
            nextBtn2.classList.remove('opacity-50', 'cursor-not-allowed');
            nextBtn2.classList.add('hover:cursor-pointer');
        } else {
            // Disable button
            nextBtn2.disabled = true;
            nextBtn2.classList.add('opacity-50', 'cursor-not-allowed');
            nextBtn2.classList.remove('hover:cursor-pointer');
        }
    }
}

// Function to send OTP
async function sendOTP(email) {
    if (!canResendOTP) {
        showError('Please wait before requesting another OTP.');
        return;
    }

    if (!email) {
        showError('Email address is required.');
        return;
    }

    try {
        console.log('Sending OTP request to API for email:', email);
        
        const response = await fetch('https://betcha-api.onrender.com/otp/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        console.log('OTP API response:', response.status, data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send OTP');
        }

        // Start the resend timer
        canResendOTP = false;
        startResendTimer();

        console.log('OTP sent successfully, showing modal');
        
        // Show success message and open OTP modal
        hideError();
        
        // Ensure the OTP modal opens
        const otpModal = document.getElementById('emailOTPModal');
        if (otpModal) {
            otpModal.classList.remove('hidden');
            document.body.classList.add('modal-open');
            
            // Focus on first OTP input
            const firstOtpInput = document.querySelector('.otp-input');
            if (firstOtpInput) {
                setTimeout(() => firstOtpInput.focus(), 100);
            }
        } else {
            console.error('OTP modal not found');
        }

    } catch (error) {
        console.error('Error sending OTP:', error);
        showError(error.message || 'Failed to send OTP. Please try again.');
    }
}

// Timer for resending OTP
function startResendTimer() {
    const timerElement = document.getElementById('timer-resend');
    if (!timerElement) {
        console.error('Timer element not found');
        return;
    }
    
    let secondsLeft = resendTimer;

    const countdown = setInterval(() => {
        if (secondsLeft <= 0) {
            clearInterval(countdown);
            if (timerElement) {
                timerElement.textContent = 'Resend';
                timerElement.classList.remove('text-muted');
                timerElement.classList.add('text-primary', 'cursor-pointer');
            }
            canResendOTP = true;
            return;
        }

        if (timerElement) {
            timerElement.textContent = `Resend in ${secondsLeft}s`;
            timerElement.classList.remove('text-primary', 'cursor-pointer');
            timerElement.classList.add('text-muted');
        }
        secondsLeft--;
    }, 1000);
}

// Register user after OTP verification
async function registerUser(formData) {
    // Add form data logging for debugging
    console.log('Form data being sent:');
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    const response = await fetch('https://betcha-api.onrender.com/guest/create', {
        method: 'POST',
        body: formData
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.message || 'Registration failed');
    }

    try {
        // Close all existing modals first
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });

        // Get and show the confirm modal
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) {
            // Show the modal
            confirmModal.classList.remove('hidden');
            document.body.classList.add('modal-open');

            // Make sure the registered content is showing
            const registeredModal = document.getElementById('registeredModal');
            const modalContainer = registeredModal.closest('.modal');
            if (modalContainer) {
                // Make the modal visible
                modalContainer.classList.remove('hidden');
                document.body.classList.add('modal-open'); // Lock scroll

                // Dispatch custom event for modal opening
                const modalOpenEvent = new CustomEvent('modalOpened', {
                    detail: { modalId: modalContainer.id, modal: modalContainer }
                });
                document.dispatchEvent(modalOpenEvent);
            }
        }
    } catch (error) {
        console.error('Modal update error:', error);
        // Continue with registration even if modal fails
    }

    // Return the response data
    return responseData;
}

// Function to show registration error modal
function showRegistrationError(errorMessage) {
    // Hide any existing modals
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => modal.classList.add('hidden'));

    // Update the confirmation modal content to show error
    const confirmModal = document.querySelector('#confirmModal');
    const modalContent = confirmModal.querySelector('.flex.flex-col.items-center.gap-5.p-8');
    modalContent.innerHTML = `
        <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="font-manrope text-primary-text font-bold text-2xl">Registration Failed</p>
        <p class="font-roboto text-muted text-xs md:text-sm text-center">${errorMessage}</p>
        <div class="flex flex-col md:flex-row gap-3 w-full mt-5">
            <button type="button" 
                onclick="restartRegistration()"
                class="group relative w-full btn rounded-full bg-primary px-6 py-3 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/30
                hover:cursor-pointer active:scale-95
                transition-all duration-500 ease-in-out">
                <span class="text-secondary-text text-base group-hover:-translate-x-1
                transition-transform duration-500 ease-in-out 
                md:text-lg">Try Again</span>
            </button>
        </div>
    `;

    // Show the modal
    confirmModal.classList.remove('hidden');
}

// ⚙️ Fullscreen loading functions (global versions)
function showFullscreenLoading(message = 'Loading') {
    // Remove any existing loading overlays first
    const existingOverlays = document.querySelectorAll('[id^="fullscreen-loading"]');
    existingOverlays.forEach(overlay => overlay.remove());
    
    // Create new loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'fullscreen-loading-overlay';
    loadingOverlay.className = 'fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm';
    
    // Add the loading dots animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes loadingDots {
            0% { content: ''; }
            25% { content: '.'; }
            50% { content: '..'; }
            75% { content: '...'; }
            100% { content: ''; }
        }
        .loading-dots::after {
            content: '';
            animation: loadingDots 1.5s infinite;
            display: inline-block;
            width: 24px;
            text-align: left;
        }
    `;
    document.head.appendChild(style);
    
    const content = `
        <div class="text-center">
            <div class="animate-spin rounded-full h-24 w-24 border-b-4 border-secondary mx-auto mb-6"></div>
            <p class="text-white text-lg flex items-center justify-center" id="loading-message">
                <span>${message}</span>
                <span class="loading-dots"></span>
            </p>
        </div>
    `;
    
    loadingOverlay.innerHTML = content;
    document.body.appendChild(loadingOverlay);
}

function hideFullscreenLoading() {
    const existingOverlays = document.querySelectorAll('[id^="fullscreen-loading"]');
    existingOverlays.forEach(overlay => overlay.remove());
}

// Function to update loading message without recreating overlay
function updateLoadingMessage(message) {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        const span = loadingMessage.querySelector('span:first-child');
        if (span) {
            span.textContent = message;
        }
    }
}

// ⚙️ OCR Scanning function for Driver's License (global)
async function scanDriversLicense(imageFile) {
    try {
        console.log('Starting OCR scan for driver\'s license...');
        
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const response = await fetch('https://betcha-api.onrender.com/ocr/scan/drivers-license', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('OCR Response:', data);
        
        if (!response.ok) {
            throw new Error(data.message || 'OCR scanning failed');
        }
        
        // Validate that essential fields are present and not null
        const requiredFields = ['birthday', 'firstName', 'lastName'];
        const missingFields = requiredFields.filter(field => !data[field] || data[field] === null);
        
        if (missingFields.length > 0) {
            throw new Error('Incomplete data extracted from ID. Please ensure the image is clear and shows the complete driver\'s license.');
        }
        
        // Log what fields were extracted
        console.log('OCR extracted fields:', {
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName || 'N/A',
            birthday: data.birthday,
            gender: data.gender || 'N/A'
        });
        
        return data;
    } catch (error) {
        console.error('OCR Error:', error);
        throw error;
    }
}

// ⚙️ Auto-fill form with OCR data (global)
function autoFillFromOCR(ocrData) {
    try {
        console.log('Auto-filling form with OCR data:', ocrData);
        
        // Fill first name
        if (ocrData.firstName) {
            const firstNameInput = document.querySelector('#step2 input[placeholder="First name"]');
            if (firstNameInput) {
                firstNameInput.value = ocrData.firstName;
            }
        }
        
        // Fill last name
        if (ocrData.lastName) {
            const lastNameInput = document.querySelector('#step2 input[placeholder="Last name"]');
            if (lastNameInput) {
                lastNameInput.value = ocrData.lastName;
            }
        }
        
        // Fill middle name
        if (ocrData.middleName) {
            const middleNameInput = document.querySelector('#step2 input[placeholder="Middle name"]');
            if (middleNameInput) {
                middleNameInput.value = ocrData.middleName;
            }
        }
        
        // Fill sex/gender (check both 'gender' and 'sex' fields)
        const genderValue = ocrData.gender || ocrData.sex;
        if (genderValue) {
            const sexDisplay = document.querySelector('#selectedSex');
            if (sexDisplay) {
                // Convert to proper case and ensure it matches dropdown options
                let displayValue = genderValue.charAt(0).toUpperCase() + genderValue.slice(1).toLowerCase();
                
                // Map common variations to dropdown options
                if (displayValue === 'M' || displayValue === 'Male') {
                    displayValue = 'Male';
                } else if (displayValue === 'F' || displayValue === 'Female') {
                    displayValue = 'Female';
                }
                
                // Validate against allowed options (Male, Female, Other)
                const allowedValues = ['Male', 'Female', 'Other'];
                if (allowedValues.includes(displayValue)) {
                    sexDisplay.textContent = displayValue;
                    sexDisplay.classList.remove('text-neutral-400');
                    sexDisplay.classList.add('text-primary-text');
                    console.log('Gender auto-filled:', displayValue);
                } else {
                    console.warn('Unknown gender value from OCR:', genderValue);
                }
            }
        }
        
        // Fill birthdate
        if (ocrData.birthday) {
            try {
                const birthDate = new Date(ocrData.birthday);
                const month = birthDate.getMonth() + 1; // 0-indexed
                const day = birthDate.getDate();
                const year = birthDate.getFullYear();
                
                // Set month
                const monthDisplay = document.querySelector('#selectedMonth');
                if (monthDisplay) {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    monthDisplay.textContent = months[month - 1];
                    monthDisplay.dataset.value = month.toString();
                    monthDisplay.classList.remove('text-neutral-400');
                    monthDisplay.classList.add('text-primary-text');
                }
                
                // Set day
                const dayDisplay = document.querySelector('#selectedDay');
                if (dayDisplay) {
                    dayDisplay.textContent = day.toString();
                    dayDisplay.classList.remove('text-neutral-400');
                    dayDisplay.classList.add('text-primary-text');
                }
                
                // Set year
                const yearDisplay = document.querySelector('#selectedYear');
                if (yearDisplay) {
                    yearDisplay.textContent = year.toString();
                    yearDisplay.classList.remove('text-neutral-400');
                    yearDisplay.classList.add('text-primary-text');
                }
            } catch (error) {
                console.error('Error parsing birthdate:', error);
            }
        }
        
        console.log('Form auto-fill completed');
    } catch (error) {
        console.error('Error auto-filling form:', error);
    }
}

// Function to show OCR error modal
function showOCRError(errorMessage) {
    // Update the confirmation modal content to show OCR error
    const confirmModal = document.querySelector('#confirmModal');
    if (!confirmModal) {
        console.error('Confirm modal not found');
        return;
    }
    
    const modalContent = confirmModal.querySelector('#registeredModal') || confirmModal.querySelector('.flex.flex-col.items-center.gap-5.p-8');
    if (!modalContent) {
        console.error('Modal content not found');
        return;
    }
    
    modalContent.innerHTML = `
        <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="font-manrope text-primary-text font-bold text-2xl">ID Scan Failed</p>
        <p class="font-roboto text-neutral-500 text-xs md:text-sm text-center">${errorMessage}</p>
        <div class="flex flex-col gap-3 w-full mt-5">
            <button type="button" 
                onclick="closeOCRErrorModal()"
                class="group relative w-full btn rounded-full bg-primary px-6 py-3 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/30
                hover:cursor-pointer active:scale-95
                transition-all duration-500 ease-in-out">
                <span class="text-secondary-text text-base group-hover:-translate-x-1
                transition-transform duration-500 ease-in-out 
                md:text-lg">Try Again</span>
                <span
                    class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out">
                    <svg class="w-5 h-5 ml-2 fill-secondary-text" viewBox="0 0 24 25"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M14.707 6.13598L20.364 11.793C20.5515 11.9805 20.6568 12.2348 20.6568 12.5C20.6568 12.7651 20.5515 13.0194 20.364 13.207L14.707 18.864C14.5184 19.0461 14.2658 19.1469 14.0036 19.1447C13.7414 19.1424 13.4906 19.0372 13.3052 18.8518C13.1198 18.6664 13.0146 18.4156 13.0123 18.1534C13.01 17.8912 13.1108 17.6386 13.293 17.45L17.243 13.5H4C3.73478 13.5 3.48043 13.3946 3.29289 13.2071C3.10536 13.0195 3 12.7652 3 12.5C3 12.2348 3.10536 11.9804 3.29289 11.7929C3.48043 11.6053 3.73478 11.5 4 11.5H17.243L13.293 7.54998C13.1975 7.45773 13.1213 7.34739 13.0689 7.22538C13.0165 7.10338 12.9889 6.97216 12.9877 6.83938C12.9866 6.7066 13.0119 6.57492 13.0622 6.45202C13.1125 6.32913 13.1867 6.21747 13.2806 6.12358C13.3745 6.02969 13.4861 5.95544 13.609 5.90516C13.7319 5.85487 13.8636 5.82957 13.9964 5.83073C14.1292 5.83188 14.2604 5.85947 14.3824 5.91188C14.5044 5.96428 14.6148 6.04047 14.707 6.13598Z" />
                    </svg>
                </span>
            </button>
        </div>
    `;

    // Show the modal
    confirmModal.classList.remove('hidden');
}

// Function to close OCR error modal
function closeOCRErrorModal() {
    const confirmModal = document.querySelector('#confirmModal');
    if (confirmModal) {
        confirmModal.classList.add('hidden');
    }
}

// Make function available globally
window.closeOCRErrorModal = closeOCRErrorModal;

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

    // Step navigation
    const step1Form = document.getElementById('step1');
    const step2Form = document.getElementById('step2');
    const step3Form = document.getElementById('step3');

    // Handle Step 1 -> Step 2 (ID verification -> Personal info)
    const nextBtn1 = document.getElementById('nextBtn1');
    if (nextBtn1) {
        nextBtn1.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('nextBtn1 clicked - starting OCR process');
            
            // Check if button is disabled
            if (nextBtn1.disabled) {
                console.log('Button is disabled, returning');
                return; // Don't proceed if button is disabled
            }
            
            try {
                if (!validateStep1()) {
                    console.log('Step 1 validation failed');
                    return;
                }
                
                console.log('Step 1 validation passed, starting OCR scan...');
                
                // Show fullscreen loading immediately
                showFullscreenLoading('AI analyzing your document');
                
                // Get the uploaded driver's license image
                // First try the stored files from IDverifier.js
                let imageFile = null;
                if (window.uploadedIDFiles && window.uploadedIDFiles.length > 0) {
                    imageFile = window.uploadedIDFiles[0];
                } else {
                    // Fallback to file input
                    const fileInput = document.querySelector('input[type="file"]') || document.getElementById('IDfileInput');
                    if (fileInput && fileInput.files && fileInput.files.length > 0) {
                        imageFile = fileInput.files[0];
                    }
                }
                
                if (!imageFile) {
                    hideFullscreenLoading();
                    showOCRError('Please upload your driver\'s license image first.');
                    return;
                }
                console.log('Found image file:', imageFile.name, 'Size:', imageFile.size);
                await new Promise(resolve => setTimeout(resolve, 2000));

                updateLoadingMessage('Checking the Language');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Smooth transition to next message
                setTimeout(() => updateLoadingMessage('Reading Image and extracting data'), 100);
                
                // Perform OCR scan
                console.log('Calling OCR API...');
                const ocrData = await scanDriversLicense(imageFile);
                console.log('OCR scan successful:', ocrData);
                
                // Update loading message for processing
                updateLoadingMessage('Formulating your profile');
                
                // Auto-fill the form with OCR data
                autoFillFromOCR(ocrData);
                
                // Brief delay to show processing
                await new Promise(resolve => setTimeout(resolve, 600));
                
                updateLoadingMessage('Validating the ID');
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Final loading message
                updateLoadingMessage('Almost ready');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Hide loading before moving to step 2
                hideFullscreenLoading();
                
                // Move to step 2
                console.log('Moving to step 2...');
                step1Form.classList.add('hidden');
                step2Form.classList.remove('hidden');
                document.getElementById('step-label').textContent = 'Step 2 of 3';
                document.getElementById('progress-bar').style.width = '66.66%';
                
                // Initialize button state when step 2 is shown
                updateNextButtonState();
                
            } catch (error) {
                console.error('Error during OCR scan:', error);
                hideFullscreenLoading();
                showOCRError(`Failed to scan driver's license: ${error.message}`);
            }
        });
        
        console.log('Event listener attached to nextBtn1');
    } else {
        console.error('nextBtn1 button not found!');
    }

    // Handle Step 2 -> Step 3 (Personal info -> Contact & password)
    const nextBtn2 = document.querySelector('button[onclick="goToStep3()"]');
    if (nextBtn2) {
        nextBtn2.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Check if button is disabled
            const btn = document.getElementById('nextBtn2');
            if (btn && btn.disabled) {
                return; // Don't proceed if button is disabled
            }
            
            if (validateStep2()) {
                step2Form.classList.add('hidden');
                step3Form.classList.remove('hidden');
                document.getElementById('step-label').textContent = 'Step 3 of 3';
                document.getElementById('progress-bar').style.width = '100%';
                
                // Initialize button state when step 3 is shown
                updateRegisterButtonState();
            }
        });
    }

    // Handle register button click
    const registerBtn = document.querySelector('button[data-modal-target="emailOTPModal"]');
    if (registerBtn) {
        registerBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Check if button is disabled
            const btn = document.getElementById('registerBtn2');
            if (btn && btn.disabled) {
                return; // Don't proceed if button is disabled
            }
            
            if (validateStep3()) {
                const emailElement = document.querySelector('#step3 input[type="email"]');
                if (!emailElement) {
                    showError('Email field not found. Please refresh the page.');
                    return;
                }
                const email = emailElement.value.trim();
                if (!email) {
                    showError('Please enter your email address.');
                    return;
                }
                
                console.log('Sending OTP to:', email);
                await sendOTP(email);
            }
        });
    }

    // Handle resend OTP click
    const resendOTP = document.getElementById('timer-resend');
    if (resendOTP) {
        resendOTP.addEventListener('click', async () => {
            if (canResendOTP) {
                const emailElement = document.querySelector('#step3 input[type="email"]');
                if (!emailElement) {
                    showError('Email field not found. Please refresh the page.');
                    return;
                }
                const email = emailElement.value.trim();
                if (!email) {
                    showError('Please enter your email address.');
                    return;
                }
                
                console.log('Resending OTP to:', email);
                await sendOTP(email);
            }
        });
    }

    // Function to restart registration process
    window.restartRegistration = function() {
        // Reset all forms
        document.getElementById('step1').classList.remove('hidden');
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('step3').classList.add('hidden');
        document.getElementById('progress-bar').style.width = '33.33%';
        document.getElementById('step-label').textContent = 'Step 1 of 3';
        
        // Reset all inputs
        document.querySelectorAll('input').forEach(input => input.value = '');
        
        // Reset dropdowns if they exist
        const selectedSex = document.querySelector('#selectedSex');
        if (selectedSex) selectedSex.textContent = 'Sex';
        
        const selectedMonth = document.querySelector('#selectedMonth');
        if (selectedMonth) selectedMonth.textContent = 'Month';
        
        const selectedDay = document.querySelector('#selectedDay');
        if (selectedDay) selectedDay.textContent = 'Day';
        
        const selectedYear = document.querySelector('#selectedYear');
        if (selectedYear) selectedYear.textContent = 'Year';
        
        const selectedID = document.querySelector('#selectedID');
        if (selectedID) selectedID.textContent = '';
        
        // Clear ID preview container
        const idPreviewContainer = document.getElementById('IDpreviewContainer');
        if (idPreviewContainer) idPreviewContainer.innerHTML = '';
        
        // Hide error messages
        hideError();
        
        // Close modal
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
        document.body.classList.remove('modal-open');
    };

    // Function to verify OTP
    async function verifyOTP(email, otp) {
        try {
            console.log('Verifying OTP:', otp, 'for email:', email);
            
            const response = await fetch('https://betcha-api.onrender.com/otp/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();
            console.log('OTP verification response:', response.status, data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Invalid OTP');
            }

            console.log('OTP verified successfully');
            return true;
        } catch (error) {
            console.error('OTP verification error:', error);
            throw new Error(error.message || 'OTP verification failed. Please try again.');
        }
    }

    // Handle OTP confirmation
    const confirmButton = document.querySelector('button[data-modal-target="confirmModal"]');
    
    if (confirmButton) {
        confirmButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                // Collect OTP digits
                const otpInputs = document.querySelectorAll('.otp-input');
                const otpValue = Array.from(otpInputs).map(input => input.value).join('');
                
                // Validate OTP format
                if (otpValue.length !== 6 || !/^\d+$/.test(otpValue)) {
                    showError('Please enter a valid 6-digit OTP');
                    return;
                }

                // Get email for OTP verification
                const emailElement = document.querySelector('#step3 input[type="email"]');
                if (!emailElement) {
                    showError('Email field not found. Please refresh the page.');
                    return;
                }
                const email = emailElement.value.trim();
                if (!email) {
                    showError('Email address not found. Please go back and enter your email.');
                    return;
                }

                console.log('Verifying OTP:', otpValue, 'for email:', email);

                try {
                    // Hide any visible modals first
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.classList.add('hidden');
                    });

                    // Verify OTP first
                    await verifyOTP(email, otpValue);
                
                // If OTP is verified, proceed with registration
                const formData = new FormData();
                
                // Get form elements with null checks
                const firstNameEl = document.querySelector('#step2 input[placeholder="First name"]');
                const middleInitialEl = document.querySelector('#step2 input[placeholder="Middle initial"]');
                const lastNameEl = document.querySelector('#step2 input[placeholder="Last name"]');
                const passwordEl = document.querySelector('#step3 #password');
                const phoneEl = document.querySelector('#step3 input[type="tel"]');
                
                // Debug: Log which elements are found
                console.log('Form elements found:', {
                    firstNameEl: !!firstNameEl,
                    middleInitialEl: !!middleInitialEl,
                    lastNameEl: !!lastNameEl,
                    passwordEl: !!passwordEl,
                    phoneEl: !!phoneEl
                });
                
                if (!firstNameEl) {
                    throw new Error('First name field not found. Please ensure you completed Step 2.');
                }
                if (!lastNameEl) {
                    throw new Error('Last name field not found. Please ensure you completed Step 2.');
                }
                if (!passwordEl) {
                    throw new Error('Password field not found. Please ensure you completed Step 3.');
                }
                if (!phoneEl) {
                    throw new Error('Phone field not found. Please ensure you completed Step 3.');
                }
                
                formData.append('firstname', firstNameEl.value.trim());
                formData.append('minitial', middleInitialEl ? middleInitialEl.value.trim() : '');
                formData.append('lastname', lastNameEl.value.trim());
                formData.append('email', email);
                formData.append('password', passwordEl.value);
                formData.append('phoneNumber', phoneEl.value.trim());
                
                // Get dropdown elements with null checks
                const monthElement = document.querySelector('#selectedMonth');
                const dayElement = document.querySelector('#selectedDay');
                const yearElement = document.querySelector('#selectedYear');
                const sexElement = document.querySelector('#selectedSex');
                
                if (!monthElement || !dayElement || !yearElement || !sexElement) {
                    throw new Error('Required dropdown selections not found. Please refresh and try again.');
                }
                
                const monthValue = monthElement.dataset.value || monthElement.textContent;
                const day = dayElement.textContent;
                const year = yearElement.textContent;
                
                // Format date as YYYY-MM-DD
                const formattedMonth = monthValue.padStart(2, '0');
                const formattedDay = day.padStart(2, '0');
                formData.append('birthday', `${year}-${formattedMonth}-${formattedDay}`);
                
                formData.append('sex', sexElement.textContent);

                // Do not send ID verification image as profile picture
                // Profile picture should be empty/null during registration
                // Users can upload their profile picture later in their profile settings

                // Try to register user
                const response = await registerUser(formData).catch(error => {
                    // Handle registration error
                    throw new Error(error.message || 'Registration failed. Please try again.');
                });

                console.log('Registration successful:', response);

                // Close the email OTP modal
                const emailOTPModal = document.getElementById('emailOTPModal');
                if (emailOTPModal) {
                    emailOTPModal.classList.add('hidden');
                }

                // Redirect to login page after successful registration
                window.location.href = 'login.html';

            } catch (error) {
                // Show error modal for any failure (OTP or registration)
                showRegistrationError(error.message || 'The process failed. Please try again.');
                // Reset OTP inputs
                otpInputs.forEach(input => input.value = '');
            }

        } catch (error) {
            console.error('Error in registration process:', error);
            showRegistrationError('An unexpected error occurred. Please try again.');
        }
    });
    } else {
        console.error('OTP confirmation button not found');
    }

    // Handle OTP input
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Real-time validation for Step 2 fields (personal info)
    const firstNameInput = document.querySelector('#step2 input[placeholder="First name"]');
    const lastNameInput = document.querySelector('#step2 input[placeholder="Last name"]');
    
    if (firstNameInput) {
        firstNameInput.addEventListener('input', () => {
            updateNextButtonState();
        });
    }
    
    if (lastNameInput) {
        lastNameInput.addEventListener('input', () => {
            updateNextButtonState();
        });
    }

    // Real-time validation for Step 3 fields (email, phone, password)
    const emailInput = document.querySelector('#step3 input[type="email"]');
    const phoneInput = document.querySelector('#step3 input[type="tel"]');
    const passwordInput = document.querySelector('#step3 #password');
    const confirmPasswordInput = document.querySelector('#step3 #confirmPassword');
    
    if (emailInput) {
        emailInput.addEventListener('input', () => {
            const emailParent = emailInput.closest('.input-style2');
            const emailValue = emailInput.value.trim();
            
            if (emailValue) {
                if (!emailRegex.test(emailValue)) {
                    // Show specific email error
                    let emailError = '';
                    if (!emailValue.includes('@')) {
                        emailError = 'Missing @ symbol';
                    } else if (!emailValue.includes('.')) {
                        emailError = 'Missing domain extension';
                    } else if (emailValue.indexOf('@') > emailValue.lastIndexOf('.')) {
                        emailError = 'Invalid format';
                    } else if (!/^[a-zA-Z0-9._-]+@/.test(emailValue)) {
                        emailError = 'Invalid characters';
                    } else if (!/@[a-zA-Z0-9.-]+\./.test(emailValue)) {
                        emailError = 'Invalid domain';
                    } else if (!/\.[a-zA-Z]{2,6}$/.test(emailValue)) {
                        emailError = 'Invalid extension';
                    } else {
                        emailError = 'Invalid email';
                    }
                    
                    showError(emailError);
                    if (emailParent) {
                        emailParent.classList.add('!border-red-500');
                        emailParent.classList.remove('focus-within:!border-primary');
                    }
                } else {
                    hideError();
                    if (emailParent) {
                        emailParent.classList.remove('!border-red-500');
                        emailParent.classList.add('focus-within:!border-primary');
                    }
                }
            } else {
                hideError();
                if (emailParent) {
                    emailParent.classList.remove('!border-red-500');
                    emailParent.classList.add('focus-within:!border-primary');
                }
            }
            updateRegisterButtonState();
        });
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            updateRegisterButtonState();
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const passwordParent = passwordInput.closest('.input-style2');
            const passwordValue = passwordInput.value;
            
            if (passwordValue) {
                if (!passwordRegex.test(passwordValue)) {
                    // Show specific password error
                    let passwordError = '';
                    if (passwordValue.length < 8) {
                        passwordError = 'Min 8 characters';
                    } else if (!/(?=.*[a-z])/.test(passwordValue)) {
                        passwordError = 'Need lowercase letter';
                    } else if (!/(?=.*[A-Z])/.test(passwordValue)) {
                        passwordError = 'Need uppercase letter';
                    } else if (!/(?=.*\d)/.test(passwordValue)) {
                        passwordError = 'Need number';
                    } else if (!/(?=.*[@$!%*?&.])/.test(passwordValue)) {
                        passwordError = 'Need special character';
                    } else {
                        passwordError = 'Invalid password';
                    }
                    
                    showError(passwordError);
                    if (passwordParent) {
                        passwordParent.classList.add('!border-red-500');
                        passwordParent.classList.remove('focus-within:!border-primary');
                    }
                } else {
                    hideError();
                    if (passwordParent) {
                        passwordParent.classList.remove('!border-red-500');
                        passwordParent.classList.add('focus-within:!border-primary');
                    }
                }
            } else {
                hideError();
                if (passwordParent) {
                    passwordParent.classList.remove('!border-red-500');
                    passwordParent.classList.add('focus-within:!border-primary');
                }
            }
            updateRegisterButtonState();
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const confirmParent = confirmPasswordInput.closest('.input-style2');
            const confirmPasswordValue = confirmPasswordInput.value;
            
            if (passwordInput && confirmPasswordValue) {
                if (passwordInput.value !== confirmPasswordValue) {
                    showError('Passwords don\'t match');
                    if (confirmParent) {
                        confirmParent.classList.add('!border-red-500');
                        confirmParent.classList.remove('focus-within:!border-primary');
                    }
                } else {
                    hideError();
                    if (confirmParent) {
                        confirmParent.classList.remove('!border-red-500');
                        confirmParent.classList.add('focus-within:!border-primary');
                    }
                }
            } else {
                hideError();
                if (confirmParent) {
                    confirmParent.classList.remove('!border-red-500');
                    confirmParent.classList.add('focus-within:!border-primary');
                }
            }
            updateRegisterButtonState();
        });
    }

    // Add listeners for dropdown changes (sex, month, day, year)
    // These will be triggered when dropdown selections are made in the dropdown logic
    const observer = new MutationObserver(() => {
        updateNextButtonState();
    });

    // Observe changes to dropdown elements
    const sexElement = document.querySelector('#selectedSex');
    const monthElement = document.querySelector('#selectedMonth');
    const dayElement = document.querySelector('#selectedDay');
    const yearElement = document.querySelector('#selectedYear');
    const idElement = document.querySelector('#selectedID');
    const idPreviewContainer = document.getElementById('IDpreviewContainer');

    if (sexElement) observer.observe(sexElement, { childList: true, subtree: true });
    if (monthElement) observer.observe(monthElement, { childList: true, subtree: true });
    if (dayElement) observer.observe(dayElement, { childList: true, subtree: true });
    if (yearElement) observer.observe(yearElement, { childList: true, subtree: true });
    if (idElement) observer.observe(idElement, { childList: true, subtree: true });
    if (idPreviewContainer) observer.observe(idPreviewContainer, { childList: true, subtree: true });

    // Initialize next button state when DOM is loaded
    updateNextButtonState();
    
    // Global functions for HTML onclick attributes
    window.goToStep2 = function() {
        const step1Form = document.getElementById('step1');
        const step2Form = document.getElementById('step2');
        
        if (validateStep1()) {
            step1Form.classList.add('hidden');
            step2Form.classList.remove('hidden');
            document.getElementById('step-label').textContent = 'Step 2 of 3';
            document.getElementById('progress-bar').style.width = '66.66%';
            updateNextButtonState();
        }
    };
    
    window.goToStep3 = function() {
        const step2Form = document.getElementById('step2');
        const step3Form = document.getElementById('step3');
        
        if (validateStep2()) {
            step2Form.classList.add('hidden');
            step3Form.classList.remove('hidden');
            document.getElementById('step-label').textContent = 'Step 3 of 3';
            document.getElementById('progress-bar').style.width = '100%';
            updateRegisterButtonState();
        }
    };
    
    window.goToStep1 = function() {
        const step1Form = document.getElementById('step1');
        const step2Form = document.getElementById('step2');
        const step3Form = document.getElementById('step3');
        
        step2Form.classList.add('hidden');
        step3Form.classList.add('hidden');
        step1Form.classList.remove('hidden');
        document.getElementById('step-label').textContent = 'Step 1 of 3';
        document.getElementById('progress-bar').style.width = '33.33%';
        updateNextButtonState();
    };
    
    // Add function for back navigation from step 3 to step 2
    window.goBackToStep2 = function() {
        const step2Form = document.getElementById('step2');
        const step3Form = document.getElementById('step3');
        
        step3Form.classList.add('hidden');
        step2Form.classList.remove('hidden');
        document.getElementById('step-label').textContent = 'Step 2 of 3';
        document.getElementById('progress-bar').style.width = '66.66%';
        updateNextButtonState();
    };
});
