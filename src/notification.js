document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById('notificationDropdown');
  const bellBtn = document.getElementById('notifBellBtnDesktop');

  if (!dropdown || !bellBtn) {
    console.log('Notification dropdown or bell button not found on this page, skipping notification.js setup');
    return;
  }

  // Toggle dropdown
  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const clickedInside = dropdown.contains(e.target) || bellBtn.contains(e.target);
    if (!clickedInside && !dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden');
    }
  });
});
