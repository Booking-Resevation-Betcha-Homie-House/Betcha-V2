

(function () {
    const STYLE_ID = 'betcha-loader-style';
    const OVERLAY_ID = 'betcha-loader-overlay';
    const MIN_VISIBLE_MS = 500; 
    let lastShowAt = 0;

    function injectStylesOnce() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${OVERLAY_ID} {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            @keyframes loadingDots {
                0% { content: ''; }
                25% { content: '.'; }
                50% { content: '..'; }
                75% { content: '...'; }
                100% { content: ''; }
            }
            
            .betcha-loading-dots::after {
                content: '';
                animation: loadingDots 1.5s infinite;
                display: inline-block;
                width: 24px;
                text-align: left;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .betcha-spinner {
                animation: spin 1s linear infinite;
                border-radius: 50%;
                height: 6rem;
                width: 6rem;
                border-width: 0;
                border-bottom-width: 4px;
                border-style: solid;
                border-color: transparent;
                border-bottom-color: var(--color-secondary);
                margin: 0 auto 1.5rem auto;
            }
            
            .betcha-loading-text {
                color: white;
                font-size: 18px;
                font-weight: 500;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
        `;
        document.head.appendChild(style);
    }

    function getPageTitle() {
        const path = (location.pathname || '').toLowerCase();
        if (path.includes('/dashboard.html')) return 'Loading Dashboard...';
        if (path.includes('/pm.html')) return 'Loading Property Management...';
        if (path.includes('/psr.html')) return 'Loading Property Summary...';
        if (path.includes('/ts.html')) return 'Loading Transaction Summary...';
        if (path.includes('/tk.html')) return 'Loading Support Tickets...';
        if (path.includes('/profile.html')) return 'Loading Profile...';
        if (path.includes('/property.html')) return 'Loading Properties...';
        if (path.includes('/employees.html')) return 'Loading Employees...';
        if (path.includes('/customers.html')) return 'Loading Customers...';
        if (path.includes('/payment.html')) return 'Loading Payments...';
        if (path.includes('/roles.html')) return 'Loading Roles...';
        if (path.includes('/audit-trails.html')) return 'Loading Audit Trails...';
        if (path.includes('/faqs.html')) return 'Loading FAQs...';
        if (path.includes('/landing-page.html')) return 'Loading Landing Page...';
        return 'Loading...';
    }

    function buildOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;
        
        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('role', 'status');
        
        const loadingText = getPageTitle();
        
        overlay.innerHTML = `
            <div class="text-center">
                <div class="betcha-spinner"></div>
                <p class="betcha-loading-text">
                    <span>${loadingText}</span>
                    <span class="betcha-loading-dots"></span>
                </p>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    function showLoader() {
        try {
            injectStylesOnce();
            buildOverlay();
            lastShowAt = Date.now();
        } catch (e) {
            
            console.warn('Betcha Loader: Could not show loader', e);
        }
    }

    function hideLoader() {
        const el = document.getElementById(OVERLAY_ID);
        if (!el) return;
        
        const elapsed = Date.now() - lastShowAt;
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
        
        if (remaining === 0) {
            el.remove();
        } else {
            setTimeout(() => { 
                const loader = document.getElementById(OVERLAY_ID); 
                if (loader) loader.remove(); 
            }, remaining);
        }
    }

    window.BetchaLoader = { 
        show: showLoader, 
        hide: hideLoader 
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showLoader);
    } else {
        showLoader();
    }
    
    window.addEventListener('load', hideLoader, { once: true });
    setTimeout(hideLoader, 3000); 

    function shouldHandleLinkClick(event) {
        if (event.defaultPrevented) return false;
        if (event.button !== 0) return false; 
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
        
        const anchor = event.target?.closest?.('a[href]');
        if (!anchor) return false;
        
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return false;
        if (anchor.hasAttribute('download')) return false;
        if (anchor.target && anchor.target !== '_self') return false;
        
        try {
            const url = new URL(href, window.location.href);
            
            if (url.origin !== window.location.origin) return false;
            return true;
        } catch (_) { 
            return false; 
        }
    }

    document.addEventListener('click', (e) => {
        if (shouldHandleLinkClick(e)) {
            
        }
    }, true);

    window.addEventListener('beforeunload', () => {
        try { 
            
        } catch (_) { 
             
        }
    });
})();
