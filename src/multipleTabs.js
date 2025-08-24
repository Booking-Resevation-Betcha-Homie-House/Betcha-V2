document.addEventListener('DOMContentLoaded', function () {
  window.setActiveTab = function (groupEl, index) {
    const tabBtns = groupEl.querySelectorAll('.tab-btn');
    const tabContents = groupEl.querySelectorAll('.tab-content');

    tabBtns.forEach((btn, i) => {
      const span = btn.querySelector('span');

      if (i === index) {
        btn.classList.add("bg-white", "font-semibold", "shadow");
        span?.classList.remove("text-neutral-500");
        span?.classList.add("text-primary");
      } else {
        btn.classList.remove("bg-white", "font-semibold", "shadow");
        span?.classList.remove("text-primary");
        span?.classList.add("text-neutral-500");
      }
    });

    tabContents.forEach((content, i) => {
      content.classList.toggle("hidden", i !== index);
    });
  };

  // Auto-bind tab buttons for all tab groups
  document.querySelectorAll('[data-tab-group]').forEach(group => {
    const tabBtns = group.querySelectorAll('.tab-btn');

    tabBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        window.setActiveTab(group, index);
      });
    });

    // Optional: activate first tab by default
    window.setActiveTab(group, 0);
  });
});
