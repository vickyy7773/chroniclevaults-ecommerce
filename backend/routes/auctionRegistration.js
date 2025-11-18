import express from 'express';
import {
  submitRegistration,
  verifyEmail,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration
} from '../controllers/auctionRegistrationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/', submitRegistration);
router.get('/verify/:token', verifyEmail);

// Admin routes
router.get('/admin/all', protect, admin, getAllRegistrations);
router.put('/admin/approve/:id', protect, admin, approveRegistration);
router.put('/admin/reject/:id', protect, admin, rejectRegistration);

export default router;
