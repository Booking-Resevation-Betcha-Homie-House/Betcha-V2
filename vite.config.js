import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '/src', replacement: '/src' },
      { find: '@', replacement: '/src' }
    ]
  },
  build: {
    // Configure module processing
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(js)$/.test(assetInfo.name)) {
            return `js/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
      input: {
        // Main entry point
        main: 'index.html',
        
        // Debug and test pages
        debugPm: 'debug-pm.html',
        loginTestDoc: 'login-test-documentation.html',
        
        // Unauthenticated pages
        login: 'pages/unauth/login.html',
        register: 'pages/unauth/register.html',
        aboutUs: 'pages/unauth/about-us.html',
        faqs: 'pages/unauth/faqs.html',
        rooms: 'pages/unauth/rooms.html',
        searchResult: 'pages/unauth/search-result.html',
        viewProperty: 'pages/unauth/view-property.html',
        privacyPolicy: 'pages/unauth/privacy-policy.html',
        termsCondition: 'pages/unauth/terms-condition.html',
        
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
        
        // Admin function pages
        adminTest1: 'pages/admin/adminFunctions/test1.html',
        
        // Employee pages
        employeeDashboard: 'pages/employee/dashboard.html',
        employeeProfile: 'pages/employee/profile.html',
        pm: 'pages/employee/pm.html',
        psr: 'pages/employee/psr.html',
        tk: 'pages/employee/tk.html',
        ts: 'pages/employee/ts.html',

        // Source JS files
        addAmenity: 'src/addAmenity.js',
        adminNotifications: 'src/admin-notifications.js',
        adminSidebar: 'src/admin-sidebar.js',
        app: 'src/App.jsx',
        calendar: 'src/calendar.js',
        calendar2: 'src/calendar2.js',
        categoryStatusDropdown: 'src/categoryStatusDropdown.js',
        checkInOut: 'src/checkInOut.js',
        date: 'src/date.js',
        employeeSidebarFilter: 'src/employee-sidebar-filter.js',
        faqsJs: 'src/faqs.js',
        fullscreenLoading: 'src/fullscreenLoading.js',
        genTicketInput: 'src/genTicketInput.js',
        guestCount: 'src/guestCount.js',
        IDverifier: 'src/IDverifier.js',
        imageCarousel: 'src/imageCarousel.js',
        imageInput: 'src/imageInput.js',
        locationSearch: 'src/locationSearch.js',
        logoutFunctions: 'src/logout-functions.js',
        mainJsx: 'src/main.jsx',
        messageBox: 'src/messageBox.js',
        modal: 'src/modal.js',
        multipleTabs: 'src/multipleTabs.js',
        navbar: 'src/navbar.js',
        notification: 'src/notification.js',
        notifyService: 'src/notifyService.js',
        pageControl: 'src/page-control.js',
        passwordToggle: 'src/passwordToggle.js',
        paymentFileInput: 'src/paymentFileInput.js',
        paymentMethodOption: 'src/paymentMethodOption.js',
        priceSlider: 'src/priceSlider.js',
        qrSelection: 'src/qrSelection.js',
        ratings: 'src/ratings.js',
        readTextToggle: 'src/readTextToggle.js',
        reservationValidationModal: 'src/reservationValidationModal.js',
        roomsNavigationTabs: 'src/roomsNavigationTabs.js',
        searchBarModal: 'src/searchBarModal.js',
        sideScrollCarousel: 'src/sideScrollCarousel.js',
        simpleLoader: 'src/simple-loader.js',
        skeleton: 'src/skeleton.js',
        supportTicketLayout: 'src/supportTicketLayout.js',
        supportTickets: 'src/supportTickets.js',
        termsConditionJs: 'src/termsCondition.js',
        tkSkeleton: 'src/tkSkeleton.js',
        toastNotification: 'src/toastNotification.js',
        topRoomsChart: 'src/topRoomsChart.js',
        universalLogout: 'src/universal-logout.js',
        userInputs: 'src/userInputs.js'
      }
    }
  },
  base: './' // Use relative paths for assets
})
