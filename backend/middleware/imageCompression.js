import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Image Compression Middleware
 * Automatically compresses uploaded images to optimize file size
 * Maintains good quality (85%) while reducing file size by 50-70%
 */

const imageCompression = {
  /**
   * Compress a single image file
   * @param {string} filePath - Path to the image file
   * @param {object} options - Compression options
   * @returns {Promise<object>} - Compression result
   */
  compressImage: async (filePath, options = {}) => {
    const {
      quality = 85,
      maxWidth = 2000,
      maxHeight = 2000,
      format = null // auto-detect if null
    } = options;

    try {
      const ext = path.extname(filePath).toLowerCase();
      const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

      if (!isImage) {
        console.log(`⏭️  Skipping non-image file: ${path.basename(filePath)}`);
        return { success: false, message: 'Not an image file' };
      }

      // Get original file size
      const stats = await fs.stat(filePath);
      const originalSize = stats.size;

      // Read the image
      let image = sharp(filePath);
      const metadata = await image.metadata();

      // Resize if needed (maintain aspect ratio)
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        image = image.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Determine output format
      const outputFormat = format || (ext === '.png' ? 'png' : 'jpeg');

      // Compress based on format
      if (outputFormat === 'jpeg' || ext === '.jpg' || ext === '.jpeg') {
        image = image.jpeg({ quality, progressive: true });
      } else if (outputFormat === 'png') {
        image = image.png({ quality, compressionLevel: 9 });
      } else if (outputFormat === 'webp') {
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
        console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB → Compressed: ${(compressedSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);

        return {
          success: true,
          originalSize,
          compressedSize,
          reduction: `${reduction}%`,
          message: 'Image compressed successfully'
        };
      } else {
        // Keep original if compression didn't help
        await fs.unlink(tempPath);
        console.log(`⏭️  Kept original: ${path.basename(filePath)} (already optimized)`);

        return {
          success: false,
          message: 'Original is already optimized'
        };
      }
    } catch (error) {
      console.error(`❌ Compression failed for ${path.basename(filePath)}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Compress multiple images in a directory
   * @param {string} directoryPath - Path to directory containing images
   * @param {object} options - Compression options
   * @returns {Promise<object>} - Compression summary
   */
  compressDirectory: async (directoryPath, options = {}) => {
    try {
      const files = await fs.readdir(directoryPath);
      const results = [];
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;

      for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isFile()) {
          const result = await imageCompression.compressImage(filePath, options);
          if (result.success) {
            totalOriginalSize += result.originalSize;
            totalCompressedSize += result.compressedSize;
          }
          results.push({ file, ...result });
        }
      }

      const totalReduction = totalOriginalSize > 0
        ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1)
        : 0;

      console.log(`\n📊 Compression Summary:`);
      console.log(`   Total Original: ${(totalOriginalSize / 1024).toFixed(1)}KB`);
      console.log(`   Total Compressed: ${(totalCompressedSize / 1024).toFixed(1)}KB`);
      console.log(`   Total Reduction: ${totalReduction}%\n`);

      return {
        success: true,
        results,
        summary: {
          totalOriginalSize,
          totalCompressedSize,
          totalReduction: `${totalReduction}%`
        }
      };
    } catch (error) {
      console.error('❌ Directory compression failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default imageCompression;
