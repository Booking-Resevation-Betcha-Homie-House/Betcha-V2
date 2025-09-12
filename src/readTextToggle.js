document.addEventListener("DOMContentLoaded", () => {
  const descWrapper = document.getElementById("descWrapper");
  const toggleText = document.getElementById("toggleText");
  const collapsedHeight = '6rem'; 
  const expandedHeight = descWrapper.scrollHeight + "px";

  let expanded = false;

  toggleText.addEventListener("click", () => {
    expanded = !expanded;

    if (expanded) {
      descWrapper.style.maxHeight = descWrapper.scrollHeight + "px";
      toggleText.textContent = "Read Less";
    } else {
      descWrapper.style.maxHeight = collapsedHeight;
      toggleText.textContent = "Read More";
    }
  });
});
