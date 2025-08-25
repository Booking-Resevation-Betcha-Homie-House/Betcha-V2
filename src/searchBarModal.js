document.addEventListener("DOMContentLoaded", () => {
  function initializeSearchModal() {
    const searchModal = document.getElementById('searchModal');
    if (!searchModal) return;

    // Search state object
    const searchState = {
      city: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      priceStart: 1000,
      priceEnd: 20000
    };

    const tabs = searchModal.querySelectorAll('.tab-btn');
    const contents = searchModal.querySelectorAll('.tab-content');

    // Pills elements
    const locationPill = document.getElementById('locationPill');
    const datePill = document.getElementById('datePill');
    const guestPill = document.getElementById('guestPill');
    const pricePill = document.getElementById('pricePill');

    function setActiveTab(index) {
      // Update tab buttons
      tabs.forEach((tab, i) => {
        const span = tab.querySelector('span');
        if (i === index) {
          tab.classList.add('bg-white', 'shadow');
          span.classList.remove('text-neutral-500');
          span.classList.add('text-primary');
        } else {
          tab.classList.remove('bg-white', 'shadow');
          span.classList.remove('text-primary');
          span.classList.add('text-neutral-500');
        }
      });

      // Update content visibility
      contents.forEach((content, i) => {
        if (i === index) {
          content.classList.remove('hidden');
          content.classList.add('flex');
        } else {
          content.classList.add('hidden');
          content.classList.remove('flex');
        }
      });
    }

    // Add click handlers
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => setActiveTab(index));
    });

    // Initialize first tab
    setActiveTab(0);

    // Handle modal open/close
    const searchTrigger = document.getElementById('searchTrigger');
    const closeBtn = searchModal.querySelector('[data-close-modal]');

    if (searchTrigger) {
      searchTrigger.addEventListener('click', () => {
        searchModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        // Reset to first tab when opening
        setActiveTab(0);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        searchModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
      });
    }

    // Initialize search state handlers
    function updatePills() {
      // Location pill
      if (searchState.city) {
        locationPill.classList.remove('hidden');
        locationPill.classList.add('flex');
        locationPill.querySelector('.pill-text').textContent = searchState.city;
      } else {
        locationPill.classList.add('hidden');
        locationPill.classList.remove('flex');
      }

      // Date pill
      if (searchState.checkIn || searchState.checkOut) {
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        datePill.classList.remove('hidden');
        datePill.classList.add('flex');
        
        if (searchState.checkIn && searchState.checkOut) {
          const checkInDate = new Date(searchState.checkIn);
          const checkOutDate = new Date(searchState.checkOut);
          datePill.querySelector('.pill-text').textContent = 
            `${checkInDate.toLocaleDateString('en-US', options)} - ${checkOutDate.toLocaleDateString('en-US', options)}`;
        } else if (searchState.checkIn) {
          const checkInDate = new Date(searchState.checkIn);
          datePill.querySelector('.pill-text').textContent = 
            `${checkInDate.toLocaleDateString('en-US', options)} - Select checkout`;
        }
        console.log('Date pill updated:', datePill.querySelector('.pill-text').textContent);
      } else {
        datePill.classList.add('hidden');
        datePill.classList.remove('flex');
      }

      // Guest pill
      if (searchState.guests > 0) {
        guestPill.classList.remove('hidden');
        guestPill.classList.add('flex');
        guestPill.querySelector('.pill-text').textContent = 
          `${searchState.guests} ${searchState.guests === 1 ? 'guest' : 'guests'}`;
      } else {
        guestPill.classList.add('hidden');
        guestPill.classList.remove('flex');
      }

      // Price pill
      if (searchState.priceStart || searchState.priceEnd) {
        pricePill.classList.remove('hidden');
        pricePill.classList.add('flex');
        pricePill.querySelector('.pill-text').textContent = 
          `PHP ${searchState.priceStart.toLocaleString()} - ${searchState.priceEnd.toLocaleString()}`;
      } else {
        pricePill.classList.add('hidden');
        pricePill.classList.remove('flex');
      }
    }

    // Location selection handler
    const locationInput = document.getElementById('searchCity');
    const locationList = document.querySelector('[data-location-list]');
    
    if (locationList) {
      locationList.addEventListener('click', (e) => {
        const cityItem = e.target.closest('[data-city]');
        if (cityItem) {
          searchState.city = cityItem.getAttribute('data-city');
          locationInput.value = searchState.city;
          updatePills();
        }
      });
    }

    // Calendar date selection handler
    const checkInInput = document.getElementById('searchCheckIn');
    const checkOutInput = document.getElementById('searchCheckOut');
    
    if (checkInInput && checkOutInput) {
      checkInInput.addEventListener('change', () => {
        searchState.checkIn = checkInInput.value;
        console.log('Check-in date updated:', searchState.checkIn);
        updatePills();
      });

      checkOutInput.addEventListener('change', () => {
        searchState.checkOut = checkOutInput.value;
        console.log('Check-out date updated:', searchState.checkOut);
        updatePills();
      });
    }

    // Guest count handler
    const guestCount = document.getElementById('searchGuestCount');
    if (guestCount) {
      const observer = new MutationObserver(() => {
        searchState.guests = parseInt(guestCount.textContent);
        updatePills();
      });

      observer.observe(guestCount, { 
        characterData: true, 
        childList: true, 
        subtree: true 
      });
    }

    // Price range handler
    const minPrice = document.getElementById('input-minPrice');
    const maxPrice = document.getElementById('input-maxPrice');
    const minRange = document.getElementById('minRange');
    const maxRange = document.getElementById('maxRange');

    [minPrice, maxPrice, minRange, maxRange].forEach(input => {
      if (input) {
        input.addEventListener('change', () => {
          searchState.priceStart = parseInt(minPrice.value || minRange.value);
          searchState.priceEnd = parseInt(maxPrice.value || maxRange.value);
          updatePills();
        });
      }
    });

    // Clear button handler
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchState.city = '';
        searchState.checkIn = '';
        searchState.checkOut = '';
        searchState.guests = 1;
        searchState.priceStart = 1000;
        searchState.priceEnd = 20000;

        // Reset inputs
        if (locationInput) locationInput.value = '';
        document.getElementById('searchCheckIn').value = '';
        document.getElementById('searchCheckOut').value = '';
        if (guestCount) guestCount.textContent = '1';
        if (minPrice) minPrice.value = '1000';
        if (maxPrice) maxPrice.value = '20000';
        if (minRange) minRange.value = '1000';
        if (maxRange) maxRange.value = '20000';

        updatePills();
      });
    }

    // Make setActiveTab available globally
    window.setActiveTab = setActiveTab;

    // Initial pills update
    updatePills();
  }

  // Initialize
  initializeSearchModal();
});
