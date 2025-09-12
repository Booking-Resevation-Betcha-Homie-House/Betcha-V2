document.addEventListener('DOMContentLoaded', () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const thisYear = new Date().getFullYear();

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const years = Array.from({ length: thisYear - 1959 }, (_, i) => (thisYear - i).toString());

  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

  function setupDropdown(id, options, placeholder = "Select") {
    const btn = document.getElementById(`${id}DropdownBtn`);
    const list = document.getElementById(`${id}DropdownList`);
    const display = document.getElementById(`selected${capitalize(id)}`);
    const icon = document.getElementById(`${id}DropdownIcon`);

    if (!btn || !list || !display || !icon) return; 

    display.textContent = placeholder;

    btn.addEventListener("click", () => {
      list.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });

    options.forEach(opt => {
      const li = document.createElement("li");
      li.textContent = opt;
      li.className = "px-4 py-2 hover:bg-neutral-100 active:bg-neutral-100 cursor-pointer font-normal";
      li.onclick = () => {
        display.textContent = opt;
        display.classList.remove("text-muted");
        display.classList.add("text-primary-text");
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");
      };
      list.appendChild(li);
    });

    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !list.contains(e.target)) {
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");
      }
    });
  }

  setupDropdown("month", months, "Month");
  setupDropdown("day", days, "Day");
  setupDropdown("year", years, "Year");
});
