document.addEventListener('DOMContentLoaded', () => {
    const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

    function setupDropdown(id, options, placeholder = "Select") {
        const btn = document.getElementById(`${id}DropdownBtn`);
        const list = document.getElementById(`${id}DropdownList`);
        const display = document.getElementById(`selected${capitalize(id)}Method`);
        const icon = document.getElementById(`${id}DropdownIcon`);
        const otherDiv = document.getElementById('paymentNameDiv'); 

        display.textContent = placeholder;

        btn.addEventListener("click", () => {
            list.classList.toggle("hidden");
            icon.classList.toggle("rotate-180");
        });

        options.forEach(opt => {
            const li = document.createElement("li");
            li.textContent = opt;
            li.className = "px-4 py-2 hover:bg-neutral-100 active:bg-neutral-100 cursor-pointer font-normal";
            li.onclick = () => {
                display.textContent = opt;
                display.classList.remove("text-neutral-400");
                display.classList.add("text-primary-text");
                list.classList.add("hidden");
                icon.classList.remove("rotate-180");

                if (opt === "Other") {
                    otherDiv.classList.remove("hidden");
                } else {
                    otherDiv.classList.add("hidden");
                }
            };
            list.appendChild(li);
        });

        document.addEventListener("click", (e) => {
            if (!btn.contains(e.target) && !list.contains(e.target)) {
                list.classList.add("hidden");
                icon.classList.remove("rotate-180");
            }
        });
    }

    const paymentOptions = ["GCash", "Maya", "GoTyme", "Union Bank", "Other"];

    setupDropdown("payment", paymentOptions, "Select Payment");
});
