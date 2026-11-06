import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Let's inspect Downloads directory for any zip files modified recently or with sequence
const downloadsDir = 'C:\\Users\\Asus\\Downloads';
const files = fs.readdirSync(downloadsDir);
const zipFiles = files.filter(f => f.endsWith('.zip'));

console.log('Zip files in downloads:');
zipFiles.forEach(f => {
  const stat = fs.statSync(path.join(downloadsDir, f));
  console.log(`${f} | ${stat.size} bytes | ${stat.mtime}`);
});
