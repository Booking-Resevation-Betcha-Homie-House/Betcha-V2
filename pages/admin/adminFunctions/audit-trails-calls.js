const AUDIT_API_BASE = 'https://betcha-api.onrender.com/audit/create';

/**
 * Create an audit trail entry
 * @param {string} userId - The user's ID
 * @param {string} userType - The type of user (Guest, Employee, Admin)
 * @param {string} activity - Description of the activity performed
 * @returns {Promise<Object>} - Response from the API
 */
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
            const errorText = await response.text();
            console.error('Audit API Error Response:', errorText);
            throw new Error(`Audit trail creation failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating audit trail:', error);
        // Don't throw error to prevent breaking main functionality
        return { success: false, error: error.message };
    }
}

// ===== AUTHENTICATION AUDIT TRAILS =====

/**
 * Log user login activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logUserLogin(userId, userType) { // working
    return await createAuditTrail(userId, userType, 'User logged in');
}

/**
 * Log user logout activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logUserLogout(userId, userType) { // not working
    return await createAuditTrail(userId, userType, 'User logged out');
}

/**
 * Log user registration activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logUserRegistration(userId, userType) { // not working customer side
    return await createAuditTrail(userId, userType, 'User registered');
}

/**
 * Log password reset activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPasswordReset(userId, userType) { // still dont know if will be used
    return await createAuditTrail(userId, userType, 'Password reset requested');
}

// ===== PROFILE MANAGEMENT AUDIT TRAILS =====

/**
 * Log profile update activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logProfileUpdate(userId, userType) { // not working for both sides
    return await createAuditTrail(userId, userType, 'Profile updated');
}

/**
 * Log profile view activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logProfileView(userId, userType) { // not implemented for both sides
    return await createAuditTrail(userId, userType, 'Profile viewed');
}

// ===== PROPERTY MANAGEMENT AUDIT TRAILS =====

/**
 * Log property view activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPropertyView(userId, userType) { // not working admin side
    return await createAuditTrail(userId, userType, 'Property viewed');
}

/**
 * Log property search activity
 * @param {string} userId - User type
 * @param {string} userType - User type
 */
async function logPropertySearch(userId, userType) { //redundant?
    return await createAuditTrail(userId, userType, 'Property search performed');
}

/**
 * Log property booking activity (alias for logBookingCreation)
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPropertyBooking(userId, userType) { // redundant - same as logBookingCreation
    return await createAuditTrail(userId, userType, 'Property booked');
}

/**
 * Log property creation (Admin/Employee)
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPropertyCreation(userId, userType) { //being called but not working? admin side
    return await createAuditTrail(userId, userType, 'Property created');
}

/**
 * Log property update (Admin/Employee)
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPropertyUpdate(userId, userType) { // not working admin side 
    return await createAuditTrail(userId, userType, 'Property updated');
}

/**
 * Log property archiving (Admin/Employee)
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPropertyArchiving(userId, userType) { // not implemented admin side
    return await createAuditTrail(userId, userType, 'Property archived');
}

/**
 * Log property activation (Admin/Employee)
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPropertyActivation(userId, userType) {// being called but not working? admin side
    return await createAuditTrail(userId, userType, 'Property activated');
}

// ===== BOOKING MANAGEMENT AUDIT TRAILS =====

/**
 * Log booking creation
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logBookingCreation(userId, userType) {
    return await createAuditTrail(userId, userType, 'Booking created');
}

/**
 * Log booking update
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logBookingUpdate(userId, userType) { // not implemented
    return await createAuditTrail(userId, userType, 'Booking updated');
}

/**
 * Log booking cancellation
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logBookingCancellation(userId, userType) {//working
    return await createAuditTrail(userId, userType, 'Booking cancelled');
}

/**
 * Log check-in activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logCheckIn(userId, userType) { // working 
    return await createAuditTrail(userId, userType, 'Check-in performed');
}

/**
 * Log check-out activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logCheckOut(userId, userType) { // not working
    return await createAuditTrail(userId, userType, 'Check-out performed');
}

// ===== PAYMENT AUDIT TRAILS =====

/**
 * Log payment initiation
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPaymentInitiation(userId, userType) { //working
    return await createAuditTrail(userId, userType, 'Payment initiated');
}

/**
 * Log payment completion
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPaymentCompletion(userId, userType) {//working
    return await createAuditTrail(userId, userType, 'Payment completed');
}

/**
 * Log payment failure
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPaymentFailure(userId, userType) { // working
    return await createAuditTrail(userId, userType, 'Payment failed');
}

/**
 * Log payment mode creation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logPaymentModeCreation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Payment mode created');
}

/**
 * Log payment mode deactivation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logPaymentModeDeactivation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Payment mode deactivated');
}

/**
 * Log payment mode activation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logPaymentModeActivation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Payment mode activated');
}

// ===== ADMIN/EMPLOYEE MANAGEMENT AUDIT TRAILS =====
//add an audit trail for admin Deleting/archiving a role

/**
 * Log employee creation (Admin only)
 * @param {string} adminId - Admin user ID
 */
async function logEmployeeCreation(adminId) { // working
    return await createAuditTrail(adminId, 'Admin', 'Employee created');
}

/**
 * Log employee update (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logEmployeeUpdate(adminId, userType = 'Admin') { // not working
    return await createAuditTrail(adminId, userType, 'Employee updated');
}

/**
 * Log employee deactivation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logEmployeeDeactivation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Employee deactivated');
}

/**
 * Log employee activation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logEmployeeActivation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Employee activated');
}

/**
 * Log role assignment (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logRoleAssignment(adminId, userType = 'Admin') {// not working 
    return await createAuditTrail(adminId, userType, 'Role assigned');
}

/**
 * Log role creation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logRoleCreation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Role created');
}

/**
 * Log role deactivation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logRoleDeactivation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Role deactivated');
}

/**
 * Log role activation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logRoleActivation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Role activated');
}

/**
 * Log customer deactivation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logCustomerDeactivation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Customer deactivated');
}

/**
 * Log customer activation (Admin only)
 * @param {string} adminId - Admin user ID
 * @param {string} userType - User type (default: 'Admin')
 */
async function logCustomerActivation(adminId, userType = 'Admin') {
    return await createAuditTrail(adminId, userType, 'Customer activated');
}

/**
 * Log booking reschedule activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logBookingReschedule(userId, userType) {
    return await createAuditTrail(userId, userType, 'Booking rescheduled');
}

/**
 * Log password update activity
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPasswordUpdate(userId, userType) {
    return await createAuditTrail(userId, userType, 'Password updated');
}

/**
 * Log payment method status change
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPaymentMethodUpdate(userId, userType) {
    return await createAuditTrail(userId, userType, 'Payment method status updated');
}

// ===== SUPPORT TICKET AUDIT TRAILS =====

/**
 * Log support ticket creation
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logTicketCreation(userId, userType) { // not working
    return await createAuditTrail(userId, userType, 'Support ticket created');
}

/**
 * Log support ticket update
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logTicketUpdate(userId, userType) {// not working
    return await createAuditTrail(userId, userType, 'Support ticket updated');
}

/**
 * Log support ticket resolution
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logTicketResolution(userId, userType) {// not working
    return await createAuditTrail(userId, userType, 'Support ticket resolved');
}

// ===== SYSTEM ACTIVITY AUDIT TRAILS =====

/**
 * Log system access (Admin/Employee)
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logSystemAccess(userId, userType) { // working
    return await createAuditTrail(userId, userType, 'System module accessed');
}

/**
 * Log data export (Admin/Employee)
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logDataExport(userId, userType) { // not being called? // got commented out
    return await createAuditTrail(userId, userType, 'Data exported');
}

/**
 * Log bulk operation (Admin/Employee)
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logBulkOperation(userId, userType) { //redundant?
    return await createAuditTrail(userId, userType, 'Bulk operation performed');
}

/**
 * Log PSR summary report generation (Employee)
 * @param {string} userId - User ID
 * @param {string} userType - User type
 */
async function logPSRReportGeneration(userId, userType) {
    return await createAuditTrail(userId, userType, 'PSR summary report generated');
}

// ===== ERROR AND SECURITY AUDIT TRAILS =====

/**
 * Log failed login attempt
 * @param {string} userId - User ID (if known)
 * @param {string} userType - User type (if known)
 */
async function logFailedLogin(userId = 'unknown', userType = 'Guest') {
    return await createAuditTrail(userId, userType, 'Failed login attempt');
}

/**
 * Log unauthorized access attempt
 * @param {string} userId - User ID (if known)
 * @param {string} userType - User type (if known)
 */
async function logUnauthorizedAccess(userId = 'unknown', userType = 'Guest') {
    return await createAuditTrail(userId, userType, 'Unauthorized access attempt');
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get current user ID from localStorage or session
 * @returns {string|null} - Current user ID or null if not found
 */
function getCurrentUserId() {
    // This should be implemented based on your authentication system
    // Common patterns include localStorage, sessionStorage, or cookies
    return localStorage.getItem('userId') || 
           sessionStorage.getItem('userId') || 
           localStorage.getItem('currentUser') || 
           null;
}

/**
 * Get current user type from localStorage or session
 * @returns {string} - Current user type or 'Guest' if not found
 */
function getCurrentUserType() {
    // This should be implemented based on your authentication system
    return localStorage.getItem('userType') || 
           sessionStorage.getItem('userType') || 
           localStorage.getItem('currentUserType') || 
           'Guest';
}

/**
 * Create audit trail with current user context
 * @param {string} activity - Description of the activity
 * @returns {Promise<Object>} - Response from the API
 */
async function logCurrentUserActivity(activity) {
    const userId = getCurrentUserId();
    const userType = getCurrentUserType();
    
    if (!userId) {
        console.warn('No user ID found for audit trail');
        return { success: false, error: 'No user ID found' };
    }
    
    return await createAuditTrail(userId, userType, activity);
}

// Export all functions for use in other modules
window.AuditTrailFunctions = {
    // Core function
    createAuditTrail,
    
    // Authentication
    logUserLogin,
    logUserLogout,
    logUserRegistration,
    logPasswordReset,
    
    // Profile management
    logProfileUpdate,
    logProfileView,
    
    // Property management
    logPropertyView,
    logPropertySearch,
    logPropertyBooking,
    logPropertyCreation,
    logPropertyUpdate,
    logPropertyArchiving,
    logPropertyActivation,
    
    // Booking management
    logBookingCreation,
    logBookingUpdate,
    logBookingCancellation,
    logCheckIn,
    logCheckOut,
    
    // Payment management
    logPaymentInitiation,
    logPaymentCompletion,
    logPaymentFailure,
    logPaymentModeCreation,
    logPaymentModeDeactivation,
    logPaymentModeActivation,
    
    // Admin/Employee management
    logEmployeeCreation,
    logEmployeeUpdate,
    logEmployeeDeactivation,
    logEmployeeActivation,
    logRoleAssignment,
    logRoleCreation,
    logRoleDeactivation,
    logRoleActivation,
    logCustomerDeactivation,
    logCustomerActivation,
    logBookingReschedule,
    logPasswordUpdate,
    logPaymentMethodUpdate,
    
    // Support tickets
    logTicketCreation,
    logTicketUpdate,
    logTicketResolution,
    
    // System activities
    logSystemAccess,
    logDataExport,
    logBulkOperation,
    logPSRReportGeneration,
    
    // Security
    logFailedLogin,
    logUnauthorizedAccess,
    
    // Utility functions
    getCurrentUserId,
    getCurrentUserType,
    logCurrentUserActivity
};
