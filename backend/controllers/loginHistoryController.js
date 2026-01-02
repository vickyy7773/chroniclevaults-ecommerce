import LoginHistory from '../models/LoginHistory.js';
import pkg from 'ua-parser-js';
const UAParser = pkg;

// @desc    Save login history
// @route   Internal function (called from auth controller)
// @access  Internal
export const saveLoginHistory = async (userId, req, success = true) => {
  try {
    // Get IP address (handle proxy/nginx forwarding)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                      req.headers['x-real-ip'] ||
                      req.connection?.remoteAddress ||
                      req.socket?.remoteAddress ||
                      req.ip ||
                      'Unknown';

    // Get and parse user agent
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Create login history entry
    await LoginHistory.create({
      userId,
      ipAddress,
      userAgent,
      device: result.device.type || result.device.vendor || result.device.model || 'Desktop',
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown',
      success
    });

    console.log(`✅ Login history saved for user ${userId}`);
  } catch (error) {
    console.error('❌ Error saving login history:', error);
    // Don't throw error - login history failure shouldn't prevent login
  }
};

// @desc    Get user login history
// @route   GET /api/login-history
// @access  Private
export const getLoginHistory = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const history = await LoginHistory.find({ userId: req.user._id })
      .sort({ loginTime: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching login history'
    });
  }
};

// @desc    Get all login history (Admin only)
// @route   GET /api/admin/login-history
// @access  Private/Admin
export const getAllLoginHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = userId ? { userId } : {};

    const total = await LoginHistory.countDocuments(filter);
    const history = await LoginHistory.find(filter)
      .populate('userId', 'name email')
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: history,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all login history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching login history'
    });
  }
};
