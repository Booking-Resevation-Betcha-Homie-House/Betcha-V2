
function initializeAdminProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const adminProfileImgElement = document.getElementById('adminProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!adminProfileImgElement || !menuBtnElement) {
            console.warn('Admin profile elements not found in DOM');
            return;
        }

        if (profilePicture && profilePicture.trim() !== '') {
            adminProfileImgElement.src = profilePicture;
            adminProfileImgElement.classList.remove('hidden');

            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Admin profile picture loaded:', profilePicture);
        } else {

            adminProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No admin profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing admin profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminProfile();
});
