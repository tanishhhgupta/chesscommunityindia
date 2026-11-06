import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const zipPath = 'C:\\Users\\Asus\\Downloads\\ezgif-350c09898f5774ad-jpg.zip';
const targetDir = 'public/animation_sequence';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// In PowerShell, we can use Expand-Archive
const psCmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetDir}' -Force"`;
console.log('Extracting zip...');
try {
  execSync(psCmd);
  console.log('Extraction complete!');
  const files = fs.readdirSync(targetDir);
  console.log(`Total extracted files: ${files.length}`);
  console.log('Sample files:', files.slice(0, 10));
} catch(err) {
  console.error('Error extracting:', err);
}
