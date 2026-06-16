const fs = require('fs')
const path = require('path')

const svgContent = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#00236F"/>
  <rect x="${size * 0.15}" y="${size * 0.15}" width="${size * 0.7}" height="${size * 0.7}" rx="${size * 0.1}" fill="none" stroke="white" stroke-width="${size * 0.06}"/>
  <line x1="${size * 0.5}" y1="${size * 0.15}" x2="${size * 0.5}" y2="${size * 0.55}" stroke="white" stroke-width="${size * 0.06}"/>
  <line x1="${size * 0.3}" y1="${size * 0.55}" x2="${size * 0.7}" y2="${size * 0.55}" stroke="white" stroke-width="${size * 0.06}"/>
  <line x1="${size * 0.3}" y1="${size * 0.55}" x2="${size * 0.3}" y2="${size * 0.85}" stroke="white" stroke-width="${size * 0.06}"/>
  <line x1="${size * 0.7}" y1="${size * 0.55}" x2="${size * 0.7}" y2="${size * 0.85}" stroke="white" stroke-width="${size * 0.06}"/>
</svg>`

fs.writeFileSync(path.join('public', 'icon-192.svg'), svgContent(192))
fs.writeFileSync(path.join('public', 'icon-512.svg'), svgContent(512))

console.log('SVG icons created in public/')
console.log('Convert to PNG using an online tool or imagemagick:')
console.log('convert public/icon-192.svg public/icon-192.png')
console.log('convert public/icon-512.svg public/icon-512.png')
