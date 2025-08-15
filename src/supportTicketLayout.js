document.addEventListener('DOMContentLoaded', () => {
  const ticketItems = document.querySelectorAll('.ticket-item, .ticket-active');
  const ticketSidebar = document.getElementById('ticketSidebar');
  const ticketMain = document.getElementById('ticketMain');
  const backBtn = document.getElementById('ticketBackBtn');

  if (!ticketSidebar || !ticketMain) return;

  // Ticket click → slide in chat view
  ticketItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        ticketSidebar.classList.add('translate-x-[-100%]');
        ticketMain.classList.remove('hidden');
        ticketMain.classList.remove('translate-x-full');
      }
    });
  });

  // Back button click → slide back to ticket list
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      ticketSidebar.classList.remove('translate-x-[-100%]');
      ticketMain.classList.add('translate-x-full');

      // optional: hide after animation
      setTimeout(() => {
        if (window.innerWidth < 768) {
          ticketMain.classList.add('hidden');
        }
      }, 300);
    });
  }
});
