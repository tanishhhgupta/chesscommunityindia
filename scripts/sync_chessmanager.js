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
const existingIndex = path.join(publicDest, 'index.html');

console.log('[sync_chessmanager] Synchronizing standalone Chess Manager application...');

const chesspairNodeModules = path.join(chesspairDir, 'node_modules');

// If chesspair has node_modules installed, build it fresh
if (fs.existsSync(chesspairNodeModules)) {
  try {
    console.log('[sync_chessmanager] Building standalone Chess Manager application...');
    execSync('npm run build', {
      cwd: chesspairDir,
      stdio: 'inherit',
      shell: true,
    });
    console.log('[sync_chessmanager] Standalone build succeeded.');
    if (fs.existsSync(chesspairDist)) {
      fs.mkdirSync(publicDest, { recursive: true });
      fs.cpSync(chesspairDist, publicDest, { recursive: true });
      console.log(`[sync_chessmanager] Successfully synchronized ChessManager to ${publicDest}`);
    }
  } catch (err) {
    if (fs.existsSync(existingIndex)) {
      console.warn('[sync_chessmanager] Standalone build error; fallbacking to committed public/chessmanager assets.');
    } else {
      console.error('[sync_chessmanager] Error building chesspair:', err);
      process.exit(1);
    }
  }
} else if (fs.existsSync(existingIndex)) {
  console.log('[sync_chessmanager] Standalone chesspair dependencies not installed (standard for Vercel monorepo builds).');
  console.log('[sync_chessmanager] Using verified pre-built Chess Manager assets in public/chessmanager.');
} else {
  console.warn('[sync_chessmanager] No existing build found in public/chessmanager.');
}
