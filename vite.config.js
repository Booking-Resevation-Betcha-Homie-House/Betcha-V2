import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Main entry point
        main: 'index.html',
        
        // Test page
        netlifyProxyTest: 'netlify-proxy-test.html',
        
        // Unauthenticated pages
        login: 'pages/unauth/login.html',
        register: 'pages/unauth/register.html',
        aboutUs: 'pages/unauth/about-us.html',
        faqs: 'pages/unauth/faqs.html',
        rooms: 'pages/unauth/rooms.html',
        searchResult: 'pages/unauth/search-result.html',
        viewProperty: 'pages/unauth/view-property.html',
        
        // Authenticated user pages
        profile: 'pages/auth/profile.html',
        editProfile: 'pages/auth/edit-profile.html',
        myBookings: 'pages/auth/my-bookings.html',
        viewBooking: 'pages/auth/view-booking.html',
        confirmPayment: 'pages/auth/confirm-payment.html',
        confirmReservation: 'pages/auth/confirm-reservation.html',
        createTicket: 'pages/auth/create-ticket.html',
        support: 'pages/auth/support.html',
        resetEmail: 'pages/auth/reset-email.html',
        resetPassword: 'pages/auth/reset-password.html',
        
        // Admin pages
        adminDashboard: 'pages/admin/dashboard.html',
        adminLandingPage: 'pages/admin/landing-page.html',
        adminProfile: 'pages/admin/profile.html',
        adminProfileEdit: 'pages/admin/profile-edit.html',
        customers: 'pages/admin/customers.html',
        employees: 'pages/admin/employees.html',
        employeeAdd: 'pages/admin/employee-add.html',
        employeeEdit: 'pages/admin/employee-edit.html',
        employeeView: 'pages/admin/employee-view.html',
        properties: 'pages/admin/property.html',
        propertyAdd: 'pages/admin/property-add.html',
        propertyEdit: 'pages/admin/property-edit.html',
        propertyView: 'pages/admin/property-view.html',
        payments: 'pages/admin/payment.html',
        paymentAdd: 'pages/admin/payment-add.html',
        paymentEdit: 'pages/admin/payment-edit.html',
        roles: 'pages/admin/roles.html',
        rolesAdd: 'pages/admin/roles-add.html',
        rolesEdit: 'pages/admin/roles-edit.html',
        auditTrails: 'pages/admin/audit-trails.html',
        adminFaqs: 'pages/admin/faqs.html',
        
        // Employee pages
        employeeDashboard: 'pages/employee/dashboard.html',
        employeeProfile: 'pages/employee/profile.html',
        pm: 'pages/employee/pm.html',
        psr: 'pages/employee/psr.html',
        tk: 'pages/employee/tk.html',
        ts: 'pages/employee/ts.html',
      }
    }
  },
  base: './' // Use relative paths for assets
})
