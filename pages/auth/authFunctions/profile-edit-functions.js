'use strict';

(function initGuestProfileEdit() {
    const API_BASE_URL = 'https://betcha-api.onrender.com';

    // Toast notification function
    function showToast(type, title, message) {
        // Check if toast notification system is available
        if (typeof window.showToastSuccess === 'function' && type === 'success') {
            window.showToastSuccess(message, title);
        } else if (typeof window.showToastError === 'function' && type === 'error') {
            window.showToastError(message, title);
        } else if (typeof window.showToastWarning === 'function' && type === 'warning') {
            window.showToastWarning(message, title);
        } else {
            // Fallback to console if toast system is not available
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        populateFields().catch((e) => console.error('Failed to populate edit fields:', e));
        const form = document.getElementById('editProfileForm');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }

        const phoneEl = document.getElementById('phoneInput');
        if (phoneEl) {
            phoneEl.addEventListener('input', () => {
                let v = phoneEl.value.trim();
                // Remove all non-digit characters
                v = v.replace(/\D/g, '');
                
                // Convert +639 or 639 to 09
                if (v.startsWith('639')) {
                    v = '09' + v.substring(3);
                }
                
                // Ensure it starts with 09
                if (v.length > 0 && !v.startsWith('09')) {
                    // If it starts with 9, add 0
                    if (v.startsWith('9')) {
                        v = '0' + v;
                    }
                    // If it doesn't start with 0 or 9, prepend 09
                    else if (!v.startsWith('0')) {
                        v = '09' + v;
                    }
                }
                
                // Limit to 11 digits (09XXXXXXXXX)
                if (v.length > 11) {
                    v = v.substring(0, 11);
                }
                
                phoneEl.value = v;
            });
        }

        // Profile picture upload handler
        const profileUpload = document.getElementById('profileUpload');
        if (profileUpload) {
            profileUpload.addEventListener('change', handleProfilePictureChange);
        }
    });

    async function populateFields() {
        const userId = localStorage.getItem('userId');
        let guest = null;
        if (userId) {
            try {
                const resp = await fetch(`${API_BASE_URL}/guest/display/${userId}`);
                if (resp.ok) guest = await resp.json();
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        }

        const firstName = (guest && guest.firstname) || localStorage.getItem('firstName') || '';
        const middleInitial = (guest && guest.minitial) || localStorage.getItem('middleInitial') || '';
        const lastName = (guest && guest.lastname) || localStorage.getItem('lastName') || '';
        const phoneNumber = (guest && guest.phoneNumber) || '';
        const sex = (guest && guest.sex) || '';
        const pfplink = (guest && guest.pfplink) || localStorage.getItem('pfplink') || '';

        setValue('firstNameInput', firstName);
        setValue('middleInitialInput', middleInitial);
        setValue('lastNameInput', lastName);
        setValue('phoneInput', phoneNumber);

        // Sex dropdown label
        const selectedSex = document.getElementById('selectedSex');
        if (selectedSex && sex) selectedSex.textContent = sex;

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

    async function handleProfilePictureChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Invalid File Type', 'Please select a valid image file.');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'File Too Large', 'Image size should be less than 5MB.');
            return;
        }

        // Preview the image
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarImg = document.getElementById('profileAvatarImg');
            const initialEl = document.getElementById('firstLetterName');
            if (avatarImg && initialEl) {
                avatarImg.src = e.target.result;
                avatarImg.classList.remove('hidden');
                initialEl.classList.add('hidden');
            }
        };
        reader.readAsDataURL(file);

        // Upload the image
        await uploadProfilePicture(file);
    }

    async function uploadProfilePicture(file) {
        const userId = localStorage.getItem('userId') || '685009ff53a090e126b9e2b4';
        
        try {
            const formData = new FormData();
            formData.append('pfp', file);

            const response = await fetch(`${API_BASE_URL}/guest/update/pfp/${userId}`, {
                method: 'PUT',
                body: formData
            });

            if (!response.ok) {
                const errorText = await safeText(response);
                throw new Error(`Upload failed (${response.status}): ${errorText}`);
            }

            const result = await response.json();
            console.log('Profile picture uploaded successfully:', result);

            // Update localStorage if the API returns the new pfplink
            if (result.pfplink) {
                localStorage.setItem('pfplink', result.pfplink);
            }

            showToast('success', 'Profile Picture Updated', 'Your profile picture has been updated successfully!');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showToast('error', 'Upload Failed', 'Failed to upload profile picture. Please try again.');
            
            // Revert the preview if upload failed
            const avatarImg = document.getElementById('profileAvatarImg');
            const initialEl = document.getElementById('firstLetterName');
            const pfplink = localStorage.getItem('pfplink') || '';
            
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
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const userId = localStorage.getItem('userId') || '685009ff53a090e126b9e2b4';

        const firstname = getValue('firstNameInput').trim();
        const minitial = getValue('middleInitialInput').trim();
        const lastname = getValue('lastNameInput').trim();
        const phoneNumber = getValue('phoneInput').trim();
        if (phoneNumber && !isValidPhMobile(phoneNumber)) {
            showToast('error', 'Invalid Phone Number', 'Please enter a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).');
            return;
        }
        const sex = getText('selectedSex');

        const payload = {};
        if (firstname) payload.firstname = firstname;
        if (minitial) payload.minitial = minitial;
        if (lastname) payload.lastname = lastname;
        if (phoneNumber) payload.phoneNumber = phoneNumber;
        if (sex && sex !== 'Sex') payload.sex = sex;

        try {
            const resp = await fetch(`${API_BASE_URL}/guest/update/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errText = await safeText(resp);
                showToast('error', 'Update Failed', `Failed to update profile: ${errText || 'Unknown error'}`);
                return;
            }

            // Update localStorage with edited fields
            if (payload.firstname !== undefined) localStorage.setItem('firstName', payload.firstname);
            if (payload.minitial !== undefined) localStorage.setItem('middleInitial', payload.minitial);
            if (payload.lastname !== undefined) localStorage.setItem('lastName', payload.lastname);
            if (payload.phoneNumber !== undefined) localStorage.setItem('phoneNumber', payload.phoneNumber);
            if (payload.sex !== undefined) localStorage.setItem('sex', payload.sex);

            // Audit: profile updated
            try {
                const uid = localStorage.getItem('userId') || '';
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logProfileUpdate === 'function' && uid) {
                    window.AuditTrailFunctions.logProfileUpdate(uid, 'Guest');
                }
            } catch {
                // Ignore audit errors
            }

            // Show success toast and redirect after 2 seconds
            showToast('success', 'Profile Updated', 'Your profile has been updated successfully!');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
        } catch (error) {
            console.error('Error updating guest profile:', error);
            showToast('error', 'Update Failed', 'Failed to update profile. Please try again.');
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

    async function safeText(resp) {
        try { 
            return await resp.text(); 
        } catch (error) { 
            console.error('Failed to read response text:', error);
            return ''; 
        }
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
        } catch (error) {
            console.error('Invalid URL:', error);
            return false;
        }
    }

    function isValidPhMobile(value) {
        return /^(?:\+639|09)\d{9}$/.test(String(value).trim());
    }
})();


