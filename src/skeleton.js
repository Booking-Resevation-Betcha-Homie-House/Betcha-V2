

(function () {
	const STYLE_ID = 'betcha-skeleton-style';
	const OVERLAY_ID = 'betcha-skeleton-overlay';
    const MIN_VISIBLE_MS = 800; 
    let lastShowAt = 0;

	function injectStylesOnce() {
		if (document.getElementById(STYLE_ID)) return;
		const style = document.createElement('style');
		style.id = STYLE_ID;
		style.textContent = `
			@keyframes betcha-shimmer { 0% { background-position: -200px 0; } 100% { background-position: calc(200px + 100%) 0; } }
			.betcha-skeleton { position: relative; overflow: hidden; background: #f3f4f6; }
			.betcha-skeleton::after { content: ""; position: absolute; inset: 0; background-image: linear-gradient(90deg, rgba(243,244,246,0) 0%, rgba(229,231,235,0.8) 50%, rgba(243,244,246,0) 100%); background-size: 200px 100%; animation: betcha-shimmer 1.2s infinite; }
			#${OVERLAY_ID} { position: fixed; inset: 0; z-index: 60; background: white; }
			#${OVERLAY_ID} .container { max-width: 1024px; margin: 0 auto; padding: 24px; }
			#${OVERLAY_ID} .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
			@media (min-width: 768px) { #${OVERLAY_ID} .grid-2 { grid-template-columns: 1fr 1fr; } }
			.betcha-skel-card { height: 120px; border-radius: 16px; }
			.betcha-skel-line { height: 14px; border-radius: 8px; }
			.betcha-skel-line.lg { height: 20px; }
			.betcha-skel-avatar { width: 96px; height: 96px; border-radius: 9999px; }
		`;
		document.head.appendChild(style);
	}

	function getPageKey() {
		const path = (location.pathname || '').toLowerCase();
		if (path.endsWith('/employee/dashboard.html')) return 'dashboard';
		if (path.endsWith('/employee/pm.html')) return 'pm';
		if (path.endsWith('/employee/psr.html')) return 'psr';
		if (path.endsWith('/employee/ts.html')) return 'ts';
		if (path.endsWith('/employee/tk.html')) return 'tk';
		if (path.endsWith('/employee/profile.html')) return 'profile';
		return 'generic';
	}

	function buildOverlay(pageKey) {
		if (document.getElementById(OVERLAY_ID)) return;
		const overlay = document.createElement('div');
		overlay.id = OVERLAY_ID;
		overlay.setAttribute('aria-hidden', 'true');
		const tpl = getTemplate(pageKey);
		overlay.innerHTML = tpl;
		document.body.appendChild(overlay);
	}

	function getTemplate(pageKey) {
		const header = `
			<div class="container">
				<div class="grid" style="margin-bottom:16px;">
					<div class="betcha-skeleton betcha-skel-line lg" style="width: 160px;"></div>
				</div>
		`;
		const footer = `</div>`;

		if (pageKey === 'profile') {
			return `
			${header}
			<div class="grid">
				<div class="betcha-skeleton betcha-skel-avatar" style="margin: 24px auto 8px;"></div>
				<div class="betcha-skeleton betcha-skel-line lg" style="width: 220px; margin: 0 auto 8px;"></div>
				<div class="betcha-skeleton betcha-skel-line" style="width: 120px; margin: 0 auto 24px;"></div>
			</div>
			<div class="grid">
				<div class="betcha-skeleton betcha-skel-line" style="height: 1px; width: 100%; border-radius: 0;"></div>
			</div>
			<div class="grid">
				<div class="betcha-skeleton betcha-skel-line" style="width: 60%; height: 18px;"></div>
				<div class="betcha-skeleton betcha-skel-line" style="width: 40%; height: 18px;"></div>
				<div class="betcha-skeleton betcha-skel-line" style="width: 55%; height: 18px;"></div>
				<div class="betcha-skeleton betcha-skel-line" style="width: 45%; height: 18px;"></div>
			</div>
			${footer}
			`;
		}

		if (pageKey === 'dashboard') {
			return `
			${header}
			<div class="grid grid-2" style="margin-bottom:16px;">
				<div class="betcha-skeleton betcha-skel-card"></div>
				<div class="betcha-skeleton betcha-skel-card"></div>
				<div class="betcha-skeleton betcha-skel-card"></div>
			</div>
			<div class="grid grid-2">
				<div class="betcha-skeleton betcha-skel-card" style="height: 220px;"></div>
				<div class="betcha-skeleton betcha-skel-card" style="height: 220px;"></div>
			</div>
			${footer}
			`;
		}

		if (pageKey === 'pm') {
			return `
			${header}
			<div class="grid grid-2" style="align-items:start;">
				<div>
					<div class="betcha-skeleton betcha-skel-line lg" style="width: 200px; margin: 0 0 12px 0;"></div>
					<div class="betcha-skeleton betcha-skel-card" style="height: 260px;"></div>
				</div>
				<div>
					<div class="betcha-skeleton betcha-skel-line lg" style="width: 180px; margin: 0 0 12px 0;"></div>
					<div class="betcha-skeleton betcha-skel-card" style="height: 260px;"></div>
				</div>
			</div>
			${footer}
			`;
		}

		if (pageKey === 'psr') {
			return `
			${header}
			<div class="grid grid-2" style="margin-bottom:16px;">
				<div class="betcha-skeleton betcha-skel-card"></div>
				<div class="betcha-skeleton betcha-skel-card"></div>
			</div>
			<div class="grid">
				<div class="betcha-skeleton betcha-skel-card" style="height: 280px;"></div>
			</div>
			${footer}
			`;
		}

		if (pageKey === 'ts') {
			return `
			${header}
			<div class="grid">
				<div class="betcha-skeleton betcha-skel-card" style="height: 56px;"></div>
				<div class="betcha-skeleton betcha-skel-card" style="height: 56px;"></div>
				<div class="betcha-skeleton betcha-skel-card" style="height: 56px;"></div>
				<div class="betcha-skeleton betcha-skel-card" style="height: 56px;"></div>
			</div>
			${footer}
			`;
		}

		if (pageKey === 'tk') {
			return `
			${header}
			<div class="grid">
				<div class="betcha-skeleton betcha-skel-card" style="height: 72px;"></div>
				<div class="betcha-skeleton betcha-skel-card" style="height: 72px;"></div>
				<div class="betcha-skeleton betcha-skel-card" style="height: 72px;"></div>
			</div>
			${footer}
			`;
		}

		return `
			${header}
			<div class="grid grid-2">
				<div class="betcha-skeleton betcha-skel-card"></div>
				<div class="betcha-skeleton betcha-skel-card"></div>
			</div>
			${footer}
		`;
	}

	function showSkeleton() {
		try {
			injectStylesOnce();
			buildOverlay(getPageKey());
			lastShowAt = Date.now();
		} catch (e) {
			
		}
	}

	function hideSkeleton() {
		const el = document.getElementById(OVERLAY_ID);
		if (!el) return;
		const elapsed = Date.now() - lastShowAt;
		const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
		if (remaining === 0) {
			el.remove();
		} else {
			setTimeout(() => { const n = document.getElementById(OVERLAY_ID); if (n) n.remove(); }, remaining);
		}
	}

	window.BetchaSkeleton = { show: showSkeleton, hide: hideSkeleton };

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', showSkeleton);
	} else {
		showSkeleton();
	}
	window.addEventListener('load', hideSkeleton, { once: true });
	setTimeout(hideSkeleton, 2500); 

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
		} catch (_) { return false; }
	}

	document.addEventListener('click', (e) => {
		if (shouldHandleLinkClick(e)) {
			showSkeleton();
		}
	}, true);

	window.addEventListener('beforeunload', () => {
		try { showSkeleton(); } catch (_) {  }
	});
})();

