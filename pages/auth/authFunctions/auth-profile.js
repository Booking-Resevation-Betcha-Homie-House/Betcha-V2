/**
 * Initialize auth profile picture in navigation
 */
function initializeAuthProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const authProfileImgElement = document.getElementById('authProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!authProfileImgElement || !menuBtnElement) {
            console.warn('Auth profile elements not found in DOM');
            return;
        }
        
        // If profile picture exists, show it
        if (profilePicture && profilePicture.trim() !== '') {
            authProfileImgElement.src = profilePicture;
            authProfileImgElement.classList.remove('hidden');
            // Remove green background when showing profile picture
            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            
            // Hide the SVG icon when profile picture is shown
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.classList.add('hidden');
            }
            
            console.log('Auth profile picture loaded:', profilePicture);
        } else {
            // Keep default SVG icon visible with green background
            authProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            
            // Show the SVG icon when no profile picture
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.classList.remove('hidden');
            }
            
            console.log('No auth profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing auth profile:', error);
    }
}

// Initialize profile when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthProfile();
});
