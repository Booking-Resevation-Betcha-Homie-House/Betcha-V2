console.log('Landing page functions loaded');

// Helper function to truncate text with ellipsis
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

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

// Expose toggleFaq to global scope for inline onclick handlers
window.toggleFaq = toggleFaq;

async function fetchAndDisplayTotalBookedDays() {
    try {
        const response = await fetch('https://betcha-api.onrender.com/landing/totalOfDaysBooked');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const bookedDaysElement = document.getElementById('bookedDays');
        if (bookedDaysElement && data.totalDaysBooked !== undefined) {
            bookedDaysElement.textContent = `${data.totalDaysBooked} nights`;
        } else {
            console.error('Booked days element not found or invalid data structure');
        }
    } catch (error) {
        console.error('Error fetching total booked days:', error);
        // Fallback to show placeholder if API fails
        const bookedDaysElement = document.getElementById('bookedDays');
        if (bookedDaysElement) {
            bookedDaysElement.textContent = '0 nights';
        }
    }
}

async function fetchAndDisplayAdsBanner() {
    try {
        const bannerContainer = document.getElementById('adsBanner');
        const bannerImg = document.getElementById('adsBannerImg');
        const bannerTitle = document.getElementById('adsBannerTitle');
        const bannerContent = document.getElementById('adsBannerContent');

        if (!bannerContainer || !bannerImg || !bannerTitle || !bannerContent) {
            console.error('Required banner elements not found in DOM');
            return;
        }

        const response = await fetch('https://betcha-api.onrender.com/landing/display/68e888c28705c6444cfd5fcf');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.imageLink) {
            const img = new Image();
            img.onload = function() { bannerImg.src = data.imageLink; };
            img.onerror = function() {
                console.error('Failed to load banner image');
                bannerImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            };
            img.src = data.imageLink;
        }

        if (data.txtColor) bannerContainer.style.color = data.txtColor;
        bannerTitle.textContent = data.title || 'Welcome to Betcha';
        bannerContent.textContent = data.content || 'Experience the best stays';
    } catch (error) {
        console.error('Error in ads banner:', error);
    }
}

async function fetchAndDisplayFAQs() {
    try {
        const response = await fetch('https://betcha-api.onrender.com/faq/five');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const faqContainer = document.getElementById('faqContainer');
        if (!faqContainer) {
            console.error('FAQ container not found');
            return;
        }

        if (!data.Faq || data.Faq.length === 0) {
            faqContainer.style.display = 'none';
            return;
        }

        faqContainer.innerHTML = '';
        data.Faq.forEach((faq) => {
            const faqElement = document.createElement('div');
            faqElement.innerHTML = `
              <div class="rounded-3xl border border-black bg-background text-primary-text w-full p-2 md:p-5">
                <button onclick="toggleFaq(this)" class="w-full h-full flex justify-between items-center text-left hover:cursor-pointer">
                  <span class="font-bold text-lg font-manrope text-primary-text md:text-2xl">${faq.question}</span>
                  <svg class="icon w-6 h-6 text-primary-text transition-transform duration-300 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path class="plus" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    <path class="minus hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                  </svg>
                </button>
                <div class="faq-content max-h-0 overflow-hidden px-5 text-sm transition-all duration-500 ease-in-out">
                  <div class="py-4">
                    <p class="font-roboto text-primary-text text-sm md:text-base">${faq.answer}</p>
                  </div>
                </div>
              </div>
            `;
            faqContainer.appendChild(faqElement);
        });
    } catch (error) {
        console.error('Error in FAQs:', error);
        const faqSection = document.getElementById('faqSection');
        if (faqSection) faqSection.style.display = 'none';
    }
}

async function fetchAndDisplayFeaturedUnits() {
    try {
        const response = await fetch('https://betcha-api.onrender.com/landing/display/68e888c28705c6444cfd5fcf');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (!data.featured || data.featured.length === 0) {
            console.error('No featured units found');
            return;
        }

        const featuredUnits = data.featured;
        const getPhotoUrl = (photoLinks) => photoLinks && photoLinks.length > 0 ? photoLinks[0] : '/images/unit01.jpg';

        for (let i = 1; i <= 5; i++) {
            const unitCard = document.getElementById(`featuredUnit${i}`);
            if (!unitCard) continue;

            const unit = featuredUnits[(i - 1) % featuredUnits.length];
            const bgDiv = unitCard.querySelector('div.absolute.inset-0');
            if (bgDiv) bgDiv.style.backgroundImage = `url('${getPhotoUrl(unit.photoLinks)}')`;

            const ratingSpan = unitCard.querySelector('.font-roboto.text-sm.text-primary-text');
            if (ratingSpan) ratingSpan.textContent = unit.rating || '0.0';

            const propertyName = unitCard.querySelector('h2.text-2xl');
            if (propertyName) propertyName.textContent = truncateText(unit.name || 'Property name', 30);

            const location = unitCard.querySelector('p.font-roboto.text-secondary-text.text-sm');
            if (location) location.textContent = truncateText(`${unit.address}, ${unit.city}`, 35);

            const cardContent = unitCard.querySelector('.relative.z-20');
            if (cardContent) {
                cardContent.onclick = () => window.location.href = `/pages/unauth/view-property.html?id=${unit._id}`;
                cardContent.style.cursor = 'pointer';
            }
        }
    } catch (error) {
        console.error('Error in featured units:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing features');
    fetchAndDisplayAdsBanner();
    fetchAndDisplayFeaturedUnits();
    fetchAndDisplayFAQs();
    fetchAndDisplayTotalBookedDays();
});
