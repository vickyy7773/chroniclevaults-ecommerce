import User from '../models/User.js';
import Role from '../models/Role.js';
import generateToken from '../utils/generateToken.js';
import { sendOTPEmail, verifyOTP, sendWelcomeEmail } from '../services/emailService.js';
import { logLogin } from '../middleware/activityLogger.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Get default 'user' role
    const defaultRole = await Role.findOne({ name: 'user' });

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: defaultRole ? defaultRole._id : null,
      legacyRole: 'user' // Set default legacy role
    });

    // Generate token
    const token = generateToken(user._id);

    // Get user with populated role
    const userWithRole = await User.findById(user._id).select('-password').populate('role', 'name displayName permissions');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: userWithRole._id,
        name: userWithRole.name,
        email: userWithRole.email,
        phone: userWithRole.phone,
        role: userWithRole.role,
        legacyRole: userWithRole.legacyRole,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 Login attempt:', { email, password, passwordLength: password?.length });

    // Validate email & password
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('role', 'name displayName permissions');

    if (!user) {
      console.log('❌ User not found:', email.toLowerCase());
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ User found:', user.email);

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);

    console.log('🔑 Password match:', isPasswordMatch);

    if (!isPasswordMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Log admin login activity
    if (user.legacyRole === 'admin' || user.legacyRole === 'superadmin') {
      await logLogin(req, user);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        legacyRole: user.legacyRole,
        isAdmin: user.legacyRole === 'admin' || user.legacyRole === 'superadmin',
        isSuperAdmin: user.legacyRole === 'superadmin',
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  try {
    // Generate token for the authenticated user
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/google/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role
    }))}`);
  } catch (error) {
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/google/error?message=${encodeURIComponent(error.message)}`);
  }
};

// @desc    Facebook OAuth callback
// @route   GET /api/auth/facebook/callback
// @access  Public
export const facebookCallback = async (req, res) => {
  try {
    // Generate token for the authenticated user
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/facebook/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      role: req.user.role
    }))}`);
  } catch (error) {
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/facebook/error?message=${encodeURIComponent(error.message)}`);
  }
};

// @desc    Get user saved addresses
// @route   GET /api/auth/addresses
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user.savedAddresses || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add new address
// @route   POST /api/auth/addresses
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { type, name, address, city, state, pincode, phone, isDefault } = req.body;

    // If this is set as default, unset all other default addresses
    if (isDefault) {
      user.savedAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.savedAddresses.push({
      type,
      name,
      address,
      city,
      state,
      pincode,
      phone,
      isDefault: isDefault || user.savedAddresses.length === 0 // First address is default
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: user.savedAddresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const address = user.savedAddresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const { type, name, address: addr, city, state, pincode, phone, isDefault } = req.body;

    // If this is set as default, unset all other default addresses
    if (isDefault) {
      user.savedAddresses.forEach(a => {
        a.isDefault = false;
      });
    }

    address.type = type || address.type;
    address.name = name || address.name;
    address.address = addr || address.address;
    address.city = city || address.city;
    address.state = state || address.state;
    address.pincode = pincode || address.pincode;
    address.phone = phone || address.phone;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();

    res.status(200).json({
      success: true,
      data: user.savedAddresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const address = user.savedAddresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    address.deleteOne();
    await user.save();

    res.status(200).json({
      success: true,
      data: user.savedAddresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Set default address
// @route   PUT /api/auth/addresses/:addressId/default
// @access  Private
export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Unset all default addresses
    user.savedAddresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set the selected address as default
    const address = user.savedAddresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    address.isDefault = true;
    await user.save();

    res.status(200).json({
      success: true,
      data: user.savedAddresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== OTP-BASED REGISTRATION ====================

// @desc    Send OTP for registration
// @route   POST /api/auth/send-otp
// @access  Public
export const sendRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Send OTP
    const result = await sendOTPEmail(email, 'signup');

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify OTP and register user
// @route   POST /api/auth/verify-otp-register
// @access  Public
export const verifyOTPAndRegister = async (req, res) => {
  try {
    const { name, email, password, phone, otp } = req.body;

    // Validate required fields
    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and OTP'
      });
    }

    // Verify OTP
    const otpVerification = await verifyOTP(email, otp, 'signup');

    if (!otpVerification.success) {
      return res.status(400).json(otpVerification);
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Get default 'user' role
    const defaultRole = await Role.findOne({ name: 'user' });

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: defaultRole ? defaultRole._id : null,
      legacyRole: 'user',
      isEmailVerified: true // Mark email as verified
    });

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(email, name).catch(err =>
      console.error('Welcome email error:', err)
    );

    // Generate token
    const token = generateToken(user._id);

    // Get user with populated role
    const userWithRole = await User.findById(user._id).select('-password').populate('role', 'name displayName permissions');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: userWithRole._id,
        name: userWithRole.name,
        email: userWithRole.email,
        phone: userWithRole.phone,
        role: userWithRole.role,
        legacyRole: userWithRole.legacyRole,
        isEmailVerified: userWithRole.isEmailVerified,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { email, purpose = 'signup' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Send OTP
    const result = await sendOTPEmail(email, purpose);

    res.status(200).json({
      success: true,
      message: 'OTP resent to your email',
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
