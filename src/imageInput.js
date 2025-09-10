document.addEventListener("DOMContentLoaded", () => {
      const dropzone = document.getElementById("dropzone");
      const fileInput = document.getElementById("fileInput");
      const previewContainer = document.getElementById("previewContainer");

      dropzone.addEventListener("click", () => fileInput.click());

      fileInput.addEventListener("change", handleFiles);

      function handleFiles(event) {
        const files = event.target.files;

        previewContainer.innerHTML = "";

        Array.from(files).forEach((file) => {
          if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return;

          const reader = new FileReader();
          reader.onload = function(e) {
            const preview = document.createElement("div");
            preview.className = "flex items-center justify-between gap-4 p-3 border border-neutral-300 rounded-lg  mb-5 hover:bg-neutral-50 hover:border-primary transition-all duration-500 ease-in-out";

            preview.innerHTML = `
              <div class="flex items-center gap-3">
                <img src="${e.target.result}" alt="${file.name}" class="w-14 h-14 object-cover rounded-md">
                <div>
                  <p class="text-sm font-semibold text-neutral-800 truncate max-w-[160px]">${file.name}</p>
                  <p class="text-xs text-neutral-500">${Math.round(file.size / 1024)} KB</p>
                </div>
              </div>
              <button class="text-neutral-400" onclick="this.closest('div').remove()">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 stroke-neutral-500 hover:stroke-primary hover:scale-105 active:scale-95 transition-all duration-500 ease-in-out" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            `;

            previewContainer.appendChild(preview);
          };
          reader.readAsDataURL(file);
        });

        fileInput.value = "";
      }
    });