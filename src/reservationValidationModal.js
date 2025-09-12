
class ReservationValidationModal {
    constructor() {
        this.modal = null;
        this.createModal();
    }

    createModal() {
        
        const existingModal = document.getElementById('reservationValidationModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div id="reservationValidationModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative animate-fade-in">
                    
                    <button id="closeValidationModal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>

                    <div class="text-center">
                        
                        <div id="validationIconContainer" class="mx-auto flex items-center justify-center w-16 h-16 rounded-full mb-4">
                            
                        </div>

                        <h3 id="validationTitle" class="text-lg font-semibold text-gray-900 mb-2">
                            Reservation Not Available
                        </h3>

                        <p id="validationMessage" class="text-gray-600 mb-6">
                            Please complete the required information before proceeding.
                        </p>

                        <div class="flex justify-center space-x-3">
                            <button id="validationOkButton" class="px-8 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-medium">
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('reservationValidationModal');

        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeBtn = document.getElementById('closeValidationModal');
        const okBtn = document.getElementById('validationOkButton');
        const modal = this.modal;

        const closeModal = () => {
            this.hide();
        };

        closeBtn.addEventListener('click', closeModal);
        okBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }

    show(type, title, message) {
        const iconContainer = document.getElementById('validationIconContainer');
        const titleElement = document.getElementById('validationTitle');
        const messageElement = document.getElementById('validationMessage');

        titleElement.textContent = title;
        messageElement.textContent = message;

        let iconHTML = '';
        let containerClasses = '';

        switch (type) {
            case 'error':
                containerClasses = 'bg-red-100 text-red-600';
                iconHTML = `
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                `;
                break;
            case 'warning':
                containerClasses = 'bg-yellow-100 text-yellow-600';
                iconHTML = `
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                `;
                break;
            case 'info':
                containerClasses = 'bg-blue-100 text-blue-600';
                iconHTML = `
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                `;
                break;
            case 'auth':
                containerClasses = 'bg-purple-100 text-purple-600';
                iconHTML = `
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                `;
                break;
            default:
                containerClasses = 'bg-gray-100 text-gray-600';
                iconHTML = `
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                `;
        }

        iconContainer.className = `mx-auto flex items-center justify-center w-16 h-16 rounded-full mb-4 ${containerClasses}`;
        iconContainer.innerHTML = iconHTML;

        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; 
    }

    hide() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            document.body.style.overflow = ''; 
        }
    }
}

export function validateReservationData() {
    const modal = new ReservationValidationModal();

    const userId = localStorage.getItem('userId');
    if (!userId) {
        modal.show('auth', 'Login Required', 'Please log in to your account before making a reservation.');
        return false;
    }

    const userVerified = localStorage.getItem('verified');
    if (userVerified !== 'true') {
        modal.show('auth', 'Account Verification Required', 'Please verify your account before making a reservation. Check your email for verification instructions.');
        return false;
    }

    return true;
}

export function showValidationError(type, title, message) {
    const modal = new ReservationValidationModal();
    modal.show(type, title, message);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .animate-fade-in {
        animation: fade-in 0.2s ease-out;
    }
`;
document.head.appendChild(style);
