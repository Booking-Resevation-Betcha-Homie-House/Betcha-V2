

const AUDIT_API_BASE = 'https://betcha-api.onrender.com/audit/create';

async function createAuditTrail(userId, userType, activity) {
    try {
        const auditData = {
            userId: userId,
            userType: userType,
            activity: activity
        };

        const response = await fetch(AUDIT_API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(auditData)
        });

        if (!response.ok) {
            throw new Error(`Audit trail creation failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating audit trail:', error);

        return { success: false, error: error.message };
    }
}

async function logUserLogin(userId, userType) {
    return await createAuditTrail(userId, userType, 'User logged in');
}

async function logUserLogout(userId, userType) {
    return await createAuditTrail(userId, userType, 'User logged out', {
        timestamp: new Date().toISOString()
    });
}

async function logUserRegistration(userId, userType) {
    return await createAuditTrail(userId, userType, 'User registered');
}

async function logPasswordReset(userId, userType) {
    return await createAuditTrail(userId, userType, 'Password reset requested', {
        timestamp: new Date().toISOString()
    });
}

async function logProfileUpdate(userId, userType) {
    return await createAuditTrail(userId, userType, 'Profile updated');
}

async function logProfileView(userId, userType) {
    return await createAuditTrail(userId, userType, 'Profile viewed');
}

async function logPropertyView(userId, userType) {
    return await createAuditTrail(userId, userType, 'Property viewed');
}

async function logPropertySearch(userId, userType) {
    return await createAuditTrail(userId, userType, 'Property search performed');
}

async function logPropertyBooking(userId, userType) {
    return await createAuditTrail(userId, userType, 'Property booked');
}

async function logPropertyCreation(userId, userType) {
    return await createAuditTrail(userId, userType, 'Property created');
}

async function logPropertyUpdate(userId, userType) {
    return await createAuditTrail(userId, userType, 'Property updated');
}

async function logPropertyArchiving(userId, userType) {
    return await createAuditTrail(userId, userType, 'Property archived');
}

async function logPropertyActivation(userId, userType) {
    return await createAuditTrail(userId, userType, 'Property activated');
}

async function logBookingCreation(userId, userType) {
    return await createAuditTrail(userId, userType, 'Booking created');
}

async function logBookingUpdate(userId, userType) {
    return await createAuditTrail(userId, userType, 'Booking updated');
}

async function logBookingCancellation(userId, userType) {
    return await createAuditTrail(userId, userType, 'Booking cancelled');
}

async function logCheckIn(userId, userType) {
    return await createAuditTrail(userId, userType, 'Check-in performed');
}

async function logCheckOut(userId, userType) {
    return await createAuditTrail(userId, userType, 'Check-out performed');
}

async function logPaymentInitiation(userId, userType) {
    return await createAuditTrail(userId, userType, 'Payment initiated');
}

async function logPaymentCompletion(userId, userType) {
    return await createAuditTrail(userId, userType, 'Payment completed');
}

async function logPaymentFailure(userId, userType) {
    return await createAuditTrail(userId, userType, 'Payment failed');
}

async function logEmployeeCreation(adminId) {
    return await createAuditTrail(adminId, 'Admin', 'Employee created');
}

async function logEmployeeUpdate(adminId) {
    return await createAuditTrail(adminId, 'Admin', 'Employee updated');
}

async function logRoleAssignment(adminId) {
    return await createAuditTrail(adminId, 'Admin', 'Role assigned');
}

async function logTicketCreation(userId, userType) {
    return await createAuditTrail(userId, userType, 'Support ticket created');
}

async function logTicketUpdate(userId, userType) {
    return await createAuditTrail(userId, userType, 'Support ticket updated');
}

async function logTicketResolution(userId, userType) {
    return await createAuditTrail(userId, userType, 'Support ticket resolved');
}

async function logSystemAccess(userId, userType) {
    return await createAuditTrail(userId, userType, 'System module accessed');
}

async function logDataExport(userId, userType) {
    return await createAuditTrail(userId, userType, 'Data exported');
}

async function logBulkOperation(userId, userType) {
    return await createAuditTrail(userId, userType, 'Bulk operation performed');
}

async function logFailedLogin(userId = 'unknown', userType = 'Guest') {
    return await createAuditTrail(userId, userType, 'Failed login attempt');
}

async function logUnauthorizedAccess(userId = 'unknown', userType = 'Guest') {
    return await createAuditTrail(userId, userType, 'Unauthorized access attempt');
}

function getCurrentUserId() {

    return localStorage.getItem('userId') || 
           sessionStorage.getItem('userId') || 
           localStorage.getItem('currentUser') || 
           null;
}

function getCurrentUserType() {

    return localStorage.getItem('userType') || 
           sessionStorage.getItem('userType') || 
           localStorage.getItem('currentUserType') || 
           'Guest';
}

async function logCurrentUserActivity(activity) {
    const userId = getCurrentUserId();
    const userType = getCurrentUserType();
    
    if (!userId) {
        console.warn('No user ID found for audit trail');
        return { success: false, error: 'No user ID found' };
    }
    
    return await createAuditTrail(userId, userType, activity);
}

window.AuditTrailFunctions = {

    createAuditTrail,

    logUserLogin,
    logUserLogout,
    logUserRegistration,
    logPasswordReset,

    logProfileUpdate,
    logProfileView,

    logPropertyView,
    logPropertySearch,
    logPropertyBooking,
    logPropertyCreation,
    logPropertyUpdate,
    logPropertyArchiving,
    logPropertyActivation,

    logBookingCreation,
    logBookingUpdate,
    logBookingCancellation,
    logCheckIn,
    logCheckOut,

    logPaymentInitiation,
    logPaymentCompletion,
    logPaymentFailure,

    logEmployeeCreation,
    logEmployeeUpdate,
    logRoleAssignment,

    logTicketCreation,
    logTicketUpdate,
    logTicketResolution,

    logSystemAccess,
    logDataExport,
    logBulkOperation,

    logFailedLogin,
    logUnauthorizedAccess,

    getCurrentUserId,
    getCurrentUserType,
    logCurrentUserActivity
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AuditTrailFunctions;
}
