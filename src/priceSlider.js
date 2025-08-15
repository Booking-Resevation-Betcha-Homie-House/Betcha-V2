document.addEventListener('DOMContentLoaded', () => {
  const minRange = document.querySelector('#minRange');
  const maxRange = document.querySelector('#maxRange');
  const minPriceText = document.querySelector('#minPrice');
  const maxPriceText = document.querySelector('#maxPrice');
  const highlight = document.querySelector('#rangeHighlight');

  function updateSlider() {
    let min = parseInt(minRange.value);
    let max = parseInt(maxRange.value);

    // Prevent overlap
    if (min > max) {
      [minRange.value, maxRange.value] = [max, min];
      [min, max] = [max, min];
    }

    // Update the price display
    minPriceText.textContent = min;
    maxPriceText.textContent = max;

    // Update summary text (optional, if you're showing it elsewhere)
    const minText = document.getElementById("minPriceText");
    const maxText = document.getElementById("maxPriceText");
    if (minText) minText.textContent = min;
    if (maxText) maxText.textContent = max;

    // Highlight bar
    const rangeWidth = minRange.max - minRange.min;
    const left = ((min - minRange.min) / rangeWidth) * 100;
    const right = ((max - minRange.min) / rangeWidth) * 100;
    highlight.style.left = `${left}%`;
    highlight.style.width = `${right - left}%`;
  }

  minRange.addEventListener('input', updateSlider);
  maxRange.addEventListener('input', updateSlider);

  updateSlider(); // call it once on load
});
