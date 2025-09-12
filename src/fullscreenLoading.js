
export function showFullscreenLoading(message = 'Loading') {
    
    const existingOverlays = document.querySelectorAll('[id^="fullscreen-loading"]');
    existingOverlays.forEach(overlay => overlay.remove());

    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'fullscreen-loading-overlay';
    loadingOverlay.className = 'fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm';

    const style = document.createElement('style');
    style.textContent = `
        @keyframes loadingDots {
            0% { content: ''; }
            25% { content: '.'; }
            50% { content: '..'; }
            75% { content: '...'; }
            100% { content: ''; }
        }
        .loading-dots::after {
            content: '';
            animation: loadingDots 1.5s infinite;
            display: inline-block;
            width: 24px;
            text-align: left;
        }
    `;
    document.head.appendChild(style);
    
    const content = `
        <div class="text-center">
            <div class="animate-spin rounded-full h-24 w-24 border-b-4 border-secondary mx-auto mb-6"></div>
            <p class="text-white text-lg flex items-center justify-center" id="loading-message">
                <span>${message}</span>
                <span class="loading-dots"></span>
            </p>
        </div>
    `;
    
    loadingOverlay.innerHTML = content;
    document.body.appendChild(loadingOverlay);
}

export function hideFullscreenLoading() {
    const existingOverlays = document.querySelectorAll('[id^="fullscreen-loading"]');
    existingOverlays.forEach(overlay => overlay.remove());
}
