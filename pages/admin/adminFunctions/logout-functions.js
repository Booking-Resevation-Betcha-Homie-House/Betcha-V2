
(function() {
    function handleLogoutClick(event) {
        event.preventDefault();
        try {
            localStorage.clear();
        } catch (_) {}

        window.location.href = '../../index.html';
    }

    function attachLogoutHandlers() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && !logoutBtn.dataset.bound) {
            logoutBtn.addEventListener('click', handleLogoutClick);
            logoutBtn.dataset.bound = 'true';
        }
    }

    window.attachLogoutHandlers = attachLogoutHandlers;

    document.addEventListener('DOMContentLoaded', attachLogoutHandlers);
})();

