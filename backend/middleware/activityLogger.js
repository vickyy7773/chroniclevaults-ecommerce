import AdminActivity from '../models/AdminActivity.js';

// Helper function to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'Unknown';
};

// Log admin activity
export const logActivity = async (req, activityType, module, action, targetId = null, targetName = null, changes = null) => {
  try {
    if (!req.user) return;

    // Only log admin and superadmin activities
    const userRole = req.user.legacyRole;
    if (userRole !== 'admin' && userRole !== 'superadmin') return;

    const activity = new AdminActivity({
      admin: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      activityType,
      module,
      action,
      targetId,
      targetName,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'Unknown',
      changes,
      sessionId: req.sessionID || req.user._id.toString(),
      status: 'success'
    });

    await activity.save();
  } catch (error) {
    console.error('Error logging admin activity:', error);
    // Don't throw error - activity logging should not break the main flow
  }
};

// Middleware to automatically log API actions
export const activityLoggerMiddleware = (module, action) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Only log if user is admin/superadmin
      if (req.user && (req.user.legacyRole === 'admin' || req.user.legacyRole === 'superadmin')) {
        const activityType = req.method === 'GET' ? 'view' :
                           req.method === 'POST' ? 'create' :
                           req.method === 'PUT' || req.method === 'PATCH' ? 'update' :
                           req.method === 'DELETE' ? 'delete' : 'view';

        let targetId = req.params.id || req.params.productId || req.params.orderId || null;
        let targetName = data?.data?.name || data?.data?.title || data?.name || data?.title || null;

        // Log activity asynchronously
        logActivity(req, activityType, module, action, targetId, targetName, null).catch(err => {
          console.error('Activity logging failed:', err);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

// Specific middleware for login tracking
export const logLogin = async (req, user) => {
  try {
    // Only log admin and superadmin logins
    if (user.legacyRole !== 'admin' && user.legacyRole !== 'superadmin') return;

    const activity = new AdminActivity({
      admin: user._id,
      adminName: user.name,
      adminEmail: user.email,
      activityType: 'login',
      action: 'Admin logged in',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'Unknown',
      sessionId: user._id.toString(),
      status: 'success'
    });

    await activity.save();
  } catch (error) {
    console.error('Error logging login activity:', error);
  }
};

// Specific middleware for logout tracking
export const logLogout = async (req) => {
  try {
    if (!req.user) return;

    // Only log admin and superadmin logouts
    if (req.user.legacyRole !== 'admin' && req.user.legacyRole !== 'superadmin') return;

    const activity = new AdminActivity({
      admin: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      activityType: 'logout',
      action: 'Admin logged out',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'Unknown',
      sessionId: req.user._id.toString(),
      status: 'success'
    });

    await activity.save();
  } catch (error) {
    console.error('Error logging logout activity:', error);
  }
};

export default {
  logActivity,
  activityLoggerMiddleware,
  logLogin,
  logLogout
};
