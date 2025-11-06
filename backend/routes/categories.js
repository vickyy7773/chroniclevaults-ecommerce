import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getMainCategories,
  updateCategoryBannerImage,
  updateCategoryCardImage,
  updateCategoryImage
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/main', getMainCategories);
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Protected routes (Admin only)
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.put('/:id/banner-image', protect, admin, upload.single('image'), updateCategoryBannerImage);
router.put('/:id/card-image', protect, admin, upload.single('image'), updateCategoryCardImage);
router.put('/:id/image', protect, admin, upload.single('image'), updateCategoryImage); // Backward compatibility
router.delete('/:id', protect, admin, deleteCategory);

export default router;
