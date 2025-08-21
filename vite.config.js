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
        main: 'index.html',
        // Add your main pages here for multi-page app
        login: 'pages/unauth/login.html',
        register: 'pages/unauth/register.html',
        adminDashboard: 'pages/admin/dashboard.html',
        landingPage: 'pages/admin/landing-page.html',
        // Add more pages as needed
      }
    }
  },
  base: './' // Use relative paths for assets
})
