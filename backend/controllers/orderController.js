import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
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

    // Initialize statusHistory if it doesn't exist
    if (!order.statusHistory || order.statusHistory.length === 0) {
      order.statusHistory = [{
        status: 'Order Placed',
        timestamp: order.createdAt,
        note: 'Order has been placed'
      }];
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

// ============================================
// E-COMMERCE REPORTS APIs
// ============================================

// @desc    Get Sales Report (Summary Level - Daily Aggregation)
// @route   GET /api/orders/reports/sales
// @access  Private/Admin
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Aggregation pipeline for daily sales summary
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $addFields: {
          dateOnly: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          // Calculate discount (itemsPrice - actual paid for items)
          discountAmount: {
            $cond: {
              if: { $gt: ["$itemsPrice", 0] },
              then: {
                $subtract: [
                  "$itemsPrice",
                  { $subtract: ["$totalPrice", { $add: ["$taxPrice", "$shippingPrice"] }] }
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: "$dateOnly",
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $in: ["$orderStatus", ["Delivered"]] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Cancelled"] }, 1, 0] }
          },
          grossSales: { $sum: "$itemsPrice" }, // Before discount & tax
          totalDiscount: { $sum: "$discountAmount" },
          totalTax: { $sum: "$taxPrice" },
          totalShipping: { $sum: "$shippingPrice" },
          netSales: {
            $sum: {
              $cond: [
                { $ne: ["$orderStatus", "Cancelled"] },
                "$totalPrice",
                0
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalOrders: 1,
          completedOrders: 1,
          cancelledOrders: 1,
          grossSales: { $round: ["$grossSales", 2] },
          totalDiscount: { $round: ["$totalDiscount", 2] },
          totalTax: { $round: ["$totalTax", 2] },
          totalShipping: { $round: ["$totalShipping", 2] },
          netSales: { $round: ["$netSales", 2] }
        }
      }
    ]);

    // Calculate grand totals
    const grandTotal = salesData.reduce((acc, day) => ({
      totalOrders: acc.totalOrders + day.totalOrders,
      completedOrders: acc.completedOrders + day.completedOrders,
      cancelledOrders: acc.cancelledOrders + day.cancelledOrders,
      grossSales: acc.grossSales + day.grossSales,
      totalDiscount: acc.totalDiscount + day.totalDiscount,
      totalTax: acc.totalTax + day.totalTax,
      totalShipping: acc.totalShipping + day.totalShipping,
      netSales: acc.netSales + day.netSales
    }), {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      grossSales: 0,
      totalDiscount: 0,
      totalTax: 0,
      totalShipping: 0,
      netSales: 0
    });

    res.status(200).json({
      success: true,
      data: {
        dailyData: salesData,
        summary: grandTotal
      }
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Order Report (Detailed Level - All Orders)
// @route   GET /api/orders/reports/orders
// @access  Private/Admin
export const getOrderReport = async (req, res) => {
  try {
    const { startDate, endDate, status, search, page = 1, limit = 50 } = req.query;

    // Build filter
    const filter = {};

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    // Status filter
    if (status) {
      filter.orderStatus = status;
    }

    // Search by order ID or customer
    let userIds = [];
    if (search) {
      // Search in users for name/email/phone
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      userIds = users.map(u => u._id);
    }

    if (search && userIds.length > 0) {
      filter.$or = [
        { user: { $in: userIds } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch orders
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);

    // Format data
    const formattedOrders = orders.map(order => ({
      orderId: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
      orderDate: order.createdAt,
      customerName: order.user?.name || 'N/A',
      customerEmail: order.user?.email || 'N/A',
      customerPhone: order.user?.phone || 'N/A',
      orderAmount: order.totalPrice,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.isPaid ? 'Paid' : 'Unpaid',
      orderStatus: order.orderStatus,
      itemsCount: order.orderItems?.length || 0
    }));

    res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Order report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Product Report (Performance Based)
// @route   GET /api/orders/reports/products
// @access  Private/Admin
export const getProductReport = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    // Build filter for orders (only completed orders for revenue)
    const orderFilter = {
      orderStatus: { $in: ['Delivered'] } // Only completed orders
    };

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      orderFilter.createdAt = { $gte: start, $lte: end };
    }

    // Aggregate product sales from orders
    const productSales = await Order.aggregate([
      { $match: orderFilter },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          unitsSold: { $sum: "$orderItems.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] }
          }
        }
      }
    ]);

    // Create a map for quick lookup
    const salesMap = new Map();
    productSales.forEach(item => {
      salesMap.set(item._id.toString(), {
        unitsSold: item.unitsSold,
        totalRevenue: item.totalRevenue
      });
    });

    // Build product filter
    const productFilter = {};
    if (category) {
      productFilter.category = category;
    }

    // Fetch all products
    const products = await Product.find(productFilter)
      .select('_id name category price inStock')
      .lean();

    // Combine product data with sales data
    const productReport = products.map(product => {
      const sales = salesMap.get(product._id.toString()) || {
        unitsSold: 0,
        totalRevenue: 0
      };

      // Determine stock status
      let stockStatus = 'Out of Stock';
      if (product.inStock > 10) {
        stockStatus = 'In Stock';
      } else if (product.inStock > 0) {
        stockStatus = 'Low Stock';
      }

      return {
        productId: product._id,
        productName: product.name,
        category: product.category,
        sellingPrice: product.price,
        unitsSold: sales.unitsSold,
        totalRevenue: Math.round(sales.totalRevenue * 100) / 100,
        currentStock: product.inStock,
        stockStatus
      };
    });

    // Sort by revenue (highest first)
    productReport.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.status(200).json({
      success: true,
      data: productReport
    });
  } catch (error) {
    console.error('Product report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Customer Report (Behaviour Based)
// @route   GET /api/orders/reports/customers
// @access  Private/Admin
export const getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter (only completed orders count)
    const orderFilter = {
      orderStatus: { $in: ['Delivered'] }
    };

    // Date range filter (optional)
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      orderFilter.createdAt = { $gte: start, $lte: end };
    }

    // Aggregate customer data
    const customerData = await Order.aggregate([
      { $match: orderFilter },
      {
        $group: {
          _id: "$user",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalPrice" },
          lastOrderDate: { $max: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          customerId: "$_id",
          customerName: "$userDetails.name",
          email: "$userDetails.email",
          phone: "$userDetails.phone",
          totalOrders: 1,
          totalSpent: { $round: ["$totalSpent", 2] },
          lastOrderDate: 1,
          customerType: {
            $cond: {
              if: { $gt: ["$totalOrders", 1] },
              then: "Returning",
              else: "New"
            }
          }
        }
      },
      {
        $sort: { totalSpent: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: customerData
    });
  } catch (error) {
    console.error('Customer report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
