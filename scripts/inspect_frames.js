import fs from 'fs';
import path from 'path';

const dir2 = 'C:/Users/Asus/Downloads/ezgif-59addb5460e91fcb-jpg';
fs.copyFileSync(path.join(dir2, 'ezgif-frame-001.jpg'), 'public/frames2_sample_001.jpg');
fs.copyFileSync(path.join(dir2, 'ezgif-frame-150.jpg'), 'public/frames2_sample_150.jpg');
fs.copyFileSync(path.join(dir2, 'ezgif-frame-300.jpg'), 'public/frames2_sample_300.jpg');
console.log('Sample frames from folder 2 copied successfully');
