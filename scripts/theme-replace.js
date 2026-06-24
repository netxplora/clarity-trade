const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace text-gray-xxx and dark:text-gray-xxx
    content = content.replace(/text-gray-[1-4]00/g, 'text-muted-foreground');
    content = content.replace(/text-gray-[5-6]00/g, 'text-muted-foreground');
    content = content.replace(/text-gray-[7-9]00/g, 'text-foreground');
    content = content.replace(/dark:text-gray-[1-4]00/g, ''); // Let theme handle it
    content = content.replace(/dark:text-gray-[5-9]00/g, ''); 
    content = content.replace(/dark:text-white/g, ''); 
    content = content.replace(/text-white/g, 'text-primary-foreground'); // Be careful, some might be intentional
    
    // Specifically target combinations like "bg-white dark:bg-gray-800" or similar
    content = content.replace(/bg-white\s+dark:bg-gray-[89]00/g, 'bg-card');
    content = content.replace(/bg-gray-50\s+dark:bg-gray-900/g, 'bg-muted/50');
    content = content.replace(/bg-gray-100\s+dark:bg-gray-800/g, 'bg-muted');
    content = content.replace(/bg-white\s+dark:bg-gray-[9]00/g, 'bg-background');
    
    // Replace remaining hardcoded colors
    content = content.replace(/bg-white/g, 'bg-background'); // This might be risky, but we'll try to refine
    
    // We will do more specific replacements
    
    if (content !== original) {
        // Clean up double spaces caused by removing dark: classes
        content = content.replace(/\s+/g, ' ');
        content = content.replace(/ \)/g, ')');
        content = content.replace(/ "/g, '"');
        content = content.replace(/" /g, '"');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
    }
}

['src/pages', 'src/components'].forEach(dir => {
    walkDir(path.join(__dirname, '..', dir), processFile);
});
