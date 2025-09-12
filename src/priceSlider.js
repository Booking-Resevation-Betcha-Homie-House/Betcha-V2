document.addEventListener('DOMContentLoaded', () => {
  
  const minRange = document.querySelector('#minRange');
  const maxRange = document.querySelector('#maxRange');
  const minPriceText = document.querySelector('#minPrice');
  const maxPriceText = document.querySelector('#maxPrice');
  const highlight = document.querySelector('#rangeHighlight');

  const minPriceInput = document.querySelector('#input-minPrice');
  const maxPriceInput = document.querySelector('#input-maxPrice');

  if (!minRange || !maxRange) {
    return;
  }

  if (minPriceInput) minPriceInput.value = minRange.value;
  if (maxPriceInput) maxPriceInput.value = maxRange.value;

  function updateValues(newMin, newMax, source = null) {
    let min = parseInt(newMin);
    let max = parseInt(newMax);

    min = Math.max(parseInt(minRange.min), Math.min(parseInt(minRange.max), min));
    max = Math.max(parseInt(minRange.min), Math.min(parseInt(minRange.max), max));

    if (min > max) {
      if (source === 'min') {
        min = max;
      } else {
        max = min;
      }
    }

    if (source !== 'range') {
      minRange.value = min;
      maxRange.value = max;
    }

    if (source !== 'input') {
      if (minPriceInput) minPriceInput.value = min;
      if (maxPriceInput) maxPriceInput.value = max;
    }

    if (minPriceText) minPriceText.textContent = min;
    if (maxPriceText) maxPriceText.textContent = max;

    if (highlight) {
      const rangeWidth = minRange.max - minRange.min;
      const left = ((min - minRange.min) / rangeWidth) * 100;
      const right = ((max - minRange.min) / rangeWidth) * 100;
      highlight.style.left = `${left}%`;
      highlight.style.width = `${right - left}%`;
    }

    minRange.dispatchEvent(new Event('change'));
    maxRange.dispatchEvent(new Event('change'));
  }

  minRange.addEventListener('input', () => {
    updateValues(minRange.value, maxRange.value, 'range');
  });

  maxRange.addEventListener('input', () => {
    updateValues(minRange.value, maxRange.value, 'range');
  });

  if (minPriceInput) {
    minPriceInput.addEventListener('input', () => {
      updateValues(minPriceInput.value, maxPriceInput.value, 'input');
    });

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

    maxPriceInput.addEventListener('blur', () => {
      if (!maxPriceInput.value) {
        maxPriceInput.value = maxRange.max;
        updateValues(minPriceInput.value, maxRange.max, 'input');
      }
    });
  }

  updateValues(minRange.value, maxRange.value);
});
