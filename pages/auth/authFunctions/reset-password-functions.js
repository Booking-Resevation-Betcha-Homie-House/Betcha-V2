// Import toast notifications
import { showToastError, showToastSuccess } from '/src/toastNotification.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPassForm');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');

    if (!form || !passwordInput || !confirmInput) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = localStorage.getItem('email');
        const password = (passwordInput.value || '').trim();
        const confirmPassword = (confirmInput.value || '').trim();

        if (!email) {
            showToastError('Session Error', 'No email found in session. Please log in again.');
            return;
        }

        if (!password || !confirmPassword) {
            showToastError('Missing Fields', 'Please enter and confirm your new password.');
            return;
        }

        // Password validation regex: at least 8 chars, 1 uppercase, 1 lowercase, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(.{8,})$/;
        
        if (!passwordRegex.test(password)) {
            showToastError('Invalid Password', 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 special character.');
            return;
        }

        if (password !== confirmPassword) {
            showToastError('Password Mismatch', 'Passwords do not match.');
            return;
        }

        try {
            const button = form.querySelector('button[type="submit"]');
            if (button) button.disabled = true;

            const resp = await fetch('https://betcha-api.onrender.com/auth/update-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword: password })
            });

            if (!resp.ok) {
                const text = await resp.text().catch(() => '');
                throw new Error(text || `Request failed with status ${resp.status}`);
            }

            showToastSuccess('Success', 'Password updated successfully.');
            
            // Audit: Log password reset
            try {
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPasswordReset === 'function') {
                    window.AuditTrailFunctions.logPasswordReset(email, 'Guest');
                }
            } catch (auditError) {
                console.warn('Audit trail for password reset failed:', auditError);
            }
            
            window.location.replace('/pages/unauth/login.html');
        } catch (err) {
            console.error('Failed to update password:', err);
            showToastError('Update Failed', `Failed to update password. ${err?.message || ''}`.trim());
        } finally {
            const button = form.querySelector('button[type="submit"]');
            if (button) button.disabled = false;
        }
    });
});


