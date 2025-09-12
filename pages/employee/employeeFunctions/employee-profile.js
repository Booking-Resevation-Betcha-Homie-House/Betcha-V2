
function initializeEmployeeProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const employeeProfileImgElement = document.getElementById('employeeProfileImg');
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!employeeProfileImgElement || !menuBtnElement) {
            console.warn('Employee profile elements not found in DOM');
            return;
        }

        if (profilePicture && profilePicture.trim() !== '') {
            employeeProfileImgElement.src = profilePicture;
            employeeProfileImgElement.classList.remove('hidden');

            menuBtnElement.classList.remove('bg-primary');
            menuBtnElement.classList.add('bg-transparent');
            console.log('Employee profile picture loaded:', profilePicture);
        } else {

            employeeProfileImgElement.classList.add('hidden');
            menuBtnElement.classList.remove('bg-transparent');
            menuBtnElement.classList.add('bg-primary');
            console.log('No employee profile picture found, using default icon');
        }
        
    } catch (error) {
        console.error('Error initializing employee profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeEmployeeProfile();
});
