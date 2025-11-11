import express from 'express';
import upload, { uploadVideo } from '../middleware/upload.js';
import imageCompression from '../middleware/imageCompression.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

export default router;
