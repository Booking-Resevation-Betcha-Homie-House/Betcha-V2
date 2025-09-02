// Universal Employee Skeleton Loading Controller
class EmployeeSkeleton {
    constructor() {
        this.sidebarSkeleton = null;
        this.mainContentSkeleton = null;
        this.realSidebar = document.getElementById('sidebar');
        this.realContent = document.querySelector('main');
        
        this.isSkeletonVisible = false;
        this.init();
    }

    init() {
        this.createSkeletonElements();
        console.log('Employee skeleton system initialized');
    }

    // Create generic skeleton elements
    createSkeletonElements() {
        this.createSidebarSkeleton();
        this.createMainContentSkeleton();
    }

    // Create sidebar skeleton
    createSidebarSkeleton() {
        const sidebarSkeleton = document.createElement('aside');
        sidebarSkeleton.id = 'sidebar-skeleton';
        sidebarSkeleton.className = `w-64 bg-white shadow-md p-6 overflow-x-auto
            transition-transform duration-300 ease-in-out transform 
            lg:translate-x-0 -translate-x-full fixed lg:static z-50 h-full hidden`;
        
        sidebarSkeleton.innerHTML = `
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
                    <div class="h-4 bg-neutral-200 rounded w-32 animate-pulse"></div>
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
        
        // Insert before the real sidebar
        if (this.realSidebar && this.realSidebar.parentNode) {
            this.realSidebar.parentNode.insertBefore(sidebarSkeleton, this.realSidebar);
            this.sidebarSkeleton = sidebarSkeleton;
        }
    }

    // Create main content skeleton
    createMainContentSkeleton() {
        const mainContentSkeleton = document.createElement('div');
        mainContentSkeleton.id = 'main-content-skeleton';
        mainContentSkeleton.className = 'w-full p-5 md:p-10 overflow-auto h-full hidden';
        
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
        
        // Insert before the real main content
        if (this.realContent && this.realContent.parentNode) {
            this.realContent.parentNode.insertBefore(mainContentSkeleton, this.realContent);
            this.mainContentSkeleton = mainContentSkeleton;
        }
    }

    // Show skeleton loading
    showSkeleton() {
        if (this.isSkeletonVisible) return;
        
        this.isSkeletonVisible = true;
        
        // Hide real content
        if (this.realSidebar) {
            this.realSidebar.classList.add('hidden');
        }
        
        if (this.realContent) {
            this.realContent.classList.add('hidden');
        }
        
        // Show skeleton
        if (this.sidebarSkeleton) {
            this.sidebarSkeleton.classList.remove('hidden');
        }
        
        if (this.mainContentSkeleton) {
            this.mainContentSkeleton.classList.remove('hidden');
        }
        
        console.log('Employee skeleton loading activated');
    }

    // Hide skeleton loading
    hideSkeleton() {
        if (!this.isSkeletonVisible) return;
        
        this.isSkeletonVisible = false;
        
        // Hide skeleton
        if (this.sidebarSkeleton) {
            this.sidebarSkeleton.classList.add('hidden');
        }
        
        if (this.mainContentSkeleton) {
            this.mainContentSkeleton.classList.add('hidden');
        }
        
        // Show real content
        if (this.realSidebar) {
            this.realSidebar.classList.remove('hidden');
        }
        
        if (this.realContent) {
            this.realContent.classList.remove('hidden');
        }
        
        console.log('Employee skeleton loading deactivated');
    }

    // Toggle skeleton (for testing)
    toggleSkeleton() {
        if (this.isSkeletonVisible) {
            this.hideSkeleton();
        } else {
            this.showSkeleton();
        }
    }

    // Simulate loading process
    simulateLoading(duration = 2000) {
        this.showSkeleton();
        
        setTimeout(() => {
            this.hideSkeleton();
        }, duration);
        
        console.log(`Simulating loading for ${duration}ms`);
    }

    // Auto-hide skeleton after content loads
    onContentLoaded() {
        this.hideSkeleton();
    }

    // Show skeleton before content loads
    onContentLoading() {
        this.showSkeleton();
    }
}

// Initialize employee skeleton when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.employeeSkeleton = new EmployeeSkeleton();
    
    // Show skeleton initially and hide after a short delay
    window.employeeSkeleton.showSkeleton();
    
    setTimeout(() => {
        window.employeeSkeleton.hideSkeleton();
    }, 1500);
});

// Export helper functions to global scope
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

// Export for module usage (if needed)
if (typeof window !== 'undefined') {
    window.EmployeeSkeleton = EmployeeSkeleton;
}
