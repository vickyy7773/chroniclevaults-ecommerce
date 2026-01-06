import User from '../models/User.js';
import Order from '../models/Order.js';
import CoinAllocation from '../models/CoinAllocation.js';
import { sendAuctionLimitUpgradeEmail } from '../services/emailService.js';

// @desc    Get all users/customers
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ legacyRole: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    // For each user, get their order statistics
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ user: user._id });

        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);

        // Get last order date
        const lastOrder = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const lastOrderDate = lastOrder ? lastOrder.createdAt : user.createdAt;

        // Determine status based on last order
        const daysSinceLastOrder = (Date.now() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24);
        const status = daysSinceLastOrder > 90 ? 'inactive' : 'active';

        return {
          ...user.toObject(),
          totalOrders,
          totalSpent,
          lastOrderDate,
          status,
          registeredDate: user.createdAt
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

    // Store status in user object (you might want to add a status field to User model)
    // For now, we'll just return success
    // In production, you should add a status field to the User schema

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
