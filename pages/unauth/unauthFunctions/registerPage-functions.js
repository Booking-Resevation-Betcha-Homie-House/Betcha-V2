
let canResendOTP = true;
let resendTimer = 60;

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function calculateAge(birthMonth, birthDay, birthYear) {
    const today = new Date();
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay); 

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function isAtLeast18Today(birthMonth, birthDay, birthYear) {
    const age = calculateAge(birthMonth, birthDay, birthYear);
    const today = new Date();

    if (age < 18) {
        return false;
    }

    if (age === 18) {
        const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
        return today >= thisYearBirthday;
    }
    
    return true; 
}

function validateStep1() {
    const selectedID = document.querySelector('#selectedID')?.textContent?.trim();
    const idPreviewContainer = document.getElementById('IDpreviewContainer');
    const hasUploadedFiles = idPreviewContainer && idPreviewContainer.children.length > 0;

    const hasStoredFiles = window.uploadedIDFiles && window.uploadedIDFiles.length > 0;

    if (!selectedID || selectedID === 'Select an ID type' || selectedID === '' || selectedID === 'Select valid ID') {
        showError('Please select a valid ID type');
        return false;
    }

    if (!hasUploadedFiles && !hasStoredFiles) {
        showError('Please upload a photo of your ID');
        return false;
    }

    hideError();
    return true;
}

function validateStep2() {
    const firstName = document.querySelector('#step2 input[placeholder="First name"]')?.value;
    const lastName = document.querySelector('#step2 input[placeholder="Last name"]')?.value;
    const selectedSex = document.querySelector('#selectedSex')?.textContent;
    const monthElement = document.querySelector('#selectedMonth');
    const dayElement = document.querySelector('#selectedDay');
    const yearElement = document.querySelector('#selectedYear');

    if (!firstName) {
        showError('First name field not found', 2);
        return false;
    }
    if (!lastName) {
        showError('Last name field not found', 2);
        return false;
    }
    if (!selectedSex) {
        showError('Sex selection not found', 2);
        return false;
    }
    if (!monthElement || !dayElement || !yearElement) {
        showError('Birthdate fields not found', 2);
        return false;
    }

    const monthValue = monthElement.dataset?.value;
    const day = dayElement.textContent;
    const year = yearElement.textContent;

    if (!firstName.trim()) {
        showError('First name is required', 2);
        return false;
    }
    if (!lastName.trim()) {
        showError('Last name is required', 2);
        return false;
    }
    if (selectedSex === 'Sex') {
        showError('Please select your sex', 2);
        return false;
    }
    if (monthElement.textContent === 'Month' || day === 'Month' || year === 'Month') {
        showError('Please select your complete birthdate', 2);
        return false;
    }

    const age = calculateAge(parseInt(monthValue), parseInt(day), parseInt(year));
    const isEligible = isAtLeast18Today(parseInt(monthValue), parseInt(day), parseInt(year));
    
    if (!isEligible) {
        const today = new Date();
        const nextBirthday = new Date(today.getFullYear(), parseInt(monthValue) - 1, parseInt(day));

        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        if (age === 17) {
            const daysUntil18 = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            showError(`You must be 18 years old to register. You will turn 18 in ${daysUntil18} day${daysUntil18 === 1 ? '' : 's'}.`, 2);
        } else {
            showError('You must be at least 18 years old to register', 2);
        }
        return false;
    }

    hideError();
    return true;
}

function validateStep3() {
    const email = document.querySelector('#step3 input[type="email"]')?.value;
    const phone = document.querySelector('#step3 input[type="tel"]')?.value;
    const password = document.querySelector('#step3 #password')?.value;
    const confirmPassword = document.querySelector('#step3 #confirmPassword')?.value;

    if (!email) {
        showError('Email field not found', 3);
        return false;
    }
    if (!phone) {
        showError('Phone field not found', 3);
        return false;
    }
    if (!password) {
        showError('Password field not found', 3);
        return false;
    }
    if (!confirmPassword) {
        showError('Confirm password field not found', 3);
        return false;
    }

    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address', 3);
        return false;
    }
    if (!phone.trim()) {
        showError('Phone number is required', 3);
        return false;
    }
    if (!passwordRegex.test(password)) {
        showError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character', 3);
        return false;
    }
    if (password !== confirmPassword) {
        showError('Passwords do not match', 3);
        return false;
    }

    hideError();
    return true;
}

function showError(message, step = 1) {

    hideError();

    const errorContainer = document.getElementById(`errorContainer${step === 1 ? '' : step}`);
    const errorText = document.getElementById(`errorText${step === 1 ? '' : step}`);

    if (errorContainer && errorText) {
        errorContainer.classList.remove('hidden');
        errorText.textContent = message;
    }

    updateRegisterButtonState();
    updateNextButtonState();
}

function hideError() {
    const errorContainers = document.querySelectorAll('[id^="errorContainer"]');
    
    errorContainers.forEach(container => {
        container.classList.add('hidden');
        container.classList.remove('flex');
    });

    updateRegisterButtonState();
    updateNextButtonState();
}

function updateRegisterButtonState() {
    const registerBtn = document.getElementById('registerBtn2');
    if (!registerBtn) return;

    const email = document.querySelector('#step3 input[type="email"]')?.value;
    const phone = document.querySelector('#step3 input[type="tel"]')?.value;
    const password = document.querySelector('#step3 #password')?.value;
    const confirmPassword = document.querySelector('#step3 #confirmPassword')?.value;

    const errorContainers = document.querySelectorAll('#errorContainer');
    const hasVisibleError = Array.from(errorContainers).some(container => 
        !container.classList.contains('hidden')
    );

    const isEmailValid = email && email.length > 0 && emailRegex.test(email);
    const isPhoneValid = phone && phone.trim().length > 0;
    const isPasswordValid = password && password.length > 0 && passwordRegex.test(password);
    const isConfirmPasswordValid = confirmPassword && confirmPassword.length > 0 && password === confirmPassword;

    const allValid = isEmailValid && isPhoneValid && isPasswordValid && isConfirmPasswordValid && !hasVisibleError;

    if (allValid) {

        registerBtn.disabled = false;
        registerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        registerBtn.classList.add('hover:cursor-pointer');
    } else {

        registerBtn.disabled = true;
        registerBtn.classList.add('opacity-50', 'cursor-not-allowed');
        registerBtn.classList.remove('hover:cursor-pointer');
    }
}

function updateNextButtonState() {

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    if (step1 && !step1.classList.contains('hidden')) {
        const nextBtn1 = document.getElementById('nextBtn1');
        if (!nextBtn1) return;

        const errorContainers = document.querySelectorAll('#errorContainer');
        const hasVisibleError = Array.from(errorContainers).some(container => 
            !container.classList.contains('hidden')
        );

        const selectedID = document.querySelector('#selectedID')?.textContent?.trim();
        const idPreviewContainer = document.getElementById('IDpreviewContainer');
        const hasUploadedFiles = idPreviewContainer && idPreviewContainer.children.length > 0;

        const isStep1Valid = selectedID && selectedID !== 'Select an ID type' && selectedID !== '' && hasUploadedFiles;

        const canProceed = isStep1Valid && !hasVisibleError;

        if (canProceed) {

            nextBtn1.disabled = false;
            nextBtn1.classList.remove('opacity-50', 'cursor-not-allowed');
            nextBtn1.classList.add('hover:cursor-pointer');
        } else {

            nextBtn1.disabled = true;
            nextBtn1.classList.add('opacity-50', 'cursor-not-allowed');
            nextBtn1.classList.remove('hover:cursor-pointer');
        }
    }

    if (step2 && !step2.classList.contains('hidden')) {
        const nextBtn2 = document.getElementById('nextBtn2');
        if (!nextBtn2) return;

        const errorContainers = document.querySelectorAll('#errorContainer');
        const hasVisibleError = Array.from(errorContainers).some(container => 
            !container.classList.contains('hidden')
        );

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

        const canProceed = isStep2Valid && !hasVisibleError;

        if (canProceed) {

            nextBtn2.disabled = false;
            nextBtn2.classList.remove('opacity-50', 'cursor-not-allowed');
            nextBtn2.classList.add('hover:cursor-pointer');
        } else {

            nextBtn2.disabled = true;
            nextBtn2.classList.add('opacity-50', 'cursor-not-allowed');
            nextBtn2.classList.remove('hover:cursor-pointer');
        }
    }
}

async function sendOTP(email) {
    if (!canResendOTP) {
        showError('Please wait before requesting another OTP.', 3);
        return;
    }

    if (!email) {
        showError('Email address is required.', 3);
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

        canResendOTP = false;
        startResendTimer();

        console.log('OTP sent successfully, showing modal');

        hideError();

        const otpModal = document.getElementById('emailOTPModal');
        if (otpModal) {
            otpModal.classList.remove('hidden');
            document.body.classList.add('modal-open');

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

async function registerUser(formData) {

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

        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });

        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) {

            confirmModal.classList.remove('hidden');
            document.body.classList.add('modal-open');

            const registeredModal = document.getElementById('registeredModal');
            const modalContainer = registeredModal.closest('.modal');
            if (modalContainer) {

                modalContainer.classList.remove('hidden');
                document.body.classList.add('modal-open'); 

                const modalOpenEvent = new CustomEvent('modalOpened', {
                    detail: { modalId: modalContainer.id, modal: modalContainer }
                });
                document.dispatchEvent(modalOpenEvent);
            }
        }
    } catch (error) {
        console.error('Modal update error:', error);

    }

    return responseData;
}

function showRegistrationError(errorMessage) {

    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => modal.classList.add('hidden'));

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

    confirmModal.classList.remove('hidden');
}

function showFullscreenLoading(message = 'Loading') {

    const existingOverlays = document.querySelectorAll('[id^="fullscreen-loading"]');
    existingOverlays.forEach(overlay => overlay.remove());

    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'fullscreen-loading-overlay';
    loadingOverlay.className = 'fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm';

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

function updateLoadingMessage(message) {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        const span = loadingMessage.querySelector('span:first-child');
        if (span) {
            span.textContent = message;
        }
    }
}

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

        const requiredFields = ['birthday', 'firstName', 'lastName'];
        const missingFields = requiredFields.filter(field => !data[field] || data[field] === null);
        
        if (missingFields.length > 0) {
            throw new Error('Incomplete data extracted from ID. Please ensure the image is clear and shows the complete driver\'s license.');
        }

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

function autoFillFromOCR(ocrData) {
    try {
        console.log('Auto-filling form with OCR data:', ocrData);

        if (ocrData.firstName) {
            const firstNameInput = document.querySelector('#step2 input[placeholder="First name"]');
            if (firstNameInput) {
                firstNameInput.value = ocrData.firstName;
            }
        }

        if (ocrData.lastName) {
            const lastNameInput = document.querySelector('#step2 input[placeholder="Last name"]');
            if (lastNameInput) {
                lastNameInput.value = ocrData.lastName;
            }
        }

        if (ocrData.middleName) {
            const middleNameInput = document.querySelector('#step2 input[placeholder="Middle name"]');
            if (middleNameInput) {
                middleNameInput.value = ocrData.middleName;
            }
        }

        const genderValue = ocrData.gender || ocrData.sex;
        if (genderValue) {
            const sexDisplay = document.querySelector('#selectedSex');
            if (sexDisplay) {

                let displayValue = genderValue.charAt(0).toUpperCase() + genderValue.slice(1).toLowerCase();

                if (displayValue === 'M' || displayValue === 'Male') {
                    displayValue = 'Male';
                } else if (displayValue === 'F' || displayValue === 'Female') {
                    displayValue = 'Female';
                }

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

        if (ocrData.birthday) {
            try {
                const birthDate = new Date(ocrData.birthday);
                const month = birthDate.getMonth() + 1; 
                const day = birthDate.getDate();
                const year = birthDate.getFullYear();

                const monthDisplay = document.querySelector('#selectedMonth');
                if (monthDisplay) {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    monthDisplay.textContent = months[month - 1];
                    monthDisplay.dataset.value = month.toString();
                    monthDisplay.classList.remove('text-neutral-400');
                    monthDisplay.classList.add('text-primary-text');
                }

                const dayDisplay = document.querySelector('#selectedDay');
                if (dayDisplay) {
                    dayDisplay.textContent = day.toString();
                    dayDisplay.classList.remove('text-neutral-400');
                    dayDisplay.classList.add('text-primary-text');
                }

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

function showOCRError(errorMessage) {

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

    confirmModal.classList.remove('hidden');
}

function closeOCRErrorModal() {
    const confirmModal = document.querySelector('#confirmModal');
    if (confirmModal) {
        confirmModal.classList.add('hidden');
    }
}

window.closeOCRErrorModal = closeOCRErrorModal;

document.addEventListener('DOMContentLoaded', () => {

    const step1Form = document.getElementById('step1');
    const step2Form = document.getElementById('step2');
    const step3Form = document.getElementById('step3');

    const nextBtn1 = document.getElementById('nextBtn1');
    if (nextBtn1) {
        nextBtn1.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('nextBtn1 clicked - starting OCR process');

            if (nextBtn1.disabled) {
                console.log('Button is disabled, returning');
                return; 
            }
            
            try {
                if (!validateStep1()) {
                    console.log('Step 1 validation failed');
                    return;
                }
                
                console.log('Step 1 validation passed, starting OCR scan...');

                showFullscreenLoading('AI analyzing your document');

                let imageFile = null;
                if (window.uploadedIDFiles && window.uploadedIDFiles.length > 0) {
                    imageFile = window.uploadedIDFiles[0];
                } else {

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

                setTimeout(() => updateLoadingMessage('Reading Image and extracting data'), 100);

                console.log('Calling OCR API...');
                const ocrData = await scanDriversLicense(imageFile);
                console.log('OCR scan successful:', ocrData);

                updateLoadingMessage('Formulating your profile');

                autoFillFromOCR(ocrData);

                await new Promise(resolve => setTimeout(resolve, 600));
                
                updateLoadingMessage('Validating the ID');
                await new Promise(resolve => setTimeout(resolve, 3000));

                updateLoadingMessage('Almost ready');
                await new Promise(resolve => setTimeout(resolve, 1000));

                hideFullscreenLoading();

                console.log('Moving to step 2...');
                step1Form.classList.add('hidden');
                step2Form.classList.remove('hidden');
                document.getElementById('step-label').textContent = 'Step 2 of 3';
                document.getElementById('progress-bar').style.width = '66.66%';

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

    const nextBtn2 = document.querySelector('button[onclick="goToStep3()"]');
    if (nextBtn2) {
        nextBtn2.addEventListener('click', (e) => {
            e.preventDefault();

            const btn = document.getElementById('nextBtn2');
            if (btn && btn.disabled) {
                return; 
            }
            
            if (validateStep2()) {
                step2Form.classList.add('hidden');
                step3Form.classList.remove('hidden');
                document.getElementById('step-label').textContent = 'Step 3 of 3';
                document.getElementById('progress-bar').style.width = '100%';

                updateRegisterButtonState();
            }
        });
    }

    const registerBtn = document.querySelector('button[data-modal-target="emailOTPModal"]');
    if (registerBtn) {
        registerBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('registerBtn2');
            if (btn && btn.disabled) {
                return; 
            }
            
            if (validateStep3()) {
                const emailElement = document.querySelector('#step3 input[type="email"]');
                if (!emailElement) {
                    showError('Email field not found. Please refresh the page.', 3);
                    return;
                }
                const email = emailElement.value.trim();
                if (!email) {
                    showError('Please enter your email address.', 3);
                    return;
                }
                
                console.log('Sending OTP to:', email);
                await sendOTP(email);
            }
        });
    }

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

    window.restartRegistration = function() {

        document.getElementById('step1').classList.remove('hidden');
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('step3').classList.add('hidden');
        document.getElementById('progress-bar').style.width = '33.33%';
        document.getElementById('step-label').textContent = 'Step 1 of 3';

        document.querySelectorAll('input').forEach(input => input.value = '');

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

        const idPreviewContainer = document.getElementById('IDpreviewContainer');
        if (idPreviewContainer) idPreviewContainer.innerHTML = '';

        hideError();

        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
        document.body.classList.remove('modal-open');
    };

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

    const confirmButton = document.querySelector('button[data-modal-target="confirmModal"]');
    
    if (confirmButton) {
        confirmButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {

                const otpInputs = document.querySelectorAll('.otp-input');
                const otpValue = Array.from(otpInputs).map(input => input.value).join('');

                if (otpValue.length !== 6 || !/^\d+$/.test(otpValue)) {
                    showError('Please enter a valid 6-digit OTP');
                    return;
                }

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

                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.classList.add('hidden');
                    });

                    await verifyOTP(email, otpValue);

                const formData = new FormData();

                const firstNameEl = document.querySelector('#step2 input[placeholder="First name"]');
                const middleInitialEl = document.querySelector('#step2 input[placeholder="Middle initial"]');
                const lastNameEl = document.querySelector('#step2 input[placeholder="Last name"]');
                const passwordEl = document.querySelector('#step3 #password');
                const phoneEl = document.querySelector('#step3 input[type="tel"]');

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

                const formattedMonth = monthValue.padStart(2, '0');
                const formattedDay = day.padStart(2, '0');
                formData.append('birthday', `${year}-${formattedMonth}-${formattedDay}`);
                
                formData.append('sex', sexElement.textContent);

                const pfpInput = document.querySelector('input[type="file"]');
                if (pfpInput && pfpInput.files[0]) {
                    formData.append('pfp', pfpInput.files[0]);
                }

                const response = await registerUser(formData).catch(error => {

                    throw new Error(error.message || 'Registration failed. Please try again.');
                });

                window.registeredUserData = {
                    firstName: formData.get('firstname'),
                    middleInitial: formData.get('minitial'),
                    lastName: formData.get('lastname'),
                    userId: response.guest._id,
                    email: formData.get('email'),
                    pfplink: response.guest.pfplink || '',
                    verified: response.guest.verified
                };

                const emailOTPModal = document.getElementById('emailOTPModal');
                if (emailOTPModal) {
                    emailOTPModal.classList.add('hidden');
                }

                const confirmModal = document.getElementById('confirmModal');
                if (confirmModal) {
                    confirmModal.classList.remove('hidden');
                    document.body.classList.add('modal-open');
                }

            } catch (error) {

                showRegistrationError(error.message || 'The process failed. Please try again.');

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

    const emailInput = document.querySelector('#step3 input[type="email"]');
    const phoneInput = document.querySelector('#step3 input[type="tel"]');
    const passwordInput = document.querySelector('#step3 #password');
    const confirmPasswordInput = document.querySelector('#step3 #confirmPassword');
    
    if (emailInput) {
        emailInput.addEventListener('input', () => {
            const emailParent = emailInput.closest('.input-style2');
            if (emailInput.value && !emailRegex.test(emailInput.value)) {
                if (emailParent) {
                    emailParent.classList.add('!border-red-500');
                    emailParent.classList.remove('focus-within:!border-primary');
                }
            } else {
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
            if (passwordInput.value) {
                if (!passwordRegex.test(passwordInput.value)) {
                    if (passwordParent) {
                        passwordParent.classList.add('!border-red-500');
                        passwordParent.classList.remove('focus-within:!border-primary');
                    }
                } else {
                    if (passwordParent) {
                        passwordParent.classList.remove('!border-red-500');
                        passwordParent.classList.add('focus-within:!border-primary');
                    }
                }
            }
            updateRegisterButtonState();
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const confirmParent = confirmPasswordInput.closest('.input-style2');
            if (passwordInput && confirmPasswordInput.value) {
                if (passwordInput.value !== confirmPasswordInput.value) {
                    if (confirmParent) {
                        confirmParent.classList.add('!border-red-500');
                        confirmParent.classList.remove('focus-within:!border-primary');
                    }
                } else {
                    if (confirmParent) {
                        confirmParent.classList.remove('!border-red-500');
                        confirmParent.classList.add('focus-within:!border-primary');
                    }
                }
            }
            updateRegisterButtonState();
        });
    }

    const observer = new MutationObserver(() => {
        updateNextButtonState();
    });

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

    updateNextButtonState();

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
