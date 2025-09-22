# PowerShell script to fix notification dropdown tabs across all admin pages

$files = @(
    "pages\admin\audit-trails.html",
    "pages\admin\employee-add.html", 
    "pages\admin\employee-edit.html",
    "pages\admin\employee-view.html",
    "pages\admin\faqs.html",
    "pages\admin\landing-page.html",
    "pages\admin\payment-add.html",
    "pages\admin\payment-edit.html", 
    "pages\admin\payment.html",
    "pages\admin\property-add.html",
    "pages\admin\property-edit.html",
    "pages\admin\property-view.html",
    "pages\admin\roles.html"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file"
        
        # Read file content
        $content = Get-Content $file -Raw
        
        # Fix desktop notification dropdown
        $content = $content -replace 'data-tab-group id="notificationDropdown"', 'data-tab-group="notification" id="notificationDropdown"'
        
        # Fix mobile notification dropdown  
        $content = $content -replace 'data-tab-group id="notificationDropdown" class=" p-5 "', 'data-tab-group="notification" id="notificationDropdownMobile" class=" p-5 "'
        
        # Remove onclick attributes from notification buttons
        $content = $content -replace 'onclick="setActiveTab\(0\)"', ''
        $content = $content -replace 'onclick="setActiveTab\(1\)"', ''
        
        # Change tab-btn to notif-tab-btn for notification buttons (only when near "Notification" or "Cancellations")
        $content = $content -replace 'class="tab-btn text-sm !px-4 !py-2 rounded-full flex-1\s*hover:bg-primary/10 group active:scale-95\s*transition-all duration-200 bg-white text-primary font-semibold shadow"\s*>\s*<span class="text-primary text-sm group-hover:text-primary ">Notification</span>', 'class="notif-tab-btn text-sm !px-4 !py-2 rounded-full flex-1 hover:bg-primary/10 group active:scale-95 transition-all duration-200 bg-white text-primary font-semibold shadow"> <span class="text-primary text-sm group-hover:text-primary ">Notification</span>'
        
        $content = $content -replace 'class="tab-btn text-sm !px-4 !py-2 rounded-full flex-1\s*hover:bg-primary/10 group active:scale-95\s*transition-all duration-200"\s*>\s*<span class="text-neutral-500 text-sm group-hover:text-primary">Cancellations</span>', 'class="notif-tab-btn text-sm !px-4 !py-2 rounded-full flex-1 hover:bg-primary/10 group active:scale-95 transition-all duration-200"> <span class="text-neutral-500 text-sm group-hover:text-primary">Cancellations</span>'
        
        # Mobile versions
        $content = $content -replace 'class="tab-btn text-sm !px-2 !py-1 rounded-full flex-1\s*hover:bg-primary/10 group active:scale-95\s*transition-all duration-200 bg-white text-primary font-semibold shadow"\s*>\s*<span class="text-primary text-sm group-hover:text-primary ">Notification</span>', 'class="notif-tab-btn text-sm !px-2 !py-1 rounded-full flex-1 hover:bg-primary/10 group active:scale-95 transition-all duration-200 bg-white text-primary font-semibold shadow"> <span class="text-primary text-sm group-hover:text-primary ">Notification</span>'
        
        $content = $content -replace 'class="tab-btn text-sm !px-2 !py-1 rounded-full flex-1\s*hover:bg-primary/10 group active:scale-95\s*transition-all duration-200"\s*>\s*<span class="text-neutral-500 text-sm group-hover:text-primary">Cancellations</span>', 'class="notif-tab-btn text-sm !px-2 !py-1 rounded-full flex-1 hover:bg-primary/10 group active:scale-95 transition-all duration-200"> <span class="text-neutral-500 text-sm group-hover:text-primary">Cancellations</span>'
        
        # Write back to file
        Set-Content $file $content -NoNewline
        
        Write-Host "✓ Fixed: $file"
    } else {
        Write-Host "✗ File not found: $file"
    }
}

Write-Host "`nCompleted fixing all notification dropdowns!"
