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
  priceStart: 0,
  priceEnd: 100000
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

    // Pills click handlers for direct editing
    function setupPillClickHandlers() {
      const pills = [
        { element: locationPill, tabIndex: 0 }, // Where -> Location tab (first)
        { element: datePill, tabIndex: 1 },     // When -> Date tab (second)
        { element: guestPill, tabIndex: 2 },    // Who -> Guest tab (third)
        { element: pricePill, tabIndex: 3 }     // Price -> Price tab (fourth)
      ];
      
      pills.forEach(({ element, tabIndex }) => {
        if (element) {
          element.addEventListener('click', () => {
            setActiveTab(tabIndex);
          });
        }
      });
    }

    // Initialize search state handlers
    function updatePills() {
      // Helper to set pill label and value
      function setPill(pill, label, valueHtml) {
        pill.querySelector('.pill-text').innerHTML = `<span class="font-semibold">${label}</span>` + (valueHtml ? ` <span class="text-xs text-neutral-500 ml-1">${valueHtml}</span>` : '');
      }

      // Location pill
      setPill(locationPill, 'Where', searchState.city ? searchState.city : '');

      // Date pill
      let dateValue = '';
      if (searchState.checkIn && searchState.checkOut) {
        // Format: Sept 2, 25 - Sept 4, 25
        function formatDate(dateStr) {
          const d = new Date(dateStr);
          const month = d.toLocaleString('en-US', { month: 'short' });
          const day = d.getDate();
          const year = String(d.getFullYear()).slice(-2);
          return `${month} ${day}, ${year}`;
        }
        dateValue = `${formatDate(searchState.checkIn)} - ${formatDate(searchState.checkOut)}`;
      } else if (searchState.checkIn) {
        function formatDate(dateStr) {
          const d = new Date(dateStr);
          const month = d.toLocaleString('en-US', { month: 'short' });
          const day = d.getDate();
          const year = String(d.getFullYear()).slice(-2);
          return `${month} ${day}, ${year}`;
        }
        dateValue = `${formatDate(searchState.checkIn)} - Select checkout`;
      }
      setPill(datePill, 'When', dateValue);

      // Guest pill
      let guestValue = '';
      if (searchState.guests > 0) {
        guestValue = `${searchState.guests} ${searchState.guests === 1 ? 'guest' : 'guests'}`;
      }
      setPill(guestPill, 'Who', guestValue);

      // Price pill
      let priceValue = '';
      if (searchState.priceStart || searchState.priceEnd) {
        priceValue = `PHP ${searchState.priceStart.toLocaleString()} - ${searchState.priceEnd.toLocaleString()}`;
      }
      setPill(pricePill, 'Price', priceValue);
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
      checkInInput.addEventListener('input', () => {
        searchState.checkIn = checkInInput.value;
        console.log('Check-in date updated:', searchState.checkIn);
        updatePills();
      });

      checkOutInput.addEventListener('input', () => {
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
        searchState.priceStart = 0;
        searchState.priceEnd = 100000;

        // Reset inputs
        if (locationInput) locationInput.value = '';
        document.getElementById('searchCheckIn').value = '';
        document.getElementById('searchCheckOut').value = '';
        if (guestCount) guestCount.textContent = '1';
        if (minPrice) minPrice.value = '0';
        if (maxPrice) maxPrice.value = '100000';
        if (minRange) minRange.value = '0';
        if (maxRange) maxRange.value = '100000';

        updatePills();
      });
    }

    // Make setActiveTab available globally
    window.setActiveTab = setActiveTab;

    // Setup pill click handlers
    setupPillClickHandlers();

    // Initial pills update
  // Set initial price range inputs
  if (minPrice) minPrice.value = '0';
  if (maxPrice) maxPrice.value = '100000';
  if (minRange) minRange.value = '0';
  if (maxRange) maxRange.value = '100000';
  updatePills();
  }

  // Initialize
  initializeSearchModal();
});
