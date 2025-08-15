document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById('notificationDropdown');
  const menuBtn = document.querySelector('button[onclick="toggleDropdown()"]');
  const markAllBtn = document.querySelector('button[onclick="markAllAsRead()"]');

  // Toggle dropdown
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent triggering document click
    dropdown.classList.toggle('hidden');
  });

  // Mark all as read
  markAllBtn.addEventListener('click', () => {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => {
      n.classList.remove('unread');
      n.classList.add('read');

      const senderName = n.querySelector('p');
      senderName?.classList.remove('text-gray-900');
      senderName?.classList.add('text-gray-500');

      const dot = n.querySelector('.dot-notif');
      if (dot) dot.remove();
    });
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const isClickInside = dropdown.contains(e.target) || menuBtn.contains(e.target);
    if (!isClickInside && !dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden');
    }
  });
});
