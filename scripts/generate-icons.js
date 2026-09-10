import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

function renderPng(width, height) {
  const resvg = new Resvg(svgBuffer, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

// 1. Generate PWA Web Icons
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderPng(180, 180));
console.log('✓ Public PWA icons generated successfully');

// 2. Generate Android Mipmap App Icons
const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const resDir = path.resolve('android/app/src/main/res');
if (fs.existsSync(resDir)) {
  for (const m of mipmaps) {
    const targetDir = path.join(resDir, m.dir);
    if (fs.existsSync(targetDir)) {
      const png = renderPng(m.size, m.size);
      fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), png);
      fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), png);
      fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), png);
    }
  }
  console.log('✓ Android mipmap launcher icons updated successfully');
}
