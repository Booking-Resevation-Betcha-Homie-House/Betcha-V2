// Script to add page-control.js import to all HTML files in pages folder
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Page control script tag to add
const scriptTag = '    <script src="/src/page-control.js"></script>';

// Function to add script tag to HTML file if not already present
function addScriptToFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if script is already present
        if (content.includes('page-control.js')) {
            console.log(`✓ ${filePath} already has page-control.js`);
            return;
        }
        
        // Find the closing </head> tag and insert script before it
        const headCloseTag = '</head>';
        const headIndex = content.indexOf(headCloseTag);
        
        if (headIndex === -1) {
            console.log(`✗ ${filePath} does not have a closing </head> tag`);
            return;
        }
        
        // Insert script tag before closing head tag
        const newContent = content.slice(0, headIndex) + scriptTag + '\n' + content.slice(headIndex);
        
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✓ Added page-control.js to ${filePath}`);
        
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
    }
}

// Find all HTML files in pages folder
const htmlFiles = glob.sync('pages/**/*.html', { cwd: __dirname });

console.log(`Found ${htmlFiles.length} HTML files in pages folder`);
console.log('Adding page-control.js script to all files...\n');

// Process each file
htmlFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    addScriptToFile(fullPath);
});

console.log('\nScript addition completed!');
