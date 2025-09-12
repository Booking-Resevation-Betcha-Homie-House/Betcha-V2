document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('messageBox');

    textarea.addEventListener('input', function () {
      this.style.height = 'auto'; // reset height
      const maxHeight = 100; // ~4 lines max (adjust if needed)
      this.style.height = Math.min(this.scrollHeight, maxHeight) + 'px';
    });
  });