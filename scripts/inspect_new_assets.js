import fs from 'fs';
import path from 'path';

['Sequence01', 'Sequence02', 'sequence03'].forEach(name => {
  const p = path.join('C:/Users/Asus/Downloads', name);
  if (fs.existsSync(p)) {
    const files = fs.readdirSync(p).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    console.log(name, 'files count:', files.length, 'first:', files[0], 'last:', files[files.length - 1]);
    const firstSize = fs.statSync(path.join(p, files[0])).size;
    console.log(name, 'first frame size:', firstSize);
  } else {
    console.log(name, 'NOT FOUND');
  }
});

const mp4s = [
  'Floating_3D_chess_website_videos_20261002123811.mp4',
  'Chess_website_UI_floating_design_20261002123831.mp4',
  'Chess_website_UI_footer_design_20261002123803.mp4'
];

mp4s.forEach(m => {
  const p = path.join('C:/Users/Asus/Downloads', m);
  if (fs.existsSync(p)) {
    console.log(m, 'size:', fs.statSync(p).size);
  } else {
    console.log(m, 'NOT FOUND');
  }
});
