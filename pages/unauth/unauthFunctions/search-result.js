// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get URL search parameters
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city') || 'Quezon';
    const checkIn = urlParams.get('checkIn') || '2025-09-03';
    const checkOut = urlParams.get('checkOut') || '2025-09-06';
    const priceStart = urlParams.get('priceStartrange') || urlParams.get('priceStart') || 1000;
    const priceEnd = urlParams.get('priceEndrange') || urlParams.get('priceEnd') || 10000;
    const people = urlParams.get('people') || 4;

    // Console log all URL parameters for debugging
    console.log('=== SEARCH PARAMETERS DEBUG ===');
    console.log('URL Search Params:', window.location.search);
    console.log('Raw URL Parameters:');
    console.log('- city (raw):', urlParams.get('city'));
    console.log('- checkIn (raw):', urlParams.get('checkIn'));
    console.log('- checkOut (raw):', urlParams.get('checkOut'));
    console.log('- priceStart (raw):', urlParams.get('priceStart'));
    console.log('- priceEnd (raw):', urlParams.get('priceEnd'));
    console.log('- priceStartrange (raw):', urlParams.get('priceStartrange'));
    console.log('- priceEndrange (raw):', urlParams.get('priceEndrange'));
    console.log('- people (raw):', urlParams.get('people'));
    console.log('Final processed parameters:');
    console.log('- city:', city);
    console.log('- checkIn:', checkIn);
    console.log('- checkOut:', checkOut);
    console.log('- priceStart:', priceStart, 'Type:', typeof priceStart);
    console.log('- priceEnd:', priceEnd, 'Type:', typeof priceEnd);
    console.log('- people:', people, 'Type:', typeof people);
    console.log('================================');

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
        // Ensure all values are properly formatted and valid
        const requestBody = {
            city: city && city.trim() ? city.trim() : 'Manila',
            CheckIn: checkIn || '2025-09-03',
            CheckOut: checkOut || '2025-09-06',
            priceStartrange: Math.max(parseInt(priceStart) || 1, 1),
            priceEndrange: Math.max(parseInt(priceEnd) || 10000, 100),
            people: Math.max(parseInt(people) || 1, 1)
        };

        console.log('=== API REQUEST DEBUG ===');
        console.log('API Endpoint:', 'https://betcha-api.onrender.com/property/searchGuest');
        console.log('Request Method:', 'POST');
        console.log('Request Headers:', {
            'Content-Type': 'application/json',
        });
        console.log('Request Body:', requestBody);
        console.log('Request Body (JSON):', JSON.stringify(requestBody, null, 2));
        console.log('========================');

        try {
            console.log('Making API request...');
            const response = await fetch('https://betcha-api.onrender.com/property/searchGuest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('=== API RESPONSE DEBUG ===');
            console.log('Response Status:', response.status);
            console.log('Response Status Text:', response.statusText);
            console.log('Response OK:', response.ok);
            console.log('Response Headers:', response.headers);
            console.log('=========================');

            if (!response.ok) {
                console.error('API Error - Response not OK');
                console.error('Status:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error Response Body:', errorText);
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('=== API RESPONSE DATA ===');
            console.log('Full Response:', data);
            console.log('Data Structure:', {
                hasData: !!data.data,
                dataType: typeof data.data,
                dataLength: Array.isArray(data.data) ? data.data.length : 'Not an array',
                dataKeys: data.data ? Object.keys(data.data) : 'No data property'
            });
            
            if (data.data && Array.isArray(data.data)) {
                console.log('Properties Found:', data.data.length);
                if (data.data.length > 0) {
                    console.log('First Property Sample:', data.data[0]);
                }
            } else {
                console.log('No properties array found in response');
            }
            console.log('========================');
            
            return data.data;
        } catch (error) {
            console.error('=== API ERROR DEBUG ===');
            console.error('Error Type:', error.constructor.name);
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
            console.error('======================');
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
        console.log('=== POPULATE ROOMS DEBUG ===');
        const roomListingsContainer = document.getElementById('roomListingsContainer');
        console.log('Room container found:', !!roomListingsContainer);
        
        if (!roomListingsContainer) {
            console.error('Room listings container not found');
            return;
        }

        console.log('Showing skeleton loading...');
        // Show skeleton loading
        roomListingsContainer.innerHTML = Array(8).fill(createSkeletonCard()).join('');

        console.log('Fetching properties...');
        // Fetch the actual properties
        const properties = await fetchProperties();
        
        console.log('Properties result:', properties);
        console.log('Properties type:', typeof properties);
        console.log('Properties is array:', Array.isArray(properties));
        console.log('Properties length:', properties ? properties.length : 'null/undefined');
        
        // Small delay to ensure skeleton is visible
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!properties || properties.length === 0) {
            console.log('No properties found - showing no results message');
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

        console.log('Rendering', properties.length, 'properties...');
        roomListingsContainer.innerHTML = '';
        properties.forEach((property, index) => {
            console.log(`Rendering property ${index + 1}:`, property.name, property._id);
            roomListingsContainer.innerHTML += createRoomCard(property);
        });
        console.log('Room rendering complete');
        console.log('===========================');
    }

    // Call populateRoomListings after ensuring DOM is loaded
    populateRoomListings();
});
