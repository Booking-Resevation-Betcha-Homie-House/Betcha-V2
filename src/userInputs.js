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
      // Handle different option formats: simple strings, month objects, or options with pills
      let displayText, value, isDisabled = false, pillText = null;
      
      if (typeof opt === 'string') {
        displayText = opt;
        value = opt;
      } else if (opt.display) {
        // Month object format
        displayText = opt.display;
        value = opt.value;
      } else if (opt.text) {
        // New format with pills and disabled state
        displayText = opt.text;
        value = opt.value || opt.text;
        isDisabled = opt.disabled || false;
        pillText = opt.pill || null;
      }
      
      li.className = `px-4 py-2 cursor-pointer font-normal font-manrope flex items-center justify-between ${
        isDisabled 
          ? 'text-neutral-400 cursor-not-allowed bg-neutral-50' 
          : 'hover:bg-neutral-100 active:bg-neutral-100 text-primary-text'
      }`;
      
      // Create content container
      const content = document.createElement('div');
      content.className = 'flex items-center gap-2 flex-1';
      content.textContent = displayText;
      
      li.appendChild(content);
      
      // Add pill if specified
      if (pillText) {
        const pill = document.createElement('span');
        // Yellow color for all development status pills
        pill.className = 'px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium';
        pill.textContent = pillText;
        li.appendChild(pill);
      }
      
      // Only add click handler if not disabled
      if (!isDisabled) {
        li.onclick = () => {
          // Store the actual value as a data attribute
          display.textContent = displayText;
          display.dataset.value = value;
          display.classList.remove("text-neutral-400");
          display.classList.add("text-primary-text");
          list.classList.add("hidden");
          icon.classList.remove("rotate-180");
        };
      }
      
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
  setupDropdown("ID", [
    { text: "Driver's License", value: "Driver's License" },
    { text: "Passport", value: "Passport", disabled: true, pill: "In Development: AI Training" },
    { text: "SSS ID", value: "SSS ID", disabled: true, pill: "In Development: AI Training" },
    { text: "TIN ID", value: "TIN ID", disabled: true, pill: "In Development: AI Training" },
    { text: "National ID", value: "National ID", disabled: true, pill: "In Development: AI Training" },
    { text: "Voter's ID", value: "Voter's ID", disabled: true, pill: "In Development: AI Training" }
  ], "Select valid ID");

window.goToStep1 = () => {
  document.getElementById("step3").classList.add("hidden");
  document.getElementById("step2").classList.add("hidden");
  document.getElementById("step1").classList.remove("hidden");
  document.getElementById("progress-bar").style.width = "33.33%";
  document.getElementById("step-label").textContent = "Step 1 of 3";
};

window.goToStep3 = () => {
  document.getElementById("step2").classList.add("hidden");
  document.getElementById("step1").classList.add("hidden");
  document.getElementById("step3").classList.remove("hidden");
  document.getElementById("progress-bar").style.width = "100%";
  document.getElementById("step-label").textContent = "Step 3 of 3";
};



  //OTP non-numeric
  document.querySelectorAll('.otp-input').forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  });

});

