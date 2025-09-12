document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('messageBox');

    textarea.addEventListener('input', function () {
      this.style.height = 'auto'; 
      const maxHeight = 100; 
      this.style.height = Math.min(this.scrollHeight, maxHeight) + 'px';
    });
  });