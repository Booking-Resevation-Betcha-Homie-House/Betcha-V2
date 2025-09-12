
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

let bookedDates = new Set();
let maintenanceDates = new Set();

async function fetchCalendarData(propertyId) {
  try {
    console.log('Fetching calendar data for property:', propertyId);
    const response = await fetch(`https://betcha-api.onrender.com/calendar/byProperty/${propertyId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('Calendar data received:', data);

    bookedDates.clear();
    maintenanceDates.clear();

    if (data.calendar && data.calendar.booking) {
      data.calendar.booking.forEach(booking => {
        bookedDates.add(booking.date);
      });
    }

    if (data.calendar && data.calendar.maintenance) {
      data.calendar.maintenance.forEach(maintenance => {
        maintenanceDates.add(maintenance.date);
      });
    }

    console.log('Booked dates:', Array.from(bookedDates));
    console.log('Maintenance dates:', Array.from(maintenanceDates));

    document.querySelectorAll(".calendar-instance").forEach(cal => {
      const calendarContainer = cal.querySelector(".leftCalendar")?.parentElement;
      if (calendarContainer && calendarContainer._renders) {
        console.log('Re-rendering calendar with stored renders:', calendarContainer._renders.length);
        
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

window.fetchCalendarData = fetchCalendarData;

function initializeSearchCalendar(calendarId) {
  const calendar = document.getElementById(calendarId);
  if (!calendar) return;

  const leftCalendar = calendar.querySelector('.leftCalendar');
  const rightCalendar = calendar.querySelector('.rightCalendar');
  const leftLabel = calendar.querySelector('.leftMonthLabel');
  const rightLabel = calendar.querySelector('.rightMonthLabel');
  const prevBtn = calendar.querySelector('.prevMonth');
  const nextBtn = calendar.querySelector('.nextMonth');
  const checkInInput = document.getElementById('searchCheckIn');
  const checkOutInput = document.getElementById('searchCheckOut');

  let currentDate = new Date();
  let selectedStartDate = null;
  let selectedEndDate = null;

  function updateCalendars() {
    
    const leftMonth = new Date(currentDate);
    renderCalendar(leftCalendar, leftMonth, leftLabel);

    const rightMonth = new Date(currentDate);
    rightMonth.setMonth(rightMonth.getMonth() + 1);
    renderCalendar(rightCalendar, rightMonth, rightLabel);
  }

  function renderCalendar(container, date, labelEl) {
    const year = date.getFullYear();
    const month = date.getMonth();

    labelEl.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    let html = `
      <div class="grid grid-cols-7 gap-1">
        <div class="text-center text-xs font-medium text-neutral-400">Sun</div>
        <div class="text-center text-xs font-medium text-neutral-400">Mon</div>
        <div class="text-center text-xs font-medium text-neutral-400">Tue</div>
        <div class="text-center text-xs font-medium text-neutral-400">Wed</div>
        <div class="text-center text-xs font-medium text-neutral-400">Thu</div>
        <div class="text-center text-xs font-medium text-neutral-400">Fri</div>
        <div class="text-center text-xs font-medium text-neutral-400">Sat</div>
    `;

    for (let i = 0; i < firstDay; i++) {
      html += '<div></div>';
    }

    for (let day = 1; day <= totalDays; day++) {
      const currentDateObj = new Date(year, month, day);
      const dateStr = currentDateObj.toISOString().split('T')[0];
      const isDisabled = currentDateObj < new Date().setHours(0,0,0,0);
      const isSelected = (selectedStartDate && dateStr === selectedStartDate) ||
                        (selectedEndDate && dateStr === selectedEndDate);
      const isInRange = selectedStartDate && selectedEndDate &&
                       dateStr > selectedStartDate && dateStr < selectedEndDate;

      let classes = 'flex items-center justify-center w-8 h-8 rounded-full text-sm ';
      
      if (isDisabled) {
        classes += 'text-neutral-300 cursor-not-allowed';
      } else if (isSelected) {
        classes += 'bg-primary text-white cursor-pointer hover:bg-primary/90';
      } else if (isInRange) {
        classes += 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20';
      } else {
        classes += 'text-neutral-600 cursor-pointer hover:bg-neutral-100';
      }

      html += `
        <div class="flex items-center justify-center">
          <button class="${classes}" 
                  data-date="${dateStr}"
                  ${isDisabled ? 'disabled' : ''}>
            ${day}
          </button>
        </div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('button[data-date]').forEach(button => {
      if (!button.disabled) {
        button.addEventListener('click', () => {
          const dateStr = button.dataset.date;
          
          if (!selectedStartDate || (selectedStartDate && selectedEndDate) || dateStr < selectedStartDate) {
            
            selectedStartDate = dateStr;
            selectedEndDate = null;
            checkInInput.value = dateStr;
            checkOutInput.value = '';

            const startEvent = new Event('change', { bubbles: true });
            checkInInput.dispatchEvent(startEvent);
            
          } else {
            
            selectedEndDate = dateStr;
            checkOutInput.value = dateStr;

            const endEvent = new Event('change', { bubbles: true });
            checkOutInput.dispatchEvent(endEvent);
          }

          console.log('Date Selection:', { start: selectedStartDate, end: selectedEndDate });
          
          updateCalendars();
        });
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      updateCalendars();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      updateCalendars();
    });
  }

  updateCalendars();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeSearchCalendar('calendarIdsearch');
});

document.addEventListener("DOMContentLoaded", () => {
  
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');

  const datePickerTrigger = document.querySelector('[data-modal-target="dateBookingModal"]');
  if (datePickerTrigger && propertyId) {
    
    datePickerTrigger.addEventListener('click', async () => {
      console.log('Fetching calendar data...');
      await fetchCalendarData(propertyId);
    });
  }

  document.querySelectorAll(".calendar-instance").forEach(calendarEl => {
    let currentDate = new Date();
    let selectedDates = new Set(); 
    let selectionStart = null; 
    let isRangeSelection = false; 

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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateObj = new Date(dateStr);
        const isPast = dateObj < today;

        let isInRange = false;
        let isStartDate = dateStr === selectionStart;
        
        if (selectionStart) {
          if (isRangeSelection) {
            
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
              
              isInRange = isStartDate;
            }
          } else {
            
            isInRange = selectedDates.has(dateStr);
          }
        }

        let classes = "w-full aspect-square text-xs flex items-center justify-center rounded cursor-pointer transition ";
        
        if (isPast) {
          classes += "bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-50";
        } else if (isBooked) {
          classes += "bg-neutral-200 text-neutral-600 cursor-not-allowed"; 
        } else if (isMaintenance) {
          classes += "bg-red-100 text-red-600 cursor-not-allowed"; 
        } else if (isSelected || isInRange) {
          classes += "bg-primary text-white font-bold"; 
        } else {
          classes += "bg-background text-black hover:bg-secondary";
        }

        html += `<div class="${classes}" data-date="${dateStr}" ${isUnavailable || isPast ? 'style="pointer-events: none;"' : ''}>${d}</div>`;
      }

      html += "</div>";
      return html;
    };

    const handleDateSelect = (dateEl) => {
      const date = dateEl.dataset.date;
      
      if (!selectionStart) {
        
        selectionStart = date;
        selectedDates.clear();
        selectedDates.add(date);
        isRangeSelection = true; 
        delete calendarEl.dataset.hoverDate; 
      } else if (date === selectionStart) {
        
        selectionStart = null;
        selectedDates.clear();
        isRangeSelection = false; 
        delete calendarEl.dataset.hoverDate;
      } else {
        
        let startDate = new Date(selectionStart);
        let endDate = new Date(date);
        
        if (startDate > endDate) {
          
          const temp = startDate;
          startDate = endDate;
          endDate = temp;
        }
        
        selectedDates.clear();

        const current = new Date(startDate);
        while (current <= endDate) {
          const dateStr = current.toISOString().split('T')[0];
          
          if (!bookedDates.has(dateStr) && !maintenanceDates.has(dateStr)) {
            selectedDates.add(dateStr);
          }
          current.setDate(current.getDate() + 1);
        }
          
        selectionStart = null;
        isRangeSelection = false;
      }
      
      render();

      const event = new CustomEvent('dateSelection', {
        detail: {
          dates: Array.from(selectedDates)
        }
      });
      calendarEl.dispatchEvent(event);
    };

    calendarEl.addEventListener("click", e => {
      const dateEl = e.target.closest("[data-date]");
      if (dateEl && !dateEl.classList.contains("cursor-not-allowed")) {
        handleDateSelect(dateEl);
      }
    });

    calendarEl.addEventListener("mousemove", e => {
      if (!isRangeSelection) return; 
      
      const dateEl = e.target.closest("[data-date]");
      if (dateEl && !dateEl.classList.contains("cursor-not-allowed")) {
        
        calendarEl.dataset.hoverDate = dateEl.dataset.date;
        requestAnimationFrame(() => render()); 
      }
    });

    calendarEl.addEventListener("mouseleave", () => {
      if (isRangeSelection) {
        
        delete calendarEl.dataset.hoverDate;
        requestAnimationFrame(() => render());
      }
    });

    calendarEl.querySelector(".prevMonth").addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      render();
    });

    calendarEl.querySelector(".nextMonth").addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      render();
    });

    const calendarContainer = leftCal.parentElement;
    if (calendarContainer) {
      calendarContainer._renders = calendarContainer._renders || [];
      calendarContainer._renders.push(render);
    }

    render();

    calendarEl.addEventListener('dateSelection', (e) => {
      const selectedDates = e.detail.dates.sort();
      console.log('Selected dates:', selectedDates);

      window.selectedBookingDates = selectedDates;

      const checkInEl = document.getElementById('searchCheckIn');
      const checkOutEl = document.getElementById('searchCheckOut');
      
      if (checkInEl && checkOutEl) {
        if (selectedDates.length >= 1) {
          checkInEl.value = selectedDates[0];
          checkInEl.dispatchEvent(new Event('input'));
        }
        if (selectedDates.length >= 2) {
          checkOutEl.value = selectedDates[selectedDates.length - 1];
          checkOutEl.dispatchEvent(new Event('input'));
        }
      }
    });
  });

  const confirmBtn = document.getElementById('confirmDate');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const selectedDates = window.selectedBookingDates;
      if (selectedDates && selectedDates.length > 0) {
        
        const checkInEl = document.getElementById('checkInDate');
        const checkOutEl = document.getElementById('checkOutDate');
        
        if (checkInEl && checkOutEl) {
          if (selectedDates.length === 1) {
            
            checkInEl.textContent = formatDate(selectedDates[0]);
            checkOutEl.textContent = formatDate(selectedDates[0]);
          } else {
            
            checkInEl.textContent = formatDate(selectedDates[0]);
            checkOutEl.textContent = formatDate(selectedDates[selectedDates.length - 1]);
          }
        }

        const modal = document.getElementById('dateBookingModal');
        if (modal) {
          modal.classList.add('hidden');
          document.body.classList.remove('modal-open'); 
        }
      }
    });
  }
});
