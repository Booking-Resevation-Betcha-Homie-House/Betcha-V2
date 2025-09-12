document.addEventListener("DOMContentLoaded", () => {
    const radios = document.querySelectorAll('input[name="payment"]');
    const qrContainer = document.querySelector(".qr-container");

    radios.forEach(radio => {
      radio.addEventListener("change", () => {
        const qr1 = radio.getAttribute("data-qr1");
        const qr2 = radio.getAttribute("data-qr2");
        const qrSingle = radio.getAttribute("data-qr");

        if (qr1 && qr2) {
          
          qrContainer.innerHTML = `
            <div class="flex flex-col gap-2 items-center">
              <img src="${qr1}" alt="GCash QR 1" class="object-contain" />
              <img src="${qr2}" alt="GCash QR 2" class="object-contain" />
            </div>
          `;
        } else if (qrSingle) {
          
          qrContainer.innerHTML = `<img src="${qrSingle}" alt="Payment QR" class=" object-contain" />`;
        } else {
          qrContainer.innerHTML = ''; 
        }
      });
    });
  });