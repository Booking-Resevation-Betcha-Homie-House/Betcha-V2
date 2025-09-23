document.addEventListener("DOMContentLoaded", () => {
  const starContainer = document.getElementById("starRating");
  const ratingValue = document.getElementById("ratingValue");
  let currentRating = 0;

  // === SVG TEMPLATES ===
  const fullStar = (color = "#d4d4d8") => `
    <svg width="40" height="40" viewBox="0 0 19 18" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-sm">
      <path d="M7.82768 1.10245C8.33862 -0.367484 10.4175 -0.367484 10.9284 1.10245L12.0903 4.44504C12.3157 5.09349 12.9209 5.53316 13.6072 5.54715L17.1453 5.61925C18.7011 5.65096 19.3435 7.62805 18.1034 8.56823L15.2835 10.7062C14.7364 11.1209 14.5053 11.8323 14.7041 12.4894L15.7288 15.8766C16.1795 17.3661 14.4976 18.588 13.2203 17.6991L10.3156 15.6779C9.75205 15.2857 9.00404 15.2857 8.44053 15.6779L5.53583 17.6991C4.25845 18.588 2.57664 17.3661 3.02728 15.8766L4.05202 12.4894C4.25082 11.8323 4.01967 11.1209 3.4726 10.7062L0.652656 8.56823C-0.587445 7.62805 0.0549511 5.65096 1.61084 5.61925L5.14887 5.54715C5.83524 5.53316 6.44039 5.09349 6.66579 4.44504L7.82768 1.10245Z" fill="${color}"/>
    </svg>`;

  const halfStar = () => `
    <svg width="40" height="40" viewBox="0 0 19 18" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-sm">
      <defs>
        <clipPath id="half">
          <rect x="0" y="0" width="9.5" height="18" />
        </clipPath>
      </defs>
      <!-- neutral base -->
      <path d="M7.82768 1.10245C8.33862 -0.367484 10.4175 -0.367484 10.9284 1.10245L12.0903 4.44504C12.3157 5.09349 12.9209 5.53316 13.6072 5.54715L17.1453 5.61925C18.7011 5.65096 19.3435 7.62805 18.1034 8.56823L15.2835 10.7062C14.7364 11.1209 14.5053 11.8323 14.7041 12.4894L15.7288 15.8766C16.1795 17.3661 14.4976 18.588 13.2203 17.6991L10.3156 15.6779C9.75205 15.2857 9.00404 15.2857 8.44053 15.6779L5.53583 17.6991C4.25845 18.588 2.57664 17.3661 3.02728 15.8766L4.05202 12.4894C4.25082 11.8323 4.01967 11.1209 3.4726 10.7062L0.652656 8.56823C-0.587445 7.62805 0.0549511 5.65096 1.61084 5.61925L5.14887 5.54715C5.83524 5.53316 6.44039 5.09349 6.66579 4.44504L7.82768 1.10245Z" fill="#d4d4d8"/>
      <!-- Yellow half -->
      <path d="M7.82768 1.10245C8.33862 -0.367484 10.4175 -0.367484 10.9284 1.10245L12.0903 4.44504C12.3157 5.09349 12.9209 5.53316 13.6072 5.54715L17.1453 5.61925C18.7011 5.65096 19.3435 7.62805 18.1034 8.56823L15.2835 10.7062C14.7364 11.1209 14.5053 11.8323 14.7041 12.4894L15.7288 15.8766C16.1795 17.3661 14.4976 18.588 13.2203 17.6991L10.3156 15.6779C9.75205 15.2857 9.00404 15.2857 8.44053 15.6779L5.53583 17.6991C4.25845 18.588 2.57664 17.3661 3.02728 15.8766L4.05202 12.4894C4.25082 11.8323 4.01967 11.1209 3.4726 10.7062L0.652656 8.56823C-0.587445 7.62805 0.0549511 5.65096 1.61084 5.61925L5.14887 5.54715C5.83524 5.53316 6.44039 5.09349 6.66579 4.44504L7.82768 1.10245Z" fill="#facc15" clip-path="url(#half)"/>
    </svg>`;

  // === INIT STARS ===
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.innerHTML = fullStar("#d4d4d8");
    star.classList.add("cursor-pointer", "transition", "hover:scale-110");
    star.dataset.value = i;
    starContainer.appendChild(star);

    star.addEventListener("click", () => {
      let value = parseFloat(star.dataset.value);
      // Toggle half rating if same star is clicked again
      if (currentRating === value) {
        value = value - 0.5;
      }
      currentRating = value;
      updateStars();
    });
  }

  // === UPDATE STARS ===
  function updateStars() {
    [...starContainer.children].forEach((star, index) => {
      const value = index + 1;
      if (currentRating >= value) {
        star.innerHTML = fullStar("#facc15"); // yellow
      } else if (currentRating >= value - 0.5) {
        star.innerHTML = halfStar(); // true half star
      } else {
        star.innerHTML = fullStar("#d4d4d8"); // neutral
      }
    });
    ratingValue.textContent = `Your rating: ${currentRating}`;
  }
});
