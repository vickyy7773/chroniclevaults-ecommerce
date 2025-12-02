import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { logActivity } from '../middleware/activityLogger.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items'
      });
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      statusHistory: [{
        status: 'Order Placed',
        timestamp: new Date(),
        note: 'Order has been placed successfully'
      }]
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { inStock: -item.quantity, sold: item.quantity }
      });
    }

    // Clear cart
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], totalPrice: 0, totalItems: 0 }
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id, isPaid: true }).sort({ createdAt: -1 });

    // Initialize statusHistory for orders that don't have it
    for (const order of orders) {
      if (!order.statusHistory || order.statusHistory.length === 0) {
        order.statusHistory = [{
          status: 'Order Placed',
          timestamp: order.createdAt,
          note: 'Order has been placed'
        }];

        // Add additional statuses based on current orderStatus
        if (order.orderStatus !== 'Pending') {
          const statusMap = {
            'Processing': null, // No timeline entry for Processing
            'Shipped': 'Shipped',
            'Delivered': 'Delivered',
            'Cancelled': 'Cancelled'
          };

          if (statusMap[order.orderStatus]) {
            order.statusHistory.push({
              status: statusMap[order.orderStatus],
              timestamp: order.updatedAt || order.createdAt,
              note: `Order status: ${order.orderStatus}`
            });
          }

          if (order.orderStatus === 'Delivered' && order.deliveredAt) {
            order.statusHistory.push({
              status: 'Out for Delivery',
              timestamp: new Date(order.deliveredAt.getTime() - 60000),
              note: 'Order is out for delivery'
            });
          }
        }

        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isPaid: true })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    // Initialize statusHistory for orders that don't have it
    for (const order of orders) {
      if (!order.statusHistory || order.statusHistory.length === 0) {
        order.statusHistory = [{
          status: 'Order Placed',
          timestamp: order.createdAt,
          note: 'Order has been placed'
        }];

        // Add additional statuses based on current orderStatus
        if (order.orderStatus !== 'Pending') {
          const statusMap = {
            'Processing': null, // No timeline entry for Processing
            'Shipped': 'Shipped',
            'Delivered': 'Delivered',
            'Cancelled': 'Cancelled'
          };

          if (statusMap[order.orderStatus]) {
            order.statusHistory.push({
              status: statusMap[order.orderStatus],
              timestamp: order.updatedAt || order.createdAt,
              note: `Order status: ${order.orderStatus}`
            });
          }

          if (order.orderStatus === 'Delivered' && order.deliveredAt) {
            order.statusHistory.push({
              status: 'Out for Delivery',
              timestamp: new Date(order.deliveredAt.getTime() - 60000),
              note: 'Order is out for delivery'
            });
          }
        }

        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Map order status to timeline entries (removed Order Confirmed for Processing)
    const statusTimelineMap = {
      'Pending': 'Order Placed',
      'Processing': null, // No timeline entry for Processing
      'Shipped': 'Shipped',
      'Delivered': 'Delivered',
      'Cancelled': 'Cancelled'
    };

    const timelineStatus = statusTimelineMap[orderStatus];

    // Add to status history if not already present and if there's a valid timeline status
    if (timelineStatus) {
      const alreadyExists = order.statusHistory.some(
        entry => entry.status === timelineStatus
      );

      if (!alreadyExists) {
        order.statusHistory.push({
          status: timelineStatus,
          timestamp: new Date(),
          note: `Order status changed to ${orderStatus}`
        });
      }
    }

    order.orderStatus = orderStatus;

    if (orderStatus === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      // Add "Out for Delivery" before Delivered if not exists
      const outForDeliveryExists = order.statusHistory.some(
        entry => entry.status === 'Out for Delivery'
      );
      if (!outForDeliveryExists) {
        order.statusHistory.push({
          status: 'Out for Delivery',
          timestamp: new Date(Date.now() - 60000), // 1 minute before delivered
          note: 'Order is out for delivery'
        });
      }
    }

    await order.save();

    // Log admin activity
    await logActivity(req, 'update', 'orders', `Updated order #${order._id} status to ${orderStatus}`, order._id, `Order #${order._id}`);

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      updateTime: req.body.update_time,
      emailAddress: req.body.email_address
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order marked as paid',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order tracking info (Admin)
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
export const updateOrderTracking = async (req, res) => {
  try {
    const { trackingNumber, courierCompany } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.trackingNumber = trackingNumber;
    order.courierCompany = courierCompany;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Tracking information updated',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
