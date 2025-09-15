/**
 * Global Page Control System
 * Handles role-based access control and header modifications
 * 
 * Roles:
 * - admin: Access to admin folder pages, redirects to admin/dashboard.html
 * - employee: Access to employee folder pages, redirects to employee/dashboard.html  
 * - guest: Access to auth folder pages, redirects to unauth/rooms.html
 * - null/undefined: Access to unauth folder pages only, redirects to index.html for auth pages
 */

(function() {
    'use strict';

    // Get user role from localStorage
    const userRole = localStorage.getItem('role');
    
    // Get current page path
    const currentPath = window.location.pathname;
    
    // Define page categories
    const pageCategories = {
        admin: /\/pages\/admin\//,
        employee: /\/pages\/employee\//,
        auth: /\/pages\/auth\//,
        unauth: /\/pages\/unauth\//,
        root: /^\/?(index\.html)?$/
    };

    // Define default pages for each role
    const defaultPages = {
        admin: '/pages/admin/dashboard.html',
        employee: '/pages/employee/dashboard.html', 
        guest: '/pages/unauth/rooms.html'
    };

    /**
     * Determines if current page access is allowed for the user role
     */
    function isPageAccessAllowed() {
        // Root index.html is always accessible
        if (pageCategories.root.test(currentPath)) {
            return true;
        }

        // No role (unauthenticated user)
        if (!userRole) {
            // Can only access unauth pages
            if (pageCategories.unauth.test(currentPath)) {
                return true;
            }
            // Cannot access auth, admin, or employee pages
            return false;
        }

        // Admin role
        if (userRole === 'admin') {
            // Can access admin pages and unauth pages
            return pageCategories.admin.test(currentPath) || pageCategories.unauth.test(currentPath);
        }

        // Employee role  
        if (userRole === 'employee') {
            // Can access employee pages and unauth pages
            return pageCategories.employee.test(currentPath) || pageCategories.unauth.test(currentPath);
        }

        // Guest role
        if (userRole === 'guest') {
            // Can access auth pages and unauth pages
            return pageCategories.auth.test(currentPath) || pageCategories.unauth.test(currentPath);
        }

        // Unknown role - deny access
        return false;
    }

    /**
     * Redirects user to appropriate page based on their role
     */
    function redirectToRolePage() {
        // If no role and trying to access auth pages, redirect to index
        if (!userRole && pageCategories.auth.test(currentPath)) {
            window.location.href = '/index.html';
            return;
        }

        // If user has role but is on wrong page category, redirect to their default page
        if (userRole && defaultPages[userRole]) {
            window.location.href = defaultPages[userRole];
            return;
        }

        // If no role and not on unauth or root, redirect to index
        if (!userRole && !pageCategories.unauth.test(currentPath) && !pageCategories.root.test(currentPath)) {
            window.location.href = '/index.html';
            return;
        }
    }

    /**
     * Modifies header based on authentication status
     */
    function modifyHeader() {
        // Only modify header for unauth pages when user has no role
        if (!userRole && pageCategories.unauth.test(currentPath)) {
            // Special handling for rooms.html - only hide notification and profile, keep search
            if (currentPath.includes('rooms.html')) {
                hideNotificationAndProfile();
            } else {
                // For all other unauth pages, replace with full hamburger navigation
                replaceWithHamburgerNavigation();
            }
        }
    }

    /**
     * Hides only notification and profile elements for rooms.html while keeping search visible
     */
    function hideNotificationAndProfile() {
        // Hide notification bell and dropdown
        const notificationElements = document.querySelectorAll('#notifBellBtnDesktop, [data-modal-target="notifModalSmall"], #notificationDropdown, #notifBadge');
        notificationElements.forEach(element => {
            if (element) {
                element.style.display = 'none';
            }
        });

        // Hide profile dropdown menu and replace profile button with hamburger
        const profileMenuBtn = document.querySelector('#menuBtn');
        const dropdownMenu = document.querySelector('#dropdownMenu');
        
        if (profileMenuBtn && dropdownMenu) {
            // Replace the profile dropdown content with simple navigation links
            dropdownMenu.innerHTML = `
                <div class="space-y-1">
                    <a href="/pages/unauth/rooms.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">Rooms</a>
                    <a href="/pages/unauth/about-us.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">About us</a>
                    <a href="/pages/unauth/faqs.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">FAQs</a>
                    <div class="border-t border-neutral-200 my-2"></div>
                    <a href="/pages/unauth/login.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">Login</a>
                    <a href="/pages/unauth/register.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">Register</a>
                </div>
            `;

            // Update the button styling to look like a hamburger menu
            profileMenuBtn.className = "h-10 w-full group aspect-square rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center text-white cursor-pointer overflow-hidden hover:bg-primary/10 hover:shadow-lg hover:rotate-10 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out";
            
            // Replace the profile icon with hamburger icon
            profileMenuBtn.innerHTML = `
                <svg class="w-6 h-6 fill-primary-text group-hover:fill-primary transition-all duration-300 ease-in-out" viewBox="0 0 24 24">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            `;
        }
    }

    /**
     * Replaces the entire navigation with hamburger menu navigation (from about-us.html)
     */
    function replaceWithHamburgerNavigation() {
        const navbar = document.querySelector('#navbar, nav');
        
        if (navbar) {
            const hamburgerNavHTML = `
                <nav id="navbar" class="w-full flex flex-col items-center shadow-sm bg-white top-0 left-0 z-50">
                    <div class="w-full flex items-center justify-between py-4 px-4 md:px-10">
                        <!-- Logo -->
                        <a href="/pages/unauth/rooms.html" class="flex w-fit h-[30px]">
                            <svg class="fill-primary h-full w-auto" viewBox="0 0 121 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.8039 7.93926C15.1414 7.59644 15.6926 7.60699 16.0146 7.9709C16.3211 8.30317 16.2907 8.83282 15.9739 9.15907H15.9724L15.9739 9.15988L14.8083 10.3436C14.6495 10.5048 14.3943 10.5048 14.231 10.3436L13.0655 9.15988C12.7383 8.8276 12.7227 8.26772 13.0507 7.93469C13.2146 7.7682 13.4291 7.69063 13.6383 7.69063C13.8475 7.69063 14.0671 7.77351 14.231 7.93926L14.5174 8.23012L14.8039 7.93926Z" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M12.2397 0.024723C18.2449 0.412899 22.9954 5.48001 23 11.6721V11.6727L22.9996 11.7365C22.9851 13.0797 22.5147 14.5945 21.8291 16.1169C21.1267 17.6768 20.1675 19.3109 19.131 20.8787C16.4669 24.9152 13.2234 28.6134 12.3048 29.6389L12.3043 29.6395C12.0877 29.8808 11.7941 30.0006 11.5008 30C11.2073 30.0005 10.9138 29.8805 10.6977 29.6409L10.6965 29.6396C9.58798 28.4051 5.08194 23.2621 2.29725 18.3258L2.29732 18.3257C2.28114 18.2972 2.26641 18.2683 2.25305 18.239C2.22509 18.1891 2.19711 18.1394 2.16951 18.0895L2.0546 17.8809C0.87638 15.7233 0 13.5199 0 11.6764C1.10117e-05 5.22656 5.14659 1.11798e-05 11.4978 0H12.2397V0.024723ZM5.52213 18.06C7.42491 21.1479 9.9061 24.2332 11.5006 26.1177C12.634 24.7834 14.2149 22.8368 15.7187 20.7122L9.31462 14.2086L5.52213 18.06ZM11.4986 2.931C6.74986 2.931 2.8913 6.8535 2.8913 11.6719C2.8913 12.2564 3.07905 13.4138 4.04304 15.4045L8.43307 10.9496L8.54552 10.8347C8.96259 10.4088 9.63393 10.4042 10.0578 10.8135L10.0778 10.8332L13.0699 13.8719V12.7817C13.07 12.1196 13.6335 11.7141 14.1561 11.7141H14.8877C15.4103 11.7141 15.9738 12.1196 15.9739 12.7817V16.8209L17.3706 18.2394C19.675 14.5491 20.1057 12.592 20.1057 11.6764C20.1057 6.85754 16.2468 2.93102 11.4986 2.931Z" />
                                <path d="M33 24.5918V5H40.6788C41.9179 5 42.958 5.25397 43.7992 5.7619C44.6403 6.26984 45.2734 6.92744 45.6985 7.73469C46.1236 8.53288 46.3362 9.37642 46.3362 10.2653C46.3362 11.3447 46.0694 12.2698 45.5357 13.0408C45.0111 13.8118 44.3011 14.3379 43.4057 14.619L43.3786 13.9524C44.6267 14.2608 45.5855 14.8639 46.2548 15.7619C46.9241 16.6508 47.2587 17.6893 47.2587 18.8776C47.2587 20.0295 47.0281 21.0317 46.5668 21.8844C46.1146 22.737 45.4498 23.4036 44.5725 23.8844C43.7042 24.356 42.6505 24.5918 41.4114 24.5918H33ZM35.8762 21.8844H40.9773C41.6194 21.8844 42.1938 21.7619 42.7003 21.517C43.2158 21.2721 43.6183 20.9229 43.9077 20.4694C44.2062 20.0068 44.3554 19.458 44.3554 18.8231C44.3554 18.2336 44.2243 17.7029 43.962 17.2313C43.7087 16.7506 43.3379 16.3741 42.8495 16.102C42.3701 15.8209 41.8049 15.6803 41.1536 15.6803H35.8762V21.8844ZM35.8762 13H40.6381C41.1627 13 41.633 12.8957 42.0491 12.6871C42.4741 12.4694 42.8088 12.161 43.053 11.7619C43.3062 11.3537 43.4329 10.8639 43.4329 10.2925C43.4329 9.53061 43.1796 8.90476 42.6731 8.41497C42.1666 7.92517 41.4883 7.68027 40.6381 7.68027H35.8762V13Z" />
                                <path d="M56.457 25C55.0008 25 53.721 24.6825 52.6176 24.0476C51.5232 23.4036 50.6685 22.5102 50.0535 21.3673C49.4475 20.2154 49.1445 18.8821 49.1445 17.3673C49.1445 15.7619 49.443 14.3696 50.0399 13.1905C50.6459 12.0113 51.487 11.0998 52.5633 10.4558C53.6396 9.81179 54.8923 9.4898 56.3213 9.4898C57.8137 9.4898 59.0844 9.839 60.1336 10.5374C61.1828 11.2268 61.9651 12.2109 62.4807 13.4898C63.0052 14.7687 63.2133 16.288 63.1047 18.0476H60.2693V17.0136C60.2512 15.3084 59.9256 14.0476 59.2925 13.2313C58.6684 12.415 57.7142 12.0068 56.4299 12.0068C55.0099 12.0068 53.9426 12.4558 53.2281 13.3537C52.5136 14.2517 52.1563 15.5488 52.1563 17.2449C52.1563 18.8594 52.5136 20.1111 53.2281 21C53.9426 21.8798 54.9737 22.3197 56.3213 22.3197C57.2077 22.3197 57.972 22.1202 58.6141 21.7211C59.2653 21.3129 59.7718 20.7324 60.1336 19.9796L62.9148 20.8639C62.345 22.1791 61.4812 23.1995 60.3235 23.9252C59.1658 24.6417 57.877 25 56.457 25ZM51.2338 18.0476V15.8299H61.6938V18.0476H51.2338Z" />
                                <path d="M74.5329 24.5918C73.6103 24.7732 72.7059 24.8503 71.8195 24.8231C70.9331 24.7959 70.1417 24.6236 69.4453 24.3061C68.7489 23.9887 68.2243 23.4898 67.8716 22.8095C67.555 22.2018 67.3831 21.585 67.356 20.9592C67.3379 20.3243 67.3289 19.6077 67.3289 18.8095V5.81633H70.1779V18.6735C70.1779 19.263 70.1824 19.7755 70.1915 20.2109C70.2096 20.6463 70.3045 21.0136 70.4764 21.3129C70.802 21.8753 71.3175 22.1973 72.023 22.2789C72.7375 22.3515 73.5741 22.3197 74.5329 22.1837V24.5918ZM64.5206 12.1837V9.89796H74.5329V12.1837H64.5206Z" />
                                <path d="M83.2275 25C81.7261 25 80.4508 24.6644 79.4016 23.9932C78.3525 23.322 77.5475 22.4014 76.9867 21.2313C76.435 20.0612 76.1546 18.7324 76.1456 17.2449C76.1546 15.7302 76.4441 14.3923 77.0139 13.2313C77.5837 12.0612 78.3977 11.1451 79.4559 10.483C80.5141 9.82086 81.7849 9.4898 83.2682 9.4898C84.8691 9.4898 86.2348 9.88889 87.3654 10.6871C88.505 11.4853 89.2557 12.5782 89.6174 13.966L86.7955 14.7823C86.5152 13.9569 86.0539 13.3175 85.4117 12.8639C84.7786 12.4014 84.0505 12.1701 83.2275 12.1701C82.2959 12.1701 81.5316 12.3923 80.9347 12.8367C80.3377 13.2721 79.8946 13.8707 79.6051 14.6327C79.3157 15.3946 79.1665 16.2653 79.1574 17.2449C79.1665 18.7596 79.5102 19.9841 80.1885 20.9184C80.8759 21.8526 81.8889 22.3197 83.2275 22.3197C84.141 22.3197 84.8781 22.1111 85.4389 21.6939C86.0087 21.2676 86.4428 20.6599 86.7413 19.8707L89.6174 20.551C89.1381 21.9841 88.3467 23.0862 87.2432 23.8571C86.1398 24.619 84.8012 25 83.2275 25Z" />
                                <path d="M102.665 24.5918V17.3673C102.665 16.7959 102.615 16.2109 102.516 15.6122C102.425 15.0045 102.244 14.4422 101.973 13.9252C101.711 13.4082 101.335 12.9909 100.847 12.6735C100.368 12.356 99.739 12.1973 98.9611 12.1973C98.4547 12.1973 97.9753 12.2834 97.5231 12.4558C97.0708 12.619 96.6729 12.8866 96.3292 13.2585C95.9945 13.6304 95.7277 14.1202 95.5287 14.7279C95.3388 15.3356 95.2438 16.0748 95.2438 16.9456L93.4802 16.2789C93.4802 14.9456 93.7289 13.771 94.2263 12.7551C94.7238 11.7302 95.4383 10.932 96.3699 10.3605C97.3015 9.78912 98.4275 9.5034 99.748 9.5034C100.761 9.5034 101.611 9.66667 102.299 9.9932C102.986 10.3197 103.542 10.7506 103.967 11.2857C104.401 11.8118 104.732 12.3878 104.958 13.0136C105.184 13.6395 105.338 14.2517 105.419 14.8503C105.5 15.449 105.541 15.9751 105.541 16.4286V24.5918H102.665ZM92.3677 24.5918V5H94.9047V15.5714H95.2438V24.5918H92.3677Z" />
                                <path d="M113.213 25C112.127 25 111.218 24.8005 110.486 24.4014C109.753 23.9932 109.197 23.4581 108.817 22.7959C108.446 22.1247 108.261 21.39 108.261 20.5918C108.261 19.8481 108.392 19.195 108.654 18.6327C108.916 18.0703 109.305 17.5941 109.821 17.2041C110.336 16.805 110.97 16.483 111.72 16.2381C112.372 16.0476 113.109 15.8798 113.932 15.7347C114.755 15.5896 115.618 15.4535 116.523 15.3265C117.436 15.1995 118.341 15.0726 119.236 14.9456L118.205 15.517C118.223 14.3651 117.979 13.5125 117.473 12.9592C116.975 12.3968 116.116 12.1156 114.895 12.1156C114.126 12.1156 113.421 12.2971 112.779 12.6599C112.136 13.0136 111.689 13.6032 111.435 14.4286L108.79 13.6122C109.152 12.3515 109.839 11.3492 110.852 10.6054C111.874 9.86168 113.231 9.4898 114.922 9.4898C116.234 9.4898 117.373 9.71655 118.341 10.1701C119.318 10.6145 120.032 11.322 120.484 12.2925C120.72 12.7732 120.864 13.2812 120.919 13.8163C120.973 14.3515 121 14.9274 121 15.5442V24.5918H118.49V21.2313L118.979 21.6667C118.373 22.7914 117.599 23.6304 116.659 24.1837C115.727 24.7279 114.578 25 113.213 25ZM113.715 22.6735C114.52 22.6735 115.211 22.5329 115.79 22.2517C116.369 21.9615 116.835 21.5941 117.188 21.1497C117.54 20.7052 117.771 20.2426 117.88 19.7619C118.033 19.3265 118.119 18.8367 118.137 18.2925C118.165 17.7483 118.178 17.3129 118.178 16.9864L119.101 17.3265C118.205 17.4626 117.391 17.585 116.659 17.6939C115.926 17.8027 115.261 17.9116 114.664 18.0204C114.076 18.1202 113.552 18.2426 113.091 18.3878C112.702 18.5238 112.353 18.6871 112.046 18.8776C111.747 19.068 111.508 19.2993 111.327 19.5714C111.155 19.8435 111.069 20.1746 111.069 20.5646C111.069 20.9456 111.164 21.2993 111.354 21.6259C111.544 21.9433 111.833 22.1973 112.222 22.3878C112.611 22.5782 113.109 22.6735 113.715 22.6735Z" />
                            </svg>
                        </a>

                        <!-- Right Hamburger -->
                        <div class="relative">
                            <!-- Button to toggle dropdown -->
                            <div id="menuBtn" class="h-10 w-full group aspect-square rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center text-white cursor-pointer overflow-hidden
                            hover:bg-primary/10 hover:shadow-lg hover:rotate-10 hover:scale-105 active:scale-95 
                            transition-all duration-300 ease-in-out">
                                <svg class="w-6 h-6 fill-primary-text 
                                     group-hover:fill-primary
                                    transition-all duration-300 ease-in-out" viewBox="0 0 24 24">
                                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                                </svg>
                            </div>

                            <!-- Dropdown menu -->
                            <div id="dropdownMenu" class="hidden absolute right-0 mt-2 w-52 border border-neutral-300 bg-white rounded-3xl shadow-lg py-5 px-3 z-50 text-sm font-manrope text-primary-text">
                                <div class="space-y-1">
                                    <a href="/pages/unauth/rooms.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">Rooms</a>
                                    <a href="/pages/unauth/about-us.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">About us</a>
                                    <a href="/pages/unauth/faqs.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">FAQs</a>
                                    <div class="border-t border-neutral-200 my-2"></div>
                                    <a href="/pages/unauth/login.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">Login</a>
                                    <a href="/pages/unauth/register.html" class="block px-4 py-3 rounded-2xl hover:bg-primary/10 transition-colors duration-200">Register</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            `;

            // Replace the navbar
            navbar.outerHTML = hamburgerNavHTML;

            // Re-add dropdown functionality after replacement
            addDropdownFunctionality();
        }
    }

    /**
     * Adds dropdown functionality to the hamburger menu
     */
    function addDropdownFunctionality() {
        const menuBtn = document.querySelector('#menuBtn');
        const dropdownMenu = document.querySelector('#dropdownMenu');

        if (menuBtn && dropdownMenu) {
            menuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                dropdownMenu.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                    dropdownMenu.classList.add('hidden');
                }
            });
        }
    }

    /**
     * Main initialization function
     */
    function init() {
        // Check if page access is allowed
        if (!isPageAccessAllowed()) {
            redirectToRolePage();
            return;
        }

        // Modify header for unauthenticated users on unauth pages
        modifyHeader();

        // Log current access for debugging
        console.log(`Page Control: User role '${userRole || 'none'}' accessing ${currentPath}`);
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-run header modifications after a short delay to catch dynamically loaded content
    setTimeout(modifyHeader, 100);
    setTimeout(modifyHeader, 500);

    // Export for testing/debugging
    window.PageControl = {
        userRole,
        currentPath,
        isPageAccessAllowed,
        redirectToRolePage,
        modifyHeader
    };

})();
