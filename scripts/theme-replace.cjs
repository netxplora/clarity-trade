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

    // We only want to replace within className="..." or similar but doing it globally with \b is safer.
    
    // Replace specific class combinations first
    content = content.replace(/\bbg-white\s+dark:bg-gray-[89]00\b/g, 'bg-card');
    content = content.replace(/\bbg-gray-50\s+dark:bg-gray-900\b/g, 'bg-muted/50');
    content = content.replace(/\bbg-gray-100\s+dark:bg-gray-800\b/g, 'bg-muted');
    
    // Grays to theme vars
    content = content.replace(/\btext-gray-[1-4]00\b/g, 'text-muted-foreground');
    content = content.replace(/\btext-gray-[5-6]00\b/g, 'text-muted-foreground');
    content = content.replace(/\btext-gray-[7-9]00\b/g, 'text-foreground');
    content = content.replace(/\btext-black\b/g, 'text-foreground');
    
    // Remove explicit dark: text colors that we just replaced
    content = content.replace(/\bdark:text-gray-[1-9]00\b/g, '');
    content = content.replace(/\bdark:text-white\b/g, ''); 
    
    // Fix backgrounds
    content = content.replace(/\bbg-white\b/g, 'bg-background');
    content = content.replace(/\bdark:bg-gray-[89]00\b/g, '');
    
    if (content !== original) {
        // Clean up double spaces within quotes
        content = content.replace(/className="([^"]*)"/g, (match, p1) => {
            let cleaned = p1.replace(/\s+/g, ' ').trim();
            return `className="${cleaned}"`;
        });
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
    }
}

['src/pages', 'src/components'].forEach(dir => {
    let target = path.join(__dirname, '..', dir);
    if (fs.existsSync(target)) {
        walkDir(target, processFile);
    }
});
