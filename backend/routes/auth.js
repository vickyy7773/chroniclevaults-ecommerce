import express from 'express';
import passport from 'passport';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  googleCallback,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  sendRegistrationOTP,
  verifyOTPAndRegister,
  resendOTP
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { logLogout } from '../middleware/activityLogger.js';

const router = express.Router();

// Traditional registration
router.post('/register', register);

// OTP-based registration
router.post('/send-otp', sendRegistrationOTP);
router.post('/verify-otp-register', verifyOTPAndRegister);
router.post('/resend-otp', resendOTP);

router.post('/login', login);
router.post('/logout', protect, async (req, res) => {
  try {
    await logLogout(req);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging out' });
  }
});
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);
router.put('/updatepassword', protect, updatePassword);

// Address routes
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);
router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL + '/login',
    session: false
  }),
  googleCallback
);

export default router;
