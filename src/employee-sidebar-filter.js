// Sidebar-only role-based filtering for employee pages
// Reads roleID from localStorage, fetches privileges, and hides sidebar items by id

(function () {
	async function fetchRolePrivileges(roleID) {
		try {
			const response = await fetch(`https://betcha-api.onrender.com/roles/display/${roleID}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) return null;
			return await response.json();
		} catch (err) {
			console.error('Sidebar filter - fetchRolePrivileges error:', err);
			return null;
		}
	}

	function filterSidebarByPrivileges(privileges) {
		if (!Array.isArray(privileges)) return;

		const sidebarPrivilegeMap = {
			'sidebar-psr': ['PSR'],
			'sidebar-tk': ['TK'],
			'sidebar-pm': ['PM'],
			'sidebar-ts': ['TS'],
			'sidebar-dashboard': ['PSR', 'PM', 'TS', 'TK'] // dashboard visible if user has any employee privilege
		};

		const sidebarNav = document.querySelector('aside#sidebar nav');
		if (sidebarNav) {
			sidebarNav.style.visibility = 'visible';
			sidebarNav.style.opacity = '1';
		}

		Object.keys(sidebarPrivilegeMap).forEach((id) => {
			const el = document.getElementById(id);
			if (!el) return;
			const required = sidebarPrivilegeMap[id];
			const hasAccess = privileges.some(p => required.includes(p));
			if (!hasAccess) {
				el.style.display = 'none';
			}
		});
	}

	async function initSidebarFilter() {
		try {
			const roleID = localStorage.getItem('roleID');
			if (!roleID) {
				console.warn('Sidebar filter - no roleID in localStorage');
				return;
			}
			const roleData = await fetchRolePrivileges(roleID);
			if (!roleData || !roleData.privileges) {
				console.warn('Sidebar filter - no privileges returned');
				return;
			}
			// Make sure DOM is fully loaded and universalSkeleton hasn't hidden the nav
			if (document.readyState !== 'complete') {
				await new Promise(resolve => window.addEventListener('load', resolve));
			}
			// Let any initial hide/show animations complete
			setTimeout(() => {
				filterSidebarByPrivileges(roleData.privileges);
			}, 100);
		} catch (err) {
			console.error('Sidebar filter - initialization error:', err);
		}
	}

	// Always wait for DOMContentLoaded before starting
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initSidebarFilter);
	} else {
		initSidebarFilter();
	}
})();


