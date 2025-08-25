document.addEventListener("DOMContentLoaded", () => {
  // Initialize with empty arrays, will be populated by property-view.js
  let unavailableDates = [];
  let bookedDates = [];
  let maintenanceDates = [];
  let selectedDates = new Set();
  let tempDates = null; // Store dates temporarily while preview is active
  let hasConfirmedDates = false; // Track if dates have been confirmed
  const confirmButton = document.getElementById('confirmDate');
  const calendarContainer = document.getElementById('calendarContainer');

  // Function to handle preview restoration
  const restoreMultipleSelection = () => {
    if (!hasConfirmedDates && tempDates) {
      selectedDates.clear();
      tempDates.forEach(date => selectedDates.add(date));
      tempDates = null;
      render();
    }
  };

  // Handle mouse leaving calendar container
  if (calendarContainer) {
    calendarContainer.addEventListener('mouseleave', (e) => {
      // Only restore if not moving to the confirm button
      if (!confirmButton.contains(e.relatedTarget)) {
        restoreMultipleSelection();
      }
    });
  }

  document.querySelectorAll(".calendar-instance").forEach(calendarEl => {
    let currentDate = new Date();

    // Track mouse movement towards confirm button
    calendarEl.addEventListener('mousemove', (e) => {
      if (!confirmButton || selectedDates.size <= 1) return;

      const buttonRect = confirmButton.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Calculate if mouse is moving towards the button
      const isMovingTowardsButton = 
        mouseX <= buttonRect.right + 100 && // Add some margin for detection
        mouseX >= buttonRect.left - 100 &&
        mouseY <= buttonRect.bottom + 50 &&
        mouseY >= buttonRect.top - 50;

      // If moving towards button and not already in preview mode
      if (isMovingTowardsButton && !isMovingToConfirm && !tempDates) {
        isMovingToConfirm = true;
        // Store current selection and show preview
        tempDates = new Set(selectedDates);
        const lastDate = Array.from(selectedDates).pop();
        selectedDates.clear();
        selectedDates.add(lastDate);
        render();
      }
      // If moving away from button and was in preview mode
      else if (!isMovingTowardsButton && isMovingToConfirm) {
        isMovingToConfirm = false;
        // Restore multiple selection if we haven't clicked confirm
        if (tempDates) {
          selectedDates.clear();
          tempDates.forEach(date => selectedDates.add(date));
          tempDates = null;
          render();
        }
      }
    });

    // Function to handle external date selection
    window.selectDate = (date) => {
      selectedDates.clear(); // Clear previous selections
      selectedDates.add(date);
      isMultiSelectEnabled = false;
      render();
    };

    // Handle confirm button interactions
    if (confirmButton) {
      confirmButton.addEventListener('mouseenter', () => {
        if (!hasConfirmedDates && selectedDates.size > 1) {
          // Store current selection
          tempDates = new Set(selectedDates);
          // Show only the last selected date
          const lastDate = Array.from(selectedDates).pop();
          selectedDates.clear();
          selectedDates.add(lastDate);
          render();
        }
      });

      // Handle click - permanently apply single selection
      confirmButton.addEventListener('click', () => {
        if (selectedDates.size > 0) {
          // Mark as confirmed so preview won't be restored
          hasConfirmedDates = true;
          // Keep only the last date
          const lastDate = Array.from(selectedDates).pop();
          selectedDates.clear();
          selectedDates.add(lastDate);
          tempDates = null;
          render();
          
          // Dispatch event with the final selected date
          calendarEl.dispatchEvent(new CustomEvent('dateConfirmed', {
            detail: {
              date: lastDate
            },
            bubbles: true
          }));
        }
      });
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
        const isSelected = selectedDates.has(dateStr);

        let classes = "w-full aspect-square text-xs flex items-center justify-center rounded cursor-pointer transition ";
        
        if (isBooked) {
          classes += "bg-primary text-white font-bold";
        } else if (isMaintenance) {
          classes += "bg-rose-700 text-white font-bold";
        } else if (isUnavailable) {
          classes += "bg-neutral-200 text-neutral-400 cursor-not-allowed";
        } else if (isSelected) {
          classes += "bg-secondary text-white font-bold";
        } else {
          classes += "bg-background text-black hover:bg-secondary";
        }

        html += `<div class="${classes}" data-date="${dateStr}" ${isUnavailable ? 'style="pointer-events: none;"' : ''}>${d}</div>`;
      }

      html += "</div>";
      return html;
    };

    // Click listener for dates
    calendarEl.addEventListener("click", e => {
      const dateEl = e.target.closest("[data-date]");
      if (dateEl && !dateEl.classList.contains("cursor-not-allowed")) {
        const clickedDate = dateEl.dataset.date;
        
        // Reset confirmed state when selecting new dates
        if (!e.target.closest('#confirmDate')) {
          hasConfirmedDates = false;
        }
        
        if (hasConfirmedDates) {
          // Single selection mode after confirmation
          selectedDates.clear();
          selectedDates.add(clickedDate);
        } else {
          // Multiple selection mode before confirmation
          if (selectedDates.has(clickedDate)) {
            selectedDates.delete(clickedDate);
          } else {
            selectedDates.add(clickedDate);
          }
        }

        // Dispatch custom event with selected dates
        calendarEl.dispatchEvent(new CustomEvent('datesSelected', {
          detail: {
            dates: Array.from(selectedDates)
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
