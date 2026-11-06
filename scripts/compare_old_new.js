import fs from 'fs';

const f_old_1 = fs.readFileSync('public/frames/ezgif-frame-001.jpg');
const f_seq1_1 = fs.readFileSync('public/sequences/seq01/ezgif-frame-001.jpg');
console.log('frames vs seq01 frame 1:', f_old_1.equals(f_seq1_1));

const f_old2_1 = fs.readFileSync('public/frames2/ezgif-frame-001.jpg');
const f_seq2_1 = fs.readFileSync('public/sequences/seq02/ezgif-frame-001.jpg');
console.log('frames2 vs seq02 frame 1:', f_old2_1.equals(f_seq2_1));
