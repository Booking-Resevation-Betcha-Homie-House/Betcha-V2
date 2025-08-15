document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("qr-upload");
    const preview = document.getElementById("qr-preview");

    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
});
