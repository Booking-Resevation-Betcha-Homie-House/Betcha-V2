document.addEventListener('DOMContentLoaded', () => {
  //FAQs
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
      icon.classList.remove("rotate-180");
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
      content.classList.add("faq-open");

      plus.classList.add("hidden");
      minus.classList.remove("hidden");
      icon.classList.add("rotate-180");
    }
  }
  window.toggleFaq = toggleFaq;

  // Populate FAQs from API
  const faqContainer = document.querySelector('.w-full.space-y-4');
  if (faqContainer) {
    fetchFAQsAndRender(faqContainer);
  }

  async function fetchFAQsAndRender(container) {
    try {
      const resp = await fetch('https://betcha-api.onrender.com/faq/getAll');
      if (!resp.ok) throw new Error(`Failed to fetch FAQs (${resp.status})`);
      const data = await resp.json();
      const allFAQs = Array.isArray(data?.allFAQ) ? data.allFAQ : [];
      
      // Filter to only show ACTIVE FAQs
      const list = allFAQs.filter(faq => faq.active === true);

      // Clear existing static items
      container.innerHTML = '';

      if (list.length === 0) {
        container.innerHTML = '<p class="text-sm text-muted">No FAQs available at the moment.</p>';
        return;
      }

      const fragment = document.createDocumentFragment();
      list.forEach((faq) => {
        const item = document.createElement('div');
        item.className = 'border-b border-neutral-500 bg-background text-primary-text w-full p-2 md:p-5';
        item.innerHTML = `
          <button class="w-full flex justify-between items-center text-left hover:cursor-pointer">
            <span class="font-bold text-xl font-manrope text-primary-text md:text-2xl">${escapeHtml(faq.question || '')}</span>
            <svg class="icon w-6 h-6 text-primary-text transition-transform duration-300 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path class="plus" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              <path class="minus hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>
          <div class="faq-content max-h-0 overflow-hidden transition-all duration-500 ease-in-out px-5 text-sm">
            <div class="py-4">
              <p class="font-roboto text-start text-primary-text">${escapeHtml(faq.answer || '')}</p>
            </div>
          </div>`;

        const button = item.querySelector('button');
        button.addEventListener('click', () => toggleFaq(button));
        fragment.appendChild(item);
      });

      container.appendChild(fragment);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});

