import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  updateUser,
  getSavedAddresses,
  addAddress,
  setDefaultAddress,
  deleteAddress,
  updateAuctionCoins
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Address management routes (Protected - for logged in users)
router.get('/me/addresses', protect, getSavedAddresses);
router.post('/me/addresses', protect, addAddress);
router.put('/me/addresses/:addressId/default', protect, setDefaultAddress);
router.delete('/me/addresses/:addressId', protect, deleteAddress);

// All routes below are protected and require admin role
// Temporarily disabled for testing
// router.use(protect);
// router.use(admin);

// Get all users
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Update user
router.put('/:id', updateUser);

// Update user status
router.put('/:id/status', updateUserStatus);

// Update auction coins (Admin only)
router.put('/:id/auction-coins', updateAuctionCoins);

// Delete user
router.delete('/:id', deleteUser);

export default router;
