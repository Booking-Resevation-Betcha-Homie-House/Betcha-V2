

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
			'sidebar-dashboard': ['PSR', 'PM', 'TS', 'TK'] 
		};

		Object.keys(sidebarPrivilegeMap).forEach((id) => {
			const el = document.getElementById(id);
			if (!el) return;
			const required = sidebarPrivilegeMap[id];
			const hasAccess = privileges.some(p => required.includes(p));
			el.style.display = hasAccess ? (id === 'sidebar-dashboard' ? 'flex' : 'flex') : 'none';
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
			filterSidebarByPrivileges(roleData.privileges);
		} catch (err) {
			console.error('Sidebar filter - initialization error:', err);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initSidebarFilter);
	} else {
		initSidebarFilter();
	}
})();

