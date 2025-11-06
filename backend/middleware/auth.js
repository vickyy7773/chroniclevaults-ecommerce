import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';

// Protect routes - Authentication middleware
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token and populate role
    req.user = await User.findById(decoded.id).select('-password').populate('role');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Admin middleware (legacy support)
export const admin = (req, res, next) => {
  if (req.user && (req.user.legacyRole === 'admin' || req.user.legacyRole === 'superadmin')) {
    next();
  } else if (req.user && req.user.role && req.user.role.permissions && req.user.role.permissions.dashboard && req.user.role.permissions.dashboard.access) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
};

// Super Admin middleware
export const superAdmin = (req, res, next) => {
  if (req.user && req.user.legacyRole === 'superadmin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized. Super Admin access required'
    });
  }
};

// Permission-based middleware factory
export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    // SuperAdmin has all permissions
    if (req.user && req.user.legacyRole === 'superadmin') {
      return next();
    }

    // Check role-based permissions
    if (req.user && req.user.role && req.user.role.permissions) {
      const resourcePermissions = req.user.role.permissions[resource];

      if (resourcePermissions && resourcePermissions[action] === true) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: `Not authorized to ${action} ${resource}`
    });
  };
};
