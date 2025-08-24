// Format a date as DD Month YYYY
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric',
    month: 'long', 
    year: 'numeric'
  });
}

// Store booked and maintenance dates globally
let bookedDates = new Set();
let maintenanceDates = new Set();

// Function to fetch calendar data
async function fetchCalendarData(propertyId) {
  try {
    console.log('Fetching calendar data for property:', propertyId);
    const response = await fetch(`https://betcha-api.onrender.com/calendar/byProperty/${propertyId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('Calendar data received:', data);
    
    // Clear existing dates
    bookedDates.clear();
    maintenanceDates.clear();
    
    // Add booked dates to Set
    if (data.calendar && data.calendar.booking) {
      data.calendar.booking.forEach(booking => {
        bookedDates.add(booking.date);
      });
    }
    
    // Add maintenance dates to Set
    if (data.calendar && data.calendar.maintenance) {
      data.calendar.maintenance.forEach(maintenance => {
        maintenanceDates.add(maintenance.date);
      });
    }

    console.log('Booked dates:', Array.from(bookedDates));
    console.log('Maintenance dates:', Array.from(maintenanceDates));
    
    // Re-render all calendars
    document.querySelectorAll(".calendar-instance").forEach(cal => {
      const calendarContainer = cal.querySelector(".leftCalendar")?.parentElement;
      if (calendarContainer && calendarContainer._renders) {
        console.log('Re-rendering calendar with stored renders:', calendarContainer._renders.length);
        // Call each stored render function
        calendarContainer._renders.forEach(render => {
          try {
            render();
          } catch (err) {
            console.error('Error in calendar render:', err);
          }
        });
      } else {
        console.log('No stored renders found for calendar container');
      }
    });
  } catch (err) {
    console.error('Error fetching calendar data:', err);
  }
}

// Make fetchCalendarData available globally
window.fetchCalendarData = fetchCalendarData;

// Function to fetch calendar data
async function fetchCalendarData(propertyId) {
  try {
    console.log('Fetching calendar data for property:', propertyId);
    const response = await fetch(`https://betcha-api.onrender.com/calendar/byProperty/${propertyId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('Calendar data received:', data);
    
    // Clear existing dates
    bookedDates.clear();
    maintenanceDates.clear();
    
    // Add booked dates to Set
    if (data.calendar && data.calendar.booking) {
      data.calendar.booking.forEach(booking => {
        bookedDates.add(booking.date);
      });
    }
    
    // Add maintenance dates to Set
    if (data.calendar && data.calendar.maintenance) {
      data.calendar.maintenance.forEach(maintenance => {
        maintenanceDates.add(maintenance.date);
      });
    }

    console.log('Booked dates:', Array.from(bookedDates));
    console.log('Maintenance dates:', Array.from(maintenanceDates));
    
    // Re-render all calendars
    document.querySelectorAll(".calendar-instance").forEach(cal => {
      const calendarContainer = cal.querySelector(".leftCalendar")?.parentElement;
      if (calendarContainer && calendarContainer._renders) {
        console.log('Re-rendering calendar with stored renders:', calendarContainer._renders.length);
        // Call each stored render function
        calendarContainer._renders.forEach(render => {
          try {
            render();
          } catch (err) {
            console.error('Error in calendar render:', err);
          }
        });
      } else {
        console.log('No stored renders found for calendar container');
      }
    });
  } catch (err) {
    console.error('Error fetching calendar data:', err);
  }
}

// Make fetchCalendarData available globally
window.fetchCalendarData = fetchCalendarData;

document.addEventListener("DOMContentLoaded", () => {
  // Get property ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  
  // Find date picker trigger
  const datePickerTrigger = document.querySelector('[data-modal-target="dateBookingModal"]');
  if (datePickerTrigger && propertyId) {
    // Add click handler to fetch calendar data
    datePickerTrigger.addEventListener('click', async () => {
      console.log('Fetching calendar data...');
      await fetchCalendarData(propertyId);
    });
  }

  document.querySelectorAll(".calendar-instance").forEach(calendarEl => {
    let currentDate = new Date();
    let selectedDates = new Set(); // Store multiple selected dates
    let selectionStart = null; // Start of date range
    let isRangeSelection = false; // Flag for range selection mode
    let lastClickTime = 0; // For double click detection

    const leftLabel = calendarEl.querySelector(".leftMonthLabel");
    const rightLabel = calendarEl.querySelector(".rightMonthLabel");
    const leftCal = calendarEl.querySelector(".leftCalendar");
    const rightCal = calendarEl.querySelector(".rightCalendar");

    const render = () => {
      const left = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const right = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

      leftLabel.textContent = left.toLocaleString("default", { month: "long", year: "numeric" });
      rightLabel.textContent = right.toLocaleString("default", { month: "long", year: "numeric" });

      leftCal.innerHTML = buildCalendar(left);
      rightCal.innerHTML = buildCalendar(right);
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
        const isBooked = bookedDates.has(dateStr);
        const isMaintenance = maintenanceDates.has(dateStr);
        const isUnavailable = isBooked || isMaintenance;
        const isSelected = selectedDates.has(dateStr);
        
        // Get today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateObj = new Date(dateStr);
        const isPast = dateObj < today;

        // Handle highlighting for selected dates and preview
        let isInRange = false;
        let isStartDate = dateStr === selectionStart;
        
        if (selectionStart) {
          if (isRangeSelection) {
            // During range selection - show preview
            const hoverDate = calendarEl.dataset.hoverDate;
            if (hoverDate) {
              const rangeStart = new Date(selectionStart);
              const rangeEnd = new Date(hoverDate);
              
              if (rangeStart <= rangeEnd) {
                isInRange = dateObj >= rangeStart && dateObj <= rangeEnd;
              } else {
                isInRange = dateObj <= rangeStart && dateObj >= rangeEnd;
              }
            } else {
              // Only highlight start date if no hover
              isInRange = isStartDate;
            }
          } else {
            // After range selection complete - show fixed selection
            isInRange = selectedDates.has(dateStr);
          }
        }

        let classes = "w-full aspect-square text-xs flex items-center justify-center rounded cursor-pointer transition ";
        
        if (isPast) {
          classes += "bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-50";
        } else if (isBooked) {
          classes += "bg-neutral-200 text-neutral-600 cursor-not-allowed"; // Grey for booked dates
        } else if (isMaintenance) {
          classes += "bg-red-100 text-red-600 cursor-not-allowed"; // Red tint for maintenance
        } else if (isSelected || isInRange) {
          classes += "bg-primary text-white font-bold"; // Selected or in range
        } else {
          classes += "bg-background text-black hover:bg-secondary";
        }

        html += `<div class="${classes}" data-date="${dateStr}" ${isUnavailable || isPast ? 'style="pointer-events: none;"' : ''}>${d}</div>`;
      }

      html += "</div>";
      return html;
    };

    // Handle date selection
    const handleDateSelect = (dateEl) => {
      const date = dateEl.dataset.date;
      
      if (!selectionStart) {
        // First click - start range selection
        selectionStart = date;
        selectedDates.clear();
        selectedDates.add(date);
        isRangeSelection = true; // Enable hover preview
        delete calendarEl.dataset.hoverDate; // Clear any existing hover
      } else if (date === selectionStart) {
        // Clicking same date - cancel selection
        selectionStart = null;
        selectedDates.clear();
        isRangeSelection = false; // Disable hover preview
        delete calendarEl.dataset.hoverDate;
      } else {
        // Second click - complete range selection
        let startDate = new Date(selectionStart);
        let endDate = new Date(date);
        
        if (startDate > endDate) {
          // Swap if end date is before start date
          const temp = startDate;
          startDate = endDate;
          endDate = temp;
        }
        
        selectedDates.clear();
          
        // Add all dates in range
        const current = new Date(startDate);
        while (current <= endDate) {
          const dateStr = current.toISOString().split('T')[0];
          // Only add if date is available
          if (!bookedDates.has(dateStr) && !maintenanceDates.has(dateStr)) {
            selectedDates.add(dateStr);
          }
          current.setDate(current.getDate() + 1);
        }
          
        selectionStart = null;
        isRangeSelection = false;
      }
      
      render();
      
      // Dispatch event with selected dates
      const event = new CustomEvent('dateSelection', {
        detail: {
          dates: Array.from(selectedDates)
        }
      });
      calendarEl.dispatchEvent(event);
    };

    // Click listener for dates
    calendarEl.addEventListener("click", e => {
      const dateEl = e.target.closest("[data-date]");
      if (dateEl && !dateEl.classList.contains("cursor-not-allowed")) {
        handleDateSelect(dateEl);
      }
    });

    // Mouse move listener for range preview
    calendarEl.addEventListener("mousemove", e => {
      if (!isRangeSelection) return; // Only show preview while actively selecting
      
      const dateEl = e.target.closest("[data-date]");
      if (dateEl && !dateEl.classList.contains("cursor-not-allowed")) {
        // Store hover date at calendar level for smoother updates
        calendarEl.dataset.hoverDate = dateEl.dataset.date;
        requestAnimationFrame(() => render()); // Smoother updates
      }
    });
    
    // Mouse leave listener to clear preview
    calendarEl.addEventListener("mouseleave", () => {
      if (isRangeSelection) {
        // Clear hover date when mouse leaves calendar
        delete calendarEl.dataset.hoverDate;
        requestAnimationFrame(() => render());
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

    // Store render function for future updates
    const calendarContainer = leftCal.parentElement;
    if (calendarContainer) {
      calendarContainer._renders = calendarContainer._renders || [];
      calendarContainer._renders.push(render);
    }

    // Initial render
    render();

    // Listen for date selection events on calendar
    calendarEl.addEventListener('dateSelection', (e) => {
      const selectedDates = e.detail.dates.sort();
      console.log('Selected dates:', selectedDates);
      
      // Store dates globally for confirm button
      window.selectedBookingDates = selectedDates;
    });
  });

  // Handle confirm button click
  const confirmBtn = document.getElementById('confirmDate');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const selectedDates = window.selectedBookingDates;
      if (selectedDates && selectedDates.length > 0) {
        // Get check-in/check-out elements
        const checkInEl = document.getElementById('checkInDate');
        const checkOutEl = document.getElementById('checkOutDate');
        
        if (checkInEl && checkOutEl) {
          if (selectedDates.length === 1) {
            // Single date selected
            checkInEl.textContent = formatDate(selectedDates[0]);
            checkOutEl.textContent = formatDate(selectedDates[0]);
          } else {
            // Range selected
            checkInEl.textContent = formatDate(selectedDates[0]);
            checkOutEl.textContent = formatDate(selectedDates[selectedDates.length - 1]);
          }
        }

        // Close the modal if it exists and restore scrolling
        const modal = document.getElementById('dateBookingModal');
        if (modal) {
          modal.classList.add('hidden');
          document.body.classList.remove('modal-open'); // Restore scrolling
        }
      }
    });
  }
});
