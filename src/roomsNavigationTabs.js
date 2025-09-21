document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("roomNav");
  const tabs = nav.querySelectorAll(".tab");

  tabs.forEach(tab => {
    tab.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href").substring(1);
      const target = document.getElementById(targetId);

      if (target) {
        const headerOffset = 80; // adjust if sticky nav height changes
        const elementPosition = target.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });
});
