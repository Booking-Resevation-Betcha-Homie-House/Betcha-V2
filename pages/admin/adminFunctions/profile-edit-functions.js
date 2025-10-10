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


      // Pre-populate text fields with existing data
      const firstName = localStorage.getItem('firstName') || '';
      const lastName = localStorage.getItem('lastName') || '';

      if (inputFirstName) inputFirstName.value = firstName;
      if (inputLastName) inputLastName.value = lastName;
      
      // Also populate middle initial input if it exists
      const inputMiddleInitial = document.getElementById('inputMiddleInitial');
      if (inputMiddleInitial && middleInitial) inputMiddleInitial.value = middleInitial;

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
            const inputMiddleInitial = document.getElementById('inputMiddleInitial');
            const vMI = ((inputMiddleInitial && inputMiddleInitial.value) || '').trim();
            if (vFirst) body.firstname = vFirst;
            if (vMI) body.minitial = vMI;
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
              if (body.minitial !== undefined) localStorage.setItem('middleInitial', body.minitial);
              
              // Audit: profile updated (Admin)
              try {
                const uid = localStorage.getItem('userId') || '';
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logProfileUpdate === 'function' && uid) {
                  window.AuditTrailFunctions.logProfileUpdate(uid, 'Admin');
                }
              } catch (_) {}
              
              // Upload profile picture if one was selected
              if (selectedFile) {
                await uploadPfp(selectedFile);
              }
              
              // Redirect to profile view with user id in URL
              window.location.href = `profile.html?id=${encodeURIComponent(userId)}`;
            }
          } catch (err) {
            console.error('Error updating profile details:', err);
          }
      }

      // Primary click opens modal (existing behavior handled by modal.js). Actual save on modal confirm:
      if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', handleSave);

      // Store selected file for later upload
      let selectedFile = null;

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

      if (inputPfp) inputPfp.addEventListener('change', (e) => { 
        const file = e.target.files && e.target.files[0];
        
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
          import('/src/toastNotification.js').then(module => {
            module.showToastError(
              'Please select a valid image file (JPG, PNG, GIF, JPEG, or WEBP).',
              'Invalid File Type'
            );
          });
          e.target.value = ''; // Clear the input
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          import('/src/toastNotification.js').then(module => {
            module.showToastError(
              'Image size should be less than 5MB.',
              'File Too Large'
            );
          });
          e.target.value = ''; // Clear the input
          return;
        }
        
        selectedFile = file;
        if (selectedFile && avatarEl) {
          const previewUrl = URL.createObjectURL(selectedFile);
          avatarEl.style.backgroundImage = `url("${previewUrl}")`;
          avatarEl.style.backgroundSize = 'cover';
          avatarEl.style.backgroundPosition = 'center';
          const svg = avatarEl.querySelector('svg');
          if (svg) svg.style.display = 'none';
        }
      });
      if (inputPfpMobile) inputPfpMobile.addEventListener('change', (e) => { 
        const file = e.target.files && e.target.files[0];
        
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
          import('/src/toastNotification.js').then(module => {
            module.showToastError(
              'Please select a valid image file (JPG, PNG, GIF, JPEG, or WEBP).',
              'Invalid File Type'
            );
          });
          e.target.value = ''; // Clear the input
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          import('/src/toastNotification.js').then(module => {
            module.showToastError(
              'Image size should be less than 5MB.',
              'File Too Large'
            );
          });
          e.target.value = ''; // Clear the input
          return;
        }
        
        selectedFile = file;
        if (selectedFile && avatarEl) {
          const previewUrl = URL.createObjectURL(selectedFile);
          avatarEl.style.backgroundImage = `url("${previewUrl}")`;
          avatarEl.style.backgroundSize = 'cover';
          avatarEl.style.backgroundPosition = 'center';
          const svg = avatarEl.querySelector('svg');
          if (svg) svg.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('Failed to populate profile edit form:', error);
    }
  });
})();


