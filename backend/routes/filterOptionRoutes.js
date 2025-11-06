import express from 'express';
const router = express.Router();
import {
  getAllFilterOptions,
  getFilterOptionsByType,
  createFilterOption,
  updateFilterOption,
  deleteFilterOption,
  getAllFilterOptionsAdmin,
  initializeDefaultOptions
} from '../controllers/filterOptionController.js';
import { protect, admin } from '../middleware/auth.js';

// Public routes
router.get('/', getAllFilterOptions);
router.get('/:type', getFilterOptionsByType);

// Admin routes
router.post('/admin/initialize', protect, admin, initializeDefaultOptions);
router.get('/admin/all', protect, admin, getAllFilterOptionsAdmin);
router.post('/', protect, admin, createFilterOption);
router.put('/:id', protect, admin, updateFilterOption);
router.delete('/:id', protect, admin, deleteFilterOption);

export default router;
