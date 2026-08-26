import fs from 'fs';
import path from 'path';

// Load geojson map
const geojsonPath = './src/app/assets/hoi4_fixed_map.json';
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

console.log('Features count:', geojson.features.length);
