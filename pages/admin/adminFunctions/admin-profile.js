function initializeAdminProfile() {
    try {
        const profilePicture = localStorage.getItem('pfplink') || '';
        const menuBtnElement = document.getElementById('menuBtn');
        
        if (!menuBtnElement) {
            console.warn('Menu button element not found in DOM');
            return;
        }

        const imgElement = document.getElementById('adminProfileImg');
        if (imgElement) {
            imgElement.style.display = 'none';
        }

        if (profilePicture && profilePicture.trim() !== '') {
            menuBtnElement.style.backgroundImage = `url('${profilePicture}')`;
            menuBtnElement.style.backgroundSize = 'cover';
            menuBtnElement.style.backgroundPosition = 'center';
            menuBtnElement.style.backgroundRepeat = 'no-repeat';
            
            menuBtnElement.classList.remove('bg-primary');
            
            const svgIcon = menuBtnElement.querySelector('svg');
            if (svgIcon) {
                svgIcon.style.display = 'none';
            }
            
            console.log('Admin profile picture loaded as background:', profilePicture);
        } else {
            menuBtnElement.style.backgroundImage = '';
            menuBtnElement.classList.add('bg-primary');
            
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

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminProfile();
    
    try {
        const userId = localStorage.getItem('userId');
        if (window.AuditTrailFunctions && userId) {
            window.AuditTrailFunctions.logProfileView(userId, 'Admin');
        }
    } catch (auditError) {
        console.warn('Audit trail for profile view failed:', auditError);
    }
});
