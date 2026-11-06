import fs from 'fs';
import path from 'path';

const srcDir = 'C:/Users/Asus/Downloads/ezgif-59addb5460e91fcb-jpg';
const destDir = 'c:/Users/Asus/OneDrive/Desktop/CCI Web/public/frames2';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jpg'));
console.log(`Copying ${files.length} frames from ${srcDir} to ${destDir}...`);

let count = 0;
for (const f of files) {
  fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
  count++;
}

console.log(`Successfully copied ${count} frames to public/frames2`);
