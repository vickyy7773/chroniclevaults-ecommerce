import User from '../models/User.js';
import Order from '../models/Order.js';
import CoinAllocation from '../models/CoinAllocation.js';
import Auction from '../models/Auction.js';
import AuctionRegistration from '../models/AuctionRegistration.js';
import { sendAuctionLimitUpgradeEmail } from '../services/emailService.js';

// @desc    Get all users/customers
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { type } = req.query; // 'auction' | 'ecommerce' | undefined (all)

    // Build set of userIds who have any auction registration
    const auctionRegs = await AuctionRegistration.find({}).select('userId').lean();
    const auctionUserIds = new Set(auctionRegs.map(r => r.userId?.toString()).filter(Boolean));

    let users = await User.find({ legacyRole: 'user' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Server-side filter by type
    if (type === 'auction') {
      users = users.filter(u => auctionUserIds.has(u._id.toString()));
    } else if (type === 'ecommerce') {
      users = users.filter(u => !auctionUserIds.has(u._id.toString()));
    }

    // For each user, get their order statistics
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ user: user._id });

        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);

        // Get last order date
        const lastOrder = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const lastOrderDate = lastOrder ? lastOrder.createdAt : user.createdAt;

        // Use saved status if set, otherwise compute from order history
        const daysSinceLastOrder = (Date.now() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24);
        const computedStatus = daysSinceLastOrder > 90 ? 'inactive' : 'active';
        const status = user.status || computedStatus;

        return {
          ...user,
          totalOrders,
          totalSpent,
          lastOrderDate,
          status,
          registeredDate: user.createdAt,
          hasAuctionRegistration: auctionUserIds.has(user._id.toString())
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithStats
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's order statistics
    const orders = await Order.find({ user: user._id });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const lastOrder = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        totalOrders,
        totalSpent,
        lastOrderDate: lastOrder ? lastOrder.createdAt : user.createdAt,
        registeredDate: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting admin users
    if (user.legacyRole === 'admin' || user.legacyRole === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
      error: error.message
    });
  }
};

// @desc    Update user details (admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, address, role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (role && ['user', 'admin', 'superadmin'].includes(role)) user.legacyRole = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user',
      error: error.message
    });
  }
};

// @desc    Get saved addresses for current user
// @route   GET /api/users/me/addresses
// @access  Private
export const getSavedAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedAddresses');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.savedAddresses || []
    });
  } catch (error) {
    console.error('Get saved addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching addresses',
      error: error.message
    });
  }
};

// @desc    Add new address
// @route   POST /api/users/me/addresses
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const { type, name, address, city, state, pincode, phone, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If this is set as default, unset all other default addresses
    if (isDefault) {
      user.savedAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // If this is the first address, make it default
    const makeDefault = isDefault || user.savedAddresses.length === 0;

    // Add new address
    user.savedAddresses.push({
      type: type || 'Home',
      name,
      address,
      city,
      state,
      pincode,
      phone,
      isDefault: makeDefault
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user.savedAddresses
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding address',
      error: error.message
    });
  }
};

// @desc    Set default address
// @route   PUT /api/users/me/addresses/:addressId/default
// @access  Private
export const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find and update the address
    let addressFound = false;
    user.savedAddresses.forEach(addr => {
      if (addr._id.toString() === req.params.addressId) {
        addr.isDefault = true;
        addressFound = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!addressFound) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      data: user.savedAddresses
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting default address',
      error: error.message
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/me/addresses/:addressId
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove the address
    const initialLength = user.savedAddresses.length;
    user.savedAddresses = user.savedAddresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    if (user.savedAddresses.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: user.savedAddresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting address',
      error: error.message
    });
  }
};

// @desc    Update user auction coins
// @route   PUT /api/users/:id/auction-coins
// @access  Private/Admin
export const updateAuctionCoins = async (req, res) => {
  try {
    const { auctionCoins } = req.body;

    // Validate coins
    if (auctionCoins === undefined || auctionCoins < 0 || isNaN(auctionCoins)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid auction coins (must be 0 or greater)'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update auction coins
    console.log('💰 Updating auction coins for user:', user._id);
    const oldCoins = user.auctionCoins || 0;
    console.log('💰 Old coins:', oldCoins);
    console.log('💰 New coins:', auctionCoins);

    const newCoins = Number(auctionCoins);
    user.auctionCoins = newCoins;
    await user.save();

    console.log('💰 Coins updated successfully');

    // Save coin allocation to current Active/Upcoming auction
    try {
      const currentAuction = await Auction.findOne({ status: { $in: ['Active', 'Upcoming'] } }).sort({ createdAt: -1 });
      if (currentAuction) {
        const existingIdx = currentAuction.coinAllocations.findIndex(a => a.userId.toString() === user._id.toString());
        if (existingIdx >= 0) {
          currentAuction.coinAllocations[existingIdx].allocatedCoins = newCoins;
        } else {
          currentAuction.coinAllocations.push({ userId: user._id, allocatedCoins: newCoins });
        }
        await currentAuction.save();
        console.log(`💾 Saved coin allocation (${newCoins}) for user ${user.email} in auction ${currentAuction.title}`);
      }
    } catch (allocErr) {
      console.error('❌ Failed to save coin allocation to auction:', allocErr);
    }

    // Create CoinAllocation record if coins were increased
    if (newCoins > oldCoins) {
      const allocationAmount = newCoins - oldCoins;
      try {
        await CoinAllocation.create({
          userId: user._id,
          amount: allocationAmount,
          notes: `Bidding limit increased by admin from ${oldCoins} to ${newCoins}`,
          allocationDate: new Date()
        });
        console.log('💰 CoinAllocation record created for:', allocationAmount);
      } catch (allocationError) {
        console.error('❌ Failed to create CoinAllocation record:', allocationError);
        // Don't fail the update if allocation record fails
      }
    }

    // Send email notification if limit was upgraded
    if (newCoins > oldCoins && user.isAuctionVerified) {
      try {
        await sendAuctionLimitUpgradeEmail(
          user.email,
          user.name,
          oldCoins,
          newCoins
        );
        console.log('📧 Auction limit upgrade email sent to:', user.email);
      } catch (emailError) {
        console.error('❌ Failed to send limit upgrade email:', emailError);
        // Don't fail the update if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Auction coins updated successfully',
      data: {
        userId: user._id,
        auctionCoins: user.auctionCoins
      }
    });
  } catch (error) {
    console.error('Update auction coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating auction coins',
      error: error.message
    });
  }
};

// @desc    Admin: search customers (lightweight, for dropdowns)
// @route   GET /api/users/customers
// @access  Private/Admin
export const searchCustomersList = async (req, res) => {
  try {
    const { search = '', limit = 50 } = req.query;
    const query = { legacyRole: 'user' };
    if (search.trim()) {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    const users = await User.find(query)
      .select('name email phone')
      .sort({ name: 1 })
      .limit(Number(limit))
      .lean();
    return res.json({ success: true, customers: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: quick-create a customer account
// @route   POST /api/users/admin-create
// @access  Private/Admin
export const adminCreateCustomer = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.json({ success: true, existing: true, data: { _id: exists._id, name: exists.name, email: exists.email } });
    }

    // Random 10-char temp password
    const tempPassword = Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase();
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password: tempPassword,
      legacyRole: 'user',
      isEmailVerified: true,
      status: 'active',
    });

    return res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    if (error.code === 11000) {
      const exists = await User.findOne({ email: req.body.email?.toLowerCase() }).select('_id name email');
      return res.json({ success: true, existing: true, data: exists });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active/live users (seen in last 15 min + today's count)
// @route   GET /api/users/active
// @access  Private/Admin
export const getActiveUsers = async (req, res) => {
  try {
    const now = new Date();
    const fifteenMinAgo = new Date(now - 15 * 60 * 1000);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Users active in last 15 minutes
    const liveUsers = await User.find({
      lastSeenAt: { $gte: fifteenMinAgo },
      legacyRole: 'user'
    })
      .select('name email phone lastSeenAt')
      .sort({ lastSeenAt: -1 })
      .limit(50);

    // Count of users active today
    const todayCount = await User.countDocuments({
      lastSeenAt: { $gte: startOfDay },
      legacyRole: 'user'
    });

    res.status(200).json({
      success: true,
      data: {
        liveUsers,
        liveCount: liveUsers.length,
        todayCount
      }
    });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
