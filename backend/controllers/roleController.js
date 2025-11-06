import Role from '../models/Role.js';
import User from '../models/User.js';

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/SuperAdmin
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('createdBy', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error.message
    });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private/SuperAdmin
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('createdBy', 'name email');

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role',
      error: error.message
    });
  }
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Private/SuperAdmin
export const createRole = async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Create role
    const role = await Role.create({
      name: name.toLowerCase(),
      displayName,
      description,
      permissions,
      createdBy: req.user._id,
      isSystemRole: false
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating role',
      error: error.message
    });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/SuperAdmin
export const updateRole = async (req, res) => {
  try {
    const { displayName, description, permissions } = req.body;

    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent modification of system roles' core permissions
    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system roles'
      });
    }

    // Update role
    role.displayName = displayName || role.displayName;
    role.description = description || role.description;
    role.permissions = permissions || role.permissions;

    await role.save();

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating role',
      error: error.message
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/SuperAdmin
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent deletion of system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system roles'
      });
    }

    // Check if any users have this role
    const usersWithRole = await User.countDocuments({ role: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned this role`
      });
    }

    await role.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting role',
      error: error.message
    });
  }
};

// @desc    Get role permissions
// @route   GET /api/roles/:id/permissions
// @access  Private/SuperAdmin
export const getRolePermissions = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        roleName: role.name,
        displayName: role.displayName,
        permissions: role.permissions
      }
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions',
      error: error.message
    });
  }
};
