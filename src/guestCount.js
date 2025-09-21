document.addEventListener("DOMContentLoaded", () => {
  // Get shared elements
  const guestSummary = document.getElementById("guestSummary");
  const confirmBtn = document.getElementById("confirmGuestCount");
  const modal = document.getElementById("guestCountModal");
  let currentGuestCount = 0;
  let isInitialized = false;
  
  // Make guest count globally accessible
  window.currentGuestCount = currentGuestCount;

  // Function to update guest display text
  function updateGuestDisplayText(counter, count, packageCapacity, maxCapacity) {
    console.log('=== UPDATE GUEST DISPLAY TEXT ===');
    console.log('updateGuestDisplayText called with:', { count, packageCapacity, maxCapacity });
    
    const guestTitle = counter.querySelector('#guestTitle');
    const packageCapacityText = counter.querySelector('.packageCapacityText');
    const additionalGuestText = counter.querySelector('.additionalGuestText');
    const maxDisplay = counter.querySelector('.maxGuestNum');
    
    console.log('Found elements:', { guestTitle, packageCapacityText, additionalGuestText, maxDisplay });
    
    if (packageCapacityText) {
      const newText = `${packageCapacity} guest${packageCapacity === 1 ? '' : 's'} included`;
      console.log('Setting packageCapacityText to:', newText);
      packageCapacityText.textContent = newText;
    }
    
    if (additionalGuestText && maxDisplay) {
      const additionalGuests = maxCapacity - packageCapacity;
      console.log('Calculated additionalGuests (maxCapacity - packageCapacity):', `${maxCapacity} - ${packageCapacity} = ${additionalGuests}`);
      if (additionalGuests > 0) {
        // Update the maxGuestNum span first
        maxDisplay.textContent = additionalGuests;
        
        // Update the additionalGuestText while preserving the inner span
        const guestWord = additionalGuests === 1 ? 'guest' : 'guests';
        additionalGuestText.innerHTML = `up to <span class="maxGuestNum">${additionalGuests}</span> additional ${guestWord}`;
        
        console.log('Setting additionalGuestText innerHTML to:', additionalGuestText.innerHTML);
      } else {
        additionalGuestText.textContent = 'no additional guests available';
      }
    }
    
    // Also update any standalone maxGuestNum elements with additional guests count
    const maxGuestNumElements = counter.querySelectorAll('.maxGuestNum');
    const additionalGuests = maxCapacity - packageCapacity;
    console.log('Updating', maxGuestNumElements.length, 'maxGuestNum elements to show additional guests:', additionalGuests);
    maxGuestNumElements.forEach(element => {
      element.textContent = additionalGuests;
    });
    
    // Update title based on current count vs package capacity
    if (guestTitle) {
      let newTitleText;
      if (count <= packageCapacity) {
        newTitleText = 'Additional Guests';
      } else {
        const extraGuests = count - packageCapacity;
        newTitleText = `Additional Guests (${extraGuests} extra)`;
      }
      console.log(`Setting guestTitle - count: ${count}, package: ${packageCapacity}, title: "${newTitleText}"`);
      guestTitle.textContent = newTitleText;
    }
    console.log('=== END UPDATE GUEST DISPLAY TEXT ===');
  }

  // Function to initialize or reinitialize guest counters
  function initializeGuestCounters() {
    if (isInitialized) {
      console.log('Guest counters already initialized, skipping...');
      return;
    }
    
    console.log('=== INITIALIZING GUEST COUNTERS ===');
    
    const allCounters = document.querySelectorAll(".guest-counter");
    console.log('Found', allCounters.length, 'guest counter elements');
    
    allCounters.forEach((counter, index) => {
      console.log(`\n--- Counter ${index} ---`);
      console.log('Element:', counter);
      console.log('data-max attribute:', counter.getAttribute("data-max"));
      console.log('data-package-capacity attribute:', counter.getAttribute("data-package-capacity"));
    });
    
    document.querySelectorAll(".guest-counter").forEach((counter, index) => {
      const decreaseBtn = counter.querySelector(".decreaseGuest");
      const increaseBtn = counter.querySelector(".increaseGuest");
      const countDisplay = counter.querySelector(".guestCount");

      if (!decreaseBtn || !increaseBtn || !countDisplay) {
        console.warn('Guest counter elements not found in counter', index, counter);
        return;
      }

      const count = parseInt(countDisplay.textContent) || 0;
      const maxCapacity = parseInt(counter.getAttribute("data-max")) || 10;
      const packageCapacity = parseInt(counter.getAttribute("data-package-capacity")) || 1;
      
      console.log(`\n=== SETTING UP COUNTER ${index} ===`);
      console.log(`Raw data-max: "${counter.getAttribute("data-max")}"`);
      console.log(`Raw data-package-capacity: "${counter.getAttribute("data-package-capacity")}"`);
      console.log(`Parsed maxCapacity: ${maxCapacity}`);
      console.log(`Parsed packageCapacity: ${packageCapacity}`);
      console.log(`Current count: ${count}`);
      console.log(`Additional guests: ${maxCapacity - packageCapacity}`);
      
      currentGuestCount = count;
      window.currentGuestCount = currentGuestCount;

      // Update display text initially
      updateGuestDisplayText(counter, count, packageCapacity, maxCapacity);
      
      // Force another update after a short delay to ensure it takes
      setTimeout(() => {
        console.log(`Delayed update for counter ${index}`);
        updateGuestDisplayText(counter, count, packageCapacity, maxCapacity);
      }, 100);

      // Use a closure to maintain the count for each counter
      console.log(`Creating closure for counter ${index} with values:`, {
        count,
        maxCapacity,
        packageCapacity
      });
      
      (function(counterCount, counterMaxCapacity, counterPackageCapacity, counterDisplay, counterDecrease, counterIncrease, counterElement) {
        
        console.log(`\n=== CLOSURE CREATED FOR COUNTER ${index} ===`);
        console.log('Closure counterMaxCapacity:', counterMaxCapacity);
        console.log('Closure counterPackageCapacity:', counterPackageCapacity);
        console.log('Closure counterCount:', counterCount);
        
        counterDecrease.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Re-read data attributes from DOM to get current values (in case they were updated dynamically)
          const currentMaxCapacity = parseInt(counterElement.getAttribute("data-max")) || 10;
          const currentPackageCapacity = parseInt(counterElement.getAttribute("data-package-capacity")) || 1;
          
          console.log('Decrease clicked, current count:', counterCount);
          
          if (counterCount > 0) {
            counterCount--;
            currentGuestCount = counterCount;
            window.currentGuestCount = currentGuestCount;
            console.log('New count after decrease:', counterCount);
            
            // Update all guest count displays
            document.querySelectorAll(".guestCount").forEach(display => {
              display.textContent = counterCount;
            });
            
            // Update display text using current DOM values
            updateGuestDisplayText(counterElement, counterCount, currentPackageCapacity, currentMaxCapacity);
          }
        });

        counterIncrease.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Re-read data attributes from DOM to get current values (in case they were updated dynamically)
          const currentMaxCapacity = parseInt(counterElement.getAttribute("data-max")) || 10;
          const currentPackageCapacity = parseInt(counterElement.getAttribute("data-package-capacity")) || 1;
          
          console.log('=== INCREASE BUTTON CLICKED ===');
          console.log('counterCount:', counterCount);
          console.log('DOM data-max:', counterElement.getAttribute('data-max'));
          console.log('DOM data-package-capacity:', counterElement.getAttribute('data-package-capacity'));
          console.log('currentMaxCapacity (re-read):', currentMaxCapacity);
          console.log('currentPackageCapacity (re-read):', currentPackageCapacity);
          
          // The limit should be additional guests (maxCapacity - packageCapacity)
          const additionalGuestLimit = currentMaxCapacity - currentPackageCapacity;
          console.log('calculated additionalGuestLimit:', additionalGuestLimit);
          
          if (counterCount < additionalGuestLimit) {
            counterCount++;
            currentGuestCount = counterCount;
            window.currentGuestCount = currentGuestCount;
            console.log('New count after increase:', counterCount);
            
            // Update all guest count displays
            document.querySelectorAll(".guestCount").forEach(display => {
              display.textContent = counterCount;
            });
            
            // Update display text using current DOM values
            console.log('About to call updateGuestDisplayText with current DOM values:', {
              element: counterElement,
              count: counterCount,
              packageCapacity: currentPackageCapacity,
              maxCapacity: currentMaxCapacity
            });
            updateGuestDisplayText(counterElement, counterCount, currentPackageCapacity, currentMaxCapacity);
          } else {
            console.log('Cannot increase - already at additional guest limit:', additionalGuestLimit);
          }
        });
        
      })(count, maxCapacity, packageCapacity, countDisplay, decreaseBtn, increaseBtn, counter);
    });
    
    isInitialized = true;
    console.log('Guest counters initialization complete');
  }

  // Initialize guest counters
  initializeGuestCounters();

  // Add event listener for when DOM is fully ready to force update counters
  setTimeout(() => {
    console.log('Force updating guest counters after page load...');
    window.forceUpdateGuestCounters();
    
    // Also manually trigger update for all counters
    document.querySelectorAll('.guest-counter').forEach(counter => {
      const maxCapacity = parseInt(counter.getAttribute('data-max')) || 10;
      const packageCapacity = parseInt(counter.getAttribute('data-package-capacity')) || 1;
      const countDisplay = counter.querySelector('.guestCount');
      const currentCount = parseInt(countDisplay?.textContent) || 0;
      
      console.log('Manual update for counter:', { maxCapacity, packageCapacity, currentCount });
      updateGuestDisplayText(counter, currentCount, packageCapacity, maxCapacity);
    });
  }, 500);

  // Listen for updates from API data
  document.addEventListener('updateGuestLimit', (event) => {
    console.log('Guest limit update received:', event.detail);
    
    const { maxCapacity, packageCapacity } = event.detail;
    
    // Update the data attributes and display text
    document.querySelectorAll('.guest-counter').forEach(counter => {
      counter.setAttribute('data-max', maxCapacity);
      counter.setAttribute('data-package-capacity', packageCapacity);
      
      // Update display text
      updateGuestDisplayText(counter, currentGuestCount, packageCapacity, maxCapacity);
    });
    
    console.log('Guest counter limits updated - Max:', maxCapacity, 'Package:', packageCapacity);
  });

  // Function to update guest counter capacity from property data
  window.updateGuestCounterCapacity = function(maxCapacity, packageCapacity) {
    console.log('updateGuestCounterCapacity called with:', { maxCapacity, packageCapacity });
    
    const counters = document.querySelectorAll('.guest-counter');
    console.log('Found', counters.length, 'guest counter(s)');
    
    counters.forEach((counter, index) => {
      console.log(`Updating counter ${index}:`, counter);
      counter.setAttribute('data-max', maxCapacity);
      counter.setAttribute('data-package-capacity', packageCapacity);
      
      // Get current count
      const countDisplay = counter.querySelector('.guestCount');
      const currentCount = parseInt(countDisplay?.textContent) || 0;
      
      console.log(`Counter ${index} - Current count: ${currentCount}, updating display...`);
      
      // Update display text
      updateGuestDisplayText(counter, currentCount, packageCapacity, maxCapacity);
    });
  };

  // Function to force update all guest counters (useful for debugging)
  window.forceUpdateGuestCounters = function() {
    console.log('Force updating all guest counters...');
    const counters = document.querySelectorAll('.guest-counter');
    console.log('Found', counters.length, 'counters to update');
    
    counters.forEach((counter, index) => {
      const maxCapacity = parseInt(counter.getAttribute('data-max')) || 10;
      const packageCapacity = parseInt(counter.getAttribute('data-package-capacity')) || 1;
      const countDisplay = counter.querySelector('.guestCount');
      const currentCount = parseInt(countDisplay?.textContent) || 0;
      
      console.log(`Force updating counter ${index}:`, { maxCapacity, packageCapacity, currentCount });
      updateGuestDisplayText(counter, currentCount, packageCapacity, maxCapacity);
    });
  };

  // Handle confirm button click
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      // Update guest summary text
      if (guestSummary) {
        guestSummary.textContent = `${currentGuestCount} ${currentGuestCount === 1 ? 'guest' : 'guests'}`;
      }
      
      // Close the modal and restore scrolling
      if (modal) {
        modal.classList.add("hidden");
        document.body.classList.remove("modal-open"); // Remove scroll lock
      }
    });
  }

  // Test function to debug guest counter functionality
  window.testGuestCounter = function() {
    console.log('Testing guest counter functionality...');
    console.log('Current guest count (global):', window.currentGuestCount);
    console.log('Current guest count (local):', currentGuestCount);
    
    const counter = document.querySelector('.guest-counter');
    if (counter) {
      console.log('Guest counter element found:', counter);
      console.log('Data-max attribute:', counter.getAttribute('data-max'));
      console.log('Data-package-capacity attribute:', counter.getAttribute('data-package-capacity'));
      
      const countDisplay = counter.querySelector('.guestCount');
      if (countDisplay) {
        console.log('Count display value:', countDisplay.textContent);
      }
      
      const guestTitle = counter.querySelector('#guestTitle');
      if (guestTitle) {
        console.log('Guest title text:', guestTitle.textContent);
      }
      
      const packageCapacityText = counter.querySelector('.packageCapacityText');
      if (packageCapacityText) {
        console.log('Package capacity text:', packageCapacityText.textContent);
      }
      
      const additionalGuestText = counter.querySelector('.additionalGuestText');
      if (additionalGuestText) {
        console.log('Additional guest text:', additionalGuestText.textContent);
      }
      
      // Test force update
      console.log('Testing force update...');
      window.forceUpdateGuestCounters();
      
      // Test specific element updates
      const packageCapacityElements = document.querySelectorAll('.packageCapacityText');
      const additionalGuestElements = document.querySelectorAll('.additionalGuestText');
      const maxGuestNumElements = document.querySelectorAll('.maxGuestNum');
      
      console.log('Elements found:', {
        packageCapacity: packageCapacityElements.length,
        additionalGuest: additionalGuestElements.length,
        maxGuestNum: maxGuestNumElements.length
      });
      
      // Force manual update
      packageCapacityElements.forEach(el => el.textContent = '5 guests included');
      maxGuestNumElements.forEach(el => el.textContent = '5');
      additionalGuestElements.forEach(el => el.textContent = 'up to 5 additional guests');
    } else {
      console.log('No guest counter found');
    }
  };
});
