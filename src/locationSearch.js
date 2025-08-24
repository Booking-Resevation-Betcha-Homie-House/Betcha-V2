document.addEventListener("DOMContentLoaded", () => {
      const locationInput = document.getElementById("locationInput");
      const locationDropdown = document.getElementById("locationDropdown");

      const locations = ["Quezon City", "Makati", "Taguig", "Pasig", "Marikina"];

      // Add options dynamically
      locations.forEach(location => {
        const li = document.createElement("li");
        li.textContent = location;
        li.className = "px-4 py-2 hover:bg-neutral-100 cursor-pointer transition-all";

        li.onclick = () => {
          locationInput.value = location;
          locationDropdown.classList.add("hidden");
        };

        locationDropdown.appendChild(li);
      });

      // Show dropdown on focus
      locationInput.addEventListener("focus", () => {
        locationDropdown.classList.remove("hidden");
      });

      // Hide dropdown on click outside
      document.addEventListener("click", (e) => {
        if (!locationInput.contains(e.target) && !locationDropdown.contains(e.target)) {
          locationDropdown.classList.add("hidden");
        }
      });
    });