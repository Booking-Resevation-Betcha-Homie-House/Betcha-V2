// Populate Guest Profile using GET /guest/display/:id (fallback to localStorage if needed)
(function initGuestProfile() {
    'use strict';

    const API_BASE_URL = 'https://betcha-api.onrender.com';

    document.addEventListener('DOMContentLoaded', () => {
        fetchAndRenderProfile().catch((error) => {
            console.error('Failed to initialize guest profile:', error);
        });

        // Initialize verification button functionality
        initVerificationButton();
        
        // Initialize profile picture modal functionality
        initProfilePictureModal();
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
        const verified = (guest && guest.verified) || false;

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

        // Update verification status
        updateVerificationStatus(verified);

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

    function updateVerificationStatus(verified) {
        const activationGroupRow = document.getElementById('activationGroupRow');
        
        if (!activationGroupRow) return;

        if (verified) {
            // Update to verified state
            activationGroupRow.innerHTML = `
                <!-- Verification Row -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
                    <div class="flex items-center gap-2 justify-center sm:justify-start">
                        <p class="text-sm text-neutral-500 font-inter">Account Verification</p>
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div class="flex items-center gap-2 justify-center sm:justify-end">
                        <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Verified</span>
                        <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
                
                <!-- Verified Message -->
                <div class="text-center mt-1 md:text-right">
                    <span class="text-xs text-green-600 font-inter">
                        ✓ Your account has been verified
                    </span>
                </div>
            `;
        } else {
            // Keep pending state (default HTML structure)
            activationGroupRow.innerHTML = `
                <!-- Verification Row -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
                    <div class="flex items-center gap-2 justify-center sm:justify-start">
                        <p class="text-sm text-neutral-500 font-inter">Account Verification</p>
                        <div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <div class="flex items-center gap-2 justify-center sm:justify-end">
                        <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">Pending</span>
                        <svg class="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
                
                <!-- Link -->
                <div class="text-center mt-1 md:text-right">
                    <span data-modal-target="idVerificationModal" class="text-xs text-primary hover:underline font-inter cursor-pointer group inline-flex items-center gap-1 hover:gap-2 transition-all duration-200">
                        <svg class="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span>Verify your account</span>
                    </span>
                </div>
            `;
        }
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

    // Import fullscreen loading functions
    async function importFullscreenLoading() {
        try {
            const module = await import('../../../src/fullscreenLoading.js');
            return module;
        } catch (error) {
            console.error('Failed to load fullscreen loading module:', error);
            return null;
        }
    }

    // Initialize verification button functionality
    function initVerificationButton() {
        const startVerificationBtn = document.getElementById('startVerificationBtn');
        
        if (startVerificationBtn) {
            startVerificationBtn.addEventListener('click', async () => {
                console.log('Start verification clicked');
                
                // Import and show loading
                const loadingModule = await importFullscreenLoading();
                if (loadingModule) {
                    loadingModule.showFullscreenLoading('Verifying your account');
                    
                    // Close the modal first
                    const modal = document.getElementById('idVerificationModal');
                    if (modal) {
                        modal.classList.add('hidden');
                        document.body.classList.remove('modal-open');
                    }
                    
                    try {
                        // Update verified status via API
                        const userId = localStorage.getItem('userId');
                        if (userId) {
                            const response = await fetch(`${API_BASE_URL}/guest/update/${userId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    verified: true
                                })
                            });
                            
                            if (response.ok) {
                                console.log('Verification status updated successfully');
                            } else {
                                console.warn('Failed to update verification status:', response.status);
                            }
                        }
                        
                        // Open Sumsub verification page in new tab
                        window.open('https://in.sumsub.com/websdk/p/sbx_uni_5lWlhioi8FNABcxg', '_blank');
                        
                    } catch (error) {
                        console.error('Error during verification process:', error);
                    }
                    
                    // Simulate verification process with 20 second timeout
                    setTimeout(() => {
                        if (loadingModule) {
                            loadingModule.hideFullscreenLoading();
                        }
                        
                        console.log('Verification process completed');
                    }, 20000); // 20 seconds
                }
            });
        }
    }

    // Initialize profile picture modal functionality
    function initProfilePictureModal() {
        const profilePictureContainer = document.getElementById('profilePictureContainer');
        const profilePictureModal = document.getElementById('profilePictureModal');
        const modalProfileImg = document.getElementById('modalProfileImg');
        const modalFirstLetter = document.getElementById('modalFirstLetter');
        const modalUserName = document.getElementById('modalUserName');
        const modalUserRole = document.getElementById('modalUserRole');
        
        if (profilePictureContainer) {
            profilePictureContainer.addEventListener('click', () => {
                // Get current profile data
                const profileImg = document.getElementById('profileAvatarImg');
                const firstLetter = document.getElementById('firstLetterName');
                const userName = document.getElementById('userName');
                const userRole = document.getElementById('userRole');
                
                // Update modal content
                if (modalUserName && userName) {
                    modalUserName.textContent = userName.textContent;
                }
                if (modalUserRole && userRole) {
                    modalUserRole.textContent = userRole.textContent;
                }
                if (modalFirstLetter && firstLetter) {
                    modalFirstLetter.textContent = firstLetter.textContent;
                }
                
                // Show profile image or initial in modal
                if (profileImg && !profileImg.classList.contains('hidden') && profileImg.src) {
                    // Show image in modal
                    if (modalProfileImg) {
                        modalProfileImg.src = profileImg.src;
                        modalProfileImg.classList.remove('hidden');
                    }
                    if (modalFirstLetter) {
                        modalFirstLetter.classList.add('hidden');
                    }
                } else {
                    // Show initial in modal
                    if (modalProfileImg) {
                        modalProfileImg.classList.add('hidden');
                        modalProfileImg.removeAttribute('src');
                    }
                    if (modalFirstLetter) {
                        modalFirstLetter.classList.remove('hidden');
                    }
                }
                
                // Show modal
                if (profilePictureModal) {
                    profilePictureModal.classList.remove('hidden');
                    document.body.classList.add('modal-open');
                }
            });
        }
    }
})();


