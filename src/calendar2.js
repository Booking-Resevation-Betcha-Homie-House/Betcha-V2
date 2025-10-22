document.addEventListener("DOMContentLoaded", () => {
  // Initialize with empty arrays, will be populated by property-view.js
  let unavailableDates = [];
  let bookedDates = [];
  let maintenanceDates = [];
  let selectedDate = null; // Single selected date instead of Set

  document.querySelectorAll(".calendar-instance").forEach(calendarEl => {
    let currentDate = new Date();

    // Function to handle external date selection
    window.selectDate = (date) => {
      selectedDate = date; // Set single date
      render();
    };

    const leftLabel = calendarEl.querySelector(".leftMonthLabel");
    const leftCal = calendarEl.querySelector(".leftCalendar");

    const render = () => {
      const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      leftLabel.textContent = current.toLocaleString("default", { month: "long", year: "numeric" });
      leftCal.innerHTML = buildCalendar(current);
    };

    const buildCalendar = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDay = new Date(year, month, 1).getDay();

      let html = `
        <div class="grid grid-cols-7 gap-1 text-center font-manrope font-semibold border-b border-neutral-300 pb-1 mb-2">
          ${['S','M','T','W','T','F','S'].map(d => `<div class="w-full aspect-square flex items-center justify-center text-xs">${d}</div>`).join("")}
        </div>
        <div class="grid grid-cols-7 gap-1 text-center">
      `;

      for (let i = 0; i < startDay; i++) html += `<div></div>`;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isBooked = bookedDates.includes(dateStr);
        const isMaintenance = maintenanceDates.includes(dateStr);
        const isUnavailable = unavailableDates.includes(dateStr);
        const isSelected = selectedDate === dateStr;

        let classes = "w-full aspect-square text-xs flex items-center justify-center rounded cursor-pointer transition ";
        
        if (isBooked) {
          classes += "bg-primary text-white font-bold";
          if (isSelected) {
            classes += " ring-4 ring-gray-600 ring-offset-2";
          }
        } else if (isMaintenance) {
          classes += "bg-rose-700 text-white font-bold";
          if (isSelected) {
            classes += " ring-4 ring-gray-600 ring-offset-2";
          }
        } else if (isUnavailable) {
          classes += "bg-neutral-200 text-neutral-400 cursor-not-allowed";
          if (isSelected) {
            classes += " ring-4 ring-gray-600 ring-offset-2";
          }
        } else if (isSelected) {
          classes += "bg-gray-300 text-gray-800 font-bold ring-4 ring-gray-600 ring-offset-2 scale-110";
        } else {
          classes += "bg-background text-black hover:bg-secondary";
        }

        html += `<div class="${classes}" data-date="${dateStr}">${d}</div>`;
      }

      html += "</div>";
      return html;
    };

    // Click listener for dates
    calendarEl.addEventListener("click", e => {
      const dateEl = e.target.closest("[data-date]");
      if (dateEl) {
        const clickedDate = dateEl.dataset.date;
        
        // Single selection - replace previous selection
        selectedDate = clickedDate;

        // Dispatch custom event with selected date
        calendarEl.dispatchEvent(new CustomEvent('datesSelected', {
          detail: {
            dates: [selectedDate] // Always send as array for compatibility
          },
          bubbles: true
        }));

        render();
      }
    });

    // Month nav
    calendarEl.querySelector(".prevMonth").addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      render();
    });

    calendarEl.querySelector(".nextMonth").addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      render();
    });

    // Listen for calendar data updates from property-view.js
    calendarEl.addEventListener("calendarDataUpdated", (event) => {
      console.log("📅 Calendar data update received in calendar2.js:", event.detail);
      
      // Update the date arrays
      bookedDates = event.detail.bookedDates || [];
      maintenanceDates = event.detail.maintenanceDates || [];
      unavailableDates = event.detail.allUnavailableDates || [];
      
      console.log("📅 Updated dates - Booked:", bookedDates, "Maintenance:", maintenanceDates);
      
      // Re-render the calendar with new data
      render();
    });

    // Initial render
    render();
  });
});
