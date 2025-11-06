import AdminActivity from '../models/AdminActivity.js';
import User from '../models/User.js';

// @desc    Get all admin activities
// @route   GET /api/admin/activities
// @access  Super Admin
export const getAllActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      adminId,
      activityType,
      module,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter
    const filter = {};

    if (adminId) {
      filter.admin = adminId;
    }

    if (activityType) {
      filter.activityType = activityType;
    }

    if (module) {
      filter.module = module;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { adminName: { $regex: search, $options: 'i' } },
        { adminEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { targetName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = await AdminActivity.find(filter)
      .populate('admin', 'name email avatar')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminActivity.countDocuments(filter);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin activities',
      error: error.message
    });
  }
};

// @desc    Get activities by specific admin
// @route   GET /api/admin/activities/admin/:adminId
// @access  Super Admin
export const getAdminActivities = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = await AdminActivity.find({ admin: adminId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminActivity.countDocuments({ admin: adminId });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin activities',
      error: error.message
    });
  }
};

// @desc    Get admin login/logout sessions
// @route   GET /api/admin/activities/sessions/:adminId
// @access  Super Admin
export const getAdminSessions = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get login/logout activities
    const sessions = await AdminActivity.find({
      admin: adminId,
      activityType: { $in: ['login', 'logout'] }
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminActivity.countDocuments({
      admin: adminId,
      activityType: { $in: ['login', 'logout'] }
    });

    // Process sessions to calculate duration
    const processedSessions = [];
    let currentLogin = null;

    for (let i = sessions.length - 1; i >= 0; i--) {
      const activity = sessions[i];

      if (activity.activityType === 'login') {
        currentLogin = activity;
      } else if (activity.activityType === 'logout' && currentLogin) {
        processedSessions.push({
          loginTime: currentLogin.timestamp,
          logoutTime: activity.timestamp,
          duration: Math.round((activity.timestamp - currentLogin.timestamp) / 1000 / 60), // minutes
          ipAddress: currentLogin.ipAddress,
          userAgent: currentLogin.userAgent
        });
        currentLogin = null;
      }
    }

    // If there's an active session (login without logout)
    if (currentLogin) {
      processedSessions.push({
        loginTime: currentLogin.timestamp,
        logoutTime: null,
        duration: Math.round((new Date() - currentLogin.timestamp) / 1000 / 60), // minutes
        ipAddress: currentLogin.ipAddress,
        userAgent: currentLogin.userAgent,
        isActive: true
      });
    }

    res.json({
      success: true,
      data: {
        sessions: processedSessions.reverse(),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin sessions',
      error: error.message
    });
  }
};

// @desc    Get admin activity statistics
// @route   GET /api/admin/activities/stats
// @access  Super Admin
export const getActivityStats = async (req, res) => {
  try {
    const { startDate, endDate, adminId } = req.query;

    const filter = {};

    if (adminId) {
      filter.admin = adminId;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Get total activities by type
    const activityByType = await AdminActivity.aggregate([
      { $match: filter },
      { $group: { _id: '$activityType', count: { $sum: 1 } } }
    ]);

    // Get activities by module
    const activityByModule = await AdminActivity.aggregate([
      { $match: { ...filter, module: { $exists: true, $ne: null } } },
      { $group: { _id: '$module', count: { $sum: 1 } } }
    ]);

    // Get most active admins
    const mostActiveAdmins = await AdminActivity.aggregate([
      { $match: filter },
      { $group: { _id: '$admin', count: { $sum: 1 }, name: { $first: '$adminName' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get currently active admins (logged in but not logged out)
    const activeAdmins = await AdminActivity.aggregate([
      { $match: { activityType: { $in: ['login', 'logout'] } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$admin',
          lastActivity: { $first: '$activityType' },
          lastActivityTime: { $first: '$timestamp' },
          adminName: { $first: '$adminName' },
          adminEmail: { $first: '$adminEmail' }
        }
      },
      { $match: { lastActivity: 'login' } }
    ]);

    res.json({
      success: true,
      data: {
        activityByType,
        activityByModule,
        mostActiveAdmins,
        activeAdmins,
        totalActivities: await AdminActivity.countDocuments(filter)
      }
    });
  } catch (error) {
    console.error('Error getting activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity statistics',
      error: error.message
    });
  }
};

// @desc    Get activity timeline for dashboard
// @route   GET /api/admin/activities/timeline
// @access  Super Admin
export const getActivityTimeline = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activities = await AdminActivity.find({
      timestamp: { $gte: startDate }
    })
      .populate('admin', 'name email avatar')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error getting activity timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity timeline',
      error: error.message
    });
  }
};

export default {
  getAllActivities,
  getAdminActivities,
  getAdminSessions,
  getActivityStats,
  getActivityTimeline
};
