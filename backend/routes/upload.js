import express from 'express';
import upload, { uploadVideo } from '../middleware/upload.js';
import imageCompression from '../middleware/imageCompression.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Single image upload
router.post('/single', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Compress the uploaded image
    const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    await imageCompression.compressImage(filePath, { quality: 85 });

    // Return the full URL including backend domain (force HTTPS for production)
    const protocol = req.get('host').includes('chroniclevaults.com') ? 'https' : req.protocol;
    const imageUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'Image uploaded and optimized successfully',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// Multiple images upload
router.post('/multiple', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Compress all uploaded images
    for (const file of req.files) {
      const filePath = path.join(__dirname, '..', 'uploads', file.filename);
      await imageCompression.compressImage(filePath, { quality: 85 });
    }

    // Return array of full URLs including backend domain (force HTTPS for production)
    const protocol = req.get('host').includes('chroniclevaults.com') ? 'https' : req.protocol;
    const imageUrls = req.files.map(file =>
      `${protocol}://${req.get('host')}/uploads/${file.filename}`
    );
    res.status(200).json({
      message: 'Images uploaded and optimized successfully',
      imageUrls: imageUrls,
      count: req.files.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading images', error: error.message });
  }
});

// Video upload
router.post('/video', uploadVideo.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Return the full URL including backend domain (force HTTPS for production)
    const protocol = req.get('host').includes('chroniclevaults.com') ? 'https' : req.protocol;
    const videoUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'Video uploaded successfully',
      videoUrl: videoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading video', error: error.message });
  }
});

// Get list of all uploaded images
router.get('/list', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({ images: [] });
    }

    // Read all files from uploads directory
    const files = fs.readdirSync(uploadsDir);

    // Get file details
    const imageFiles = files
      .filter(file => {
        // Filter only image files
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        const protocol = req.get('host').includes('chroniclevaults.com') ? 'https' : req.protocol;

        return {
          filename: file,
          url: `${protocol}://${req.get('host')}/uploads/${file}`,
          size: (stats.size / 1024).toFixed(2), // KB
          uploadedAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // Sort by newest first

    res.status(200).json({
      success: true,
      count: imageFiles.length,
      images: imageFiles
    });
  } catch (error) {
    console.error('List images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing images',
      error: error.message
    });
  }
});

// Delete uploaded image
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      filename
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

// Base64 image upload (for auction images)
router.post('/base64', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image data provided' });
    }

    // Extract base64 data
    const matches = image.match(/^data:image\/([a-zA-Z]*);base64,([^\"]*)$/);

    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: 'Invalid base64 image format' });
    }

    const imageType = matches[1]; // png, jpeg, etc.
    const base64Data = matches[2];

    // Generate unique filename
    const filename = `img-${Date.now()}-${Math.round(Math.random() * 1E9)}.${imageType}`;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, filename);

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write base64 data to file
    fs.writeFileSync(filePath, base64Data, 'base64');

    // Compress the image
    await imageCompression.compressImage(filePath, { quality: 85 });

    // Return the full URL
    const protocol = req.get('host').includes('chroniclevaults.com') ? 'https' : req.protocol;
    const imageUrl = `${protocol}://${req.get('host')}/uploads/${filename}`;

    res.status(200).json({
      message: 'Image uploaded and optimized successfully',
      imageUrl: imageUrl,
      filename: filename
    });
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

export default router;
