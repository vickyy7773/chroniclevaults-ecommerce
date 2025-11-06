import express from 'express';
import {
  getActiveBanner,
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus
} from '../controllers/bannerController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public route - get active banner
router.get('/active', getActiveBanner);

// Admin routes - protected
router.get('/', protect, admin, getAllBanners);
router.get('/:id', protect, admin, getBannerById);
router.post('/', protect, admin, createBanner);
router.put('/:id', protect, admin, updateBanner);
router.put('/:id/toggle', protect, admin, toggleBannerStatus);
router.delete('/:id', protect, admin, deleteBanner);

export default router;
