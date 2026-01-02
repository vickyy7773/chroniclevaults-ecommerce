import express from 'express';
import { getLoginHistory, getAllLoginHistory } from '../controllers/loginHistoryController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.get('/', protect, getLoginHistory);

// Admin routes
router.get('/admin/all', protect, admin, getAllLoginHistory);

export default router;
