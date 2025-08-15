document.addEventListener('DOMContentLoaded', () => {
  function updateGridLayout() {
    const grids = document.querySelectorAll('.my-grid');

    grids.forEach(grid => {
      const visibleCards = [...grid.children].filter(el => !el.classList.contains('hidden'));
      
      // reset all spans first
      visibleCards.forEach(el => el.classList.remove('md:col-span-2'));

      // if only 1 visible card, make it full width
      if (visibleCards.length === 1) {
        visibleCards[0].classList.add('md:col-span-2');
      }
    });
  }

  // Run on page load
  updateGridLayout();

  // Example: when you manually toggle
  document.querySelector('#card2').classList.toggle('hidden');
  updateGridLayout();
});
