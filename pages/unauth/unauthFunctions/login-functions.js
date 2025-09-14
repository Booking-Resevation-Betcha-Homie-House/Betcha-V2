// Login functionality for Betcha application
const API_BASE_URL = 'https://betcha-api.onrender.com';

// Function to handle user login
async function handleLogin(email, password) {
    // Get button element and store original state outside try block
    const loginButton = document.querySelector('#loginButton');
    const originalText = loginButton.innerHTML;
    const originalDisabled = loginButton.disabled;
    
    try {
        // Show loading state
        loginButton.disabled = true;
        loginButton.innerHTML = `
            <span class="text-secondary-text text-base md:text-lg">
                Logging in...
            </span>
        `;

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Login successful
            console.log('Login successful:', data);
            
            // Save user data to localStorage
            saveUserToLocalStorage(data.user, data.userType);
            
            // Audit: user login
            try {
                const userId = localStorage.getItem('userId') || data.user?._id || '';
                const type = (localStorage.getItem('role') || data.userType || '').toString();
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logUserLogin === 'function' && userId) {
                    window.AuditTrailFunctions.logUserLogin(userId, type.charAt(0).toUpperCase() + type.slice(1));
                }
            } catch (e) {
                console.warn('Audit login failed:', e);
            }
            
            // Show success message
            showMessage(`Login successful! Redirecting to ${data.userType} dashboard...`, 'success');
            
            // Log localStorage data for debugging
            console.log('Saved to localStorage:', {
                firstName: localStorage.getItem('firstName'),
                middleInitial: localStorage.getItem('middleInitial'),
                lastName: localStorage.getItem('lastName'),
                pfplink: localStorage.getItem('pfplink'),
                role: localStorage.getItem('role'),
                userId: localStorage.getItem('userId'),
                email: localStorage.getItem('email'),
                verified: localStorage.getItem('verified'),
                status: localStorage.getItem('status'),
                roleID: localStorage.getItem('roleID'),
                properties: localStorage.getItem('properties')
            });
            
            // Redirect based on user type after 1.5 seconds
            setTimeout(() => {
                redirectUser(data.userType);
            }, 1500);
            
        } else {
            // Login failed
            console.error('Login failed:', data);
            
            // Audit: Log failed login attempt
            try {
                const emailInput = document.querySelector('input[type="email"]');
                const email = emailInput ? emailInput.value.trim() : 'unknown';
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logFailedLogin === 'function') {
                    window.AuditTrailFunctions.logFailedLogin(email, 'Guest');
                }
            } catch (auditError) {
                console.warn('Audit trail for failed login failed:', auditError);
            }
            
            showMessage(data.message || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        // Reset button state - ensure we have the button element
        const loginButton = document.querySelector('#loginButton');
        if (loginButton) {
            loginButton.disabled = originalDisabled;
            // If originalText is somehow undefined, use a fallback
            if (originalText) {
                loginButton.innerHTML = originalText;
            } else {
                // Fallback to default button content
                loginButton.innerHTML = `
                    <span class="text-secondary-text text-base md:text-lg">
                        Log in
                    </span>
                    <span class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out">
                        <svg class="w-5 h-5 ml-2 fill-secondary-text" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.707 6.13598L20.364 11.793C20.5515 11.9805 20.6568 12.2348 20.6568 12.5C20.6568 12.7651 20.5515 13.0194 20.364 13.207L14.707 18.864C14.5184 19.0461 14.2658 19.1469 14.0036 19.1447C13.7414 19.1424 13.4906 19.0372 13.3052 18.8518C13.1198 18.6664 13.0146 18.4156 13.0123 18.1534C13.01 17.8912 13.1108 17.6386 13.293 17.45L17.243 13.5H4C3.73478 13.5 3.48043 13.3946 3.29289 13.2071C3.10536 13.0195 3 12.7652 3 12.5C3 12.2348 3.10536 11.9804 3.29289 11.7929C3.48043 11.6053 3.73478 11.5 4 11.5H17.243L13.293 7.54998C13.1975 7.45773 13.1213 7.34739 13.0689 7.22538C13.0165 7.10338 12.9889 6.97216 12.9877 6.83938C12.9866 6.7066 13.0119 6.57492 13.0622 6.45202C13.1125 6.32913 13.1867 6.21747 13.2806 6.12358C13.3745 6.02969 13.4861 5.95544 13.609 5.90516C13.7319 5.85487 13.8636 5.82957 13.9964 5.83073C14.1292 5.83188 14.2604 5.85947 14.3824 5.91188C14.5044 5.96428 14.6148 6.04047 14.707 6.13598Z"/>
                        </svg>
                    </span>
                `;
            }
        }
    }
}

// Function to save user data to localStorage
function saveUserToLocalStorage(user, userType) {
    localStorage.setItem('firstName', user.firstname || '');
    localStorage.setItem('middleInitial', user.minitial || '');
    localStorage.setItem('lastName', user.lastname || '');
    localStorage.setItem('pfplink', user.pfplink || '');
    localStorage.setItem('role', userType || '');
    localStorage.setItem('userId', user._id || '');
    localStorage.setItem('email', user.email || '');
    localStorage.setItem('verified', user.verified || false);
    localStorage.setItem('status', user.status || '');
    
    // For employees, save the roleID from the role array
    if (userType === 'employee' && user.role && user.role.length > 0) {
        localStorage.setItem('roleID', user.role[0]);
    }
    
    // Save properties if they exist (for employees)
    if (user.properties && user.properties.length > 0) {
        localStorage.setItem('properties', JSON.stringify(user.properties));
    }
}

// Function to redirect user based on their type
function redirectUser(userType) {
    console.log(`Redirecting user with type: ${userType}`);
    
    switch (userType) {
        case 'admin':
            console.log('Redirecting to admin dashboard');
            window.location.href = '../admin/dashboard.html';
            break;
        case 'employee':
            console.log('Redirecting to employee dashboard');
            window.location.href = '../employee/dashboard.html';
            break;
        case 'guest':
        default:
            console.log('Redirecting to rooms page');
            window.location.href = 'rooms.html';
            break;
    }
}

// Function to show messages to user
function showMessage(message, type = 'info') {
    // Remove existing message if any
    const existingMessage = document.querySelector('.login-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `login-message fixed top-4 right-4 p-4 rounded-lg z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (messageDiv) {
            messageDiv.remove();
        }
    }, 3000);
}

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to validate form inputs
function validateLoginForm(email, password) {
    if (!email || !password) {
        showMessage('Please fill in all fields.', 'error');
        return false;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return false;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return false;
    }

    return true;
}

// Initialize login functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('logInForm');
    
    if (loginForm) {
        // Check for auto-filled values on page load
        setTimeout(() => {
            const emailInput = loginForm.querySelector('#email');
            const passwordInput = loginForm.querySelector('#password');
            if (emailInput && emailInput.value) {
                // Trigger input event to handle auto-filled values
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (passwordInput && passwordInput.value) {
                // Trigger input event to handle auto-filled values
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, 100);
        
        // Handle form submission
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            e.preventDefault();
            
            const emailInput = loginForm.querySelector('#email');
            const passwordInput = loginForm.querySelector('#password');
            
            if (!emailInput || !passwordInput) {
                showMessage('Form inputs not found.', 'error');
                return;
            }
            
            // Trigger input events to ensure auto-filled values are recognized
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            if (validateLoginForm(email, password)) {
                handleLogin(email, password);
            }
        });

        // Add Enter key support for inputs
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    loginForm.dispatchEvent(new Event('submit'));
                }
            });
        });
    } else {
        console.error('Login form or button not found');
    }
});
