document.addEventListener("DOMContentLoaded", async () => {
  const locationInput = document.querySelector('[data-location-input]');
  const locationList = document.querySelector('[data-location-list]');
  let cities = [];

  // Fetch cities from API
  async function fetchCities() {
    try {
      const response = await fetch('https://betcha-api.onrender.com/cities');
      const data = await response.json();
      cities = data.cities;
      return cities;
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  // Generate location item HTML
  function createLocationItem(city) {
    return `
      <div class="group p-3 hover:bg-neutral-50 cursor-pointer transition-colors active:scale-[0.98]" data-city="${city}">
        <p class="font-medium text-primary-text group-hover:text-primary transition-colors">${city}</p>
        <p class="text-sm text-neutral-500">Philippines</p>
      </div>
    `;
  }

  // Filter and display locations
  function filterLocations(searchTerm) {
    if (!locationList) return;
    
    const filteredCities = cities.filter(city => 
      city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    locationList.innerHTML = filteredCities
      .map(createLocationItem)
      .join('');
  }

  // Initialize
  if (locationInput && locationList) {
    // Fetch initial cities
    await fetchCities();

    // Setup input handler
    locationInput.addEventListener('input', (e) => {
      filterLocations(e.target.value);
    });

    // Show all cities initially
    filterLocations('');
  }
});