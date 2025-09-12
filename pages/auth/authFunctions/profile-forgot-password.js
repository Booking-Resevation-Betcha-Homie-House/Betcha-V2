'use strict';

(function initProfileForgotPasswordModal() {
    let pendingEmail = '';
    let resendTimer = null;
    let closeDelegationBound = false;

    document.addEventListener('DOMContentLoaded', () => {
        console.log('[DEBUG] DOM Content Loaded');
        injectModalsIfNeeded();

        setTimeout(() => {
            setupEventListeners();
        }, 200);
    });

    function setupEventListeners() {
        console.log('[DEBUG] Setting up event listeners...');
        
        const trigger = document.getElementById('openForgotPass');
        const modal = document.getElementById('forgotPassModal');
        const confirmBtn = document.getElementById('forgotPassConfirmBtn');
        const verifyBtn = document.getElementById('verifyOtpConfirmBtn');
        const resendLink = document.getElementById('timer-resend-otp');

        console.log('[DEBUG] Elements found:', {
            trigger: !!trigger,
            modal: !!modal,
            confirmBtn: !!confirmBtn,
            verifyBtn: !!verifyBtn,
            resendLink: !!resendLink
        });

        if (trigger && modal) {
            trigger.addEventListener('click', () => {
                console.log('[DEBUG] Forgot password trigger clicked');
                modal.classList.remove('hidden');
                const emailInput = document.getElementById('forgotEmailInput');
                const storedEmail = localStorage.getItem('email') || '';
                if (emailInput && storedEmail) emailInput.value = storedEmail;
            });
        }

        if (confirmBtn) {
            console.log('[DEBUG] Adding click listener to confirm button');
            confirmBtn.addEventListener('click', handleForgotPasswordConfirm);
        } else {
            console.error('[DEBUG] Confirm button not found!');
        }

        if (verifyBtn) {
            verifyBtn.addEventListener('click', verifyOtpAndRedirect);
        }

        if (resendLink) {
            resendLink.addEventListener('click', handleResendOtp);
        }
    }

    function handleForgotPasswordConfirm() {
        console.log('[DEBUG] handleForgotPasswordConfirm called');
        
        const emailInput = document.getElementById('forgotEmailInput');
        const email = emailInput?.value?.trim();
        
        console.log('[DEBUG] Email input value:', email);
        
        if (!email) {
            alert('Please enter your email address');
            return;
        }

        if (!isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        pendingEmail = email;
        console.log('[DEBUG] Pending email set to:', pendingEmail);

        console.log('[DEBUG] Calling sendOtp()');
        sendOtp().then((sentOk) => {
            const forgotModal = document.getElementById('forgotPassModal');
            const otpModal = document.getElementById('emailOTPModal');

            console.log('[DEBUG] sendOtp result:', sentOk);

            if (sentOk) {
                if (forgotModal) {
                    console.log('[DEBUG] Hiding forgot password modal');
                    forgotModal.classList.add('hidden');
                }
                if (otpModal) {
                    console.log('[DEBUG] Showing OTP modal');
                    otpModal.classList.remove('hidden');
                    const firstOtpInput = otpModal.querySelector('.otp-input');
                    if (firstOtpInput) firstOtpInput.focus();
                }
            } else {

                if (forgotModal) forgotModal.classList.remove('hidden');
                const emailInput = document.getElementById('forgotEmailInput');
                if (emailInput) emailInput.focus();
            }
        });
    }

    function sendOtp() {
        console.log('[OTP] Sending OTP to email:', pendingEmail);
        
        return fetch('https://betcha-api.onrender.com/otp/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: pendingEmail })
        })
        .then(async (response) => {
            const data = await response.json().catch(() => ({}));
            console.log('[OTP] Send response:', { status: response.status, data });
            if (response.ok) {
                startResendTimer();
                return true;
            }
            const msg = (data && (data.message || data.status || '')) + '';
            if (/email\s*not\s*found/i.test(msg)) {
                alert('Email not found. Please check the address and try again.');
            } else {
                alert('Failed to send OTP. Please try again.');
            }
            return false;
        })
        .catch(error => {
            console.error('[OTP] Send error:', error);
            alert('Failed to send OTP. Please try again.');
            return false;
        });
    }

    function verifyOtpAndRedirect() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const code = Array.from(otpInputs).map(input => input.value).join('');
        
        if (code.length !== 6) {
            alert('Please enter the complete 6-digit code');
            return;
        }

        console.log('[OTP] Verifying OTP for email:', pendingEmail, 'code:', code);

        fetch('https://betcha-api.onrender.com/otp/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: pendingEmail, 
                otp: code 
            })
        })
        .then(async response => {
            const data = await response.json().catch(() => ({}));
            console.log('[OTP] Verify response:', { status: response.status, data });

            const message = (data && (data.message || data.status || '')) + '';
            const isVerified = response.ok || data.success === true || /verified|success|good/i.test(message);

            if (isVerified) {
                const otpModal = document.getElementById('emailOTPModal');
                if (otpModal) otpModal.classList.add('hidden');
                window.location.href = 'reset-password.html';
                return;
            }

            alert('Invalid OTP. Please try again.');
        })
        .catch(error => {
            console.error('[OTP] Verify error:', error);
            alert('Failed to verify OTP. Please try again.');
        });
    }

    function handleResendOtp() {
        const resendLink = document.getElementById('timer-resend-otp');
        if (resendLink && resendLink.classList.contains('disabled')) {
            return; 
        }
        
        sendOtp();
    }

    function startResendTimer() {
        const resendLink = document.getElementById('timer-resend-otp');
        if (!resendLink) return;

        let timeLeft = 60;
        resendLink.classList.add('disabled');
        resendLink.style.pointerEvents = 'none';
        resendLink.style.color = '#9CA3AF';

        const updateTimer = () => {
            resendLink.textContent = `Resend (${timeLeft}s)`;
            timeLeft--;

            if (timeLeft < 0) {
                resendLink.textContent = 'Resend';
                resendLink.classList.remove('disabled');
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.color = '';
                clearInterval(resendTimer);
                resendTimer = null;
            }
        };

        updateTimer();
        resendTimer = setInterval(updateTimer, 1000);
    }

    function bindOtpInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        
        otpInputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });

            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                if (value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }

                if (value.length === 6) {
                    const digits = value.split('');
                    otpInputs.forEach((input, i) => {
                        if (digits[i]) input.value = digits[i];
                    });
                    otpInputs[5].focus();
                }
            });
        });
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function injectModalsIfNeeded() {
        console.log('[DEBUG] Checking if modals need to be injected...');
        
        if (document.getElementById('forgotPassModal')) {
            console.log('[DEBUG] Forgot password modal already exists');
            return;
        }

        console.log('[DEBUG] Injecting modals...');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
        <div id="forgotPassModal" class="modal fixed inset-0 bg-black/50 bg-opacity-50 flex items-end sm:items-center justify-center hidden z-50">
          <div class="w-full sm:w-fit bg-background p-6 rounded-t-3xl sm:rounded-3xl modal-animate">
            <div class="flex justify-end w-full">
              <button data-close-modal class="btn-close group">
                <span>
                  <svg class="h-5 w-5 fill-muted group-hover:fill-primary-text transition-all duration-500 ease-in-out" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 14.1221L17.303 19.4251C17.5844 19.7065 17.966 19.8646 18.364 19.8646C18.7619 19.8646 19.1436 19.7065 19.425 19.4251C19.7064 19.1437 19.8645 18.7621 19.8645 18.3641C19.8645 17.9662 19.7064 17.5845 19.425 17.3031L14.12 12.0001L19.424 6.69711C19.5632 6.55778 19.6737 6.39238 19.749 6.21036C19.8244 6.02834 19.8631 5.83326 19.8631 5.63626C19.8631 5.43926 19.8242 5.2442 19.7488 5.06221C19.6733 4.88022 19.5628 4.71488 19.4235 4.57561C19.2841 4.43634 19.1187 4.32588 18.9367 4.25054C18.7547 4.17519 18.5596 4.13644 18.3626 4.13648C18.1656 4.13653 17.9706 4.17538 17.7886 4.25081C17.6066 4.32624 17.4412 4.43678 17.302 4.57611L12 9.87911L6.69697 4.57611C6.55867 4.43278 6.3932 4.31843 6.21024 4.23973C6.02727 4.16103 5.83046 4.11956 5.63129 4.11774C5.43212 4.11591 5.23459 4.15377 5.05021 4.22911C4.86583 4.30444 4.6983 4.41574 4.55739 4.55652C4.41649 4.69729 4.30503 4.86471 4.22952 5.04902C4.15401 5.23333 4.11597 5.43083 4.1176 5.63C4.11924 5.82917 4.16053 6.02602 4.23905 6.20906C4.31758 6.3921 4.43177 6.55767 4.57497 6.69611L9.87997 12.0001L4.57597 17.3041C4.43277 17.4425 4.31858 17.6081 4.24005 17.7912C4.16153 17.9742 4.12024 18.1711 4.1186 18.3702C4.11697 18.5694 4.15501 18.7669 4.23052 18.9512C4.30603 19.1355 4.41749 19.3029 4.55839 19.4437C4.6993 19.5845 4.86683 19.6958 5.05121 19.7711C5.23559 19.8464 5.43312 19.8843 5.63229 19.8825C5.83146 19.8807 6.02827 19.8392 6.21124 19.7605C6.3942 19.6818 6.55967 19.5674 6.69797 19.4241L12 14.1221Z"/>
                  </svg>
                </span>
              </button>
            </div>
            <form id="forgotPassForm" class="flex flex-col items-center gap-5 mt-10">
              <p class="font-manrope text-primary-text font-bold text-2xl">Forgot password</p>
              <p class="font-roboto text-muted text-xs md:text-sm">Enter your email address and we'll email you a code to reset your account</p>
              <div class="input-style2 w-full flex items-center justify-center gap-3 group">
                <svg class="w-5 h-5 stroke-muted transition-colors duration-200 group-focus-within:stroke-primary" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4546 2.33325H4.45463C2.98187 2.33325 1.78796 3.52716 1.78796 4.99992V10.9999C1.78796 12.4727 2.98187 13.6666 4.45463 13.6666H11.4546C12.9274 13.6666 14.1213 12.4727 14.1213 10.9999V4.99992C14.1213 3.52716 12.9274 2.33325 11.4546 2.33325Z" stroke-width="1.5"/><path d="M1.81934 5.05981L6.62267 7.81315C7.02519 8.04672 7.48229 8.16974 7.94767 8.16974C8.41305 8.16974 8.87015 8.04672 9.27267 7.81315L14.0893 5.05981" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <input id="forgotEmailInput" type="email" placeholder="Email Address" class="flex-1 bg-transparent focus:outline-none text-sm md:text-base font-normal" />
              </div>
              <p class="text-xs md:text-sm text-muted font-roboto">We'll send a code to your email.</p>
              <button type="button" id="forgotPassConfirmBtn" class="group relative w-full btn rounded-full bg-primary px-6 py-3 flex items-center justify-center overflow-hidden  transition-all duration-300 ease-in-out hover:cursor-pointer">
                <span class="text-secondary-text text-base  group-hover:-translate-x-1 transition-transform duration-500 ease-in-out md:text-lg">Confirm</span>
                <span class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out"><svg class="w-5 h-5 ml-2 fill-secondary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.55006 15.15L18.0251 6.675C18.2251 6.475 18.4584 6.375 18.7251 6.375C18.9917 6.375 19.2251 6.475 19.4251 6.675C19.6251 6.875 19.7251 7.11267 19.7251 7.388C19.7251 7.66333 19.6251 7.90067 19.4251 8.1L10.2501 17.3C10.0501 17.5 9.81673 17.6 9.55006 17.6C9.28339 17.6 9.05006 17.5 8.85006 17.3L4.55006 13C4.35006 12.8 4.25406 12.5627 4.26206 12.288C4.27006 12.0133 4.37439 11.7757 4.57506 11.575C4.77572 11.3743 5.01339 11.2743 5.28806 11.275C5.56272 11.2757 5.80006 11.3757 6.00006 11.575L9.55006 15.15Z"/></svg></span>
              </button>
            </form>
          </div>
        </div>

        <!-- Email OTP Modal (copied from reset-email.html) -->
        <div id="emailOTPModal" class="modal fixed inset-0 bg-black/50 bg-opacity-50 flex items-end md:items-center justify-center hidden z-50">
          <div class="bg-background w-[500px] rounded-t-3xl overflow-hidden modal-animate md:rounded-3xl">
            <div class="w-full p-5 sticky top-0 z-10 bg-background flex justify-end">
              <button data-close-modal class="cursor-pointer btn-round border-none  hover:bg-neutral-300 flex items-center justify-center active:scale-95">
                <span>
                  <svg class="h-5 w-auto fill-primary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 14.1221L17.303 19.4251C17.5844 19.7065 17.966 19.8646 18.364 19.8646C18.7619 19.8646 19.1436 19.7065 19.425 19.4251C19.7064 19.1437 19.8645 18.7621 19.8645 18.3641C19.8645 17.9662 19.7064 17.5845 19.425 17.3031L14.12 12.0001L19.424 6.69711C19.5632 6.55778 19.6737 6.39238 19.749 6.21036C19.8244 6.02834 19.8631 5.83326 19.8631 5.63626C19.8631 5.43926 19.8242 5.2442 19.7488 5.06221C19.6733 4.88022 19.5628 4.71488 19.4235 4.57561C19.2841 4.43634 19.1187 4.32588 18.9367 4.25054C18.7547 4.17519 18.5596 4.13644 18.3626 4.13648C18.1656 4.13653 17.9706 4.17538 17.7886 4.25081C17.6066 4.32624 17.4412 4.43678 17.302 4.57611L12 9.87911L6.69697 4.57611C6.55867 4.43278 6.3932 4.31843 6.21024 4.23973C6.02727 4.16103 5.83046 4.11956 5.63129 4.11774C5.43212 4.11591 5.23459 4.15377 5.05021 4.22911C4.86583 4.30444 4.6983 4.41574 4.55739 4.55652C4.41649 4.69729 4.30503 4.86471 4.22952 5.04902C4.15401 5.23333 4.11597 5.43083 4.1176 5.63C4.11924 5.82917 4.16053 6.02602 4.23905 6.20906C4.31758 6.3921 4.43177 6.55767 4.57497 6.69611L9.87997 12.0001L4.57597 17.3041C4.43277 17.4425 4.31858 17.6081 4.24005 17.7912C4.16153 17.9742 4.12024 18.1711 4.1186 18.3702C4.11697 18.5694 4.15501 18.7669 4.23052 18.9512C4.30603 19.1355 4.41749 19.3029 4.55839 19.4437C4.6993 19.5845 4.86683 19.6958 5.05121 19.7711C5.23559 19.8464 5.43312 19.8843 5.63229 19.8825C5.83146 19.8807 6.02827 19.8392 6.21124 19.7605C6.3942 19.6818 6.55967 19.5674 6.69797 19.4241L12 14.1221Z"/>
                  </svg>
                </span>
              </button>
            </div>
            <div class="flex flex-col items-center gap-5 p-8">
              <p class="font-manrope text-primary-text font-bold text-2xl">Verify your email</p>
              <p class="font-roboto text-muted text-xs md:text-sm">A 6-digit code has been sent to your email.</p>
              <div class="flex gap-2">
                <input type="tel" maxlength="1" class="input-style-digit otp-input" />
                <input type="tel" maxlength="1" class="input-style-digit otp-input" />
                <input type="tel" maxlength="1" class="input-style-digit otp-input" />
                <input type="tel" maxlength="1" class="input-style-digit otp-input" />
                <input type="tel" maxlength="1" class="input-style-digit otp-input" />
                <input type="tel" maxlength="1" class="input-style-digit otp-input" />
              </div>
              <p class="text-xs md:text-sm text-muted font-roboto">Did not receive a code? <span id="timer-resend-otp" class="text-primary font-roboto">Resend</span></p>
              <button type="button" id="verifyOtpConfirmBtn" class="group relative w-full btn rounded-full bg-primary flex items-center justify-center overflow-hidden hover:cursor-pointer active:scale-95 transition-all duration-500 ease-in-out">
                <span class="text-secondary-text text-base group-hover:-translate-x-1 transition-transform duration-500 ease-in-out md:text-lg">Confirm</span>
                <span class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out">
                  <svg class="w-5 h-5 ml-2 fill-secondary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.55006 15.15L18.0251 6.675C18.2251 6.475 18.4584 6.375 18.7251 6.375C18.9917 6.375 19.2251 6.475 19.4251 6.675C19.6251 6.875 19.7251 7.11267 19.7251 7.388C19.7251 7.66333 19.6251 7.90067 19.4251 8.1L10.2501 17.3C10.0501 17.5 9.81673 17.6 9.55006 17.6C9.28339 17.6 9.05006 17.5 8.85006 17.3L4.55006 13C4.35006 12.8 4.25406 12.5627 4.26206 12.288C4.27006 12.0133 4.37439 11.7757 4.57506 11.575C4.77572 11.3743 5.01339 11.2743 5.28806 11.275C5.56272 11.2757 5.80006 11.3757 6.00006 11.575L9.55006 15.15Z"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>`;

        while (wrapper.firstChild) {
            document.body.appendChild(wrapper.firstChild);
        }
        console.log('[DEBUG] Modals injected successfully');

        setTimeout(() => {
            console.log('[DEBUG] Binding OTP inputs...');
            bindOtpInputs();
            bindModalCloseDelegation();
        }, 100);
    }
    
    function bindModalCloseDelegation() {
        if (closeDelegationBound) return;
        closeDelegationBound = true;
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-close-modal]');
            if (!target) return;
            const modal = target.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    }
})();

