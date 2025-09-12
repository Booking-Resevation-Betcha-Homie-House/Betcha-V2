
function initializeAuthProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const authProfileImgElement = document.getElementById('authProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!authProfileImgElement || !menuBtnElement) {
            console.warn('Auth profile elements not found in DOM');
            return;
        }

        if (profilePicture && profilePicture.trim() !== '') {
            authProfileImgElement.src = profilePicture;
            authProfileImgElement.classList.remove('hidden');

            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Auth profile picture loaded:', profilePicture);
        } else {

            authProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No auth profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing auth profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeAuthProfile();
});
