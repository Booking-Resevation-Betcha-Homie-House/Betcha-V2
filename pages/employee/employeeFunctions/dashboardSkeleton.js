
class DashboardSkeleton {
    constructor() {
        this.sidebarSkeleton = document.getElementById('sidebar-skeleton');
        this.mainContentSkeleton = document.getElementById('main-content-skeleton');
        this.realSidebar = document.getElementById('sidebar');
        this.realContent = document.getElementById('PSR-summary');
        this.gridContainer = document.querySelector('.my-grid');
        
        this.isSkeletonVisible = false;
        this.init();
    }

    init() {

    }

    showSkeleton() {
        if (this.isSkeletonVisible) return;
        
        this.isSkeletonVisible = true;

        if (this.realSidebar) {
            this.realSidebar.classList.add('hidden');
        }
        
        if (this.realContent) {
            this.realContent.classList.add('hidden');
        }
        
        if (this.gridContainer) {
            this.gridContainer.classList.add('hidden');
        }

        if (this.sidebarSkeleton) {
            this.sidebarSkeleton.classList.remove('hidden');
        }
        
        if (this.mainContentSkeleton) {
            this.mainContentSkeleton.classList.remove('hidden');
        }
        
        console.log('Dashboard skeleton loading activated');
    }

    hideSkeleton() {
        if (!this.isSkeletonVisible) return;
        
        this.isSkeletonVisible = false;

        if (this.sidebarSkeleton) {
            this.sidebarSkeleton.classList.add('hidden');
        }
        
        if (this.mainContentSkeleton) {
            this.mainContentSkeleton.classList.add('hidden');
        }

        if (this.realSidebar) {
            this.realSidebar.classList.remove('hidden');
        }
        
        if (this.realContent) {
            this.realContent.classList.remove('hidden');
        }
        
        if (this.gridContainer) {
            this.gridContainer.classList.remove('hidden');
        }
        
        console.log('Dashboard skeleton loading deactivated');
    }

    toggleSkeleton() {
        if (this.isSkeletonVisible) {
            this.hideSkeleton();
        } else {
            this.showSkeleton();
        }
    }

    simulateLoading(duration = 3000) {
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
    window.dashboardSkeleton = new DashboardSkeleton();
});

if (typeof window !== 'undefined') {
    window.DashboardSkeleton = DashboardSkeleton;
}
