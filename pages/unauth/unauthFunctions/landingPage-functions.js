console.log('Landing page functions loaded');

function toggleFaq(button) {
    const faqItem = button.closest("div");
    const content = faqItem.querySelector(".faq-content");
    const icon = button.querySelector(".icon");
    const plus = icon.querySelector(".plus");
    const minus = icon.querySelector(".minus");

    const isOpen = content.classList.contains("faq-open");

    if (isOpen) {
        content.style.maxHeight = "0px";
        content.classList.remove("faq-open");
        plus.classList.remove("hidden");
        minus.classList.add("hidden");
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        content.classList.add("faq-open");
        plus.classList.add("hidden");
        minus.classList.remove("hidden");
    }
}

// Initialize all features
async function fetchAndDisplayTotalBookedDays() {
    try {
        const response = await fetch('https://betcha-api.onrender.com/landing/totalOfDaysBooked');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const bookedDaysElement = document.getElementById('bookedDays');
        if (bookedDaysElement) {
            bookedDaysElement.textContent = `${data.totalDaysBooked} days`;
        } else {
            console.error('Booked days element not found');
        }
    } catch (error) {
        console.error('Error fetching total booked days:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing features');
    fetchAndDisplayAdsBanner();
    fetchAndDisplayFeaturedUnits();
    fetchAndDisplayFAQs();
    fetchAndDisplayTotalBookedDays();
});

async function fetchAndDisplayAdsBanner() {
    try {
        // Wait for DOM elements to be available
        const bannerContainer = document.getElementById('adsBanner');
        const bannerImg = document.getElementById('adsBannerImg');
        const bannerTitle = document.getElementById('adsBannerTitle');
        const bannerContent = document.getElementById('adsBannerContent');

        // Check if elements exist
        if (!bannerContainer || !bannerImg || !bannerTitle || !bannerContent) {
            console.error('Required banner elements not found in DOM');
            return;
        }

        // Fetch data
        const response = await fetch('https://betcha-api.onrender.com/landing/display/68a735c07753114c9e87c793');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Set image with error handling
        if (data.imageLink) {
            // Create a new image to test loading
            const img = new Image();
            img.onload = function() {
                bannerImg.src = data.imageLink;
            };
            img.onerror = function() {
                console.error('Failed to load banner image');
                bannerImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent fallback
            };
            img.src = data.imageLink;
        }

        // Set text color with validation
        if (data.txtColor) {
            bannerContainer.style.color = data.txtColor;
        }

        // Set title and content with fallbacks
        bannerTitle.textContent = data.title || 'Welcome to Betcha';
        bannerContent.textContent = data.content || 'Experience the best stays';

    } catch (error) {
        console.error('Error in ads banner:', error);
    }
}

// Featured Units Functionality
// FAQ Functionality
async function fetchAndDisplayFAQs() {
    try {
        // Fetch FAQs from API
        const response = await fetch('https://betcha-api.onrender.com/faq/five');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Get FAQ container
        const faqContainer = document.getElementById('faqContainer');
        if (!faqContainer) {
            console.error('FAQ container not found');
            return;
        }

        // If no FAQs, hide the entire FAQ section
        if (!data.Faq || data.Faq.length === 0) {
            faqContainer.style.display = 'none';
            return;
        }

        // Clear existing FAQs
        faqContainer.innerHTML = '';

        // Add new FAQs
        data.Faq.forEach((faq, index) => {
            const faqElement = document.createElement('div');
            faqElement.innerHTML = `
              <div class="rounded-3xl border-4 border-black bg-background text-primary-text w-full p-2 shadow-harsh shadow-primary-text md:p-5">
                <button onclick="toggleFaq(this)" class="w-full h-full flex justify-between items-center text-left hover:cursor-pointer">
                  <span class="font-bold text-lg font-manrope text-primary-text md:text-2xl">${faq.question}</span>
                  <svg class="icon w-6 h-6 text-primary-text transition-transform duration-300 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path class="plus" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    <path class="minus hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                  </svg>
                </button>
                <div class="faq-content max-h-0 overflow-hidden px-5 text-sm transition-all duration-500 ease-in-out">
                  <div class="py-4">
                    <p class="font-roboto text-primary-text text-sm md:text-base">
                      ${faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            `;
            faqContainer.appendChild(faqElement);
        });

        // Re-initialize accordion functionality
        initializeAccordion();

    } catch (error) {
        console.error('Error in FAQs:', error);
        // Hide FAQ section on error
        const faqSection = document.getElementById('faqSection');
        if (faqSection) {
            faqSection.style.display = 'none';
        }
    }
}

async function fetchAndDisplayFeaturedUnits() {
    try {
        // Fetch data from API
        const response = await fetch('https://betcha-api.onrender.com/landing/display/68a735c07753114c9e87c793');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Check if featured array exists and has items
        if (!data.featured || data.featured.length === 0) {
            console.error('No featured units found');
            return;
        }

        // Get all featured units
        const featuredUnits = data.featured;

        // Function to get photo URL from photoLinks array
        const getPhotoUrl = (photoLinks) => {
            return photoLinks && photoLinks.length > 0 ? photoLinks[0] : '/images/unit01.jpg';
        };

        // Update each featured unit card (we have 5 static cards to update)
        for (let i = 1; i <= 5; i++) {
            const unitCard = document.getElementById(`featuredUnit${i}`);
            if (!unitCard) continue;

            // Get the unit data (cycle through available units)
            const unit = featuredUnits[(i - 1) % featuredUnits.length];

            // Update the background image
            const bgDiv = unitCard.querySelector('div.absolute.inset-0');
            if (bgDiv) {
                bgDiv.style.backgroundImage = `url('${getPhotoUrl(unit.photoLinks)}')`;
            }

            // Update the rating
            const ratingSpan = unitCard.querySelector('.font-roboto.text-sm.text-primary-text');
            if (ratingSpan) {
                ratingSpan.textContent = unit.rating || '0.0';
            }

            // Update the property name
            const propertyName = unitCard.querySelector('h2.text-2xl');
            if (propertyName) {
                propertyName.textContent = unit.name || 'Property name';
            }

            // Update the location
            const location = unitCard.querySelector('p.font-roboto.text-secondary-text.text-sm');
            if (location) {
                location.textContent = `${unit.address}, ${unit.city}`;
            }

            // Add click handler to "Learn more" to go to property details
            const cardContent = unitCard.querySelector('.relative.z-20');
            if (cardContent) {
                cardContent.onclick = () => {
                    window.location.href = `/pages/unauth/property.html?id=${unit._id}`;
                };
            }
        }

    } catch (error) {
        console.error('Error in featured units:', error);
    }
}

// Ensure DOM is fully loaded before running
// Initialize accordion functionality
function initializeAccordion() {
    const accordionButtons = document.querySelectorAll('[data-accordion-target]');
    
    accordionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-accordion-target');
            const content = document.querySelector(targetId);
            const icon = button.querySelector('svg');
            
            // Toggle current accordion
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', !isExpanded);
            
            if (content) {
                content.classList.toggle('hidden');
                if (icon) {
                    icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            }
            
            // Close other accordions
            accordionButtons.forEach(otherButton => {
                if (otherButton !== button) {
                    const otherId = otherButton.getAttribute('data-accordion-target');
                    const otherContent = document.querySelector(otherId);
                    const otherIcon = otherButton.querySelector('svg');
                    
                    otherButton.setAttribute('aria-expanded', 'false');
                    if (otherContent) {
                        otherContent.classList.add('hidden');
                    }
                    if (otherIcon) {
                        otherIcon.style.transform = 'rotate(0deg)';
                    }
                }
            });
        });
    });
}
