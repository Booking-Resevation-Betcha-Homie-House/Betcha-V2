// Form validation and API integration
let canResendOTP = true;
let resendTimer = 60;

// Regular expressions for validation
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Function to calculate age from birthdate
function calculateAge(birthMonth, birthDay, birthYear) {
    const today = new Date();
    const birthDate = new Date(birthYear, birthMonth - 1, birthDay); // month is 0-indexed
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // If birthday hasn't occurred this year, subtract a year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

// Step 1 form validation
function validateStep1() {
    const firstName = document.querySelector('#step1 input[placeholder="First name"]').value;
    const lastName = document.querySelector('#step1 input[placeholder="Last name"]').value;
    const selectedSex = document.querySelector('#selectedSex').textContent;
    const monthElement = document.querySelector('#selectedMonth');
    const dayElement = document.querySelector('#selectedDay');
    const yearElement = document.querySelector('#selectedYear');

    const monthValue = monthElement.dataset.value;
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

    // Check if user is at least 18 years old
    const age = calculateAge(parseInt(monthValue), parseInt(day), parseInt(year));
    if (age < 18) {
        showError('You must be at least 18 years old to register');
        return false;
    }

    hideError();
    return true;
}

// Step 2 form validation
function validateStep2() {
    const email = document.querySelector('#step2 input[type="email"]').value;
    const phone = document.querySelector('#step2 input[type="tel"]').value;
    const password = document.querySelector('#step2 #password').value;
    const confirmPassword = document.querySelector('#step2 #confirmPassword').value;

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
    const errorContainers = document.querySelectorAll('#errorContainer');
    const errorTexts = document.querySelectorAll('#errorText');

    errorContainers.forEach(container => {
        container.classList.remove('hidden');
        container.classList.add('flex');
    });

    errorTexts.forEach(text => {
        text.textContent = message;
    });
}

// Hide error message
function hideError() {
    const errorContainers = document.querySelectorAll('#errorContainer');
    
    errorContainers.forEach(container => {
        container.classList.add('hidden');
        container.classList.remove('flex');
    });
}

// Function to send OTP
async function sendOTP(email) {
    if (!canResendOTP) {
        return;
    }

    try {
        const response = await fetch('https://betcha-api.onrender.com/otp/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            throw new Error('Failed to send OTP');
        }

        // Start the resend timer
        canResendOTP = false;
        startResendTimer();

    } catch (error) {
        console.error('Error sending OTP:', error);
        showError('Failed to send OTP. Please try again.');
    }
}

// Timer for resending OTP
function startResendTimer() {
    const timerElement = document.getElementById('timer-resend');
    let secondsLeft = resendTimer;

    const countdown = setInterval(() => {
        if (secondsLeft <= 0) {
            clearInterval(countdown);
            timerElement.textContent = 'Resend';
            timerElement.classList.remove('text-muted');
            timerElement.classList.add('text-primary', 'cursor-pointer');
            canResendOTP = true;
            return;
        }

        timerElement.textContent = `Resend in ${secondsLeft}s`;
        timerElement.classList.remove('text-primary', 'cursor-pointer');
        timerElement.classList.add('text-muted');
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

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Step navigation
    const step1Form = document.getElementById('step1');
    const step2Form = document.getElementById('step2');

    // Handle next button click
    document.querySelector('button[onclick="goToStep2()"]').addEventListener('click', (e) => {
        e.preventDefault();
        if (validateStep1()) {
            step1Form.classList.add('hidden');
            step2Form.classList.remove('hidden');
            document.getElementById('step-label').textContent = 'Step 2 of 2';
            document.getElementById('progress-bar').style.width = '100%';
        }
    });

    // Handle back button click
    document.querySelector('button[onclick="goToStep1()"]').addEventListener('click', (e) => {
        e.preventDefault();
        step2Form.classList.add('hidden');
        step1Form.classList.remove('hidden');
        document.getElementById('step-label').textContent = 'Step 1 of 2';
        document.getElementById('progress-bar').style.width = '50%';
    });

    // Handle register button click
    document.querySelector('button[data-modal-target="emailOTPModal"]').addEventListener('click', async (e) => {
        e.preventDefault();
        if (validateStep2()) {
            const email = document.querySelector('#step2 input[type="email"]').value;
            await sendOTP(email);
        }
    });

    // Handle resend OTP click
    document.getElementById('timer-resend').addEventListener('click', async () => {
        if (canResendOTP) {
            const email = document.querySelector('#step2 input[type="email"]').value;
            await sendOTP(email);
        }
    });

    // Function to restart registration process
    window.restartRegistration = function() {
        // Reset all forms
        document.getElementById('step1').classList.remove('hidden');
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('progress-bar').style.width = '50%';
        document.getElementById('step-label').textContent = 'Step 1 of 2';
        
        // Reset all inputs
        document.querySelectorAll('input').forEach(input => input.value = '');
        document.querySelector('#selectedSex').textContent = 'Sex';
        document.querySelector('#selectedMonth').textContent = 'Month';
        document.querySelector('#selectedDay').textContent = 'Day';
        document.querySelector('#selectedYear').textContent = 'Year';
        
        // Hide all modals
        document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
        
        // Reset error states
        hideError();
    };

    // Function to verify OTP
    async function verifyOTP(email, otp) {
        try {
            const response = await fetch('https://betcha-api.onrender.com/otp/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Invalid OTP');
            }

            return true;
        } catch (error) {
            console.error('OTP verification error:', error);
            throw new Error('OTP verification failed. Please try again.');
        }
    }

    // Handle OTP confirmation
    const confirmButton = document.querySelector('button[data-modal-target="confirmModal"]');
    
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
            const email = document.querySelector('#step2 input[type="email"]').value.trim();

            try {
                // Hide any visible modals first
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.add('hidden');
                });

                // Verify OTP first
                await verifyOTP(email, otpValue);
                
                // If OTP is verified, proceed with registration
                const formData = new FormData();
                formData.append('firstname', document.querySelector('#step1 input[placeholder="First name"]').value.trim());
                formData.append('minitial', document.querySelector('#step1 input[placeholder="Middle initial"]').value.trim());
                formData.append('lastname', document.querySelector('#step1 input[placeholder="Last name"]').value.trim());
                formData.append('email', email);
                formData.append('password', document.querySelector('#step2 #password').value);
                formData.append('phoneNumber', document.querySelector('#step2 input[type="tel"]').value.trim());
                
                // Get month number from data-value
                const monthElement = document.querySelector('#selectedMonth');
                const monthValue = monthElement.dataset.value || monthElement.textContent;
                const day = document.querySelector('#selectedDay').textContent;
                const year = document.querySelector('#selectedYear').textContent;
                
                // Format date as YYYY-MM-DD
                const formattedMonth = monthValue.padStart(2, '0');
                const formattedDay = day.padStart(2, '0');
                formData.append('birthday', `${year}-${formattedMonth}-${formattedDay}`);
                
                formData.append('sex', document.querySelector('#selectedSex').textContent);

                // Get profile picture if it exists
                const pfpInput = document.querySelector('input[type="file"]');
                if (pfpInput && pfpInput.files[0]) {
                    formData.append('pfp', pfpInput.files[0]);
                }

                // Try to register user
                const response = await registerUser(formData).catch(error => {
                    // Handle registration error
                    throw new Error(error.message || 'Registration failed. Please try again.');
                });

                // Store the user data for the login/verify buttons
                window.registeredUserData = {
                    firstName: formData.get('firstname'),
                    middleInitial: formData.get('minitial'),
                    lastName: formData.get('lastname'),
                    userId: response.guest._id,
                    email: formData.get('email'),
                    pfplink: response.guest.pfplink || '',
                    verified: response.guest.verified
                };

                // Close the email OTP modal
                const emailOTPModal = document.getElementById('emailOTPModal');
                if (emailOTPModal) {
                    emailOTPModal.classList.add('hidden');
                }

                // Show the success modal with login/verify buttons
                const confirmModal = document.getElementById('confirmModal');
                if (confirmModal) {
                    confirmModal.classList.remove('hidden');
                    document.body.classList.add('modal-open');
                }

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

    // Real-time email validation
    const emailInput = document.querySelector('#step2 input[type="email"]');
    emailInput.addEventListener('input', () => {
        const emailParent = emailInput.closest('.input-style2');
        if (emailInput.value && !emailRegex.test(emailInput.value)) {
            emailParent.classList.add('!border-red-500');
            emailParent.classList.remove('focus-within:!border-primary');
        } else {
            emailParent.classList.remove('!border-red-500');
            emailParent.classList.add('focus-within:!border-primary');
        }
    });

    // Real-time password validation with strength indicator
    const passwordInput = document.querySelector('#step2 #password');
    const confirmPasswordInput = document.querySelector('#step2 #confirmPassword');
    
    passwordInput.addEventListener('input', () => {
        const passwordParent = passwordInput.closest('.input-style2');
        if (passwordInput.value) {
            // Check each password requirement
            const hasUpperCase = /[A-Z]/.test(passwordInput.value);
            const hasLowerCase = /[a-z]/.test(passwordInput.value);
            const hasNumber = /[0-9]/.test(passwordInput.value);
            const hasSpecial = /[@$!%*?&]/.test(passwordInput.value);
            const isLongEnough = passwordInput.value.length >= 8;

            if (!passwordRegex.test(passwordInput.value)) {
                passwordParent.classList.add('!border-red-500');
                passwordParent.classList.remove('focus-within:!border-primary');
                
                // Show specific feedback about what's missing
                let errorMessage = 'Password must contain: ';
                if (!isLongEnough) errorMessage += '8+ characters, ';
                if (!hasUpperCase) errorMessage += 'uppercase, ';
                if (!hasLowerCase) errorMessage += 'lowercase, ';
                if (!hasNumber) errorMessage += 'number, ';
                if (!hasSpecial) errorMessage += 'special character, ';
                
                showError(errorMessage.slice(0, -2)); // Remove last comma and space
            } else {
                passwordParent.classList.remove('!border-red-500');
                passwordParent.classList.add('focus-within:!border-primary');
                hideError();
            }
        }
    });

    // Real-time confirm password validation
    confirmPasswordInput.addEventListener('input', () => {
        const confirmPasswordParent = confirmPasswordInput.closest('.input-style2');
        if (confirmPasswordInput.value) {
            if (confirmPasswordInput.value !== passwordInput.value) {
                confirmPasswordParent.classList.add('!border-red-500');
                confirmPasswordParent.classList.remove('focus-within:!border-primary');
                showError('Passwords do not match');
            } else {
                confirmPasswordParent.classList.remove('!border-red-500');
                confirmPasswordParent.classList.add('focus-within:!border-primary');
                hideError();
            }
        }
    });
});
