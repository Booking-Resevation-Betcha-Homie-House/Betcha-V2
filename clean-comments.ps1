# Clean Comments Script for Betcha-V2
# Removes HTML comments and JavaScript comments while preserving functionality

function Remove-CommentsFromFile {
    param(
        [string]$FilePath
    )
    
    Write-Host "Cleaning: $FilePath"
    
    # Read the file content
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
    
    if (-not $content) {
        Write-Host "  - Empty file, skipping"
        return
    }
    
    # Store original content for comparison
    $originalContent = $content
    
    # Remove HTML comments (<!-- ... -->)
    # Using regex that handles multi-line comments
    $content = [regex]::Replace($content, '<!--[\s\S]*?-->', '', 'Multiline')
    
    # Remove JavaScript single-line comments (//.*)
    # But be careful not to remove // in strings or URLs
    $content = [regex]::Replace($content, '(?<!:)\/\/.*$', '', 'Multiline')
    
    # Remove JavaScript multi-line comments (/* ... */)
    # But preserve /* in CSS or other contexts where needed
    $content = [regex]::Replace($content, '\/\*[\s\S]*?\*\/', '', 'Multiline')
    
    # Clean up any extra whitespace that might be left behind
    # But preserve intentional spacing and formatting
    $content = [regex]::Replace($content, '\n\s*\n\s*\n', "`n`n", 'Multiline')
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  - Cleaned successfully"
    } else {
        Write-Host "  - No comments found"
    }
}

# Process all HTML files in root directory
Write-Host "=== Cleaning HTML files in root directory ==="
Get-ChildItem -Path "." -Filter "*.html" | ForEach-Object {
    Remove-CommentsFromFile -FilePath $_.FullName
}

# Process all HTML files in pages directory
Write-Host "`n=== Cleaning HTML files in pages directory ==="
Get-ChildItem -Path "pages" -Recurse -Filter "*.html" | ForEach-Object {
    Remove-CommentsFromFile -FilePath $_.FullName
}

# Process all JavaScript files in src directory
Write-Host "`n=== Cleaning JavaScript files in src directory ==="
Get-ChildItem -Path "src" -Recurse -Filter "*.js" | ForEach-Object {
    Remove-CommentsFromFile -FilePath $_.FullName
}

Write-Host "`n=== Comment cleaning completed! ==="
