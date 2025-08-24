const amenityMapping = { 'wifi': { name: 'WiFi', iconType: '/svg/wifi.svg' }, 'ref': { name: 'Refrigerator', iconType: '/svg/refrigerator.svg' }, 'bathtub': { name: 'Bathtub', iconType: '/svg/bath.svg' }, 'washer': { name: 'Washer', iconType: '/svg/washer.svg' }, 'streaming': { name: 'Streaming Services', iconType: '/svg/tv.svg' }, 'smokeAlarm': { name: 'Smoke Alarm', iconType: '/svg/smokeAlarm.svg' }, 'freeParking': { name: 'Free Parking', iconType: '/svg/parking.svg' }, 'balcony': { name: 'Balcony', iconType: '/svg/balcony.svg' }, 'allowed': { name: 'Pets Allowed', iconType: '/svg/pets.svg' }, 'crib': { name: 'Crib', iconType: '/svg/crib.svg' }, 'aircon': { name: 'Air Conditioning', iconType: '/svg/aircon.svg' }, 'bedset': { name: 'Complete Bed', iconType: '/svg/bed.svg' }, 'hanger': { name: 'Hangers', iconType: '/svg/hanger.svg' }, 'hairDryer': { name: 'Hair Dryer', iconType: '/svg/hairDryer.svg' }, 'iron': { name: 'Iron', iconType: '/svg/iron.svg' }, 'extraPillowBlanket': { name: 'Extra Pillows & Blankets', iconType: '/svg/pillow.svg' }, 'towel': { name: 'Towel', iconType: '/svg/towel.svg' }, 'microwave': { name: 'Microwave', iconType: '/svg/microwave.svg' }, 'stove': { name: 'Stove', iconType: '/svg/stove.svg' }, 'oven': { name: 'Oven', iconType: '/svg/oven.svg' }, 'coffeeMaker': { name: 'Coffee Maker', iconType: '/svg/coffeeMaker.svg' }, 'toaster': { name: 'Toaster', iconType: '/svg/toaster.svg' }, 'PotsPans': { name: 'Pots & Pans', iconType: '/svg/pots.svg' }, 'spices': { name: 'Spices', iconType: '/svg/spices.svg' }, 'dishesCutlery': { name: 'Dishes & Cutlery', iconType: '/svg/dishes.svg' }, 'diningTable': { name: 'Dining Table', iconType: '/svg/diningtable.svg' }, 'shower': { name: 'Shower', iconType: '/svg/shower.svg' }, 'shampoo': { name: 'Shampoo', iconType: '/svg/shampoo.svg' }, 'soap': { name: 'Soap', iconType: '/svg/soap.svg' }, 'toilet': { name: 'Toilet', iconType: '/svg/toilet.svg' }, 'toiletPaper': { name: 'Toilet Paper', iconType: '/svg/toiletPaper.svg' }, 'dryer': { name: 'Dryer', iconType: '/svg/dryer.svg' }, 'dryingRack': { name: 'Drying Rack', iconType: '/svg/dryingRack.svg' }, 'ironBoard': { name: 'Iron Board', iconType: '/svg/ironBoard.svg' }, 'cleaningProduct': { name: 'Cleaning Products', iconType: '/svg/cleaning.svg' }, 'tv': { name: 'TV', iconType: '/svg/tv.svg' }, 'soundSystem': { name: 'Sound System', iconType: '/svg/speaker.svg' }, 'consoleGames': { name: 'Gaming Console', iconType: '/svg/console.svg' }, 'boardGames': { name: 'Board Games', iconType: '/svg/chess.svg' }, 'cardGames': { name: 'Card Games', iconType: '/svg/card.svg' }, 'billiard': { name: 'Billiard Table', iconType: '/svg/billiard.svg' }, 'fireExtinguisher': { name: 'Fire Extinguisher', iconType: '/svg/danger.svg' }, 'firstAidKit': { name: 'First Aid Kit', iconType: '/svg/firstAid.svg' }, 'cctv': { name: 'CCTV', iconType: '/svg/cctv.svg' }, 'smartLock': { name: 'Smart Lock', iconType: '/svg/smartLock.svg' }, 'guard': { name: 'Security Guard', iconType: '/svg/guard.svg' }, 'stairGate': { name: 'Stair Gate', iconType: '/svg/gate.svg' }, 'paidParking': { name: 'Paid Parking', iconType: '/svg/parking.svg' }, 'bike': { name: 'Bicycle', iconType: '/svg/bike.svg' }, 'garden': { name: 'Garden', iconType: '/svg/garden.svg' }, 'grill': { name: 'Grill', iconType: '/svg/grill.svg' }, 'firePit': { name: 'Fire Pit', iconType: '/svg/firePit.svg' }, 'pool': { name: 'Swimming Pool', iconType: '/svg/pool.svg' }, 'petsAllowed': { name: 'Pets Allowed', iconType: '/svg/pets.svg' }, 'petsNotAllowed': { name: 'No Pets', iconType: '/svg/pets.svg' }, 'petBowls': { name: 'Pet Bowls', iconType: '/svg/bowl.svg' }, 'petBed': { name: 'Pet Bed', iconType: '/svg/bed.svg' }, 'babyBath': { name: 'Baby Bath', iconType: '/svg/bath.svg' }, default: { name: 'Other', iconType: '/svg/plus.svg' }};

function getAmenitySVGByMapping(amenity) {
    const normalizedKey = amenity.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase();
    const foundKey = Object.keys(amenityMapping).find(key => {
        return key.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase() === normalizedKey;
    });
    return amenityMapping[foundKey] || { name: amenity, iconType: '/svg/plus.svg' };
}

function renderAmenities(apiAmenities, otherAmenities) {
    const normalizedSet = new Set(apiAmenities.map(a => a.toLowerCase().replace(/[_-\s]+/g, '')));
    const modal = document.getElementById('ammenitiesModal');
    if (!modal) return;

    modal.querySelectorAll('.px-3.mb-5').forEach(section => {
        section.querySelectorAll('li[id]').forEach(li => {
            const [, ...parts] = li.id.split("-");
            const amenityId = parts.join("-");
            if (!amenityId) return;

            const normalizedId = amenityId.toLowerCase().replace(/[_-\s]+/g, '');
            const amenityDiv = li.querySelector('.flex.gap-3.items-center');
            
            if (normalizedSet.has(normalizedId)) {
                li.classList.remove('hidden');
                if (amenityDiv) amenityDiv.classList.remove('hidden');
            } else {
                li.classList.add('hidden');
                if (amenityDiv) amenityDiv.classList.add('hidden');
            }
        });
    });

    const othersSection = document.querySelector('#ammenitiesModal .px-3.mb-5:last-child');
    if (!othersSection) return;

    const list = othersSection.querySelector('ul.grid');
    if (!list) return;

    list.innerHTML = '';
    
    if (otherAmenities && otherAmenities.length > 0) {
        otherAmenities.forEach(item => {
            const li = document.createElement('li');
            li.className = 'p-2';
            li.innerHTML = `<span class="font-inter text-primary-text">${item}</span>`;
            list.appendChild(li);
        });
        othersSection.classList.remove('hidden');
    } else {
        othersSection.classList.add('hidden');
    }
}

async function fetchAndDisplayProperty() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        if (!propertyId) return;

        const response = await fetch(`https://betcha-api.onrender.com/property/display/${propertyId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        ['photo1','photo2','photo3'].forEach((id, idx) => {
            const el = document.getElementById(id);
            if(el && data.photoLinks[idx]) {
                el.innerHTML = `<img src="${data.photoLinks[idx]}" class="w-full h-full object-cover rounded-2xl" alt="Property Photo">`;
            }
        });

        const allPhotoContainer = document.getElementById('allPhoto');
        if (allPhotoContainer && data.photoLinks) {
            allPhotoContainer.innerHTML = '';
            data.photoLinks.forEach(link => {
                const img = document.createElement('img');
                img.src = link;
                img.className = 'w-full h-full object-cover';
                allPhotoContainer.appendChild(img);
            });
        }

        const infoMap = {
            roomName: data.name,
            roomAdress: data.address,
            fulladd: data.address,
            category: data.category,
            packageCapacity: data.packageCapacity || '0',
            rate: data.rating || '0',
            roomDescription: data.description,
            roomPrice: data.packagePrice ? `₱${data.packagePrice.toLocaleString()}` : '₱0'
        };
        Object.entries(infoMap).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if(el) el.textContent = value || '';
        });

        const mapIframe = document.getElementById('maplink');
        if (mapIframe && data.mapLink) {
            const srcMatch = data.mapLink.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) mapIframe.src = srcMatch[1];
        }

        const amenityList = document.getElementById('amenityList');
        if (amenityList && data.amenities) {
            amenityList.innerHTML = '';
            data.amenities.slice(0, 3).forEach(amenity => {
                const { name, iconType } = getAmenitySVGByMapping(amenity);
                const div = document.createElement('div');
                div.className = 'flex items-center gap-2';
                div.innerHTML = `
                    <img src="${iconType}" alt="${name}" class="w-6 h-6">
                    <span class="font-roboto text-base text-primary-text">${name}</span>
                `;
                amenityList.appendChild(div);
            });
        }

        if (typeof renderAmenities === "function") {
            const amenities = Array.isArray(data.amenities) ? data.amenities : [];
            const otherAmenities = Array.isArray(data.otherAmenities) ? data.otherAmenities : [];
            renderAmenities(amenities, otherAmenities);
        }

    } catch (err) {
        console.error('Error fetching property:', err);
    }
}

document.addEventListener('DOMContentLoaded', fetchAndDisplayProperty);

