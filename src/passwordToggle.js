document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
      const wrapper = button.closest('.password-wrapper');
      if (!wrapper) return;

      const input = wrapper.querySelector('.password-input');
      const eyeOpen = button.querySelector('.eye-open');   // 👁️ show password
      const eyeClosed = button.querySelector('.eye-closed'); // 🙈 hide password

      if (!input || !eyeOpen || !eyeClosed) {
        console.warn("⚠️ Missing required elements for password toggle.");
        return;
      }

      if (input.type === 'password') {
        // Password is hidden → show it
        input.type = 'text';
        eyeOpen.classList.add('hidden');   // hide open eye
        eyeClosed.classList.remove('hidden'); // show closed eye
      } else {
        // Password is visible → hide it
        input.type = 'password';
        eyeOpen.classList.remove('hidden'); // show open eye
        eyeClosed.classList.add('hidden');  // hide closed eye
      }
    });
  });

  console.log("✅ Password toggle initialized");
});


