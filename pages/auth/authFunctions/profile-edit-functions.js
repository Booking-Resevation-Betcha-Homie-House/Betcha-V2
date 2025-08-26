'use strict';

(function initGuestProfileEdit() {
    const API_BASE_URL = 'https://betcha-api.onrender.com';

    document.addEventListener('DOMContentLoaded', () => {
        populateFields().catch((e) => console.error('Failed to populate edit fields:', e));
        const form = document.getElementById('editProfileForm');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }

        const phoneEl = document.getElementById('phoneInput');
        if (phoneEl) {
            phoneEl.addEventListener('input', () => {
                // Remove spaces and disallowed chars; keep leading + if present
                let v = String(phoneEl.value);
                v = v.trim();
                // Keep plus only if it is the first char
                v = v.replace(/(?!^)[+]/g, '');
                // Remove all spaces and hyphens
                v = v.replace(/[\s-]/g, '');
                // If starts with '63' but no '+', convert to '+63'
                if (/^63\d*/.test(v) && !v.startsWith('+')) {
                    v = '+' + v;
                }
                phoneEl.value = v;
            });
        }
    });

    async function populateFields() {
        const userId = localStorage.getItem('userId');
        let guest = null;
        if (userId) {
            try {
                const resp = await fetch(`${API_BASE_URL}/guest/display/${userId}`);
                if (resp.ok) guest = await resp.json();
            } catch (_) {}
        }

        const firstName = (guest && guest.firstname) || localStorage.getItem('firstName') || '';
        const middleInitial = (guest && guest.minitial) || localStorage.getItem('middleInitial') || '';
        const lastName = (guest && guest.lastname) || localStorage.getItem('lastName') || '';
        const phoneNumber = (guest && guest.phoneNumber) || '';
        const sex = (guest && guest.sex) || '';
        const birthday = (guest && guest.birthday) || '';
        const pfplink = (guest && guest.pfplink) || localStorage.getItem('pfplink') || '';

        setValue('firstNameInput', firstName);
        setValue('middleInitialInput', middleInitial);
        setValue('lastNameInput', lastName);
        setValue('phoneInput', phoneNumber);

        // Sex dropdown label
        const selectedSex = document.getElementById('selectedSex');
        if (selectedSex && sex) selectedSex.textContent = sex;

        // Birthday dropdown labels
        if (birthday) {
            const d = new Date(birthday);
            if (!Number.isNaN(d.getTime())) {
                const month = d.toLocaleString(undefined, { month: 'long' });
                const day = String(d.getDate());
                const year = String(d.getFullYear());
                setText('selectedMonth', month);
                setText('selectedDay', day);
                setText('selectedYear', year);
            }
        }

        // Avatar
        const avatarImg = document.getElementById('profileAvatarImg');
        const initialEl = document.getElementById('firstLetterName');
        const initial = firstName ? firstName.charAt(0).toUpperCase() : 'U';
        setText('firstLetterName', initial);
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

    async function handleSubmit(e) {
        e.preventDefault();
        const userId = localStorage.getItem('userId') || '685009ff53a090e126b9e2b4';

        const firstname = getValue('firstNameInput').trim();
        const minitial = getValue('middleInitialInput').trim();
        const lastname = getValue('lastNameInput').trim();
        const phoneNumber = getValue('phoneInput').trim();
        if (phoneNumber && !isValidPhMobile(phoneNumber)) {
            alert('Please enter a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).');
            return;
        }
        const sex = getText('selectedSex');
        const monthLabel = getText('selectedMonth');
        const dayLabel = getText('selectedDay');
        const yearLabel = getText('selectedYear');

        const birthday = buildIsoDate(yearLabel, monthLabel, dayLabel); // yyyy-mm-dd or ''

        const payload = {};
        if (firstname) payload.firstname = firstname;
        if (minitial) payload.minitial = minitial;
        if (lastname) payload.lastname = lastname;
        if (phoneNumber) payload.phoneNumber = phoneNumber;
        if (sex && sex !== 'Sex') payload.sex = sex;
        if (birthday) payload.birthday = birthday;

        try {
            const resp = await fetch(`${API_BASE_URL}/guest/update/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errText = await safeText(resp);
                throw new Error(`Update failed (${resp.status}): ${errText}`);
            }

            // Update localStorage with edited fields
            if (payload.firstname !== undefined) localStorage.setItem('firstName', payload.firstname);
            if (payload.minitial !== undefined) localStorage.setItem('middleInitial', payload.minitial);
            if (payload.lastname !== undefined) localStorage.setItem('lastName', payload.lastname);
            if (payload.phoneNumber !== undefined) localStorage.setItem('phoneNumber', payload.phoneNumber);
            if (payload.sex !== undefined) localStorage.setItem('sex', payload.sex);
            if (payload.birthday !== undefined) localStorage.setItem('birthday', payload.birthday);

            // Redirect back to profile or show success
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error updating guest profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    }

    function getValue(id) {
        const el = document.getElementById(id);
        return el ? el.value || '' : '';
    }

    function getText(id) {
        const el = document.getElementById(id);
        return el ? (el.textContent || '').trim() : '';
    }

    function buildIsoDate(yearLabel, monthLabel, dayLabel) {
        if (!yearLabel || !monthLabel || !dayLabel) return '';
        const monthIndex = monthNameToNumber(monthLabel);
        if (monthIndex === null) return '';
        const monthStr = String(monthIndex).padStart(2, '0');
        const dayStr = String(parseInt(dayLabel, 10)).padStart(2, '0');
        return `${yearLabel}-${monthStr}-${dayStr}`;
    }

    function monthNameToNumber(name) {
        const months = [
            'January','February','March','April','May','June','July','August','September','October','November','December'
        ];
        const idx = months.findIndex(m => m.toLowerCase() === String(name).toLowerCase());
        return idx === -1 ? null : idx + 1;
    }

    async function safeText(resp) {
        try { return await resp.text(); } catch (_) { return ''; }
    }

    function setValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function isValidUrl(value) {
        try {
            const u = new URL(value);
            return u.protocol === 'http:' || u.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    function isValidPhMobile(value) {
        return /^(?:\+639|09)\d{9}$/.test(String(value).trim());
    }
})();


