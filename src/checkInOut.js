document.addEventListener("DOMContentLoaded", () => {
    const generateTimeOptions = () => {
      const times = [];
      for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 30) {
          const h = hour % 12 === 0 ? 12 : hour % 12;
          const ampm = hour < 12 ? "AM" : "PM";
          const label = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
          const value = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
          times.push({ label, value });
        }
      }
      return times;
    };

    const setupDropdown = (btnId, listId, inputId, displayId) => {
      const btn = document.getElementById(btnId);
      const list = document.getElementById(listId);
      const input = document.getElementById(inputId);
      const display = document.getElementById(displayId);

      btn.addEventListener("click", () => {
        list.classList.toggle("hidden");
      });

      const options = generateTimeOptions();
      list.innerHTML = options.map(opt =>
        `<li data-value="${opt.value}" class="px-4 py-2 hover:bg-neutral-100 active:bg-neutral-100 cursor-pointer font-normal">${opt.label}</li>`
      ).join("");

      list.addEventListener("click", (e) => {
        const li = e.target.closest("li");
        if (li) {
          const time = li.getAttribute("data-value");
          input.value = time;
          display.textContent = li.textContent;
          list.classList.add("hidden");
        }
      });

      document.addEventListener("click", (e) => {
        if (!btn.contains(e.target) && !list.contains(e.target)) {
          list.classList.add("hidden");
        }
      });
    };

    setupDropdown("checkInTimeBtn", "checkInTimeList", "checkInTimeInput", "checkInTimeText");
    setupDropdown("checkOutTimeBtn", "checkOutTimeList", "checkOutTimeInput", "checkOutTimeText");
  });