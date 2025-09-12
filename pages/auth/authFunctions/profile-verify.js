'use strict';

(function initVerifyPasswordFlow() {
    const API_BASE_URL = 'https://betcha-api.onrender.com';

    document.addEventListener('DOMContentLoaded', () => {
        const confirmBtn = document.getElementById('confirmVerifyBtn');
        const modal = document.getElementById('verifyUserModal');
        if (confirmBtn && modal) {
            confirmBtn.addEventListener('click', onConfirmClicked);
        }
    });

    async function onConfirmClicked() {
        const passwordInput = document.getElementById('password');
        const password = passwordInput ? String(passwordInput.value) : '';
        if (!password) {
            alert('Please enter your password.');
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Missing user session. Please log in again.');
            return;
        }

        try {

            const email = localStorage.getItem('email');
            if (!email) {
                alert('Missing email in session. Please log in again.');
                return;
            }

            const resp = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (resp.ok) {
                window.location.href = 'reset-email.html';
                return;
            }

            alert('Incorrect password.');
        } catch (error) {
            console.error('Verification failed:', error);
            alert('Verification failed. Please try again.');
        }
    }
})();

