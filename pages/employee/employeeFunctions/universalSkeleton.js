
class EmployeeSkeleton {
    constructor() {
        this.realSidebar = document.getElementById('sidebar');
        this.realContent = document.querySelector('main');
        this.originalSidebarContent = null;
        this.mainContentSkeleton = null;
        
        this.isSkeletonVisible = false;
        this.init();
    }

    init() {
        this.createSkeletonElements();
        console.log('Employee skeleton system initialized');
    }

    createSkeletonElements() {
        this.storeSidebarContent();
        this.createMainContentSkeleton();
    }

    storeSidebarContent() {
        if (this.realSidebar) {
            this.originalSidebarContent = this.realSidebar.innerHTML;
        }
    }

    getSidebarSkeletonContent() {
        return `
            <!-- Logo skeleton -->
            <div class="h-[30px] bg-neutral-200 rounded animate-pulse mb-10"></div>
            
            <!-- Dashboard item skeleton -->
            <div class="bg-neutral-200 rounded-xl p-3 mb-4 animate-pulse">
                <div class="flex gap-3 items-center">
                    <div class="h-5 w-5 bg-neutral-300 rounded"></div>
                    <div class="h-4 bg-neutral-300 rounded w-20"></div>
                </div>
            </div>
            
            <!-- Divider skeleton -->
            <div class="h-px bg-neutral-200 my-4"></div>
            
            <!-- Management text skeleton -->
            <div class="h-4 bg-neutral-200 rounded w-24 mb-3"></div>
            
            <!-- Menu items skeleton -->
            <div class="space-y-3">
                <div class="flex gap-3 items-center p-3">
                    <div class="h-5 w-5 bg-neutral-200 rounded animate-pulse"></div>
                    <div class="h-4 bg-neutral-200 rounded w-40 animate-pulse"></div>
                </div>
                <div class="flex gap-3 items-center p-3">
                    <div class="h-5 w-5 bg-neutral-200 rounded animate-pulse"></div>
                    <div class="h-4 bg-neutral-200 rounded w-24 animate-pulse"></div>
                </div>
                <div class="flex gap-3 items-center p-3">
                    <div class="h-5 w-5 bg-neutral-200 rounded animate-pulse"></div>
                    <div class="h-4 bg-neutral-200 rounded w-28 animate-pulse"></div>
                </div>
                <div class="flex gap-3 items-center p-3">
                    <div class="h-5 w-5 bg-neutral-200 rounded animate-pulse"></div>
                    <div class="h-4 bg-neutral-200 rounded w-36 animate-pulse"></div>
                </div>
            </div>
        `;
    }

    createMainContentSkeleton() {
        const mainContentSkeleton = document.createElement('div');
        mainContentSkeleton.id = 'main-content-skeleton';
        mainContentSkeleton.className = 'w-full p-5 md:p-10 overflow-auto h-full hidden';
        mainContentSkeleton.style.opacity = '0';
        
        mainContentSkeleton.innerHTML = `
            <!-- Generic Content Cards Skeleton -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div class="rounded-2xl p-6 bg-white shadow-md animate-pulse">
                    <div class="h-4 bg-neutral-200 rounded w-16 mb-2"></div>
                    <div class="h-8 bg-neutral-200 rounded w-24 mb-2"></div>
                    <div class="h-3 bg-neutral-200 rounded w-20"></div>
                </div>
                <div class="rounded-2xl p-6 bg-white shadow-md animate-pulse">
                    <div class="h-4 bg-neutral-200 rounded w-20 mb-2"></div>
                    <div class="h-8 bg-neutral-200 rounded w-28 mb-2"></div>
                    <div class="h-3 bg-neutral-200 rounded w-24"></div>
                </div>
                <div class="rounded-2xl p-6 bg-white shadow-md animate-pulse">
                    <div class="h-4 bg-neutral-200 rounded w-18 mb-2"></div>
                    <div class="h-8 bg-neutral-200 rounded w-24 mb-2"></div>
                    <div class="h-3 bg-neutral-200 rounded w-16"></div>
                </div>
            </div>
                </div>
            </div>

            <!-- Main Content Card Skeleton -->
            <div class="bg-white rounded-2xl shadow-md p-6 w-full mb-5 animate-pulse">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-5 gap-4">
                    <div class="h-8 bg-neutral-200 rounded w-48"></div>
                    <div class="h-8 bg-neutral-200 rounded w-24"></div>
                </div>
                
                <!-- Content rows -->
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-5 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-12"></div>
                            <div class="h-4 bg-neutral-200 rounded w-16"></div>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-8"></div>
                            <div class="h-4 bg-neutral-200 rounded w-20"></div>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-16"></div>
                            <div class="h-4 bg-neutral-200 rounded w-24"></div>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-20"></div>
                            <div class="h-4 bg-neutral-200 rounded w-24"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-5 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-12"></div>
                            <div class="h-4 bg-neutral-200 rounded w-16"></div>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-8"></div>
                            <div class="h-4 bg-neutral-200 rounded w-20"></div>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-16"></div>
                            <div class="h-4 bg-neutral-200 rounded w-24"></div>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-20"></div>
                            <div class="h-4 bg-neutral-200 rounded w-24"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-5 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-12"></div>
                            <div class="h-4 bg-neutral-200 rounded w-16"></div>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-8"></div>
                            <div class="h-4 bg-neutral-200 rounded w-20"></div>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-16"></div>
                            <div class="h-4 bg-neutral-200 rounded w-24"></div>
                        </div>
                        <div class="flex flex-col space-y-1">
                            <div class="h-3 bg-neutral-200 rounded w-20"></div>
                            <div class="h-4 bg-neutral-200 rounded w-24"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Secondary Content Card Skeleton -->
            <div class="bg-white rounded-2xl shadow-md p-6 w-full h-fit animate-pulse">
                <div class="h-6 bg-neutral-200 rounded w-32 mb-4"></div>
                <div class="space-y-3">
                    <div class="flex items-center justify-between bg-neutral-50 p-4 border border-neutral-200 rounded-xl">
                        <div class="flex flex-col space-y-2">
                            <div class="h-3 bg-neutral-200 rounded w-8"></div>
                            <div class="h-4 bg-neutral-200 rounded w-20"></div>
                            <div class="h-3 bg-neutral-200 rounded w-32"></div>
                        </div>
                        <div class="w-3 h-3 bg-neutral-200 rounded"></div>
                    </div>
                    <div class="flex items-center justify-between bg-neutral-50 p-4 border border-neutral-200 rounded-xl">
                        <div class="flex flex-col space-y-2">
                            <div class="h-3 bg-neutral-200 rounded w-8"></div>
                            <div class="h-4 bg-neutral-200 rounded w-20"></div>
                            <div class="h-3 bg-neutral-200 rounded w-32"></div>
                        </div>
                        <div class="w-3 h-3 bg-neutral-200 rounded"></div>
                    </div>
                    <div class="flex items-center justify-between bg-neutral-50 p-4 border border-neutral-200 rounded-xl">
                        <div class="flex flex-col space-y-2">
                            <div class="h-3 bg-neutral-200 rounded w-8"></div>
                            <div class="h-4 bg-neutral-200 rounded w-20"></div>
                            <div class="h-3 bg-neutral-200 rounded w-32"></div>
                        </div>
                        <div class="w-3 h-3 bg-neutral-200 rounded"></div>
                    </div>
                </div>
            </div>
        `;

        if (this.realContent && this.realContent.parentNode) {
            this.realContent.parentNode.insertBefore(mainContentSkeleton, this.realContent);
            this.mainContentSkeleton = mainContentSkeleton;
        }
    }

    showSkeleton() {
        if (this.isSkeletonVisible) return;
        
        this.isSkeletonVisible = true;

        if (this.realSidebar) {
            this.realSidebar.style.transition = 'opacity 0.2s ease-in-out';
            this.realSidebar.style.opacity = '0';
            
            setTimeout(() => {
                this.realSidebar.innerHTML = this.getSidebarSkeletonContent();
                this.realSidebar.style.opacity = '1';
            }, 200);
        }

        if (this.realContent) {
            this.realContent.style.transition = 'opacity 0.2s ease-in-out';
            this.realContent.style.opacity = '0';
            setTimeout(() => {
                this.realContent.classList.add('hidden');
            }, 200);
        }

        if (this.mainContentSkeleton) {
            this.mainContentSkeleton.classList.remove('hidden');
            this.mainContentSkeleton.style.opacity = '0';
            setTimeout(() => {
                this.mainContentSkeleton.style.transition = 'opacity 0.3s ease-in-out';
                this.mainContentSkeleton.style.opacity = '1';
            }, 250);
        }
        
        console.log('Employee skeleton loading activated');
    }

    hideSkeleton() {
        if (!this.isSkeletonVisible) return;
        
        this.isSkeletonVisible = false;

        if (this.mainContentSkeleton) {
            this.mainContentSkeleton.style.transition = 'opacity 0.3s ease-in-out';
            this.mainContentSkeleton.style.opacity = '0';
            setTimeout(() => {
                this.mainContentSkeleton.classList.add('hidden');
            }, 300);
        }

        setTimeout(() => {
            if (this.realSidebar && this.originalSidebarContent) {
                this.realSidebar.style.transition = 'opacity 0.2s ease-in-out';
                this.realSidebar.style.opacity = '0';
                
                setTimeout(() => {
                    this.realSidebar.innerHTML = this.originalSidebarContent;
                    this.realSidebar.style.opacity = '1';

                    setTimeout(() => {
                        this.applyPageSpecificFiltering();
                    }, 100);
                }, 100);
            }
            
            if (this.realContent) {
                this.realContent.classList.remove('hidden');
                this.realContent.style.opacity = '0';
                setTimeout(() => {
                    this.realContent.style.transition = 'opacity 0.3s ease-in-out';
                    this.realContent.style.opacity = '1';
                }, 200);
            }
        }, 150);
        
        console.log('Employee skeleton loading deactivated');
    }

    applyPageSpecificFiltering() {

        const roleID = localStorage.getItem('roleID');
        if (!roleID) return;

        this.fetchRolePrivileges(roleID).then(roleData => {
            if (roleData && roleData.privileges) {
                const privileges = roleData.privileges;

                if (typeof window.filterDashboardSections === 'function') {
                    console.log('Universal Skeleton - Applying dashboard filtering');
                    window.filterDashboardSections(privileges);
                }

                else if (typeof window.filterSidebarByPrivileges === 'function') {
                    console.log('Universal Skeleton - Applying sidebar filtering for employee page');
                    window.filterSidebarByPrivileges(privileges);
                }

                else if (typeof window.checkAndApplyPrivileges === 'function') {
                    console.log('Universal Skeleton - Applying general privilege filtering');
                    window.checkAndApplyPrivileges();
                }

                else {
                    console.log('Universal Skeleton - Applying fallback sidebar filtering');
                    this.applyBasicSidebarFiltering(privileges);
                }
            }
        }).catch(error => {
            console.error('Universal Skeleton - Error applying privilege filtering:', error);
        });
    }

    applyBasicSidebarFiltering(privileges) {
        const sidebarPrivilegeMap = {
            '#sidebar-psr': ['PSR'],
            '#sidebar-tk': ['TK'], 
            '#sidebar-pm': ['PM'],
            '#sidebar-ts': ['TS']
        };
        
        Object.keys(sidebarPrivilegeMap).forEach(sidebarSelector => {
            const sidebarItem = document.querySelector(sidebarSelector);
            if (!sidebarItem) return;
            
            const requiredPrivileges = sidebarPrivilegeMap[sidebarSelector];
            const hasAccess = privileges.some(privilege => requiredPrivileges.includes(privilege));
            
            if (!hasAccess) {
                sidebarItem.style.display = 'none';
                console.log(`Universal Skeleton - Hiding sidebar item: ${sidebarSelector}`);
            } else {
                sidebarItem.style.display = 'flex';
                console.log(`Universal Skeleton - Showing sidebar item: ${sidebarSelector}`);
            }
        });

        const sidebarNav = document.querySelector('#sidebar nav');
        if (sidebarNav) {
            sidebarNav.style.transition = 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out';
            sidebarNav.style.visibility = 'visible';
            sidebarNav.style.opacity = '1';
        }
    }

    async fetchRolePrivileges(roleID) {
        try {
            const response = await fetch(`https://betcha-api.onrender.com/roles/display/${roleID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error('Failed to fetch role privileges:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error fetching role privileges:', error);
            return null;
        }
    }

    toggleSkeleton() {
        if (this.isSkeletonVisible) {
            this.hideSkeleton();
        } else {
            this.showSkeleton();
        }
    }

    simulateLoading(duration = 2000) {
        this.showSkeleton();
        
        setTimeout(() => {
            this.hideSkeleton();
        }, duration);
        
        console.log(`Simulating loading for ${duration}ms`);
    }

    onContentLoaded() {
        this.hideSkeleton();
    }

    onContentLoading() {
        this.showSkeleton();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.employeeSkeleton = new EmployeeSkeleton();

    window.employeeSkeleton.showSkeleton();
    
    setTimeout(() => {
        window.employeeSkeleton.hideSkeleton();
    }, 1500);
});

window.showEmployeeSkeleton = function() {
    if (window.employeeSkeleton) {
        window.employeeSkeleton.showSkeleton();
    }
};

window.hideEmployeeSkeleton = function() {
    if (window.employeeSkeleton) {
        window.employeeSkeleton.hideSkeleton();
    }
};

window.simulateEmployeeLoading = function(duration = 2000) {
    if (window.employeeSkeleton) {
        window.employeeSkeleton.simulateLoading(duration);
    }
};

if (typeof window !== 'undefined') {
    window.EmployeeSkeleton = EmployeeSkeleton;
}
