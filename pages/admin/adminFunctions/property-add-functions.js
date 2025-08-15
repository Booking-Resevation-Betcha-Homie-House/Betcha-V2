//Can now add images from the file input with id="images" but doesnt display the images in the preview

document.addEventListener('DOMContentLoaded', function () {
  // Find the Confirm button inside the confirmDetailsModal
  const confirmModal = document.getElementById('confirmDetailsModal');
  if (!confirmModal) return;

  // Find the Confirm button (the one that says Confirm)
  const confirmBtn = Array.from(confirmModal.querySelectorAll('button'))
    .find(btn => btn.textContent && btn.textContent.trim().toLowerCase().includes('confirm'));
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    // Collect form data
    const formData = new FormData();
   // Main info
    const name = document.getElementById('input-prop-name').value.trim();
    console.log('Name:', name);
    formData.append('name', name);

    const address = document.getElementById('input-prop-address').value.trim();
    console.log('Address:', address);
    formData.append('address', address);

    const mapLink = document.getElementById('input-prop-mapLink').value.trim();
    console.log('Map Link:', mapLink);
    formData.append('mapLink', mapLink);

    const city = document.getElementById('input-prop-city').value.trim();
    console.log('City:', city);
    formData.append('city', city);

    const description = document.getElementById('input-prop-desc').value.trim();
    console.log('Description:', description);
    formData.append('description', description);

    // Category
    const category = document.getElementById('selectedCategory').textContent.trim();
    console.log('Category:', category);
    formData.append('category', category);

    // Capacities & Prices
    const packageCapacity = document.getElementById('input-prop-packCap').value;
    console.log('Package Capacity:', packageCapacity);
    formData.append('packageCapacity', packageCapacity);

    const maxCapacity = document.getElementById('input-prop-maxCap').value;
    console.log('Max Capacity:', maxCapacity);
    formData.append('maxCapacity', maxCapacity);

    const timeIn = document.getElementById('checkInTimeText').textContent.trim();
    console.log('Time In:', timeIn);
    formData.append('timeIn', timeIn);

    const timeOut = document.getElementById('checkOutTimeText').textContent.trim();
    console.log('Time Out:', timeOut);
    formData.append('timeOut', timeOut);

    const packagePrice = document.getElementById('input-prop-packPrice').value;
    console.log('Package Price:', packagePrice);
    formData.append('packagePrice', packagePrice);

    const additionalPax = document.getElementById('input-prop-addPaxPrice').value;
    console.log('Additional Pax:', additionalPax);
    formData.append('additionalPax', additionalPax);

    const reservationFee = document.getElementById('input-prop-rsrvFee').value;
    console.log('Reservation Fee:', reservationFee);
    formData.append('reservationFee', reservationFee);

    const discount = document.getElementById('input-prop-discount').value;
    console.log('Discount:', discount);
    formData.append('discount', discount);

    // Gather default amenities (checked checkboxes NOT in amenitiesList)
    const amenities = [];
    document.querySelectorAll('#editAmmenitiesModal input[type="checkbox"]:checked').forEach(cb => {
      if (!cb.closest('#amenitiesList') && cb.value) {
        amenities.push(cb.value);
      }
    });
    console.log('Default Amenities:', amenities);
    amenities.forEach(a => formData.append('amenities[]', a));

    // Gather otherAmenities (checked checkboxes inside amenitiesList)
    const otherAmenities = [];
    document.querySelectorAll('#amenitiesList input[type="checkbox"]:checked').forEach(cb => {
      if (cb.value) otherAmenities.push(cb.value);
    });
    console.log('Other Amenities:', otherAmenities);
    otherAmenities.forEach(a => formData.append('otherAmenities[]', a));

    // Gather images from Alpine.js data
    const imageContainer = document.querySelector('[x-data*="images"]');
    if (imageContainer && window.Alpine) {
      const alpineData = window.Alpine.$data(imageContainer);
      if (alpineData && alpineData.selectedFiles && alpineData.selectedFiles.length > 0) {
        for (let i = 0; i < alpineData.selectedFiles.length; i++) {
          console.log('Photo:', alpineData.selectedFiles[i]);
          formData.append('photo', alpineData.selectedFiles[i]);
        }
      } else {
        console.log('Photo: No files selected');
      }
    } else {
      // Fallback to direct file input access
      const fileInput = document.getElementById('images');
      if (fileInput && fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
          console.log('Photo:', fileInput.files[i]);
          formData.append('photo', fileInput.files[i]);
        }
      } else {
        console.log('Photo: No files selected');
      }
    }


    // Send to API
    try {
      const response = await fetch('https://betcha-api.onrender.com/property/create', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Property added successfully!');
        window.location.href = 'property.html'; // Redirect or reset as needed
      } else {
        const error = await response.json().catch(() => ({}));
        alert('Error: ' + (error.message || 'Failed to add property.'));
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  });
});