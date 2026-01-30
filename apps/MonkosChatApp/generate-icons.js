const fs = require('fs');
const path = require('path');

// SVG를 Base64 PNG로 변환하는 간단한 방법
// Canvas나 sharp 없이 작동

const sizes = [
  { name: 'icon.png', size: 512 },
  { name: 'favicon.png', size: 48 },
  { name: 'adaptive-icon.png', size: 512 },
  { name: 'splash-icon.png', size: 1024 }
];

console.log('Creating placeholder PNG files...');
console.log('Note: These are minimal placeholder files.');
console.log('For production, please use proper icon design tools.\n');

// 간단한 1x1 투명 PNG (base64)
const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// 각 크기별로 파일 생성 (실제로는 모두 동일한 작은 PNG)
sizes.forEach(({ name, size }) => {
  const filePath = path.join(__dirname, 'assets', name);
  fs.writeFileSync(filePath, transparentPng);
  console.log(`✓ Created ${name} (${size}x${size})`);
});

console.log('\n⚠️  Warning: Placeholder icons created.');
console.log('For better quality, please:');
console.log('1. Use design tools (Figma, Canva, etc.) to create proper icons');
console.log('2. Or use online converters: https://realfavicongenerator.net/');
console.log('3. Replace files in assets/ directory');
