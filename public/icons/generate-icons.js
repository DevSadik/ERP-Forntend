/**
 * Run this script with Node.js to generate app icons from the SVG.
 * Requires: npm install -g sharp-cli
 * Then run: node generate-icons.js
 */
const { execSync } = require('child_process');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  execSync(`npx sharp -i icon.svg -o icon-${size}.png resize ${size} ${size}`);
  console.log(`Generated icon-${size}.png`);
});
