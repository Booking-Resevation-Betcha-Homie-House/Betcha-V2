document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
      const wrapper = button.closest('.password-wrapper');
      const input = wrapper.querySelector('.password-input');
      const eyeOpen = button.querySelector('.eye-open');
      const eyeClosed = button.querySelector('.eye-closed');

      if (!input || !eyeOpen || !eyeClosed) {
        console.warn("Missing one of the required elements.");
        return;
      }

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      eyeClosed.classList.toggle('hidden', !isPassword);
      eyeOpen.classList.toggle('hidden', isPassword);
    });
  });

  console.log("Password toggle initialized 🔥");

});

