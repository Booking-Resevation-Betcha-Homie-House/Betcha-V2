
function saveUserToLocalStorage(userData) {
    localStorage.setItem('firstName', userData.firstName);
    localStorage.setItem('middleInitial', userData.middleInitial);
    localStorage.setItem('lastName', userData.lastName);
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('email', userData.email);
    localStorage.setItem('pfplink', userData.pfplink);
    localStorage.setItem('verified', userData.verified);
}

function handleLoginButton(userData) {
    saveUserToLocalStorage(userData);

    try {
        const uid = userData.userId || localStorage.getItem('userId') || '';
        if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logUserRegistration === 'function' && uid) {
            const role = (localStorage.getItem('role') || 'Guest');
            window.AuditTrailFunctions.logUserRegistration(uid, role.charAt(0).toUpperCase() + role.slice(1));
        }
    } catch (_) {}
    window.location.href = '/pages/unauth/rooms.html';
}

async function handleVerifyButton(userData) {

    window.open('https://in.sumsub.com/websdk/p/sbx_uni_5lWlhioi8FNABcxg', '_blank');

    try {

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

        userData.verified = true;

        saveUserToLocalStorage(userData);

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

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    const verifyButton = document.getElementById('verifyButton');

    if (loginButton) {
        loginButton.addEventListener('click', () => {

            const userData = window.registeredUserData; 
            if (userData) {
                handleLoginButton(userData);
            } else {
                console.error('User data not available');
            }
        });
    }

    if (verifyButton) {
        verifyButton.addEventListener('click', () => {
            const userData = window.registeredUserData; 
            if (userData) {
                handleVerifyButton(userData);
            } else {
                console.error('User data not available');
            }
        });
    }
});
