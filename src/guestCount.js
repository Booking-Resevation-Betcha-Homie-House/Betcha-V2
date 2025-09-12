document.addEventListener("DOMContentLoaded", () => {
  
  const guestSummary = document.getElementById("guestSummary");
  const confirmBtn = document.getElementById("confirmGuestCount");
  const modal = document.getElementById("guestCountModal");
  let currentGuestCount = 1;
  let isInitialized = false;

  window.currentGuestCount = currentGuestCount;

  function initializeGuestCounters() {
    if (isInitialized) {
      console.log('Guest counters already initialized, skipping...');
      return;
    }
    
    console.log('Initializing guest counters...');
    
    document.querySelectorAll(".guest-counter").forEach((counter, index) => {
      const decreaseBtn = counter.querySelector(".decreaseGuest");
      const increaseBtn = counter.querySelector(".increaseGuest");
      const countDisplay = counter.querySelector(".guestCount");
      const maxDisplay = counter.querySelector(".maxGuestNum");

      if (!decreaseBtn || !increaseBtn || !countDisplay) {
        console.warn('Guest counter elements not found in counter', index, counter);
        return;
      }

      let count = parseInt(countDisplay.textContent) || 1;
      const max = parseInt(counter.getAttribute("data-max")) || 10;
      
      console.log(`Counter ${index} - Current: ${count}, Max: ${max}`);
      
      currentGuestCount = count;
      window.currentGuestCount = currentGuestCount;

      if (maxDisplay) maxDisplay.textContent = max;

      (function(counterCount, counterMax, counterDisplay, counterDecrease, counterIncrease) {
        
        counterDecrease.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Decrease clicked, current count:', counterCount);
          
          if (counterCount > 1) {
            counterCount--;
            currentGuestCount = counterCount;
            window.currentGuestCount = currentGuestCount;
            console.log('New count after decrease:', counterCount);

            document.querySelectorAll(".guestCount").forEach(display => {
              display.textContent = counterCount;
            });
          }
        });

        counterIncrease.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Increase clicked, current count:', counterCount, 'max:', counterMax);
          
          if (counterCount < counterMax) {
            counterCount++;
            currentGuestCount = counterCount;
            window.currentGuestCount = currentGuestCount;
            console.log('New count after increase:', counterCount);

            document.querySelectorAll(".guestCount").forEach(display => {
              display.textContent = counterCount;
            });
          } else {
            console.log('Cannot increase - already at max:', counterMax);
          }
        });
        
      })(count, max, countDisplay, decreaseBtn, increaseBtn);
    });
    
    isInitialized = true;
    console.log('Guest counters initialization complete');
  }

  initializeGuestCounters();

  document.addEventListener('updateGuestLimit', (event) => {
    console.log('Guest limit update received:', event.detail.maxCapacity);

    document.querySelectorAll('.guest-counter').forEach(counter => {
      counter.setAttribute('data-max', event.detail.maxCapacity);
      const maxDisplay = counter.querySelector('.maxGuestNum');
      if (maxDisplay) {
        maxDisplay.textContent = event.detail.maxCapacity;
      }
    });
    
    console.log('Guest counter limits updated to:', event.detail.maxCapacity);
  });

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      
      if (guestSummary) {
        guestSummary.textContent = `${currentGuestCount} ${currentGuestCount === 1 ? 'guest' : 'guests'}`;
      }

      if (modal) {
        modal.classList.add("hidden");
        document.body.classList.remove("modal-open"); 
      }
    });
  }

  window.testGuestCounter = function() {
    console.log('Testing guest counter functionality...');
    console.log('Current guest count (global):', window.currentGuestCount);
    console.log('Current guest count (local):', currentGuestCount);
    
    const counter = document.querySelector('.guest-counter');
    if (counter) {
      console.log('Guest counter element found:', counter);
      console.log('Data-max attribute:', counter.getAttribute('data-max'));
      
      const countDisplay = counter.querySelector('.guestCount');
      if (countDisplay) {
        console.log('Count display value:', countDisplay.textContent);
      }
      
      const decreaseBtn = counter.querySelector('.decreaseGuest');
      const increaseBtn = counter.querySelector('.increaseGuest');
      console.log('Decrease button:', decreaseBtn);
      console.log('Increase button:', increaseBtn);

      if (increaseBtn) {
        console.log('Testing increase button click...');
        increaseBtn.click();
      }
    } else {
      console.log('No guest counter element found');
    }
  };
});
