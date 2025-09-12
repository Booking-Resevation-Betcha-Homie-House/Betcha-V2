document.addEventListener('DOMContentLoaded', () => {
    try {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            window.location.replace('/pages/unauth/login.html');
            return;
        }

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
                alert('No email found in session. Please log in again.');
                return;
            }

            if (!password || !confirmPassword) {
                alert('Please enter and confirm your new password.');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
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

                alert('Password updated successfully.');
                window.location.replace('/pages/admin/dashboard.html');
            } catch (err) {
                console.error('Failed to update password:', err);
                alert(`Failed to update password. ${err?.message || ''}`.trim());
            } finally {
                const button = form.querySelector('button[type="submit"]');
                if (button) button.disabled = false;
            }
        });
    } catch (err) {
        console.error('Initialization error:', err);
    }
});

