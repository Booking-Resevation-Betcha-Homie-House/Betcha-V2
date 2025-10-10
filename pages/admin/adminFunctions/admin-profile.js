/**
 * Initialize admin profile picture in navigation
 * Sets the profile picture as background image on the menuBtn div
 */
function initializeAdminProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!menuBtnElement) {
            console.warn('Menu button element not found in DOM');
            return;
        }
        
        // Always hide the img element since we're using background-image
        const imgElement = document.getElementById('adminProfileImg');
        if (imgElement) {
            imgElement.style.display = 'none';
        }
        
        // If profile picture exists, show it as background on menuBtn
        if (profilePicture && profilePicture.trim() !== '') {
            // Set profile picture as background image on the menuBtn
            menuBtnElement.style.backgroundImage = `url('${profilePicture}')`;
            menuBtnElement.style.backgroundSize = 'cover';
            menuBtnElement.style.backgroundPosition = 'center';
            menuBtnElement.style.backgroundRepeat = 'no-repeat';
            
            // Remove green background
            menuBtnElement.classList.remove('bg-primary');
            
            // Hide the SVG icon when profile picture is shown
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.style.display = 'none';
            }
            
            console.log('Admin profile picture loaded as background:', profilePicture);
        } else {
            // No profile picture - keep default SVG icon with green background
            menuBtnElement.style.backgroundImage = '';
            menuBtnElement.classList.add('bg-primary');
            
            // Show the SVG icon
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.style.display = '';
            }
            
            console.log('No admin profile picture, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing admin profile:', error);
    }
}

// Initialize profile when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminProfile();
    
    // Log profile view audit trail
    try {
        const userId = localStorage.getItem('userId');
        if (window.AuditTrailFunctions && userId) {
            window.AuditTrailFunctions.logProfileView(userId, 'Admin');
        }
    } catch (auditError) {
        console.warn('Audit trail for profile view failed:', auditError);
    }
});
