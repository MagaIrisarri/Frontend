const fs = require('fs');
const path = require('path');

function removeBackdropBlur(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('backdrop-blur')) {
        let newContent = content.replace(/backdrop-blur-\w+/g, '').replace(/backdrop-blur/g, '');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Removed backdrop-blur from', filePath);
        }
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            removeBackdropBlur(fullPath);
        }
    }
}

walkDir('./src');
