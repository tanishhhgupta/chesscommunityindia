import fs from 'fs';
import path from 'path';

function inspectDir(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  console.log(dir, 'has', items.length, 'items');
  if (items.length > 0) {
    console.log('Sample item:', items[0], items[Math.floor(items.length / 2)], items[items.length - 1]);
  }
}

inspectDir('public/sequences/seq01');
inspectDir('public/sequences/seq02');
inspectDir('public/sequences/seq03');
inspectDir('public/frames');
inspectDir('public/frames2');
inspectDir('public/videos');
