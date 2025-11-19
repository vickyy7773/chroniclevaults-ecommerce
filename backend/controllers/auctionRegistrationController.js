import AuctionRegistration from '../models/AuctionRegistration.js';
import User from '../models/User.js';
import crypto from 'crypto';

// @desc    Submit auction registration
// @route   POST /api/auction-registration
// @access  Public
export const submitRegistration = async (req, res) => {
  try {
    console.log('📝 Auction registration request received');
    console.log('Body keys:', Object.keys(req.body));

    const {
      title,
      fullName,
      companyName,
      dateOfBirth,
      gstNumber,
      stateCode,
      billingAddress,
      sameAsBilling,
      shippingAddress,
      mobile,
      email,
      phone,
      website,
      panCard,
      idProof,
      collectingInterests,
      references
    } = req.body;

    console.log('📧 Email:', email);
    console.log('📄 idProof type:', typeof idProof, idProof);

    // Check if email already registered for auction (not in User model)
    const existingRegistration = await AuctionRegistration.findOne({ email });
    if (existingRegistration) {
      console.log('❌ Email already registered for auction');
      return res.status(400).json({ message: 'Email already registered for auction' });
    }

    // Note: We don't check User model because auction email can be same as user account email
    // Auction registration is separate from user account creation

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create registration
    const registration = await AuctionRegistration.create({
      title,
      fullName,
      companyName,
      dateOfBirth,
      gstNumber,
      stateCode,
      billingAddress,
      sameAsBilling,
      shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
      mobile,
      email,
      phone,
      website,
      panCard,
      idProof,
      collectingInterests,
      references,
      verificationToken,
      status: 'pending'
    });

    // TODO: Send verification email
    // await sendVerificationEmail(email, verificationToken);

    console.log('✅ Registration created successfully:', registration._id);

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Please check your email for verification.',
      registrationId: registration._id
    });

  } catch (error) {
    console.error('❌ Error submitting auction registration:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', Object.keys(error.errors));
      Object.keys(error.errors).forEach(key => {
        console.error(`  ${key}:`, error.errors[key].message);
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error submitting registration',
      error: error.message,
      validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
};

// @desc    Verify email
// @route   GET /api/auction-registration/verify/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const registration = await AuctionRegistration.findOne({ verificationToken: token });

    if (!registration) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    registration.emailVerified = true;
    registration.verificationToken = undefined;
    await registration.save();

    res.json({
      success: true,
      message: 'Email verified successfully. Your registration is pending admin approval.'
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
};

// @desc    Get all registrations (Admin)
// @route   GET /api/auction-registration/admin/all
// @access  Private/Admin
export const getAllRegistrations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const registrations = await AuctionRegistration.find(filter)
      .sort({ submittedAt: -1 })
      .select('-verificationToken');

    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Error fetching registrations' });
  }
};

// @desc    Approve registration (Admin)
// @route   PUT /api/auction-registration/admin/approve/:id
// @access  Private/Admin
export const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const registration = await AuctionRegistration.findById(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (!registration.emailVerified) {
      return res.status(400).json({ message: 'Email not verified yet' });
    }

    // Check if user already exists with this email
    let user = await User.findOne({ email: registration.email });

    if (user) {
      // User already exists, just update auction verification status
      user.isAuctionVerified = true;
      await user.save();
    } else {
      // Create new user account
      user = await User.create({
        name: registration.fullName,
        email: registration.email,
        password: password || 'TempPass123!', // Temporary password
        phone: registration.mobile,
        address: {
          street: registration.billingAddress.addressLine1,
          city: registration.billingAddress.city,
          state: registration.billingAddress.state,
          zipCode: registration.billingAddress.pinCode,
          country: registration.billingAddress.country
        },
        role: 'customer',
        isAuctionVerified: true
      });
    }

    // Update registration
    registration.status = 'approved';
    registration.userId = user._id;
    registration.approvedAt = Date.now();
    await registration.save();

    // TODO: Send approval email with login credentials

    res.json({
      success: true,
      message: 'Registration approved and user account created',
      userId: user._id
    });

  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ message: 'Error approving registration', error: error.message });
  }
};

// @desc    Reject registration (Admin)
// @route   PUT /api/auction-registration/admin/reject/:id
// @access  Private/Admin
export const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const registration = await AuctionRegistration.findById(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.status = 'rejected';
    registration.adminNotes = reason;
    registration.rejectedAt = Date.now();
    await registration.save();

    // TODO: Send rejection email

    res.json({
      success: true,
      message: 'Registration rejected'
    });

  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ message: 'Error rejecting registration' });
  }
};
