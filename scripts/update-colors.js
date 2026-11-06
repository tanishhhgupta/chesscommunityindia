import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  path.join(__dirname, '../src/components/views'),
  path.join(__dirname, '../src/components/layout'),
  path.join(__dirname, '../src/components/world'),
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const fullPath = path.join(dir, file);
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content
        .split('#050809').join('#071418')
        .split('#050505').join('#071418')
        .split('#071012').join('#0B1E22')
        .split('#12191A').join('#102B30')
        .split('#101010').join('#0B1E22')
        .split('#090909').join('#0B1E22');
      fs.writeFileSync(fullPath, content);
      console.log('Updated to rich teal palette:', file);
    }
  }
}
