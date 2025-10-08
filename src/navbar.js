document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');

    menuBtn.addEventListener('click', () => {
      // Close notification dropdown if it's open
      const notificationDropdown = document.getElementById('notificationDropdown');
      if (notificationDropdown && !notificationDropdown.classList.contains('hidden')) {
        notificationDropdown.classList.add('hidden');
      }
      
      dropdownMenu.classList.toggle('hidden');
    });

    // Optional: close the dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
      }
    });
  });