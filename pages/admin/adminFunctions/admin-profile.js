/**
 * Initialize admin profile picture in navigation
 */
function initializeAdminProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const adminProfileImgElement = document.getElementById('adminProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!adminProfileImgElement || !menuBtnElement) {
            console.warn('Admin profile elements not found in DOM');
            return;
        }
        
        // If profile picture exists, show it
        if (profilePicture && profilePicture.trim() !== '') {
            adminProfileImgElement.src = profilePicture;
            adminProfileImgElement.classList.remove('hidden');
            // Remove green background when showing profile picture
            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Admin profile picture loaded:', profilePicture);
        } else {
            // Keep default SVG icon visible with green background
            adminProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No admin profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing admin profile:', error);
    }
}

// Initialize profile when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminProfile();
});
