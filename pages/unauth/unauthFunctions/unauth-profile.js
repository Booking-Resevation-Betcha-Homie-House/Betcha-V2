/**
 * Initialize unauth profile picture in navigation
 * For unauthenticated users, this just ensures the default icon is shown
 */
function initializeUnauthProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const unauthProfileImgElement = document.getElementById('unauthProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!unauthProfileImgElement || !menuBtnElement) {
            console.warn('Unauth profile elements not found in DOM');
            return;
        }
        
        // If profile picture exists, show it
        if (profilePicture && profilePicture.trim() !== '') {
            unauthProfileImgElement.src = profilePicture;
            unauthProfileImgElement.classList.remove('hidden');
            // Remove green background when showing profile picture
            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            
            // Hide the SVG icon when profile picture is shown
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.classList.add('hidden');
            }
            
            console.log('Unauth profile picture loaded:', profilePicture);
        } else {
            // Keep default SVG icon visible with green background
            unauthProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            
            // Show the SVG icon when no profile picture
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.classList.remove('hidden');
            }
            
            console.log('No unauth profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing unauth profile:', error);
    }
}

// Initialize profile when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeUnauthProfile();
});
