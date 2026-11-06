import fs from 'fs';

const f2_1 = fs.readFileSync('public/sequences/seq02/ezgif-frame-001.jpg');
const f3_1 = fs.readFileSync('public/sequences/seq03/ezgif-frame-001.jpg');
console.log('Frame 1 identical:', f2_1.equals(f3_1));

const f2_300 = fs.readFileSync('public/sequences/seq02/ezgif-frame-300.jpg');
const f3_300 = fs.readFileSync('public/sequences/seq03/ezgif-frame-300.jpg');
console.log('Frame 300 identical:', f2_300.equals(f3_300));
