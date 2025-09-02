// Dashboard Skeleton Loading Controller
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
        // Initialization complete - test controls removed for production
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
        
        if (this.gridContainer) {
            this.gridContainer.classList.add('hidden');
        }
        
        // Show skeleton
        if (this.sidebarSkeleton) {
            this.sidebarSkeleton.classList.remove('hidden');
        }
        
        if (this.mainContentSkeleton) {
            this.mainContentSkeleton.classList.remove('hidden');
        }
        
        console.log('Dashboard skeleton loading activated');
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
        
        if (this.gridContainer) {
            this.gridContainer.classList.remove('hidden');
        }
        
        console.log('Dashboard skeleton loading deactivated');
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
    simulateLoading(duration = 3000) {
        this.showSkeleton();
        
        setTimeout(() => {
            this.hideSkeleton();
        }, duration);
        
        console.log(`Simulating loading for ${duration}ms`);
    }

    // Auto-hide skeleton after content loads (integration with existing code)
    onContentLoaded() {
        this.hideSkeleton();
    }

    // Show skeleton before content loads (integration with existing code)
    onContentLoading() {
        this.showSkeleton();
    }
}

// Initialize dashboard skeleton when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardSkeleton = new DashboardSkeleton();
});

// Export for module usage (if needed)
if (typeof window !== 'undefined') {
    window.DashboardSkeleton = DashboardSkeleton;
}
