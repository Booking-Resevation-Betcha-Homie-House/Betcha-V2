document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent default anchor behavior
        
        // tabs.forEach(t => t.classList.remove("border-b-2", "border-blue-500", "text-blue-500", "font-medium" ));
        // tab.classList.add("border-b-2", "border-primary", "text-blue-500", "font-medium");

        const target = document.querySelector(tab.getAttribute("href"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  });