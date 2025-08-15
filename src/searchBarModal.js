document.addEventListener("DOMContentLoaded", () => {
  const tabBtns = document.querySelectorAll(".tabBtn");
  const tabContents = document.querySelectorAll(".tabContent");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");

      // Hide all tab contents
      tabContents.forEach((content) => content.classList.add("hidden"));

      // Show the selected one
      const targetContent = document.getElementById(target);
      if (targetContent) {
        targetContent.classList.remove("hidden");
      }

      // Optional: active tab styling
      tabBtns.forEach((b) => b.classList.remove("border-b-2", "border-primary"));
      btn.classList.add("border-b-2", "border-primary");
    });
  });
});
