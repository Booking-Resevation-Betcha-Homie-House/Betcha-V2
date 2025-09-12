document.addEventListener('DOMContentLoaded', () => {
  // Range elements
  const minRange = document.querySelector('#minRange');
  const maxRange = document.querySelector('#maxRange');
  const minPriceText = document.querySelector('#minPrice');
  const maxPriceText = document.querySelector('#maxPrice');
  const highlight = document.querySelector('#rangeHighlight');

  // Number input elements
  const minPriceInput = document.querySelector('#input-minPrice');
  const maxPriceInput = document.querySelector('#input-maxPrice');

  // Exit early if essential elements don't exist (e.g., on pages without price slider)
  if (!minRange || !maxRange) {
    return;
  }

  // Set initial values for number inputs
  if (minPriceInput) minPriceInput.value = minRange.value;
  if (maxPriceInput) maxPriceInput.value = maxRange.value;

  function updateValues(newMin, newMax, source = null) {
    let min = parseInt(newMin);
    let max = parseInt(newMax);

    // Enforce min/max constraints
    min = Math.max(parseInt(minRange.min), Math.min(parseInt(minRange.max), min));
    max = Math.max(parseInt(minRange.min), Math.min(parseInt(minRange.max), max));

    // Prevent overlap
    if (min > max) {
      if (source === 'min') {
        min = max;
      } else {
        max = min;
      }
    }

    // Update range inputs (if they weren't the source)
    if (source !== 'range') {
      minRange.value = min;
      maxRange.value = max;
    }

    // Update number inputs (if they weren't the source)
    if (source !== 'input') {
      if (minPriceInput) minPriceInput.value = min;
      if (maxPriceInput) maxPriceInput.value = max;
    }

    // Update the price display text
    if (minPriceText) minPriceText.textContent = min;
    if (maxPriceText) maxPriceText.textContent = max;

    // Update highlight bar
    if (highlight) {
      const rangeWidth = minRange.max - minRange.min;
      const left = ((min - minRange.min) / rangeWidth) * 100;
      const right = ((max - minRange.min) / rangeWidth) * 100;
      highlight.style.left = `${left}%`;
      highlight.style.width = `${right - left}%`;
    }

    // Dispatch change event for search state updates
    minRange.dispatchEvent(new Event('change'));
    maxRange.dispatchEvent(new Event('change'));
  }

  // Range input listeners
  minRange.addEventListener('input', () => {
    updateValues(minRange.value, maxRange.value, 'range');
  });

  maxRange.addEventListener('input', () => {
    updateValues(minRange.value, maxRange.value, 'range');
  });

  // Number input listeners
  if (minPriceInput) {
    minPriceInput.addEventListener('input', () => {
      updateValues(minPriceInput.value, maxPriceInput.value, 'input');
    });

    // Handle empty input
    minPriceInput.addEventListener('blur', () => {
      if (!minPriceInput.value) {
        minPriceInput.value = minRange.min;
        updateValues(minRange.min, maxPriceInput.value, 'input');
      }
    });
  }

  if (maxPriceInput) {
    maxPriceInput.addEventListener('input', () => {
      updateValues(minPriceInput.value, maxPriceInput.value, 'input');
    });

    // Handle empty input
    maxPriceInput.addEventListener('blur', () => {
      if (!maxPriceInput.value) {
        maxPriceInput.value = maxRange.max;
        updateValues(minPriceInput.value, maxRange.max, 'input');
      }
    });
  }

  // Initialize with default values
  updateValues(minRange.value, maxRange.value);
});
