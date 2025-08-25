// Handles logout across admin pages
(function() {
    function handleLogoutClick(event) {
        event.preventDefault();
        try {
            localStorage.clear();
        } catch (_) {}
        // From pages/admin/* to project root index.html
        window.location.href = '../../index.html';
    }

    function attachLogoutHandlers() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && !logoutBtn.dataset.bound) {
            logoutBtn.addEventListener('click', handleLogoutClick);
            logoutBtn.dataset.bound = 'true';
        }
    }

    // Expose for manual invocation if needed
    window.attachLogoutHandlers = attachLogoutHandlers;

    // Auto-init
    document.addEventListener('DOMContentLoaded', attachLogoutHandlers);
})();


