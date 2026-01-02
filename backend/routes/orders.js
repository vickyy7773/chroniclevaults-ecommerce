import express from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderToPaid,
  updateOrderTracking,
  getSalesReport,
  getOrderReport,
  getProductReport,
  getCustomerReport
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// E-commerce Reports Routes (must be before /:id routes)
router.get('/reports/sales', protect, admin, getSalesReport);
router.get('/reports/orders', protect, admin, getOrderReport);
router.get('/reports/products', protect, admin, getProductReport);
router.get('/reports/customers', protect, admin, getCustomerReport);

// Protected routes - user must be authenticated
router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getAllOrders);

router.get('/myorders', protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/tracking', protect, admin, updateOrderTracking);

export default router;
