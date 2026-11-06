import fs from 'fs';
import path from 'path';

const sourceDir = 'C:\\Users\\Asus\\.gemini\\antigravity-ide\\brain\\8ef62a80-6d3d-4d75-8708-23be8fea751b\\.user_uploaded';
const targetDir = 'public/images/animation';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = [
  { src: 'media_1792008316223.jpg', dst: 'frame-1.jpg' },
  { src: 'media_1792008316289.jpg', dst: 'frame-2.jpg' },
  { src: 'media_1792008316301.jpg', dst: 'frame-3.jpg' },
  { src: 'media_1792008316387.jpg', dst: 'frame-4.jpg' },
  { src: 'media_1792008316400.jpg', dst: 'frame-5.jpg' }
];

for (const f of files) {
  const s = path.join(sourceDir, f.src);
  const d = path.join(targetDir, f.dst);
  if (fs.existsSync(s)) {
    fs.copyFileSync(s, d);
    console.log(`Copied ${f.src} -> ${f.dst}`);
  } else {
    console.log(`File not found: ${s}`);
  }
}
console.log('Finished copying animation frames!');
