import fs from 'fs';
import path from 'path';

const downloadsDir = 'C:/Users/Asus/Downloads';
const publicDir = 'c:/Users/Asus/OneDrive/Desktop/CCI Web/public';

// 1. Copy MP4 videos
const videoTargetDir = path.join(publicDir, 'videos');
if (!fs.existsSync(videoTargetDir)) {
  fs.mkdirSync(videoTargetDir, { recursive: true });
}

const videoMap = [
  {
    src: 'Floating_3D_chess_website_videos_20261002123811.mp4',
    dest: 'chess_environment.mp4'
  },
  {
    src: 'Chess_website_UI_floating_design_20261002123831.mp4',
    dest: 'chess_floating_ui.mp4'
  },
  {
    src: 'Chess_website_UI_footer_design_20261002123803.mp4',
    dest: 'chess_footer.mp4'
  }
];

videoMap.forEach(v => {
  const srcPath = path.join(downloadsDir, v.src);
  const destPath = path.join(videoTargetDir, v.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied video: ${v.src} -> ${destPath} (${fs.statSync(destPath).size} bytes)`);
  } else {
    console.log(`Missing video: ${srcPath}`);
  }
});

// 2. Copy Frame Sequences into public/sequences/
const seqMap = [
  { src: 'Sequence01', dest: 'seq01' },
  { src: 'Sequence02', dest: 'seq02' },
  { src: 'sequence03', dest: 'seq03' }
];

seqMap.forEach(s => {
  const srcDir = path.join(downloadsDir, s.src);
  const destDir = path.join(publicDir, 'sequences', s.dest);
  if (fs.existsSync(srcDir)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    console.log(`Copying ${files.length} frames from ${s.src} to ${destDir}...`);
    for (const f of files) {
      fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f));
    }
    console.log(`Done copying ${s.dest}`);
  } else {
    console.log(`Missing sequence dir: ${srcDir}`);
  }
});
