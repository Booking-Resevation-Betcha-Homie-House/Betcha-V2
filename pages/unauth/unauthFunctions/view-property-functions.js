import { showFullscreenLoading, hideFullscreenLoading } from '/src/fullscreenLoading.js';
import { validateReservationData, showToastError } from '/src/toastNotification.js';

const amenityMapping = { 
    'wifi': { name: 'WiFi', iconType: '/svg/wifi.svg' }, 
    'ref': { name: 'Refrigerator', iconType: '/svg/refrigerator.svg' }, 
    'bathtub': { name: 'Bathtub', iconType: '/svg/bath.svg' }, 
    'washer': { name: 'Washer', iconType: '/svg/washer.svg' }, 
    'streaming': { name: 'Streaming Services', iconType: '/svg/tv.svg' }, 
    'smokeAlarm': { name: 'Smoke Alarm', iconType: '/svg/smokeAlarm.svg' }, 
    'freeParking': { name: 'Free Parking', iconType: '/svg/parkring.svg' }, 
    'balcony': { name: 'Balcony', iconType: '/svg/balcony.svg' }, 
    'allowed': { name: 'Pets Allowed', iconType: '/svg/petPaw.svg' }, 
    'crib': { name: 'Crib', iconType: '/svg/crib.svg' }, 
    'aircon': { name: 'Air Conditioning', iconType: '/svg/aircon.svg' }, 
    'bedset': { name: 'Complete Bed', iconType: '/svg/bed.svg' }, 
    'hanger': { name: 'Hangers', iconType: '/svg/hanger.svg' }, 
    'hairDryer': { name: 'Hair Dryer', iconType: '/svg/hairDryer.svg' }, 
    'iron': { name: 'Iron', iconType: '/svg/iron.svg' }, 
    'extraPillowBlanket': { name: 'Extra Pillows & Blankets', iconType: '/svg/extraPillowsBlanket.svg' }, 
    'towel': { name: 'Towel', iconType: '/svg/towel.svg' }, 
    'microwave': { name: 'Microwave', iconType: '/svg/microwave.svg' }, 
    'stove': { name: 'Stove', iconType: '/svg/stove.svg' }, 
    'oven': { name: 'Oven', iconType: '/svg/oven.svg' }, 
    'coffeeMaker': { name: 'Coffee Maker', iconType: '/svg/coffeeMaker.svg' }, 
    'toaster': { name: 'Toaster', iconType: '/svg/toaster.svg' }, 
    'PotsPans': { name: 'Pots & Pans', iconType: '/svg/pan.svg' }, 
    'spices': { name: 'Spices', iconType: '/svg/salt.svg' }, 
    'dishesCutlery': { name: 'Dishes & Cutlery', iconType: '/svg/dishes.svg' }, 
    'diningTable': { name: 'Dining Table', iconType: '/svg/diningtable.svg' }, 
    'shower': { name: 'Shower', iconType: '/svg/shower.svg' }, 
    'shampoo': { name: 'Shampoo', iconType: '/svg/shampoo.svg' }, 
    'soap': { name: 'Soap', iconType: '/svg/soap.svg' }, 
    'toilet': { name: 'Toilet', iconType: '/svg/toilet.svg' }, 
    'toiletPaper': { name: 'Toilet Paper', iconType: '/svg/toiletPaper.svg' }, 
    'dryer': { name: 'Dryer', iconType: '/svg/dryer.svg' }, 
    'dryingRack': { name: 'Drying Rack', iconType: '/svg/hanger.svg' }, 
    'ironBoard': { name: 'Iron Board', iconType: '/svg/ironBoard.svg' }, 
    'cleaningProduct': { name: 'Cleaning Products', iconType: '/svg/detergent.svg' }, 
    'tv': { name: 'TV', iconType: '/svg/tv.svg' }, 
    'soundSystem': { name: 'Sound System', iconType: '/svg/speaker.svg' }, 
    'consoleGames': { name: 'Gaming Console', iconType: '/svg/console.svg' }, 
    'boardGames': { name: 'Board Games', iconType: '/svg/chess.svg' }, 
    'cardGames': { name: 'Card Games', iconType: '/svg/card.svg' }, 
    'billiard': { name: 'Billiard Table', iconType: '/svg/8ball.svg' }, 
    'fireExtinguisher': { name: 'Fire Extinguisher', iconType: '/svg/fireExtinguisher.svg' }, 
    'firstAidKit': { name: 'First Aid Kit', iconType: '/svg/firstAidKit.svg' }, 
    'cctv': { name: 'CCTV', iconType: '/svg/cctv.svg' }, 
    'smartLock': { name: 'Smart Lock', iconType: '/svg/smartLock.svg' }, 
    'guard': { name: 'Security Guard', iconType: '/svg/guard.svg' }, 
    'stairGate': { name: 'Stair Gate', iconType: '/svg/gate.svg' }, 
    'paidParking': { name: 'Paid Parking', iconType: '/svg/parkring.svg' }, 
    'bike': { name: 'Bicycle', iconType: '/svg/bike.svg' }, 
    'garden': { name: 'Garden', iconType: '/svg/garden.svg' }, 
    'grill': { name: 'Grill', iconType: '/svg/grill.svg' }, 
    'firePit': { name: 'Fire Pit', iconType: '/svg/firePit.svg' }, 
    'pool': { name: 'Swimming Pool', iconType: '/svg/pool.svg' }, 
    'petsAllowed': { name: 'Pets Allowed', iconType: '/svg/petPaw.svg' }, 
    'petsNotAllowed': { name: 'No Pets', iconType: '/svg/petPaw.svg' }, 
    'petBowls': { name: 'Pet Bowls', iconType: '/svg/bowl.svg' }, 
    'petBed': { name: 'Pet Bed', iconType: '/svg/bed.svg' }, 
    'babyBath': { name: 'Baby Bath', iconType: '/svg/bath.svg' }, 
    'highChair': { name: 'High Chair', iconType: '/svg/highChair.svg' },
    'kettle': { name: 'Kettle', iconType: '/svg/kettle.svg' },
    'fence': { name: 'Fence', iconType: '/svg/fence.svg' },

    'refrigerator': { name: 'Refrigerator', iconType: '/svg/refrigerator.svg' },
    'washingmachine': { name: 'Washing Machine', iconType: '/svg/washer.svg' },
    'smokealarm': { name: 'Smoke Alarm', iconType: '/svg/smokeAlarm.svg' },
    'freeparking': { name: 'Free Parking', iconType: '/svg/parkring.svg' },
    'parking': { name: 'Parking', iconType: '/svg/parkring.svg' },
    'petsallowed': { name: 'Pets Allowed', iconType: '/svg/petPaw.svg' },
    'pets': { name: 'Pets Allowed', iconType: '/svg/petPaw.svg' },
    'airconditioning': { name: 'Air Conditioning', iconType: '/svg/aircon.svg' },
    'ac': { name: 'Air Conditioning', iconType: '/svg/aircon.svg' },
    'bed': { name: 'Bed', iconType: '/svg/bed.svg' },
    'hangers': { name: 'Hangers', iconType: '/svg/hanger.svg' },
    'hairdryer': { name: 'Hair Dryer', iconType: '/svg/hairDryer.svg' },
    'extrapillowsblankets': { name: 'Extra Pillows & Blankets', iconType: '/svg/extraPillowsBlanket.svg' },
    'pillows': { name: 'Extra Pillows & Blankets', iconType: '/svg/extraPillowsBlanket.svg' },
    'blankets': { name: 'Extra Pillows & Blankets', iconType: '/svg/extraPillowsBlanket.svg' },
    'towels': { name: 'Towels', iconType: '/svg/towel.svg' },
    'coffeemaker': { name: 'Coffee Maker', iconType: '/svg/coffeeMaker.svg' },
    'coffee': { name: 'Coffee Maker', iconType: '/svg/coffeeMaker.svg' },
    'potspans': { name: 'Pots & Pans', iconType: '/svg/pan.svg' },
    'pots': { name: 'Pots & Pans', iconType: '/svg/pan.svg' },
    'pans': { name: 'Pots & Pans', iconType: '/svg/pan.svg' },
    'cookware': { name: 'Pots & Pans', iconType: '/svg/pan.svg' },
    'dishescutlery': { name: 'Dishes & Cutlery', iconType: '/svg/dishes.svg' },
    'dishes': { name: 'Dishes & Cutlery', iconType: '/svg/dishes.svg' },
    'cutlery': { name: 'Dishes & Cutlery', iconType: '/svg/dishes.svg' },
    'diningtable': { name: 'Dining Table', iconType: '/svg/diningtable.svg' },
    'table': { name: 'Dining Table', iconType: '/svg/diningtable.svg' },
    'toiletpaper': { name: 'Toilet Paper', iconType: '/svg/toiletPaper.svg' },
    'dryingrack': { name: 'Drying Rack', iconType: '/svg/hanger.svg' },
    'ironboard': { name: 'Iron Board', iconType: '/svg/ironBoard.svg' },
    'ironing': { name: 'Iron Board', iconType: '/svg/ironBoard.svg' },
    'cleaningproducts': { name: 'Cleaning Products', iconType: '/svg/detergent.svg' },
    'cleaning': { name: 'Cleaning Products', iconType: '/svg/detergent.svg' },
    'detergent': { name: 'Cleaning Products', iconType: '/svg/detergent.svg' },
    'television': { name: 'TV', iconType: '/svg/tv.svg' },
    'smarttv': { name: 'Smart TV', iconType: '/svg/tv.svg' },
    'soundsystem': { name: 'Sound System', iconType: '/svg/speaker.svg' },
    'speaker': { name: 'Sound System', iconType: '/svg/speaker.svg' },
    'speakers': { name: 'Sound System', iconType: '/svg/speaker.svg' },
    'consolegames': { name: 'Gaming Console', iconType: '/svg/console.svg' },
    'console': { name: 'Gaming Console', iconType: '/svg/console.svg' },
    'gaming': { name: 'Gaming Console', iconType: '/svg/console.svg' },
    'boardgames': { name: 'Board Games', iconType: '/svg/chess.svg' },
    'games': { name: 'Board Games', iconType: '/svg/chess.svg' },
    'cardgames': { name: 'Card Games', iconType: '/svg/card.svg' },
    'cards': { name: 'Card Games', iconType: '/svg/card.svg' },
    'billiards': { name: 'Billiard Table', iconType: '/svg/8ball.svg' },
    'swimmingpool': { name: 'Swimming Pool', iconType: '/svg/pool.svg' },
    'fireextinguisher': { name: 'Fire Extinguisher', iconType: '/svg/fireExtinguisher.svg' },
    'firstaidkit': { name: 'First Aid Kit', iconType: '/svg/firstAidKit.svg' },
    'firstaid': { name: 'First Aid Kit', iconType: '/svg/firstAidKit.svg' },
    'camera': { name: 'CCTV', iconType: '/svg/cctv.svg' },
    'security': { name: 'CCTV', iconType: '/svg/cctv.svg' },
    'smartlock': { name: 'Smart Lock', iconType: '/svg/smartLock.svg' },
    'lock': { name: 'Smart Lock', iconType: '/svg/smartLock.svg' },
    'securityguard': { name: 'Security Guard', iconType: '/svg/guard.svg' },
    'stairgate': { name: 'Stair Gate', iconType: '/svg/gate.svg' },
    'gate': { name: 'Gate', iconType: '/svg/gate.svg' },
    'paidparking': { name: 'Paid Parking', iconType: '/svg/parkring.svg' },
    'bicycle': { name: 'Bicycle', iconType: '/svg/bike.svg' },
    'grilling': { name: 'Grill', iconType: '/svg/grill.svg' },
    'bbq': { name: 'Grill', iconType: '/svg/grill.svg' },
    'barbecue': { name: 'Grill', iconType: '/svg/grill.svg' },
    'firepit': { name: 'Fire Pit', iconType: '/svg/firePit.svg' },
    'petsnotallowed': { name: 'No Pets', iconType: '/svg/petPaw.svg' },
    'nopets': { name: 'No Pets', iconType: '/svg/petPaw.svg' },
    'petbowls': { name: 'Pet Bowls', iconType: '/svg/bowl.svg' },
    'petbed': { name: 'Pet Bed', iconType: '/svg/bed.svg' },
    'babybath': { name: 'Baby Bath', iconType: '/svg/bath.svg' },
    'highchair': { name: 'High Chair', iconType: '/svg/highChair.svg' },
    default: { name: 'Other', iconType: '/svg/add.svg' }
};

let currentPropertyData = null;

let originalMapSource = null;

function getAmenitySVGByMapping(amenity) {
    const normalizedKey = amenity.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase();
    const foundKey = Object.keys(amenityMapping).find(key => {
        return key.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase() === normalizedKey;
    });

    if (!foundKey) {
        console.warn(`🔍 AMENITY MISMATCH: "${amenity}" -> normalized: "${normalizedKey}" -> NO MATCH FOUND`);
        console.log('Available mapping keys:', Object.keys(amenityMapping));
        return { name: amenity, iconType: '/svg/add.svg' };
    }
    
    const result = amenityMapping[foundKey];
    console.log(`✅ AMENITY MATCHED: "${amenity}" -> "${foundKey}" -> ${result.name} (${result.iconType})`);
    return result;
}

async function debugAmenities(apiAmenities, otherAmenities) {
    console.group('🔍 AMENITY DEBUG ANALYSIS');

    const availableSVGs = [
        '8ball.svg', 'add.svg', 'aircon.svg', 'backarrow.svg', 'backIcon.svg', 'balcony.svg', 
        'bath.svg', 'bed.svg', 'betcha logo.svg', 'Betcha.svg', 'bike.svg', 'bookingIcon.svg', 
        'bowl.svg', 'calendar.svg', 'camera.svg', 'card.svg', 'cctv.svg', 'check.svg', 'chess.svg', 
        'closeIcon.svg', 'coffeeMaker.svg', 'console.svg', 'crib.svg', 'danger.svg', 'dashboard.svg', 
        'delete.svg', 'detergent.svg', 'diningtable.svg', 'dishes.svg', 'done.svg', 'door.svg', 
        'dropdown.svg', 'dryer.svg', 'edit.svg', 'emailIcon.svg', 'extraPillowsBlanket.svg', 
        'eye-closed.svg', 'eye-open.svg', 'facebook-circle 1.svg', 'faqs.svg', 'fence.svg', 
        'fireExtinguisher.svg', 'firePit.svg', 'firstAidKit.svg', 'furniture 1.svg', 'gallery.svg', 
        'garden.svg', 'gate.svg', 'grill.svg', 'guard.svg', 'hairDryer.svg', 'hanger.svg', 
        'highChair.svg', 'house.svg', 'ic_round-email.svg', 'iron.svg', 'ironBoard.svg', 'kettle.svg', 
        'list.svg', 'locationIcon.svg', 'locked.svg', 'lock_hole.svg', 'menu.svg', 'microwave.svg', 
        'mingcute_arrow-right-line.svg', 'nextIcon.svg', 'otherpayment.svg', 'oven.svg', 'page.svg', 
        'pan.svg', 'parkring.svg', 'passIcon.svg', 'person.svg', 'person2.svg', 'peso.svg', 
        'petPaw.svg', 'phoneIcon.svg', 'pool.svg', 'price.svg', 'PSR.svg', 'refrigerator.svg', 
        'role.svg', 'salt.svg', 'send.svg', 'sex.svg', 'shampoo.svg', 'shower.svg', 'smartLock.svg', 
        'smokeAlarm.svg', 'soap.svg', 'solar_phone-bold.svg', 'speaker.svg', 'star.svg', 'stove.svg', 
        'tk.svg', 'toaster.svg', 'toilet.svg', 'toiletPaper.svg', 'towel.svg', 'TS.svg', 'tv.svg', 
        'unavailable.svg', 'unlocked.svg', 'washer.svg', 'wifi.svg'
    ];
    
    console.log('📁 Available SVG files:', availableSVGs);
    console.log('🗂️ Current amenity mapping keys:', Object.keys(amenityMapping));

    const results = {
        matched: [],
        unmatched: [],
        unusedMappings: [],
        missingSVGs: [],
        suggestions: {}
    };

    console.group('🔍 API AMENITIES ANALYSIS');
    if (apiAmenities && apiAmenities.length > 0) {
        console.log(`📊 Total API amenities: ${apiAmenities.length}`);
        apiAmenities.forEach((amenity, index) => {
            console.log(`${index + 1}. "${amenity}"`);
            const result = getAmenitySVGByMapping(amenity);
            if (result.iconType === '/svg/add.svg') {
                console.warn(`❌ No icon found for: "${amenity}"`);
                results.unmatched.push(amenity);

                const suggestions = availableSVGs.filter(svg => 
                    svg.toLowerCase().includes(amenity.toLowerCase().substring(0, 3)) ||
                    amenity.toLowerCase().includes(svg.replace('.svg', '').substring(0, 3))
                );
                if (suggestions.length > 0) {
                    console.log(`💡 Potential SVG matches:`, suggestions);
                    results.suggestions[amenity] = suggestions;
                }
            } else {
                results.matched.push({ amenity, mapping: result });
            }
        });
    } else {
        console.log('❌ No API amenities found');
    }
    console.groupEnd();

    console.group('🔍 OTHER AMENITIES ANALYSIS');
    if (otherAmenities && otherAmenities.length > 0) {
        console.log(`📊 Total other amenities: ${otherAmenities.length}`);
        otherAmenities.forEach((amenity, index) => {
            console.log(`${index + 1}. "${amenity}"`);
        });
    } else {
        console.log('❌ No other amenities found');
    }
    console.groupEnd();

    console.group('🔍 UNUSED MAPPING ENTRIES');
    const allAmenities = [...(apiAmenities || []), ...(otherAmenities || [])];
    const usedMappingKeys = [];
    
    allAmenities.forEach(amenity => {
        const normalizedKey = amenity.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase();
        const foundKey = Object.keys(amenityMapping).find(key => {
            return key.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase() === normalizedKey;
        });
        if (foundKey) {
            usedMappingKeys.push(foundKey);
        }
    });
    
    const unusedMappingKeys = Object.keys(amenityMapping).filter(key => 
        !usedMappingKeys.includes(key) && key !== 'default'
    );
    
    results.unusedMappings = unusedMappingKeys;
    
    if (unusedMappingKeys.length > 0) {
        console.log('🗑️ Unused mapping entries (not in API response):', unusedMappingKeys);
        console.log('These can potentially be removed from amenityMapping');
    } else {
        console.log('✅ All mapping entries are being used');
    }
    console.groupEnd();

    console.group('🔍 MISSING SVG FILES');
    const missingSVGs = [];
    Object.entries(amenityMapping).forEach(([key, value]) => {
        if (value.iconType && value.iconType !== '/svg/add.svg') {
            const svgFileName = value.iconType.replace('/svg/', '');
            if (!availableSVGs.includes(svgFileName)) {
                missingSVGs.push({ key, iconType: value.iconType, svgFileName });
            }
        }
    });
    
    results.missingSVGs = missingSVGs;
    
    if (missingSVGs.length > 0) {
        console.warn('❌ Missing SVG files referenced in mapping:');
        missingSVGs.forEach(item => {
            console.warn(`- ${item.key}: ${item.iconType} (file: ${item.svgFileName})`);
        });
    } else {
        console.log('✅ All SVG files referenced in mapping exist');
    }
    console.groupEnd();

    console.group('📋 FINAL SUMMARY');
    console.log(`✅ Matched amenities: ${results.matched.length}`);
    console.log(`❌ Unmatched amenities: ${results.unmatched.length}`);
    console.log(`🗑️ Unused mappings: ${results.unusedMappings.length}`);
    console.log(`📁 Missing SVG files: ${results.missingSVGs.length}`);
    
    if (results.unmatched.length > 0) {
        console.group('❌ UNMATCHED AMENITIES TO FIX:');
        results.unmatched.forEach(amenity => {
            console.log(`- "${amenity}"`);
            if (results.suggestions[amenity]) {
                console.log(`  Suggestions: ${results.suggestions[amenity].join(', ')}`);
            }
        });
        console.groupEnd();
    }
    
    if (results.unusedMappings.length > 0) {
        console.group('🗑️ UNUSED MAPPINGS TO REMOVE:');
        results.unusedMappings.forEach(key => {
            console.log(`- "${key}": ${JSON.stringify(amenityMapping[key])}`);
        });
        console.groupEnd();
    }
    
    console.groupEnd();
    console.groupEnd();

    window.amenityDebugResults = results;
    console.log('💾 Debug results stored in window.amenityDebugResults for inspection');
}

function renderAmenities(apiAmenities, otherAmenities) {

    debugAmenities(apiAmenities, otherAmenities);
    
    const normalizedSet = new Set(apiAmenities.map(a => a.toLowerCase().replace(/[_-\s]+/g, '')));
    const modal = document.getElementById('ammenitiesModal');

    const amenityList = document.getElementById('amenityList');
    if (amenityList && apiAmenities) {
        amenityList.innerHTML = '';
        apiAmenities.slice(0, 3).forEach(amenity => {
            const { name, iconType } = getAmenitySVGByMapping(amenity);
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2';

            const hasProperIcon = iconType && iconType !== '/svg/add.svg';
            
            if (hasProperIcon) {

                div.innerHTML = `
                    <img src="${iconType}" alt="${name}" class="w-6 h-6">
                    <span class="font-roboto text-base text-primary-text">${name}</span>
                `;
            } else {

                div.innerHTML = `
                    <span class="w-6 h-6 flex items-center justify-center">
                        <span class="w-2 h-2 bg-black rounded-full"></span>
                    </span>
                    <span class="font-roboto text-base text-primary-text">${name}</span>
                `;
            }
            
            amenityList.appendChild(div);
        });
    }

    if (!modal) return;

    modal.querySelectorAll('.px-2.md\\:px-3.mb-3.md\\:mb-5').forEach(section => {
        let hasVisibleItems = false;
        
        section.querySelectorAll('li[id]').forEach(li => {
            const [, ...parts] = li.id.split("-");
            const amenityId = parts.join("-");
            if (!amenityId) return;

            const normalizedId = amenityId.toLowerCase().replace(/[_-\s]+/g, '');
            const amenityDiv = li.querySelector('.flex.gap-3.items-center');
            
            if (normalizedSet.has(normalizedId)) {
                li.classList.remove('hidden');
                if (amenityDiv) amenityDiv.classList.remove('hidden');
                hasVisibleItems = true; 
            } else {
                li.classList.add('hidden');
                if (amenityDiv) amenityDiv.classList.add('hidden');
            }
        });

        if (hasVisibleItems) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });

    const othersSection = document.querySelector('#ammenitiesModal .px-2.md\\:px-3.mb-3.md\\:mb-5:last-child');
    if (!othersSection) return;

    const list = othersSection.querySelector('ul');
    if (!list) return;

    list.innerHTML = '';
    
    if (otherAmenities && otherAmenities.length > 0) {
        otherAmenities.forEach(item => {
            const li = document.createElement('li');
            li.className = 'flex items-center gap-3';
            li.innerHTML = `
                <span class="w-6 h-6 flex items-center justify-center">
                    <span class="w-2 h-2 bg-black rounded-full"></span>
                </span>
                <span class="font-inter text-primary-text">${item}</span>
            `;
            list.appendChild(li);
        });
        othersSection.classList.remove('hidden');
    } else {
        othersSection.classList.add('hidden');
    }
}

async function fetchAndDisplayProperty() {
    try {
        showFullscreenLoading('Loading');
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        if (!propertyId) {
            hideFullscreenLoading();
            return;
        }

        const response = await fetch(`https://betcha-api.onrender.com/property/display/${propertyId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        try {
            const userId = localStorage.getItem('userId') || 'anonymous';
            const userType = localStorage.getItem('role') || localStorage.getItem('userType') || 'Guest';
            if (window.AuditTrailFunctions && typeof window.AuditTrailFunctions.logPropertyView === 'function') {
                window.AuditTrailFunctions.logPropertyView(userId, userType.charAt(0).toUpperCase() + userType.slice(1));
            }
        } catch (auditError) {
            console.warn('Audit trail for property view failed:', auditError);
        }

        ['photo1','photo2','photo3'].forEach((id, idx) => {
            const el = document.getElementById(id);
            if(el && data.photoLinks[idx]) {

                el.innerHTML = '';
                el.classList.add('overflow-hidden');

                const photoDiv = document.createElement('div');
                photoDiv.className = 'w-full h-full transition-transform duration-300 ease-in-out hover:scale-110';
                photoDiv.style.backgroundImage = `url('${data.photoLinks[idx]}')`;
                photoDiv.style.backgroundSize = 'cover';
                photoDiv.style.backgroundPosition = 'center';
                photoDiv.style.backgroundRepeat = 'no-repeat';

                el.appendChild(photoDiv);
            }
        });

        const allPhotoContainer = document.getElementById('allPhoto');
        if (allPhotoContainer && data.photoLinks) {
            allPhotoContainer.innerHTML = '';
            data.photoLinks.forEach((link, index) => {

                const containerDiv = document.createElement('div');
                containerDiv.className = 'rounded-xl w-full h-100 cursor-pointer overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out';

                const photoDiv = document.createElement('div');
                photoDiv.className = 'w-full h-full transition-transform duration-300 ease-in-out hover:scale-110';
                photoDiv.style.backgroundImage = `url('${link}')`;
                photoDiv.style.backgroundSize = 'cover';
                photoDiv.style.backgroundPosition = 'center';
                photoDiv.style.backgroundRepeat = 'no-repeat';

                containerDiv.appendChild(photoDiv);
                
                containerDiv.setAttribute('alt', `Room view ${index + 1}`);
                containerDiv.setAttribute('data-image-index', index);

                containerDiv.addEventListener('click', () => {
                    console.log(`Clicked on image ${index + 1}:`, link);

                });
                
                allPhotoContainer.appendChild(containerDiv);
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
            roomPrice: data.packagePrice ? `₱${data.packagePrice.toLocaleString()}` : '₱0',
            numOfImg: data.photoLinks ? `${data.photoLinks.length}+` : '0+'
        };
        Object.entries(infoMap).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if(el) el.textContent = value || '';
        });

        const timeInOutElement = document.getElementById('timeInOut');
        if (timeInOutElement && data.timeIn && data.timeOut) {

            const formattedTime = `${data.timeIn} - ${data.timeOut}`;
            timeInOutElement.textContent = formattedTime;
            console.log('TimeIn and TimeOut from API:', data.timeIn, data.timeOut);
        } else if (timeInOutElement) {

            timeInOutElement.textContent = 'Time not available';
            console.log('TimeIn/TimeOut not available from API:', { timeIn: data.timeIn, timeOut: data.timeOut });
        }

        const mapIframe = document.getElementById('maplink');
        if (mapIframe && data.mapLink) {
            const srcMatch = data.mapLink.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) {
                mapIframe.src = srcMatch[1];

                originalMapSource = srcMatch[1];
            }
        }

        if (typeof renderAmenities === "function") {
            const amenities = Array.isArray(data.amenities) ? data.amenities : [];
            const otherAmenities = Array.isArray(data.otherAmenities) ? data.otherAmenities : [];
            renderAmenities(amenities, otherAmenities);
        }

        currentPropertyData = {
            id: propertyId,
            name: data.name,
            address: data.address,
            packagePrice: data.packagePrice,
            additionalPax: data.additionalPax,
            reservationFee: data.reservationFee,
            packageCapacity: data.packageCapacity,
            maxCapacity: data.maxCapacity,
            images: data.photoLinks || [],
            timeIn: data.timeIn,
            timeOut: data.timeOut
        };

        updateGuestCounterLimits(data.maxCapacity);

        setupReserveButton();

        setupDescriptionToggle();

        document.addEventListener('datesSelected', function(e) {
            console.log('Dates selected event received:', e.detail);

        });

        currentPropertyData = data;

        setTimeout(() => {
            initializeDirectionsButton();
        }, 500);

    } catch (err) {
        console.error('Error fetching property:', err);
    } finally {
        hideFullscreenLoading();
    }
}

function updateGuestCounterLimits(maxCapacity) {
    if (!maxCapacity || maxCapacity < 1) {
        console.warn('Invalid maxCapacity from API:', maxCapacity);
        return;
    }

    console.log('Updating guest counter limits to:', maxCapacity);

    document.querySelectorAll('.guest-counter').forEach(counter => {

        counter.setAttribute('data-max', maxCapacity);

        const maxGuestDisplay = counter.querySelector('.maxGuestNum');
        if (maxGuestDisplay) {
            maxGuestDisplay.textContent = maxCapacity;
        }
    });

    const updateEvent = new CustomEvent('updateGuestLimit', {
        detail: { maxCapacity: maxCapacity }
    });
    document.dispatchEvent(updateEvent);
}

function setupDescriptionToggle() {
    const descWrapper = document.getElementById('descWrapper');
    const toggleText = document.getElementById('toggleText');
    const description = document.getElementById('roomDescription');
    
    if (!descWrapper || !toggleText || !description) {
        console.warn('Description toggle elements not found');
        return;
    }

    const checkContentHeight = () => {

        const originalMaxHeight = descWrapper.style.maxHeight;
        descWrapper.style.maxHeight = 'none';
        const fullHeight = description.scrollHeight;
        descWrapper.style.maxHeight = originalMaxHeight;

        const collapsedHeight = 96; 
        
        if (fullHeight <= collapsedHeight) {
            toggleText.style.display = 'none';
        } else {
            toggleText.style.display = 'block';
            setupToggleHandler();
        }
    };

    const setupToggleHandler = () => {
        let isExpanded = false;
        
        toggleText.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (isExpanded) {

                descWrapper.style.maxHeight = '6rem';
                toggleText.textContent = 'Read More';
                isExpanded = false;
            } else {

                descWrapper.style.maxHeight = description.scrollHeight + 'px';
                toggleText.textContent = 'Read Less';
                isExpanded = true;
            }
        });
    };

    setTimeout(checkContentHeight, 100);
}

function setupReserveButton() {
    const reserveButton = document.getElementById('reserveButton');
    if (!reserveButton) {
        console.warn('Reserve button not found');
        return;
    }

    reserveButton.addEventListener('click', () => {

        if (!validateReservationData()) {
            return; 
        }

        const urlParams = new URLSearchParams(window.location.search);
        const bookingData = getBookingDataFromURL(urlParams);
        
        if (!currentPropertyData) {
            console.error('Property data not available');
            showToastError('error', 'Property Data Missing', 'Property information is not loaded. Please refresh the page and try again.');
            return;
        }

        if (!bookingData.checkInDate || !bookingData.checkOutDate) {
            console.error('Booking dates not available');
            console.log('Available booking data:', bookingData);

            showToastError('warning', 'Dates Required', 'Please select check-in and check-out dates using the calendar above before making a reservation.');
            return;
        }

        const guestCount = window.currentGuestCount || bookingData.guestCount || 1;
        if (guestCount < 1) {
            showToastError('warning', 'Guest Count Required', 'Please select at least one guest for your reservation.');
            return;
        }

        if (!currentPropertyData.name || !currentPropertyData.packagePrice) {
            console.log('Missing property data:', currentPropertyData);
            showToastError('error', 'Property Information Missing', 'Some property information is missing. Please refresh the page and try again.');
            return;
        }

        console.log('All validations passed. Proceeding with reservation...');
        console.log('Property data:', currentPropertyData);
        console.log('Booking data:', bookingData);

        navigateToConfirmReservation(currentPropertyData, bookingData);
    });
}

function getBookingDataFromURL(urlParams) {

    let checkInDate = urlParams.get('checkIn');
    let checkOutDate = urlParams.get('checkOut');
    let guestCount = parseInt(urlParams.get('people')) || parseInt(urlParams.get('guests')) || parseInt(urlParams.get('guestCount')) || 1;

    console.log('URL params - checkIn:', checkInDate, 'checkOut:', checkOutDate, 'people/guests:', guestCount);

    if (!checkInDate || !checkOutDate) {

        if (window.selectedBookingDates && window.selectedBookingDates.length >= 2) {
            checkInDate = window.selectedBookingDates[0];
            checkOutDate = window.selectedBookingDates[window.selectedBookingDates.length - 1];
            console.log('Got dates from window.selectedBookingDates:', checkInDate, checkOutDate);
        }

        if (!checkInDate) {
            const checkInInput = document.getElementById('searchCheckIn') || document.querySelector('input[name="checkIn"]');
            if (checkInInput && checkInInput.value) {
                checkInDate = checkInInput.value;
                console.log('Got checkIn from input:', checkInDate);
            }
        }
        
        if (!checkOutDate) {
            const checkOutInput = document.getElementById('searchCheckOut') || document.querySelector('input[name="checkOut"]');
            if (checkOutInput && checkOutInput.value) {
                checkOutDate = checkOutInput.value;
                console.log('Got checkOut from input:', checkOutDate);
            }
        }
    }

    if (guestCount === 1) {

        if (window.currentGuestCount && window.currentGuestCount > 1) {
            guestCount = window.currentGuestCount;
            console.log('Got guest count from window.currentGuestCount:', guestCount);
        }

        else {
            const guestCountElement = document.getElementById('guestCount') || 
                                    document.querySelector('.guestCount');
            if (guestCountElement) {
                const elementValue = parseInt(guestCountElement.textContent) || parseInt(guestCountElement.value);
                if (elementValue && elementValue > 0) {
                    guestCount = elementValue;
                    console.log('Got guest count from guestCount element:', guestCount);
                }
            }
        }

        if (guestCount === 1) {
            const guestSummary = document.getElementById('guestSummary');
            if (guestSummary && guestSummary.textContent && !guestSummary.textContent.includes('Add guests')) {

                const match = guestSummary.textContent.match(/(\d+)/);
                if (match && parseInt(match[1]) > 0) {
                    guestCount = parseInt(match[1]);
                    console.log('Got guest count from guestSummary:', guestCount);
                }
            }
        }

        if (guestCount === 1) {
            const guestInput = document.getElementById('searchGuestCount') || 
                              document.querySelector('input[name="guests"]') ||
                              document.querySelector('input[name="guestCount"]');
            if (guestInput) {
                const inputValue = parseInt(guestInput.textContent) || parseInt(guestInput.value);
                if (inputValue && inputValue > 0) {
                    guestCount = inputValue;
                    console.log('Got guest count from input:', guestCount);
                }
            }
        }
    }
    
    let daysOfStay = 1;
    if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        daysOfStay = Math.ceil(timeDiff / (1000 * 3600 * 24));
        console.log('Calculated days of stay:', daysOfStay);
    }

    const bookingData = {
        checkInDate,
        checkOutDate,
        guestCount,
        daysOfStay: Math.max(1, daysOfStay) 
    };
    
    console.log('Final booking data:', bookingData);
    return bookingData;
}

function navigateToConfirmReservation(propertyData, bookingData) {
    const params = new URLSearchParams();

    params.append('propertyId', propertyData.id || '');
    params.append('propertyName', propertyData.name || '');
    params.append('propertyAddress', propertyData.address || '');
    if (propertyData.images && propertyData.images.length > 0) {
        params.append('images', encodeURIComponent(JSON.stringify(propertyData.images)));
    }

    params.append('checkInDate', bookingData.checkInDate || '');
    params.append('checkOutDate', bookingData.checkOutDate || '');
    params.append('guestCount', bookingData.guestCount || '1');
    params.append('daysOfStay', bookingData.daysOfStay || '1');

    params.append('pricePerDay', propertyData.packagePrice || '0');
    params.append('addGuestPrice', propertyData.additionalPax || '0');
    params.append('reservationFee', propertyData.reservationFee || '0');
    params.append('packageCapacity', propertyData.packageCapacity || '1');

    params.append('timeIn', propertyData.timeIn || '');
    params.append('timeOut', propertyData.timeOut || '');
    
    console.log('Passing time data to confirm reservation:', { timeIn: propertyData.timeIn, timeOut: propertyData.timeOut });

    window.location.href = `../auth/confirm-reservation.html?${params.toString()}`;
}

document.addEventListener('DOMContentLoaded', fetchAndDisplayProperty);

function initializeDirectionsButton() {
    const directionsButtonContainer = document.getElementById('directionsButtonContainer');
    const directionsBtn = document.getElementById('directionsBtn');
    const mapContainer = document.getElementById('mapContainer');
    
    if (!directionsButtonContainer || !directionsBtn || !mapContainer) return;

    if (currentPropertyData && (currentPropertyData.address || currentPropertyData.city)) {
        directionsButtonContainer.classList.remove('hidden');
        
        setupDirectionsButton(directionsBtn, mapContainer, currentPropertyData);
    }
}

function extractCoordinatesFromMapLink(mapLink) {
    if (!mapLink) return null;
    
    console.log('Attempting to extract coordinates from mapLink:', mapLink);

    const coordMatch = mapLink.match(/!3d([0-9.-]+)!2d([0-9.-]+)/);
    if (coordMatch) {
        const lat = coordMatch[1];
        const lng = coordMatch[2];
        console.log('Found coordinates using !3d!2d pattern:', { lat, lng });
        return { lat, lng };
    }

    const atCoordMatch = mapLink.match(/@([0-9.-]+),([0-9.-]+)/);
    if (atCoordMatch) {
        const lat = atCoordMatch[1];
        const lng = atCoordMatch[2];
        console.log('Found coordinates using @ pattern:', { lat, lng });
        return { lat, lng };
    }

    const pbMatch = mapLink.match(/!1d([0-9.-]+)!2d([0-9.-]+)!3d([0-9.-]+)/);
    if (pbMatch) {
        const lat = pbMatch[3]; 
        const lng = pbMatch[2]; 
        console.log('Found coordinates using pb pattern:', { lat, lng });
        return { lat, lng };
    }

    const urlParams = new URL(mapLink.startsWith('http') ? mapLink : 'https://maps.google.com/' + mapLink);
    const ll = urlParams.searchParams.get('ll');
    if (ll) {
        const [lat, lng] = ll.split(',');
        if (lat && lng) {
            console.log('Found coordinates using ll parameter:', { lat, lng });
            return { lat, lng };
        }
    }
    
    console.log('No coordinates found in mapLink');
    return null;
}

function setupDirectionsButton(directionsBtn, mapContainer, propertyData) {
    directionsBtn.onclick = () => {

        console.log('Property mapLink:', propertyData.mapLink);

        let directionsQuery;

        const coordinates = propertyData.mapLink ? extractCoordinatesFromMapLink(propertyData.mapLink) : null;
        
        console.log('Extracted coordinates:', coordinates);
        
        if (coordinates && propertyData.address) {

            directionsQuery = `${coordinates.lat},${coordinates.lng}+${encodeURIComponent(propertyData.address)}`;
            console.log('Using coordinates + address for precise location:', directionsQuery);
        } else if (coordinates) {

            directionsQuery = `${coordinates.lat},${coordinates.lng}`;
            console.log('Using coordinates only:', directionsQuery);
        } else if (propertyData.address) {

            directionsQuery = encodeURIComponent(propertyData.address);
            console.log('Using full address only:', propertyData.address);
        } else {

            directionsQuery = encodeURIComponent('Property Location');
        }

        if (navigator.geolocation) {

            mapContainer.innerHTML = `
                <div class="w-full h-full bg-neutral-100 flex items-center justify-center">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p class="text-neutral-600">Getting your location...</p>
                    </div>
                </div>
            `;
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    const directionsEmbedUrl = `https://maps.google.com/maps?saddr=${userLat},${userLng}&daddr=${directionsQuery}&output=embed&maptype=satellite&dirflg=d`;
                    
                    console.log('Generated directions URL:', directionsEmbedUrl);

                    mapContainer.innerHTML = `
                        <iframe src="${directionsEmbedUrl}" 
                            class="w-full h-full"
                            style="border:0;" 
                            allowfullscreen="" 
                            loading="lazy" 
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    `;
                },
                (error) => {
                    console.error('Geolocation error:', error);

                    const fallbackEmbedUrl = `https://maps.google.com/maps?q=${directionsQuery}&output=embed&maptype=satellite&dirflg=d`;
                    
                    console.log('Generated fallback directions URL:', fallbackEmbedUrl);
                    
                    mapContainer.innerHTML = `
                        <div class="w-full h-full bg-neutral-100 flex flex-col">
                            <div class="p-2 bg-yellow-100 text-yellow-800 text-center text-xs">
                                <p>Location access denied. Showing property location.</p>
                            </div>
                            <iframe src="${fallbackEmbedUrl}" 
                                class="w-full flex-1"
                                style="border:0;" 
                                allowfullscreen="" 
                                loading="lazy" 
                                referrerpolicy="no-referrer-when-downgrade">
                            </iframe>
                        </div>
                    `;
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 
                }
            );
        } else {

            const fallbackEmbedUrl = `https://maps.google.com/maps?q=${directionsQuery}&output=embed&maptype=satellite&dirflg=d`;
            
            console.log('Generated no-geolocation fallback URL:', fallbackEmbedUrl);
            
            mapContainer.innerHTML = `
                <div class="w-full h-full bg-neutral-100 flex flex-col">
                    <div class="p-2 bg-blue-100 text-blue-800 text-center text-xs">
                        <p>Geolocation not supported. Showing property location.</p>
                    </div>
                    <iframe src="${fallbackEmbedUrl}" 
                        class="w-full flex-1"
                        style="border:0;" 
                        allowfullscreen="" 
                        loading="lazy" 
                        referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                </div>
            `;
        }

        directionsBtn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"></path>
            </svg>
            View Property Location
        `;

        directionsBtn.onclick = () => {

            const mapSrc = originalMapSource || 
                document.getElementById('maplink')?.src || 
                'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3858.9397163310573!2d121.05891147478252!3d14.716000285784096!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b08c3aa74213%3A0x325214dc350bb0d1!2sSTI%20College%20Fairview!5e1!3m2!1sen!2sph!4v1752067526435!5m2!1sen!2sph';
            
            mapContainer.innerHTML = `
                <iframe id="maplink" src="${mapSrc}" 
                    class="w-full h-full"
                    style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
                </iframe>
            `;

            directionsBtn.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 0 1 6 0z"></path>
                </svg>
                Get Directions
            `;

            setupDirectionsButton(directionsBtn, mapContainer, propertyData);
        };
    };
}

document.addEventListener('DOMContentLoaded', () => {

    setTimeout(initializeDirectionsButton, 1000);
});

