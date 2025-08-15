document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const mobileToggle = document.getElementById('sidebar-toggle');

  const toggleSidebar = () => {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
  };

  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleSidebar);
  }

  if (overlay) {
    overlay.addEventListener('click', toggleSidebar);
  }
});
