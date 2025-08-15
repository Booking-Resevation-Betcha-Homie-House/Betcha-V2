document.addEventListener("DOMContentLoaded", () => {
  const unavailableDates = ["2025-07-04", "2025-07-05"];

  document.querySelectorAll(".calendar-instance").forEach(calendarEl => {
    let currentDate = new Date();
    let selectedDate = null;

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
        const isUnavailable = unavailableDates.includes(dateStr);
        const isSelected = selectedDate === dateStr;

        let classes = "w-full aspect-square text-xs flex items-center justify-center rounded cursor-pointer transition ";
        if (isUnavailable) {
          classes += "bg-neutral-200 text-neutral-400 cursor-not-allowed";
        } else if (isSelected) {
          classes += "bg-primary text-white font-bold";
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
        selectedDate = dateEl.dataset.date;
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

    // Initial render
    render();
  });
});
