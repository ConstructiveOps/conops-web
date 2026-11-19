// Makes src/assets/brand/co-logo-wide-white.png (for navy grounds) from
// brand/Wide Logo - Full Size.png: navy becomes white; the gray ring of the
// mark stays brand gray; the gray "OPERATIONS" lightens to #DFE6EE so it
// reads on navy at header size. Stopgap until an official white wide logo
// exists (see TASKS.md). Run: node scripts/make-white-wide-logo.mjs
import sharp from 'sharp';

const src = 'brand/Wide Logo - Full Size.png';
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const markEnd = Math.round(info.width * 0.2); // the CO mark sits in the left fifth
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 4;
    const [r, b, a] = [data[i], data[i + 2], data[i + 3]];
    if (a === 0) continue;
    const navy = b - r > 40; // navy pixels are strongly blue
    if (navy) {
      data[i] = data[i + 1] = data[i + 2] = 255;
    } else if (x > markEnd) {
      data[i] = 0xdf; data[i + 1] = 0xe6; data[i + 2] = 0xee;
    }
  }
}
await sharp(data, { raw: info }).png().toFile('src/assets/brand/co-logo-wide-white.png');
console.log('wrote src/assets/brand/co-logo-wide-white.png', info.width, info.height);
