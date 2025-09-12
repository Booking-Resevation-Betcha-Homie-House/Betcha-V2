
(function initAdminProfile() {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const nameEl = document.getElementById('profileName');
            const roleHeaderEl = document.getElementById('profileRole');
            const emailEl = document.getElementById('profileEmail');
            const roleDetailEl = document.getElementById('detailRole');
            const avatarEl = document.getElementById('profileAvatar');

            const userId = localStorage.getItem('userId');
            let data = null;
            if (userId) {
                try {
                    const resp = await fetch(`https://betcha-api.onrender.com/admin/display/${userId}`);
                    if (resp.ok) data = await resp.json();
                } catch (e) {

                }
            }

            const firstName = (data && data.firstname) || localStorage.getItem('firstName') || '';
            const middleInitial = (data && data.minitial) || localStorage.getItem('middleInitial') || '';
            const lastName = (data && data.lastname) || localStorage.getItem('lastName') || '';
            const email = (data && data.email) || localStorage.getItem('email') || '';
            const userType = (data && data.userType) || localStorage.getItem('role') || '';
            const pfplink = (data && data.pfplink) || localStorage.getItem('pfplink') || '';

            const fullName = [firstName, middleInitial, lastName]
                .filter(Boolean)
                .join(' ').trim() || '—';

            if (nameEl) nameEl.textContent = fullName;
            if (emailEl) emailEl.textContent = email || '—';

            const roleLabel = userType ? capitalize(userType) : '—';
            if (roleHeaderEl) roleHeaderEl.textContent = roleLabel;
            if (roleDetailEl) roleDetailEl.textContent = roleLabel;

            if (avatarEl && pfplink) {
                avatarEl.style.backgroundImage = `url("${pfplink}")`;
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.style.backgroundPosition = 'center';
                const svg = avatarEl.querySelector('svg');
                if (svg) svg.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to populate admin profile:', error);
        }
    });

    function capitalize(value) {
        if (!value) return value;
        return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    }
})();

