// Populate Guest Profile using GET /guest/display/:id (fallback to localStorage if needed)
(function initGuestProfile() {
    'use strict';

    const API_BASE_URL = 'https://betcha-api.onrender.com';

    document.addEventListener('DOMContentLoaded', () => {
        fetchAndRenderProfile().catch((error) => {
            console.error('Failed to initialize guest profile:', error);
        });
    });

    async function fetchAndRenderProfile() {
        const userId = localStorage.getItem('userId');

        let guest = null;

        if (userId) {
            try {
                const resp = await fetch(`${API_BASE_URL}/guest/display/${userId}`);
                if (resp.ok) {
                    guest = await resp.json();
                } else {
                    console.warn('Guest fetch failed with status:', resp.status);
                }
            } catch (e) {
                console.warn('Network error fetching guest profile, falling back to localStorage.', e);
            }
        } else {
            console.warn('No userId found in localStorage; using localStorage fields only.');
        }

        const firstName = (guest && guest.firstname) || localStorage.getItem('firstName') || '';
        const middleInitial = (guest && guest.minitial) || localStorage.getItem('middleInitial') || '';
        const lastName = (guest && guest.lastname) || localStorage.getItem('lastName') || '';
        const email = (guest && guest.email) || localStorage.getItem('email') || '';
        const sex = (guest && guest.sex) || '';
        const phoneNumber = (guest && guest.phoneNumber) || '';
        const birthday = (guest && guest.birthday) || '';
        const role = localStorage.getItem('role') || 'guest';
        const pfplink = (guest && guest.pfplink) || localStorage.getItem('pfplink') || '';

        const fullName = [firstName, middleInitial, lastName]
            .filter(Boolean)
            .join(' ').trim() || '—';

        const firstLetter = firstName ? firstName.charAt(0).toUpperCase() : (fullName && fullName.charAt(0).toUpperCase()) || 'U';

        setText('firstLetterName', firstLetter);
        setText('userName', fullName);
        setText('userRole', capitalize(role));
        setText('sexValue', sex || '—');
        setText('phoneValue', phoneNumber || '—');
        setText('birthdayValue', formatDate(birthday) || '—');
        setText('emailValue', email || '—');

        // Avatar handling: show image if pfplink exists, else show initial
        const avatarImg = document.getElementById('profileAvatarImg');
        const initialEl = document.getElementById('firstLetterName');
        if (avatarImg && initialEl) {
            if (pfplink && isValidUrl(pfplink)) {
                avatarImg.src = pfplink;
                avatarImg.classList.remove('hidden');
                initialEl.classList.add('hidden');
            } else {
                avatarImg.classList.add('hidden');
                avatarImg.removeAttribute('src');
                initialEl.classList.remove('hidden');
            }
        }
    }

    function setText(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = value;
    }

    function capitalize(value) {
        if (!value) return value;
        const str = String(value);
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDate(value) {
        if (!value) return '';
        try {
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return '';
            return d.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (_) {
            return '';
        }
    }

    function isValidUrl(value) {
        try {
            const u = new URL(value);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
})();


