document.addEventListener("DOMContentLoaded", async () => {
  const locationInput = document.querySelector('[data-location-input]');
  const locationList = document.querySelector('[data-location-list]');
  let cities = [];

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

  function createLocationItem(city) {
    return `
      <div class="group w-full px-5 py-3 bg-white font-inter cursor-pointer hover:bg-primary/10 transition-all duration-300 ease-in-out" data-city="${city}">
        <div class="group-active:scale-[0.98] transition-all duration-200 ease-in-out">
          <p class="text-sm font-medium text-primary-text group-hover:text-primary transition-all duration-300 ease-in-out">${city}</p>
          <p class="text-xs text-neutral-500">Philippines</p>
        </div>
      </div>
    `;
  }

  function filterLocations(searchTerm) {
    if (!locationList) return;
    
    const filteredCities = cities.filter(city => 
      city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    locationList.innerHTML = filteredCities
      .map(createLocationItem)
      .join('');
  }

  if (locationInput && locationList) {
    
    await fetchCities();

    locationInput.addEventListener('input', (e) => {
      filterLocations(e.target.value);
    });

    filterLocations('');
  }
});