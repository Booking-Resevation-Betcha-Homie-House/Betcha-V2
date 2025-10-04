// finished? need to be tested
// for what yung get five faq na api?

// API Base URL
const API_BASE = 'https://betcha-api.onrender.com';

// Skeleton and content toggle functions
function showSkeleton() {
    const skeleton = document.getElementById('faqsSkeleton');
    const content = document.getElementById('faqsContent');
    if (skeleton) skeleton.classList.remove('hidden');
    if (content) content.classList.add('hidden');
}

function hideSkeleton() {
    const skeleton = document.getElementById('faqsSkeleton');
    const content = document.getElementById('faqsContent');
    if (skeleton) skeleton.classList.add('hidden');
    if (content) content.classList.remove('hidden');
}

async function getAllFAQS() {
    try {
        showSkeleton();
        const response = await fetch(`${API_BASE}/faq/getAll`);
        const data = await response.json();
        console.log(data);
        if (data && data.allFAQ) {
            renderFAQs(data.allFAQ);
        } else {
            // Handle empty state
            renderEmptyState();
        }
        hideSkeleton();
    } catch (error) {
        console.log(error);
        hideSkeleton();
        renderErrorState();
    }
}

// Render empty state
function renderEmptyState() {
    const grid = document.getElementById('faqsContent');
    if (!grid) return;
    grid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="text-gray-400 mb-4">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
            <p class="text-gray-500">Get started by adding your first FAQ.</p>
        </div>
    `;
}

// Render error state
function renderErrorState() {
    const grid = document.getElementById('faqsContent');
    if (!grid) return;
    grid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="text-red-400 mb-4">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load FAQs</h3>
            <p class="text-gray-500 mb-4">There was an error loading the FAQs. Please try again.</p>
            <button onclick="getAllFAQS()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                Retry
            </button>
        </div>
    `;
}

// Render FAQs to the container
function renderFAQs(faqs) {
    const grid = document.getElementById('faqsContent');
    if (!grid) return;
    grid.innerHTML = '';

    if (faqs.length === 0) {
        renderEmptyState();
        return;
    }

    faqs.forEach(faq => {
        const faqItem = document.createElement('div');
        faqItem.className = `bg-white rounded-3xl shadow-md flex flex-col gap-5 font-inter p-5 group
            hover:shadow-lg transition-all duration-300 ease-in-out`;

        faqItem.innerHTML = `
            <div class="flex flex-col justify-center gap-2 text-neutral-500">
                <div class="flex justify-between items-start">
                    <p class="text-lg font-bold font-manrope text-primary-text 
                        transition-all duration-300 ease-in-out group-hover:text-primary">
                        ${faq.question}
                    </p>
                    ${faq.active 
                        ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>'
                        : '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>'}
                </div>
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
                    transition-all duration-300 ease-in-out ${faq.active ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'}
                    hover:scale-105 rounded-2xl active:scale-95 py-2"
                    data-id="${faq._id}">
                    <span class="text-sm font-medium ${faq.active ? 'text-red-700' : 'text-green-700'}">${faq.active ? 'Deactivate' : 'Activate'}</span>
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

        // Toggle active status button event
        faqItem.querySelector('.delete-faq-btn').addEventListener('click', async () => {
            await toggleFAQStatus(faq._id);
            getAllFAQS();
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
        await fetch(`${API_BASE}/faq/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });
    } catch (error) {
        console.error('Failed to add FAQ:', error);
        alert('Failed to add FAQ.');
    }
}

// API: Toggle FAQ Active Status
async function toggleFAQStatus(id) {
    if (!confirm('Are you sure you want to toggle the status of this FAQ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/faq/toggle-active/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Failed to update FAQ status');
        }
        
        alert('FAQ status updated successfully!');
    } catch (error) {
        console.error('Failed to update FAQ status:', error);
        alert('Failed to update FAQ status.');
    }
}

// API: Update FAQ
async function updateFAQ(id, question, answer) {
    try {
        await fetch(`${API_BASE}/faq/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });
    } catch (error) {
        console.error('Failed to update FAQ:', error);
        alert('Failed to update FAQ.');
    }
}

window.addEventListener("DOMContentLoaded", getAllFAQS);

window.toggleFAQStatus = toggleFAQStatus;