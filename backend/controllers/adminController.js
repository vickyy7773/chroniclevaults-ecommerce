import User from '../models/User.js';
import Role from '../models/Role.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';

// @desc    Create new admin user
// @route   POST /api/admin/create-admin
// @access  Private/SuperAdmin
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, roleId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role if provided
    let role = null;
    if (roleId) {
      role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
    }

    // Create admin user
    const adminUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: roleId || null,
      legacyRole: 'admin',
      isEmailVerified: true // Auto-verify admin emails
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: role ? role.displayName : 'Admin',
        legacyRole: adminUser.legacyRole
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin user',
      error: error.message
    });
  }
};

// @desc    Get all admin users
// @route   GET /api/admin/admins
// @access  Private/SuperAdmin
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      legacyRole: { $in: ['admin', 'superadmin'] }
    })
      .select('-password')
      .populate('role', 'name displayName permissions')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin users',
      error: error.message
    });
  }
};

// @desc    Update admin user
// @route   PUT /api/admin/admins/:id
// @access  Private/SuperAdmin
export const updateAdmin = async (req, res) => {
  try {
    const { name, email, roleId, legacyRole } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent modifying super admin
    if (user.legacyRole === 'superadmin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify super admin account'
      });
    }

    // Validate role if provided
    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      user.role = roleId;
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (legacyRole && ['admin', 'superadmin'].includes(legacyRole)) {
      user.legacyRole = legacyRole;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('role', 'name displayName permissions');

    res.status(200).json({
      success: true,
      message: 'Admin user updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin user',
      error: error.message
    });
  }
};

// @desc    Delete admin user
// @route   DELETE /api/admin/admins/:id
// @access  Private/SuperAdmin
export const deleteAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admin
    if (user.legacyRole === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin account'
      });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin user',
      error: error.message
    });
  }
};

// @desc    Assign role to user
// @route   PUT /api/admin/users/:id/assign-role
// @access  Private/SuperAdmin
export const assignRoleToUser = async (req, res) => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a role ID'
      });
    }

    // Validate role
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Assign role
    user.role = roleId;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('role', 'name displayName permissions');

    res.status(200).json({
      success: true,
      message: 'Role assigned successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning role',
      error: error.message
    });
  }
};

// @desc    Get user permissions
// @route   GET /api/admin/users/:id/permissions
// @access  Private/Admin
export const getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const permissions = {
      isSuperAdmin: user.legacyRole === 'superadmin',
      isAdmin: user.legacyRole === 'admin' || user.legacyRole === 'superadmin',
      role: user.role ? {
        name: user.role.name,
        displayName: user.role.displayName,
        permissions: user.role.permissions
      } : null
    };

    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user permissions',
      error: error.message
    });
  }
};
