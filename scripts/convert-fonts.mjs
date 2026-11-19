// Converts brand/fonts/EuroStyle-Normal.ttf to src/assets/fonts/EuroStyle-Normal.woff2.
// Run with: npm run fonts:convert (only needed if the TTF changes).
import { readFile, writeFile } from 'node:fs/promises';
import { compress } from 'wawoff2';

const input = await readFile('brand/fonts/EuroStyle-Normal.ttf');
const output = await compress(input);
await writeFile('src/assets/fonts/EuroStyle-Normal.woff2', output);
console.log(`EuroStyle: ${input.length} bytes TTF -> ${output.length} bytes WOFF2`);
