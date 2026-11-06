import fs from 'fs';

// Let's inspect the image dimensions
const buf = fs.readFileSync('public/sequences/seq02/ezgif-frame-300.jpg');
// JPEG SOF0 or JFIF header parser to get width and height
let offset = 2;
while (offset < buf.length) {
  const marker = buf.readUInt16BE(offset);
  offset += 2;
  if (marker === 0xFFC0 || marker === 0xFFC2) { // SOF0 or SOF2
    const h = buf.readUInt16BE(offset + 3);
    const w = buf.readUInt16BE(offset + 5);
    console.log(`Image size: ${w}x${h}`);
    break;
  }
  const len = buf.readUInt16BE(offset);
  offset += len;
}
