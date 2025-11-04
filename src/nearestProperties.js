console.log('Nearest Properties functionality loaded');

class NearestPropertiesManager {
    constructor() {
        this.userLocation = null;
        this.properties = [];
        this.initializeElements();
        this.setupEventListeners();
        this.checkLocationPermission();
    }

    initializeElements() {
        this.locationPermissionBtn = document.getElementById('locationPermissionBtn');
        this.enableLocationBtn = document.getElementById('enableLocationBtn');
        this.retryLocationBtn = document.getElementById('retryLocationBtn');
        this.locationStatus = document.getElementById('locationStatus');
        this.loadingState = document.getElementById('nearestPropertiesLoading');
        this.permissionRequiredState = document.getElementById('locationPermissionRequired');
        this.errorState = document.getElementById('nearestPropertiesError');
        this.carouselWrapper = document.getElementById('nearestPropertiesCarousel');
        this.container = document.getElementById('nearestPropertiesContainer');
    }

    setupEventListeners() {
        if (this.locationPermissionBtn) {
            this.locationPermissionBtn.addEventListener('click', () => this.requestLocation());
        }
        if (this.enableLocationBtn) {
            this.enableLocationBtn.addEventListener('click', () => this.requestLocation());
        }
        if (this.retryLocationBtn) {
            this.retryLocationBtn.addEventListener('click', () => this.requestLocation());
        }
    }

    async checkLocationPermission() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            
            if (permission.state === 'granted') {
                this.getCurrentLocation();
            } else if (permission.state === 'denied') {
                this.showPermissionRequired();
            } else {
                this.showPermissionRequired();
            }

            permission.addEventListener('change', () => {
                if (permission.state === 'granted') {
                    this.getCurrentLocation();
                } else if (permission.state === 'denied') {
                    this.showPermissionRequired();
                }
            });
        } catch {
            console.log('Permission API not supported, showing permission request');
            this.showPermissionRequired();
        }
    }

    showState(stateName) {
        // Hide all states
        this.permissionRequiredState.style.display = 'none';
        this.loadingState.style.display = 'none';
        this.errorState.style.display = 'none';
        this.carouselWrapper.style.display = 'none';

        // Show requested state
        switch (stateName) {
            case 'permission':
                this.permissionRequiredState.style.display = 'flex';
                if (this.locationPermissionBtn) {
                    this.locationPermissionBtn.style.display = 'flex';
                }
                if (this.locationStatus) {
                    this.locationStatus.classList.add('hidden');
                }
                break;
            case 'loading':
                this.loadingState.style.display = 'flex';
                if (this.locationPermissionBtn) {
                    this.locationPermissionBtn.style.display = 'none';
                }
                if (this.locationStatus) {
                    this.locationStatus.classList.add('hidden');
                }
                break;
            case 'error':
                this.errorState.style.display = 'flex';
                if (this.locationPermissionBtn) {
                    this.locationPermissionBtn.style.display = 'flex';
                }
                if (this.locationStatus) {
                    this.locationStatus.classList.add('hidden');
                }
                break;
            case 'success':
                this.carouselWrapper.style.display = 'block';
                if (this.locationPermissionBtn) {
                    this.locationPermissionBtn.style.display = 'none';
                }
                if (this.locationStatus) {
                    this.locationStatus.classList.remove('hidden');
                }
                break;
        }
    }

    showPermissionRequired() {
        this.showState('permission');
    }

    showLoading() {
        this.showState('loading');
    }

    showError(message) {
        this.showState('error');
        const errorText = this.errorState.querySelector('p:last-of-type');
        if (errorText) {
            errorText.textContent = message || 'We couldn\'t access your location. Please check your browser settings and try again.';
        }
    }

    showSuccess() {
        this.showState('success');
    }

    async requestLocation() {
        this.showLoading();

        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });

            this.userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            console.log('User location obtained:', this.userLocation);
            await this.fetchNearestProperties();
        } catch (error) {
            console.error('Error getting location:', error);
            
            let errorMessage = 'Unable to get your location.';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location permissions in your browser or mobile application settings before trying again.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable. Please try again.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out. Please try again.';
                    break;
            }
            
            this.showError(errorMessage);
        }
    }

    getCurrentLocation() {
        if (this.userLocation) {
            this.fetchNearestProperties();
            return;
        }

        this.requestLocation();
    }

    async fetchNearestProperties() {
        try {
            console.log('Fetching properties from API...');
            const response = await fetch('https://betcha-api.onrender.com/property/display');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const properties = await response.json();
            console.log('Properties fetched:', properties.length);
            
            if (!Array.isArray(properties) || properties.length === 0) {
                throw new Error('No properties found');
            }

            await this.calculateDistances(properties);
            this.displayNearestProperties();
            this.showSuccess();

        } catch (error) {
            console.error('Error fetching properties:', error);
            this.showError('Unable to load nearby properties. Please try again.');
        }
    }

    async calculateDistances(properties) {
        const propertiesWithDistance = [];

        for (const property of properties) {
            try {
                const coordinates = await this.extractCoordinatesFromMapLink(property.mapLink);
                if (coordinates) {
                    const distance = this.calculateDistance(
                        this.userLocation.latitude,
                        this.userLocation.longitude,
                        coordinates.lat,
                        coordinates.lng
                    );
                    
                    propertiesWithDistance.push({
                        ...property,
                        distance: distance,
                        coordinates: coordinates
                    });
                }
            } catch (error) {
                console.warn('Could not extract coordinates for property:', property.name, error);
            }
        }

        // Sort by distance and filter properties within 20km range
        this.properties = propertiesWithDistance
            .sort((a, b) => a.distance - b.distance)
            .filter(property => property.distance <= 20);

        console.log('Properties within 20km:', this.properties);
    }

    async extractCoordinatesFromMapLink(mapLink) {
        if (!mapLink) return null;

        try {
            // Extract coordinates from Google Maps embed URL
            // Look for patterns like: 2s14.6874574,121.0877186 or !2d121.0877186!3d14.6874574
            const patterns = [
                /2s([0-9.-]+),([0-9.-]+)/,  // Pattern: 2s14.6874574,121.0877186
                /!2d([0-9.-]+)!3d([0-9.-]+)/, // Pattern: !2d121.0877186!3d14.6874574
                /!3d([0-9.-]+)!2d([0-9.-]+)/, // Pattern: !3d14.6874574!2d121.0877186
                /center=([0-9.-]+),([0-9.-]+)/, // Pattern: center=14.6874574,121.0877186
                /q=([0-9.-]+),([0-9.-]+)/ // Pattern: q=14.6874574,121.0877186
            ];

            for (const pattern of patterns) {
                const match = mapLink.match(pattern);
                if (match) {
                    let lat, lng;
                    if (pattern.source.includes('2s')) {
                        // 2s pattern: lat,lng
                        lat = parseFloat(match[1]);
                        lng = parseFloat(match[2]);
                    } else if (pattern.source.includes('!2d.*!3d')) {
                        // !2d...!3d pattern: lng,lat
                        lng = parseFloat(match[1]);
                        lat = parseFloat(match[2]);
                    } else if (pattern.source.includes('!3d.*!2d')) {
                        // !3d...!2d pattern: lat,lng
                        lat = parseFloat(match[1]);
                        lng = parseFloat(match[2]);
                    } else {
                        // center and q patterns: lat,lng
                        lat = parseFloat(match[1]);
                        lng = parseFloat(match[2]);
                    }

                    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                        return { lat, lng };
                    }
                }
            }

            console.warn('Could not extract valid coordinates from mapLink:', mapLink);
            return null;
        } catch (error) {
            console.error('Error extracting coordinates:', error);
            return null;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula to calculate distance between two points
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in kilometers
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    formatDistance(distance) {
        if (distance < 1) {
            return `${Math.round(distance * 1000)} m`;
        } else {
            return `${distance.toFixed(1)} km`;
        }
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    displayNearestProperties() {
        if (!this.container) return;

        this.container.innerHTML = '';

        this.properties.forEach((property) => {
            const card = this.createPropertyCard(property);
            this.container.appendChild(card);
        });

        // Initialize carousel functionality for this section
        setTimeout(() => {
            const carouselWrapper = document.querySelector('#nearestPropertiesSection .carousel-wrapper');
            if (carouselWrapper && window.initializeCarousel) {
                window.initializeCarousel(carouselWrapper);
            }
        }, 100);
    }

    createPropertyCard(property) {
        const card = document.createElement('div');
        card.className = 'card group relative shrink-0 w-full sm:w-[calc(100%/2-10px)] lg:w-[calc(100%/3-14px)] h-72 sm:h-80 lg:h-96 rounded-2xl shadow-md overflow-hidden cursor-pointer';
        
        const photoUrl = property.photoLinks && property.photoLinks.length > 0 
            ? property.photoLinks[0] 
            : '/images/unit01.jpg';

        card.innerHTML = `
            <div class="absolute inset-0 bg-cover bg-center z-0 transform transition-transform duration-500 ease-in-out group-hover:scale-110" style="background-image: url('${photoUrl}')"></div>
            <div class="absolute h-[70%] bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-black/0 z-10"></div>

            <!-- Distance Badge -->
            <div class="absolute top-4 left-4 bg-primary text-white rounded-full px-3 py-1 z-20">
                <span class="font-roboto text-sm font-medium">${this.formatDistance(property.distance)}</span>
            </div>

            <div class="relative z-20 h-full flex flex-col justify-end p-6">
                <h2 class="text-2xl font-manrope mb-2 text-secondary-text">${this.truncateText(property.name || 'Property name', 30)}</h2>

                <div class="flex items-center w-full gap-2 mb-5">
                    <svg class="w-auto h-3.5 fill-secondary-text" viewBox="0 0 12 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 0C2.68628 0 0 2.86538 0 6.4C9.53674e-07 9.93458 3 12.8 6 16C9 12.8 12 9.93458 12 6.4C12 2.86538 9.31371 1.69648e-07 6 0ZM6 3.55555C7.4202 3.55555 8.57143 4.74946 8.57143 6.22221C8.57143 7.69501 7.4202 8.88888 6 8.88888C4.5798 8.88888 3.42857 7.69501 3.42857 6.22221C3.42857 4.74946 4.5798 3.55555 6 3.55555Z" />
                    </svg>
                    <p class="font-inter text-secondary-text text-sm">${this.truncateText(property.address || 'Barangay/City', 25)}</p>
                </div>

                <div class="flex items-center w-full gap-2">
                    <p class="font-inter text-secondary-text text-sm">Learn more</p>
                    <svg class="w-5 h-5 fill-secondary-text" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.707 6.13598L20.364 11.793C20.5515 11.9805 20.6568 12.2348 20.6568 12.5C20.6568 12.7651 20.5515 13.0194 20.364 13.207L14.707 18.864C14.5184 19.0461 14.2658 19.1469 14.0036 19.1447C13.7414 19.1424 13.4906 19.0372 13.3052 18.8518C13.1198 18.6664 13.0146 18.4156 13.0123 18.1534C13.01 17.8912 13.1108 17.6386 13.293 17.45L17.243 13.5H4C3.73478 13.5 3.48043 13.3946 3.29289 13.2071C3.10536 13.0195 3 12.7652 3 12.5C3 12.2348 3.10536 11.9804 3.29289 11.7929C3.48043 11.6053 3.73478 11.5 4 11.5H17.243L13.293 7.54998C13.1108 7.36136 13.01 7.10875 13.0123 6.84653C13.0146 6.58431 13.1198 6.33352 13.3052 6.14812C13.4906 5.96272 13.7414 5.85749 14.0036 5.85521C14.2658 5.85292 14.5184 5.95373 14.707 6.13598Z" />
                    </svg>
                </div>
            </div>
        `;

        // Add click handler to navigate to property details
        card.addEventListener('click', () => {
            window.location.href = `/pages/unauth/view-property.html?id=${property._id}`;
        });

        return card;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Nearest Properties Manager');
    new NearestPropertiesManager();
});

// Make initializeCarousel globally available if it's not already
if (typeof window.initializeCarousel === 'undefined') {
    // Import the carousel functionality
    import('./sideScrollCarousel.js').then(() => {
        console.log('Carousel module loaded for nearest properties');
    }).catch(err => {
        console.warn('Could not load carousel module:', err);
    });
}