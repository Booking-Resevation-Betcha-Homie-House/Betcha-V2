// Login functionality for Betcha application
const API_BASE_URL = 'https://betcha-api.onrender.com';

// Function to handle user login
async function handleLogin(email, password) {
    try {
        // Show loading state
        const loginButton = document.querySelector('#loginButton');
        const originalText = loginButton.innerHTML;
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
            showMessage(data.message || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        // Reset button state
        const loginButton = document.querySelector('#loginButton');
        loginButton.disabled = false;
        loginButton.innerHTML = originalText;
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
