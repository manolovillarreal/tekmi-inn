const fs = require('fs');
const path = require('path');

const logoPath = 'logo_icon.png';
const destDir = 'public/icons';

// Verificar si sharp está disponible, si no, usar alternativa
try {
  const sharp = require('sharp');
  const img = sharp(logoPath);
  
  // Generar 192x192
  img.resize(192, 192, {
    fit: 'cover',
    position: 'center'
  }).png().toFile(path.join(destDir, 'pwa-192.png'));
  
  // Generar 512x512
  sharp(logoPath)
    .resize(512, 512, {
      fit: 'cover',
      position: 'center'
    })
    .png()
    .toFile(path.join(destDir, 'pwa-512.png'));
    
  console.log('✓ Iconos PWA generados con sharp');
} catch (e) {
  console.log('sharp no disponible, instalando...');
  const { spawnSync } = require('child_process');
  spawnSync('npm', ['install', '--save-dev', 'sharp'], { stdio: 'inherit' });
  console.log('Por favor ejecuta nuevamente este script');
}
