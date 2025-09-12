# Clean all remaining JavaScript comments from function directories
Write-Host "=== Cleaning JavaScript files in all Functions directories ==="

function Remove-JSComments {
    param([string]$FilePath)
    
    Write-Host "Cleaning: $FilePath"
    
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
    
    if (-not $content) {
        Write-Host "  - Empty file, skipping"
        return
    }
    
    $originalContent = $content
    
    # Remove single-line comments
    $content = [regex]::Replace($content, '^\s*//.*$', '', 'Multiline')
    $content = [regex]::Replace($content, '(?<!:)//.*$', '', 'Multiline')
    
    # Remove multi-line comments
    $content = [regex]::Replace($content, '/\*[\s\S]*?\*/', '', 'Multiline')
    
    # Clean up extra whitespace
    $content = [regex]::Replace($content, '\n\s*\n\s*\n', "`n`n", 'Multiline')
    
    if ($content -ne $originalContent) {
        Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  - Cleaned successfully"
    } else {
        Write-Host "  - No comments found"
    }
}

# Clean all JavaScript files in Functions directories
Get-ChildItem -Path "pages" -Recurse -Filter "*Functions" | Where-Object { $_.PSIsContainer } | ForEach-Object {
    Get-ChildItem -Path $_.FullName -Filter "*.js" | ForEach-Object {
        Remove-JSComments -FilePath $_.FullName
    }
}

# Also clean vite.config.js and other config files with comments
Get-ChildItem -Path "." -Filter "*.js" | ForEach-Object {
    if ($_.Name -eq "vite.config.js" -or $_.Name -eq "eslint.config.js" -or $_.Name -eq "postcss.config.js") {
        Remove-JSComments -FilePath $_.FullName
    }
}

Write-Host "`n=== All JavaScript comment cleaning completed! ==="
