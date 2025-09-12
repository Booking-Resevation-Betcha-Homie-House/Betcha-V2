
(function() {
    'use strict';

    function handleLogoutClick(event) {
        event.preventDefault();
        
        try {
            
            try {
                const userId = localStorage.getItem('userId') || '';
                const userType = localStorage.getItem('role') || localStorage.getItem('userType') || '';
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logUserLogout === 'function' && userId) {
                    window.AuditTrailFunctions.logUserLogout(userId, (userType.charAt(0).toUpperCase() + userType.slice(1)) || 'Guest');
                }
            } catch (_) {}

            localStorage.clear();
            console.log('LocalStorage cleared successfully');
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }

        const currentPath = window.location.pathname;
        let redirectPath = '/index.html';
        
        if (currentPath.includes('/pages/admin/')) {
            redirectPath = '/index.html';
        } else if (currentPath.includes('/pages/employee/')) {
            redirectPath = '/index.html';
        }

        window.location.href = redirectPath;
    }

    function attachLogoutHandlers() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && !logoutBtn.dataset.bound) {
            logoutBtn.addEventListener('click', handleLogoutClick);
            logoutBtn.dataset.bound = 'true';
            console.log('Logout handler attached successfully');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachLogoutHandlers);
    } else {
        attachLogoutHandlers();
    }

    window.attachLogoutHandlers = attachLogoutHandlers;
    window.handleLogoutClick = handleLogoutClick;
})();
