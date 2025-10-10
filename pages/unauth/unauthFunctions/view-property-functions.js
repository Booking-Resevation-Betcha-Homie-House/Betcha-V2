import { showFullscreenLoading, hideFullscreenLoading } from '/src/fullscreenLoading.js';
import { validateReservationData, showToastError } from '/src/toastNotification.js';

// Use centralized toast function (alias for consistency with existing code)
function showToast(type, title, message, duration = 5000) {
    return showToastError(type, title, message, duration);
}

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
    // Alternative naming patterns
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

// Global variable to store property data for reservation
let currentPropertyData = null;

function getAmenitySVGByMapping(amenity) {
    const normalizedKey = amenity.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase();
    const foundKey = Object.keys(amenityMapping).find(key => {
        return key.replace(/\s+/g, '').replace(/[-_]/g, '').toLowerCase() === normalizedKey;
    });
    
    // Console log for debugging mismatches
    if (!foundKey) {
        console.warn(`🔍 AMENITY MISMATCH: "${amenity}" -> normalized: "${normalizedKey}" -> NO MATCH FOUND`);
        console.log('Available mapping keys:', Object.keys(amenityMapping));
        return { name: amenity, iconType: '/svg/add.svg' };
    }
    
    const result = amenityMapping[foundKey];
    console.log(`✅ AMENITY MATCHED: "${amenity}" -> "${foundKey}" -> ${result.name} (${result.iconType})`);
    return result;
}

// Function to check and log all amenity mismatches and missing icons
async function debugAmenities(apiAmenities, otherAmenities) {
    console.group('🔍 AMENITY DEBUG ANALYSIS');
    
    // Get list of available SVG files
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
    
    // Store results for final summary
    const results = {
        matched: [],
        unmatched: [],
        unusedMappings: [],
        missingSVGs: [],
        suggestions: {}
    };
    
    // Check API amenities
    console.group('🔍 API AMENITIES ANALYSIS');
    if (apiAmenities && apiAmenities.length > 0) {
        console.log(`📊 Total API amenities: ${apiAmenities.length}`);
        apiAmenities.forEach((amenity, index) => {
            console.log(`${index + 1}. "${amenity}"`);
            const result = getAmenitySVGByMapping(amenity);
            if (result.iconType === '/svg/add.svg') {
                console.warn(`❌ No icon found for: "${amenity}"`);
                results.unmatched.push(amenity);
                // Suggest potential matches
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
    
    // Check other amenities
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
    
    // Check for unused mapping entries
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
    
    // Check for missing SVG files referenced in mapping
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
    
    // Final Summary
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
    
    // Store results globally for inspection
    window.amenityDebugResults = results;
    console.log('💾 Debug results stored in window.amenityDebugResults for inspection');
}

function renderAmenities(apiAmenities, otherAmenities) {
    // Debug amenities for mismatches and issues
    debugAmenities(apiAmenities, otherAmenities);
    
    const normalizedSet = new Set(apiAmenities.map(a => a.toLowerCase().replace(/[_-\s]+/g, '')));
    const modal = document.getElementById('ammenitiesModal');
    
    // First, populate the preview amenity list (first 3 amenities)
    const amenityList = document.getElementById('amenityList');
    if (amenityList && apiAmenities) {
        amenityList.innerHTML = '';
        apiAmenities.slice(0, 3).forEach(amenity => {
            const { name, iconType } = getAmenitySVGByMapping(amenity);
            const div = document.createElement('div');
            div.className = 'flex items-center gap-2';
            
            // Check if we have a proper icon or should use bullet
            const hasProperIcon = iconType && iconType !== '/svg/add.svg';
            
            if (hasProperIcon) {
                // Use the icon image
                div.innerHTML = `
                    <img src="${iconType}" alt="${name}" class="w-6 h-6">
                    <span class="font-roboto text-base text-primary-text">${name}</span>
                `;
            } else {
                // Use bullet point
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
    
    // Then populate the modal
    if (!modal) return;

    // Process each section and track if they have visible items
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
                hasVisibleItems = true; // Mark section as having visible items
            } else {
                li.classList.add('hidden');
                if (amenityDiv) amenityDiv.classList.add('hidden');
            }
        });
        
        // Hide or show the entire section based on whether it has visible items
        if (hasVisibleItems) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });

    // Handle the Others section specifically
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

        // Audit: Log property view
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
                // Clear existing content and add overflow hidden to container
                el.innerHTML = '';
                el.classList.add('overflow-hidden');
                
                // Create inner div for the background image that will scale
                const photoDiv = document.createElement('div');
                photoDiv.className = 'w-full h-full transition-transform duration-300 ease-in-out hover:scale-110';
                photoDiv.style.backgroundImage = `url('${data.photoLinks[idx]}')`;
                photoDiv.style.backgroundSize = 'cover';
                photoDiv.style.backgroundPosition = 'center';
                photoDiv.style.backgroundRepeat = 'no-repeat';
                
                // Add the photo div inside the container
                el.appendChild(photoDiv);
            }
        });

        const allPhotoContainer = document.getElementById('allPhoto');
        if (allPhotoContainer && data.photoLinks) {
            allPhotoContainer.innerHTML = '';
            data.photoLinks.forEach((link, index) => {
                // Create container div that maintains size
                const containerDiv = document.createElement('div');
                containerDiv.className = 'rounded-xl w-full h-100 cursor-pointer overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out';
                
                // Create inner div for the background image that will scale
                const photoDiv = document.createElement('div');
                photoDiv.className = 'w-full h-full transition-transform duration-300 ease-in-out hover:scale-110';
                photoDiv.style.backgroundImage = `url('${link}')`;
                photoDiv.style.backgroundSize = 'cover';
                photoDiv.style.backgroundPosition = 'center';
                photoDiv.style.backgroundRepeat = 'no-repeat';
                
                // Add the photo div inside the container
                containerDiv.appendChild(photoDiv);
                
                containerDiv.setAttribute('alt', `Room view ${index + 1}`);
                containerDiv.setAttribute('data-image-index', index);
                
                // Optional: Add click handler for image viewing
                containerDiv.addEventListener('click', () => {
                    console.log(`Clicked on image ${index + 1}:`, link);
                    // You can add modal or lightbox functionality here
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
            if(el) {
                // Preserve line breaks for description
                if (id === 'roomDescription') {
                    el.style.whiteSpace = 'pre-line';
                }
                el.textContent = value || '';
            }
        });

        // Handle timeIn and timeOut data
        const timeInOutElement = document.getElementById('timeInOut');
        if (timeInOutElement && data.timeIn && data.timeOut) {
            // Format the time display
            const formattedTime = `${data.timeIn} - ${data.timeOut}`;
            timeInOutElement.textContent = formattedTime;
            console.log('TimeIn and TimeOut from API:', data.timeIn, data.timeOut);
        } else if (timeInOutElement) {
            // Fallback if timeIn/timeOut not available
            timeInOutElement.textContent = 'Time not available';
            console.log('TimeIn/TimeOut not available from API:', { timeIn: data.timeIn, timeOut: data.timeOut });
        }

        const mapIframe = document.getElementById('maplink');
        if (mapIframe && data.mapLink) {
            const srcMatch = data.mapLink.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) {
                mapIframe.src = srcMatch[1];
            }
        }

        // Render amenities using the unified renderAmenities function
        if (typeof renderAmenities === "function") {
            const amenities = Array.isArray(data.amenities) ? data.amenities : [];
            const otherAmenities = Array.isArray(data.otherAmenities) ? data.otherAmenities : [];
            renderAmenities(amenities, otherAmenities);
        }

        // Store property data globally for reservation
        // Extract coordinates from mapLink
        const coordinates = extractCoordinatesFromMapLink(data.mapLink);
        
        currentPropertyData = {
            id: propertyId,
            name: data.name,
            address: data.address,
            packagePrice: data.packagePrice,
            additionalPax: data.additionalPax, // This is the PRICE per additional guest
            reservationFee: data.reservationFee,
            packageCapacity: data.packageCapacity,
            maxCapacity: data.maxCapacity,
            discount: data.discount, // Add discount from API response
            images: data.photoLinks || [],
            timeIn: data.timeIn,
            timeOut: data.timeOut,
            // Include additional fields that might be needed for directions functionality
            mapLink: data.mapLink,
            city: data.city,
            category: data.category,
            description: data.description,
            rating: data.rating,
            photoLinks: data.photoLinks || [],
            // Store extracted coordinates
            latitude: coordinates?.lat,
            longitude: coordinates?.lng
        };

        // Update guest counter limits based on API maxCapacity and packageCapacity
        console.log('Property data received - maxCapacity:', data.maxCapacity, 'packageCapacity:', data.packageCapacity);
        updateGuestCounterLimits(data.maxCapacity, data.packageCapacity);

        // Setup Reserve button functionality
        setupReserveButton();

        // Setup description toggle functionality
        setupDescriptionToggle();

        // Listen for calendar date selection events
        document.addEventListener('datesSelected', function(e) {
            console.log('Dates selected event received:', e.detail);
            // Update the reserve button state or do any additional setup
        });

        // Initialize directions button with coordinates
        setTimeout(() => {
            if (currentPropertyData.latitude && currentPropertyData.longitude) {
                setupDirectionsButton(
                    currentPropertyData.address,
                    currentPropertyData.latitude,
                    currentPropertyData.longitude
                );
            } else {
                console.warn('No coordinates found in mapLink:', currentPropertyData.mapLink);
            }
        }, 500);

        // Dispatch custom event to notify that property data is loaded
        const propertyDataEvent = new CustomEvent('propertyDataLoaded', {
            detail: { propertyData: currentPropertyData }
        });
        document.dispatchEvent(propertyDataEvent);

        // Also call updateBookingDatesDisplay to check if we have dates from URL
        setTimeout(updateBookingDatesDisplay, 100);

    } catch (err) {
        console.error('Error fetching property:', err);
    } finally {
        hideFullscreenLoading();
    }
}

// Function to update guest counter limits based on API maxCapacity and packageCapacity
function updateGuestCounterLimits(maxCapacity, packageCapacity = 1) {
    if (!maxCapacity || maxCapacity < 1) {
        console.warn('Invalid maxCapacity from API:', maxCapacity);
        return;
    }

    console.log('Updating guest counter limits - Max:', maxCapacity, 'Package:', packageCapacity, 'Additional:', maxCapacity - packageCapacity);

    // Update all guest counter containers
    document.querySelectorAll('.guest-counter').forEach((counter, index) => {
        console.log(`Updating guest counter ${index}:`, counter);
        // Update the data attributes
        counter.setAttribute('data-max', maxCapacity);
        counter.setAttribute('data-package-capacity', packageCapacity);
    });

    // Call the global function to update guest counter capacity if available
    if (window.updateGuestCounterCapacity) {
        console.log('Calling window.updateGuestCounterCapacity...');
        window.updateGuestCounterCapacity(maxCapacity, packageCapacity);
    } else {
        console.warn('window.updateGuestCounterCapacity not available');
    }

    // Also dispatch the custom event for backward compatibility
    const updateEvent = new CustomEvent('updateGuestLimit', {
        detail: { 
            maxCapacity: maxCapacity,
            packageCapacity: packageCapacity 
        }
    });
    console.log('Dispatching updateGuestLimit event:', updateEvent.detail);
    document.dispatchEvent(updateEvent);
}

// Function to setup description text toggle functionality
function setupDescriptionToggle() {
    const descWrapper = document.getElementById('descWrapper');
    const toggleText = document.getElementById('toggleText');
    const description = document.getElementById('roomDescription');
    
    if (!descWrapper || !toggleText || !description) {
        console.warn('Description toggle elements not found');
        return;
    }

    // Check if the description content is short enough that it doesn't need toggling
    const checkContentHeight = () => {
        // Temporarily expand to measure full height
        const originalMaxHeight = descWrapper.style.maxHeight;
        descWrapper.style.maxHeight = 'none';
        const fullHeight = description.scrollHeight;
        descWrapper.style.maxHeight = originalMaxHeight;
        
        // If content fits within the collapsed height (6rem = 96px), hide the toggle
        const collapsedHeight = 96; // 6rem in pixels
        
        if (fullHeight <= collapsedHeight) {
            toggleText.style.display = 'none';
        } else {
            toggleText.style.display = 'block';
            setupToggleHandler();
        }
    };

    // Setup toggle click handler
    const setupToggleHandler = () => {
        let isExpanded = false;
        
        toggleText.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (isExpanded) {
                // Collapse
                descWrapper.style.maxHeight = '6rem';
                toggleText.textContent = 'Read More';
                isExpanded = false;
            } else {
                // Expand
                descWrapper.style.maxHeight = description.scrollHeight + 'px';
                toggleText.textContent = 'Read Less';
                isExpanded = true;
            }
        });
    };

    // Check content height after a short delay to ensure content is loaded
    setTimeout(checkContentHeight, 100);
}

// Function to setup Reserve button click handler
function setupReserveButton() {
    const reserveButton = document.getElementById('reserveButton');
    if (!reserveButton) {
        console.warn('Reserve button not found');
        return;
    }

    reserveButton.addEventListener('click', () => {
        // First validate user authentication and verification
        if (!validateReservationData()) {
            return; // Modal will be shown by validateReservationData
        }

        // Get booking data from URL parameters (from search)
        const urlParams = new URLSearchParams(window.location.search);
        const bookingData = getBookingDataFromURL(urlParams);
        
        // Update booking data with current guest count from the counter
        const guestCount = window.currentGuestCount || bookingData.guestCount || 1;
        bookingData.guestCount = guestCount;
        
        console.log('Updated booking data with current guest count:', guestCount);
        
        if (!currentPropertyData) {
            console.error('Property data not available');
            showToastError('error', 'Property Data Missing', 'Property information is not loaded. Please refresh the page and try again.');
            return;
        }

        if (!bookingData.checkInDate || !bookingData.checkOutDate) {
            console.error('Booking dates not available');
            console.log('Available booking data:', bookingData);
            
            // Show toast instead of alert
            showToastError('warning', 'Dates Required', 'Please select check-in and check-out dates using the calendar above before making a reservation.');
            return;
        }

        // Additional validation for guest count
        if (guestCount < 1) {
            showToastError('warning', 'Guest Count Required', 'Please select at least one guest for your reservation.');
            return;
        }

        // Check if all required property data is present (from currentPropertyData, not bookingData)
        if (!currentPropertyData.name || !currentPropertyData.packagePrice) {
            console.log('Missing property data:', currentPropertyData);
            showToastError('error', 'Property Information Missing', 'Some property information is missing. Please refresh the page and try again.');
            return;
        }

        console.log('All validations passed. Proceeding with reservation...');
        console.log('Property data:', currentPropertyData);
        console.log('Booking data:', bookingData);
        
        // Navigate to confirm reservation with data
        navigateToConfirmReservation(currentPropertyData, bookingData);
    });
}

// Function to extract booking data from URL parameters
function getBookingDataFromURL(urlParams) {
    // Try URL parameters first
    let checkInDate = urlParams.get('checkIn');
    let checkOutDate = urlParams.get('checkOut');
    let guestCount = parseInt(urlParams.get('people')) || parseInt(urlParams.get('guests')) || parseInt(urlParams.get('guestCount')) || 1;
    
    // Debug: Log what we found in URL
    console.log('URL params - checkIn:', checkInDate, 'checkOut:', checkOutDate, 'people/guests:', guestCount);
    
    // If not found in URL, try to get from calendar system
    if (!checkInDate || !checkOutDate) {
        // Check if dates are stored in window object from calendar
        if (window.selectedBookingDates && window.selectedBookingDates.length >= 1) {
            checkInDate = window.selectedBookingDates[0];
            
            if (window.selectedBookingDates.length >= 2) {
                // Multiple dates selected - use range
                checkOutDate = window.selectedBookingDates[window.selectedBookingDates.length - 1];
            } else {
                // Single date selected - auto-set checkout to next day for 1-night stay
                const checkInDateObj = new Date(window.selectedBookingDates[0]);
                const checkOutDateObj = new Date(checkInDateObj);
                checkOutDateObj.setDate(checkOutDateObj.getDate() + 1);
                checkOutDate = checkOutDateObj.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                
                console.log(`Single date selected. Auto-setting: Check-in: ${checkInDate}, Check-out: ${checkOutDate} (1 night stay)`);
            }
            
            console.log('Got dates from window.selectedBookingDates:', checkInDate, checkOutDate);
        }
        
        // Also try to get from input elements
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
    
    // Try to get guest count from various input elements if not in URL
    if (guestCount === 1) {
        // First check if there's a global guest count from guestCount.js
        if (window.currentGuestCount && window.currentGuestCount > 1) {
            guestCount = window.currentGuestCount;
            console.log('Got guest count from window.currentGuestCount:', guestCount);
        }
        // Then try the guestCount elements that store the actual selected count
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
        
        // Fallback to guestSummary text parsing
        if (guestCount === 1) {
            const guestSummary = document.getElementById('guestSummary');
            if (guestSummary && guestSummary.textContent && !guestSummary.textContent.includes('Add guests')) {
                // Extract number from text like "2 guests" or "1 guest"
                const match = guestSummary.textContent.match(/(\d+)/);
                if (match && parseInt(match[1]) > 0) {
                    guestCount = parseInt(match[1]);
                    console.log('Got guest count from guestSummary:', guestCount);
                }
            }
        }
        
        // Final fallback to other input elements
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
        
        // Ensure minimum 1 day stay (this should be the standard minimum)
        daysOfStay = Math.max(1, daysOfStay);
        
        console.log('Calculated days of stay:', daysOfStay);
    }

    const bookingData = {
        checkInDate,
        checkOutDate,
        guestCount,
        daysOfStay: Math.max(1, daysOfStay) // Ensure at least 1 day
    };
    
    console.log('Final booking data:', bookingData);
    return bookingData;
}

// Function to handle navigation to confirm reservation
function navigateToConfirmReservation(propertyData, bookingData) {
    const params = new URLSearchParams();
    
    // Property data (ensure propertyId is properly set)
    const propertyId = propertyData.id || propertyData.propertyId || '';
    
    // Debug: Log the property data to see what we're working with
    console.log('Navigating to confirm reservation with property data:', propertyData);
    console.log('Property ID being passed:', propertyId);
    
    // Validation: Ensure we have a property ID
    if (!propertyId) {
        console.error('No property ID found in property data:', propertyData);
        showToastError('error', 'Navigation Error', 'Property ID is missing. Please refresh the page and try again.');
        return;
    }
    
    params.append('propertyId', propertyId);
    params.append('propertyName', propertyData.name || '');
    params.append('propertyAddress', propertyData.address || '');
    
    // Booking data
    params.append('checkInDate', bookingData.checkInDate || '');
    params.append('checkOutDate', bookingData.checkOutDate || '');
    params.append('guestCount', bookingData.guestCount || '1');
    params.append('daysOfStay', bookingData.daysOfStay || '1');
    
    // Get the actual additional guests count from the guest counter display (not calculated)
    const additionalPaxCount = window.currentGuestCount || 0; // This is the value shown in the +/- counter
    const packageCapacity = parseInt(propertyData.packageCapacity) || 1;
    
    // Calculate total guest count for display (package capacity + additional guests from counter)
    const totalGuestCount = packageCapacity + additionalPaxCount;
    
    // Pricing data
    params.append('pricePerDay', propertyData.packagePrice || '0');
    params.append('addGuestPrice', propertyData.additionalPax || '0'); // This is the PRICE per additional guest from API
    params.append('reservationFee', propertyData.reservationFee || '0');
    params.append('packageCapacity', propertyData.packageCapacity || '1');
    params.append('discount', propertyData.discount || '0');
    params.append('additionalPax', additionalPaxCount.toString()); // This is the COUNT from the guest counter display
    params.append('guestCount', totalGuestCount.toString()); // Total guests for booking
    
    // Time data
    params.append('timeIn', propertyData.timeIn || '');
    params.append('timeOut', propertyData.timeOut || '');
    
    console.log('Passing pricing data to confirm reservation:', { 
        packagePrice: propertyData.packagePrice, 
        additionalPaxPrice: propertyData.additionalPax, // PRICE per additional guest from API
        reservationFee: propertyData.reservationFee,
        discount: propertyData.discount, // Discount percentage from API
        additionalPaxCount: additionalPaxCount, // COUNT from guest counter display (window.currentGuestCount)
        totalGuestCount: totalGuestCount, // Package capacity + additional guests
        packageCapacity: packageCapacity,
        timeIn: propertyData.timeIn, 
        timeOut: propertyData.timeOut 
    });
    
    // Debug: Log the final URL
    const finalUrl = `../auth/confirm-reservation.html?${params.toString()}`;
    console.log('Final navigation URL:', finalUrl);
    
    // Navigate to confirm reservation page
    window.location.href = finalUrl;
}

document.addEventListener('DOMContentLoaded', fetchAndDisplayProperty);

// Function to update the booking dates display in the dateBookingModal
function updateBookingDatesDisplay() {
    const checkInDateEl = document.getElementById('displayCheckInDate');
    const checkInTimeEl = document.getElementById('displayCheckInTime');
    const checkOutDateEl = document.getElementById('displayCheckOutDate');
    const checkOutTimeEl = document.getElementById('displayCheckOutTime');
    const displayContainer = document.getElementById('bookingDatesDisplay');
    
    if (!checkInDateEl || !checkInTimeEl || !checkOutDateEl || !checkOutTimeEl || !displayContainer) {
        return;
    }

    // Get dates from URL parameters or selected dates
    let checkInDate = null;
    let checkOutDate = null;
    
    const urlParams = new URLSearchParams(window.location.search);
    checkInDate = urlParams.get('checkIn');
    checkOutDate = urlParams.get('checkOut');
    
    // Try window.selectedBookingDates if URL params not available
    if ((!checkInDate || !checkOutDate) && window.selectedBookingDates && window.selectedBookingDates.length >= 1) {
        checkInDate = window.selectedBookingDates[0];
        if (window.selectedBookingDates.length >= 2) {
            checkOutDate = window.selectedBookingDates[window.selectedBookingDates.length - 1];
        } else {
            // Single date selected - auto-set checkout to next day
            const checkInDateObj = new Date(window.selectedBookingDates[0]);
            const checkOutDateObj = new Date(checkInDateObj);
            checkOutDateObj.setDate(checkOutDateObj.getDate() + 1);
            checkOutDate = checkOutDateObj.toISOString().split('T')[0];
        }
    }

    // Get times from property data
    const checkInTime = currentPropertyData?.timeIn || '';
    const checkOutTime = currentPropertyData?.timeOut || '';

    if (checkInDate && checkOutDate) {
        // Format dates as MM/DD/YYYY | Time
        const formatDate = (dateStr, time) => {
            const date = new Date(dateStr);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            const formattedDate = `${month}/${day}/${year}`;
            return time ? `${formattedDate} | ${time}` : formattedDate;
        };

        // Update display
        checkInDateEl.textContent = formatDate(checkInDate, checkInTime);
        checkInTimeEl.textContent = '';
        checkOutDateEl.textContent = formatDate(checkOutDate, checkOutTime);
        checkOutTimeEl.textContent = ''; 
        
        displayContainer.classList.remove('hidden');
    } else {
        checkInDateEl.textContent = 'Select date';
        checkInTimeEl.textContent = '';
        checkOutDateEl.textContent = 'Select date';
        checkOutTimeEl.textContent = '';
        
        displayContainer.classList.add('hidden');
    }
}

// Listen for date selection events
document.addEventListener('datesSelected', function(e) {
    updateBookingDatesDisplay();
});

document.addEventListener('bookingDatesUpdate', function(e) {
    updateBookingDatesDisplay();
});

// Listen for property data loaded to get check-in/out times
document.addEventListener('propertyDataLoaded', function() {
    updateBookingDatesDisplay();
});

// Update when modal opens
document.addEventListener('click', function(e) {
    if (e.target.closest('[data-modal-target="dateBookingModal"]')) {
        setTimeout(updateBookingDatesDisplay, 100);
    }
});

// Function to extract coordinates from mapLink iframe
function extractCoordinatesFromMapLink(mapLink) {
    try {
        if (!mapLink) {
            console.warn('No mapLink provided');
            return null;
        }

        console.log('Extracting coordinates from mapLink:', mapLink);

        // Extract the src URL from the iframe HTML string
        const srcMatch = mapLink.match(/src="([^"]+)"/);
        if (!srcMatch) {
            console.warn('No src found in mapLink');
            return null;
        }

        const src = srcMatch[1];
        console.log('Extracted src:', src);

        // Try to find coordinates in the format: 2s14.6579489,121.0193219
        const directCoords = src.match(/2s(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (directCoords) {
            console.log('Found coordinates in 2s format:', directCoords[1], directCoords[2]);
            return {
                lat: parseFloat(directCoords[1]),
                lng: parseFloat(directCoords[2])
            };
        }

        // Try to find coordinates in !3d!4d format
        const coordsMatch = src.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (coordsMatch) {
            console.log('Found coordinates in !3d!4d format:', coordsMatch[1], coordsMatch[2]);
            return {
                lat: parseFloat(coordsMatch[1]),
                lng: parseFloat(coordsMatch[2])
            };
        }

        // Try pb parameter format
        const pbMatch = src.match(/!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
        if (pbMatch) {
            console.log('Found coordinates in pb format:', pbMatch[2], pbMatch[1]);
            return {
                lat: parseFloat(pbMatch[2]),
                lng: parseFloat(pbMatch[1])
            };
        }

        // If no coordinates found in any format, try to extract from the URL query params
        try {
            const url = new URL(src);
            const coords = url.searchParams.get('q');
            if (coords) {
                const [lat, lng] = coords.split(',').map(parseFloat);
                if (!isNaN(lat) && !isNaN(lng)) {
                    console.log('Found coordinates in URL params:', lat, lng);
                    return { lat, lng };
                }
            }
        } catch (e) {
            console.warn('Error parsing URL:', e);
        }

        console.warn('Could not extract coordinates from mapLink');
        return null;
    } catch (error) {
        console.error('Error extracting coordinates:', error);
        return null;
    }
}

// Function to initialize directions button functionality
function initializeDirectionsButton() {
    const directionsButtonContainer = document.getElementById('directionsButtonContainer');
    const directionsBtn = document.getElementById('directionsBtn');
    const mapContainer = document.getElementById('mapContainer');
    
    if (!directionsButtonContainer || !directionsBtn || !mapContainer) return;
    
    // Show the directions button when property data is loaded
    if (currentPropertyData && (currentPropertyData.address || currentPropertyData.city)) {
        directionsButtonContainer.classList.remove('hidden');
        
        // Use the same approach as view-booking page
        const address = currentPropertyData.address || currentPropertyData.city || '';
        const coordinates = currentPropertyData.mapLink ? extractCoordinatesFromMapLink(currentPropertyData.mapLink) : null;
        const latitude = coordinates?.lat;
        const longitude = coordinates?.lng;
        
        setupDirectionsButton(address, latitude, longitude);
    }
}



// Function to setup directions button functionality
function setupDirectionsButton(address, latitude, longitude) {
    try {
        const directionsButtonContainer = document.getElementById('directionsButtonContainer');
        const directionsBtn = document.getElementById('directionsBtn');
        const mapContainer = document.getElementById('mapContainer');
        
        if (!directionsButtonContainer || !directionsBtn || !mapContainer) {
            console.error('Directions button elements not found');
            return;
        }

        // Show the directions button
        directionsButtonContainer.classList.remove('hidden');

        // Store coordinates in map container's dataset for use in directions
        if (latitude && longitude) {
            mapContainer.dataset.lat = latitude;
            mapContainer.dataset.lng = longitude;
        }

        // Set up click handler for directions button
        let isShowingDirections = false;
        let originalMapContent = '';
        
        directionsBtn.onclick = () => {
            const directionsText = document.getElementById('directionsText');
            
            if (!isShowingDirections) {
                // Store original map content before changing it
                originalMapContent = mapContainer.innerHTML;
                
                // Change text to "Get Location"
                if (directionsText) {
                    directionsText.textContent = "Get Location";
                }
                
                // Show loading animation immediately
                mapContainer.innerHTML = `
                    <div class="w-full h-full bg-neutral-100 flex items-center justify-center rounded-2xl">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p class="text-neutral-600 font-inter">Getting your location...</p>
                        </div>
                    </div>
                `;
                
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const userLat = position.coords.latitude;
                            const userLng = position.coords.longitude;
                            
                            // Get stored coordinates from the map container
                            const storedLat = mapContainer.dataset.lat;
                            const storedLng = mapContainer.dataset.lng;

                            // Use the same embed format as the original mapLink
                            const directionsUrl = `https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d1000!2d${storedLng}!3d${storedLat}`
                                + `!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x0%3A0x0!2s${userLat},${userLng}`
                                + `!3m2!1d${userLat}!2d${userLng}!4m5!1s0x0%3A0x0!2s${storedLat},${storedLng}`
                                + `!3m2!1d${storedLat}!2d${storedLng}!5e0!3m2!1sen!2sph!4v${Date.now()}!5m2!1sen!2sph`;

                            // Update map with directions
                            mapContainer.innerHTML = `
                                <iframe 
                                    class="w-full h-full rounded-2xl"
                                    src="${directionsUrl}"
                                    allowfullscreen=""
                                    loading="lazy"
                                    referrerpolicy="no-referrer-when-downgrade">
                                </iframe>`;
                            
                            if (directionsText) {
                                directionsText.textContent = "Back to Map";
                            }
                            isShowingDirections = true;
                        },
                        (error) => {
                            console.error('Error getting user location:', error);
                            mapContainer.innerHTML = originalMapContent;
                            showToast('error', 'Location Error', 'Could not get your current location. Please enable location services and try again.');
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        }
                    );
                } else {
                    console.error('Geolocation not supported');
                    mapContainer.innerHTML = originalMapContent;
                    showToast('error', 'Location Error', 'Your browser does not support location services.');
                }
            } else {
                // Return to original map view
                mapContainer.innerHTML = originalMapContent;
                if (directionsText) {
                    directionsText.textContent = "Get Directions";
                }
                isShowingDirections = false;
            }
        };
    } catch (error) {
        console.error('Error setting up directions button:', error);
    }
}
                if (navigator.geolocation) {
                    console.log('Geolocation available, requesting user location...');
                    
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const userLat = position.coords.latitude;
                            const userLng = position.coords.longitude;
                            
                            // Create directions URL with user location and our precise destination (driving mode)
                            const directionsEmbedUrl = `https://maps.google.com/maps?saddr=${userLat},${userLng}&daddr=${directionsQuery}&output=embed&maptype=satellite&dirflg=d`;
                            
                            console.log('Generated directions URL:', directionsEmbedUrl);
                            
                            // Update the iframe with directions from user's actual location
                            mapContainer.innerHTML = `
                                <iframe src="${directionsEmbedUrl}" 
                                    class="w-full h-full rounded-2xl"
                                    style="border:0;" 
                                    allowfullscreen="" 
                                    loading="lazy" 
                                    referrerpolicy="no-referrer-when-downgrade">
                                </iframe>
                            `;
                            
                            isShowingDirections = true;
                        },
                        (error) => {
                            console.error('Geolocation error:', error);
                            
                            // Show loading briefly before showing fallback
                            mapContainer.innerHTML = `
                                <div class="w-full h-full bg-neutral-100 flex items-center justify-center rounded-2xl">
                                    <div class="text-center">
                                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                        <p class="text-neutral-600 font-inter">Loading map...</p>
                                    </div>
                                </div>
                            `;
                            
                            // Add a brief delay to show loading, then show fallback
                            setTimeout(() => {
                                // Use simple maps.google.com URL for fallback (no API key needed)
                                const fallbackEmbedUrl = `https://maps.google.com/maps?q=${directionsQuery}&output=embed&maptype=satellite&dirflg=d`;
                                
                                console.log('Generated fallback directions URL:', fallbackEmbedUrl);
                                
                                mapContainer.innerHTML = `
                                    <div class="w-full h-full bg-neutral-100 flex flex-col rounded-2xl overflow-hidden">
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
                                
                                isShowingDirections = true;
                            }, 800); // 800ms delay to show loading
                        },
                        { 
                            enableHighAccuracy: true, 
                            timeout: 10000, 
                            maximumAge: 300000 
                        }
                    );
                } else {
                    // Browser doesn't support geolocation, show loading then fallback
                    console.log('Geolocation not supported, showing loading then fallback...');
                    
                    // Show loading briefly before showing fallback
                    setTimeout(() => {
                        // Use simple maps.google.com URL (no API key needed)
                        const fallbackEmbedUrl = `https://maps.google.com/maps?q=${directionsQuery}&output=embed&maptype=satellite&dirflg=d`;
                        
                        console.log('Generated no-geolocation fallback URL:', fallbackEmbedUrl);
                        
                        mapContainer.innerHTML = `
                            <div class="w-full h-full bg-neutral-100 flex flex-col rounded-2xl overflow-hidden">
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
                        
                        isShowingDirections = true;
                    }, 800); // 800ms delay to show loading
                }
// Call this function after property data is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all elements are loaded
    setTimeout(initializeDirectionsButton, 1000);
});

