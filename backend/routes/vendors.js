import express from 'express';
import {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  updateVendorStatus
} from '../controllers/vendorController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and require admin role
// Temporarily disabled for testing
// router.use(protect);
// router.use(admin);

// Get all vendors
router.get('/', getAllVendors);

// Get vendor by ID
router.get('/:id', getVendorById);

// Create new vendor
router.post('/', createVendor);

// Update vendor
router.put('/:id', updateVendor);

// Update vendor status
router.put('/:id/status', updateVendorStatus);

// Delete vendor
router.delete('/:id', deleteVendor);

export default router;
