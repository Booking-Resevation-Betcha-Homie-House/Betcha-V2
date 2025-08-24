document.addEventListener('DOMContentLoaded', () => {

  const months = [
    { display: "Jan", value: "1" },
    { display: "Feb", value: "2" },
    { display: "Mar", value: "3" },
    { display: "Apr", value: "4" },
    { display: "May", value: "5" },
    { display: "Jun", value: "6" },
    { display: "Jul", value: "7" },
    { display: "Aug", value: "8" },
    { display: "Sep", value: "9" },
    { display: "Oct", value: "10" },
    { display: "Nov", value: "11" },
    { display: "Dec", value: "12" }
  ];
  const thisYear = new Date().getFullYear();

  function setupDropdown(id, options, placeholder = "Select") {
    const btn = document.getElementById(`${id}DropdownBtn`);
    const list = document.getElementById(`${id}DropdownList`);
    const display = document.getElementById(`selected${capitalize(id)}`);
    const icon = document.getElementById(`${id}DropdownIcon`);

    // Set placeholder
    display.textContent = placeholder;

    // Toggle dropdown
    btn.addEventListener("click", () => {
      list.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });

    // Fill options
    options.forEach(opt => {
      const li = document.createElement("li");
      // Handle both simple strings and month objects
      const displayText = typeof opt === 'object' ? opt.display : opt;
      const value = typeof opt === 'object' ? opt.value : opt;
      
      li.textContent = displayText;
      li.className = "px-4 py-2 hover:bg-neutral-100 active:bg-neutral-100 cursor-pointer font-normal";
      li.onclick = () => {
        // Store the actual value as a data attribute
        display.textContent = displayText;
        display.dataset.value = value;
        display.classList.remove("text-gray-400");
        display.classList.add("text-primary-text");
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");
      };
      list.appendChild(li);
    });

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !list.contains(e.target)) {
        list.classList.add("hidden");
        icon.classList.remove("rotate-180");
      }
    });
  }

  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

  // 🧠 Generate data
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const years = Array.from({ length: thisYear - 1959 }, (_, i) => (thisYear - i).toString());

  // ⚙️ Initialize all dropdowns
  setupDropdown("sex", ["Male", "Female", "Other"], "Sex");
  setupDropdown("month", months, "Month");
  setupDropdown("day", days, "Day");
  setupDropdown("year", years, "Year");

  window.goToStep2 = () => {
  document.getElementById("step1").classList.add("hidden");
  document.getElementById("step2").classList.remove("hidden");
  document.getElementById("progress-bar").style.width = "100%";
  document.getElementById("step-label").textContent = "Step 2 of 2";
};

window.goToStep1 = () => {
  document.getElementById("step2").classList.add("hidden");
  document.getElementById("step1").classList.remove("hidden");
  document.getElementById("progress-bar").style.width = "50%";
  document.getElementById("step-label").textContent = "Step 1 of 2";
};

  //OTP non-numeric
  document.querySelectorAll('.otp-input').forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  });

});

