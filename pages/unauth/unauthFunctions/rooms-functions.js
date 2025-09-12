// Function to create property card HTML
function createPropertyCard(property) {
    return `
            <a href="view-property.html?id=${property._id}" onmouseenter="console.log('Card hovered')" onmouseleave="console.log('Card left')">
              <div class="room-list">
                <div class="bg-neutral-300 w-full aspect-square rounded-3xl mb-3 overflow-hidden">
                  <img src="${property.photoLinks[0]}" alt="${property.name}" 
                    onmouseenter="console.log('Image hovered')" 
                    onmouseleave="console.log('Image left')"
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

// Function to fetch and display properties by category
async function fetchAndDisplayProperties() {
    console.log('fetchAndDisplayProperties called');
    try {
        console.log('Fetching from API...');
        const response = await fetch('https://betcha-api.onrender.com/property/byCategory');
        const data = await response.json();
        console.log('API response received:', data);

        // Get all tab content containers
        const familyContainer = document.querySelector('#familyContent');
        const coupleContainer = document.querySelector('#coupleContent');
        const barkadaContainer = document.querySelector('#barkadaContent');
        const otherContainer = document.querySelector('#otherContent');

        console.log('Containers found:', {
            familyContainer: !!familyContainer,
            coupleContainer: !!coupleContainer,
            barkadaContainer: !!barkadaContainer,
            otherContainer: !!otherContainer
        });

        // Update each category container
        if (familyContainer && data.family) {
            console.log('Populating family container with', data.family.length, 'properties');
            familyContainer.innerHTML = data.family.map(property => createPropertyCard(property)).join('');
        }
        if (coupleContainer && data.couple) {
            console.log('Populating couple container with', data.couple.length, 'properties');
            coupleContainer.innerHTML = data.couple.map(property => createPropertyCard(property)).join('');
        }
        if (barkadaContainer && data.barkada) {
            console.log('Populating barkada container with', data.barkada.length, 'properties');
            barkadaContainer.innerHTML = data.barkada.map(property => createPropertyCard(property)).join('');
        }
        if (otherContainer && data.other) {
            console.log('Populating other container with', data.other.length, 'properties');
            otherContainer.innerHTML = data.other.map(property => createPropertyCard(property)).join('');
        }
    } catch (error) {
        console.error('Error fetching properties:', error);
    }
}

// Function to create featured property card HTML
function createFeaturedPropertyCard(property) {
    const imageUrl = property.photoLinks && property.photoLinks.length > 0 ? property.photoLinks[0] : '/public/images/unit01.jpg';
    return `
        <div class="card group relative shrink-0 w-full sm:w-[calc(100%/2-10px)] lg:w-[calc(100%/3-14px)] h-72 sm:h-80 lg:h-96 rounded-2xl shadow-md overflow-hidden cursor-pointer" onclick="window.location.href='view-property.html?id=${property._id}'">
            <div class="absolute inset-0 bg-cover bg-center z-0 transform transition-transform duration-500 ease-in-out group-hover:scale-110" id="imageProperty1" style="background-image: url('${imageUrl}')"></div>
            <div class="absolute h-[70%] bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-black/0 z-10"></div>

            <div class="relative z-20 h-full flex flex-col justify-end p-6">
                <h2 class="text-2xl font-manrope mb-2 text-secondary-text" id="nameProperty1">${property.name || 'Property name'}</h2>

                <div class="flex items-center w-full gap-2 mb-5">
                    <svg class="w-auto h-3.5 fill-secondary-text" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 0C2.68628 0 0 2.86538 0 6.4C9.53674e-07 9.93458 3 12.8 6 16C9 12.8 12 9.93458 12 6.4C12 2.86538 9.31371 1.69648e-07 6 0ZM6 3.55555C7.4202 3.55555 8.57143 4.74946 8.57143 6.22221C8.57143 7.69501 7.4202 8.88888 6 8.88888C4.5798 8.88888 3.42857 7.69501 3.42857 6.22221C3.42857 4.74946 4.5798 3.55555 6 3.55555Z" />
                    </svg>
                    <p class="font-inter text-secondary-text text-sm" id="addressProperty1">${property.address || 'Barangay/City'}</p>
                </div>

                <div class="flex items-center w-full gap-2">
                    <p class="font-inter text-secondary-text text-sm">Learn more</p>
                    <svg class="w-5 h-5 fill-secondary-text" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.707 6.13598L20.364 11.793C20.5515 11.9805 20.6568 12.2348 20.6568 12.5C20.6568 12.7651 20.5515 13.0194 20.364 13.207L14.707 18.864C14.5184 19.0461 14.2658 19.1469 14.0036 19.1447C13.7414 19.1424 13.4906 19.0372 13.3052 18.8518C13.1198 18.6664 13.0146 18.4156 13.0123 18.1534C13.01 17.8912 13.1108 17.6386 13.293 17.45L17.243 13.5H4C3.73478 13.5 3.48043 13.3946 3.29289 13.2071C3.10536 13.0195 3 12.7652 3 12.5C3 12.2348 3.10536 11.9804 3.29289 11.7929C3.48043 11.6053 3.73478 11.5 4 11.5H17.243L13.293 7.54998C13.1108 7.36136 13.01 7.10875 13.0123 6.84653C13.0146 6.58431 13.1198 6.33352 13.3052 6.14812C13.4906 5.96272 13.7414 5.85749 14.0036 5.85521C14.2658 5.85292 14.5184 5.95373 14.707 6.13598Z" />
                    </svg>
                </div>
            </div>
        </div>
    `;
}

// Function to create skeleton loading cards
function createSkeletonCards(count = 3) {
    return Array(count).fill(`
        <div class="card group relative shrink-0 w-full sm:w-[calc(100%/2-10px)] lg:w-[calc(100%/3-14px)] h-72 sm:h-80 lg:h-96 rounded-2xl shadow-md overflow-hidden animate-pulse">
            <div class="absolute inset-0 bg-neutral-200"></div>
            <div class="absolute h-[70%] bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-black/0 z-10"></div>
            <div class="relative z-20 h-full flex flex-col justify-end p-6">
                <div class="h-8 bg-neutral-300 rounded w-2/3 mb-2"></div>
                <div class="h-4 bg-neutral-300 rounded w-1/2 mb-5"></div>
                <div class="h-4 bg-neutral-300 rounded w-1/4"></div>
            </div>
        </div>
    `).join('');
}

// Function to create ads banner skeleton loading
function createAdsBannerSkeleton() {
    return `
        <div class="absolute inset-0 w-full h-full bg-neutral-100 animate-pulse"></div>
        <div class="relative z-10">
            <div class="h-8 md:h-12 w-3/4 bg-green-200 rounded animate-pulse mx-auto"></div>
            <div class="h-4 md:h-6 w-1/2 bg-green-200 rounded animate-pulse mx-auto mt-2 md:mt-4"></div>
        </div>
    `;
}

// Function to create hero section skeleton loading
function createHeroSkeleton() {
    return `
        <div class="absolute inset-0 backdrop-blur-xs bg-green-950/20 z-10 pointer-events-none"></div>
        <div class="absolute inset-0 z-20 flex items-center justify-center">
            <div class="w-fit flex flex-col gap-4">
                <div class="h-8 sm:h-12 md:h-16 lg:h-20 w-48 sm:w-64 md:w-80 lg:w-96 bg-neutral-400 rounded animate-pulse"></div>
                <div class="h-8 sm:h-12 md:h-16 lg:h-20 w-48 sm:w-64 md:w-80 lg:w-96 bg-neutral-400 rounded animate-pulse"></div>
            </div>
        </div>
    `;
}

// Function to fetch and update the ads banner and featured properties
async function updateAdsBanner() {
    try {
        // Show skeleton loading for ads banner
        const adsBanner = document.querySelector('.relative.flex.flex-col.justify-center.items-center');
        const heroSection = document.querySelector('.relative.m-10.w-full.h-\\[200px\\]');
        
        if (adsBanner) {
            adsBanner.innerHTML = createAdsBannerSkeleton();
        }
        if (heroSection) {
            heroSection.innerHTML = createHeroSkeleton();
        }

        const thisMonthContainer = document.getElementById('thisMonthContainer');
        if (thisMonthContainer) {
            thisMonthContainer.innerHTML = createSkeletonCards(3);
        }

        const response = await fetch('https://betcha-api.onrender.com/landing/display/68a735c07753114c9e87c793');
        const data = await response.json();

        // Add delay for smooth loading animation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update banner elements
        if (adsBanner) {
            adsBanner.innerHTML = `
                <img id="imageBanner" src="${data.imageLink}" 
                    class="absolute inset-0 w-full h-full object-cover filter blur-xs brightness-80"/>
                <div class="relative z-10" style="color: ${data.txtColor || 'white'}">
                    <h1 class="text-lg md:text-4xl font-bold tracking-wide drop-shadow-lg" id="titleBanner">${data.title}</h1>
                    <p class="text-xs md:text-lg mt-1 md:mt-4 max-w-xl drop-shadow-lg" id="contentBanner">${data.content}</p>
                </div>
            `;
        }

        // Update hero section
        if (heroSection) {
            heroSection.innerHTML = `
                <div class="absolute inset-0 backdrop-blur-xs bg-green-950/30 z-10 pointer-events-none"></div>
                <div class="absolute inset-0 z-20 flex items-center justify-center" id="dashImg">
                    <div class="w-fit text-secondary-text text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-playfairDisplay italic font-bold text-center flex flex-col">
                        <span>Feel at Home,</span>
                        <span>Every Stay.</span>
                    </div>
                </div>
            `;
        }

        // Update featured properties
        if (thisMonthContainer && data.featured) {
            thisMonthContainer.innerHTML = data.featured.map(property => createFeaturedPropertyCard(property)).join('');
            
            // Reinitialize carousel after loading featured properties
            const wrapper = thisMonthContainer.closest('.carousel-wrapper');
            if (wrapper && window.initializeCarousel) {
                window.initializeCarousel(wrapper);
            }
        }
    } catch (error) {
        console.error('Error fetching ads banner data:', error);
    }
}

// Function to fetch top properties
async function fetchTopProperties() {
    try {
        const response = await fetch('https://betcha-api.onrender.com/booking/top-properties');
        const data = await response.json();
        return data.properties;
    } catch (error) {
        console.error('Error fetching top properties:', error);
        return [];
    }
}

// Function to create popular property card HTML
function createPopularPropertyCard(property) {
    const imageUrl = property.photoLinks && property.photoLinks.length > 0 ? property.photoLinks[0] : '/public/images/unit01.jpg';
    return `
        <div class="card group relative shrink-0 w-full sm:w-[calc(100%/2-10px)] lg:w-[calc(100%/3-14px)] h-72 sm:h-80 lg:h-96 rounded-2xl shadow-md overflow-hidden cursor-pointer" onclick="window.location.href='view-property.html?id=${property._id}'">
            <div class="absolute inset-0 bg-cover bg-center z-0 transform transition-transform duration-500 ease-in-out group-hover:scale-110" id="imageProperty" style="background-image: url('${imageUrl}')"></div>
            <div class="absolute h-[70%] bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-black/0 z-10"></div>

            <div class="relative z-20 h-full flex flex-col justify-end p-6">
                <h2 class="text-2xl font-manrope mb-2 text-secondary-text" id="nameProperty">${property.name || 'Property name'}</h2>

                <div class="flex items-center w-full gap-2 mb-5">
                    <svg class="w-auto h-3.5 fill-secondary-text" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 0C2.68628 0 0 2.86538 0 6.4C9.53674e-07 9.93458 3 12.8 6 16C9 12.8 12 9.93458 12 6.4C12 2.86538 9.31371 1.69648e-07 6 0ZM6 3.55555C7.4202 3.55555 8.57143 4.74946 8.57143 6.22221C8.57143 7.69501 7.4202 8.88888 6 8.88888C4.5798 8.88888 3.42857 7.69501 3.42857 6.22221C3.42857 4.74946 4.5798 3.55555 6 3.55555Z" />
                    </svg>
                    <p class="font-inter text-secondary-text text-sm" id="addressProperty">${property.address || 'Barangay/City'}</p>
                </div>

                <div class="flex items-center w-full gap-2">
                    <p class="font-inter text-secondary-text text-sm">Learn more</p>
                    <svg class="w-5 h-5 fill-secondary-text" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.707 6.13598L20.364 11.793C20.5515 11.9805 20.6568 12.2348 20.6568 12.5C20.6568 12.7651 20.5515 13.0194 20.364 13.207L14.707 18.864C14.5184 19.0461 14.2658 19.1469 14.0036 19.1447C13.7414 19.1424 13.4906 19.0372 13.3052 18.8518C13.1198 18.6664 13.0146 18.4156 13.0123 18.1534C13.01 17.8912 13.1108 17.6386 13.293 17.45L17.243 13.5H4C3.73478 13.5 3.48043 13.3946 3.29289 13.2071C3.10536 13.0195 3 12.7652 3 12.5C3 12.2348 3.10536 11.9804 3.29289 11.7929C3.48043 11.6053 3.73478 11.5 4 11.5H17.243L13.293 7.54998C13.1108 7.36136 13.01 7.10875 13.0123 6.84653C13.0146 6.58431 13.1198 6.33352 13.3052 6.14812C13.4906 5.96272 13.7414 5.85749 14.0036 5.85521C14.2658 5.85292 14.5184 5.95373 14.707 6.13598Z" />
                    </svg>
                </div>
            </div>
        </div>
    `;
}

// Function to populate popular rooms carousel
async function populatePopularRooms() {
    const track = document.getElementById('popularProperty');
    
    if (!track) {
        console.error('Popular property carousel track not found');
        return;
    }

    // Show skeleton loading
    track.innerHTML = createSkeletonCards(3);

    try {
        const properties = await fetchTopProperties();
        
        // Add delay for smooth loading animation
        await new Promise(resolve => setTimeout(resolve, 500));

        if (properties && properties.length > 0) {
            track.innerHTML = properties
                .map(({ property }) => createPopularPropertyCard(property))
                .join('');

            // Reinitialize carousel after loading content
            const wrapper = track.closest('.carousel-wrapper');
            if (wrapper && window.initializeCarousel) {
                window.initializeCarousel(wrapper);
            }
        }
    } catch (error) {
        console.error('Error fetching popular properties:', error);
    }
}

// Initialize all functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired in rooms-functions.js');
    updateAdsBanner();
    populatePopularRooms();
    fetchAndDisplayProperties();
});
