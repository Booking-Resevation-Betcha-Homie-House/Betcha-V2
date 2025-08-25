// Populate Admin Profile Edit form from localStorage
(function initAdminProfileEdit() {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const middleInitial = localStorage.getItem('middleInitial') || '';
      const pfplink = localStorage.getItem('pfplink') || '';

      const inputFirstName = document.getElementById('inputFirstName');
      const inputLastName = document.getElementById('inputLastName');
      const inputEmail = document.getElementById('inputEmail');
      const avatarEl = document.getElementById('editProfileAvatar');
      const saveBtn = document.getElementById('saveProfileBtn');
      const confirmSaveBtn = document.getElementById('confirmSaveBtn');
      const inputPfp = document.getElementById('inputPfp');
      const inputPfpMobile = document.getElementById('inputPfpMobile');


      // Do NOT pre-populate text fields; user must type values to change them

      if (avatarEl && pfplink) {
        avatarEl.style.backgroundImage = `url("${pfplink}")`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        const svg = avatarEl.querySelector('svg');
        if (svg) svg.style.display = 'none';
      }

      // Setup PUT call for details
      async function handleSave() {
          try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            const body = {};
            const vFirst = ((inputFirstName && inputFirstName.value) || '').trim();
            const vLast = ((inputLastName && inputLastName.value) || '').trim();
            const vEmail = ((inputEmail && inputEmail.value) || '').trim();
            const vMI = (middleInitial || '').trim();
            if (vFirst) body.firstname = vFirst;
            if (vMI) body.minitial = vMI; // only sent if present in storage
            if (vLast) body.lastname = vLast;
            if (vEmail) body.email = vEmail;

            if (Object.keys(body).length === 0) {
              // Nothing to update; go back to profile view
              window.location.href = `profile.html?id=${encodeURIComponent(userId)}`;
              return;
            }

            const resp = await fetch(`https://betcha-api.onrender.com/admin/update/${userId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(body)
            });

            if (!resp.ok) {
              let errorDetail = '';
              try {
                errorDetail = await resp.text();
              } catch (_) {}
              console.error('Failed to update profile details', resp.status, errorDetail);
            } else {
              // Update localStorage only for fields provided
              if (body.firstname !== undefined) localStorage.setItem('firstName', body.firstname);
              if (body.lastname !== undefined) localStorage.setItem('lastName', body.lastname);
              if (body.email !== undefined) localStorage.setItem('email', body.email);
              // Redirect to profile view with user id in URL
              window.location.href = `profile.html?id=${encodeURIComponent(userId)}`;
            }
          } catch (err) {
            console.error('Error updating profile details:', err);
          }
      }

      // Primary click opens modal (existing behavior handled by modal.js). Actual save on modal confirm:
      if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', handleSave);

      // Helper to upload profile picture via form-data
      async function uploadPfp(file) {
        try {
          if (!file) return;
          const userId = localStorage.getItem('userId');
          if (!userId) return;
          const form = new FormData();
          form.append('pfp', file);
          const resp = await fetch(`https://betcha-api.onrender.com/admin/update/pfp/${userId}`, {
            method: 'PUT',
            body: form
          });
          if (!resp.ok) {
            console.error('Failed to update profile image');
            return;
          }
          const data = await resp.json().catch(() => ({}));
          // If API returns new url, save; otherwise keep existing
          const newUrl = (data && (data.pfplink || data.url)) || '';
          if (newUrl) {
            localStorage.setItem('pfplink', newUrl);
            if (avatarEl) {
              avatarEl.style.backgroundImage = `url("${newUrl}")`;
              const svg = avatarEl.querySelector('svg');
              if (svg) svg.style.display = 'none';
            }
          }
        } catch (err) {
          console.error('Error uploading profile image:', err);
        }
      }

      if (inputPfp) inputPfp.addEventListener('change', (e) => uploadPfp(e.target.files && e.target.files[0]));
      if (inputPfpMobile) inputPfpMobile.addEventListener('change', (e) => uploadPfp(e.target.files && e.target.files[0]));
    } catch (error) {
      console.error('Failed to populate profile edit form:', error);
    }
  });
})();


