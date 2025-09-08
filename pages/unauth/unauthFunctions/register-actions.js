// Function to save user data to localStorage
function saveUserToLocalStorage(userData) {
    localStorage.setItem('firstName', userData.firstName);
    localStorage.setItem('middleInitial', userData.middleInitial);
    localStorage.setItem('lastName', userData.lastName);
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('email', userData.email);
    localStorage.setItem('pfplink', userData.pfplink);
    localStorage.setItem('verified', userData.verified);
}

// Function to handle login button click
function handleLoginButton(userData) {
    saveUserToLocalStorage(userData);
    // Audit: user registered (logged in right after registration flow)
    try {
        const uid = userData.userId || localStorage.getItem('userId') || '';
        if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logUserRegistration === 'function' && uid) {
            const role = (localStorage.getItem('role') || 'Guest');
            window.AuditTrailFunctions.logUserRegistration(uid, role.charAt(0).toUpperCase() + role.slice(1));
        }
    } catch (_) {}
    window.location.href = '/pages/unauth/rooms.html';
}

// Function to handle verify button click
async function handleVerifyButton(userData) {
    // Open Sumsub verification in a new tab
    window.open('https://in.sumsub.com/websdk/p/sbx_uni_5lWlhioi8FNABcxg', '_blank');

    try {
        // Update the verified status via API
        const response = await fetch('https://betcha-api.onrender.com/guest/update/' + userData.userId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                verified: true
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update verification status');
        }

        // Update the verified status in the userData
        userData.verified = true;
        
        // Save to localStorage and redirect
        saveUserToLocalStorage(userData);
        // Audit: user registration verified
        try {
            const uid = userData.userId || localStorage.getItem('userId') || '';
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logUserRegistration === 'function' && uid) {
                const role = (localStorage.getItem('role') || 'Guest');
                window.AuditTrailFunctions.logUserRegistration(uid, role.charAt(0).toUpperCase() + role.slice(1));
            }
        } catch (_) {}
        window.location.href = '/pages/unauth/rooms.html';
    } catch (error) {
        console.error('Error updating verification status:', error);
    }
}

// Initialize event listeners when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    const verifyButton = document.getElementById('verifyButton');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            // Get the user data from wherever it's available in your registration flow
            const userData = window.registeredUserData; // You'll need to set this during registration
            if (userData) {
                handleLoginButton(userData);
            } else {
                console.error('User data not available');
            }
        });
    }

    if (verifyButton) {
        verifyButton.addEventListener('click', () => {
            const userData = window.registeredUserData; // You'll need to set this during registration
            if (userData) {
                handleVerifyButton(userData);
            } else {
                console.error('User data not available');
            }
        });
    }
});
