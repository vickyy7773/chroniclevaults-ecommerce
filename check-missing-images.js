// Script to check which product images are missing on production server
const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkMissingImages() {
  console.log('🔍 Fetching all products from production API...\n');

  // Fetch products from production
  const products = await new Promise((resolve, reject) => {
    https.get('https://chroniclevaults.com/api/products?limit=200', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });

  console.log(`📦 Found ${products.length} products\n`);

  // Extract all image filenames
  const imageFiles = new Set();
  products.forEach(product => {
    (product.images || []).forEach(imgUrl => {
      const filename = imgUrl.split('/').pop();
      if (filename.startsWith('img-')) {
        imageFiles.add(filename);
      }
    });
  });

  console.log(`🖼️  Total unique images referenced: ${imageFiles.length}\n`);
  console.log('Checking which images exist on server...\n');

  // Check each image on server
  const missingImages = [];
  const existingImages = [];

  for (const filename of imageFiles) {
    try {
      const { stdout, stderr } = await execPromise(
        `ssh root@72.60.202.163 "test -f /home/chroniclevaults.com/app/backend/uploads/${filename} && echo EXISTS || echo MISSING"`
      );

      if (stdout.trim() === 'MISSING') {
        missingImages.push(filename);
      } else {
        existingImages.push(filename);
      }
    } catch (error) {
      missingImages.push(filename);
    }
  }

  console.log(`\n✅ EXISTING images: ${existingImages.length}`);
  console.log(`❌ MISSING images: ${missingImages.length}\n`);

  if (missingImages.length > 0) {
    console.log('Missing images:');
    missingImages.slice(0, 20).forEach(img => console.log(`  - ${img}`));
    if (missingImages.length > 20) {
      console.log(`  ... and ${missingImages.length - 20} more`);
    }
  }

  // Find products affected
  console.log('\n\n📋 Products with missing images:');
  let affectedCount = 0;
  products.forEach(product => {
    const productMissing = (product.images || []).filter(imgUrl => {
      const filename = imgUrl.split('/').pop();
      return missingImages.includes(filename);
    });

    if (productMissing.length > 0) {
      affectedCount++;
      console.log(`  ${product.productCode} - ${product.name.substring(0, 50)}... (${productMissing.length} missing)`);
    }
  });

  console.log(`\n🔢 Total products affected: ${affectedCount} out of ${products.length}`);
}

checkMissingImages().catch(console.error);
