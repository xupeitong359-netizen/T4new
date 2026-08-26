import fs from 'fs';

// Load map
const mapPath = './src/app/assets/hoi4_fixed_map.json';
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

console.log('Total features:', mapData.features.length);
