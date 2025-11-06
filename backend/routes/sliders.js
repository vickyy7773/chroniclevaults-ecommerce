import express from 'express';
import {
  getAllSliders,
  getAllSlidersAdmin,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  reorderSliders
} from '../controllers/sliderController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes - Must come BEFORE public routes to avoid :id matching "admin"
router.get('/admin/all', protect, admin, getAllSlidersAdmin);
router.post('/', protect, admin, createSlider);
router.put('/reorder', protect, admin, reorderSliders);
router.put('/:id', protect, admin, updateSlider);
router.delete('/:id', protect, admin, deleteSlider);

// Public routes
router.get('/:id', getSliderById);
router.get('/', getAllSliders);

export default router;
