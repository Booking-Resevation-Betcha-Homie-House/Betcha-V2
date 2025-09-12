/**
 * Initialize employee profile picture in navigation
 */
function initializeEmployeeProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const employeeProfileImgElement = document.getElementById('employeeProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!employeeProfileImgElement || !menuBtnElement) {
            console.warn('Employee profile elements not found in DOM');
            return;
        }
        
        // If profile picture exists, show it
        if (profilePicture && profilePicture.trim() !== '') {
            employeeProfileImgElement.src = profilePicture;
            employeeProfileImgElement.classList.remove('hidden');
            // Remove green background when showing profile picture
            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Employee profile picture loaded:', profilePicture);
        } else {
            // Keep default SVG icon visible with green background
            employeeProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No employee profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing employee profile:', error);
    }
}

// Initialize profile when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeEmployeeProfile();
});
