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
});

