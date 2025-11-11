import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Compress frontend asset images
 * This script compresses images in src/assets folder
 */

async function compressImage(filePath, quality = 85) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

    if (!isImage) {
      return null;
    }

    // Get original file size
    const stats = await fs.stat(filePath);
    const originalSize = stats.size;

    // Read the image
    let image = sharp(filePath);
    const metadata = await image.metadata();

    // Resize if too large (max 2000px)
    if (metadata.width > 2000 || metadata.height > 2000) {
      image = image.resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Compress based on format
    if (ext === '.jpg' || ext === '.jpeg') {
      image = image.jpeg({ quality, progressive: true });
    } else if (ext === '.png') {
      // Convert large PNGs to JPEG for better compression
      if (originalSize > 200 * 1024) { // If larger than 200KB
        const newPath = filePath.replace(/\.png$/i, '.jpg');
        await image.jpeg({ quality }).toFile(newPath + '.temp');

        const tempStats = await fs.stat(newPath + '.temp');
        if (tempStats.size < originalSize) {
          await fs.unlink(filePath);
          await fs.rename(newPath + '.temp', newPath);
          console.log(`✅ Converted PNG to JPG: ${path.basename(newPath)}`);
          console.log(`   ${(originalSize / 1024).toFixed(1)}KB → ${(tempStats.size / 1024).toFixed(1)}KB`);
          return { originalSize, compressedSize: tempStats.size };
        } else {
          await fs.unlink(newPath + '.temp');
        }
      }
      image = image.png({ quality, compressionLevel: 9 });
    } else if (ext === '.webp') {
      image = image.webp({ quality });
    }

    // Create temp file
    const tempPath = filePath + '.temp';
    await image.toFile(tempPath);

    // Get compressed file size
    const tempStats = await fs.stat(tempPath);
    const compressedSize = tempStats.size;

    // Only use compressed version if it's actually smaller
    if (compressedSize < originalSize) {
      await fs.unlink(filePath);
      await fs.rename(tempPath, filePath);

      const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

      console.log(`✅ Compressed: ${path.basename(filePath)}`);
      console.log(`   ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);

      return { originalSize, compressedSize };
    } else {
      // Keep original if compression didn't help
      await fs.unlink(tempPath);
      console.log(`⏭️  Kept original: ${path.basename(filePath)}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Failed to compress ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

async function compressAssetsDirectory() {
  const assetsPath = path.join(__dirname, '..', '..', 'src', 'assets');

  console.log('\n📁 Starting asset compression...');
  console.log(`📂 Directory: ${assetsPath}\n`);

  try {
    const files = await fs.readdir(assetsPath);
    let totalOriginal = 0;
    let totalCompressed = 0;
    let count = 0;

    for (const file of files) {
      const filePath = path.join(assetsPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        const result = await compressImage(filePath, 85);
        if (result) {
          totalOriginal += result.originalSize;
          totalCompressed += result.compressedSize;
          count++;
        }
      }
    }

    if (count > 0) {
      const totalReduction = ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1);
      console.log(`\n📊 Compression Complete!`);
      console.log(`   Files compressed: ${count}`);
      console.log(`   Total original: ${(totalOriginal / 1024).toFixed(1)}KB`);
      console.log(`   Total compressed: ${(totalCompressed / 1024).toFixed(1)}KB`);
      console.log(`   Total saved: ${((totalOriginal - totalCompressed) / 1024).toFixed(1)}KB (${totalReduction}%)\n`);
    } else {
      console.log('\n✅ All images already optimized!\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the compression
compressAssetsDirectory();
