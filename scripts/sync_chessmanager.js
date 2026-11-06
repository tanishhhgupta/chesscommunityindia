import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const chesspairDir = path.join(rootDir, 'chesspair');
const chesspairDist = path.join(chesspairDir, 'dist');
const publicDest = path.join(rootDir, 'public', 'chessmanager');

console.log('[sync_chessmanager] Building standalone Chess Manager application...');
try {
  execSync('npm run build', {
    cwd: chesspairDir,
    stdio: 'inherit',
    shell: true,
  });
  console.log('[sync_chessmanager] Standalone build succeeded.');
} catch (err) {
  console.error('[sync_chessmanager] Error building chesspair:', err);
  process.exit(1);
}

console.log('[sync_chessmanager] Copying build to public/chessmanager...');
fs.mkdirSync(publicDest, { recursive: true });
fs.cpSync(chesspairDist, publicDest, { recursive: true });
console.log(`[sync_chessmanager] Successfully synchronized ChessManager to ${publicDest}`);
