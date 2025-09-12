
(function() {
    'use strict';

    function performLogout() {
        try {
            
            try {
                const userId = localStorage.getItem('userId') || '';
                const userType = localStorage.getItem('role') || localStorage.getItem('userType') || '';
                if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logUserLogout === 'function' && userId) {
                    window.AuditTrailFunctions.logUserLogout(userId, (userType.charAt(0).toUpperCase() + userType.slice(1)) || 'Guest');
                }
            } catch (_) {
                
            }

            localStorage.clear();
            console.log('LocalStorage cleared successfully');

            sessionStorage.clear();
            console.log('SessionStorage cleared successfully');
            
        } catch (error) {
            console.warn('Failed to clear storage:', error);
        }

        const currentPath = window.location.pathname;
        let redirectPath = '/index.html';
        
        if (currentPath.includes('/pages/')) {
            
            redirectPath = '../../index.html';
        }

        window.location.href = redirectPath;
    }

    function handleLogoutClick(event) {
        event.preventDefault();

        showLogoutModal();
    }

    function showLogoutModal() {
        
        let modal = document.getElementById('logoutConfirmModal');
        if (!modal) {
            
            createLogoutModal();
            modal = document.getElementById('logoutConfirmModal');
        }

        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    function createLogoutModal() {
        const modalHTML = `
        <div id="logoutConfirmModal" class="modal fixed inset-0 bg-black/50 bg-opacity-50 flex items-end md:items-center justify-center hidden z-50">
            <div class="bg-background w-[400px] rounded-t-3xl overflow-hidden modal-animate md:rounded-3xl">
                
                <div class="w-full p-5 flex justify-end">
                    <button id="logoutModalClose" class="cursor-pointer btn-round border-none hover:bg-neutral-300 flex items-center justify-center active:scale-95 transition-all duration-200">
                        <span>
                            <svg class="h-5 fill-primary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 14.1221L17.303 19.4251C17.5844 19.7065 17.966 19.8646 18.364 19.8646C18.7619 19.8646 19.1436 19.7065 19.425 19.4251C19.7064 19.1437 19.8645 18.7621 19.8645 18.3641C19.8645 17.9662 19.7064 17.5845 19.425 17.3031L14.12 12.0001L19.424 6.69711C19.5632 6.55778 19.6737 6.39238 19.749 6.21036C19.8244 6.02834 19.8631 5.83326 19.8631 5.63626C19.8631 5.43926 19.8242 5.2442 19.7488 5.06221C19.6733 4.88022 19.5628 4.71488 19.4235 4.57561C19.2841 4.43634 19.1187 4.32588 18.9367 4.25054C18.7547 4.17519 18.5596 4.13644 18.3626 4.13648C18.1656 4.13653 17.9706 4.17538 17.7886 4.25081C17.6066 4.32624 17.4412 4.43678 17.302 4.57611L12 9.87911L6.69697 4.57611C6.55867 4.43278 6.3932 4.31843 6.21024 4.23973C6.02727 4.16103 5.83046 4.11956 5.63129 4.11774C5.43212 4.11591 5.23459 4.15377 5.05021 4.22911C4.86583 4.30444 4.6983 4.41574 4.55739 4.55652C4.41649 4.69729 4.30503 4.86471 4.22952 5.04902C4.15401 5.23333 4.11597 5.43083 4.1176 5.63C4.11924 5.82917 4.16053 6.02602 4.23905 6.20906C4.31758 6.3921 4.43177 6.55767 4.57497 6.69611L9.87997 12.0001L4.57597 17.3041C4.43277 17.4425 4.31858 17.6081 4.24005 17.7912C4.16153 17.9742 4.12024 18.1711 4.1186 18.3702C4.11697 18.5694 4.15501 18.7669 4.23052 18.9512C4.30603 19.1355 4.41749 19.3029 4.55839 19.4437C4.6993 19.5845 4.86683 19.6958 5.05121 19.7711C5.23559 19.8464 5.43312 19.8843 5.63229 19.8825C5.83146 19.8807 6.02827 19.8392 6.21124 19.7605C6.3942 19.6818 6.55967 19.5674 6.69797 19.4241L12 14.1221Z"/>
                            </svg>
                        </span>
                    </button>
                </div>

                <div class="flex flex-col items-center gap-5 p-8 pt-0">
                    <h3 class="font-manrope text-primary-text font-bold text-xl text-center">Confirm Logout</h3>
                    <p class="font-roboto text-neutral-500 text-sm text-center">Are you sure you want to log out? You'll need to sign in again to access your account.</p>

                    <div class="flex flex-col gap-3 w-full mt-5">
                        <button id="confirmLogoutBtn" class="group relative rounded-full w-full bg-primary hover:bg-primary/90 flex items-center justify-center overflow-hidden hover:cursor-pointer active:scale-95 transition-all duration-300 ease-in-out py-3">
                            <span class="text-secondary-text text-sm font-medium group-hover:-translate-x-1 transition-transform duration-500 ease-in-out">
                                Yes, Log Out
                            </span>
                            <span class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out">
                                <svg class="w-5 h-5 ml-2 fill-secondary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.55006 15.15L18.0251 6.675C18.2251 6.475 18.4584 6.375 18.7251 6.375C18.9917 6.375 19.2251 6.475 19.4251 6.675C19.6251 6.875 19.7251 7.11267 19.7251 7.388C19.7251 7.66333 19.6251 7.90067 19.4251 8.1L10.2501 17.3C10.0501 17.5 9.81673 17.6 9.55006 17.6C9.28339 17.6 9.05006 17.5 8.85006 17.3L4.55006 13C4.35006 12.8 4.25406 12.5627 4.26206 12.288C4.27006 12.0133 4.37439 11.7757 4.57506 11.575C4.77572 11.3743 5.01339 11.2743 5.28806 11.275C5.56272 11.2757 5.80006 11.3757 6.00006 11.575L9.55006 15.15Z"/>
                                </svg>
                            </span>
                        </button>
                        <button id="cancelLogoutBtn" class="group relative rounded-full w-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center overflow-hidden hover:cursor-pointer active:scale-95 transition-all duration-300 ease-in-out py-3">
                            <span class="text-primary-text text-sm font-medium group-hover:-translate-x-1 transition-transform duration-500 ease-in-out">
                                Cancel
                            </span>
                            <span class="overflow-hidden max-w-[30px] lg:max-w-0 lg:group-hover:max-w-[30px] transition-all duration-500 ease-in-out">
                                <svg class="w-5 h-5 ml-2 fill-primary-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('logoutConfirmModal');
        const closeBtn = document.getElementById('logoutModalClose');
        const confirmBtn = document.getElementById('confirmLogoutBtn');
        const cancelBtn = document.getElementById('cancelLogoutBtn');

        const closeModal = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', () => {
            closeModal();
            performLogout();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }

    function attachLogoutHandlers() {
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && !logoutBtn.dataset.bound) {
            logoutBtn.addEventListener('click', handleLogoutClick);
            logoutBtn.dataset.bound = 'true';
            console.log('Logout button handler attached successfully');
        }

        const logoutLinks = document.querySelectorAll('.logout-link');
        logoutLinks.forEach(link => {
            if (!link.dataset.bound) {
                link.addEventListener('click', handleLogoutClick);
                link.dataset.bound = 'true';
                console.log('Logout link handler attached successfully');
            }
        });

        const logoutHrefLinks = document.querySelectorAll('a[href="/logout"], a[href="logout"]');
        logoutHrefLinks.forEach(link => {
            if (!link.dataset.bound) {
                link.addEventListener('click', handleLogoutClick);
                link.dataset.bound = 'true';
                console.log('Logout href link handler attached successfully');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachLogoutHandlers);
    } else {
        attachLogoutHandlers();
    }

    window.attachLogoutHandlers = attachLogoutHandlers;
    window.handleLogoutClick = handleLogoutClick;
    window.performLogout = performLogout;
    window.showLogoutModal = showLogoutModal;
})();
