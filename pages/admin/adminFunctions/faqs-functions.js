// finished? need to be tested
// for what yung get five faq na api?

async function getAllFAQS() {
    try {
        const response = await fetch('https://betcha-api.onrender.com/faq/getAll');
        const data = await response.json();
        console.log(data);
        if (data && data.allFAQ) {
            renderFAQs(data.allFAQ);
        }
    } catch (error) {
        console.log(error);
    }
}

// Render FAQs to the container
function renderFAQs(faqs) {
    const grid = document.querySelector('.grid.gap-4.sm\\:grid-cols-2.h-full');
    if (!grid) return;
    grid.innerHTML = '';

    faqs.forEach(faq => {
        const faqItem = document.createElement('div');
        faqItem.className = `bg-white rounded-3xl shadow-md flex flex-col gap-5 font-inter p-5 group
            hover:shadow-lg transition-all duration-300 ease-in-out`;

        faqItem.innerHTML = `
            <div class="flex flex-col justify-center gap-2 text-neutral-500">
                <p class="text-lg font-bold font-manrope text-primary-text 
                    transition-all duration-300 ease-in-out group-hover:text-primary">
                    ${faq.question}
                </p>
                <div class="flex flex-col w-full">
                    <div class="overflow-hidden transition-[max-height] duration-500 ease-in-out max-h-[6rem]">
                        <p class="font-inter text-primary-text text-sm md:text-base">
                            ${faq.answer}
                        </p>
                    </div>
                    <a class="text-neutral-500 text-xs font-inter mt-3 underline
                        hover:underline hover:cursor-pointer hover:text-primary 
                        transition-all duration-300 ease-in-out md:text-sm">
                    </a>
                </div>
            </div>
            <div class="flex gap-3 w-full mt-3">
                <button 
                    class="edit-faq-btn flex gap-2 justify-center items-center bg-primary/10 w-full cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:bg-primary/20 hover:scale-105 rounded-2xl active:scale-95"
                    data-id="${faq._id}"
                    data-modal-target="editFAQs">
                    <svg class="w-5 stroke-primary" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V8" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12.2499 1.75003C12.5151 1.48481 12.8748 1.33582 13.2499 1.33582C13.625 1.33582 13.9847 1.48481 14.2499 1.75003C14.5151 2.01525 14.6641 2.37496 14.6641 2.75003C14.6641 3.1251 14.5151 3.48481 14.2499 3.75003L8.24123 9.75936C8.08293 9.91753 7.88737 10.0333 7.67257 10.096L5.75723 10.656C5.69987 10.6728 5.63906 10.6738 5.58117 10.6589C5.52329 10.6441 5.47045 10.614 5.4282 10.5717C5.38594 10.5295 5.35583 10.4766 5.341 10.4188C5.32617 10.3609 5.32717 10.3001 5.3439 10.2427L5.9039 8.32736C5.96692 8.11273 6.08292 7.9174 6.24123 7.75936L12.2499 1.75003Z" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button 
                    class="delete-faq-btn flex gap-2 justify-center items-center w-full cursor-pointer
                    transition-all duration-300 ease-in-out bg-rose-100
                    hover:bg-rose-200 hover:scale-105 rounded-2xl active:scale-95"
                    data-id="${faq._id}">
                    <svg class="w-5 fill-rose-700" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.66666 14C4.3 14 3.98622 13.8696 3.72533 13.6087C3.46444 13.3478 3.33378 13.0338 3.33333 12.6667V4H2.66666V2.66667H6V2H10V2.66667H13.3333V4H12.6667V12.6667C12.6667 13.0333 12.5362 13.3473 12.2753 13.6087C12.0144 13.87 11.7004 14.0004 11.3333 14H4.66666ZM11.3333 4H4.66666V12.6667H11.3333V4ZM6 11.3333H7.33333V5.33333H6V11.3333ZM8.66666 11.3333H10V5.33333H8.66666V11.3333Z"/>
                    </svg>
                </button>
            </div>
        `;
        grid.appendChild(faqItem);

        // Edit button event
        faqItem.querySelector('.edit-faq-btn').addEventListener('click', () => {
            // Fill modal with current FAQ data
            document.getElementById('input-question-edit').value = faq.question;
            document.getElementById('input-answer-edit').value = faq.answer;
            document.getElementById('editFAQs').setAttribute('data-faq-id', faq._id);
            // Manually open the modal since modal.js won't catch dynamic buttons
            document.getElementById('editFAQs').classList.remove('hidden');
        });

        // Delete button event
        faqItem.querySelector('.delete-faq-btn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this FAQ?')) {
                await deleteFAQ(faq._id);
                getAllFAQS();
            }
        });
    });
}

// Edit FAQ Save button
document.addEventListener('DOMContentLoaded', () => {
    const editModal = document.getElementById('editFAQs');
    if (editModal) {
        editModal.querySelector('button.bg-primary\\/10')?.addEventListener('click', async () => {
            const id = editModal.getAttribute('data-faq-id');
            const question = document.getElementById('input-question-edit').value;
            const answer = document.getElementById('input-answer-edit').value;
            await updateFAQ(id, question, answer);
            // Modal open/close handled by modal.js, so no need to call closeModal
            getAllFAQS();
        });
    }
});

// Add FAQ Save button
document.addEventListener('DOMContentLoaded', () => {
    const addModal = document.getElementById('addFAQs');
    if (addModal) {
        addModal.querySelector('button.bg-primary\\/10')?.addEventListener('click', async () => {
            const question = document.getElementById('input-question-add').value;
            const answer = document.getElementById('input-answer-add').value;
            if (!question.trim() || !answer.trim()) {
                alert('Please enter both question and answer.');
                return;
            }
            await createFAQ(question, answer);
            // Optionally clear fields
            document.getElementById('input-question-add').value = '';
            document.getElementById('input-answer-add').value = '';
            // Hide modal
            addModal.classList.add('hidden');
            getAllFAQS();
        });
    }
});

// API: Create FAQ
async function createFAQ(question, answer) {
    try {
        await fetch('https://betcha-api.onrender.com/faq/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });
    } catch (error) {
        alert('Failed to add FAQ.');
    }
}

// API: Delete FAQ
async function deleteFAQ(id) {
    try {
        await fetch(`https://betcha-api.onrender.com/faq/delete/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        alert('Failed to delete FAQ.');
    }
}

// API: Update FAQ
async function updateFAQ(id, question, answer) {
    try {
        await fetch(`https://betcha-api.onrender.com/faq/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });
    } catch (error) {
        alert('Failed to update FAQ.');
    }
}

window.addEventListener("DOMContentLoaded", getAllFAQS);