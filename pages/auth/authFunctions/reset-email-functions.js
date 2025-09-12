'use strict';

(function initResetEmailFlow() {
    const API_BASE_URL = 'https://betcha-api.onrender.com';
    let pendingEmail = '';
    let resendTimerId = null;
    let resendRemaining = 0; 

    document.addEventListener('DOMContentLoaded', () => {
        const openBtn = document.getElementById('openOtpFlowBtn');
        const otpModal = document.getElementById('emailOTPModal');
        const sendBtn = document.getElementById('sendOtpBtn');
        const verifyBtnOld = document.getElementById('verifyOtpBtn');
        const verifyBtn = document.getElementById('verifyOtpConfirmBtn') || verifyBtnOld;
        const newEmailInput = document.getElementById('newEmailInput');
        const resendEl = document.getElementById('timer-resend');

        if (openBtn && otpModal && newEmailInput) {
            openBtn.addEventListener('click', () => {
                const email = String(newEmailInput.value || '').trim();
                if (!isValidEmail(email)) {
                    alert('Please enter a valid email.');
                    return;
                }
                pendingEmail = email;

                otpModal.classList.remove('hidden');

                bindOtpInputs();
                const firstOtp = document.querySelector('#emailOTPModal .otp-input');
                if (firstOtp) firstOtp.focus();

                sendOtp();

                startResendCooldown(60);
            });
        }

        if (sendBtn) sendBtn.addEventListener('click', sendOtp);
        if (verifyBtn) verifyBtn.addEventListener('click', verifyOtpAndUpdateEmail);

        if (resendEl) {
            resendEl.addEventListener('click', async () => {
                if (resendRemaining > 0) return; 
                await sendOtp();
                startResendCooldown(60);
            });
        }
    });

    async function sendOtp() {
        try {
            const targetEmail = pendingEmail || '';
            if (!isValidEmail(targetEmail)) {
                alert('Missing or invalid new email.');
                return;
            }
            console.log('[OTP] Sending OTP to new email:', targetEmail);
            const resp = await fetch(`${API_BASE_URL}/otp/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: targetEmail })
            });
            if (!resp.ok) {
                const t = await safeText(resp);
                throw new Error(`Failed to send OTP: ${resp.status} ${t}`);
            }
            alert('OTP sent. Check your email.');
        } catch (e) {
            console.error(e);
            alert('Failed to send OTP. Please try again.');
        }
    }

    async function verifyOtpAndUpdateEmail() {
        const digits = Array.from(document.querySelectorAll('#emailOTPModal .otp-input'));
        const code = digits.map(i => (i.value || '').trim()).join('');
        if (!/^\d{6}$/.test(code)) {
            alert('Please enter the 6-digit OTP.');
            return;
        }

        try {

            const targetEmail = pendingEmail || '';
            if (!isValidEmail(targetEmail)) {
                alert('Missing or invalid new email.');
                return;
            }
            console.log('[OTP] Verifying OTP for new email:', targetEmail, ' code:', code);
            const verifyResp = await fetch(`${API_BASE_URL}/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: targetEmail, otp: code })
            });
            if (!verifyResp.ok) {
                const t = await safeText(verifyResp);
                throw new Error(`OTP verification failed: ${verifyResp.status} ${t}`);
            }

            const userId = localStorage.getItem('userId') || '685009ff53a090e126b9e2b4';
            console.log('[Email Update] Updating user email for', userId, 'to', pendingEmail);
            const updateResp = await fetch(`${API_BASE_URL}/guest/update/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail })
            });
            if (!updateResp.ok) {
                const t = await safeText(updateResp);
                throw new Error(`Failed to update email: ${updateResp.status} ${t}`);
            }

            localStorage.setItem('email', pendingEmail);
            window.location.href = 'profile.html';
        } catch (e) {
            console.error(e);
            alert('Failed to verify or update email. Please try again.');
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async function safeText(resp) {
        try { return await resp.text(); } catch (_) { return ''; }
    }

    function startResendCooldown(seconds) {
        clearIntervalSafe();
        resendRemaining = seconds;
        renderResend();
        resendTimerId = setInterval(() => {
            resendRemaining -= 1;
            if (resendRemaining <= 0) {
                clearIntervalSafe();
            }
            renderResend();
        }, 1000);
    }

    function renderResend() {
        const el = document.getElementById('timer-resend');
        if (!el) return;
        if (resendRemaining > 0) {
            el.textContent = `Resend in ${resendRemaining}s`;
            el.classList.remove('text-primary');
            el.classList.add('text-muted');
            el.style.pointerEvents = 'none';
        } else {
            el.textContent = 'Resend';
            el.classList.add('text-primary');
            el.classList.remove('text-muted');
            el.style.pointerEvents = 'auto';
        }
    }

    function clearIntervalSafe() {
        if (resendTimerId) {
            clearInterval(resendTimerId);
            resendTimerId = null;
        }
    }

    function bindOtpInputs() {
        const inputs = Array.from(document.querySelectorAll('#emailOTPModal .otp-input'));
        if (inputs.length === 0) return;

        inputs.forEach((input, idx) => {
            input.setAttribute('inputmode', 'numeric');
            input.setAttribute('maxlength', '1');
            input.addEventListener('input', () => {

                input.value = (input.value || '').replace(/\D/g, '').slice(-1);
                if (input.value && idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && idx > 0) {
                    inputs[idx - 1].focus();
                }
            });
            input.addEventListener('paste', (e) => {
                const text = (e.clipboardData || window.clipboardData).getData('text') || '';
                const digits = text.replace(/\D/g, '').slice(0, inputs.length);
                if (digits.length > 1) {
                    e.preventDefault();
                    inputs.forEach((el, i) => {
                        el.value = digits[i] || '';
                    });
                    const lastIndex = Math.min(digits.length, inputs.length) - 1;
                    if (lastIndex >= 0) inputs[lastIndex].focus();
                }
            });
        });
    }
})();

