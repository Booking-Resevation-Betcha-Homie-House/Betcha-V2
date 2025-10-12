# Global Functions Summary

This document lists all functions that have been made global (attached to `window` object) to work with HTML `onclick`, `onchange`, and `onload` handlers in the Betcha-V2 project.

## ✅ COMPLETED - Functions Made Global

### 1. **Admin Functions**

#### **Customers** (`pages/admin/adminFunctions/customers-functions.js`)
- ✅ `window.clearSearch` - Clear customer search input
- ✅ `window.retryLoadCustomers` - Retry loading customers after error
- ✅ `window.setActiveTab` - Switch between customer tabs

#### **Audit Trails** (`pages/admin/adminFunctions/audit-trail-functions.js`)
- ✅ `window.fetchAuditTrails` - Fetch audit trail data
- ✅ `window.setActiveAuditTab` - Switch between audit trail tabs

#### **Property Management** (`pages/admin/adminFunctions/property-view.js`)
- ✅ `window.openMaintenanceModal` - Open maintenance modal
- ✅ `window.closeMaintenanceModal` - Close maintenance modal
- ✅ `window.saveMaintenanceDates` - Save maintenance dates
- ✅ `window.setQuickMaintenanceDate` - Set quick date shortcuts
- ✅ `window.removeMaintenanceDate` - Remove maintenance date
- ✅ `window.setReportsActiveTab` - Switch between report tabs
- ✅ `window.goToEditPage` - Navigate to edit page

#### **Property Edit** (`pages/admin/adminFunctions/property-edit-functions-clean.js`)
- ✅ `window.deleteExistingImage` - Delete existing property image
- ✅ `window.removeImagePreview` - Remove image preview
- ✅ `window.uploadAllImages` - Upload all selected images
- ✅ `window.removeCustomAmenity` - Remove custom amenity (already global)

#### **Landing Page** (`pages/admin/adminFunctions/landing-page-functions.js`)
- ✅ `window.handlePropertySelection` - Handle property checkbox selection
- ✅ `window.removeSelectedProperty` - Remove selected property

#### **Payment** (`pages/admin/adminFunctions/payment-functions.js`)
- ✅ `window.editPayment` - Edit payment method
- ✅ `window.deletePayment` - Delete/toggle payment method
- ✅ `window.loadPaymentMethods` - Load payment methods

#### **Employees** (`pages/admin/adminFunctions/employees-functions.js`)
- ✅ `window.retryLoad` - Retry loading employees

#### **Employee Add** (`pages/admin/adminFunctions/employees-add-functions.js`)
- ✅ `window.removeRole` - Remove role from selection
- ✅ `window.removeProperty` - Remove property from selection

#### **Employee Edit** (`pages/admin/adminFunctions/employee-edit-functions.js`)
- ✅ `window.discardChanges` - Discard changes and return

#### **Roles** (`pages/admin/adminFunctions/roles-functions.js`)
- ✅ `window.editRole` - Edit role
- ✅ `window.deleteRole` - Delete role

#### **FAQs** (`pages/admin/adminFunctions/faqs-functions.js`)
- ✅ `window.getAllFAQS` - Fetch all FAQs

---

### 2. **Employee Functions**

#### **Dashboard** (`pages/employee/employeeFunctions/employeeDashboard.js`)
- ✅ `window.loadAndPopulateTickets` - Load and display tickets
- ✅ `window.loadAndPopulateTransactions` - Load and display transactions
- ✅ `window.loadAndPopulateTodayCheckins` - Load today's check-ins

#### **Property Manager** (`pages/employee/employeeFunctions/pm-functions.js`)
- ✅ `window.openEndBookingModal` - Open end booking modal
- ✅ `window.loadTodaysCheckins` - Load today's check-ins

#### **Ticket Specialist** (`pages/employee/employeeFunctions/ts-functions.js`)
- ✅ `window.setActiveTab` - Switch between tabs (already global)

---

### 3. **Auth/User Functions**

#### **My Bookings** (`pages/auth/authFunctions/my-bookings-functions.js`)
- ✅ `window.setActiveTab` - Switch between booking tabs (already global as `setActiveBookingTab`)
- ✅ `window.navigateToBooking` - Navigate to booking details
- ✅ `window.openToRateModal` - Open rating modal
- ✅ `window.fetchAndRenderBookings` - Fetch and render all bookings

#### **View Booking** (`pages/auth/authFunctions/view-booking-functions.js`)
- ✅ `window.clearRescheduleSelection` - Clear reschedule date selection

#### **Confirm Reservation** (`pages/auth/authFunctions/confirm-reservation-functions.js`)
- ✅ `window.navigateToConfirmReservation` - Navigate to confirm reservation page (already global)

---

### 4. **Unauth/Public Functions**

#### **FAQs** (`src/faqs.js`)
- ✅ `window.toggleFaq` - Toggle FAQ accordion

#### **Landing Page** (`pages/unauth/unauthFunctions/landingPage-functions.js`)
- ✅ `window.toggleFaq` - Toggle FAQ accordion

#### **Registration** (`pages/unauth/unauthFunctions/registerPage-functions.js`)
- ✅ `window.goToStep1` - Navigate to registration step 1
- ✅ `window.goToStep3` - Navigate to registration step 3
- ✅ `window.goBackToStep2` - Navigate back to step 2
- ✅ `window.restartRegistration` - Restart registration process
- ✅ `window.closeOCRErrorModal` - Close OCR error modal

---

## ⚠️ MISSING FUNCTIONS (Need to be created/implemented)

These functions are called in HTML but don't exist yet in JS files:

### 1. **Notification Functions**
- ❌ `markAllAsRead()` - Called in multiple pages (pm.html, edit-profile.html, profile.html, view-booking.html, roles-add.html, roles-edit.html)
  - **Location**: Should be added to notification handling files
  - **Files using it**: 
    - `pages/employee/pm.html`
    - `pages/auth/edit-profile.html`
    - `pages/auth/profile.html`
    - `pages/auth/view-booking.html`
    - `pages/admin/roles-add.html`
    - `pages/admin/roles-edit.html`

### 2. **Form Functions**
- ❌ `focusRadio()` - Called in `pages/auth/confirm-reservation.html` as `onload="focusRadio()"`
  - **Purpose**: Auto-focus on payment type radio buttons
  - **Should be added to**: `pages/auth/authFunctions/confirm-reservation-functions.js`

### 3. **Tab Functions** (May need implementation)
- ⚠️ `setActiveTab()` - Called in multiple pages but implementations vary
  - Some pages have it, some might not
  - **Check these files**:
    - `pages/unauth/rooms.html` - needs global setActiveTab
    - `pages/unauth/view-property.html` - needs global setActiveTab

### 4. **Property Functions** (May need implementation)
- ⚠️ `setLocationTabActive()` - Called in property-add.html and property-edit.html
  - **Should be added to**: property-add-functions.js and property-edit-functions-clean.js

- ⚠️ `hideManualModeNotification()` - Called in property-add.html and property-edit.html
  - **Should be added to**: property-add-functions.js and property-edit-functions-clean.js

---

## 📋 NEXT STEPS

1. **Implement `markAllAsRead()` function**:
   - Create a notification service or add to existing notification JS
   - Make it globally available with `window.markAllAsRead`

2. **Implement `focusRadio()` function**:
   - Add to `confirm-reservation-functions.js`
   - Make it globally available with `window.focusRadio`

3. **Check and implement tab functions**:
   - Verify `setActiveTab()` exists for rooms.html and view-property.html
   - Add if missing

4. **Implement property location functions**:
   - Add `setLocationTabActive()` to property add/edit files
   - Add `hideManualModeNotification()` to property add/edit files

5. **Test all onclick handlers**:
   - Go through each HTML file
   - Click buttons with onclick handlers
   - Verify no console errors about undefined functions

---

## 🔍 HOW TO VERIFY

Run this in browser console on any page:

```javascript
// Check if functions are globally available
const functionsToCheck = [
  'clearSearch',
  'retryLoadCustomers',
  'setActiveTab',
  'fetchAuditTrails',
  'setActiveAuditTab',
  'openMaintenanceModal',
  'closeMaintenanceModal',
  'saveMaintenanceDates',
  'loadPaymentMethods',
  'editPayment',
  'deletePayment',
  'toggleFaq',
  'markAllAsRead', // Should fail
  'focusRadio' // Should fail
];

functionsToCheck.forEach(fn => {
  console.log(`${fn}:`, typeof window[fn] !== 'undefined' ? '✅' : '❌');
});
```

---

## 📝 NOTES

- All functions attached to `window` object are accessible from HTML onclick/onchange/onload attributes
- ES6 modules require explicit `window.functionName = functionName` to make functions global
- Some functions were already global (marked with "already global" in comments)
- Lint errors for unused functions can be ignored if they're called from HTML

