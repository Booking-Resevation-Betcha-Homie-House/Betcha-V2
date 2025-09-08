// Logout functionality for admin and employee pages
(function() {
    'use strict';

    // Handle logout button click
    function handleLogoutClick(event) {
        event.preventDefault();
        
        try {
            // Audit: user logout (fire-and-forget)
            try {
                const userId = localStorage.getItem('userId') || '';
                const userType = localStorage.getItem('role') || localStorage.getItem('userType') || '';
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logUserLogout === 'function' && userId) {
                    window.AuditTrailFunctions.logUserLogout(userId, (userType.charAt(0).toUpperCase() + userType.slice(1)) || 'Guest');
                }
            } catch (_) {}

            // Clear all localStorage data
            localStorage.clear();
            console.log('LocalStorage cleared successfully');
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }

        // Redirect to index.html
        // Determine the correct path based on current page location
        const currentPath = window.location.pathname;
        let redirectPath = '/index.html';
        
        if (currentPath.includes('/pages/admin/')) {
            redirectPath = '/index.html';
        } else if (currentPath.includes('/pages/employee/')) {
            redirectPath = '/index.html';
        }
        
        // Use relative path for better compatibility
        window.location.href = redirectPath;
    }

    // Attach logout handlers to all logout buttons
    function attachLogoutHandlers() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && !logoutBtn.dataset.bound) {
            logoutBtn.addEventListener('click', handleLogoutClick);
            logoutBtn.dataset.bound = 'true';
            console.log('Logout handler attached successfully');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachLogoutHandlers);
    } else {
        attachLogoutHandlers();
    }

    // Expose function for manual invocation if needed
    window.attachLogoutHandlers = attachLogoutHandlers;
    window.handleLogoutClick = handleLogoutClick;
})();
