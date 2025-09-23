export class ToastNotification {
    constructor(position = 'top', align = 'right') {
        this.container = null;
        this.position = position;
        this.align = align;
        this.createContainer();
    }

    createContainer() {
        const existingContainer = document.getElementById('toastContainer');
        if (existingContainer) {
            existingContainer.remove();
        }

        const containerHTML = `
            <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', containerHTML);
        this.container = document.getElementById('toastContainer');
    }

    show(type, title, message, duration = 5000) {
        const toastId = 'toast-' + Date.now();
        
        let bgColor = '';
        let borderColor = '';
        let iconHTML = '';
        let titleColor = '';

        switch (type) {
            case 'error':
                bgColor = 'bg-red-50';
                borderColor = 'border-red-200';
                titleColor = 'text-red-800';
                iconHTML = `
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                `;
                break;
            case 'success':
                bgColor = 'bg-green-50';
                borderColor = 'border-green-200';
                titleColor = 'text-green-800';
                iconHTML = `
                    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                `;
                break;
            case 'warning':
                bgColor = 'bg-yellow-50';
                borderColor = 'border-yellow-200';
                titleColor = 'text-yellow-800';
                iconHTML = `
                    <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                `;
                break;
            case 'info':
                bgColor = 'bg-blue-50';
                borderColor = 'border-blue-200';
                titleColor = 'text-blue-800';
                iconHTML = `
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                `;
                break;
            case 'auth':
                bgColor = 'bg-purple-50';
                borderColor = 'border-purple-200';
                titleColor = 'text-purple-800';
                iconHTML = `
                    <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                `;
                break;
            default:
                bgColor = 'bg-gray-50';
                borderColor = 'border-gray-200';
                titleColor = 'text-gray-800';
                iconHTML = `
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                `;
        }

        const toastHTML = `
            <div id="${toastId}" class="toast-slide-in ${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 relative">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        ${iconHTML}
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm font-medium ${titleColor}">
                            ${title}
                        </p>
                        <p class="mt-1 text-sm text-gray-600">
                            ${message}
                        </p>
                    </div>
                    <div class="ml-4 flex-shrink-0 flex">
                        <button onclick="this.closest('.toast-slide-in').remove()" class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', toastHTML);

        if (duration > 0) {
            setTimeout(() => {
                this.remove(toastId);
            }, duration);
        }

        return toastId;
    }

    remove(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.add('toast-slide-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }

    removeAll() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

const toast = new ToastNotification();

export function validateReservationData() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        const noAccountModal = document.getElementById('noAccountModal');
        if (noAccountModal) {
            noAccountModal.classList.remove('hidden');
        } else {
            toast.show('auth', 'Login Required', 'Please log in to your account before making a reservation.');
        }
        return false;
    }

    const userVerified = localStorage.getItem('verified');
    if (userVerified !== 'true') {
        toast.show('auth', 'Account Verification Required', 'Please verify your account before making a reservation.');
        return false;
    }

    return true;
}

export function showToast(type, title, message, duration = 5000) {
    return toast.show(type, title, message, duration);
}

export function showToastError(message, title = 'Error', duration = 5000) {
    return toast.show('error', title, message, duration);
}

export function showToastSuccess(message, title = 'Success', duration = 5000) {
    return toast.show('success', title, message, duration);
}

export function showToastWarning(message, title = 'Warning', duration = 5000) {
    return toast.show('warning', title, message, duration);
}

export function removeToast(toastId) {
    toast.remove(toastId);
}

export function clearAllToasts() {
    toast.removeAll();
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in-right {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slide-out-right {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .toast-slide-in {
        animation: slide-in-right 0.3s ease-out;
    }

    .toast-slide-out {
        animation: slide-out-right 0.3s ease-in;
    }

    #toastContainer {
        pointer-events: none;
    }

    #toastContainer > * {
        pointer-events: auto;
    }
`;
document.head.appendChild(style);
