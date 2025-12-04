import express from 'express';
import upload, { uploadVideo } from '../middleware/upload.js';
import imageCompression from '../middleware/imageCompression.js';
import UploadedImage from '../models/UploadedImage.js';
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

    // Get file stats after compression
    const stats = fs.statSync(filePath);

    // Return the full URL including backend domain (force HTTPS for production)
    const protocol = req.get('host').includes('chroniclevaults.com') ? 'https' : req.protocol;
    const imageUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Save image metadata to database
    const uploadedImage = await UploadedImage.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: imageUrl,
      size: stats.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user?._id, // If user is authenticated
      purpose: 'auction' // Default purpose for Image Upload Manager
    });

    res.status(200).json({
      message: 'Image uploaded and optimized successfully',
      imageUrl: imageUrl,
      filename: req.file.filename,
      imageId: uploadedImage._id
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

// Get list of all uploaded images from database
router.get('/list', async (req, res) => {
  try {
    // Fetch all uploaded images from database, sorted by newest first
    const images = await UploadedImage.find({ purpose: 'auction' })
      .sort({ createdAt: -1 })
      .select('filename originalName url size mimeType createdAt isUsed')
      .lean();

    // Transform data for frontend
    const imageFiles = images.map(img => ({
      id: img._id,
      filename: img.filename,
      originalName: img.originalName,
      url: img.url,
      size: (img.size / 1024).toFixed(2), // Convert to KB
      uploadedAt: img.createdAt,
      isUsed: img.isUsed
    }));

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

    // Find image in database
    const imageDoc = await UploadedImage.findOne({ filename });

    if (!imageDoc) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in database'
      });
    }

    // Delete the physical file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await UploadedImage.deleteOne({ filename });

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

    // Get file stats after compression
    const stats = fs.statSync(filePath);

    // Return the full URL
    const protocol = req.get('host').includes('chroniclevaults.com') ? 'https' : req.protocol;
    const imageUrl = `${protocol}://${req.get('host')}/uploads/${filename}`;

    // Save image metadata to database
    const uploadedImage = await UploadedImage.create({
      filename: filename,
      originalName: filename,
      url: imageUrl,
      size: stats.size,
      mimeType: `image/${imageType}`,
      uploadedBy: req.user?._id,
      purpose: 'auction'
    });

    res.status(200).json({
      message: 'Image uploaded and optimized successfully',
      imageUrl: imageUrl,
      filename: filename,
      imageId: uploadedImage._id
    });
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

export default router;
