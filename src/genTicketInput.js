document.addEventListener('DOMContentLoaded', () => {
  console.log("Ticket dropdowns JS loaded");

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function setupDropdown(id, options, placeholder = "Select") {
    const btn = document.getElementById(`${id}DropdownBtn`);
    const list = document.getElementById(`${id}DropdownList`);
    const display = document.getElementById(`selected${capitalize(id)}`);
    const icon = document.getElementById(`${id}DropdownIcon`);

    // Set initial text
    display.textContent = placeholder;

    // Toggle open/close
    btn.addEventListener("click", () => {
      list.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });

    // Fill dropdown list
    options.forEach(opt => {
      const li = document.createElement("li");
      li.textContent = opt;
      li.className = "px-4 py-2 hover:bg-neutral-100 cursor-pointer transition-all";

      li.onclick = () => {
        display.textContent = opt;
        display.classList.remove("text-gray-400");
        display.classList.add("text-primary-text");
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");

        if (id === "concern") {
            const otherInput = document.getElementById("otherConcernWrapper");
            if (opt === "Others") {
                otherInput.classList.remove("hidden");
            } else {
                otherInput.classList.add("hidden");
            }
        }
      };
      list.appendChild(li);
    });

    // Close dropdown if clicked outside
    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !list.contains(e.target)) {
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");
      }
    });
  }

  // Your dropdown data
  const agents = ["CS - Jen", "CS - Mark", "CS - Erika", "CS - Bryan"];
  const concerns = ["Location", "Appliances", "Amenities", "Payment", "Others"];

  // Initialize them both
  setupDropdown("agent", agents, "Select a Customer Service Agent");
  setupDropdown("concern", concerns, "Select a Concern");
});