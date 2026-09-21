const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if(content.includes('FG_Logo_4.svg')) {
        content = content.split('FG_Logo_4.svg').join('newlogo.png');
        fs.writeFileSync(f, content, 'utf8');
        console.log(`Updated ${f}`);
    }
});
