
function initializeUnauthProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const unauthProfileImgElement = document.getElementById('unauthProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!unauthProfileImgElement || !menuBtnElement) {
            console.warn('Unauth profile elements not found in DOM');
            return;
        }

        if (profilePicture && profilePicture.trim() !== '') {
            unauthProfileImgElement.src = profilePicture;
            unauthProfileImgElement.classList.remove('hidden');

            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Unauth profile picture loaded:', profilePicture);
        } else {

            unauthProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No unauth profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing unauth profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeUnauthProfile();
});
