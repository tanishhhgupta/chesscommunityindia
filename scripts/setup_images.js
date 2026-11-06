import fs from 'fs';
import path from 'path';

const dir = 'public/images/redesign/';
const files = fs.readdirSync(dir);
const map = {
  'hero_chess_arch': 'hero-arch.jpg',
  'event_national_swiss': 'event-swiss.jpg',
  'event_rapid_prix': 'event-rapid.jpg',
  'event_coffee_blitz': 'event-blitz.jpg',
  'city_jabalpur': 'city-jabalpur.jpg',
  'city_bhopal': 'city-bhopal.jpg',
  'city_indore': 'city-indore.jpg',
  'city_delhi': 'city-delhi.jpg',
  'chess_knight_gold': 'knight-gold.jpg',
  'chesspair_cafe': 'chesspair-cafe.jpg',
  'community_cafe_discussion': 'community-discussion.jpg'
};

for (const file of files) {
  for (const [prefix, target] of Object.entries(map)) {
    if (file.startsWith(prefix)) {
      fs.copyFileSync(path.join(dir, file), path.join(dir, target));
      console.log(`Copied ${file} -> ${target}`);
      break;
    }
  }
}
console.log('All files mapped successfully!');
