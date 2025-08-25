// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get URL search parameters
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city') || 'Quezon';
    const checkIn = urlParams.get('checkIn') || '2025-09-03';
    const checkOut = urlParams.get('checkOut') || '2025-09-06';
    const priceStart = urlParams.get('priceStart') || 1000;
    const priceEnd = urlParams.get('priceEnd') || 10000;
    const people = urlParams.get('people') || 4;

    // Update the filter pills
    const whereEl = document.getElementById('wherePill');
    const whenEl = document.getElementById('whenPill');
    const whoEl = document.getElementById('whoPill');
    const priceEl = document.getElementById('pricePill');

    // Format dates
    const checkInDate = new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const checkOutDate = new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (whereEl) whereEl.textContent = `Where · ${city}`;
    if (whenEl) whenEl.textContent = `When · ${checkInDate} - ${checkOutDate}`;
    if (whoEl) whoEl.textContent = `Who · ${people} guests`;
    if (priceEl) priceEl.textContent = `Price · ₱${parseInt(priceStart).toLocaleString()} - ₱${parseInt(priceEnd).toLocaleString()}`;

    // Function to fetch properties
    async function fetchProperties() {
        try {
            const response = await fetch('https://betcha-api.onrender.com/property/searchGuest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    city: city,
                    CheckIn: checkIn,
                    CheckOut: checkOut,
                    priceStartrange: parseInt(priceStart),
                    priceEndrange: parseInt(priceEnd),
                    people: parseInt(people)
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching properties:', error);
            return [];
        }
    }

    // Function to create room card
    function createRoomCard(property) {
        return `
            <a href="view-property.html?id=${property._id}">
              <div class="room-list">
                <div class="bg-neutral-300 w-full aspect-square rounded-3xl mb-3 overflow-hidden">
                  <img src="${property.photoLinks[0]}" alt="${property.name}" 
                    class="w-full h-full object-cover rounded-3xl transform transition-transform duration-500 ease-in-out hover:scale-110">
                </div>
                <div class="flex flex-col items-start mx-3">
                  <div class="flex justify-between items-center w-full">
                    <p id="roomName" class="font-roboto text-primary-text" id="name">${property.name}</p>
                    <div class="flex items-center gap-1">
                      <svg class="w-auto h-3 fill-primary-text" viewBox="0 0 19 18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.82768 1.10245C8.33862 -0.367484 10.4175 -0.367484 10.9284 1.10245L12.0903 4.44504C12.3157 5.09349 12.9209 5.53316 13.6072 5.54715L17.1453 5.61925C18.7011 5.65096 19.3435 7.62805 18.1034 8.56823L15.2835 10.7062C14.7364 11.1209 14.5053 11.8323 14.7041 12.4894L15.7288 15.8766C16.1795 17.3661 14.4976 18.588 13.2203 17.6991L10.3156 15.6779C9.75205 15.2857 9.00404 15.2857 8.44053 15.6779L5.53583 17.6991C4.25845 18.588 2.57664 17.3661 3.02728 15.8766L4.05202 12.4894C4.25082 11.8323 4.01967 11.1209 3.4726 10.7062L0.652656 8.56823C-0.587445 7.62805 0.0549511 5.65096 1.61084 5.61925L5.14887 5.54715C5.83524 5.53316 6.44039 5.09349 6.66579 4.44504L7.82768 1.10245Z" />
                      </svg>
                      <span id="rating" class="font-roboto text-primary-text">${property.rating}</span>
                    </div>
                  </div>
                  <div class="flex items-center w-full gap-2 mb-2.5">
                    <svg class="w-auto h-3.5 fill-muted" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 0C2.68628 0 0 2.86538 0 6.4C9.53674e-07 9.93458 3 12.8 6 16C9 12.8 12 9.93458 12 6.4C12 2.86538 9.31371 1.69648e-07 6 0ZM6 3.55555C7.4202 3.55555 8.57143 4.74946 8.57143 6.22221C8.57143 7.69501 7.4202 8.88888 6 8.88888C4.5798 8.88888 3.42857 7.69501 3.42857 6.22221C3.42857 4.74946 4.5798 3.55555 6 3.55555Z" />
                    </svg>
                    <p id="roomAdress" class="font-roboto text-muted text-sm" id="adress">${property.city}</p>
                  </div>
                  <p class="font-roboto text-primary-text">₱ <span id="roomPrice" class="font-roboto text-primary-text" id="packagePrice">${property.packagePrice.toLocaleString()}</span> <span class="font-roboto text-muted">/ day</span></p>
                </div>
              </div>
            </a>
        `;
    }

    // Function to create skeleton loading card
    function createSkeletonCard() {
        return `
            <div class="animate-pulse">
                <div class="room-list">
                    <div class="bg-neutral-200 w-full aspect-square rounded-3xl mb-3"></div>
                    <div class="flex flex-col items-start mx-3">
                        <div class="flex justify-between items-center w-full">
                            <div class="h-4 bg-neutral-200 rounded-full w-2/3"></div>
                            <div class="flex items-center gap-1">
                                <div class="h-4 bg-neutral-200 rounded-full w-10"></div>
                            </div>
                        </div>
                        <div class="flex items-center w-full gap-2 mb-2.5 mt-2">
                            <div class="h-4 bg-neutral-200 rounded-full w-1/3"></div>
                        </div>
                        <div class="h-4 bg-neutral-200 rounded-full w-1/2"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Function to populate room listings
    async function populateRoomListings() {
        const roomListingsContainer = document.getElementById('roomListingsContainer');
        if (!roomListingsContainer) {
            console.error('Room listings container not found');
            return;
        }

        // Show skeleton loading
        roomListingsContainer.innerHTML = Array(8).fill(createSkeletonCard()).join('');

        // Fetch the actual properties
        const properties = await fetchProperties();
        
        // Small delay to ensure skeleton is visible
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!properties || properties.length === 0) {
            roomListingsContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 px-4">
                    <svg class="w-16 h-16 mb-4 fill-neutral-300" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h12v2H6zm0-3h12v2H6zm0 6h8v2H6z"/>
                    </svg>
                    <h3 class="text-xl font-bold text-primary-text mb-2">No matches found</h3>
                    <p class="text-muted text-center max-w-md">
                        We couldn't find any properties matching your search criteria. 
                        Try adjusting your filters or searching for a different location.
                    </p>
                    <a href="rooms.html" 
                        class="mt-6 px-6 py-2 bg-primary text-[#ffffff] font-medium rounded-full hover:shadow-lg transition-all duration-300 ease-in-out inline-block">
                        <span class="text-[#ffffff]">Back to Rooms</span>
                    </a>
                </div>
            `;
            return;
        }

        roomListingsContainer.innerHTML = '';
        properties.forEach(property => {
            roomListingsContainer.innerHTML += createRoomCard(property);
        });
    }

    // Call populateRoomListings after ensuring DOM is loaded
    populateRoomListings();
});
