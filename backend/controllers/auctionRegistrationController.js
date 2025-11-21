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

    // Check if user already exists with this email (from e-commerce signup)
    const existingUser = await User.findOne({ email });
    const emailVerified = existingUser ? true : false; // If user exists, email is already verified

    // Generate email verification token (only needed if email not already verified)
    const verificationToken = emailVerified ? undefined : crypto.randomBytes(32).toString('hex');

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
      emailVerified, // Auto-verify if user already exists
      verificationToken,
      userId: existingUser?._id, // Link to existing user
      status: 'pending'
    });

    // TODO: Send verification email
    // await sendVerificationEmail(email, verificationToken);

    console.log('✅ Registration created successfully:', registration._id);

    const message = emailVerified
      ? 'Registration submitted successfully! Your email is already verified. Admin will review your application.'
      : 'Registration submitted successfully. Please check your email for verification.';

    res.status(201).json({
      success: true,
      message,
      registrationId: registration._id,
      emailVerified
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
      .populate('userId', 'auctionCoins isAuctionVerified')
      .sort({ submittedAt: -1 })
      .select('-verificationToken');

    console.log('📋 Total registrations found:', registrations.length);
    if (registrations.length > 0) {
      const firstReg = registrations[0];
      console.log('📋 First registration auctionId:', firstReg.auctionId);
      console.log('📋 First registration userId:', firstReg.userId);
      if (firstReg.userId) {
        console.log('📋 First registration userId.auctionCoins:', firstReg.userId.auctionCoins);
      }
    }

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
    const { auctionCoins } = req.body; // Admin specifies coins

    const registration = await AuctionRegistration.findById(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Validate coins
    if (auctionCoins === undefined || auctionCoins < 0) {
      return res.status(400).json({
        message: 'Please specify auction coins (must be 0 or greater)'
      });
    }

    // Check if user already exists with this email
    let user = await User.findOne({ email: registration.email });

    if (!user) {
      // User doesn't exist - cannot approve auction registration without e-commerce account
      return res.status(400).json({
        message: 'User must create an e-commerce account first before auction registration can be approved'
      });
    }

    // User exists, update auction verification status and coins
    console.log('💰 Before save - user.auctionCoins:', user.auctionCoins);
    user.isAuctionVerified = true;
    user.auctionCoins = Number(auctionCoins);
    console.log('💰 After assignment - user.auctionCoins:', user.auctionCoins);
    await user.save();
    console.log('💰 After save - user.auctionCoins:', user.auctionCoins);
    console.log('💰 User ID:', user._id);

    // Generate unique auction ID
    const year = new Date().getFullYear();
    const count = await AuctionRegistration.countDocuments({ status: 'approved' });
    const auctionId = `AUC-${year}-${String(count + 1).padStart(5, '0')}`;

    // Update registration
    registration.status = 'approved';
    registration.userId = user._id;
    registration.approvedAt = Date.now();
    registration.auctionId = auctionId;
    await registration.save();

    console.log('✅ Auction ID generated:', auctionId);
    console.log('✅ Auction coins assigned:', auctionCoins);

    // TODO: Send approval email with login credentials and coin balance

    res.json({
      success: true,
      message: `Registration approved! Auction ID: ${auctionId}, Coins: ${auctionCoins}`,
      userId: user._id,
      auctionId: auctionId,
      auctionCoins: auctionCoins
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
