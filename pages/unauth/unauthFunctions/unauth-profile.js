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
        
        // If profile picture exists, show it as background
        if (profilePicture && profilePicture.trim() !== '') {
            // Set profile picture as background image on the button
            menuBtnElement.style.backgroundImage = `url('${profilePicture}')`;
            menuBtnElement.style.backgroundSize = 'cover';
            menuBtnElement.style.backgroundPosition = 'center';
            menuBtnElement.style.backgroundRepeat = 'no-repeat';
            
            // Remove green background
            menuBtnElement.classList.remove('bg-primary');
            
            // Hide the img element (not needed with background image)
            if (unauthProfileImgElement) {
                unauthProfileImgElement.style.display = 'none';
            }
            
            // Hide the SVG icon when profile picture is shown
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.classList.add('hidden');
                svgIcon.style.display = 'none';
            }
            
            console.log('Unauth profile picture loaded:', profilePicture);
        } else {
            // Keep default SVG icon visible with green background
            menuBtnElement.style.backgroundImage = '';
            menuBtnElement.classList.add('bg-primary');
            
            // Hide img element
            if (unauthProfileImgElement) {
                unauthProfileImgElement.style.display = 'none';
            }
            
            // Show the SVG icon when no profile picture
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.classList.remove('hidden');
                svgIcon.style.display = '';
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
