import express from 'express';
import AdminNotification from '../models/AdminNotification.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Request coin limit increase
router.post('/request-coin-limit', authMiddleware, async (req, res) => {
  try {
    const { auctionId, auctionTitle, remainingCoins } = req.body;
    const userId = req.user._id;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create notification
    const notification = await AdminNotification.create({
      type: 'coin_limit_request',
      user: userId,
      userName: user.name,
      userEmail: user.email,
      message: `${user.name} (${user.email}) ke coins khatam ho gaye hain. Remaining: ${remainingCoins} coins. User ne nayi limit ki request ki hai.`,
      remainingCoins: remainingCoins,
      auction: auctionId || null,
      auctionTitle: auctionTitle || 'Unknown Auction',
      isRead: false
    });

    res.status(201).json({
      success: true,
      message: 'Coin limit request sent to admin successfully',
      notification
    });
  } catch (error) {
    console.error('Coin limit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send coin limit request',
      error: error.message
    });
  }
});

// Get all notifications (Admin only)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const { isRead, limit = 50 } = req.query;

    const query = {};
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const notifications = await AdminNotification.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await AdminNotification.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await AdminNotification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all as read
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await AdminNotification.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message
    });
  }
});

export default router;
